---
issue_number: 213
issue_title: "Make cross-module operations concurrency-safe and idempotent"
repository: singlepagestartup
created_at: 2026-07-20T23:32:10Z
last_updated: 2026-07-21T18:27:35Z
status: active
current_phase: create
---

# Process Log: ISSUE-213 - Make cross-module operations concurrency-safe and idempotent

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: not_started
- Plan: not_started
- Implement: not_started
- Current phase: create
- Next step: run core/10-research for issue #213

## Phase Notes

### Create

- Summary: Created umbrella issue #213 for the cross-module concurrency risks discovered during the issue #211 follow-up audit and moved it through Triage to Research Needed.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-213.md`, `thoughts/shared/processes/singlepagestartup/ISSUE-213.md`, and https://github.com/singlepagestartup/singlepagestartup/issues/213.
- Notes: Issue #211 is already in Code Review, so the new implementation scope was kept in a separate gated issue. A read-only Browser baseline confirmed authenticated Telegram/Admin access, one rapid `/start` error, duplicated Help replies, and the rendered incomplete cart. Import inspection confirmed the allowed dependency direction shared → domain → RBAC orchestration → Agent/transport. GitHub creation required escalated network access; the shared helper then added the issue to Project #2 and completed both status transitions successfully.

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

<!-- incident-count: 1 -->

### Incident 1 — GitHub API unavailable in the restricted sandbox

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: Repository-context preflight could not connect to `api.github.com` from the restricted command environment.
- **Root Cause**: Network access is restricted for ordinary workspace commands.
- **Fix**: Re-ran the same fail-fast `create_issue_with_project.sh` workflow with escalated network access; issue creation, Project assignment, and both status transitions completed successfully.
- **Preventive Action**: Preserve the helper sequence and escalate its network access when the documented GitHub connectivity error occurs; do not replace it with raw or partial `gh` calls.
- **References**: `.codex/skills/core-00-create/SKILL.md`, `.claude/helpers/create_issue_with_project.sh`

## Reusable Learnings

- Cross-module concurrency fixes must distinguish database identity, aggregate atomicity, state claims, and external-side-effect idempotency; one advisory-lock pattern is not sufficient for every class.
