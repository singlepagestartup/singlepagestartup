---
issue_number: 347
issue_title: "Subject checkout routes: add the owner check"
repository: singlepagestartup
created_at: 2026-09-25T23:58:55Z
last_updated: 2026-09-26T05:45:00Z
status: active
current_phase: implement
---

# Process Log: ISSUE-347 - Subject checkout routes: add the owner check

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: in_progress
- Current phase: implement
- Next step: commit, push and open the pull request

## Phase Notes

### Create

- Summary: created by the lead from the review of PR #346; the issue agent works in the worktree `.claude/worktrees/issue-347` on `claude/issue-347-checkout-owner-check`, based on `main` at `78d7d43125`.
- Outputs: GitHub issue #347.
- Notes: GitHub Project status updates and issue comments are skipped for this issue; plan approval is delegated to the issue agent.

### Research

- Summary: both checkout routes are declared without route middleware, their permission rows carry no role, and neither handler checks the caller; the order checkout acts on any order id in the body. Of the server-side callers, the Telegram free-subscription service sends the operator secret, while the subscription renewal in the order proceed service and the agent module's product checkout callback send no credential. Browser callers send the signed-in subject's own token.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-347.md`
- Notes: `RequestSubjectIdOwner` answers 400 to a missing token and 401 to another subject's token on every route that carries it. PR #346 adds `controller/singlepage/index.spec.ts`, the same path as this issue's route-table spec. The #311 branch rewrites the agent's `signRbacModuleSubjectJwt` to an access-typed `signJwt` and keeps accepting tokens without `typ`, so calling that method stays correct after both merge.

### Plan

- Summary: three phases: the renewal and the agent callback send a credential; both routes get `RequestSubjectIdOwner` and the order checkout keeps only the subject's orders; the subject README documents the guard and the caller credentials.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-347.md`
- Notes: the guard's 400/401 statuses stay as they are on its 24 other routes; the route-table spec shares its path with the one PR #346 adds.

### Implement

- Summary: all three phases are in place. Unit lanes (`@sps/rbac` 83 suites / 390 tests, `@sps/agent` 17 / 89), lint, type checks and the placement check pass, and each new scenario fails with its guard or header removed. On a copy of the development database the API answers 400 without a credential, 401 to another subject's token, and 200 to the subject's own token, the operator secret and an agent-shaped token; the Telegram free-subscription chain completes through the guarded product checkout.
- Outputs: code and specs under `libs/modules/rbac/models/subject/**` and `libs/modules/agent/models/agent/**`; `thoughts/shared/handoffs/singlepagestartup/ISSUE-347-progress.md`.
- Notes: the renewal and the agent callback were verified by unit scenarios and by requests carrying the same credentials, not end to end.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 2 -->

### Incident 1 — The proof API cannot authenticate to the shared Redis

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: the worktree's `apps/api/.env` `KV_PASSWORD` differs from the password of the `sps-lite-redis-1` container.
- **Root Cause**: the container starts with `--requirepass "${REDIS_PASSWORD}"` from `apps/redis/.env`.
- **Fix**: the proof launcher passes `KV_PASSWORD` read from `apps/redis/.env` on the command line; equality was checked by hash only.
- **Preventive Action**: override per process; never edit or print the env copy.
- **References**: `thoughts/shared/handoffs/singlepagestartup/ISSUE-347-progress.md` (Incident 1).

### Incident 2 — The run stopped at the account usage limit

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: the session ended before the HTTP run.
- **Root Cause**: account usage limit.
- **Fix**: resumed from the progress file and `git status`; the throwaway database had survived.
- **Preventive Action**: write each verification result to the progress file as soon as it exists.
- **References**: `thoughts/shared/handoffs/singlepagestartup/ISSUE-347-progress.md` (Incident 2).

## Reusable Learnings

- A proof API against a database copy needs `API_SERVICE_URL` and `NEXT_PUBLIC_API_SERVICE_URL` on its own port (server SDK loopback calls use them), the host URLs on a closed port (revalidation failures are caught), and blank `TELEGRAM_SERVICE_BOT_TOKEN`, `BUG_SERVICE_TELEGRAM_*` and SES credentials, so no Telegram invoice, bug report or email leaves the machine. Shell values override both Bun's `.env` loading and `dotenv`, including empty ones.
- A route-table spec mounts the real controller through `DefaultApp.useRoutes()`; a service whose `findById` resolves `null` stops a subject handler at its first lookup, which proves the guard let the request through without any loopback HTTP call.
