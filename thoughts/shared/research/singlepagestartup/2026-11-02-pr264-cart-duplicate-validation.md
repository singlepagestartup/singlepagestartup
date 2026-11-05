# PR #264 cart duplicate validation

Date: 2026-11-02. Source revision: `b059052f7e8206cd44c981869a92ef931068a730`.
Comparison base: `5cad316c590c77267bb51458873dcfd0858e7608` (main).

## Review and final behavior

Main already repairs the old Subject-ID/store-ID typo described in the original
PR. The remaining guard still depends on store and currency associations and
omits the active-cart type. The original PR narrows the right records, but its
check precedes the creation transaction and allows concurrent requests to pass.

The adapted operation uses existing Subject `withSubjectLock`, backed by a
PostgreSQL transaction advisory lock. Duplicate detection, currency resolution,
Order creation and every association write share its ambient consistency database.
The controller retains authentication, Initial Free restrictions, Product/Store
resolution and its response contract. Owning effective services retain reads and
writes; no new direct SQL, schema or cache path is introduced.

An active cart is `type=cart/status=new` and is scoped to the Subject across stores
and currencies. Duplicates return HTTP 409 through the actual error mapper.
History/cancelled Orders and other Subjects do not block a purchase. Quantity
changes remain an explicit update. No legacy duplicate data is deleted.

Thirteen merge conflicts were reconciled with current main. Main's cart totals,
pricing, frontend composition, DI writes, transaction/capture and currency
selection remain in place. The old base's orphan AddToCartButton is not reintroduced.
Only RBAC backend code, tests, Subject docs and PR artifacts change against main.

## Automated evidence

- `node node_modules/jest/bin/jest.js --config libs/modules/rbac/jest.config.ts --runInBand`:
  187 suites, 1065 tests pass (`RBAC_SECRET_KEY` supplied for the isolated checkout).
- `jest --config libs/modules/rbac/jest.integration.config.ts --runInBand --runTestsByPath
.../ecommerce/order/create.integration.spec.ts`: three PostgreSQL tests pass.
  Four requests through independent Service/Repository instances yield one success,
  three conflicts and one complete graph with quantity 2. Pricing is not called
  for a blocked Product. A failed Store relation leaves no ownership/line writes;
  retry succeeds. History and another Subject permit new Orders.
- `jest --config apps/api/jest.scenario.config.ts --runInBand --runTestsByPath
apps/api/specs/scenario/singlepagestartup/issue-258/backend-cart-duplicate.scenario.spec.ts`:
  one full API scenario passes with disposable Subject/catalog fixtures. Its first
  attempt used `payload.message`; the standard response uses `payload.error`.
  Correcting that assertion produces a passing scenario; runtime behavior was unchanged.
- RBAC `tsc --noEmit` retains the exact 63 baseline test diagnostics after normalizing
  line positions. Ten initial fixture typing errors were corrected with explicit
  Subject-ID guards. No new diagnostics remain.
- Scoped ESLint with project loading disabled (separate TypeScript check): eight
  files, no errors/warnings. Module dependency audit: zero violations. TypeScript
  AST audit: eight changed/new files, zero inline type imports.

## Runtime and Browser

Candidate API runs from the isolated checkout on port 4000. Root Host uses current
main's unchanged frontend with Turbopack on port 3000. Both were started for this check.

Four real HTTP additions return `200,409,409,409`. A duplicate selecting another
Store and RUB instead of USD returns 409 and retains the original USD Order.
A history transition removes that Order from the warmed active-cart response;
a subsequent add returns 200. No cache-busting query is used. No payment link is created.

Browser loads the temporary Product, adds it in USD and displays one cart row.
A second client changes only that fixture line from quantity 1 to 2. The open
sheet updates from 5 USD to 10 USD without reload. Screenshot:
`/private/tmp/sps-pr264-browser-cart.png` (session evidence).
The cross-store fixture was removed before this UI check: leaving two Stores
activates the existing add form's requirement to supply an explicit storeId.
The first UI attempt reported that existing configuration error; the normal
single-Store add then succeeded. Store selection UI is outside this PR.

Temporary runtime Product/attributes, test Stores, anonymous Subject and all
fixture-only Orders, including the Browser-created Order, were removed. Scenario
and integration tests clean their own fixtures. Existing user cart records and
three pre-existing local files were preserved. No checkout was submitted.

## Limits

The invariant applies to this Subject create operation. Generic operator CRUD
can still create inconsistent carts; existing duplicates require reconciliation.
The lock serializes this operation across API processes using the same PostgreSQL
Subject lock namespace. No database uniqueness constraint spanning cart status,
Subject and Product was added. No production Host build was repeated and no real
payment provider was exercised.
