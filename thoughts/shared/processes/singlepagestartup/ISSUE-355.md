---
issue_number: 355
issue_title: "Subject order update: forward only the order lines"
repository: singlepagestartup
created_at: 2026-09-26T03:52:43Z
last_updated: 2026-09-26T04:01:53Z
status: active
current_phase: complete
---

# Process Log: ISSUE-355 - Subject order update: forward only the order lines

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: complete
- Next step: code review of PR #356 by the lead, then merge

## Phase Notes

### Create

- Summary: created by the lead from the review of the order lines work (#349); the issue agent works in the worktree `.claude/worktrees/issue-355` on `claude/issue-355-order-update-fields`, based on `main` at `78d7d43125`.
- Outputs: GitHub issue #355.
- Notes: GitHub Project status updates and issue comments are skipped for this issue; plan approval is delegated to the issue agent.

### Research

- Summary: the subject order update sends the whole parsed `data` to the module-level order update, which writes every field it receives before updating the listed lines; the cart sends only `{ ordersToProducts: [{ id, quantity }] }`. No sibling cart handler forwards the parsed body to a module-level write.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-355.md`
- Notes: the baseline HTTP run used `sps-lite-issue-355` (a `pg_dump` copy of the development database) and the unchanged worktree API on port 4355; an admin-token subject was created in the copy by linking an `init` subject to the Admin role with the operator secret.

### Plan

- Summary: one phase: build the module-level payload from the lines only, each reduced to `id` and `quantity`, with an `Array.isArray` check keeping the existing message; new handler scenarios at the end of `update.spec.ts`.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-355.md`
- Notes: the sibling cart handlers need no change.

### Implement

- Summary: the subject order update sends the module-level update only `{ ordersToProducts: [{ id, quantity }] }`. The rbac unit lane (82 suites / 383 tests), lint, types and the placement check pass, and the new scenarios fail against the `main` handler. Over HTTP a cart quantity change still works, extra order fields in `data` leave the order unchanged, and the admin-token module-level update still writes every field.
- Outputs: commit `0d9cb7b456`; PR #356 (https://github.com/singlepagestartup/singlepagestartup/pull/356) with the description in `thoughts/shared/prs/356_description.md`; `thoughts/shared/handoffs/singlepagestartup/ISSUE-355-progress.md`.
- Notes: the sibling cart handlers were checked and need no change.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 0 -->

## Reusable Learnings

- A subject handler that calls a module-level route with the operator secret decides alone which caller fields reach it; build the forwarded payload field by field from what the frontend form sends and the module-level handler reads.
- An admin token for an HTTP proof on a database copy: link an `init` subject to the Admin role through `POST /api/rbac/subjects-to-roles` with the operator secret; the role applies from the next request.
