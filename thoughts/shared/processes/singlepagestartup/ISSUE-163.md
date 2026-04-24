---
issue_number: 163
issue_title: "Create standalone Waku app to validate apps/host frontend startup behavior"
repository: singlepagestartup
created_at: 2026-04-24T23:50:06Z
last_updated: 2026-04-24T23:55:10Z
status: active
current_phase: create
---

# Process Log: ISSUE-163 - Create standalone Waku app to validate apps/host frontend startup behavior

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: not_started
- Plan: not_started
- Implement: not_started
- Current phase: create
- Next step: run core/10-research for issue 163

## Phase Notes

### Create

- Summary: Created GitHub issue `#163` for a standalone Waku parity spike, added it to the project, and advanced the status to `Research Needed` after documenting the required behavioral parity with `apps/host` and the constraints inherited from issue `#162`.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-163.md`, `https://github.com/singlepagestartup/singlepagestartup/issues/163`
- Notes: The issue scope stays explicitly separate from an in-place `apps/host` migration. It uses issue `#162`, its process/retro artifacts, and the prior architecture research as required context for evaluating whether Waku can support SPS frontend startup and rendering paths.

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

### Incident 1 — GitHub helper sequence required escalated network access

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: The initial `bash -lc` GitHub workflow block failed with `error connecting to api.github.com` while trying to create the issue through `gh`.
- **Root Cause**: GitHub API access was blocked by the sandboxed network context for the `gh` helper sequence.
- **Fix**: Re-ran the same `bash -lc` issue/project workflow block with escalated network permissions, then completed issue creation and project status updates successfully.
- **Preventive Action**: For future `core-*` GitHub helper flows in this environment, rerun the unchanged `bash -lc` block with escalation as soon as `gh` reports connectivity failures to `api.github.com`.
- **References**: `.claude/commands/core/00-create.md`, `.codex/skills/core-00-create/SKILL.md`, `thoughts/shared/tickets/singlepagestartup/ISSUE-163.md`

## Reusable Learnings

- When a framework migration is blocked by unresolved runtime regressions, open a separate parity spike issue instead of broadening the original migration ticket until it mixes evaluation work with in-place upgrade work.
