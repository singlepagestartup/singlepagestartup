---
date: 2026-09-26T03:29:00+00:00
issue_number: 352
repository: singlepagestartup
topic: "Per-order subject routes: check the order belongs to the subject"
status: approved
---

# Per-order subject routes: order link check Implementation Plan

## Overview

Add a route middleware, `RequestSubjectOwnsEcommerceModuleOrder`, that refuses a request when no `subjects-to-ecommerce-module-orders` row links `:id` to `:orderId`. Put it, after `RequestSubjectIdOwner`, on the four per-order subject routes. The four handlers stay unchanged.

## Current State Analysis

- `GET /:id/ecommerce-module/orders/:orderId/quantity`, `GET …/:orderId/total`, `PATCH /:id/ecommerce-module/orders/:orderId` and `DELETE /:id/ecommerce-module/orders/:orderId` have no route middleware (`controller/singlepage/index.ts:306-315,328-332,344-348`), and their permission rows carry no role.
- The update and delete handlers check the token's subject against `:id` and then act on `:orderId` without reading the subject's order links (`order/id/update.ts:38-90`, `order/id/delete.ts:39-113`). On `main`, a subject's own path accepts an order linked to another subject.
- The per-order quantity and total handlers require a request body and answer 400 to every GET.
- Callers act on the signed-in subject's own cart orders: the update and delete SDK actions and variants, rendered by the cart sheet and the product cart, and the issue-152 scenario fixture.

## Desired End State

- On each of the four routes, `RequestSubjectIdOwner` runs first (the subject's own token or the operator secret), then `RequestSubjectOwnsEcommerceModuleOrder`.
- An order not linked to the subject in the path answers 401 "Authorization error. Requested ecommerce-module order does not belong to subject" before the handler runs, whatever the credential. Another subject's token on the owner's path answers 401 and a request without a credential 400, both before the handler.
- The subject's own token on its own order and the operator secret on the subject's own order reach the handler, which answers as it does today.
- The cart flow is unchanged: add, change quantity, remove, and the cart quantity and total reads.

### Key Discoveries:

- `RequestSubjectOwnsSocialModuleChat` is the shape to mirror: `IMiddlewareGeneric`, a typed `IService` subset, `constructor(private readonly service: IService)`, `init()`, required params, errors mapped through `getHttpErrorType` (`middlewares/src/lib/request-subject-owns-social-module-chat/index.ts:1-45`).
- `RequestSubjectCanManageChatAgentProfile.assertRequestingProfileAccess` shows the relation lookup: `subjectsToSocialModuleProfiles.find` with `eq` on both columns and `limit: 1`, refusing with "Authorization error. …" (`request-subject-can-manage-chat-agent-profile/index.ts:121-151`).
- The subject service passed by the controller holds `subjectsToEcommerceModuleOrders` (`service/singlepage/index.ts:154`).
- The chat routes pair `RequestSubjectIdOwner` with the link check (`index.ts:393-410`); the subject README requires `RequestSubjectIdOwner` as the first ownership guard. Running it first also refuses callers without a credential before the link lookup, so the lookup cannot be probed.
- `DefaultApp.useRoutes()` registers route middlewares in array order before the handler (`libs/shared/backend/api/src/lib/app/default/index.ts:72-82`).

## What We're NOT Doing

- No change to the four handlers: PR #339 rewrites their token verification lines. Their own checks stay as defense in depth, and the per-order quantity and total handlers keep answering 400 to a GET without a body.
- No change to the checkout routes (PR #350), the order lines route (#349), the cart list, quantity and total routes, or the permission rows.
- No admin bypass: an admin acts on orders through the ecommerce order routes, not through another subject's path.
- No new service method: the middleware reads the relation service the subject service already holds, like `RequestSubjectCanManageChatAgentProfile`.

## Implementation Approach

One middleware in the module's middleware package, exported like its siblings, and declared on the four routes next to `RequestSubjectIdOwner`, as the chat thread routes do. The route-table spec replaces the four handlers with stubs, so it pins the route guards and stays valid while other changes rewrite the handler internals.

## Phase 1: Order link middleware

### Overview

The middleware exists, is exported, and is covered by its own spec.

### Changes Required:

#### 1. Middleware

**File**: `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-owns-ecommerce-module-order/index.ts` (new)
**Why**: route middleware lives in the module's middleware package; a new folder per middleware is how the siblings are laid out.
**Changes**: `Middleware` with a typed `IService` exposing `subjectsToEcommerceModuleOrders.find`; `init()` requires `id` and `orderId`, looks up a relation row with `subjectId = :id` and `ecommerceModuleOrderId = :orderId` (`limit: 1`), refuses with "Authorization error. Requested ecommerce-module order does not belong to subject" when none exists, and maps errors through `getHttpErrorType`.

**File**: `libs/modules/rbac/models/subject/backend/app/middlewares/src/index.ts`
**Changes**: export `RequestSubjectOwnsEcommerceModuleOrder` and `IRequestSubjectOwnsEcommerceModuleOrderMiddlewareGeneric`, like the other entries.

#### 2. Middleware spec

**File**: `…/request-subject-owns-ecommerce-module-order/index.spec.ts` (new)
**Changes**: the middleware on a bare `Hono` route with a filter-aware relation mock: a linked pair reaches the route and the lookup filters by both columns with `limit: 1`; an order linked to another subject, and an order with no link, answer 401 without reaching the route; an operator request passes for a linked pair and is refused for an unlinked one.

### Success Criteria:

#### Automated Verification:

- [x] The middleware spec passes.
- [x] Removing the refusal makes the refusal scenarios fail.

#### Manual Verification:

- [x] The file reads like its sibling middlewares.

---

## Phase 2: Route table

### Overview

The four routes carry the owner guard and the order link check.

### Changes Required:

#### 1. Route table

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts`
**Why**: the four routes act on `:orderId` for the subject in the path.
**Changes**: import `RequestSubjectOwnsEcommerceModuleOrder`; on the quantity, total, update and delete routes, `middlewares: [new RequestSubjectIdOwner().init(), new RequestSubjectOwnsEcommerceModuleOrder(this.service).init()]`.

#### 2. Route-table spec

**File**: `…/controller/singlepage/index.order-ownership.spec.ts` (new; `index.spec.ts` is added by PRs #346 and #350)
**Changes**: mount the real route table through `DefaultApp.useRoutes()` with the four handlers stubbed; for each route: an order linked to another subject is refused (401) before the handler; another subject's token on the owner's path is refused (401); the subject's own order reaches the handler with its token and with the operator secret.

### Success Criteria:

#### Automated Verification:

- [x] The route-table spec, the rbac unit lane, lint and types pass.
- [x] Without the link middleware on a route, that route's foreign-order scenario fails (for DELETE only together with PATCH, which shares its path).

#### Manual Verification:

- [x] HTTP run (Testing Strategy) matches the Desired End State.

---

## Phase 3: Subject README

### Overview

Document the new guard beside the chat guards.

### Changes Required:

**File**: `libs/modules/rbac/models/subject/README.md`
**Changes**: one bullet in "Authorization Layering" after the chat thread example, naming the per-order routes and `RequestSubjectOwnsEcommerceModuleOrder`. The "Social Thread Permission Routes" section, where PR #350 adds its section, stays untouched.

### Success Criteria:

#### Automated Verification:

- [x] Prettier check passes on the README.

#### Manual Verification:

- [x] The bullet matches the code.

---

## Testing Strategy

### Unit Tests:

- Middleware: linked pair, order of another subject, order without a link, operator request with a linked and an unlinked pair, lookup filters.
- Route table: four routes × {foreign order, another subject's token, own token, operator secret}.
- Lanes: `npx nx run @sps/rbac:jest:test`; `npx nx run @sps/rbac:eslint:lint`; `npx tsc --noEmit -p libs/modules/rbac/tsconfig.json`; `node tools/agents/code-placement.mjs`.

### Integration Tests:

- None added; the HTTP run covers the assembled pipeline.

### Manual Testing Steps:

1. Run the API from this worktree on port 4352 against `sps-lite-issue-352`, a `pg_dump` copy of the development database, before and after the change.
2. Anonymous subjects A (two cart orders of `pro`) and B (one). For each of the four routes: A's token on A's order; no credential; B's token on A's path; B's token on B's path naming A's order; the operator secret on A's order and on B's order.
3. The cart flow for A: add, change quantity, remove, and the cart quantity and total reads.
4. Drop the throwaway database and stop the API.

## Performance Considerations

One read of at most one relation row per request on the four routes, as the chat routes do for their chat link.

## Migration Notes

Projects that call the four routes with an order not linked to the subject in the path, or override the subject route table, must adapt (see the commit trailers).

## References

- Original ticket: GitHub issue #352 (https://github.com/singlepagestartup/singlepagestartup/issues/352)
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-352.md`
