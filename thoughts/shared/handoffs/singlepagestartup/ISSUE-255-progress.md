---
issue_number: 255
issue_title: "fix(ecommerce): adding an unpriced product to the cart leaves a broken order"
start_date: 2026-09-19T00:16:00Z
completed_date: 2026-09-19
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-255.md
status: complete
---

# Implementation Progress: ISSUE-255 - adding an unpriced product to the cart leaves a broken order

**Started**: 2026-09-19
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-255.md`
**Issue**: https://github.com/singlepagestartup/singlepagestartup/issues/255
**Branch**: `claude/issue-cart-unpriced-product` (worktree `.claude/worktrees/issue-cart-unpriced-product`)

## Phase Progress

### Phase 1: Resolve the order currency before any write

- [x] Started: 2026-09-19T00:35:00Z
- [x] Completed: 2026-09-19T01:05:00Z
- [x] Automated verification: PASSED

**Notes**: The resolution lives in a new subject singlepage service beside `ecommerce/order/checkout.ts` and is called from the handler between the subject lookup and the first write, leaving the order of the existing reads untouched. It narrows to the product's **price** attributes, where the old inline block considered every attribute; a currency attached to a non-price attribute is no longer eligible as the order currency.

### Phase 2: Tolerate a row that cannot be priced

- [x] Started: 2026-09-19T01:05:00Z
- [x] Completed: 2026-09-19T01:30:00Z
- [x] Automated verification: PASSED

**Notes**: `getTotal` now returns `{ totals, unpriced }`. The three "product cannot be priced" throws became reports; a missing product is reported the same way. Genuine failures still throw: a missing order line, a missing `RBAC_SECRET_KEY`, and a missing price attribute key (a misconfiguration that would otherwise silently zero every cart). Both aggregations carry the reports up, and the three routes answer `{ data: <totals as before>, unpriced: [...] }` — `transformResponseItem` reads only `data`, so every existing consumer keeps the array it had.

### Phase 3: Do not offer what cannot be bought

- [x] Started: 2026-09-19T01:30:00Z
- [x] Completed: 2026-09-19T01:55:00Z
- [x] Automated verification: PASSED

**Notes**: The button moved into a memoized `AddToCartButton` and the price currencies reach it through the `set` prop the shared `find` component already exposes, so the control stays mounted instead of disappearing while the currency chain loads. The error toast turned out to exist already (see Incident 2) and was not duplicated.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 3 -->

### Incident 1 — Project status update fails right after issue creation

- **Occurrences**: 1
- **Stage**: Create
- **Symptom**: `create_issue_with_project.sh` added issue #255 to the project and then failed with `Issue #255 ... not found in GitHub Project #2`.
- **Root Cause**: The status helper reads the project item list before the API has indexed the item just added.
- **Fix**: Folded the retry into the single "In Dev" status call the rate-limit budget allows; it succeeded minutes later.
- **Reusable Pattern**: Never re-run the create helper after this error — the issue already exists and a re-run opens a duplicate. Set the status on the next scheduled status call.

### Incident 2 — The error toast the ticket asked for already existed

- **Occurrences**: 1
- **Stage**: Phase 3 - Do not offer what cannot be bought
- **Symptom**: The ticket asked to add `toast.error(error.message)` for a failed add-to-cart because the component only toasts on success.
- **Root Cause**: The success toast sits in the component (`useEffect` on `isSuccess`) while the error toast sits one layer down, in the client action's `mutationFn` catch (`libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/ecommerce-module/order/create.ts`). Reading only the component makes it look as if failures are silent. `responsePipe` throws a `ClientResponseError` carrying the API message, `<Toaster />` is mounted in `apps/host/app/layout.tsx`, so the message does reach the visitor.
- **Fix**: Added no second toast — that would have shown the same message twice — and pinned the existing behaviour with a spec on the client action instead.
- **Reusable Pattern**: Before adding feedback to a component, check the client action it calls. Success and failure feedback are split across the two layers in this repository.

### Incident 3 — jest-dom matchers are not available

- **Occurrences**: 1
- **Stage**: Phase 3 - Do not offer what cannot be bought
- **Symptom**: `expect(button).toBeDisabled is not a function` in a new jsdom spec.
- **Root Cause**: `jest.server-preset.js` sets up `jest.setup.ts` only; `@testing-library/jest-dom` is never registered.
- **Fix**: Asserted on the DOM property directly (`expect(button.disabled).toBe(true)`).
- **Reusable Pattern**: Frontend specs here use plain DOM assertions plus Testing Library queries. No `toBeInTheDocument`, no `toBeDisabled`.

## Summary

### Changes Made

Backend, add-to-cart:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/resolve-currency.ts` (new) — resolves the order currency from the product's price attributes; rejects with `Validation error. Product has no price in an available currency`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts` — exposes `ecommerceModuleResolveOrderCurrency`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.ts` — calls it before the first write; the 95-line inline resolution block is gone.

Backend, cart total:

- `libs/modules/ecommerce/relations/orders-to-products/backend/app/api/src/lib/service/singlepage/get-total/index.ts` — reports unpriceable lines instead of throwing, warns once per line.
- `libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/find-by-id/total.ts` — aggregates totals and reports.
- `libs/modules/ecommerce/relations/orders-to-products/backend/app/api/src/lib/controller/singlepage/total/index.ts`, `libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/find-by-id/total/index.ts`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/total.ts` — answer `data` plus `unpriced`.

Frontend:

- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/create-default/AddToCartButton.tsx` (new) — memoized button with the "No price" state.
- `.../create-default/ClientComponent.tsx` — tracks the price currencies, disables the control when there are none, `useCallback` for the handlers.
- `.../create-default/Component.tsx` — forwards the `billingModule` prop the interface declares.

Tests (new):

- `.../service/singlepage/ecommerce/order/resolve-currency.spec.ts` — 7 scenarios.
- `.../controller/singlepage/ecommerce-module/order/create.spec.ts` — 3 scenarios, no write on a failed resolution.
- `.../service/singlepage/get-total/index.spec.ts` — 5 scenarios.
- `.../create-default/ClientComponent.spec.tsx` — 4 scenarios.
- `.../sdk/client/src/lib/singlepage/ecommerce-module/order/create.spec.ts` — 2 scenarios for the error toast.

### Verification

| Command                                                      | Result                                                    |
| ------------------------------------------------------------ | --------------------------------------------------------- |
| `npx nx run @sps/rbac:jest:test`                             | 73 suites, 321 tests passed                               |
| `npx nx run @sps/ecommerce:jest:test`                        | 15 suites, 34 tests passed                                |
| `npx nx run-many -t eslint:lint -p @sps/rbac,@sps/ecommerce` | passed                                                    |
| `npx tsc --noEmit -p libs/modules/rbac/tsconfig.json`        | passed                                                    |
| `npx tsc --noEmit -p libs/modules/ecommerce/tsconfig.json`   | passed                                                    |
| `npx tsc --noEmit -p apps/api/tsconfig.json`                 | 29 pre-existing errors, identical count on a stashed tree |

### Pull Request

- [ ] PR created: not requested — the lead verifies locally first
- [ ] PR number: —

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-19T02:00:00Z
