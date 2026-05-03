---
issue_number: 175
issue_title: "[log-watch] [LW-fe596862c7a7] api_api Validation error. 'props.<id>.description' is empty."
repository: singlepagestartup
created_at: 2026-05-03T19:40:12Z
last_updated: 2026-05-03T22:16:40Z
status: active
current_phase: implement
---

# Process Log: ISSUE-175 - [log-watch] [LW-fe596862c7a7] api_api Validation error. 'props.<id>.description' is empty.

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: in_progress
- Current phase: implement
- Next step: complete implementation and submit PR

## Phase Notes

### Create

- Summary: Normalized copied production log-watch issue #175 into the SPS core workflow as a small bug, preserved source production context, added local reproduction instructions for the restored database dump, and prepared it for research.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-175.md`, https://github.com/singlepagestartup/singlepagestartup/issues/175
- Notes: This issue was already created in GitHub from `flakecode/doctorgpt`; create-phase work added the required SPS ticket/process artifacts, standardized metadata, and GitHub Project readiness.

### Research

- Summary: Documented the agent Telegram/OpenRouter path that throws `Validation error. 'props.socialModuleMessage.description' is empty.`, traced empty descriptions to Telegram attachment/media ingestion, and confirmed the restored `doctorgpt-production` database contains many linked empty-description Telegram messages in chats with automatic profiles.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-175.md`
- Notes: Research used SELECT-only database inspection against the restored production-copy database. Direct `POST /api/agent/agents/telegram-bot` reproduction was not executed because the current catch path would write an OpenRouter error reply to the restored database before rethrowing the validation.

### Plan

- Summary: Produced an implementation plan that treats empty Telegram descriptions as valid stored attachment-only input events that should no-op before OpenRouter generation, while preserving empty AI model text output as a generation error that writes the existing bot error message to chat.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-175.md`, https://github.com/singlepagestartup/singlepagestartup/issues/175#issuecomment-4367261326
- Notes: Plan incorporates user clarification that empty incoming descriptions can be valid when files are attached, but empty generated AI replies are invalid and should fail through the bot error path.

### Implement

- Summary: Implemented the planned empty-input and empty-output guards, added BDD regression coverage, and passed targeted/full agent and RBAC Jest plus TypeScript builds. Awaiting workflow manual verification confirmation before commit and PR creation.
- Outputs: `thoughts/shared/handoffs/singlepagestartup/ISSUE-175-progress.md`
- Notes: `npm run test:file` wrapper failed before Jest due Nx argument parsing; equivalent project-specific Nx targets passed and the incident is recorded below.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 1 -->

### Incident 1 — test:file wrapper fails before Jest

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: Both planned `npm run test:file -- <spec>` and `npm run test:file <spec>` commands failed before Jest with `NX parsedArgs[PROJECT_TARGET_CONFIG]?.lastIndexOf is not a function`.
- **Root Cause**: The repository `test:file` npm wrapper expands to `npx nx run --target=jest:test --testFile ...`, which is incompatible with the current Nx parser in this workspace.
- **Fix**: Ran the equivalent project-specific targets directly with `npx nx run @sps/agent:jest:test --testFile=...` and `npx nx run @sps/rbac:jest:test --testFile=...`.
- **Preventive Action**: When `npm run test:file` fails in Nx argument parsing, bypass the wrapper and call the owning project's `jest:test` target with `--testFile=<path>`.
- **References**: `thoughts/shared/handoffs/singlepagestartup/ISSUE-175-progress.md`, `package.json`

## Reusable Learnings

- Production log-watch issues copied from another repository can still be treated as locally reproducible when the current SPS workspace is running with the affected project's restored database dump.
