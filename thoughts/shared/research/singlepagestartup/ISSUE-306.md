---
date: 2026-09-26T00:15:00+03:00
researcher: flakecode
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-306-cache-public-only
repository: singlepagestartup
topic: "Scope the HTTP cache to the requesting principal"
tags: [research, codebase, http-cache, is-authorized, rbac, credentials, scenario]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Scope the HTTP cache to the requesting principal

**Date**: 2026-09-26
**Researcher**: flakecode
**Git Commit**: 78d7d43125
**Branch**: claude/issue-306-cache-public-only
**Repository**: singlepagestartup

## Research Question

Which requests does the API's HTTP response cache read and write, where does it
sit relative to authorization, which callers send credentials on GET requests,
and what depends on the current behavior? The ticket (finding N-04 of the
2026-09-25 review) states that a response produced for a credentialed
caller is stored under its URL and replayed to any later caller of that URL.

## Summary

- The cache middleware is registered after revalidation and before action
  logging, `is-authorized`, bill-route and query parsing
  (`apps/api/app.ts:153-178`). A hit returns from inside the middleware
  (`libs/middlewares/src/lib/http-cache/index.ts:301-310`), so no later
  middleware, authorization included, runs for it. The order is asserted by
  `apps/api/specs/singlepage/index.spec.ts:25-72`.
- A GET is cacheable when it is not excluded and does not send
  `Cache-Control: no-store` (`index.ts:258-260`). The key is the request URL
  without query, the path and topic generation vector, and a hash of the query
  string (`index.ts:238-239,56-67`; `libs/providers/kv/src/lib/redis/index.ts:139-181`).
  No credential takes part in the decision or the key.
- A 2xx response to a cacheable GET is written back after `next()` in a
  fire-and-forget block (`index.ts:365-386`); a 2xx mutation bumps its path
  and topic versions whatever its exclusion state (`index.ts:320-363`).
- The request carries a credential in one of four places, and every backend
  reader uses those four names: the `Authorization` header and the
  `rbac.subject.jwt` cookie for a subject token
  (`libs/shared/backend/utils/src/lib/authorization/index.ts:4-11`), and the
  `X-RBAC-SECRET-KEY` header and the `rbac.secret-key` cookie for the operator
  secret (`libs/shared/backend/utils/src/lib/rbac-secret/index.ts:12-14`).
  `is-authorized` reads the same four inline (`libs/middlewares/src/lib/is-authorized/index.ts:44-48`).
- An anonymous request (none of the four) is admitted by the allow-list
  (`is-authorized/routes/singlepage.ts:9-76`) or by a permission row without a
  role, unless the route is sensitive
  (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts:230-245`).
  The product catalog is public through role-less rows, not the allow-list: the
  seed rows for `GET /api/ecommerce/products` and `/api/ecommerce/products/[id]`
  have no role.
- Production runs the cache with `MIDDLEWARE_HTTP_CACHE=true` and
  `KV_TTL=43200` (`apps/api/.env.production:19,21`); the deployer renders both
  inside its `REDIS_PASSWORD` block (`tools/deployer/api/api.env.j2:92-99`); the
  code default TTL is 30 seconds (`libs/shared/utils/src/lib/envs/host.ts:59`).
- The DB-backed scenario for issue 152 asserts that a subject's own cart list,
  read with its Bearer token, is stored in the cache
  (`apps/api/specs/scenario/singlepagestartup/issue-152/backend-cart.scenario.spec.ts:240-279`).
- `is-authorized` keeps its own 30-second cache of positive decisions
  (`is-authorized/index.ts:28-29,83-113`). It is independent of the response
  cache and outside this change.

## Detailed Findings

### Registration order and what a hit skips

- `apps/api/app.ts:153-154` registers `RevalidationMiddleware`, `:162-166`
  registers `HTTPCacheMiddleware` and its clear route when
  `MIDDLEWARE_HTTP_CACHE === "true"`, then `ActionLoggerMiddleware` (`:168-169`),
  `IsAuthorizedMiddleware` (`:171-172`), `BillRouteMiddleware` (`:174-175`) and
  `ParseQueryMiddleware` (`:177-178`).
- The comment at `app.ts:156-161` states that authorized requests can be cached
  and served to unauthorized users and that `Cache-Control: no-store` on the
  request is the mitigation.
- The order is load-bearing for issue 195: the cache's awaited mutation bumps
  unwind before the revalidation broadcast (`app.ts:146-152`;
  `libs/middlewares/src/lib/http-cache/README.md:153-159`). The contract test
  also asserts that authorization is registered after the cache
  (`apps/api/specs/singlepage/index.spec.ts:70`).
- On a hit the middleware answers with status 200, the stored body and a
  `Content-Type: application/json` header, before `next()` (`index.ts:301-310`).

### The cacheable-GET decision and the key

- `index.ts:238-248` reads the query string, the URL without query, the
  pathname, the method and `Cache-Control`.
- `index.ts:258-260`: `isCacheExcluded` from the layered exclusion matcher, then
  `isCacheableGet = method === "GET" && cacheControl !== "no-store" && !isCacheExcluded`.
- `index.ts:269-287`: for a cacheable GET the path version and the topic
  versions are read through the fail-open guard; `isCacheAddressable` is true
  only when both reads answered (issue 233).
- `index.ts:289-311`: lookup under `buildVersionedDataPrefix(path, ...)` with the
  query string as key.
- `index.ts:365-386`: write-back of a 2xx body when `isCacheAddressable`, capped
  by `HTTP_CACHE_MAX_ENTRY_BYTES` (`index.ts:192-219`).
- `index.ts:387-400`: a 5xx bumps the path and path-without-id versions; other
  non-2xx responses write nothing.
- The README describes the cache as identity-blind and names `no-store` and
  exclusions as the only ways to keep a response unshared
  (`libs/middlewares/src/lib/http-cache/README.md:6-9`).

### Exclusions

- `routes/singlepage.ts:18-60`: infrastructure paths (revalidation, http-cache,
  broadcast, favicon, the `me`, `init` and `is-authorized` probes), the issue-152
  cart counters, the issue-195 chat reads, and the issue-270 identity, subject,
  subjects-to-identities and roles families. The issue-270 comment names the
  cache-before-authorization order as the reason for the last group
  (`routes/singlepage.ts:49-55`).
- `routes/startup.ts:25` is empty; `IMiddlewareOptions.excludedRoutes` is the
  constructor seam (`index.ts:38-41`). `apps/api/app.ts:163` passes no options.
- `routes/index.spec.ts:43-80` pins the counter and chat exclusions and the
  extension seams.

### Mutation bumps

- `index.ts:320-363`: after a 2xx `PUT`, `PATCH`, `POST` or `DELETE`, the
  middleware awaits `INCR` on `/rbac/permissions`, the path without a trailing
  UUID, the full path for `PUT`/`PATCH`, the path up to the first UUID for
  `POST`/`DELETE`, the `/bulk`-less path, and every topic resolved for the
  pathname. The exclusion gate does not skip this block (comment at
  `index.ts:250-257`). Nothing in the block reads a credential.

### Credential readers

- `libs/shared/backend/utils/src/lib/authorization/index.ts:4-11` (exported as
  `authorization` from `@sps/backend-utils`, `lib/index.ts:1`): the
  `rbac.subject.jwt` cookie, else the `Authorization` header without the
  `Bearer ` prefix.
- `libs/shared/backend/utils/src/lib/rbac-secret/index.ts:12-14`
  (`readRbacSecret`): the `X-RBAC-SECRET-KEY` header, else the `rbac.secret-key`
  cookie. `rbacSecretMatches` (`:23-36`) compares in constant time and is used
  by the operator-secret middleware (`libs/middlewares/src/lib/operator-secret/index.ts:27`).
- `authorization` is imported by the subject controllers and middlewares that
  read the caller's token, for example the owner middleware
  (`libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-is-owner/index.ts:6,32`)
  and the cart list handler (`.../controller/singlepage/ecommerce-module/order/list.ts:5,31`).
- A search of the backend packages for request header and cookie reads finds no
  other credential channel: the remaining reads are `Content-Type`, `Host`,
  `x-request-id`, `X-Client-ID` (WebSocket), `Cache-Control`, the
  `X-SPS-SKIP-ACTION-LOGGER` response header, the payment webhook headers
  (POST only) and the OAuth exchange cookie (`POST /authentication/oauth/exchange`,
  `.../controller/singlepage/index.ts:156-160`). The OAuth callback is a GET that
  answers with a 302 (`.../authentication/oauth/callback.ts:51`), which the cache
  never stores.

### How an anonymous request is decided

- `is-authorized/index.ts:60-74`: a matching operator secret or an allow-listed
  route skips the subject service; otherwise the subject service decides, with a
  30-second positive cache keyed by method, path, token and secret
  (`:83-113`).
- `is-authorized/routes/singlepage.ts:9-76`: the allow-list (host,
  website-builder and file-storage reads, host page reads, permissions,
  roles-to-permissions, subjects-to-roles, authentication probes, broadcast
  channels, public files).
- `.../service/singlepage/is-authorized.ts:166-187`: without a token no subject
  is resolved; `:230-245`: a matched permission with no role authorizes unless
  `isSensitiveRoute` matches (`.../permission/.../service/singlepage/sensitive-routes.ts:22-43`);
  `:270-273`: otherwise a `Permission error` (403).
- Seed: `GET /api/ecommerce/products`, `/api/ecommerce/products/[ecommerce.products.id]`
  and `/api/ecommerce/products/count` have no role
  (`libs/modules/rbac/models/permission/backend/repository/database/src/lib/data/*.json`
  joined with `.../relations/roles-to-permissions/.../data/*.json`).
  `GET /api/agent/agents`, `/api/rbac/actions` and
  `/api/notification/notifications` have no permission row, so an anonymous
  read of them is refused.

### Callers that send GET requests

The shared fetch wrappers decide what a GET carries; no reviewed path produces
an `Authorization` header without a token (`Bearer undefined` does not occur).

| Caller                                                                                                                                                                                                                                                                                                    | GET without a signed-in visitor                                              | GET with a signed-in visitor                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Browser client SDK: `find`, `findById`, `count` through `saturateHeaders` (`libs/shared/frontend/client/utils/src/lib/saturate-headers/index.ts:3-15`, `.../authorization/headers.ts:1-24`) and the shared actions (`libs/shared/frontend/api/src/lib/actions/find/index.ts:23-68`)                       | no credential until `init` has run                                           | `Authorization: Bearer <jwt>`                                |
| Host server rendering: `find-by-url`, `urls`, `url-segment-value` and the server factory (`apps/host/app/[[...url]]/page.tsx:14-32,60-86`; `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:18-76`; `libs/shared/frontend/server/api/src/lib/factory/index.ts:37-131`) | no credential                                                                | no credential; the visitor's cookie is not read on this path |
| `GET /api/rbac/subjects/authentication/init` (`libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/authentication/init.ts:23-54`)                                                                                                                                                              | no credential, `Cache-Control: no-store`, route excluded                     | not called while a valid token exists                        |
| Host page service loopback reads of whole collections (`libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:203-222`)                                                                                                                                                       | operator secret, no `Cache-Control`                                          | same                                                         |
| MCP tool calls (`apps/mcp/lib/auth.ts:84-136`)                                                                                                                                                                                                                                                            | refused without a credential                                                 | `X-RBAC-SECRET-KEY` or `Authorization`                       |
| Telegram bot (`apps/telegram/src/lib/telegram-bot.ts:577-585` and siblings)                                                                                                                                                                                                                               | operator secret and `Cache-Control: no-store`                                | same                                                         |
| The API's own `is-authorized` self-call (`libs/middlewares/src/lib/is-authorized/index.ts:77-104`)                                                                                                                                                                                                        | `Cache-Control: no-store`, credentials only if the original request had them | same                                                         |

- Every browser receives a subject token: the root layout mounts the `init`
  component for every visitor without a valid token (`apps/host/app/layout.tsx:42`;
  `.../authentication/init-default/ClientComponent.tsx:112-179`), and from then
  on the client SDK sends that token with each request (`saturateHeaders`).
- Only build-time requests send `Cache-Control: no-store` from the shared
  actions (`NEXT_PHASE === PHASE_PRODUCTION_BUILD`, `find/index.ts:32-35`); the
  chat timeline, `init`, the Telegram bot and the `is-authorized` self-call send
  it unconditionally.
- A production container runs migrations and the seed in the background at
  start (`start.sh:10-14`, `migrate.sh:7-27`), and the seed ends by calling the
  operator-guarded clear route (`apps/api/src/db/seed.ts:393-407`).

### Environment and deployment

- `libs/shared/utils/src/lib/envs/host.ts:53-59,95-96,113`: `KV_PROVIDER`,
  `KV_HOST`, `KV_PORT`, `KV_TTL` (default 30), `HTTP_CACHE_MAX_ENTRY_BYTES`,
  `MIDDLEWARE_HTTP_CACHE`.
- `apps/api/.env.production:19,21`: `KV_TTL=43200`, `MIDDLEWARE_HTTP_CACHE=true`.
- `tools/deployer/api/api.env.j2:92-99`: `KV_*`, `MIDDLEWARE_HTTP_CACHE` and
  `KV_TTL` are rendered only when `REDIS_PASSWORD` is set.
- `tools/testing/test-scenario-issue.sh:28,63,171-210`: the scenario runner
  starts the API with the cache on by default and fails its preflight unless
  the operator-guarded clear route answers 200.

### Tests that pin the current behavior

- `libs/middlewares/src/lib/http-cache/index.spec.ts`: key building, clear-route
  access, exclusion gate versus mutation bumps, bump and broadcast topic parity,
  fail-open behavior, bounded generations. It mocks `@sps/backend-utils`
  (`:17-32`) with a header-only `readRbacSecret` and no `authorization`, and its
  context double exposes no `req.raw` (`:98-128`).
- `apps/api/specs/singlepage/index.spec.ts:25-72`: registration order.
- `apps/api/specs/scenario/singlepagestartup/issue-152/backend-cart.scenario.spec.ts:240-279`:
  the subject's Bearer-token read of `/api/rbac/subjects/:id/ecommerce-module/orders`
  must be found in the cache; the counters must not. The scenario README repeats
  that other endpoints stay cacheable (`apps/api/specs/scenario/README.md:25-31`).

### The authorization decision cache

- `is-authorized/index.ts:28-29`: an `inFlight` map and a memory cache with a
  30-second TTL and 5000 entries; `:83-113`: the key is
  `method:path:token:secret`, a hit skips the subject service, and a successful
  check stores `true`. The subject service keeps a separate 30-second role cache
  (`.../service/singlepage/is-authorized.ts:9,42-83`). Neither cache stores a
  response body.

## Code References

- `apps/api/app.ts:146-178` - middleware order and the cache comment
- `libs/middlewares/src/lib/http-cache/index.ts:236-407` - the cache middleware body
- `libs/middlewares/src/lib/http-cache/README.md:1-174` - cache contract document
- `libs/middlewares/src/lib/http-cache/routes/singlepage.ts:18-60` - framework exclusions
- `libs/middlewares/src/lib/is-authorized/index.ts:28-120` - authorization middleware
- `libs/middlewares/src/lib/is-authorized/routes/singlepage.ts:9-76` - allow-list
- `libs/shared/backend/utils/src/lib/authorization/index.ts:4-11` - subject token reader
- `libs/shared/backend/utils/src/lib/rbac-secret/index.ts:12-36` - operator secret reader and comparison
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts:151-279` - anonymous and subject decision
- `apps/api/specs/scenario/singlepagestartup/issue-152/backend-cart.scenario.spec.ts:240-279` - scenario that expects a token-bearing read to be cached
- `apps/api/specs/scenario/README.md:25-31` - scenario cache notes

## Architecture Documentation

- Route-rule layering: each middleware composes constructor options,
  `routes/startup.ts` and `routes/singlepage.ts` through
  `createLayeredRouteMatcher`; `deny` rules subtract a framework default.
- Request helpers that read credentials live in `@sps/backend-utils`
  (`authorization`, `readRbacSecret`, `rbacSecretMatches`); middlewares and
  controllers import them instead of reading header and cookie names.
- The cache's KV calls go through the fail-open guard (`http-cache/guard.ts`);
  cache decisions never fail a request.

## Historical Context (from thoughts/)

- `thoughts/shared/plans/singlepagestartup/ISSUE-195.md:16,242,287-288`: chat
  timeline fetches send `Cache-Control: no-store`; the plan moved revalidation
  before the cache and made mutation bumps awaited.
- `thoughts/shared/research/singlepagestartup/ISSUE-233.md:36-41`: key shape
  including scheme and host, the host page service reading whole collections
  with the operator secret and no `Cache-Control`, the host layout calling
  `init` for every browser without a token, and the cache-before-authorization
  order.
- `thoughts/shared/processes/singlepagestartup/ISSUE-195.md:63-65`: production
  `KV_TTL=43200` made server-side exclusions load-bearing.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-195.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-233.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-234.md`
- `thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md` (N-04; local only)

## Open Questions

None blocking. The plan decides whether a public-route matcher is needed on
top of a credential gate. One migration fact matters for any fix: bodies already stored for
credentialed callers stay addressable under their URL until they expire, a
mutation bumps their path or topic, or the clear route runs.
