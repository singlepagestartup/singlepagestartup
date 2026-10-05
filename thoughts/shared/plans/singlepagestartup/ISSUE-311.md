---
date: 2026-09-26T01:03:00+03:00
issue_number: 311
repository: singlepagestartup
topic: "Distinguish access and refresh tokens and add server-side revocation"
status: approved
---

# Distinguish access and refresh tokens and add server-side revocation Implementation Plan

## Overview

Every RBAC subject token gets a type (`access` or `refresh`) and a unique id and names the subject by id alone; each route accepts only the type it is for; `logout` writes a per-subject revocation mark that every token consumer consults; and `me` reads the subject from the database.

## Current State Analysis

Research: `thoughts/shared/research/singlepagestartup/ISSUE-311.md`.

- Thirteen `jwt.sign` calls across five session services, three subject controllers, the agent module and the Telegram bot produce `{ exp, iat, subject }` payloads with no type; six of the eight internal sites and three of the five session sites embed the whole subject row.
- `refresh`, the is-authorized service, `init`, `me`, OAuth `start` and the ownership checks accept any token that verifies and names a subject, so an access token (or an internal token handed to MCP) refreshes into a new pair and a refresh token authorizes requests.
- `logout` does not read the token; nothing records revocation; the subject row has no column for it and the module has no session model.
- Two per-process 30-second caches answer before any database read: the shared middleware's decision cache and the is-authorized service's token cache. `logout` is allow-listed, so the middleware wraps it without checking it.
- The browser refreshes only when its access token's `exp` passes, clears storage on a 401 from refresh, and keeps a rejected access token when a refresh token is stored.

## Desired End State

- Every token the framework signs carries `exp`, `iat`, `jti`, `typ` and `subject: { id }`, produced by one helper, `signJwt`, in `@sps/backend-utils`.
- `verifyJwt` takes an expected type. The is-authorized service (and route billing through it), `init`, `me`, `logout` and OAuth `start` expect `access`; `refresh` expects `refresh`. A token without `typ` is accepted as either type until it expires.
- The subject row has a nullable revocation mark, `tokensValidAfter`. A token whose `iat` falls in or before the second of the mark is revoked. `logout` sets it for the subject of a valid access token, and every consumer above refuses a revoked token (401 `Authentication error. Token revoked`); `init` answers a revoked token with a new subject.
- `logout` drops the is-authorized service's cached revocation mark for the subject and names the subject in a Hono context variable, after which the shared middleware stops answering any token of that subject from its cached decisions.
- `me` answers the database row of the token's subject, `null` when that subject no longer exists.
- A browser that receives a 401 for a revoked token clears its stored tokens even when a refresh token is stored, so it starts a new anonymous session instead of failing until its access token expires.

Verification: the unit, lint and type lanes listed per phase, the mutation checks, and the HTTP proof on port 4311 described under Testing Strategy.

### Key Discoveries:

- Hono fixes the JWT header `typ` to `JWT`, so the type travels as a payload claim; `iat` has one-second resolution (`node_modules/hono/dist/utils/jwt/jwt.js:21-68`).
- The subject repository is bound in the same container as the is-authorized singleton (`subject/api/bootstrap.ts:176,641-643`), and `BillRouteService` already injects it (`service/singlepage/billing/route.ts:47-55`).
- `invalidateSubjectRoleCache` is the existing seam for dropping is-authorized cache entries from a subject service method (`is-authorized.ts:42-44`, `service/singlepage/index.ts:484-486`).
- `@sps/middlewares` imports the subject SDK and the rbac module is one Nx project, so the subject backend cannot call into the middleware; `RBAC_PRIVILEGED_CONTEXT_KEY` is the precedent for a context variable shared between the middleware and handlers (`libs/shared/utils/src/lib/constants/index.ts:36-43`).
- `consumedAt` on `rbac.action` is the precedent for a nullable timestamp column (`libs/modules/rbac/models/action/backend/repository/database/src/lib/fields/singlepage.ts:14-18`); the generator is `npx nx run @sps/rbac:models:subject:repository-generate`.
- Browser components read only the subject id from decoded tokens; refresh and EVM tokens already carry `{ id }` alone.

## What We're NOT Doing

- No session table and no per-device logout. The module has no session model; a per-subject revocation mark needs one column. Logout therefore ends every session of the subject, including other browsers, the stored MCP connector token and in-flight internal tokens signed before it.
- No refresh-token rotation or reuse detection; `jti` makes every token unique and is not consulted yet.
- No `iss` or `aud` claims.
- No switch to end the transition early. Rotating `RBAC_JWT_SECRET` already invalidates every token at once.
- No change to lifetimes, including the one-day refresh lifetime `refresh` issues to anonymous subjects.
- No change to how the session cookie is set, and no change to middlewares other than is-authorized.
- No change to `apps/mcp`: it reads `subject.id` from subject tokens and signs its own tokens with its own claims.
- No change to the twelve inline ownership checks and the ownership middleware (they sit behind the is-authorized middleware) or to the actions logger's attribution.
- No cross-instance cache invalidation: another API instance stops honouring a revoked token when its 30-second entries expire.
- The transition branch for tokens without `typ` stays; its removal is a later release once the longest refresh lifetime has passed.

## Implementation Approach

The token format and its checks live in `@sps/backend-utils` beside `verifyJwt`, because the Telegram app and the agent module sign subject tokens too. The meaning of the new subject column lives in the subject SDK model package, which already holds pure helpers about subject semantics used by the backend. The services keep their current shape: each verifies the token it receives, reads the subject it already reads, and applies the one revocation predicate. New behaviour in the subject module follows the props-object service pattern of `init` and `record-activity`. Framework layer only; no `startup` file changes.

## Phase 1: Token format, revocation column and shared constants

### Overview

Add the signing helper, the typed verification, the revocation column and predicate, and the context key.

### Changes Required:

#### 1. Signing helper

**File**: `libs/shared/backend/utils/src/lib/jwt-sign/index.ts` (new), `libs/shared/backend/utils/src/lib/index.ts`
**Why**: thirteen sites sign subject tokens inline with diverging payloads.
**Changes**: `util({ subjectId, type, lifetimeInSeconds }, secret)` signs `exp`, `iat`, `jti` (random UUID), `typ` and `subject: { id }`; exports the `TJwtType` union. Re-export as `signJwt` and `TJwtType`.

#### 2. Typed verification

**File**: `libs/shared/backend/utils/src/lib/jwt-verify/index.ts`
**Why**: verifiers cannot tell token purposes apart.
**Changes**: optional third argument `{ type }`; a token whose `typ` is present and differs is refused with `Authentication error. Invalid token type`; a token without `typ` passes (transition). Callers that pass no type keep today's behaviour.

#### 3. Revocation column

**File**: `libs/modules/rbac/models/subject/backend/repository/database/src/lib/fields/singlepage.ts`, generated migration and meta files under `.../migrations/`
**Why**: logout needs a place to record revocation.
**Changes**: nullable `tokensValidAfter: pgCore.timestamp("tokens_valid_after", { mode: "date" })` with a doc comment; run `npx nx run @sps/rbac:models:subject:repository-generate`; no hand-written SQL.

#### 4. Revocation predicate

**File**: `libs/modules/rbac/models/subject/sdk/model/src/lib/token-revocation.ts` (new), `.../lib/index.ts`
**Why**: six consumers apply the same rule.
**Changes**: `isRbacSubjectTokenRevoked({ subject, issuedAt })`: false without `tokensValidAfter`; true when `issuedAt` is missing or `issuedAt * 1000 <= tokensValidAfter` (Date or ISO string); an unreadable mark counts as revoked.

#### 5. Context key

**File**: `libs/shared/utils/src/lib/constants/index.ts`
**Why**: the logout handler must reach the middleware's cache without a project cycle.
**Changes**: `RBAC_REVOKED_SUBJECT_CONTEXT_KEY` with a doc comment, beside `RBAC_PRIVILEGED_CONTEXT_KEY`.

### Success Criteria:

#### Automated Verification:

- [x] `npx nx run @sps/backend-utils:jest:test` passes with new `jwt-sign` and `jwt-verify` scenarios.
- [x] The subject SDK model predicate spec passes inside `npx nx run @sps/rbac:jest:test`.
- [x] The generated migration adds only the nullable column.

#### Manual Verification:

- [x] The migration applies to the local database with `npx nx run @sps/rbac:models:subject:repository-migrate`.

---

## Phase 2: Every issuance through the helper

### Overview

Replace every subject-token `jwt.sign` with `signJwt`.

### Changes Required:

#### 1. Session services

**File**: `subject/api/service/singlepage/init.ts`, `refresh.ts`, `authentication/email-and-password.ts`, `authentication/ethereum-virtual-machine.ts`, `authentication/oauth/exchange.ts`
**Why**: three sign the whole row and none sign a type.
**Changes**: access token with `type: "access"` and the access lifetime; refresh token with `type: "refresh"` and the lifetime each site uses today.

#### 2. Internal issuance

**File**: `subject/api/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/audio-transcription.ts`, `.../message/react-by-openrouter.ts`, `.../social-module/profile/find-by-id/mcp/server/find.ts`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts` (three sites), `apps/telegram/src/lib/telegram-bot.ts` (two sites)
**Why**: these tokens are handed to other services, including the MCP exchange, and today refresh into full sessions.
**Changes**: `type: "access"`, access lifetime, subject id only. The agent and Telegram helpers keep their names and signatures.

### Success Criteria:

#### Automated Verification:

- [x] `npx nx run @sps/rbac:jest:test`, `npx nx run @sps/agent:jest:test`, `npx nx run telegram:jest:test` pass; specs that mock `@sps/backend-utils` or `hono/jwt` for these paths are updated to the new payload.
- [x] `git grep -n "jwt.sign(" -- libs/modules apps/telegram` returns no subject-token site.

---

## Phase 3: Type enforcement, revocation and `me`

### Overview

Make every consumer accept only its token type and refuse revoked tokens; make logout revoke; read `me` from the database.

### Changes Required:

#### 1. is-authorized service

**File**: `subject/api/service/singlepage/is-authorized.ts`
**Why**: accepts refresh tokens and never consults revocation.
**Changes**: inject the subject repository; verify with `type: "access"`; cache `{ subjectId, issuedAt }` per token; read the subject's `tokensValidAfter` through the repository with a 30-second per-subject cache; refuse revoked tokens; add `invalidateSubjectRevocationCache(subjectId)` beside `invalidateSubjectRoleCache`. A token whose subject no longer exists behaves as today.

#### 2. refresh, init, OAuth start and route billing

**File**: `subject/api/service/singlepage/refresh.ts`, `init.ts`, `authentication/oauth/start.ts`, `billing/route.ts`
**Why**: each turns a presented token into acting as its subject; the billing route is also reachable directly, outside the is-authorized middleware.
**Changes**: `refresh` verifies `type: "refresh"` and refuses a revoked token after reading the subject. `init` verifies `type: "access"` and treats a revoked token like an expired one (new subject). `start` verifies `type: "access"`, reads the subject through its repository, and ignores a revoked token as it ignores an invalid one. The billing route service resolves the subject it charges through the is-authorized service's `getSubjectId` instead of its own verification and token cache.

#### 3. logout

**File**: `subject/api/service/singlepage/logout.ts`, `subject/api/controller/singlepage/authentication/logout.ts`, `subject/api/service/singlepage/index.ts`
**Why**: logout revokes nothing.
**Changes**: the service takes the `me` resolver, `update` and the cache invalidation as props; for a valid, unrevoked access token of an existing subject it writes `tokensValidAfter`, drops the is-authorized cache and resolves to that subject; a missing, invalid, refresh or already revoked token revokes nothing and resolves to `null`. `init` resolves its token through the same `me` resolver. The controller passes `authorization(c)` to the service, sets `RBAC_REVOKED_SUBJECT_CONTEXT_KEY` to the revoked subject's id, deletes the cookie as today, and still answers `{ ok: true }`.

#### 4. me

**File**: `subject/api/service/singlepage/me.ts` (new), `subject/api/controller/singlepage/authentication/me.ts`, `subject/api/service/singlepage/index.ts`
**Why**: `me` returns raw claims.
**Changes**: the service verifies `type: "access"`, reads the subject by id, answers `null` for a missing subject and refuses a revoked token. The controller keeps `{ data: null }` for a request without a token.

#### 5. Shared middleware

**File**: `libs/middlewares/src/lib/is-authorized/index.ts`
**Why**: cached decisions keep a logged-out subject's tokens working for up to 30 seconds.
**Changes**: after the handler of an allowed or authorized request returns, a subject named by the context key is marked in the middleware cache for the cache lifetime; a token whose payload names a marked subject is not served from cached decisions and goes to the service, which refuses it if it was revoked. The payload is read without verification, because it can only make a request skip the cache.

### Success Criteria:

#### Automated Verification:

- [x] `npx nx run @sps/rbac:jest:test` and `npx nx run @sps/middlewares:jest:test` pass with new scenarios: refresh token refused by is-authorized, access token refused by refresh, untyped token accepted by both, revoked token refused by is-authorized, refresh, `me` and OAuth start, `init` not reusing a revoked or refresh token, route billing charging nothing for a refused token, logout writing `tokensValidAfter` only for a valid token, `me` reading the database row, the middleware not trusting a cached decision for any token of a subject after it logged out.
- [x] Mutation checks: removing the type check, the is-authorized revocation check, the refresh revocation check, or the middleware mark fails the corresponding scenarios.

---

## Phase 4: Browser recovery and documentation

### Overview

Let a browser recover from a revoked token and document the contract.

### Changes Required:

#### 1. Response pipe

**File**: `libs/shared/utils/src/lib/response-pipe.ts`
**Why**: a browser holding a refresh token keeps a revoked access token until it expires.
**Changes**: a 401 whose message reports a revoked token clears the stored tokens even when a refresh token is stored.

#### 2. Documentation

**File**: `libs/modules/rbac/models/subject/README.md`
**Why**: the token contract, the new field and the logout semantics are part of the model's API.
**Changes**: `tokensValidAfter` under Fields; a "Session tokens" section with claims, where each type is accepted, the transition, revocation and its second resolution, cache propagation, `signJwt` for project code; the `me`, `logout` and is-authorized descriptions updated.

### Success Criteria:

#### Automated Verification:

- [x] `npx nx run @sps/shared-utils:jest:test` passes with the revoked-token scenario.
- [x] Lint: `@sps/rbac`, `@sps/backend-utils`, `@sps/shared-utils`, `@sps/agent`, `telegram`; `npx eslint` on the changed `@sps/middlewares` files (no lint target).
- [x] Types: `tsc:build` for `@sps/rbac`, `@sps/backend-utils`, `@sps/shared-utils`, `@sps/middlewares`, `@sps/agent`; `npx tsc --noEmit` for the Telegram app.

---

## Testing Strategy

### Unit Tests:

- Helper: claims and uniqueness of `jti`; typed verification in both directions and the transition.
- Predicate: earlier second, same second, later second, no record, ISO input, missing `iat`.
- Services: the Phase 3 scenarios, with the subject repository or finder stubbed.
- Middleware: a real Hono app with the subject SDK stubbed; a logout handler that names a subject stops later cached decisions for every token of that subject and for no other.
- Response pipe: revoked 401 with a stored refresh token clears storage; other 401s behave as before.

### Integration Tests:

- None added; the HTTP proof covers the running stack.

### Manual Testing Steps:

1. Apply the subject migration to the local database and boot the API on port 4311.
2. `init` without a token: 201 with `jwt` and `refresh`; both carry `typ` and `jti`.
3. A protected read with the access token: 200; the same read with the refresh token: 401.
4. `refresh` with the access token: 401; with the refresh token: 201.
5. A token without `typ` for a throwaway subject: the protected read answers 200 (transition).
6. `me` with the access token: the database row.
7. Repeat the protected read so the middleware caches it, `logout`, repeat it: 401 at once, for the logged-out token and for the subject's other tokens; `refresh` with the old refresh token: 401; `init` with the old access token: a different subject.
8. Delete the throwaway subjects; stop the server. Print status codes and key names only.

## Performance Considerations

- The is-authorized service adds one subject read per subject per 30 seconds, cached like role ids.
- `me` adds one read by primary key per call; its only HTTP caller is the server variant of `authentication-me-default`.
- The middleware reads the subject id from the token payload and makes one in-memory lookup when a cached decision exists; for 30 seconds after a logout, that subject's requests skip the decision cache.

## Migration Notes

- Schema: one nullable column on `sps_rc_subject`, applied by the standard repository migration at deploy.
- Sessions survive the deploy: tokens without `typ` are accepted as either type and can be revoked; the framework signs none after the deploy. The last of them expires one `RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS` (28 days by default) after deploy, or the largest configured refresh lifetime if higher.
- Project code that signs subject tokens should call `signJwt`; until it does, its tokens are accepted under the transition rule and can be refreshed.
- No new environment variables.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-311.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-311.md`
- Review: `thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md` (SEC-08, SEC-17, N-11)
