Closes #258

## Summary

Adding the same product to the cart twice created a second cart order every
time. The add-to-cart handler carried a guard against exactly that, but the
guard could never reach its throw: it filtered `stores-to-orders` by
`{ column: "storeId", method: "eq", value: id }`, where `id` is the route's
`:id` parameter, the subject id. A subject id is never a store id, so the
lookup was always empty, the currency lookup behind it never ran, and the
refusal at the end of the chain was unreachable.

The question now lives in a service, is asked before the first write, and
answers for the cart the interface actually renders.

## Changes

- New subject singlepage service
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/find-open-cart-order-with-product.ts`,
  exposed as `ecommerceModuleFindOpenCartOrderWithProduct` beside the currency
  resolution #255 added. It narrows subject-first: the subject's order links,
  then that subject's open cart orders, then the order lines for this product.
  Three bounded queries replace five, and the old scan of every
  `orders-to-products` row holding the product across the whole system is gone.
- The store and currency hops are dropped rather than repaired. Nothing that
  reads a cart partitions it by store: `order/list.ts`, `order/total.ts`,
  `order/quantity.ts` and the `product/cart-default` frontend variant all key
  the cart on the subject plus `type: "cart"` and `status: "new"`, and the
  `order` table has no store column. A store-scoped guard would have let one
  product appear twice in the single badge, single total and single order list
  the interface renders.
- The `type: "cart"` predicate the old guard omitted is restored, so a product
  in a checked-out order can be bought again.
- The refusal is `Validation error. Product is already in the cart`, which the
  shared mapper classifies as 400. The old `Internal error. Order already
exists` matched no 500 pattern and fell through to `/order already exists/i`
  in the 404 table, so a duplicate would have been reported as Not Found.
- 118 dead lines leave the create handler.
- Specs: 6 scenarios for the service, 5 added to the create handler suite.

## Verification

- [x] `npx nx run @sps/rbac:jest:test` — 74 suites, 332 tests
- [x] `npx nx run @sps/rbac:eslint:lint`
- [x] `npx tsc --noEmit -p libs/modules/rbac/tsconfig.json`
- [x] Manual verification against a running instance, below.

## How to verify it

On a running instance (`./up.sh`, `npm run api:dev`), as an anonymous subject
with its JWT:

- Add a priced product to an empty cart. The request answers 200 and the
  subject's order count goes up by one.
- Post the same product again. The request answers 400
  `Validation error. Product is already in the cart` and no new order is
  created.
- Add a different product. The request answers 200.

Checking the order out moves it to `type: "history"`, after which the same
product can be added again.

## Downstream migration

Impact: required.

- Reason: the add-to-cart route refuses a product the subject already holds in
  an open cart instead of creating a second cart order, so any flow that relied
  on repeat adds producing separate orders stops working.
- Applies to: projects that override the subject order create handler or the
  subject singlepage service, projects whose purchase flow adds the same
  product more than once before checkout, and clients that matched the old
  `Internal error. Order already exists` text or its 404 status.
- Re-apply any override of the create handler on top of the
  `ecommerceModuleFindOpenCartOrderWithProduct` call, which runs before the
  currency resolution and before the first write.
- Where a product is meant to be added more than once, raise the quantity on
  the existing order line through the subject order update route instead of
  posting a second add.
- Update any client keyed on the message `Internal error. Order already exists`
  or on its 404 status. The refusal is `Validation error. Product is already in
the cart` with 400, and becomes 409 when the conflict category lands.
- Audit existing carts for duplicate lines. The guard runs on write, so carts
  created before this change keep their duplicates; remove them through the
  normal data-management flow.
- Verify by adding a priced product to an empty cart and confirming 200 with
  one more order, repeating the call and confirming the refusal with an
  unchanged order count, then checking the order out and confirming the same
  product can be added again. Run the rbac test suite, lint and typecheck after
  re-applying overrides.

## Notes

- Base branch: `claude/issue-cart-unpriced-product` (#262, which closes #255).
  GitHub retargets this pull request to `main` when that one merges. The guard
  sits directly in front of the currency resolution introduced there.
- 409 is the honest status for the refusal. The conflict category arrives with
  #232, and 400 is what the shared mapper offers until then.
- #257 (`claude/issue-order-total-quantity`) branches from the same base and
  also adds a method to
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts`.
  The two conflict there on the second merge; keep both methods.
