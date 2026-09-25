Closes #306.

## Summary

The API's HTTP response cache answers before `is-authorized` and keys a body by URL alone. A response produced for a caller that presented a subject token or the operator secret was stored under its URL and could be replayed to a later caller of the same URL without authorization.

The cache now serves and stores bodies only for requests that carry no credential. A credentialed GET always reaches authorization and its handler; a GET without credentials keeps its cache hits.

## Changes

- `libs/middlewares/src/lib/http-cache/index.ts`: the cacheable-GET decision also requires that the request presents none of the four credentials the API accepts: the `Authorization` header, the `rbac.subject.jwt` cookie, the `X-RBAC-SECRET-KEY` header and the `rbac.secret-key` cookie. A private `hasCredentials(c)` composes the existing `authorization` and `readRbacSecret` helpers from `@sps/backend-utils`, so no header or cookie name is repeated. Presence decides, not validity: an expired or forged token still reaches authorization and its refusal.
  - Every stored body now comes from a request without credentials that `is-authorized` admitted on the miss, so no public-route list is needed, and role-less public reads such as the product catalog stay cacheable without a permission lookup in front of each hit.
  - Unchanged: mutation version bumps (they run for credentialed writes too, since those invalidate anonymous reads), `Cache-Control: no-store`, the exclusion routes, the clear route and the registration order in `apps/api/app.ts`.
- `libs/middlewares/src/lib/http-cache/index.spec.ts`: a BDD suite on a Hono app with an in-memory store covers the anonymous hit; each of the four credential channels, which neither read nor replace a stored body; a credentialed response never reaching a later anonymous caller; a credentialed POST still rotating the key; and `no-store` still bypassing. The `@sps/backend-utils` mock takes the real credential readers, and the context double carries a real `Request`.
- `apps/api/specs/scenario/singlepagestartup/issue-152/backend-cart.scenario.spec.ts`: the cache scenario expects none of the subject's token-bearing cart reads to be cached and an anonymous product read to be.
- `libs/middlewares/src/lib/http-cache/README.md`, the comment in `apps/api/app.ts`, the issue-270 comment in `libs/middlewares/src/lib/http-cache/routes/singlepage.ts` (rules unchanged) and `apps/api/specs/scenario/README.md` describe the contract.

## Verification

- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/middlewares:jest:test`: 10 suites, 75 tests (64 before).
- [x] Mutation check: without the credential condition the 8 credential scenarios fail and the rest pass. Keeping only the subject-token reader fails the 4 operator-secret cases; keeping only the operator-secret reader fails the 4 subject-token cases.
- [x] `npx tsc --noEmit -p libs/middlewares/tsconfig.json` and `npx tsc --noEmit -p apps/api/specs/scenario/tsconfig.json`: clean.
- [x] `npx eslint libs/middlewares/src/lib/http-cache` (the package has no `eslint:lint` target): clean. `npx nx run api:eslint:lint`: 0 errors, 2 existing warnings in untouched jest configs.
- [x] `npx nx run api:jest:test`: 2 suites, 4 tests, including the middleware order contract.
- [x] Issue-152 backend scenario against a running API with the cache on: 4 tests pass. Against the unfixed middleware the rewritten test fails on the cart-list assertion.
- [x] HTTP against a local API with `MIDDLEWARE_HTTP_CACHE=true`:
  - Anonymous `GET /api/ecommerce/products?limit=1` and `GET /api/host/pages/find-by-url?url=/`: the first request stores one data key. The second, three seconds later, is served from it: the key's TTL keeps running down instead of being reset by a write-back, and Redis records one more hit.
  - A subject token from `init` on `GET /api/rbac/subjects/:id/ecommerce-module/orders`, as a header and as a cookie: 200, no data key. The same URL without credentials: 400.
  - The operator secret on `GET /api/agent/agents?limit=1`, as a header and as a cookie: 200, no data key. The same URL without credentials: 403.
  - `POST /api/ecommerce/products` with the operator secret rotates the path and topic versions; the next anonymous read stores a new body.
  - On the unfixed middleware the same credentialed reads were stored, and the same URLs without credentials answered 200 with the stored bodies.

## Notes

- **Deploy step.** Bodies stored for credentialed callers before this change stay addressable by URL until they expire (`KV_TTL`), a mutation bumps their path or topic, or the clear route runs. `start.sh api` runs the seed in the background and the seed ends by calling the clear route. A deployment that does not run it calls `GET /api/http-cache/clear` with `X-RBAC-SECRET-KEY` once after the upgrade. Verified locally: after the upgrade, entries written earlier still answered requests without credentials until the clear route ran.
- **Cost.** Credentialed reads no longer get cache hits. Browsers send a subject token once `init` has run, so their client-side reads reach the handler, as do MCP and other operator-secret callers. Server-rendered page reads send no credential and keep hitting.
- `KV_TTL`, the exclusions and the client SDKs are unchanged; no new environment variable.

## Downstream migration

Assembled from the commit trailers; the records commit needs no action.

- **Reason:** bodies stored before the upgrade for credentialed callers stay addressable by URL until they expire, and credentialed GETs no longer get cache hits.
- **Applies to:** projects that run the API with `MIDDLEWARE_HTTP_CACHE=true`, and projects whose tests expect a token-bearing or operator-secret GET to be cached.
- **Actions:**
  - Clear the HTTP cache once right after deploying (`GET /api/http-cache/clear` with `X-RBAC-SECRET-KEY`) unless the start-up seed already calls it.
  - Rewrite tests that expect a credentialed GET to be cached so they expect it not to be, and prove caching with a request that carries no credential.
  - Plan for more handler and database load from credentialed reads; do not add a route or option that lets credentialed requests read or write the cache.

_Verify:_ with `MIDDLEWARE_HTTP_CACHE=true`, a GET with `Authorization`, `X-RBAC-SECRET-KEY` or either RBAC cookie leaves no `http-cache:data` key for its URL, the same URL without credentials answers with its own status, and a public GET without credentials is stored and then served from the cache.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
