# HTTP response cache

Memoizes GET responses in the KV store. Registered in `apps/api/app.ts` only
when `MIDDLEWARE_HTTP_CACHE === "true"`.

The cache serves and stores responses only for requests that carry no
credential. Its key is the request URL, the generation vector and the query
string, with no principal in it, so which callers share a body is decided by
which requests reach the cache at all (see
[Credentialed requests](#credentialed-requests)). A request without a
credential also bypasses the cache when it sends `Cache-Control: no-store` or
its route is excluded (see [Extension seams](#extension-seams)).

## Keys

```
http-cache:data:<request url without query>:v<pathVersion>:t<topicVector>:<sha256(query string)>
http-cache:version:<sha256(path or "topic:<topic>")>
```

`<request url without query>` is `c.req.url`, so it carries scheme and host:
the same route reached through `http://api:4000` and through the public
hostname forms separate key families. `topicVector` is the versions of the
topics derived from the read path, sorted by topic name.

## Credentialed requests

The middleware runs before `is-authorized` in `apps/api/app.ts`, so an
anonymous hit is answered without an authorization round trip. A GET that
presents any of these credentials skips both the lookup and the write-back and
reaches authorization and its handler every time:

| Credential      | Carried in                 |
| --------------- | -------------------------- |
| Subject token   | `Authorization` header     |
| Subject token   | `rbac.subject.jwt` cookie  |
| Operator secret | `X-RBAC-SECRET-KEY` header |
| Operator secret | `rbac.secret-key` cookie   |

The middleware reads them with `authorization` and `readRbacSecret` from
`@sps/backend-utils`, the helpers the handlers use. Presence decides, not
validity: an expired or forged token still reaches authorization and gets its
refusal instead of a stored body.

A request without a credential that misses passes through `is-authorized` like
any other, and only a 2xx answer is stored. Every stored body was therefore
produced for a caller without a credential whom authorization admitted, through
the allow-list or a permission row without a role, and it is replayed only to
callers without a credential. That needs no route list, so role-less public
reads such as the product catalog stay cacheable without a permission lookup
in front of each hit.

The cost is that a request with a credential is never answered from the cache.
Browsers carry a subject token once `init` has run, and the host layout runs it
for every visitor, so client-side reads from a browser reach their handlers.
Operator-secret reads from MCP, agents and the host page service's loopback
collection reads do too. Server-rendered page reads send no credential and keep
hitting.

Mutations are not gated. A successful `POST`, `PUT`, `PATCH` or `DELETE` bumps
its versions whatever credential it carries, because a credentialed write is
what invalidates the anonymous reads it changed.

## Generations

A successful mutation increments the counters for its path, its path without a
trailing id, `/rbac/permissions` and every topic it resolves. It deletes
nothing. Later reads compute a different `v`/`t` prefix and therefore miss; the
bodies stored under the previous prefix become unreachable and expire.

Superseded generations are left to expire on purpose. Deleting them at mutation
time needs a key scan per mutation, which is a full keyspace walk on the
instance that serves the request path, and a scan that races with concurrent
writes can delete a generation another request is currently writing. Expiry
needs neither.

What bounds them instead:

- **Both key kinds expire.** Data keys are written with `EX KV_TTL`. Version
  counters are incremented with the same TTL, refreshed on every bump
  (`libs/providers/kv/src/lib/redis/index.ts`). An idle path's counters and
  bodies therefore expire together, and a system that stops receiving traffic
  returns to an empty cache namespace.
- **An expiring counter cannot resurrect a stale body.** A body stored at
  generation `g` expires at `write + KV_TTL`. The bump that moved the counter
  past `g` happened after that write and refreshed the counter to
  `bump + KV_TTL`. So whenever a counter expires and reads as generation 0
  again, every body from an earlier generation has already expired.
- **Large responses are never stored.** A serialized body above
  `HTTP_CACHE_MAX_ENTRY_BYTES` is served and skipped. One unbounded collection
  read cannot be multiplied across generations and query variants — the shape
  that filled a production Redis instance (issue #233).

## The clear route

`setRoutes(app)` registers one endpoint, `GET /api/http-cache/clear`. It
deletes both namespaces this middleware owns — `http-cache:data` and
`http-cache:version` — and nothing else, so the MCP OAuth store and subject
preferences that share the instance survive it.

It requires the operator credential: `X-RBAC-SECRET-KEY`, or the
`rbac.secret-key` cookie, compared in constant time against `RBAC_SECRET_KEY`.
A deployment that never set that variable refuses every caller rather than
admitting every caller, so the route cannot be flushed over HTTP there at all.

The credential is checked by the operator-secret middleware
(`../operator-secret`), composed into the route definition rather than left
to the is-authorized middleware, and that is not a style choice. `setRoutes(app)` runs before
`app.use(isAuthorizedMiddleware.init())` in `apps/api/app.ts`, and Hono answers
from the first matching handler: the authorization middleware is never reached
for this path. Its allow-list, and the `routes/startup.ts` deny seam a project
would normally reach for, therefore have no bearing on it — an allow rule for
this path is inert, which is why the framework's rule table no longer carries
one (issue #277). Because the guard travels with the route, it holds wherever
`setRoutes` is called; `index.spec.ts` proves it on an application that has no
authorization middleware at all.

The flush is not free: each namespace is deleted with `delByPrefix`, a
`SCAN`/`DEL` walk of the whole Redis keyspace, and the two run concurrently.
Unlike every KV call on the request path it does not go through `guard.ts`, so
it has no deadline and no fallback. Expiry, not this route, is what bounds the
cache in normal operation.

## Failure behaviour

The cache is an optimization, so a KV failure must cost a cache hit, not a
request. Every KV call on the request path goes through `guard.ts`, which
returns a fallback on any rejection and on its own deadline:

| Call           | On failure or timeout                                    |
| -------------- | -------------------------------------------------------- |
| Version read   | Cache skipped for this request: no lookup, no write-back |
| Response read  | Miss; the handler produces the response                  |
| Response write | Skipped; the response is served                          |
| Version bump   | Skipped; the mutation response is returned unchanged     |

A failed version read skips the cache instead of assuming generation 0, so a
degraded read never serves a body from a generation the caller is not on. A
failed bump leaves cached reads stale until their TTL expires; that is the
accepted cost of answering the mutation.

Failures are reported at warn level once per backoff interval, and the first
success after a failure reports recovery, so an outage is two lines rather than
one per request.

Below the guard, the shared ioredis client carries `connectTimeout`,
`commandTimeout`, a small `maxRetriesPerRequest` and no offline queue
(`libs/providers/kv/src/lib/redis/index.ts`). Without them a command issued
while Redis was down was queued for an unbounded time, which is how a Redis
restart left a surviving API process hanging on every cacheable GET.

With the offline queue off, commands issued before the client reaches `ready`
— the first moments after boot and each reconnect — reject at once. On the
cache path that is a miss; other `@sps/providers-kv` callers see the error.
A project that prefers to absorb short reconnects sets
`KV_ENABLE_OFFLINE_QUEUE=true`; `commandTimeout` applies to a queued command
as well, so the wait stays bounded. That last guarantee belongs to ioredis
rather than to this repository — `sendCommand` arms the deadline before the
branch that buffers the command — so `redis/offline-queue.spec.ts` pins it
against the real client. An upgrade that moved the deadline after that branch
would otherwise turn this escape hatch back into the unbounded wait above
without changing a single option assertion.

## Environment

| Variable                     | Default | Meaning                                                                     |
| ---------------------------- | ------- | --------------------------------------------------------------------------- |
| `MIDDLEWARE_HTTP_CACHE`      | unset   | The middleware is registered only when this is `true`                       |
| `KV_TTL`                     | 30      | Seconds a cached body and its version counters live                         |
| `HTTP_CACHE_MAX_ENTRY_BYTES` | 1048576 | Largest serialized response that may be stored                              |
| `KV_COMMAND_TIMEOUT_MS`      | 250     | Per-command deadline, also the guard's default deadline                     |
| `KV_CONNECT_TIMEOUT_MS`      | 2000    | Connection deadline                                                         |
| `KV_MAX_RETRIES_PER_REQUEST` | 1       | How often a command is resent across reconnects                             |
| `KV_ENABLE_OFFLINE_QUEUE`    | `false` | `true` lets a command wait for a reconnect, bounded by the command deadline |

## Redis memory policy

`apps/redis/docker-compose.redis.yaml` and
`tools/deployer/redis/docker-compose.redis.yaml.j2` start Redis with
`--maxmemory` and `--maxmemory-policy`, from `REDIS_MAXMEMORY` (default
`256mb`) and `REDIS_MAXMEMORY_POLICY` (default `allkeys-lru`). Without a limit
Redis grows until the host's OOM killer stops it, which is what took the
instance down repeatedly during the incident.

`allkeys-lru` lets Redis evict any key once the instance is full, including
namespaces this cache does not own: the MCP OAuth store (`mcp:oauth:*`) and
subject preferences (`rbac:subject:*`) share the instance. Both of those write
with an expiry, so `volatile-lru` would not spare them either, and a separate
logical database does not help — eviction is a property of the instance. A
deployment that cannot afford to lose those records puts them on their own
Redis instance. The memory limit is what keeps the host alive, whichever
policy is chosen.

## Ordering contract

`RevalidationMiddleware` is registered before this middleware in
`apps/api/app.ts` so that the mutation version bumps, which are awaited,
complete before the WebSocket broadcast that follows them. See
`libs/middlewares/src/lib/revalidation/README.md`; the order is asserted in
`apps/api/specs/singlepage/index.spec.ts`.

## Extension seams

- `routes/startup.ts` — project cache exclusions.
- `IMiddlewareOptions.excludedRoutes` / `excludedPathPatterns` — exclusions
  passed from `apps/api/app.ts`.
- The environment variables above — a project changes the budgets without
  editing a framework file.

Exclusions bypass only the GET response cache. A mutation on an excluded path
still bumps its versions, so a cached read elsewhere cannot go stale because of
an exclusion.

There is no seam that lets a credentialed request read or write the cache. The
key carries no principal, so such a seam would hand one caller's body to
another.

There is no seam for the clear route's access, deliberately: flushing is an
operator action, so no project layer should be able to make it anonymous.
