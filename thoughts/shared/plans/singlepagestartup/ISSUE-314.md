---
date: 2026-09-26T01:05:00+03:00
issue_number: 314
repository: singlepagestartup
topic: "Error response details and bug report delivery"
status: in_review
---

# Error Response Details and Bug Report Delivery Implementation Plan

## Overview

The shared exception filter answers every error with the server stack and the
cause chain, and waits for a Telegram send on every 5xx. After this plan the body
carries the stack and the causes only for a deployment that asks for them or a
caller that presents the operator secret, and the Telegram report leaves the
response path and is sent once per failing route within a window.

## Current State Analysis

Research: `thoughts/shared/research/singlepagestartup/ISSUE-314.md`.

- `libs/shared/backend/api/src/lib/filters/exception/index.ts:107-118` writes
  `{ requestId, path, method, status, error, stack, cause }` for every status,
  with no environment or caller check.
- `index.ts:64-105` builds a grammY `Bot` and awaits `sendMessage` (twice after
  a chat migration) before responding, for every 5xx, with no de-duplication.
  A failed send is printed with `console.error(error)`, which includes the bot
  token for network failures.
- `index.ts:23` falls back to the literal `unknown` when the request never passed
  `RequestIdMiddleware` (the `/public/*` route and the Telegram service), so the
  body cannot point at a log line.
- The API runs with `NODE_ENV` unset both in a deployment and on a developer
  machine (research section 8), so `NODE_ENV === "production"` alone would leave
  every deployer-made deployment returning stacks.

## Desired End State

- Every error body keeps `requestId`, `path`, `method`, `status` and `error`
  (the sanitized message). `stack` and `cause` are added when
  `API_ERROR_DETAILS` resolves to `full`, or when the request carries an
  operator secret that `rbacSecretMatches` accepts, in either mode.
- `API_ERROR_DETAILS` is `full` or `brief`. Unset, it is `full` when `NODE_ENV`
  is `development` or `test` and `brief` otherwise, including an unset
  `NODE_ENV`. `apps/api/create_env.sh` writes `full` for local development and
  the deployer template writes `brief`.
- The log record is unchanged: message, stack, status and causes under the
  request id. When the request has no id, the filter creates one and uses it in
  both the log line and the body.
- A 5xx report is started without being awaited; a failure is logged with the
  error message only. A report is sent once per status, method and matched route
  pattern within `BUG_SERVICE_REPORT_WINDOW_IN_SECONDS` (default 300); repeats
  inside the window are dropped. The report text is unchanged.

Verification: the new filter spec passes and fails under each mutation listed in
Phase 3, and the HTTP proof on port 4314 shows the body keys for a 4xx and a 5xx
under `NODE_ENV=production`, under an unset `NODE_ENV`, under
`API_ERROR_DETAILS=full`, and with the operator secret.

### Key Discoveries:

- Bun 1.3.6 loads `.env.production` only when `NODE_ENV` is already
  `production`, and leaves `NODE_ENV` undefined otherwise; the tracked
  `apps/api/.env.production` never sets it in a deployment (research section 8).
- `routePath(c)` from `hono/route` returns the matched route pattern inside
  `onError` (`/api/host/pages/:id`, `/*` for a main-app middleware), so a
  signature built on it cannot be varied by ids or query strings (research
  section 4).
- The filter is bound in 173 containers (research section 4), so the report
  window must be module state shared by all instances, the same way
  `libs/middlewares/src/lib/is-authorized/index.ts:29` holds its cache.
- `createMemoryCache` in `@sps/shared-utils` is the existing expiring,
  size-bounded window (`libs/shared/utils/src/lib/memory-cache.ts:11-49`).
- `rbacSecretMatches(readRbacSecret(c))` from `@sps/backend-utils` is the
  existing constant-time operator check (issue #276).
- `API_SECRET_STRENGTH` in `libs/shared/utils/src/lib/envs/api.ts:1-9` is the
  model for a documented mode with a safe default.

## What We're NOT Doing

- No `category` key in the body. Handlers drop the category returned by
  `getHttpErrorType` at 324 call sites, and the filter cannot recover it from an
  `HTTPException`; the mapped status and the category words inside the mapped
  message stay as they are.
- No rename of `error` to `message`: `responsePipe` reads `error` first
  (`libs/shared/utils/src/lib/response-pipe.ts:116-122`).
- No change to message text. A 5xx keeps its sanitized, mapped message, which
  can still name an internal condition; replacing it with a generic text is a
  separate decision.
- No change to what is logged: the original error in `HTTPException.cause`
  stays unlogged, as today.
- No fix for `e.stack.replace` on a cause without a stack (`index.ts:40`); it
  predates this issue and is independent of the gate.
- No HTML escaping in the report; the report text stays as it is.
- No `NODE_ENV=production` in the Dockerfile or the deployer: Bun would then load
  the tracked `apps/api/.env.production` over `.env` and change about a dozen
  unrelated values in every deployment.
- No forwarding of `API_ERROR_DETAILS` through `tools/deployer/api.sh`,
  `.env.example`, `github_deployer.sh` or the workflow; the template carries the
  default and the operator secret covers per-request debugging.
- No request-id middleware for the Telegram service; the filter's fallback id
  covers its error bodies.
- No global cap on reports: the route-pattern signature already bounds them by
  the number of failing routes per window.

## Implementation Approach

Keep the filter's shape and seam: one class bound through `DI.IExceptionFilter`,
the same parse and log steps, with two private methods added, one for the body
gate and one for the report. The window is a module-level `createMemoryCache`.
The two new variables live beside their siblings in the envs package, and the
documentation lands where each variable family is already documented.

## Phase 1: Environment values

### Overview

Define the two variables with documented defaults.

### Changes Required:

#### 1. API environment

**File**: `libs/shared/utils/src/lib/envs/api.ts`
**Why**: the API's own modes live here beside `API_SECRET_STRENGTH`.
**Changes**: add `API_ERROR_DETAILS: "full" | "brief"`, read from
`API_ERROR_DETAILS` with the `NODE_ENV` fallback above, and a JSDoc naming the
default, why an unset `NODE_ENV` resolves to `brief`, and the operator-secret
bypass.

#### 2. Bug service environment

**File**: `libs/shared/utils/src/lib/envs/host.ts`
**Why**: the `BUG_SERVICE_*` variables are defined here (`:115-119`).
**Changes**: add `BUG_SERVICE_REPORT_WINDOW_IN_SECONDS`, default 300, with a
JSDoc naming the signature.

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit -p libs/shared/utils/tsconfig.json` passes
- [ ] `npx nx run @sps/shared-utils:jest:test` passes
- [ ] `npx nx run @sps/shared-utils:eslint:lint` passes

---

## Phase 2: Exception filter

### Overview

Gate the details, fall back to a generated request id, and move the report off
the response path.

### Changes Required:

#### 1. Filter

**File**: `libs/shared/backend/api/src/lib/filters/exception/index.ts`
**Why**: the body, the request id and the report are all built here.
**Changes**:
- Request id: header value, else a generated UUID.
- Body: build the brief body, and add `stack` and `cause` only when a private
  `exposesDetails(c)` returns true (`API_ERROR_DETAILS === "full"` or the
  operator secret matches).
- Report: a private method computes the signature from status, method and
  `routePath(c)`, returns when the module-level window holds it, records it,
  and starts the send without awaiting it. The send keeps the current text,
  subject lookup and migration retry, and logs a failure through `logger.error`
  with the error message only.

### Success Criteria:

#### Automated Verification:

- [ ] `npx tsc --noEmit -p libs/shared/backend/api/tsconfig.json` passes
- [ ] `npx nx run @sps/shared-backend-api:jest:test` passes
- [ ] `npx nx run @sps/shared-backend-api:eslint:lint` passes

---

## Phase 3: Filter spec and mutation checks

### Overview

Pin the gate, the request id and the report behaviour with BDD scenarios run
through a real Hono app, with grammY mocked and the environment set per
scenario.

### Changes Required:

#### 1. Spec

**File**: `libs/shared/backend/api/src/lib/filters/exception/index.spec.ts`
**Why**: no spec covers the filter today (research section 13).
**Changes**: scenarios for
- `NODE_ENV=production`: a 500 and a 400 hide `stack` and `cause` and keep
  `requestId`, `path`, `method`, `status` and `error`; the log record still
  carries the stack under the request id;
- unset `NODE_ENV`: the same brief body;
- `NODE_ENV=development`, and `API_ERROR_DETAILS=full` under production: the
  body carries `stack` and `cause`;
- production with the operator secret in the header or the cookie: full body;
  with a wrong secret: brief body;
- a request without an id: the body and the log share one generated id;
- a 5xx whose send never settles still gets its response; a failed send is
  logged by message and the log carries no token; repeats on one route pattern
  within the window send once, another route sends again, the same route sends
  again after the window; a 4xx sends nothing.

Each scenario imports the filter after `jest.resetModules()` with
`jest.doMock` for `grammy` and the `BUG_SERVICE_*`/`RBAC_SECRET_KEY` values, as
`libs/shared/third-parties/src/lib/open-ai/index.spec.ts` does, so no real
token from `apps/api/.env` is ever used.

#### 2. Mutation checks

Run the spec against each local mutation, confirm the named scenarios fail,
then restore:
- `exposesDetails` always true: the production and wrong-secret scenarios fail;
- `exposesDetails` ignores the secret: the operator-secret scenarios fail;
- the send awaited: the unsettled-send scenario fails;
- the window check removed: the repeat scenario fails.

### Success Criteria:

#### Automated Verification:

- [ ] `npx nx run @sps/shared-backend-api:jest:test` passes
- [ ] each mutation above makes its scenarios fail

---

## Phase 4: Configuration and documentation

### Changes Required:

#### 1. Local environment

**File**: `apps/api/create_env.sh`
**Why**: a developer machine runs with `NODE_ENV` unset.
**Changes**: write `API_ERROR_DETAILS=full`.

#### 2. Deployment environment

**File**: `tools/deployer/api/api.env.j2`
**Why**: makes the deployment mode explicit and overridable by an extra var.
**Changes**: `API_ERROR_DETAILS={{ API_ERROR_DETAILS | default('brief', true) }}`.

#### 3. Documentation

**Files**: `apps/api/README.md` (Environment), `tools/deployer/README.md`
(beside `API_SECRET_STRENGTH`), `README.md` (Error Handling).
**Why**: the API environment values and the error body are documented there;
the root README lists keys the filter does not write.
**Changes**: document both variables and their defaults, the operator-secret
bypass, the request id as the handle into the log, the report window, and the
actual body keys.

### Success Criteria:

#### Automated Verification:

- [ ] `bash -n apps/api/create_env.sh` passes
- [ ] `npx prettier --check` on the changed Markdown files passes

---

## Phase 5: HTTP proof

Boot the API from the worktree on port 4314 with the HTTP cache off and the
`BUG_SERVICE_*` values blanked, so no Redis version is bumped and no Telegram
message is sent. For each of `NODE_ENV=production`, unset `NODE_ENV`, and
`API_ERROR_DETAILS=full`, request
`GET /api/host/pages?filters[and][0][column]=id&filters[and][0][method]=nope`
(400) and `GET /api/host/pages?orderBy[and][0][column]=id&orderBy[and][0][method]=nope`
(500), and repeat under production with the operator secret. Print status codes
and body key names only, and confirm the server log line for one brief response
carries the same request id and a stack. Stop the server.

## Testing Strategy

### Unit Tests:

- The Phase 3 scenarios; the gate, the request id and the report each have a
  scenario that fails under its mutation.

### Integration Tests:

- None added; the HTTP proof exercises the booted API.

### Manual Testing Steps:

1. Phase 5 on port 4314.

## Use Cases Kept

- Local development: `create_env.sh` writes `full`, so a new checkout keeps
  stacks in responses; an existing checkout adds the one line (Migration Notes).
- Operators in production: the `X-RBAC-SECRET-KEY` header or the
  `rbac.secret-key` cookie returns the full body without a redeploy.
- `responsePipe` clients: `error` and `requestId` keep their keys; an absent
  `cause` leaves `causes` empty (`response-pipe.ts:133-145`).
- Internal calls that forward the operator secret (is-authorized, bill-route,
  MCP) keep receiving the full body.
- Cross-origin access, uploads, the anonymous cart, tunnel development and MCP
  OAuth do not pass through any changed branch: the filter shapes error bodies
  only and gates no request.
- 4xx responses still never produce a Telegram report.

## Performance Considerations

- The error path no longer waits for one or two Telegram round trips per 5xx.
- The window holds at most 1000 signatures; keys are bounded by the registered
  routes.
- `rbacSecretMatches` adds one constant-time comparison per error response.

## Migration Notes

- An existing local checkout returns brief bodies after the upgrade until
  `API_ERROR_DETAILS=full` is added to `apps/api/.env`; the full record stays in
  the API log under the request id.
- A deployer-made deployment gets the explicit `brief` line the next time its
  environment file is rendered; the code default already resolves to `brief`
  while `NODE_ENV` is unset.
- A client that read `stack` or `cause` from a deployed API's error body gets
  them back by presenting the operator secret or by setting
  `API_ERROR_DETAILS=full` on that deployment.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-314.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-314.md`
