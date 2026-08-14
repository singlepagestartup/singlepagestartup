---
issue_number: 224
issue_title: "Prevent server API function objects from crossing shared Server/Client component boundaries"
repository: singlepagestartup
created_at: 2026-08-03T21:21:37Z
last_updated: 2026-08-03T21:24:30Z
status: active
current_phase: create
---

# Process Log: ISSUE-224 - Prevent server API function objects from crossing shared Server/Client component boundaries

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: not_started
- Plan: not_started
- Implement: not_started
- Current phase: create
- Next step: run `core/10-research` for issue #224

## Phase Notes

### Create

- Summary: Created production bug issue #224 from a proven shared Server-to-Client serialization defect and moved it through Triage to Research Needed.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-224.md`, `thoughts/shared/processes/singlepagestartup/ISSUE-224.md`, https://github.com/singlepagestartup/singlepagestartup/issues/224.
- Notes: Type `bug`, priority `medium`, size `medium`; Project #2 status verified as Research Needed.

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
- **Symptom**: `create_issue_with_project.sh` created issue #224 and reported a successful Project add, but its immediate Triage update failed because the item lookup did not yet find issue #224 in Project #2.
- **Root Cause**: The newly added GitHub Project item was not visible to the lookup helper immediately after `gh project item-add`; visibility completed after a short propagation delay.
- **Fix**: Waited five seconds, then reran the canonical status helper for `Triage` and `Research Needed`; both updates succeeded and `get_issue_status.sh` verified `Research Needed`.
- **Preventive Action**: If item creation succeeds but the immediate lookup fails, do not recreate the issue or use a different Project path; retry the canonical status helper after a short bounded delay.
- **References**: `.claude/helpers/create_issue_with_project.sh`, `.claude/helpers/add_issue_to_project.sh`, `.claude/helpers/update_issue_status.sh`, `.claude/helpers/get_issue_status.sh`.

## Reusable Learnings

- Next.js serialization errors that expose the full generated server API method set can be mapped safely to `libs/shared/frontend/server/api/src/lib/factory/index.ts` without retaining request data.
- A successful Project item add can precede lookup visibility by a few seconds; a bounded helper retry preserves workflow correctness without duplicate creation.
