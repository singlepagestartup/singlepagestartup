---
date: 2026-09-26T01:40:00+03:00
researcher: flakecode
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-305-session-cookie
repository: singlepagestartup
topic: "Session cookie attributes and client token handling"
tags: [research, codebase, rbac, authentication, cookies, middlewares, mcp, frontend-sdk]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Session cookie attributes and client token handling

**Date**: 2026-09-26
**Researcher**: flakecode
**Git Commit**: 78d7d43125
**Branch**: claude/issue-305-session-cookie
**Repository**: singlepagestartup

## Research Question

Where the API writes and reads the `rbac.subject.jwt` cookie and where any
code reads the operator secret from the `rbac.secret-key` cookie; how the
browser holds and sends its session; which callers depend on either cookie;
and how each of the two options in the ticket's agreed scope behaves against
the documented login paths and development setups:

- (a) the API writes its own `rbac.subject.jwt` cookie with `httpOnly: true`
  and keeps reading it;
- (b) the API takes the JWT only from the `Authorization` header.

## Summary

- Two cookies share the name `rbac.subject.jwt`. The browser writes one with
  js-cookie on the host origin after every login and copies it into
  `Authorization: Bearer` on the SDK requests built with `saturateHeaders`. The API writes a second one on
  its own origin at six issuance sites with `httpOnly: false`, `secure: true`,
  `sameSite: Strict`, `path: /`.
- The API reads the JWT from its cookie in five places: the shared
  `authorization` helper (cookie before header, 17 call sites), the
  is-authorized middleware (header before cookie), the subject `is-authorized`
  and `bill-route` controllers (cookie before header) and OAuth `start` (header
  before cookie).
- The operator secret is read from the `rbac.secret-key` cookie by
  `readRbacSecret`, the is-authorized and bill-route middlewares,
  `request-subject-is-owner`, the subject `is-authorized` and `bill-route`
  controllers and MCP `getMcpAuthHeaders`; the frontend header helper forwards
  it from `document.cookie`. Nothing in the repository writes that cookie.
- Cookies are scoped by host, not by port. With the tracked local layout (host
  on `localhost:3000`, API on `localhost:4000`) both `rbac.subject.jwt`
  cookies are one entry in the browser's jar. Measured in Chromium 152: a
  readable cookie set by one localhost port is shared with a page on another
  port; an HttpOnly one is invisible to that page and silently blocks the
  page's own `document.cookie` write of the same name.
- The browser's session logic reads the JWT only from `document.cookie`; with
  the JWT hidden it refreshes on every one-second tick.
- Every login response carries `{ jwt, refresh }` in the JSON body and every
  client login hook persists from the body; MCP OAuth reads `data.jwt` from the
  body. Server-side rendering sends `Authorization` built from the host
  cookie. No server code forwards a `Cookie` header to the API.
- These browser requests carry no `Authorization` header and today
  authenticate, when they do, only through the API-origin cookie: `init` and
  `logout` (allow-listed), identity `changePassword` (needs the root
  permission), the host page URL reads (public), six hand-written broadcast
  and social client functions with no in-repo caller, the
  `subjects-to-identities` read in the wallet component and the revalidation
  WebSocket, which reads no cookie.

## Detailed Findings

### 1. The API writes `rbac.subject.jwt` at six issuance sites

All paths below are relative to
`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/`.

| Site                                         | Lines   | Attributes                                                            | Before the cookie                                                     |
| -------------------------------------------- | ------- | --------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `init.ts`                                    | `32-38` | `path /`, `secure`, `httpOnly: false`, `expires` from `exp`, `Strict` | `RBAC_JWT_SECRET` guard `18-20`, re-verify and `exp` check `26-30`    |
| `refresh.ts`                                 | `53-60` | as above plus `maxAge: RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS`            | secret and lifetime guards `21-29`, re-verify and `exp` check `47-51` |
| `ethereum-virtual-machine.ts`                | `49-56` | as `refresh.ts`                                                       | secret and lifetime guards `21-29`, re-verify and `exp` check `43-47` |
| `oauth/exchange.ts`                          | `61-68` | as `refresh.ts`                                                       | secret and lifetime guards `23-31`, re-verify and `exp` check `55-59` |
| `email-and-password/authentication/index.ts` | `49-56` | as `refresh.ts`                                                       | secret and lifetime guards `21-28`, re-verify and `exp` check `43-47` |
| `email-and-password/registration/index.ts`   | `42-48` | as `init.ts`                                                          | secret guard `18-20`, re-verify and `exp` check `36-40`               |

- Each site returns `201 { data: { jwt, refresh } }` (`init.ts:40-48`,
  `refresh.ts:62-67` and the same shape at the other four).
- In every site the re-verify, the `exp` check and the lifetime guard feed only
  the cookie's `expires` and `maxAge`. The services that sign the tokens guard
  `RBAC_JWT_SECRET` themselves and always set `exp` from
  `RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS` (`service/singlepage/init.ts:49-51,81-88`,
  `refresh.ts:38-42,70`, `authentication/email-and-password.ts:52-56,187`,
  `authentication/ethereum-virtual-machine.ts:66-70,250`,
  `authentication/oauth/exchange.ts:43-45,121`).
- `logout.ts:18` calls `deleteCookie(c, "rbac.subject.jwt")`. In Hono 4.10.4
  that is `setCookie(name, "", { maxAge: 0 })` with the default `path: /`
  (`node_modules/hono/dist/helper/cookie/index.js:89-92`).
- The OAuth exchange code travels in a separate cookie,
  `rbac.oauth.exchange-code`, which is `httpOnly: true`, `secure`,
  `sameSite: Lax`, `maxAge` 120 s (`oauth/cookie.ts:9-17`), set by the
  callback (`oauth/callback.ts:32-39`) and cleared by the exchange on success
  and on failure (`oauth/exchange.ts:41-53`).
- `RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS` defaults to 3600
  (`libs/shared/utils/src/lib/envs/rbac.ts:10-13`), so an API-origin cookie
  lives at most one hour after its last issuance.

### 2. Where the API reads the JWT from its cookie

- `libs/shared/backend/utils/src/lib/authorization/index.ts:4-11`: cookie
  first, then `Authorization` with `Bearer ` stripped. Called by
  `actions-logger/index.ts:48`, `bill-route/index.ts:40`,
  `request-subject-is-owner/index.ts:32`, and in the subject controller by
  `authentication/init.ts:23`, `authentication/me.ts:16`, `identity/{create,update,delete}.ts`,
  `crm-module/from/request/create.ts:40` and the eight
  `ecommerce-module/order/**` handlers (the cart).
- `libs/middlewares/src/lib/is-authorized/index.ts:46-48`: header first, then
  cookie. The value is forwarded to the subject `is-authorized` route as
  `Authorization` (`:77-81`) and is part of the 30-second cache key (`:83`).
- Subject `authentication/is-authorized/index.ts:53-56` and
  `authentication/bill-route/index.ts:53-56`: cookie first, then header.
- `authentication/oauth/start.ts:32-34`: header first, then cookie. The token
  becomes `sourceSubjectId` in the OAuth state
  (`service/singlepage/authentication/oauth/start.ts:56-60,128-134`), so the
  callback needs no session.

### 3. Where the operator secret is read from `rbac.secret-key`

- `libs/shared/backend/utils/src/lib/rbac-secret/index.ts:12-14`
  (`readRbacSecret`): header, then cookie. Used by the operator-secret
  middleware (`libs/middlewares/src/lib/operator-secret/index.ts:27`, guarding
  `GET /api/http-cache/clear` and the Telegram `/run` and `/stop` routes) and
  by the telegram-star webhook
  (`billing/.../provider-webhook/index.ts:165-174`), whose only caller sends the
  header (`apps/telegram/src/lib/telegram-bot.ts:811-824`).
- `libs/middlewares/src/lib/is-authorized/index.ts:44-45`, compared at
  `:60`.
- `libs/middlewares/src/lib/bill-route/index.ts:38-39`, forwarded as a header
  (`:49-55`).
- `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-is-owner/index.ts:22-23`,
  compared at `:46`. `request-profile-subject-is-owner/index.ts:15-18`
  runs this middleware first and reads no cookie itself.
- Subject `authentication/is-authorized/index.ts:18-20` and
  `authentication/bill-route/index.ts:18-20`, compared at
  `:22-32`.
- `apps/mcp/lib/auth.ts:104-110`: the `rbac.secret-key` cookie of the incoming
  MCP request, reached only when no request auth context exists
  (`:87-99`; the HTTP transport sets one for every authenticated request,
  `apps/mcp/http.ts:124-133,204-245`).
- `libs/shared/frontend/client/utils/src/lib/authorization/headers.ts:8-11,19-21`:
  the browser forwards `rbac.secret-key` from `document.cookie` as
  `X-RBAC-SECRET-KEY`.
- No file in `apps`, `libs`, `tools`, `.agents` or `.claude` writes an
  `rbac.secret-key` cookie.
- `readRbacSecret` was introduced with the cookie read in `bf7127bcd3`
  (issue #276) so that a guard built on it would not narrow the ways the
  is-authorized middleware accepted the secret.

### 4. How the browser holds and sends the session

- `persistAuthenticationTokens` stores the refresh token in localStorage and
  writes `rbac.subject.jwt` with js-cookie: `path /`, `sameSite strict`,
  `expires` from `exp`, `secure` only on https
  (`libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/authentication/persist-authentication-tokens.ts:21-46`);
  `clearAuthenticationTokens` removes both (`:48-56`).
- `authorization.headers()` builds `Authorization: Bearer <jwt>` from
  `document.cookie` (`headers.ts:4-7,15-17`) and `saturateHeaders` merges it
  into caller headers (`saturate-headers/index.ts:3-15`). The shared query and
  mutation factories call `saturateHeaders`
  (`libs/shared/frontend/client/api/src/lib/factory/queries/find/index.tsx:53`
  and the same line in `find-by-id`, `count`, `create`, `update`, `delete`);
  every hand-written client hook that wraps a server SDK action passes
  `headers: saturateHeaders(...)`.
- The shared fetch actions send `credentials: "include"`
  (`libs/shared/frontend/api/src/lib/actions/find/index.ts:38` and the other
  actions), so the browser also attaches the API-origin cookie whenever the
  host and the API are same-site.
- `init-default` (mounted on every page, `apps/host/app/layout.tsx:42`) reads
  the JWT only from `document.cookie`
  (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/init-default/ClientComponent.tsx:28-48,70-72`).
  Without a valid JWT and with a valid refresh token it calls `refresh`
  (`:128-147`); without either it clears local state and calls `init`
  (`:150-167`). A successful `refresh` or `init` resets the de-duplication key
  (`:214-220`) and the effect re-runs on a one-second tick (`:222-228`).
- `response-pipe` reads the same cookie to decide whether a 401 ends the
  session (`libs/shared/utils/src/lib/response-pipe.ts:32-40,77-96`).
- Logout calls the API first and clears local state after it resolves
  (`.../sdk/client/src/lib/singlepage/authentication/logout.ts:36-49`).
- Login flows persist from the JSON body: email-and-password authentication
  and registration, Ethereum and OAuth exchange all call
  `persistAuthenticationTokens(result)` (`.../authentication/email-and-password/authentication.ts:47`,
  `registration.ts:47`, `ethereum-virtual-machine.ts:47`, `oauth/exchange.ts:47`).
  OAuth start and exchange both run on `/rbac/subject/authentication/select-method`
  (`select-method-default/ClientComponent.tsx:46-107`); the callback leg is a
  top-level navigation to the API that ends in a redirect to that page.

### 5. Browser requests that carry no `Authorization` header

| Request                                                                                                                                        | Why no header                                                                                                                                                                                                                                                                                                | Route access                                                                                                                              |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `init`, `logout`                                                                                                                               | the server SDK actions spread `options` and then replace `headers` (`sdk/server/.../authentication/init.ts:30-40`, `logout.ts:31-41`)                                                                                                                                                                        | allow-listed (`libs/middlewares/src/lib/is-authorized/routes/singlepage.ts:19-30`); `init` is called only without a valid JWT             |
| identity `changePassword`                                                                                                                      | builds its own request without `saturateHeaders` (`libs/modules/rbac/models/identity/sdk/client/src/lib/singlepage/index.ts:90-98`)                                                                                                                                                                          | no permission row matches the route, so only a subject holding the root permission passes (`service/singlepage/is-authorized.ts:229-273`) |
| host page `findByUrl`, `urlSegmentValue`                                                                                                       | merge the module default options instead of the caller's (`libs/modules/host/models/page/sdk/client/src/lib/singlepage/index.ts:60-186`)                                                                                                                                                                     | allow-listed public reads (`routes/singlepage.ts:64-67`)                                                                                  |
| broadcast channel `pushMessage`, `messageCreate`, `messageDelete`, `messageFind`; social chat `messageFind`; social profile `findByIdChatFind` | spread caller `options` without `saturateHeaders` (`libs/modules/broadcast/models/channel/sdk/client/src/lib/singlepage/*.ts`, `libs/modules/social/models/chat/sdk/client/src/lib/singlepage/message-find.ts:32-39`, `libs/modules/social/models/profile/sdk/client/src/lib/singlepage/chat-find.ts:34-41`) | no in-repo caller                                                                                                                         |
| `subjects-to-identities` read in the wallet login component                                                                                    | a `"use client"` component calls the server SDK without options (`ethereum-virtual-machine-default/ClientComponent.tsx:15,92-110`)                                                                                                                                                                           | decided by the permission for `GET /api/rbac/subjects-to-identities`; without the API cookie the lookup is anonymous                      |
| `/ws/revalidation`                                                                                                                             | a browser WebSocket cannot set headers (`apps/host/src/components/revalidation/ClientComponent.tsx:12-19`)                                                                                                                                                                                                   | the upgrade handler reads no cookie (`apps/api/app.ts:126-144`), so it is unaffected                                                      |

- Every other client SDK file that fetches calls `saturateHeaders`, and every
  server SDK action except `init` and `logout` keeps `options.headers`.
- Every direct API URL in a component points at `/public/*` static files
  (`file-storage/.../default/Component.tsx:10`,
  `social/.../chat-profile-avatar/Component.tsx:23`), which need no session.

### 6. Cookie identity across localhost ports (measurement)

A throwaway Bun server listened on `localhost:4391` (standing in for the API,
reflecting the origin with credentials) and `localhost:4392` (a host page). A
script on the `4392` page fetched `4391` with `credentials: "include"`, wrote
`document.cookie` and asked `4391` to echo the `Cookie` header it received.
Browser: the Claude browser pane, Chrome 152.0.7977.130.

| `Set-Cookie` from `4391`                               | `document.cookie` on `4392` after it | after `document.cookie = "probe=js; path=/"` | `4391` then receives |
| ------------------------------------------------------ | ------------------------------------ | -------------------------------------------- | -------------------- |
| `probe=api; Path=/; Secure; SameSite=Strict`           | `probe=api`                          | `probe=js`                                   | `probe=js`           |
| `probe=api; Path=/; HttpOnly; Secure; SameSite=Strict` | empty                                | empty                                        | `probe=api`          |

- The tracked env files place the host on `localhost:3000` and the API on
  `localhost:4000` (`apps/host/.env.development`, `apps/api/.env` generated by
  `create_env.sh`), so both `rbac.subject.jwt` cookies share one jar entry in
  local development. Chromium accepts the API's `Secure` cookie over
  `http://localhost`.
- With an HttpOnly API cookie in that jar, `persistAuthenticationTokens`
  writes nothing visible, `init-default` finds no JWT and calls `refresh` with
  the stored refresh token; each refresh response sets the HttpOnly cookie
  again and the de-duplication key resets on success, so the next tick
  refreshes again (section 4).
- Gitpod places host and API on one origin (`apps/host/create_env.sh:29-42`),
  which gives the same shared entry. Codespaces uses one hostname per port
  (`:19-28`), and the production example uses `singlepagestartup.com` and
  `api.singlepagestartup.com` (`apps/host/.env.production`), where the two
  cookies are separate.
- A script running on the API origin can use an HttpOnly cookie without
  reading it: same-origin requests carry it and the script reads the
  responses.

### 7. Server-side and service callers

- `me-default/server.tsx:9-12` reads the host cookie through Next.js
  `cookies()` and sends `Authorization: Bearer`; it is the only server code
  that reads the visitor's cookie.
- No code under `apps`, `libs` or `tools` sets a `Cookie` header on a request
  to the API.
- MCP forwards credentials as headers only (`apps/mcp/lib/auth.ts:89-131`,
  `auth-context.ts:15-31`). MCP OAuth signs in by posting to the
  email-and-password route and reads `data.jwt` from the body
  (`apps/mcp/lib/oauth.ts:845-880`).
- Telegram sends `X-RBAC-SECRET-KEY` as a header; the Telegram, OpenAPI and
  API apps read no cookie. The deployer templates reference only the unused
  `RBAC_COOKIE_SESSION_SECRET`.
- Scenario specs authenticate with `Authorization` and `X-RBAC-SECRET-KEY`
  headers (`apps/api/specs/scenario/singlepagestartup/issue-154/*.ts:29-35`,
  `issue-158/*.ts:33-39`, `issue-152/test-utils/http.ts:31`); the issue-152
  cart scenario writes the host cookie in jsdom and uses the real SDK flow
  (`issue-152/frontend-cart.scenario.spec.tsx:113`).

### 8. Tests that pin the current cookie behavior

- `libs/shared/backend/utils/src/lib/rbac-secret/index.spec.ts:145-181`: the
  cookie fallback and header precedence of `readRbacSecret`.
- `libs/middlewares/src/lib/operator-secret/index.spec.ts:151-170`: a
  control route runs with the secret in the cookie only.
- `libs/shared/frontend/client/utils/src/lib/authorization/headers.spec.ts:16-29`:
  the secret cookie becomes `X-RBAC-SECRET-KEY`.
- `.../authentication/oauth/exchange.spec.ts:150-168`: the session cookie is
  set with `sameSite: "Strict"` after a redemption.
- `apps/mcp/lib/content-management/auth.spec.ts:56-74`: the JWT cookie of an
  MCP request becomes `Authorization: Bearer`.
- `libs/modules/rbac/jest.config.ts:4-8` excludes the email-and-password
  controller folder (two placeholder specs that assert `false === true`) and
  the subject `is-authorized` controller folder (a spec that calls a live
  server) from the unit lane; the exclusions arrived with the module test
  matrix in `195269f24d`.
- No spec covers `IsAuthorizedMiddleware.init()`, the bill-route middleware,
  `request-subject-is-owner` or the `init`, `refresh` and Ethereum
  controllers.
- Baseline on this commit: `@sps/middlewares`, `@sps/backend-utils`,
  `@sps/shared-frontend-client-utils`, `@sps/shared-frontend-client-api` and
  `mcp` unit lanes pass (35 suites, 307 tests).

### 9. Documentation that describes the cookie paths

- `README.md:221-223`: MCP HTTP transports may forward `rbac.subject.jwt` or
  `rbac.secret-key`.
- `AI_GUIDE.md:175`: MCP auth may arrive as cookie `rbac.subject.jwt` or
  cookie `rbac.secret-key`.
- `libs/middlewares/src/lib/http-cache/README.md:60-61`: the clear route
  accepts the `rbac.secret-key` cookie.
- `tools/deployer/README.md:179`: the middleware accepts `RBAC_SECRET_KEY`
  from an `rbac.secret-key` cookie.
- `libs/shared/frontend/client/utils/README.md:21-29`: `headers()` returns
  `X-RBAC-SECRET-KEY`.
- `libs/modules/rbac/models/subject/README.md:55-60`: `init` reuses a session
  from the `rbac.subject.jwt` cookie or the `Authorization` header.

## Code References

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/init.ts:32-38` - API-origin session cookie at `init`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/logout.ts:18` - deletes the API-origin cookie
- `libs/shared/backend/utils/src/lib/authorization/index.ts:4-11` - cookie-first JWT reader
- `libs/shared/backend/utils/src/lib/rbac-secret/index.ts:12-14` - header-then-cookie operator secret reader
- `libs/middlewares/src/lib/is-authorized/index.ts:44-48` - secret and JWT reads, both with a cookie fallback
- `libs/middlewares/src/lib/bill-route/index.ts:38-40` - secret cookie fallback
- `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-is-owner/index.ts:22-23` - secret cookie fallback
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/is-authorized/index.ts:18-20,53-56` - secret and JWT cookie reads
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/bill-route/index.ts:18-20,53-56` - secret and JWT cookie reads
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/oauth/start.ts:32-34` - JWT cookie fallback
- `apps/mcp/lib/auth.ts:104-110` - secret cookie of an MCP request
- `libs/shared/frontend/client/utils/src/lib/authorization/headers.ts:1-24` - browser header builder
- `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/authentication/persist-authentication-tokens.ts:21-56` - browser token storage
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/init-default/ClientComponent.tsx:28-228` - session bootstrap from `document.cookie`
- `libs/modules/rbac/models/identity/sdk/client/src/lib/singlepage/index.ts:61-133` - `changePassword` without the session header
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/ethereum-virtual-machine-default/ClientComponent.tsx:92-110` - identity lookup without the session header

## Architecture Documentation

- The browser session is a bearer token held by host-origin JavaScript: a
  js-cookie JWT plus a localStorage refresh token, sent as
  `Authorization: Bearer` through `saturateHeaders`. Deployments whose API and
  host are on different registrable domains rely on the header alone, because
  a `SameSite=Strict` API cookie is never sent across sites; the OAuth
  exchange code has the `RBAC_OAUTH_EXCHANGE_CODE_IN_QUERY` escape hatch for
  that case (`libs/modules/rbac/models/subject/README.md:92`).
- The operator secret is a service credential: every framework service sends
  it as `X-RBAC-SECRET-KEY` (Telegram, the agents, the loopback SDK calls, the
  deployer cron, MCP).
- `@sps/backend-utils` owns the shared request readers (`authorization`,
  `readRbacSecret`) and the constant-time comparison `rbacSecretMatches`;
  middlewares and controllers that inline their own reads duplicate them.

## Historical Context (from thoughts/)

- `thoughts/shared/plans/singlepagestartup/ISSUE-234.md:46`: the server SDK
  `init` action drops caller headers, so a browser reuses its session through
  the cookie; the client calls `init` only without a valid JWT, so no
  framework caller depends on that reuse.
- `thoughts/shared/research/singlepagestartup/ISSUE-233.md:87-89`: `init`
  sets the cookie and `init-default` re-runs `init` whenever the JWT cookie
  and the refresh token are both invalid.
- `thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`
  (local): SEC-13 and SEC-07.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-234.md` - anonymous
  session reuse in `init`.
- `thoughts/shared/research/singlepagestartup/ISSUE-199.md` - MCP credential
  forwarding.

## Open Questions

None. Section 5 lists every browser request whose authentication depends on
the API-origin cookie; section 6 records how option (a) behaves in local
development.
