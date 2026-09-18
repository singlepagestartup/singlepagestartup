---
issue_number: 240
issue_title: "Fix scoped test lanes: scenario specs in the unit lane, unwired shared backend specs, env-dependent MCP test, scenario runner leaks"
repository: singlepagestartup
created_at: 2026-09-18T00:20:00Z
last_updated: 2026-09-18T00:25:00Z
status: active
current_phase: create
---

# Process Log: ISSUE-240 - Fix scoped test lanes: scenario specs in the unit lane, unwired shared backend specs, env-dependent MCP test, scenario runner leaks

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: not_started
- Plan: not_started
- Implement: not_started
- Current phase: create
- Next step: run `core/10-research` for issue #240; the accompanying pull request already fixes items 1 and 3 of the ticket

## Phase Notes

### Create

- Summary: Created issue #240 from a quality audit that ran every scoped test lane from a clean worktree of `main` (`29370bcbf8`), added it to Project #2, and moved it through Triage to Research Needed.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-240.md`, `thoughts/shared/processes/singlepagestartup/ISSUE-240.md`, https://github.com/singlepagestartup/singlepagestartup/issues/240.
- Notes: Evidence was collected by running `nx run-many --target=jest:test` per project group, `@sps/backend-utils:test`, direct `jest -c` runs for orphaned configs, and `tools/testing/test-scenario-issue.sh` for issues 160, 152 and 154 with an isolated API on port 4010. Companion issue: #241.

### Research

- Summary:
- Outputs:
- Notes:

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

<!-- incident-count: 2 -->

### Incident 1 — Project item was not immediately visible to the status helper

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: `create_issue_with_project.sh` created the issue and added it to Project #2, but its immediate Triage update failed with `Issue #240 ... not found in GitHub Project #2`.
- **Root Cause**: GitHub Project item visibility lagged behind the successful add operation (same behavior recorded for #224 and #226).
- **Fix**: Waited five seconds and reran `update_issue_status.sh` for Triage and Research Needed; `get_issue_status.sh` then returned Research Needed.
- **Preventive Action**: Keep the bounded retry; do not recreate the issue.
- **References**: `.claude/helpers/create_issue_with_project.sh`, `.claude/helpers/update_issue_status.sh`.

### Incident 2 — Unit lane failures were caused by a foreign API on port 4000

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: `api:jest:test` reported `Expected: 4, Received: 8` and `Permission error` responses instead of connection errors.
- **Root Cause**: The scenario specs picked up by the unit lane talked to an unrelated project's API that happened to listen on `localhost:4000` on the audit machine.
- **Fix**: Identified the process owner with `lsof` and re-ran the scenarios through the runner with `SCENARIO_REUSE_API=0 SCENARIO_API_PORT=4010`.
- **Preventive Action**: Before trusting a scenario or unit result that depends on `API_SERVICE_URL`, confirm which checkout owns the listening process.
- **References**: `tools/testing/test-scenario-issue.sh`, `apps/api/jest.config.ts`.

## Reusable Learnings

- `nx.json` has `"plugins": []`, so `targetDefaults` do not create targets; a project only has `jest:test` when its `project.json` declares it.
- `nx run-many --projects=<list>` silently skips projects that lack the target; count the projects in the "Running target ... for N projects" line.
