---
issue_number: 223
issue_title: "Prevent long page-cache agents from being marked aborted while still running"
repository: singlepagestartup
created_at: 2026-09-17T23:21:55Z
last_updated: 2026-09-17T23:21:55Z
status: active
current_phase: research
---

# Process Log: ISSUE-223 - Prevent long page-cache agents from being marked aborted while still running

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

- Summary: The issue was created directly in GitHub on 2026-08-02 from production log analysis of a downstream deployment (didigallery). No local ticket or process artifact existed before the research phase; the ticket snapshot was captured at the start of research.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-223.md`, https://github.com/singlepagestartup/singlepagestartup/issues/223
- Notes: The issue carries production evidence, a line-referenced root-cause claim, reproduction steps, a proposed fix, and acceptance criteria. GitHub issue comments were empty when captured.

### Research

- Summary: Documented the cron runner's dispatch and marker lifecycle, the Broadcast-backed execution records and their one-hour expiry, the sequential page-cache loop, the absence of any fetch timeout or abort configuration, the deletion of the advisory-lock helper, the deployment trigger and topology, the effective `AGENT_MAX_DURATION_IN_SECONDS` sources, and existing test coverage. Verified every line reference from the issue against the worktree and recorded drift.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-223.md`
- Notes: Research ran in an isolated worktree without GitHub status changes or issue comments; the parent session owns those steps. Bun runtime timeout facts were gathered from external documentation and are linked in the research document. The origin of the 262-second abort is not explained by repository code and remains an open question.

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

<!-- incident-count: 3 -->

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

## Reusable Learnings

- Cron execution markers are Broadcast messages with a default `expiresAt` of one hour and are purged opportunistically on any message create; any state stored as Broadcast markers has an implicit one-hour lifetime regardless of `AGENT_MAX_DURATION_IN_SECONDS`.
- Bun's outbound `fetch()` has an undocumented five-minute idle timeout that fails with `TimeoutError`; `timeout: false` disables it, and before Bun issue #16682 was fixed (2026-07-08) a longer `AbortSignal.timeout` was not honored. Self-fetch agents in `apps/api` currently pass neither option.
- In Swarm deployments the API self-fetch uses `API_SERVICE_URL=http://api:4000` on the overlay network, while the minute-level system cron trigger goes through Traefik over HTTPS; the two paths have different intermediaries.
- The deployer env template does not define `AGENT_MAX_DURATION_IN_SECONDS`; the tracked `apps/api/.env.production` sets it to 1200 but no API script loads that file explicitly.
- Focused Agent tests run with `npx nx run @sps/agent:jest:test --testFile=<path>`; the generic `npm run test:file` wrapper has a known Nx parsing failure (from #169 and #218 process logs).
