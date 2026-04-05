---
date: 2026-04-05T18:10:00+03:00
researcher: codex
repository: singlepagestartup
topic: "ISSUE-152 migration from mock-oriented tests to DB-backed Jest scenarios"
tags: [research, testing, scenario, jest, rbac, ecommerce, cart]
status: complete
last_updated: 2026-04-05
last_updated_by: codex
---

# Research: ISSUE-152 DB-backed scenario testing

## Research Question

How to replace ISSUE-152 cart/product mock-oriented tests with behavior-first Jest scenarios that validate real API + database side effects (without Playwright), while preserving deterministic setup/cleanup and fixed RBAC credentials from `apps/api/.env`.

## Summary

- The previous ISSUE-152 scope relied mostly on mocked unit/contract specs; those do not guarantee real cart lifecycle behavior in DB.
- Repository already had required primitives for scenario orchestration:
  - Docker bootstrap + migrations: `./up.sh`
  - fixed RBAC subject scripts: `apps/api/create_rbac_subject.sh`, `apps/api/delete_rbac_subject.sh`
  - DB access via drizzle provider: `@sps/providers-db`.
- Cart behavior can be tested end-to-end with real API calls through:
  - `POST /api/rbac/subjects/:id/ecommerce-module/orders`
  - `GET /api/rbac/subjects/:id/ecommerce-module/orders`
  - `GET /api/rbac/subjects/:id/ecommerce-module/orders/quantity`
    and DB verification in `orders`, `orders-to-products`, `subjects-to-ecommerce-module-orders`.
- Frontend behavior can be validated in Jest + jsdom by triggering `Add to cart` through real component render and then asserting quantity render state from API-backed component.

## Key Findings

### 1) Existing scope had mock-heavy tests

- Controller tests for `create/list/quantity` were mock-based.
- Frontend specs for cart/create/quantity behavior were mock-based.
- API route contract integration was route-mount/method focused, not runtime data behavior.

### 2) Required auth/env contract already exists

- `apps/api/.env` provides:
  - `RBAC_SUBJECT_IDENTITY_EMAIL`
  - `RBAC_SUBJECT_IDENTITY_PASSWORD`
  - `RBAC_SECRET_KEY`
  - `API_SERVICE_URL`.
- Existing helper scripts already implement fixed user lifecycle against live API.

### 3) DB-backed verification is feasible and deterministic

- Order and relation tables expose stable schema for assertions:
  - `@sps/ecommerce/models/order/backend/repository/database`
  - `@sps/ecommerce/relations/orders-to-products/backend/repository/database`
  - `@sps/rbac/relations/subjects-to-ecommerce-module-orders/backend/repository/database`.
- Fixture entities can be created/deleted via API with `X-RBAC-SECRET-KEY`, allowing full cleanup after tests.

## Decision

Adopt dedicated scenario lane for ISSUE-152 and treat it as blocking in scoped pipeline:

- `npm run test:scenario`
- `npm run test:scenario:issue -- <project-namespace> <issue-number>`
- `npm run test:scenario:issue-152`
- `npm run test:all:scoped` now includes scenario execution.

Scenario folder convention is aligned with project namespacing used by `thoughts/shared/*` and GitHub Project workflow:

- `apps/api/specs/scenario/singlepagestartup/issue-<number>/...`
- `apps/api/specs/scenario/startup/issue-<number>/...`

## Risks and Mitigations

- Risk: scenario runtime is slower than mock unit tests.
  - Mitigation: run only issue-scoped scenario suite and enforce `runInBand`.
- Risk: data pollution across reruns with fixed user.
  - Mitigation: explicit order cleanup per test + fixture cleanup + subject teardown in wrapper script.
- Risk: infrastructure flake.
  - Mitigation: wrapper script bootstraps infra/API and waits for readiness before running Jest.

## Update: Cart Badge Stale Quantity (2026-04-06)

- Observed production-like behavior:
  - `POST /api/rbac/subjects/:id/ecommerce-module/orders` persists cart data.
  - Cart sheet (order list) shows item.
  - Navbar badge (quantity route) can stay stale, including after refresh.
- Root cause:
  - HTTP cache middleware stores GET by exact path key.
  - Mutation cache-bump did not reliably refresh the exact `.../orders/quantity` cache key.
  - Result: `GET .../orders/quantity` could return stale cached value while `GET .../orders` reflected new data.
- Temporary stabilization decision (issue-152 scope):
  - Exclude from HTTP cache:
    - `GET /api/rbac/subjects/:id/ecommerce-module/orders/quantity`
    - `GET /api/rbac/subjects/:id/ecommerce-module/orders/total`
  - Keep HTTP cache enabled for other routes and verify this in scenario tests.

## Updated Sources of Truth

- Scenario Jest config: `apps/api/jest.scenario.config.ts`
- Scenario wrappers: `tools/testing/test-scenario.sh`, `tools/testing/test-scenario-issue.sh`, `tools/testing/test-scenario-issue-152.sh`
- Scenario tests:
  - `apps/api/specs/scenario/singlepagestartup/issue-152/backend-cart.scenario.spec.ts`
  - `apps/api/specs/scenario/singlepagestartup/issue-152/frontend-cart.scenario.spec.tsx`
