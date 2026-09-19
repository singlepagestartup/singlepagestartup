## Summary

With `MIDDLEWARE_HTTP_CACHE=true`, a Redis outage took the API down with it. The shared ioredis client set no connect or command deadline and buffered commands in an offline queue, and the middleware awaited its Redis reads with no guard, so after a Redis restart the surviving API process hung on every cacheable GET. The same cache also grew without a limit: version counters were incremented with no TTL and superseded bodies were never removed, so full-collection responses accumulated across generations until Redis was killed for memory.

The response cache is now an optimization that is allowed to fail. Every KV call on the request path runs behind a guard that yields a miss or a skipped write on any error or deadline, so the handler always produces the response. The client carries connect and command deadlines, a small retry budget and no offline queue. Version counters expire together with the bodies they address, responses above an admission cap are served but not stored, and Redis starts with a memory budget and an eviction policy both locally and in the deployer template.

Closes #233

## Changes

- `libs/middlewares/src/lib/http-cache/guard.ts` — a fail-open wrapper for every KV call on the request path. It resolves to the caller's fallback on any rejection and on its own deadline, which defaults to `KV_COMMAND_TIMEOUT_MS` and also covers a client that neither resolves nor rejects. A failure is reported at warn level once per backoff interval per process, carrying the count it suppressed, and the first success after a failure reports recovery, so an outage is two log lines rather than one per request.
- `libs/middlewares/src/lib/http-cache/index.ts` — version reads, version bumps, response reads and response writes all go through the guard. A version read that the store cannot answer returns `null` instead of generation 0, and a request whose generation vector could not be read skips both the lookup and the write-back, so a degraded read never serves or stores a body from a generation the caller is not on. Version bumps carry `KV_TTL`, and a serialized body above `HTTP_CACHE_MAX_ENTRY_BYTES` is served without being stored.
- `libs/providers/kv/src/lib/redis/index.ts` — the ioredis options move into `buildRedisOptions()`: `connectTimeout`, `commandTimeout`, `maxRetriesPerRequest` and `enableOfflineQueue` from the environment, replacing the previous unbounded wait and `maxRetriesPerRequest: 10`. `attachConnectionStateLogging()` replaces the per-error log inside `reconnectOnError` and reports a connection error once and its recovery once. `incr` refreshes a supplied TTL on every increment rather than only when the counter is created.
- `libs/providers/kv/src/lib/vercel-kv/index.ts` — the same TTL refresh contract, so both providers behave alike.
- `libs/shared/utils/src/lib/envs/host.ts` — `KV_COMMAND_TIMEOUT_MS` (250), `KV_CONNECT_TIMEOUT_MS` (2000), `KV_MAX_RETRIES_PER_REQUEST` (1), `KV_ENABLE_OFFLINE_QUEUE` (`false`) and `HTTP_CACHE_MAX_ENTRY_BYTES` (1048576).
- `apps/redis/docker-compose.redis.yaml`, `apps/redis/.env.example`, `apps/redis/create_env.sh`, `tools/deployer/redis/docker-compose.redis.yaml.j2`, `tools/deployer/.env.example` — Redis starts with `--maxmemory` and `--maxmemory-policy`, from `REDIS_MAXMEMORY` (`256mb`) and `REDIS_MAXMEMORY_POLICY` (`allkeys-lru`).
- `libs/middlewares/src/lib/http-cache/README.md` — the cache contract: key shape, why superseded generations are left to expire and why an expiring counter cannot resurrect a stale body, the per-call failure behaviour, the connection window and the offline-queue knob, the environment table, and the Redis memory policy with its instance-wide trade-off.
- `libs/middlewares/src/lib/http-cache/guard.spec.ts`, `libs/middlewares/src/lib/http-cache/index.spec.ts`, `libs/providers/kv/src/lib/redis/index.spec.ts` — BDD specs for the guard, the middleware gates and the client options; `libs/providers/kv/project.json` gains the standard `jest:test` target.

The key format, the exclusion tables and the issue-195 bump-before-broadcast ordering are unchanged. Query canonicalisation, identity-aware keys, per-route TTLs and the public clear route stay out of scope.

## Verification

- [x] `npx nx run @sps/providers-kv:jest:test` — 1 suite, 6 tests.
- [x] `npx nx run @sps/middlewares:jest:test` — 9 suites, 51 tests.
- [x] `npx nx run @sps/providers-kv:tsc:build` and `npx nx run @sps/middlewares:tsc:build`.
- [x] Fail-open behaviour, version TTLs and recovery on a running instance with `MIDDLEWARE_HTTP_CACHE=true`.
- [x] `--maxmemory` and `--maxmemory-policy` present in both compose files with defaults. No Redis container was started, stopped or reconfigured for this change.

## How to verify it

On a running instance with `MIDDLEWARE_HTTP_CACHE=true`:

1. Issue the same public GET twice. The second response is served from the cache.
2. Mutate the path, then read its `http-cache:version` keys. They are fresh and report a TTL of 28-29 seconds, the remainder of `KV_TTL`.
3. Pause the Redis container and repeat the GET. It answers 200 in about 0.26 s, and the API log carries one warning line and one recovery line rather than one line per request.
4. Unpause Redis and repeat the GET. It is served from the cache again, without restarting the API.

## Notes

- A running Redis container keeps its previous `maxmemory` and `maxmemory-policy` until it is recreated, so an existing stack needs a redeploy to gain the budget.
- `allkeys-lru` lets Redis evict any key once the instance is full, including namespaces this cache does not own. The MCP OAuth store and subject preferences share the instance and both write with an expiry, so `volatile-lru` would not spare them and a separate logical database does not help: eviction is a property of the instance. Records that must survive belong on their own Redis instance.
- Superseded generations are left to expire rather than deleted. Deleting them at mutation time needs a keyspace scan per mutation, and a scan that races with concurrent writes can delete a generation another request is currently writing.
- A failed version bump leaves cached reads stale until their TTL expires. That is the accepted cost of answering the mutation.
- The branch carries the plan, the process document and the implementation progress record under `thoughts/shared/`.

## Downstream migration

Adaptation is required. The shared KV client fails commands fast instead of queueing them until Redis returns, and the response cache refuses bodies above a size cap, so a project that relied on unbounded waits or on caching whole collections behaves differently. A project whose non-cache KV call sites cannot tolerate an immediate rejection during the connection window keeps the previous waiting behaviour through an environment variable instead of forking the provider.

**Applies to:** projects that run the API with `MIDDLEWARE_HTTP_CACHE=true`; projects that call `@sps/providers-kv` outside the HTTP response cache, especially during API startup; and projects that deploy Redis from `tools/deployer`.

**New environment variables.** Every default is safe without a project change; a project raises a value in its own environment where the default is too strict, and no framework file needs editing.

| Variable                     | Default       | Meaning                                                             |
| ---------------------------- | ------------- | ------------------------------------------------------------------- |
| `KV_COMMAND_TIMEOUT_MS`      | `250`         | Per-command deadline, also the cache guard's default deadline       |
| `KV_CONNECT_TIMEOUT_MS`      | `2000`        | Connection deadline                                                 |
| `KV_MAX_RETRIES_PER_REQUEST` | `1`           | How often a command is resent across reconnects before it fails     |
| `KV_ENABLE_OFFLINE_QUEUE`    | `false`       | `true` lets a command wait for a reconnect, bounded by the deadline |
| `HTTP_CACHE_MAX_ENTRY_BYTES` | `1048576`     | Largest serialized response that may be stored                      |
| `REDIS_MAXMEMORY`            | `256mb`       | Memory budget the Redis container starts with                       |
| `REDIS_MAXMEMORY_POLICY`     | `allkeys-lru` | Eviction policy at that limit                                       |

**Actions:**

- Check the new KV and cache defaults against the project's own Redis latency and response sizes, and raise any of them in the project environment where the safe default is too strict.
- Review every call site that uses `@sps/providers-kv` outside the HTTP cache. While Redis is unreachable those calls reject immediately instead of waiting for a reconnect, so each one needs its own fallback or error mapping. Where such a call site must survive a reconnect rather than fail, set `KV_ENABLE_OFFLINE_QUEUE=true`; the wait stays bounded by `KV_COMMAND_TIMEOUT_MS`. Leaving it unset keeps the fail-fast default.
- Set `REDIS_MAXMEMORY` and `REDIS_MAXMEMORY_POLICY` for an existing stack before redeploying Redis from the updated template, and move records that must not be evicted onto a separate Redis instance. Eviction applies to the whole instance, not to a namespace or a logical database.

**Verify:**

- With the cache enabled, pause Redis and repeat a public GET: it answers within about `KV_COMMAND_TIMEOUT_MS` and logs one warning rather than one per request. Unpause and confirm a repeated GET is served from the cache again without restarting the API.
- After a mutation, the path's `http-cache:version` key reports a positive TTL, and a response larger than the cap produces no new data key.
- Restart Redis under load and confirm the chosen offline-queue behaviour: with the default, KV calls outside the cache reject at once and requests still answer; with the queue enabled, they wait no longer than the command deadline.
