---
issue_number: 150
issue_title: "Replace flaky Playwright E2E with module-wide unit+integration test matrix (phased rollout)"
start_date: 2026-04-04T15:01:09Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-150.md
status: in_progress
---

# Implementation Progress: ISSUE-150 - Replace flaky Playwright E2E with module-wide unit+integration test matrix (phased rollout)

**Started**: 2026-04-04
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-150.md`

## Phase Progress

### Phase 1: Decommission Active Playwright E2E Infrastructure

- [x] Started: 2026-04-04T15:01:44Z
- [ ] Completed: —
- [x] Automated verification: PASSED (`npm run lint`, `npm run test:unit:scoped`, `npm run test:integration:scoped`, `npm run test:all:scoped`)

**Notes**: Synced issue comments before implementation; no new scope-changing comments since plan publication.

### Phase 2: Build Module-Wide Integration Baseline

- [ ] Started: —
- [ ] Completed: —
- [ ] Automated verification: —

**Notes**: —

### Phase 3: Build Module-Wide Unit Contract Baseline

- [ ] Started: —
- [ ] Completed: —
- [ ] Automated verification: —

**Notes**: —

### Phase 4: Finalize Scoped Pipeline and Supersession Governance

- [ ] Started: —
- [ ] Completed: —
- [ ] Automated verification: —

**Notes**: —

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 3 -->

### Incident 1 — Nx daemon lint worker bootstrap failure

- **Occurrences**: 1
- **Stage**: Phase 1 - Decommission Active Playwright E2E Infrastructure
- **Symptom**: `npm run lint` failed with `Nx Daemon was not able to compute the project graph` and `Failed to start plugin worker`.
- **Root Cause**: Default lint script runs with Nx daemon enabled; daemon/plugin worker startup was unstable in this session.
- **Fix**: Re-ran lint without daemon using `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run-many --target=eslint:lint --parallel=2 --all`.
- **Reusable Pattern**: For flaky daemon startup in local automation, rerun Nx commands with `NX_DAEMON=false NX_ISOLATE_PLUGINS=false` to avoid daemon/plugin boot failures.

### Incident 2 — Outdated ecommerce overview spec mock path

- **Occurrences**: 1
- **Stage**: Phase 1 - Decommission Active Playwright E2E Infrastructure
- **Symptom**: `npm run test:unit:scoped` failed with `Cannot find module '../registry'` in `overview/Component.spec.tsx`.
- **Root Cause**: The spec still mocked a removed `../registry` module while production component now imports concrete overview model components (`./product`, `./attribute`, etc.).
- **Fix**: Rewrote the spec mocks to target current imports and validate card/table rendering behavior per variant.
- **Reusable Pattern**: Keep unit tests aligned to the component's real import graph after refactors; stale mock module paths should be updated immediately when files are consolidated/split.

### Incident 3 — Eslint/prettier contract mismatch after test refactor

- **Occurrences**: 1
- **Stage**: Phase 1 - Decommission Active Playwright E2E Infrastructure
- **Symptom**: `npm run lint` failed in `overview/Component.spec.tsx` with `prettier/prettier` errors and quote-style warnings.
- **Root Cause**: Manual test rewrite introduced formatting that did not match repository prettier/eslint conventions.
- **Fix**: Ran `npx prettier --write libs/modules/ecommerce/frontend/component/src/lib/admin-v2/overview/Component.spec.tsx` and re-ran lint.
- **Reusable Pattern**: After manual test refactors, run formatter on touched files before full lint to avoid avoidable style-gate failures.

## Summary

### Changes Made

- (populated during implementation)

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [ ] All phases completed
- [ ] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-04-04T15:17:18Z
