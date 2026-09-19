---
date: 2026-09-19T00:25:00Z
issue_number: 255
repository: singlepagestartup
topic: "Unpriced product breaks the cart"
status: implemented
---

# Unpriced product breaks the cart — Implementation Plan

## Overview

Reject an add-to-cart request for a product that has no price in an available currency before anything is written, and make the cart total survive a row it cannot price so existing broken carts render again.

## Current State Analysis

The add-to-cart handler resolves the order currency from the product's attributes and never checks the result, so a product with no currency-linked price attribute produces `billingModuleCurrencyId: undefined`. Four rows (order, subject link, order line, store link) are committed before the fifth write fails on that undefined value. The subject keeps a cart order holding a product and no currency.

The cart total service treats an unpriceable row as fatal: three separate `throw`s cover "no attributes", "no price attributes" and "no target price attributes". One such row makes the whole subject cart total route answer 500, which is what the owner sees as a permanent cart error on every page.

The "Add to cart" control renders a currency picker from the product's price currencies. When that set is empty the picker collapses to nothing but the button stays enabled, so the only way to learn the product cannot be bought is to break the cart. The create mutation toasts on success and says nothing on failure.

## Desired End State

- `POST /api/rbac/subjects/:id/ecommerce-module/orders` answers 400 `Validation error. Product has no price in an available currency` for an unpriced product, and `GET /api/ecommerce/orders` shows the same row count before and after.
- A cart that already contains an unpriced row answers 200 on the total route, with the unpriced rows reported and the priced ones summed.
- The "Add to cart" button is disabled and reads "No price" for a product with no price currency; a failed add-to-cart raises an error toast.

### Key Discoveries

- `create.ts:61-155` resolves the currency from **all** the product's attributes, not only the price ones, and never validates a caller-supplied currency id.
- `get-total/index.ts` throws at three points; the live `website` row hits `Product does not have any target price attributes`.
- `getHttpErrorType` (`libs/shared/backend/utils/src/lib/http-error/index.ts:60-80`) maps a `Validation error. ` prefix to 400, so the message wording is the status contract.
- The subject singlepage service already exposes everything needed through `this.service.ecommerceModule.*` and `this.service.billingModule.currency` (`di.ts:65-88`); `ecommerceOrderCheckout` is the pattern to copy for a new service method.
- `order/id/total.ts` and `order/id/quantity.ts` in the rbac subject controller are copies of a deanonymize handler and do not call the total service. The quantity routes sum `order.findByIdQuantity` and are unaffected.

## What We're NOT Doing

- No write atomicity or transaction for the add-to-cart graph — that is #213.
- No repair of the mis-named `order/id/total.ts` / `order/id/quantity.ts` handlers.
- No schema change, no migration, no new dependency.
- No change to any `startup` variant or to repository data snapshots.
- No repair of existing broken orders; tolerating them is the fix.

## Implementation Approach

Three independent changes, each verifiable on its own: a resolution service the handler calls before its first write, a non-fatal path through the total computation, and a frontend that does not offer a purchase it knows will fail.

## Phase 1: Resolve the order currency before any write

### Changes Required

#### 1. New service

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/resolve-currency.ts`
**Why**: The resolution is business logic and belongs beside `checkout.ts`, which already takes the module read services through its constructor.
**Changes**: A `Service` class taking `ecommerceModule` and `billingModule`, with an `execute({ productId, billingModuleCurrencyId? })` that reads the price attribute key, the product's attributes under that key, and the currencies linked to them. It returns the resolved currency id, or throws `Validation error. Product has no price in an available currency` when the price currency set is empty, when a requested currency is not in it, or when no price attribute key is configured. With no requested currency it prefers the default billing currency and otherwise falls back to the first price currency.

#### 2. Service wiring

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts`
**Why**: The handler reaches services through `this.service.*`; `ecommerceOrderCheckout` shows the shape.
**Changes**: Add `ecommerceModuleResolveOrderCurrency(props)` delegating to the new service, constructed with the already-injected module services.

#### 3. Handler

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.ts`
**Why**: This is where the partial graph originates.
**Changes**: Replace the inline resolution block with one call to the service, placed before the first `create`. Keep the store resolution, the subject lookup and the existing-cart detection exactly as they are.

### Success Criteria

#### Automated Verification

- [x] `npx nx run @sps/rbac:jest:test` passes, including a new spec for the resolution service and a handler spec asserting no SDK create runs when resolution fails.
- [x] `npx nx run @sps/rbac:eslint:lint` passes.
- [x] `npx tsc --noEmit -p libs/modules/rbac/tsconfig.json` passes.

#### Manual Verification

- [ ] Adding `website` to a cart answers 400 and `GET /api/ecommerce/orders` returns the same count as before.
- [ ] Adding `pro` to a cart still answers 201.

---

## Phase 2: Tolerate a row that cannot be priced

### Changes Required

#### 1. Total service

**File**: `libs/modules/ecommerce/relations/orders-to-products/backend/app/api/src/lib/service/singlepage/get-total/index.ts`
**Why**: The single throw site that makes one legacy row fatal for the whole cart.
**Changes**: Return a result object carrying the per-currency totals plus the unpriced rows instead of throwing, for all three "product cannot be priced" cases. Log once per row at warn level through `logger` from `@sps/backend-utils`. Keep the genuine failures (missing entity, missing configuration) throwing.

#### 2. Order-level aggregation

**File**: `libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/find-by-id/total.ts`
**Why**: It loops the order's rows and re-throws whatever a row produces.
**Changes**: Carry the unpriced rows through instead of failing, keeping the priced totals as they are.

#### 3. Subject cart aggregation

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/total.ts`
**Why**: The route the cart widget calls on every page.
**Changes**: Merge the per-currency totals as today and report the unpriced product ids alongside them.

#### 4. Relation route

**File**: `libs/modules/ecommerce/relations/orders-to-products/backend/app/api/src/lib/controller/singlepage/total/index.ts`
**Why**: It shares the same service.
**Changes**: Pass the new shape through unchanged.

### Success Criteria

#### Automated Verification

- [x] `npx nx run @sps/ecommerce:jest:test` passes, including a new get-total spec for an unpriced row.
- [x] `npx nx run @sps/ecommerce:eslint:lint` passes.
- [x] `npx tsc --noEmit -p libs/modules/ecommerce/tsconfig.json` passes.

#### Manual Verification

- [ ] A cart holding an unpriced row answers 200 on `/ecommerce-module/orders/total` with that row reported.
- [ ] The quantity routes answer as before.

---

## Phase 3: Do not offer what cannot be bought

### Changes Required

#### 1. Client component

**File**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/create-default/ClientComponent.tsx`
**Why**: The button is rendered outside the render-prop chain that knows whether any currency exists.
**Changes**: Move the currency picker and the button into one memoized child that receives the resolved currency list. Render the button disabled with "No price" for an empty list, disabled while the list is loading, and unchanged otherwise. Add an error toast on mutation failure next to the existing success toast. Tailwind classes only; the submit handler wrapped in `useCallback`; the child reads the form through `useWatch` if it needs a field.

#### 2. Component props

**File**: `.../create-default/Component.tsx`
**Why**: It drops the `billingModule` prop the interface declares.
**Changes**: Forward it.

### Success Criteria

#### Automated Verification

- [x] `npx nx run @sps/rbac:jest:test` passes, including a new `ClientComponent.spec.tsx` covering the disabled "No price" state and the error toast.
- [x] `npx nx run @sps/rbac:eslint:lint` passes.

#### Manual Verification

- [ ] The `website` card on the home page shows a disabled "No price" button.
- [ ] A priced product still adds to the cart.

---

## Testing Strategy

### Unit Tests

- Resolution service: no price attribute linked to a currency rejects; a requested currency outside the product's price currencies rejects; the default currency is preferred when the product offers it; a single price currency is used when the default is not among them.
- Handler: a failing resolution calls none of the SDK create functions.
- Get-total: a row whose price attribute has no currency yields no total, is reported, and does not throw; a priced row is summed as before.
- Frontend: an empty currency list disables the button and labels it "No price"; a mutation error raises `toast.error`.

### Manual Testing Steps

1. `GET /api/rbac/subjects/authentication/init` for a JWT and subject id.
2. Add `website` with that JWT — expect 400 and an unchanged order count.
3. Add `pro` — expect 201.
4. Build a cart with an unpriced row through the generic routes with the secret header, then read the subject total route — expect 200 with the row reported.

## Performance Considerations

The resolution runs the reads the handler already ran, ahead of the writes instead of interleaved with them. The total service performs the same reads and skips work for rows it cannot price.

## Migration Notes

Existing broken orders stay in place and become renderable rather than fatal. The total response gains a field; consumers that read the array of per-currency totals keep working.

## References

- Ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-255.md`
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-255.md`
