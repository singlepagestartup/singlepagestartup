# Issue: Replace flaky Playwright E2E with module-wide unit+integration test matrix (phased rollout)

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/150
**Issue**: #150
**Status**: Research Needed
**Created**: 2026-04-04
**Priority**: high
**Size**: large
**Type**: refactoring

---

## Problem to Solve

Current Playwright tests in `apps/host/e2e` are flaky and expensive to maintain.
We need stable, modular, backend-aligned automated checks for every SPS module using unit and integration tests only.

## Key Details

- Repository has 15 business modules under `libs/modules/*`.
- There are 146 backend entity/relation configurations (`configuration.ts`) with very limited test coverage.
- Integration lane currently covers only `api` and `ecommerce`.
- Existing E2E stack (`host:e2e`, Playwright config/tests/scripts/deps) should be fully removed.

## Implementation Notes

### Scope

1. Fully remove Playwright E2E infrastructure.
2. Build integration baseline for all modules.
3. Build unit contract baseline for all modules.
4. Update scripts/docs so official scoped pipeline is unit+integration only.

### Public Interface Changes

- Remove npm scripts: `test:e2e:*`, remove e2e from `test:all:scoped`.
- Remove Nx target `host:e2e` and Playwright config wiring.
- Keep/extend only `test:unit:scoped` and `test:integration:scoped`.

### Acceptance Criteria

- [ ] No active Playwright artifacts remain (`apps/host/e2e/**`, `apps/host/playwright.config.ts`, Playwright deps/plugins/scripts).
- [ ] Every module has integration contract coverage in scoped integration lane.
- [ ] Every module has initial unit contract coverage (BDD format required).
- [ ] `npm run test:unit:scoped` and `npm run test:integration:scoped` pass.
- [ ] `npm run test:all:scoped` no longer depends on E2E.
- [ ] Issue #147 is marked as superseded by this direction.

### Phased Plan

#### Phase 1

Remove Playwright targets/scripts/deps/docs.

#### Phase 2

Add module-level integration contracts for all modules (mounting + routes/type registry consistency).

#### Phase 3

Add module-level unit contract tests (configuration/SDK contracts) for all modules.

#### Phase 4

Expand from baseline to deeper per-entity coverage in follow-up linked issues if needed.
