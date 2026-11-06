---
issue_number: 255
issue_title: "fix(ecommerce): adding an unpriced product to the cart leaves a broken order"
repository: singlepagestartup
created_at: 2026-09-19T00:16:00Z
last_updated: 2026-09-19T02:00:00Z
status: active
current_phase: complete
---

# Process Log: ISSUE-255 - adding an unpriced product to the cart leaves a broken order

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

- Summary: Issue created from a bug the owner hit on the home page and the lead reproduced through the API. Plan approval was delegated to the lead, so the phases run without a pause.
- Outputs: GitHub issue #255, `thoughts/shared/tickets/singlepagestartup/ISSUE-255.md`.
- Notes: Project status calls are rate limited and shared, so this issue uses a fixed budget: one create, one status update, one comment.

### Research

- Summary: Two independent defects. The add-to-cart handler writes four rows before it discovers it has no currency; the cart total service treats any row it cannot price as fatal.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-255.md`.
- Notes: Verified against the owner's running instance with read-only GETs. `startup` carries the same defect as `website` — one of its two price attributes has no currency — so it would break a cart too.

### Plan

- Summary: Three phases — resolve the currency before the first write, tolerate unpriced rows in the total, disable the control the frontend knows will fail.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-255.md`.
- Notes: Atomicity stays out of scope (#213). The resolution deliberately narrows to price attributes, which is a behaviour change for a product whose only currency sits on a non-price attribute.

### Implement

- Summary: Three phases landed in one commit. Currency resolution moved into a subject singlepage service and now runs before the first write; the cart total reports lines it cannot price instead of throwing; the add-to-cart control disables itself for a product with no price currency.
- Outputs: `thoughts/shared/handoffs/singlepagestartup/ISSUE-255-progress.md` holds the file list and the verification table. 5 new spec files, 21 new scenarios.
- Notes: The wire contract stayed additive. `transformResponseItem` reads only `data`, so adding `unpriced` beside it leaves every existing consumer, including the cart total render in `order/list/checkout-default`, working on the same array. No PR was opened: the lead verifies against a running instance first.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 3 -->

### Incident 1 — Project status update fails right after issue creation

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: `create_issue_with_project.sh` printed `Added issue #255 to project #2 via gh project item-add` and then `Error: Issue #255 ... not found in GitHub Project #2`, exiting non-zero although the issue and the project item both existed.
- **Root Cause**: `update_issue_status.sh` reads the project item list immediately after `item-add`; the GitHub Projects API had not yet indexed the new item.
- **Fix**: Left the status alone and folded the retry into the single "In Dev" status call the budget allows, made minutes later. It succeeded.
- **Preventive Action**: Treat the create helper's status step as best-effort. When it fails with "not found in GitHub Project", do not re-run the create helper — set the status in the next scheduled status call instead. Re-running the creator would open a duplicate issue.
- **References**: `.claude/helpers/create_issue_with_project.sh`, `.claude/helpers/update_issue_status.sh`

### Incident 2 — The error toast the ticket asked for already existed

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: The ticket asked to add `toast.error(error.message)` for a failed add-to-cart, on the grounds that the component only toasts on success.
- **Root Cause**: Success and failure feedback live in different layers. The component toasts success from a `useEffect`; the client action's `mutationFn` catch toasts the failure. Reading only the component makes failures look silent.
- **Fix**: Added no second toast, and pinned the existing behaviour with a spec on the client action.
- **Preventive Action**: Check the client action before adding failure feedback to a component in this repository.
- **References**: `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/ecommerce-module/order/create.ts`, `libs/shared/utils/src/lib/response-pipe.ts`, `apps/host/app/layout.tsx`

### Incident 3 — jest-dom matchers are not available

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `expect(button).toBeDisabled is not a function` in a new jsdom spec.
- **Root Cause**: `jest.server-preset.js` registers `jest.setup.ts` only; `@testing-library/jest-dom` is never loaded.
- **Fix**: Asserted on the DOM property directly.
- **Preventive Action**: Frontend specs here use Testing Library queries with plain DOM assertions.
- **References**: `jest.server-preset.js`, `jest.setup.ts`

## Reusable Learnings

- `getHttpErrorType` turns the message prefix into the HTTP status (`Validation error. ` → 400, `Not Found error. ` → 404, `Permission error. ` → 403). The wording of a thrown message is part of the API contract, so changing a prefix changes a status code.
- A handler that writes a graph of rows one SDK call at a time should resolve every id it needs before the first write. Ordering the reads first costs nothing and is what keeps a failure from leaving a partial graph behind.
- `transformResponseItem` returns only `res.data`, so a route can report something new beside `data` without touching a single consumer. That is the cheap way to add a diagnostic to an established response.
- The shared `find` component takes a `set` prop and renders nothing while it loads. Passing `set` lifts the data to a parent that must stay mounted; reading it through `children` alone hands the loading gap to whatever sits inside.
