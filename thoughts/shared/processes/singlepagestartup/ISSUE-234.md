---
issue_number: 234
issue_title: "Bound anonymous Subject growth with safe retention and session initialization"
repository: singlepagestartup
created_at: 2026-09-17T23:13:33Z
last_updated: 2026-09-17T23:13:33Z
status: active
current_phase: research
---

# Process Log: ISSUE-234 - Bound anonymous Subject growth with safe retention and session initialization

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

- Summary: The issue was created on GitHub on 2026-09-10 (`https://github.com/singlepagestartup/singlepagestartup/issues/234`) outside the local `core/00-create` flow; no ticket or process file existed before the research phase.
- Outputs: GitHub issue #234 with one follow-up comment (2026-09-11).
- Notes: Label `size:medium`; priority, type, and size are stated in the issue body.

### Research

- Summary: Documented the live anonymous-Subject lifecycle: browser init component and its component-local guard, `authentication/init` (new Subject per call, 28-day anonymous refresh token) and `authentication/refresh` (re-issues with the one-day general refresh lifetime), the agent cleanup handler (`createdAt`-based, full relation loads, sequential HTTP deletes with swallowed errors), the uncalled 30-day RBAC service, the cron dispatcher and Broadcast markers (one-hour default expiry; the `0 0 * * *` agent is not seeded by the repository), the ten cascading Subject relations, action logging (allow-listed social routes only), `updatedAt` write sites, Subject indexes, the #169 batching pattern, and existing BDD coverage. All issue claims verifiable from code hold at current line numbers; the `apps/api/.env:63` override is environment-specific and not reproducible from the repository.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-234.md`, `thoughts/shared/research/singlepagestartup/ISSUE-234.md`.
- Notes: Research ran in the worktree `.claude/worktrees/issues-2026-09-18` at commit `29370bcbf8` without database access, GitHub comments, or Project status changes; the issue comment and the move to "Research in Review" remain for the orchestrating session. Investigation was sequential (no sub-agents) because the issue already pinned the relevant files.

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

### Incident 1 — Editorial-pass contract path does not exist

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: `CLAUDE.md` requires the final editorial pass defined in `.agents/contracts/editorial-pass.md` and references `.codex/skills/unslop/SKILL.md`; neither file exists in the worktree (`find` over `.agents`, `.claude`, `.codex` found no `*editorial*` or `*unslop*` file).
- **Root Cause**: The contract is referenced by the shared instructions but was never added to the repository, or was removed without updating `CLAUDE.md`/`AGENTS.md`.
- **Fix**: Applied the contract's stated intent directly: kept facts, line references, uncertainty, and terminology unchanged; removed filler and hedging; kept English throughout.
- **Preventive Action**: Add the contract file or correct the reference in `CLAUDE.md` and `AGENTS.md` (candidate for `utilities/post_commit_retro.md`).
- **References**: `CLAUDE.md` ("Before storing, publishing, or returning prose ..."), `.agents/contracts/`.

### Incident 2 — Worktree shell guard rejects compound Bash commands

- **Phase**: Research
- **Occurrences**: 4
- **Symptom**: Commands combining `for` loops with computed paths, `sed`/`python3` with variable arguments, or heredoc script generation were refused with "too complex to verify that it stays inside the worktree".
- **Root Cause**: The worktree isolation guard only accepts plain commands whose arguments are spelled out; loops and runtime-computed values cannot be proven to stay inside the worktree.
- **Fix**: Split reads into plain `cat -n`/`grep -n`/`sed -n` calls with literal paths, wrote scripts and documents with the Write tool, and ran scripts with a single literal invocation.
- **Preventive Action**: In worktree sessions, prefer one literal command per file and the Write tool for generated files; avoid `for f in ...; do cat "$f"; done` and `python3 -c` with interpolated paths.
- **References**: Bash tool refusals during this session.

### Incident 3 — ISSUE-213 research cites a removed advisory-lock helper

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: `thoughts/shared/research/singlepagestartup/ISSUE-213.md` cites `libs/shared/backend/database/config/src/lib/advisory-lock.ts:30-54` and lock usage in `telegram/bootstrap.ts:1726-1734`; the file and the usages do not exist at `29370bcbf8`.
- **Root Cause**: Commit `e0273194c8` (2026-07-22, "fix(data): enforce natural keys without runtime locks") removed the helper and its integration spec two days after `0d5af32d28` added them; the research document was not updated.
- **Fix**: Recorded the current state (natural-key unique indexes plus `libs/modules/rbac/backend/repository/database/src/lib/natural-key-repair.ts`, no runtime lock helper) in the ISSUE-234 research document. During this session a verification note dated 2026-09-18 was added to the ISSUE-213 Summary by another session, so the stale references are now flagged at their source.
- **Preventive Action**: When reusing ISSUE-211/213 concurrency findings, verify the lock helper's existence first; treat "advisory lock" references in those artifacts as historical.
- **References**: `git log -- libs/shared/backend/database/config/src/lib/advisory-lock.ts`, `thoughts/shared/research/singlepagestartup/ISSUE-234.md` (Architecture Documentation).

## Reusable Learnings

- The agent module reads RBAC data through in-process `CRUDService` instances bound in `libs/modules/agent/models/agent/backend/app/api/src/lib/bootstrap.ts:196-215`, while mutations go through the server SDK over HTTP; `find()` without `limit` returns every row (`libs/shared/backend/api/src/lib/repository/database/index.ts:86-93`).
- Repository seed data for agents lives in `libs/modules/agent/models/agent/backend/repository/database/src/lib/data/*.json`; production-only agents (such as the `0 0 * * *` cleanup agent) will not appear there, so "the agent exists in DB" claims need database evidence.
- `apps/api/.env` is generated by `apps/api/create_env.sh` and git-ignored; issue claims about specific `.env` line numbers are environment-specific and should be verified against `create_env.sh` and `tools/deployer/api/api.env.j2` instead.
