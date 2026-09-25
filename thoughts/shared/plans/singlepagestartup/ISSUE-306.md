---
date: 2026-09-26T00:40:00+03:00
issue_number: 306
repository: singlepagestartup
topic: "Scope the HTTP cache to the requesting principal"
status: approved
---

# Scope the HTTP cache to the requesting principal Implementation Plan

## Overview

The HTTP response cache answers before authorization and keys bodies by URL
alone, so a body produced for a credentialed caller can be replayed to anyone
who requests the same URL. After this change the cache reads and writes bodies
only for requests that carry no credential.

## Current State Analysis

- The cache middleware runs before `is-authorized` (`apps/api/app.ts:153-178`)
  and returns a hit before `next()` (`libs/middlewares/src/lib/http-cache/index.ts:301-310`).
- `isCacheableGet` is `GET`, not `Cache-Control: no-store`, not excluded
  (`index.ts:258-260`); a 2xx body is written back after `next()`
  (`index.ts:365-386`). No credential takes part.
- The four credential names are read by `authorization` (subject token: cookie
  `rbac.subject.jwt`, header `Authorization`) and `readRbacSecret` (operator
  secret: header `X-RBAC-SECRET-KEY`, cookie `rbac.secret-key`) in
  `@sps/backend-utils` (`libs/shared/backend/utils/src/lib/authorization/index.ts:4-11`,
  `libs/shared/backend/utils/src/lib/rbac-secret/index.ts:12-14`).
- Production runs the cache with `KV_TTL=43200` (`apps/api/.env.production:19,21`).
- The issue-152 scenario asserts that a subject's token-bearing cart read is
  cached (`apps/api/specs/scenario/singlepagestartup/issue-152/backend-cart.scenario.spec.ts:240-279`).

## Desired End State

- A GET that presents any of the four credentials never receives a stored body
  and never stores one: it reaches `is-authorized`, the route middleware and its
  handler every time.
- A GET without a credential behaves as today: answered from the cache on a
  hit, stored after a 2xx miss, unless it is excluded or sends
  `Cache-Control: no-store`.
- A successful mutation bumps its path and topic versions whatever credential
  it carries, so the anonymous reads it affects miss afterwards.
- The cache README, the comment in `apps/api/app.ts`, the issue-270 exclusion
  comment and the scenario README describe that contract.
- Verified by the middleware unit suite (including a mutation check of the
  gate) and by HTTP requests against an API on port 4306 with
  `MIDDLEWARE_HTTP_CACHE=true`.

### Key Discoveries:

- Stored bodies can only come from requests the cache lets through to the
  handler. If a credentialed request never writes and never reads, every stored
  body was produced for a caller without a credential that `is-authorized`
  admitted on that miss (allow-list or role-less permission), and it is only
  replayed to another caller without a credential. Only 2xx responses are
  stored (`index.ts:367`), so a refused anonymous request stores nothing.
- The product catalog is public through role-less permission rows, not the
  `is-authorized` allow-list (seed rows for `GET /api/ecommerce/products` and
  `/api/ecommerce/products/[id]` carry no role). Gating on the allow-list would
  stop caching the catalog; gating on the permission rows would need a
  permission lookup before every hit.
- Server-rendered page reads send no credential (`apps/host/app/[[...url]]/page.tsx:14-32,60-86`,
  the host page server actions and the server factory), so they keep hitting.
  Browser client reads carry `Authorization` after `init`, which the host
  layout runs for every visitor (`apps/host/app/layout.tsx:42`).
- MCP and the Telegram bot always present the operator secret; Telegram and the
  `is-authorized` self-call already send `Cache-Control: no-store`.

## What We're NOT Doing

- Not moving the cache after `is-authorized` and not adding the principal to
  the key. Either changes the cache from a shared public cache into a
  per-caller one, which is a separate design.
- Not gating on the `is-authorized` allow-list or the permission rows, which
  the ticket's scope names. The credential gate alone guarantees that a stored
  body was admitted for a caller without a credential; a route matcher on top
  would either drop caching for role-less public reads such as the catalog or
  put a permission lookup in front of every hit.
- No configuration switch for the gate. It refuses no request and removes no
  route; it only stops one caller's body from reaching another, and a switch to
  turn it off would reopen the finding.
- Not changing `KV_TTL`, adding per-route TTLs, changing the exclusion rules or
  the `Cache-Control: no-store` handling.
- Not changing the client or server SDKs, and not changing `is-authorized`,
  its inline credential reads or its own decision cache; the ticket's agreed
  scope is the response cache.
- Not rewriting the key format to orphan entries written before the upgrade;
  see Migration Notes.

## Implementation Approach

Add one condition to the existing cacheable-GET decision: the request carries no
credential. The check reuses the two readers in `@sps/backend-utils`, so the
cache and the handlers agree on what a credential is and no header or cookie
name is repeated. The decision stays presence-based, not validity-based: an
expired or forged token still reaches authorization and gets its refusal
instead of a stored public body. The mutation bump block and the 5xx bump do
not read the decision, so they keep running for every caller.

## Phase 1: Credential gate in the HTTP cache middleware

### Overview

Credentialed GETs bypass the lookup and the write-back; everything else in the
middleware stays as it is.

### Changes Required:

#### 1. Cache middleware

**File**: `libs/middlewares/src/lib/http-cache/index.ts`
**Why**: `isCacheableGet` (`:258-260`) is the single gate for both the lookup
and the write-back (`isCacheAddressable` is only set inside it).
**Changes**: import `authorization` and `readRbacSecret` from
`@sps/backend-utils` (the file already imports `logger` from there); add a
private method beside the other private helpers that reports whether the
request presents a credential; add that condition to `isCacheableGet`; extend
the gate comments to state the contract and that mutation bumps still run for
credentialed requests.

#### 2. Middleware unit suite

**File**: `libs/middlewares/src/lib/http-cache/index.spec.ts`
**Why**: regression coverage for the finding and for the behaviors that must
not change.
**Changes**: take the real `authorization` and `readRbacSecret` in the
`@sps/backend-utils` mock so the suite exercises the real header and cookie
names; give the context double a real `Request` so cookie reads work; add a BDD
suite on a Hono app with an in-memory store: an anonymous GET is stored and
served from the cache; for each of the four credential channels a GET neither
receives the stored anonymous body nor replaces it; a body produced for a
credentialed caller never reaches a later anonymous caller; a credentialed
POST still bumps the version so the next anonymous GET misses;
`Cache-Control: no-store` still bypasses read and write.

### Success Criteria:

#### Automated Verification:

- [x] Unit lane passes: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/middlewares:jest:test`
- [x] Type check passes: `npx tsc --noEmit -p libs/middlewares/tsconfig.json`
- [x] Lint passes on the changed files: `npx eslint libs/middlewares/src/lib/http-cache` (the package has no `eslint:lint` target)
- [x] Mutation check: with the credential condition removed the new credential scenarios fail; restored, they pass

#### Manual Verification:

- [x] Covered by Phase 4

---

## Phase 2: Contract documentation

### Overview

The documents and comments that describe the cache as identity-blind describe
the new contract instead.

### Changes Required:

#### 1. Cache README

**File**: `libs/middlewares/src/lib/http-cache/README.md`
**Why**: `:6-9` says the cache is identity-blind and names `no-store` and
exclusions as the only ways to keep a response unshared.
**Changes**: state which requests the cache serves and stores, why that is
enough while the cache sits before authorization, what credentialed requests
cost (they always reach the handler), and that mutation bumps run for every
caller.

#### 2. API composition comment

**File**: `apps/api/app.ts`
**Why**: `:156-161` says authorized requests can be cached and served to
unauthorized users.
**Changes**: replace the comment with the current contract. The registration
lines stay unchanged, so the order contract test keeps matching.

#### 3. Issue-270 exclusion comment

**File**: `libs/middlewares/src/lib/http-cache/routes/singlepage.ts`
**Why**: `:49-55` gives the replay of a privileged body as the reason for the
identity, subject and role exclusions, which the gate now prevents for every
route.
**Changes**: keep the rules; restate their reason as a second layer for route
families that must never be cached even if a project opens them to anonymous
callers.

#### 4. Scenario README

**File**: `apps/api/specs/scenario/README.md`
**Why**: `:25-31` says every other endpoint remains cacheable.
**Changes**: say that reads carrying the subject token or the operator secret
are never cached and that anonymous reads are.

### Success Criteria:

#### Automated Verification:

- [x] API unit lane still passes (order contract): `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run api:jest:test`
- [x] `NODE_OPTIONS=--max-old-space-size=12288 npx nx run api:eslint:lint`

---

## Phase 3: Scenario lane

### Overview

The issue-152 backend scenario asserts the new contract instead of the leak.

### Changes Required:

**File**: `apps/api/specs/scenario/singlepagestartup/issue-152/backend-cart.scenario.spec.ts`
**Why**: `:240-279` requires the subject's token-bearing cart list to be found
in the cache.
**Changes**: the subject reads its cart list, quantity and total with its
token and an anonymous caller reads the fixture product; the product read is
found in the cache and none of the cart reads is. The suite header names the
cache expectation.

### Success Criteria:

#### Automated Verification:

- [x] The scenario file type-checks: `npx tsc --noEmit -p apps/api/specs/scenario/tsconfig.json` shows no new error in the file
- [x] The backend cart scenario passes against the API on port 4306 when a throwaway subject can be provisioned

---

## Phase 4: HTTP verification

### Overview

Prove the behavior on a running API.

### Manual Testing Steps:

1. Start the worktree API on port 4306 with `MIDDLEWARE_HTTP_CACHE=true`
   against the shared Redis on 6384.
2. Anonymous GET of a public catalog read twice: the second answer comes from
   the cache (one data key under this API's URL prefix, a faster second
   response).
3. Mint a subject token with `init`; GET the subject's cart list with the
   token: 200 and no data key for that URL; the same URL without credentials
   answers with an error status, not the cart.
4. GET an operator-only read with `X-RBAC-SECRET-KEY`: 200 and no data key;
   the same URL anonymously: 403.
5. Repeat 3 and 4 with the credential in the `rbac.subject.jwt` and
   `rbac.secret-key` cookies.
6. A credentialed POST bumps the catalog path version, and the next anonymous
   GET misses.
7. Delete the throwaway subject and product, delete this API's data keys and
   the version keys for its paths, and stop the server.

## Testing Strategy

### Unit Tests:

- The anonymous hit, each credential channel, the no-replay regression, the
  credentialed mutation bump and the `no-store` opt-out, on a real Hono app.
- Existing suites keep passing: key building, clear route, exclusion versus
  bumps, topic parity, fail-open behavior, bounded generations.

### Integration Tests:

- The issue-152 backend scenario on a running API.

## Performance Considerations

- Server-rendered page reads and every other request without a credential keep
  the cache.
- Requests with a credential reach their handler every time: browser client
  reads after `init` (every browser gets a subject token), MCP and agent reads
  with the operator secret, and the host page service's loopback collection
  reads, which run only when the anonymous page read around them misses.
  Telegram and the `is-authorized` self-call already bypassed the cache with
  `no-store`.

## Migration Notes

- Bodies stored for credentialed callers before the upgrade stay addressable
  under their URL until `KV_TTL` expires, a mutation bumps their path or topic,
  or the clear route runs. The framework's container start runs the seed in
  the background, and the seed ends by calling the clear route
  (`start.sh:10-14`, `apps/api/src/db/seed.ts:393-407`). A deployment that does
  not run the seed clears the cache once after the upgrade:
  `GET /api/http-cache/clear` with `X-RBAC-SECRET-KEY`.
- No schema, environment variable or deployer template changes.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-306.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-306.md`
- Review: `thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md` (N-04; local only)
