---
issue_number: 211
issue_title: "Telegram bootstrap race creates duplicate RBAC grants and breaks message processing"
start_date: 2026-07-20T19:50:04Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-211.md
status: in_progress
---

# Implementation Progress: ISSUE-211 - Telegram bootstrap race creates duplicate RBAC grants and breaks message processing

**Started**: 2026-07-20
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-211.md`

## Phase Progress

### Phase 1: Transactional RBAC Repair and Natural-Key Constraints

- [x] Started: 2026-07-20T19:50:04Z
- [x] Completed: 2026-07-20T20:10:00Z
- [x] Automated verification: repository typecheck, constraint contract, transactional repair integration, generated migrations, local migration apply, and all three PostgreSQL duplicate rejections passed.

**Notes**: The approved review clarification requires `constraints/singlepage -> startup -> index` composition in each repository. Startup may extend the parent constraints; changing a natural key requires coordinated fields, service filters, repair, and migration changes. The local database contained no pre-existing duplicate groups. Generated migrations created all three named unique indexes, and transaction-scoped duplicate inserts returned PostgreSQL `23505` for each constraint.

### Phase 2: Concurrent Knowledge Grant Provisioning

- [x] Started: 2026-07-20T20:10:00Z
- [x] Completed: 2026-07-20T20:25:00Z
- [x] Automated verification: losing-insert and unrelated-error unit coverage, repository typecheck, real concurrent PostgreSQL integration, idempotent third ensure, and zero-duplicate repair check passed.

**Notes**: Two simultaneous repository-backed `ensure()` calls converged on the same role, fourteen permissions, fourteen role-permission rows, and one subject-role row. Test-owned rows are removed transactionally in `finally`.

### Phase 3: Cross-Process Subscription Idempotency and Telegram Checkout Routing

- [x] Started: 2026-07-20T20:25:00Z
- [x] Completed: 2026-07-20T20:31:00Z
- [x] Automated verification: cross-session advisory-lock integration, concurrent checkout unit coverage, Telegram routing tests, and concurrent topic/start background coverage passed.

**Notes**: Equal subject keys serialize across PostgreSQL sessions; different users remain concurrent. All subscription/order reads now run inside the lock. Telegram calls checkout only for bootstrap decisions that require it.

### Phase 4: Correlated Diagnostics, Documentation, and End-to-End Verification

- [x] Started: 2026-07-20T20:31:00Z
- [x] Completed: 2026-07-20T20:35:52Z
- [x] Automated verification: shared-utils tests/typecheck, shared database lock integration/typecheck, RBAC unit/integration/typecheck, Telegram tests/build, three scoped lint targets, and final zero-duplicate database check passed.

**Notes**: `responsePipe` retains API request ids in browser and server errors. Telegram replies contain only a safe external request id or generated local UUID; structured logs contain label/status/type/reference and exclude the raw downstream message. Documentation now covers natural keys, startup composition, repair rollout, fourteen Knowledge permissions, and the advisory-lock boundary. Live Telegram verification is intentionally left to the user at Code Review as requested.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 2 -->

### Incident 1 — Existing OpenRouter attachment test depends on local API URL

- **Occurrences**: 1
- **Stage**: Phase 1 - Transactional RBAC Repair and Natural-Key Constraints
- **Symptom**: Full `@sps/rbac:jest:test` had one unrelated failure because the fixture expected `http://localhost:4000` while `apps/api/.env` resolved the configured remote API host.
- **Root Cause**: The pre-existing attachment-content assertion hard-codes one environment URL instead of deriving the expected public file URL from the configured service URL.
- **Fix**: Updated the fixture to derive its expected public origin from `NEXT_PUBLIC_API_SERVICE_URL`; the final full RBAC suite passes under the configured environment.
- **Reusable Pattern**: Assertions for generated public URLs must derive their origin from the same configuration contract as production code.

### Incident 2 — Parallel Drizzle generators contend during the metadata upgrade step

- **Occurrences**: 1
- **Stage**: Phase 1 - Transactional RBAC Repair and Natural-Key Constraints
- **Symptom**: Three independent scoped `repository-generate` targets launched concurrently all exited during `drizzle-kit up` without diagnostics.
- **Root Cause**: The Drizzle metadata upgrade command is not safe to run concurrently in this workspace even when the migration directories differ.
- **Fix**: Re-ran the same required Nx targets sequentially; each upgrade and generation completed normally.
- **Reusable Pattern**: Run repository migration generators sequentially because their preliminary Drizzle metadata upgrade step may contend.

## Summary

### Changes Made

- Added startup-composable database natural keys and generated migrations for permission and grant relations.
- Added transactional duplicate repair/check commands and true PostgreSQL concurrency coverage.
- Added reusable PostgreSQL advisory locks and idempotent free-subscription provisioning.
- Made Telegram obey the bootstrap checkout decision and emit correlation-safe errors.
- Preserved request ids through `responsePipe` and documented rollout/invariants.

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-07-20T20:35:52Z
