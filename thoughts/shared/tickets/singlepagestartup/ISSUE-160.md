# Issue #160: Add universal REST /count endpoint and shared SDK support

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/160
**Status**: Research in Progress
**Created**: 2026-04-14T18:26:53Z

## Problem to Solve

Add a universal `GET /count` endpoint for all models that inherit from the shared REST controller and expose the same capability through the shared frontend API/SDK.

## Key Details

- The shared REST stack currently supports `find`, `findById`, `create`, `update`, `delete`, `findOrCreate`, and bulk operations, but it does not provide a generic `count` endpoint.
- The requested route shape is `GET /api/<module>/<model>/count`.
- The new endpoint is expected to honor the same filter query contract already used by `find`.
- Example requested behavior includes unfiltered count and filtered count with `filters[and][0][column]`, `filters[and][0][method]`, and `filters[and][0][value]`.

## Implementation Notes

- Scope in the issue explicitly references:
  - `libs/shared/backend/api/src/lib/controllers/rest/index.ts`
  - `libs/shared/backend/api/src/lib/controllers/rest/handler`
  - `libs/shared/frontend/server/api/src/lib/factory/index.ts`
  - `libs/shared/frontend/client/api/src/lib/factory/index.ts`
- The issue says the route should be added above `GET /:uuid` so `count` is not treated as a uuid.
- The requested behavior should reuse the existing parsed query structure and `filters.and` semantics.

## References

- Issue label: `size:medium`

## Comments

- No issue comments at fetch time.
