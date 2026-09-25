---
issue_number: 257
issue_title: "fix(rbac): make the per-order cart total and quantity routes compute"
repository: singlepagestartup
created_at: 2026-09-19T16:00:00Z
last_updated: 2026-09-19T17:15:00Z
status: active
current_phase: complete
---

# Process Log: ISSUE-257 - the per-order cart total and quantity routes are copies of the deanonymize handler

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: complete
- Next step: manual verification by the lead against a running API, then PR

## Phase Notes

### Create

- Summary: Copy-paste defect reported by the owner. Two per-order routes carried the body of the deanonymize handler and could never run, because a GET has no multipart body to parse.
- Outputs: GitHub issue #257, `thoughts/shared/tickets/singlepagestartup/ISSUE-257.md`.
- Notes: Plan approval is delegated to the lead, so the phases run without a pause. GitHub Project calls are rate limited and shared, so this issue used a fixed budget: one create, one status update to In Dev, one comment carrying the plan path. The create helper was given a single status ("Research Needed") rather than the usual Triage-then-Research pair, to stay inside that budget.

### Research

- Summary: The two files were born byte-identical in `27d0a2475c` and never implemented. Nothing in the repository calls their paths, and the deanonymize behaviour they contain is reachable through two working POST checkout routes.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-257.md`.
- Notes: Two audits ran in parallel, one over the SDK, OpenAPI and frontend, one over every `deanonymize` call site. Both came back empty for the per-order paths, which is why there was no wrong contract to correct anywhere but in the controller. The audit also turned up an adjacent gap the ticket did not mention: neither path has an RBAC permission row, and the permission resolver is default-deny, so a corrected handler is still refused for an ordinary subject.

### Plan

- Summary: Three phases — a shared ownership service, real handlers with the ownership middleware moved onto the routes, and specs.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-257.md`.
- Notes: The permission gap stayed out of scope. The permission snapshots under `.../repository/database/src/lib/data/` are bulk-exported and the repository rules keep them out of behaviour fixes, so the plan records the gap and gives a runtime recipe instead.

### Implement

- Summary: Three phases landed in one commit. The relation check moved into `assert-subject-owns.ts` in the subject singlepage service; both handlers now load the order, assert ownership, compute and answer; `RequestSubjectIdOwner` moved onto the two route definitions, so neither handler parses a JWT any more.
- Outputs: `thoughts/shared/handoffs/singlepagestartup/ISSUE-257-progress.md` holds the file list, the verification table and the lead's manual recipe. 3 new spec files, 9 new scenarios.
- Notes: The per-order total answers the same grouped entry shape as the aggregate route (`billingModuleCurrency`, `total`, `orders`) holding the one order, so one SDK result type could describe both if either route ever gains one. No PR was opened: the lead verifies against a running instance first.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 2 -->

### Incident 1 — Project status update fails right after issue creation

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: `create_issue_with_project.sh` printed `Added issue #257 to project #2 via gh project item-add` and then `Error: Issue #257 ... not found in GitHub Project #2`, exiting non-zero although the issue and the project item both existed.
- **Root Cause**: `update_issue_status.sh` reads the project item list immediately after `item-add`; the GitHub Projects API had not yet indexed the new item. Identical to Incident 1 on #255, which is now two occurrences across issues.
- **Fix**: Left the status alone and folded the retry into the single "In Dev" status call the budget allows, made minutes later. It succeeded.
- **Preventive Action**: Treat the create helper's status step as best-effort. When it fails with "not found in GitHub Project", never re-run the create helper — that opens a duplicate issue. Set the status in the next scheduled status call instead.
- **References**: `.claude/helpers/create_issue_with_project.sh`, `.claude/helpers/update_issue_status.sh`

### Incident 2 — Prettier rejects hand-written spec formatting

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `npx nx run @sps/rbac:eslint:lint` failed with 3 `prettier/prettier` errors in the new spec files, about line wrapping the formatter would collapse or expand.
- **Root Cause**: The specs were written by hand and never passed through the repository formatter.
- **Fix**: `npx prettier --write` on the changed files, then the lint target passed.
- **Preventive Action**: Run prettier over new files before the lint target; the eslint run reports the diff but does not apply it.
- **References**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/*.spec.ts`

## Reusable Learnings

- The branch builds on the #255 branch (`claude/issue-cart-unpriced-product`, commit `ecbf25fad1`), not on `main`, because the per-order total depends on the `{ totals, unpriced }` shape #255 introduced.
- A route in this framework needs two separate things to be reachable: a handler and an RBAC permission row. The permission resolver (`service/singlepage/is-authorized.ts`) is default-deny, falling back through exact path, template path, method wildcard and then the role-gated root permission. A permission with no `roles-to-permissions` links is public. Fixing a handler without checking for the permission row leaves the route refused, and the refusal looks like an authorization bug rather than a missing registration.
- When a handler's caller identity check duplicates `RequestSubjectIdOwner`, move it to the route. The handler then loses its `@sps/shared-utils` and `hono/jwt` imports, which makes its spec a plain service double with no JWT mocking.
