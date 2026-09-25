---
date: 2026-09-26T01:24:47+03:00
researcher: flakecode
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-310-auth-rate-limit
repository: singlepagestartup
topic: "Add rate limiting and uniform responses to authentication routes"
tags: [research, codebase, rbac, subject, identity, middlewares, kv, deployer, security]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Add rate limiting and uniform responses to authentication routes

**Date**: 2026-09-26T01:24:47+03:00
**Researcher**: flakecode
**Git Commit**: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
**Branch**: claude/issue-310-auth-rate-limit
**Repository**: singlepagestartup

## Research Question

How do the RBAC authentication routes answer an unknown account compared with
an existing one, what limits the number of attempts a caller can make against
them and against the operator secret, who calls these routes and from which
network address, and which existing pieces (KV store, middleware packages,
environment modules, deployer templates, test lanes) a limit would be built
from.

## Summary

- No request limit exists anywhere in the API. `hono-rate-limiter@0.4.2` is
  declared in `package.json:145` and imported nowhere. Thirty failed logins in a
  row from one client all answered 401 on the unchanged API.
- Login already answers **401 on both failure paths**, contrary to the "404
  versus 400" in the review: the shared error mapper matches
  `/invalid credentials/i` before any category prefix. The two paths still
  differ in the error text (`Not Found error. Invalid credentials` versus
  `Validation error. Invalid credentials`) and in time, because only the
  wrong-password path runs bcrypt (about 90 ms versus 178 ms per request on the
  local API).
- Forgot-password answers 404 for an unknown address and 201 for a known one.
  Registration answers 404 `Identity already exists` for a taken address.
- `GET /authentication/init` creates a subject for every call without a usable
  token. Its only caller is the `init-default` client component mounted in the
  host root layout; every other authentication route is also called only from
  the browser. Telegram and MCP never call them.
- A wrong operator secret is neither logged nor counted. On an allow-listed
  route the request continues as anonymous (200 in the baseline); on a guarded
  route the subject is-authorized controller refuses it (401).
- The API is reached through Traefik, which strips client-supplied
  `X-Forwarded-For` and `X-Real-Ip` and sets both to the address it saw. In the
  default deployer that address is not the client: Traefik publishes its ports
  through the Docker Swarm routing mesh, which rewrites the source address to
  the ingress network, and Cloudflare proxies the DNS records by default.
- Counters shared across API processes can use the KV provider
  (`@sps/providers-kv`), whose Redis `incr` refreshes a TTL on every increment.
  The HTTP cache middleware is the precedent for version counters and for a
  fail-open, time-bounded KV guard.

## Detailed Findings

### 1. Authentication routes and their callers

The subject controller binds every authentication route in one table
(`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts`):
`GET /authentication/init` (`:135-139`), `POST .../email-and-password/registration`
(`:140-144`), `POST /authentication/ethereum-virtual-machine` (`:145-149`),
`POST /authentication/refresh` (`:150-154`), the OAuth routes (`:155-169`),
`POST .../email-and-password/authentication` (login, `:170-174`),
`POST .../forgot-password` (`:225-229`) and `POST .../reset-password`
(`:230-234`). None of these entries declares `middlewares`; the social-module
routes further down do (`:239-243` and on).

Callers, all through the subject SDK (`libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/authentication/**`,
which calls the server SDK action with `host: clientHost`):

| Route | Caller | Origin |
| --- | --- | --- |
| init | `.../frontend/component/src/lib/singlepage/authentication/init-default/ClientComponent.tsx:78-82,167`, mounted for every page in `apps/host/app/layout.tsx:42` | browser |
| refresh | same component, `:75-77,142-146` | browser |
| login | `authentication-form-default/ClientComponent.tsx`, embedded by `select-method-default` | browser |
| registration | `registration-form-default/ClientComponent.tsx` | browser |
| forgot-password | `forgot-password-form-default/ClientComponent.tsx` | browser |
| reset-password | none: `reset-password-form-default/ClientComponent.tsx` is commented out | no active caller |
| wallet login | `ethereum-virtual-machine-default/ClientComponent.tsx` | browser |

The `server.tsx` of each of these variants renders `Component.tsx`, which
renders `ClientComponent.tsx`, so the request always leaves the browser. Only
`me-default` and `is-authorized-wrapper-default` have a real server branch, and
both are read-only. Telegram obtains subjects through
`POST /api/rbac/subjects/telegram/bootstrap` with the operator secret and signs
its own tokens (`apps/telegram/src/lib/telegram-bot.ts:423-442,1323-1350`); MCP
and Studio reference none of these routes.

`init-default` calls `init` or `refresh` at most once per token state: a
`lastAuthActionRef` key is set before each call and reset only on success or a
valid token (`init-default/ClientComponent.tsx:112-179,214-220`). A 401 from
`refresh` clears both tokens (`:202-212`); any other refresh or init failure
leaves the key in place, so the component does not retry until the token state
changes or the page reloads.

Request bodies are multipart form data with one `data` field holding JSON
(`libs/shared/utils/src/lib/preapare-form-data-to-send.ts:1-19`). The account
identifier is `data.login` on login and registration, `data.email` on
forgot-password, and absent on reset-password (`code`, `password`,
`passwordConfirmation`), refresh (`refresh`) and wallet login (`address`,
`message`, `signature`). Controllers read it with `c.req.parseBody()` and
`JSON.parse(body["data"])`; Hono caches the parsed body on the request
(`node_modules/hono/dist/request.js:59`), so a middleware can read it before
the handler does.

### 2. Login: unknown account versus wrong password

The login request travels subject controller
(`.../controller/singlepage/authentication/email-and-password/authentication/index.ts:30-41`)
→ subject service (`.../service/singlepage/authentication/email-and-password.ts:58-65`)
→ identity server SDK over HTTP with the operator secret
(`libs/modules/rbac/models/identity/sdk/server/src/lib/singlepage/actions/email-and-password.ts:56-64`)
→ identity controller (`libs/modules/rbac/models/identity/backend/app/api/src/lib/controller/singlepage/email-and-password/index.ts:14-43`)
→ identity service `emailAndPassowrd`
(`libs/modules/rbac/models/identity/backend/app/api/src/lib/service/singlepage/index.ts:154-217`).

In the identity service:

- The lookup finds `email_and_password` identities by the lowercased login
  (`:154-177`).
- No identity: `throw new Error("Not Found error. Invalid credentials")`
  (`:179-181`), before any hashing.
- More than one identity: `Validation error. Multiple identities found`
  (`:183-185`). No salt: `Validation error. No salt found for this identity`
  (`:189-191`).
- Otherwise `bcrypt.hash(password, identity.salt)` (`:193-196`) and a string
  comparison; a mismatch throws `Validation error. Invalid credentials`
  (`:198-200`).
- On success a pending reset `code` is cleared (`:202-215`).

The shared mapper `getHttpErrorType`
(`libs/shared/backend/utils/src/lib/http-error/index.ts:10-131`) only reads a
category from a `[Category]` prefix (`parser/index.ts:3-12`); otherwise the
first matching entry of `httpErrorPatterns` wins, and the first entry is the
401 `Authentication error` list containing `/invalid credentials/i`
(`paterns/index.ts:4-22`). Both login messages therefore map to 401. Running
the mapper directly gave 401 for `Not Found error. Invalid credentials`,
`Validation error. Invalid credentials` and `Authentication error. Invalid credentials`.

The status survives the hop back to the subject controller: `responsePipe`
rethrows a non-2xx answer as `HTTPException(status, { message: JSON })` on the
server (`libs/shared/utils/src/lib/response-pipe.ts:171-178`), and the mapper
keeps `status` and `message` from that JSON (`http-error/index.ts:26-59`).
The exception filter answers `{ requestId, path, method, status, error, stack, cause }`
(`libs/shared/backend/api/src/lib/filters/exception/index.ts:107-118`); for
this chain `stack` and `cause` describe the subject controller's rethrow, so
they carry the same frames on both paths. The error text is the only field
that tells the two paths apart.

In the browser, `responsePipe` treats a 401 as an expired session only when
the message does not match `/invalid credentials/i`
(`response-pipe.ts:16,77-96`); the login form shows the server message through
`toast.error(error.message)` in the SDK wrapper
(`sdk/client/.../email-and-password/authentication.ts:51`) and does not branch
on status.

`changePassword` (`identity/.../service/singlepage/index.ts:220-272`) also
answers `Validation error. Invalid credentials` for a wrong current password;
it is reached by an authenticated subject for its own identity.

### 3. Forgot-password and reset-password

`forgot-password.ts`
(`.../controller/singlepage/authentication/email-and-password/forgot-password.ts:16-135`):

- Looks up `email_and_password` identities by `data.email` as sent, without
  lowercasing (`:30-47`).
- Unknown address: `Not Found error. No identities found` → 404 (`:49-51`).
- Several identities: `Authentication error. Multiple identities found`
  (`:53-55`), which the mapper answers with 403 through `/authentication/i`.
- No subject link: `Not Found error. No subjects to identities found`
  (`:57-75`).
- Known address: a code from `bcrypt.genSaltSync(10)` with `/` removed
  (`:77`) is stored on the identity (`:79-94`); the notification that would
  mail it is commented out (`:96-121`); the answer is `201 { data: { ok: true } }`
  (`:123-130`).

The host form shows `toast.success("Reset link sent")` on success
(`forgot-password-form-default/ClientComponent.tsx:34-38`).

`reset-password.ts` (`.../email-and-password/reset-password.ts:16-105`) finds
the identity by `code` (`:34-51`), answers 404 for an unknown code (`:53-55`),
treats a code older than one hour by `updatedAt` as expired (`:59-65`), and
stores `bcrypt.hash(password, identity.salt)` with the code cleared
(`:79-91`).

### 4. Registration

The identity service refuses a taken address with
`Not Found error. Identity already exists` → 404 (`identity/.../service/singlepage/index.ts:60-88`),
and an address held by an address-verifying provider with a validation error
(`:90-131`, the interim #280 guard). Registration then creates a subject, links
it and assigns registration roles (`subject/.../authentication/email-and-password.ts:71-143`).

### 5. `init` and `refresh`

`init.ts` (`.../controller/singlepage/authentication/init.ts:16-53`) passes the
caller's token to `service.init` (`.../service/singlepage/init.ts:44-105`),
which reuses a subject for a valid token of an existing subject and otherwise
creates one with `api.create({ data: {} })` (`:68-77`). The route is a `GET`
(`controller/singlepage/index.ts:135-139`); the server SDK action sends `GET`
(`sdk/server/.../authentication/init.ts:30-45`) and the client SDK wraps it in
a `useQuery` (`sdk/client/.../authentication/init.ts:23-64`). The HTTP cache
excludes `init`, `me` and `is-authorized`
(`libs/middlewares/src/lib/http-cache/routes/singlepage.ts:24-26`), and the
is-authorized allow-list admits `init` for both `GET` and `POST`
(`libs/middlewares/src/lib/is-authorized/routes/singlepage.ts:18-22`).

`refresh.ts` (`.../authentication/refresh.ts:19-72`) verifies the refresh token
through `service.refresh` and issues a new pair.

### 6. Operator secret handling

- `readRbacSecret(c)` reads the `X-RBAC-SECRET-KEY` header, then the
  `rbac.secret-key` cookie; `rbacSecretMatches` compares in constant time and
  refuses everyone when no secret is configured
  (`libs/shared/backend/utils/src/lib/rbac-secret/index.ts:12-36`).
- The global is-authorized middleware compares with `===`
  (`libs/middlewares/src/lib/is-authorized/index.ts:44-45,60`). A match marks
  the request privileged and skips the permission check (`:60-70`). A mismatch
  continues: an allow-listed route runs as anonymous (`:72-74`); any other
  route is checked by an HTTP call to `/api/rbac/subjects/authentication/is-authorized`
  that forwards the presented secret (`:76-113`).
- The subject is-authorized controller throws `Validation error. Unauthorized`
  for a present, wrong secret before any permission lookup
  (`.../authentication/is-authorized/index.ts:18-24`); the mapper answers 401
  through `/unauthorized/i`. `bill-route` follows the same structure.
- `RequestSubjectIdOwner` throws `Validation error. Wrong secret key` for a
  present, wrong secret
  (`libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-is-owner/index.ts:22-49`).
- `OperatorSecretMiddleware` guards service control routes and answers every
  refusal with the same 401 (`libs/middlewares/src/lib/operator-secret/index.ts:13-33`).

Who sends the secret: the API itself on every server SDK call it makes to its
own routes (identity service, subject service, is-authorized, bill-route and
owner middlewares), Telegram on its bot calls, MCP when it has no per-request
context (`apps/mcp/lib/auth-context.ts:15-32`) or forwards the client's secret
(`apps/mcp/lib/auth.ts:84-136`), and the browser admin through the
`rbac.secret-key` cookie read by `libs/shared/frontend/client/utils/src/lib/authorization/headers.ts:1-24`.
Server-side callers use `API_SERVICE_URL`, which the deployer sets to the swarm
service name `http://api:4000` for the API, host, Telegram and MCP
(`tools/deployer/api/api.env.j2:7` and the matching lines of the host,
Telegram and MCP templates), so their requests never pass through Traefik.
Browser requests use `NEXT_PUBLIC_API_SERVICE_URL`, the public API domain.

### 7. Absence of rate limiting

A search for `x-forwarded-for`, `x-real-ip`, `requestIP`, `getConnInfo`,
`cf-connecting-ip`, attempt counters and imports of `hono-rate-limiter` across
`apps/` and `libs/` finds nothing. The only limiter is the browser's
concurrent-request queue in
`libs/shared/frontend/client/api/src/lib/request-limmiter/index.ts:38-81`.
Traefik defines no rate-limit middleware (`tools/deployer/traefik/docker-compose.traefik.yaml.j2:32-44`
defines only the HTTPS redirect and the dashboard basic auth).

`hono-rate-limiter@0.4.2` exports `rateLimiter({ windowMs, limit, keyGenerator, store, handler, skip, ... })`
and a `Store` contract of `increment` returning `{ totalHits, resetTime }`,
`decrement` and `resetKey` (`node_modules/hono-rate-limiter/src/types.d.ts`).
It sets `Retry-After` on refusal when standard headers are on, calls
`decrement` after `next()` when the context is not finalized, and its default
refusal handler answers plain text. No Redis store package is installed.

### 8. KV store and counters

- `Provider` from `@sps/providers-kv` (`libs/providers/kv/src/lib/index.ts:5-72`)
  wraps Redis or Vercel KV by `KV_PROVIDER`. Keys are `${prefix}:${sha256(key)}`
  (`redis/index.ts:125-132`). `incr` refreshes the TTL on every increment when
  one is passed (`redis/index.ts:134-152`); `get`, `set`, `del` and
  `delByPrefix` complete the interface (`interface.ts:1-24`). The Redis client
  is a process singleton with `commandTimeout`, no offline queue and one retry
  (`redis/index.ts:36-49,86-119`).
- Middlewares create the provider in their constructor:
  `new StoreProvider({ type: KV_PROVIDER })` in the action logger
  (`libs/middlewares/src/lib/actions-logger/index.ts:37-42`) and the HTTP cache
  (`http-cache/index.ts:74-91`). The subject module creates one in a handler
  with an injectable factory and the prefix `rbac:subject:openrouter-model-favorites`
  (`.../openrouter/model-favorites.ts:7-35`).
- The HTTP cache version counters use `incr` with `KV_TTL`
  (`http-cache/index.ts:148-168`), and every KV call on that path goes through
  `createCacheGuard`, which answers a fallback on rejection or after
  `KV_COMMAND_TIMEOUT_MS` and reports failures once per interval
  (`http-cache/guard.ts:30-137`). Its log text names the HTTP cache.
- `KV_PROVIDER` defaults to `vercel-kv` unless set to `redis`
  (`libs/shared/utils/src/lib/envs/host.ts:54-55`); the deployer writes
  `KV_PROVIDER=redis` only when `REDIS_PASSWORD` is set (`tools/deployer/api/api.env.j2:92-98`).

### 9. Client address as seen by the API

- Bun serves `app.fetch` directly (`apps/api/server.ts:42-47`), so the Bun
  server object is Hono's `c.env` and `c.env.requestIP(c.req.raw)` returns
  `{ address, family, port }` or `null`. Hono's `getConnInfo` in `hono/bun`
  does the same, but importing `hono/bun` evaluates `var { write } = Bun` in
  `ssg.js`, which throws outside the Bun runtime (Jest runs under Node).
- Traefik v3.7 (`docker-compose.traefik.yaml.j2:4-21`) has no
  `forwardedHeaders` settings. For an untrusted source it removes incoming
  `X-Forwarded-*` and `X-Real-Ip` headers, sets `X-Real-Ip` to the connection
  address and appends that address to `X-Forwarded-For`
  ([forwarded_header.go](https://github.com/traefik/traefik/blob/master/pkg/middlewares/forwardedheaders/forwarded_header.go)).
- Traefik publishes `80:80` and `443:443` in the short syntax
  (`docker-compose.traefik.yaml.j2:6-8`), which a stack deploy publishes
  through the routing mesh. The mesh rewrites the source address to the ingress
  network, so the container does not see the client address; `mode: host`
  publishing bypasses it ([Docker docs](https://docs.docker.com/engine/swarm/ingress/),
  [moby#25526](https://github.com/moby/moby/issues/25526)). No template sets
  `mode: host`.
- Cloudflare records are created proxied by default
  (`tools/deployer/cloudflare/dns_records.yaml:12,50`, `USE_CLOUDFLARE_SSL=true`
  in `tools/deployer/.env.example:29`). The visitor address then travels in
  `CF-Connecting-IP` and in Cloudflare's `X-Forwarded-For`, which Traefik strips
  for an untrusted source.
- The API service has no `deploy.replicas` and runs one task by default
  (`tools/deployer/api/docker-compose.api.yaml.j2:18-30`).
- Local development and the scenario lane call the API on `localhost`
  (`apps/api/specs/scenario/singlepagestartup/issue-152/test-utils/env.ts:34-38`).

### 10. Middleware placement and composition

- Global middlewares are registered in `apps/api/app.ts` in this order: CORS
  (`:41-64`), exception filter (`:66-67`), static `/public/*` (`:69-114`),
  request id (`:116-117`), `OPTIONS` (`:119-121`), observer (`:123-124`), the
  WebSocket route (`:126-144`), revalidation (`:153-154`), the optional HTTP
  cache (`:162-166`), action logger (`:168-169`), is-authorized (`:171-172`),
  bill-route (`:174-175`) and parse-query (`:177-178`), then the module apps.
  The request id middleware writes `x-request-id` into the request headers
  (`libs/middlewares/src/lib/request-id/index.ts:10-17`).
- `libs/middlewares` exports each middleware as `Middleware` with
  `IMiddlewareGeneric` and, where configurable, `IMiddlewareOptions` under an
  alias (`libs/middlewares/src/lib/index.ts:1-39`). Configurable ones take
  options in the constructor and merge them with `routes/singlepage.ts` and
  `routes/startup.ts` (`is-authorized/index.ts:19-38`).
- The subject middleware package exports `Middleware` classes under
  `Request*` aliases (`libs/modules/rbac/models/subject/backend/app/middlewares/src/index.ts:1-20`);
  a class takes its dependencies in the constructor and route options in
  `init(options)` (`request-subject-can-manage-chat-agent-profile/index.ts:64-119`).
  The subject README requires domain guards to live there
  (`libs/modules/rbac/models/subject/README.md:20-22`).
- `DefaultApp.useRoutes` registers a route's middlewares with
  `hono.use(route.path, middleware)` before `hono.on(route.method, ...)`
  (`libs/shared/backend/api/src/lib/app/default/index.ts:72-82`), so a route
  middleware runs for every method on that path. A sub-app's errors go to its
  own `onError`, the same exception filter (`:53-58`).
- The rbac package cannot import `@sps/middlewares`: that package imports the
  rbac SDKs (`is-authorized/index.ts:12`, `actions-logger/index.ts:14-16`), and
  both belong to Nx projects that would then depend on each other.
  `@sps/backend-utils` cannot import `@sps/providers-kv`, which imports
  `@sps/backend-utils` for its logger (`redis/index.ts:14`).

### 11. From a thrown error to the response

Middlewares and handlers throw `HTTPException(status, { message, cause })`,
usually after `getHttpErrorType` (`request-subject-is-owner/index.ts:52-55`);
`OperatorSecretMiddleware` throws a fixed 401 directly. The mapper has no 429
category (`paterns/index.ts:3-123`). The filter answers with `c.json(...)`
(`filters/exception/index.ts:107-118`), and Hono builds that response from the
headers already set on the context (`node_modules/hono/dist/context.js:90-145`),
so a header set with `c.header()` before the throw reaches the client. The
filter logs every exception at error level (`:59-62`) and reports only 5xx to
Telegram (`:64-105`).

### 12. Environment variables and deployer wiring

- RBAC settings live in `libs/shared/utils/src/lib/envs/rbac.ts:1-53` as
  `Number(process.env[...]) || default` with a comment per value; KV settings
  and bounds in `envs/host.ts:51-96`.
- The deployer passes optional RBAC settings three ways: `api.sh` reads them
  with `get_env` (`tools/deployer/api.sh:26-36`) and passes them to the
  playbook (`:121-175`), and `api.env.j2` writes each one only when it is
  non-empty (`tools/deployer/api/api.env.j2:28-45`). `apps/api/create_env.sh`
  writes the local development file.

### 13. Tests and lanes

- `@sps/rbac` (one Nx project for all of `libs/modules/rbac`) runs Jest with
  `testPathIgnorePatterns` that skip every spec under
  `.../controller/singlepage/authentication/email-and-password` and
  `.../authentication/is-authorized` (`libs/modules/rbac/jest.config.ts:4-8`).
  The two specs there are placeholders that assert `false === true`.
- `@sps/middlewares` has a `jest:test` target (`libs/middlewares/project.json:6-9`)
  and is not in the `test:unit:scoped` list (`package.json:29`), which does
  include `@sps/rbac`. `@sps/backend-utils` and `@sps/shared-utils` have
  `jest:test`, `eslint:lint` and `tsc:build` targets.
- Patterns: the operator-secret spec mounts the middleware on `new Hono()` and
  asserts statuses (`operator-secret/index.spec.ts:28-117`); the HTTP cache spec
  mocks `@sps/providers-kv` and assigns a recording store to
  `middleware.storeProvider` (`http-cache/index.spec.ts:11-91,258-274`); the
  guard spec injects `now` (`guard.spec.ts:96-124`); the identity service spec
  mocks the identity SDK with an in-memory filter and uses the real bcrypt
  (`identity/.../service/singlepage/index.spec.ts:18-73`) and covers
  registration only.
- The scenario lane logs in once per suite in `beforeAll`, four times in total,
  against `localhost` (`issue-152/test-utils/auth.ts:22-62`,
  `issue-154/backend-social-chat-threads.scenario.spec.ts:237-274`,
  `issue-158/backend-openrouter-billing.scenario.spec.ts:308-318`).

## Runtime baseline (unchanged API on port 4310)

The worktree API ran with the local PostgreSQL and Redis; a throwaway account
was registered, probed and deleted afterwards.

| Probe | Result |
| --- | --- |
| login, unknown email | 401, keys `cause error method path requestId stack status` |
| login, wrong password | 401, same keys |
| login error text equal on both paths | false |
| mean time over 5 requests, unknown / wrong password | 90.3 ms / 178.2 ms |
| login, correct password | 201, key `data` |
| forgot-password, unknown / known address | 404 / 201 |
| registration of a taken address | 404 |
| wrong operator secret on `GET /api/rbac/permissions` (allow-listed) | 200 |
| wrong operator secret on `GET /api/rbac/identities` | 401 |
| 30 failed logins from one client | 30 × 401, no refusal |
| API log lines about the wrong secrets | none |

## Code References

- `libs/modules/rbac/models/identity/backend/app/api/src/lib/service/singlepage/index.ts:154-217` - login branch of `emailAndPassowrd`
- `libs/modules/rbac/models/identity/backend/app/api/src/lib/service/singlepage/index.ts:60-88` - taken address on registration
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/email-and-password/forgot-password.ts:30-130` - lookup, 404 and 201 answers
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/email-and-password/reset-password.ts:16-105` - reset by code
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:109-234` - authentication route table
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/init.ts:44-105` - subject reuse or creation
- `libs/middlewares/src/lib/is-authorized/index.ts:40-121` - secret comparison and forwarding
- `libs/shared/backend/utils/src/lib/rbac-secret/index.ts:12-36` - secret reader and constant-time comparison
- `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts:3-123` - status mapping order
- `libs/shared/backend/api/src/lib/filters/exception/index.ts:19-119` - error response shape
- `libs/middlewares/src/lib/http-cache/index.ts:69-168` - KV provider, version counters
- `libs/middlewares/src/lib/http-cache/guard.ts:30-137` - fail-open KV guard
- `libs/providers/kv/src/lib/redis/index.ts:134-152` - `incr` with TTL refresh
- `libs/shared/backend/api/src/lib/app/default/index.ts:72-82` - route middleware registration
- `apps/api/app.ts:116-178` - global middleware order
- `apps/api/server.ts:42-47` - Bun server as `c.env`
- `tools/deployer/traefik/docker-compose.traefik.yaml.j2:4-21` - Traefik ports and entrypoints
- `tools/deployer/cloudflare/dns_records.yaml:12,50` - proxied records
- `libs/modules/rbac/jest.config.ts:4-8` - ignored authentication controller specs

## Architecture Documentation

- Backend flow is repository → service → controller → app; controllers compose
  routes, route middleware instances and handlers, and route middleware lives in
  the module's `backend/app/middlewares/src/lib/<name>/index.ts`.
- Middleware classes expose `init()` returning a Hono `MiddlewareHandler`;
  constructor options are the project seam, merged with `singlepage` and
  `startup` rule files where a middleware carries rules.
- Errors are thrown as messages whose wording selects the status through the
  shared pattern table, or as `HTTPException` with an explicit status, and are
  answered by one exception filter per app.
- Environment values are read once through `libs/shared/utils/src/lib/envs/*.ts`
  with defaults in code; the deployer writes optional values only when set.
- KV keys are namespaced by a prefix and hashed by the provider; counters use
  `incr` with a TTL.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-234.md:55-93` documents the
  `init-default` component guard and the `init` and `refresh` controllers
  before subject reuse landed.
- `thoughts/shared/plans/singlepagestartup/ISSUE-234.md:17,41` records that
  #234 left the missing rate limit and the `GET` method of `init` to SEC-18.
- `thoughts/shared/research/singlepagestartup/ISSUE-233.md:36,111` documents
  the KV provider primitives and the version-counter model, and `:115-118`
  that Traefik access logging was off during the crawler incident.
- `thoughts/shared/research/singlepagestartup/ISSUE-229.md:173-175` lists the
  401 patterns, including `/invalid credentials/i`.
- `thoughts/shared/research/singlepagestartup/ISSUE-215.md:34-151` covers the
  Traefik entrypoints and swarm network wiring.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-234.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-233.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-229.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-215.md`

## Open Questions

- The per-address key depends on the address chain: with the default deployer
  every browser request reaches the API from the ingress network address. Which
  deployment topology operators run (routing mesh or `mode: host`, Cloudflare
  proxied or not, Traefik `trustedIPs`) is not recorded in the repository.
- `init` could become a `POST` only by changing the client SDK from `useQuery`
  to a mutation and the component from `refetch()` to `mutate()`, while hosts
  built before the change keep sending `GET` until they are redeployed.
