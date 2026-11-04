Closes #255
Closes #257

## Summary

Refuse an unpriced Product before the first cart write and keep legacy unpriced
lines from breaking the cart. Integrate current main, including the changes
originally stacked through #263, and adapt to the current cart and purchase
history contracts.

## Changes

- Resolve price currency before main's existing create transaction. Preserve
  injected services, the Initial Free restriction and current ownership guards.
- Return internal `{ totals, unpriced }` results while retaining amount arrays
  in HTTP `data`, cart details and purchase history. Expose line diagnostics in
  current private projections and document the HTTP envelopes.
- Adapt the current Product currency selector and Subject form: disabled while
  loading, «Нет цены» / “No price” when empty, reset inputs when switching Products.
- Keep legacy unpriced rows removable, show a warning and block checkout.
- Repair single-order total/quantity handlers using the existing access service,
  route middleware and consistency snapshots. Keep retired cache files deleted.

## Verification

- 1268 passing tests across RBAC, Ecommerce, middleware and Host; targeted lint,
  formatting, whitespace and module-boundary checks pass.
- Real API: unpriced/unsupported-currency requests return 400 without an Order
  write; priced add succeeds. Owner total/quantity 200; foreign/missing 403;
  missing session rejected.
- Browser on Turbopack dev and built Webpack production: no-price control,
  priced add, quantity update, mixed legacy cart, removal and purchase history.
  Cross-client changes update the open cart without reload; no browser errors.
- Full production build passes TypeScript and prerendering. Temporary local test
  records were removed; existing user carts and checkout changes were preserved.

[Validation report](../research/singlepagestartup/2026-11-02-pr262-cart-runtime-validation.md)
records commands, evidence and limits. Raw module typing retains main's 63
existing test diagnostics; the placement checker retains its Studio collision.
No payment was submitted and no Docker image was built.

## Downstream migration

Adapt owned internal total consumers to `{ totals, unpriced }`, keep arrays in
HTTP data and cart/purchase projections, and expose unpriced rows for removal.
Preserve main's DI, transactions, snapshots and ownership middleware. Update
owned forms to the currency availability callback and reset inputs on Product
changes. Verify rejected adds leave no writes, mixed carts render, owner access
is enforced and built production behaves like dev. No schema migration.
