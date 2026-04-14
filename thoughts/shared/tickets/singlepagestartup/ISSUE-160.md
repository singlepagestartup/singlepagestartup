# Issue: Add universal REST /count endpoint and shared SDK support

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/160
**Status**: Research Needed
**Created**: 2026-04-14
**Priority**: medium
**Size**: medium
**Type**: feature

---

## Problem to Solve

Need to add a universal `GET /count` method for all models that use the shared REST controller. The endpoint must return the number of records in the database for the target model and support the same query filtering semantics as `find`.

Expected behavior examples:

- `GET /api/ecommerce/products/count` returns the total number of product records.
- `GET /api/ecommerce/products/count?filters[and][0][column]=variant&filters[and][0][method]=eq&filters[and][0][value]=default` returns only the count of records where `variant=default`.

The route must be implemented in the base REST controller so it becomes available to all inherited model controllers automatically.

## Key Details

- Register the new route in `libs/shared/backend/api/src/lib/controllers/rest/index.ts` above the existing `GET /:uuid` route so `count` is not parsed as a uuid.
- Follow the existing handler-based REST pattern already used in `libs/shared/backend/api/src/lib/controllers/rest/handler`.
- Reuse the existing parsed query contract and current `filters.and` format instead of introducing a separate query shape for `/count`.
- Implement the change across the shared stack: controller -> handler -> service -> repository/database.
- Add `count` support in the shared frontend API/SDK layer, including:
  - `libs/shared/frontend/server/api/src/lib/factory/index.ts`
  - `libs/shared/frontend/client/api/src/lib/factory/index.ts`
- Add the shared action/type for `count` in `libs/shared/frontend/api` if required by the existing action architecture.

## Implementation Notes

- The endpoint response should use a consistent shared contract suitable for backend and SDK consumers.
- The solution must remain generic for all models inheriting the base REST controller, with no per-model duplication.
- Tests should cover:
  - total count without filters;
  - filtered count using existing query filters;
  - route precedence so `/count` does not conflict with `/:uuid`.
- Test files must follow the repository BDD format.
