---
issue_number: 161
issue_title: "Fix Website Builder buttons-array admin route showing Button table"
repository: singlepagestartup
created_at: 2026-04-17T23:33:09Z
last_updated: 2026-04-18T22:47:19Z
status: active
current_phase: implement
---

# Process Log: ISSUE-161 - Fix Website Builder buttons-array admin route showing Button table

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: in_progress
- Current phase: implement
- Next step: manual verification, then commit and submit PR

## Phase Notes

### Create

- Summary: GitHub issue exists and ticket artifact is available at `thoughts/shared/tickets/singlepagestartup/ISSUE-161.md`.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-161.md`
- Notes:

### Research

- Summary: Documented the current admin-v2 route resolution for Website Builder `button` and `buttons-array`, including the overview composition path, prefix-based activation logic, and the model-specific SDK/API wiring currently used by each table.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-161.md`
- Notes: Research completed from live code and existing ticket artifact. No substantive workflow incidents were recorded in this phase.

### Plan

- Summary: Revised the implementation plan after review feedback so it now uses a shared admin-route matcher strategy, includes an audit for same-cause prefix collisions, and expands the confirmed implementation scope to Website Builder, Ecommerce, and Social collision pairs.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-161.md`
- Notes: Issue status was returned to `Plan in Progress` to revise the existing plan. The updated plan now covers `website-builder/button` vs `buttons-array` and the confirmed `attribute` vs `attribute-key` collision pattern in `ecommerce` and `social`, using shared admin-route utilities as the preferred implementation direction.

### Implement

- Summary: Added a shared admin route matcher that covers module-only and module/model checks, standardized admin-v2 overview/sidebar route gating across all affected modules, and kept regression coverage on the shared matcher plus the originally affected module overviews.
- Outputs: `libs/shared/frontend/client/utils/src/lib/admin-route/index.ts`, `libs/shared/frontend/client/utils/src/lib/admin-route/index.spec.ts`, `libs/modules/*/frontend/component/src/lib/admin-v2/{overview,sidebar-module-item}/**`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/Component.spec.tsx`, `libs/modules/social/frontend/component/src/lib/admin-v2/overview/Component.spec.tsx`
- Notes: Manual review expanded the implementation scope from confirmed collision pairs to standardizing all admin-v2 route gates on one helper. Automated verification passed for shared utils, regression-test modules, and lint across all 16 affected projects. Work is paused at the manual-verification gate before commit/PR creation.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 2 -->

### 2026-04-18 - GitHub helper required escalated network access

- Context: Initial `gh`-backed status and issue reads retried and failed inside the sandbox before the planning workflow could continue.
- Impact: Planning paused until the GitHub helper commands were re-run with approved escalated access.
- Resolution: Re-ran `.claude/helpers/get_issue_status.sh`, `gh issue view`, and the issue comment helper with escalated permissions, then continued the planning flow.
- Prevention: For future GitHub-project workflow steps in this environment, prefer escalating the first helper invocation once sandbox-related API connectivity failures appear.

### Incident 2 — Overview regression specs needed selective mock boundaries

- **Phase**: Implement
- **Occurrences**: 2
- **Symptom**: New jsdom overview regression specs either failed on `server-only` imports or rendered non-target tables during overview assertions.
- **Root Cause**: The first test harness mixed real wrapper internals that depend on admin-v2 form server modules with simplistic child mocks that did not preserve route-gating behavior.
- **Fix**: Mocked admin-v2 form/model dependencies below the wrapper layer and made non-target overview mocks route-aware while keeping the exact-match wrapper behavior under test.
- **Preventive Action**: For future admin-v2 overview specs, keep the route-gating wrapper boundary real and mock only deeper dependencies plus route-aware non-target children.
- **References**: `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/Component.spec.tsx`, `libs/modules/ecommerce/frontend/component/src/lib/admin-v2/overview/Component.spec.tsx`, `libs/modules/social/frontend/component/src/lib/admin-v2/overview/Component.spec.tsx`

## Reusable Learnings
