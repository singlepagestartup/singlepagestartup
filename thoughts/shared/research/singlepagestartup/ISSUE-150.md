---
date: 2026-04-04T17:22:13+03:00
researcher: flakecode
git_commit: ca4d7f1ac246ed674b180ee79049e6b5f4b7d542
branch: issue-150
repository: singlepagestartup
topic: "Replace flaky Playwright E2E with module-wide unit+integration test matrix (phased rollout)"
tags: [research, testing, playwright, jest, nx, modules]
status: complete
last_updated: 2026-04-04
last_updated_by: flakecode
---

# Research: Replace flaky Playwright E2E with module-wide unit+integration test matrix (phased rollout)

**Date**: 2026-04-04T17:22:13+03:00
**Researcher**: flakecode
**Git Commit**: ca4d7f1ac246ed674b180ee79049e6b5f4b7d542
**Branch**: issue-150
**Repository**: singlepagestartup

## Research Question

Document the current testing state before implementation for issue #150:

- where Playwright/E2E is currently wired,
- how `test:unit:scoped`, `test:integration:scoped`, and `test:all:scoped` resolve,
- what baseline module coverage exists relative to `libs/modules/*` and backend `configuration.ts` files,
- and what historical context exists for the #147 to #150 direction change.

## Summary

- Playwright E2E is currently active in repo wiring: `host:e2e` target in `apps/host/project.json`, Playwright config in `apps/host/playwright.config.ts`, E2E files in `apps/host/e2e/**`, root scripts `test:e2e:*`, and Playwright dependencies/tooling in `package.json`.
- `test:unit:scoped` runs `jest:test` for 8 projects (`api`, `@sps/ecommerce`, and 6 shared frontend libraries), while `test:integration:scoped` runs `jest:integration` for 2 projects (`api`, `@sps/ecommerce`).
- `test:all:scoped` currently chains unit -> integration -> e2e (`test:e2e:scoped`), and `test:e2e:scoped` aliases `test:e2e:singlepage`.
- Baseline inventory in `libs/modules`: 15 modules, 146 backend `configuration.ts` files, and 17 test files (`*.spec.*`/`*.test.*`) concentrated in `ecommerce` (11) and `rbac` (6).
- Ticket history shows a directional shift: #147 documented a modular Playwright-first E2E direction, while #150 documents replacing Playwright E2E with a module-wide unit+integration matrix and explicitly marks #147 as superseded.

## Detailed Findings

### 1. Current Playwright/E2E footprint

- Root scripts include `test:e2e:singlepage`, `test:e2e:startup`, `test:e2e:scoped`, and include e2e in `test:all:scoped`: `package.json:21`, `package.json:24`, `package.json:26`, `package.json:27`.
- Host e2e Nx target is defined at `apps/host/project.json:45` with executor `@nx/playwright:playwright` (`apps/host/project.json:46`) and config `apps/host/playwright.config.ts` (`apps/host/project.json:49`).
- Playwright config uses `testDir: "./e2e"` and `testMatch: "**/*.e2e.ts"` (`apps/host/playwright.config.ts:21`, `apps/host/playwright.config.ts:22`) and declares both `singlepage` and `startup` Playwright projects (`apps/host/playwright.config.ts:39`, `apps/host/playwright.config.ts:44`).
- Reuse/managed-server gating is environment controlled via `PW_USE_WEBSERVER` / `PW_SKIP_WEBSERVER` (`apps/host/playwright.config.ts:15`, `apps/host/playwright.config.ts:16`).
- E2E TypeScript scope includes e2e trees plus Playwright config (`apps/host/tsconfig.spec.json:4`, `apps/host/tsconfig.spec.json:7`, `apps/host/tsconfig.spec.json:8`, `apps/host/tsconfig.spec.json:9`, `apps/host/tsconfig.spec.json:10`).
- Host ESLint config has a dedicated block for `e2e/**/*.ts` and `playwright.config.ts` (`apps/host/eslint.config.mjs:10`) and excludes those from the general TS lint block (`apps/host/eslint.config.mjs:42`).
- Tooling dependencies are present in root: `@nx/playwright`, `@playwright/test`, `eslint-plugin-playwright` (`package.json:175`, `package.json:180`, `package.json:218`).
- Bootstrap script still installs Playwright Chromium when `node_modules` exists (`up.sh:8`).
- Current E2E spec inventory under `apps/host/e2e/**`: 11 files (10 `singlepage`, 1 `startup` template).

### 2. Current scoped unit/integration/all lanes

- Unit scoped lane:
  - `test:unit:scoped` runs `nx run-many --target=jest:test` with project list: `api`, `@sps/ecommerce`, and 6 shared frontend libraries (`package.json:19`).
- Integration scoped lane:
  - `test:integration:scoped` runs `nx run-many --target=jest:integration --projects=api,@sps/ecommerce` (`package.json:20`).
- All scoped lane:
  - `test:all:scoped` is shell chaining: `test:unit:scoped && test:integration:scoped && test:e2e:scoped` (`package.json:27`).
  - `test:e2e:scoped` aliases `test:e2e:singlepage` (`package.json:26`), which runs `nx run host:e2e -- --project=singlepage` (`package.json:21`).

### 3. Target resolution behavior

- Repo-wide `jest:test` defaults are defined in `nx.json` (`nx.json:47`) with executor `@nx/jest:jest` and `jestConfig: "{projectRoot}/jest.config.ts"`.
- `apps/api` declares `jest:test` and explicit `jest:integration` (`apps/api/project.json:163`, `apps/api/project.json:164`).
- API unit config ignores integration specs (`apps/api/jest.config.ts:4`), while API integration config matches `specs/integration/**/*.spec.ts` (`apps/api/jest.integration.config.ts:5`).
- `@sps/ecommerce` declares `jest:test` and explicit `jest:integration` (`libs/modules/ecommerce/project.json:8`, `libs/modules/ecommerce/project.json:9`).
- Ecommerce unit config ignores integration specs (`libs/modules/ecommerce/jest.config.ts:4`), while ecommerce integration config matches `**/*.integration.spec.ts` (`libs/modules/ecommerce/jest.integration.config.ts:4`).

### 4. Module baseline inventory for #150 scope framing

Measured from current filesystem state:

- `libs/modules` module count: 15
- backend `configuration.ts` count under `libs/modules`: 146
- test file count under `libs/modules` (`*.spec.ts`, `*.spec.tsx`, `*.test.ts`, `*.test.tsx`): 17

Per-module summary (`module | configuration.ts | test files`):

- `agent | 2 | 0`
- `analytic | 2 | 0`
- `billing | 6 | 0`
- `blog | 10 | 0`
- `broadcast | 3 | 0`
- `crm | 13 | 0`
- `ecommerce | 26 | 11`
- `file-storage | 3 | 0`
- `host | 9 | 0`
- `notification | 6 | 0`
- `rbac | 19 | 6`
- `social | 22 | 0`
- `startup | 1 | 0`
- `telegram | 4 | 0`
- `website-builder | 20 | 0`

Configuration spec files (`configuration.spec.ts`) currently present only in ecommerce:

- `libs/modules/ecommerce/models/attribute/backend/app/api/src/lib/configuration.spec.ts`
- `libs/modules/ecommerce/models/product/backend/app/api/src/lib/configuration.spec.ts`
- `libs/modules/ecommerce/relations/products-to-attributes/backend/app/api/src/lib/configuration.spec.ts`

### 5. Issue-link and timeline context (#147 -> #150)

- #150 ticket defines the direction as replacing Playwright E2E with module-wide unit+integration and includes acceptance criterion that #147 be marked superseded (`thoughts/shared/tickets/singlepagestartup/ISSUE-150.md:1`, `thoughts/shared/tickets/singlepagestartup/ISSUE-150.md:49`).
- The same ticket records baseline facts used by this research: 15 modules, 146 configuration files, and current integration lane covering `api` + `ecommerce` (`thoughts/shared/tickets/singlepagestartup/ISSUE-150.md:22`, `thoughts/shared/tickets/singlepagestartup/ISSUE-150.md:23`, `thoughts/shared/tickets/singlepagestartup/ISSUE-150.md:24`).
- #147 ticket documents the prior direction: backend-independent frontend E2E, module-local mocks, and Playwright-first testing order (`thoughts/shared/tickets/singlepagestartup/ISSUE-147.md:17`, `thoughts/shared/tickets/singlepagestartup/ISSUE-147.md:18`, `thoughts/shared/tickets/singlepagestartup/ISSUE-147.md:19`, `thoughts/shared/tickets/singlepagestartup/ISSUE-147.md:27`).
- GitHub issue #147 comments (2026-03-28 through 2026-04-02) reference `ISSUE-147` research/plan artifacts in `thoughts/shared/research/...` and `thoughts/shared/plans/...`; those exact files are not present in this repository snapshot.

## Code References

- `package.json:19`
- `package.json:20`
- `package.json:21`
- `package.json:24`
- `package.json:26`
- `package.json:27`
- `package.json:175`
- `package.json:180`
- `package.json:218`
- `nx.json:47`
- `apps/host/project.json:45`
- `apps/host/project.json:46`
- `apps/host/project.json:49`
- `apps/host/playwright.config.ts:15`
- `apps/host/playwright.config.ts:16`
- `apps/host/playwright.config.ts:21`
- `apps/host/playwright.config.ts:22`
- `apps/host/playwright.config.ts:39`
- `apps/host/playwright.config.ts:44`
- `apps/host/tsconfig.spec.json:4`
- `apps/host/tsconfig.spec.json:7`
- `apps/host/tsconfig.spec.json:8`
- `apps/host/tsconfig.spec.json:9`
- `apps/host/tsconfig.spec.json:10`
- `apps/host/eslint.config.mjs:10`
- `apps/host/eslint.config.mjs:42`
- `up.sh:8`
- `apps/api/project.json:163`
- `apps/api/project.json:164`
- `apps/api/jest.config.ts:4`
- `apps/api/jest.integration.config.ts:5`
- `libs/modules/ecommerce/project.json:8`
- `libs/modules/ecommerce/project.json:9`
- `libs/modules/ecommerce/jest.config.ts:4`
- `libs/modules/ecommerce/jest.integration.config.ts:4`
- `thoughts/shared/tickets/singlepagestartup/ISSUE-150.md:1`
- `thoughts/shared/tickets/singlepagestartup/ISSUE-150.md:22`
- `thoughts/shared/tickets/singlepagestartup/ISSUE-150.md:23`
- `thoughts/shared/tickets/singlepagestartup/ISSUE-150.md:24`
- `thoughts/shared/tickets/singlepagestartup/ISSUE-150.md:49`
- `thoughts/shared/tickets/singlepagestartup/ISSUE-147.md:17`
- `thoughts/shared/tickets/singlepagestartup/ISSUE-147.md:18`
- `thoughts/shared/tickets/singlepagestartup/ISSUE-147.md:19`
- `thoughts/shared/tickets/singlepagestartup/ISSUE-147.md:27`

## Architecture Documentation

Current testing architecture is lane-separated and script-driven:

- Unit lane is centered on `jest:test` with Nx target defaults (`nx.json:47`) and explicit scoped project selection (`package.json:19`).
- Integration lane is explicit per project (`apps/api/project.json:164`, `libs/modules/ecommerce/project.json:9`) and called through scoped run-many (`package.json:20`).
- E2E lane is Playwright-backed via `host:e2e` (`apps/host/project.json:45`) and currently included in `test:all:scoped` via alias chaining (`package.json:27`).
- Host Playwright structure is ownership-partitioned in config (`singlepage` vs `startup`) and path layout (`apps/host/playwright.config.ts:39`, `apps/host/playwright.config.ts:44`).

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/2026-03-01-testing-framework-variant2-scoped.md` documents a scoped Variant 2 direction with `unit + integration + e2e` and shared-first leverage (`...:5`).
- `thoughts/shared/plans/singlepagestartup/2026-03-01-testing-framework-variant2-scoped-plan.md` records the same execution model and includes `test:unit:scoped` in planned scripts (`...:5`, `...:66`).
- `thoughts/shared/plans/singlepagestartup/2026-03-02-integration-e2e-modular-rollout.md` records the modular rollout where all three lanes run in scoped mode and e2e is partitioned by `singlepage` / `startup` (`...:5`, `...:38`, `...:64`, `...:65`, `...:132`).
- `thoughts/shared/research/singlepagestartup/ISSUE-146.md` records adjacent admin/e2e lifecycle context and existing e2e wiring at that point.
- `thoughts/shared/tickets/singlepagestartup/ISSUE-147.md` and `ISSUE-150.md` capture the explicit directional change from modular Playwright E2E to unit+integration-only target direction.

## Related Research

- `thoughts/shared/research/singlepagestartup/2026-03-01-testing-framework-variant2-scoped.md`
- `thoughts/shared/plans/singlepagestartup/2026-03-01-testing-framework-variant2-scoped-plan.md`
- `thoughts/shared/plans/singlepagestartup/2026-03-02-integration-e2e-modular-rollout.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-146.md`
- `thoughts/shared/tickets/singlepagestartup/ISSUE-147.md`
- `thoughts/shared/tickets/singlepagestartup/ISSUE-150.md`

## Open Questions

- GitHub issue #147 comments reference `thoughts/shared/research/singlepagestartup/ISSUE-147.md` and `thoughts/shared/plans/singlepagestartup/ISSUE-147.md`; those exact paths are absent in the current repository snapshot.
