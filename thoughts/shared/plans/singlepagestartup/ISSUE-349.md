---
date: 2026-09-26T03:45:00+0300
issue_number: 349
repository: singlepagestartup
topic: "Read cart lines through the subject owner route"
status: approved
---

# Read cart lines through the subject owner route Implementation Plan

## Overview

Serve the cart's order lines from an owner-checked subject route, feed the
ecommerce cart variants the lines they are handed, and require the Admin role
on the four module-level `orders-to-products` reads, with the anonymous cart
working end to end.

## Current State Analysis

- `GET /api/ecommerce/orders-to-products`, `/[id]`, `/[id]/total` and `/count`
  carry no role and are listed as reviewed role-less rows
  (`roleless-permissions/singlepage.ts:194-198`).
- The cart reads lines through the relation in the order variants
  `cart-default` and `orders-to-products-quantity-default`, the subject update
  and delete actions, the product cart button and, through `cart-default`, the
  cart sheet and the host order list widget. Three relation variants read a
  line by id: `form-field-default` (update action), `amount` (quantity
  variant) and `id-total-default` (line totals in the cart card).
- The ecommerce module cannot call subject routes (`rbac > ecommerce`); since
  #303 the order variants render the order they are handed.
- New subject routes need a permission row and `RequestSubjectIdOwner`
  (`libs/modules/rbac/models/subject/README.md:20-21`); a route without a row is
  admin-only.
- Seed rows are created through the API on a copy of the development database
  and written by `npx nx run api:db:dump`.

## Desired End State

- `GET /api/rbac/subjects/:id/ecommerce-module/orders/orders-to-products`
  answers the lines of the orders linked to `:id`, each with its totals per
  currency, for the owner (or the operator secret); a caller's `filters.and`
  narrows the lines and cannot widen them.
- No customer-facing component reads a module-level `orders-to-products`
  route: the cart sheet, the host order list widget and the product cart read
  lines through the owner route, and the ecommerce variants render the lines
  they are handed.
- The four relation reads answer 403 without a token and with a customer token,
  and 200 with an admin token; they are no longer on the reviewed list, and the
  new route's row is.
- Verified by the rbac, ecommerce and host unit lanes, lint, type checks, and
  an HTTP run against a throwaway copy of the development database.

### Key Discoveries:

- `list.ts:64-101` (#303) applies the ownership constraint and appends caller
  filters; the filter builder only compiles `and` lists
  (`libs/shared/backend/api/src/lib/query-builder/filters.ts:24-104`).
- `RequestSubjectIdOwner` answers 400 without a token and 401 for another
  subject (`request-subject-is-owner/index.ts:31-44`); the inline handlers
  answer 403. The new route uses the middleware, as the README requires.
- The relation service `getTotal` computes one line's totals and is already
  available through Subject DI (`di.ts:37-39`, `bootstrap.ts:344-353`); the
  owner route `orders/total` embeds per-order totals the same way.
- Adding to the cart creates one order with one line
  (`create.ts:276-312`).
- Line writes broadcast `ecommerce.orders-to-products` and the subject order
  routes broadcast `ecommerce.orders`.

## What We're NOT Doing

- Not changing the rule that a role-less row is public, the admin
  components, or the relation `id-total-default` and `default` variants, which
  keep serving the admin token.
- Not changing the host variant `ecommerce/order/singlepage/default`: no
  dispatcher imports it, and it already depends on the order read by id that
  requires the Admin role since #303.
- Not changing the owner routes `orders`, `orders/quantity`, `orders/total`,
  the order update, delete and checkout handlers, or the per-order
  `quantity`/`total` handlers; observations about them go to the lead's report.
- Not touching the `count` rows of #348 or regenerating the Studio inventory;
  the rendered cart does not change, so no Studio block changes either.

## Implementation Approach

Follow the owner-route shape that exists for orders: a subject route guarded by
`RequestSubjectIdOwner`, a service beside `checkout.ts`, SDK actions and a list
variant beside `quantity`/`total`, and ecommerce variants that render what the
RBAC caller hands them. Seed rows come from a dump of a database copy.

## Phase 1: Owner route for the subject's order lines

### Overview

The route, its service and its SDK actions.

### Changes Required:

#### 1. Service

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/orders-to-products.ts` (new) and `service/singlepage/index.ts`
**Why**: the lines of a subject's orders with their totals; the handler stays a thin adapter.
**Changes**: `Service` with constructor props `ecommerceModule` and `subjectsToEcommerceModuleOrders`; `execute({ id, filters })` reads the subject's order links, returns `[]` when there are none, reads lines with `orderId inArray` plus the caller's filters, and adds `total` from `ordersToProducts.getTotal` to each line; a line whose total cannot be computed keeps its place with an empty list and the failure is logged (added during the HTTP run, see the process log). Main service method `ecommerceOrderOrdersToProducts`. BDD spec beside it.

#### 2. Handler and route

**Files**: `controller/singlepage/ecommerce-module/order/orders-to-products.ts` (new), `controller/singlepage/index.ts`
**Why**: serve the lines to their owner only.
**Changes**: handler reads `:id` and `parsedQuery.filters.and` and answers the service result; route `GET /:id/ecommerce-module/orders/orders-to-products` with `new RequestSubjectIdOwner().init()`. Extend `controller/singlepage/index.spec.ts`: no token refused (400), another subject refused (401), owner answered (200) with the service called for `:id`.

#### 3. SDK actions and API description

**Files**: `sdk/server/src/lib/singlepage/ecommerce-module/order/orders-to-products.ts`, `sdk/client/src/lib/singlepage/ecommerce-module/order/orders-to-products.ts` (new), both `index.ts`, `sdk/model/src/lib/paths.yaml`, `apps/openapi/openapi.yaml`
**Why**: the frontend reads the route through the SDK.
**Changes**: server action mirrors `list.ts` (query string, forced `no-store`), result `(orders-to-products model & { total })[]`; client action mirrors the client `list.ts` with params in the query key and `meta.topics` `ecommerce.orders` and `ecommerce.orders-to-products`; register `ecommerceModuleOrderOrdersToProducts` and its `IProps`/`IResult` entries. Document the path and reference it from the OpenAPI index. Specs: add the action to `cache.spec.ts`; a server action spec for the URL and filters.

### Success Criteria:

#### Automated Verification:

- [x] `npx nx run @sps/rbac:jest:test` passes with the new service, route and SDK specs
- [x] Removing the middleware from the route fails the refusal scenarios

#### Manual Verification:

- [x] HTTP (Phase 4)

---

## Phase 2: Cart components read lines through the owner route

### Overview

Every customer-facing cart component reads lines through the owner route; the
ecommerce variants render lines they are handed.

### Changes Required:

#### 1. Subject list variant

**Files**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/list/orders-to-products-default/` (new, same files as `list/default`), `singlepage/variants.ts`, `singlepage/interface.ts`
**Changes**: variant `ecommerce-module-order-list-orders-to-products-default` wrapping the SDK action and passing `data` to `children`. BDD spec.

#### 2. Ecommerce order variants

**Files**: `libs/modules/ecommerce/models/order/frontend/component/src/lib/singlepage/cart-default/{Component,interface}.tsx`, `.../orders-to-products/quantity/default/{index,Component,interface}.tsx`
**Why**: they read the relation, which becomes admin-only.
**Changes**: `cart-default` takes `ordersToProducts` (lines with totals) and renders the same card from them, with id keys; the quantity variant renders the order it is handed (as `cart-default` since #303) and maps the `ordersToProducts` it is handed to `amount`. Specs: no relation read, card and totals from the handed lines.

#### 3. Relation variants that read a line by id

**Files**: `libs/modules/ecommerce/relations/orders-to-products/frontend/component/src/lib/singlepage/form-field-default/**`, `.../amount/{client,server,interface}.tsx`
**Changes**: `form-field-default` binds the line it is handed (fetching halves removed, `apiProps` omitted, as #303 did for the order variant); `amount` computes from the line it is handed. Specs.

#### 4. Subject cart components and host widget

**Files**: `.../ecommerce-module/order/{update-default,delete-default,list/checkout-default}/ClientComponent.tsx`, `.../ecommerce-module/product/cart-default/ClientComponent.tsx`, `libs/modules/host/.../rbac/widget/singlepage/subject/ecommerce/order/orders/Component.tsx`
**Changes**: update and delete read the order's lines through the list variant (same params as the cart sheet, so the query is shared); the cart sheet and the widget read each order's lines and pass them to `cart-default`; the product cart reads the subject's lines of the product once and renders the actions for the lines in its cart orders. Update the five specs: lines come from the owner route, the relation `find` is never rendered.

#### 5. Docs

**Files**: `libs/modules/rbac/models/subject/README.md`, `libs/modules/ecommerce/models/order/README.md`, `libs/modules/ecommerce/relations/orders-to-products/README.md`
**Changes**: the route and variant; the variants that take handed data.

### Success Criteria:

#### Automated Verification:

- [x] `npx nx run @sps/rbac:jest:test`, `@sps/ecommerce:jest:test`, `@sps/host:jest:test` pass
- [x] Restoring the relation `find` in the cart sheet, product cart and `cart-default` fails their new scenarios
- [x] `tsc --noEmit` of the three modules and lint pass

---

## Phase 3: Seed rows and reviewed list

### Overview

Attach the Admin role to the four relation rows and add the new route's row.

### Changes Required:

#### 1. Seed data

**Files**: one new file in `libs/modules/rbac/models/permission/backend/repository/database/src/lib/data/`, four new files in `libs/modules/rbac/relations/roles-to-permissions/backend/repository/database/src/lib/data/`
**Changes**: on `sps-lite-issue-349` (a `pg_dump` copy of the development database) with the API from this worktree on port 4349: `POST /api/rbac/permissions` for `GET /api/rbac/subjects/[rbac.subjects.id]/ecommerce-module/orders/orders-to-products`, and `POST /api/rbac/roles-to-permissions` binding the Admin role to the four relation rows, both with the operator secret; `npx nx run api:db:dump`; keep the five new files and restore every other data file.

#### 2. Reviewed list

**File**: `libs/modules/rbac/models/permission/backend/repository/database/src/lib/roleless-permissions/singlepage.ts`
**Changes**: remove the "Order lines" group; add the new row to "Routes below a subject". No other group changes (#348 edits the counts group).

### Success Criteria:

#### Automated Verification:

- [x] The seed scenario of `is-authorized.spec.ts` passes; every new relation file references the Admin role and an existing permission snapshot
- [x] `git status` shows only the five new data files under the data directories

---

## Phase 4: End-to-end verification over HTTP

### Changes Required:

None; evidence only, on the throwaway database with this branch's API.

### Success Criteria:

#### Manual Verification:

- [x] An `init` subject adds a product (`POST .../ecommerce-module/orders`) and reads its line through the new route (200, with totals)
- [x] The same subject: `GET /api/ecommerce/orders-to-products` 403 (also without a token); admin 200
- [x] Another subject on the owner's line route is refused; no token is refused
- [x] Quantity change (`PATCH .../orders/:orderId`) shows in the line; checkout (`POST .../orders/checkout`) and removal (`DELETE .../orders/:orderId`) succeed
- [x] Fixtures and the throwaway database removed, env copy restored

---

## Testing Strategy

### Unit Tests:

- Service: ownership constraint first, caller filters appended, totals per line, a line without computable totals, empty subject.
- Route: 400 without token, 401 for another subject, 200 for the owner through the real route table.
- SDK: URL, filters, no-store.
- Components: data from the owner route, relation `find` never rendered, relation variants use the handed line.

### Integration Tests:

- HTTP run in Phase 4 (the issue-152 scenario lane needs Redis, see the #303 incident).

### Manual Testing Steps:

1. Phase 3 and Phase 4 commands against `sps-lite-issue-349` on port 4349.
2. Drop the database, restore `apps/api/.env`.

## Performance Considerations

The cart card no longer reads lines twice and totals twice per line; the owner
route computes each line's totals once per order query, and the update and
delete actions share that query. The product cart makes one line read instead
of one per cart order.

## Migration Notes

- Existing deployments receive the five rows from `migrate.sh seed` on the next
  start; permission caches expire within 30 seconds.
- A project whose permission snapshots carry other ids creates the rows in its
  own development database and dumps.
- A project that renders `cart-default` or the quantity variant passes the
  lines; one that renders the relation `form-field-default` or `amount` passes
  the full line.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-349.md` (local)
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-349.md`, `ISSUE-303.md`
