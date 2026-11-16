---
issue_number: 407
start_date: 2026-11-16T08:16:54Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-407.md
status: complete
completed_date: 2026-11-16
---

# Implementation Progress #407

## Phase Progress

- Review follow-up: implement Repeat order to replace the selected profile's cart from history, preserving original payment records. User authorized this fallback for another payment attempt. Studio, API, SDK and UI are implemented and verified. Commit `39443d8d15` is in PR #408, and Code Review is verified.

- Studio: implemented. Storybook build and browser switching verified.
- Schema: implemented. Generated migrations applied and Consistency check passed.
- Backend: implemented. Checkout claims and guest registration share the ownership-transfer locks.
- Frontend: implemented. Selection, cache and checkout draft tests pass.
- Verification: completed. Baseline repository failures are recorded below.

## Incident Log

<!-- incident-count: 12 -->

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

### Incident 6 — CLI outside project defaults

- Occurrences: 3
- Stage: CLI and integration subprocesses
- Symptom: System Bun 1.3.6 fails on Undici; temporary CLI lacks DI metadata.
- Root Cause: Commands outside npm omit the project runtime and tsconfig.
- Fix: Use project Bun 1.4.4, prepend node_modules/.bin to PATH, and supply --tsconfig-override tsconfig.base.json for temporary scripts.
- Reusable Pattern: Keep subprocesses on the same project runtime and compiler settings.

### Incident 7 — Currency membership misses checkout constraints

- Occurrences: 1
- Stage: Backend review
- Symptom: A source can have a currency but incompatible current product types or prices.
- Root Cause: The currency resolver does not implement the full checkout contract.
- Fix: Validate checkout attributes before deleting any cart.
- Reusable Pattern: Use the owning checkout capability for purchase preflight.

### Incident 8 — Failed intent may receive a late invoice

- Occurrences: 1
- Stage: Backend review
- Symptom: Deleting a cart with a failed intent can detach a later payment.
- Root Cause: Failed is not a durable cancellation in Billing.
- Fix: Reject replacement of any cart with an existing payment link.
- Reusable Pattern: Keep payment graphs until Billing permanently prevents future payment.

### Incident 9 — Absent CRUD rows return undefined

- Occurrences: 1
- Stage: Integration verification
- Symptom: Deletion assertions expected null and received undefined.
- Root Cause: The fixture assumed the wrong findById contract.
- Fix: Assert undefined for deleted records.
- Reusable Pattern: Check the owning repository return value.

### Incident 10 — Missing JWT is a validation response

- Occurrences: 1
- Stage: API scenario
- Symptom: The scenario expected 401; owner middleware returned 400.
- Root Cause: The established middleware reports a missing token as Validation error.
- Fix: Assert the actual 400 response and a separate 403 for foreign-profile access.
- Reusable Pattern: Read the owning middleware before fixing HTTP expectations.

### Incident 11 — Late checkout redirects after profile change

- Occurrences: 1
- Stage: Final frontend review
- Symptom: An old payment response can redirect a new active profile.
- Root Cause: The checkout callback outlives its originating form.
- Fix: Guard redirects, payment links and inline errors by form lifecycle and Subject/profile scope; five delayed-response regressions pass.
- Reusable Pattern: Check async side effects as well as cache scope.

### Incident 12 — Empty fixture accumulator inferred never

- Occurrences: 1
- Stage: TypeScript verification
- Symptom: Integration assertions cannot access Order fields on inferred never.
- Root Cause: An empty untyped array in profileOrders infers never[].
- Fix: Annotate the accumulator and result with the owning Order IModel.
- Reusable Pattern: Use explicit result types for fixture accumulators.

## Verification

### Review follow-up verification

- Studio: observed confirmation, pending row and success with Open cart at localhost:6007. Focused production UI tests and real API scenarios passed.
- Permission: added through SDK and exported through the owning standard dump; one new route snapshot.
- Focused RBAC units/SDK/UI: 5 suites, 52 tests passed. Ecommerce purchase row: 13 tests passed. Studio projection: 2 tests passed.
- Full RBAC PostgreSQL integration: 14 suites, 53 tests passed. Real API #407: 2 tests passed with HTTP cache enabled.
- Checkout/history guard regression: 3 suites, 24 tests passed. ESLint: 30 changed TypeScript files passed. TypeScript: 60 unchanged baseline diagnostics, zero new or changed-file errors. Module dependencies and code placement passed.

### Initial implementation verification

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
History can replace the profile cart for a fresh checkout while preserving the original payment. Late checkout responses do not redirect a newly selected profile.
GPT-6.1 Sol agents use xhigh effort.

## Pull Request

[PR #408](https://github.com/singlepagestartup/singlepagestartup/pull/408). Issue status verified as Code Review.

**Last updated**: 2026-11-16T11:59:39Z

## Final Status

Implementation submitted for review. Baseline repository failures and manual external-provider checks remain visible in the PR.
