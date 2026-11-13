---
date: 2026-09-26T00:56:24+03:00
researcher: flakecode
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-311-token-revocation
repository: singlepagestartup
topic: "Distinguish access and refresh tokens and add server-side revocation"
tags: [research, codebase, rbac, subject, authentication, jwt, is-authorized, middlewares, telegram, agent, mcp, frontend]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Distinguish access and refresh tokens and add server-side revocation

**Date**: 2026-09-26T00:56:24+03:00
**Researcher**: flakecode
**Git Commit**: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
**Branch**: claude/issue-311-token-revocation
**Repository**: singlepagestartup

## Research Question

Issue #311 (finding SEC-17 of the 2026-09-25 security review, with the cache part of SEC-08) states that RBAC access and refresh tokens are interchangeable, that nothing invalidates an issued token, that `logout` only deletes a cookie, that `me` returns raw claims, and that two issuance sites sign the whole subject row. This document checks each claim against the worktree and records every place that signs or verifies an RBAC subject JWT, what each verifier accepts, which caches sit in front of the decision, what the subject row can hold, and how the browser client, Telegram, the agent module and MCP obtain, store, forward and discard these tokens.

Paths are relative to the repository root. `subject/api` abbreviates `libs/modules/rbac/models/subject/backend/app/api/src/lib`.

## Summary

- Every RBAC subject token is an HS256 JWT signed with `RBAC_JWT_SECRET` whose payload is `{ exp, iat, subject }`. No token carries a type, `jti`, `iss` or `aud` claim. Lifetimes default to 3600 s (access), 86400 s (refresh) and 2419200 s (anonymous refresh from `init`) (`libs/shared/utils/src/lib/envs/rbac.ts:10-19`).
- Five session services issue access and refresh pairs. `init` signs the whole subject row into both tokens, `email-and-password` into the access token, and OAuth `exchange` into the access token; `refresh` and `ethereum-virtual-machine` sign `{ id }` only (`subject/api/service/singlepage/init.ts:79-97`, `authentication/email-and-password.ts:185-205`, `authentication/oauth/exchange.ts:119-139`, `refresh.ts:68-90`, `authentication/ethereum-virtual-machine.ts:248-270`). The review's "two of five" undercounts: OAuth exchange also signs the row.
- Eight more sites mint access-shaped tokens for internal calls: the Telegram bot (2), the agent module (3), and three subject controllers (audio transcription, OpenRouter reply, MCP server catalog). All use the access lifetime; six of the eight sign the whole row. Two of them hand the token to the MCP internal exchange, and MCP forwards it to the API as a bearer.
- No verifier distinguishes token purposes. `refresh` accepts any token that verifies and names a subject id (`refresh.ts:44-50`); the is-authorized service does the same (`is-authorized.ts:169-186`); `init`, `me`, OAuth `start`, the ownership middleware and twelve inline controller checks likewise read only `subject.id`. Any token, including an internal one handed to MCP, can therefore be exchanged at `/refresh` for a new pair, and any refresh token authorizes requests.
- Nothing records revocation. `logout` returns `{ ok: true }` without reading the token (`logout.ts:10-14`); its controller deletes the `rbac.subject.jwt` cookie (`controller/singlepage/authentication/logout.ts:14-22`). The subject row holds `id`, `createdAt`, `updatedAt`, `variant` and `slug` only, and the RBAC module has no session model.
- Two 30-second caches answer before any database read: the shared middleware caches "authorized" per method, path, token and secret (`libs/middlewares/src/lib/is-authorized/index.ts:28-29,83-113`), and the is-authorized service caches the subject id per token (`is-authorized.ts:9,170-186`). Neither has an invalidation path for a token. `createMemoryCache` offers `get`, `set`, `del` and `clear` only (`libs/shared/utils/src/lib/memory-cache.ts:11-49`).
- `me` verifies the token and returns `decoded.subject`; the database lookup is commented out (`controller/singlepage/authentication/me.ts:33-49`). Its only HTTP consumer is the server variant of `authentication-me-default`, which treats any failure as "no data".
- `logout`, `me`, `init`, `refresh`, `is-authorized`, `bill-route` and every other `POST /api/rbac/subjects/authentication/*` path are on the middleware allow-list (`libs/middlewares/src/lib/is-authorized/routes/singlepage.ts:18-30`), so each of them verifies the token itself or not at all.
- The browser keeps the access token in its own `rbac.subject.jwt` cookie and the refresh token in `localStorage` (`persist-authentication-tokens.ts:21-46`). A root-layout component refreshes when the access token's `exp` has passed and falls back to `init` when refresh answers 401 (`init-default/ClientComponent.tsx:112-179,202-212`). A 401 on any other call clears stored tokens only when no refresh token is stored (`libs/shared/utils/src/lib/response-pipe.ts:77-96`). Two client components render subject data straight from the decoded access token.

## Detailed Findings

### Token lifetimes and secret

- `RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS` defaults to 3600, `RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS` to 86400, `RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS` to 2419200 (`libs/shared/utils/src/lib/envs/rbac.ts:10-19`). `RBAC_JWT_SECRET` is read at `:29`.
- Hono 4.10.4 signs every token with the header `{ alg: "HS256", typ: "JWT" }` and its `verify` rejects a header whose `typ` is anything but `JWT` (`node_modules/hono/dist/utils/jwt/jwt.js:21-27,28-41`). A token type can therefore only travel as a payload claim.
- `verify` checks `exp`, `nbf` and `iat` against `Date.now() / 1000 | 0` and accepts an options object with `exp`, `nbf`, `iat`, `iss` and `aud` switches (`jwt.js:42-68`). A fractional `iat` fails verification within its own second (`now < payload.iat`), so issuance times have one-second resolution.

### Session issuance: five services and their controllers

| Service                                              | Access payload        | Refresh payload       | Refresh lifetime                                       |
| ---------------------------------------------------- | --------------------- | --------------------- | ------------------------------------------------------ |
| `init.ts:79-97`                                      | `subject` (whole row) | `subject` (whole row) | `RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS` |
| `authentication/email-and-password.ts:185-205`       | `subject` (whole row) | `subject: { id }`     | `RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS`           |
| `authentication/oauth/exchange.ts:119-139`           | `subject` (whole row) | `subject: { id }`     | `RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS`           |
| `refresh.ts:68-90`                                   | `subject: { id }`     | `subject: { id }`     | `RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS`           |
| `authentication/ethereum-virtual-machine.ts:248-270` | `subject: { id }`     | `subject: { id }`     | `RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS`           |

All paths above are under `subject/api/service/singlepage/`. Every payload also carries `exp` and `iat`.

- Each matching controller re-verifies the fresh access token only to read `exp` for the cookie, then sets `rbac.subject.jwt` with `httpOnly: false`, `secure: true`, `sameSite: "Strict"`, path `/` and returns `{ data: { jwt, refresh } }` with 201 (`controller/singlepage/authentication/init.ts:22-47`, `refresh.ts:43-67`, `ethereum-virtual-machine.ts:39-63`, `email-and-password/authentication/index.ts:38-63`, `email-and-password/registration/index.ts:30-55`, `oauth/exchange.ts:41-75`).
- The services are constructed in the subject service (`subject/api/service/singlepage/index.ts:276-330`): `init` and `refresh` receive props objects (`findById`, `recordActivity`, `repository`), the other three receive the repository. `logout()` constructs `new Logout(this.repository)` (`:276-278`).

### Internal issuance: Telegram, agent and subject controllers

| Site                                                                                                                        | Payload `subject` | Lifetime | Where the token goes                                                  |
| --------------------------------------------------------------------------------------------------------------------------- | ----------------- | -------- | --------------------------------------------------------------------- |
| `apps/telegram/src/lib/telegram-bot.ts:423-441` (`signSubjectJwt`)                                                          | whole row         | access   | `Authorization: Bearer` on social message and thread calls to the API |
| `apps/telegram/src/lib/telegram-bot.ts:924-933` (callback query handler)                                                    | whole row         | access   | `Authorization: Bearer` on the chat action create call (`:935-954`)   |
| `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:562-569`                               | whole row         | access   | `Authorization: Bearer` on social message and action calls            |
| same file `:735-756` (`signRbacModuleSubjectJwt`)                                                                           | whole row         | access   | Telegram command reply flows                                          |
| same file `:2426-2434`                                                                                                      | whole row         | access   | `POST .../messages/:socialModuleMessageId/react-by/openrouter`        |
| `subject/api/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/audio-transcription.ts:405-431` | `{ id }`          | access   | `Authorization: Bearer` on chat action create and thread update       |
| `.../message/react-by-openrouter.ts:1278-1286`                                                                              | whole row         | access   | message create call, Knowledge learning, and the MCP catalog chain    |
| `subject/api/controller/singlepage/social-module/profile/find-by-id/mcp/server/find.ts:74-81`                               | whole row         | access   | MCP catalog chain                                                     |

- The MCP catalog chain posts the token as `subject_token` to the MCP internal exchange, authenticated by `x-mcp-internal-token-exchange-secret` (`subject/api/service/singlepage/social-module/profile/mcp/singlepagestartup-client.ts:137-158`). MCP verifies it with `RBAC_JWT_SECRET`, requires `subject.id` (`apps/mcp/lib/oauth.ts:1013-1036`), stores it as `rbacSubjectAuthenticationJwt`, issues its own five-minute access token, and forwards the stored JWT as `Authorization: Bearer` on every API call (`apps/mcp/http.ts:214-219`, `apps/mcp/lib/auth-context.ts:45-76`).
- The MCP browser OAuth flow obtains the same kind of token by posting the user's credentials to the email-and-password login and keeping `data.jwt`, the access token (`apps/mcp/lib/oauth.ts:547-602,827-882`). MCP reads `payload.sub`, `payload.subject.id` or `payload.id` (`:980-1011`). MCP signs its own tokens with `MCP_SERVICE_OAUTH_JWT_SECRET`, falling back to `RBAC_JWT_SECRET`; their payload is `sub`, `aud`, `iss`, `scope`, `client_id`, `jti`, with no `subject` claim (`:753-769,956-968`).
- No shared signing helper exists; each site calls `jwt.sign` from `hono/jwt` inline. The only verification helper is `verifyJwt` in `@sps/backend-utils` (`libs/shared/backend/utils/src/lib/jwt-verify/index.ts:19-35`), which maps Hono's credential failures to `Authentication error. Token expired` or `Authentication error. Invalid token` without echoing the token.

### Verification sites and what they accept

- **is-authorized service** (`subject/api/service/singlepage/is-authorized.ts:151-279`): when a token is present it reads `jwt:subject:<token>` from a module cache (TTL 30 s, `:9`), otherwise calls `verifyJwt`, requires a string `subject.id`, and caches it (`:169-186`). Subject role ids are cached per subject (`:46-83`) and dropped by `invalidateSubjectRoleCache` (`:42-44`), which the subject service calls after Knowledge access provisioning (`service/singlepage/index.ts:484-486`). The service is an injectable singleton bound in the subject container (`subject/api/bootstrap.ts:641-643`) with three injected services (`is-authorized.ts:29-40`); the subject repository is bound in the same container as `DI.IRepository` (`bootstrap.ts:176`), and `BillRouteService` already injects it (`service/singlepage/billing/route.ts:47-55`).
- **Shared middleware** (`libs/middlewares/src/lib/is-authorized/index.ts:40-121`): the operator secret short-circuits (`:60-70`), allow-listed routes skip the check (`:72-74`), and otherwise the middleware calls `GET /api/rbac/subjects/authentication/is-authorized` over HTTP through the server SDK, caching `true` under `${method}:${path}:${token}:${secret}` for 30 s with in-flight de-duplication (`:28-29,76-113`). The rbac module is a single Nx project (`libs/modules/rbac/project.json`), and `@sps/middlewares` imports its subject SDK, so the subject backend cannot import the middleware package without a project cycle. The middleware already exchanges state with the REST boundary through a Hono context variable, `RBAC_PRIVILEGED_CONTEXT_KEY` (`is-authorized/index.ts:60-70`, `libs/shared/utils/src/lib/constants/index.ts:36-43`, `libs/shared/backend/api/src/lib/output-schema/index.ts:27-42`).
- **Allow-list** (`libs/middlewares/src/lib/is-authorized/routes/singlepage.ts:18-30`): `GET|POST .../authentication/(is-authorized|me|init|refresh|bill-route)`, `GET|POST .../authentication/oauth/.*`, and `POST .../authentication/(\w+)?`, which covers `logout`.
- **refresh** (`refresh.ts:44-66`): `verifyJwt`, `subject.id` required, subject read through the server SDK with the operator secret, activity recorded, new pair signed. The route body is form data with a JSON `data` field holding `refresh` (`controller/singlepage/authentication/refresh.ts:31-45`).
- **init** (`init.ts:107-139`): raw `jwt.verify` inside a try/catch; any failure, a missing id or a missing subject yields a new subject. The token comes from `authorization(c)`, which reads the `rbac.subject.jwt` cookie first and the `Authorization` header second (`libs/shared/backend/utils/src/lib/authorization/index.ts:4-11`).
- **me** (`controller/singlepage/authentication/me.ts:14-54`): no token answers `{ data: null }` with 200; otherwise `verifyJwt`, then `{ data: decoded.subject }`. The `findById` call is commented out (`:39-41`). There is no `me` service.
- **OAuth start** (`service/singlepage/authentication/oauth/start.ts:128-144`): verifies the presented token with raw `jwt.verify` and uses its `subject.id` as the source subject of a link flow, which the callback then attaches the Google identity to. The service receives the subject repository (`:29-34`).
- **Ownership middleware** `request-subject-is-owner` (`libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-is-owner/index.ts:31-44`) and twelve inline controller checks (ecommerce orders, identities, CRM request create) compare `subject.id` with the route id. All of them sit on routes that pass the global middleware first.
- **bill-route** (`service/singlepage/billing/route.ts:74-103`): raw `jwt.verify` with its own 30-second `jwt:subject:` cache, called by the bill-route middleware after the is-authorized middleware (`apps/api/app.ts:171-175`) and reachable directly because its path is allow-listed.
- **Actions logger** (`libs/middlewares/src/lib/actions-logger/index.ts:71`): verifies the token to attribute a logged action; it runs before the is-authorized middleware in the chain (`apps/api/app.ts:168-172`).

### Verifiers on this branch

In `libs/`, every presented subject token is verified by `verifyJwt` from `@sps/backend-utils`, so the algorithm, the secret and the claim checks have one seam. The type each site accepts:

| Site                                                                                           | Accepted type               |
| ---------------------------------------------------------------------------------------------- | --------------------------- |
| is-authorized service `getSubjectId`, and route billing through it                             | access                      |
| `me` service, which also resolves the token for `init` and logout                              | access                      |
| `refresh` service                                                                              | refresh                     |
| OAuth start (link-flow source subject)                                                         | access                      |
| Ownership middleware `request-subject-is-owner`                                                | access                      |
| Twelve inline owner checks: ecommerce orders (eight handlers), identities (three), CRM request | access                      |
| Actions logger                                                                                 | either (it only attributes) |

A token without `typ` passes as either type. Six authentication controllers (`init`, `refresh`, `ethereum-virtual-machine`, `oauth/exchange`, `email-and-password/authentication` and `registration`) call `jwt.verify` from `hono/jwt`, only to read `exp` from the pair the same request has just signed; they verify no presented token. `apps/mcp` verifies subject tokens with its own `jwt.verify` and reads `subject.id`.

### Logout today

- `POST /api/rbac/subjects/authentication/logout` (`controller/singlepage/index.ts:131-134`) calls `service.logout()`, which returns `{ ok: true }` (`service/singlepage/logout.ts:10-14`), then deletes the `rbac.subject.jwt` cookie and answers `{ data: { ok: true } }` (`controller/singlepage/authentication/logout.ts:14-22`). The handler does not read the token.

### The subject row

- Fields: `id`, `createdAt`, `updatedAt`, `variant`, `slug` (`libs/modules/rbac/models/subject/backend/repository/database/src/lib/fields/singlepage.ts:4-14`); the startup layer adds none (`fields/startup.ts`). The data folder holds no snapshots.
- `IModel` in the subject SDK is `typeof Table.$inferSelect` (`libs/modules/rbac/models/subject/sdk/model/src/lib/index.ts:1-6`), so a new column appears in the type without edits. The subject configuration has no `outputSchema` (`subject/api/configuration.ts:10-41`), so every column is returned by the REST reads.
- The repository update path converts ISO strings for date columns and always sets `updatedAt` (`libs/shared/backend/api/src/lib/repository/database/index.ts:262-293,356-384`). Anonymous retention reads `updatedAt` as last activity (`service/singlepage/record-activity.ts:15-21`).
- The precedent for a nullable timestamp added to an RBAC model is `consumedAt` on `rbac.action`: `pgCore.timestamp("consumed_at", { mode: "date" })` with a doc comment, a generated one-line `ALTER TABLE ... ADD COLUMN` migration, and a README "Fields" bullet (`libs/modules/rbac/models/action/backend/repository/database/src/lib/fields/singlepage.ts:14-18`, `.../migrations/0009_chief_starjammers.sql`, `libs/modules/rbac/models/action/README.md`).
- The generation target is `npx nx run @sps/rbac:models:subject:repository-generate`, which runs `drizzle-kit up` and `drizzle-kit generate` against the local migrations folder (`libs/modules/rbac/project.json:294-308`).
- The RBAC module has no session model (`libs/modules/rbac/models/`: action, identity, permission, role, subject, widget). The subject README's only session notes describe anonymous session initialization and retention (`libs/modules/rbac/models/subject/README.md:50-82`).

### Browser client and host

- Storage: `persistAuthenticationTokens` writes the refresh token to `localStorage["rbac.subject.refresh"]` and the access token to a js-cookie `rbac.subject.jwt` expiring at its `exp`; `clearAuthenticationTokens` removes both and dispatches `sps-rbac-auth-storage-change` (`libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/authentication/persist-authentication-tokens.ts:21-56`). Init, refresh, login, registration, EVM and OAuth exchange call the persist function.
- Requests: `saturateHeaders` adds `Authorization: Bearer <rbac.subject.jwt cookie>` on every client SDK call (`libs/shared/frontend/client/utils/src/lib/authorization/headers.ts:1-24`). The refresh token is sent only as `data.refresh` to the refresh route.
- Orchestration: `authentication-init-default` is mounted in the root layout (`apps/host/app/layout.tsx:42`). Every second, on focus and on the storage event it keeps a JWT whose decoded `exp` is in the future, otherwise calls refresh when the stored refresh token's `exp` is in the future, otherwise clears storage and calls `init` (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/init-default/ClientComponent.tsx:112-179`). A refresh that fails with 401 clears storage, which leads to `init` (`:202-212`); other statuses leave storage alone.
- Other 401s: the client branch of the response pipe clears storage for a 401 that is not "invalid credentials" only when no refresh token is stored (`libs/shared/utils/src/lib/response-pipe.ts:77-96,179-205`). With a refresh token present, the client keeps a rejected access token until its `exp` passes.
- Logout: the client SDK posts to the logout route with the bearer header and no body, then clears storage and optionally navigates (`libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/authentication/logout.ts:26-50`). The storage event makes the init component request a new anonymous subject.
- Claims read in the browser: `persistAuthenticationTokens` and the shared query factories read `exp` only. `me-default/client.tsx:37-86` renders its children with `decoded.subject`; `libs/shared/frontend/components/src/lib/singlepage/subject-default/client.tsx:38-68` renders its child with the token's `subject` when its id matches the displayed subject, and is used by the cart and checkout variants, which read the subject id only. Every consumer of `authentication-me-default` found reads `id` only. Tokens issued by `refresh` and EVM already carry `{ id }` alone, so a session holds an id-only token within one access lifetime of login.
- `me` over HTTP: only `me-default/server.tsx:8-31` calls it, forwarding the cookie as a bearer and turning any failure into no data.

### Tests and lanes

- Jest throughout; no `bun:test` in these trees. `jest.setup.ts` loads `apps/api/.env`, and specs pin constants by mocking `@sps/shared-utils` (`subject/api/service/singlepage/init.spec.ts:15-20`, `is-authorized.spec.ts:9-22`).
- Existing coverage: `init.spec.ts`, `is-authorized.spec.ts`, the OAuth `start`, `callback`, `exchange` and `utils` specs, `jwt-verify/index.spec.ts`, `libs/middlewares/src/lib/is-authorized/routes/index.spec.ts`, and `response-pipe.spec.ts` (401 with and without a stored refresh token). No spec exists for `refresh`, `logout`, `me`, the email-and-password service, the EVM service, or the shared is-authorized middleware body. The is-authorized controller spec performs live HTTP and is excluded from `@sps/rbac:jest:test` (`libs/modules/rbac/jest.config.ts:4-8`).
- Lanes: `test:unit:scoped` runs `jest:test` for `@sps/rbac`, `@sps/agent`, `@sps/telegram` and others by an explicit list (`package.json:29`); `@sps/middlewares`, `@sps/backend-utils` and `@sps/shared-utils` are not in it. `telegram` (`apps/telegram`) has `jest:test` and `eslint:lint`; `@sps/middlewares` has `jest:test` and `tsc:build` only.

## Code References

- `libs/shared/utils/src/lib/envs/rbac.ts:10-19,29` - token lifetimes and the JWT secret.
- `subject/api/service/singlepage/init.ts:79-97,107-139` - anonymous pair issuance and token reuse.
- `subject/api/service/singlepage/authentication/email-and-password.ts:185-205` - login and registration pair.
- `subject/api/service/singlepage/authentication/oauth/exchange.ts:119-139` - OAuth pair.
- `subject/api/service/singlepage/refresh.ts:44-90` - refresh verification and pair.
- `subject/api/service/singlepage/authentication/ethereum-virtual-machine.ts:248-270` - wallet pair.
- `subject/api/service/singlepage/logout.ts:10-14` and `controller/singlepage/authentication/logout.ts:14-22` - logout.
- `subject/api/controller/singlepage/authentication/me.ts:14-54` - `me`.
- `subject/api/service/singlepage/is-authorized.ts:9,42-44,151-187` - service caches and verification.
- `subject/api/service/singlepage/authentication/oauth/start.ts:128-144` - link-flow source subject.
- `libs/middlewares/src/lib/is-authorized/index.ts:28-29,40-121` - middleware decision cache.
- `libs/middlewares/src/lib/is-authorized/routes/singlepage.ts:18-30` - authentication allow-list.
- `libs/shared/backend/utils/src/lib/jwt-verify/index.ts:19-35` - `verifyJwt`.
- `libs/shared/utils/src/lib/memory-cache.ts:11-49` - cache API.
- `libs/shared/utils/src/lib/constants/index.ts:36-43` - `RBAC_PRIVILEGED_CONTEXT_KEY`.
- `apps/telegram/src/lib/telegram-bot.ts:423-441,924-933` - Telegram mint sites.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:562-569,735-756,2426-2434` - agent mint sites.
- `subject/api/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/audio-transcription.ts:405-431`, `react-by-openrouter.ts:1278-1286`, `social-module/profile/find-by-id/mcp/server/find.ts:74-81` - controller mint sites.
- `apps/mcp/lib/oauth.ts:980-1036` - MCP verification of subject tokens.
- `libs/modules/rbac/models/subject/backend/repository/database/src/lib/fields/singlepage.ts:4-14` - subject fields.
- `libs/modules/rbac/project.json:294-308` - subject `repository-generate` target.
- `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/authentication/persist-authentication-tokens.ts:21-56` - client storage.
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/init-default/ClientComponent.tsx:112-212` - refresh orchestration.
- `libs/shared/utils/src/lib/response-pipe.ts:77-96` - client 401 handling.

## Architecture Documentation

- Authentication operations are one service file each under `subject/api/service/singlepage/`, constructed by a method on the subject service and exposed through a thin controller. Newer services take a props object of functions (`init.ts:12-15`, `record-activity.ts:4-6`) instead of the repository.
- Shared backend helpers live in `@sps/backend-utils` as one folder per helper exporting `util`, re-exported under a name (`libs/shared/backend/utils/src/lib/index.ts:1-21`); a second helper in a folder is a sibling file (`http-error/sanitize`). Shared constants live in `libs/shared/utils/src/lib/constants/index.ts`; environment values in `libs/shared/utils/src/lib/envs/*.ts`.
- The subject SDK model package hosts pure helpers about subject semantics used by the backend (`libs/modules/rbac/models/subject/sdk/model/src/lib/ai-thread-preferences.ts`, re-exported at `index.ts:24-27`).
- Errors whose message starts with `Authentication error` map to 401 (`libs/shared/backend/utils/src/lib/http-error/index.ts:87-93`); the client clears storage after a 401 from refresh.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md` rows SEC-08 and SEC-17 describe the uninvalidated 30-second cache and the missing token type and revocation; N-11 repeats the whole-row issuance.
- `thoughts/shared/prs/260_description.md` (#229) introduced `verifyJwt` and the token-free 401 messages.
- `thoughts/shared/prs/265_description.md` (#234) introduced `init` reuse and activity recording, and decoupled anonymous retention from the anonymous refresh lifetime.
- `thoughts/shared/plans/singlepagestartup/ISSUE-199.md` and `thoughts/shared/prs/206_description.md` describe the MCP internal exchange that turns a subject JWT into a five-minute MCP token.
- `thoughts/shared/tickets/singlepagestartup/ISSUE-297.md` describes the two 30-second caches in front of permission decisions.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-234.md` - anonymous session initialization and retention.
- `thoughts/shared/research/singlepagestartup/ISSUE-229.md` - JWT error mapping.
- `thoughts/shared/research/singlepagestartup/ISSUE-199.md` - MCP authentication chain.

## Open Questions

- Revocation granularity: the subject row can carry a per-subject revocation mark without a new model; per-session revocation needs a session record that does not exist today.
- Transition for tokens issued before a type claim exists: the longest-lived are anonymous refresh tokens, valid for `RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS` after issue.
- Cache propagation: both 30-second caches are per process; a second API instance learns of a revocation only when its entries expire.
