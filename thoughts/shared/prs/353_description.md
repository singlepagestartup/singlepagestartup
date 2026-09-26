Closes #352.

## Summary

The four per-order subject routes, `GET …/orders/:orderId/quantity`, `GET …/orders/:orderId/total`, `PATCH …/orders/:orderId` and `DELETE …/orders/:orderId` under `/api/rbac/subjects/:id/ecommerce-module`, checked that the token belongs to the subject in the path but not that the order belongs to that subject. They now require a `subjects-to-ecommerce-module-orders` row linking `:id` to `:orderId`. The cart keeps working, because it only ever acts on the signed-in subject's own orders.

## Changes

- **Middleware.** `RequestSubjectOwnsEcommerceModuleOrder` in `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-owns-ecommerce-module-order/`, shaped like `RequestSubjectOwnsSocialModuleChat`: it takes the subject service, reads `subjectsToEcommerceModuleOrders` for the `:id`/`:orderId` pair with `limit: 1`, and refuses with 401 "Authorization error. Requested ecommerce-module order does not belong to subject" when there is no row, whatever credential the request carries. Exported beside its siblings.
- **Route table.** The four routes declare `RequestSubjectIdOwner` and then the new middleware, as the chat thread routes do. A request without a credential answers 400 and another subject's token 401 before the order link is read. The subject's own token and the operator secret reach the handler when the order belongs to the subject.
- **Handlers unchanged.** The four handlers keep their own token checks (#339 rewrites those lines). The per-order quantity and total handlers still require a request body and answer 400 to a GET, as on `main`.
- **Status changes.** Another subject's token on the owner's path now answers 401 instead of 403 on update and delete. A delete without a credential answers 400 instead of 401.
- **Specs.** A middleware spec covers a linked order, an order of another subject, an order without a link, and the operator secret with a linked and an unlinked order. A route-table spec, `controller/singlepage/index.order-ownership.spec.ts`, mounts the real subject routes with the handlers stubbed. It checks each of the four routes with an order of another subject, another subject's token, the subject's own token and the operator secret, and checks that the cart quantity, total and checkout routes never run the order link check.
- **Docs.** One bullet in the subject README's "Authorization Layering".

## Verification

- [x] `npx nx run @sps/rbac:jest:test`: 84 suites, 404 tests pass.
- [x] `npx nx run @sps/rbac:eslint:lint`: pass, no warnings.
- [x] `npx tsc --noEmit -p libs/modules/rbac/tsconfig.json`: no errors.
- [x] `node tools/agents/code-placement.mjs`: clean.
- [x] Mutation checks:
  - Without the refusal in the middleware, its three refusal scenarios fail.
  - Without the link check on the quantity, total or PATCH route, that route's foreign-order scenario fails; DELETE shares its path with PATCH, so removing it from both fails both.
  - Without `RequestSubjectIdOwner` on the four routes, the four "another subject's token" scenarios fail.
- [x] HTTP on port 4352 against a throwaway copy of the development database, before and after the change, with two anonymous `init` subjects: A with two cart orders, B with one.
  - B's token on B's own path naming A's order, on all four routes: after the change 401, and A's orders stay unchanged. Before, PATCH and DELETE answered 200.
  - B's token on A's path: 401, where PATCH and DELETE answered 403 before and the two reads 400.
  - No credential: 400.
  - The operator secret with A's own order passes both guards and gets the handlers' own answers, as before (PATCH 400 and DELETE 401 for the missing token, the reads 400 for the missing body). With B's order on A's path it answers 401.
  - Cart flow after the change: add (200, 200), change quantity (200; cart quantity 2 → 4, totals 2000 → 4000 RUB), remove (200; 1 order left, quantity 3, total 3000 RUB).
- [ ] Browser check of the cart sheet and the product cart. Not run: the host does not build on the worktree's symlinked `node_modules`. The HTTP run sends the same requests as the client SDK, with the subject's own token.

## Notes

- Route middlewares are registered per path, whatever the method, so the DELETE route also runs the pair declared on PATCH, which shares its path; the chat thread routes behave the same way.
- The route-table spec is a separate file so it merges cleanly beside the `controller/singlepage/index.spec.ts` that PRs #346 and #350 add. The four per-order routes sit in different hunks of the route table from #350's checkout change.

## Downstream migration

- **Overrides.** A startup override of the subject controller keeps `RequestSubjectIdOwner` and `RequestSubjectOwnsEcommerceModuleOrder` on the four per-order routes.
- **Callers.** A call to a per-order route names an order linked to the subject in the path through `subjects-to-ecommerce-module-orders`; for any other order, link it first or use the ecommerce order routes. Clients that branch on 403 for another subject's token, or on 401 for a delete without a credential, move to 401 and 400.

_Verify:_ the four routes answer 401 for an order of another subject and for another subject's token, and 400 without a credential; the cart still adds, changes the quantity of, removes and totals the subject's own orders.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
