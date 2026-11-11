# HTTP response cache

`HTTPCacheMiddleware` is the API host's HTTP cache entrypoint. It delegates to
the injected consistency runtime, which owns response envelopes, credential
partitioning and PostgreSQL generation checks. No alternate topic-based cache
or version counters are created.

Register authorization, billing and query parsing before `init()`. Preserve
controller-guarded route exclusions. Register `registerRoutes(app)` before the
cache middleware so the operator guard always handles `/api/http-cache/clear`.
The API caches responses under a fixed key prefix. After all API replicas
have been replaced, the deployer and the GitHub API workflow call this route
with the environment's operator header. It clears cached responses, including
entries left by earlier releases. The next request rebuilds the response.
Sessions, OAuth clients and rate-limit counters keep their own keys.

The API host enables this middleware with `MIDDLEWARE_HTTP_CACHE=true`.
When disabled, the protected route reports `Cache disabled` without issuing a KV command.
Consistency read tracking, committed-write delivery and WebSocket notifications
remain active when response caching is disabled.
