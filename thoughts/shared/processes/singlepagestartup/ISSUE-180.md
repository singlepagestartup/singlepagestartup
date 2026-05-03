---
issue_number: 180
issue_title: "[log-watch] [LW-c5696ab78964] host_host Not Found error. Page with url /%22/_next/static/chunks/<id>.js%22 not found"
repository: singlepagestartup
created_at: 2026-05-03T19:40:23Z
last_updated: 2026-05-03T21:47:02Z
status: complete
current_phase: complete
---

# Process Log: ISSUE-180 - [log-watch] [LW-c5696ab78964] host_host Not Found error. Page with url /%22/\_next/static/chunks/<id>.js%22 not found

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: not_started
- Implement: not_started
- Current phase: complete
- Next step: none; issue closed as not planned

## Phase Notes

### Create

- Summary: Normalized copied production log-watch issue #180 into the SPS core workflow as a small bug, preserved source production context, added local reproduction instructions for the restored database dump, and prepared it for research.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-180.md`, https://github.com/singlepagestartup/singlepagestartup/issues/180
- Notes: This issue was already created in GitHub from `flakecode/doctorgpt`; create-phase work added the required SPS ticket/process artifacts, standardized metadata, and GitHub Project readiness.

### Research

- Summary: Traced the host catch-all route, language middleware, page `find-by-url` server SDK, backend page lookup, shared 404 normalization, and app-level `/404` rendering path. The current host flow treats quoted paths such as `/%22/_next/static/...%22` as ordinary page URLs once they bypass the `_next` matcher exclusion, and missing matches become `❌ API Error` logs through the shared response pipe before `notFound()` renders the app-level `/404` page. Local reproduction against the API database `doctorgpt-production` returned the same direct backend 404 and emitted the matching host-side `❌ API Error` log.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-180.md`
- Notes: User confirmed on 2026-05-04 that the currently deployed local project database is the same database from the production server where this log-watch error was observed; research should account for local DB-backed reproduction paths. After reviewing deploy timing, issue #180 was closed as not planned and moved to Done because the quoted `_next/static/chunks` request is consistent with stale/malformed deployment or client-cache noise rather than a missing business page.

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

### Incident 1 — API database name differed from compose default

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: The first read-only Postgres check queried `sps-lite.sps_h_page` and returned zero host page rows, which did not match the user's restored production database context.
- **Root Cause**: The Docker Postgres default database is `sps-lite`, but the running API app is configured with `DATABASE_NAME=doctorgpt-production`.
- **Fix**: Read the API env and reran the read-only SQL checks against `doctorgpt-production`, where `sps_h_page` contained 6 rows including `/404`.
- **Preventive Action**: For copied production issues, confirm the API application's `DATABASE_NAME` before querying Postgres directly; do not infer the active app database from `POSTGRES_DB`.
- **References**: `apps/api/.env`, `docker-compose exec -T db psql -U sps-lite -d doctorgpt-production ...`, `thoughts/shared/research/singlepagestartup/ISSUE-180.md`

## Reusable Learnings

- Production log-watch issues copied from another repository can still be treated as locally reproducible when the current SPS workspace is running with the affected project's restored database dump.
- When local Postgres contains multiple restored databases, use the app env (`DATABASE_NAME`) to choose the database for reproduction queries.
