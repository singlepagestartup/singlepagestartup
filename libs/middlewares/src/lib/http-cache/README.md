# HTTP response cache

`HTTPCacheMiddleware` is the API host's HTTP cache entrypoint. It delegates to
the injected consistency runtime, which owns response envelopes, credential
partitioning and PostgreSQL generation checks. No alternate topic-based cache
or version counters are created.

Register authorization, billing and query parsing before `init()`. Preserve
controller-guarded route exclusions. Register `registerRoutes(app)` before the
cache middleware so the operator guard always handles `/api/http-cache/clear`.
Clearing removes only the runtime's response-cache namespace.

The API host enables this middleware with `MIDDLEWARE_HTTP_CACHE=true`.
Consistency read tracking, committed-write delivery and WebSocket notifications
remain active when response caching is disabled.
