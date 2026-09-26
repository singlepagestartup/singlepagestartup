---
issue_number: 349
issue_title: "Read cart lines through the subject owner route"
repository: singlepagestartup
created_at: 2026-09-26T00:05:00Z
last_updated: 2026-09-26T03:55:00Z
status: active
current_phase: implement
---

# Process Log: ISSUE-349 - Read cart lines through the subject owner route

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: in_progress
- Current phase: implement
- Next step: complete implementation and open the pull request

## Phase Notes

### Create

- Summary: follow-up of #303; the branch is stacked on `claude/issue-303-roleless-permissions` (PR #346).
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-349.md` (local, not committed).
- Notes: GitHub Project status updates and issue comments are skipped for this wave.

### Research

- Summary: verified the four role-less relation rows and their reviewed-list group, every browser caller of the relation reads (cart card, quantity variant, subject update and delete actions, product cart button, host order widget, one unreferenced host variant), the relation variants that read a line by id, the line totals service, the owner-route, owner-middleware, SDK and variant patterns, permission resolution for a route with no row, and the seed procedure from the #303 records.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-349.md`.
- Notes: baseline unit lanes on this base: `@sps/rbac` 84/391, `@sps/ecommerce` 16/31, `@sps/host` 10/19. The coordinator's restart note arrived after the research document was written; the brief was unchanged, so the run continued from it.

### Plan

- Summary: four phases: the owner route `GET /api/rbac/subjects/:id/ecommerce-module/orders/orders-to-products` with `RequestSubjectIdOwner`, a service that returns the subject's lines with their totals, and SDK actions; the cart components and the ecommerce variants read or receive lines from it; the Admin role on the four relation rows and a role-less row for the new route by dump; an HTTP run. Plan approval is delegated to the issue agent for this wave.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-349.md`.
- Notes: two additions to the ticket's list, both required for the cart to keep working: the new route needs its own permission row (a route without one is admin-only), and the subject update and delete actions, the product cart button and two relation variants (`form-field-default`, `amount`) also read the relation. The owner guard answers 401 for another subject, not 403, because the route uses the shared middleware the subject README requires.

### Implement

- Summary: all four phases done. The seed rows were created through the API on `sps-lite-issue-349` (a copy of the development database) and dumped; the HTTP run covered add to cart, the line route, filters, refusals, the four relation reads for a customer and an admin, a quantity change, a removal and a checkout. Unit lanes, lint, type checks and the placement check passed.
- Outputs: progress file `thoughts/shared/handoffs/singlepagestartup/ISSUE-349-progress.md`.
- Notes: the run paused about three hours (usage limit) between research and implementation; the seed timestamps reflect the real time. The throwaway database was dropped and the worktree env copy restored after the HTTP run.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 4 -->

### Incident 1 — Prettier received the file list as one argument

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `npx prettier --write $FILES` failed with `ENAMETOOLONG` and formatted nothing.
- **Root Cause**: zsh does not split an unquoted variable into words.
- **Fix**: `xargs npx prettier --write < list`.
- **Preventive Action**: pass file lists through `xargs` in zsh sessions.
- **References**: progress file, incident 1.

### Incident 2 — The HTTP proof script sent malformed requests

- **Phase**: Implement
- **Occurrences**: 2
- **Symptom**: add to cart answered 500 (`JSON Parse error`) and POST lines printed twice.
- **Root Cause**: inline JSON with commas inside `$( ... )` within a double-quoted `echo` was split into two calls; first misread as curl `-F` quoting.
- **Fix**: bodies built with `printf` into variables, requests made outside `echo`, `--form-string` for literal form values.
- **Preventive Action**: assign request bodies to variables before calling curl helpers.
- **References**: progress file, incident 2.

### Incident 3 — A line total failure failed the whole line response

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: the new route answered 500 for a cart holding a product with a price attribute without a currency link.
- **Root Cause**: the plan assumed `ordersToProducts.getTotal` always succeeds for cart products; it throws on incomplete catalog prices.
- **Fix**: the service keeps such a line with an empty total list and logs the failure; spec, `paths.yaml` and README updated; plan amended.
- **Preventive Action**: run new owner routes against a copy of real data before calling them done.
- **References**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/orders-to-products.ts`.

### Incident 4 — The Bun API ignored SIGTERM

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: after `kill <pid>` the API kept listening on port 4349.
- **Root Cause**: `bun run --watch server.ts` does not exit on SIGTERM.
- **Fix**: SIGKILL on the server and its parent, followed by a port check.
- **Preventive Action**: stop watched Bun APIs with SIGKILL when timing matters (the dummy provider marks invoices paid ten seconds after checkout).
- **References**: progress file, incident 4.

## Reusable Learnings

- A dump of a copy of the development database deletes seed files for rows added by unmerged branches (here the 29 #303 attachments); restore them with `git checkout` and keep only the new files.
- The dummy payment provider completes the payment ten seconds after checkout inside the API process, which runs order processing (notifications, receipts); an HTTP checkout proof must stop the API before then.
- A new subject route needs its own permission row; without one only the root row decides and the route is admin-only.
