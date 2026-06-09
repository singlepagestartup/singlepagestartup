---
issue_number: 185
issue_title: "[log-watch] [LW-6a66ca6ff01e] api_api Call to 'sendMessage' failed! (403: Forbidden: bot was blocked by the user)"
repository: singlepagestartup
created_at: 2026-05-03T19:40:36Z
last_updated: 2026-05-04T01:33:25+03:00
status: active
current_phase: implement
---

# Process Log: ISSUE-185 - [log-watch] [LW-6a66ca6ff01e] api_api Call to 'sendMessage' failed! (403: Forbidden: bot was blocked by the user)

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: in_progress
- Current phase: implement
- Next step: manual verification pause, then production-copy data cleanup phase

## Phase Notes

### Create

- Summary: Normalized copied production log-watch issue #185 into the SPS core workflow as a small bug, preserved source production context, added local reproduction instructions for the restored database dump, and prepared it for research.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-185.md`, https://github.com/singlepagestartup/singlepagestartup/issues/185
- Notes: This issue was already created in GitHub from `flakecode/doctorgpt`; create-phase work added the required SPS ticket/process artifacts, standardized metadata, and GitHub Project readiness.

### Research

- Summary: Documented the blocked-recipient Telegram `sendMessage` path through RBAC subject notify and notification send, verified the restored production database context (`doctorgpt-production`), identified the logged subject's current role/order rows, and confirmed `canceling` is the non-final status that lets RBAC subject check finalize to `canceled`.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-185.md`, GitHub issue comment https://github.com/singlepagestartup/singlepagestartup/issues/185#issuecomment-4367296713
- Notes: No mutating SQL or runtime data correction was performed during research. The active subscription order identified for later cleanup is `bd8fa452-ed0e-4f87-8d4e-52bb4643d8a8`; current subject-role relation rows are listed in the research artifact.

### Plan

- Summary: Created implementation plan for terminal `error` notification status handling on Telegram blocked-recipient failures, regression tests, and the requested one-off `doctorgpt-production` subject/order cleanup.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-185.md`, GitHub issue comment https://github.com/singlepagestartup/singlepagestartup/issues/185#issuecomment-4367323891
- Notes: User clarified during planning that blocked-recipient notification sends must persist an error status and must not be retried. Plan uses `status: "error"` for the notification terminal state and `canceling` for the active subscription order handoff to RBAC subject check.

### Implement

- Summary: Implemented terminal notification `error` status handling for Telegram blocked-recipient failures and added focused BDD regression coverage. Synced GitHub issue comments before edits; no new user requirements were added after the plan beyond the implementation-plan link comment.
- Outputs: `thoughts/shared/handoffs/singlepagestartup/ISSUE-185-progress.md`
- Notes: Passed focused service/controller notification specs, full `@sps/notification:jest:test`, BDD header grep, and uncached `@sps/notification:tsc:build`. The requested `doctorgpt-production` subject/order cleanup remains a separate later phase and has not been run yet.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 3 -->

### Incident 1 — SQL initially targeted the default database

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: Initial read-only SQL against the local Postgres container did not find the logged subject or notification UUIDs.
- **Root Cause**: The container default database was `sps-lite`, while `apps/api/.env` points the running API at `DATABASE_NAME=doctorgpt-production`.
- **Fix**: Re-ran read-only SQL with `psql -d doctorgpt-production`; the logged subject was present there.
- **Preventive Action**: For production-dump research, read `apps/api/.env` and query the same `DATABASE_NAME` used by the API before concluding that production UUIDs are absent.
- **References**: `apps/api/.env`, `thoughts/shared/research/singlepagestartup/ISSUE-185.md`

### Incident 2 — Blocked-bot notification outcome clarified

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: Initial plan outline treated blocked-bot delivery as a successful no-op/skip outcome.
- **Root Cause**: The desired persisted notification state for blocked recipients was not explicit in the research artifact.
- **Fix**: User clarified that when sending a notification receives this Telegram blocked-bot error, the notification must be marked with an error status and must not be retried.
- **Preventive Action**: Plans for non-repeatable provider failures should explicitly state the persisted failure status and retry behavior before implementation.
- **References**: `thoughts/shared/research/singlepagestartup/ISSUE-185.md`

### Incident 3 — `npm run test:file` wrapper failed before tests

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `npm run test:file -- libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.spec.ts` exited before Jest with `parsedArgs[PROJECT_TARGET_CONFIG]?.lastIndexOf is not a function`.
- **Root Cause**: The repository `test:file` script expands to `npx nx run --target=jest:test --testFile`, and this Nx invocation did not resolve the project/target shape for the file argument in the current environment.
- **Fix**: Ran the equivalent project-qualified Nx command directly: `npx nx run @sps/notification:jest:test --testFile=libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.spec.ts`.
- **Preventive Action**: For focused notification specs in this workspace, prefer project-qualified Nx test commands when the generic `test:file` wrapper fails before Jest starts.
- **References**: `thoughts/shared/handoffs/singlepagestartup/ISSUE-185-progress.md`

## Reusable Learnings

- Production log-watch issues copied from another repository can still be treated as locally reproducible when the current SPS workspace is running with the affected project's restored database dump.
- Production-dump SQL checks should target the API `DATABASE_NAME`, not the Postgres container's default database.
