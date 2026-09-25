---
issue_number: 306
issue_title: "Scope the HTTP cache to the requesting principal"
repository: singlepagestartup
created_at: 2026-09-25T00:00:00Z
last_updated: 2026-09-25T22:17:02Z
status: active
current_phase: complete
---

# Process Log: ISSUE-306 - Scope the HTTP cache to the requesting principal

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: complete
- Next step: code review of pull request #329, then merge

## Phase Notes

### Create

- Summary: raised by the 2026-09-25 security review (`thoughts/shared/research/singlepagestartup/2026-09-25-security-review.md`), findings N-04, SEC-08. The issue is under embargo: neutral public title, detail only in the local ticket.
- Incidents: none.

### Research

- Summary: every claim of the ticket holds on `78d7d43125`. The cache answers before `is-authorized`, decides on method, `Cache-Control` and exclusions only, and keys by URL, generation vector and query string. The four credential names are read by `authorization` and `readRbacSecret` in `@sps/backend-utils`. Server-rendered page reads carry no credential; every browser carries a subject token after `init`; MCP, Telegram and the host page service's loopback reads carry the operator secret. The issue-152 scenario asserts that a subject's token-bearing cart read is cached.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-306.md`.
- Notes: two of the three parallel sub-agents could not start (concurrent sub-agent limit of the shared session); their searches were run directly with grep. The analyzer covered the SDK and client request paths.

### Plan

- Summary: a presence-based credential gate on the cacheable-GET decision, reusing `authorization` and `readRbacSecret`; mutation bumps unchanged; `no-store` and exclusions unchanged; documentation and the issue-152 scenario follow the new contract. Plan approval is delegated for this wave.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-306.md`.
- Notes: two departures from the ticket, both recorded in the plan. No public-route matcher on top of the gate: the gate alone keeps every stored body anonymous-admitted, and a matcher would drop caching for role-less public reads such as the catalog or add a permission lookup before every hit. The authorization middleware and its own decision cache stay out of this change; the ticket's agreed scope is the response cache.

### Implement

- Summary: the cacheable-GET decision skips requests that present a subject token or the operator secret, in a header or a cookie; mutation bumps, `no-store` and exclusions are unchanged. Documentation, the API comment and the issue-152 scenario follow the new contract. Unit, lint, type-check, scenario and HTTP verification passed; the HTTP run also reproduced the leak on the unfixed middleware and measured the upgrade window that the clear route closes.
- Outputs: pull request #329; `thoughts/shared/handoffs/singlepagestartup/ISSUE-306-progress.md`; code under `libs/middlewares/src/lib/http-cache/`, `apps/api/app.ts`, `apps/api/specs/scenario/`.
- Notes: review round 1 of pull request #329 moved stored bodies to the `http-cache:data:v2` namespace, so bodies written before the upgrade are never read and no deployment needs a flush. The change is a separate commit whose downstream trailer supersedes the one-time clear in the first fix commit's trailer; rewording that commit instead needs a force push, which the permission system refused. Verified on a running API: bodies stored by the `main` middleware for credentialed callers were not served by the v2 build.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 5 -->

### Incident 1 — Parallel research sub-agents could not start

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: two of the three sub-agents the research workflow asks for were refused with a concurrent sub-agent limit.
- **Root Cause**: the wave runs many issue agents in one session, and they share the sub-agent limit.
- **Fix**: ran the locator and thoughts searches directly with grep; kept the one analyzer that started.
- **Preventive Action**: in a multi-agent wave, start at most one sub-agent per question and do narrow searches directly.
- **References**: `thoughts/shared/research/singlepagestartup/ISSUE-306.md`

### Incident 2 — The shared local Redis is unreachable from the host

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: API KV calls timed out and a host ioredis client got `EPIPE` on port 6384.
- **Root Cause**: `apps/redis/docker-compose.redis.yaml` runs `redis-server --port "${REDIS_PORT:-6379}"` in the container but maps `${REDIS_PORT}:6379`; with `REDIS_PORT=6384` the server listens on 6384 inside the container and nothing answers on the mapped port 6379 (since commit 919623b47f).
- **Fix**: verification used a private `redis:latest` container on `127.0.0.1:6406` with a throwaway password, removed afterwards. Shared infrastructure untouched.
- **Preventive Action**: compare `docker logs` (`port=`) with `docker port` for the Redis container before debugging KV timeouts; the compose file needs its own fix.
- **References**: `thoughts/shared/handoffs/singlepagestartup/ISSUE-306-progress.md` Incident 1

### Incident 3 — `kill $pids` stopped nothing under zsh

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: the API kept listening after a kill of a pid list.
- **Root Cause**: zsh does not word-split unquoted variables.
- **Fix**: iterate over pids; force-stop an orphaned `bun --watch` only after confirming its cwd is this worktree.
- **Preventive Action**: loop over pids in zsh and check cwd before force-stopping on a shared machine.
- **References**: progress file Incident 2

### Incident 4 — The scenario jest process did not exit

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: jest kept running after all scenario tests finished.
- **Root Cause**: the scenario's Redis-backed `KvProvider` leaves an open connection.
- **Fix**: stopped it to flush results; later runs used `--forceExit`.
- **Preventive Action**: pass `--forceExit` when running Redis-backed scenario files with jest directly.
- **References**: progress file Incident 3

### Incident 5 — Force push of a reworded commit refused

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `git push --force-with-lease` of the branch with the reworded fix commit was denied by the auto mode permission classifier ("Git Destructive").
- **Root Cause**: removing an instruction from a published commit's trailer requires rewriting published history; the session's permission rules do not allow that.
- **Fix**: rebuilt on the published head and added the change as a new commit whose trailer supersedes the earlier instruction; the reworded line is kept locally under `backup/issue-306-reworded` and the combined message is ready for a squash or an authorized force push.
- **Preventive Action**: write trailers for the final design before the first push; after publication, correct instructions with a superseding commit unless a force push is explicitly allowed.
- **References**: pull request #329, commit `27f92da2d9`

## Reusable Learnings

- The HTTP cache key carries no principal, so whether a body may be shared is decided by which requests reach the cache at all; check what a request carries before reasoning about what a route allows.
- To prove a cache hit, read the data key's TTL before and after the second request: a hit leaves it running down, a miss resets it by writing back. Timing alone is confounded by the authorization caches warming up.
- A change to the cache's admission rule leaves entries written under the old rule addressable until they expire; change the data namespace in the same release so they are never read, instead of asking every deployment to flush.
