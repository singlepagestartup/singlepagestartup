---
issue_number: 241
issue_title: "Restore or retire the documented 422 Unprocessable Entity category in the shared HTTP error mapper"
repository: singlepagestartup
created_at: 2026-09-18T00:20:00Z
last_updated: 2026-09-18T23:45:00Z
status: active
current_phase: complete
---

# Process Log: ISSUE-241 - Restore or retire the documented 422 Unprocessable Entity category in the shared HTTP error mapper

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: skipped
- Plan: completed
- Implement: completed
- Current phase: complete
- Next step: lead verification of branch `claude/issue-229-error-mapping`, then PR

## Phase Notes

### Create

- Summary: Created issue #241 after `npx nx run @sps/backend-utils:test` failed 6 of 65 cases in `http-error/index.spec.ts`; the research for #229 and #232 independently traced the removal of the 422 pattern to `9d60d206df`. Added the issue to Project #2 and moved it through Triage to Research Needed.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-241.md`, `thoughts/shared/processes/singlepagestartup/ISSUE-241.md`, https://github.com/singlepagestartup/singlepagestartup/issues/241.
- Notes: Companion issue #240 covers why the failing spec is not part of any scoped lane.

### Research

- Summary: Skipped by the lead's instruction. The evidence in the issue body and in `thoughts/shared/research/singlepagestartup/ISSUE-232.md:34`, `:108-110` was sufficient; the planning session added a research note to the shared plan instead of a separate research document.
- Outputs: "Research note for #241" in `thoughts/shared/plans/singlepagestartup/ISSUE-229.md`
- Notes: The removed pattern entry was recovered verbatim from `git show 9d60d206df`.

### Plan

- Summary: Planned together with #229 and #232 because the three issues change the same four files. #241 is Phase 1 of the shared plan and lands first, so the mapper spec is green before the other two add scenarios to it. Decision: restore rather than retire.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-229.md`, `thoughts/shared/plans/singlepagestartup/ISSUE-241.md`
- Notes: Plan approval was delegated to the lead, so the session did not wait for a review gate.

### Implement

- Summary: Added `Unprocessable Entity error` to `ErrorCategory`, restored the 422 pattern entry verbatim, added a narrow 400 entry anchored to a leading `Validation error` phrase directly before it, renamed the Nx target `test` to `jest:test`, corrected the README keyword list and stated the precedence rule under the table.
- Outputs: commit on `claude/issue-229-error-mapping`; `npx nx run @sps/backend-utils:jest:test` 78 passed, 78 total.
- Notes: Only two framework messages change status, both the unprefixed "body['data'] is not a string" text in the ecommerce order update and notification template render controllers.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 2 -->

### Incident 1 — Project item was not immediately visible to the status helper

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: `create_issue_with_project.sh` created the issue and added it to Project #2, but its immediate Triage update failed with `Issue #241 ... not found in GitHub Project #2`.
- **Root Cause**: GitHub Project item visibility lagged behind the successful add operation.
- **Fix**: Waited five seconds and reran `update_issue_status.sh` for Triage and Research Needed; `get_issue_status.sh` then returned Research Needed.
- **Preventive Action**: Keep the bounded retry; do not recreate the issue.
- **References**: `.claude/helpers/create_issue_with_project.sh`, `.claude/helpers/update_issue_status.sh`.

### Incident 2 — Restoring the 422 entry verbatim would have moved framework validation errors

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: The 422 pattern `/expected string/i` matches the generic REST handler message `Validation error. Invalid body['data']: ... Expected string, got: ...`, so restoring the entry at its historical position between the 403 and 500 entries would have changed the generic create, update and find-or-create handlers from 400 to 422.
- **Root Cause**: The pattern table is evaluated in array order and has no notion of a message that already declares its category, while the repository convention is to prefix service errors with `Validation error.`.
- **Fix**: Added a narrow 400 entry with the single anchored pattern `/^validation error\b/i` directly before the 422 entry, and locked three prefixed messages in the spec's 400 block.
- **Preventive Action**: When adding a shape-based pattern to the table, check whether framework messages carrying an explicit category prefix also match it, and place the anchored entry first.
- **References**: `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts`, `libs/shared/backend/api/src/lib/controllers/rest/handler/create/index.ts:23-26`

## Reusable Learnings

- The README error-category table, `ErrorCategory`, the pattern table and `index.spec.ts` are four copies of one contract; changes to the mapper must update all four in the same commit.
