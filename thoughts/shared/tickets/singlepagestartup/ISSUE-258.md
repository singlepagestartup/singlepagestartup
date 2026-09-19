---
repository: singlepagestartup
issue_number: 258
status: In Dev
created: 2026-09-19
---

# Issue: the add-to-cart duplicate guard compares a subject id against a store id, so it never fires

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/258
**Status**: In Dev
**Created**: 2026-09-19
**Priority**: medium
**Size**: small
**Type**: bug

---

## Problem to Solve

Adding the same product to the cart twice creates a second cart order every time. The handler has a guard meant to refuse it, but the guard can never reach its throw.

## What happens now

`POST /api/rbac/subjects/:id/ecommerce-module/orders` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.ts`) walks five lookups before it decides the product is already in the cart:

1. `ecommerce/orders-to-products` filtered by `productId` — every cart in the system that holds this product.
2. `rbac/subjects-to-ecommerce-module-orders` filtered by `subjectId`.
3. `ecommerce/orders` with those ids and `status: "new"`.
4. `ecommerce/stores-to-orders` filtered by `{ column: "storeId", method: "eq", value: id }` — where `id` is the route's `:id` parameter, the **subject** id.
5. `ecommerce/orders-to-billing-module-currencies` for the surviving orders, where it throws.

Step 4 compares a subject id against a store id. They are ids of different tables and never equal, so the result is always empty, step 5 never runs and the throw is unreachable. The resolved `storeId` variable is right there in the same function and is what the handler writes into the `stores-to-orders` row a few lines later.

The message it would have thrown, `Internal error. Order already exists`, is also misclassified: the shared mapper has no pattern for `Internal error.` and falls through to `/order already exists/i` in the 404 table, so a duplicate cart line would be reported as Not Found.

## Expected behaviour

Adding a product the subject already holds in an open (`status: "new"`) cart order is refused before any write, with a client-error status and a message that says what happened. The order count does not change. A product in a `paid`, `canceled` or any other non-open order can still be added, and a different product can always be added.

## Scope

Framework layer only: the `singlepage` variants and shared libs. `startup` variants are not touched. No schema change, no new dependency.

This branch builds on the #255 branch (`claude/issue-cart-unpriced-product`, commit `ecbf25fad1`), which moved currency resolution into `this.service.ecommerceModuleResolveOrderCurrency` and calls it before the first write. The new guard belongs next to it.

## Key Details

- Handler: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.ts:165-185` (the store lookup) and `:209` (the unreachable throw).
- Sibling service to model after: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/resolve-currency.ts`.
- Error mapper: `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts`, `.../type/index.ts`. There is no `Conflict error` category and no 409 entry on this branch; #232 adds them.
- Existing spec to extend: `.../ecommerce-module/order/create.spec.ts`.
