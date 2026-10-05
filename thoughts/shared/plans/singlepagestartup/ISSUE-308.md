---
date: 2026-09-26T01:55:00+03:00
issue_number: 308
repository: singlepagestartup
topic: "Anchor the remaining authorization allow rules and restrict CORS origins"
status: approved
---

# Anchor the remaining authorization allow rules and restrict CORS origins Implementation Plan

## Overview

Every framework allow rule in `is-authorized` gets `^` and `$` and names only
the routes that answer callers without a session, so the channel messages
route, the channel links and the RBAC graph reads go to the permission service.
The API, Telegram and OpenAPI apps take their CORS origin from one shared
helper that keeps today's echo by default and, when `API_CORS_ALLOWED_ORIGINS`
is set, echoes only the listed origins.

## Current State Analysis

From `thoughts/shared/research/singlepagestartup/ISSUE-308.md`:

- No framework allow rule starts with `^`, and nine have no end anchor
  (`libs/middlewares/src/lib/is-authorized/routes/singlepage.ts:10-42,72-75`).
  Unfixed, an anonymous `GET /api/broadcast/channels/:id/messages` answers 200
  with message payloads, and `GET /api/agent/agents/favicon.ico` reaches the
  agents handler.
- The authentication prefix holds 14 routes, one method each, all called
  without a session by design. The only credential-less broadcast reader is the
  observer's channel lookup (`libs/middlewares/src/lib/observer/index.ts:73-85`).
  No caller reads `permissions`, `roles-to-permissions` or `subjects-to-roles`
  without a credential except the server-rendered admin-v2 `count` cards,
  whose routes have permission rows.
- The three apps echo any `Origin` with credentials (`apps/api/app.ts:41-64`,
  `apps/telegram/app.ts:8-31`, `apps/openapi/app.ts:37-60`); local, Codespaces,
  Gitpod and tunnel setups depend on it.
- `is-authorized/index.ts:50-58` never sets a header.

## Desired End State

- The allow-list admits exactly: `GET /favicon.ico`, `GET /api/broadcast/channels`,
  the 14 authentication routes with their own methods, `GET /public/file-storage/...`,
  and the #276 module and page reads, each rule anchored at both ends.
- `GET /api/broadcast/channels/:id/messages`, the channel by id and count, the
  channel links, and the permission, roles-to-permissions and
  subjects-to-roles reads are decided by the permission service.
- `API_CORS_ALLOWED_ORIGINS` unset or empty: CORS behaves as today. Set: only
  listed origins receive `Access-Control-Allow-Origin`; requests without
  `Origin` are answered as before.
- The dead origin write is gone.

Verification: the routes spec and a new CORS helper spec pass and fail when
their guard is reverted; lint and type-check pass; HTTP probes on port 4308
show the refused channel messages route, the open authentication routes, and
the CORS behavior with the variable set and unset.

### Key Discoveries:

- The matcher lowercases the path and runs `RegExp.test`
  (`libs/middlewares/src/lib/is-authorized/index.ts:43`,
  `libs/shared/utils/src/lib/routes/index.ts:85`); Hono routes strictly and
  case-sensitively, so no trailing-slash or uppercase variant needs a rule.
- The observer reads the channel list without a credential after every
  successful write; taking `GET /api/broadcast/channels` off the list would
  stop observer pipelines, because no permission row covers it.
- The host admin gate reads `GET /api/rbac/roles` first, which a subject
  without a role cannot read, so non-administrators never issue its
  `subjects-to-roles` read (`apps/host/src/components/admin/ClientComponent.tsx:10-57`).
- `hono/cors` sends no allow-origin header when the `origin` function returns
  `null` and passes `""` when the request has no `Origin`.
- `libs/shared/backend/utils/src/lib/rbac-secret` is the pattern for a request
  helper that reads an environment value from `@sps/shared-utils`, with a spec
  that mocks the export through a getter.
- `MCP_SERVICE_ALLOWED_ORIGINS` is the deployer precedent for an optional origin
  list: deployer `.env.example`, service script, template, `github_deployer.sh`,
  both `ansible.yml` secret lists.

## What We're NOT Doing

- Not removing `X-RBAC-SECRET-KEY` from the allowed CORS headers: the browser
  client still sends it from the `rbac.secret-key` cookie
  (`libs/shared/frontend/client/utils/src/lib/authorization/headers.ts:8-21`);
  #305 owns that cookie.
- Not changing the default CORS behavior, and not refusing requests from
  unlisted origins with a status code. CORS is enforced by the browser; a
  missing allow-origin header is the refusal, and callers that are not
  browsers keep working in both modes. The MCP app's 403 on an unlisted origin
  stays specific to MCP.
- Not changing permission seed rows or the permission default (#303), the
  observer middleware, the HTTP cache (#306), the `/public/*` handler (#304) or
  security headers (#322).
- Not adding `API_CORS_ALLOWED_ORIGINS` to the local `create_env.sh` scripts:
  local and Codespaces setups keep the echo.
- Not adding a deployer template for the OpenAPI app, which the deployer does
  not deploy.

## Implementation Approach

The allow-list change is confined to `routes/singlepage.ts` and its spec, with
one rule per route shape and method, written as anchored literals like the
sensitive-route list. Every removed rule's routes fall through to the existing
permission service, so no route is special-cased. The CORS change adds one
environment value and one helper in `@sps/backend-utils`, which each app passes
as the `origin` option in place of its inline echo; the rest of each app's
`cors()` options stay as they are. The deployment wiring copies the
`MCP_SERVICE_ALLOWED_ORIGINS` shape so an operator sets the value once for the
API and Telegram services.

Use cases this plan keeps, with the evidence the research recorded:

- First visit and session renewal: `GET init`, `POST refresh`, `GET me`.
- Login, registration, password reset, wallet login, OAuth start, callback and
  exchange, logout; the MCP login page's anonymous password check.
- The `is-authorized` and `bill-route` middlewares' own calls.
- Observer pipelines: channel lookup without a credential, message read with
  the operator secret.
- Admin UI reads with the administrator's token, which carries the root
  permission; admin-v2 `count` cards through their permission rows.
- Public host, website-builder and file-storage reads.
- Cross-origin browser access with the variable unset (local, Codespaces,
  Gitpod, tunnels, front ends on other domains) and server-to-server calls in
  both modes.

## Phase 1: Anchor the allow-list

### Overview

Rewrite the framework allow rules so each is anchored and names the routes
that answer callers without a session.

### Changes Required:

#### 1. Framework allow rules

**File**: `libs/middlewares/src/lib/is-authorized/routes/singlepage.ts`
**Why**: the unanchored rules admit sub-routes and siblings (research, "What
each current rule admits").
**Changes**:

- `favicon.ico`: escape the dot, anchor both ends.
- Broadcast: keep only `GET /api/broadcast/channels`, with a comment naming
  the observer as its reader.
- Authentication: replace the three rules with anchored rules grouped by
  method: `GET` for `is-authorized`, `me`, `init`; `POST` for `bill-route`,
  `refresh`, `logout`, `ethereum-virtual-machine`; `POST` for the four
  `email-and-password` routes; `POST` for `oauth/<provider>` (which covers
  `oauth/exchange`); `GET` for `oauth/<provider>/callback`. The provider
  segment keeps a slug shape so a project provider needs no new rule.
- `public/file-storage`: anchor both ends, keeping any file below the folder.
- The #276 module and page read rules: add `^`.
- Remove the `roles-to-permissions`, `subjects-to-roles` and both
  `permissions` rules.
- Header comment: every rule is anchored at both ends; the project seams
  (`startup.ts`, constructor options) reopen a route explicitly.

#### 2. Allow-list spec

**File**: `libs/middlewares/src/lib/is-authorized/routes/index.spec.ts`
**Why**: the spec pins the rules, including the old sibling breadth.
**Changes**: replace "still opens the prefix siblings" with its inverse; move
`GET /api/rbac/permissions` from the public case to a refused case and pick a
remaining public route for the method case; add, per rule, a case for each
route it admits and a refused case for each route the old rule admitted
beyond them (channel count, by id, messages and links; the other method of
each authentication route; `meanwhile`-style prefixes and nested paths; POST
to an unknown authentication path; the RBAC graph reads; favicon inside
another path; an embedded host read path).

### Success Criteria:

#### Automated Verification:

- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/middlewares:jest:test` passes.
- [x] Mutation: restoring the old rules fails the new refused cases.
- [x] `npx tsc --noEmit -p libs/middlewares/tsconfig.json` shows no new error.
- [x] `npx eslint libs/middlewares/src/lib/is-authorized` passes.

#### Manual Verification:

- [x] On port 4308 without credentials: channel messages refused, channel list
      open, `GET me`, `GET init` and the POST authentication routes reach their
      handlers, `GET /api/agent/agents/favicon.ico` refused.

---

## Phase 2: Remove the dead origin write

### Overview

Delete the block that compares `Host` with two origins and assigns a property
on a `Headers` object.

### Changes Required:

#### 1. `is-authorized` middleware

**File**: `libs/middlewares/src/lib/is-authorized/index.ts`
**Why**: the block never sets a header (research, "The origin write").
**Changes**: delete lines 50-58 and the `NEXT_PUBLIC_HOST_SERVICE_URL` import.

### Success Criteria:

#### Automated Verification:

- [x] Middleware unit lane and type-check as in Phase 1.

#### Manual Verification:

- [x] None beyond Phase 1; the block had no observable effect.

---

## Phase 3: Configurable CORS origins

### Overview

Add `API_CORS_ALLOWED_ORIGINS` and a shared origin helper, and use it in the
three apps.

### Changes Required:

#### 1. Environment value

**File**: `libs/shared/utils/src/lib/envs/api.ts`
**Why**: environment values are read here; `API_SECRET_STRENGTH` is the API's
neighbour setting.
**Changes**: export `API_CORS_ALLOWED_ORIGINS`, default `""`, with a comment on
the format and on the empty default meaning echo.

#### 2. Origin helper

**File**: `libs/shared/backend/utils/src/lib/cors-origin/index.ts` (new),
exported from `libs/shared/backend/utils/src/lib/index.ts`
**Why**: one decision for three apps; request helpers that read an environment
value live in this package (`rbac-secret`).
**Changes**: `resolveCorsOrigin(origin)` returns `null` for an empty origin,
the origin when the list is empty, and the origin only when it equals a
trimmed, non-empty list entry.

#### 3. Helper spec

**File**: `libs/shared/backend/utils/src/lib/cors-origin/index.spec.ts` (new)
**Why**: BDD coverage of both modes through `hono/cors`.
**Changes**: scenarios for the unset list (any origin echoed on preflight and
request, credentials allowed), the set list (listed origins echoed, unlisted
and look-alike origins refused, spaces and blanks tolerated) and a request
without `Origin` in both modes.

#### 4. Apps

**Files**: `apps/api/app.ts`, `apps/telegram/app.ts`, `apps/openapi/app.ts`
**Why**: each has its own inline echo.
**Changes**: `origin: resolveCorsOrigin`; the other `cors()` options stay.

### Success Criteria:

#### Automated Verification:

- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/backend-utils:jest:test` passes.
- [x] Mutation: echoing every origin regardless of the list fails the set-list refusals.
- [x] `NODE_OPTIONS=--max-old-space-size=12288 npx nx run @sps/backend-utils:eslint:lint`, `@sps/shared-utils:eslint:lint`, `api:eslint:lint`, `telegram:eslint:lint`, `openapi:eslint:lint` pass.
- [x] `npx tsc --noEmit` for `libs/shared/backend/utils`, `libs/shared/utils`, `apps/api`, `apps/telegram`, `apps/openapi` shows no new error against `main`.
- [x] `api:jest:test`, `telegram:jest:test`, `@sps/shared-utils:jest:test` pass.

#### Manual Verification:

- [x] Port 4308, variable unset: a preflight from any origin gets it back.
- [x] Port 4308, variable set: a listed origin gets it back, another origin gets no allow-origin header, a request without `Origin` is answered.
- [x] The Telegram and OpenAPI apps load with the helper and answer both modes (in-process requests; the Telegram app without a bot token, so no webhook call).

---

## Phase 4: Documentation and deployment wiring

### Overview

Document the value and let the deployer pass it to the API and Telegram
services.

### Changes Required:

#### 1. Documentation

**Files**: `apps/api/README.md` (Environment section), `apps/telegram/README.md`
and `apps/telegram/.env.example`, `apps/openapi/README.md`, `tools/deployer/README.md`
**Changes**: the API README explains both modes and the origin format; the
Telegram and OpenAPI docs point to it; the deployer README says how a
deployment sets it.

#### 2. Deployer

**Files**: `tools/deployer/.env.example`, `tools/deployer/api.sh`,
`tools/deployer/api/api.env.j2`, `tools/deployer/telegram.sh`,
`tools/deployer/telegram/telegram.env.j2`, `tools/deployer/github_deployer.sh`,
`.github/workflows/ansible.yml`
**Changes**: an empty optional entry with a comment, a `get_env` read and an
`-e` pass in both service scripts, a conditional line in both templates, a
secret entry in `github_deployer.sh` and in both secret lists of `ansible.yml`,
following `MCP_SERVICE_ALLOWED_ORIGINS`.

### Success Criteria:

#### Automated Verification:

- [x] `bash -n` on the edited shell scripts.
- [x] Both templates render with the value set and unset (`jinja2` from Python).

#### Manual Verification:

- [x] None; the deployer is not run from this branch.

---

## Testing Strategy

### Unit Tests:

- Allow-list: one case per admitted route and method, one refused case per
  route the old rules admitted beyond it.
- CORS helper: unset, set, look-alike origins, blanks, no `Origin`.

### Integration Tests:

- None added; the HTTP behavior is proven on a running API.

### Manual Testing Steps:

1. Boot the API on port 4308 from the worktree, create a throwaway channel
   with one message using the operator secret.
2. Request the channel list, the channel messages, the authentication routes
   and the RBAC graph reads without credentials; compare with the baseline in
   the research document.
3. Send preflights from a listed and an unlisted origin with the variable
   unset and set, and a request without `Origin`.
4. Delete the throwaway channel, its message link and the subjects `init`
   created.

## Performance Considerations

Requests that leave the allow-list add one authorization call, cached for 30
seconds per path and credential. The CORS helper splits a short string per
request.

## Migration Notes

- A deployment that sets `API_CORS_ALLOWED_ORIGINS` lists every browser front
  end that calls the API or Telegram service with credentials; a missing origin
  makes browsers refuse that front end's responses.
- Cached RBAC graph responses stored before the upgrade stay in the HTTP cache
  until it is cleared; the start-up seed calls the clear route.
- Projects that read the routes leaving the list without a credential, or that
  added routes under `/api/rbac/subjects/authentication/`, declare them in
  their startup route list or send a credential.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-308.md` (local)
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-308.md`
- Review: `thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md` (local)
