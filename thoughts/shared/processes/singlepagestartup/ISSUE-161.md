---
issue_number: 161
issue_title: "Fix Website Builder buttons-array admin route showing Button table"
repository: singlepagestartup
created_at: 2026-04-17T23:33:09Z
last_updated: 2026-04-18T00:32:24Z
status: active
current_phase: plan
---

# Process Log: ISSUE-161 - Fix Website Builder buttons-array admin route showing Button table

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: not_started
- Current phase: plan
- Next step: human review, then core/30-implement

## Phase Notes

### Create

- Summary: GitHub issue exists and ticket artifact is available at `thoughts/shared/tickets/singlepagestartup/ISSUE-161.md`.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-161.md`
- Notes:

### Research

- Summary: Documented the current admin-v2 route resolution for Website Builder `button` and `buttons-array`, including the overview composition path, prefix-based activation logic, and the model-specific SDK/API wiring currently used by each table.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-161.md`
- Notes: Research completed from live code and existing ticket artifact. No substantive workflow incidents were recorded in this phase.

### Plan

- Summary: Revised the implementation plan after review feedback so it now uses a shared admin-route matcher strategy, includes an audit for same-cause prefix collisions, and expands the confirmed implementation scope to Website Builder, Ecommerce, and Social collision pairs.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-161.md`
- Notes: Issue status was returned to `Plan in Progress` to revise the existing plan. The updated plan now covers `website-builder/button` vs `buttons-array` and the confirmed `attribute` vs `attribute-key` collision pattern in `ecommerce` and `social`, using shared admin-route utilities as the preferred implementation direction.

### Implement

- Summary:
- Outputs:
- Notes:

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 1 -->

### 2026-04-18 - GitHub helper required escalated network access

- Context: Initial `gh`-backed status and issue reads retried and failed inside the sandbox before the planning workflow could continue.
- Impact: Planning paused until the GitHub helper commands were re-run with approved escalated access.
- Resolution: Re-ran `.claude/helpers/get_issue_status.sh`, `gh issue view`, and the issue comment helper with escalated permissions, then continued the planning flow.
- Prevention: For future GitHub-project workflow steps in this environment, prefer escalating the first helper invocation once sandbox-related API connectivity failures appear.

## Reusable Learnings
