---
date: 2026-09-19T00:20:00Z
issue_number: 255
repository: singlepagestartup
topic: "Unpriced product breaks the cart"
status: complete
---

# Research: ISSUE-255 — adding an unpriced product to the cart leaves a broken order

## Question

Why does adding the product `website` to the cart fail and still create an order, and why does the cart widget then show an error on every page?

## Summary

Two independent defects compound. The add-to-cart handler writes four rows before it discovers that it has no currency to link, so a failed request leaves a cart order with a product and no currency. The cart total service then treats any row it cannot price as a fatal error, so that one legacy row makes the whole cart total route fail.

## Data observed on the local instance

Read-only GETs against `http://localhost:4000` with the secret header, on 2026-09-19:

- Price attribute key: `3b7980e7-cdef-4726-beaa-9db8ec0ebdb6` (`type: "price"`).
- Product `website` `e13709ae-58ea-416f-b6d5-d2802c9f5bce` has attributes `c1d96e94-…` (number 510) and `386e253f-…` (number 590). Both are linked to the price attribute key. Neither appears in `attributes-to-billing-module-currencies`.
- Product `startup` `bb2473b0-…` has two price attributes; only `01f52293-…` carries a currency (`311da2ee`, the default ₽). The other, `61fc814f-…`, carries none — so `startup` hits the same total failure as `website` once it is in a cart.
- Product `pro` `e939ed88-…` has price attributes `e9c39940-…` (⭐️ `27b48682`) and `77b773f6-…` (₽ `311da2ee`); both carry currencies, so it is fully priced.
- Product `free-subscription` `2a167247-…` has one price attribute `5bfa4e33-…` linked to `27b48682` (⭐️), plus a topup attribute linked to `0c409156`.
- Default billing currency: `311da2ee-6ee0-466c-bfca-bd0ecff7b549` (₽).
- Single store: `92aefa1f-247b-49a9-b1b9-c8029cc840dc`.

## Defect 1 — the handler writes before it validates

`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.ts`

- Lines 61-155 resolve `billingModuleCurrencyId`: read the product's `products-to-attributes`, then `attributes-to-billing-module-currencies` for those attribute ids, then prefer the default billing currency and otherwise take the first entry.
- When the product has no currency-linked attribute the whole block is skipped (`attributesToBillingModuleCurrencies?.length` is falsy) and `billingModuleCurrencyId` stays `undefined`. Nothing checks it.
- The handler then creates, in order: the order, the `subjects-to-ecommerce-module-orders` link, the `orders-to-products` row, the `stores-to-orders` row, and finally the `orders-to-billing-module-currencies` row with `billingModuleCurrencyId: undefined`, which is the one that fails.

Two further observations about this block:

- It reads **all** the product's attributes, not only the price ones, so a currency attached to a non-price attribute (a topup, for instance) could become the order currency even though the product has no price in it. `free-subscription` is the live example: its all-attribute currency set is `{27b48682, 0c409156}` while its price currency set is `{27b48682}`.
- A caller-supplied `data.billingModule.currency.id` is never checked against the product at all.

## Defect 2 — the total service throws on an unpriced row

`libs/modules/ecommerce/relations/orders-to-products/backend/app/api/src/lib/service/singlepage/get-total/index.ts`

Three throws make a single row fatal:

- `Product does not have any attributes` when the product has no `products-to-attributes`.
- `Product does not have any price attributes` when none of them is under the price key.
- `Product does not have any target price attributes` when a price attribute has no currency link — this is the one the `website` row hits.

Callers propagate it unchanged:

- `libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/find-by-id/total.ts` loops the order's rows and calls `ordersToProducts.getTotal` per row.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/total.ts` loops the subject's cart orders and calls `ecommerceModule.order.findByIdTotal`, merging per currency.
- `libs/modules/ecommerce/relations/orders-to-products/backend/app/api/src/lib/controller/singlepage/total/index.ts` exposes the same service on `orders-to-products/:id/total`.

`getHttpErrorType` (`libs/shared/backend/utils/src/lib/http-error/index.ts`) maps an unprefixed message to 500, so the cart total route answers 500 and the widget renders its error state.

## Not in the blast radius

- The quantity routes (`ecommerce-module/orders/quantity`, `ecommerce-module/orders/:orderId/quantity`) never call `getTotal`; the subject-level one sums `order.findByIdQuantity`.
- `order/id/total.ts` and `order/id/quantity.ts` in the rbac subject controller are, despite their names, copies of a deanonymize handler: they parse `data.email` and call `this.service.deanonymize`. Neither touches the total service. Worth a separate issue; not touched here.

## Error contract

`getHttpErrorType` maps a `Validation error. …` prefix to 400, `Not Found error. …` to 404, `Permission error. …` to 403. The new rejection therefore has to read `Validation error. Product has no price in an available currency`.

## Service placement

The subject singlepage service (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts`) already owns this kind of logic: `ecommerceOrderCheckout` constructs `./ecommerce/order/checkout` with the module read services and delegates. The handler reaches these through `this.service.ecommerceModule.*`, which exposes `attributeKey`, `productsToAttributes`, `attributeKeysToAttributes` and `attributesToBillingModuleCurrencies` (`di.ts:65-80`), plus `this.service.billingModule.currency`. Everything the resolution needs is already injected; no DI change is required.

## References

- Ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-255.md`
- Plan: `thoughts/shared/plans/singlepagestartup/ISSUE-255.md`
