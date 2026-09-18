---
repository: singlepagestartup
issue_number: 241
status: Research Needed
created: 2026-09-18
---

# Issue: Restore or retire the documented 422 Unprocessable Entity category in the shared HTTP error mapper

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/241
**Status**: Research Needed
**Created**: 2026-09-18
**Priority**: medium
**Size**: small
**Type**: bug

---

## Problem to Solve

The shared HTTP error mapper no longer has the `Unprocessable Entity error` (422) category that `README.md` documents and that its own unit spec asserts. Validation-shaped messages from Zod and the query parser therefore map to 500 or 400, and the spec has been red since the category was removed. Found during a quality audit on 2026-09-18 (`main` at `29370bcbf8`).

## Key Details

- `README.md:456` lists `Unprocessable Entity error | 422 | expected string, invalid type, unprocessable entity` in the "Automatic Error Categorization" table.
- `libs/shared/backend/utils/src/lib/http-error/type/index.ts:3-11` (`ErrorCategory`) has no 422 member, and `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts` defines only 401, 403, 500, 404 and 400 entries.
- `libs/shared/backend/utils/src/lib/http-error/index.spec.ts:100-114` expects 422 for `Expected string`, `Invalid body['data']`, `Unprocessable Entity` and `Invalid type. Expected email, got: string`; running `npx nx run @sps/backend-utils:test` fails 6 of 65 cases (`Expected: 422, Received: 500` and `Received: 400`).
- The 422 pattern was removed in `9d60d206df` ("feat: add prefix more", 2025-10-23); the spec and the README were not updated. The failure stayed invisible because `@sps/backend-utils` declares target `test` instead of `jest:test` and is not part of `test:unit:scoped` (tracked in #240).
- Impact: Zod parse failures surfaced as `Expected string` or `Invalid type ...` become `500 Internal server error: ...` responses, which clients and monitoring treat as outages; the documented behavior, the implementation and the test disagree, so #229 (401 expiry) and #232 (409 conflict), which touch the same files, start from an inconsistent baseline.

## Implementation Notes

One authoritative category list shared by `ErrorCategory`, the pattern table, the README table and the spec. Either restore a 422 category with the documented keywords, or remove 422 from the README and the spec deliberately and document how validation-shaped messages are classified. Keep the repository BDD test format.

## Acceptance Criteria

- [ ] `README.md`, `type/index.ts`, `paterns/index.ts` and `index.spec.ts` agree on the category set and status codes.
- [ ] `npx nx run @sps/backend-utils:test` (or the renamed `jest:test` target) passes.
- [ ] Existing 401, 403, 404, 400 and 500 mappings keep their behavior and BDD coverage.
- [ ] The decision is recorded so #229 and #232 can build on it.

## References

- `libs/shared/backend/utils/src/lib/http-error/{index.ts,index.spec.ts,type/index.ts,paterns/index.ts}`
- `README.md` ("Automatic Error Categorization")
- Related: #229, #232, #240

## Comments

None at creation time.
