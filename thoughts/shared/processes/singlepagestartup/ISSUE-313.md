---
issue_number: 313
issue_title: "Bound list reads, request bodies, timeouts and WebSocket connections"
repository: singlepagestartup
created_at: 2026-09-25T00:00:00Z
last_updated: 2026-09-25T23:45:00Z
status: active
current_phase: complete
---

# Process Log: ISSUE-313 - Bound list reads, request bodies, timeouts and WebSocket connections

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: complete
- Next step: code review of pull request #334, then merge

## Phase Notes

### Create

- Summary: raised by the 2026-09-25 security review (`thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`), findings SEC-02, SEC-06, SEC-09, SEC-10, SEC-29, SEC-30, SEC-32. The issue is under embargo: neutral public title, detail only in the local ticket.
- Incidents: none.

### Research

- Summary: confirmed both agreed changes against `78d7d43125`. `Database.find` calls a `drizzle-orm` namespace export chosen by `orderBy.and[0].method` and looks the column up with a bare property read; every list read ends there. All 44 first-party sorts send `asc` or `desc`, and the later items of the ten multi-item sorts outside specs name columns their tables have. `query-builder/order-by.ts` and `populate.ts` have no caller. `apps/api/server.ts` sets no `maxRequestBodySize`, so Bun's 128 MiB default applies; a declared `Content-Length` above the limit is answered 413 before routing.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-313.md`.
- Notes: probes ran on the local Bun 1.3.6 and drizzle-orm 0.38.4 from scratch scripts outside the repository. HTTP checks that could end in a 5xx are avoided on the local API, because the exception filter reports every 5xx to Telegram when the bug-report variables are set; the API is started with those variables blank.

### Plan

- Summary: two phases. Phase 1 validates every sort item in `Database.find` (allow-listed method, identifier, drizzle `Column` of the table) and applies the first, with `Validation error.` messages; Phase 2 adds `API_MAX_REQUEST_BODY_BYTES` (default 128 MiB, Bun's own default) to `envs/api.ts`, `apps/api/server.ts`, the API README and the deployer's `api.sh`, `api.env.j2` and `.env.example`.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-313.md`.
- Notes: the default is 128 MiB, the limit Bun applies when the option is absent, so no deployment's effective limit changes. `query-builder/order-by.ts` stays uncalled; the helpers live in the repository file beside their only caller.

### Implement

- Summary: both phases are implemented and verified in commits `0d53ec4a1d` (sort allow-list) and `1c7dd010fb` (body limit setting); the progress file holds every command and result, including the mutation checks and the HTTP runs on port 4313.
- Outputs: `thoughts/shared/handoffs/singlepagestartup/ISSUE-313-progress.md`, pull request #334 with its description in `thoughts/shared/prs/334_description.md`.
- Notes: `tsc --noEmit -p apps/api/tsconfig.json` reports 25 Bun typing errors in files this branch does not touch; none is in a changed file. `api:eslint:lint` took about ten minutes on this machine.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 0 -->

## Reusable Learnings

- Start a local API for HTTP checks with `BUG_SERVICE_TELEGRAM_BOT_TOKEN`, `BUG_SERVICE_TELEGRAM_CHAT_ID` and `BUG_SERVICE_PROJECT` set to empty strings. `apps/api/env.ts` loads `.env` through dotenv, which does not override a variable that is already set, so the exception filter then sends no Telegram report for a 5xx.
- `curl -g` keeps `orderBy[and][0][method]` literal; without it, curl treats the brackets as a glob.
- A mocked drizzle chain can capture the argument of `.orderBy(...)` and render it with `new PgDialect().sqlToQuery(...)`, which asserts the sort statement without a database.
