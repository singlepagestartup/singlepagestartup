Closes #258

## Summary

The Subject add-to-cart route rejects a Product already present in that Subject's
active cart with HTTP 409. Another store or currency does not create a separate
cart for the same Product. A history or cancelled Order permits another purchase.

## Changes

- Update the PR from current main, preserving its DI writes, transaction scope,
  ownership checks, pricing validation, cart currency controls and frontend readers.
- Find duplicates through Subject links, `type=cart/status=new` Orders and their
  Product lines using the owning services. Remove the global Product-line scan
  and the store/currency association checks.
- Run duplicate detection, currency resolution and the complete Order graph write
  in `ecommerceModuleOrderCreate`, under the existing Subject repository's
  PostgreSQL `withSubjectLock` transaction. Concurrent API instances serialize;
  a failed relation write rolls back the graph.
- Return `Conflict error. Product is already in the cart` with HTTP 409 through
  the current shared error mapper.
- Add PostgreSQL concurrency/rollback tests and an isolated full API scenario.

## Verification

- [x] RBAC unit suite: 187 suites, 1065 tests passed.
- [x] PostgreSQL integration: 3 tests passed, including four concurrent requests
  across independent service instances, graph rollback/retry, history and Subject isolation.
- [x] Full API DB-backed scenario: one test passed through the running candidate API.
- [x] Additional HTTP checks: concurrent responses `200,409,409,409`; different store
  and currency still return 409; history transition permits another add; warmed
  cart reads reflect creation and history changes without cache-busting parameters.
- [x] Browser with Turbopack Host: add a temporary priced Product, see one cart row,
  and observe its quantity/total update from a second client without reloading.
- [x] Scoped ESLint: eight TypeScript files, zero errors/warnings; inline type-import
  audit: zero; module dependency check: zero violations.
- [x] RBAC TypeScript comparison: no added diagnostics against main. The full
  typecheck still reports 63 existing test diagnostics.

Detailed evidence: `thoughts/shared/research/singlepagestartup/2026-11-02-pr264-cart-duplicate-validation.md`.

## Notes

- No schema change, migration, dependency update or data-snapshot edit.
- Temporary runtime fixtures were removed; no payment was created or submitted.
- Existing duplicate carts remain for explicit data reconciliation. Generic
  administrative CRUD does not acquire this Subject operation's guard.
- Host production build was not repeated for this backend change.

## Downstream migration

Impact: required.

Projects overriding Subject order creation or relying on duplicate cart Orders
must use `ecommerceModuleOrderCreate` with the existing `withSubjectLock` transaction.
Keep detection, price resolution and all graph writes inside that transaction;
retain startup-selected services and consistency capture. Guard only active
`cart/new` Orders for the current Subject, across stores and currencies.

Update clients that matched the former Internal/Validation error or 400/404:
repeat adds now return 409 with `Conflict error. Product is already in the cart`.
Increase the existing line quantity through the Subject order-update operation.
Reconcile existing duplicates through the project's data-management flow.

Verify concurrent adds yield one 200 and remaining 409 responses with one complete
Order graph, then verify rollback, history repeat purchases and independent Subjects.
Run the RBAC unit suite, the new integration spec and the issue-258 API scenario.
