---
issue_number: 315
issue_title: "Review the host revalidation route access model"
repository: singlepagestartup
created_at: 2026-09-25T00:00:00Z
last_updated: 2026-09-26T00:10:00Z
status: active
current_phase: complete
---

# Process Log: ISSUE-315 - Review the host revalidation route access model

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: complete
- Next step: the lead's review of pull request #325, then merge

## Phase Notes

### Create

- Summary: raised by the 2026-09-25 security review (`thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`), findings SEC-25. The issue is under embargo: neutral public title, detail only in the local ticket.
- Incidents: none.

### Research

- Summary: both ticket claims hold at `78d7d43125`. The route has two API-side callers beyond the ticket (the API seed on every container start, the agent page-cache handler) and no live browser caller. Shared secrets follow the MCP exchange-secret pattern; the deployer transports operator-supplied values and cannot generate one value for two services. The host cannot import `@sps/backend-utils`, and `@sps/shared-utils` must stay free of node built-ins. GitHub Project status steps are skipped for this security wave.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-315.md`
- Notes: the ticket names `tools/deployer/host/host.env.j2`; the host template is `host.env.local.j2`. Baselines: host 14, middlewares 64, shared-utils 74, agent 88 tests passing.

### Plan

- Summary: three phases. (1) `HOST_SERVICE_REVALIDATION_SECRET` in the host envs file, `X-Host-Revalidation-Secret` in the shared constants, a fail-closed constant-time guard in the route with one 401 for every refusal and a host warning when unset. (2) The middleware, the seed and the agent page cache send the header and encode; the middleware logs refusals; the boot report names the variable. (3) Local bootstrap, deployer, GitHub secret lists and docs. Approval is delegated for this wave.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-315.md`
- Notes: the lead's suggestion to generate the value in the deployer templates does not fit: Jinja cannot call `generate_secret`, `api.sh` and `host.sh` would each generate a different value, and the deployer README defines operator-supplied secrets. The plan keeps the operator-supplied model and records the trade-off.

### Implement

- Summary: all three phases done. The route refuses without the secret (one 401, a host warning when unset); the middleware, the seed and the agent page cache send the header and encode; the boot report names the variable; local bootstrap, deployer and GitHub secret lists carry it; both READMEs document it. Unit lanes, lint, type checks, nine mutations, template rendering, a bootstrap dry run and an HTTP proof on port 4315 against a stub host all passed.
- Outputs: commits `5315f887e8` (code) and `776188d73c` (records); pull request https://github.com/singlepagestartup/singlepagestartup/pull/325 with its description in `thoughts/shared/prs/325_description.md`; evidence per command in `thoughts/shared/handoffs/singlepagestartup/ISSUE-315-progress.md`.
- Notes: the host route imports `crypto` rather than `node:crypto`, matching the host's existing Node built-in imports in its production build. Pre-existing and out of scope: 25 `tsc` errors in 16 untouched files under `apps/api`, two lint warnings in the API's jest configs, `TELEGRAM_SERVICE_WEBHOOK_SECRET` missing from `github_deployer.sh`.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 3 -->

### Incident 1 — Mock call history leaked between describe blocks

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: two host route scenarios in a second `describe` saw calls made by the first block.
- **Root Cause**: `jest.clearAllMocks()` ran only in the first block's `beforeEach`, while the `next/cache` mock is a module-level `jest.fn()` shared by both.
- **Fix**: file-level `beforeEach`/`afterEach`.
- **Preventive Action**: clear shared module-factory mocks in file-level hooks.
- **References**: `apps/host/app/api/revalidate/route.spec.ts`

### Incident 2 — zsh history modifiers in `$var:word`

- **Phase**: Research, Implement
- **Occurrences**: 2
- **Symptom**: `git show $B:thoughts/...` failed as an ambiguous argument; `nx run $p:eslint:lint` reported `Cannot find project 'slint'` and exited 1 without linting.
- **Root Cause**: zsh applies `:t` and `:e` as modifiers to `$B` and `$p`.
- **Fix**: `${B}:path`, `${p}:eslint:lint`.
- **Preventive Action**: brace every variable that is followed by a colon.
- **References**: progress file, Phase 2 notes

### Incident 3 — zsh does not split an unquoted variable

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `for f in $files` iterated once over sixteen paths.
- **Root Cause**: zsh does not word-split unquoted parameter expansions.
- **Fix**: `while IFS= read -r` over a file list.
- **Preventive Action**: iterate line by line, or use `${=var}`.
- **References**: progress file, Phase 2 notes

## Reusable Learnings

- `jest.setup.ts` loads `apps/api/.env` and `apps/host/.env.local` into every test process; a spec that depends on an env-derived constant mocks it with a getter instead of reading it.
- On a machine shared with other agents, stop a dev server by killing its own process tree and whatever listens on its own port; `pkill -f "nx run api:dev"` would stop every agent's API.
- A stub HTTP server that records only booleans (header present, header matches) proves a service-to-service credential over HTTP without printing it.
