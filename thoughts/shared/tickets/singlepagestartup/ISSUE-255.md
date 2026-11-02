---
repository: singlepagestartup
issue_number: 255
status: In Dev
created: 2026-09-19
---

# Issue: adding an unpriced product to the cart leaves a broken order

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/255
**Status**: In Dev
**Created**: 2026-09-19
**Priority**: high
**Size**: medium
**Type**: bug

---

## Problem to Solve

Adding a product that has no price in any billing currency to the cart returns an error and still leaves a half-written order in the database. Once that order exists, the whole cart widget shows an error on every page of the site.

The product `website` (`e13709ae-58ea-416f-b6d5-d2802c9f5bce`) has two attributes under the `price` attribute key, and neither is linked to a billing currency. The "Add to cart" control offers no currency to pick, so the request carries none.

## What happens now

`POST /api/rbac/subjects/:id/ecommerce-module/orders` (handler `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.ts`) resolves `billingModuleCurrencyId` from the product's attributes, gets `undefined`, and writes anyway:

1. `ecommerce/orders` — created
2. `rbac/subjects-to-ecommerce-module-orders` — created
3. `ecommerce/orders-to-products` — created
4. `ecommerce/stores-to-orders` — created
5. `ecommerce/orders-to-billing-module-currencies` with `billingModuleCurrencyId: undefined` — **fails**

The request returns an error, but steps 1-4 are already committed. The subject now owns a cart order that holds a product and no currency.

From then on every cart render calls the subject cart total route, which reaches `libs/modules/ecommerce/relations/orders-to-products/backend/app/api/src/lib/service/singlepage/get-total/index.ts`. That service throws `Product does not have any target price attributes` for the unpriced row, the error propagates through `ecommerce/models/order` `findByIdTotal` up to `GET /:id/ecommerce-module/orders/total`, and the cart widget renders its error state everywhere.

## Expected behaviour

1. The add-to-cart flow resolves the currency **before** the first write and rejects the request with `Validation error. Product has no price in an available currency` (400) when the product has no price attribute linked to a currency, or when the requested currency is not one of the product's price currencies. No order row is created.
2. The cart total tolerates a row that cannot be priced: that row contributes nothing, is reported in the response, and is logged at warn level. Priced rows are summed as before, so legacy carts render instead of erroring.
3. The "Add to cart" control is disabled with a short "No price" state when the product has no price in any currency, and a failed add-to-cart shows an error toast (today the mutation only toasts on success).

## Scope

Framework layer only: the `singlepage` variants and shared libs. `startup` variants are not touched. No schema change, no new dependency. Full write atomicity for the add-to-cart graph is a separate concern (#213) and stays out of scope.

## Key Details

- Handler: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.ts`
- Total service: `libs/modules/ecommerce/relations/orders-to-products/backend/app/api/src/lib/service/singlepage/get-total/index.ts`
- Aggregators: `ecommerce/models/order` `find-by-id/total.ts`, rbac subject `ecommerce-module/order/total.ts`
- Frontend: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/create-default/`
- Quantity routes do not use the total service and must stay unaffected.
