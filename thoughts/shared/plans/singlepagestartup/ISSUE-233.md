---
date: 2026-09-19T02:25:05+03:00
issue_number: 233
repository: singlepagestartup
topic: "Bound HTTP-cache generations and recover requests after Redis OOM/restart"
status: in_review
---

# Bound HTTP-cache generations and recover requests after Redis OOM/restart — Implementation Plan

## Overview

Remove the two framework mechanisms behind the production incident: the HTTP-cache path can block a request on an unbounded Redis command, and cache generations grow without an expiry or a size limit. Numeric budgets stay environment knobs with safe defaults.

## Current State Analysis

The research (`thoughts/shared/research/singlepagestartup/ISSUE-233.md`) establishes the following, all verified against live code.

- The shared ioredis client is a process-wide singleton with no `commandTimeout`, no `connectTimeout`, ioredis's default offline queue, `maxRetriesPerRequest: 10`, a `reconnectOnError` that logs every error and always returns `true`, and no `error` listener (`libs/providers/kv/src/lib/redis/index.ts:18-34`).
- A cacheable GET awaits two or more Redis reads before `next()` with no `try`/`catch`; a rejected or never-settling promise is the whole request (`libs/middlewares/src/lib/http-cache/index.ts:173-208`). The Bun server runs with `idleTimeout: 0` (`apps/api/server.ts:9-14`), so nothing else bounds it.
- Version keys are `INCR`ed with no TTL, so `http-cache:version:*` never expires (`libs/middlewares/src/lib/http-cache/index.ts:118-126`; `libs/providers/kv/src/lib/redis/index.ts:71-85` only sets an expiry when a TTL is passed AND the counter is 1).
- Superseded data keys are never deleted; they leave Redis only through the `EX KV_TTL` written at set time (`libs/providers/kv/src/lib/redis/index.ts:87-100`) or the manual clear route. There is no response-size admission check anywhere in the middleware, and production measured ~2.5 MiB full-collection responses duplicated across 394 generations.
- Neither `apps/redis/docker-compose.redis.yaml` nor `tools/deployer/redis/docker-compose.redis.yaml.j2` sets `maxmemory` or an eviction policy, so Redis runs at the documented defaults (`maxmemory 0`, `noeviction`) and dies instead of evicting.
- `apps/api/app.ts:146-166` documents the issue-195 ordering contract (revalidation registered before http-cache, mutation bumps awaited); `apps/api/specs/singlepage/index.spec.ts:53-68` guards it.

## Desired End State

With `MIDDLEWARE_HTTP_CACHE=true`:

1. A request never waits longer than the KV command timeout for the cache. Any Redis error or timeout resolves to a cache miss or a skipped write, and the handler produces the response.
2. Redis being down or restarting produces one warning per state change per process, not one per request, and caching resumes by itself when Redis returns — no API restart.
3. Version keys carry the same `KV_TTL` as data keys and the TTL is refreshed on every bump, so an idle path's versions and data expire together and the key space of an idle system returns to empty.
4. A response larger than `HTTP_CACHE_MAX_ENTRY_BYTES` is served but not stored.
5. Redis runs with a memory budget and an eviction policy in both the local compose file and the deployer template.
6. The issue-195 ordering contract and the existing key format are unchanged.

### Key Discoveries

- `bumpCacheVersion` already passes through `storeProvider.incr`, which accepts `options.ttl` — only the middleware never passes one and the provider only applies it once (`libs/providers/kv/src/lib/redis/index.ts:78-84`). Refreshing on every bump is a provider change plus one call-site argument.
- Expiring version keys cannot resurrect a stale generation: a data key written at generation `g` expires at `write + KV_TTL`, and the bump that left `g` refreshed the version key to `bump + KV_TTL` with `bump > write`. The version counter therefore resets to 0 only after every data key from an earlier generation has already expired.
- The middleware constructs its own `StoreProvider` in the constructor and the existing spec replaces `middleware.storeProvider` with a fake (`libs/middlewares/src/lib/http-cache/index.spec.ts:46-71`). Failure and timeout behaviour is unit-testable through that same seam.
- `libs/providers/kv` already has `jest.config.ts` but no `jest:test` target in `project.json`; `libs/middlewares/project.json` shows the declaration the nx.json `targetDefaults` expect.
- `libs/middlewares/src/lib/revalidation/README.md` is the precedent for a per-middleware contract document; `http-cache` has none.

## What We're NOT Doing

- Not changing the cache key format, the exclusion tables, `routes/startup.ts`, or the issue-195 bump/broadcast ordering.
- Not closing or moving `GET /api/http-cache/clear` (handled by a separate change).
- Not adding query-parameter canonicalisation, per-route TTLs, or an identity-aware cache key (SEC-04b scope, separate work).
- Not touching `start.sh`, `migrate.sh`, the seed, the Host not-found path, readiness routes, or Redis metrics.
- Not adding dependencies, schema changes, or a generation-cleanup scanner; superseded generations are left to expire.
- Not choosing production numbers: every budget ships as an environment knob with a safe default.

## Implementation Approach

Three phases, smallest reliable change first: make the client and every cache call bounded and fail-open (removes the hang), then bound what the cache retains (removes the growth), then give the Redis deployment a memory budget (removes the OOM kill). Tests accompany each phase in the repository BDD format.

## Phase 1: Fail open, never hang

### Overview

Bound every Redis interaction and make each cache read, write, and bump fail into "miss" or "skip" instead of into the request.

### Changes Required

#### 1. Environment knobs

**File**: `libs/shared/utils/src/lib/envs/host.ts`
**Why**: The single place the framework reads configuration; downstream projects override by environment without forking a file.
**Changes**: Add `KV_COMMAND_TIMEOUT_MS` (default 250), `KV_CONNECT_TIMEOUT_MS` (default 2000), `KV_MAX_RETRIES_PER_REQUEST` (default 1) to the existing cache block, keeping the current export order.

#### 2. Bounded ioredis client

**File**: `libs/providers/kv/src/lib/redis/index.ts`
**Why**: An unbounded client with an offline queue is what turned a Redis outage into a permanently hanging API process.
**Changes**: Build the client options in one exported pure function so they can be asserted without a live server: `connectTimeout`, `commandTimeout`, the small `maxRetriesPerRequest`, `enableOfflineQueue: false`, the existing `retryStrategy`, and a `reconnectOnError` that no longer logs per error. Register one `error` listener that logs at warn level only when the connection state changes, and a `ready` listener that reports recovery. Leave `get`, `set`, `del`, `delByPrefix`, `flushall`, and the shutdown hook as they are.

#### 3. Cache guard helper

**File**: `libs/middlewares/src/lib/http-cache/guard.ts` (new)
**Why**: One place decides what a failed cache call means, instead of a `try`/`catch` copied into six call sites; the timeout also covers a client that neither resolves nor rejects.
**Changes**: A small factory returning a `run` function that races a cache operation against a deadline, returns the caller's fallback on any rejection or timeout, logs at warn level with a per-process interval backoff, and logs once when an operation succeeds after failures. Interface-first: options and the returned shape are declared as interfaces.

#### 4. Guarded middleware

**File**: `libs/middlewares/src/lib/http-cache/index.ts`
**Why**: The awaited reads before `next()` and the awaited bumps after it are the two places a Redis stall becomes a stalled request.
**Changes**: Route the version reads, the data read, the data write, and every version bump through the guard. A failed version read skips the cache for that request (no data read, no write-back) rather than falling back to generation 0, so a degraded read never serves another generation's body. A failed data read is a miss. A failed write or bump is dropped; the mutation response is already produced and is returned unchanged.

#### 5. Vercel KV provider

**File**: `libs/providers/kv/src/lib/vercel-kv/index.ts`
**Why**: The provider interface is shared; the guard lives above the provider, so the HTTP-path protection applies to both backends with no change here.
**Changes**: None beyond the TTL refresh in Phase 2 — its transport already fails fast (REST, no persistent socket), and adding a second timeout layer there is not justified.

### Success Criteria

#### Automated Verification

- [ ] `npx nx run @sps/middlewares:jest:test` passes, including new specs: a cache read that never settles still serves the handler's response; a store write failure still serves the response; a version-bump failure leaves the mutation response unchanged.
- [ ] `npx nx run @sps/providers-kv:jest:test` passes, including a spec asserting the bounded client options and the registered `error` listener.
- [ ] Lint passes for the changed projects.

#### Manual Verification

- [ ] With the API running and Redis paused, a public GET still answers within about the command timeout, and the log shows one warning, not one per request.
- [ ] After Redis is unpaused, the same GET is served from cache again without restarting the API.

---

## Phase 2: Bounded generations

### Overview

Give version keys an expiry, cap what a single cached entry may weigh, and write the retention contract down.

### Changes Required

#### 1. TTL refresh on counters

**File**: `libs/providers/kv/src/lib/redis/index.ts`, `libs/providers/kv/src/lib/vercel-kv/index.ts`
**Why**: `incr` currently applies a TTL only when the counter is created, so a counter that is bumped forever never expires; the middleware is the only caller.
**Changes**: When a TTL is supplied, set it on every increment instead of only on the first.

#### 2. Version keys expire with their data

**File**: `libs/middlewares/src/lib/http-cache/index.ts`
**Why**: Version keys with no TTL are the unbounded part of the key space, and they keep an idle path's generation vector alive forever.
**Changes**: Pass `KV_TTL` on every bump. Keep the key format unchanged.

#### 3. Response-size admission cap

**File**: `libs/shared/utils/src/lib/envs/host.ts`, `libs/middlewares/src/lib/http-cache/index.ts`
**Why**: The measured amplification was ~2.5 MiB full-collection responses multiplied by generations and query variants; refusing to store the largest bodies removes most of the retained bytes and leaves correctness untouched, since a skipped write is a later miss.
**Changes**: Add `HTTP_CACHE_MAX_ENTRY_BYTES` (default 1 MiB). Measure the serialized body before the write and skip the write above the cap, with a debug log naming the path and size.

#### 4. Retention contract document

**File**: `libs/middlewares/src/lib/http-cache/README.md` (new)
**Why**: `http-cache` has no contract document while `revalidation` does, and the reason superseded generations are left to expire has to survive the next reader.
**Changes**: Record the key shape, why a bump rotates rather than deletes, why the TTL refresh makes a stale generation unreachable before the counter can reset, the admission cap, the fail-open guard, the environment knobs, and the Redis memory policy and its trade-off for namespaces that share the instance.

### Success Criteria

#### Automated Verification

- [ ] `npx nx run @sps/middlewares:jest:test` passes, including specs asserting the version-key TTL on every bump and that an oversized response is not stored while the response is still served.
- [ ] `npx nx run @sps/providers-kv:jest:test` passes, including a spec asserting the TTL is refreshed on a non-first increment.

#### Manual Verification

- [ ] `TTL` on a `http-cache:version:*` key is positive and returns to `KV_TTL` after a mutation on that path.
- [ ] A collection response above the cap is served normally and produces no new data key.

---

## Phase 3: Redis memory budget

### Overview

Make Redis evict instead of being killed, in the local compose file and in the deployer template.

### Changes Required

#### 1. Local Redis

**File**: `apps/redis/docker-compose.redis.yaml`, `apps/redis/.env.example`, `apps/redis/create_env.sh`
**Why**: The framework's own development stack should show the setting a deployment needs, and `create_env.sh` is what materialises a new developer's `.env`.
**Changes**: Add `--maxmemory` and `--maxmemory-policy` to the `redis-server` command, both from environment variables with in-file defaults (`256mb`, `allkeys-lru`), and add the two variables to the example env and the generator.

#### 2. Deployer template

**File**: `tools/deployer/redis/docker-compose.redis.yaml.j2`, `tools/deployer/.env.example`
**Why**: The template is what a production stack actually runs; the incident host had no budget at all.
**Changes**: Same two flags, rendered from Jinja variables with the same defaults, plus the variables in the deployer env example.

### Success Criteria

#### Automated Verification

- [ ] `grep` confirms both files carry `--maxmemory` and `--maxmemory-policy` with a default value.

#### Manual Verification

- [ ] The lead's running local Redis is not reconfigured by this change (it is a file change only; the container is restarted by whoever owns it).
- [ ] `CONFIG GET maxmemory` on a freshly started stack reports the configured budget.

---

## Testing Strategy

### Unit Tests

- Guard: resolves the fallback on rejection, resolves the fallback on a never-settling operation, suppresses repeated warnings inside the backoff interval, reports recovery once.
- Middleware: read timeout serves the handler response; write failure serves the response; bump failure leaves a mutation response unchanged; every bump carries `KV_TTL`; a body above the cap is not stored.
- Provider: the client options are bounded and an `error` listener is registered; `incr` refreshes the TTL on a later increment.

### Integration Tests

None. The existing contract test for middleware ordering (`apps/api/specs/singlepage/index.spec.ts`) already covers what this change must not break, and Redis-outage behaviour is verified manually against a running instance.

### Manual Testing Steps

1. Start the API of this worktree on port 4013 with `MIDDLEWARE_HTTP_CACHE=true`, then issue the same public GET twice and compare timings.
2. Read the TTL of the path's `http-cache:version:*` key in Redis.
3. `docker pause` the Redis container, repeat the GET, confirm it answers within about the command timeout and that the log carries one warning; `docker unpause` and confirm caching resumes.
4. Request a collection large enough to exceed the cap and confirm no data key appears for it.

## Performance Considerations

The guard adds one timer per cache call and no extra Redis round trips. The TTL refresh adds one `EXPIRE` per bump, which is the same pipeline as the `INCR` that precedes it. The admission cap adds one byte-length measurement on the write path, which already serializes the body.

## Migration Notes

Framework-layer only; a downstream project inherits the behaviour by syncing. The defaults are safe for an unconfigured project. A project that wants the old unbounded behaviour raises `KV_COMMAND_TIMEOUT_MS` and `HTTP_CACHE_MAX_ENTRY_BYTES`; a project that already runs Redis with its own memory policy keeps it by setting `REDIS_MAXMEMORY`/`REDIS_MAXMEMORY_POLICY`. Existing `http-cache:version:*` keys written before this change keep their missing TTL until their next bump, which then sets one.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-233.md`
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-233.md`
- Audit: `thoughts/shared/research/singlepagestartup/2026-09-19-dead-code-and-security-audit.md` (SEC-04), appendix `2026-09-19-audit-appendix-resource-exhaustion.md` (F16)
- Remediation plan: `thoughts/shared/plans/singlepagestartup/2026-09-19-dead-code-and-security-remediation.md` (Layering contract, Phase 5 item 2)
- Revalidation contract: `libs/middlewares/src/lib/revalidation/README.md`
