---
issue_number: 316
issue_title: "Harden MCP OAuth registration, scopes, sessions and outbound authentication"
repository: singlepagestartup
created_at: 2026-09-25T00:00:00Z
last_updated: 2026-09-25T22:45:00Z
status: active
current_phase: implement
---

# Process Log: ISSUE-316 - Harden MCP OAuth registration, scopes, sessions and outbound authentication

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: in_progress
- Current phase: implement
- Next step: commit, push, open the pull request and wait for the lead's review

## Phase Notes

### Create

- Summary: raised by the 2026-09-25 security review (`thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`), findings SEC-24, SEC-21. The issue is under embargo: neutral public title, detail only in the local ticket.
- Incidents: none.

### Research

- Summary: every ticket claim was checked against `78d7d43125`. All hold except one detail: `tools/deployer/mcp/mcp.env.j2:10-12` renders `RBAC_SECRET_KEY` only when the fallback flag is `'true'`; the unconditional hand-over is `tools/deployer/mcp.sh:30`, `:95`, and `apps/mcp/create_env.sh` copies the secret locally. The API's profile agent depends on delete through the internal exchange (`singlepagestartup-client.ts`, plan ISSUE-199:644), which the scope design has to keep.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-316.md`.
- Notes: GitHub Project status gates and issue comments are skipped for this wave; the lead reviews the pull request instead. Baseline: `npx nx run mcp:jest:test` 9 suites and 54 tests pass; `tsc --noEmit -p apps/mcp/tsconfig.json` is clean.

### Plan

- Summary: nine phases in the ticket's order. Delete gets its own scope `mcp:content:delete`, granted only when requested and ticked on a new consent step; the operator-secret fallback, the auth-disabled mode and the internal exchange keep every scope so local secret-header clients and the profile agent keep deleting. Private-use redirect schemes stay out; the session idle default is long (24 hours) because the maximum count bounds memory.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-316.md`.
- Notes: plan approval is delegated to the issue agent for this wave; no GitHub comment or status change.

### Implement

- Summary: all nine phases landed. Specs grew from 9 suites and 54 tests to 12 suites and 91 in `apps/mcp`; `@sps/shared-utils` and `telegram` lanes, lint and type checks pass; four mutation checks confirm the new specs guard the redirect rule, the delete scope, the client TTL extension and the fetch origin check. The HTTP proof against the API on 4316 and MCP on 3316 covered registration, consent, token, read, refused and allowed delete, 413, the fallback without the secret, and least-recently-used session eviction; throwaway data and Redis keys were removed.
- Outputs: code and documentation listed in `thoughts/shared/handoffs/singlepagestartup/ISSUE-316-progress.md`.
- Notes: the session idle default is 24 hours and the maximum 500 (about 143 KiB of heap per session); the internal exchange keeps the delete scope for the profile agent.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 2 -->

### Incident 1 — OAuth handler errors skipped the OAuth error mapping

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: an oversized registration body rejected in the spec instead of answering 413.
- **Root Cause**: `handleOAuthRequest` returned handler promises from inside `try` without `await`, so its `catch` never ran for asynchronous errors; they became the generic 500 in `http.ts`.
- **Fix**: `return await` for the register, authorize, token and revoke handlers.
- **Preventive Action**: inside `try`/`catch`, `return await` an async call whose errors the `catch` maps.
- **References**: `apps/mcp/lib/oauth.ts` `handleOAuthRequest`; `apps/mcp/lib/oauth.spec.ts` "refuses an OAuth body larger than 64 KiB".

### Incident 2 — Local environment drift during the HTTP proof

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: the API logged Redis `WRONGPASS`; the MCP could not verify subject JWTs issued by the API.
- **Root Cause**: the shared `sps-lite-redis-1` container restarted at 2026-09-25T22:04Z with the password in `apps/redis/.env`, which differs from `KV_PASSWORD` in `apps/api/.env`; `apps/mcp/.env` carries older `RBAC_JWT_SECRET` and exchange secret values than `apps/api/.env`.
- **Fix**: the proof processes received the matching values as process variables, never printed; no env file was edited.
- **Preventive Action**: compare shared secrets by hash and probe Redis auth through `docker exec` before an HTTP proof.
- **References**: `thoughts/shared/handoffs/singlepagestartup/ISSUE-316-progress.md` Incident 2.

## Reusable Learnings

- `apps/mcp/http.ts` starts a server on import, so logic that needs a spec has to live in `apps/mcp/lib`.
- In zsh, quote URLs that carry `?` in shell loops; an unquoted one is a glob and the command never runs.
- The session store refreshes a session when it is looked up, before the body is read, so an HTTP proof of least-recently-used eviction has to control which session each request touches.
