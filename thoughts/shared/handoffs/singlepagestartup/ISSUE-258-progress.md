---
issue_number: 258
issue_title: "The add-to-cart duplicate guard compares a subject id against a store id, so it never fires"
start_date: 2026-09-19T16:30:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-258.md
status: in_progress
---

# Implementation Progress: ISSUE-258 - the add-to-cart duplicate guard never fires

**Started**: 2026-09-19
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-258.md`

## Phase Progress

### Phase 1: A service that answers the duplicate question

- [x] Started: 2026-09-19T17:05:00Z
- [x] Completed: 2026-09-19T17:25:00Z
- [x] Automated verification: PASSED

**Notes**: Two plan details did not survive contact with the code and were corrected in the plan rather than worked around.

The plan expected three relation SDK server imports to fall out of the handler with the guard. None did: the guard read through `this.service.*`, while all five SDK imports serve the writes below it. Only the inline block was removed.

The plan expected the refusal message to be exported from the service, as `resolve-currency.ts` exports `NO_PRICE_IN_AVAILABLE_CURRENCY_ERROR`. It is not. `resolve-currency.ts` refuses, so it owns its message; this service answers a question, so it returns an order id or `null` and the handler throws. The handler already owns six refusal literals and the new one reads identically. No controller in this module imports a deep service path, and adding one for a string would have coupled the controller to a service internal or forced two extra re-exports through `service/index.ts`.

The duplicate guard was placed **before** the currency resolution: a product the subject already holds does not need a price, and this narrowing is three bounded queries against the resolution's five.

### Phase 2: Behaviour coverage

- [x] Started: 2026-09-19T17:25:00Z
- [x] Completed: 2026-09-19T17:45:00Z
- [x] Automated verification: PASSED

**Notes**: 11 new scenarios — 5 in `create.spec.ts` (8 total), 6 in the new service spec.

The handler spec drives the guard through a six-line fake that mirrors the service contract, so its fixtures are real orders rather than a boolean: a `cart/new` order holding the product, a `history/paying` order holding it, a `cart/canceled` order holding it, and a `cart/new` order holding something else. Without that the "paid order" and "different product" scenarios would have been the same stub twice. The query shapes themselves are asserted in the service spec.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 2 -->

### Incident 1 — Project status update fails right after issue creation

- **Occurrences**: 1
- **Stage**: Create
- **Symptom**: `create_issue_with_project.sh` printed `Added issue #258 to project #2 via gh project item-add` and then `Error: Issue #258 ... not found in GitHub Project #2`, exiting non-zero although the issue and the project item both existed.
- **Root Cause**: `update_issue_status.sh` reads the project item list immediately after `item-add`, before the GitHub Projects API has indexed the new item. ISSUE-255 recorded the same failure.
- **Fix**: Followed the preventive action already on file: did not re-run the creator, and folded the retry into the single budgeted "In Dev" status call.
- **Reusable Pattern**: Treat the create helper's status step as best-effort. Re-running the creator opens a duplicate issue.

### Incident 2 — Prettier rejected two lines the test suite accepted

- **Occurrences**: 1
- **Stage**: Phase 2 - Behaviour coverage
- **Symptom**: `@sps/rbac:eslint:lint` failed with two `prettier/prettier` errors in `create.spec.ts` after jest and tsc had both passed.
- **Root Cause**: The new spec block was appended as text rather than formatted; a long `const` line and an inline object literal exceeded the print width.
- **Fix**: `npx prettier --write` on the five changed files, then re-ran lint, jest and tsc. Only `create.spec.ts` changed.
- **Reusable Pattern**: Run prettier on every touched file before lint. jest and tsc pass on formatting the linter rejects, so a green test run says nothing about the lint gate.

## Summary

### Changes Made

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/find-open-cart-order-with-product.ts` (new) — answers whether a subject already holds a product in an open cart order, narrowing subject-first in three bounded queries.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/find-open-cart-order-with-product.spec.ts` (new) — 6 scenarios covering the answer and the query shapes.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts` — imports and delegates `ecommerceModuleFindOpenCartOrderWithProduct`, next to `ecommerceModuleResolveOrderCurrency`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.ts` — the 118-line dead guard replaced by the service call and one throw, placed before the currency resolution.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.spec.ts` — 5 added scenarios; suite header widened to cover both guards.

### Verification

| Command                                               | Result                        |
| ----------------------------------------------------- | ----------------------------- |
| `npx nx run @sps/rbac:jest:test`                      | PASSED — 74 suites, 332 tests |
| `npx nx run @sps/rbac:eslint:lint`                    | PASSED                        |
| `npx tsc --noEmit -p libs/modules/rbac/tsconfig.json` | PASSED                        |

### Pull Request

- [ ] PR created: not requested — the lead verifies against a running instance first
- [ ] PR number: —

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Manual verification by the lead
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-19T17:50:00Z
