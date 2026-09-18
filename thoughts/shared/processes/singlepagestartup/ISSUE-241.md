---
issue_number: 241
issue_title: "Restore or retire the documented 422 Unprocessable Entity category in the shared HTTP error mapper"
repository: singlepagestartup
created_at: 2026-09-18T00:20:00Z
last_updated: 2026-09-18T00:25:00Z
status: active
current_phase: create
---

# Process Log: ISSUE-241 - Restore or retire the documented 422 Unprocessable Entity category in the shared HTTP error mapper

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: not_started
- Plan: not_started
- Implement: not_started
- Current phase: create
- Next step: run `core/10-research` for issue #241, ideally before planning #229 and #232, which change the same mapper

## Phase Notes

### Create

- Summary: Created issue #241 after `npx nx run @sps/backend-utils:test` failed 6 of 65 cases in `http-error/index.spec.ts`; the research for #229 and #232 independently traced the removal of the 422 pattern to `9d60d206df`. Added the issue to Project #2 and moved it through Triage to Research Needed.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-241.md`, `thoughts/shared/processes/singlepagestartup/ISSUE-241.md`, https://github.com/singlepagestartup/singlepagestartup/issues/241.
- Notes: Companion issue #240 covers why the failing spec is not part of any scoped lane.

### Research

- Summary:
- Outputs:
- Notes:

### Plan

- Summary:
- Outputs:
- Notes:

### Implement

- Summary:
- Outputs:
- Notes:

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 1 -->

### Incident 1 — Project item was not immediately visible to the status helper

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: `create_issue_with_project.sh` created the issue and added it to Project #2, but its immediate Triage update failed with `Issue #241 ... not found in GitHub Project #2`.
- **Root Cause**: GitHub Project item visibility lagged behind the successful add operation.
- **Fix**: Waited five seconds and reran `update_issue_status.sh` for Triage and Research Needed; `get_issue_status.sh` then returned Research Needed.
- **Preventive Action**: Keep the bounded retry; do not recreate the issue.
- **References**: `.claude/helpers/create_issue_with_project.sh`, `.claude/helpers/update_issue_status.sh`.

## Reusable Learnings

- The README error-category table, `ErrorCategory`, the pattern table and `index.spec.ts` are four copies of one contract; changes to the mapper must update all four in the same commit.
