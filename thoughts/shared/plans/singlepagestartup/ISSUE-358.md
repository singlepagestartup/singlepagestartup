---
date: 2026-09-26T08:50:00+0300
issue_number: 358
repository: singlepagestartup
topic: "Subject order routes: bound line quantities"
status: approved
---

# Subject order routes: bound line quantities Implementation Plan

## Overview

Accept an order line quantity on the subject cart routes only when it is a
whole number from 1 to a documented maximum, refuse other values with a
validation error before anything is written, and give the cart update form the
same bounds.

## Current State Analysis

- `order/create.ts:305` and `product/id/checkout.ts:174` store
  `data.quantity || 1`; `order/id/update.ts` forwards the submitted lines to
  the order update, which copies each quantity into its line.
- The relation schema refuses fractions only, and on the create routes only
  after the order and the subject-to-order row exist.
- The update form checks `z.number()`; the product model has no stock or limit
  field; the relation's descriptions carry no minimum (its input example uses
  0).

## Desired End State

- The three subject routes answer 400 for a quantity of 0, a negative value, a
  fraction, a non-number or a value above the maximum, before any write; an
  absent quantity on the create routes still means 1.
- The update form does not submit such a value.
- The relation's model description states the minimum; its input example and
  README use valid quantities.
- Verified by the rbac and ecommerce unit lanes, lint, type checks, and an HTTP
  run on a throwaway copy of the development database.

### Key Discoveries:

- Order constants live in the SDK models (`types`, `statuses`, `variants`);
  admin client components import values from SDK models.
- #356 changes `order/id/update.ts` lines 58-69 and 84 and appends to
  `update.spec.ts`; #353 changes the route table. The new checks sit in
  unchanged neighbourhoods: after the status check in `update.ts`, after the
  `productId` check in `create.ts`, after the data parse in
  `product/id/checkout.ts`.
- Sibling checks throw `Validation error. ...`, which maps to 400.

## What We're NOT Doing

- Not changing the module-level relation and order routes: operators keep
  writing any integer through them; only the descriptions change.
- Not touching the route table, the token and owner lines, the order update
  payload (#356) or the subject README.
- Not changing the create and product checkout forms: both send a fixed
  quantity of 1 and have no quantity input.

## Implementation Approach

One constant, `quantityBounds`, beside the relation's `variants` in its SDK
model; inline checks in the three handlers in the style of the sibling checks;
the form builds its zod bounds from the same constant.

## Phase 1: Bounds on the routes, the form and the descriptions

### Changes Required:

#### 1. Constant

**File**: `libs/modules/ecommerce/relations/orders-to-products/sdk/model/src/lib/index.ts`
**Changes**: `quantityBounds = { min: 1, max: 1000 }` with a comment: the product model has no stock or limit field, so the maximum is a framework constant a project changes here.

#### 2. Subject routes

**Files**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.ts`, `.../product/id/checkout.ts`, `.../order/id/update.ts`
**Changes**: create and product checkout take `data.quantity ?? 1` and throw `Validation error. data.quantity must be a whole number from 1 to 1000` unless it is an integer within the bounds, before any read or write; the line create uses the checked value. Update throws `Validation error. ordersToProducts[].quantity must be ...` unless every submitted line's quantity is within the bounds, after the status check and before the order update.

#### 3. Form

**File**: `.../ecommerce-module/order/update-default/ClientComponent.tsx`
**Changes**: `quantity: z.number().int().min(quantityBounds.min).max(quantityBounds.max)`.

#### 4. Descriptions

**Files**: `libs/modules/ecommerce/relations/orders-to-products/sdk/model/src/lib/ecommerce-orders-to-products.yaml`, `ecommerce-orders-to-products-input.yaml`, the relation README
**Changes**: `minimum: 1` and a description on `quantity`; the input example uses 1; the README states the bounds.

#### 5. Specs

**Files**: `.../order/create.spec.ts` (new), `.../order/id/update.spec.ts` (scenarios inserted between the existing tests, header untouched), `.../product/id/checkout.spec.ts`, `.../order/update-default/ClientComponent.spec.tsx`
**Changes**: 0, -1, 1.5 and 1001 refused with no write, a valid value accepted and stored, an absent value stored as 1; the form spec uses the real form and resolver: 3 submits, 0, -1, 1.5 and 1001 do not.

### Success Criteria:

#### Automated Verification:

- [ ] `npx nx run @sps/rbac:jest:test` and `npx nx run @sps/ecommerce:jest:test` pass
- [ ] Removing a handler check fails its refusal scenarios; the form's old schema fails the form scenarios
- [ ] Lint and `tsc --noEmit` of both modules pass
- [ ] `git merge-tree --write-tree` against both neighbouring branches reports no conflict

#### Manual Verification:

- [ ] HTTP on port 4358 against a throwaway copy: quantity 2 accepted and the cart total equals price times 2; 0, -1 and 1.5 refused with 400 on create, update and product checkout with no new order; a later valid update is priced

## Testing Strategy

### Unit Tests:

- Handlers: refused values, valid value, absent value (create routes).
- Form: real react-hook-form and zod resolver.

### Integration Tests:

- HTTP run in the manual step.

### Manual Testing Steps:

1. Copy the development database, point the worktree env copy at it, start the API on 4358.
2. Run the requests, compare totals with the price attributes.
3. Drop the copy and restore the env copy.

## Performance Considerations

None; the checks run before the existing reads.

## Migration Notes

- Clients that sent 0 to mean "one" now receive 400; the framework forms send 1.
- A project that needs a larger maximum changes `quantityBounds`.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-358.md` (local)
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-358.md`
