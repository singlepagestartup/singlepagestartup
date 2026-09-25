Closes #255

## Summary

A product with no price in any billing currency could be added to the cart. The
add-to-cart handler wrote the order, the subject link, the product line and the
store link, and only then failed on the currency link with an undefined id. The
visitor got an error and the order stayed behind, so every later cart render
asked for its total, the total threw on the unpriceable line, and the cart
widget showed an error on every page of the site.

The currency is now resolved before the first write, so a product that cannot
be bought is refused with nothing created, and the cart total tolerates the
orders the bug already produced instead of throwing on them.

## Changes

Add-to-cart:

- New subject singlepage service
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/resolve-currency.ts`,
  exposed as `ecommerceModuleResolveOrderCurrency`. It considers only
  attributes under an attribute key of type `price`, refuses a requested
  currency the product is not priced in, prefers the default billing currency
  among the priced ones, and throws
  `Validation error. Product has no price in an available currency` when the
  product has none. The inline block it replaces accepted a currency attached
  to any attribute and never checked the caller's choice.
- The create handler calls it between the subject lookup and the first write,
  and the inline resolution is gone.

Cart total:

- `getTotal` returns `{ totals, unpriced }`. A line whose product carries no
  price in an available currency contributes no total, is reported under
  `unpriced` with a reason, and is logged once at warn level. A missing order
  line, a missing `RBAC_SECRET_KEY` and a missing price attribute key still
  throw, the last being a misconfiguration that would otherwise zero every
  cart silently.
- `findByIdTotal` aggregates the totals and the reports of its lines.
- The three total routes — the orders-to-products relation, the order
  find-by-id route and the subject cart route — answer `unpriced` beside an
  unchanged `data`. `transformResponseItem` reads only `data`, so existing
  consumers keep the array they had.

Frontend:

- New memoized `AddToCartButton` renders a disabled "No price" control when the
  product's price currencies resolve to none, and stays mounted while they
  load.
- `ClientComponent` receives those currencies through the `set` prop the shared
  `find` component already exposes and wraps its handlers in `useCallback`;
  `Component` forwards the `billingModule` prop its interface declares.
- The failure toast already existed, one layer down in the client action's
  `mutationFn` catch rather than in the component. A spec pins it instead of a
  second toast showing the same message twice.

Tests: 21 scenarios across the currency resolution, the create handler (no
write on a failed resolution), `getTotal`, the client component and the client
action.

## Verification

- [x] `npx nx run @sps/rbac:jest:test` — 73 suites, 321 tests
- [x] `npx nx run @sps/ecommerce:jest:test` — 15 suites, 34 tests
- [x] `npx nx run-many -t eslint:lint -p @sps/rbac,@sps/ecommerce`
- [x] `npx tsc --noEmit -p libs/modules/rbac/tsconfig.json`
- [x] `npx tsc --noEmit -p libs/modules/ecommerce/tsconfig.json`
- [ ] `npx tsc --noEmit -p apps/api/tsconfig.json` — 29 errors, the same count
      on a stashed tree, so they precede this branch.

## How to verify it

On a running instance (`./up.sh`, `npm run api:dev`, `npm run host:dev`):

- Add a product with no price attribute linked to a billing currency. The
  request answers 400 `Validation error. Product has no price in an available
currency` and the order count is unchanged.
- Add a priced product. The request answers 200.
- Load a cart holding a line left by the old behaviour. The order-level total
  answers 200 with that line listed under `unpriced`; the same request answers
  500 on `main`.
- The disabled "No price" control is covered by the component spec rather than
  by a manual step.

## Downstream migration

Impact: required.

- Reason: the order currency is resolved from price attributes only and
  validated before any write, so a catalog that relied on a currency attached
  to a non-price attribute loses its implicit order currency and add-to-cart
  starts answering 400 for those products.
- Applies to: projects whose billing-currency links sit on non-price
  attributes, projects that override the subject order create handler or the
  orders-to-products total service, and projects that read the cart total
  response as anything other than its `data` array.
- Audit each buyable product for at least one attribute under an attribute key
  of type `price` linked to a billing currency. Add the missing link where the
  product is meant to be sold, and expect 400 for the rest.
- Check for cart orders already written without a currency link. They no longer
  break the cart and they carry no total; delete them or attach a currency
  through the normal data-management flow.
- Re-apply any override of the create handler on top of the
  `ecommerceModuleResolveOrderCurrency` call, and any override of `getTotal`,
  `findByIdTotal` or the three total controllers on top of the
  `{ totals, unpriced }` shape.
- Update consumers that read the raw total body rather than its `data` field,
  and any override of the add-to-cart component that renders its own button,
  which now has to honour the disabled "No price" state.
- Verify by adding an unpriced product and confirming a 400 with an unchanged
  order count, adding a priced product and confirming it succeeds, and loading
  a cart holding an unpriced line and confirming the total route answers 200
  with that line under `unpriced`. Run the ecommerce and rbac test suites and
  lint after re-applying overrides.

## Notes

- Two branches are stacked on this one: #257 (per-order total and quantity) and
  #258 (open-cart duplicate guard). Both target
  `claude/issue-cart-unpriced-product` and GitHub retargets them to `main` once
  this merges, so this branch goes first.
- Orders written before the fix keep no total. They stop breaking the cart and
  are listed under `unpriced`; removing them or attaching a currency is a
  data-management decision left to the owner.
