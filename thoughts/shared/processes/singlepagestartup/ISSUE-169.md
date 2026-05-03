---
issue_number: 169
issue_title: "[log-watch] [LW-e5b6f57f5a15] api_api /api/agent/agents/rbac-module-subjects-check MAX_PARAMETERS_EXCEEDED: Max number of parameters exceeded"
repository: singlepagestartup
created_at: 2026-05-03T19:40:00Z
last_updated: 2026-05-03T20:32:28Z
status: complete
current_phase: complete
---

# Process Log: ISSUE-169 - [log-watch] [LW-e5b6f57f5a15] api_api /api/agent/agents/rbac-module-subjects-check MAX_PARAMETERS_EXCEEDED: Max number of parameters exceeded

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: not_started
- Implement: not_started
- Current phase: complete
- Next step: none; issue closed as already fixed

## Phase Notes

### Create

- Summary: Normalized copied production log-watch issue #169 into the SPS core workflow as a small bug, preserved source production context, added local reproduction instructions for the restored database dump, and prepared it for research.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-169.md`, https://github.com/singlepagestartup/singlepagestartup/issues/169
- Notes: This issue was already created in GitHub from `flakecode/doctorgpt`; create-phase work added the required SPS ticket/process artifacts, standardized metadata, and GitHub Project readiness.

### Research

- Summary: Traced `/api/agent/agents/rbac-module-subjects-check` through the agent handler, RBAC subject SDK, `/api/rbac/subjects/check`, and `ecommerceOrderProceed`; verified the restored local `doctorgpt-production` database contains 66,398 subject-order relation rows, while current code bounds the processing handoff to 100 candidate orders.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-169.md`
- Notes: Local API checks with the internal RBAC service header returned `200 OK` for both the agent route and direct RBAC subject check route; the unauthenticated agent call returned the expected global authorization `403`. After user review, GitHub issue #169 was commented, moved to Project status `Done`, and closed as `not_planned` because no further implementation work is required.

### Plan

- Summary:
- Outputs:
- Notes:

### Implement

- Summary:
- Outputs:
- Notes:

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 1 -->

### Incident 1 — Scoped Jest helper argument parsing

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: `npm run test:file -- libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.spec.ts` failed before Jest with `NX parsedArgs[PROJECT_TARGET_CONFIG]?.lastIndexOf is not a function`; `npx nx show projects` then stalled while calculating the project graph on the Nx daemon.
- **Root Cause**: The repository `test:file` script (`npx nx run --target=jest:test --testFile`) did not resolve a project target from a bare test file path in this environment, and the broad Nx project lookup hit daemon/project-graph friction.
- **Fix**: Ran the spec through the explicit project target: `npx nx run @sps/rbac:jest:test --testFile=libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.spec.ts`, which passed.
- **Preventive Action**: For scoped unit verification, prefer exact Nx project targets when the target is known instead of the generic `test:file` wrapper.
- **References**: `package.json`, `libs/modules/rbac/project.json`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.spec.ts`

## Reusable Learnings

- Production log-watch issues copied from another repository can still be treated as locally reproducible when the current SPS workspace is running with the affected project's restored database dump.
