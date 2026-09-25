---
issue_number: 314
issue_title: "Review error response contents and error telemetry"
repository: singlepagestartup
created_at: 2026-09-25T00:00:00Z
last_updated: 2026-09-25T22:40:00Z
status: active
current_phase: implement
---

# Process Log: ISSUE-314 - Review error response contents and error telemetry

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: in_progress
- Current phase: implement
- Next step: finish verification, commit, publish the pull request

## Phase Notes

### Create

- Summary: raised by the 2026-09-25 security review (`thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`), findings SEC-12. The issue is under embargo: neutral public title, detail only in the local ticket.
- Incidents: none.

### Research

- Summary: both ticket claims hold on `78d7d43125`. The filter returns `stack` and `cause` for every error and awaits the Telegram send for every 5xx. The API process runs with `NODE_ENV` unset in a deployment and on a developer machine, so `NODE_ENV` cannot separate the two. The filter has 173 DI bindings, `routePath(c)` gives the matched route pattern inside `onError`, and printing a failed grammY request prints the bot token. No reader of the error body depends on `stack` or `cause`.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-314.md`.
- Notes: the GitHub status gates and issue comments are skipped under the security-wave instructions; the research was not posted to the issue.

### Plan

- Summary: body brief by default through `API_ERROR_DETAILS` (unset resolves from `NODE_ENV`, `development` and `test` give `full`), operator secret opens the full body, generated request id when the header is missing, report unawaited and de-duplicated per status, method and route pattern within `BUG_SERVICE_REPORT_WINDOW_IN_SECONDS`.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-314.md`.
- Notes: plan approval is delegated to the issue agent by the wave instructions.

### Implement

- Summary: in progress; see `thoughts/shared/handoffs/singlepagestartup/ISSUE-314-progress.md`.
- Outputs: —
- Notes: —

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 3 -->

### Incident 1 — A `NODE_ENV === "production"` gate would not cover a deployment

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: the lead's design returned the stack whenever the process is not in production, and assumed a deployment runs with `NODE_ENV=production`.
- **Root Cause**: the Dockerfile and the deployer set no `NODE_ENV`; Bun 1.3.6 loads `.env.production` only when `NODE_ENV` is already `production`, so the tracked `apps/api/.env.production` never sets it. Deployments and developer machines both run with it unset.
- **Fix**: `API_ERROR_DETAILS` resolves to `full` only for `NODE_ENV` `development` or `test`, to `brief` otherwise; `apps/api/create_env.sh` writes `full` for local development and the deployer template writes `brief`.
- **Preventive Action**: before gating behaviour on `NODE_ENV`, check what the deployed process actually receives (Dockerfile, deployer template, `start.sh`) and which dotenv files Bun loads for that value.
- **References**: research section 8; `apps/api/.env.production:1`; `tools/deployer/api/api.env.j2`; `Dockerfile`.

### Incident 2 — A type error in a spec passed jest

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: the new filter spec passed 18/18 while `tsc --noEmit` failed on a timer variable typed `NodeJS.Timeout`.
- **Root Cause**: `jest.server-preset.js` sets ts-jest `diagnostics: false`; the project tsconfig resolves `setTimeout` to Bun's `Timer`.
- **Fix**: `ReturnType<typeof setTimeout>`; tsc, jest and lint re-run green.
- **Preventive Action**: type-check the project after adding a spec; jest does not.
- **References**: `thoughts/shared/handoffs/singlepagestartup/ISSUE-314-progress.md` Incident 2.

### Incident 3 — `npm run api:dev` can undo a blanked variable

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: the HTTP proof needed the `BUG_SERVICE_*` values empty so no Telegram message would be sent, while the worktree's `apps/api/.env` holds a real bug-chat token.
- **Root Cause**: `npm run api:dev` runs through Nx, which loads project `.env` files with dotenv-expand; dotenv-expand can replace an empty process value with the file's value. Bun and `apps/api/env.ts` keep the empty value.
- **Fix**: the proof started `bun server.ts` in `apps/api` directly, the command behind the `start` target, and read the process environment to confirm the token was empty.
- **Preventive Action**: to disable an integration for a local proof, start Bun directly with the variable set empty, and check the process environment rather than the absence of a failure log.
- **References**: progress file, Phase 5.

## Reusable Learnings

- Bun loads `.env.<NODE_ENV>` from the working directory only for the `NODE_ENV` already in the process environment; with it unset, Bun loads `.env.development` and leaves `NODE_ENV` undefined.
- A spec that re-imports a module after `jest.resetModules()` must import Hono from the same registry: `hono/route` reads the match result through a `Symbol()` that differs between registries.
- Assert that a log leaks nothing with `util.inspect` of the logged arguments, the way a console transport prints them; `JSON.stringify` drops an `Error`'s message and would pass a leaking log.
- An empty variable in the process environment wins over the `.env` value under both Bun and dotenv, which lets a local proof disable an integration without editing any env file.
