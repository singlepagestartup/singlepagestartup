---
date: 2026-09-19T16:55:00Z
issue_number: 258
repository: singlepagestartup
topic: "Make the add-to-cart duplicate guard fire"
status: in_review
---

# Make the add-to-cart duplicate guard fire — Implementation Plan

## Overview

The add-to-cart handler's duplicate guard filters `stores-to-orders` by `storeId = <subject id>`, so it is always empty and the guard never throws. Replace the five-lookup inline block with a small subject singlepage service that answers one question — does this subject already hold this product in an open cart order — and call it before the first write.

## Current State Analysis

`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.ts:98-215` holds the guard as four nested `if` blocks:

- `:98-111` reads `orders-to-products` by `productId` alone — every cart in the system holding that product.
- `:113-126` reads the subject's order links.
- `:143-162` reads those orders with `status: "new"`, but not `type: "cart"`.
- `:165-185` reads `stores-to-orders` with `{ column: "storeId", method: "eq", value: id }`, where `id` is the route's subject id (`:30`). A subject id is never a store id, so this is always empty.
- `:188-206` reads `orders-to-billing-module-currencies` and `:209` throws `Internal error. Order already exists`. Neither is reachable.

Issue #255 (this branch's base, `ecbf25fad1`) already moved currency resolution into `this.service.ecommerceModuleResolveOrderCurrency` (`create.ts:92-96`), called before the first write. The new guard goes beside it.

## Desired End State

`POST /api/rbac/subjects/:id/ecommerce-module/orders` for a product the subject already holds in an open cart order returns 400 with `Validation error. Product is already in the cart` and writes nothing. `GET /api/ecommerce/orders/count` is unchanged by the second call. The same product in a checked-out order, and any other product, are still accepted.

### Key Discoveries

- Every cart read keys on `(subjectId, type: "cart", status: "new")` and none of them mentions a store: `order/list.ts:68-89`, `order/total.ts:69-95`, `order/quantity.ts:64-107`, the `product/cart-default` frontend variant (`ClientComponent.tsx:42-155`), and `cart-read.spec.ts:65-83`. The `order` table has no `storeId` column (`models/order/.../fields/singlepage.ts:4-11`).
- `type` is a live discriminator: checkout moves an order to `type: "history"`, `status: "paying"` (`service/singlepage/ecommerce/order/checkout.ts:480, 641, 663-664`), and the local instance holds both `cart/*` and `history/*` rows.
- The shared mapper has no `Conflict error` category and no 409 entry (`http-error/type/index.ts:3-11`, `paterns/index.ts`); #232 adds them. `Validation error.` maps to 400.
- `resolve-currency.ts` is the service shape to copy: exported error constant, `IExecuteProps`, `IConstructorProps` taking only the module services it needs, and a thin delegating method on the singlepage service (`service/singlepage/index.ts:331-337`).

## What We're NOT Doing

- Not adding a `Conflict error` category or a 409 status. That is #232's shared-mapper change.
- Not removing `/order already exists/i` from the 404 pattern table. It loses its only producer but keeps its test (`http-error/index.spec.ts:89`), and editing the table widens the diff into the shared lib #232 restructures.
- Not touching `startup` variants, the schema, the quantity routes, the `id/*` routes or checkout.
- Not making the add-to-cart write graph atomic — separate concern, #213.
- Not adding a store predicate anywhere. See the research note's decision section.

## Implementation Approach

Subject-first narrowing in three bounded queries instead of five, wrapped in a service so the handler reads as a sequence of guards followed by writes.

---

## Phase 1: A service that answers the duplicate question

### Overview

Add `ecommerceModuleFindOpenCartOrderWithProduct` and call it from the handler before the first write.

### Changes Required

#### 1. New service

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/find-open-cart-order-with-product.ts`
**Why**: The duplicate question is business logic, not routing. `resolve-currency.ts` established the pattern in the same folder for the same handler.
**Changes**: A `Service` class taking `ecommerceModule` and `subjectsToEcommerceModuleOrders`, with an `execute({ subjectId, productId })` returning the id of the offending order or `null`. Query order: the subject's order links, then those orders filtered by `type: "cart"` and `status: "new"`, then `orders-to-products` filtered by `orderId inArray <those>` **and** `productId`. Return early at each empty step. The service stays a query and exports no message: unlike `resolve-currency.ts`, which refuses, this one answers.

#### 2. Service registration

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts`
**Why**: Handlers reach services only through this class.
**Changes**: Import the new service beside the `EcommerceOrderResolveCurrency` import and add a delegating `ecommerceModuleFindOpenCartOrderWithProduct` method next to `ecommerceModuleResolveOrderCurrency`, preserving the existing import and method order.

#### 3. Handler

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.ts`
**Why**: It holds the broken guard and the five lookups the guard used.
**Changes**: Delete `:98-215`. Every SDK server import stays — the guard read through `this.service`, while the imports serve the writes below it. Call the new service before the first write and throw `Validation error. Product is already in the cart` when it returns an order id, as a literal beside the handler's other refusals. Ask it before the currency: a product the subject already holds does not need a price.

### Success Criteria

#### Automated Verification

- [x] `npx nx run @sps/rbac:jest:test`
- [x] `npx nx run @sps/rbac:eslint:lint`
- [x] `npx tsc --noEmit -p libs/modules/rbac/tsconfig.json`

#### Manual Verification

- [ ] Adding a priced product to an empty cart returns 200 and raises the order count by one.
- [ ] Repeating the same call returns 400 with the refusal message and leaves the order count unchanged.
- [ ] A different product is still accepted.

---

## Phase 2: Behaviour coverage

### Overview

Pin the guard where it broke, in the repository BDD format.

### Changes Required

#### 1. Handler spec

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.spec.ts`
**Why**: It already mocks the five SDK create functions and has an `expectNoWrites` helper; the duplicate case belongs in the same suite as the unpriced case.
**Changes**: A new `describe` covering a product already in the subject's open cart (refusal plus no create call), the same product in a non-open order (accepted), and a different product (accepted). Extend the existing service stub with the new method rather than reshaping the current suite.

#### 2. Service spec

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/find-open-cart-order-with-product.spec.ts`
**Why**: The narrowing is the part that can silently regress; the handler spec only sees the verdict.
**Changes**: Scenarios for a hit, for no subject orders, for orders that are all `history` or all non-`new`, for the product being absent from the subject's open carts, and for the `orders-to-products` query carrying both the `orderId` narrowing and the `productId` predicate.

### Success Criteria

#### Automated Verification

- [x] `npx nx run @sps/rbac:jest:test` — new scenarios green, existing ones unchanged.
- [x] `npx nx run @sps/rbac:eslint:lint`
- [x] `npx tsc --noEmit -p libs/modules/rbac/tsconfig.json`

#### Manual Verification

- [ ] None beyond Phase 1.

---

## Testing Strategy

### Unit Tests

- Duplicate refused before any write; every create mock untouched.
- Non-open and `history` orders do not block a re-add.
- A different product is unaffected.
- The narrowing queries are subject-scoped and carry both predicates.

### Manual Testing Steps

1. `GET /api/rbac/subjects/authentication/init` for a fresh anonymous subject and its JWT.
2. `POST /api/rbac/subjects/:id/ecommerce-module/orders` with the priced product; expect 200 and one more order.
3. Repeat; expect 400 and no new order.
4. Delete the created order and its relation rows.

## Performance Considerations

Three bounded queries replace five, and the unbounded `orders-to-products` scan by `productId` becomes a lookup narrowed to one subject's open cart orders. ISSUE-234 records the same unbounded shape reaching the 65,534-parameter ceiling in production.

## Migration Notes

Carts already holding a duplicate line keep it; the guard is checked on write, not on read, and nothing repairs existing rows.

## Branch Note

This branch builds on the #255 branch `claude/issue-cart-unpriced-product` at `ecbf25fad1`, which introduced `ecommerceModuleResolveOrderCurrency` and the before-the-first-write ordering this plan extends.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-258.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-258.md`
- Prior work on this handler: `thoughts/shared/plans/singlepagestartup/ISSUE-255.md`
- Error-mapper restructuring: `thoughts/shared/research/singlepagestartup/ISSUE-232.md`
