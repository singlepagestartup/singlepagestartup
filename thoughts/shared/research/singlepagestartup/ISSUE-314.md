---
date: 2026-09-26T00:49:34+03:00
researcher: flakecode
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-314-error-response-contents
repository: singlepagestartup
topic: "Review error response contents and error telemetry"
tags: [research, codebase, exception-filter, error-response, telemetry, telegram, envs, request-id]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Review error response contents and error telemetry

**Date**: 2026-09-26
**Researcher**: flakecode
**Git Commit**: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
**Branch**: claude/issue-314-error-response-contents
**Repository**: singlepagestartup

## Research Question

What does the shared exception filter return to a caller, write to the log and
send to Telegram today; which parts of the process decide those outputs (the
environment, the request id, the operator secret); and who reads the error body
it produces? The ticket names two claims to verify: the body carries `stack`
and `cause` for every error regardless of environment, and every 5xx awaits a
Telegram send when the `BUG_SERVICE_*` variables are set.

## Summary

Both claims hold on `78d7d43125`. `ExceptionFilter.catch` answers every error
with `{ requestId, path, method, status, error, stack, cause }`, where `stack`
is the sanitized server stack of the thrown error and `cause` repeats the
message chain with stacks
(`libs/shared/backend/api/src/lib/filters/exception/index.ts:107-118`). No
branch looks at the environment or the caller. For a status of 500 or more, with
the three `BUG_SERVICE_*` variables set, the filter builds a grammY `Bot` and
awaits `sendMessage` before it returns the response, including a second awaited
send after a chat migration (`index.ts:64-105`).

Four more facts shape any change to it:

- The API process runs with `NODE_ENV` unset in a deployment. Neither the
  Dockerfile nor the deployer template sets it, the tracked
  `apps/api/.env.production` is only loaded by Bun when `NODE_ENV` is already
  `production`, and Bun 1.3.6 leaves the variable undefined when it is not set
  (probe below). Local development (`npm run api:dev`) also runs with it unset.
  `NODE_ENV` therefore cannot tell a deployment from a developer machine.
- 173 bootstrap files bind the filter into their dependency-injection
  containers, and the main API app, every module and model app and the Telegram
  service register it with `onError`, so one process holds many filter
  instances.
- The request id is whatever the `x-request-id` header carries after
  `RequestIdMiddleware`; routes registered before that middleware and the
  Telegram service never get one, and the filter then writes the literal
  `unknown` into both the log line and the body.
- When a Telegram send fails on the network, the filter logs the grammY error
  object with `console.error`; printing that object includes the bot token,
  while the error's `message` does not (probe below).

## Detailed Findings

### 1. Exception filter: response body

- `requestId` is read from the request header, falling back to `"unknown"`
  (`index.ts:23`).
- `stack` is `sanitizeErrorMessage(error.stack)` (`index.ts:26`); `status` is
  the `HTTPException` status or 500 (`index.ts:27`); `path` is `c.req.url`, the
  full URL including the query string (`index.ts:28`).
- When `error.message` is JSON (an error rethrown from an SDK response), the
  filter lifts `message`, `status` and `cause` out of it; each cause's stack is
  read with `e.stack.replace(...)` (`index.ts:32-48`). A cause without a `stack`
  makes that line throw, and the `catch` then appends the raw JSON message to
  the message list (`index.ts:45-48`).
- Cause messages and stacks are sanitized, `errorMessages.join(" | ")` becomes
  `message`, and `{ message, stack }` is appended to `causes`
  (`index.ts:50-57`).
- The body carries the keys `requestId`, `path`, `method`, `status`, `error`
  (the joined message), `stack` and `cause` (the `causes` array), sent with the
  mapped status (`index.ts:107-118`). The message key is `error`; there is no
  `message` or `category` key.
- `sanitizeErrorMessage` rewrites the JWT-bearing messages of Hono's JWT errors
  and any `eyJ…` token-shaped substring to `<redacted>`
  (`libs/shared/backend/utils/src/lib/http-error/sanitize/index.ts:10-61`). It
  applies to `message`, `stack` and every cause.

### 2. Exception filter: log record

- One `logger.error` call per error, before the Telegram branch:
  `🚨 Exception [<requestId>] <method> <url>` followed by
  `JSON.stringify({ message, stack, status, causes })` (`index.ts:59-62`).
- `logger` is the console provider unless `LOG_PROVIDER=pino`
  (`libs/shared/backend/utils/src/lib/logger/index.ts:6-18`,
  `logger/config.ts:1-7`).

### 3. Exception filter: Telegram report

- Gate: `BUG_SERVICE_TELEGRAM_BOT_TOKEN`, `BUG_SERVICE_TELEGRAM_CHAT_ID`,
  `BUG_SERVICE_PROJECT` and `status >= 500` (`index.ts:64-69`). The variables
  are defined in `libs/shared/utils/src/lib/envs/host.ts:115-119` and appear in
  no deployer template.
- The subject id comes from `decode()` of the `Authorization` header
  (`index.ts:71-77`); a header that is not a decodable JWT throws inside the
  same `try`, so the report is not sent and the failure is logged.
- A new `Bot` is constructed per error (`index.ts:79`). The report is sent in
  HTML parse mode with the project in bold, then the status, the method, the
  subject id when one was decoded, the full URL and the message (`index.ts:82`).
- `await bot.api.sendMessage(...)` runs before the response is built; on a 400
  carrying `migrate_to_chat_id` a second `await sendMessage` follows
  (`index.ts:84-101`). Every other failure is caught and printed with
  `console.error("Failed to send error message to Telegram bot:", error)`
  (`index.ts:102-104`).
- There is no rate limit, queue or de-duplication. Every 5xx produces one send
  attempt.
- Probe, grammY 1.35.0 on Bun 1.3.6, fake token, API root pointed at a closed
  local port: the thrown `HttpError.message` is
  `Network request for 'sendMessage' failed!` and does not contain the token;
  `Bun.inspect(error)`, which is what `console.error` prints, does contain it,
  through the nested fetch error (`node_modules/grammy/out/core/error.js:62-89`).

### 4. Where the filter runs

- Main API: `app.onError((err, c) => exceptionFilter.catch(err, c))`
  (`apps/api/app.ts:66-67`).
- Default model app: `this.hono.onError(this.exceptionFilter.catch.bind(...))`
  (`libs/shared/backend/api/src/lib/app/default/index.ts:54`), with the filter
  injected through `DI.IExceptionFilter`
  (`libs/shared/backend/api/src/lib/di/constants.ts:2`).
- `bind<IExceptionFilter>(DI.IExceptionFilter).to(ExceptionFilter)` appears in
  173 bootstrap files across `libs/modules/**` and
  `apps/telegram/src/lib/bootstrap.ts:6`; module aggregator apps register it the
  same way (for example `libs/modules/agent/backend/app/api/src/lib/app.ts:29`)
  and so does the Telegram service (`apps/telegram/src/lib/app.ts:35`).
- Hono 4.10.4 wraps each route of a mounted sub-app in that sub-app's error
  handler, so a handler error reaches the filter instance of the app that owns
  the route, and a main-app middleware error reaches the main instance.
- Probe, Hono 4.10.4: inside `onError`, `c.req.routePath` is the matched
  pattern of the route that threw (`/api/host/pages/:id` for requests to
  `/api/host/pages/abc?x=1` and `/api/host/pages/zzz`,
  `/api/host/subjects/:uuid/check` for a nested app) and `/*` for a main-app
  middleware. `c.req.routePath` is marked deprecated in favour of `routePath(c)`
  from `hono/route`, which returns `""` when no route matched
  (`node_modules/hono/dist/types/request.d.ts:268-284`,
  `node_modules/hono/dist/helper/route/index.js:4-5`). The root `package.json`
  requires `hono ^4.10.2`.

### 5. What reaches the filter

- 324 lines under `libs/` and `apps/` reference `getHttpErrorType`. The common
  shape is a `catch` that maps the error and throws
  `new HTTPException(status, { message, cause: details })`, for example
  `libs/shared/backend/api/src/lib/controllers/rest/handler/find/index.ts:29-31`
  and `libs/middlewares/src/lib/bill-route/index.ts:66-68`.
- `getHttpErrorType` returns `{ status, message, category, details }`
  (`libs/shared/backend/utils/src/lib/http-error/index.ts:10-131`,
  `http-error/type/index.ts:21-26`). The handlers drop `category`, and the
  filter never reads `error.cause`, so neither the category nor the original
  error's stack reaches the body or the log. The body's `stack` is the stack of
  the `HTTPException` built in the handler's `catch`. The category name reaches
  the caller only where the mapped message text carries it, as in
  `Validation error. …`, `Conflict error. Entity already exists` or
  `Internal server error: …`.

### 6. Request id

- `RequestIdMiddleware` takes the caller's `x-request-id` or a `nanoid()` and
  writes it onto the raw request headers; it sets no response header
  (`libs/middlewares/src/lib/request-id/index.ts:10-17`).
- The main API registers it after the CORS middleware, the `onError` handler and
  the `/public/*` static route (`apps/api/app.ts:41-117`). An error in the static
  route (for example a `URIError` from `decodeURIComponent` at `app.ts:70-72`)
  reaches the filter without the header.
- The Telegram service app (`apps/telegram/app.ts`) registers no request-id
  middleware, so its error bodies and log lines carry `unknown`.

### 7. Operator secret helpers

- `readRbacSecret(c)` returns the `X-RBAC-SECRET-KEY` header or the
  `rbac.secret-key` cookie; `rbacSecretMatches(provided)` compares with
  `RBAC_SECRET_KEY` in constant time and refuses everyone when the variable is
  unset or empty (`libs/shared/backend/utils/src/lib/rbac-secret/index.ts:12-36`,
  exported from `libs/shared/backend/utils/src/lib/index.ts:10`).
- Callers that send the secret: the is-authorized and bill-route middlewares
  forward the caller's own secret to the subject app only when the caller sent
  one (`libs/middlewares/src/lib/is-authorized/index.ts:44-45,78`,
  `bill-route/index.ts:38-54`); the observer and action-logger middlewares, the
  MCP server (`apps/mcp/lib/auth.ts:91,123`), the host seed
  (`apps/host/src/db/seed.ts:331,345`) and the browser helper that reads the
  `rbac.secret-key` cookie
  (`libs/shared/frontend/client/utils/src/lib/authorization/headers.ts:20`).

### 8. `NODE_ENV` in the API process

- `apps/api/package.json` runs `bun run --watch server.ts` for `dev` and
  `bun server.ts` for `start`, both with `apps/api` as the working directory
  (`apps/api/project.json` targets `dev` and `start`).
- `apps/api/env.ts:3` loads `.env` with dotenv. Bun additionally loads `.env`,
  `.env.<NODE_ENV>` and `.env.local` from the working directory.
- The tracked `apps/api/.env.production` sets `NODE_ENV=production` on its
  first line. The Dockerfile sets no `NODE_ENV` (`Dockerfile:1-63`), the
  deployer template sets none (`tools/deployer/api/api.env.j2`), and
  `start.sh api` writes `printenv` into `apps/api/.env` before
  `npm run api:start` (`start.sh:10-14`, `create_env.sh:3-11,33-37`).
- Probe, Bun 1.3.6, a directory holding `.env.production` (which sets
  `NODE_ENV=production`) and `.env.development`: with `NODE_ENV` unset, Bun
  loaded `.env.development`, not `.env.production`, and `process.env.NODE_ENV`
  stayed undefined; with `NODE_ENV=production` it loaded `.env.production`. The
  `NODE_ENV=production` line in `apps/api/.env.production` therefore never takes
  effect in a deployment.
- `apps/api/create_env.sh` writes no `NODE_ENV` for local development
  (`apps/api/create_env.sh:20-116`).
- Current readers of `NODE_ENV` in shared code: the logger config and both
  providers compare with `development`
  (`libs/shared/backend/utils/src/lib/logger/config.ts:5`,
  `providers/console.ts:17`, `providers/pino.ts:29`), and `responsePipe`
  includes cause stacks only when `NODE_ENV=development` or `DEBUG=true`
  (`libs/shared/utils/src/lib/response-pipe.ts:12-13,137,142`). None of them is
  in `libs/shared/utils/src/lib/envs`.
- Probe, Bun 1.3.6 with dotenv: a variable present but empty in the process
  environment is kept over the value in `.env` by both loaders.

### 9. Environment module conventions

- `libs/shared/utils/src/lib/envs/*.ts` export one constant per variable with a
  documented default and are re-exported through `envs/index.ts` and
  `libs/shared/utils/src/index.ts:7`.
- A mode is a single expression with a JSDoc that names the safe default and
  the opt-out: `API_SECRET_STRENGTH: "enforce" | "report"`
  (`libs/shared/utils/src/lib/envs/api.ts:1-9`). Booleans compare with
  `"true"` (`envs/rbac.ts:52-53`, `envs/host.ts:88-89`); durations use
  `Number(process.env[...]) || <default>` with `_IN_SECONDS` or `_MS` names
  (`envs/rbac.ts:8-28`, `envs/host.ts:75-80`).
- `API_SECRET_STRENGTH` is documented in `tools/deployer/README.md:143-150` and
  is in no template. `apps/api/README.md:3-8` lists API environment values under
  "Environment". The root `README.md:429-435` documents the error body as
  `statusCode`, `message` and `requestId`, which differs from the keys the filter
  writes.

### 10. In-memory window helper

- `createMemoryCache({ ttlMs, maxSize })` from `@sps/shared-utils` stores entries
  with an expiry, drops an expired entry on read and evicts the oldest key when
  `maxSize` is reached (`libs/shared/utils/src/lib/memory-cache.ts:11-49`,
  exported at `libs/shared/utils/src/index.ts:18`).
- Module-level instances hold per-process windows today:
  `libs/middlewares/src/lib/is-authorized/index.ts:29` (30 s, 5000 entries),
  `libs/modules/rbac/models/permission/backend/app/api/src/lib/service/singlepage/index.ts:17`
  and two subject services (30 s, 10 000 entries).

### 11. Consumers of the error body

The codebase-locator pass searched `libs/shared/**`, `libs/modules/**/sdk/**`,
`libs/middlewares/**`, `apps/mcp/**`, `apps/telegram/**`, `apps/host/**`,
`apps/api/specs/**` and `tools/**` for readers of the body keys.

- `responsePipe` is the shared reader of the HTTP body. It takes the primary
  message from `error`, then `message`, `data` or the first cause message; it
  takes `requestId` from the body or the `x-request-id` response header; it
  copies cause messages, with stacks only when its own process runs with
  `NODE_ENV=development` or `DEBUG=true`
  (`libs/shared/utils/src/lib/response-pipe.ts:116-145`). Without a `cause` key,
  `causes` stays an empty array. The server path rethrows
  `HTTPException(status, { message: JSON.stringify(errorPayload) })` with
  `errorPayload = { message, status, cause, requestId }` (`:156-178`); the
  browser path throws a `ClientResponseError` carrying the same payload
  (`:179-205`). Its specs build error bodies that have `requestId` and `error`
  and no `stack` or `cause` (`response-pipe.spec.ts:176-197`,
  `response-pipe.server.spec.ts:21-51`).
- Every generated SDK reaches the body only through `responsePipe`; SDK catch
  blocks read `error.message`. `apps/mcp/**` and `apps/host/**` read none of the
  keys. No spec asserts on `stack` or `cause` of an API error body.
- `getHttpErrorType` parses a rethrown `errorPayload` and keeps `parsed.cause`
  as `details` (`libs/shared/backend/utils/src/lib/http-error/index.ts:27-31`);
  with no body `cause`, `details` becomes `[]`. The filter never serializes
  `details`.
- `isUniqueConstraintError` checks the top-level message, the SQLSTATE `code`,
  a 409 `status` and the record message before it walks `cause`, `causes` and
  `payload` (`libs/shared/backend/utils/src/lib/unique-constraint-error/index.ts:60-110`).
  Its two runtime callers, the Telegram bootstrap retry
  (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:831-863`)
  and the OAuth callback, call the API with `X-RBAC-SECRET-KEY`
  (`bootstrap.ts:112-117`, `authentication/oauth/callback.ts:100,272`). The spec
  case "reports a violation nested inside a cause array"
  (`unique-constraint-error/index.spec.ts:54-67`) builds its error object
  directly and does not read an HTTP body.
- The Telegram service reads `requestId` and `status` from the top level of the
  error, its `cause` or its `payload`, and stringifies `cause` into the text it
  matches for transient and duplicate-payment errors
  (`apps/telegram/src/lib/telegram-bot.ts:164-194,256-300`). The agent service
  collects messages from `message`, `error`, `data` and `cause`
  (`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:398-463`).
  The filter joins every cause message into `error`, so the same text is also
  at the top level.
- The issue-154 scenario reads the status from `err.status`, `err.cause.status`
  or the parsed message (`apps/api/specs/scenario/singlepagestartup/issue-154/backend-social-chat-threads.scenario.spec.ts:39-60`);
  all three come from the HTTP status, not from the body's `cause`.

### 12. Side effects of an error response in the main API

- The HTTP cache stores only 2xx GET responses; any 5xx bumps the version of
  the path and of the path without its id in Redis
  (`libs/middlewares/src/lib/http-cache/index.ts:365-398`). It is active only
  when `MIDDLEWARE_HTTP_CACHE=true` (`apps/api/app.ts:162-166`).
- The observer, action-logger and revalidation middlewares act only on 2xx
  mutations (`libs/middlewares/src/lib/observer/index.ts:61-64`,
  `actions-logger/index.ts:63-65`, `revalidation/index.ts:97-98`), so a failing
  GET writes nothing through them.

### 13. Tests

- No spec covers the exception filter. `libs/shared/backend/api` has seven
  specs, none under `filters/`. The default-app spec replaces the filter with a
  stub (`libs/shared/backend/api/src/lib/app/default/index.spec.ts:29-37`) and
  the Telegram app spec mocks the DI symbol only
  (`apps/telegram/src/lib/app.spec.ts:16-22`).
- `jest.setup.ts:11-13` loads `apps/api/.env` into every jest process, so a
  spec that sends a 5xx through the real filter on a checkout whose `.env` has
  the `BUG_SERVICE_*` keys would attempt a real Telegram send.
- The open-ai wrapper spec isolates module state per scenario with
  `jest.resetModules()`, `jest.doMock()` and a dynamic import
  (`libs/shared/third-parties/src/lib/open-ai/index.spec.ts:10-61`).
- `@sps/shared-backend-api` runs with `npx nx run @sps/shared-backend-api:jest:test`
  (`libs/shared/backend/api/project.json`, `jest.config.ts`); it is not in the
  `test:unit:scoped` project list (`package.json:29`).

## Code References

- `libs/shared/backend/api/src/lib/filters/exception/index.ts:23-62` - request id, stack, status, cause parsing and the log record
- `libs/shared/backend/api/src/lib/filters/exception/index.ts:64-105` - awaited Telegram report
- `libs/shared/backend/api/src/lib/filters/exception/index.ts:107-118` - error body with `stack` and `cause`
- `libs/shared/backend/api/src/lib/filters/exception/interface.ts:4-9` - `IFilter.catch` contract
- `libs/shared/backend/utils/src/lib/http-error/sanitize/index.ts:49-61` - credential redaction
- `libs/shared/backend/utils/src/lib/rbac-secret/index.ts:12-36` - operator secret read and compare
- `libs/shared/utils/src/lib/envs/api.ts:1-9` - `API_SECRET_STRENGTH` mode
- `libs/shared/utils/src/lib/envs/host.ts:115-119` - `BUG_SERVICE_*`
- `libs/shared/utils/src/lib/memory-cache.ts:11-49` - in-memory window helper
- `libs/middlewares/src/lib/request-id/index.ts:10-17` - request id on the request headers
- `apps/api/app.ts:66-117` - filter registration, static route and request-id order
- `apps/api/create_env.sh:20-116` - local API environment
- `tools/deployer/api/api.env.j2` - deployment API environment
- `libs/shared/utils/src/lib/response-pipe.ts:98-205` - client reader of the error body

## Architecture Documentation

- The filter is one class with no `singlepage`/`startup` split; the seam for a
  project is the `DI.IExceptionFilter` binding in each bootstrap.
- Error mapping happens in the handlers through `getHttpErrorType`; the filter
  shapes, logs and reports whatever `HTTPException` reaches it.
- Environment values are read through `libs/shared/utils/src/lib/envs/*.ts`;
  shared utilities outside that folder still read `NODE_ENV` directly.
- Per-process windows are module-level `createMemoryCache` instances.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-229.md` documents the same
  filter before `sanitizeErrorMessage` existed and notes that the filter never
  serializes `HTTPException.cause`, and that one failing request can pass the
  filter twice: once in the loopback authorization call and once in the original
  request.
- `thoughts/shared/research/singlepagestartup/ISSUE-223.md` records that neither
  the Dockerfile nor the deployer sets `NODE_ENV` and leaves open whether Bun
  loads `apps/api/.env.production`; the probe in section 8 answers it for Bun
  1.3.6.
- The 2026-09-19 audit (SEC-12) described the same body and report; its
  remediation plan, kept locally, proposed an `API_ERROR_DETAILS` switch
  defaulting to off, set on for development by `create_env.sh`, and a
  de-duplicated, capped, unawaited report.
- `thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`
  Part 1 marks SEC-12 as partial after `sanitizeErrorMessage`.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-229.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-232.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-223.md`

## Open Questions

- Whether any deployment of a downstream project sets `NODE_ENV=production` on
  the API process; the repository cannot show it, and it decides which of those
  deployments already hide details under a `NODE_ENV`-only rule.
