Closes #303.

## Summary

A permission row with no role answers every caller. The framework seed left the order, invoice and payment reads, their relation reads, the subject-to-order relation and two operator-only writes (`send-all`, `create-from-url`) without a role, so any caller could list every order and invoice and write the subject-to-order relation. The rule that a role-less row is public stays. Those rows now carry the Admin role, the anonymous cart reads its orders only through the subject's own routes, and every remaining role-less seed row is a reviewed entry that the rbac unit lane checks. `openrouter/models` gets the owner middleware its sibling routes carry.

The raw Social chat collection and profile-to-file records also carried roleless grants in the newer seed. The updated branch protects those inventories while preserving the exact public demo chat, article credits, widget composition and public author projections.

## Changes

- **Seed.** 29 `roles-to-permissions` rows attach the Admin role to: the order list, `[id]`, `[id]/receipt`, `[id]/checkout-attributes` and `count`; the invoice and payment-intent list, `[id]` and `count`; `payment-intents-to-invoices`, `payment-intents-to-currencies/count`, `orders-to-billing-module-payment-intents` and `subjects-to-billing-module-payment-intents/count`; `subjects-to-roles`; the `subjects-to-ecommerce-module-orders` reads, `POST` and `DELETE`; `POST /api/notification/topics/send-all`; `POST /api/file-storage/files/create-from-url`. The rows were created through the API on a copy of the development database the snapshots come from and written by `npx nx run api:db:dump`; a database seeded from the snapshots gets new ids and cannot produce them. `migrate.sh seed` inserts them on existing deployments at the next start.
- **Owner order route.** The widget reads orders through the existing `GET /api/rbac/subjects/:id/ecommerce-module/orders` endpoint. It applies the requested filters within the subject’s orders and returns the active cart by default.
- **Cart.** The checkout sheet resolves the current subject through `subject-default`. The order list widget reads the Subject endpoint with a cart filter and passes each returned order to its renderer.
- **Order variants.** `cart-default` and `form-field-default` render the order they receive instead of reading it again by id, as `chat-sidebar-item` does; the fetching halves of `form-field-default` are removed, and neither variant accepts `apiProps`.
- **Reviewed list.** `libs/modules/rbac/models/permission/backend/repository/database/src/lib/roleless-permissions/` lists reviewed role-less seed routes as `METHOD path`, grouped by reason, with the `singlepage -> startup -> index` seam of `fields` and `constraints`. The is-authorized service's `findUnlistedRolelessPermissions()` returns the role-less rows missing from the list; the boot report logs only those, and the rbac unit lane runs it against the seed.
- **Route guard.** `RequestProfileSubjectIdOwner` on `GET /api/rbac/subjects/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/openrouter/models`.
- READMEs of the RBAC module and the permission model.

- **Social access.** Reading or counting all chats requires an assigned role. A roleless GET permission can publish one chat by its literal UUID. A template cannot publish another chat. Private conversations use the Subject route and its membership check. Raw profile media links require a role. Public bylines read the author avatar through the existing author SDK.
- **Cart integration.** The owner order list retains the cart aggregate, currency selection and consistency-aware query keys from `main`.

## Verification after merging main

- Started the Bun API against an isolated PostgreSQL database after applying the framework seed, with a separate Redis instance and HTTP caching enabled.
- Issued 158 HTTP requests including fixture setup. All 29 affected routes returned 403 to both a signed-out caller and a registered customer. The authorization endpoint granted an Admin JWT all 29 permissions. Admin collection and count requests and a read of an existing order returned 200.
- Two customers added the same product to separate carts. Each saw their own order. A request using the other customer's Subject URL returned 401. Filtering one's own list for the other customer's order returned an empty list.
- The public demo chat and author projections returned 200. A private chat returned 403 to visitors even after an administrator read it. Its member received 200 through the Subject route. A different subject using the member's URL received 401, and their own profile outside that chat received 403. The OpenRouter model route refused a missing token, a different subject and an unowned profile.
- Chromium opened the Pro product page in a fresh visitor session. Adding the product and opening the cart displayed the item, removal action and checkout button. The order requests returned 200 and the browser observed no 403 during the flow.
- All 1,443 RBAC, Social and Ecommerce unit tests and the four tests in the issue-152 cart scenario passed. TypeScript checks passed for API and Host. The module dependency checker reported zero violations.

## Notes

- No GitHub workflow runs the unit lanes; `npm run test:unit:scoped` includes `@sps/rbac`, so the reviewed-list check runs wherever that lane runs.
- The rows kept without a role include `count` routes of models whose list route has no public row; the list groups them for a follow-up review.

## Downstream migration

- **Social reads.** Replace anonymous raw chat lists with exact public grants and private Subject reads. Replace raw profile media queries with the scoped participant avatar or the public author projection. Verify the demo, a private chat, owner and stranger tokens, and an author with more than one attached file.

- **Seed.** Apply the 29 role bindings with the normal seed. Projects that own their snapshots should check the referenced permission and role records. If their snapshot IDs differ, attach Admin to the matching permissions in the project database and export those bindings with the standard dump.
- **Role-less rows.** `npx nx run @sps/rbac:jest:test` names every role-less seed row missing from the list. Attach a role through `roles-to-permissions`, or add the row as `METHOD path` to `roleless-permissions/startup.ts` when it is public on purpose.
- **Browser reads.** Components that read `/api/ecommerce/orders`, `/api/billing/**` or `subjects-to-ecommerce-module-orders` in a non-admin browser move to `GET /api/rbac/subjects/:id/ecommerce-module/orders` (with `filters.and` for statuses other than the active cart) and pass the full order to `cart-default` and `form-field-default`.

_Verify:_ as an anonymous visitor add a product to the cart, open the cart sheet and check out; `GET /api/ecommerce/orders` answers 403 without a token and 200 with an admin token; the rbac unit lane passes.
