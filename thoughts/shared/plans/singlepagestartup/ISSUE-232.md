---
date: 2026-09-19T02:26:21+03:00
issue_number: 232
repository: singlepagestartup
topic: "Map PostgreSQL unique violations to HTTP 409 without exposing database details"
status: in_review
---

# Map PostgreSQL Unique Violations to HTTP 409 Implementation Plan

## Overview

This issue is planned together with #229 and #241 because all three change the
same mapper, pattern table, category union and spec. The full plan is
`thoughts/shared/plans/singlepagestartup/ISSUE-229.md`; #232 is its **Phase 3**.

## Scope for #232

- Detect a unique violation through the existing shared
  `isUniqueConstraintError` helper, which reads the driver `code`, the
  duplicate-key message, nested causes and a `responsePipe` payload.
- Return 409 with the fixed message `Conflict error. Entity already exists` and
  no constraint name, table, column, detail or submitted value.
- Keep the structured driver error on `UtilsProp.details`, which the exception
  filter does not serialize to the client.
- Add `Conflict error` to `ErrorCategory`, a 409 entry to the pattern table for
  outer hops, and a row to the README category table.
- Leave the module-level duplicate recovery paths untouched; they catch the raw
  error before any handler calls the mapper.

## Sequence

Phase 3 lands after Phase 1 (#241, restores the 422 category and makes
`@sps/backend-utils` runnable as `jest:test`) and Phase 2 (#229, token-safe
authentication errors), so the mapper spec is green before conflict scenarios are
added to it.

## References

- Full plan: `thoughts/shared/plans/singlepagestartup/ISSUE-229.md`
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-232.md`
- Ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-232.md`
