---
issue_number: 307
issue_title: "Validate URLs the API fetches on behalf of callers"
repository: singlepagestartup
created_at: 2026-09-25T00:00:00Z
last_updated: 2026-09-26T00:35:00Z
status: active
current_phase: implement
---

# Process Log: ISSUE-307 - Validate URLs the API fetches on behalf of callers

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: in_progress
- Current phase: implement
- Next step: push the branch, open the pull request and hand it to the lead for review

## Phase Notes

### Create

- Summary: raised by the 2026-09-25 security review (`thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`), findings N-05. The issue is under embargo: neutral public title, detail only in the local ticket.
- Incidents: none.

### Research

- Summary: both call sites pass the caller's URL to `fetch` unchanged, with redirects followed and no timeout or size bound. Under Bun the same `fetch` also reads `file:` URLs from disk and signs `s3:` URLs with the process credentials. The observer's only producer (RBAC checkout) and `/generate` reach the deployment's own API and host by URL, which resolve to loopback or overlay addresses, so those origins must stay reachable.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-307.md`.
- Notes: runtime behaviour was probed in the session scratchpad with Bun 1.3.6 and Node 24.11.0 (DNS, `BlockList`, redirects, `Host` header, URL parsing). Five further stored-URL fetches are recorded as outside this issue.

### Plan

- Summary: one guard and fetch wrapper in `@sps/backend-utils` (`outbound-url`), three settings in `envs/api.ts`, one-line changes at both call sites, deployer registration and a README section. The four service URLs are allowed without configuration; plain-HTTP requests go to the checked address. Plan approval is delegated to the issue agent for this wave.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-307.md`.
- Notes: the other stored-URL fetches and the operator secret inside observer payloads are recorded as out of scope for the lead to route.

### Implement

- Summary: `@sps/backend-utils` exports `assertOutboundUrl` and `fetchOutboundUrl`; `create-from-url` and the observer pipeline call the wrapper. Settings `OUTBOUND_URL_ALLOWED_ORIGINS`, `OUTBOUND_URL_TIMEOUT_MS` and `OUTBOUND_URL_MAX_RESPONSE_BYTES` live in `envs/api.ts` and pass through the deployer chain. Unit suites, lint, type checks, mutation checks and two HTTP runs on port 4307 (create-from-url and the observer) pass.
- Outputs: commit `0a3b75c122`; `thoughts/shared/handoffs/singlepagestartup/ISSUE-307-progress.md`.
- Notes: the first HTTP run exposed Incident 2; the matcher was rewritten and the run repeated.

## Incident Log

<!-- incident-count: 2 -->

### Incident 1 — zsh modifier swallowed the lint target name

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `npx nx run $p:eslint:lint` in a loop failed with `Cannot find project 'slint'`.
- **Root Cause**: zsh reads `$p:e` as the "extension" modifier.
- **Fix**: `npx nx run "${p}:eslint:lint"`.
- **Preventive Action**: brace a shell variable whenever a colon follows it.
- **References**: progress file, Incident 1.

### Incident 2 — the address check passed everything in the API runtime

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: the first HTTP run fetched loopback, private and metadata URLs although the unit suites passed.
- **Root Cause**: the API runs Bun 1.2.5 from `node_modules`, where `BlockList.check` from `node:net` returns false for every address. Runtime probes used the global Bun 1.3.6 and Jest runs under Node, where `BlockList` works.
- **Fix**: range matching on address bytes in the guard, extra spec cases, a table check under Bun 1.2.5 and 1.3.6, and a repeated HTTP run.
- **Preventive Action**: probe with `node_modules/.bin/bun`; keep security checks in plain JavaScript; run the HTTP check for anything whose behavior depends on the runtime.
- **References**: progress file, Incident 2; `libs/shared/backend/utils/src/lib/outbound-url/index.ts`.

## Reusable Learnings

- The API runs the Bun from `node_modules` (1.2.5), not the global `bun`. Probe runtime APIs with `node_modules/.bin/bun`.
- `BlockList` from `node:net` matches nothing in Bun 1.2.5; do not rely on it in code the API runs.
- The unit lane runs under Node, so a change whose behavior depends on the Bun runtime needs an HTTP run against the API.
