---
date: 2026-09-18T02:12:00+03:00
researcher: flakecode
git_commit: 29370bcbf85b195fbd1c2422707141135184d6e0
branch: worktree-issues-2026-09-18
repository: singlepagestartup
topic: "Map expired JWT failures to 401 without logging token contents"
tags: [research, codebase, rbac, middlewares, backend-utils, http-error, exception-filter, jwt, response-pipe]
status: complete
last_updated: 2026-09-18
last_updated_by: flakecode
---

# Research: Map expired JWT failures to 401 without logging token contents

**Date**: 2026-09-18T02:12:00+03:00
**Researcher**: flakecode
**Git Commit**: 29370bcbf85b195fbd1c2422707141135184d6e0
**Branch**: worktree-issues-2026-09-18
**Repository**: singlepagestartup

## Research Question

Issue #229 reports that an expired RBAC subject JWT produces an HTTP 500 whose
message carries the full token into logs, the API response body, and the
Telegram bug channel. This document records how the current code produces that
outcome: where `jwt.verify` is called, what Hono puts into its error messages,
how `getHttpErrorType` classifies those messages, how the global
`IsAuthorizedMiddleware` loopback re-enters the same mapper, what the exception
filter writes and where, which other `jwt.verify` call sites share the path,
and what tests and conventions already exist. Every issue claim was checked
against live code at the commit above.

## Summary

- Hono 4.10.4 (`package-lock.json:29092-29093`) throws `JwtTokenExpired` with
  the message `token (${token}) expired`
  (`node_modules/hono/dist/utils/jwt/types.js:20-25`). Six of Hono's JWT error
  classes interpolate the token, header, or payload into their message.
- `is-authorized.ts:127` calls `jwt.verify` with no local `try/catch`; the
  error reaches the controller catch at
  `controller/singlepage/authentication/is-authorized/index.ts:74-77`, which
  calls `getHttpErrorType` and throws `HTTPException` at line 76.
- `getHttpErrorType` (`libs/shared/backend/utils/src/lib/http-error/index.ts`)
  finds no `[Category]` prefix, no numeric `status`, and no regex match for
  `token (...) expired` in `paterns/index.ts`, so it falls through to
  `{ status: 500, message: "Internal server error: <original>" }` at
  `index.ts:96-101`. The token stays in the message.
- The protected route is guarded by `IsAuthorizedMiddleware`
  (`apps/api/app.ts:171-172`), which calls the RBAC subject server SDK over
  HTTP to `${API_SERVICE_URL}/api/rbac/subjects/authentication/is-authorized`
  (`sdk/server/.../is-authorized.ts:54-57`). That loopback route is on the
  no-auth allow list (`libs/middlewares/src/lib/is-authorized/routes/singlepage.ts:19-22`).
  The loopback response (a 500 JSON body) is converted by `responsePipe` into
  an `HTTPException` whose `message` is the JSON-serialized payload
  (`libs/shared/utils/src/lib/response-pipe.ts:171-178`); the middleware catch
  at `libs/middlewares/src/lib/is-authorized/index.ts:105-108` runs
  `getHttpErrorType` again, which takes the JSON branch (`index.ts:11-44`) and
  preserves the token-bearing message with status 500.
- The exception filter (`libs/shared/backend/api/src/lib/filters/exception/index.ts`)
  therefore runs twice per expired-token request: once for the loopback request
  and once for the original. Each pass writes `logger.error` with the message
  and stack (`52-59`), sends a Telegram message containing
  `errorMessages.join(" | ")` when `BUG_SERVICE_*` is configured and
  `status >= 500` (`61-102`, template at `79`), and returns
  `{ requestId, path, method, status, error, stack, cause }` (`104-115`).
- Twenty-five non-test `jwt.verify` call sites use `hono/jwt` under `libs/`;
  all but three follow the same `catch → getHttpErrorType → HTTPException`
  contract. `apps/mcp/lib/oauth.ts` uses the separate `jsonwebtoken` library
  and already maps invalid or expired subject tokens to a 401 with a fixed
  message (`oauth.ts:394-402`).
- The existing 401 pattern `/signature mismatched/i` (`paterns/index.ts:15`)
  matches Hono's `token(${token}) signature mismatched` and keeps that token in
  the message. The `/jwt malformed/i` pattern (`paterns/index.ts:17`) matches
  `jsonwebtoken` wording, not Hono's `invalid JWT token: ${token}`
  (`types.js:10`), which today also falls through to 500.
- The six load-bearing files are byte-identical between `HEAD` and the upstream
  commit `961fe1bc37c3` the issue cites (`git diff --stat` is empty).
- Test coverage today: `http-error/index.spec.ts` asserts status and category
  only, with no expired-JWT case; `is-authorized.spec.ts` mocks `hono/jwt` to
  always succeed; the controller `is-authorized` spec is an integration test
  excluded by `libs/modules/rbac/jest.config.ts:4-8`; no spec under `libs/`
  mentions an expired JWT.

## Detailed Findings

### 1. Hono JWT verification and its error messages

- `hono` resolves to 4.10.4 (`package.json:136` declares `^4.10.2`;
  `package-lock.json:29092-29093` resolves 4.10.4). The `hono/jwt` entry point
  (`node_modules/hono/package.json:208-211`) re-exports `verify`, `decode`, and
  `sign` from `dist/utils/jwt/jwt.js` via `dist/middleware/jwt/index.js:2`.
- `verify` (`dist/utils/jwt/jwt.js:42-102`) checks in this order: three-part
  shape (`51-53`, `JwtTokenInvalid`), header validity (`55-57`,
  `JwtHeaderInvalid`), `nbf` (`60-62`, `JwtTokenNotBefore`), `exp` (`63-65`,
  `JwtTokenExpired`), `iat` (`66-68`, `JwtTokenIssuedAt`), optional `iss`/`aud`,
  and finally the signature (`92-101`, `JwtTokenSignatureMismatched`). The
  expiry check runs before the signature check, so an expired token is reported
  as expired whether or not its signature is valid.
- Error classes (`dist/utils/jwt/types.js`) and their messages:
  - `JwtTokenInvalid` (`8-13`): `invalid JWT token: ${token}`
  - `JwtTokenNotBefore` (`14-19`): `token (${token}) is being used before it's valid`
  - `JwtTokenExpired` (`20-25`): `token (${token}) expired`; `name` is `"JwtTokenExpired"`
  - `JwtTokenIssuedAt` (`26-33`): timestamps only
  - `JwtHeaderInvalid` (`40-45`): `jwt header is invalid: ${JSON.stringify(header)}`
  - `JwtHeaderRequiresKid` (`46-51`): serialized header
  - `JwtTokenSignatureMismatched` (`52-57`): `token(${token}) signature mismatched`
  - `JwtPayloadRequiresAud` (`58-63`): serialized payload
    Each class sets `this.name` to its class name, so the class is identifiable
    by `error.name` or `instanceof` in addition to the message text.
- `decode` (`jwt.js:141-152`) splits and base64-decodes without verification and
  throws `JwtTokenInvalid` on failure. The exception filter imports this
  `decode` (`filters/exception/index.ts:15`) to extract a subject id for the
  Telegram message.

### 2. The global authorization service and controller

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts`
  imports `* as jwt from "hono/jwt"` (`4`) and keeps a 30-second memory cache
  (`9`). `execute` (`112-227`) throws `Configuration error. RBAC_JWT_SECRET is
not defined` when the secret is absent (`115-117`). With an `authorization`
  value it looks up `jwt:subject:${authorization}` (`123-124`) and, on a miss,
  calls `await jwt.verify(authorization, RBAC_JWT_SECRET)` at `127` with no
  surrounding `try/catch`. Only a successful decode is cached (`137-138`).
  Subsequent validation throws `Validation error. No subject provided in the
token` (`130`) or `Validation error. Subject ID is not a string` (`134`).
  Authorization failure throws `Permission error. You do not have access to
this resource: ${JSON.stringify(props.permission)}` (`218-221`).
- The Subject service facade exposes `isAuthorized` as a pass-through to
  `isAuthorizedService.execute` (`service/singlepage/index.ts:203-204`), and the
  startup layer extends the singlepage service without overrides
  (`service/startup/index.ts:1-6`).
- The controller
  `controller/singlepage/authentication/is-authorized/index.ts` reads the
  secret key from header or cookie (`18-20`), returns `{ ok: true }` on an exact
  match (`26-32`), reads the JWT from the `rbac.subject.jwt` cookie or the
  `Authorization` header with `Bearer ` stripped (`53-56`), calls
  `this.service.isAuthorized` (`69`), and in `catch` (`74-77`) maps the error
  with `getHttpErrorType` and throws `new HTTPException(status, { message,
cause: details })` at line `76`. This is the first frame of the stack fragment
  in the issue (`index.ts:76:17`).
- The route is registered as `GET /authentication/is-authorized`
  (`controller/singlepage/index.ts:119-123`, handler at `716-717`), mounted
  under `/api/rbac` (`apps/api/app.ts:182`).
- Module README rules: `is-authorized.ts` "must stay thin" and resolve only
  permission and role access (`libs/modules/rbac/models/subject/README.md:15`,
  `:19`; `libs/modules/rbac/README.md:24`).

### 3. `getHttpErrorType` and the pattern table

- `libs/shared/backend/utils/src/lib/index.ts:4` exports
  `util as getHttpErrorType` from `./http-error`.
- `util(error)` (`http-error/index.ts:7-102`):
  - `extractMessage` returns `error.message`, or recurses into `error.cause`,
    or `String(error)` (`extract/index.ts:1-7`); `extractOriginalError` returns
    the deepest `cause` (`extract/index.ts:9-12`).
  - JSON branch (`11-44`): if `message` parses as JSON with a numeric `status`,
    the result uses `parsed.status`, `parsed.message`, and `parsed.cause ?? details`.
    Category comes from the `[Category]` prefix (`15-25`) or the first matching
    regex (`27-36`), else `"Internal error"` (`38-43`). The message text is
    returned unchanged in all three cases.
  - Numeric `error.status` branch (`49-56`) returns the status with category
    `"Internal error"` and the message unchanged.
  - Bracket-prefix branch (`58-83`): `parseCategoryFromMessage` matches
    `^\[([^\]]+)\]` (`parser/index.ts:6`); `Authentication error` maps to 401
    (`63-64`), `Validation error`/`Configuration error` to 400 (`66-68`),
    `Permission error` to 403, `Not Found error` to 404, else 500.
  - Regex branch (`85-94`) iterates `httpErrorPatterns` in array order and
    returns the entry's status with the message unchanged.
  - Fallback (`96-101`) returns `status: 500`, `message: "Internal server error:
${message}"`, category `"Internal error"`, and `details`.
- `httpErrorPatterns` (`http-error/paterns/index.ts`; the directory name is
  spelled `paterns`), in evaluation order:
  - 401 `Authentication error` (`4-19`): `/invalid credentials/i`,
    `/unauthorized/i`, `/token required/i`, `/no session/i`,
    `/authorization error/i`, `/no subject provided in the token/i`,
    `/invalid token issued/i`, `/signature mismatched/i` (`15`),
    `/invalid signature/i` (`16`), `/jwt malformed/i` (`17`).
  - 403 `Permission error` (`20-30`): `/forbidden/i`, `/permission/i`,
    `/authentication/i` (`26`), and two owner-specific phrases.
  - 500 `Internal error` (`31-47`): `/configuration error[.]?/i` (`35`),
    several `rbac_*` env phrases, `/internal server error/i` (`42`),
    `/request not created/i`, `/jwt secret not provided/i`, `/server error/i`.
  - 404 `Not Found error` (`48-63`).
  - 400 `Validation error` (`64-90`), including `/code is expired/i` (`83`).
- Applying these rules to Hono's messages (traced by reading; tests were not
  executed in this session, see Open Questions):
  - `token (<jwt>) expired` matches no pattern and reaches the fallback at
    `96-101`, yielding `Internal server error: token (<jwt>) expired` / 500.
  - `token(<jwt>) signature mismatched` matches `/signature mismatched/i` and
    returns 401 with the token still in the message.
  - `invalid JWT token: <jwt>` (Hono's malformed-token wording) matches no
    pattern and reaches the fallback (500). The `/jwt malformed/i` pattern
    corresponds to `jsonwebtoken` wording.
  - `token (<jwt>) is being used before it's valid` and `jwt header is invalid:
{...}` also match no pattern and reach the fallback.
  - A message beginning `Authentication error. ...` with no `[...]` prefix
    matches no 401 pattern and then matches the 403 entry's `/authentication/i`
    (`26`); the spec confirms this with `"Authentication failed"` → 403
    (`http-error/index.spec.ts:68`). Existing framework strings that start with
    `Authentication error.` also contain a 401-listed phrase, for example
    `Authentication error. Invalid token issued`
    (`controller/singlepage/authentication/refresh.ts:50`) matches
    `/invalid token issued/i`. The `[Authentication error]` prefix path
    (`index.ts:58-64`) yields 401 directly.
- `ErrorCategory` (`http-error/type/index.ts:3-11`) lists `Authentication
error`, `Validation error`, `Permission error`, `Configuration error`, `Not
Found error`, `Payment error`, `Internal error`, and `Other`; `UtilsProp`
  (`19-24`) is `{ status, message, category, details? }`.
- History: the patterns file was last changed in `d7aa6ea70c` (2026-04-25,
  "feat: implement authentication token persistence and management"); earlier
  commits `9d60d206df`, `e196b10d92`, `df413dcda6`, `60ce3e71c7` introduced the
  prefix parsing and multi-pattern table.

### 4. The middleware loopback and `responsePipe`

- `apps/api/app.ts` registers the exception filter with `app.onError`
  (`66-67`), then `ActionLoggerMiddleware` (`168-169`),
  `IsAuthorizedMiddleware` (`171-172`), `BillRouteMiddleware` (`174-175`), and
  `ParseQueryMiddleware` (`177-178`) before mounting module apps (`180-190`).
- `libs/middlewares/src/lib/is-authorized/index.ts` `init()` (`39-111`): reads
  the `Authorization` header (with `Bearer ` stripped) or the `rbac.subject.jwt`
  cookie (`45-47`); passes secret-key matches (`59-61`) and allow-listed routes
  (`63-65`) straight through; caches positive results under
  `${method}:${path}:${authorization}:${secretKey}` for 30 s (`28`, `74-77`,
  `103`); otherwise calls `subjectApi.authenticationIsAuthorized` with the
  `Authorization` header forwarded (`84-99`). The `catch` (`105-108`) maps the
  error through `getHttpErrorType` and throws `HTTPException` at line `107`,
  the second frame of the issue's stack fragment.
- Allow list: `routes/singlepage.ts:19-22` permits `GET`/`POST` to
  `/api/rbac/subjects/authentication/(is-authorized|me|init|refresh|bill-route)`
  without authentication, so the loopback request does not re-enter the
  middleware. The matcher is layered `options → startup → singlepage`
  (`routes/index.ts:18-27`).
- Server SDK action
  `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/authentication/is-authorized.ts`
  fetches `${host}${route}/authentication/is-authorized?${query}` (`54-57`)
  with `host` defaulting to `serverHost = API_SERVICE_URL`
  (`sdk/model/src/lib/index.ts:14`), then calls `responsePipe` with
  `catchErrors: props.catchErrors || productionBuild` (`59-62`).
- `responsePipe` (`libs/shared/utils/src/lib/response-pipe.ts`, exported from
  `libs/shared/utils/src/index.ts:12`): for a non-OK response it parses the JSON
  body (`108-114`), takes `errorJson.error || errorJson.message || errorJson.data
|| cause` as the primary message (`116-122`), builds `causes` from
  `errorJson.cause` with stacks only when `isDebug` (`133-145`), and assembles
  `errorPayload = { message, status, cause, requestId }` (`156-161`). With
  `catchErrors` it logs `❌ API Error:` and returns `undefined` (`163-169`). On
  the server it throws `new HTTPException(status, { message:
JSON.stringify(errorPayload), cause: errorPayload })` (`171-178`). In the
  browser it may clear auth state and throws a `ClientResponseError` whose
  message is either `Session expired. Please sign in again.` or the payload
  message (`180-205`); the expiry heuristic requires status 401 and either
  existing browser auth state or a message matching `sessionStatePattern`
  (`17-18`, `77-96`).
- Resulting flow for one expired-token request to a protected route:
  1. Middleware → loopback `GET /api/rbac/subjects/authentication/is-authorized`.
  2. Controller catch → `HTTPException(500, "Internal server error: token (<jwt>) expired")`.
  3. Exception filter pass 1 (loopback request): log, optional Telegram, JSON
     body with `error` and `stack` containing the token.
  4. `responsePipe` throws `HTTPException(500, JSON payload)` inside the
     middleware.
  5. Middleware catch → `getHttpErrorType` JSON branch → `/internal server
error/i` → `HTTPException(500, "Internal server error: token (<jwt>) expired",
cause: loopback causes)`.
  6. Exception filter pass 2 (original request): `JSON.parse(error.message)`
     fails (`33`, `45-47`), so the plain message is logged, optionally sent to
     Telegram, and returned to the client.

### 5. The exception filter: logs, notifications, response

- `libs/shared/backend/api/src/lib/filters/exception/index.ts` implements
  `IFilter` (`interface.ts:4-9`) and is registered from `apps/api/app.ts:66-67`
  (the DI-based default app also binds it at
  `libs/shared/backend/api/src/lib/app/default/index.ts:54`).
- `catch(error, c)` (`19-116`): reads `x-request-id` (`23`); takes
  `error.stack` and `HTTPException.status` or 500 (`26-27`); tries
  `JSON.parse(error.message)` to lift `message`, `status`, and `cause` entries
  (`32-44`), else pushes `error.message` (`47`); appends a cause with the joined
  messages and the stack (`50`).
- Logging (`52-59`): `logger.error("🚨 Exception [id] METHOD url",
JSON.stringify({ message, stack, status, causes }, null, 2))`. `logger` is a
  console or pino provider selected by `LOG_PROVIDER`
  (`libs/shared/backend/utils/src/lib/logger/index.ts:10-17`,
  `config.ts:3-5`); the pino provider sets only `level` and a dev transport
  (`providers/pino.ts:8-13`). Neither provider configures redaction.
- Bug notification (`61-102`): gated by `BUG_SERVICE_TELEGRAM_BOT_TOKEN`,
  `BUG_SERVICE_TELEGRAM_CHAT_ID`, `BUG_SERVICE_PROJECT`
  (`libs/shared/utils/src/lib/envs/host.ts:85-89`) and `status >= 500`. It
  decodes the `Authorization` header with Hono `decode` to obtain
  `payload.subject.id` (`68-74`), builds the HTML message
  `<b>project</b> 🚨 <i>status | method by subjectId</i> <pre>path</pre> Error:
${errorMessages.join(" | ")}` (`79`), sends via grammY `Bot` (`76`, `82-84`),
  retries on chat migration (`87-97`), and logs send failures with
  `console.error` (`99-101`). This is the only bug-notification sender in the
  repository (`grep BUG_SERVICE_` finds only the env file and this filter).
- Response (`104-115`): `c.json({ requestId, path, method, status, error:
errorMessages.join(" | "), stack, cause: causes }, status)`. The
  `HTTPException.cause` object passed by controllers (`details`) is not
  serialized; only `error.message` and `error.stack` are used.
- History: `b94e6d9a45` ("bug service") and `c4549cf370` ("filter errors")
  introduced the Telegram path and message parsing; later commits
  (`80dcbdd95d`, `4f3a08bfdf`, `fdaf9e7f74`) touched the file without changing
  this structure.

### 6. Other `jwt.verify` call sites

All sites below import `* as jwt from "hono/jwt"` and verify with
`RBAC_JWT_SECRET` (`libs/shared/utils/src/lib/envs/rbac.ts:19`; default token
lifetime 3600 s at `rbac.ts:10-13`).

Sites verifying a client-supplied token, with their catch blocks:

- `service/singlepage/is-authorized.ts:127` — no local catch; controller catch
  `authentication/is-authorized/index.ts:74-77`.
- `service/singlepage/billing/route.ts:83-86` (`getSubjectId`, same cache-key
  pattern `jwt:subject:${authorization}` at `79`) — no local catch; caller
  chain ends in `authentication/bill-route/index.ts:75-76` and the
  `BillRouteMiddleware` loopback catch `libs/middlewares/src/lib/bill-route/index.ts:66-68`.
- `service/singlepage/refresh.ts:35` (refresh token) — no local catch;
  controller catch `authentication/refresh.ts:68-70`.
- `controller/singlepage/authentication/me.ts:34` — catch `51-53`.
- `backend/app/middlewares/src/lib/request-subject-is-owner/index.ts:39` —
  catch `53-55`.
- `controller/singlepage/identity/create.ts:35` (catch `143-145`),
  `identity/update.ts:32` (`126-128`), `identity/delete.ts:33` (`122-124`).
- `controller/singlepage/crm-module/from/request/create.ts:53` (catch `220-222`).
- `controller/singlepage/ecommerce-module/order/create.ts:42` (`359-361`),
  `order/list.ts:37` (`101-103`), `order/quantity.ts:37` (`112-114`),
  `order/total.ts:40` (`149-151`), `order/id/delete.ts:52` (`120-122`),
  `order/id/quantity.ts:51` (`77-79`), `order/id/total.ts:51` (`77-79`),
  `order/id/update.ts:44` (`97-99`).
- `service/singlepage/authentication/oauth/start.ts:118` — wrapped in a local
  `try/catch` that returns `undefined` on any failure (`117-125`); the only
  site that deliberately swallows verification errors.
- `libs/middlewares/src/lib/actions-logger/index.ts:71` — inside a detached
  async block whose outer catch is empty (`155-157`); no HTTP effect.

Sites verifying a token the same handler just signed (used to read `exp` for
cookie expiry), all with `catch → getHttpErrorType → HTTPException`:
`authentication/init.ts:67` (catch `90-92`),
`authentication/refresh.ts:47` (`68-70`),
`email-and-password/authentication/index.ts:43` (`64-67`),
`email-and-password/registration/index.ts:36` (`56-58`),
`oauth/exchange.ts:47` (`68-70`), `ethereum-virtual-machine.ts:43` (`64-66`).

Commented-out: `libs/middlewares/src/lib/bill-route/index.ts:80`.

`apps/mcp/lib/oauth.ts` uses `jsonwebtoken` (`oauth.ts:9`;
`package.json:147` `^9.0.2`) for `verifyJwt` (`970-978`),
`getRbacSubjectIdFromAuthenticationJwt` (`980-1011`), and
`getVerifiedRbacSubjectIdFromAuthenticationJwt` (`1013-1035`). The internal
token exchange wraps the verified lookup in `try/catch` and throws
`InternalTokenExchangeError(401, "invalid_subject_token", "subject_token is
invalid or expired")` (`394-402`). `jsonwebtoken`'s expiry error message is
`jwt expired` (`node_modules/jsonwebtoken/verify.js:190`) and does not include
the token.

### 7. Existing tests and test conventions

- `libs/shared/backend/utils/src/lib/http-error/index.spec.ts` uses the
  repository BDD header (`1-7`) and `describe`/`test.each` blocks. The 401 block
  (`44-61`) includes `"token(abc.def.ghi) signature mismatched"` (`53`) and
  asserts only `status` and `category`, never the returned `message`. The 500
  block (`117-133`) covers configuration phrases; the fallback case is at
  `159-165`; the `cause` propagation case at `167-175`. No case uses an expired
  JWT message. The file also contains a 422 block (`100-114`) expecting
  category `"Unprocessable Entity error"`, which is absent from both
  `type/index.ts:3-11` and `paterns/index.ts`.
- The project is `@sps/backend-utils` (`libs/shared/backend/utils/project.json:2`,
  test target at `11-17`, `jest.config.ts` with `jest.server-preset.js`).
- `service/singlepage/is-authorized.spec.ts` mocks `hono/jwt` so `verify`
  always resolves `{ subject: { id: "subject-1" } }` (`18-22`); scenarios cover
  public permissions (`33`) and role matches (`82`). No failure path.
- `controller/singlepage/authentication/is-authorized/index.spec.ts` calls the
  live server SDK against `http://localhost:3000` (`55`) and is excluded by
  `libs/modules/rbac/jest.config.ts:4-8` (`testPathIgnorePatterns` for
  `.integration.spec.ts`, the email-and-password controller specs, and
  `authentication/is-authorized`). RBAC specs run under the `@sps/rbac` project
  (`libs/modules/rbac/project.json:2`).
- `libs/shared/utils/src/lib/response-pipe.spec.ts:32-57` (jsdom) uses
  `token(eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9) signature mismatched` as a 401
  fixture and asserts the message is passed through unchanged to the browser
  error; `response-pipe.server.spec.ts:21-51` asserts the server
  `HTTPException` carries `requestId` in both the JSON message and `cause`.
- `apps/mcp/lib/oauth.spec.ts:228-251` covers invalid and expired RBAC subject
  JWTs, expecting `{ status: 401, code: "invalid_subject_token" }`.
- A repository-wide grep for `expired` in `*.spec.ts` under
  `libs/modules/rbac/models/subject`, `libs/middlewares`, and
  `libs/shared/backend` finds only unrelated subscription/notification cases.
- `libs/middlewares/src/lib/is-authorized/routes/index.spec.ts:1-8` shows the
  BDD Suite header style used for middleware unit tests.

### 8. Verification of issue claims against live code

| Issue claim                                                                                 | Live code                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `is-authorized.ts:127` passes the bearer value to `jwt.verify`                              | Confirmed (`127`), no local catch                                                                                                                                                                             |
| `paterns/index.ts:7-18` lacks an expired-token shape                                        | Confirmed; patterns span `7-18`                                                                                                                                                                               |
| `http-error/index.ts:96-100` falls through to 500 with the raw message                      | Confirmed; the return object spans `96-101`                                                                                                                                                                   |
| `exception/index.ts:52-59`, `61-80`, `104-114`                                              | Confirmed; the Telegram block spans `61-102` (message at `79`), the response block `104-115`                                                                                                                  |
| Stack frames `is-authorized/index.ts:76:17` and `middlewares/is-authorized/index.ts:107:19` | Both lines are the `throw new HTTPException` statements                                                                                                                                                       |
| Load-bearing files identical in `upstream/main@961fe1bc37c3`                                | `961fe1bc37c3` exists locally; `git diff --stat 961fe1bc37c3 HEAD` over the six files is empty                                                                                                                |
| Mapper "recognizes malformed/signature JWT errors"                                          | Signature mismatch: yes (`/signature mismatched/i`, token retained). Malformed: `/jwt malformed/i` matches `jsonwebtoken` wording; Hono's `invalid JWT token: <jwt>` matches nothing and falls through to 500 |
| Acceptance: "Malformed and invalid-signature JWTs keep their existing 401 behavior"         | Holds for signature mismatch; Hono malformed-token errors do not currently produce 401                                                                                                                        |

## Code References

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts:115-140` — secret check, token cache, `jwt.verify` at `127`, subject validation.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts:203-204` — `isAuthorized` facade.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/is-authorized/index.ts:53-77` — token extraction, service call, catch and rethrow at `76`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:119-123`, `716-717` — route registration.
- `libs/middlewares/src/lib/is-authorized/index.ts:39-111` — global middleware; loopback at `84-99`; catch and rethrow at `105-108`.
- `libs/middlewares/src/lib/is-authorized/routes/singlepage.ts:19-22` — no-auth allow rule for the loopback route.
- `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/authentication/is-authorized.ts:54-62` — loopback fetch and `responsePipe`.
- `libs/modules/rbac/models/subject/sdk/model/src/lib/index.ts:14` — `serverHost = API_SERVICE_URL`.
- `libs/shared/utils/src/lib/response-pipe.ts:103-178` — non-OK handling; server `HTTPException` with JSON message at `171-178`; browser expiry heuristic at `17-18`, `77-96`, `180-205`.
- `libs/shared/backend/utils/src/lib/http-error/index.ts:7-102` — mapper; JSON branch `11-44`; prefix branch `58-83`; regex loop `85-94`; fallback `96-101`.
- `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts:4-19` — 401 patterns; `20-30` — 403 including `/authentication/i` at `26`; `31-47` — 500 including `/internal server error/i` at `42`.
- `libs/shared/backend/utils/src/lib/http-error/extract/index.ts:1-12` — message and cause extraction.
- `libs/shared/backend/utils/src/lib/http-error/parser/index.ts:3-12` — `[Category]` prefix parser.
- `libs/shared/backend/utils/src/lib/http-error/type/index.ts:3-24` — categories and result type.
- `libs/shared/backend/utils/src/lib/http-error/index.spec.ts:44-61`, `117-133`, `159-175` — current 401, 500, and fallback coverage.
- `libs/shared/backend/api/src/lib/filters/exception/index.ts:19-116` — filter; log `52-59`; Telegram `61-102`; response `104-115`.
- `apps/api/app.ts:66-67`, `168-178` — filter registration and middleware order.
- `libs/shared/backend/utils/src/lib/logger/index.ts:10-17`, `config.ts:3-5`, `providers/pino.ts:8-13` — logger selection and configuration.
- `libs/shared/utils/src/lib/envs/host.ts:85-89` — `BUG_SERVICE_*` variables; `envs/rbac.ts:10-19` — token lifetime and `RBAC_JWT_SECRET`.
- `libs/shared/backend/utils/src/lib/authorization/index.ts:4-11` — shared `authorization(c)` helper (cookie first, then header).
- `libs/modules/rbac/jest.config.ts:4-8` — excluded spec paths.
- `apps/mcp/lib/oauth.ts:394-402`, `970-978`, `1013-1035` — `jsonwebtoken` verification and 401 mapping; `apps/mcp/lib/oauth.spec.ts:228-251` — expired-token scenario.
- `node_modules/hono/dist/utils/jwt/types.js:8-57` — Hono JWT error classes; `dist/utils/jwt/jwt.js:42-102` — `verify` order of checks (read from the main checkout's `node_modules`, version 4.10.4).

## Architecture Documentation

- **Error contract**: services throw plain `Error` objects whose message starts
  with a category phrase (`Configuration error.`, `Validation error.`,
  `Permission error.`, `Not Found error.`, `Authentication error.`);
  controllers and middlewares catch, call `getHttpErrorType`, and throw
  `HTTPException(status, { message, cause: details })`. The mapper classifies by
  JSON-embedded status, `[Category]` prefix, or regex table, and in every branch
  returns the message text unchanged except the 500 fallback, which prefixes
  `Internal server error: `.
- **Loopback authorization**: the global middleware does not verify tokens
  itself; it calls the RBAC subject API over HTTP and relies on `responsePipe`
  to turn the API's JSON error body into a server `HTTPException` whose message
  is that JSON. `getHttpErrorType`'s JSON branch exists for this shape.
- **Single global error sink**: `ExceptionFilter.catch` is the only place that
  writes exception logs, sends bug notifications, and shapes error responses.
  It works from `error.message` and `error.stack`; `HTTPException.cause` is not
  serialized.
- **Bug notifications**: Telegram only, gated by three `BUG_SERVICE_*`
  variables and `status >= 500`; 401/403/404 never notify (also recorded in
  ISSUE-185 research).
- **Layering**: `is-authorized` service has `singlepage` and `startup` layers;
  the startup layer is an empty subclass. `http-error` and the exception filter
  have no layer split. Module README constrains `is-authorized.ts` to
  permission and role resolution.
- **Middleware placement rule** (CLAUDE.md): route middleware bodies live in
  `backend/app/middlewares/src/lib/*` packages; controllers compose only.
- **Test format** (CLAUDE.md): every spec carries a `BDD Suite`/`BDD Scenario`
  JSDoc with `Given`/`When`/`Then`; behavior-first names.
- **Dependency layout**: this worktree has no `node_modules`; Hono and
  `jsonwebtoken` sources were read from the main checkout's `node_modules`
  (same lockfile version).

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-181.md:64-66` — documents
  the `find-by-url` controller catch → `getHttpErrorType` → `HTTPException`
  chain and the exception filter's log (`:52`) and response (`:104`) lines; the
  same filter lines are load-bearing here.
- `thoughts/shared/research/singlepagestartup/ISSUE-185.md:70-71` — records
  that `/forbidden/i` maps to 403 and that the filter does not send Telegram
  alerts for 401/403/404 (`filters/exception/index.ts:61`).
- `thoughts/shared/research/singlepagestartup/ISSUE-174.md:49` — explains why
  production stacks point at handler catch lines rather than service lines
  (handlers rethrow through `getHttpErrorType`), which matches the stack
  fragment in this issue.
- `thoughts/shared/research/singlepagestartup/ISSUE-199.md:128-130`, `169-170`
  — maps the authorization path (`IsAuthorizedMiddleware` → SDK → controller →
  `is-authorized` service → `jwt.verify`) and lists verification sites
  (`me.ts:34`, `is-authorized.ts`, `bill-route`). Line numbers there predate
  the current file (`is-authorized.ts:118-134` is now `115-140`).
- `thoughts/shared/research/singlepagestartup/ISSUE-187.md:73-74`, `138` and
  `ISSUE-218.md:110`, `185` — describe the `X-RBAC-SECRET-KEY` bypass in the
  same middleware (`is-authorized/index.ts:59-61` today).
- `thoughts/shared/tickets/singlepagestartup/ISSUE-176.md` and `ISSUE-179.md`
  — log-watch bugs in Research Needed about `api_api` permission/balance
  errors (403-class) in the same authorization service; their process logs
  note that production log-watch issues are reproducible locally against the
  restored database dump.
- `thoughts/shared/plans/singlepagestartup/ISSUE-211.md:37` — notes that the
  shared API exception response already carries `requestId` and that
  server-side SDK normalization keeps it (this is the `responsePipe` payload
  documented above).

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-181.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-185.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-174.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-199.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-187.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-218.md`

## Open Questions

- Whether `BUG_SERVICE_TELEGRAM_BOT_TOKEN`, `BUG_SERVICE_TELEGRAM_CHAT_ID`, and
  `BUG_SERVICE_PROJECT` are set in the `didigallery` deployment, which decides
  whether the token reached Telegram; this is not visible from the repository.
- Whether the "four structured status records" in the audit correspond to the
  two exception-filter passes (loopback and original request) described in
  Finding 4; confirming this needs the production log lines.
- Whether `http-error/index.spec.ts` currently passes, given its 422 block
  expects a category that the pattern table does not define; tests were not run
  because this worktree has no `node_modules`.
- Which of the 25 Hono `jwt.verify` sites the plan treats as in scope for a
  shared boundary: sites that verify client-supplied tokens, sites that verify
  tokens the handler just signed, the swallowing site in `oauth/start.ts`, and
  the detached `actions-logger` block behave differently today.
- How the browser-side `responsePipe` expiry heuristic (`response-pipe.ts:17-18`,
  `77-96`), which keys on 401 plus specific message phrases, interacts with any
  new 401 message text; the phrase list currently does not include an
  expired-token wording.
- Whether the `/authentication/i` 403 pattern (`paterns/index.ts:26`) and the
  401 list ordering are intended to classify messages beginning with
  `Authentication error.` as 403 when no 401 phrase is present.
