# Issue #232: Map PostgreSQL unique violations to HTTP 409 without exposing database details

## Metadata

- URL: https://github.com/singlepagestartup/singlepagestartup/issues/232
- Status: Research Needed
- Created: 2026-09-09T21:18:32Z
- Labels: `size:small`
- Type: bug
- Priority: medium
- Size: small

## Problem to Solve

The shared backend HTTP error mapper classifies PostgreSQL unique-constraint violations as unknown internal failures. A deterministic resource conflict therefore returns HTTP 500 and propagates database-specific text into nested server logs instead of producing a sanitized HTTP 409 response.

### Observed behavior

Creating an entity whose unique business identifier already exists reaches the database constraint, then the shared error mapper falls through to the generic HTTP 500 branch. Nested handlers repeat the resulting exception, and server logs retain database-specific error text.

### Expected behavior

A PostgreSQL unique violation should be recognized structurally and returned as a sanitized HTTP 409 Conflict. Client-visible output must not expose the constraint name, table, column, database detail, submitted value, or raw driver error. Unrecognized database failures must continue to return HTTP 500.

## Key Details

### Production evidence

- **Affected services:** `api_api`, `postgres_postgres`
- **Audit window:** 24 hours ending 2026-09-09T21:04:23Z. Current application tasks retained logs from the rollout at approximately 2026-09-09T11:56Z.
- **Occurrences:** one failed request/event cluster at 2026-09-09T15:38:48Z; the same failure was repeated through eight API log records across nested handlers.
- **Application image:** `singlepagestartup/didigallery:0.0.224`
- **Sanitized signature:** PostgreSQL unique violation (`SQLSTATE 23505`), `duplicate key value violates unique constraint "<redacted>"`, followed by `Internal server error`.

No submitted slug, database detail field, user data, token, or other sensitive value is included here.

### Minimal safe trace

```text
PostgresError: duplicate key value violates unique constraint "<redacted>"
  at shared REST create handler
  at blog article compose create handler
  at blog article compose service resolveArticle
HTTPException: Internal server error
```

### Impact

- Clients cannot distinguish a retryable/correctable duplicate from a server outage.
- UIs may show a generic failure instead of prompting for a different identifier.
- Error logs are amplified through nested handlers.
- Database implementation details can enter error metadata unless every caller sanitizes them independently.

### Root cause (as stated in the issue)

- `libs/shared/backend/utils/src/lib/http-error/index.ts:85-101` only checks message regexes and otherwise returns HTTP 500 with the original message appended.
- `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts:3-91` has no conflict category or PostgreSQL unique-violation mapping.
- `libs/shared/backend/api/src/lib/controllers/rest/handler/create/index.ts:40-42` delegates repository errors directly to that shared mapper.
- In the observed child flow, `libs/modules/blog/models/article/backend/app/api/src/lib/service/startup/compose.ts:417-429` calls the generic article create SDK with the requested slug, and the article schema enforces uniqueness at `libs/modules/blog/models/article/backend/repository/database/src/lib/fields/singlepage.ts:14-18`.

The observed compose endpoint is child-specific, but the defective error mapper, generic REST create handler, and unique-field implementation are byte-identical to `upstream/main` at upstream commit `99e3037f0852` (local checkout `67a960f34465`). The fix therefore belongs to `singlepagestartup/singlepagestartup`, not the didigallery business layer.

### Reproduction / trigger conditions

1. Use any SPS model with a database-enforced unique field.
2. Create a record with a unique value.
3. Submit another create request with the same value.
4. Observe PostgreSQL `23505` being mapped to HTTP 500 instead of 409.

The production occurrence used the blog article slug constraint, but the shared mapper makes the behavior framework-wide.

## Implementation Notes

### Proposed fix (from the issue)

- Detect PostgreSQL unique violations using structured driver metadata, preferring `code === "23505"` over text matching.
- Handle wrapped/nested errors through the existing extraction path.
- Return HTTP 409 with a stable, sanitized conflict message/category.
- Keep the original structured error available only to controlled server-side observability; do not attach raw database details to the client-facing exception.
- Avoid constraint-name-specific business logic in the shared package.

### Alternatives and risks (from the issue)

- **Per-model preflight lookup:** improves UX but is race-prone and duplicates logic; retain the database constraint as the authority.
- **Message-regex-only mapping:** fragile across driver and PostgreSQL message changes; use structured SQLSTATE metadata first.
- **Map all database errors to 409:** incorrect and could hide real infrastructure or integrity failures; only `23505` should change behavior.
- Audit current `cause` serialization/logging so sanitization does not remove useful internal observability while preventing client disclosure.

### Test plan (from the issue)

- Unit-test `getHttpErrorType` with a driver-shaped `code: "23505"` error and wrapped variants.
- Assert status 409 and a stable safe message/category.
- Assert serialized client output does not contain a fake constraint name, table, column, value, or driver detail.
- Regression-test a non-`23505` PostgreSQL error remains HTTP 500.
- Exercise the generic create handler against a duplicate unique value and verify HTTP 409.
- Run the affected shared backend utility/API test targets and BDD-format checks.

## Acceptance Criteria

- [ ] Structured PostgreSQL `23505` errors map to HTTP 409 Conflict.
- [ ] Wrapped/nested unique violations are recognized by the shared error path.
- [ ] Client-visible message and payload omit constraint, table, column, detail, submitted value, and raw driver error.
- [ ] Non-unique database failures still map to HTTP 500.
- [ ] Generic create and at least one model-level handler return the same safe conflict semantics.
- [ ] Existing authentication, permission, validation, not-found, and internal-error mappings remain unchanged.
- [ ] BDD-formatted tests cover the conflict behavior and sanitization.

## References

- `libs/shared/backend/utils/src/lib/http-error/index.ts`
- `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts`
- `libs/shared/backend/api/src/lib/controllers/rest/handler/create/index.ts`
- `libs/modules/blog/models/article/backend/repository/database/src/lib/fields/singlepage.ts`
- `libs/modules/blog/models/article/backend/app/api/src/lib/service/startup/compose.ts` (child-specific; not present upstream)
- Related issue: #213 (concurrency/idempotency; does not cover safe mapping of database uniqueness conflicts to HTTP 409)

### Duplicate check (from the issue)

Open and closed issues in both `singlepagestartup/singlepagestartup` and `flakecode/didigallery` were searched by the production signature, service, constraint behavior, HTTP status, and likely files. No duplicate was found. Issue #213 is related to concurrency/idempotency but does not cover safe mapping of database uniqueness conflicts to HTTP 409.

## Comments

No comments on the GitHub issue at the time the ticket was captured (2026-09-18).
