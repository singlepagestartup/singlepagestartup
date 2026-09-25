---
date: 2026-09-26T01:10:00+03:00
issue_number: 313
repository: singlepagestartup
topic: "Sort method allow-list and configurable API request body limit"
status: approved
---

# Sort method allow-list and configurable API request body limit Implementation Plan

## Overview

A list read accepts only `asc` and `desc` as a sort method and only a column
of the table as a sort column, and the API server takes its request body limit
from `API_MAX_REQUEST_BODY_BYTES`. These are the two changes in scope for
issue #313.

## Current State Analysis

- `Database.find` calls `methods[orderBy.and[0].method](this.Table[column])`
  with the whole `drizzle-orm` namespace as `methods`
  (`libs/shared/backend/api/src/lib/repository/database/index.ts:3,77-85`).
  Presence of `column` and `method` is the only check (`:62-75`), and its
  message maps to 500.
- The column lookup accepts anything the table object carries: `enableRLS`
  and prototype members pass a truthiness check and reach the statement as a
  parameter; a missing name renders an empty operand.
- Every list read ends in `Database.find`; no repository overrides it.
- `apps/api/server.ts:42-47` sets no `maxRequestBodySize`; Bun applies 128 MiB.
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-313.md`.

## Desired End State

- `find` refuses a sort item whose method is not `asc` or `desc`, whose column
  is not an identifier, or whose column is not a column of the table, with a
  message that begins with `Validation error.`, so the API answers 400 before
  any query is built. Malformed sort groups answer 400 instead of 500.
- A valid sort orders the query as today: the first item is applied, and
  without a sort a table with `orderIndex` is read in that order. Every item
  is validated, including the ones after the first.
- `apps/api/server.ts` passes `maxRequestBodySize: API_MAX_REQUEST_BODY_BYTES`.
  Unset, the value is 128 MiB, the limit Bun applies today; an operator can
  lower or raise it through the environment and the deployer.

Verification: the unit lanes of `@sps/shared-backend-api` and
`@sps/backend-utils`, lint and type checks, and an HTTP run of the API on port
4313 (sorted list 200, unknown method 400, unknown column 400, body above the
configured limit 413, upload-sized body accepted).

### Key Discoveries:

- `query-builder/filters.ts:25-111` is the pattern to mirror: an exported
  frozen allow-list with a derived type, an identifier pattern, module parse
  functions, `Validation error.` messages.
- `methods.is(value, methods.Column)` separates columns from the functions a
  drizzle table object also carries (research, table of observed lookups).
- drizzle renders `.orderBy(null)` as `order by $1` with a null parameter and
  `.orderBy()` with no clause; a list of sort expressions spread into
  `.orderBy(...)` keeps the query unordered for tables without `orderIndex`
  and type-checks without the `as any` the current index needs.
- `libs/shared/utils/src/lib/envs/api.ts` holds API server settings; numeric
  settings read as `Number(process.env["NAME"]) || <default>`.
- `tools/deployer/api/api.env.j2` renders optional variables only when set;
  `tools/deployer/api.sh` forwards them.

## What We're NOT Doing

- No default page size or maximum `limit`, and no change to `count`.
- No change to server timeouts or the WebSocket endpoint.
- No multi-column sort: later items are validated and not applied, as today.
- `query-builder/order-by.ts` and `query-builder/populate.ts` stay as they are:
  no caller, not wired in, not deleted here.
- No change to the Telegram and OpenAPI Bun servers.
- No entry in `apps/api/create_env.sh`, which writes only local development
  essentials and no optional tuning variable.
- No forwarding through the GitHub Actions deploy (`.github/workflows/ansible.yml`,
  `tools/deployer/github_deployer.sh`); those deployments keep the code default.

## Implementation Approach

The sort validation stays in the repository file beside its only caller, as a
protected `prepareOrderBy` method next to `prepareWritableData` and module
functions next to `isDateSchema`, mirroring the filter parse functions. The
allow-list is exported like `ALLOWED_FILTER_METHODS`. The body limit is one
constant in the API env file, one option on `serve()`, and its documentation.

Use cases verified to keep working:

- All 44 first-party sorts send `asc` or `desc`; the later items of the ten
  multi-item sorts name existing columns (research, "Who sends a sort").
- MCP validates the same two methods before it calls the SDK.
- Uploads: the default equals the limit Bun applies today, and it stays above
  the 50 MiB per-route upload default of issue #304.
- Cross-origin access, the anonymous cart, tunnel development and MCP OAuth do
  not pass through the changed code.

## Phase 1: Sort validation in the shared repository

### Overview

`find` builds its sort through a validated helper.

### Changes Required:

#### 1. Repository

**File**: `libs/shared/backend/api/src/lib/repository/database/index.ts`
**Why**: the only place a request-chosen sort becomes SQL.
**Changes**: add the exported `ALLOWED_ORDER_BY_METHODS` tuple with its
`IAllowedOrderByMethod` type, an identifier pattern and `parseOrderByMethod` /
`parseOrderByColumn` module functions; add a protected `prepareOrderBy` that
returns the default order without a sort, refuses a non-array or incomplete
group, validates method, identifier and table column (`methods.is` against
`methods.Column`) for every item, and returns the first item's expression;
call it from `find` before the query and spread the result into `.orderBy`.

#### 2. Specs

**File**: `libs/shared/backend/api/src/lib/repository/database/index.spec.ts`
**Why**: regression coverage for the allow-list and the kept behavior.
**Changes**: a `find` block over a mocked query chain that renders the captured
sort with `PgDialect`: both directions accepted; `sql`, `count`, `constructor`
and `ASC` refused before `select`; unknown, prototype and function columns
refused; non-identifier columns refused; every item validated and the first
applied; malformed groups refused; default `orderIndex` order and no order for
a table without it.

**File**: `libs/shared/backend/utils/src/lib/http-error/index.spec.ts`
**Why**: the new messages must map to 400.
**Changes**: add the four new messages to the 400 cases.

### Success Criteria:

#### Automated Verification:

- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-backend-api:jest:test`
- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/backend-utils:jest:test`
- [x] `npx nx run @sps/shared-backend-api:eslint:lint` and `@sps/backend-utils:eslint:lint` with `NODE_OPTIONS=--max-old-space-size=12288`
- [x] `npx nx run @sps/shared-backend-api:tsc:build`
- [x] Mutation check: without the allow-list, the refused-method scenarios fail; with a truthiness column check, the prototype and function column scenarios fail

#### Manual Verification:

- [x] On port 4313: a public list sorted `asc` and `desc` answers 200 in both orders; `method=sql` and `column=constructor` answer 400

---

## Phase 2: Configurable request body limit

### Overview

The API server reads its body limit from configuration.

### Changes Required:

#### 1. Setting and server

**File**: `libs/shared/utils/src/lib/envs/api.ts`
**Why**: API server settings live here, with the default in code.
**Changes**: add `API_MAX_REQUEST_BODY_BYTES` with a JSDoc block; default
`128 * 1024 * 1024`.

**File**: `apps/api/server.ts`
**Why**: `serve()` is where Bun takes the option.
**Changes**: pass `maxRequestBodySize: API_MAX_REQUEST_BODY_BYTES`.

#### 2. Documentation and deployer

**File**: `apps/api/README.md`
**Why**: the API documents its environment under "Environment".
**Changes**: describe the variable, its default and its relation to uploads.

**Files**: `tools/deployer/api.sh`, `tools/deployer/api/api.env.j2`,
`tools/deployer/.env.example`
**Why**: a deployer operator sets API variables through these files.
**Changes**: read and forward the variable, render it only when set, and show
it commented out in the API block of the example.

### Success Criteria:

#### Automated Verification:

- [x] `npx tsc --noEmit -p apps/api/tsconfig.json` shows no new error in `server.ts`
- [x] `npx nx run @sps/shared-utils:eslint:lint` and `npx nx run @sps/shared-utils:tsc:build` if the project has the target
- [x] `bash -n tools/deployer/api.sh`

#### Manual Verification:

- [x] On port 4313 with `API_MAX_REQUEST_BODY_BYTES=1048576`: a 2 MiB POST answers 413 and a 512 KiB POST reaches the route
- [x] On port 4313 with the default: a POST declaring 129 MiB answers 413 and a 5 MiB multipart upload is stored

---

## Phase 3: Review changes on pull request #334

### Overview

The body limit also holds for a body without a declared length, one wrapper
around Hono's `bodyLimit` serves both the whole API and the file-storage upload
routes, and the filter path checks its columns the way the sort path does. The
branch builds on #331, whose `Payload Too Large error` category the refusal
uses, so `origin/claude/issue-304-upload-delivery` is merged in and the pull
request targets that branch.

### Changes Required:

#### 1. Shared request body limit

**File**: `libs/shared/backend/api/src/lib/middleware/request-body-fits-limit/index.ts`
**Why**: `maxRequestBodySize` bounds a declared length only. Hono's
`bodyLimit` also counts a body without a declared length while a route reads
it. The class lives beside `ParseQueryMiddleware`, in the package that both
`apps/api` and the modules already import. In `libs/middlewares` it would make
`@sps/file-storage` depend on `@sps/middlewares`, which depends on `@sps/rbac`
and `@sps/agent`, which depend on `@sps/file-storage`. Nx then refuses
`@sps/file-storage:tsc:build` because of the circular task graph, and
`apps/api/README.md` forbids modules to import `libs/middlewares`.
**Changes**: class `Middleware` with `init()`, options `maxBytes` (default
`API_MAX_REQUEST_BODY_BYTES`) and `limitName` (default "request body limit"),
refusing through `getHttpErrorType` with `Payload Too Large error. The <limit
name> is <N> bytes`; exported as `RequestBodyFitsLimitMiddleware`; a BDD spec
beside it.

**File**: `apps/api/app.ts`
**Why**: every route has to be covered.
**Changes**: register the middleware right after CORS.

**File**: `libs/modules/file-storage/models/file/backend/app/middlewares/src/lib/request-body-fits-upload-limit/index.ts`
**Why**: the wrapper around `bodyLimit` exists once.
**Changes**: `RequestBodyFitsUploadLimit` keeps its name, message and spec and
constructs the shared middleware with `FILE_STORAGE_MAX_UPLOAD_BYTES` and the
name "upload limit".

#### 2. Filter columns

**File**: `libs/shared/backend/api/src/lib/query-builder/filters.ts`
**Why**: the filter lookup takes `table[name]` by truthiness, so `constructor`
and `enableRLS` pass as columns.
**Changes**: accept only `is(tableColumn, Column)`; a spec beside the filter
specs.

#### 3. Notes from #331

**Files**: `libs/shared/utils/src/lib/envs/file-storage.ts`,
`libs/modules/file-storage/README.md`, `tools/deployer/README.md`,
`tools/deployer/.env.example`
**Why**: they tell an operator to raise `maxRequestBodySize` in
`apps/api/server.ts`, which is now `API_MAX_REQUEST_BODY_BYTES`.
**Changes**: name the setting instead.

### Success Criteria:

#### Automated Verification:

- [x] `jest:test` of `@sps/shared-backend-api`, `@sps/middlewares`, `@sps/file-storage`, `api`, `@sps/backend-utils` and `@sps/shared-utils`
- [x] `eslint:lint` of the changed projects and `tsc:build` of `@sps/shared-backend-api`, `@sps/file-storage` and `@sps/shared-utils`
- [x] Mutation checks: a middleware without a limit, a middleware that ignores the setting, and a filter column check by truthiness each fail specs
- [x] No project on a dependency cycle in `nx graph`

#### Manual Verification:

- [x] On port 4313 with small limits: a body without a declared length above the API limit answers 413 on a JSON route and on the upload route, a body within the limits reaches the route, and a filter on `constructor` answers 400

---

## Testing Strategy

### Unit Tests:

- Sort: accepted directions, refused methods, refused columns, item handling,
  malformed groups, default order.
- Error mapping: the new messages answer 400.

### Integration Tests:

- None added; the HTTP run below covers the server option, which the unit
  lanes cannot load.

### Manual Testing Steps:

1. Start the API from the worktree on port 4313 with the bug-report variables
   blank.
2. Request a public list with `orderBy` in both directions, then with
   `method=sql` and with `column=constructor`.
3. Restart with `API_MAX_REQUEST_BODY_BYTES=1048576`; POST 2 MiB and 512 KiB.
4. Restart without it; POST a body declaring 129 MiB, then upload 5 MiB with
   the operator key and delete the stored file afterwards.

## Performance Considerations

The validation walks the sort items once; the statement is unchanged for a
valid sort. Tables without `orderIndex` lose an `order by` on a null parameter
that never ordered anything.

## Migration Notes

- A first sort item with a method other than `asc` or `desc`, a column the
  table lacks, or a malformed sort group answers 400; such a request answered
  500 or ran another `drizzle-orm` function before.
- A later sort item is not applied but is validated the same way, so a request
  whose later item names another method or a missing column answers 400 where
  it used to succeed. No first-party caller sends one.
- `API_MAX_REQUEST_BODY_BYTES` is optional; unset, the limit stays 128 MiB.

## References

- Research: `thoughts/shared/research/singlepagestartup/ISSUE-313.md`
- Filter validation: issue #269, commit `e3eb1acfe6`
- Per-route upload limit: issue #304, pull request #331
- Review of pull request #334: two inline comments on `apps/api/server.ts` and
  `libs/shared/backend/api/src/lib/repository/database/index.ts`

<!-- Last synced at: 2026-09-26T09:40:00Z -->
