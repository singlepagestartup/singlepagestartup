Closes #355.

## Summary

`PATCH /api/rbac/subjects/:id/ecommerce-module/orders/:orderId` passed the whole parsed request data to the module-level order update, which writes every field it receives before it updates the order lines. The subject route now forwards only the order lines, each as `id` and `quantity`. That is what the cart sends and what the module-level update reads for lines. Quantity changes from the cart work as before; other fields sent through this route are no longer passed on.

## Changes

- **Order update payload.** `controller/singlepage/ecommerce-module/order/id/update.ts` builds the module-level payload as `{ ordersToProducts: [{ id, quantity }] }` from `data.ordersToProducts` and sends nothing else. Order fields beside the lines, and fields inside a line other than `id` and `quantity`, are dropped.
- **List check.** `data.ordersToProducts` must be a list. Anything else is refused with the existing "No ordersToProducts provided" message instead of failing while the lines are mapped.
- **Unchanged.** The status check and the response stay the same. The edits sit below the imports and the token verification line that #339 changes; the route table (#353) and the checkout handlers (#350) are untouched.
- **Sibling cart handlers checked, no change needed.** Order creation builds its records from picked fields (`productId`, `storeId`, the currency id, `quantity`). The per-order quantity and total handlers pass only `data.email` on. The cart list, quantity and total handlers read no body.
- **Specs.** Three new scenarios in `order/id/update.spec.ts`: order fields beside the lines, extra fields inside a line, and a non-list `ordersToProducts`. The existing scenarios still pass.

## Verification

- [x] `npx nx run @sps/rbac:jest:test`: 82 suites, 383 tests pass.
- [x] `npx nx run @sps/rbac:eslint:lint`: pass, no warnings.
- [x] `npx tsc --noEmit -p libs/modules/rbac/tsconfig.json`: no errors.
- [x] `node tools/agents/code-placement.mjs`: clean.
- [x] Mutation check: with the `main` handler, the three new scenarios fail.
- [x] Merge simulation (`git merge-tree`) with the branches of #339, #350 and #353: clean.
- [x] HTTP on port 4355 against a throwaway copy of the development database, before and after the change. Anonymous `init` subject A has two cart orders; subject C is linked to the Admin role with the operator secret.
  - A's quantity change through the subject route: 200, line quantity 2.
  - The same request with `status`, `type` and `comment` in `data`: 200, line quantity 3, and the order stays `new` / `cart` without a comment. The cart quantity read answers 4.
  - `PATCH /api/ecommerce/orders/:id` with A's token: 403. With C's admin token: 200, and `status`, `comment` and `receipt` are written, before and after the change.
- [ ] Browser check of the cart. Not run: the host does not build on the worktree's symlinked `node_modules`. The HTTP run sends the payload the cart's form sends.

## Notes

- Line quantities are not bounded by the subject route; that stays outside this change.

## Downstream migration

- **Callers of the subject update.** Owned clients or overrides that send order fields other than the lines through `PATCH /api/rbac/subjects/:id/ecommerce-module/orders/:orderId` move those changes to `PATCH /api/ecommerce/orders/:id`, called with an admin token or by an operator process.
- **Overrides.** An override of the subject update handler keeps the lines-only payload.

_Verify:_ a cart quantity change through the subject route still updates the line; an extra order field sent with it leaves the order unchanged; the admin order update still writes every field.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
