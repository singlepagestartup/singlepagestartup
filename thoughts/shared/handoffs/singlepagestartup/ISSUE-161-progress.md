---
issue_number: 161
issue_title: "Fix Website Builder buttons-array admin route showing Button table"
start_date: 2026-04-18T00:18:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-161.md
status: in_progress
---

# Implementation Progress: ISSUE-161 - Fix Website Builder buttons-array admin route showing Button table

**Started**: 2026-04-18
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-161.md`

## Phase Progress

### Phase 1: Build Shared Exact Model-Route Matching And Lock In The Audit Scope

- [x] Started: 2026-04-18T00:18:00Z
- [x] Completed: 2026-04-18T00:28:00Z
- [x] Automated verification: PASSED — `npx nx run @sps/shared-frontend-client-utils:jest:test`, `npx nx run @sps/shared-frontend-client-utils:eslint:lint`

**Notes**: Issue comments synced through 2026-04-18T00:33:26Z. No post-plan scope changes were found beyond the approved plan update already captured in the plan artifact. Added and exported shared `isAdminRoute(...)` on top of the existing admin-route parser so module-level and module/model checks can use the same matcher instead of raw string prefixes.

### Phase 2: Migrate All Confirmed Collision Pairs To The Shared Matcher

- [x] Started: 2026-04-18T00:28:00Z
- [x] Completed: 2026-04-18T00:40:00Z
- [x] Automated verification: PASSED — `npx nx run @sps/website-builder:jest:test`, `npx nx run @sps/ecommerce:jest:test`, `npx nx run @sps/social:jest:test`, `npx nx run @sps/website-builder:eslint:lint`, `npx nx run @sps/ecommerce:eslint:lint`, `npx nx run @sps/social:eslint:lint`

**Notes**: Follow-up manual review expanded this from collision-only wrappers to a full standardization pass. Migrated admin-v2 overview/sidebar route gates across all affected modules from `startsWith(...)` checks to the shared matcher so module groups and model wrappers use the same contract everywhere.

### Phase 3: Add Regression Coverage For Current And Future Prefix Collisions

- [x] Started: 2026-04-18T00:40:00Z
- [x] Completed: 2026-04-18T01:20:07Z
- [x] Automated verification: PASSED — shared admin-route regression tests plus Website Builder, Ecommerce, and Social overview regression specs

**Notes**: Added Website Builder and Social overview jsdom specs, and extended the Ecommerce overview spec so exact-match regression coverage protects both the original `button`/`buttons-array` bug and the `attribute`/`attribute-key` collision family.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 1 -->

### Incident 1 — Overview regression specs needed selective mock boundaries

- **Occurrences**: 2
- **Stage**: Phase 3 - Add Regression Coverage For Current And Future Prefix Collisions
- **Symptom**: Initial jsdom overview specs either imported `server-only` admin-v2 form code and failed at module load time or rendered extra tables because non-target mocks were not route-aware.
- **Root Cause**: The first test-harness pass mocked at the wrong boundary: it exercised real wrapper internals that depend on server-only form modules while also using simplistic child mocks that did not preserve overview route-gating behavior.
- **Fix**: Mocked the deep admin-v2 form and model entrypoints, kept the collision-prone wrapper route gates real, and made non-target overview mocks render tables only for their own exact routes.
- **Reusable Pattern**: For admin-v2 overview regression tests, keep the route-gating wrapper layer real and mock only deeper model/form dependencies; route-aware mocks prevent both server-only import failures and false-positive table renders.

## Summary

### Changes Made

- Added shared `isAdminRoute(...)` export and matcher regression coverage in shared frontend client utils.
- Replaced admin-v2 `startsWith(...)` route checks with the shared matcher across overview/sidebar module and model wrappers in Agent, Analytic, Billing, Blog, Broadcast, CRM, Ecommerce, File Storage, Host, Notification, RBAC, Social, Startup, Telegram, and Website Builder.
- Added module-level overview regression specs for Website Builder and Social, and extended Ecommerce overview coverage for `attribute-key`.

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-04-18T22:47:19Z
