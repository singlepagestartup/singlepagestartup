---
issue_number: 160
issue_title: "Add universal REST /count endpoint and shared SDK support"
repository: singlepagestartup
created_at: 2026-05-01T00:54:30Z
last_updated: 2026-05-02T00:49:03Z
status: complete
current_phase: complete
---

# Process Log: ISSUE-160 - Add universal REST /count endpoint and shared SDK support

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: complete
- Next step: code review / merge PR #168

## Phase Notes

### Create

- Summary: GitHub issue exists with scope to add a universal shared REST `/count` endpoint and shared SDK support.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-160.md`
- Notes:

### Research

- Summary: Research confirmed the shared backend, frontend API, server factory, client factory, and admin-v2 table lack a shared count primitive.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-160.md`
- Notes:

### Plan

- Summary: Implementation plan defines three phases: backend REST count stack, frontend API/SDK support, and admin-v2 consumer migration.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-160.md`
- Notes:

### Implement

- Summary: Phase 1 backend implementation, Phase 2 frontend API/SDK support, and Phase 3 shared consumer migration are complete. Admin-v2 card/table count usage plus user-requested OpenAPI/MCP coverage are implemented, verified, committed, and opened as PR #168.
- Outputs:
  - `libs/shared/backend/api/src/lib/controllers/rest/handler/count/index.ts`
  - `libs/shared/backend/api/src/lib/service/crud/actions/count/index.ts`
  - `libs/shared/frontend/api/src/lib/actions/count/index.ts`
  - `libs/shared/frontend/client/api/src/lib/factory/queries/count/index.tsx`
  - `libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/server.tsx`
  - `libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/client.tsx`
  - `apps/api/specs/scenario/singlepagestartup/issue-160/backend-count.scenario.spec.ts`
  - `apps/api/specs/scenario/singlepagestartup/issue-160/test-utils/db.ts`
  - `apps/openapi/openapi.yaml`
  - `apps/mcp/lib/count-tool.ts`
- Notes:
  - GitHub comments were synced before code changes; only existing research and plan comments were present.
  - Phase 1 automated verification passed: shared backend Jest, shared backend TypeScript build, shared backend lint, and issue-160 scenario test.
  - Phase 1 manual verification confirmed by user before continuing to Phase 2.
  - Phase 2 automated verification passed: shared frontend API Jest plus shared frontend API, server API, client API, and components TypeScript builds.
  - User requested keeping shared route binding clean; `/count` was added explicitly to customized module/relation controllers that override route lists.
  - Phase 3 automated verification passed: shared frontend components Jest/lint/build, shared backend API Jest, targeted business-module TypeScript builds, and issue-160 scenario.
  - User requested OpenAPI and MCP coverage; 147 SDK `paths.yaml` count entries now document `/count` including telegram count-only path docs, `apps/openapi/openapi.yaml` references those routes, Redocly bundle/lint passed, and 143 MCP entity tools now expose `*-count`.
  - User requested admin-v2 module overview cards use count; shared card server/client wrappers now call `api.count`, preserve `apiProps`, force no-store headers, and pass `count` to child cards. Browser verification on `/en/admin/ecommerce` showed real badge values.
  - User requested checking model page table footer count; shared table client already used `api.count` for total, and was aligned with the card count option-merging pattern so `apiProps.options` are preserved on count/find calls. Browser verification on `/en/admin/ecommerce/attribute` showed `Page 1 of 1 (12 total)`.
  - The repeated scenario-runner hang after successful assertions was promoted to the issue research artifact under Known Pitfalls.
  - PR opened: https://github.com/singlepagestartup/singlepagestartup/pull/168
  - Follow-up workflow fix added portable helper compatibility aliases and `submit_pr_for_code_review.sh` so PR submission cannot bypass the `Code Review` Project transition.
  - Issue #160 was submitted through `submit_pr_for_code_review.sh 160 168` and verified in GitHub Project status `Code Review`.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 3 -->

### Incident 1 - GitHub helper compatibility aliases missing

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `.claude/helpers/get_issue_status.sh 160` failed before returning status because callers and helper implementations disagreed on repository-context function names.
- **Root Cause**: The shared helper scripts mixed unprefixed compatibility names with prefixed implementation names.
- **Fix**: Ran the required status/update helpers through a narrow Bash compatibility shim during implementation, then added portable legacy wrappers in `.claude/helpers/repo_context.sh` and `.claude/helpers/validate_project_context.sh` so callers no longer need a shim.
- **Preventive Action**: Keep `TARGET_REPO_*` as canonical helper output while preserving `resolve_repo_context` and `validate_project_artifact_context` as compatibility aliases for older commands and downstream projects.
- **References**: `.claude/helpers/load_config.sh`, `.claude/helpers/repo_context.sh`, `.claude/helpers/validate_project_context.sh`, `.claude/helpers/get_issue_status.sh`

### Incident 2 - Scenario Jest process stayed open after passing

- **Phase**: Implement
- **Occurrences**: 2
- **Symptom**: `bash tools/testing/test-scenario-issue.sh singlepagestartup 160` reported the issue-160 scenario suite as passed, then printed Jest's open-handle warning and did not exit on its own.
- **Root Cause**: The scenario lane left asynchronous resources open after the test run, likely from the spawned local API and/or database provider handles.
- **Fix**: Stopped the spawned local API process on port 4000 after the scenario assertions passed, allowing the wrapper command to exit cleanly.
- **Preventive Action**: When a scenario suite reports success but remains open, check the scenario API port with `lsof -ti tcp:<port>` and stop the spawned API process after confirming test results.
- **References**: `tools/testing/test-scenario-issue.sh`, `apps/api/specs/scenario/singlepagestartup/issue-160/backend-count.scenario.spec.ts`
  - Recurred during Phase 3 after rerunning the issue-160 scenario; same fix was applied.

### Incident 3 - OpenAPI lint failed on existing Telegram app request schema

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `npx -y @redocly/cli lint ./openapi.yaml` failed with a `struct` error in `apps/openapi/apps/telegram/paths.yaml` because `data.url` appeared directly under `data`.
- **Root Cause**: The `/telegram/run` multipart schema modeled `data.url` without declaring `data` as an object with `properties`.
- **Fix**: Updated `apps/openapi/apps/telegram/paths.yaml` so `data` is an object and `url` is defined under `data.properties`.
- **Preventive Action**: Run Redocly lint after bundle when adding OpenAPI refs; fix invalid source schemas before trusting generated docs.
- **References**: `apps/openapi/apps/telegram/paths.yaml`, `apps/openapi/openapi.yaml`

## Reusable Learnings

- When SPS project helpers fail before status lookup, check for drift between helper callers and the `TARGET_REPO_*` repository context contract before debugging GitHub Project data.
- Redocly lint can surface unrelated OpenAPI schema defects while validating new route refs; treat bundle success as reference resolution only and use lint to catch source schema shape issues.
