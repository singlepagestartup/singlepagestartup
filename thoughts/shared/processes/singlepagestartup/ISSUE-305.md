---
issue_number: 305
issue_title: "Review session cookie attributes and client token handling"
repository: singlepagestartup
created_at: 2026-09-25T00:00:00Z
last_updated: 2026-09-25T23:14:30Z
status: active
current_phase: complete
---

# Process Log: ISSUE-305 - Review session cookie attributes and client token handling

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: complete
- Next step: code review of pull request #342 by the lead; fixes land on the same branch

## Phase Notes

### Create

- Summary: raised by the 2026-09-25 security review (`thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`), findings SEC-13, SEC-07. The issue is under embargo: neutral public title, detail only in the local ticket.
- Incidents: none.

### Research

- Summary: every read and write of `rbac.subject.jwt` and `rbac.secret-key` is mapped with `file:line`; the browser session flow, the browser requests that carry no `Authorization` header, and the server, MCP and Telegram callers are documented. A probe in the Claude browser pane (Chrome 152) measured how an API-origin cookie and a JS-written cookie of the same name interact across localhost ports.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-305.md`.
- Notes: option (a) hides the frontend's own JWT in local development (host `localhost:3000` and API `localhost:4000` share one cookie jar entry), which drives `init-default` into a refresh loop; that settles the choice for the plan.

### Plan

- Summary: option (b). The API accepts the JWT only from `Authorization` and writes no session cookie; the operator secret is read only from `X-RBAC-SECRET-KEY`; the four browser request paths that relied on the API cookie send the header. Five phases: secret, browser header gaps, JWT readers and cookie writes, documentation, HTTP proof.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-305.md`.
- Notes: plan approval is delegated to the issue agent for this wave. No compatibility flag: it would restore the readable credential and no framework caller needs it.

### Implement

- Summary: five phases done. The API reads the JWT only from `Authorization` and the operator secret only from `X-RBAC-SECRET-KEY`, writes no session cookie, and the browser requests that relied on the API cookie send the header. 29 mutations re-adding a removed cookie read, write or header were all killed. The HTTP proof on port 4305 covered init, me, the secret on a protected read and on is-authorized, email-and-password registration, login and refresh, the OAuth exchange and logout; fixtures deleted.
- Outputs: code and specs on `claude/issue-305-session-cookie`; progress file `thoughts/shared/handoffs/singlepagestartup/ISSUE-305-progress.md`.
- Notes: the Ethereum login is proven by its unit spec only, because its signature check may call an RPC endpoint.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 4 -->

### Incident 1 — The ticket assumed no client code can see the API-origin cookie

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: the ticket and the lead's notes treat option (a), an HttpOnly API cookie, as the least change because the host origin cannot read the API origin's cookie.
- **Root Cause**: cookies are scoped by host, not by port. In the tracked local layout both services run on `localhost`, so the API cookie and the js-cookie cookie are one jar entry; an HttpOnly entry hides the JWT from `document.cookie` and blocks the js-cookie write.
- **Fix**: measured with a two-port probe in the browser pane (research section 6); the plan takes option (b).
- **Preventive Action**: when a fix changes cookie attributes, check the hosts of the local layout and test the jar behavior across ports before relying on origin separation.
- **References**: `thoughts/shared/research/singlepagestartup/ISSUE-305.md` sections 4 and 6.

### Incident 2 — Only one research sub-agent could start

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: three of four parallel sub-agent launches failed with the concurrent sub-agent limit, because other issue agents of the wave were running.
- **Root Cause**: the session-wide limit of 20 concurrent sub-agents was already reached by the wave.
- **Fix**: researched the server-side, MCP and test questions directly; kept the browser-side question with the one sub-agent that started, then re-checked its list with a grep that found two more client functions.
- **Preventive Action**: in a wave, expect at most one free sub-agent slot; plan narrow direct reads and verify a sub-agent's enumeration with an independent grep.
- **References**: research sections 5 and 7.

### Incident 3 — A spec passed a request option object without `next`

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `tsc --noEmit` on `libs/modules/rbac` reported TS2741 in the new identity client spec although jest passed.
- **Root Cause**: `NextRequestOptions.next` is required, and the jest preset runs ts-jest with `diagnostics: false`.
- **Fix**: the spec passes `next: {}`.
- **Preventive Action**: type-check the project tsconfig, which includes specs, before trusting a green jest run.
- **References**: `thoughts/shared/handoffs/singlepagestartup/ISSUE-305-progress.md` Incident 1.

### Incident 4 — lint-staged does not run in a worktree

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `@sps/rbac:eslint:lint` failed on `prettier/prettier` in two new specs.
- **Root Cause**: `core.hooksPath` is `.husky/_`, which exists only where husky was installed, not in this worktree.
- **Fix**: `npx prettier --write` on every changed file before lint and commit.
- **Preventive Action**: in a worktree, format changed files explicitly; do not rely on the pre-commit hook.
- **References**: progress file Incident 2.

## Reusable Learnings

- Stop a throwaway server by the PID you started, not with `pkill -f` on a pattern: other agents of a wave run `bun` servers on the same machine.
