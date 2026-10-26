---
issue_number: 319
issue_title: "Harden the deployer edge and server configuration"
repository: singlepagestartup
created_at: 2026-09-25T00:00:00Z
last_updated: 2026-09-26T00:20:00+03:00
status: active
current_phase: complete
---

# Process Log: ISSUE-319 - Harden the deployer edge and server configuration

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: complete
- Next step: code review of pull request #328 by the lead

## Phase Notes

### Create

- Summary: raised by the 2026-09-25 security review (`thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`), findings N-10. The issue is under embargo: neutral public title, detail only in the local ticket.
- Incidents: none.

### Research

- Summary: every in-scope claim of the ticket holds against `78d7d43125`; the dev compose ports and the LLM service were not re-checked because the agreed scope leaves them as they are. Two additions: the generated inventory passes `UserKnownHostsFile=/dev/null`, which would keep `accept-new` from ever remembering a key, and Traefik force-restarts on every service deployment, which exposes middlewares defined on the Traefik service's own labels to a reported Traefik race (#9363).
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-319.md`.
- Notes: the local database shared with other agents holds no broadcast channel and no agent row, so a call to the cron route that passes its guard stops at the handler's channel check without writing anything.

### Plan

- Summary: four phases. The API admits the operator secret or a new `AGENT_CRON_SECRET` on the cron route through a guard in a new agent-model middleware package, opened by one anchored allow rule; the deployer transports the value and moves the crontab onto it without `-k`; Traefik gains a JSON access log with rotation and per-service headers middlewares; Ansible enforces host keys with `accept-new` and a persistent `known_hosts`.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-319.md`.
- Notes: plan approval is delegated to the issue agent in this wave. The headers middleware is defined in each service's labels rather than once on the Traefik service because Traefik restarts on every deployment and traefik/traefik#9363 reports middlewares on the Traefik service's own labels going missing after restarts.

### Implement

- Summary: four phases implemented and verified in three code commits: `39a1b6b0ce` (cron secret end to end), `5fdbc85ef1` (Traefik access log and security headers), `483dcfed65` (SSH host keys). Evidence is in `thoughts/shared/handoffs/singlepagestartup/ISSUE-319-progress.md`.
- Outputs: the commits above, this issue's research, plan, process and progress files, and pull request #328 (`thoughts/shared/prs/328_description.md`).
- Notes: the HTTP proof ran against a throwaway database, because the API's local database holds scheduled agents that a valid cron call would run. The ticket file stays local because it describes items outside the agreed scope.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 5 -->

### Incident 1 — zsh modifier swallowed the Nx target name

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `npx nx run $p:eslint:lint` failed with `Cannot find project 'slint'`.
- **Root Cause**: zsh reads `$p:e` as the "extension" modifier.
- **Fix**: `"${p}:eslint:lint"`.
- **Preventive Action**: brace every variable that a colon follows in zsh commands.
- **References**: progress file, Incident 1.

### Incident 2 — jest passed a spec that tsc rejects

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: TS2339 on `.then` in the new spec under `tsc --noEmit`; jest green.
- **Root Cause**: `Hono#request` returns `Response | Promise<Response>`, and ts-jest runs with `diagnostics: false`.
- **Fix**: await the request in an async helper.
- **Preventive Action**: type-check specs with `tsc --noEmit` before calling them done.
- **References**: `libs/modules/agent/models/agent/backend/app/middlewares/src/lib/request-can-run-cron/index.spec.ts`.

### Incident 3 — fixture check read the wrong database

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: the fixture channel POST answered 409 although the checked table was empty.
- **Root Cause**: `apps/db/.env` `POSTGRES_DB` differs from the API's `DATABASE_NAME`; the API database holds a `cron` channel and four scheduled agents. Nothing was written.
- **Fix**: throwaway database, created, migrated and dropped for the proof, with read gates before any valid call.
- **Preventive Action**: read the database named by `apps/api/.env` before calling a writing route; never call the cron route with valid credentials on the shared database.
- **References**: progress file, Incident 3.

### Incident 4 — Nx envFile overrides the process environment

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: an environment override cannot reach targets declared with `envFile: apps/api/.env`.
- **Root Cause**: Nx `loadEnvVarsFile` unloads the file's keys from the task environment and reloads the file.
- **Fix**: run the resolved migrate scripts and the API with `bun --no-env-file --env-file=<file>`.
- **Preventive Action**: bypass Nx when a run must use different connection settings, and confirm the effect with a read.
- **References**: `node_modules/nx/src/executors/run-commands/running-tasks.js` (`processEnv`, `loadEnvVarsFile`).

### Incident 5 — Ansible control socket path too long in the scratchpad

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `ControlPath too long` during the throwaway-sshd test.
- **Root Cause**: macOS limits Unix socket paths to 104 bytes.
- **Fix**: `ANSIBLE_SSH_ARGS=-C` in the harness.
- **Preventive Action**: disable SSH multiplexing for Ansible tests run from long temporary paths.
- **References**: progress file, Incident 5.

## Reusable Learnings

- The shared local API database is not the one named in `apps/db/.env`, and it holds scheduled agents; a cron-route proof needs its own database.
- Nx `envFile` beats the process environment; Bun with `--no-env-file --env-file=<file>` gives a run exactly one source of settings.
- In zsh, `$var:e`, `$var:h`, `$var:t` and `$var:r` are modifiers; brace variables that a colon follows.
