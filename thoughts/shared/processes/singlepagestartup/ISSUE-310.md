---
issue_number: 310
issue_title: "Add rate limiting and uniform responses to authentication routes"
repository: singlepagestartup
created_at: 2026-09-25T00:00:00Z
last_updated: 2026-09-26T04:25:00Z
status: active
current_phase: complete
---

# Process Log: ISSUE-310 - Add rate limiting and uniform responses to authentication routes

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: complete
- Next step: code review of #340 by the lead; rebase onto main after #311 merges

## Phase Notes

### Create

- Summary: raised by the 2026-09-25 security review (`thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`), findings SEC-18. The issue is under embargo: neutral public title, detail only in the local ticket.
- Incidents: none.

### Research

- Summary: verified every ticket claim against the worktree and a runtime baseline on port 4310. Login already answers 401 on both failure paths, with different error text and about 90 ms versus 178 ms; forgot-password answers 404 or 201; nothing limits attempts or logs a wrong operator secret. Every authentication route is called from the browser only. The default deployer hands the API the swarm ingress address for every browser request (routing mesh publishing, Cloudflare proxy), so a per-address key needs a private-network exemption to avoid one shared bucket.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-310.md`.
- Notes: the review's "404 versus 400" statement is stale (Incident 1). The `@sps/rbac` jest config ignores every spec under `authentication/email-and-password`, so a forgot-password spec needs that ignore narrowed to the two placeholder specs.

### Plan

- Summary: own fixed-window counter over the KV provider instead of `hono-rate-limiter` (its store contract needs `decrement`, its refusal is plain text, a store error fails the request). Shared helpers in `@sps/backend-utils` (client address reader, limiter factory) because the rbac package cannot import `libs/middlewares`. A subject route middleware carries per-route budgets in the route table; a global middleware counts wrong operator secrets. Private-network addresses are not counted, so the default deployer's ingress address does not become one shared bucket. `init` stays `GET`; registration keeps its message (#280).
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-310.md` (approval delegated to the issue agent).
- Notes: per-address budgets take effect only when the API receives client addresses (Traefik `mode: host`, and Cloudflare ranges trusted with two hops when proxied); this is an operator decision reported to the lead.

### Implement

- Summary: five phases as planned. Shared helpers in `@sps/backend-utils` (client address reader, fixed-window KV limiter with deadline and fail-open), `RequestRateLimit` on seven subject routes, `OperatorSecretAttemptsMiddleware` registered before the cache and authorization, uniform login and forgot-password answers, deployer pass-through and README. Unit lanes, lint, type checks, 22 mutation checks and an HTTP proof on port 4310 all passed; the proof showed 429 with `Retry-After` at each budget, equal login answers (68.5 / 63.6 ms), the private-network exemption, the wrong-secret log without values, the environment override and the disabled mode.
- Outputs: `thoughts/shared/handoffs/singlepagestartup/ISSUE-310-progress.md`, branch `claude/issue-310-auth-rate-limit`, pull request #340 (`thoughts/shared/prs/340_description.md`).
- Notes: a mutation that broke compilation (trailing comma inside `void (...)`) proved nothing and was redone as a behavioral one; `@sps/middlewares` has no `eslint:lint` target, so its new files were linted with `npx eslint` directly; `tsc -p apps/api/tsconfig.json` reports 25 errors in 16 untouched files.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 2 -->

### Incident 1 — Review claim about login statuses was stale

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: the ticket and SEC-18 say login answers 404 for an unknown email and 400 for a wrong password.
- **Root Cause**: the shared error mapper reads a category only from a `[Category]` prefix and otherwise takes the first matching pattern; the 401 list with `/invalid credentials/i` comes first, so both messages map to 401.
- **Fix**: ran `getHttpErrorType` on both messages and probed the unchanged API; both answer 401 and differ in error text and timing. The plan targets text and timing.
- **Preventive Action**: check a status claim by running the mapper or the route, not by reading the message prefix.
- **References**: `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts:4-22`, research "Runtime baseline".

### Incident 2 — Worktree Redis password did not match the running container

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: the worktree API logged `KV connection error: WRONGPASS` at start.
- **Root Cause**: the copied `apps/api/.env` carries a `KV_PASSWORD` that differs from the `REDIS_PASSWORD` the `sps-lite-redis-1` container runs with.
- **Fix**: a scratchpad launcher reads the container's `REDIS_PASSWORD` with `docker exec` into the API process environment (dotenv does not override it); nothing is printed or written.
- **Preventive Action**: before an HTTP proof that depends on Redis, grep the API log for `WRONGPASS`; a limiter or cache that fails open hides a broken KV connection.
- **References**: scratchpad `start-api-4310.sh`, `apps/api/env.ts:1-3`.

## Reusable Learnings

- A mutation check must break behavior, not compilation: a suite that fails to load reports "0 total" and proves nothing about the guard.
- Specs for a middleware that owns a KV store pass the store through constructor options: `jest.setup.ts` loads `apps/api/.env`, so a default provider would open a real Redis client in Jest.
- To tell a status claim from its message prefix, run `getHttpErrorType` or the route: the pattern table's order decides, not the prefix.
