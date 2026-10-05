---
date: 2026-09-26T01:40:00+0300
researcher: flakecode
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-303-roleless-permissions
repository: singlepagestartup
topic: "Review the permission default for routes without roles"
tags: [research, codebase, rbac, permission, roles-to-permissions, seed, ecommerce, cart, is-authorized]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Review the permission default for routes without roles

**Date**: 2026-09-26
**Researcher**: flakecode
**Git Commit**: 78d7d43125
**Branch**: claude/issue-303-roleless-permissions
**Repository**: singlepagestartup

## Research Question

The agreed scope keeps the rule "a permission row with no role is public" and
asks for four deliverables: move the anonymous cart onto the owner-checked
subject route, attach the Admin role to the order, invoice, payment, relation
and operator-only write rows in the seed, turn the boot-time role-less report
into a check that fails when a role-less row is not on an explicit list, and
put the owner middleware on `openrouter/models`. This document records how
each of those areas works today, every caller of the routes that change, and
how seed rows are produced.

## Summary

- The rule lives in `is-authorized.ts:235-245`: a matched permission with no
  role authorizes the caller unless `isSensitiveRoute` says otherwise. Only the
  root row `* *` carries the Admin role; the other 153 rows with a role belong
  to nine instance-specific knowledge-owner roles. 322 of 475 permission rows
  have no role.
- Three browser components read orders through the module-level routes: the
  cart sheet (`ecommerce-module-order-list-checkout-default`), the product cart
  button (`ecommerce-module-product-cart-default`, second read only), and the
  order list widget (`subject-ecommerce-order`, host external widget, not in
  the framework seed). The owner-checked route
  `GET /api/rbac/subjects/:id/ecommerce-module/orders` already exists, verifies
  the JWT subject, and answers the active cart only (type `cart`, status `new`).
- Moving the list read is not enough. The cart sheet renders each order through
  the order variants `cart-default` and `form-field-default`, and both refetch
  the order by id through `GET /api/ecommerce/orders/:id` in the browser. The
  cart sheet and its update and delete children also refetch the subject
  through `GET /api/rbac/subjects/:id`, which the sensitive list refuses to a
  non-admin today (403 measured on this branch for an `init` subject), so the
  cart sheet cannot render for a customer on `main`. The product cart button
  avoids that read through the `subject-default` parent and the inner
  `Component` files.
- Every server-side caller of the rows that move to Admin sends the operator
  secret, and every admin component sends the admin JWT, which the root row
  authorizes. `send-all` and `create-from-url` have no browser caller.
- Two rows named in the review are already closed: `POST /api/rbac/subjects/:id/check`
  has no permission row (the seed row is `GET .../check`, which has no route),
  so it falls to the root row; and `GET /api/ecommerce/orders/:id/receipt` has
  a row but no route.
- `GET /api/rbac/subjects-to-roles` is also admitted by the unauthenticated
  allow-list in `libs/middlewares/src/lib/is-authorized/routes/singlepage.ts:35-38`
  before the permission service runs. A role on its row takes effect only once
  #308 removes that allow rule.
- Seed rows change through the dump flow: the change is made through the API
  on a database that holds the snapshot ids, then `npx nx run api:db:dump`
  writes the files. Every historical change to `roles-to-permissions/.../data`
  is a "new dump" commit. A database seeded from the snapshots cannot serve,
  because the seeder gives every row a new id. `start.sh` runs
  `./migrate.sh seed &` on every API start, and the seeder inserts a relation
  row when no row matches `(roleId, permissionId)`, so new attachment files
  reach existing deployments on their next start.
- `reportRolelessPermissions` logs every role-less row once per process. No CI
  workflow in `.github/workflows` runs tests; the unit lanes
  (`npm run test:unit:scoped`, which includes `@sps/rbac`) are the only test
  gate.
- `openrouter/models` is the only route in its family without
  `RequestProfileSubjectIdOwner`; its handler checks nothing and calls
  OpenRouter with the server key. The single browser caller sends the same
  subject, profile and chat ids as `model-favorites`, which already carries the
  middleware.

## Detailed Findings

### The role-less rule and the boot report

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts:230-254`:
  resolves the permission; when it has no role (`permissionRoleIds.size === 0`)
  the request is authorized unless `permissionService.isSensitiveRoute(route, method)`
  returns true; otherwise the caller's roles must intersect the row's roles.
- `is-authorized.ts:256-268`: when still unauthorized, the roles of the root
  permission `* *` decide. The seed attaches the Admin role (`655565a6-...`,
  slug `admin`) to that row only, so an admin JWT reaches every route.
- `is-authorized.ts:94-121` (`reportRolelessPermissions`): reads all
  permissions and all roles-to-permissions rows, logs `METHOD path` for each
  row with no role. `is-authorized.ts:158-164` runs it once per process on the
  first `execute`.
- `libs/modules/rbac/models/permission/backend/app/api/src/lib/service/singlepage/sensitive-routes.ts:22-43`
  and `service/singlepage/index.ts:55-67`: the sensitive list (identities,
  subjects, subject identities, subjects-to-identities, roles; GET only) and
  its seam `isSensitiveRoute`, overridable in `service/startup/index.ts`.
- `permission/.../service/singlepage/index.ts:197-245` (`resolveByRoute`):
  exact `(method, path)` row, then a bracketed template row, then a `*` path
  row for the method, plus the root row. A request with no matching row is
  decided by the root row alone, so it is admin-only.
- The middleware allow-list (`libs/middlewares/src/lib/is-authorized/index.ts:72-74`
  with `routes/singlepage.ts:31-38,68-75`) passes `GET` reads of
  `roles-to-permissions`, `subjects-to-roles` and `permissions` before the
  permission service is asked. The operator secret passes at `index.ts:60-70`.

### Seed inventory

Computed from the JSON snapshots with a scratch script:

- Permission rows: 475 (`libs/modules/rbac/models/permission/backend/repository/database/src/lib/data/`).
- Roles-to-permissions rows: 155 (`libs/modules/rbac/relations/roles-to-permissions/backend/repository/database/src/lib/data/`),
  no orphan references. 1 row binds Admin to `* *`; 154 bind knowledge-owner
  roles of concrete profiles (N-09, closed as #321).
- Role-less rows: 322. All 29 rows the scope moves to Admin exist as role-less
  rows today. After the change 293 remain, 139 of them `count` routes.
- The `count` rows arrived in bulk in `fdaf9e7f74` ("Move audio transcription
  into RBAC message flow", 147 permission files).

The 29 rows for the Admin role:

| Family                        | Rows                                                                                                                                                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ecommerce orders              | `GET` list, `[id]`, `[id]/receipt`, `[id]/checkout-attributes`, `count`                                                                                                                                                         |
| Billing invoices              | `GET` list, `[id]`, `count`                                                                                                                                                                                                     |
| Billing payment intents       | `GET` list, `[id]`, `count`                                                                                                                                                                                                     |
| Invoice and payment relations | `payment-intents-to-invoices` list, `[id]`, `count`; `payment-intents-to-currencies/count`; `ecommerce/orders-to-billing-module-payment-intents` list, `[id]`, `count`; `rbac/subjects-to-billing-module-payment-intents/count` |
| Subject roles                 | `GET /api/rbac/subjects-to-roles` list, `[id]`, `count`                                                                                                                                                                         |
| Subject orders relation       | `GET` list, `[id]`, `count`; `POST`; `DELETE [id]`                                                                                                                                                                              |
| Operator-only writes          | `POST /api/notification/topics/send-all`, `POST /api/file-storage/files/create-from-url`                                                                                                                                        |

The 293 remaining role-less rows fall into these groups:

| Group (rows)                                          | Examples                                                                                                                                                                                             |
| ----------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Content the host renders for anonymous visitors (176) | blog, ecommerce catalog (products, categories, attributes, stores, widgets), crm forms, billing currencies, social profiles and widgets, rbac widgets, host, website-builder and file-storage counts |
| Order lines the cart reads by order id (4)            | `orders-to-products` list, `[id]`, `[id]/total`, `count`                                                                                                                                             |
| Anonymous writes (10)                                 | `POST /api/crm/forms/[id]/requests`, nine payment webhooks                                                                                                                                           |
| Routes below a subject (29)                           | `/api/rbac/subjects/[rbac.subjects.id]/...` cart, checkout, identities and chat routes the owner's browser calls                                                                                     |
| Closed by the sensitive-route list (12)               | identities, subjects, subjects-to-identities, roles reads                                                                                                                                            |
| No anonymous caller found in the framework (51)       | notification templates and the `count` rows of models whose list route has no public row, for example `social/messages/count`, `crm/requests/count`, `rbac/actions/count`                            |
| Rows that match no route (11)                         | `GET /api/rbac/subjects/[id]/check`, `POST /api/rbac/subjects/forgot-password`, the subject CRM form request rows without a form id, `/crm/steps` without `/api`                                     |

### Callers of the rows that move to Admin

Orders and the subject-to-order relation:

- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/list/checkout-default/ClientComponent.tsx:94-201`:
  browser, subject JWT. Reads `subjects-to-ecommerce-module-orders` filtered
  by `subjectId`, then `GET /api/ecommerce/orders` with `id inArray`, type
  `cart`, status `new`. Rendered by the host cart sheet
  (`libs/modules/host/relations/widgets-to-external-widgets/.../rbac/subject/singlepage/me/ecommerce-module/cart/default/ClientComponent.tsx:55-61`)
  for any subject that `authentication/me` returns, including an anonymous
  `init` subject.
- `.../singlepage/ecommerce-module/product/cart-default/ClientComponent.tsx:22-76`:
  browser. Reads the owner route through `ecommerce-module-order-list-default`,
  then re-reads `GET /api/ecommerce/orders` with the same ids and the same
  type and status. Rendered by the host product widgets
  (`.../ecommerce/product/singlepage/{default,overview-default,cart-default}/Component.tsx`,
  `.../ecommerce/widget/singlepage/category/overview-default/Component.tsx:158`).
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/widget/singlepage/subject/ecommerce/order/orders/Component.tsx:16-45`:
  browser. Reads the relation by `subjectId`, then per row
  `subjects-to-ecommerce-module-orders` `default`
  (`libs/modules/rbac/relations/subjects-to-ecommerce-module-orders/frontend/component/src/lib/singlepage/default/Component.tsx:18-52`),
  which reads `GET /api/ecommerce/orders` by id and type `cart`, any status.
  Registered as rbac widget variant `subject-ecommerce-order`
  (`.../rbac/widget/singlepage/variants.ts:10`); no rbac widget in the
  framework seed uses it.
- `libs/modules/host/relations/widgets-to-external-widgets/.../ecommerce/order/singlepage/default/Component.tsx`
  receives the order as a prop and is not referenced by any dispatcher.
- `libs/modules/ecommerce/models/order/frontend/component/src/lib/singlepage/cart-default/index.tsx:10-19`
  wraps the child in `@sps/shared-frontend-components/singlepage/default`,
  whose client half always calls `api.findById({ id: props.data.id })`
  (`libs/shared/frontend/components/src/lib/singlepage/default/client.tsx:23-26`),
  so each cart card requests `GET /api/ecommerce/orders/:id`. The child
  (`cart-default/Component.tsx`) uses only `props.data.id` and reads
  `orders-to-products` and products.
- `.../order/.../form-field-default/client.tsx:9-19` and `server.tsx:8-22`
  refetch the order by id before binding `data[entityFieldName]` into the form
  (`ClientAction.tsx:8-29`). The cart sheet is the only caller
  (`checkout-default/ClientComponent.tsx:168-175`); the checkout handler
  requires `ecommerceModule.orders[].id` in the body
  (`controller/singlepage/ecommerce-module/order/checkout.ts:54-69`).
- Order rows carry `status`, `type`, `receipt` and a free-text `comment`
  (`libs/modules/ecommerce/models/order/backend/repository/database/src/lib/fields/singlepage.ts`).
  `GET /api/ecommerce/orders-to-products` stays role-less and answers
  `orderId` for every order, so order ids are not secret.
- The cart sheet variant (`list/checkout-default/index.tsx`) and the order
  update, delete, create and checkout variants of the subject use the
  `singlepage/default` parent, which refetches the subject by id; the product
  cart and product checkout variants use `singlepage/subject-default`
  (`libs/shared/frontend/components/src/lib/singlepage/subject-default/client.tsx:25-72`),
  which takes the subject from the JWT, and the product cart imports the inner
  `order/{create,update,delete,checkout}-default/Component` files.
- A variant that renders the row it is handed, without a fetching parent, has
  precedent in `chat-sidebar-item` of `social/models/skill` and
  `knowledge/models/document` (`index.tsx` renders `ChildComponent`).
- Server side: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.ts:289-297`
  and `.../product/id/checkout.ts:160-167` create the relation with the
  operator secret; the subject service reads it through the injected service
  (`service/singlepage/ecommerce/order/{checkout,proceed}.ts`). Telegram reads
  orders and billing with the secret (`apps/telegram/src/lib/telegram-bot.ts:577-585`
  and following calls).
- Admin: `libs/modules/ecommerce/frontend/component/src/lib/admin*/**` and the
  relation `admin*` variants send the admin JWT.
- `GET /api/ecommerce/orders/:id/receipt` has no route in
  `libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/index.ts:25-96`.
  The order routes `:id/total`, `:id/quantity`, `:id/extended` and
  `:uuid/checkout-attributes/:billingModuleCurrencyId` have no permission row.
- `apps/api/specs/scenario/singlepagestartup/issue-152/test-utils/db.ts:3`
  uses the relation table directly, not HTTP.

Billing:

- Every browser component that reads invoices, payment intents or their
  relations sits under an `admin` or `admin-v2` folder. The `default` variants
  of payment-intent, `payment-intents-to-invoices`,
  `orders-to-billing-module-payment-intents` and
  `subjects-to-billing-module-payment-intents` are rendered only by those admin
  components or not at all.
- `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/provider-webhook/**`
  and the Telegram Stars flow read invoices with the secret.

Subject roles:

- `apps/host/src/components/admin/ClientComponent.tsx` and
  `apps/host/src/components/admin-v2/ClientComponent.tsx:17-57`: the admin
  gate reads `GET /api/rbac/roles` first. That route is sensitive and role-less,
  so a non-admin is refused there and never reaches the `subjects-to-roles`
  read.
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/button-default/Component.tsx:83-137`:
  the account menu lists the subject's own roles, then reads each role through
  `GET /api/rbac/roles`, which a non-admin cannot read today.
- Server callers pass the secret: `service/singlepage/ecommerce/order/proceed.ts:341-349,620-628`,
  `authentication/email-and-password.ts:131-139`,
  `authentication/ethereum-virtual-machine.ts:164-172`,
  `authentication/oauth/callback.ts:653-700`,
  `telegram/sync-membership.ts:51-57` (headers from `getSdkHeaders`).

`send-all` and `create-from-url`:

- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/notification-module/topics/send-all.ts:24-31`
  calls `send-all` with the secret; nothing else does.
- `libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/generate/index.ts:46-55`
  calls `create-from-url` with the secret. `apps/mcp/lib/content-management/file-storage.ts:199-212`
  calls it through the MCP fetch wrapper, which forwards the connector's
  subject JWT or the secret (`apps/mcp/lib/auth-context.ts:15-32`).

### The owner-checked order routes

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/list.ts:25-100`:
  requires a JWT whose subject id equals `:id`, reads the subject's relation
  rows through the injected service, and answers orders with `id inArray`,
  type `cart`, status `new`. The query string is ignored.
- `quantity.ts` and `total.ts` follow the same owner check; `cart-read.spec.ts`
  pins the type and status filters of all three.
- Baseline on this branch (API on port 4303, copy of the development
  database): an `init` subject gets 200 from its owner route and 403 from
  `GET /api/rbac/subjects/:id`; without a token the owner route answers 400;
  anonymous `GET /api/ecommerce/orders`, `/orders/count`,
  `subjects-to-ecommerce-module-orders`, `billing/invoices` and
  `subjects-to-roles` answer 200; anonymous `POST /api/rbac/subjects/:id/check`
  answers 403.
- Precedent for caller filters on an owner route:
  `.../controller/singlepage/identity/find.ts:51-65` spreads the caller's
  `filters.and` and appends the ownership constraint.
- SDK: `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/ecommerce-module/order/list.ts:23-56`
  always sends `cache: "no-store"` and `Cache-Control: no-store`, so the HTTP
  cache skips it (`libs/middlewares/src/lib/http-cache/index.ts:248-260`).
  The client action (`sdk/client/.../ecommerce-module/order/list.ts:23-77`)
  keys the query `[route/:id/ecommerce-module/orders]` without params and
  subscribes to the `ecommerce.orders` topic. The factory list key is
  `[route, stringified params]` (`libs/shared/frontend/client/api/src/lib/factory/index.ts:394-401`);
  topic invalidation matches the first key element and the route fallback
  invalidates by prefix (`factory/index.ts:165-188,268-279`).
- Variant `ecommerce-module-order-list-default`
  (`.../ecommerce-module/order/list/default/{index,client,server,interface}.tsx`)
  wraps the action; its `apiProps.params` is typed as the whole action props
  (`interface.ts:13-16`).
- The subject order create handler checks the owner (`create.ts:31-54`), so an
  `init` subject creates its cart with its own JWT.

### `openrouter/models`

- Route: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:527-532`,
  no middleware. Siblings `model-favorites` GET and PATCH (`:533-546`) carry
  `new RequestProfileSubjectIdOwner().init()`.
- Handler: `.../openrouter/models.ts:43-60` calls `OpenRouter.getModels()` and
  checks nothing. `models.spec.ts:189-219` pins that chat membership is not
  required.
- Middleware: `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-profile-subject-is-owner/index.ts:12-99`
  runs `RequestSubjectIdOwner` (JWT subject equals `:id`, or the operator
  secret) and then requires a `subjects-to-social-module-profiles` row for
  `(:id, :socialModuleProfileId)` and an existing profile. It does not check
  chat membership.
- Caller: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/hooks/use-openrouter-model-controls.ts:134-151`
  requests models and favorites with the same `subjectId`,
  `socialModuleProfileId` and `socialModuleChatId`.
- Route middlewares are mounted method-independently
  (`libs/shared/backend/api/src/lib/app/default/index.ts:71-79`); only `GET`
  exists on this path.
- The subject controller imports under jest in about seven seconds
  (probe run on this branch, then removed), so a route-level test can mount
  the real route table on Hono.

### Seed production and propagation

- Configurations: `libs/modules/rbac/models/permission/backend/app/api/src/lib/configuration.ts:19-45`
  (natural key `path` + `method`), `libs/modules/rbac/models/role/.../configuration.ts`
  (slug), `libs/modules/rbac/relations/roles-to-permissions/.../configuration.ts:24-104`
  (role and permission ids remapped from the seeded models).
- Seeder: `libs/shared/backend/api/src/lib/repository/database/index.ts:421-586`
  updates a matched row only when the snapshot is newer and inserts unmatched
  rows; it never deletes. `prepareWritableData` (`:355-384`) keeps snapshot
  ids and timestamps.
- Dumper: `index.ts:386-419` deletes every JSON file in a data directory and
  writes one file per database row. `apps/api/src/db/dump.ts` dumps every
  module; the target is `npx nx run api:db:dump` (`apps/api/project.json:134-145`).
- Deploy: `start.sh:12` runs `./migrate.sh seed &`, which runs
  `npx nx run api:db:seed` after the migrations (`migrate.sh:25-27`).
- Snapshot files have no trailing newline and are written by
  `JSON.stringify(entity, null, 2)`.
- `insert` deletes the snapshot id (`repository/database/index.ts:184-188`),
  so a database seeded from the snapshots gets new ids and its dump renames
  every file (measured: 1054 files deleted, 1053 added). The shared
  development database holds exactly the snapshot id sets for permissions
  (475), roles (14) and roles-to-permissions (155); a dump of a copy of it
  reproduces the three rbac data directories byte for byte, with one unrelated
  broadcast channel file as the only drift. Relation files must reference
  snapshot ids, so the change has to be made on a copy of that database.

### Test gates

- `.github/workflows/*.yml` only build images and call deployment hooks. No
  workflow runs jest or lint.
- `package.json` `test:unit:scoped` runs `jest:test` for `@sps/rbac`,
  `@sps/ecommerce`, `@sps/host` and the shared frontend packages.
- `libs/modules/rbac/jest.config.ts` ignores integration specs and two
  controller folders; the is-authorized service spec
  (`service/singlepage/is-authorized.spec.ts`) runs in the unit lane and
  already builds a real permission service around stubbed reads.
- `server-only` throws on import under jest; the precedent mock is
  `libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/server.spec.tsx:22`.

## Code References

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts:94-121` - boot report of role-less rows
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts:230-268` - role-less rule and root fallback
- `libs/modules/rbac/models/permission/backend/app/api/src/lib/service/singlepage/sensitive-routes.ts:22-43` - sensitive list
- `libs/modules/rbac/models/permission/backend/repository/database/src/lib/{fields,constraints}/` - `singlepage -> startup -> index` seams beside `data/`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/list/checkout-default/ClientComponent.tsx:94-201` - cart sheet data path
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/product/cart-default/ClientComponent.tsx:22-76` - product cart data path
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/widget/singlepage/subject/ecommerce/order/orders/Component.tsx:16-45` - order list widget
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/list.ts:25-100` - owner-checked order list
- `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/ecommerce-module/order/list.ts:23-77` - client action and query key
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:527-546` - `openrouter/models` and its siblings
- `libs/middlewares/src/lib/is-authorized/routes/singlepage.ts:31-38` - allow rules for `roles-to-permissions` and `subjects-to-roles` (owned by #308)
- `libs/shared/backend/api/src/lib/repository/database/index.ts:386-586` - dump and seed

## Architecture Documentation

- Access control for most routes is the permission seed plus the role-less
  default; controllers rarely declare middleware. Resource ownership lives in
  the module middleware package and in handlers.
- Framework data and project data share one mechanism: `singlepage` files
  hold framework declarations, `startup` files extend them, `index.ts`
  exports the startup result (`fields`, `constraints`, `routes`).
- Seed data is a dump of a development database; it is changed by changing
  the database and dumping, never by editing the JSON.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`:
  findings N-02, SEC-19 and SEC-33 (local, embargoed).
- Issue #270 introduced the sensitive-route subtraction and the boot report;
  its artifacts live on a local branch, not on `main`.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-233.md` - startup model: `start.sh` runs migrations and the seed beside the API.
- `thoughts/shared/research/singlepagestartup/ISSUE-216.md` - natural-key repair wiring in `migrate.sh`.

## Open Questions

None block the plan. Items for a decision outside this issue:

- The `count` rows of models whose list route is admin-only stay role-less in
  this change and are named as a group in the reviewed list.
- The Admin role on the `subjects-to-roles` rows takes effect once #308
  removes the middleware allow rule for that route.
