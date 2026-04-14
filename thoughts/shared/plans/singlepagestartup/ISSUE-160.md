# Universal REST /count Endpoint and Shared SDK Support Implementation Plan

## Overview

Add a shared `GET /count` capability to the generic REST stack so every model inheriting the base controller can return filtered collection totals without materializing full result arrays. Expose the same capability through the shared frontend API plus server/client factories, then switch the shared admin-v2 table total lookup to the new numeric endpoint.

## Current State Analysis

The shared REST controller currently registers collection reads only at `GET /` and item reads at `GET /:uuid`, so there is no generic aggregate route in the base controller today (`libs/shared/backend/api/src/lib/controllers/rest/index.ts:31`). The collection handler forwards parsed query params straight into `service.find(...)`, and the shared service plus repository contracts only define `find`, not `count` (`libs/shared/backend/api/src/lib/controllers/rest/handler/find/index.ts:18`, `libs/shared/backend/api/src/lib/service/interface.ts:5`, `libs/shared/backend/api/src/lib/repository/interface.ts:9`).

The backend already has the right filter plumbing for a count endpoint. Parsed query state is centralized in middleware, and the repository already builds `filters.and` predicates through the shared query builder before executing Drizzle reads (`libs/shared/backend/api/src/lib/middleware/parse-query/index.ts:18`, `libs/shared/backend/api/src/lib/repository/database/index.ts:41`, `libs/shared/backend/api/src/lib/query-builder/filters.ts:39`).

On the frontend, the shared API action registry and both shared factories expose `find` and `findById`, but nothing for numeric collection aggregates (`libs/shared/frontend/api/src/lib/actions/index.ts:1`, `libs/shared/frontend/server/api/src/lib/factory/index.ts:34`, `libs/shared/frontend/client/api/src/lib/factory/index.ts:222`). The admin-v2 table currently gets totals by calling `api.find()` without filters and then writing `totalData.length` into table state, which is both redundant and incorrect for filtered totals (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/client.tsx:97`).

## Desired End State

Every shared REST-backed model exposes `GET /api/<module>/<model>/count`, and the route resolves before `/:uuid` so the literal `count` segment is never treated as an id. The backend reuses the existing parsed filter contract and shared query builder to return a numeric `{ data: number }` response for the matching collection.

The shared frontend API, server factory, and client factory all expose a first-class `count` operation that accepts the same filter params shape already used by `find`. Shared consumers that only need totals can switch from array materialization to the numeric endpoint, starting with the admin-v2 table total-state flow.

For count requests, only collection filters should affect the returned total. Pagination and sorting inputs may still be accepted in the shared params object for call-site compatibility, but they must not change the count result.

### Key Discoveries

- The generic REST route table has one safe insertion point for `/count`: after `/dump` and before `/:uuid` in `libs/shared/backend/api/src/lib/controllers/rest/index.ts:37`.
- The database repository already centralizes predicate generation, so a shared `count` method can reuse `queryBuilder.filters(...)` instead of introducing duplicate filtering logic (`libs/shared/backend/api/src/lib/repository/database/index.ts:43`, `libs/shared/backend/api/src/lib/query-builder/filters.ts:48`).
- The shared admin-v2 table currently performs two list reads and derives totals from array length, making it the clearest shared consumer to migrate once `count` exists (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/client.tsx:97`).
- The repo already has a numeric GET response pattern in model-specific order quantity handlers/SDKs, which gives a response-shape precedent even though the implementation is not shared (`libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/find-by-id/quantity/index.ts:14`, `libs/modules/ecommerce/models/order/sdk/server/src/lib/singlepage/quantity.ts:27`).

## What We're NOT Doing

- Adding pagination metadata envelopes to existing `find` responses.
- Introducing model-specific aggregate routes beyond the shared `/count` collection endpoint.
- Expanding the shared filter grammar beyond the existing `filters.and` contract.
- Refactoring unrelated count-like endpoints such as order `quantity` or `total`.

## Implementation Approach

Add `count` as a peer to `find` across the shared backend contracts, then mirror that operation across the shared frontend API/factory surface. Keep the endpoint intentionally narrow: it should share filter parsing with `find`, return a numeric payload, and ignore `limit`, `offset`, and `orderBy` when computing totals. After the shared primitives exist, migrate the admin-v2 table's total lookup to `api.count(...)` so the new capability is exercised by a real shared consumer.

## Phase 1: Extend The Shared Backend REST Stack

### Overview

Introduce a generic count route and count contract from controller through repository so every shared REST-backed model can serve `/count` with shared filter handling.

### Changes Required

#### 1. Shared controller and handler surface

**Files**:
- `libs/shared/backend/api/src/lib/controllers/interface.ts`
- `libs/shared/backend/api/src/lib/controllers/rest/index.ts`
- `libs/shared/backend/api/src/lib/controllers/rest/handler/index.ts`
- `libs/shared/backend/api/src/lib/controllers/rest/handler/find/index.ts`
- `libs/shared/backend/api/src/lib/controllers/rest/handler/count/index.ts` (new)

**Why**:
The base controller currently exposes `find`, `findById`, and write routes but no aggregate read route, and `/count` must be registered before `/:uuid` to avoid route collisions (`libs/shared/backend/api/src/lib/controllers/rest/index.ts:31`).

**Changes**:
- Extend the controller contract with a `count` handler method.
- Register `GET /count` in the shared REST route table before `GET /:uuid`.
- Add a dedicated count handler that reads `c.var.parsedQuery`, forwards the shared params to `service.count(...)`, and returns `{ data: number }`.
- Export the new handler alongside the existing handler registry so inherited controllers get the route automatically.

#### 2. Shared service and repository contracts

**Files**:
- `libs/shared/backend/api/src/lib/service/interface.ts`
- `libs/shared/backend/api/src/lib/service/crud/index.ts`
- `libs/shared/backend/api/src/lib/service/crud/actions/count/index.ts` (new)
- `libs/shared/backend/api/src/lib/service/crud/actions/index.ts` or equivalent export barrel
- `libs/shared/backend/api/src/lib/repository/interface.ts`
- `libs/shared/backend/api/src/lib/repository/database/index.ts`

**Why**:
The shared service and repository abstractions currently stop at `find`, so a generic count route cannot propagate through the existing CRUD pipeline without widening those interfaces (`libs/shared/backend/api/src/lib/service/interface.ts:5`, `libs/shared/backend/api/src/lib/repository/interface.ts:9`).

**Changes**:
- Add `count(props?: FindServiceProps): Promise<number>` to the shared service and repository interfaces.
- Add a CRUD service method and thin action class mirroring the existing `find` delegation pattern.
- Implement repository-level count using the same filter builder as `find`, but without applying `limit`, `offset`, or `orderBy`.
- Preserve existing error handling and schema-validation patterns, while skipping row parsing because the count result is numeric.

#### 3. Backend test coverage

**Files**:
- `libs/shared/backend/api/src/lib/repository/database/index.spec.ts`
- Any controller or handler spec introduced for the new route
- `apps/api/specs/scenario/singlepagestartup/issue-160/backend-count.scenario.spec.ts` (new)
- `apps/api/specs/scenario/singlepagestartup/issue-160/test-utils/db.ts` (new or shared helper)

**Why**:
The new shared aggregate path changes a core repository contract and route table, so it needs direct coverage around filtered counts and route behavior. The repo’s scenario lane is the correct top-level place to prove that the real HTTP endpoint, query parsing, and database state all agree.

**Changes**:
- Add repository tests for unfiltered and filtered `count` behavior using the same `filters.and` grammar used by `find`.
- Add a route-focused test that proves `/count` resolves as a static endpoint instead of falling through to `/:uuid`.
- Add a backend scenario suite under `apps/api/specs/scenario/singlepagestartup/issue-160/` that hits a real shared REST-backed model via HTTP.
- In that scenario, verify one `GET /count` request without filters and one `GET /count` request with `filters[and]`.
- Use a dedicated Drizzle-backed DB helper in the scenario test utilities to calculate the expected counts directly from the database and compare them to the API response.
- Keep new tests in the repo’s BDD test format.

### Success Criteria

#### Automated Verification

- [ ] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run @sps/shared-backend-api:jest:test`
- [ ] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run @sps/shared-backend-api:tsc:build`
- [ ] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run @sps/shared-backend-api:eslint:lint`

#### Manual Verification

- [ ] `GET /api/<module>/<model>/count` returns a numeric `data` payload for an unfiltered request.
- [ ] `GET /api/<module>/<model>/count` honors `filters[and]` inputs used by existing list reads.
- [ ] `GET /api/<module>/<model>/count` is not mistaken for `GET /:uuid`.
- [ ] Scenario coverage proves the API result matches direct DB counts for both unfiltered and filtered requests.

---

## Phase 2: Add Shared Frontend API And SDK Support

### Overview

Expose the new backend capability through the shared frontend action registry and the shared server/client factories so model SDK consumers get a standard `count` method.

### Changes Required

#### 1. Shared frontend action surface

**Files**:
- `libs/shared/frontend/api/src/lib/actions/index.ts`
- `libs/shared/frontend/api/src/lib/actions/count/index.ts` (new)
- `libs/shared/frontend/api/src/index.ts`
- `libs/shared/frontend/api/src/lib/actions/index.spec.ts`

**Why**:
The shared frontend API layer is the common contract consumed by the server/client factories, and it currently has no numeric collection read primitive (`libs/shared/frontend/api/src/lib/actions/index.ts:18`, `libs/shared/frontend/api/src/lib/actions/find/index.ts:23`).

**Changes**:
- Add a `count` action that serializes params like `find` but requests `${route}/count`.
- Export the action and its prop/result types from the shared action barrel and top-level package entrypoints.
- Add action tests covering query-string serialization, route construction, and numeric response transformation.

#### 2. Shared server and client factories

**Files**:
- `libs/shared/frontend/server/api/src/lib/factory/index.ts`
- `libs/shared/frontend/client/api/src/lib/factory/index.ts`
- `libs/shared/frontend/client/api/src/lib/factory/queries/count/index.tsx` (new)

**Why**:
The server factory and client React Query factory define the ergonomic SDK surface used across modules, and both need a `count` method for the new shared feature to be consumable (`libs/shared/frontend/server/api/src/lib/factory/index.ts:34`, `libs/shared/frontend/client/api/src/lib/factory/index.ts:222`).

**Changes**:
- Add `count` to the server factory with the same default route/host/params merging pattern as `find`.
- Add a client-side count query wrapper returning `number | undefined`, with query keys and subscriptions that distinguish `${route}/count` from list reads.
- Thread shared prop types so consumers can pass the same filter params shape they already use with `find`.

### Success Criteria

#### Automated Verification

- [ ] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run @sps/shared-frontend-api:jest:test`
- [ ] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run @sps/shared-frontend-api:tsc:build`
- [ ] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run @sps/shared-frontend-components:tsc:build`

#### Manual Verification

- [ ] Server-side SDK consumers can call `api.count({ params })` and receive a number.
- [ ] Client-side SDK consumers can call `api.count({ params })` and receive a React Query result keyed separately from `find`.
- [ ] Count requests reuse the same filter params shape as `find` without requiring consumer-specific adapters.

---

## Phase 3: Migrate Shared Consumer And Lock In Behavior

### Overview

Adopt the new shared count capability in the admin-v2 table total-state path and add focused regression coverage so future changes do not revert to list-materialization totals.

### Changes Required

#### 1. Admin-v2 table total lookup

**Files**:
- `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/client.tsx`
- `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/client.spec.tsx`

**Why**:
The admin-v2 table is the clearest existing shared consumer of totals and currently makes a wasteful extra `find()` call plus `length` derivation (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/client.tsx:97`).

**Changes**:
- Replace the total `find()` request with `api.count(...)`.
- Ensure the table uses the same active filters for its total count that it uses for row lookup, while excluding pagination from the total request.
- Update tests to assert that total state is driven by the numeric count result rather than array length.

#### 2. Cross-layer regression checks

**Files**:
- Shared backend and frontend spec files touched in phases 1 and 2

**Why**:
This feature spans controller routing, repository behavior, shared actions, React Query wrappers, and one concrete consumer, so the final phase should validate the flow as one coherent contract rather than isolated edits.

**Changes**:
- Add or update assertions proving filtered totals remain correct when list requests include pagination.
- Confirm the client-side route keying for `/count` does not collide with list read invalidation semantics.
- Verify that the new endpoint and SDK surface do not require module-specific overrides for shared REST-backed models.

### Success Criteria

#### Automated Verification

- [ ] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run @sps/shared-frontend-components:jest:test`
- [ ] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run @sps/shared-frontend-components:eslint:lint`
- [ ] Relevant shared backend/frontend test suites from phases 1 and 2 still pass together.

#### Manual Verification

- [ ] Admin-v2 table renders row data from `find` while sourcing totals from `count`.
- [ ] Filtering the table updates both visible rows and the reported total consistently.
- [ ] Large datasets no longer require a second full list fetch just to compute totals.

## Testing Strategy

### Unit Tests

- Repository tests for `count` with no filters, standard scalar filters, and JSON/UUID edge cases already handled by `queryBuilder.filters(...)`.
- Shared frontend action tests for `/count` URL construction and numeric response transformation.
- Client table tests proving total state uses the count result and filtered search params.

### Integration Tests

- Route-level verification that `/count` resolves as a static endpoint before `/:uuid`.
- End-to-end shared SDK flow covering backend count, shared action/factory wiring, and one migrated consumer.
- Backend scenario coverage in `apps/api/specs/scenario/singlepagestartup/issue-160/backend-count.scenario.spec.ts` that exercises the real HTTP endpoint against a real database.

### Manual Testing Steps

1. Start the API and host apps with a dataset large enough to make totals observable.
2. Request `/api/<module>/<model>/count` directly with and without `filters[and]` query params and confirm the numeric response matches the database.
3. Open an admin-v2 table backed by a shared REST model, confirm the initial total matches the endpoint, then apply a search/filter and confirm both the row set and total update correctly.

### Scenario Test Plan For This Issue

- Add `apps/api/specs/scenario/singlepagestartup/issue-160/backend-count.scenario.spec.ts` as the top-level backend behavior suite for this feature.
- Seed or create a deterministic set of records for one shared REST-backed model so both total count and filtered count are known in advance.
- Add a scenario helper in `apps/api/specs/scenario/singlepagestartup/issue-160/test-utils/db.ts` that queries the same table through Drizzle and returns:
  - total row count for the chosen dataset
  - filtered row count for the exact `filters.and` case exercised by the scenario
- In the scenario suite, make one HTTP request to `GET /api/<module>/<model>/count` without filters and assert the numeric payload equals the DB helper’s unfiltered result.
- In the same suite, make one HTTP request to `GET /api/<module>/<model>/count` with `filters[and][0][column]`, `filters[and][0][method]`, and `filters[and][0][value]`, then assert the numeric payload equals the DB helper’s filtered result.
- Keep the scenario assertion centered on real API behavior first; the direct DB query is the independent oracle used to validate the API result, not the primary thing under test.
- If the chosen model is cacheable in the scenario lane, ensure the test either clears cache between requests or uses request patterns that avoid stale assertions.

## Performance Considerations

- The count path should avoid selecting and parsing full records, reducing response payload size and memory pressure versus deriving totals from `find().length`.
- Reusing the shared filter builder keeps query semantics aligned with `find`, but the repository implementation should avoid unnecessary sorting or pagination clauses on the aggregate query.
- Client query keys for `/count` should remain distinct from list keys so cache invalidation is precise and predictable.

## Migration Notes

No schema migration is required. This is an additive API/SDK change, but shared consumers that only need totals should migrate from `find().length` to `count()` to realize the intended performance benefit.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-160.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-160.md`
- Related historical context:
  - `thoughts/shared/research/singlepagestartup/ISSUE-142.md`
  - `thoughts/shared/research/singlepagestartup/ISSUE-152.md`
