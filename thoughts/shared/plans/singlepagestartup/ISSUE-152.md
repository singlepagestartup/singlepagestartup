# ISSUE-152 Implementation Plan (Executed): DB-backed Jest scenarios for cart/product

## Overview

Replace ISSUE-152 mock-oriented cart/product tests with behavior-first scenarios that run against live API + database, use fixed RBAC credentials from `apps/api/.env`, and always clean up created records.

## Implemented Changes

### 1) Scenario lane infrastructure

- Added scenario Jest config:
  - `apps/api/jest.scenario.config.ts`
- Added Nx target:
  - `apps/api/project.json` -> `jest:scenario`
- Added wrapper scripts:
  - `tools/testing/test-scenario.sh`
  - `tools/testing/test-scenario-issue.sh`
  - `tools/testing/test-scenario-issue-152.sh`
- Added npm scripts:
  - `test:scenario`
  - `test:scenario:issue`
  - `test:scenario:issue-152`
- Updated scoped gate:
  - `test:all:scoped` now includes `test:scenario:issue-152`.
- Scenario runner behavior updated:
  - starts API with `MIDDLEWARE_HTTP_CACHE=true` by default (unless explicitly overridden),
  - performs preflight check for `/api/http-cache/clear` to ensure cache middleware is active in scenario runs.

### 1.1) Temporary cache stabilization for cart counters

- HTTP cache middleware now bypasses only:
  - `GET /api/rbac/subjects/:id/ecommerce-module/orders/quantity`
  - `GET /api/rbac/subjects/:id/ecommerce-module/orders/total`
- Scope is intentionally narrow for issue-152 to remove stale badge behavior while keeping cache enabled for other routes.

### 2) Shared scenario test-utils

Added reusable utilities under `apps/api/specs/scenario/singlepagestartup/issue-152/test-utils`:

- `env.ts`: load env from `apps/api/.env` (+ host env for frontend clients).
- `http.ts`: API request helpers with optional `Authorization` and `X-RBAC-SECRET-KEY`.
- `auth.ts`: fixed-user authentication by `.env` login/password + subject identity retrieval.
- `fixtures.ts`: fixture creation (store/product/attribute/currency/relations), cart actions, and ordered cleanup.
- `db.ts`: real DB state reading for cart/order assertions.
- `polling.ts`: deterministic polling helper for async UI/API propagation.

### 3) Behavior-first scenario tests

Scenario directory is now two-level namespaced by project + issue:

- `apps/api/specs/scenario/singlepagestartup/issue-<number>/...`
- `apps/api/specs/scenario/startup/issue-<number>/...`

- Backend scenario:
  - `apps/api/specs/scenario/singlepagestartup/issue-152/backend-cart.scenario.spec.ts`
  - Validates:
    - add-to-cart creates new cart order (`status="new"`, `type="cart"`) and `orders-to-products` relation in DB,
    - list endpoint returns cart orders,
    - quantity endpoint returns aggregated value.
    - quantity endpoint returns fresh value after create without `cb` cache-bust query,
    - cache middleware remains active and caches `/orders` while not caching excluded `/orders/quantity` and `/orders/total` routes.
- Frontend scenario (Jest + jsdom, real API):
  - `apps/api/specs/scenario/singlepagestartup/issue-152/frontend-cart.scenario.spec.tsx`
  - Validates:
    - user click on `Add to cart` via real component render,
    - real host cart widget (`me-ecommerce-module-cart-default`) shows badge after reload without query cache-bust parameters.

### 4) Replaced mock-oriented ISSUE-152 tests

Removed mock/controller/contract specs that duplicated the same scope without DB-backed behavior guarantees:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.spec.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/list.spec.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/quantity.spec.ts`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/create-default/ClientComponent.spec.tsx`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/list/default/client.spec.tsx`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/order/list/quantity-default/client.spec.tsx`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/ecommerce-module/product/cart-default/ClientComponent.spec.tsx`
- `apps/api/specs/integration/rbac-ecommerce-cart-contract.integration.spec.ts`

## Verification Plan

Primary command:

- `npm run test:scenario:issue-152`
- `npm run test:scenario:issue -- singlepagestartup 152`

Important run condition:

- cache middleware must be active during scenario run; preflight fails if `/api/http-cache/clear` is unavailable.

Blocking gate:

- `npm run test:all:scoped`

## Documentation Alignment

Updated docs to reflect behavior-first scenario lane and anti-pattern prohibition:

- `README.md`
- `apps/host/README.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-152.md`
- this file (`thoughts/shared/plans/singlepagestartup/ISSUE-152.md`)
