# Issue: Modular E2E testing infrastructure with backend-independent frontend tests

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/147
**Status**: Research Needed
**Created**: 2026-03-28
**Priority**: high
**Size**: large

---

## Problem to Solve

The project currently has almost no automated tests. Manual verification is time-consuming and error-prone. We need a modular E2E testing infrastructure that:

1. Allows frontend E2E tests to run **without a backend** (isolated environment).
2. Co-locates mock data and fixtures **inside modules** (`libs/modules/<module>/`) instead of in test-specific folders (e.g., `apps/host/e2e/support/mock-agent-api.ts`).
3. Follows a top-down testing strategy — E2E first, then unit tests later.

## Key Details

- The project is modular: business logic lives in `libs/modules/<module>/`.
- Pages are assembled from backend data via `@libs/modules/host/` — this assembly must be mockable so frontend tests don't need a running API server.
- Existing mock pattern (`apps/host/e2e/support/mock-agent-api.ts`) should be replaced with module-level mocks.
- Tests should cover the functionality that is currently verified manually.
- Test runner: Playwright (already used for existing E2E tests in `apps/host/e2e/`).

## Implementation Notes

- Mock data/fixtures should be exported from each module (e.g., `libs/modules/<module>/models/<model>/mock/` or similar).
- The host page assembly pipeline (`@libs/modules/host/`) needs a mock layer so pages can be rendered in tests without API calls.
- Consider MSW (Mock Service Worker) or Playwright route interception for API mocking.
- E2E test structure should mirror module structure for discoverability.
- Must work in CI (isolated environment, no Docker/backend dependency for frontend tests).
