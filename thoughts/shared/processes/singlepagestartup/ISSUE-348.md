---
issue_number: 348
issue_title: "Attach the Admin role to count routes without an anonymous caller"
repository: singlepagestartup
created_at: 2026-09-26T00:00:00Z
last_updated: 2026-09-26T00:00:00Z
status: active
current_phase: implement
---

# Process Log: ISSUE-348 - Attach the Admin role to count routes without an anonymous caller

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: in_progress
- Current phase: implement
- Next step: complete implementation and open the pull request against `claude/issue-303-roleless-permissions`

## Phase Notes

### Create

- Summary: raised during #303 and created by the lead with a neutral title; the local ticket holds the detail. The branch is stacked on `claude/issue-303-roleless-permissions` (#346).
- Incidents: none.

### Research

- Summary: the 47 pending count rows have no public or customer caller; their only caller without a token is the admin-v2 overview card, which the host renders on the server with the server SDK and no credential. 18 of the rows have such a card. The same path already fails for counts that require a role. The shared development database holds every snapshot id except the 29 relation rows #346 added.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-348.md`.
- Notes: the admin-v2 card finding widens the change: closing the rows without moving the cards to the browser would break the admin overview for 18 more models.

### Plan

- Summary: three phases: move the admin-v2 overview cards whose count this stack closes into the browser like the tables (21 wrappers), attach the Admin role to the 47 count rows by dump from a copy of the development database, update the reviewed list with a regression scenario. Plan approval is delegated to the issue agent for this wave.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-348.md`.
- Notes: the card change is an addition to the ticket, needed to keep the admin overview working for the closed models; it covers only the cards whose count this stack closes (incident 2).

### Implement

- Summary: all three phases done. Unit lanes, lint and type checks of the 10 changed modules, the placement check and the HTTP run passed; the browser check was not run.
- Outputs: progress file `thoughts/shared/handoffs/singlepagestartup/ISSUE-348-progress.md`.
- Notes: the throwaway database was dropped and the worktree env copy restored after the HTTP run.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 2 -->

### Incident 1 — Run interrupted by the account usage limit

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: the session stopped after the lint run; the API process on port 4303 was gone when work resumed.
- **Root Cause**: the account usage limit ended the run.
- **Fix**: resumed from the progress file and the uncommitted worktree; restarted the API against the throwaway copy.
- **Preventive Action**: keep the progress file current after each verification step so a resumed run knows what is left.
- **References**: `thoughts/shared/handoffs/singlepagestartup/ISSUE-348-progress.md`.

### Incident 2 — Card change first covered every overview card

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: the first pass moved all 61 overview card wrappers to the browser, including the 40 whose count stays public.
- **Root Cause**: the change followed the table wrappers' uniformity instead of the rows the issue closes.
- **Fix**: reverted the 40 wrappers; kept the 18 for counts this issue closes and the 3 for counts #346 closed; reran types, lint and lanes.
- **Preventive Action**: limit an enabling change to the rows the issue closes and report the rest of the pattern as a follow-up.
- **References**: the coordinator's instruction to keep the change to what the closed count rows require.

## Reusable Learnings

- The host renders the admin-v2 overview on the server without credentials; a count or read that requires a role must be made from a client wrapper, as the overview tables do.
