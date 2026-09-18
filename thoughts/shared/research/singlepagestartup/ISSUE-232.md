---
date: 2026-09-18T02:12:39+03:00
researcher: flakecode
git_commit: 29370bcbf85b195fbd1c2422707141135184d6e0
branch: worktree-issues-2026-09-18
repository: singlepagestartup
topic: "Map PostgreSQL unique violations to HTTP 409 without exposing database details"
tags: [research, codebase, http-error, backend-utils, shared-backend-api, rest-create-handler, exception-filter, response-pipe, postgres, drizzle, blog-article]
status: complete
last_updated: 2026-09-18
last_updated_by: flakecode
---

# Research: Map PostgreSQL unique violations to HTTP 409 without exposing database details

**Date**: 2026-09-18T02:12:39+03:00
**Researcher**: flakecode
**Git Commit**: 29370bcbf85b195fbd1c2422707141135184d6e0
**Branch**: worktree-issues-2026-09-18
**Repository**: singlepagestartup

## Research Question

What happens today when a PostgreSQL unique violation (`SQLSTATE 23505`) is raised during a create request in the shared backend: how the driver error is shaped, whether Drizzle or the repository layer rewrap it, how `getHttpErrorType` classifies it, what the exception filter logs and returns to the client, how a nested server-SDK call re-wraps the failure on each hop, what unique-violation handling already exists in modules, which tests and documentation cover the error mapper, and whether the file and line claims in issue #232 hold against live code.

## Summary

- The `postgres` driver (3.4.5) builds `PostgresError` by `Object.assign(this, x)` over the parsed server fields, so a unique violation carries `code: "23505"`, `constraint_name`, `table_name`, `column_name`, `schema_name`, and `detail` as own properties (`node_modules/postgres/src/errors.js:1-7`, `node_modules/postgres/src/connection.js:31-50`). Drizzle 0.38.4's postgres-js session calls `client.unsafe()` without a try/catch and has no `DrizzleQueryError` wrapper, and the shared repository `insert` rethrows every non-Zod error unchanged (`libs/shared/backend/api/src/lib/repository/database/index.ts:220-225`). The structured driver error therefore reaches the REST handler intact.
- `getHttpErrorType` never reads `code` or any driver field. It classifies by a `[Category]` message prefix, by regex patterns over the message text, or by a numeric `status` property, and otherwise returns `500` with `Internal server error: ${message}` (`libs/shared/backend/utils/src/lib/http-error/index.ts:58-101`). The pattern table has no 409 entry and the `ErrorCategory` union has no conflict member (`paterns/index.ts:3-91`, `type/index.ts:3-11`). For the text `duplicate key value violates unique constraint "..."`, no pattern matches, so the fallback branch runs and the constraint name stays in the message.
- Every generic REST handler uses the same catch block: `getHttpErrorType(error)` then `throw new HTTPException(status, { message, cause: details })`, where `details` is the deepest `.cause` of the thrown error, which for a direct insert is the `PostgresError` object itself (`handler/create/index.ts:40-43`, `http-error/extract/index.ts:9-12`).
- The exception filter reads only `error.message` and `error.stack`, logs one `🚨 Exception` record, and returns `{ requestId, path, method, status, error, stack, cause }` to the client (`libs/shared/backend/api/src/lib/filters/exception/index.ts:23-59`, `104-115`). The constraint name (inside the message) and the handler stack are client-visible; `detail`, `table_name`, and `column_name` live on the `HTTPException.cause` object, which the filter does not serialize.
- Nested hops re-wrap the same text once per HTTP call: the server SDK's `responsePipe` throws `HTTPException(status, { message: JSON.stringify(payload), cause: payload })` (`libs/shared/utils/src/lib/response-pipe.ts:171-178`); the caller's `getHttpErrorType` JSON branch keeps the downstream status and maps the `Internal server error: ...` text to `Internal error` via the `/internal server error/i` pattern (`http-error/index.ts:11-44`, `paterns/index.ts:42`); each mounted Hono app has its own exception filter, so each hop logs once (`apps/api/app.ts:66-67`, `app/default/index.ts:54`, `node_modules/hono/dist/hono-base.js:87-100`).
- No shared code inspects `23505`. Three module-level paths recover from duplicate inserts: `ensureEntity` and `createSubjectRoleIfMissing` re-read after any create failure without checking the error, and the OAuth callback tests `error.message` against `/duplicate key value violates unique constraint/i` (`knowledge/access.ts:109-119`, `telegram/sync-membership.ts:62-87`, `oauth/callback.ts:601-609`). A unit fixture already models a driver-shaped error with `code: "23505"` (`knowledge/access.spec.ts:52-54`).
- The mapper's spec is BDD-formatted and message-driven. Run at HEAD it fails 6 of 65 cases: the `422 - Unprocessable Entity error` block expects a category that was removed from the pattern table in commit `9d60d206df` (2025-10-23) while the spec kept it (`http-error/index.spec.ts:100-114`). `@sps/backend-utils` exposes the suite through an Nx target named `test`, not `jest:test`, and neither `@sps/backend-utils` nor `@sps/shared-backend-api` appears in the `package.json` scoped test scripts.
- 52 model field files declare `.unique()` columns. The blog article `slug` is one of them and maps to the constraint `sps_blog_article_slug_unique`; the article backend uses the unmodified `RESTController` and `CRUDService` (`fields/singlepage.ts:14-18`, `migrations/0000_material_monster_badoon.sql:12`, `controller/index.ts:6-9`, `service/index.ts:6-7`).
- All four upstream line references in the issue hold at HEAD. The didigallery `service/startup/compose.ts` path does not exist upstream, as the issue itself states. The root README documents `Unprocessable Entity error (422)` and `Payment error (400)` categories and a `statusCode`/`message`/`requestId` error shape that differ from the live pattern table and filter output (`README.md:421-461`).

## Detailed Findings

### 1. Driver error shape (`postgres` 3.4.5)

- The API opens one `postgres()` client with pool and timeout options and no `debug` flag (`libs/shared/backend/database/config/src/lib/postgres.ts:29-37`), then wraps it with Drizzle (`postgres.ts:66-82`). Without `debug`, the driver's `query` and `parameters` fields are not attached to errors (`node_modules/postgres/types/index.d.ts:223-226`).
- On a server `ErrorResponse`, the driver parses the wire fields and constructs a `PostgresError` (`node_modules/postgres/src/connection.js:786-794`). The field map assigns `C` to `code`, `M` to `message`, `D` to `detail`, `s` to `schema_name`, `t` to `table_name`, `c` to `column_name`, and `n` to `constraint_name` (`connection.js:31-50`).
- `PostgresError` extends `Error`, calls `super(x.message)`, sets `name = "PostgresError"`, and copies every parsed field onto the instance with `Object.assign(this, x)` (`node_modules/postgres/src/errors.js:1-7`). The type declaration lists `code: string` as required and `detail`, `schema_name`, `table_name`, `column_name`, and `constraint_name` as optional strings (`types/index.d.ts:201-227`).
- The message text for a unique violation is PostgreSQL's `duplicate key value violates unique constraint "<name>"`; the row values appear only in `detail` (`Key (column)=(value) already exists.`), which is a separate property from `message`.

### 2. Drizzle and the repository layer pass the driver error through

- `PostgresJsPreparedQuery.execute` calls `client.unsafe(query, params)` inside tracing spans and contains no `try`/`catch`; the installed `drizzle-orm` 0.38.4 has no `DrizzleQueryError` in `postgres-js/session.js` or `errors.js` (`node_modules/drizzle-orm/postgres-js/session.js:20-45`).
- The shared repository `insert` deletes `id`, coerces date strings, validates with `insertSchema.parse`, runs `db.insert(Table).values(plainData).returning().execute()`, and parses the result with `selectSchema` (`libs/shared/backend/api/src/lib/repository/database/index.ts:183-218`). Its catch converts `ZodError` into `new Error(JSON.stringify({ zodError }))` and rethrows everything else unchanged (`index.ts:220-225`). `insert` has no `logger.error` call; the repository's logging calls sit in `find`, `count`, `findById`, `update`, and `updateFirstByField` (`index.ts:102`, `128`, `157`, `173`, `251`, `308`).
- The CRUD service delegates `create` to `CreateAction`, which deletes `updatedAt` and calls `repository.insert` (`libs/shared/backend/api/src/lib/service/crud/index.ts:46-49`, `service/crud/actions/create/index.ts:14-21`). `findOrCreate` builds an `eq` filter from every key in `data`, returns the first match with `statusCode: 200`, and otherwise inserts and returns `statusCode: 201` (`service/crud/actions/find-or-create/index.ts:16-40`).

### 3. The shared HTTP error mapper (`getHttpErrorType`)

- `util` is exported as `getHttpErrorType` (`libs/shared/backend/utils/src/lib/index.ts:4`). It computes `message = extractMessage(error) || "Unknown error"` and `details = extractOriginalError(error)` (`http-error/index.ts:7-9`).
- `extractMessage` returns a string input as-is, otherwise `error.message`, otherwise recurses into `error.cause`, otherwise `String(error)`; `extractOriginalError` follows `.cause` to the deepest value and returns it (`http-error/extract/index.ts:1-12`). For a wrapper such as `new Error("text", { cause: pgError })`, the message used for classification is the wrapper's text and `details` is the `PostgresError`.
- Branch order in `util`:
  1. JSON branch: if `message` parses as JSON with a numeric `status`, it returns that status. Category comes from a `[Category]` prefix on `parsed.message` (`index.ts:15-25`), then from the pattern table applied to `parsed.message` (`27-36`), else `Internal error` while still keeping `parsed.status` (`38-43`). `details` becomes `parsed.cause ?? details` (`16`).
  2. Numeric `error.status`: returned with category `Internal error` (`49-56`).
  3. `[Category]` prefix on the plain message: mapped by a `switch` to 401, 400, 403, 404, or 500; `Payment error` and `Other` fall to the `default: 500` arm (`58-83`, `parser/index.ts:3-12`).
  4. Pattern table on the plain message (`85-94`).
  5. Fallback: `{ status: 500, message: "Internal server error: " + message, category: "Internal error", details }` (`96-101`).
- The pattern table defines five entries: 401 `Authentication error` (`paterns/index.ts:4-19`), 403 `Permission error` (`20-30`), 500 `Internal error` (`31-47`), 404 `Not Found error` (`48-63`), and 400 `Validation error` (`64-90`). There is no 409 entry. Two existing "already exists" texts are mapped elsewhere: `/order already exists/i` to 404 (`57`) and `/account already exists/i` to 400 (`82`).
- `ErrorCategory` is the union `Authentication error | Validation error | Permission error | Configuration error | Not Found error | Payment error | Internal error | Other`; `UtilsProp` is `{ status: ContentfulStatusCode; message; category; details? }` (`http-error/type/index.ts:3-24`). Hono's `ContentfulStatusCode` includes 409 (`node_modules/hono/dist/types/utils/http-status.d.ts:9`).
- Applied to a direct unique violation: the message has no `[` prefix, matches none of the regexes, and the error has no `status`, so the fallback produces status 500 with the constraint name embedded in the message and `details` set to the `PostgresError` instance.

### 4. REST handlers wrap through the mapper identically

- The create handler parses the multipart body, requires a string `data`, JSON-parses it, calls `service.create`, and returns 201 (`libs/shared/backend/api/src/lib/controllers/rest/handler/create/index.ts:17-39`). Its catch destructures `{ status, message, details }` from `getHttpErrorType(error)` and throws `new HTTPException(status, { message, cause: details })` (`create/index.ts:40-43`).
- The same three-line catch appears in `update` (`update/index.ts:42-45`), `bulk-create`, which calls `service.create` per array item (`bulk-create/index.ts:35-49`, `54-57`), `find-or-create`, which forwards the service's `statusCode` (`find-or-create/index.ts:32-39`, `40-43`), `bulk-update` (`61-64`), `delete` (`30-33`), `find` (`28-31`), `find-by-id` (`34-37`), and `count` (`28-31`).
- The REST controller binds `POST /` to `CreateHandler`, `POST /bulk` to `BulkCreateHandler`, `POST /find-or-create` to `FindOrCreateHandler`, and `PATCH /:uuid` to `UpdateHandler` (`libs/shared/backend/api/src/lib/controllers/rest/index.ts:54-75`, `102-120`).
- Hono's `HTTPException` passes `options.cause` to `super(message, { cause })` and stores `status` (`node_modules/hono/dist/http-exception.js:2-9`). The `cause` on the thrown exception is therefore the raw driver error for a direct insert failure.
- Model-level handlers follow the same pattern. The RBAC identity create handler ends with an identical catch (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/identity/create.ts:143-146`); 137 files under `libs/modules` and 11 under `libs/shared` call `getHttpErrorType`.

### 5. Exception filter: logging and client payload

- The filter derives `status` from `error.status` when the error is an `HTTPException`, else 500 (`libs/shared/backend/api/src/lib/filters/exception/index.ts:27`). It tries `JSON.parse(error.message)`; when that succeeds it takes `message`, `status`, and `cause` from the parsed object, and when it fails it pushes `error.message` (`32-48`). It never reads `error.cause`.
- It appends `{ message: errorMessages.join(" | "), stack }` to `causes` and logs one `🚨 Exception [requestId] METHOD path` record with `{ message, stack, status, causes }` (`50-59`). When `BUG_SERVICE_*` variables are set and `status >= 500`, it also sends the message to Telegram (`61-102`).
- The response body is `{ requestId, path, method, status, error, stack, cause }` (`104-115`). For a direct unique violation this means the client receives `error: "Internal server error: duplicate key value violates unique constraint \"sps_blog_article_slug_unique\""`, the handler's stack, and `cause: [{ message, stack }]` with the same text. The driver's `detail`, `table_name`, and `column_name` are not in that body because the filter builds `causes` only from the message.
- Wiring: the root API app registers one filter (`apps/api/app.ts:66-67`); each generic model app registers its own in `init()` (`libs/shared/backend/api/src/lib/app/default/index.ts:54`); module apps do the same (`libs/modules/blog/backend/app/api/src/lib/app.ts:29`). Model apps are mounted into module apps and module apps into the root app (`blog/backend/app/api/src/lib/app.ts:66`, `apps/api/app.ts:180-187`). Hono's `route()` wraps every mounted route with the sub-app's `errorHandler` when that handler is not the default (`node_modules/hono/dist/hono-base.js:87-100`), so the innermost app's filter converts the error into a response and outer filters do not run for the same request.
- `LoggerMiddleware` calls `hono/logger`'s `logger()` and then returns `next()` without using the returned handler (`libs/shared/backend/api/src/lib/middleware/logger/index.ts:14-20`). `ActionLoggerMiddleware` runs after `next()` and returns early unless the response status is 2xx, so it records no error responses (`libs/middlewares/src/lib/actions-logger/index.ts:52-66`).
- The `logger` used by the filter is `ConsoleLogger` by default or `PinoLogger` when `LOG_PROVIDER=pino` (`libs/shared/backend/utils/src/lib/logger/index.ts:10-18`, `logger/config.ts:3`).

### 6. Nested server-SDK calls re-wrap the failure once per hop

- Server SDKs are built with `factory` from `@sps/shared-frontend-server-api` (`libs/modules/blog/models/article/sdk/server/src/lib/singlepage/index.ts:14-19`); its `create` wrapper calls `actions.create` (`libs/shared/frontend/server/api/src/lib/factory/index.ts:77-85`), which performs a `fetch` and passes the response to `responsePipe` (`libs/shared/frontend/api/src/lib/actions/create/index.ts:42-49`).
- For a non-OK response, `responsePipe` reads the JSON body, takes `errorJson.error` as the primary message, copies `errorJson.cause` into `causes` (with stacks only when `NODE_ENV=development` or `DEBUG=true`), and builds `errorPayload = { message, status, cause, requestId }` (`libs/shared/utils/src/lib/response-pipe.ts:103-161`). On the server it throws `new HTTPException(res.status, { message: JSON.stringify(errorPayload), cause: errorPayload })` (`171-178`); in the browser it throws a `ClientResponseError` with `status`, `payload`, and `rawMessage` (`179-205`).
- The calling handler's catch passes that `HTTPException` to `getHttpErrorType`. `extractMessage` returns the JSON string, so the JSON branch runs: `parsed.status` (500 downstream) is preserved, `parsed.message` (`Internal server error: duplicate key ...`) matches `/internal server error/i`, and the result is `{ status: 500, category: "Internal error", details: parsed.cause }` (`http-error/index.ts:11-44`, `paterns/index.ts:42`). The handler throws a new `HTTPException` whose message is now plain text, so the next filter's `JSON.parse` fails and it logs and returns the text again (`filters/exception/index.ts:45-48`).
- Each HTTP hop therefore adds one filter log record and one re-wrapped exception carrying the same database text. The JSON branch keeps any downstream numeric status as-is, including statuses that have no category in the pattern table (`index.ts:38-43`).
- `response-pipe.server.spec.ts` documents that the server exception carries `status`, a `cause` object with `requestId`, and a JSON message (`libs/shared/utils/src/lib/response-pipe.server.spec.ts:13-52`).

### 7. Existing unique-violation handling in modules

- `SocialProfileKnowledgeAccessService.ensureEntity` looks up by natural key, tries `create`, and on any error re-reads and returns the concurrent winner, otherwise rethrows the original error; it does not inspect `code` or the message (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/access.ts:94-120`). Its spec builds the losing insert as `Object.assign(new Error("duplicate key"), { code: "23505" })` and also covers an unrelated failure that must be rethrown (`access.spec.ts:43-105`).
- `createSubjectRoleIfMissing` in Telegram membership sync calls the subjects-to-roles server SDK, and on any error re-reads the `(subjectId, roleId)` link, returning `false` when it exists and rethrowing otherwise (`telegram/sync-membership.ts:45-89`, catch at `62-87`). Its spec throws `Error('duplicate key value violates unique constraint "sps_rc_subject_role_unique"')` from the mocked create (`sync-membership.spec.ts:199-203`).
- The OAuth callback's `linkIdentityToSubject` swallows only errors for which `isUniqueConstraintError` returns true, and that helper tests `error.message` against `/duplicate key value violates unique constraint/i` (`authentication/oauth/callback.ts:574-609`). Because that call goes through a server SDK, the tested message is the JSON payload string produced by `responsePipe`, which contains the downstream text.
- The RBAC natural-key constraints those services rely on were added under issue #211 (`constraints/singlepage.ts` files referenced in `thoughts/shared/research/singlepagestartup/ISSUE-213.md:46`).

### 8. Unique field declarations and the blog article constraint

- 52 `fields/singlepage.ts` files under `libs/modules/*/models/*/backend/repository/database/src/lib/` call `.unique()`, including `agent`, `billing/currency`, `blog/article`, `blog/category`, `broadcast/channel` (`title` and `slug`), `crm/*`, `ecommerce/*`, `file-storage/file` (`file` and `slug`), `host/page` (`url`), `host/layout`, `knowledge/*`, `notification/template`, `notification/topic`, `rbac/role`, `rbac/subject`, `social/*`, `telegram/*`, and `website-builder/*`.
- The blog article `slug` column is `text("slug").notNull().unique().$defaultFn(() => randomWordsGenerator({ type: "slug" }))` (`libs/modules/blog/models/article/backend/repository/database/src/lib/fields/singlepage.ts:14-18`). The startup layer spreads the parent fields unchanged and the index re-exports startup (`fields/startup.ts:4-6`, `fields/index.ts:1`).
- The generated migration names the constraint `sps_blog_article_slug_unique` (`libs/modules/blog/models/article/backend/repository/database/src/lib/migrations/0000_material_monster_badoon.sql:12`). The article README describes `slug` as a URL-friendly unique identifier (`libs/modules/blog/models/article/README.md:15`).
- The article backend has no custom handlers: `Controller extends RESTController` and `Service extends CRUDService` (`libs/modules/blog/models/article/backend/app/api/src/lib/controller/index.ts:6-9`, `service/index.ts:6-7`). A duplicate slug on `POST /api/blog/articles` therefore flows through the generic create handler described in section 4.

### 9. Test coverage and BDD format

- `http-error/index.spec.ts` opens with a `BDD Suite` JSDoc carrying `Given`/`When`/`Then` lines (`libs/shared/backend/utils/src/lib/http-error/index.spec.ts:1-7`). It drives `util(new Error(msg))` through `test.each` tables per status: 400 (`13-41`), 401 (`44-61`), 403 (`64-77`), 404 (`80-98`), 422 (`101-114`), 500 (`117-133`), plus prefix parsing, plain-string input, the unknown-message fallback, and the `cause` to `details` case (`136-176`).
- Run at HEAD from the worktree with the installed jest binary: `Tests: 6 failed, 59 passed, 65 total`. All six failures are in the 422 block; the mapper returns 500 for `Expected string`, `Unprocessable Entity`, and `Invalid type. Expected email, got: string`, and 400 for `Invalid body['data']` because `/invalid (data|body)/i` matches (`paterns/index.ts:71`).
- History: the 422 pattern entry was added in `df413dcda6` and removed from `paterns/index.ts` in `9d60d206df` (2025-10-23, "feat: add prefix more"), which did not modify the spec. The spec's last change (`d7aa6ea70c`, 2026-04-25) also left the 422 block in place.
- `libs/shared/backend/api/src/lib/controllers/rest/index.spec.ts` covers only count route ordering and the count handler; its `createService()` mock includes `create` and `findOrCreate` stubs (`rest/index.spec.ts:12-23`, `33-86`).
- A model-level handler spec mocks `@sps/backend-utils` so that `getHttpErrorType` returns a fixed `{ status: 400, message, details: null }` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/chat/find-by-id/profile/create.spec.ts:19-25`).
- Targets: `@sps/backend-utils` declares a `test` target with `@nx/jest:jest` and `passWithNoTests: true` (`libs/shared/backend/utils/project.json`), while `@sps/shared-backend-api` declares `jest:test` (`libs/shared/backend/api/project.json`). The `package.json` scripts `test:unit:shared` and `test:unit:scoped` list module and shared-frontend projects only (`package.json:27-29`). The server preset uses `ts-jest` with `isolatedModules` and loads `apps/api/.env` through `jest.setup.ts` (`jest.server-preset.js:3-18`, `jest.setup.ts:11-17`).

### 10. Documentation state

- The root README lists `ExceptionFilter` as centralized error catching and documents error responses as `statusCode`, `message`, and `requestId` (`README.md:419-427`); the live filter returns `status`, `error`, `requestId`, `path`, `method`, `stack`, and `cause` (section 5).
- The README's "Automatic Error Categorization" table lists `Unprocessable Entity error` (422) and `Payment error` (400) alongside the five categories present in code (`README.md:451-459`). Neither has a pattern entry in `paterns/index.ts`; `Payment error` exists only in the `ErrorCategory` union and resolves to 500 through the `default` switch arm.
- `libs/shared/backend/utils/README.md` is empty and `libs/shared/backend/api/README.md` does not exist. `.agents/roles/codebase-analyzer.md:135` notes that RBAC failures are normalized into `HTTPException` in middlewares.

### 11. Verification of issue claims against live code

| Issue claim                                                                                                  | Live code at `29370bcbf8`                                                                                                                                                                                                                            |
| ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `http-error/index.ts:85-101` only checks message regexes and otherwise returns 500 with the message appended | Holds. Pattern loop at `85-94`, fallback at `96-101`.                                                                                                                                                                                                |
| `paterns/index.ts:3-91` has no conflict category                                                             | Holds. The file is 91 lines with five entries; no 409 status or conflict category.                                                                                                                                                                   |
| `handler/create/index.ts:40-42` delegates repository errors to the shared mapper                             | Holds. `catch` opens at 40, `getHttpErrorType` at 41, `throw new HTTPException` at 42, closing brace at 43.                                                                                                                                          |
| `fields/singlepage.ts:14-18` enforces slug uniqueness                                                        | Holds.                                                                                                                                                                                                                                               |
| `service/startup/compose.ts:417-429` calls the article create SDK                                            | Not present upstream: `libs/modules/blog/models/article/backend/app/api/src/lib/service/` contains only `index.ts`, and no `compose*` file or `resolveArticle` symbol exists under `libs/` or `apps/`. The issue states this path is child-specific. |
| The mapper, create handler, and unique field are byte-identical to upstream                                  | Consistent with the current files; the upstream commits named in the issue (`99e3037f0852`, `67a960f34465`) were not compared here.                                                                                                                  |
| Nested handlers repeat the exception and logs retain database text                                           | The mechanism exists upstream (section 6). The count of eight records is a didigallery observation and was not reproduced.                                                                                                                           |
| Client-visible output exposes constraint name and raw driver error                                           | The constraint name is in `error` and `cause[0].message`, and the handler stack is in `stack`. `detail`, `table_name`, and `column_name` are not serialized by the filter (section 5).                                                               |

## Code References

- `libs/shared/backend/utils/src/lib/http-error/index.ts:7-9` - `util` entry: message and details extraction.
- `libs/shared/backend/utils/src/lib/http-error/index.ts:11-44` - JSON branch used for nested SDK errors; preserves downstream `status`.
- `libs/shared/backend/utils/src/lib/http-error/index.ts:49-56` - numeric `error.status` branch.
- `libs/shared/backend/utils/src/lib/http-error/index.ts:58-83` - `[Category]` prefix switch.
- `libs/shared/backend/utils/src/lib/http-error/index.ts:85-94` - pattern loop.
- `libs/shared/backend/utils/src/lib/http-error/index.ts:96-101` - 500 fallback with `Internal server error: ${message}`.
- `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts:3-91` - five pattern entries; no 409.
- `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts:42` - `/internal server error/i` pattern that classifies re-wrapped downstream text.
- `libs/shared/backend/utils/src/lib/http-error/extract/index.ts:1-12` - `extractMessage` and `extractOriginalError`.
- `libs/shared/backend/utils/src/lib/http-error/parser/index.ts:3-12` - prefix parser.
- `libs/shared/backend/utils/src/lib/http-error/type/index.ts:3-24` - `ErrorCategory`, `ErrorPatternEntry`, `UtilsProp`.
- `libs/shared/backend/utils/src/lib/http-error/index.spec.ts:1-176` - BDD suite; 422 block at `100-114` fails at HEAD.
- `libs/shared/backend/utils/src/lib/index.ts:4` - `util` exported as `getHttpErrorType`.
- `libs/shared/backend/api/src/lib/controllers/rest/handler/create/index.ts:17-43` - generic create handler and catch.
- `libs/shared/backend/api/src/lib/controllers/rest/handler/update/index.ts:42-45`, `bulk-create/index.ts:54-57`, `find-or-create/index.ts:40-43`, `bulk-update/index.ts:61-64`, `delete/index.ts:30-33`, `find/index.ts:28-31`, `find-by-id/index.ts:34-37`, `count/index.ts:28-31` - identical catch blocks.
- `libs/shared/backend/api/src/lib/controllers/rest/index.ts:54-75`, `102-120` - route bindings and handler instantiation.
- `libs/shared/backend/api/src/lib/controllers/rest/index.spec.ts:1-87` - existing REST controller spec (count only).
- `libs/shared/backend/api/src/lib/service/crud/index.ts:46-56` - `create` and `findOrCreate` delegation.
- `libs/shared/backend/api/src/lib/service/crud/actions/create/index.ts:14-21` - `CreateAction.execute`.
- `libs/shared/backend/api/src/lib/service/crud/actions/find-or-create/index.ts:16-40` - find then insert with 200/201.
- `libs/shared/backend/api/src/lib/repository/database/index.ts:183-227` - `insert` with Zod rewrap and passthrough rethrow.
- `libs/shared/backend/api/src/lib/filters/exception/index.ts:19-116` - exception filter: parsing, logging, Telegram report, response body.
- `libs/shared/backend/api/src/lib/app/default/index.ts:54-56` - per-model app `onError` and middleware registration.
- `libs/shared/backend/api/src/lib/middleware/logger/index.ts:14-20` - `LoggerMiddleware`.
- `libs/middlewares/src/lib/actions-logger/index.ts:52-66` - action logger skips non-2xx responses.
- `libs/shared/backend/database/config/src/lib/postgres.ts:29-37`, `66-82` - driver client and Drizzle instance.
- `libs/shared/utils/src/lib/response-pipe.ts:98-206` - non-OK response handling; server `HTTPException` at `171-178`.
- `libs/shared/utils/src/lib/response-pipe.server.spec.ts:13-52` - server exception contract.
- `libs/shared/frontend/api/src/lib/actions/create/index.ts:42-49` - SDK create fetch and `responsePipe`.
- `libs/shared/frontend/server/api/src/lib/factory/index.ts:77-85` - server factory `create`.
- `libs/modules/blog/models/article/sdk/server/src/lib/singlepage/index.ts:14-19` - article server SDK from `factory`.
- `libs/modules/blog/models/article/backend/repository/database/src/lib/fields/singlepage.ts:14-18` - unique `slug`.
- `libs/modules/blog/models/article/backend/repository/database/src/lib/migrations/0000_material_monster_badoon.sql:12` - `sps_blog_article_slug_unique`.
- `libs/modules/blog/models/article/backend/app/api/src/lib/controller/index.ts:6-9`, `service/index.ts:6-7` - unmodified REST controller and CRUD service.
- `libs/modules/blog/backend/app/api/src/lib/app.ts:29`, `66` - module app `onError` and model app mounting.
- `apps/api/app.ts:66-67`, `180-187` - root `onError` and module mounting.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/access.ts:94-120` - `ensureEntity` re-read recovery.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/access.spec.ts:43-105` - `code: "23505"` fixture and unrelated-failure case.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/sync-membership.ts:45-89` - `createSubjectRoleIfMissing`; catch block at `62-87`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/sync-membership.spec.ts:199-203` - duplicate-key message fixture.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/authentication/oauth/callback.ts:574-609` - `linkIdentityToSubject` (`574-599`) and `isUniqueConstraintError` regex (`601-609`).
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/identity/create.ts:143-146` - model-level catch using the mapper.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/chat/find-by-id/profile/create.spec.ts:19-25` - spec mocking `getHttpErrorType`.
- `libs/shared/backend/utils/project.json`, `libs/shared/backend/api/project.json`, `package.json:27-29` - test target names and scoped test scripts.
- `README.md:419-461` - documented error handling and category table.
- `node_modules/postgres/src/errors.js:1-7`, `node_modules/postgres/src/connection.js:31-50`, `786-794`, `node_modules/postgres/types/index.d.ts:201-227` - driver error construction and fields (read from the main checkout's installed package; the worktree has no `node_modules`).
- `node_modules/drizzle-orm/postgres-js/session.js:20-45` - Drizzle passthrough.
- `node_modules/hono/dist/http-exception.js:2-9`, `node_modules/hono/dist/hono-base.js:87-100` - `HTTPException` and sub-app error handler wrapping.

## Architecture Documentation

- Error classification is message-driven. The repository convention is to throw `Error` objects whose text begins with a category phrase (`Validation error.`, `Not Found error.`, `Configuration error.`) or a `[Category]` prefix, and `getHttpErrorType` turns the text into a status through the pattern table (`README.md:429-447`). No layer between the driver and the handler adds a category to database errors, so driver text reaches the fallback branch unchanged.
- The layered backend is repository -> action -> CRUD service -> REST handler -> Hono app -> exception filter. Errors propagate by rethrow at each layer; only the repository's Zod branch and the handler's catch transform them.
- Cross-model calls happen over HTTP through server SDKs built by `factory`, so a failure inside one model app becomes a JSON error body, then a `responsePipe` `HTTPException`, then a mapper input for the next handler. The mapper's JSON branch is the path that carries a downstream status across hops.
- Each Hono app level (model, module, root) registers the same `Filter` class through `onError`, and Hono wraps mounted routes with the innermost custom handler. One filter log record is produced per HTTP hop, never per nesting level within a single process.
- Conflict recovery for natural keys is implemented locally in services (find, create, re-read on failure) rather than in the shared CRUD layer; issue #211's plan explicitly kept natural-key semantics out of the generic `findOrCreate` (`thoughts/shared/plans/singlepagestartup/ISSUE-211.md:47`).
- Field composition follows `fields/singlepage.ts` -> `fields/startup.ts` -> `fields/index.ts`, and unique constraints are declared per column with `.unique()` or per table through `constraints/` files (`ISSUE-211.md:92`).

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-170.md:41` records a production `PostgresError` with SQLSTATE `42P07` observed through the same driver during migrations, confirming that driver `code` values appear in captured logs.
- `thoughts/shared/plans/singlepagestartup/ISSUE-211.md:13-17`, `47`, `51`, `132-140` describe the natural-key constraints for RBAC grants, note that losing inserts "would otherwise be logged as internal errors", keep natural-key semantics out of generic `findOrCreate`, and define the `ensureEntity` create/catch/re-read contract with its unit and integration tests.
- `thoughts/shared/research/singlepagestartup/ISSUE-213.md:28`, `46-48`, `72`, `100`, `108`, `117` document which schemas carry unique constraints (RBAC natural keys, knowledge source `originalPath`) and which do not (notification and social `sourceSystemId`, several billing relations), and record that concurrency remains service-local.
- `thoughts/shared/research/singlepagestartup/ISSUE-174.md:49`, `ISSUE-180.md:69`, `ISSUE-181.md:64-65`, `ISSUE-185.md:53-70`, `ISSUE-173.md:40` each describe the handler catch -> `getHttpErrorType` -> `HTTPException` pattern and note that production stacks point at the handler's catch line rather than the originating service line.
- No prior process, ticket, research, or plan artifact existed for issue #232 before this research; no ISSUE-109 artifact exists under `thoughts/shared/`.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-213.md` - concurrency and idempotency boundaries; unique constraint inventory.
- `thoughts/shared/plans/singlepagestartup/ISSUE-211.md` - RBAC natural keys and conflict recovery contract.
- `thoughts/shared/research/singlepagestartup/ISSUE-170.md` - driver `PostgresError` shape in production migration logs.
- `thoughts/shared/research/singlepagestartup/ISSUE-174.md`, `ISSUE-180.md`, `ISSUE-181.md`, `ISSUE-185.md`, `ISSUE-173.md` - earlier log-watch issues that traverse `getHttpErrorType` and the pattern table.

## Open Questions

- The `http-error` spec already fails at HEAD in its 422 block. The plan phase needs to decide how those pre-existing failures relate to any new conflict scenarios in the same file, and which Nx target (`@sps/backend-utils:test`) and script will run it, since the scoped test scripts do not include the package.
- The mapper's JSON branch preserves a downstream numeric status but assigns category `Internal error` unless a prefix or pattern matches (`http-error/index.ts:38-43`). How a 409 produced by an inner hop should be categorized on outer hops is not defined by current code.
- The exception filter reports to Telegram only when `status >= 500` (`filters/exception/index.ts:65`) and returns `stack` to the client (`104-115`). Whether either behavior is in scope for a 409 response is not stated in the issue.
- `findOrCreate` performs a find followed by an insert with no lock; a concurrent insert between the two steps raises the same `23505`. Whether that path is expected to return 409, 200, or the existing 500 is not stated.
- The `ErrorCategory` union, the pattern table, and the README category table currently disagree (422 and `Payment error`). Which of them is authoritative for naming a conflict category is not defined.
- Existing message-regex recovery in `oauth/callback.ts:601-609` matches the downstream text inside the `responsePipe` JSON payload. A sanitized 409 message on the inner hop would change what that regex receives; the current code has no test covering that interaction.
- The issue's count of eight log records and the upstream commit comparison (`99e3037f0852` / `67a960f34465`) come from the didigallery deployment and were not reproduced here.
