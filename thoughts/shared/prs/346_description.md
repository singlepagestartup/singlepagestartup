Closes #303.

## Summary

A permission row with no role answers every caller. The framework seed left the order, invoice and payment reads, their relation reads, the subject-to-order relation and two operator-only writes (`send-all`, `create-from-url`) without a role, so any caller could list every order and invoice and write the subject-to-order relation. The rule that a role-less row is public stays. Those rows now carry the Admin role, the anonymous cart reads its orders only through the subject's own routes, and every remaining role-less seed row is a reviewed entry that the rbac unit lane checks. `openrouter/models` gets the owner middleware its sibling routes carry.

## Changes

- **Seed.** 29 `roles-to-permissions` rows attach the Admin role to: the order list, `[id]`, `[id]/receipt`, `[id]/checkout-attributes` and `count`; the invoice and payment-intent list, `[id]` and `count`; `payment-intents-to-invoices`, `payment-intents-to-currencies/count`, `orders-to-billing-module-payment-intents` and `subjects-to-billing-module-payment-intents/count`; `subjects-to-roles`; the `subjects-to-ecommerce-module-orders` reads, `POST` and `DELETE`; `POST /api/notification/topics/send-all`; `POST /api/file-storage/files/create-from-url`. The rows were created through the API on a copy of the development database the snapshots come from and written by `npx nx run api:db:dump`; a database seeded from the snapshots gets new ids and cannot produce them. `migrate.sh seed` inserts them on existing deployments at the next start.
- **Owner order route.** `GET /api/rbac/subjects/:id/ecommerce-module/orders` applies a caller's `filters.and` inside the subject's own orders; without filters it answers the active cart as before. The client action keys its query by params, as the factory list query does.
- **Cart.** The cart sheet (`ecommerce-module-order-list-checkout-default`) reads orders through the owner route, takes the subject from its token through `subject-default` and imports the inner update and delete components, as the product cart does. The subject read by id is closed to callers without a role, so on `main` the sheet waits on a refused request for customers. The product cart button drops its second, module-level order read. The order list widget (`subject-ecommerce-order`) reads the owner route with a type filter.
- **Order variants.** `cart-default` and `form-field-default` render the order they receive instead of reading it again by id, as `chat-sidebar-item` does; the fetching halves of `form-field-default` are removed, and neither variant accepts `apiProps`.
- **Reviewed list.** `libs/modules/rbac/models/permission/backend/repository/database/src/lib/roleless-permissions/` lists the 293 role-less seed rows as `METHOD path`, grouped by reason, with the `singlepage -> startup -> index` seam of `fields` and `constraints`. The is-authorized service's `findUnlistedRolelessPermissions()` returns the role-less rows missing from the list; the boot report logs only those, and the rbac unit lane runs it against the seed.
- **Route guard.** `RequestProfileSubjectIdOwner` on `GET /api/rbac/subjects/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/openrouter/models`.
- READMEs of the RBAC module and the permission model.

## Verification

- [x] `npx nx run-many --target=jest:test --projects=@sps/rbac,@sps/ecommerce,@sps/host,@sps/shared-frontend-api,@sps/shared-frontend-server-api,@sps/shared-frontend-client-api,@sps/shared-frontend-client-utils,@sps/shared-frontend-client-store,@sps/shared-frontend-components`: all pass (`@sps/rbac` 84 suites and 391 tests).
- [x] `npx nx run-many --target=eslint:lint --projects=@sps/rbac,@sps/ecommerce,@sps/host`: pass, no warnings.
- [x] `npx tsc --noEmit -p libs/modules/{rbac,ecommerce,host}/tsconfig.json`: no errors.
- [x] `node tools/agents/code-placement.mjs`: clean.
- [x] Mutation checks: the `main` versions of the cart sheet, the product cart, the order list widget and both order variants fail their new scenarios; removing a list entry, the list filter, the 29 attachments or the middleware fails the matching specs.
- [x] HTTP on port 4303 against a throwaway copy of the database: an `init` subject creates its cart order and lists it through the owner route (200, also with a type filter); `GET /api/ecommerce/orders` and `/orders/:id` answer 403 without a token and with that subject's token, 200 with an admin token; `POST /api/rbac/subjects-to-ecommerce-module-orders`, `send-all` and `create-from-url` answer 403 without a token; `openrouter/models` answers 400 without a token, 401 for another subject and 404 for a profile the subject does not own; product, order line and blog reads stay 200.
- [ ] Browser check of the cart sheet and the product cart as an anonymous visitor. Not run: the host needs a real install in the worktree.
- [ ] `npm run test:scenario:issue-152`. Not run: the local Redis rejects the configured password, and the scenario preflight needs the HTTP cache.

## Notes

- No GitHub workflow runs the unit lanes; `npm run test:unit:scoped` includes `@sps/rbac`, so the reviewed-list check runs wherever that lane runs.
- The rows kept without a role include `count` routes of models whose list route has no public row; the list groups them for a follow-up review.

## Downstream migration

- **Seed.** Projects that merge the framework seed receive 29 relation files. If a relation file's `permissionId` names no file in your permission snapshots, delete the 29 files, attach the Admin role to the same rows in your development database and dump.
- **Role-less rows.** `npx nx run @sps/rbac:jest:test` names every role-less seed row missing from the list. Attach a role through `roles-to-permissions`, or add the row as `METHOD path` to `roleless-permissions/startup.ts` when it is public on purpose.
- **Browser reads.** Components that read `/api/ecommerce/orders`, `/api/billing/**` or `subjects-to-ecommerce-module-orders` in a non-admin browser move to `GET /api/rbac/subjects/:id/ecommerce-module/orders` (with `filters.and` for statuses other than the active cart) and pass the full order to `cart-default` and `form-field-default`.

_Verify:_ as an anonymous visitor add a product to the cart, open the cart sheet and check out; `GET /api/ecommerce/orders` answers 403 without a token and 200 with an admin token; the rbac unit lane passes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
