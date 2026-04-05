# Scenario Test Namespacing

Scenario suites are organized by two levels:

1. Project namespace (first-level directory)
2. Issue scope (second-level directory)

Directory convention:

```text
apps/api/specs/scenario/
  singlepagestartup/
    issue-152/
      *.scenario.spec.ts(x)
      test-utils/
  startup/
    issue-<number>/
      *.scenario.spec.ts(x)
```

## Why this structure

GitHub Project workflow and `thoughts/shared/{research,plans}/...` are namespaced by project/repository context. Scenario tests must follow the same separation so issue-level suites do not mix across product lines.

## Cache behavior in scenarios

- Scenario lane runs with HTTP cache middleware enabled (`MIDDLEWARE_HTTP_CACHE=true` by default in scenario runner).
- ISSUE-152 temporary stabilization excludes only:
  - `GET /api/rbac/subjects/:id/ecommerce-module/orders/quantity`
  - `GET /api/rbac/subjects/:id/ecommerce-module/orders/total`
- Other endpoints remain cacheable and are validated by scenario tests.

## Frontend scenario component wiring

- Scenario frontend specs must import UI modules/relations through public package entrypoints (for example `@sps/.../frontend/component`).
- Test behavior is selected via `variant` props, matching real product composition.
- Scenario frontend tests must render real product components and exercise real SDK/API behavior; fake harness components are not allowed for primary behavior assertions.
- Deep imports from `src/lib/...` are not allowed as direct test imports for scenario behavior coverage.
- If a variant is served by a nested router, use a local `jest.mock(...)` adapter that keeps the public import contract and delegates to the nested router implementation.

## Naming rules

- Project folder: `singlepagestartup` or `startup`.
- Issue folder: `issue-<number>` (lowercase).
- Scenario spec files: `*.scenario.spec.ts` / `*.scenario.spec.tsx`.

## Run commands

- Run all issue scenarios for one project namespace:

```bash
SCENARIO_PROJECT_NAMESPACE=singlepagestartup npm run test:scenario
```

- Run one issue scenario suite:

```bash
npm run test:scenario:issue -- singlepagestartup 152
npm run test:scenario:issue -- startup 200
```

- Backward-compatible wrapper for ISSUE-152:

```bash
npm run test:scenario:issue-152
```
