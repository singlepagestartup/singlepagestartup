---
issue_number: 158
issue_title: "Implement Two-Phase Token Billing for OpenRouter with Usage Settlement and Message Metadata"
start_date: 2026-04-13T22:41:43Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-158.md
status: in_progress
---

# Implementation Progress: ISSUE-158 - Implement Two-Phase Token Billing for OpenRouter with Usage Settlement and Message Metadata

**Started**: 2026-04-13
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-158.md`

## Phase Progress

### Phase 1: Expose Billable OpenRouter Usage

- [x] Started: 2026-04-13T22:42:28Z
- [x] Completed: 2026-04-13T23:10:38Z
- [x] Automated verification: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-third-parties:tsc:build`

**Notes**: GitHub issue comments synced on 2026-04-13; no new scope changes beyond the recorded research and plan comments. OpenRouter wrapper and controller files were read in full before implementation. The shared OpenRouter client now returns normalized usage and pricing-based billing data, and the controller aggregates a request-scoped ledger across classification, model selection, repair, and generation calls.

### Phase 2: Precharge Guard And Exact Settlement

- [x] Started: 2026-04-13T22:42:28Z
- [x] Completed: 2026-04-13T23:10:38Z
- [x] Automated verification: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/rbac:jest:test --runInBand --runTestsByPath libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/open-router-billing.spec.ts libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/bill-route.spec.ts`

**Notes**: The RBAC bill-route service now lets the OpenRouter route precharge from a non-negative balance, blocks only when a request starts below zero, and exposes an explicit settlement path that reconciles refunds and additional debits after exact usage is known.

### Phase 3: Persist Billing Metadata And Add BDD Coverage

- [x] Started: 2026-04-13T22:42:28Z
- [x] Completed: 2026-04-13T23:10:38Z
- [x] Automated verification: `npx eslint <touched-ts-files>`; `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/agent:jest:test --runInBand --runTestsByPath libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/open-router-reply.spec.ts`; `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/rbac:jest:test --runInBand --runTestsByPath libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/open-router-billing.spec.ts`

**Notes**: Final assistant messages now persist `metadata.openRouter.billing` with precharge, exact charge, delta, USD totals, selected model, per-call usage details, and settlement output. Added BDD unit coverage for conversion and settlement, agent fallback coverage for the existing not-enough-tokens UX, and an issue-158 scenario spec for the real API path. The issue-158 scenario spec was not executed in this session because `API_SERVICE_URL=http://localhost:4000` was not serving locally.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 0 -->

## Summary

### Changes Made

- Progress file created and GitHub issue state synced before implementation.
- Added request-scoped OpenRouter billing capture, exact settlement, and message metadata persistence for issue 158.
- Added focused BDD coverage for settlement math, negative-balance gating, and agent fallback behavior.

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [ ] All phases completed
- [ ] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-04-13T23:10:38Z
