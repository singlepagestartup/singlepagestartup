Closes #358.

## Summary

The subject cart routes accepted any number as an order line quantity. They now accept a whole number from 1 to 1000 and answer a validation error (400) otherwise, before anything is written. The cart update form applies the same bounds, and the relation's description documents the minimum.

## Changes

- **Bounds.** `quantityBounds = { min: 1, max: 1000 }` in the orders-to-products SDK model (`libs/modules/ecommerce/relations/orders-to-products/sdk/model/src/lib/index.ts`), beside the relation's `variants`. The product model has no stock or limit field, so the maximum is a framework constant a project raises there.
- **Create and product checkout routes.** `POST /api/rbac/subjects/:id/ecommerce-module/orders` and `POST .../ecommerce-module/products/:productId/checkout` take `data.quantity ?? 1` and throw `Validation error. data.quantity must be a whole number from 1 to 1000` unless it is an integer within the bounds, right after the body is parsed and before any read or write. The line create stores the checked value; a refused request no longer leaves an order behind.
- **Update route.** `PATCH .../ecommerce-module/orders/:orderId` throws `Validation error. ordersToProducts[].quantity must be ...` unless every submitted line's quantity is within the bounds, after the order's status check and before the order update.
- **Form.** The cart update form (`ecommerce-module-order-update-default`) validates `z.number().int().min(quantityBounds.min).max(quantityBounds.max)`.
- **Descriptions.** The relation model's `quantity` gets `minimum: 1` and a description; the input example uses 1 instead of 0; the relation README states the bounds.
- The module-level relation and order routes are unchanged for operators.

## Verification

- [x] `npx nx run-many --target=jest:test --projects=@sps/rbac,@sps/ecommerce`: `@sps/rbac` 83 suites / 399 tests, `@sps/ecommerce` 14 / 29.
- [x] New and extended specs: `order/create.spec.ts` (new: 2 stored, absent stored as 1; 0, -1, 1.5, 1001 and `"2"` refused with nothing read or written), `order/id/update.spec.ts` (0, -1, 1.5, 1001 refused before the order update), `product/id/checkout.spec.ts` (the same values refused before any write), `update-default/ClientComponent.spec.tsx` (now on the real form and zod resolver: 3 submits, 0, -1, 1.5 and 1001 do not).
- [x] Mutation checks: the base versions of the three handlers and the form fail every new refusal scenario.
- [x] `npx nx run-many --target=eslint:lint --projects=@sps/rbac,@sps/ecommerce`: pass.
- [x] `npx tsc --noEmit -p libs/modules/{rbac,ecommerce}/tsconfig.json`: no errors.
- [x] `node tools/agents/code-placement.mjs`: clean.
- [x] `git merge-tree --write-tree` against `claude/issue-355-order-update-fields` (#356) and `claude/issue-352-order-ownership-check` (#353): no conflicts, also all three together.
- [x] HTTP on port 4358 against a throwaway copy of the database, with an anonymous `init` subject and a product priced 1000 in one currency and 1 in another: create with 0, -1 and 1.5 answered 400 with no order created; create with 2 answered 200, the cart totals read 2000 and 2; update to 0, -1 and 1.5 answered 400 and the stored quantity stayed 2; update to 3 answered 200, the totals read 3000 and 3; product checkout with 0, -1 and 1.5 answered 400 with no order created.
- [ ] Browser check of the cart update form. Not run: the host needs a real install in the worktree.

## Notes

- After #356 merges, the `Array.isArray` part of the update route's quantity check repeats #356's presence check; the quantity part checks the same values #356's mapping forwards.
- The create and product checkout forms send a fixed quantity of 1 and are unchanged.

## Downstream migration

- **Clients.** Project clients of the subject cart create, product checkout and update routes send a whole number from 1 upwards, or omit the quantity on the create routes to get 1; a quantity of 0 no longer means one.
- **Maximum.** A project that sells more than 1000 units on one order line raises `quantityBounds.max` in `libs/modules/ecommerce/relations/orders-to-products/sdk/model/src/lib/index.ts`.

_Verify:_ add a product with quantity 2 and confirm the cart total is twice the price; `POST /api/rbac/subjects/:id/ecommerce-module/orders` with quantity 0 answers 400; the rbac unit lane passes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
