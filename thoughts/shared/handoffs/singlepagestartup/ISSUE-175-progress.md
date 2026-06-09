---
issue_number: 175
issue_title: "[log-watch] [LW-fe596862c7a7] api_api Validation error. 'props.<id>.description' is empty."
start_date: 2026-05-03T22:10:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-175.md
status: in_progress
---

# Implementation Progress: ISSUE-175 - [log-watch] [LW-fe596862c7a7] api_api Validation error. 'props.<id>.description' is empty.

**Started**: 2026-05-03
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-175.md`

## Phase Progress

### Phase 1: Guard Empty Incoming Prompts Before Generation

- [x] Started: 2026-05-03T22:11:33Z
- [x] Completed: 2026-05-03T22:15:40Z
- [x] Automated verification: PASSED (`@sps/agent` targeted spec, full Jest, TypeScript build)

**Notes**: GitHub comments were synced before code changes. No scope-changing comments were found after the plan comment. Empty or whitespace-only incoming prompts now no-op before OpenRouter generation.

### Phase 2: Enforce Empty AI Output as a Generation Error

- [x] Started: 2026-05-03T22:12:23Z
- [x] Completed: 2026-05-03T22:15:40Z
- [x] Automated verification: PASSED (`@sps/rbac` targeted spec, full Jest, TypeScript build)

**Notes**: Final text reply construction now validates raw generated text before appending the model footer, while image replies preserve the fallback description.

### Phase 3: Add Focused BDD Regression Coverage

- [x] Started: 2026-05-03T22:12:23Z
- [x] Completed: 2026-05-03T22:15:40Z
- [x] Automated verification: PASSED (targeted specs, full agent/rbac Jest, agent/rbac TypeScript builds)

**Notes**: Added BDD coverage for empty incoming prompts, empty generated text errors, and image reply fallback descriptions. Targeted specs were rerun after final test description cleanup.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 1 -->

### Incident 1 — test:file wrapper fails before Jest

- **Occurrences**: 1
- **Stage**: Phase 3 - Add Focused BDD Regression Coverage
- **Symptom**: Both planned `npm run test:file -- <spec>` and `npm run test:file <spec>` commands failed before Jest with `NX parsedArgs[PROJECT_TARGET_CONFIG]?.lastIndexOf is not a function`.
- **Root Cause**: The repository `test:file` npm wrapper expands to `npx nx run --target=jest:test --testFile ...`, which is incompatible with the current Nx parser in this workspace.
- **Fix**: Ran the equivalent project-specific targets directly with `npx nx run @sps/agent:jest:test --testFile=...` and `npx nx run @sps/rbac:jest:test --testFile=...`.
- **Reusable Pattern**: When `npm run test:file` fails in Nx argument parsing, bypass the wrapper and call the owning project's `jest:test` target with `--testFile=<path>`.

## Summary

### Changes Made

- Added agent-side no-op guards for blank incoming OpenRouter prompts.
- Added RBAC OpenRouter reply payload construction that rejects empty text before model footer append.
- Added focused BDD regression tests for the fixed input and output paths.

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done
- [ ] Manual verification confirmed

---

**Last updated**: 2026-05-03T22:16:40Z
