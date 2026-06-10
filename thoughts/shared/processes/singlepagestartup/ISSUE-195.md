---
issue_number: 195
issue_title: "Smooth realtime data updates without full component rerenders"
repository: singlepagestartup
created_at: 2026-06-10T11:23:52Z
last_updated: 2026-06-10T11:25:53Z
status: active
current_phase: create
---

# Process Log: ISSUE-195 - Smooth realtime data updates without full component rerenders

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: not_started
- Plan: not_started
- Implement: not_started
- Current phase: create
- Next step: Run `core-10-research` for issue 195.

## Phase Notes

### Create

- Summary: Creating a new SPS workflow issue from user-provided realtime update implementation notes.
- Outputs:
  - Ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-195.md`
  - Process artifact: `thoughts/shared/processes/singlepagestartup/ISSUE-195.md`
  - GitHub issue: https://github.com/singlepagestartup/singlepagestartup/issues/195
- Notes:
  - User explicitly requested `core-00-create`.
  - Priority inferred as `high`, size as `large`, type as `feature/refactoring` from the implementation scope and cross-cutting frontend impact.
  - GitHub issue was created through `.claude/helpers/create_issue_with_project.sh` and transitioned from `Triage` to `Research Needed`.

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

### Incident 1 — Sandboxed GitHub network retry

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: Initial helper run reported `error connecting to api.github.com` and returned an empty issue URL.
- **Root Cause**: GitHub network access was blocked in the sandboxed command environment.
- **Fix**: Re-ran the same `create_issue_with_project.sh` command with network escalation, preserving the helper-driven workflow.
- **Preventive Action**: For future core workflow GitHub operations, if `gh` reports `api.github.com` connectivity errors, retry the exact helper block with `require_escalated` instead of rewriting the GitHub sequence.
- **References**: `.claude/helpers/create_issue_with_project.sh`; `core-00-create` workflow.

## Reusable Learnings

- For realtime data issues, treat React Query cache patching as the first candidate before adding a second server-data store.
