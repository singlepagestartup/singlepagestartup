---
date: 2026-04-05T00:40:33+03:00
researcher: flakecode
git_commit: d2e5bbf690afdcb9cd7cf6fb591145cef0ed6c69
branch: issue-152
repository: singlepagestartup
topic: "RBAC/Ecommerce cart and product interaction coverage map (unit+integration scope)"
tags: [research, rbac, ecommerce, cart, product, testing]
status: complete
last_updated: 2026-04-05
last_updated_by: flakecode
---

# Research: RBAC/Ecommerce cart and product interaction coverage map (unit+integration scope)

**Date**: 2026-04-05T00:40:33+03:00
**Researcher**: flakecode
**Git Commit**: d2e5bbf690afdcb9cd7cf6fb591145cef0ed6c69
**Branch**: issue-152
**Repository**: singlepagestartup

## Research Question

Document the current implementation for issue #152:

- where product/cart behavior is composed across `host`, `rbac`, and `ecommerce`;
- how `authentication-me-default` gates authorized vs unauthorized rendering;
- how add/update/delete/checkout actions flow from frontend variants to backend handlers;
- how cart trigger/sheet/badge behavior is implemented;
- what backend behavior and test coverage already exist today for these flows;
- and what historical testing context exists in `thoughts/shared/*`.

## Summary

- Product/cart interaction is composed from host product variants into RBAC subject wrappers, then into RBAC subject ecommerce variants (`me-ecommerce-module-product-cart-default` -> `ecommerce-module-product-cart-default`) with auth gating via `authentication-me-default`.
- Cart lifecycle UI behavior is implemented as a decision tree in `ecommerce-module-product-cart-default`: create path when no matching cart-product relation exists, and update/delete/checkout path when one exists.
- Frontend mutations/queries use RBAC subject SDK endpoints under `/api/rbac/subjects/:id/ecommerce-module/orders*`; controllers validate JWT subject ownership and operate through service/relation calls.
- Cart trigger/badge/sheet behavior is implemented by `me-ecommerce-module-cart-default` using `ecommerce-module-order-list-quantity-default` and `ecommerce-module-order-list-checkout-default`.
- Existing direct behavior-focused backend test coverage is centered on RBAC ecommerce checkout service (`checkout.spec.ts`); direct frontend tests for the host/RBAC cart variants were not found in this repository snapshot.
- Historical artifacts show test-strategy transition from broader E2E-inclusive direction to focused deterministic unit+integration scope, matching the framing recorded in issue #152.

## Detailed Findings

### 1. Cross-layer composition: host -> rbac -> ecommerce

- Host product variants mount RBAC subject variants for cart/checkout:
  - `default` product view mounts `me-ecommerce-module-product-cart-default` and `me-ecommerce-module-product-checkout-default` (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/ecommerce/product/singlepage/default/Component.tsx:37`).
  - `overview-default` mounts the same RBAC variants (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/ecommerce/product/singlepage/overview-default/Component.tsx:37`).
  - `cart-default` mounts `me-ecommerce-module-product-cart-default` only (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/ecommerce/product/singlepage/cart-default/Component.tsx:13`).
- Host wrapper `me-ecommerce-module-product-cart-default` performs auth gating with `authentication-me-default`; when `subject` exists it renders RBAC variant `ecommerce-module-product-cart-default` (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject/singlepage/me/ecommerce-module/product/cart/default/ClientComponent.tsx:9`).
- RBAC subject variant registry includes all issue-relevant variants (`authentication-me-default`, product-cart, order create/update/delete/checkout, and list/quantity/checkout list variants) (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/variants.ts:75`).

### 2. Auth gating behavior (`authentication-me-default`)

- Client implementation decodes `rbac.subject.jwt` from cookies and yields `decoded.subject` only when token exists and is not expired (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/me-default/client.tsx:11`).
- If no decoded subject or token expired, client path renders skeleton (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/me-default/client.tsx:38`).
- Host wrappers convert missing subject into empty fragment for cart/product-cart/cart-sheet entry points (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject/singlepage/me/ecommerce-module/product/cart/default/ClientComponent.tsx:11`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject/singlepage/me/ecommerce-module/cart/default/ClientComponent.tsx:19`).
- Server implementation exists and calls `/authentication/me` with bearer JWT (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/me-default/server.tsx:14`), but cart/product wrappers in these flows explicitly use `isServer={false}`.

### 3. Product-cart decision tree and action rendering

- Decision tree for cart interaction is implemented in `ecommerce-module-product-cart-default/ClientComponent.tsx`:
  - Fetch subject cart orders via `ecommerce-module-order-list-default` (`.../cart-default/ClientComponent.tsx:22`).
  - If none, render `OrderCreateDefault` (`.../cart-default/ClientComponent.tsx:29`).
  - Otherwise fetch ecommerce orders by IDs with `type="cart"` (`.../cart-default/ClientComponent.tsx:43`).
  - If none, render create (`.../cart-default/ClientComponent.tsx:68`).
  - Fetch `orders-to-products` for current product (`.../cart-default/ClientComponent.tsx:82`).
  - If no relation rows for current product in cart orders, render create (`.../cart-default/ClientComponent.tsx:132`).
  - If relation exists, render update/delete/checkout controls (`.../cart-default/ClientComponent.tsx:206`).
- `OrderCreateDefault` builds and submits add-to-cart payload via `api.ecommerceModuleOrderCreate` (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/create-default/ClientComponent.tsx:31`, `:47`).
- `OrderUpdateDefault` submits `{ ordersToProducts: [{ id, quantity }] }` via `api.ecommerceModuleOrderUpdate` (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/update-default/ClientComponent.tsx:32`).
- `OrderDeleteDefault` submits delete for `orderId` via `api.ecommerceModuleOrderDelete` (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/delete-default/ClientComponent.tsx:24`).
- `OrderCheckoutDefault` submits provider/email with selected order ID via `api.ecommerceModuleOrderCheckout` (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/checkout-default/ClientComponent.tsx:61`).

### 4. Cart trigger/sheet/badge behavior

- Navbar mounts `me-ecommerce-module-cart-default` (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/website-builder/widget/singlepage/navbar-default/Component.tsx:9`).
- Cart wrapper renders a `Sheet` trigger with `ShoppingCart` icon and nested RBAC quantity variant `ecommerce-module-order-list-quantity-default` (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject/singlepage/me/ecommerce-module/cart/default/ClientComponent.tsx:24`, `:31`).
- Badge renders only when quantity value is truthy (`.../cart/default/ClientComponent.tsx:37`).
- Sheet content mounts `ecommerce-module-order-list-checkout-default` (`.../cart/default/ClientComponent.tsx:55`).
- Checkout list component:
  - resolves subject-to-order relations and cart orders (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/list/checkout-default/ClientComponent.tsx:93`);
  - renders per-order update/delete controls (`.../list/checkout-default/ClientComponent.tsx:159`);
  - renders totals via `ecommerce-module-order-list-total-default` (`.../list/checkout-default/ClientComponent.tsx:185`);
  - submits grouped checkout payload and handles one vs many payment URLs (`.../list/checkout-default/ClientComponent.tsx:66`, `:217`).

### 5. Frontend SDK call surface and payload contracts

- Query endpoints:
  - `ecommerceModuleOrderList` -> `GET /:id/ecommerce-module/orders` (`libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/ecommerce-module/order/list.ts:24`, `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/ecommerce-module/order/list.ts:23`).
  - `ecommerceModuleOrderQuantity` -> `GET /:id/ecommerce-module/orders/quantity` (`libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/ecommerce-module/order/quantity.ts:24`, `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/ecommerce-module/order/quantity.ts:22`).
- Mutation endpoints:
  - create -> `POST /:id/ecommerce-module/orders` (`libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/ecommerce-module/order/create.ts:59`).
  - update -> `PATCH /:id/ecommerce-module/orders/:orderId` (`libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/ecommerce-module/order/id/update.ts:49`).
  - delete -> `DELETE /:id/ecommerce-module/orders/:orderId` (`libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/ecommerce-module/order/id/delete.ts:43`).
  - checkout -> `POST /:id/ecommerce-module/orders/checkout` (`libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/ecommerce-module/order/checkout.ts:52`).
- Server SDK serializes request `data` using `prepareFormDataToSend`, and controllers parse `body["data"]` JSON (`libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/ecommerce-module/order/create.ts:43`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.ts:44`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/checkout.ts:27`).

### 6. Backend controller/service behavior for order lifecycle

- Route bindings for issue-relevant order/auth endpoints are in RBAC subject singlepage controller (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:207`, `:222`, `:232`, `:237`, `:252`, `:257`).
- `order/create` controller behavior includes:
  - JWT subject ownership validation (`.../order/create.ts:52`);
  - required `data.productId` validation (`.../order/create.ts:56`);
  - store resolution fallback when `storeId` absent (`.../order/create.ts:65`);
  - currency resolution from product attributes/default currency (`.../order/create.ts:104`);
  - duplicate order guard path (`.../order/create.ts:187`);
  - creation of order + relation rows (`.../order/create.ts:276`, `:289`, `:301`, `:318`, `:334`).
- `order/update` and `order/delete` controllers enforce owner validation and `order.status === "new"` before mutating/deleting (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/update.ts:46`, `:78`; `.../id/delete.ts:54`, `:74`).
- `order/list` returns cart-type orders linked to the subject (`.../order/list.ts:64`).
- `order/quantity` sums `findByIdQuantity` across subject cart orders (`.../order/quantity.ts:95`).
- `order/checkout` controller validates provider/email/orders payload and delegates to service `ecommerceOrderCheckout` (`.../order/checkout.ts:46`, `:58`, `:116`).
- Checkout service (`service/singlepage/ecommerce/order/checkout.ts`) constructs metadata, computes checkout attributes, groups payment intents, calls billing provider, updates order status to `paying`, schedules observer broadcasts, and returns invoices (`.../checkout.ts:258`, `:447`, `:713`, `:729`, `:850`).

### 7. Existing test/documentation coverage relevant to #152 scope

- Direct behavior-focused RBAC ecommerce checkout service test:
  - `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.spec.ts:273`.
- API-level ecommerce mount contract tests:
  - `apps/api/specs/integration/ecommerce-mounting.integration.spec.ts:25`.
  - `apps/api/specs/singlepage/index.spec.ts:12`.
- Frontend contract/wrapper tests exist in ecommerce/shared admin-v2 areas, but direct tests for host product cart wrappers and RBAC subject order create/update/delete/list/quantity cart variants were not located in this snapshot.
- Host testing format and BDD requirements are documented at `apps/host/README.md:12`.

## Code References

- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/ecommerce/product/singlepage/default/Component.tsx:37`
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/ecommerce/product/singlepage/overview-default/Component.tsx:37`
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/ecommerce/product/singlepage/cart-default/Component.tsx:13`
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject/singlepage/me/ecommerce-module/product/cart/default/ClientComponent.tsx:9`
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/subject/singlepage/me/ecommerce-module/cart/default/ClientComponent.tsx:17`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/me-default/client.tsx:10`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/product/cart-default/ClientComponent.tsx:22`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/create-default/ClientComponent.tsx:47`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/update-default/ClientComponent.tsx:32`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/delete-default/ClientComponent.tsx:24`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/list/checkout-default/ClientComponent.tsx:93`
- `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/ecommerce-module/order/create.ts:59`
- `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/ecommerce-module/order/id/update.ts:49`
- `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/ecommerce-module/order/id/delete.ts:43`
- `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/ecommerce-module/order/checkout.ts:52`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:207`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.ts:20`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/list.ts:15`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/quantity.ts:15`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/checkout.ts:15`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/update.ts:16`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/id/delete.ts:17`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:68`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.spec.ts:273`

## Architecture Documentation

- Repository layered backend architecture (`Repository -> Service -> Controller -> App`) is documented in `README.md:78`.
- API mount ownership is documented in `apps/api/README.md:5` and route mount pattern at `apps/api/README.md:21`.
- Host data-access rule (SDK providers + relation `find` with `apiProps.params.filters.and`) is documented in `apps/host/README.md:9`.
- RBAC subject model variant and endpoint inventory is documented in `libs/modules/rbac/models/subject/README.md:9` and `:75`.

## Historical Context (from thoughts/)

- Issue #152 ticket defines cart/product cross-layer scope, auth/non-auth behavior scope, and explicit `rbac > ecommerce` layering constraint (`thoughts/shared/tickets/singlepagestartup/ISSUE-152.md:17`, `:21`, `:24`).
- March 2026 artifacts document earlier broader test-lane strategy including E2E (`thoughts/shared/research/singlepagestartup/2026-03-01-testing-framework-variant2-scoped.md:4`, `thoughts/shared/plans/singlepagestartup/2026-03-02-integration-e2e-modular-rollout.md:11`).
- Issue #150 artifacts record shift to deterministic module-wide unit+integration direction and supersession of earlier E2E-first direction (`thoughts/shared/tickets/singlepagestartup/ISSUE-150.md:17`, `:49`).
- Prior RBAC auth-gating precedent for authorized/unauthorized rendering is documented in issue #146 research/handoff (`thoughts/shared/research/singlepagestartup/ISSUE-146.md:28`, `thoughts/shared/handoffs/singlepagestartup/ISSUE-146-progress.md:34`).

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-146.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-150.md`
- `thoughts/shared/research/singlepagestartup/2026-03-01-testing-framework-variant2-scoped.md`
- `thoughts/shared/plans/singlepagestartup/ISSUE-150.md`
- `thoughts/shared/plans/singlepagestartup/2026-03-02-integration-e2e-modular-rollout.md`
- `thoughts/shared/tickets/singlepagestartup/ISSUE-152.md`

## Open Questions

- The issue scope references layering documentation update (`rbac > ecommerce`), but no dedicated explicit statement was found yet in module READMEs beyond current issue/ticket artifacts.
- Direct frontend tests for the specific host/RBAC cart variants in this issue scope were not found in this repository snapshot.
