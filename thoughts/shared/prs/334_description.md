Closes #313.

## Summary

This PR targets `main`, which includes the upload protection from #331. It validates client-supplied sort and filter columns at the shared repository boundary and limits the size of request bodies across the API.

## Changes

- Each sort term must name a Drizzle column of the table and use `asc` or `desc`. Invalid input returns HTTP 400. The repository applies all requested terms in order and appends the table ID as a tie-breaker when available. The default order uses `orderIndex` when present and then the ID.
- Filters validate the table column before applying the operation or accessing a JSON key. Properties such as `constructor` and `enableRLS` are rejected.
- Bun and the shared request middleware use `API_MAX_REQUEST_BODY_BYTES`, which defaults to 134217728 bytes (128 MiB). A declared oversized body receives HTTP 413. The middleware also bounds the bytes read from a chunked body. File Storage continues to enforce its separate upload limit.
- The local deployer and the production and preview GitHub Actions paths pass the configured limit to the API.

## Verification

- [x] The repository, filter and body-limit Jest suites passed 71 tests. The shared HTTP error suite passed 106 tests.
- [x] On a Bun HTTP listener running the API against PostgreSQL, a 512-byte test limit returned 413 for a 1024-byte declared body and for a 600-byte body sent in chunks.
- [x] A two-column sort returned 200 and ordered tied rows by the requested second term. Sort method `sql` and column `constructor` each returned 400.

## Notes

Allow room for multipart headers when choosing the API limit for file uploads.

## Downstream migration

Projects that supply custom list parameters should check every sort term and filter column against the effective table. Clients that display validation errors should handle HTTP 400. Custom API entrypoints should pass the same byte limit to Bun and the request middleware. Custom deployment workflows should pass the setting to both preview and production. Verify a valid multi-column sort, a rejected sort, an upload below the configured limits, and an oversized request with and without a declared length.
