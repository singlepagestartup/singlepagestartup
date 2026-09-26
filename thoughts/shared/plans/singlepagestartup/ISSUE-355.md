---
date: 2026-09-26T03:57:03Z
issue_number: 355
repository: singlepagestartup
topic: "Subject order update: forward only the order lines"
status: approved
---

# Subject order update: forward only the order lines Implementation Plan

## Overview

`PATCH /api/rbac/subjects/:id/ecommerce-module/orders/:orderId` sends the module-level order update only the order lines, each reduced to `id` and `quantity`, instead of the whole parsed body.

## Current State Analysis

- The handler sends the whole parsed `data` to `ecommerceOrderApi.update` with the operator secret (`order/id/update.ts:82-90`); the module-level update writes every field it receives and then updates the listed lines (`ecommerce/…/controller/singlepage/update/index.ts:43-86`).
- The cart sends `{ ordersToProducts: [{ id, quantity }] }` (`update-default/ClientComponent.tsx:13-20`), and the module-level handler reads only `id` and `quantity` from each line.
- No sibling cart handler forwards the parsed body to a module-level write (research, "Sibling cart handlers").

## Desired End State

- The module-level update receives `{ ordersToProducts: [{ id, quantity }] }` built from the request's lines; other fields in `data`, and other fields inside a line, are not forwarded.
- A cart quantity change works as before; a request that also carries order fields such as `status` answers 200 and leaves those fields unchanged.
- The admin panel's module-level update keeps writing every field.

### Key Discoveries:

- PR #339 changes this handler's imports and token verification line; the edits here stay below them, and no import is added.
- The order SDK's `update` takes `data: any`, so the explicit payload needs no new type.
- `update.spec.ts` mocks `@sps/backend-utils`, where PR #339 adds one line; new scenarios go at the end of the file.

## What We're NOT Doing

- No change to the route table (PR #353), the checkout handlers (PR #350), the token verification lines (PR #339), the module-level order update, the frontend, the schema or the seed.
- No change to `order/create.ts`, `order/id/quantity.ts`, `order/id/total.ts`, `order/quantity.ts` or `order/total.ts`: none forwards caller data wholesale.
- No bounds on line quantities.

## Implementation Approach

Build the payload next to the existing `ordersToProducts` check, from the lines only, and pass it instead of `data`. The check becomes `Array.isArray` with the same message, because the handler now maps the lines and a non-array value must stay a 400.

## Phase 1: Order lines payload

### Changes Required:

#### 1. Handler

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/update.ts`
**Changes**: require `data.ordersToProducts` to be an array (same message); map it to `{ id, quantity }` lines; send `data: { ordersToProducts }` to `ecommerceOrderApi.update`. The status check and the response stay.

#### 2. Handler spec

**File**: `…/order/id/update.spec.ts`
**Changes**: new scenarios at the end: a body with `status`, `type` and `comment` beside the lines reaches the module-level update as the lines only; extra fields inside a line are dropped; `ordersToProducts` that is not an array is refused before any update. Existing scenarios stay.

### Success Criteria:

#### Automated Verification:

- [x] `update.spec.ts` passes; with the `main` handler the new payload scenarios fail.
- [x] `npx nx run @sps/rbac:jest:test`, `npx nx run @sps/rbac:eslint:lint`, `npx tsc --noEmit -p libs/modules/rbac/tsconfig.json` and `node tools/agents/code-placement.mjs` pass.

#### Manual Verification:

- [x] HTTP run (Testing Strategy) matches the Desired End State.

---

## Testing Strategy

### Unit Tests:

- Lines only, extra line fields, non-array lines, existing owner and success scenarios.

### Manual Testing Steps:

1. Run the API from this worktree on port 4355 against `sps-lite-issue-355`, a `pg_dump` copy of the development database, before and after the change.
2. Anonymous subject A with two cart orders; subject C linked to the Admin role with the operator secret.
3. A changes a quantity through the subject route; A sends the same request with `status`, `type` and `comment` in `data`; the order is read from the database after each request.
4. `PATCH /api/ecommerce/orders/:id` with A's token and with C's admin token.
5. Drop the throwaway database and stop the API.

## Performance Considerations

None.

## Migration Notes

Projects whose own clients send order fields through the subject update route, expecting them to be written, must use the ecommerce order routes with an admin token instead (see the commit trailers).

## References

- Original ticket: GitHub issue #355 (https://github.com/singlepagestartup/singlepagestartup/issues/355)
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-355.md`
