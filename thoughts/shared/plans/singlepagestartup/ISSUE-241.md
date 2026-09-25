---
date: 2026-09-19T02:26:21+03:00
issue_number: 241
repository: singlepagestartup
topic: "Restore the documented 422 Unprocessable Entity category in the shared HTTP error mapper"
status: in_review
---

# Restore the 422 Unprocessable Entity Category Implementation Plan

## Overview

This issue is planned together with #229 and #232 because all three change the
same mapper, pattern table, category union and spec. The full plan is
`thoughts/shared/plans/singlepagestartup/ISSUE-229.md`; #241 is its **Phase 1**
and lands first, so the spec lane is green before the other two add scenarios.

No research phase was run for #241. The evidence is in the issue body, in
`thoughts/shared/research/singlepagestartup/ISSUE-232.md:34` and `:108-110`, and
in the research note inside the full plan's "Current State Analysis" section,
which records the recoverable original pattern entry and the exact set of
framework messages whose status changes.

## Decision

Restore rather than retire. The category is documented in `README.md:456` and
asserted by `http-error/index.spec.ts:100-114`; the removal in `9d60d206df`
(2025-10-23) changed neither.

## Scope for #241

- Add `Unprocessable Entity error` to `ErrorCategory`.
- Restore the 422 pattern entry removed in `9d60d206df`, verbatim.
- Insert, immediately before it, a narrow 400 entry anchored to a leading
  `Validation error` phrase, so framework messages that declare their own
  category keep 400 while unprefixed zod-shaped messages reach 422.
- Rename the `@sps/backend-utils` Nx target `test` to `jest:test` so the suite
  runs the same way as its neighbours. This is the one part of #240 taken here.

## Behaviour changes

Two framework messages move from 400 to 422, both the unprefixed "body['data']
is not a string" text:

- `libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/update/index.ts:31-37`
- `libs/modules/notification/models/template/backend/app/api/src/lib/controller/singlepage/render/index.ts:30-36`

Zod messages such as `Expected string, received number` move from the 500
fallback to 422, which is the point of the issue. Every message that begins with
`Validation error.` keeps 400, including the generic REST create, update and
find-or-create handlers.

## References

- Full plan: `thoughts/shared/plans/singlepagestartup/ISSUE-229.md`
- Ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-241.md`
- Related: #240 (test lanes; only the target rename is taken here)
