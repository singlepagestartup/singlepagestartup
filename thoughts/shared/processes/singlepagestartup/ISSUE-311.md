---
issue_number: 311
issue_title: "Distinguish access and refresh tokens and add server-side revocation"
repository: singlepagestartup
created_at: 2026-09-25T00:00:00Z
last_updated: 2026-09-26T01:52:00+03:00
status: active
current_phase: implement
---

# Process Log: ISSUE-311 - Distinguish access and refresh tokens and add server-side revocation

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: in_progress
- Current phase: implement
- Next step: commit, push and open the pull request; then the lead's review

## Phase Notes

### Create

- Summary: raised by the 2026-09-25 security review (`thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`), findings SEC-17. The issue is under embargo: neutral public title, detail only in the local ticket.
- Incidents: none.

### Research

- Summary: every claim of the ticket holds. The review undercounts whole-row issuance: OAuth exchange also signs the row, and eight internal sites (Telegram, agent module, three subject controllers) mint access-shaped tokens, six of them with the row. Every one of those tokens is accepted by `/refresh` today, and two reach the MCP internal exchange. Logout, `me`, `init`, `refresh` and OAuth `start` bypass the middleware through the allow-list and verify tokens themselves. The subject row has no revocation column and the module has no session model.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-311.md`.
- Notes: five read-only sub-agents mapped the frontend, the internal mint and verify sites, tests and lanes, schema patterns and prior thoughts; every load-bearing line reference was re-read before it went into the document.

### Plan

- Summary: one signing helper and a typed `verifyJwt` in `@sps/backend-utils`; a nullable `tokensValidAfter` on the subject with its predicate in the subject SDK model; every consumer that acts as the token's subject (is-authorized, refresh, init, me, logout, OAuth start) checks type and revocation; logout revokes per subject and reaches the middleware cache through a Hono context key; the response pipe clears a revoked session. Per-session revocation, rotation, `iss`/`aud` and MCP changes are out of scope.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-311.md`.
- Notes: plan approval is delegated to the issue agent for this wave. The design choice between a session table and a per-subject instant went to the instant, because the module has no session model; the consequence (logout ends every session of the subject) is stated in the plan.

### Implement

- Summary: thirteen sign sites go through `signJwt`; `verifyJwt` takes the accepted type; `tokensValidAfter` (migration 0005, generated) with `isRbacSubjectTokenRevoked` in the subject SDK model; is-authorized, refresh, `me`, logout, `init`, OAuth start and route billing (through is-authorized) refuse the wrong type and revoked tokens; `me` is the one resolver of an access token's subject and `init` and logout use it; logout names the revoked subject in `RBAC_REVOKED_SUBJECT_CONTEXT_KEY` and the middleware stops reusing that subject's cached decisions; the response pipe clears a revoked browser session; READMEs and OpenAPI paths describe the contract.
- Outputs: progress file `thoughts/shared/handoffs/singlepagestartup/ISSUE-311-progress.md` with every command, the mutation checks and the HTTP proof on port 4311.
- Notes: three incidents, all single-occurrence (partial `@sps/backend-utils` mocks, the 401 keyword for `Token revoked`, and per-token cache eviction under per-subject revocation, found by the HTTP proof). The subject migration was applied to the shared local database.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 3 -->

### Incident 1 — Partial `@sps/backend-utils` mocks hide new exports

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `init.spec.ts` failed once `init.ts` imported `signJwt` and `verifyJwt`.
- **Root Cause**: the spec's `jest.mock("@sps/backend-utils")` factory held only `logger`.
- **Fix**: `jest.requireActual("@sps/backend-utils")` spread into the factory.
- **Preventive Action**: before importing a new `@sps/backend-utils` export into a module, list the specs that mock the package partially (thirty today) and run those that execute the new path.
- **References**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/init.spec.ts`

### Incident 2 — "Authentication error." does not decide the status by itself

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `Authentication error. Token revoked` was answered with 403.
- **Root Cause**: only a bracketed `[Category]` prefix sets the category; plain messages fall to the keyword lists, where `/authentication/i` is a 403 keyword.
- **Fix**: `/token revoked/i` added to the 401 keywords, pinned by the http-error spec.
- **Preventive Action**: give every new `Authentication error. ...` message a 401 keyword and assert it in `libs/shared/backend/utils/src/lib/http-error/index.spec.ts`.
- **References**: `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts`, `libs/shared/backend/utils/src/lib/http-error/parser/index.ts`

### Incident 3 — Per-token cache eviction under per-subject revocation

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: the HTTP proof showed a second token of a logged-out subject answered from the middleware decision cache for up to 30 seconds.
- **Root Cause**: the context key named the presented token while logout revokes the whole subject.
- **Fix**: the context key names the revoked subject; the middleware reads a token's subject id before reusing a cached decision.
- **Preventive Action**: match the scope of cache eviction to the scope of revocation, and exercise it with two tokens of one subject.
- **References**: `libs/middlewares/src/lib/is-authorized/index.ts`, `libs/middlewares/src/lib/is-authorized/index.spec.ts`

## Reusable Learnings

- An HTTP proof of revocation needs a second token of the same subject with an already cached decision; the token that logs out only proves half of it.
- The README claim that a leading category phrase keeps its category is true only where the phrase is also a keyword of that category; `Authentication error` is not a 401 keyword, and `/authentication/i` is a 403 one.
