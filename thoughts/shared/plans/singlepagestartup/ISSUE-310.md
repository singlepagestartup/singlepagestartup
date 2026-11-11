---
date: 2026-09-26T01:45:00+03:00
issue_number: 310
repository: singlepagestartup
topic: "Add rate limiting and uniform responses to authentication routes"
status: approved
---

# Authentication rate limits and uniform responses Implementation Plan

## Overview

Count attempts on the RBAC authentication routes and on requests that carry a
wrong operator secret in the shared KV store, refuse a caller over its budget
with 429 and `Retry-After`, and make login and forgot-password answer an
unknown account exactly as they answer an existing one.

## Current State Analysis

From `thoughts/shared/research/singlepagestartup/ISSUE-310.md`:

- Nothing limits attempts. `hono-rate-limiter` is declared and unused.
- Login answers 401 on both failure paths, but with different error text
  (`Not Found error. Invalid credentials` versus `Validation error. Invalid credentials`)
  and only the wrong-password path runs bcrypt (about 90 ms versus 178 ms).
- Forgot-password answers 404 for an unknown address and 201 for a known one.
- A wrong operator secret is not logged or counted; on an allow-listed route
  the request continues as anonymous.
- Every authentication route is called from the browser. The API sees the
  browser's address in the `X-Forwarded-For` entry Traefik appends, but in the
  default deployer that entry is the swarm ingress address for every visitor
  (routing-mesh publishing, Cloudflare proxy). Server-side callers reach the
  API on the swarm network (`http://api:4000`), local development and the
  scenario lane on `localhost`.
- The KV provider offers `incr` with a TTL refreshed on every increment and
  `get`; the HTTP cache shows the counter and fail-open patterns.

## Desired End State

- Login, registration, wallet login, forgot-password and reset-password count
  attempts per client address; login counts per `login` and forgot-password per
  `email` as well; `init` and `refresh` count per client address. A request over
  a budget answers 429 in the standard error shape with `Retry-After` set to the
  seconds left in the window, before the handler runs.
- Every request that carries an operator secret which does not match writes one
  warning line (method, path, client address, request id, never the value) and
  counts against its address. Once an address is over its budget, every
  request from it that carries an operator secret, right or wrong, answers 429
  until the window ends.
- Counters live in the KV store, so every API process shares them. A KV store
  that fails or does not answer within `KV_COMMAND_TIMEOUT_MS` lets the request
  through and is reported at most once a minute.
- An address in a private network (loopback, RFC 1918, link-local, shared
  address space, IPv6 unique-local and link-local) is not counted: it is a
  proxy, the swarm ingress, another service or a developer machine.
- Login answers `401 Authentication error. Invalid credentials` for an unknown
  account, an identity without a salt and a wrong password, from one statement,
  after one bcrypt hash on every path.
- Forgot-password answers `201 { data: { ok: true } }` whether or not the
  address belongs to exactly one linked identity; only that case stores a code.
- `RBAC_RATE_LIMIT_ENABLED=false` turns counting and refusals off for load
  tests; wrong operator secrets are still logged.

Verification: unit specs for each rule and guard with a mutation check, the
rbac, middlewares, backend-utils and shared-utils lanes, lint and type checks,
and an HTTP proof on port 4310 against the local Redis.

### Key Discoveries

- `getHttpErrorType` maps both login messages to 401 through
  `/invalid credentials/i` (`libs/shared/backend/utils/src/lib/http-error/paterns/index.ts:4-22`);
  the error text is the only field that differs.
- The identity service throws the unknown-account error before hashing
  (`libs/modules/rbac/models/identity/backend/app/api/src/lib/service/singlepage/index.ts:179-200`).
- `forgot-password.ts:49-55,73-75` throws for an unknown address, several
  identities and a missing subject link.
- `DefaultApp.useRoutes` applies a route's middlewares with `hono.use(path, ...)`
  (`libs/shared/backend/api/src/lib/app/default/index.ts:72-82`); Hono caches
  the parsed body (`node_modules/hono/dist/request.js:59`), so a route
  middleware can read `data.login` before the handler.
- A header set with `c.header()` before a throw reaches the exception filter's
  `c.json` response (`node_modules/hono/dist/context.js:90-145`).
- `@sps/rbac` cannot import `@sps/middlewares` (the latter imports rbac SDKs)
  and `@sps/backend-utils` cannot import `@sps/providers-kv` (the provider
  imports backend-utils), so shared limiter code lives in `@sps/backend-utils`
  and takes the store as an argument.
- `hono/bun` evaluates `Bun` at import, which breaks Jest; the connection
  address is read from `c.env.requestIP(c.req.raw)`, the Bun server that
  `serve({ fetch: app.fetch })` passes as `c.env` (`apps/api/server.ts:42-47`).
- `jest.setup.ts` loads `apps/api/.env`, so middleware specs pass a fake store
  through constructor options rather than constructing a Redis client.
- `libs/modules/rbac/jest.config.ts:4-8` ignores every spec under
  `authentication/email-and-password`; the two placeholder specs there assert
  `false === true`.

## What We're NOT Doing

- `init` stays a `GET`. Its one caller is a `useQuery` in `init-default`; a
  `POST` needs a mutation there, and a host built before the change keeps
  sending `GET` to an API deployed after it, so new visitors would get no
  session until the host is redeployed. The per-address limit bounds subject
  creation instead. No same-origin check: the API serves other origins by design.
- Registration keeps `Identity already exists`; confirming the address is #280.
  Registration is rate-limited per address.
- Forgot-password keeps its extra work for a known address; the remaining
  timing difference is two lookups and one update, bounded by both limits, and
  the reset mail is not sent at all today. The lookup stays case-sensitive as
  before.
- No change to Traefik publishing (`mode: host`), Traefik `trustedIPs` or
  Cloudflare: that is deployment topology, and #319 edits the same Traefik
  template. The plan documents what each topology gives the limiter.
- No trust in `CF-Connecting-IP`: a direct request to the origin can forge it
  and spend another address's budget.
- No change to the remaining `===` secret comparisons (#295), the error pattern
  table, `changePassword`, OAuth, logout, `me` or `is-authorized`.
- No alert channel beyond the warning line; the exception filter already logs
  each 429 at error level.
- `hono-rate-limiter` stays in `package.json`; removing it rewrites the lockfile.
  It is not used: its store contract needs `decrement`, which the KV provider
  lacks, its default refusal is plain text outside the error shape, and a store
  error would fail the request.
- Nothing from #311 (token claims, logout, `me`). Controller edits are limited
  to adding middleware instances to existing route entries.

## Use cases verified to keep working

- Browser sign-in, registration, wallet login, forgot-password, `init` and
  `refresh`: budgets are several times what one person needs; `init-default`
  calls `init` or `refresh` at most once per token state.
- Default deployments: the ingress address is private, so no browser shares a
  per-address bucket with every other browser; per-account limits still apply.
- Server-side callers with the operator secret (API self-calls, host, Telegram,
  MCP on the swarm network): never counted, never refused.
- Scenario lane: `localhost`, one login per suite.
- Cross-origin API access, file uploads, the anonymous cart, MCP OAuth and a
  development tunnel: no origin, body-size or route change; a tunnel's
  forwarded address is counted like any client and stays far below the budgets.
- Redis outage: every limiter lets requests through.

## Implementation Approach

A fixed-window counter keyed `<scope>:<value>:<window index>` through the KV
provider's `incr` with a TTL of one window, the same primitive as the HTTP
cache version counters. Two shared helpers go to `@sps/backend-utils` beside
the existing request readers: the client address reader and the limiter
factory. Route budgets are declared in the subject controller's route table
through a subject route middleware; the operator secret counter is a global
middleware in `libs/middlewares` registered before the cache and authorization.
Budgets and switches come from `libs/shared/utils/src/lib/envs/rbac.ts`.

## Phase 1: Environment values and shared helpers

### Overview

Add the settings and the two helpers every limiter uses.

### Changes Required:

#### 1. Rate-limit settings

**File**: `libs/shared/utils/src/lib/envs/rbac.ts`
**Why**: RBAC settings live here with documented defaults.
**Changes**: add, with one comment block: `RBAC_RATE_LIMIT_ENABLED` (on unless
`"false"`), `RBAC_RATE_LIMIT_WINDOW_IN_SECONDS` (60),
`RBAC_RATE_LIMIT_TRUSTED_PROXIES` (1, zero allowed),
`RBAC_RATE_LIMIT_CREDENTIAL_ATTEMPTS_PER_ADDRESS` (20: login, registration,
wallet login, forgot-password, reset-password, each route its own budget),
`RBAC_RATE_LIMIT_CREDENTIAL_ATTEMPTS_PER_ACCOUNT` (10: login by `login`,
forgot-password by `email`), `RBAC_RATE_LIMIT_SESSION_ATTEMPTS_PER_ADDRESS`
(60: `init`, `refresh`), `RBAC_RATE_LIMIT_OPERATOR_SECRET_FAILURES_PER_ADDRESS` (10).

#### 2. Client address reader

**File**: `libs/shared/backend/utils/src/lib/client-address/index.ts` (new),
exported from `libs/shared/backend/utils/src/lib/index.ts`
**Why**: request readers live in backend-utils (`authorization`, `readRbacSecret`).
**Changes**: `readClientAddress(c, trustedProxies)` walks the connection address
and the `X-Forwarded-For` entries from the right, skipping `trustedProxies`
hops, and normalizes IPv4-mapped IPv6; `isPrivateNetworkAddress(address)`.

#### 3. Limiter

**File**: `libs/shared/backend/utils/src/lib/rate-limit/index.ts` (new),
exported from the same index
**Why**: both middlewares share the window arithmetic, the fail-open deadline
and the refusal shape, and the rbac package cannot import `libs/middlewares`.
**Changes**: `createRateLimiter({ storeProvider, timeoutMs?, logIntervalMs?, logger?, now? })`
with `count` (increment) and `read` (no increment) returning attempts, whether
the budget is exceeded and the seconds left, or nothing when the store failed;
`assertWithinRateLimit(c, attempts)` sets `Retry-After` and throws a 429
`HTTPException` with a fixed message.

### Success Criteria:

#### Automated Verification:

- [x] `npx nx run @sps/backend-utils:jest:test` passes, including new specs
  for the address reader and the limiter
- [x] `npx nx run @sps/shared-utils:jest:test` passes
- [x] `npx nx run @sps/backend-utils:eslint:lint` and `@sps/shared-utils:eslint:lint` pass

#### Manual Verification:

- [x] Mutation: dropping the trusted-hop skip or the private-network check fails its spec

---

## Phase 2: Route limits on the subject authentication routes

### Overview

A subject route middleware that spends one attempt per request from an
address budget and, where the route names an account, from an account budget.

### Changes Required:

#### 1. Route middleware

**File**: `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-rate-limit/index.ts` (new),
exported from `.../middlewares/src/index.ts` as `RequestRateLimit`
**Why**: route guards live in the module's middleware package.
**Changes**: `Middleware` with constructor options (store, switch, window,
trusted proxies; defaults from the environment) and `init(rule)` where the rule
names the counter, the address budget and optionally the account budget and the
`data` field that names the account. KV prefix `rate-limit:rbac-subject:<name>`.

#### 2. Route table

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts`
**Why**: controllers compose routes, middleware instances and handlers.
**Changes**: add `middlewares: [new RequestRateLimit().init({...})]` to the
entries for init, registration, wallet login, refresh, login, forgot-password
and reset-password; add the import and the budget constants. No other edit.

### Success Criteria:

#### Automated Verification:

- [x] `npx nx run @sps/rbac:jest:test` passes, including the new middleware spec:
  under the budget passes, over it answers 429 with `Retry-After`, a new window
  passes again, the account budget holds across addresses and letter case,
  disabled mode never refuses, a private address is not counted, a failing store
  lets requests through
- [x] `npx nx run @sps/rbac:eslint:lint` passes

#### Manual Verification:

- [x] Mutation: removing the address or the account count fails its spec

---

## Phase 3: Wrong operator secret counter

### Overview

A global middleware that logs and counts wrong operator secrets and refuses
secret-bearing requests from an address over its budget.

### Changes Required:

#### 1. Middleware

**File**: `libs/middlewares/src/lib/operator-secret-attempts/index.ts` (new),
exported from `libs/middlewares/src/lib/index.ts` as `OperatorSecretAttemptsMiddleware`
**Why**: a middleware for every request lives beside `operator-secret` and `is-authorized`.
**Changes**: reads the secret with `readRbacSecret` and compares with
`rbacSecretMatches`; no secret, no work; a wrong one is logged and counted, a
right one only reads the counter; over budget, 429. KV prefix
`rate-limit:operator-secret`. Constructor options mirror Phase 2.

#### 2. Registration

**File**: `apps/api/app.ts`
**Why**: the counter must run before the HTTP cache, the action logger and
is-authorized, and after the request id exists.
**Changes**: register after the WebSocket route and before revalidation.

### Success Criteria:

#### Automated Verification:

- [x] `npx nx run @sps/middlewares:jest:test` passes, including the new spec:
  no secret untouched, wrong secret logged without its value and counted, over
  budget 429 with `Retry-After`, a right secret from a refused address 429, from
  another address passes, a private address logged and not counted, disabled
  mode logs and never refuses
- [x] `npx tsc --noEmit -p libs/middlewares/tsconfig.json` (or the project's build target) passes

#### Manual Verification:

- [x] Mutation: removing the count, the log line or the right-secret check fails its spec

---

## Phase 4: Uniform login and forgot-password answers

### Overview

One answer per route for an unknown and an existing account.

### Changes Required:

#### 1. Login

**File**: `libs/modules/rbac/models/identity/backend/app/api/src/lib/service/singlepage/index.ts`
**Why**: the unknown-account branch throws its own message before hashing.
**Changes**: hash the submitted password with the identity's salt, or with a
cost-10 salt generated once per process when there is no identity or no salt,
then throw `Authentication error. Invalid credentials` from one statement when
there is no identity, no salt or no match. The several-identities branch stays.

#### 2. Forgot-password

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/email-and-password/forgot-password.ts`
**Why**: it answers 404 for an unknown address.
**Changes**: store a code only for exactly one identity with a subject link and
answer `201 { data: { ok: true } }` in every other case as well.

#### 3. Specs and lane

**Files**: `.../identity/.../service/singlepage/index.spec.ts` (login scenarios),
`.../email-and-password/forgot-password.spec.ts` (new),
`libs/modules/rbac/jest.config.ts`
**Changes**: narrow the ignore pattern to the two placeholder specs so the new
forgot-password spec runs.

### Success Criteria:

#### Automated Verification:

- [x] `npx nx run @sps/rbac:jest:test` passes: unknown account, identity
  without salt and wrong password reject with the same message after a hash each;
  forgot-password answers identically for unknown, known and ambiguous addresses
  and stores a code only for the known one

#### Manual Verification:

- [x] Mutation: restoring the early throw or the 404 fails its spec

---

## Phase 5: Deployer wiring, documentation, HTTP proof

### Changes Required:

- `tools/deployer/api.sh`, `tools/deployer/api/api.env.j2`, `tools/deployer/.env.example`:
  pass the seven settings through when set, like the optional OAuth settings.
- `libs/modules/rbac/models/subject/README.md`: a "Rate limits" section with
  routes, keys, defaults, the 429 answer, the switch, the trusted-proxy count,
  the private-network exemption and what each deployment topology gives.

### Success Criteria:

#### Automated Verification:

- [x] `node tools/agents/code-placement.mjs` passes

#### Manual Verification (HTTP proof on port 4310, local Redis):

- [x] Repeated failed logins from one forwarded address reach 429 with `Retry-After`
- [x] A correct login within the budget answers 201
- [x] Unknown email and wrong password answer the same status and body keys and the same error text
- [x] Forgot-password answers the same for an unknown and a known address
- [x] Wrong operator secrets are logged and counted, then refused
- [x] Fixtures and `rate-limit:*` keys are deleted afterwards

## Testing Strategy

### Unit Tests:

- Address reader: one, two and zero trusted hops; missing connection info;
  IPv4-mapped IPv6; private and public ranges.
- Limiter: under and over the budget, `Retry-After`, window rollover with an
  injected clock, read without increment, store rejection and timeout.
- Middlewares: as listed in Phases 2 and 3, through `new Hono()` with an error
  handler that answers like the exception filter.
- Identity service and forgot-password handler: as listed in Phase 4.

### Integration Tests:

- HTTP proof against the worktree API with lowered budgets passed as environment
  values, which also proves the environment wiring.

## Performance Considerations

A request without an operator secret to a route without a rule touches no KV
key. A limited route costs one `INCR` and one `EXPIRE` per counter. A
secret-bearing request from a public address costs one `GET` or one `INCR`;
from a private address, none. Every KV call is bounded by
`KV_COMMAND_TIMEOUT_MS`. A fixed window admits up to twice a budget across one
window boundary.

## Migration Notes

No schema or data change. The limits are on by default. A child project whose
clients legitimately exceed a budget from one public address raises the value
or turns the limiter off; one that runs its API behind a different proxy chain
sets `RBAC_RATE_LIMIT_TRUSTED_PROXIES`. Per-address budgets take effect only
where the API receives client addresses: Traefik published with `mode: host`
and no proxy in front (one trusted hop), or Traefik trusting Cloudflare's
ranges with two trusted hops.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-310.md` (local, embargoed)
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-310.md`
- Related: `thoughts/shared/research/singlepagestartup/ISSUE-234.md`, `ISSUE-233.md`
