Closes #349.

Based on #346 (`claude/issue-303-roleless-permissions`); retarget to `main` once #346 merges.

## Summary

The four module-level order line reads, `GET /api/ecommerce/orders-to-products` (list, by id, `count`, `/:id/total`), now require the Admin role. The cart reads its lines through a new owner-checked subject route, and the ecommerce cart variants render the lines their RBAC caller hands them. The anonymous cart keeps working: add to cart, cart sheet, quantity change, line removal and checkout.

## Changes

- **Owner route.** `GET /api/rbac/subjects/:id/ecommerce-module/orders/orders-to-products` answers the lines of the orders linked to the subject through `subjects-to-ecommerce-module-orders`, each with its totals per currency. `RequestSubjectIdOwner` guards it; a caller's `filters.and` narrows the lines within the subject's orders; a line whose price cannot be computed keeps its place with an empty total list, and the failure is logged. Handler in `controller/singlepage/ecommerce-module/order/orders-to-products.ts`, service beside the checkout service (`service/singlepage/ecommerce/order/orders-to-products.ts`), SDK action `ecommerceModuleOrderOrdersToProducts` beside the order list action in both SDKs, `paths.yaml` and the OpenAPI index.
- **Subject variant.** `ecommerce-module-order-list-orders-to-products-default` wraps the action, beside the order list variants.
- **Cart.** The cart sheet and the host order list widget (`subject-ecommerce-order`) read each order's lines and pass them to `cart-default`. The order update and delete actions read the order's lines with the same filter, so they share the sheet's query. The product cart button reads the subject's lines of the product once instead of a module-level read per cart order.
- **Ecommerce variants.** `cart-default` and `orders-to-products-quantity-default` take the order's lines as `ordersToProducts`; the quantity variant also renders the order it is handed, as `cart-default` does since #346. The relation variants `form-field-default` (fetching halves removed, no `apiProps`) and `amount` use the line they are given instead of reading it by id.
- **Seed.** A role-less permission row for the new route, listed among the routes below a subject, and four `roles-to-permissions` rows that attach the Admin role to the order line reads, which leave the reviewed list. They were created through the API on a copy of the development database the snapshots come from and written by `npx nx run api:db:dump`; `migrate.sh seed` inserts them on existing deployments at the next start.
- READMEs of the subject model, the order model and the relation.

## Verification

- [x] `npx nx run-many --target=jest:test --projects=@sps/rbac,@sps/ecommerce,@sps/host`: `@sps/rbac` 87 suites / 404 tests, `@sps/ecommerce` 19 / 35, `@sps/host` 10 / 19; `npx nx run api:jest:test`: 2 / 4.
- [x] `npx nx run-many --target=eslint:lint --projects=@sps/rbac,@sps/ecommerce,@sps/host`: pass, no warnings.
- [x] `npx tsc --noEmit -p libs/modules/{rbac,ecommerce,host}/tsconfig.json`: no errors.
- [x] `node tools/agents/code-placement.mjs`: clean.
- [x] Mutation checks: the base versions of the cart sheet, the product cart, the update and delete actions, `cart-default`, the host widget, the quantity variant and the relation `form-field-default` and `amount` variants fail their new scenarios; removing `RequestSubjectIdOwner` fails the refusal scenarios; removing the constraint to the subject's orders fails the service scenarios; removing the four attachments or the new route's list entry fails the seed scenario with exactly those rows.
- [x] HTTP on port 4349 against a throwaway copy of the database. Before the seed change the new route answered 403 to an anonymous caller (no permission row). After it: an `init` subject adds two products (200) and reads their lines through the new route (200, with totals; a product with a price attribute without a currency answers an empty total list); a filter naming an order it does not own returns no lines; no token 400, another subject 401, an admin who is not the owner 401; `GET /api/ecommerce/orders-to-products`, `/count`, `/:id` and `/:id/total` answer 403 without a token and with that subject's token, 200 with an admin token; quantity change 200 (the line reads 3), line removal 200 (the line is gone), checkout with the dummy provider 200 (one invoice with a payment URL). The API was stopped before the provider's delayed paid webhook, so no order processing ran.
- [ ] Browser check of the cart sheet and the product cart as an anonymous visitor. Not run: the host needs a real install in the worktree.
- [ ] `npm run test:scenario:issue-152`. Not run: the local Redis rejects the configured password, as noted in #346.

## Notes

- The owner order routes, the per-order `quantity` and `total` routes and the order update, delete and checkout handlers are unchanged.
- The host variant `ecommerce/order/singlepage/default` still reads the relation. No dispatcher imports it, and it already depends on the order read by id that requires the Admin role since #346.
- The new route's guard answers 401 for another subject (the status of the shared `RequestSubjectIdOwner`), where the inline owner checks of the older order routes answer 403.

## Downstream migration

- **Seed.** Projects that merge the framework seed receive one permission file and four relation files. If a relation file's `permissionId` names no file in your permission snapshots, delete the five files, create the route's permission row and attach the Admin role to the four order line reads in your development database, then dump.
- **Cart variants.** Pass each order's lines to `cart-default` and `orders-to-products-quantity-default` as `ordersToProducts`, read through `ecommerce-module-order-list-orders-to-products-default` with an `orderId` filter, and pass the full line to the `orders-to-products` `form-field-default` and `amount` variants.
- **Browser reads.** Components that read `/api/ecommerce/orders-to-products` in a non-admin browser move to `GET /api/rbac/subjects/:id/ecommerce-module/orders/orders-to-products`.

_Verify:_ as an anonymous visitor add a product to the cart, open the cart sheet, change the quantity, remove a line and check out; `GET /api/ecommerce/orders-to-products` answers 403 without a token and 200 with an admin token; the rbac unit lane passes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
