---
issue_number: 357
issue_title: "Order fulfilment: confirm the payment before granting products"
repository: singlepagestartup
created_at: 2026-09-26T20:25:29Z
last_updated: 2026-09-26T20:43:42Z
status: active
current_phase: implement
---

# Process Log: ISSUE-357 - Order fulfilment: confirm the payment before granting products

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: in_progress
- Current phase: implement
- Next step: commit, push and open the pull request

## Phase Notes

### Create

- Summary: created by the lead from a finding reported during #355; the issue agent works in the worktree `.claude/worktrees/issue-357` on `claude/issue-357-order-fulfilment-payment-check`, based on `main` at `78d7d43125`.
- Outputs: GitHub issue #357.
- Notes: GitHub Project status updates and issue comments are skipped for this issue; plan approval is delegated to the issue agent, except that a design question about manual payment marking goes to the lead before implementation.

### Research

- Summary: fulfilment grants in `fromPaidStatus` and in the `delivering` branch on the order status alone. The only writer of an order's `paid` is the ecommerce order check (a linked payment intent in `succeeded`), and the only writer of `succeeded` is `updatePaymentIntentStatus`, which every automated payment path calls after writing an invoice `paid`. The admin panel can set order, invoice and payment-intent statuses freely; no offline payment flow is documented or implemented.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-357.md`
- Notes: two read-only analysts covered the billing providers and the admin panel; an HTTP run on a copy of the development database (port 4357) confirmed the records left by the dummy provider and the zero-amount free-subscription path. The copy was dropped after the run.

### Plan

- Summary: a protected confirmation on the proceed service (a linked payment intent in `succeeded` with a linked invoice in `paid`), called by `fromPaidStatus` and the `delivering` branch; an unconfirmed order is not granted, keeps its status and is logged once per process.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-357.md` (status `approved`)
- Notes: manual marking by an admin produces a payment record: the admin marks the order's payment intent `succeeded` and its invoice `paid` in the billing forms, and the subject README documents it. The `delivering` branch gets the same confirmation, and the rule requires both records. A one-step offline-payment action is #359; the balances reset by the `canceling` branch are #360.

### Implement

- Summary: fulfilment grants for an order in `paid` or `delivering` only when a linked payment intent is `succeeded` and carries a `paid` invoice; an order without them keeps its status and is logged once per process and status. The rbac unit lane (82 suites / 393 tests), lint, types and the placement check pass, and each part of the rule fails a scenario when removed. Over HTTP, the dummy-provider purchase, the Telegram free subscription and both offline-payment procedures are fulfilled, and orders set to `paid` or `delivering` without records are not.
- Outputs: `thoughts/shared/handoffs/singlepagestartup/ISSUE-357-progress.md`.
- Notes: in the HTTP run the order check answers 500 when receipt generation cannot reach the host application, after it has written `paid`; the host URL pointed at a closed port by design.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 1 -->

### Incident 1 — The session restarted and cleared the scratchpad

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: helper scripts from earlier issues were gone after a usage-limit interruption.
- **Root Cause**: the scratchpad is tied to the session.
- **Fix**: recreated the launcher and the proof script; the proof creates fresh fixtures on each run.
- **Preventive Action**: keep proof scripts self-contained.
- **References**: `thoughts/shared/handoffs/singlepagestartup/ISSUE-357-progress.md` (Incident 1).

## Reusable Learnings

- Before designing a check on derived state, find the single writer of that state: here one function writes a payment intent's `succeeded` and one handler writes an order's `paid`, so the evidence to require follows from what those writers read.
- Running the same HTTP proof on the unchanged code first shows which legitimate paths the change must keep, with the records each leaves.
