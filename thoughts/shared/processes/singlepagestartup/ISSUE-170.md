---
issue_number: 170
issue_title: '[log-watch] [LW-af9b64380f19] api_api PostgresError: relation "sps_bg_pt_it" already exists'
repository: singlepagestartup
created_at: 2026-05-03T19:40:02Z
last_updated: 2026-05-03T19:59:26Z
status: active
current_phase: research
---

# Process Log: ISSUE-170 - [log-watch] [LW-af9b64380f19] api_api PostgresError: relation "sps_bg_pt_it" already exists

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: not_started
- Implement: not_started
- Current phase: research
- Next step: human review, then core/20-plan

## Phase Notes

### Create

- Summary: Normalized copied production log-watch issue #170 into the SPS core workflow as a small bug, preserved source production context, added local reproduction instructions for the restored database dump, and prepared it for research.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-170.md`, https://github.com/singlepagestartup/singlepagestartup/issues/170
- Notes: This issue was already created in GitHub from `flakecode/doctorgpt`; create-phase work added the required SPS ticket/process artifacts, standardized metadata, and GitHub Project readiness.

### Research

- Summary: Researched the duplicate `sps_bg_pt_it` production log-watch error against the restored local production database. Confirmed local reproduction through `npx nx run @sps/billing:models:payment-intent:repository-migrate`; `public.sps_bg_pt_it` exists with data while `drizzle.sps_bg_pt_it` has 0 migration rows, so Drizzle replays the first payment-intent migration and PostgreSQL returns `42P07`.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-170.md`
- Notes: User confirmed on 2026-05-03 that the current local project is deployed against the same database state as the production server where this error was observed; research treated the restored local database as the primary reproduction source. The same DB metadata check showed `drizzle.sps_bg_invoice` also has 0 rows while `public.sps_bg_invoice` exists with data, and issue 172 is the matching Nx-level target-failure symptom.

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

### Incident 1 - Local Postgres Access Requires Escalation

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: Direct `psql` connection to the local restored Postgres database failed inside the sandbox with `Operation not permitted` on localhost port 5433.
- **Root Cause**: The Codex sandbox blocked the local TCP connection used for DB metadata verification.
- **Fix**: Re-ran the same `psql` metadata queries with escalated command permissions and confirmed the restored production database state.
- **Preventive Action**: For issue 170 planning/implementation, use approved/escalated local DB commands when verifying restored production database metadata or reproducing migration targets.
- **References**: `thoughts/shared/research/singlepagestartup/ISSUE-170.md`

## Reusable Learnings

- Production log-watch issues copied from another repository can still be treated as locally reproducible when the current SPS workspace is running with the affected project's restored database dump.
- Restored production database checks may need escalated local Postgres access from Codex before `psql` or migration targets can connect to localhost.
