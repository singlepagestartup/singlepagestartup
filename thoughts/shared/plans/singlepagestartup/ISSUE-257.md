---
date: 2026-09-19T16:35:00Z
issue_number: 257
repository: singlepagestartup
topic: "Make the per-order cart total and quantity routes compute"
status: in_review
---

# Per-order cart total and quantity Implementation Plan

## Overview

Replace the two copy-pasted deanonymize bodies under the RBAC subject `singlepage` controller with handlers that compute the total and the quantity of one order, and put the "subject owns this order" check they share into the subject `singlepage` service.

## Current State Analysis

`.../controller/singlepage/ecommerce-module/order/id/total.ts` and `.../order/id/quantity.ts` are byte-identical copies of the checkout handler apart from three error strings. Both are registered as `GET` (controller index lines 306-313) yet call `c.req.parseBody()` and require a `data` form field, so every request fails at `Validation error. Invalid body` and neither route has ever computed anything.

Nothing calls them: no SDK action, no OpenAPI path, no frontend component, no test, no RBAC permission row. The deanonymize behaviour in their bodies stays reachable through `POST /:id/ecommerce-module/orders/checkout` and `POST /:id/ecommerce-module/products/:productId/checkout`, both spec-covered, plus a direct service spec. Full evidence in `thoughts/shared/research/singlepagestartup/ISSUE-257.md`.

The branch builds on the #255 branch (`claude/issue-cart-unpriced-product`, commit `ecbf25fad1`), because the per-order total depends on the `{ totals, unpriced }` shape `findByIdTotal` gained there.

## Desired End State

- `GET /:id/ecommerce-module/orders/:orderId/total` answers `{ data: [{ billingModuleCurrency, total, orders }], unpriced: [...] }` for the one order, the same entry shape the aggregate route returns.
- `GET /:id/ecommerce-module/orders/:orderId/quantity` answers `{ data: <number> }` for the one order.
- Both routes carry `RequestSubjectIdOwner`, so the caller must be the subject named in the path or hold the RBAC secret key.
- Both handlers refuse an order the subject does not own with a permission error, before computing anything.
- An order id that does not exist is a not-found error.

Verified by the new specs and by the manual recipe below.

### Key Discoveries

- Aggregate shape to mirror: `.../ecommerce-module/order/total.ts:103-155` groups `totals` by currency id into `{ billingModuleCurrency, total, orders }`; `.../order/quantity.ts:98-108` sums `findByIdQuantity`.
- `findByIdTotal` returns `{ totals, unpriced }` (`ecommerce/models/order/.../find-by-id/total.ts:13-20`); `findByIdQuantity` returns a number (`.../find-by-id/quantity.ts:43-47`). Both throw `Not Found error. Order does not have any products` for an empty order.
- `RequestSubjectIdOwner` already exists at `rbac/models/subject/backend/app/middlewares/src/lib/request-subject-is-owner/index.ts` and is used by sibling routes in the same controller (lines 384, 390, 397).
- `service.subjectsToEcommerceModuleOrders` is already injected (`service/singlepage/index.ts:151`, `:182-183`, `:204`); no ownership helper exists, every caller inlines the `find`.
- The service decomposition pattern is a class per file under `service/singlepage/ecommerce/order/` with `IExecuteProps`, `IConstructorProps` and `execute`, wired as a method on `Service` (see `resolve-currency.ts` and its wiring at `service/singlepage/index.ts:331-338`).
- No RBAC permission row exists for either per-order path, and the resolver is default-deny (`service/singlepage/is-authorized.ts:105-210`). A corrected handler is still answered with a permission error for an ordinary subject until the routes are granted.

## What We're NOT Doing

- Not adding SDK actions, OpenAPI entries, or frontend components for these routes. Nothing consumes them today; adding a wire contract is a separate decision.
- Not adding or editing RBAC permission snapshots under `.../permission/backend/repository/database/src/lib/data/`. Repository rules forbid editing those snapshots to implement behaviour, and they are bulk-exported. The gap is recorded instead, with a runtime recipe for verification.
- Not tightening `order/id/update.ts` and `order/id/delete.ts`, which check the JWT subject but not the order relation. The new shared check makes that a small follow-up.
- Not touching the aggregate routes, the `startup` variants, the schema, or dependencies.
- Not declaring `unpriced` in the SDK result type of the aggregate route (pre-existing gap noted in the research).

## Implementation Approach

Ownership is the only logic the two handlers share, so it moves into the service as one small class. Each handler then reads as four steps: load the order, assert ownership, compute, answer. The JWT check moves out of the handlers and onto the routes as the existing middleware, which is what the rest of the controller does.

---

## Phase 1: A shared "subject owns this order" service

### Overview

Give the subject `singlepage` service one method that answers whether a subject owns an ecommerce order, and throws a permission error when it does not.

### Changes Required

#### 1. New service

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/assert-subject-owns.ts`
**Why**: Both handlers need the same relation check, and the repository keeps this kind of logic in the service, not the controller. It sits next to the other ecommerce order services.
**Changes**: A `Service` class taking the `subjectsToEcommerceModuleOrders` relation service, with `IExecuteProps` of `{ subjectId, ecommerceModuleOrderId }`. `execute` queries the relation filtered by both columns and throws a permission error when no row comes back. Export the error message as a constant so the specs assert on the same string, matching `resolve-currency.ts`.

#### 2. Service wiring

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts`
**Why**: Handlers reach logic through a method on `Service`.
**Changes**: Import the new service next to the other `./ecommerce/order/*` imports and add one method that constructs it with `this.subjectsToEcommerceModuleOrders`, following the shape of `ecommerceModuleResolveOrderCurrency`. Keep the existing import and member order.

### Success Criteria

#### Automated Verification

- [ ] Type checking passes: `npx tsc --noEmit -p libs/modules/rbac/tsconfig.json`
- [ ] Linting passes: `npx nx run @sps/rbac:eslint:lint`
- [ ] Tests pass: `npx nx run @sps/rbac:jest:test`

---

## Phase 2: Real handlers for the two routes

### Overview

Replace both bodies with the per-order equivalent of the aggregate handlers, and move the caller identity check onto the routes.

### Changes Required

#### 1. Per-order total handler

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/total.ts`
**Why**: It must return a total instead of parsing a body it can never receive.
**Changes**: Read `id` and `orderId`. Load the order through `service.ecommerceModule.order.findById` and answer not-found when it is missing. Assert ownership through the Phase 1 method. Call `findByIdTotal` for the single order, group its `totals` by currency id into the same `{ billingModuleCurrency, total, orders }` entry the aggregate produces, with the one order carrying its `total`, and answer `{ data: <entries>, unpriced }`. Reuse the aggregate's imported types so both routes describe one shape. Drop the JWT and secret-key handling from the handler.

#### 2. Per-order quantity handler

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/quantity.ts`
**Why**: Same defect, same fix.
**Changes**: The same first three steps, then `findByIdQuantity` for the single order and `{ data: <number> }`.

#### 3. Route registration

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts`
**Why**: The handlers no longer verify the caller themselves, and the rest of the controller expresses that as route middleware.
**Changes**: Add `new RequestSubjectIdOwner().init()` to the two per-order route definitions. Nothing else changes; the literal `/total` and `/quantity` routes stay registered before the `:orderId` ones.

### Success Criteria

#### Automated Verification

- [ ] Type checking passes: `npx tsc --noEmit -p libs/modules/rbac/tsconfig.json`
- [ ] Linting passes: `npx nx run @sps/rbac:eslint:lint`
- [ ] Tests pass: `npx nx run @sps/rbac:jest:test`

#### Manual Verification

- [ ] The total route answers a grouped total with `unpriced` for the owner's cart order
- [ ] The quantity route answers the order's quantity
- [ ] A second subject's JWT is refused on both routes
- [ ] An unknown order id is a not-found error

---

## Phase 3: Specs

### Overview

Cover both handlers in the repository BDD format, following the mocking style of the sibling controller specs.

### Changes Required

#### 1. Total handler spec

**File**: `.../controller/singlepage/ecommerce-module/order/id/total.spec.ts`
**Why**: The behaviour has never been tested, and the regression it replaces was invisible for over a year.
**Changes**: Mock `@sps/shared-utils` and `@sps/backend-utils` the way `delete.spec.ts` and `cart-read.spec.ts` do, and hand the handler a service double. Scenarios: the owner's order answers grouped totals and forwards `unpriced`; another subject's order raises a permission error and never calls `findByIdTotal`; an unknown order id raises a not-found error and never calls `findByIdTotal`.

#### 2. Quantity handler spec

**File**: `.../controller/singlepage/ecommerce-module/order/id/quantity.spec.ts`
**Why**: Same.
**Changes**: The same three scenarios against `findByIdQuantity` and a numeric `data`.

#### 3. Ownership service spec

**File**: `.../service/singlepage/ecommerce/order/assert-subject-owns.spec.ts`
**Why**: The shared check is where the permission decision lives, so it is tested where it lives, as `resolve-currency.spec.ts` does.
**Changes**: Scenarios for a relation that exists (resolves, queries both columns) and one that does not (throws the exported message).

### Success Criteria

#### Automated Verification

- [ ] Tests pass: `npx nx run @sps/rbac:jest:test`
- [ ] Linting passes: `npx nx run @sps/rbac:eslint:lint`
- [ ] Type checking passes: `npx tsc --noEmit -p libs/modules/rbac/tsconfig.json`

---

## Testing Strategy

### Unit Tests

- Owner reads the total of an order that holds priced and unpriced lines: grouped entry per currency, `unpriced` forwarded untouched.
- Owner reads the quantity: the number `findByIdQuantity` returned.
- A subject with no relation row to the order: permission error, and no total or quantity computed.
- An order id that resolves to nothing: not-found error, and no total or quantity computed.
- The ownership service queries by both `subjectId` and `ecommerceModuleOrderId`.

### Manual Testing Steps

Against a local API of this worktree on `http://localhost:4017`, started with `API_SERVICE_PORT=4017 API_SERVICE_URL=http://localhost:4017`.

Because no RBAC permission row grants these two paths, the middleware refuses them before the handler runs. Either register the two permissions once through the admin API with `X-RBAC-SECRET-KEY` (`POST /api/rbac/permissions` with `type: "HTTP"`, `method: "GET"`, and the templated paths `.../orders/[ecommerce.orders.id]/total` and `.../quantity`), or pass `X-RBAC-SECRET-KEY` on the read calls, which also satisfies `RequestSubjectIdOwner`. The permission-error scenario needs the first option, because the secret key bypasses the check being tested.

1. `GET /api/rbac/subjects/authentication/init` for a fresh anonymous subject and its JWT.
2. `POST /api/rbac/subjects/:id/ecommerce-module/orders` with that JWT and a multipart `data` naming a priced product, to create a cart order.
3. `GET /api/rbac/subjects/:id/ecommerce-module/orders/:orderId/total` — expect `data` with one currency entry and `unpriced: []`.
4. `GET /api/rbac/subjects/:id/ecommerce-module/orders/:orderId/quantity` — expect `{ "data": 2 }`.
5. Repeat both with a second subject's id and JWT — expect a permission error and no totals.
6. Delete the created order through `DELETE /api/rbac/subjects/:id/ecommerce-module/orders/:orderId`.

The exact commands are in `thoughts/shared/handoffs/singlepagestartup/ISSUE-257-progress.md`.

## Performance Considerations

Each route now performs one relation query, one order read and one aggregate call, against a route that previously did nothing. The aggregate route already does the same work per order.

## Migration Notes

The wire contract only widens: both paths answered an error for every request before, so no client can regress. Nothing calls them yet.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-257.md`
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-257.md`
- Prior mention: `thoughts/shared/research/singlepagestartup/ISSUE-255.md:64-65`
