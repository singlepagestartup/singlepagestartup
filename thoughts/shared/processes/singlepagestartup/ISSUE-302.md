---
issue_number: 302
issue_title: "Review the payment webhook provider gate"
repository: singlepagestartup
created_at: 2026-09-25T00:00:00Z
last_updated: 2026-09-25T21:20:00Z
status: active
current_phase: implement
---

# Process Log: ISSUE-302 - Review the payment webhook provider gate

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: in_progress
- Current phase: implement
- Next step: implement the three plan phases and record verification in the progress file

## Phase Notes

### Create

- Summary: raised by a review of the billing provider routes; the public issue carries a neutral title until the fix is published.
- Incidents: none.

### Research

- Summary: the list gates payment creation only (`provider/index.ts:85-91`); the webhook handler dispatches on the path segment without it, and its `dummy` branch marks the named invoice `paid` and the linked payment intents `succeeded`. Reproduced over HTTP on the unchanged code with a throwaway invoice. The default list includes `dummy`; `apps/api/create_env.sh` does not set the variable.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-302.md`
- Notes: sub-agents mapped the callers (checkout service, Telegram bot, observer trigger, SDK actions) and the existing spec patterns. `jest.setup.ts` loads `apps/api/.env` into unit tests, so specs must control the list themselves.

### Plan

- Summary: one `isProviderAllowed` method on the singlepage payment-intent service, used by both handlers; the webhook refuses an unlisted provider before reading the body; `dummy` leaves the code default and is listed explicitly in `apps/api/create_env.sh`; the deployer example drops it. Unit specs, a DB-backed scenario and an HTTP proof verify it.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-302.md`
- Notes: plan approval is delegated to the issue agent in this wave. "Scenario specs" in the ticket's agreed scope is read as BDD scenarios for both paths plus one DB-backed scenario that does not depend on which providers a developer lists.

### Implement

- Summary: in progress.
- Outputs: `thoughts/shared/handoffs/singlepagestartup/ISSUE-302-progress.md`
- Notes: —

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 4 -->

### Incident 1 — A process-name kill can reach other agents' API servers

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: `pkill -f "nx run api:dev"` ran at about 2026-09-25T21:04Z to stop this issue's API on port 4302; the pattern matches every agent's `npm run api:dev`.
- **Root Cause**: stopping a dev server by command pattern on a machine where several worktrees run the same command.
- **Fix**: no other agent listener existed on ports 4300-4322 afterwards; the lead is told the time. Later stops signal only this worktree's own process chain (incident 4).
- **Preventive Action**: never `pkill -f` on a command line that other worktrees share; signal the chain of the assigned port and worktree.
- **References**: `thoughts/shared/handoffs/singlepagestartup/ISSUE-302-progress.md`

### Incident 2 — An exact-match scenario that a substring mutation survived

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: the predicate spec passed with `isProviderAllowed` mutated to a substring test on the whole list string.
- **Root Cause**: the scenario only checked a name that extends a listed entry; a substring test admits a name that is part of an entry.
- **Fix**: the scenario checks a part of an entry and an extension of an entry; substring and prefix mutations both fail it.
- **Preventive Action**: mutation-check an allow-list predicate in both directions before relying on its spec.
- **References**: `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/service/singlepage/index.spec.ts`

### Incident 3 — A jest worker crashed with SIGSEGV under machine load

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: one `@sps/shared-utils` suite failed to run (worker SIGSEGV) with no failing test.
- **Root Cause**: environment crash at a load average near 32; the suite does not touch the change.
- **Fix**: two re-runs passed all 13 suites.
- **Preventive Action**: re-run a signal-terminated suite before debugging it.
- **References**: `thoughts/shared/handoffs/singlepagestartup/ISSUE-302-progress.md`

### Incident 4 — Stopping the watch-mode API took the whole process chain

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: the port 4302 server survived a SIGTERM to its listener, and a multi-PID `kill $MINE` in zsh signalled nothing.
- **Root Cause**: the watch-mode listener stays up while its parents live; zsh does not word-split unquoted variables.
- **Fix**: stop the chain from the listener up through ancestors whose cwd is inside the worktree, PIDs passed as an array.
- **Preventive Action**: never stop a shared-machine dev server by pattern; walk its own chain and pass PIDs as separate arguments.
- **References**: `thoughts/shared/handoffs/singlepagestartup/ISSUE-302-progress.md`

## Reusable Learnings

- `jest.setup.ts` loads `apps/api/.env` into every unit test process: a spec that depends on an environment list must mock `@sps/shared-utils` or clear the variable itself.
- Bun and `apps/api/env.ts` keep a value already present in the process environment over `apps/api/.env`, so an HTTP proof can override one variable on the command line.
