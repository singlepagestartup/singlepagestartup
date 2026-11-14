---
date: 2026-09-26T03:10:00+0300
researcher: flakecode
git_commit: 37c314a2bbf788e860eb77348e7072b749c64391
branch: claude/issue-349-cart-lines-owner-route
repository: singlepagestartup
topic: "Read cart lines through the subject owner route"
tags: [research, codebase, rbac, ecommerce, orders-to-products, cart, owner-route, seed]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Read cart lines through the subject owner route

**Date**: 2026-09-26
**Researcher**: flakecode
**Git Commit**: 37c314a2bb
**Branch**: claude/issue-349-cart-lines-owner-route (based on `claude/issue-303-roleless-permissions`, PR #346)
**Repository**: singlepagestartup

## Research Question

The agreed scope adds an owner-checked subject route for the lines of the
subject's own orders, points the cart components at it, attaches the Admin
role to the four module-level `orders-to-products` permission rows, moves them
out of the reviewed role-less list, and keeps the anonymous cart working end to
end. This document records how the cart reads its lines today, every caller of
the four module-level routes, the owner-route, SDK and variant patterns the new
route follows, and how the seed rows are produced.

## Summary

- The four rows are `GET /api/ecommerce/orders-to-products`, `.../[ecommerce.orders-to-products.id]`,
  `.../[ecommerce.orders-to-products.id]/total` and `.../count`. They carry no
  role and sit in their own group of the reviewed list
  (`roleless-permissions/singlepage.ts:194-198`). The relation has no permission
  row for writes, so its writes already fall to the root row.
- Browser components read the relation in six places: the order variant
  `cart-default` (`find` twice, `id-total-default` twice), the order variant
  `orders-to-products-quantity-default` (`find`, then the relation variant
  `amount`, which reads the line by id), the subject variants
  `ecommerce-module-order-update-default` (`find`, then the relation
  `form-field-default`, which reads the line by id) and
  `ecommerce-module-order-delete-default` (`find`), the product cart button
  `ecommerce-module-product-cart-default` (`find` twice), and the host variant
  `ecommerce/order/singlepage/default` (`find`), which no dispatcher imports.
  Admin components read the relation with the admin token.
- The cart card shows each line's totals per currency from
  `GET /api/ecommerce/orders-to-products/:id/total`; the relation service
  `getTotal` computes them, and the subject service already holds that service
  through Subject DI.
- The ecommerce module must not import the RBAC subject SDK
  (`README.md`, "Cross-Module Layering Boundary"), so the order variants cannot
  call a subject route themselves. #303 set the precedent: the order variants
  `cart-default` and `form-field-default` render the order they are handed, and
  the RBAC cart reads it through the owner route.
- The existing owner routes for orders (`orders`, `orders/quantity`,
  `orders/total`) check the JWT subject inside the handler. The subject README
  requires new subject routes to carry a permission row and
  `RequestSubjectIdOwner` as the first ownership guard; the social routes follow
  that rule.
- A request that matches no permission row is decided by the root row alone,
  so a new subject route needs its own role-less permission row to be reachable
  by an anonymous `init` subject, and that row belongs to the reviewed list.
- Seed rows are changed on a copy of the development database that holds the
  snapshot ids and written with `npx nx run api:db:dump` (#303 records). The
  development database lacks the 29 attachments #303 added, so a dump rewrites
  those files and every other data directory; only the new files are kept.

## Detailed Findings

### The four module-level rows and the reviewed list

- Permission snapshots (`libs/modules/rbac/models/permission/backend/repository/database/src/lib/data/`):
  `b986ef18-...json` (`GET /api/ecommerce/orders-to-products`),
  `dfdc1f84-...json` (`/[ecommerce.orders-to-products.id]`),
  `4704774e-...json` (`/[ecommerce.orders-to-products.id]/total`),
  `9f776c77-...json` (`/count`). No `roles-to-permissions` snapshot references
  them.
- `libs/modules/rbac/models/permission/backend/repository/database/src/lib/roleless-permissions/singlepage.ts:194-198`
  lists them under "Order lines and their totals, which the cart reads by order
  id". The group "Routes below a subject that the cart, identity settings and
  the chat call for the caller's own subject" is at `:212-243`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts:245-269`:
  a matched row with no role authorizes the caller unless the route is
  sensitive. `findUnlistedRolelessPermissions()` (`:99-117`) returns role-less
  rows missing from the list; `is-authorized.spec.ts:401-413` runs it over the
  seed in the rbac unit lane. A listed row that gained a role is not reported.
- Relation routes: `libs/modules/ecommerce/relations/orders-to-products/backend/app/api/src/lib/controller/singlepage/index.ts:18-54`
  (`GET /`, `GET /count`, `GET /:uuid`, `POST /`, `PATCH /:uuid`,
  `DELETE /:uuid`, `GET /:id/total`). Only the four `GET` rows exist in the seed.

### Browser callers of the relation reads

- `libs/modules/ecommerce/models/order/frontend/component/src/lib/singlepage/cart-default/Component.tsx:15-35`:
  `find` by `orderId`, one card per line; `:44-49` `id-total-default` per line
  for the `data-available` flag against `billingModuleCurrencyId`; `:75-91`
  `find` by `orderId` again inside the card; `:159-166` `id-total-default` per
  line for the displayed totals. Since #303 `index.tsx` renders the child
  directly and `interface.ts` omits `apiProps`.
- `.../order/frontend/component/src/lib/singlepage/orders-to-products/quantity/default/`:
  `index.tsx:10-19` uses the `singlepage/default` parent, which reads the order
  by id; `Component.tsx:14-51` reads `find` by `orderId` and renders the
  relation variant `amount` per line. No framework component renders this
  variant (`variants.ts:20` only).
- `libs/modules/ecommerce/relations/orders-to-products/frontend/component/src/lib/singlepage/amount/client.tsx:18-21`
  reads the line by id, then computes an amount from catalog reads (`:29-135`);
  `server.tsx:13-26` reads the line by id and answers a fixed `"10"`. The quantity
  variant is its only caller.
- `.../relations/orders-to-products/frontend/component/src/lib/singlepage/form-field-default/client.tsx:9-20`
  and `server.tsx:8-23` read the line by id before `ClientAction.tsx:8-31` binds
  the field. The subject update action is its only caller.
- `.../relations/orders-to-products/frontend/component/src/lib/singlepage/id/total-default/client.tsx:7-22`
  and `server.tsx:7-22` call `api.total`. The cart card is its only framework
  caller.
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/update-default/ClientComponent.tsx:49-92`:
  `find` by `orderId`, then two relation `form-field-default` fields per line
  (`id`, `quantity`); submit calls `ecommerceModuleOrderUpdate`.
- `.../ecommerce-module/order/delete-default/ClientComponent.tsx:37-71`: `find`
  by `orderId`, one Delete button per line; submit calls
  `ecommerceModuleOrderDelete`.
- `.../ecommerce-module/product/cart-default/ClientComponent.tsx:21-201`: after
  the owner order list, `find` by `productId` (`:42-63`) decides between create
  and the actions; per cart order, `find` by `orderId` and `productId`
  (`:106-133`) renders update, delete and checkout for each line.
- `.../ecommerce-module/order/list/checkout-default/ClientComponent.tsx:94-142`
  (the cart sheet): owner order list, then per order `cart-default` with the
  order form field and the update and delete actions as children.
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/widget/singlepage/subject/ecommerce/order/orders/Component.tsx:16-48`
  (widget variant `subject-ecommerce-order`): owner order list filtered by type
  `cart`, then `cart-default` per order.
- `.../host/.../default/ecommerce/order/singlepage/default/Component.tsx:7-86`
  reads `find` by `orderId` inside the order `default` variant; the host
  `ecommerce/Component.tsx` imports only `./widget`, and nothing imports the
  `ecommerce/order` dispatcher.
- Admin: `libs/modules/ecommerce/frontend/component/src/lib/admin*/**` and the
  relation `admin*` variants send the admin token.
- Server side: subject handlers and services read lines through the injected
  relation service (`create.ts:158`, `id/delete.ts:79`, `product/enforce.ts:186`,
  `service/singlepage/ecommerce/order/checkout.ts:111`,
  `telegram/checkout-free-subscription.ts:87`); writes go through the relation
  SDK with the operator secret. `apps/telegram`, `apps/mcp` and `tools/` do not
  read the relation. The host generator templates only import its model type.

### Lines, orders and totals

- Adding to the cart creates one order, the subject-to-order row and one line
  per call (`controller/singlepage/ecommerce-module/order/create.ts:276-312`).
- `libs/modules/ecommerce/relations/orders-to-products/backend/app/api/src/lib/service/singlepage/get-total/index.ts:46-184`:
  for one line, the price attribute key, the product's price attributes and
  their currencies; each currency is read over the API with the operator secret
  (`:164-171`). It throws when a price attribute, product or currency is
  missing. The order total service (`models/order/.../find-by-id/total.ts:72-84`),
  behind the owner route `orders/total`, calls it per line and throws the same
  way.
- Subject DI: `libs/modules/rbac/models/subject/backend/app/api/src/lib/di.ts:37-39`
  declares `IEcommerceOrdersToProductsService` with `getTotal`;
  `bootstrap.ts:344-353` binds the full relation service.

### The owner-checked order routes and the ownership guard

- Route table: `controller/singlepage/index.ts:286-315` declares
  `GET /:id/ecommerce-module/orders/quantity`, `/total`, `/orders`,
  `/orders/:orderId/quantity` and `/total` without middleware.
- `controller/singlepage/ecommerce-module/order/list.ts:25-41` verifies the JWT
  subject against `:id`; `:43-56` reads the subject's relation rows through the
  injected service; `:64-101` applies `id inArray` first and the caller's
  `filters.and` after it (#303). `quantity.ts` and `total.ts` repeat the check.
- `backend/app/middlewares/src/lib/request-subject-is-owner/index.ts:10-58`
  (`RequestSubjectIdOwner`): the operator secret passes; otherwise a JWT whose
  subject equals `:id` is required. No token answers 400
  ("Validation error. No JWT token provided"); another subject answers 401
  ("Authorization error. ..." matches the 401 patterns in
  `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts:5-22`).
  The inline handlers answer 403 for another subject because their message
  matches `/only order owner can update order/i` (`:24-33`).
- `libs/modules/rbac/models/subject/README.md:20-21`: concrete subject routes get
  a `rbac.permissions` row and route-level middleware; subject-owned routes
  keep `RequestSubjectIdOwner` or `RequestProfileSubjectIdOwner` first. 24 routes
  in the table use `RequestSubjectIdOwner` (for example `:383-400`).
- Route middlewares are mounted with `hono.use(route.path, ...)`, independent
  of the method (`libs/shared/backend/api/src/lib/app/default/index.ts:71-80`).
- Precedent for caller filters on an owner route: `list.ts:69-101` and
  `identity/find.ts:51-65`. The filter builder accepts only `and` with a fixed
  method list and identifier columns
  (`libs/shared/backend/api/src/lib/query-builder/filters.ts:24-104`), so caller
  filters can only narrow an `and` list.
- Service placement: `service/singlepage/ecommerce/order/` holds `checkout.ts`
  and `proceed.ts`, each a `Service` class with constructor props and
  `execute`, wrapped by a method on the main service
  (`service/singlepage/index.ts:381-388`).

### Permission resolution for a new route

- `libs/modules/rbac/models/permission/backend/app/api/src/lib/service/singlepage/index.ts:197-245`:
  exact row, then a bracketed template row, then a `*` path row for the
  method; the seed has only the root row `* *`, so a route with no row is
  admin-only.
- The GET templates below `.../ecommerce-module/` are `orders`,
  `orders/[ecommerce.orders.id]/quantity`, `.../total`, `orders/quantity` and
  `orders/total`; none matches a path with one segment after `orders` other
  than the static ones.

### SDK and variant patterns

- Client action `sdk/client/src/lib/singlepage/ecommerce-module/order/list.ts:23-87`:
  query key `[route/:id/ecommerce-module/orders, stringified params]`,
  `meta.topics: ["ecommerce.orders"]`, `staleTime: 0`, refetch on mount, focus
  and reconnect, subscription in `useEffect`.
- Server action `sdk/server/.../ecommerce-module/order/list.ts:23-56` forces
  `cache: "no-store"` and `Cache-Control: no-store`; `cache.spec.ts:37-66` pins
  that for list, quantity and total.
- Both SDK indexes register actions and their `IProps`/`IResult` entries
  (`sdk/server/src/lib/singlepage/index.ts:81-85,430,518,613`;
  `sdk/client/src/lib/singlepage/index.ts:99-103,397,474,558`); the `startup`
  layers re-export them.
- Variant `ecommerce-module-order-list-default`
  (`frontend/component/src/lib/singlepage/ecommerce-module/order/list/default/`):
  `index.tsx` picks the client or server half, `client.tsx` calls the SDK
  action and passes `data` to `children`, `interface.ts` types
  `apiProps.params` from the server SDK props. Registered in `variants.ts:39,94`
  and `interface.ts:38,83`.
- `sdk/model/src/lib/paths.yaml:941-958` documents `GET /rbac/subjects/{id}/ecommerce-module/orders`;
  `apps/openapi/openapi.yaml:187-198` references each subject path by `$ref`.

### Realtime topics

- `libs/shared/utils/src/lib/topics/index.ts:108-170`: a read of
  `/api/rbac/subjects/{id}/ecommerce-module/orders/orders-to-products` derives
  `ecommerce.orders-to-products`. Line writes arrive as loopback requests to
  `/api/ecommerce/orders-to-products` and
  `/api/ecommerce/orders/{id}/orders-to-products/{lineId}`, which broadcast
  `ecommerce.orders-to-products`; the subject order routes broadcast
  `ecommerce.orders`.

### Seed production

- #303 records (`thoughts/shared/research/singlepagestartup/ISSUE-303.md`,
  "Seed production and propagation"): the seeder drops snapshot ids on insert,
  so rows are created through the API on a `pg_dump` copy of the development
  database and written by `npx nx run api:db:dump`, which rewrites every data
  directory; `start.sh` runs the seed on every API start and inserts relation
  rows missing by `(roleId, permissionId)`.
- Roles snapshot: the Admin role is `655565a6-...` (slug `admin`).

### Tests

- Unit lanes: `@sps/rbac` 84 suites / 391 tests, `@sps/ecommerce` 16 / 31,
  `@sps/host` 10 / 19 on this base (run for this research).
- Specs that mock the relation component: the cart sheet, product cart,
  update and delete action specs in the subject frontend, the order
  `cart-default` spec and the host widget spec. The route-table spec
  `controller/singlepage/index.spec.ts` mounts the real routes on Hono.

## Code References

- `libs/modules/rbac/models/permission/backend/repository/database/src/lib/roleless-permissions/singlepage.ts:194-243` - reviewed list groups
- `libs/modules/ecommerce/models/order/frontend/component/src/lib/singlepage/cart-default/Component.tsx:15-212` - cart card reads
- `libs/modules/ecommerce/models/order/frontend/component/src/lib/singlepage/orders-to-products/quantity/default/Component.tsx:14-51` - quantity variant
- `libs/modules/ecommerce/relations/orders-to-products/frontend/component/src/lib/singlepage/{amount,form-field-default,id/total-default}/` - variants that read a line by id
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/{order/update-default,order/delete-default,product/cart-default,order/list/checkout-default}/ClientComponent.tsx` - subject cart components
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/widget/singlepage/subject/ecommerce/order/orders/Component.tsx:16-48` - order list widget
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/list.ts:25-111` - owner order list
- `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-is-owner/index.ts:10-58` - owner guard
- `libs/modules/ecommerce/relations/orders-to-products/backend/app/api/src/lib/service/singlepage/get-total/index.ts:46-184` - line totals
- `libs/modules/rbac/models/permission/backend/app/api/src/lib/service/singlepage/index.ts:197-245` - route resolution

## Architecture Documentation

- Subject routes are the owner-checked surface of other modules' data; new
  ones get a permission row plus `RequestSubjectIdOwner`, and handlers read
  through services injected by Subject DI.
- `ecommerce` variants take data from their caller when RBAC orchestrates the
  read (`rbac > ecommerce`); `find` reads stay for data the caller may read.
- Hand-written subject SDK reads carry params in the query key, declare
  `meta.topics`, and bypass the HTTP cache.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-303.md` and the #303 plan,
  progress and process files: the cart moved to the owner order route, the
  order variants render the order they are handed, the reviewed list and the
  seed procedure.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-303.md`

## Open Questions

None block the plan.

## Known Pitfalls (from implementation)

### The HTTP proof script sent malformed requests

- **Occurrences**: 2
- **Symptom**: add to cart answered 500 (`JSON Parse error`) and POST lines printed twice.
- **Root Cause**: inline JSON with commas inside `$( ... )` within a double-quoted `echo` was split into two calls.
- **Fix**: build request bodies with `printf` into variables and call curl outside `echo`; use `--form-string` for literal form values.
- **Reusable Pattern**: assign request bodies to variables before calling curl helpers in HTTP proofs.
