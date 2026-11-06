---
issue_number: 223
issue_title: "Prevent long page-cache agents from being marked aborted while still running"
repository: singlepagestartup
created_at: 2026-09-17T23:21:55Z
last_updated: 2026-09-18T23:45:00Z
status: active
current_phase: implement
---

# Process Log: ISSUE-223 - Prevent long page-cache agents from being marked aborted while still running

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: implement
- Next step: lead verification on a running API instance, then PR and code review

## Phase Notes

### Create

- Summary: The issue was created directly in GitHub on 2026-08-02 from production log analysis of a downstream deployment (didigallery). No local ticket or process artifact existed before the research phase; the ticket snapshot was captured at the start of research.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-223.md`, https://github.com/singlepagestartup/singlepagestartup/issues/223
- Notes: The issue carries production evidence, a line-referenced root-cause claim, reproduction steps, a proposed fix, and acceptance criteria. GitHub issue comments were empty when captured.

### Research

- Summary: Documented the cron runner's dispatch and marker lifecycle, the Broadcast-backed execution records and their one-hour expiry, the sequential page-cache loop, the absence of any fetch timeout or abort configuration, the deletion of the advisory-lock helper, the deployment trigger and topology, the effective `AGENT_MAX_DURATION_IN_SECONDS` sources, and existing test coverage. Verified every line reference from the issue against the worktree and recorded drift.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-223.md`
- Notes: Research ran in an isolated worktree without GitHub status changes or issue comments; the parent session owns those steps. Bun runtime timeout facts were gathered from external documentation and are linked in the research document. The origin of the 262-second abort is not explained by repository code and remains an open question.

### Plan

- Summary: Planned the fix as a decomposition rather than a new mechanism: an agent-run service owns the marker lifecycle and the due decision, the cron controller composes, and a route middleware in the agent model's middlewares package closes a run on the handler side. Storage stays the Broadcast `cron` channel with the existing payload plus a `runId`. Plan approval was delegated to the lead, so the phases ran without a review pause.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-223.md`, https://github.com/singlepagestartup/singlepagestartup/issues/223#issuecomment-5737432602
- Notes: The lead's audit supplied the bounds the plan had to respect (SEC-28, SEC-30, appendix F23) and named `limitedParallelExecution` as the concurrency helper to finally use. The research's open question about the 262-second abort stayed open on purpose: the design no longer depends on why the caller is aborted, because the caller's outcome is no longer the run's result.

### Implement

- Summary: Implemented the three phases. The runner writes a running marker, starts the self request with the run-id header and a dispatch timeout, and returns; the `agent-run` middleware records the outcome on the handler side; a running marker blocks re-dispatch until it finishes or `AGENT_MAX_DURATION_IN_SECONDS` passes, after which the next tick supersedes it and the lost run can no longer write a result. Markers now carry an explicit expiry that covers the maximum run duration. The page-cache handler stops on a superseded run or on consecutive page failures.
- Outputs: `thoughts/shared/handoffs/singlepagestartup/ISSUE-223-progress.md`, the agent-run service, the agent middlewares package, the rewritten cron controller, four spec files, `libs/modules/agent/models/agent/README.md`.
- Notes: `npx nx run @sps/agent:jest:test` (19 suites, 103 tests) and `npx nx run @sps/agent:eslint:lint` pass, as do the `@sps/shared-utils` lanes; `npx tsc --noEmit -p libs/modules/agent/tsconfig.json` exits 0. No PR was created in this session.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 4 -->

### Incident 1 — Editorial-pass contract referenced by CLAUDE.md is missing

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: CLAUDE.md requires the editorial pass defined in `.agents/contracts/editorial-pass.md` (Codex: `.codex/skills/unslop/SKILL.md`), but neither file exists in the worktree at `29370bcbf8`; a repository-wide search for `editorial` and `unslop` found no contract.
- **Root Cause**: The instruction file references a contract that has not been added to the repository (or was removed) on this branch.
- **Fix**: Applied a plain editorial pass to the written artifacts: removed filler, kept meaning, uncertainty, terminology, and formatting unchanged.
- **Preventive Action**: Treat the missing contract as a framework gap to raise through `utilities/post_commit_retro.md`; until it exists, agents should state which editorial rules they applied.
- **References**: `CLAUDE.md` (editorial pass paragraph), `.agents/contracts/`

### Incident 2 — Advisory-lock helper cited by prior research no longer exists

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: The research brief and `thoughts/shared/research/singlepagestartup/ISSUE-213.md` cite `libs/shared/backend/database/config/src/lib/advisory-lock.ts:1-55` as an existing concurrency primitive; the file is absent and no `pg_advisory` usage remains.
- **Root Cause**: Commit `e0273194c8` ("fix(data): enforce natural keys without runtime locks", 2026-07-22) deleted the helper one day after the #213 research was written.
- **Fix**: Documented the deletion, the commit, and the RBAC README policy (`libs/modules/rbac/README.md:106-110`) in the research document instead of describing the helper as available.
- **Preventive Action**: When a cited helper is missing, run `git log --all --diff-filter=D -- '*<name>*'` before assuming a path change; record the correction in the research artifact so later phases do not plan around a removed primitive.
- **References**: `thoughts/shared/research/singlepagestartup/ISSUE-213.md:175-176`, commit `e0273194c8`

### Incident 3 — Worktree command guard and zsh glob expansion rejected batched shell commands

- **Phase**: Research
- **Occurrences**: 3
- **Symptom**: Bash calls that combined `for` loops, heredoc file writes, or `gh ... --jq` templates with `git` were refused by the worktree isolation guard as "too complex to verify"; separately, unquoted `--include=*.ts` arguments failed with `no matches found` under zsh.
- **Root Cause**: The guard only allows git/gh invocations it can prove stay inside the worktree, and zsh expands unquoted globs in option values.
- **Fix**: Split git and gh calls into single plain commands, quoted `--include='*.ts'`, and wrote multi-line artifacts with the Write tool instead of shell heredocs.
- **Preventive Action**: In worktree sessions keep each git/gh invocation on its own simple command line, quote glob patterns, and use the Write tool for files.
- **References**: worktree isolation guard for `.claude/worktrees/*` sessions; `thoughts/shared/processes/singlepagestartup/ISSUE-218.md` (Write-tool and helper conventions)

### Incident 4 — A thrown Hono handler does not reject `await next()`

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: The agent-run middleware spec expected `markFinished` to receive the handler's error message and received `{ status: 500, error: "Internal error. Agent responded with 500" }` instead.
- **Root Cause**: Hono's `compose` catches a handler exception at that handler's dispatch index and turns it into a response through the application error handler, so an upstream middleware's `await next()` resolves with the error response rather than rejecting.
- **Fix**: The spec asserts the status the middleware actually observes, and a second scenario drives the middleware directly with a rejecting `next` to cover the defensive catch branch.
- **Preventive Action**: A Hono middleware that must react to a handler failure reads the response status after `await next()`; the `catch` branch only covers errors that escape the application error handler.
- **References**: `libs/modules/agent/models/agent/backend/app/middlewares/src/lib/agent-run/index.ts`, `node_modules/hono/dist/cjs/compose.js`

## Reusable Learnings

- Cron execution markers are Broadcast messages with a default `expiresAt` of one hour and are purged opportunistically on any message create; any state stored as Broadcast markers has an implicit one-hour lifetime regardless of `AGENT_MAX_DURATION_IN_SECONDS`.
- Bun's outbound `fetch()` has an undocumented five-minute idle timeout that fails with `TimeoutError`; `timeout: false` disables it, and before Bun issue #16682 was fixed (2026-07-08) a longer `AbortSignal.timeout` was not honored. Self-fetch agents in `apps/api` currently pass neither option.
- In Swarm deployments the API self-fetch uses `API_SERVICE_URL=http://api:4000` on the overlay network, while the minute-level system cron trigger goes through Traefik over HTTPS; the two paths have different intermediaries.
- The deployer env template does not define `AGENT_MAX_DURATION_IN_SECONDS`; the tracked `apps/api/.env.production` sets it to 1200 but no API script loads that file explicitly.
- Focused Agent tests run with `npx nx run @sps/agent:jest:test --testFile=<path>`; the generic `npm run test:file` wrapper has a known Nx parsing failure (from #169 and #218 process logs).
- Route middleware registered through the `middlewares` field of a route definition is bound with `hono.use(path, middleware)` immediately before that route's handler (`libs/shared/backend/api/src/lib/app/default/index.ts:72-82`), so it runs for every method on that path; a middleware that must only act on one flow gates itself on a request header.
- A model's middlewares package is a plain folder under `backend/app/middlewares` with `index.ts` -> `src/index.ts` -> `src/lib/<name>/index.ts`; it belongs to the module's Nx project, so its specs run in the module's `jest:test` lane, and its middlewares declare a structural service type instead of importing the API package.
- `expiresAt` passed in the `pushMessage` data reaches the Broadcast message row: the repository insert converts the string to a `Date` and the insert schema drops the keys that are not columns (`libs/shared/backend/api/src/lib/repository/database/index.ts:191-205`).
- `limitedParallelExecution` awaits `Promise.race` once `concurrency` tasks are in flight, so task `concurrency + 1` starts only after one of the first `concurrency` settles; that is the property a concurrency test can assert.
