---
issue_number: 258
issue_title: "The add-to-cart duplicate guard compares a subject id against a store id, so it never fires"
repository: singlepagestartup
created_at: 2026-09-19T16:30:00Z
last_updated: 2026-09-19T17:50:00Z
status: active
current_phase: complete
---

# Process Log: ISSUE-258 - the add-to-cart duplicate guard never fires

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

- Summary: Defect reported by the owner and confirmed by reading the handler. Plan approval is delegated to the lead, so the phases run without a pause.
- Outputs: GitHub issue #258, `thoughts/shared/tickets/singlepagestartup/ISSUE-258.md`.
- Notes: Project helpers are rate limited and shared. Budget for this issue: one create, one status update, one comment.

### Research

- Summary: The store lookup filters `storeId` by the route's subject id, so it is always empty and the throw behind it is unreachable. The store dimension turned out to be meaningless for the guard: no cart read path partitions by store, and the `order` table has no store column.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-258.md`.
- Notes: Two further defects surfaced in the same block — the order query omits `type: "cart"`, and the first lookup scans `orders-to-products` by `productId` across the whole system. Verified against the owner's running instance with read-only GETs: one store, and orders carrying both `cart` and `history` types.

### Plan

- Summary: Two phases. Replace the inline block with a subject singlepage service that narrows subject-first in three bounded queries; then cover it in the repository BDD format.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-258.md`.
- Notes: 409 is the honest status for this refusal but the category does not exist on this branch; #232 adds it. The refusal stays a `Validation error.` message mapped to 400, worded to miss the 404 table that is tested first.

### Implement

- Summary: Both phases landed in one commit. The dead five-lookup block became a subject singlepage service that narrows subject-first, called before the currency resolution; 11 scenarios pin it.
- Outputs: `thoughts/shared/handoffs/singlepagestartup/ISSUE-258-progress.md` holds the file list and the verification table.
- Notes: Two plan details were corrected against the code — no SDK import fell out with the guard, and the refusal message stayed a handler literal because the service answers rather than refuses. No PR was opened: the lead verifies against a running instance first.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 2 -->

### Incident 1 — Project status update fails right after issue creation

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: `create_issue_with_project.sh` printed `Added issue #258 to project #2 via gh project item-add` and then `Error: Issue #258 ... not found in GitHub Project #2`, exiting non-zero although the issue and the project item both existed.
- **Root Cause**: `update_issue_status.sh` reads the project item list immediately after `item-add`; the GitHub Projects API has not indexed the new item yet. ISSUE-255 recorded the same failure.
- **Fix**: Followed the preventive action already on file — did not re-run the creator, and folded the retry into the single budgeted "In Dev" status call made later.
- **Preventive Action**: Treat the create helper's status step as best-effort. Re-running the creator would open a duplicate issue.
- **References**: `.claude/helpers/create_issue_with_project.sh`, `thoughts/shared/processes/singlepagestartup/ISSUE-255.md` Incident 1.

### Incident 2 — Prettier rejected two lines the test suite accepted

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `@sps/rbac:eslint:lint` failed with two `prettier/prettier` errors in `create.spec.ts` after jest and tsc had both passed.
- **Root Cause**: The new spec block was appended as text rather than formatted; a long `const` line and an inline object literal exceeded the print width.
- **Fix**: `npx prettier --write` on the five changed files, then re-ran lint, jest and tsc.
- **Preventive Action**: Run prettier on every touched file before lint. A green jest and tsc run says nothing about the lint gate.
- **References**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.spec.ts`

## Reusable Learnings

- A relation lookup that filters one table's column by another table's id fails silently rather than loudly: the query is valid, the result is empty, and the branch behind it simply never runs. When a guard "does not work", check that every filter value comes from the column's own table before looking for a logic error.
- Before adding a dimension to a write-side guard, check what the read paths key on. A guard stricter than every read invents a distinction the user cannot see.
- A service named `find*` should answer, not refuse. Where the sibling service owns its error message because it refuses, this one returns the offending id or null and leaves the throw to the caller, which is also what let the handler keep all its refusal messages in one place.
