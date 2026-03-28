---
issue_number: 146
issue_title: "Close admin-panel-draft and align with admin implementation + e2e admin lifecycle"
start_date: 2026-03-27T23:36:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-146.md
status: in_progress
---

# Implementation Progress: ISSUE-146 - Close admin-panel-draft and align with admin implementation + e2e admin lifecycle

**Started**: 2026-03-27
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-146.md`

## Notes

- GitHub comments reviewed through 2026-03-27T23:19:51Z. Latest clarification (promote draft to `admin-v2`) is already reflected in the plan.

## Phase Progress

### Phase 1: Rename `admin-panel-draft` to `admin-v2`

- [x] Started: 2026-03-27T23:37:22Z
- [x] Completed: 2026-03-27T23:49:26Z
- [x] Automated verification: PASSED (2026-03-27T23:42:23Z)

**Notes**: Renamed `apps/host/src/components/admin-panel-draft` to `apps/host/src/components/admin-v2`, updated `/admin*` route import, and switched e2e admin root selectors to `admin-v2-body`/`admin-v2-root`. Automated checks passed (`host:next:build`, `host:eslint:lint`; lint has pre-existing warning-only output).

### Phase 2: Apply RBAC Admin-Role Gate to `admin-v2`

- [x] Started: 2026-03-27T23:50:38Z
- [x] Completed: 2026-03-28T00:02:03Z
- [x] Automated verification: PARTIAL (build+lint passed; admin e2e execution skipped per user directive)

**Notes**: Added `admin-v2` RBAC guard wrapper using `authentication-me-default` subject lookup + `roles find` + `subjects-to-roles find` filters (`subjectId`, `roleId`). Guard now wraps all `admin-v2` routes via `index.tsx`, so non-admin/non-auth users cannot render admin-v2 content.

### Phase 3: Finalize Single Admin Ownership in Host Layout

- [x] Started: 2026-03-28T00:07:50Z
- [x] Completed: 2026-03-28T00:10:56Z
- [x] Automated verification: PASSED (2026-03-28T00:10:56Z)

**Notes**: Removed global legacy `<Admin />` mount from `apps/host/app/layout.tsx`. `/admin*` remains route-owned by `apps/host/app/[[...url]]/page.tsx` and `admin-v2`.

### Phase 4: Add `apps/api/delete_rbac_subject.sh`

- [x] Started: 2026-03-28T00:12:51Z
- [x] Completed: 2026-03-28T00:15:24Z
- [x] Automated verification: PARTIAL (script syntax validated; runtime lifecycle checks blocked by missing local API/.env)

**Notes**: Added idempotent `apps/api/delete_rbac_subject.sh` with ordered cleanup of `subjects-to-roles`, `subjects-to-identities`, `identities`, and `subjects` for configured RBAC test identity. Script is executable and re-run safe on missing records (`404` treated as success).

### Phase 5: Update E2E to Use RBAC Lifecycle + Admin-v2 Contracts

- [x] Started: 2026-03-28T00:15:46Z
- [x] Completed: 2026-03-28T00:18:13Z
- [x] Automated verification: SKIPPED (per user instruction to bypass e2e execution in this task)

**Notes**: Added `apps/host/e2e/support/rbac-admin-lifecycle.ts` for RBAC subject provision/authentication/cleanup. Updated `admin-shell.e2e.ts` and `admin-visibility-guards.e2e.ts` to use lifecycle hooks, authenticate admin session, and validate anonymous access denial for `/admin`.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 2 -->

### Incident 1 — E2E execution blocked by environment constraints

- **Occurrences**: 2
- **Stage**: Phase 2 and Phase 5 - admin e2e verification
- **Symptom**: `host:e2e` failed to start in sandbox (`EPERM` bind `127.0.0.1:3000`) and escalated run produced repeated `ENOSPC: no space left on device` during Next.js/webpack cache writes.
- **Root Cause**: Local execution environment limitations (sandbox networking + insufficient writable space during webserver/e2e runtime), not a deterministic app logic failure.
- **Fix**: Switched strategy per user instruction: skip e2e execution for this task and proceed with manual verification by user.
- **Reusable Pattern**: When e2e infrastructure fails due environment resource limits, document the incident, avoid blocking code delivery, and hand off runtime verification to manual checks until environment is stabilized.

### Incident 2 — RBAC lifecycle runtime checks blocked by local API setup

- **Occurrences**: 1
- **Stage**: Phase 4 - Add `apps/api/delete_rbac_subject.sh`
- **Symptom**: `create_rbac_subject.sh` runtime validation failed because `.env` variables were unavailable and API endpoint `http://localhost:4000` was unreachable.
- **Root Cause**: Local runtime prerequisites were not active (`apps/api/.env` + API server), so create/delete scripts could not be executed end-to-end in this session.
- **Fix**: Performed static script validation (`bash -n`) and proceeded with implementation; runtime lifecycle verification delegated to manual execution in a prepared environment.
- **Reusable Pattern**: For lifecycle shell scripts, separate static validation from runtime validation and record missing infra prerequisites explicitly when environment bootstrapping is out of scope.

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

**Last updated**: 2026-03-28T00:18:13Z
