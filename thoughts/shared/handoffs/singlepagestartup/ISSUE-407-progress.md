---
issue_number: 407
start_date: 2026-11-16T08:16:54Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-407.md
status: in_progress
---

# Implementation Progress #407

## Phase Progress

- Studio: implemented. Storybook build and browser switching verified.
- Schema: implemented. Generated migrations applied and Consistency check passed.
- Backend: implemented. Checkout claims and guest registration share the ownership-transfer locks.
- Frontend: implemented. Selection, cache and checkout draft tests pass.
- Verification: completed. Baseline repository failures are recorded below.

## Incident Log

<!-- incident-count: 5 -->

### Incident 1 — Static ensure route intercepted by profile middleware

- Occurrences: 1
- Stage: API scenario
- Symptom: POST profiles/ensure attempted a UUID lookup for the word ensure.
- Root Cause: the parameterized profile middleware registered first.
- Fix: register the static operation before profile parameter routes.
- Reusable Pattern: test static child operations through actual mounted routing.

### Incident 2 — Guest reads tried to create data inside a snapshot

- Occurrences: 1
- Stage: Backend review
- Symptom: a guest without a profile could enter a write from a read-only cart snapshot.
- Root Cause: profile resolution always ensured a missing personal profile.
- Fix: empty guest reads return empty data. Only create operations ensure a profile.
- Reusable Pattern: distinguish read resolution from first-write initialization.

### Incident 3 — Local validation needs network access

- Occurrences: 3
- Stage: Schema and integration verification
- Symptom: sandbox refused local PostgreSQL or temporary HTTP listeners.
- Root Cause: sandbox networking restrictions.
- Fix: rerun the same scoped commands with elevated access.
- Reusable Pattern: preserve the target and rerun the failed local check.

### Incident 4 — Baseline validation failures

- Occurrences: 1
- Stage: Final verification
- Symptom: three existing Admin permission snapshot assertions fail. Studio aggregate validation reaches an existing duplicate-instructions check failure.
- Root Cause: baseline snapshots lack Admin links for GET ecommerce/orders, social/messages/count and notification/templates/count. The tooling also reports eleven duplicated instruction sentences.
- Fix: keep those outcomes visible in the PR. Relevant new test failures have been repaired.
- Reusable Pattern: compare unchanged seed records with HEAD before attributing a baseline failure to this change.

### Incident 5 — Cart checkout and guest upgrade needed shared locks

- Occurrences: 1
- Stage: Final review
- Symptom: checkout could overlap cart transfer, or identity attachment could overlap a guest-only transfer.
- Root Cause: the new merge lock was not shared by the existing checkout and registration paths.
- Fix: implement transactional checkout claim and transactional guest registration using owning services. Barrier integration tests and 34 focused authentication tests passed.
- Reusable Pattern: identify every writer participating in a new ownership transfer.

## Verification

- RBAC units: 229 suites passed and 1 baseline suite failed. 1340 tests passed. Three existing Admin snapshot assertions failed.
- RBAC PostgreSQL integration: 13 suites, 38 tests passed, including both checkout/merge race orderings.
- Social PostgreSQL integration: 4 suites, 6 tests passed, including unique order ownership and restricted profile deletion.
- Real API scenario #407: passed with HTTP cache enabled.
- Focused authentication/Identity checks: 4 suites, 34 tests passed.
- Agent Telegram checkout: 3 tests passed.
- Studio: Storybook build passed, 155 design-system tests and 5 record tests passed. Aggregate validation fails in the existing agents:duplicates:check with eleven duplicated sentences.
- TypeScript: 60 diagnostics remain in unchanged source files. No diagnostic points at a changed file.
- ESLint: all changed TypeScript files verified after duplicate import repair.
- Module dependency audit: zero violations.
- Code placement audit: passed.
- Browser: additional profiles appear below Sign out, switching changes the active name, and the single-profile menu has no switch section.
- Payment provider and Telegram provider manual checks: pending reviewer.

## Summary

Orders now belong to Social profiles. The menu selects existing profiles in per-account session storage.
Guest carts merge automatically by product with the most recent added line winning.
Payment Intents retain the original buyer for subsequent fulfilment.
GPT-6.1 Sol agents use xhigh effort.

## Pull Request

Pending.

**Last updated**: 2026-11-16T10:19:52Z
