---
date: 2026-07-20T19:25:24+03:00
issue_number: 211
repository: singlepagestartup
topic: "Telegram bootstrap race creates duplicate RBAC grants and breaks message processing"
status: implemented
---

# Telegram Bootstrap Concurrency and RBAC Integrity Implementation Plan

## Overview

Make Telegram bootstrap safe under concurrent updates by repairing existing RBAC duplicates, enforcing the three shared natural keys in PostgreSQL, serializing each user's multi-repository bootstrap across API processes, and making free-subscription provisioning idempotent across processes. Database invariants remain the source of correctness; keyed serialization prevents expected losing inserts from surfacing as internal API errors while preserving concurrency between different users.

## Current State Analysis

Telegram handles `forum_topic_created` and the adjacent user message as independent background tasks, so both can call the same bootstrap endpoint concurrently. Knowledge access provisioning uses find-then-create and can recover only when a losing insert is rejected; permission, role-permission, and subject-role tables currently allow both inserts to succeed. The restored local database has no duplicates, but it also has none of the required natural-key indexes, so the production failure remains reproducible at the service/schema boundary.

Bootstrap already returns `shouldCheckoutFreeSubscription`, but the Telegram adapter ignores it and requests checkout after every message. The checkout service detects existing orders before checkout, but two simultaneous requests can both pass those reads. The existing Agent conversation lock is process-local and is unrelated to bootstrap, so extending it would not protect API replicas or the shared database.

## Desired End State

- Existing duplicate RBAC grants are merged deterministically in one checked transaction before constraints are applied.
- PostgreSQL rejects duplicate permission, role-permission, and subject-role natural keys.
- Concurrent Knowledge grant provisioning converges through the existing create/re-read contract and returns one logical grant.
- Normal Telegram messages never request free checkout; registration and `/start` requests provision at most once per subject even across API processes.
- Concurrent topic creation and `/start` complete without a transport fallback.
- User-visible failures contain a safe correlation identifier that maps to structured logs without exposing internal paths, payloads, credentials, or tokens.

### Key Discoveries

- Telegram launches topic-service and ordinary messages independently (`apps/telegram/src/lib/telegram-bot.ts:545-665`).
- The adapter receives but ignores the checkout decision (`apps/telegram/src/lib/telegram-bot.ts:730-805`; `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/telegram/bootstrap.ts:30-45`).
- `ensureEntity()` re-reads only after a rejected create, while `findSingle()` fails on persisted duplicates (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/access.ts:69-120`).
- The three schemas have primary keys but no uniqueness for the keys used by the service (`libs/modules/rbac/models/permission/backend/repository/database/src/lib/schema.ts:1-11`; `libs/modules/rbac/relations/roles-to-permissions/backend/repository/database/src/lib/schema.ts:1-26`; `libs/modules/rbac/relations/subjects-to-roles/backend/repository/database/src/lib/schema.ts:1-25`).
- Free checkout already short-circuits sequentially for active or previously issued subscriptions, but the read/check/checkout sequence has no cross-process exclusion (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/checkout-free-subscription.ts:31-69`, `:306-333`).
- The shared API exception response already has a request identifier, but server-side SDK error normalization drops it before Telegram can display it (`libs/shared/backend/api/src/lib/filters/exception/index.ts:23-106`; `libs/shared/utils/src/lib/response-pipe.ts:53-151`).

## What We're NOT Doing

- We are not serializing all Telegram messages or moving Telegram processing into a global queue.
- We are not using the Agent in-memory conversation lock as a correctness boundary.
- We are not catching the text of the active-subscription validation error in the Telegram transport.
- We are not weakening `findSingle()` integrity checks or silently tolerating duplicates after deployment.
- We are not editing repository data snapshots or hand-writing Drizzle migration SQL, journals, or snapshots.
- We are not silently merging role-permission rows whose non-key authorization conditions disagree; the repair must fail closed and report those conflicts.
- We are not moving natural-key semantics into the generic CRUD `findOrCreate`; it does not know each model's natural key and remains a find-then-insert operation.

## Implementation Approach

Use distinct concurrency mechanisms matching distinct invariants. RBAC grants receive database unique indexes because their identity is a persistent natural key. Telegram bootstrap uses the reusable PostgreSQL advisory-lock helper keyed by Telegram user because identity, subject, profile, chat, and personal-agent initialization spans several HTTP/repository operations whose losing inserts would otherwise be logged as internal errors. Free-subscription checkout uses its own namespace keyed by subject because it spans several repositories and an HTTP checkout side effect. An optional Telegram-local queue remains unnecessary because it cannot protect multiple API processes.

Before the generated indexes run, an RBAC-owned maintenance command repairs all existing duplicates transactionally. It selects canonical rows by `(createdAt, id)`, redirects dependent role-permission rows, removes semantic duplicates, verifies zero duplicate groups, and aborts before mutation when duplicate role-permission conditions conflict. Production rollout quiesces API and Telegram writers between repair and generated index application so there is no unprotected write window.

## Phase 1: Transactional RBAC Repair and Natural-Key Constraints

### Overview

Provide a safe, repeatable data-repair path and make the database enforce the identities already assumed by every RBAC caller.

### Changes Required

#### 1. Module-owned natural-key repair

**Files**:

- `libs/modules/rbac/backend/repository/database/src/lib/natural-key-repair.ts` (new)
- `libs/modules/rbac/backend/repository/database/src/lib/natural-key-repair.integration.spec.ts` (new)
- `libs/modules/rbac/backend/repository/database/src/lib/repair-natural-keys.ts` (new command entry point)
- `libs/modules/rbac/project.json`

**Why**: The affected rows span one model and two relations, so repair belongs to the RBAC module rather than any single repository migration or Telegram transport.

**Changes**: Add an idempotent transaction that locks the three affected tables, reports duplicate counts, selects the earliest permission/relation row as canonical, repoints role-permission references before deleting duplicate permissions, deduplicates both relation tables, and asserts all natural keys are clean. Preserve authorization semantics by rejecting conflicting non-null role-permission conditions. Expose explicit check/apply targets and run the checked apply target before RBAC repository migrations.

#### 2. Drizzle natural-key declarations

**Files**:

- `libs/modules/rbac/models/permission/backend/repository/database/src/lib/schema.ts`
- `libs/modules/rbac/models/permission/backend/repository/database/src/lib/fields/{singlepage,startup,index}.ts`
- `libs/modules/rbac/models/permission/backend/repository/database/src/lib/constraints/{singlepage,startup,index}.ts` (new)
- `libs/modules/rbac/relations/roles-to-permissions/backend/repository/database/src/lib/schema.ts`
- `libs/modules/rbac/relations/roles-to-permissions/backend/repository/database/src/lib/fields/{singlepage,startup,index}.ts` (new)
- `libs/modules/rbac/relations/roles-to-permissions/backend/repository/database/src/lib/constraints/{singlepage,startup,index}.ts` (new)
- `libs/modules/rbac/relations/subjects-to-roles/backend/repository/database/src/lib/schema.ts`
- `libs/modules/rbac/relations/subjects-to-roles/backend/repository/database/src/lib/fields/{singlepage,startup,index}.ts` (new)
- `libs/modules/rbac/relations/subjects-to-roles/backend/repository/database/src/lib/constraints/{singlepage,startup,index}.ts` (new)

**Why**: Service-level reads cannot prevent simultaneous inserts, and the keys are shared RBAC invariants rather than Telegram-specific behavior.

**Changes**: Declare named composite unique indexes for `(type, method, path)`, `(roleId, permissionId)`, and `(subjectId, roleId)`. Follow parallel repository composition layers for both columns and constraints: `fields/singlepage -> fields/startup -> fields/index` owns and exposes the column builders, while `constraints/singlepage -> constraints/startup -> constraints/index` owns and exposes the extra-config builders. Each Drizzle `schema.ts` only composes those two final exports. A startup that intentionally changes a natural key must coordinate its fields, service lookup filters, repair, and generated migration; ordinary startup extension must retain the parent fields and constraints.

#### 3. Generated repository migrations

**Files**:

- `libs/modules/rbac/models/permission/backend/repository/database/src/lib/migrations/*` (generated)
- `libs/modules/rbac/relations/roles-to-permissions/backend/repository/database/src/lib/migrations/*` (generated)
- `libs/modules/rbac/relations/subjects-to-roles/backend/repository/database/src/lib/migrations/*` (generated)

**Why**: Repository schema changes must remain reproducible through the existing Drizzle targets.

**Changes**: Generate, inspect, and apply migrations through the three scoped `repository-generate` targets. Do not manually alter SQL or migration metadata.

### Success Criteria

#### Automated Verification

- [x] Repair integration fixtures containing production-shaped duplicates end with one canonical permission and relation per natural key.
- [x] A conflicting role-permission condition aborts the whole repair transaction without partial deletion.
- [x] Re-running repair on clean data makes no changes.
- [x] All three generated migrations contain the declared composite unique indexes and apply successfully after repair.
- [x] Duplicate inserts against each migrated table are rejected by PostgreSQL.
- [x] Contract tests prove each default startup constraint composition retains the required singlepage natural key while allowing additional startup indexes.

#### Manual Verification

- [x] Repair check output identifies counts without logging permission paths, credentials, or row payloads.
- [ ] A restored affected database can be backed up, repaired, constrained, and rechecked with zero duplicate groups.

---

## Phase 2: Concurrent Knowledge Grant Provisioning

### Overview

Prove that the existing ensure contract converges on the new database invariants under actual concurrent writes.

### Changes Required

#### 1. Grant provisioning conflict recovery

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/access.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/access.spec.ts`

**Why**: Unique constraints make the existing create/catch/re-read strategy valid, but its conflict and non-conflict behavior must remain explicit and regression-tested.

**Changes**: Preserve the natural-key lookup and post-create-failure re-read semantics, keep integrity failures for pre-existing multiplicity, and add focused tests for a rejected losing insert, unrelated creation failures, and cache invalidation after convergence.

#### 2. DB-backed concurrency coverage

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/access.integration.spec.ts` (new)

**Why**: The current in-memory sequential test cannot prove PostgreSQL conflict behavior.

**Changes**: Build repository-backed RBAC services against the integration database, create isolated subject/profile identifiers, invoke two `ensure()` calls through `Promise.all`, and assert exactly one role, fourteen permissions, fourteen role-permission rows, and one subject-role row. Clean up only the test-owned records in `finally`.

### Success Criteria

#### Automated Verification

- [x] Two real concurrent `ensure()` calls both resolve successfully.
- [x] Counts after convergence are `1 / 14 / 14 / 1` for role, permissions, role-permissions, and subject-role.
- [x] A third sequential `ensure()` returns the same grant without writes or integrity errors.
- [x] Existing multiple-row integrity assertions remain active.

#### Manual Verification

- [x] Database inspection confirms no duplicate groups after repeatedly running the concurrency scenario.

---

## Phase 3: Cross-Process Subscription Idempotency and Telegram Checkout Routing

### Overview

Serialize each user's Telegram bootstrap across API processes, stop ordinary messages from provisioning subscriptions, and separately serialize the remaining registration/`/start` subscription provisioning.

### Changes Required

#### 1. Reusable PostgreSQL advisory lock boundary

**Files**:

- `libs/shared/backend/database/config/src/lib/advisory-lock.ts` (new)
- `libs/shared/backend/database/config/src/index.ts`
- `libs/shared/backend/database/config/project.json`

**Why**: A process-local promise queue cannot protect multiple API processes, while the side effect spans several tables and cannot be reduced to the three RBAC grant indexes.

**Changes**: Add a reusable helper that reserves one PostgreSQL session, acquires a namespaced advisory lock for a deterministic key, executes an asynchronous callback, and always releases both lock and connection on success or failure. Keep different keys fully concurrent.

#### 2. Idempotent free-subscription service

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/checkout-free-subscription.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/checkout-free-subscription.spec.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts`

**Why**: Two simultaneous eligible bootstraps can both pass the current pre-checks and start checkout.

**Changes**: Inject the advisory-lock runner, key the provisioning operation by subject, and move the complete active/prior-order recheck plus checkout decision inside the critical section. Treat an already active or previously granted free subscription as a successful no-op response. Add concurrent tests whose first checkout updates the shared order fixture and whose second execution observes that state, proving one checkout call and two successful service results.

#### 3. Respect the bootstrap decision in Telegram

**Files**:

- `apps/telegram/src/lib/telegram-bot.ts`
- `apps/telegram/src/lib/telegram-bot.spec.ts`

**Why**: The transport currently ignores `shouldCheckoutFreeSubscription` and makes normal message processing depend on an unrelated billing call.

**Changes**: Request checkout only when bootstrap explicitly asks for it. Cover normal messages, first registration, repeated `/start`, and simultaneous topic-created/`/start` paths; both background tasks must settle without a generic error, while the API provisioning boundary performs at most one checkout.

#### 4. Serialize multi-repository bootstrap per Telegram user

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.spec.ts`

**Why**: Live rapid `/start` verification showed that two API requests can both pass a profile lookup before either deterministic profile insert completes. The database correctly rejects the losing insert, and the service can re-read the winner, but the nested REST create endpoint still records an avoidable internal `sl_profile_slug_unique` error.

**Changes**: Inject the shared advisory-lock runner at the bootstrap service boundary and execute all identity, subject, profile, chat, personal-agent, and thread initialization inside the `rbac:telegram-bootstrap` namespace keyed by Telegram `fromId`. Validate required input before acquiring the lock. Keep database constraints and conflict recovery as defense in depth.

### Success Criteria

#### Automated Verification

- [x] Advisory locks serialize equal keys across separate PostgreSQL sessions, release after errors, and do not block different keys.
- [x] Concurrent free-subscription requests cause one checkout and two successful responses.
- [x] A normal Telegram bootstrap with `shouldCheckoutFreeSubscription=false` makes no checkout request.
- [x] `/start` with an active subscription succeeds as an idempotent no-op.
- [x] Concurrent `forum_topic_created` and `/start` background tasks emit no fallback reply.
- [x] Bootstrap enters a cross-process advisory lock keyed by Telegram user id.
- [x] Equal lock keys serialize across PostgreSQL sessions while different keys remain concurrent.

#### Manual Verification

- [ ] Repeated `/start` and ordinary messages work for an account with an active subscription.
- [ ] Parallel users are not serialized behind one global lock.

---

## Phase 4: Correlated Diagnostics, Documentation, and End-to-End Verification

### Overview

Make residual failures supportable without leaking sensitive error payloads, then document and exercise the rollout contract.

### Changes Required

#### 1. Preserve API request identifiers through SDK errors

**Files**:

- `libs/shared/utils/src/lib/response-pipe.ts`
- `libs/shared/utils/src/lib/response-pipe.spec.ts`
- `libs/shared/utils/src/lib/response-pipe.server.spec.ts` (new if environment separation is needed)

**Why**: The API exception filter already emits a request ID, but server SDK normalization drops it.

**Changes**: Preserve the response `requestId` in normalized server/client error metadata without changing the public success shape or exposing server stacks in production.

#### 2. Safe Telegram background error reporting

**Files**:

- `apps/telegram/src/lib/telegram-bot.ts`
- `apps/telegram/src/lib/telegram-bot.spec.ts`

**Why**: The current fallback is uncorrelated, while logging the raw downstream error message can expose internal details.

**Changes**: Extract the downstream request ID when present, otherwise create a local error ID; include only that identifier in the localized fallback and structured Telegram log. Log the task label and safe status/type metadata, not raw request bodies, authorization headers, tokens, RBAC paths, or downstream stack text.

#### 3. Architecture and rollout documentation

**Files**:

- `libs/modules/rbac/README.md`
- `libs/modules/rbac/models/permission/README.md`
- `libs/modules/rbac/relations/roles-to-permissions/README.md`
- `libs/modules/rbac/relations/subjects-to-roles/README.md`

**Why**: Future provisioning code must treat these keys as shared invariants, and operators need the safe repair-before-index order.

**Changes**: Document the three natural keys, the fourteen current Knowledge permissions, the repair/check targets, advisory-lock boundary, and production rollout/verification sequence.

### Success Criteria

#### Automated Verification

- [x] `npx nx run @sps/shared-utils:jest:test`
- [x] `npx nx run @sps/shared-backend-database-config:tsc:build`
- [x] `npx nx run @sps/rbac:jest:test`
- [x] `npx nx run @sps/rbac:jest:integration`
- [x] `npx nx run @sps/rbac:tsc:build`
- [x] `npx nx run telegram:jest:test`
- [x] `npx nx run telegram:build`
- [x] Scoped ESLint targets pass for shared database config, RBAC, and Telegram.

#### Manual Verification

- [ ] A forced downstream failure returns a safe reference ID that locates the matching structured log entry.
- [ ] Logs and Telegram replies contain no bearer token, RBAC secret, Telegram token, request body, internal permission path, or stack trace.
- [ ] Production-like concurrent topic creation plus `/start` creates one logical grant and at most one free subscription.

---

## Testing Strategy

### Unit Tests

- Simulate the losing unique insert and confirm grant re-read convergence.
- Verify unrelated grant creation failures are not converted into false success.
- Exercise free-subscription active, prior, new, and two-concurrent-request cases through an injected lock runner.
- Verify the adapter follows both values of `shouldCheckoutFreeSubscription`.
- Verify request-ID propagation and safe Telegram error formatting.

### Integration Tests

- Use temporary production-shaped tables to prove repair ordering, canonical selection, conflict rollback, and idempotent re-run without touching repository snapshots.
- Use migrated RBAC repositories for real `Promise.all` grant creation and exact row counts.
- Use separate PostgreSQL sessions to prove advisory-lock equal-key exclusion and different-key concurrency.
- Compose concurrent Telegram update handling with the API-boundary mocks while the DB-backed suites prove the underlying shared invariants.

### Manual Testing Steps

1. Back up a restored affected database and stop API/Telegram writers.
2. Run the repair in check mode, review only aggregate/conflict output, then run apply mode.
3. Run the three generated migrations and verify duplicate-group queries return zero and all unique indexes exist.
4. Restart API and Telegram, create a new private topic, and send `/start` during topic creation.
5. Repeat `/start`, then send an ordinary message with an active subscription; verify responses continue and no unnecessary checkout occurs.
6. Force a controlled downstream failure and correlate its user-visible reference ID with the sanitized server log.

## Performance Considerations

- Composite indexes add small write overhead but improve natural-key lookups and prevent permanently corrupt state.
- Repair takes explicit table locks only during the maintenance window and processes duplicate groups rather than rewriting clean rows.
- Advisory locking is per subject and operation, so unrelated users remain concurrent; the reserved connection is always released in `finally`.
- Telegram message processing remains background and parallel after bootstrap, with no global queue or lock.

## Migration Notes

1. Take a verified PostgreSQL backup and quiesce API/Telegram writers.
2. Run the RBAC natural-key repair check; abort rollout if role-permission conditions conflict.
3. Apply the repair transaction and assert zero duplicate groups.
4. Generate and apply the permission, roles-to-permissions, and subjects-to-roles migrations through their scoped Nx targets.
5. Verify the three unique indexes and retry duplicate inserts inside a rollback-only validation transaction.
6. Resume services and run the concurrent Telegram smoke test.

If repair or migration fails, keep writers stopped, retain the transaction failure output and backup, and do not bypass constraints. Application code remains compatible with the added indexes; rollback should normally restore the application image while retaining the repaired, constrained database rather than recreating invalid duplicates.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-211.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-211.md`
- Active-subscription history: `thoughts/shared/research/singlepagestartup/ISSUE-173.md`
- Knowledge grant history: `thoughts/shared/processes/singlepagestartup/ISSUE-199.md`
- Telegram conversation architecture: `thoughts/shared/research/singlepagestartup/ISSUE-209.md`
