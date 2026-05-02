---
date: 2026-04-14T21:53:15+03:00
researcher: flakecode
git_commit: 7ebeaa11f393408bc54d3ba6cc480ac0ebf7c687
branch: issue-160
repository: singlepagestartup
topic: "Add universal REST /count endpoint and shared SDK support"
tags: [research, codebase, rest-api, sdk, query-filters]
status: complete
last_updated: 2026-05-02
last_updated_by: codex
---

# Research: Add universal REST /count endpoint and shared SDK support

**Date**: 2026-04-14T21:53:15+03:00
**Researcher**: flakecode
**Git Commit**: 7ebeaa11f393408bc54d3ba6cc480ac0ebf7c687
**Branch**: issue-160
**Repository**: singlepagestartup

## Research Question

What currently exists in the shared REST controller, handler, service, repository, query parsing, and shared frontend SDK layers for collection reads, and where would a universal `GET /count` capability connect if it follows the same generic stack and `filters.and` contract already used by `find`?

## Summary

- The shared REST stack currently exposes collection reads only through `GET /`, which flows through `FindHandler` into `service.find(...)` and then into `repository.find(...)`; there is no shared `count` route or `count` method in the controller, service, or repository contracts (`libs/shared/backend/api/src/lib/controllers/rest/index.ts:24`, `libs/shared/backend/api/src/lib/service/interface.ts:5`, `libs/shared/backend/api/src/lib/repository/interface.ts:9`).
- Query parsing and filtering are already centralized for the shared REST surface. Query strings are parsed into `parsedQuery` by middleware, `FindServiceProps` carries `filters.and`, `orderBy.and`, `offset`, and `limit`, and `Database.find` converts those filters into Drizzle predicates through `queryBuilder.filters(...)` (`libs/shared/backend/api/src/lib/middleware/parse-query/index.ts:20`, `libs/shared/backend/api/src/lib/services/interfaces.ts:11`, `libs/shared/backend/api/src/lib/repository/database/index.ts:41`, `libs/shared/backend/api/src/lib/query-builder/filters.ts:39`).
- The shared frontend API/SDK surface mirrors that shared backend shape. `@sps/shared-frontend-api` exports `find` and `findById` as the read helpers, and both the shared server and client factories wrap those actions; no shared `count` action or factory method exists today (`libs/shared/frontend/api/src/lib/actions/index.ts:1`, `libs/shared/frontend/server/api/src/lib/factory/index.ts:34`, `libs/shared/frontend/client/api/src/lib/factory/index.ts:222`).
- Current consumers that need totals still derive them from `find`. The shared admin-v2 table client calls `api.find()` once without params for the total set and once with filters/pagination for the visible rows, then stores `totalData.length` in table state (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/client.tsx:97`).
- The closest existing count-adjacent API pattern is model-specific, not shared: ecommerce order exposes dedicated `/:id/quantity` and `/:id/total` handlers plus dedicated SDK wrappers (`libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/index.ts:76`, `libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/find-by-id/quantity/index.ts:14`, `libs/modules/ecommerce/models/order/sdk/server/src/lib/singlepage/quantity.ts:27`).

## Detailed Findings

### Shared REST Route Registration

- API exposure starts in the top-level app, which mounts each module Hono app under `/api/<module>` (`apps/api/app.ts:123`).
- The shared default app initializes the exception filter, shared query parsing middleware, and logger, then registers every `controller.httpRoutes` entry through `this.hono.on(route.method, route.path, route.handler)` (`libs/shared/backend/api/src/lib/app/default/index.ts:53`).
- The shared REST controller binds these HTTP routes by default:
  - `GET /`
  - `GET /dump`
  - `GET /:uuid`
  - `POST /`
  - `POST /bulk`
  - `PATCH /bulk`
  - `POST /find-or-create`
  - `PATCH /:uuid`
  - `DELETE /:uuid`
    (`libs/shared/backend/api/src/lib/controllers/rest/index.ts:24`).
- The shared controller interface defines `find`, `findById`, `create`, `update`, `delete`, `dump`, and `seed`, with no `count` member in the contract (`libs/shared/backend/api/src/lib/controllers/interface.ts:36`).
- Static routes already precede the parameterized `/:uuid` route in the shared controller: `/dump` is declared before `/:uuid` (`libs/shared/backend/api/src/lib/controllers/rest/index.ts:31`).

### Current Shared Read Flow

- The collection handler reads `c.var.parsedQuery` and forwards it directly to `service.find({ params: c.var.parsedQuery })`, returning the result under `{ data }` (`libs/shared/backend/api/src/lib/controllers/rest/handler/find/index.ts:18`).
- `parsedQuery` is produced by the shared parse-query middleware. It parses query strings with `qs`, stores `populate`, `filters`, `orderBy`, `offset`, and `limit`, and includes extra parsing for `filters.and` and `orderBy.and` when those values arrive as JSON strings (`libs/shared/backend/api/src/lib/middleware/parse-query/index.ts:20`).
- `FindServiceProps` is the shared backend query contract. It contains:
  - `params.filters.and[]` with `column`, `method`, and `value`
  - `params.orderBy.and[]`
  - `params.offset`
  - `params.limit`
    (`libs/shared/backend/api/src/lib/services/interfaces.ts:11`).
- The shared service interface exposes `find` but no aggregate/read-count method (`libs/shared/backend/api/src/lib/service/interface.ts:5`).
- The shared CRUD service delegates `find` to `FindAction`, which simply forwards the call to `repository.find(props)` (`libs/shared/backend/api/src/lib/service/crud/index.ts:30`, `libs/shared/backend/api/src/lib/service/crud/actions/find/index.ts:15`).
- The repository contract exposes `find`, `findByField`, `findFirstByField`, `insert`, `deleteFirstByField`, `updateFirstByField`, `dump`, and `seed`, but no count-specific method (`libs/shared/backend/api/src/lib/repository/interface.ts:9`).
- In the shared database repository, `find` constructs filters with `queryBuilder.filters(...)`, applies them to `.where(methods.and(...filters))`, applies `limit`, `offset`, and `orderBy`, and then validates each row with `selectSchema.parse(...)` before returning them (`libs/shared/backend/api/src/lib/repository/database/index.ts:41`).

### Shared Filter Grammar

- `queryBuilder.filters(...)` accepts only the `and` filter type and throws when other filter-group names are present (`libs/shared/backend/api/src/lib/query-builder/filters.ts:48`).
- Each filter entry is normalized according to column type:
  - date strings become `Date`
  - integer strings become `number`
  - booleans are coerced from string/number/bool
  - JSON fields are parsed when possible
    (`libs/shared/backend/api/src/lib/query-builder/filters.ts:84`).
- UUID columns have a special `eq` path: if the value is a real UUID, the query uses `eq`; otherwise it falls back to a `like` comparison over a text cast of the UUID column (`libs/shared/backend/api/src/lib/query-builder/filters.ts:114`).
- The query builder already supports `eq`, `gt`, `lt`, `not`, `lte`, `gte`, `ne`, `ilike`, `like`, `notIlike`, `notLike`, `inArray`, `notInArray`, `isNull`, and `isNotNull` (`libs/shared/backend/api/src/lib/query-builder/filters.ts:130`).

### Shared Frontend API and SDK Surface

- `@sps/shared-frontend-api` exports the action bundle and types for:
  - `find`
  - `findById`
  - `create`
  - `update`
  - `delete`
  - `findOrCreate`
  - `bulkCreate`
  - `bulkUpdate`
    (`libs/shared/frontend/api/src/index.ts:1`, `libs/shared/frontend/api/src/lib/actions/index.ts:1`).
- The shared `find` action serializes `params` with `qs`, performs a GET request to `${host}${route}?${stringifiedQuery}`, unwraps `{ data }` through `responsePipe`, and returns the transformed result (`libs/shared/frontend/api/src/lib/actions/find/index.ts:23`).
- The shared `findById` action follows the same shape for item reads, using `${host}${route}/${id}?${stringifiedQuery}` and route-level tags (`libs/shared/frontend/api/src/lib/actions/find-by-id/index.ts:23`).
- The shared server factory exposes `findById`, `find`, `update`, `create`, `findOrCreate`, `delete`, `bulkCreate`, and `bulkUpdate`, each forwarding default route/host/params/options into the corresponding shared action (`libs/shared/frontend/server/api/src/lib/factory/index.ts:34`).
- The shared client factory exposes the same read/write shape. `findById` and `find` are modeled as React Query `useQuery(...)` helpers, while write operations use mutations (`libs/shared/frontend/client/api/src/lib/factory/index.ts:222`).
- The client-side `find` query wrapper calls `actions.find(...)`, passes through `params` and saturated headers, and invokes an optional callback with the returned array (`libs/shared/frontend/client/api/src/lib/factory/queries/find/index.tsx:19`).

### Existing Total/Count Consumers

- The shared admin-v2 table client currently derives its total count by making two `find` requests:
  - first `typedProps.api.find()` with no params for the total set
  - then `typedProps.api.find({ params, options })` for filtered and paginated rows
    (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/client.tsx:97`).
- That component writes `totalData.length` into table state inside `useEffect(...)` (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/client.tsx:113`).
- Historical research for issue 142 documents the same pattern explicitly: the admin-v2 table client calls `api.find()` twice, once for total count and once for filtered rows (`thoughts/shared/research/singlepagestartup/ISSUE-142.md`).

### Existing Count-Adjacent Non-Shared Pattern

- Ecommerce order has model-specific routes for `/:id/total` and `/:id/quantity` in its custom controller, alongside the inherited CRUD-style methods (`libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/index.ts:76`).
- The order quantity handler validates `id`, loads the entity with `service.findById({ id })`, then calls a model-specific `service.findByIdQuantity({ id })` and returns `{ data: quantity }` (`libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/find-by-id/quantity/index.ts:14`).
- The matching server SDK wrapper performs a GET to `${host}${route}/${id}/quantity?...` and returns a numeric `data` payload (`libs/modules/ecommerce/models/order/sdk/server/src/lib/singlepage/quantity.ts:27`).
- The matching client SDK wrapper uses `useQuery` with a route-specific key ending in `/quantity` (`libs/modules/ecommerce/models/order/sdk/client/src/lib/singlepage/quantity.ts:22`).
- This pattern shows an existing numeric read response in the repo, but it lives outside the shared generic REST controller/factory stack.

## Code References

- `apps/api/app.ts:123` - mounts module Hono apps under `/api/*`.
- `libs/shared/backend/api/src/lib/app/default/index.ts:53` - shared app initialization and route registration.
- `libs/shared/backend/api/src/lib/controllers/interface.ts:36` - shared controller contract surface.
- `libs/shared/backend/api/src/lib/controllers/rest/index.ts:24` - default REST route table.
- `libs/shared/backend/api/src/lib/controllers/rest/handler/index.ts:1` - handler export registry.
- `libs/shared/backend/api/src/lib/controllers/rest/handler/find/index.ts:18` - collection read handler using `parsedQuery`.
- `libs/shared/backend/api/src/lib/middleware/parse-query/index.ts:20` - shared query parsing middleware.
- `libs/shared/backend/api/src/lib/services/interfaces.ts:11` - `FindServiceProps` definition.
- `libs/shared/backend/api/src/lib/service/interface.ts:5` - service contract without count.
- `libs/shared/backend/api/src/lib/service/crud/index.ts:30` - CRUD service `find` delegation.
- `libs/shared/backend/api/src/lib/service/crud/actions/find/index.ts:15` - `find` action forwarding to repository.
- `libs/shared/backend/api/src/lib/repository/interface.ts:9` - repository contract without count.
- `libs/shared/backend/api/src/lib/repository/database/index.ts:41` - shared database `find` implementation.
- `libs/shared/backend/api/src/lib/query-builder/filters.ts:39` - shared `filters.and` SQL generation.
- `libs/shared/frontend/api/src/index.ts:1` - exported shared action/type surface.
- `libs/shared/frontend/api/src/lib/actions/index.ts:1` - read/write action registry.
- `libs/shared/frontend/api/src/lib/actions/find/index.ts:23` - shared collection GET action.
- `libs/shared/frontend/api/src/lib/actions/find-by-id/index.ts:23` - shared item GET action.
- `libs/shared/frontend/server/api/src/lib/factory/index.ts:34` - shared server factory methods.
- `libs/shared/frontend/client/api/src/lib/factory/index.ts:222` - shared client factory methods.
- `libs/shared/frontend/client/api/src/lib/factory/queries/find/index.tsx:19` - client `find` query wrapper.
- `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/client.tsx:97` - current total derivation by double `find`.
- `libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/index.ts:76` - model-specific `quantity`/`total` route registration.
- `libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/find-by-id/quantity/index.ts:14` - numeric shared-response shape for quantity.
- `libs/modules/ecommerce/models/order/sdk/server/src/lib/singlepage/quantity.ts:27` - server SDK numeric GET wrapper.
- `libs/modules/ecommerce/models/order/sdk/client/src/lib/singlepage/quantity.ts:22` - client React Query wrapper for numeric endpoint.

## Architecture Documentation

- Shared REST apps are assembled as module-local Hono apps that rely on the shared `DefaultApp` bootstrapping and the controller’s `httpRoutes` list.
- The generic collection-read path is currently:
  - query string
  - `ParseQueryMiddleware`
  - `FindHandler`
  - `IService.find`
  - `CRUDService.find`
  - `FindAction`
  - `IRepository.find`
  - `Database.find`
  - `queryBuilder.filters`
- The shared frontend layers reflect that backend path with one generic list-read action (`find`) and one item-read action (`findById`), then wrap them in shared server/client factories rather than model-specific code.
- Numeric aggregate endpoints already exist in module-local code (`quantity`, `total`), but not in the shared base REST stack that all models inherit.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/2026-03-01-testing-framework-variant2-scoped.md` documents the same shared backend REST pipeline (`controllers/rest`, `service/crud`, `repository/database`, `middleware/parse-query`) as the common infrastructure under scenario work.
- `thoughts/shared/research/singlepagestartup/ISSUE-142.md` records that the admin-v2 table currently calls `api.find()` twice and derives totals from array length, which is the closest current consumer of a generic count-like need.
- `thoughts/shared/research/singlepagestartup/ISSUE-145.md` and `thoughts/shared/research/singlepagestartup/ISSUE-145-admin-v2-playbook.md` describe the shared SDK provider conventions and the standard use of `apiProps.params.filters.and` for relation filtering.
- `thoughts/shared/research/singlepagestartup/ISSUE-152.md` documents the model-specific `/quantity` endpoint as an existing numeric read pattern and also records cache considerations for exact-path aggregate routes.

## Related Research

- `thoughts/shared/research/singlepagestartup/2026-03-01-testing-framework-variant2-scoped.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-142.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-145.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-145-admin-v2-playbook.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-152.md`

## Known Pitfalls (from implementation)

### Scenario test wrapper can stay open after passing

During implementation, `bash tools/testing/test-scenario-issue.sh singlepagestartup 160` reported the issue-160 scenario suite as passed, then stayed open with Jest open-handle warnings. The reusable recovery is to confirm the scenario assertions passed, check the spawned API port (4000 for this lane) with `lsof -ti tcp:4000`, and stop the spawned API process so the wrapper exits. Do not treat this symptom as a failed scenario unless assertions fail.

## Open Questions

- The shared stack has no existing count response contract, so the exact shared return type for a generic aggregate read is not represented in `IService`, `IRepository`, `@sps/shared-frontend-api`, or the shared SDK factories today.
- The shared `find` path currently accepts `offset`, `limit`, `orderBy`, and `filters`; the current issue text specifies that `/count` should honor the same filter query contract used by `find`, but no existing shared aggregate implementation shows how the non-filter fields should be treated for a count request.
