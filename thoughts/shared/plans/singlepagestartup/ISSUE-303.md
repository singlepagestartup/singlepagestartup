---
date: 2026-09-26T02:20:00+0300
issue_number: 303
repository: singlepagestartup
topic: "Review the permission default for routes without roles"
status: approved
---

# Review the permission default for routes without roles Implementation Plan

## Overview

Close the order, invoice, payment and relation reads and the two operator-only
writes that a role-less permission row leaves public, without closing the
anonymous cart, and make every future role-less seed row a reviewed decision.
The rule "a row with no role is public" stays.

## Current State Analysis

- `is-authorized.ts:235-245` authorizes a role-less row unless the route is
  sensitive; only `* *` carries the Admin role. 322 of 475 seed rows have no
  role; the boot report logs all of them once per process.
- The cart sheet reads the subject-to-order relation and `GET /api/ecommerce/orders`
  from the browser, then renders each order through `cart-default` and
  `form-field-default`, which refetch the order by id. The sheet and its
  update and delete children refetch the subject through a route the sensitive
  list closes, so the sheet already fails for customers on `main`.
- The product cart button re-reads `GET /api/ecommerce/orders` after the owner
  route. The order list widget `subject-ecommerce-order` reads the relation and
  the orders through the module-level routes.
- The owner route `GET /api/rbac/subjects/:id/ecommerce-module/orders` checks the
  JWT subject and answers the active cart; it ignores the query string.
- Seed rows are changed on a database that holds the snapshot ids and dumped
  with `npx nx run api:db:dump`; the shared development database is such a
  database (id sets verified).
- No GitHub workflow runs tests; the unit lanes are the gate.

## Desired End State

- An `init` subject with no account adds to its cart, sees the cart sheet, the
  product cart button and its order list, updates, deletes and checks out,
  with no request to a module-level order or relation route.
- `GET /api/ecommerce/orders` and the other 28 rows answer 403 without a token
  and with a non-admin token, and 200 with an admin token or the operator
  secret.
- `npm run test:unit:scoped` fails when a seed row carries no role and is
  missing from the reviewed list; the list is extended per project in its
  `startup` file; the boot report names only unlisted rows.
- `openrouter/models` refuses a caller that does not own the subject and the
  profile.

Verification: the unit lanes of `@sps/rbac`, `@sps/ecommerce`, `@sps/host` and
the shared frontend packages; lint and type checks of the changed projects; an
HTTP run on port 4303 against the throwaway database.

### Key Discoveries:

- The seeder drops snapshot ids on insert (`libs/shared/backend/api/src/lib/repository/database/index.ts:184-188`),
  so the change is made on a copy of the development database.
- `subject-default` (`libs/shared/frontend/components/src/lib/singlepage/subject-default/client.tsx`)
  takes the subject from the JWT; the product cart already uses it and the
  inner `Component` files of the order actions.
- `chat-sidebar-item` of social skill and knowledge document is the precedent
  for a variant that renders the row it is handed.
- The subject identity find handler (`controller/singlepage/identity/find.ts:51-65`)
  is the precedent for caller filters on an owner route.
- The factory list query key carries the stringified params
  (`libs/shared/frontend/client/api/src/lib/factory/index.ts:394-401`); topic
  invalidation reads only the first key element.

## What We're NOT Doing

- Not inverting the role-less default and not touching
  `libs/middlewares/src/lib/is-authorized/**`. The allow rule that admits
  `GET /api/rbac/subjects-to-roles` before the permission service belongs to
  #308; the Admin role on those rows takes effect when that rule goes.
- Not attaching roles to the `count` rows outside the listed families; they
  stay role-less and appear in the reviewed list under their own heading, and
  the lead decides on a follow-up.
- Not changing `orders-to-products` reads, the knowledge-owner rows (#321), the
  `dummy` webhook (#302) or the order variants the admin UI uses.
- Not adding a CI workflow; #320 owns the workflow files.

## Implementation Approach

Keep every change on an existing seam: owner routes and the `subject-default`
parent for the cart, a dump for the seed, a `singlepage -> startup -> index`
list beside the seed data for the review, the existing owner middleware for
the route.

## Phase 1: Cart reads through the owner route

### Overview

Every customer-facing cart component reads orders through the owner-checked
subject route and renders them without refetching by id.

### Changes Required:

#### 1. Owner route accepts filters

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/list.ts`
**Why**: the order list widget needs the subject's cart orders of every status; today the route answers only the active cart and ignores the query.
**Changes**: keep the ownership constraint (`id` in the subject's relation rows) and apply the caller's `filters.and` beside it; without filters keep type `cart`, status `new`. Extend `cart-read.spec.ts`.

#### 2. Client query key and variant props

**Files**: `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/ecommerce-module/order/list.ts`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/list/default/interface.ts`
**Why**: the cart sheet and the order list widget can share a page with different params.
**Changes**: add the stringified params as the second query key element, as the factory does; type `apiProps.params` as the action's `params`.

#### 3. Order variants render the order they are given

**Files**: `libs/modules/ecommerce/models/order/frontend/component/src/lib/singlepage/{cart-default,form-field-default}/**`
**Why**: module-level order reads become admin-only; the cart hands these variants orders it read through the owner route.
**Changes**: `index.tsx` renders the child directly, following `chat-sidebar-item`; drop the fetching client and server halves of `form-field-default`; narrow the props so `apiProps` is not accepted. BDD specs that the variants render the given order without an order request.

#### 4. Cart sheet

**Files**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/list/checkout-default/**`
**Why**: the sheet reads the relation and module-level orders and refetches the subject.
**Changes**: `subject-default` parent; orders from `ecommerce-module-order-list-default`; inner `Component` imports of the update and delete actions, as the product cart does. Update the spec: the sheet asks the owner route for the subject's cart and renders the relation and order `find` nowhere.

#### 5. Product cart button

**File**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/product/cart-default/ClientComponent.tsx`
**Why**: it re-reads `GET /api/ecommerce/orders` for ids the owner route already returned.
**Changes**: use the owner-route orders directly. New BDD spec.

#### 6. Order list widget

**File**: `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/widget/singlepage/subject/ecommerce/order/orders/Component.tsx`
**Why**: it reads the relation and orders through the module-level routes.
**Changes**: `ecommerce-module-order-list-default` with a type `cart` filter; each order through `cart-default`. New BDD spec.

### Success Criteria:

#### Automated Verification:

- [x] `npx nx run @sps/rbac:jest:test`, `@sps/ecommerce:jest:test`, `@sps/host:jest:test` pass
- [x] Reverting the cart sheet data path fails its new scenario
- [x] `tsc --noEmit` of the changed component and SDK packages passes

#### Manual Verification:

- [x] HTTP: an `init` subject creates a cart order and reads it through the owner route (200) with and without a type filter

---

## Phase 2: Admin role on the listed seed rows

### Overview

Attach the Admin role to the 29 rows through the API on a copy of the
development database and dump.

### Changes Required:

#### 1. Seed data

**Files**: 29 new files in `libs/modules/rbac/relations/roles-to-permissions/backend/repository/database/src/lib/data/`
**Why**: the order, invoice, payment, relation, `send-all` and `create-from-url` rows must require the Admin role.
**Changes**: on `sps-lite-issue-303` (a `pg_dump` copy of the development database) with the API on port 4303, create one `roles-to-permissions` row per permission through `POST /api/rbac/roles-to-permissions` with the operator secret; run `npx nx run api:db:dump`; keep only the new relation files and restore every other data file. Rows: the order list, `[id]`, `receipt`, `checkout-attributes`, `count`; invoice and payment-intent list, `[id]`, `count`; `payment-intents-to-invoices` list, `[id]`, `count`; `payment-intents-to-currencies/count`; `orders-to-billing-module-payment-intents` list, `[id]`, `count`; `subjects-to-billing-module-payment-intents/count`; `subjects-to-roles` list, `[id]`, `count`; `subjects-to-ecommerce-module-orders` list, `[id]`, `count`, `POST`, `DELETE [id]`; `POST send-all`; `POST create-from-url`.

### Success Criteria:

#### Automated Verification:

- [x] Every new file references the snapshot Admin role id and an existing permission snapshot id
- [x] `git status` shows only the 29 new files under the data directories

#### Manual Verification:

- [x] HTTP: the listed reads answer 403 without a token and with a non-admin token, 200 with the Admin role; the relation `POST` without a token answers 403

---

## Phase 3: Reviewed list of role-less permissions

### Overview

The boot report becomes a check over the seed and the live table against an
explicit list kept beside the seed.

### Changes Required:

#### 1. The list

**Files**: `libs/modules/rbac/models/permission/backend/repository/database/src/lib/roleless-permissions/{singlepage,startup,index}.ts`, export from the package `index.ts`
**Why**: the reviewed inventory of rows that carry no role, extendable by projects the way `fields` and `constraints` are.
**Changes**: `METHOD path` entries grouped by reason: anonymous content reads, the order lines the cart reads, anonymous writes, routes below a subject, rows the sensitive list closes, reads with no anonymous caller kept pending review, rows that match no route.

#### 2. The check

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts`
**Why**: the report and the check must share one computation.
**Changes**: a public `findUnlistedRolelessPermissions()` returning role-less rows missing from the list; `reportRolelessPermissions()` warns with those rows only.

#### 3. Specs and docs

**Files**: `is-authorized.spec.ts`, `libs/modules/rbac/README.md`, `libs/modules/rbac/models/permission/README.md`
**Changes**: scenarios: the framework seed has no unlisted role-less row; a role-less row missing from the list is reported; a seed without the Admin attachment of `GET /api/ecommerce/orders` is reported; the boot report names only unlisted rows. Document the list, the seam and the check.

### Success Criteria:

#### Automated Verification:

- [x] `npx nx run @sps/rbac:jest:test` passes; removing a list entry fails the seed scenario

---

## Phase 4: Owner middleware on `openrouter/models`

### Changes Required:

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts`
**Changes**: `new RequestProfileSubjectIdOwner().init()` on the route, as on `model-favorites`. New `controller/singlepage/index.spec.ts` mounts the real route table on Hono: no token and a foreign subject are refused before OpenRouter is called; the owner with an owned profile gets the catalog.

### Success Criteria:

#### Automated Verification:

- [x] The route spec passes; removing the middleware fails it

---

## Testing Strategy

### Unit Tests:

- Owner list: default filters, caller filters with the ownership constraint kept.
- Cart sheet, product cart button, order list widget: data comes from the owner route; no module-level order or relation read.
- Order `cart-default` and `form-field-default`: render the given order, no order request.
- Reviewed list: seed passes; unlisted row reported; missing Admin attachment reported.
- `openrouter/models` route: refusals and owner success.

### Integration Tests:

- HTTP on port 4303 against the throwaway database (Phase 2 and the end-to-end run below).

### Manual Testing Steps:

1. `init` subject creates a cart order through `POST /api/rbac/subjects/:id/ecommerce-module/orders` and lists it through the owner route.
2. `GET /api/ecommerce/orders` without a token (403), with the `init` token (403), with an admin token (200).
3. `POST /api/rbac/subjects-to-ecommerce-module-orders` without a token (403).
4. `openrouter/models` without a token (refused).
5. Delete fixtures and the throwaway database.

## Performance Considerations

The cart sheet drops one relation read and one order read per render and the
subject refetch; the boot report reads the same two tables it read before.

## Migration Notes

- Existing deployments receive the 29 attachments from `migrate.sh seed` on
  the next start; the permission caches expire within 30 seconds.
- A project whose permission snapshots carry other ids cannot take the new
  relation files as they are: it attaches the Admin role to the same rows in
  its own development database and dumps.
- A project that renders the order `cart-default` or `form-field-default`
  variants must pass the full order; a project with its own role-less rows
  lists them in `roleless-permissions/startup.ts`.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-303.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-303.md`
- Review (local): `thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`, N-02, SEC-19, SEC-33
