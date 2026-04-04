# RBAC/Ecommerce Cart Tests: Unit+Integration Coverage for Product and Cart Interactions

## Overview

Add deterministic unit and integration coverage for cart/product interaction flows across `host -> rbac -> ecommerce`, including authorized/unauthorized behavior and backend contract-side effects, without changing public API/schema.

## Current State Analysis

Cross-layer cart behavior is implemented, but focused behavior-level tests are sparse for the exact issue scope. Frontend behavior is heavily composed through host wrappers into RBAC subject variants, and backend behavior is distributed across RBAC subject controllers plus a large checkout service. Existing direct depth is strongest in checkout service tests, while cart/product component and endpoint-flow coverage is missing or shallow.

## Desired End State

The repository has stable BDD-formatted tests that cover:

- frontend cart lifecycle behavior (`add -> quantity/cart refresh -> update/delete -> checkout`) in scoped component terms,
- host-to-rbac composition correctness for product/cart variants,
- backend endpoint validation/ownership/status constraints and checkout side effects,
- boundary/error scenarios (missing auth, invalid payloads, duplicates, provider failures, empty cart),
- explicit docs on layering rule: `rbac > ecommerce`, no reverse imports from ecommerce into rbac.

### Key Discoveries:

- Host product variants wire cart/checkout through RBAC "me" wrappers, not direct ecommerce actions (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/ecommerce/product/singlepage/default/Component.tsx:41`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/ecommerce/product/singlepage/overview-default/Component.tsx:41`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/ecommerce/product/singlepage/cart-default/Component.tsx:17`).
- RBAC "me" wrappers gate rendering via `authentication-me-default` before exposing cart/checkout variants (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject/singlepage/me/ecommerce-module/product/cart-default/ClientComponent.tsx:9`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject/singlepage/me/ecommerce-module/product/checkout-default/ClientComponent.tsx:8`).
- Auth gate behavior is explicit: missing/expired token renders skeleton and no subject children (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/me-default/client.tsx:38`).
- Product cart decision tree branches repeatedly to create vs update/delete/checkout controls (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/product/cart-default/ClientComponent.tsx:31`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/product/cart-default/ClientComponent.tsx:70`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/product/cart-default/ClientComponent.tsx:206`).
- Cart badge/sheet UI depends on quantity/list-checkout variants and conditional badge rendering (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject/singlepage/me/ecommerce-module/cart/default/ClientComponent.tsx:31`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject/singlepage/me/ecommerce-module/cart/default/ClientComponent.tsx:37`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject/singlepage/me/ecommerce-module/cart/default/ClientComponent.tsx:57`).
- Backend update/delete are constrained by owner checks and `order.status === "new"` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/update.ts:58`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/update.ts:78`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/delete.ts:74`).
- Order checkout endpoint enforces payload shape (`provider`, `email`, `ecommerceModule.orders[].id`) before service invocation (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/checkout.ts:59`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/checkout.ts:68`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/checkout.ts:80`).
- Checkout service has critical side-effect branches: subscription collision handling, status transitions, observer events (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:567`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:575`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:744`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:751`).
- Existing checkout service tests already model subscription edge behavior and can be extended (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.spec.ts:300`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.spec.ts:315`).

## What We're NOT Doing

- Adding route/page-navigation assertions (explicit non-goal of the issue).
- Reintroducing browser E2E/Playwright flows for this scope.
- Refactoring checkout architecture or changing public API/schema contracts.
- Changing ownership/layering architecture (`rbac > ecommerce`) beyond docs/tests.

## Implementation Approach

Build coverage from inner behavior outward:

1. lock RBAC subject frontend decision branches and action payload contracts with deterministic unit specs,
2. verify host composition wiring and cart sheet/badge behavior with frontend integration specs,
3. extend backend endpoint/service coverage for request validation, permission constraints, duplicate/error paths, and side effects,
4. codify layering rule in docs and align tests to the documented boundary.

## Phase 1: Frontend Unit Coverage for RBAC Cart/Product Actions

### Overview

Add focused unit tests for RBAC subject cart/product components where the interaction logic actually branches.

### Changes Required:

#### 1. Cart decision-tree tests

**File**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/product/cart-default/ClientComponent.spec.tsx`  
**Why**: This component controls create-vs-existing-cart behavior and when update/delete/checkout controls are rendered.  
**Changes**: Add BDD tests for no-orders, no-cart-orders, no-product-in-cart, and product-in-cart branches by mocking relation/model wrappers and asserting rendered action components.

#### 2. Action submit payload tests

**Files**:
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/create-default/ClientComponent.spec.tsx`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/update-default/ClientComponent.spec.tsx`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/delete-default/ClientComponent.spec.tsx`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/checkout-default/ClientComponent.spec.tsx`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/list/checkout-default/ClientComponent.spec.tsx`  
**Why**: These components dispatch cart lifecycle mutations and checkout redirects/payment-link branches.  
**Changes**: Add BDD tests asserting mutation invocation payloads (`id/orderId/ordersToProducts/ecommerceModule.orders/provider/email/currency`) and one-invoice vs multi-invoice redirect behavior.

#### 3. Auth gate and quantity/total wrapper tests

**Files**:
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/me-default/client.spec.tsx`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/list/default/client.spec.tsx`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/list/quantity-default/client.spec.tsx`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/list/total-default/client.spec.tsx`  
**Why**: Auth and list wrappers define rendered/hidden behavior boundaries used by host cart/product wrappers.  
**Changes**: Add BDD tests for expired/missing token fallback, null-data passthrough behavior, and child render paths when data exists.

### Success Criteria:

#### Automated Verification:

- [ ] New RBAC frontend specs use required BDD suite headers (`Given/When/Then`).
- [ ] `npm run test:file -- libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/product/cart-default/ClientComponent.spec.tsx`
- [ ] `npm run test:file -- libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/list/checkout-default/ClientComponent.spec.tsx`

#### Manual Verification:

- [ ] Test names and assertions describe behavior (branch/output/payload), not implementation details.
- [ ] Unauthorized paths clearly assert hidden/no-op cart interaction rendering.

---

## Phase 2: Frontend Integration Coverage for Host/RBAC/Ecommerce Wiring

### Overview

Validate that host variants pass control into RBAC variants correctly and cart UI composition behaves as expected.

### Changes Required:

#### 1. Product variant composition specs

**Files**:
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/ecommerce/product/singlepage/default/Component.spec.tsx`
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/ecommerce/product/singlepage/overview-default/Component.spec.tsx`
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/ecommerce/product/singlepage/cart-default/Component.spec.tsx`  
**Why**: These are the composition entry points where host delegates cart/checkout to RBAC variants.  
**Changes**: Add integration tests that mock RBAC subject component and assert expected variant routing (`me-ecommerce-module-product-cart-default`, `me-ecommerce-module-product-checkout-default`) and payload propagation.

#### 2. "me" wrapper and navbar cart integration specs

**Files**:
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject/singlepage/me/ecommerce-module/product/cart-default/ClientComponent.spec.tsx`
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject/singlepage/me/ecommerce-module/product/checkout-default/ClientComponent.spec.tsx`
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject/singlepage/me/ecommerce-module/cart/default/ClientComponent.spec.tsx`
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/website-builder/widget/singlepage/navbar-default/Component.spec.tsx`  
**Why**: These files define auth-gated visibility and cart badge/sheet behavior in actual host UI composition.  
**Changes**: Add integration tests for subject-present vs subject-missing rendering, quantity badge visibility, and checkout sheet mount behavior.

### Success Criteria:

#### Automated Verification:

- [ ] New host integration specs comply with BDD header format.
- [ ] `npm run test:file -- libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject/singlepage/me/ecommerce-module/cart/default/ClientComponent.spec.tsx`

#### Manual Verification:

- [ ] Host composition tests confirm no direct ecommerce mutation wiring bypassing RBAC wrappers.
- [ ] Badge and checkout-sheet behavior is asserted without route-transition assumptions.

---

## Phase 3: Backend Integration/Service Coverage for Cart/Order Contracts

### Overview

Expand backend coverage for endpoint validations/constraints and service-level checkout side effects that frontend depends on.

### Changes Required:

#### 1. RBAC subject order controller contract specs

**Files**:
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.spec.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/update.spec.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/delete.spec.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/list.spec.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/quantity.spec.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/checkout.spec.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/product/id/checkout.spec.ts`  
**Why**: These handlers enforce ownership, payload validity, status gating, and data-shaping contracts used by frontend actions.  
**Changes**: Add BDD specs for authorized/unauthorized flows, invalid payload errors, empty cart responses, `status !== new` rejection, and checkout payload validation.

#### 2. Checkout service edge-case expansion

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.spec.ts`  
**Why**: Existing service tests already cover subscription-collision branches and are the best anchor for side-effect assertions.  
**Changes**: Add scenarios for provider failures, missing currency/payment-intent links, duplicate action aggregation behavior, and observer message scheduling expectations.

#### 3. API integration contract for mounted cart/order endpoints

**File**: `apps/api/specs/integration/rbac-ecommerce-cart-contract.integration.spec.ts`  
**Why**: Mount-level regressions can silently break frontend actions even when component tests pass.  
**Changes**: Add BDD integration contract verifying RBAC subject singlepage route registration includes issue-critical endpoints (`orders`, `orders/quantity`, `orders/checkout`, `orders/:orderId`, `products/:productId/checkout`).

### Success Criteria:

#### Automated Verification:

- [ ] `npm run test:file -- libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.spec.ts`
- [ ] `npm run test:file -- apps/api/specs/integration/rbac-ecommerce-cart-contract.integration.spec.ts`
- [ ] `npm run test:integration:scoped`

#### Manual Verification:

- [ ] Controller specs explicitly validate owner/payload/status constraints for create/update/delete/checkout flows.
- [ ] Service specs assert checkout side effects (status updates, payment intent linkage, observer pushes) in failure and success branches.

---

## Phase 4: Documentation and Layering Boundary Clarification

### Overview

Document and lock the architectural boundary that this issue depends on: `rbac > ecommerce` and no reverse imports.

### Changes Required:

#### 1. Module docs updates for layering rule

**Files**:
- `libs/modules/rbac/models/subject/README.md`
- `libs/modules/ecommerce/README.md`  
**Why**: These are the closest docs to the affected variants/controllers and currently do not explicitly codify the one-way dependency rule.  
**Changes**: Add concise architecture note that cart/product orchestration runs through RBAC subject surfaces and ecommerce must not import RBAC subject implementation.

#### 2. Root architecture note alignment

**File**: `README.md`  
**Why**: Root architecture guidance is the repository-wide source for cross-module expectations.  
**Changes**: Add short boundary statement in architecture section linking cart/product orchestration ownership to RBAC subject layer.

### Success Criteria:

#### Automated Verification:

- [ ] Documentation changes are included in lintable markdown set (no broken references introduced).

#### Manual Verification:

- [ ] Layering rule is explicit in module and root docs with no ambiguity.
- [ ] Scope/out-of-scope boundaries in docs match issue #152 expectations.

---

## Testing Strategy

### Unit Tests:

- Decision-tree branch tests for RBAC cart components.
- Mutation payload tests for create/update/delete/checkout components.
- Auth/list wrapper render-path tests (subject present vs absent, null data handling).

### Integration Tests:

- Host composition tests for product default/overview/cart + navbar cart sheet.
- API integration contracts for mounted RBAC ecommerce order/cart endpoints.
- Backend controller contract specs around validation, ownership, and status guards.

### Manual Testing Steps:

1. Run `npm run test:unit:scoped`.
2. Run `npm run test:integration:scoped`.
3. Open a product view and verify add/update/delete in cart UI as authenticated user.
4. Repeat with missing/expired auth token and verify guarded rendering behavior.
5. Validate checkout trigger path from product and cart contexts with mocked/non-production provider in development environment.

## Performance Considerations

- Keep frontend tests component/harness-driven (no browser E2E lane) to avoid flaky runtime and preserve scoped test speed.
- Checkout service tests should continue using deterministic doubles to avoid provider/network coupling.
- Avoid excessive full-stack setup in controller specs; prefer contract-level assertions through existing SDK patterns.

## Migration Notes

- No data/schema migration is expected.
- This is a test-and-doc coverage expansion over existing behavior and endpoints.
- Existing checkout behavior remains source of truth; tests should codify current constraints before future refactors.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-152.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-152.md`
- Related baseline planning context: `thoughts/shared/plans/singlepagestartup/ISSUE-150.md`
