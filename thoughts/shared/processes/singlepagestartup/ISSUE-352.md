---
issue_number: 352
issue_title: "Per-order subject routes: check the order belongs to the subject"
repository: singlepagestartup
created_at: 2026-09-26T03:23:21Z
last_updated: 2026-09-26T03:37:32Z
status: active
current_phase: implement
---

# Process Log: ISSUE-352 - Per-order subject routes: check the order belongs to the subject

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

- Summary: created by the lead from a finding reported during #347; the issue agent works in the worktree `.claude/worktrees/issue-352` on `claude/issue-352-order-ownership-check`, based on `main` at `78d7d43125`.
- Outputs: GitHub issue #352.
- Notes: GitHub Project status updates and issue comments are skipped for this issue; plan approval is delegated to the issue agent.

### Research

- Summary: the four per-order routes carry no middleware and role-less permission rows; the update and delete handlers check the token's subject against `:id` but never read `subjects-to-ecommerce-module-orders`, so on `main` a subject's own path accepts an order linked to another subject (PATCH and DELETE answered 200 over HTTP). The per-order quantity and total handlers require a body and answer 400 to every GET. Link checks in the module are route middlewares that take the subject service and run after `RequestSubjectIdOwner`.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-352.md`
- Notes: the baseline HTTP run used `sps-lite-issue-352` (a `pg_dump` copy of the development database) and the unchanged worktree API on port 4352. The cart total needs every price attribute of a product to carry a currency, so the proof uses the `pro` product.

### Plan

- Summary: three phases: the `RequestSubjectOwnsEcommerceModuleOrder` middleware with its spec; the four routes declare `RequestSubjectIdOwner` and the new middleware, with a route-table spec that stubs the handlers; one README bullet.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-352.md`
- Notes: `RequestSubjectIdOwner` joins the link check on the four routes, as on the chat routes; it changes the refusal status for another subject's token from 403 to 401 on update and delete, and for a request without a credential from 401 to 400 on delete.

### Implement

- Summary: all three phases are in place. The rbac unit lane (84 suites / 404 tests), lint, types and the placement check pass; each guard's scenarios fail with that guard removed. Over HTTP, an order not linked to the subject in the path now answers 401 on all four routes, another subject's token 401 and a request without a credential 400; the subject's own order and the operator secret reach the handlers, which answer as before, and the cart flow works.
- Outputs: `thoughts/shared/handoffs/singlepagestartup/ISSUE-352-progress.md`.
- Notes: route middlewares are registered per path whatever the method, so the DELETE route also runs the pair declared on PATCH, as the chat thread routes do.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 1 -->

### Incident 1 — A spec passed under Jest but failed the type check

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `tsc --noEmit` reported TS2345 in the route-table spec's handler stub, while Jest passed.
- **Root Cause**: ts-jest runs with `diagnostics: false` (`jest.server-preset.js`).
- **Fix**: typed the stub with `Parameters<Controller[IHandlerName]>`.
- **Preventive Action**: run `tsc --noEmit` on the project after adding or changing a spec.
- **References**: `thoughts/shared/handoffs/singlepagestartup/ISSUE-352-progress.md` (Incident 1).

## Reusable Learnings

- A route-table spec can stub the handlers with `jest.spyOn(Controller.prototype, name)` before the controller is constructed, because the route table captures handler references in the constructor; the spec then pins the guards without depending on handler internals that other changes rewrite.
- A path shared by two routes runs the route middlewares of both declarations for the later method, because `useRoutes()` registers middlewares per path; mutation-check such a route together with its path sibling.
- Before claiming "as before" for HTTP behavior, run the same proof script against the unchanged code first and keep both tables.
