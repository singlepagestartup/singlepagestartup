# HTTP response cache

`HTTPCacheMiddleware` is the API host's HTTP cache entrypoint. It delegates to
the injected consistency runtime, which owns response envelopes, credential
partitioning and PostgreSQL generation checks. No alternate topic-based cache
or version counters are created.

Register authorization, billing and query parsing before `init()`. The API host
imports `rbacHttpCacheExcludeRoutes` from the RBAC module for reads that must
reach the owning controller on every request. Call `registerRoutes(app)` before
installing the cache middleware so the operator guard handles `/api/http-cache/clear`.
The API caches responses under a fixed key prefix. The operator route and
the API seed clear the same response keys, including entries from previous
releases. Sessions, OAuth clients and rate-limit counters keep their own keys.

The API host enables this middleware with `MIDDLEWARE_HTTP_CACHE=true`.
Consistency read tracking, committed-write delivery and WebSocket notifications
remain active when response caching is disabled.
