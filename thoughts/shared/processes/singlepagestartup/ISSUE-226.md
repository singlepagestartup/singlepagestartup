---
issue_number: 226
issue_title: "Remove legacy pre-development files after downstream project migration"
repository: singlepagestartup
created_at: 2026-08-04T12:34:35Z
last_updated: 2026-08-04T12:36:09Z
status: active
current_phase: create
---

# Process Log: ISSUE-226 - Remove legacy pre-development files after downstream project migration

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: not_started
- Plan: not_started
- Implement: not_started
- Current phase: create
- Next step: run `core/10-research` for issue #226 after downstream migration is ready to audit

## Phase Notes

### Create

- Summary: Created issue #226 for deferred legacy cleanup and moved it through Triage to Research Needed; deletion is explicitly gated on downstream-project migration.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-226.md`, `thoughts/shared/processes/singlepagestartup/ISSUE-226.md`, https://github.com/singlepagestartup/singlepagestartup/issues/226.
- Notes: Type `refactoring`, priority `low`, size `small`; Project #2 status verified as Research Needed.

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
- **Symptom**: The create helper created issue #226 and added it to Project #2, but its immediate Triage update could not find the new Project item.
- **Root Cause**: GitHub Project item visibility lagged behind the successful add operation.
- **Fix**: Retried the canonical status helper after the create command returned; Triage and Research Needed updates then succeeded and status verification returned Research Needed.
- **Preventive Action**: When issue creation and Project add succeed but immediate lookup fails, retry the canonical status helper instead of recreating the issue.
- **References**: `.claude/helpers/create_issue_with_project.sh`, `.claude/helpers/update_issue_status.sh`, `.claude/helpers/get_issue_status.sh`.

## Reusable Learnings

- Migration evidence may remain temporarily, but its deletion needs an explicit downstream-adoption gate rather than an arbitrary date.
- A newly added GitHub Project item may need one bounded status-helper retry before it becomes queryable.
