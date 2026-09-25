---
date: 2026-09-26T00:58:00+03:00
researcher: rogwild
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-313-request-bounds
repository: singlepagestartup
topic: "Bound list reads, request bodies, timeouts and WebSocket connections: sort method allow-list and API request body limit"
tags: [research, codebase, shared-backend-api, repository, query-builder, api, bun]
status: complete
last_updated: 2026-09-26
last_updated_by: rogwild
---

# Research: sort method allow-list and API request body limit

**Date**: 2026-09-26
**Researcher**: rogwild
**Git Commit**: 78d7d43125
**Branch**: claude/issue-313-request-bounds
**Repository**: singlepagestartup

## Research Question

The agreed scope of issue #313 is two changes: `orderBy.and[].method` accepts
only `asc` and `desc`, and the API's Bun server takes its request body limit
from configuration. The questions: how a request's sort reaches the database,
which callers send a sort, which validation pattern the filter parameters
follow, and how the API server bounds request bodies.

## Summary

- `Database.find` builds its sort expression as
  `methods[orderBy.and[0].method](this.Table[orderBy.and[0].column])`, where
  `methods` is the whole `drizzle-orm` module
  (`libs/shared/backend/api/src/lib/repository/database/index.ts:3,77-85`).
  The only checks are that `and[0]` exists and that every item carries a truthy
  `column` and `method` (`:62-75`). drizzle-orm 0.38.4 exports 104 functions,
  and the request picks which one runs with a table property as its argument.
- The column lookup is `this.Table[column]`. A drizzle table object also
  carries `enableRLS` as an own property and prototype members such as
  `constructor` and `getSQL`, and a name that is not a property renders an
  empty operand (` asc`). A lookup through `methods.is(value, methods.Column)`
  accepts table columns only.
- `Database.find` is the single place a sort is applied. Every list read ends
  there: the shared REST find handler, module controllers that forward
  `parsedQuery.orderBy`, services that call `find` directly, and the host,
  MCP and server SDKs that reach it over HTTP. No module repository overrides
  `find`.
- First-party callers send only `asc` and `desc`, on columns their tables have.
  Ten call sites outside spec files send two or three items; only the first
  item is applied, and every later item also names an existing column.
- `query-builder/order-by.ts` and `query-builder/populate.ts` have no caller.
  They are reachable only as `queryBuilder.orderBy` and `queryBuilder.populate`
  on the object exported from the package entry, and nothing calls either.
- Filters already follow the pattern this change needs (issue #269): an
  exported frozen allow-list, an identifier pattern for the column, a lookup
  on the table, and messages that begin with `Validation error.` so the error
  mapping answers 400 (`query-builder/filters.ts:25-111`).
- `apps/api/server.ts:42-47` calls `serve()` without `maxRequestBodySize`, so
  Bun's default applies: 128 MiB (`bun-types` `bun.d.ts:3933-3936`). The
  Dockerfile installs the current Bun release at build time (`Dockerfile:6`),
  so the effective limit follows whichever release the image gets. A request
  whose `Content-Length` exceeds the limit is answered `413` with an empty
  body before the fetch handler runs.
- API server settings live in `libs/shared/utils/src/lib/envs/api.ts`, next to
  `API_SECRET_STRENGTH`; the API documents its environment in
  `apps/api/README.md` under "Environment"; the deployer forwards optional API
  variables through `tools/deployer/api.sh` into `tools/deployer/api/api.env.j2`.

## Detailed Findings

### Sorting in the shared repository

- `libs/shared/backend/api/src/lib/repository/database/index.ts:3` imports the
  module namespace: `import * as methods from "drizzle-orm"`. The same object
  serves `and`, `eq`, `count` and `asc` elsewhere in the class.
- `:62-66` throws when `orderBy.and` is truthy and `and[0]` is falsy; `:68-75`
  throws when any item lacks a truthy `column` or `method`. Both messages read
  `You need to pass an orderBy array with 'column' and 'method' for each item`.
  They match no error pattern, so the API answers them with 500.
- `:77-85` computes `order`: with at least one item and a truthy first method,
  `methods[method as any](this.Table[column])`; otherwise
  `methods.asc(this.Table.orderIndex)` when the table has `orderIndex`, else
  `null`. `:93` passes it to `.orderBy(order)`.
- A string `and`, which `?orderBy[and]=x` produces, reaches `.every` (`:70`)
  and fails there with a `TypeError`.
- `count` (`:113-137`) ignores `orderBy`; `index.spec.ts:60-101` asserts this.
- `FindServiceProps.params.orderBy.and[].method` is typed `"asc" | "desc"`
  (`libs/shared/backend/api/src/lib/services/interfaces.ts:20-25`), but the
  value arrives from the query string, so the type does not constrain it.
- `ParseQueryMiddleware` parses the query string with `qs` and a string
  `orderBy[and]` as JSON
  (`libs/shared/backend/api/src/lib/middleware/parse-query/index.ts:39-80`),
  so method and column values are strings, arrays or objects the caller
  chooses.

Observed on drizzle-orm 0.38.4 with a `pgTable` of `id`, `slug` and
`orderIndex`:

| `column` value | `this.Table[column]`     | `asc(...)` renders                        |
| -------------- | ------------------------ | ----------------------------------------- |
| `slug`         | the column               | `"sl_profile"."slug" asc`                 |
| `missing`      | `undefined`              | ` asc`                                    |
| `constructor`  | a function, inherited    | `$1 asc` with the function as a parameter |
| `enableRLS`    | a function, own property | `$1 asc` with the function as a parameter |

`Object.keys(table)` lists `id`, `slug`, `orderIndex` and `enableRLS`, so
neither a truthiness check nor `Object.hasOwn` limits the lookup to columns;
`methods.is(value, methods.Column)` returns `true` for the column and `false`
for the other rows.

### Who sends a sort

- The REST find handler passes `c.var.parsedQuery` to `service.find`
  (`libs/shared/backend/api/src/lib/controllers/rest/handler/find/index.ts:24`)
  and maps any thrown error through `getHttpErrorType` (`:30-31`).
- Controllers that merge `parsedQuery.orderBy` into their own `find`:
  `social/models/chat/.../message/find/index.ts:57`,
  `broadcast/models/channel/.../message/find/index.ts:53`,
  `social/models/profile/.../chat/find/index.ts:57`,
  `ecommerce/models/attribute/.../billing-module-currency/find/index.ts:66`,
  `rbac/models/subject/.../profile/find-by-id/chat/find-by-id/message/find.ts:53,75,101`.
- Literal sorts in first-party code: 44 sites, 31 of them outside spec files,
  all `asc` or `desc`. The columns are `createdAt`, `updatedAt`, `orderIndex`,
  `slug` and `title`. The multi-item sorts outside spec files, with the tables
  they read; every column they name exists in that table's `fields` or
  `schema.ts` (paths under
  `rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/`
  are shortened to `profile/`):
  - `profilesToKnowledgeModuleDocuments`, `orderIndex` then `createdAt`
    (`profile/chat/find-by-id/message/react-by-openrouter.ts:2399`,
    `profile/chat/find-by-id/profile/find-by-id/knowledge/document/helpers.ts:21`,
    `profile/knowledge/document/helpers.ts:29`);
  - `profilesToSkills`, `orderIndex` then `createdAt`
    (`react-by-openrouter.ts:2518`,
    `profile/chat/find-by-id/profile/find-by-id/skill/helpers.ts:67`);
  - social `skill`, `title` then `createdAt`
    (`profile/chat/find-by-id/profile/find-by-id/skill/available.ts:26`);
  - file-storage `file`, `updatedAt` then `createdAt`
    (`profile/chat/find-by-id/profile/find-by-id/avatar/update.ts:55`,
    `agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:924`);
  - `profilesToFileStorageModuleFiles`, `orderIndex`, `updatedAt`, `createdAt`
    (`agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:893`,
    `social/models/profile/frontend/component/src/lib/singlepage/chat-profile-avatar/Component.tsx:78`).
- MCP validates its own input with `method: z.enum(["asc", "desc"])`
  (`apps/mcp/lib/content-management/schemas.ts:46-56`) before it calls the SDK.
- No module repository overrides `find`: every `Repository` class extends
  `DatabaseRepository` with an empty body.

### The query builders without a caller

- `libs/shared/backend/api/src/lib/query-builder/index.ts:1-9` collects
  `populate`, `filters` and `orderBy` into `queryBuilder`, which
  `libs/shared/backend/api/src/index.ts:1` exports.
- The repository calls only `queryBuilder.filters` (`database/index.ts:56,115,316`).
  No file in `apps`, `libs` or `tools` calls `queryBuilder.orderBy` or
  `queryBuilder.populate`.
- `order-by.ts:32-53` and `populate.ts:33-65` index `queryFunctions` with a
  method from their input. `order-by.spec.ts` is a `describe.skip` with a
  commented-out body; `populate.spec.ts` checks that a function is returned.
- `query-builder/order-by.yaml:23,43` documents the query parameter with the
  methods `asc` and `desc` and shows a two-item example.

### The filter validation pattern (issue #269)

- `ALLOWED_FILTER_METHODS` is an exported `Object.freeze([...] as const)` with a
  derived `IAllowedFilterMethod` type (`query-builder/filters.ts:25-43`).
- `FILTER_COLUMN_PATTERN` accepts an identifier and at most one json key
  (`:53-54`).
- `parseFilterMethod` and `parseFilterColumn` are module functions that throw
  `Validation error. Missing 'method' in filter object`,
  `Validation error. Unknown filter method '<method>'`,
  `Validation error. Missing 'column' in filter object` and the identifier
  message (`:71-111`).
- A non-array group throws `Validation error. 'filters.and' must be an array`
  (`:145-147`); a name the table lacks throws
  `Validation error. Unknown column '<name>'` (`:160-164`).
- `filters.spec.ts` compiles predicates with `PgDialect.sqlToQuery` and asserts
  statement text and parameters, including a prototype key refused as a method
  (`:317-323`).
- Commit `e3eb1acfe6` added the http-error cases for these messages
  (`libs/shared/backend/utils/src/lib/http-error/index.spec.ts:40-43`).

### Error mapping

- `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts:75-81` maps a
  message that begins with `Validation error` to 400 before any other 400 or
  422 pattern applies.
- A message that matches no pattern falls through to 500. The exception filter
  sends a Telegram report for every 5xx when the bug-report variables are set
  (`libs/shared/backend/api/src/lib/filters/exception/index.ts:64-105`).

### The API server and request bodies

- `apps/api/server.ts:42-47` calls `serve()` without `maxRequestBodySize`.
- `node_modules/bun-types/bun.d.ts:3933-3936` documents the option with
  `@default 1024 * 1024 * 128`.
- A probe on the locally installed Bun 1.3.6 (`Bun.serve` with
  `maxRequestBodySize: 1024`): a POST with a declared `Content-Length` of 2048
  bytes is answered `413` with an empty body and the handler is not called; a
  512-byte body reaches the handler. With no option set, a 130 MiB body with a
  declared length is answered `413`.
- `apps/telegram/server.ts:11` and `apps/openapi/server.ts:9` are separate Bun
  servers with their own settings; they are outside this issue.
- Multipart uploads go through this server
  (`libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/create/index.ts`).
  Issue #304, in progress on its own branch, adds a per-route upload limit
  `FILE_STORAGE_MAX_UPLOAD_BYTES` with a default of 50 MiB and states that a
  value above 128 MiB needs the server limit raised as well.

### Configuration and documentation homes

- `libs/shared/utils/src/lib/envs/api.ts:1-9` holds `API_SECRET_STRENGTH`
  with a JSDoc block; `envs/index.ts:12` re-exports the file through
  `@sps/shared-utils`. `API_SERVICE_PORT` lives in `envs/host.ts:12`.
- Numeric settings read as `Number(process.env["NAME"]) || <default>`, for
  example `RBAC_OAUTH_STATE_LIFETIME_IN_SECONDS` (`envs/rbac.ts:41-42`).
- `apps/api/README.md:3-8` is the API's "Environment" section.
- The deployer reads optional API variables in `tools/deployer/api.sh:10-87`,
  passes them to `create_api.yaml` at `:123-178`, and
  `tools/deployer/api/api.env.j2` renders an optional one only when it is
  defined and non-empty (for example `:40-45`).
  `tools/deployer/.env.example:89-94` holds the API service block.
- `apps/api/create_env.sh:20-116` writes the local development essentials and
  none of the optional tuning variables (`API_SECRET_STRENGTH`, the RBAC
  lifetimes and the OAuth lifetimes are absent).

## Code References

- `libs/shared/backend/api/src/lib/repository/database/index.ts:3` - `drizzle-orm` namespace import
- `libs/shared/backend/api/src/lib/repository/database/index.ts:62-85` - sort validation and expression
- `libs/shared/backend/api/src/lib/repository/database/index.spec.ts:51-151` - repository specs with a mocked query chain
- `libs/shared/backend/api/src/lib/query-builder/filters.ts:25-164` - the filter validation pattern
- `libs/shared/backend/api/src/lib/query-builder/order-by.ts:32-53` - builder without a caller
- `libs/shared/backend/api/src/lib/query-builder/populate.ts:33-65` - builder without a caller
- `libs/shared/backend/api/src/lib/query-builder/order-by.yaml:1-45` - query parameter reference
- `libs/shared/backend/api/src/lib/services/interfaces.ts:11-29` - `FindServiceProps`
- `libs/shared/backend/api/src/lib/middleware/parse-query/index.ts:20-87` - query parsing
- `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts:75-121` - 400 patterns
- `libs/shared/backend/utils/src/lib/http-error/index.spec.ts:13-48` - 400 mapping cases
- `apps/api/server.ts:42-47` - Bun server options
- `libs/shared/utils/src/lib/envs/api.ts:1-9` - API server settings
- `apps/api/README.md:3-8` - API environment documentation
- `tools/deployer/api.sh`, `tools/deployer/api/api.env.j2`, `tools/deployer/.env.example` - deployer variables

## Architecture Documentation

- The repository is the only layer that turns request parameters into SQL for
  list reads; controllers and services pass `params` through unchanged.
- Request validation errors are plain `Error`s whose message begins with
  `Validation error.`; `getHttpErrorType` turns them into 400 at the REST
  boundary, with no status code set at the throw site.
- Allow-lists for request-chosen operators are exported frozen tuples beside
  the code that enforces them, with a type derived from the tuple.
- Optional server settings are constants in
  `libs/shared/utils/src/lib/envs/*.ts` with the default in code and a JSDoc
  block; the deployer template renders one only when an operator sets it.

## Historical Context (from thoughts/)

- Issue #269 (commit `e3eb1acfe6`) added the filter allow-list, the column
  pattern and the 400 messages that this change mirrors for sorting.
- Issue #304 adds a per-route upload limit on its own branch; that limit has
  to stay at or below the server limit.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-304.md` (on the issue #304
  branch) - upload limits and static delivery.

## Open Questions

None for the agreed scope. The plan records the choice of default and the
treatment of sort items after the first.
