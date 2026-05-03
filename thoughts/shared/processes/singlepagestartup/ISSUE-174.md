---
issue_number: 174
issue_title: "[log-watch] [LW-4b793fca2648] api_api Not Found error. Not Found"
repository: singlepagestartup
created_at: 2026-05-03T19:40:10Z
last_updated: 2026-05-03T20:06:59Z
status: active
current_phase: research
---

# Process Log: ISSUE-174 - [log-watch] [LW-4b793fca2648] api_api Not Found error. Not Found

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

- Summary: Normalized copied production log-watch issue #174 into the SPS core workflow as a small bug, preserved source production context, added local reproduction instructions for the restored database dump, and prepared it for research.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-174.md`, https://github.com/singlepagestartup/singlepagestartup/issues/174
- Notes: This issue was already created in GitHub from `flakecode/doctorgpt`; create-phase work added the required SPS ticket/process artifacts, standardized metadata, and GitHub Project readiness.

### Research

- Summary: Documented the notification template render and notification send paths behind the production `Not Found error. Not Found` log-watch fingerprint. Verified the running API uses the restored `doctorgpt-production` database, reproduced 404s for the two logged notification UUIDs with local RBAC-authenticated API calls, and recorded that the logged template UUID exists and is linked to two current `new` notifications that were not sent during research because the Telegram provider is live.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-174.md`
- Notes: The exact logged notification UUIDs are absent from `doctorgpt-production`; current code also runs notification expiration cleanup after send, with a default 2-day retention window.

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

### Incident 1 — Initial SQL checked compose default database

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: Initial read-only SQL against the compose Postgres default database showed empty notification/template tables, while API reproduction showed the logged template UUID existed.
- **Root Cause**: `docker-compose exec db psql` without the API database name connected to the compose default DB (`sps-lite`), but `apps/api/.env` points the running API at `doctorgpt-production`.
- **Fix**: Read the API env database fields, reran SQL against `doctorgpt-production`, and recorded the verified database name in the research artifact.
- **Preventive Action**: For copied production log-watch issues, confirm `apps/api/.env` `DATABASE_NAME` and `select current_database()` before interpreting SQL results.
- **References**: `apps/api/.env`, `thoughts/shared/research/singlepagestartup/ISSUE-174.md`

## Reusable Learnings

- Production log-watch issues copied from another repository can still be treated as locally reproducible when the current SPS workspace is running with the affected project's restored database dump.
- Confirm the API's `DATABASE_NAME` before querying Postgres directly; compose service defaults can differ from the database used by the running API.
