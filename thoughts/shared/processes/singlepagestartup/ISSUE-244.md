---
issue_number: 244
issue_title: "Thread create route assigns the default relation variant to every non-Telegram thread and violates sl_chat_default_thread_unique"
repository: singlepagestartup
created_at: 2026-09-18T00:50:00Z
last_updated: 2026-09-18T00:52:00Z
status: active
current_phase: create
---

# Process Log: ISSUE-244 - Thread create route assigns the default relation variant to every non-Telegram thread and violates sl_chat_default_thread_unique

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: not_started
- Plan: not_started
- Implement: not_started
- Current phase: create
- Next step: run `core/10-research` for issue #244

## Phase Notes

### Create

- Summary: Created issue #244 after the issue-154 scenario failed on `main` (`29370bcbf8`) with `sl_chat_default_thread_unique` once the scenario ran with valid credentials; traced the failure to the relation variant fallback in the thread create route and the partial unique index from the natural-key rollout. Added the issue to Project #2 and moved it through Triage to Research Needed.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-244.md`, `thoughts/shared/processes/singlepagestartup/ISSUE-244.md`, https://github.com/singlepagestartup/singlepagestartup/issues/244.
- Notes: The scenario runner needed `RBAC_SUBJECT_IDENTITY_EMAIL` / `RBAC_SUBJECT_IDENTITY_PASSWORD` in the process environment to reach this failure (see #240); without them every case fails earlier on authentication.

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

<!-- incident-count: 0 -->

## Reusable Learnings

- A scenario that predates a natural-key constraint can encode an API contract the constraint no longer allows; when a scenario turns red after a constraint rollout, compare the route's default values with the partial unique index predicate before touching the test.
