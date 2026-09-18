# Issue #233: Bound HTTP-cache generations and recover requests after Redis OOM/restart

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/233
**Issue**: #233
**Status**: Research Needed
**Created**: 2026-09-10
**Priority**: high
**Size**: large
**Type**: bug
**Labels**: size:large

---

## Problem to Solve

A production SPS child (didigallery) became unavailable on 2026-09-10 without a new deployment or same-day editorial changes. Global memory exhaustion repeatedly killed Redis. After Redis recovered, the surviving API process continued hanging on the HTTP-cache path; the storefront rendered `Not found` from a cached HTTP-200 shell.

Restarting API and then Host through Portainer restored the site, but the cache-growth mechanism remains. This needs a framework fix because the cache/provider/deployment/startup implementations below are byte-identical between the deployed child source and current upstream `main`.

**Priority:** high. **Type:** bug. **Size:** large. This report captures incident evidence and proposed directions; implementation and numeric budgets require the normal research/plan gates.

### Environment and scope

- Child source: `flakecode/didigallery@67a960f34465d73496efcd7ae9fee37122479b41`; deployed Aug 4, image `singlepagestartup/didigallery:0.0.224`, digest `sha256:50131dc9e1c21c1877a1cc0c6062ae85bda30099d878b2a618b3aebaf377e138`.
- Upstream reviewed: `99e3037f085283f666d96654750cff5ecb5ac620` (main verified through GitHub on Sep 10).
- Bun 1.3.14, ioredis 5.6.0; Docker Swarm; 7.8 GiB RAM, no swap, about 20 GiB disk free.
- API/Host/Redis had no container memory limit. Redis: `maxmemory=0`, `maxmemory-policy=noeviction`; production HTTP-cache `KV_TTL=86400`.

## Key Details

### Confirmed production evidence

All times UTC (Moscow +3).

| Observation                | Evidence                                                                                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Global OOM cascade         | 86 kernel OOM victims, 12:18:24–14:10:53: one Bun (~2.79 GiB anonymous RSS), 85 Redis processes                                                    |
| Swarm disruption           | Heartbeat deadlines and lost agent sessions aligned with OOM; repeated service recreation, unchanged deployed image                                |
| Redis recovery             | Last restart 14:10:59; ready 14:11:06 after loading 303,804 RDB keys                                                                               |
| Surviving API              | Started 14:09:56, before final Redis kill; ioredis unhandled error events at 14:10:54 and 14:10:57                                                 |
| Persistent request failure | Ordinary GET API `/` timed out after 8 seconds with no bytes, also on localhost inside API and from Host                                           |
| Cache differential         | OPTIONS `/` 204/~0.30 s; GET with `Cache-Control: no-store` expected anonymous 403/~0.17 s; normal GET hung                                        |
| Redis connectivity         | Authenticated redis-cli and a fresh ioredis client inside API both returned PONG; diagnostic Redis client count was 1, with no application clients |
| User-facing failure        | Browser showed `Not found`; direct HTML returned 200 with `x-nextjs-cache: HIT`; Host logged `UND_ERR_HEADERS_TIMEOUT`                             |
| Recovery                   | API force restart 19:56 restored normal GETs; Host force restart 19:58 restored home and catalog in a real browser                                 |
| Post-recovery              | Around 20:06: API expected 403/~0.14 s; home 200/~0.47 s, catalog 200/~0.66 s; no new OOM in follow-up                                             |

Only API/Host tasks were restarted with unchanged specs/image. No database records or Redis keys were explicitly deleted.

#### Measured memory amplification

A live, non-atomic SCAN + MEMORY USAGE measured 153,274 keys / 1,812,535,124 bytes. The prefix `http-cache:data:http://api:4000/api/rbac/subjects` accounted for:

- **140,158 keys across 394 distinct path generations**.
- **1,795,329,432 bytes (~99% of measured key memory)**.
- Full-list responses around **2.5 MiB**, duplicated across generations.

Each successful mutation bumps path/topic versions. Later reads use new keys; obsolete response keys are not removed and retain their original 24-hour TTL. Anonymous initialization creates a Subject, so normal new sessions invalidate the subject collection even when nobody edits content. Query variants multiply the retained generations.

This retained memory is directly measured. The precise initiating request/workload behind the first Bun OOM is **not established**. Similarly, the cache-path hang and restart recovery are confirmed, but the precise ioredis/Bun internal failure state is not proven.

#### Additional restart pressure

`start.sh api` launches `./migrate.sh seed &` concurrently with the API. During recovery the API container reached ~2.13 GiB with nested Nx/Node migration workers while main Bun was ~0.4 GiB. Repeated task recreation repeats this startup load.

## Implementation Notes

### Framework code entry points

- [HTTP-cache keys, lookup, version bump, fire-and-forget response write](https://github.com/singlepagestartup/singlepagestartup/blob/99e3037f085283f666d96654750cff5ecb5ac620/libs/middlewares/src/lib/http-cache/index.ts#L53): key construction L53–64; awaited reads L173–196; mutation invalidation L217–255; retained response TTL L262–279. Preserve the existing invalidation-before-WebSocket-broadcast contract from #195.
- [Shared ioredis provider](https://github.com/singlepagestartup/singlepagestartup/blob/99e3037f085283f666d96654750cff5ecb5ac620/libs/providers/kv/src/lib/redis/index.ts): retry/reconnect configuration without an explicit command deadline.
- [Deployer API template hardcodes KV_TTL=86400](https://github.com/singlepagestartup/singlepagestartup/blob/99e3037f085283f666d96654750cff5ecb5ac620/tools/deployer/api/api.env.j2#L98).
- [Redis deployment template](https://github.com/singlepagestartup/singlepagestartup/blob/99e3037f085283f666d96654750cff5ecb5ac620/tools/deployer/redis/docker-compose.redis.yaml.j2): no memory budget/eviction configuration or service resource limits.
- [Concurrent startup migration](https://github.com/singlepagestartup/singlepagestartup/blob/99e3037f085283f666d96654750cff5ecb5ac620/start.sh#L10).
- [Page lookup suppresses errors](https://github.com/singlepagestartup/singlepagestartup/blob/99e3037f085283f666d96654750cff5ecb5ac620/libs/modules/host/models/page/frontend/component/src/lib/singlepage/find-by-url/server.tsx); [Host maps missing data to notFound](https://github.com/singlepagestartup/singlepagestartup/blob/99e3037f085283f666d96654750cff5ecb5ac620/apps/host/app/%5B%5B...url%5D%5D/page.tsx#L68).

### Proposed remediation directions

1. **Bound cache amplification.** Separate response-cache TTL from other KV lifetimes; evaluate shorter per-route TTL (e.g. 30–300 seconds as a starting experiment), generation cleanup, response-size admission limits, and query-key cardinality limits. Avoid caching unbounded subject lists; use paginated/narrow reads and verify authorization isolation. Cleanup must handle concurrent reads/writes without stale generation resurrection and without a full blocking key scan on each mutation.
2. **Budget memory.** Allocate Redis and service limits/reservations with room for PostgreSQL, OS, RDB/AOF overhead and startup. Prefer separating disposable HTTP responses from authentication/durable KV state before applying an all-keys eviction policy. A Redis logical database or key prefix alone does not isolate eviction. Do not solve this with FLUSHALL or indiscriminate eviction of authentication state. Redis documents [memory bounds and mixed cache/persistent workloads](https://redis.io/docs/latest/develop/reference/eviction/).
3. **Bound cache failure latency and recover.** Add command deadlines, explicit reconnect/error telemetry and recovery for the long-lived client; test against deployed runtime versions. A failed response-cache lookup can bypass memoization and proceed through normal authorization/business handlers under a controlled circuit breaker. Failures in authentication or durable KV operations must retain their own failure semantics. Account for missed invalidations before re-enabling cached reads. [ioredis reconnect behavior](https://github.com/redis/ioredis#auto-reconnect) is a reference, not proof of a specific library bug.
4. **Expose real readiness and correct frontend errors.** Detect stalled dependencies within a bound; distinguish backend outage from missing content and prevent persistent cached error/404 pages. An HTTP-200 shell or 1/1 replicas is insufficient.
5. **Control startup work.** Run migrations/seeding in a bounded deployment step or otherwise prevent overlapping recovery workloads; coordinate with #216.
6. **Observe recurrence.** Track cache bytes/keys by route and generation, write rate/response sizes, oldest obsolete generation, Redis reconnects/timeouts, memory headroom/OOM, and browser/API health. Alert before capacity exhaustion.

## Acceptance Criteria

Use an isolated environment with synthetic data, not production failure injection.

- Seed ~12.6k Subjects; repeatedly create anonymous sessions and interleave full/filtered Subject reads under the deployment TTL. Demonstrate pre-fix retained-generation growth, then show a measured bound under sustained churn with the fix.
- Kill/restart or interrupt Redis while API/Host survive. Requests must finish within the documented deadline; after Redis recovery the same processes must serve pages without manual restarts.
- Assert cache invalidation ordering, concurrent mutation/read correctness, auth isolation, and recovery after failed version writes.
- Verify auth/durable KV records remain safe under the selected cache memory policy; no global cache clear is required.
- Verify bounded startup footprint and frontend recovery with meaningful dependency/visual checks.
- Publish capacity settings, tradeoffs, rollout/rollback instructions and measurements for child projects.

## References

### Related findings and limits

#195 introduced the relevant cache/invalidation contract; #223 concerns long page-cache agent aborts; #216 concerns startup repair/migration work. These do not currently describe this cache-retention/OOM incident. #178 has a generic aborted-operation signature but was closed and does not establish this cause.

Checked successful SSH sources, deployed image/source diff, RBAC grants/identities and editorial timestamps did not reveal unauthorized changes. Failed SSH scans occurred, but are not proof of compromise. Access/audit-log retention was incomplete, so compromise cannot be categorically excluded; an attack is not required to explain the measured cache amplification.

Companion: [#234 — anonymous Subject retention and initialization](https://github.com/singlepagestartup/singlepagestartup/issues/234). Reducing Subject churn complements this fix; it does not replace bounded cache retention and Redis recovery.

## Comments

### Comment by @flakecode (2026-09-14T21:24:46Z)

#### Production follow-up: crawler-amplified rendering, Bun OOM, and restart aftershock (2026-09-14)

This second production incident adds a distinct workload to the cache-retention and recovery problem already described here: automated public-page crawling can turn a modest number of external HTML requests into a much larger amount of Host → API work and high-cardinality HTTP-cache writes.

This is **not evidence of a targeted attack or compromise**. The source network belongs to Meta, but the exact crawler User-Agent and intent were not retained because Traefik access logging was disabled. The evidence supports crawler-driven load amplification, not a claim that Meta intentionally caused an outage.

##### Confirmed incident timeline

All times UTC; Moscow time is UTC+3.

| Time         | Observation                                                                                                                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Before 20:19 | Provider graph stayed near the 8 GiB host ceiling with roughly 180–350% CPU. API/Host logs contained PostgreSQL timeouts/resets and failed fetches.                                                                                       |
| 20:19:26     | Linux OOM killed the API `bun` process at about **3.82 GiB anonymous RSS**. This was a different victim from the Redis-heavy 2026-09-10 recurrence.                                                                                       |
| 20:19–20:20  | The Swarm agent lost its manager session and recreated the application tasks. The old Host task exited 137; Redis/PostgreSQL also restarted and recovered.                                                                                |
| 20:29        | All services were 1/1, but recovery pressure remained high: API used about **1.56 GiB**, **240% CPU**, and **191 PIDs**. Its tree contained `migrate.sh seed`, nested Nx repository migrations/repairs, plugin workers, and the live API. |
| 20:31–20:35  | The migration chain reached Analytic and then `api:db:seed`. API stayed around 1.6–1.8 GiB until seed completed. No second restart was triggered because that would have launched the same startup workload again.                        |
| 20:36        | Background migration/seed processes were gone. API fell to about **976 MiB / 13.5% CPU**; the node had **4.42 GiB available** and the affected author page returned HTTP 200.                                                             |

No new kernel OOM was recorded after 20:19:26.

##### External workload and attribution

- API logs contained **876 matching author-page not-found records in five minutes**, plus common enumeration paths such as `/careers`, `/vacancies`, and related variants. A matching record count is not necessarily a request count because exception output can repeat the message.
- A packet-header sample captured rapid new HTTPS connections from many addresses in `57.141.20.0/24`, including `.2`, `.5`, `.8`, `.10`, `.12`, `.13`, `.14`, `.16`, `.18`, `.44`, `.45`, `.55`, `.56`, `.57`, `.62`, `.64`, `.70`, and `.74`.
- RIPE RDAP identifies the containing allocation as `FB-BLOCK`, maintained by `meta-mnt` / Meta. IP ownership is confirmed; the specific Meta crawler token is not.
- Before mitigation, one 30-second interval produced **120 page-not-found log records** and added **218 Redis keys** without an operator request.
- A temporary `DOCKER-USER` rule dropped only `57.141.20.0/24` on TCP/443. The matching error volume fell from 120 to 4 records per 30 seconds. SYN retransmits confirmed that the source no longer completed connections.
- Accepted renders continued briefly after the block. Once that backlog drained, Redis changed by only **one key in 30 seconds** and API CPU was about 1.31%.

The runtime firewall rule was an emergency, reversible mitigation. It is not a framework solution, may disappear after reboot/firewall regeneration, and can suppress Facebook/Instagram link previews from the same subnet.

##### Cache and fan-out evidence

After Redis recovered from a roughly 613 MiB RDB, a live scan measured:

- **119,434 total Redis keys**;
- **114,203 `http-cache:data:*` keys**;
- **65,372 subject-related cache entries**.

During the crawler window, newly created keys covered many routes: products, product-file relations, product attributes, currencies, RBAC product relations, file records, widgets/features, blog relations, and Host page URL lookups. This shows the relevant amplification shape:

```text
one external page request
  -> Next/Host render
  -> many internal API reads across modules and relations
  -> many query variants and HTTP-cache writes
  -> Redis key/byte growth and API allocation pressure
```

The precise per-render subrequest count was not observable with the retained logging, so the multiplier still needs controlled measurement. The incident does establish that blocking one external source stopped both the not-found stream and sustained key growth after accepted work drained.

Two targeted `UNLINK` operations removed only derived `http-cache:data:*` keys. The final pass removed 9,402 crawler-created entries and left 12 service/version keys with about 992 KiB used memory. PostgreSQL, sessions, and business records were not modified.

##### Causal boundaries

Confirmed:

- Bun reached approximately 3.82 GiB RSS and was selected by the kernel OOM killer.
- The public crawler workload came from a Meta-owned network and materially increased errors, internal work, and cache cardinality.
- API startup runs migrations and seed concurrently with the serving process, creating a repeatable recovery-time CPU/memory aftershock.
- Redis and service memory were unbounded; the host had no swap.

Not yet proven:

- That the Meta crawler alone caused Bun to reach 3.82 GiB.
- Whether Bun retained request/render objects, response bodies, aborted fetches, cache-write buffers, or another allocation class.
- The exact external request → Host render → API subrequest multiplier.
- Whether the source was `meta-externalagent`, a link-preview fetcher, or another Meta crawler.

##### Options to investigate

These are research directions, not an approved implementation plan.

1. **Edge and crawler controls**

   - Make `/robots.txt` and crawler policy reachable without RBAC; currently robot retrieval can fail authorization.
   - Distinguish Meta AI/indexing crawlers from user-initiated Facebook/Instagram link-preview fetchers before blocking by User-Agent.
   - Add layered limits: per-IP/CIDR/ASN request rate, concurrent renders, new-path cardinality, repeated 404s, and global admission control.
   - Prefer bounded 429/403 responses at the edge before Next rendering. Treat `robots.txt` as cooperative policy, not capacity protection.
   - Preserve an emergency deny mechanism with expiry, ownership, audit trail, and rollback; avoid permanent hand-maintained iptables rules.

2. **Bound public-render work**

   - Perform the cheapest page-existence/canonical-route lookup first and stop immediately on a miss; a random slug must not trigger catalog-wide relation loading.
   - Introduce a per-render budget for internal subrequests, bytes, time, and concurrency.
   - Propagate client disconnect/abort through Host SDK calls so abandoned renders stop database/API/cache work.
   - Add request-local deduplication/single-flight and batch APIs for repeated model/relation reads within one render.
   - Measure and cap recursion/fan-out across widgets and relation components.

3. **Bound disposable HTTP caching**

   - Separate response-cache TTL/configuration from authentication and durable KV lifetimes.
   - Evaluate route-specific TTL, response-size admission, query-cardinality limits, negative-cache policy, and cache bypass for arbitrary/high-cardinality misses.
   - Reclaim superseded generation keys instead of retaining all versions for the full original TTL.
   - Coalesce concurrent misses so many renders do not materialize the same expensive response simultaneously.
   - Separate disposable response cache from session/authentication state before enabling a cache-wide eviction policy; then apply an explicit byte/key budget.

4. **Runtime and host memory safety**

   - Add Bun heap/RSS, active request, aborted request, response-size, and pending cache-write telemetry correlated by request ID.
   - Define API/Host/Redis reservations and limits from an 8 GiB reference deployment, leaving room for PostgreSQL, Docker, the kernel, and persistence overhead.
   - Evaluate bounded swap as OOM shock absorption, not as a substitute for memory/cardinality limits.
   - Alert on available memory, cache growth rate, RSS slope, OOM events, and Swarm task churn before the node loses control-plane connectivity.

5. **Remove restart amplification**

   - Do not launch `migrate.sh seed &` from the long-running API entrypoint.
   - Run migration/repair/seed as serialized, observable, resource-bounded deployment jobs before service promotion.
   - Prevent overlapping executions and avoid rerunning the entire chain after every Swarm task recreation. Coordinate temporary natural-key repair removal with #216.

6. **Resilience and observability**
   - Enable structured edge access logs with trusted client IP, User-Agent, host, normalized route class, status, bytes, duration, and request ID; define safe retention/redaction.
   - Carry the request ID into Host → API calls and record the number/bytes/duration of internal calls per external render.
   - Expose readiness that fails on a stalled cache/database path rather than relying on `1/1` replicas.
   - Keep public reads bounded or fail-open under a cache circuit breaker where safe; authentication/durable KV failures retain strict semantics.
   - Do not cache an upstream outage as a persistent frontend 404.

##### Proposed reproduction matrix and acceptance criteria

Use an isolated environment and synthetic content; do not recreate OOM in production.

- Run separate crawls of random nonexistent paths and valid author/catalog/product paths at controlled rates. Record external requests, Host renders, internal API calls, database queries, cache keys/bytes, API RSS, and response latency.
- Demonstrate a documented upper bound for internal calls/bytes/concurrency per external render. A disconnected client must stop downstream work within a bounded time.
- Invalid high-cardinality paths must terminate after the minimal route lookup and must not grow cache cardinality linearly with unique attacker-controlled URLs.
- Under a sustained 24-hour synthetic crawler workload, Redis keys/bytes and API/Host RSS must plateau within the configured deployment budget; no OOM or Swarm manager-session loss occurs.
- The protection must preserve normal browsers, legitimate SEO crawlers under policy, and explicitly selected Meta link-preview behavior.
- Redis restart/interruption must not leave API cache reads hung, and recovery must not require manual API/Host restarts.
- API task recreation must not run migrations/repairs/seed beside the serving workload.
- Operators must be able to attribute a recurrence to route class and crawler identity and apply/revoke a time-bounded emergency rule without shell-only state.

Related scopes: #234 covers anonymous Subject lifecycle/session reuse; #216 covers removal of temporary natural-key repair. This issue should coordinate with both while retaining ownership of cache/recovery and crawler-amplification bounds.
