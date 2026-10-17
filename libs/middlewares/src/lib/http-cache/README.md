# HTTP response cache

`MIDDLEWARE_HTTP_CACHE=true` enables response caching in `apps/api/app.ts`.
With consistency mode `compatibility` or `enabled`, the app uses the shared
runtime cache after authorization, billing and query parsing. `off` retains this package's legacy path/topic cache. `observe` stores candidate
answers and compares them with fresh handler results without serving a hit;
its counters distinguish mismatches from concurrent-write races.

## Version-checked responses

The new namespace is `sps-consistency:v1`. A response identity hashes method,
complete URL/params, API origin, authorization/cookies, operator credential,
locale and representation. Credentials do not appear in keys or metadata.

An immutable envelope contains the body, observed dependency versions and
epoch. A disposable pointer selects a candidate envelope. Every hit checks
current PostgreSQL generations before returning its body. A late stale SET may
replace the pointer, but cannot make its old envelope pass that version check.
Reads that lack complete capture coverage are not admitted.

KV operations have a 150 ms request-path deadline. Redis failure causes a miss
or skipped write. Failure to verify PostgreSQL versions also prevents a hit.
Response entries expire after five minutes and respect
`HTTP_CACHE_MAX_ENTRY_BYTES` (default 1 MiB). PostgreSQL generations are not
removed with response entries.

Shared browser/private reads bypass the browser and Next caches. An explicit
`Cache-Control: no-store` also bypasses the SPS API response cache; a fetch
`cache: "no-store"` option alone does not. Covered authorized reads can use the
version-checked API cache. Existing custom SDK no-store headers remain until
their own access and performance checks pass.
Knowledge generation/search POST operations are not response-cache entries.

## Next rendering

Shared standard server reads use identity-specific `sps:q:<sha256>` tags with a
finite lifetime, at most 12 hours. The API registers those tags against the read
descriptor, including tracked 404 reads. Dispatcher invalidation retries before
journal delivery. Private mutable surfaces use no-store SDK reads.

Public Next ISR has an eventual guarantee: a response can remain stale between
SQL commit and successful tag invalidation, bounded by its TTL. A surface that
requires current authorization and generations stays dynamic/no-store.

## Legacy adapter

`Middleware.init()` retains the `http-cache:data` and `http-cache:version`
namespaces. Its URL/path/topic generations and startup exclusions support old
clients and rollback. Subject-scoped and dynamic Host URL reads remain excluded
there. `X-SPS-Consistency: 1` bypasses legacy response bodies so a tracked read
cannot receive an answer without its dependency descriptor.

The legacy adapter's KV guard, deadlines and byte admission cap remain active.
Its successful mutation bumps are awaited before the outer revalidation
broadcast. A failed legacy bump can leave a body stale until its TTL; the new
path checks authoritative generations instead.

The operator-only `/api/http-cache/clear` route clears response-cache namespaces;
it never calls Redis FLUSHALL and preserves OAuth and subject preference state.
PostgreSQL journals and registrations are not cache-clear targets.
