---
date: 2026-09-19T02:29:09+03:00
issue_number: 234
repository: singlepagestartup
topic: "Bound anonymous Subject growth with safe retention and session initialization"
status: in_review
---

# Bound Anonymous Subject Growth Implementation Plan

## Overview

Make `GET /rbac/subjects/authentication/init` reuse the Subject behind a token the caller already holds, record last activity on the Subject row at a throttled rate, and leave one bounded, guarded retention implementation that a daily agent triggers.

## Current State Analysis

- `authentication/init.ts:37-44` calls `api.create({ data: {} })` on every execution. Any caller that reaches the route - a prefetch, a retry, a second tab, a bot replaying a page - inserts a Subject row, even when it presents a valid session token (SEC-18; research section 2).
- Neither `init` nor `service/singlepage/refresh.ts` writes to the Subject row (research section 11). `updatedAt` therefore records the last explicit write, not the last visit, so no retention rule can separate a returning visitor from an abandoned session.
- Two cleanup implementations exist. The agent handler `rbac-module/subject/delete-anonymous.ts:32-105` selects by `createdAt` against the refresh-token lifetime, loads `subjects-to-identities` and `subjects-to-social-module-profiles` in full, filters in memory, deletes one Subject at a time over HTTP and swallows every per-row error. The RBAC service `delete-anonymous-subjects.ts:29-71` uses a hard-coded 30 days, guards identities only, and has no caller (research sections 5 and 6).
- The cleanup agent row is not in the repository snapshot: `data/*.json` holds three agents, all `* * * * *` (research section 7). A fresh project never runs the cleanup at all.
- `subjects-to-billing-module-currencies` already has a DI symbol and a binding (`di.ts:139`, `bootstrap.ts:629`); `subjects-to-billing-module-payment-intents` has neither, and no framework service writes that relation - only the generic CRUD route mounted at `rbac/backend/app/api/src/lib/apps.ts:103`.

## Desired End State

A request to `init` that carries a token whose Subject still exists receives new tokens for that same Subject and inserts nothing; a request without a usable token still creates a Subject and a JWT on the first visit, as the operator requires. `init` with reuse and `refresh` bump `updatedAt` at most once per activity interval. `deleteAnonymousSubjects` is the only retention implementation, selects at most one batch per run through the query builder, skips every Subject with a retention blocker, deletes through the repository cascade and returns counts; the agent handler is one SDK call to it, and the agent row with a daily cron ships in the repository snapshot.

Verification: the two automated suites named per phase, plus the manual recipe in **Manual Testing Steps**.

### Key Discoveries:

- `authorization(c)` already resolves a token from the `rbac.subject.jwt` cookie or the `Authorization` header (`libs/shared/backend/utils/src/lib/authorization/index.ts:4-11`), so reuse needs no new request contract. Access and refresh tokens are signed with the same secret and both carry `subject.id`, so one verification path covers both (`init.ts:46-65`, `refresh.ts:57-79`).
- `@sps/backend-utils` has no sanitised JWT verification helper; `is-authorized.ts:127` calls `jwt.verify` directly and lets it throw. The init decision must catch the hono error itself and treat it as "no usable token".
- The repository `update` path sets `updatedAt` itself and the CRUD update action deletes a client-supplied `updatedAt` (`repository/database/index.ts:291-292`, `service/crud/actions/update/index.ts:15`), so an activity touch is `update({ id, data: {} })` and needs no schema change.
- The bounded-batch pattern to copy is `ecommerce/order/proceed.ts:171-236`: a `limit` plus `orderBy updatedAt asc` candidate query, then relation lookups filtered by `inArray` over the selected ids only.
- `rbac-module/subject/check.ts:32-39` is the template for an agent handler that delegates in one server SDK call to an RBAC subject route; the secret key bypasses the is-authorized middleware (`libs/middlewares/src/lib/is-authorized/index.ts:59-61`), so the new route needs no permission row.
- The subject `Service` already injects the identity, social-profile, role and order relation services (`service/singlepage/index.ts:144-147`); billing currencies is bound but not injected there yet.

## What We're NOT Doing

- No lazy Subject creation and no public browsing without a Subject or JWT: the operator confirmed first-visit creation stays.
- No rate limiter and no `POST` method for `init` (the rest of Phase 1b item 7 of the remediation plan, SEC-18).
- No schema change, no new column, no index: retention reads `updatedAt`, which already exists.
- No change to the per-request mutation semantics of Subject creation: `init` keeps creating through the server SDK, so revalidation and websocket behaviour for a new Subject is unchanged.
- No dry-run switch and no deletion of `rbac.action` rows: action retention (issue item 6) and the delete-on-create storm (SEC-29) stay with #213 and Phase 9 item 1.
- No edit to any `startup` file, and no change to the client component or the client SDK.
- The server SDK `init` action drops caller headers (`sdk/server/.../authentication/init.ts:30-40` spreads `options` before a literal `headers`), so a browser reuses its session through the cookie rather than the `Authorization` header. This is recorded, not fixed here: the client component only calls `init` when it has no valid JWT, so no framework caller depends on it.

## Implementation Approach

Three seams carry the change. The decision "reuse or create" is one service next to `refresh.ts` so the controller keeps only token verification, the cookie and the response. The activity touch is a second service used by both `init` and `refresh`, throttled against the row's own `updatedAt` so it needs no extra state. Retention stays in `deleteAnonymousSubjects`, which takes its blockers as a list, so a child project extends the guard set from its `startup` service subclass instead of editing a `singlepage` file; the agent handler becomes one call to it.

## Phase 1: Retention and activity settings

### Overview

Add the three settings the later phases read, with defaults that are safe for a project that sets nothing.

### Changes Required:

#### 1. Shared environment constants

**File**: `libs/shared/utils/src/lib/envs/rbac.ts`
**Why**: Every RBAC lifetime default lives here and is the documented project seam (`rbac.ts:10-19`); retention must be decoupled from the token lifetimes the issue warns about.
**Changes**: Append `RBAC_ANONYMOUS_SUBJECT_ACTIVITY_INTERVAL_IN_SECONDS` (default 3600), `RBAC_ANONYMOUS_SUBJECT_RETENTION_IN_SECONDS` (default 2592000, 30 days) and `RBAC_ANONYMOUS_SUBJECT_CLEANUP_BATCH_SIZE` (default 500) after the existing lifetime block, in the file's existing style, without reordering the exports already there.

### Success Criteria:

#### Automated Verification:

- [ ] `npx nx run @sps/shared-utils:eslint:lint`

#### Manual Verification:

- [ ] Unset variables keep the documented defaults.

---

## Phase 2: Session initialization reuses an existing Subject

### Overview

A request that presents a usable token gets tokens for the same Subject; a request without one still creates.

### Changes Required:

#### 1. Activity recording service

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/record-activity.ts` (new)
**Why**: Retention needs a last-activity timestamp, and both `init` reuse and `refresh` are the activity signals available without new write paths.
**Changes**: A service that takes an update function, compares the Subject's `updatedAt` against the activity interval and writes an empty update through the repository path only when the interval has passed; it reports whether it wrote and never throws into the caller's response path.

#### 2. Initialization decision service

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/init.ts` (new)
**Why**: The reuse decision is business logic and belongs next to `refresh.ts`, not in the controller (`init.ts:37-65` currently holds both the decision and the signing).
**Changes**: Take the presented token, verify it with the RBAC secret inside a guarded block, read the Subject id from the claim, confirm the Subject still exists, record activity and sign both tokens for it; on a missing, malformed, expired or orphaned token, create a Subject through the server SDK exactly as today and sign for that. Return the tokens, the Subject and whether it was reused. Never log or echo the token.

#### 3. Service wiring

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts`
**Why**: The per-feature services are constructed here with the dependencies they need (`index.ts:303-316`).
**Changes**: Add `init` and `recordActivity` methods that construct the two new services with the in-process `findById` and `update`, and pass `recordActivity` into the refresh service.

#### 4. Refresh records activity

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/refresh.ts`
**Why**: A visitor who keeps a tab open refreshes without ever writing to the row (research section 11), so retention would treat them as abandoned.
**Changes**: Accept the activity recorder through the constructor props and call it for the Subject it already read, before signing.

#### 5. Thin controller

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/init.ts`
**Why**: The controller should compose the request, the service call and the response only.
**Changes**: Resolve the token with the shared `authorization` helper, call the new service method and keep the existing token verification, cookie and `201` response. Keep the response shape and status unchanged so no client contract moves.

### Success Criteria:

#### Automated Verification:

- [ ] `npx nx run @sps/rbac:jest:test`
- [ ] `npx nx run-many --target=eslint:lint --projects=@sps/rbac,@sps/shared-utils`

#### Manual Verification:

- [ ] Two token-less calls return two Subject ids; a third call with either token returns the first id and the Subject count does not move (recipe below).

---

## Phase 3: One retention implementation

### Overview

`deleteAnonymousSubjects` becomes the only cleanup, bounded and guarded, and the agent handler delegates to it.

### Changes Required:

#### 1. Retention service

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/delete-anonymous-subjects.ts`
**Why**: The issue requires one canonical eligibility and cleanup service; this one already exists and has no caller to migrate.
**Changes**: Select one batch of candidates through the query builder - `updatedAt` older than the retention, `variant` equal to `default`, ordered oldest first, limited to the batch size - then query each blocker relation with `inArray` over the selected ids only. Delete the remainder through the injected in-process delete, which keeps the database cascade, logging each failure with the Subject id and continuing. Return scanned, deleted, failed and retained-by-reason counts. Take the blockers as a list so a `startup` subclass can extend them.

Blocker set, and why: `subjects-to-identities` (any registered identity, not only email), `subjects-to-ecommerce-module-orders` (guest orders of every status, as the issue requires), `subjects-to-social-module-profiles` (the guard the agent handler has today; removing it would be a regression), `subjects-to-roles` (privileged and seeded actors), `subjects-to-billing-module-currencies` (a balance is durable ownership; the symbol is already bound at `bootstrap.ts:629`). `subjects-to-billing-module-payment-intents` is deliberately left out: no framework service writes that relation, its only path is the generic CRUD route, and the framework path that produces a payment intent (`ecommerce/order/proceed.ts`) always creates the order link too, which the order blocker already catches. A project that writes that relation directly adds it through the blocker list in its `startup` service. The `variant` filter keeps hidden, agent and other non-default actors out of the candidate set entirely.

#### 2. Relation service injection

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts`
**Why**: The retention service needs the billing-currency relation reader; the other four are already injected (`index.ts:144-147`).
**Changes**: Inject `subjects-to-billing-module-currencies` through the existing DI symbol and pass the five blockers plus the in-process `find` and `delete` when constructing the retention service.

#### 3. Route, handler and SDK action

**Files**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/delete-anonymous.ts` (new), `.../controller/singlepage/index.ts`, `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/delete-anonymous.ts` (new), `.../sdk/server/src/lib/singlepage/index.ts`, `libs/modules/rbac/models/subject/sdk/model/src/lib/paths.yaml`
**Why**: The agent module mutates RBAC data through the server SDK over HTTP (research, Architecture Documentation); `check` is the same shape end to end and is the template to follow.
**Changes**: A thin `POST /rbac/subjects/delete-anonymous` handler that requires the secret key and returns the service counts, its route entry, the matching server SDK action registered in the api object, and the OpenAPI path entry next to `/rbac/subjects/check`.

#### 4. Agent handler delegates

**File**: `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/rbac-module/subject/delete-anonymous.ts`
**Why**: The duplicated in-memory filter, the unbounded relation loads and the per-row HTTP deletes are the behaviour the issue asks to remove.
**Changes**: Keep the logging and the secret-key check, replace the body with one SDK call, return the counts in the response so the cron marker records them, and drop the now unused anonymous-lifetime requirement.

### Success Criteria:

#### Automated Verification:

- [ ] `npx nx run @sps/rbac:jest:test`
- [ ] `npx nx run @sps/agent:jest:test`
- [ ] `npx nx run-many --target=eslint:lint --projects=@sps/rbac,@sps/agent,@sps/shared-utils`

#### Manual Verification:

- [ ] A stale anonymous Subject is deleted; Subjects with an identity or an order survive (recipe below).

---

## Phase 4: Daily schedule in the repository snapshot

### Overview

Ship the cleanup agent row so a fresh project runs the cleanup without manual database work.

### Changes Required:

#### 1. Agent seed row

**File**: `libs/modules/agent/models/agent/backend/repository/database/src/lib/data/<uuid>.json` (new, tool-produced)
**Why**: Only three agents are seeded and the cleanup slug is not among them, so the route exists but nothing calls it (research section 7).
**Changes**: Create the row through the API with the same field shape as the three existing rows and the interval `0 0 * * *`, then produce the snapshot with the repository dump target and restore every file the dump touched that is unrelated to this row. The JSON is never hand-written.

### Success Criteria:

#### Automated Verification:

- [ ] `git status` and `git diff --stat` show exactly one added file under the agent data directory and no other snapshot change.

#### Manual Verification:

- [ ] `npx nx run api:db:seed` on a fresh database creates the agent; the cron dispatcher picks it up at the next due time.

---

## Phase 5: Tests and documentation

### Overview

Cover the three decisions that carry the behaviour and document the new settings.

### Changes Required:

#### 1. Specs

**Files**: `.../service/singlepage/init.spec.ts`, `.../service/singlepage/record-activity.spec.ts`, `.../service/singlepage/delete-anonymous-subjects.spec.ts`, `libs/modules/agent/.../rbac-module/subject/delete-anonymous.spec.ts` (all new)
**Why**: The repository has no coverage for init, refresh or either cleanup (research section 13).
**Changes**: Repository BDD format, behaviour-first names. Init: a valid token reuses and does not create; no token creates; an invalid token creates and nothing logs the token. Activity: a write inside the interval is skipped, a write after it happens. Retention: the candidate query carries the retention cutoff, the batch limit and the variant filter; blocked Subjects are kept per reason; relation queries are scoped to the selected ids. Agent handler: one SDK call with the secret header, no direct find or delete.

#### 2. Documentation

**Files**: `libs/modules/rbac/models/subject/README.md`, `libs/modules/agent/models/agent/README.md`
**Why**: The acceptance criteria require the retention and session settings to be documented where a project looks for them.
**Changes**: A section on the subject README for the three settings, the reuse rule and the blocker list with the `startup` extension point; an entry on the agent README for the cleanup agent slug and its schedule.

### Success Criteria:

#### Automated Verification:

- [ ] `npx nx run @sps/rbac:jest:test`
- [ ] `npx nx run @sps/agent:jest:test`
- [ ] `npx nx run-many --target=eslint:lint --projects=@sps/rbac,@sps/agent,@sps/shared-utils`

#### Manual Verification:

- [ ] The README settings match the defaults in `envs/rbac.ts`.

---

## Testing Strategy

### Unit Tests:

- The reuse decision for each token state: valid, absent, malformed, expired, and valid for a Subject that no longer exists.
- The activity throttle at both sides of the interval boundary.
- The retention selection: cutoff, batch bound, variant filter, `inArray` scoping, each blocker reason, and a per-row delete failure that does not stop the batch.
- The agent handler delegation and its secret header.

### Integration Tests:

None. The existing `*.integration.spec.ts` suites need a database and are excluded from the jest targets this plan runs.

### Manual Testing Steps:

Against an API of this worktree on `http://localhost:4012` (`SECRET` is `RBAC_SECRET_KEY` from `apps/api/.env`).

1. Call `GET /api/rbac/subjects/authentication/init` twice with no token and decode `data.jwt` from each response: two different `subject.id` values.
2. Call it again with `Authorization: Bearer <first jwt>`: the same `subject.id` as the first call, and `GET /api/rbac/subjects/count` with `X-RBAC-SECRET-KEY: $SECRET` unchanged across that third call.
3. Start the instance with `RBAC_ANONYMOUS_SUBJECT_RETENTION_IN_SECONDS=5`, create three Subjects through `init`, give the second one an identity and the third one an order link through the API, wait past the retention, then `POST /api/agent/agents/rbac-module-subjects-delete-anonymous` with the secret header: the response counts one deleted and two retained, and only the first Subject is gone.

## Performance Considerations

Reuse turns a row insert into one verification plus one read for every repeat caller that holds a token. The activity touch writes at most once per Subject per interval, in process, so it bypasses the per-mutation revalidation and cache-version work that an HTTP update would trigger. Retention reads one bounded batch and at most five relation queries scoped by `inArray` over that batch, instead of the three unbounded table reads it does today, and deletes in process rather than through one HTTP request per row - which also keeps the cleanup out of the cache amplification described in #233. A backlog larger than one batch drains over consecutive daily runs; a project that needs faster draining raises the batch size.

## Migration Notes

A project inherits the behaviour by syncing and running `npx nx run api:db:seed` to receive the cleanup agent row. No migration runs, because no schema changes. A project that already created the agent row by hand keeps it; the seed matches on the natural key. A project that wants the old creation-age behaviour cannot get it back, which is intended: retention now reads last activity, and every Subject touched by `init` reuse or `refresh` since the deployment carries a fresh `updatedAt`, so the first run after adoption deletes only Subjects that were already idle for the full retention period.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-234.md`
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-234.md`
- Audit context: `thoughts/shared/research/singlepagestartup/2026-09-19-dead-code-and-security-audit.md` (SEC-18, SEC-29)
- Remediation plan: `thoughts/shared/plans/singlepagestartup/2026-09-19-dead-code-and-security-remediation.md` (Layering contract, Phase 1b item 7, Phase 9 item 1)
