---
issue_number: 233
issue_title: "Bound HTTP-cache generations and recover requests after Redis OOM/restart"
start_date: 2026-09-18T23:25:05Z
completed_date: 2026-09-18T23:38:48Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-233.md
status: complete
---

# Implementation Progress: ISSUE-233 - Bound HTTP-cache generations and recover requests after Redis OOM/restart

**Started**: 2026-09-19
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-233.md`

Scope for this session: the framework part that removes the failure mechanism.
Production numbers stay environment knobs with safe defaults. The public
`GET /api/http-cache/clear` route is untouched (a separate change owns it).
No push and no PR: the lead reviews the branch locally.

## Phase Progress

### Phase 1: Fail open, never hang

- [x] Started: 2026-09-18T23:26:00Z
- [x] Completed: 2026-09-18T23:33:00Z
- [x] Automated verification: `npx nx run @sps/middlewares:jest:test` (9 suites, 51 tests) and `npx nx run @sps/providers-kv:jest:test` (1 suite, 6 tests) PASSED

**Notes**: Added `KV_COMMAND_TIMEOUT_MS`, `KV_CONNECT_TIMEOUT_MS`,
`KV_MAX_RETRIES_PER_REQUEST` and `KV_ENABLE_OFFLINE_QUEUE` (default `false`);
moved the ioredis options into `buildRedisOptions()`; replaced the
per-error log inside `reconnectOnError` with
`attachConnectionStateLogging`. `createCacheGuard` in
`libs/middlewares/src/lib/http-cache/guard.ts` wraps every KV call on the
request path. A failed version read skips the cache for that request instead
of falling back to generation 0, so a degraded read cannot serve a body from
another generation.

### Phase 2: Bounded generations

- [x] Started: 2026-09-18T23:33:00Z
- [x] Completed: 2026-09-18T23:36:00Z
- [x] Automated verification: same two jest targets PASSED; `npx nx run @sps/middlewares:tsc:build` and `npx nx run @sps/providers-kv:tsc:build` PASSED

**Notes**: `incr` now refreshes a supplied TTL on every increment in both KV
providers, and the middleware passes `KV_TTL` on every bump.
`HTTP_CACHE_MAX_ENTRY_BYTES` (1 MiB) keeps oversized responses out of the
store. `libs/middlewares/src/lib/http-cache/README.md` records the key shape,
why superseded generations are left to expire, and why an expiring counter
cannot resurrect a stale body.

### Phase 3: Redis memory budget

- [x] Started: 2026-09-18T23:36:00Z
- [x] Completed: 2026-09-18T23:38:00Z
- [x] Automated verification: `--maxmemory` and `--maxmemory-policy` present in both compose files with defaults; no Redis container was started, stopped or reconfigured

**Notes**: `REDIS_MAXMEMORY` (256mb) and `REDIS_MAXMEMORY_POLICY`
(allkeys-lru) added to `apps/redis/docker-compose.redis.yaml`, its
`.env.example` and `create_env.sh`, and to
`tools/deployer/redis/docker-compose.redis.yaml.j2` and
`tools/deployer/.env.example`. `apps/redis/README.md` does not exist, so the
policy and its trade-off are documented in the middleware README instead.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 1 -->

### Incident 1 — `volatile-lru` does not protect the other namespaces

- **Occurrences**: 1
- **Stage**: Phase 3 - Redis memory budget
- **Symptom**: The first README draft recommended `REDIS_MAXMEMORY_POLICY=volatile-lru` as the safe policy when durable state shares the instance.
- **Root Cause**: The MCP OAuth store writes with `EX` (`apps/mcp/lib/oauth.ts:196,213,230`) and the subject model-favorites record carries a TTL, so both are "volatile" keys and `volatile-lru` can evict them too.
- **Fix**: Documented that eviction is a property of the instance and that state which must survive belongs on its own Redis instance; corrected the same claim in `tools/deployer/.env.example`.
- **Reusable Pattern**: Before naming a Redis eviction policy as a protection, check whether the namespaces it is supposed to protect are written with an expiry.

## Summary

### Changes Made

- `libs/shared/utils/src/lib/envs/host.ts` — added `KV_COMMAND_TIMEOUT_MS` (250), `KV_CONNECT_TIMEOUT_MS` (2000), `KV_MAX_RETRIES_PER_REQUEST` (1), `KV_ENABLE_OFFLINE_QUEUE` (false), `HTTP_CACHE_MAX_ENTRY_BYTES` (1048576).
- `libs/providers/kv/src/lib/redis/index.ts` — `buildRedisOptions()` with connect/command deadlines, a small retry budget and the offline queue off; `attachConnectionStateLogging()`; `incr` refreshes a supplied TTL on every increment.
- `libs/providers/kv/src/lib/vercel-kv/index.ts` — same TTL refresh.
- `libs/providers/kv/project.json` — added the standard `jest:test` target.
- `libs/middlewares/src/lib/http-cache/guard.ts` — new fail-open guard with a deadline and backoff logging.
- `libs/middlewares/src/lib/http-cache/index.ts` — every KV call routed through the guard; version bumps carry `KV_TTL`; oversized responses are not stored; a response whose generation vector could not be read is not written back.
- `libs/middlewares/src/lib/http-cache/README.md` — new contract document.
- `libs/middlewares/src/lib/http-cache/guard.spec.ts`, `libs/middlewares/src/lib/http-cache/index.spec.ts`, `libs/providers/kv/src/lib/redis/index.spec.ts` — BDD specs for the new behaviour.
- `apps/redis/docker-compose.redis.yaml`, `apps/redis/.env.example`, `apps/redis/create_env.sh`, `tools/deployer/redis/docker-compose.redis.yaml.j2`, `tools/deployer/.env.example` — Redis memory budget and eviction policy.

### Commits

- `919623b47f` — the change and the artifacts.
- second commit — `KV_ENABLE_OFFLINE_QUEUE` seam and the README note about the
  connection window, found while probing the live local Redis.

### Evidence from the local Redis (read-only, no reconfiguration)

- `docker exec sps-lite-redis-1 redis-cli --scan` reports 91
  `http-cache:version:*` keys and no data keys: the version counters written
  before this change have no TTL and outlive every body they address. This is
  the growth mechanism the issue describes, visible on a development machine.
- `CONFIG GET maxmemory maxmemory-policy` on that container returns `0` and
  `noeviction`, the incident configuration. The running container predates the
  compose change, so it keeps those values until it is recreated.
- A probe built from `libs/providers/kv/src/lib/redis/index.ts` against that
  instance returned `INCR` 1 with TTL 30, TTL 29 after 1.2 s, then `INCR` 2
  with TTL back to 30, and a `set`/`get` round trip. The probe keys were
  deleted afterwards.

### Pull Request

- [ ] PR created: not in scope for this session (no push, no PR)
- [ ] PR number: —

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-18T23:38:48Z
