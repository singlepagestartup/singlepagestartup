---
date: 2026-09-18T02:22:38+03:00
researcher: flakecode
git_commit: 29370bcbf85b195fbd1c2422707141135184d6e0
branch: worktree-issues-2026-09-18
repository: singlepagestartup
topic: "Bound HTTP-cache generations and recover requests after Redis OOM/restart"
tags: [research, codebase, http-cache, kv-provider, redis, ioredis, deployer, host-page, crawler, startup-migration, is-authorized]
status: complete
last_updated: 2026-09-18
last_updated_by: flakecode
---

# Research: Bound HTTP-cache generations and recover requests after Redis OOM/restart

**Date**: 2026-09-18T02:22:38+03:00
**Researcher**: flakecode
**Git Commit**: 29370bcbf85b195fbd1c2422707141135184d6e0
**Branch**: worktree-issues-2026-09-18
**Repository**: singlepagestartup

## Research Question

Issue #233 reports two production incidents on a child project (didigallery) and attributes them to framework code that is byte-identical between the child and upstream `main`. This document records how that code behaves today so planning can work from verified `file:line` references. It keeps the issue's two sub-topics separate:

- **A. Cache generation retention and Redis recovery** — how HTTP-cache keys are built, when versions rotate, what removes stale data, how the Redis client is configured, which environment and deployment templates set limits, and what the API startup path runs.
- **B. Crawler-driven render fan-out** — how one Host page request becomes API reads, how a missing page or a failed backend call becomes a 404, what `robots.txt` does, and what observability exists (request IDs, readiness, access logs).

The issue references upstream commit `99e3037f085283f666d96654750cff5ecb5ac620`. That commit is an ancestor of the researched commit (15 commits back), and `git diff --stat 99e3037f08 HEAD` is empty for every file the issue names, so the issue's line references were checked against unchanged files.

## Summary

**A. Retention and recovery**

- A cached GET lives at `http-cache:data:<request URL without query>:v<pathVersion>:t<topicVector>:<sha256(queryString)>`. The URL part includes scheme and host because the middleware uses `c.req.url` (`libs/middlewares/src/lib/http-cache/index.ts:147`), which is why production keys start with `http://api:4000/...`. Every distinct query string is a separate key inside a generation (`index.ts:193-196,275-280`; `libs/providers/kv/src/lib/redis/index.ts:66-69,87-100`).
- A successful mutation `INCR`s version counters (path, path without trailing UUID, `/rbac/permissions`, and the resolved topics) and nothing else (`index.ts:217-256`). Version counters have no TTL (`redis/index.ts:71-85`; the middleware never passes `options.ttl`). Superseded data keys are never deleted; they leave Redis only through the `EX KV_TTL` expiry set at write time (`redis/index.ts:94-99`) or the manual `GET /api/http-cache/clear` SCAN+DEL (`index.ts:305-314`).
- `KV_TTL` defaults to 30 seconds in code (`libs/shared/utils/src/lib/envs/host.ts:59`), is 43200 in `apps/api/.env.production:19`, and is rendered as 86400 by the deployer whenever `REDIS_PASSWORD` is set (`tools/deployer/api/api.env.j2:92-99`). There is no response-size admission check, no per-route TTL, and no cardinality limit anywhere in the middleware.
- Anonymous session initialization is a mutation on the subject collection: `POST /api/rbac/subjects/authentication/init` calls `api.create({ data: {} })` against `POST /api/rbac/subjects` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/init.ts:37-44`), which rotates the `http://api:4000/api/rbac/subjects` path version and the `rbac.subjects` topic version. The Host root layout mounts the component that triggers init for every browser without a valid JWT or refresh token (`apps/host/app/layout.tsx:42`; `.../authentication/init-default/ClientComponent.tsx:108-164`).
- The full subject list is fetched by the Host page service, not by a widget: `findByUrl` loads every page, keeps those with the same segment count, and for each `[module.model.param]` segment fetches the whole collection with the RBAC secret key and no `Cache-Control` header (`libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:21-88,122-223`). The framework seed ships a `/rbac/subjects/[rbac.subjects.slug]` page, so every three-segment URL lookup reads `GET http://api:4000/api/rbac/subjects` through the HTTP cache. The shared repository applies `limit`/`offset` only when the caller passes them (`libs/shared/backend/api/src/lib/repository/database/index.ts:86-93`).
- The Redis client is a process-wide ioredis singleton with `maxRetriesPerRequest: 10`, the default `retryStrategy`, and a `reconnectOnError` that logs and always returns `true` (`redis/index.ts:18-34`). No `commandTimeout` or `connectTimeout` is set (ioredis 5.6.0 defaults: `connectTimeout: 10000`, `enableOfflineQueue: true`), and the provider registers no `error` listener. The cacheable-GET path awaits two or more Redis reads before `next()` with no try/catch around them (`index.ts:173-208`), while the Bun server runs with `idleTimeout: 0` (`apps/api/server.ts:9-14`).
- Cache lookup runs before authorization: `HTTPCacheMiddleware` is registered at `apps/api/app.ts:162-166` and `IsAuthorizedMiddleware` at `:171-172`. A request with `Cache-Control: no-store` skips the cache and reaches authorization; an `OPTIONS` request is answered at `:119-121` before any of this. That ordering matches the issue's observed differential (OPTIONS fast, `no-store` GET 403, plain GET hangs).
- Deployment templates set no memory or eviction policy for Redis (`tools/deployer/redis/docker-compose.redis.yaml.j2:6-13`), no `deploy.resources` for Redis, API, or Host, and no health checks. Redis persists to `./redis_data:/data`.
- `start.sh api` launches `./migrate.sh seed &` alongside the API (`start.sh:10-14`). `migrate.sh` runs 17 sequential Nx targets and then `api:db:seed` (`migrate.sh:7-27`); `db:seed` declares `dependsOn: ["db:prepare"]`, and `prepare` runs `api:db:migrate` (`apps/api/project.json`). `seed.ts` finishes by clearing the HTTP cache, revalidating the Host layout, and after 10 seconds invoking the page-cache agent, which fetches every page URL in every language from the Host (`apps/api/src/db/seed.ts:397-440`; `libs/modules/agent/.../page/cache.ts:23-57`). A contract test asserts the background form (`apps/api/specs/singlepage/index.spec.ts:74-91`).

**B. Crawler fan-out**

- The catch-all page renders `find-by-url` with `catchErrors: true` and `silentNotFound`; any non-OK response or thrown fetch resolves to `undefined`, and `undefined` becomes `throw notFound()` (`apps/host/app/[[...url]]/page.tsx:60-70`; `.../find-by-url/server.tsx:8-16`; `.../sdk/server/.../find-by-url.ts:54-75`). The page exports `revalidate = 86400`, `dynamicParams = true`, and `experimental_ppr = true` (`page.tsx:10-12`). Backend outage and missing content take the same path.
- Every page render is a tree of `variant="find"` server components, each issuing one `GET <route>?filters=...` through the shared `find` action with `next.tags` and a 600-second `AbortSignal.timeout` (`libs/shared/frontend/api/src/lib/actions/find/index.ts:37-54`). The chain is page → pages-to-layouts → pages-to-widgets → widget → widgets-to-external-widgets → module widget → module relations. Each level's query string is a distinct HTTP-cache key.
- A not-found lookup still performs the full page-service fan-out before the service throws (`service/singlepage/index.ts:28-81`); the exception filter logs one `🚨 Exception [<requestId>] GET <url>` line per miss (`libs/shared/backend/api/src/lib/filters/exception/index.ts:52-59`).
- `/robots.txt` on the Host is a static route handler that calls no API (`apps/host/app/robots.txt/route.ts`), and the Host middleware excludes it from the language redirect (`apps/host/middleware.ts:24-28`). The API has no `robots.txt` route; every unmatched API path passes through `IsAuthorizedMiddleware` before Hono's 404.
- Request IDs are generated or accepted on the API (`libs/middlewares/src/lib/request-id/index.ts:12-14`) and echoed in error bodies, but no Host server action sends `x-request-id`. There is no readiness or health route in `apps/api/app.ts` or `apps/host/app`; the Host middleware matcher merely excludes a `healthz` path that does not exist. The Traefik template enables no access log (`tools/deployer/traefik/docker-compose.traefik.yaml.j2:11-21`).

## Detailed Findings

### A1. HTTP-cache middleware: keys, reads, bumps, writes

File: `libs/middlewares/src/lib/http-cache/index.ts` (315 lines, unchanged since `99e3037f08`).

**Constants and options.** `CACHE_DATA_PREFIX = "http-cache:data"`, `CACHE_VERSION_PREFIX = "http-cache:version"`, `DEFAULT_CACHE_VERSION = 0` (`:17-19`). The constructor creates a `StoreProvider({ type: KV_PROVIDER })` and composes the exclusion matcher from constructor options, `routes/startup.ts`, and `routes/singlepage.ts` (`:70-83`). Options only add exclusions; there is no option for TTL, size, or cardinality.

**Key construction.** `buildVersionedDataPrefix(path, pathVersion, topicVersionsByTopic)` returns `${CACHE_DATA_PREFIX}:${path}:v${pathVersion}:t${topicVector}` where `topicVector` is the sorted per-topic versions joined by `.` (`:53-64`). Inside `init()`:

- `params` = everything after `?` in `c.req.url`, or `""` (`:146`).
- `path` = `c.req.url` before `?` — the full absolute URL including scheme and host (`:147`).
- `pathname` = `new URL(c.req.url).pathname` with a fallback to `c.req.path` (`:148-153`).

The provider hashes the key half: `get`/`set` store at `${prefix}:${sha256(key)}` (`libs/providers/kv/src/lib/redis/index.ts:66-69,87-100`; `sha256` is `crypto.subtle.digest` in `libs/shared/utils/src/lib/hash/sha256/index.ts:22-27`). A data key therefore reads `http-cache:data:http://api:4000/api/rbac/subjects:v<N>:t<vector>:<sha256(params)>`, and a version key reads `http-cache:version:<sha256(path or "topic:<topic>")>`.

**Cacheable-GET gate.** `isCacheableGet = method === "GET" && cacheControl !== "no-store" && !isCacheExcluded` (`:166-168`). The framework exclusion list (`routes/singlepage.ts:18-48`) covers `revalidation`, `http-cache`, `broadcast`, `favicon.ico`, the `me|init|is-authorized` auth probes, the issue-152 cart counters, and the issue-195 chat thread-messages and chat-actions reads. `routes/startup.ts:25` is empty in the framework.

**Awaited reads before `next()`.** For a cacheable GET the middleware resolves read topics with the shared resolver, then awaits `Promise.all([getCacheVersion(path), getTopicVersions(readTopics)])` — one Redis `GET` for the path version and one per topic (`:179-186`; `getCacheVersion` `:85-102`; `getTopicVersions` `:104-116`) — and then a third awaited `GET` for the data key (`:193-196`). A hit returns a fresh `Response` with status 200 and `Content-Type: application/json` and skips the rest of the pipeline (`:198-207`). This block has no try/catch; a rejected promise propagates to `app.onError` (`apps/api/app.ts:66-67`).

**Mutation bump (awaited).** After `next()`, for a 2xx `PUT|PATCH|POST|DELETE` the middleware builds `prefixesToBump`: `/rbac/permissions`, `pathWithoutId` (`path` with `UUID_PATH_SUFFIX_REGEX` stripped), the full `path` for PUT/PATCH, the path up to and including the first UUID for POST/DELETE, and the `/bulk`-stripped path when present (`:222-246`). It then awaits `INCR` on each and on every topic resolved for `pathname` via `resolveTopicsForPath(pathname, defaultCompiledTopicRules)` (`:248-256`, `bumpTopicVersions` `:129-142`). Errors here are logged and swallowed (`:257-259`). This is the issue-195 bump-before-broadcast contract; `RevalidationMiddleware` is registered before `HTTPCacheMiddleware` so the bump completes before the WebSocket broadcast (`apps/api/app.ts:146-166`; asserted by `apps/api/specs/singlepage/index.spec.ts:53-68`).

**Fire-and-forget write.** A `void (async () => { ... })()` block (`:262-299`) runs after the bump. For a 2xx cacheable GET it clones the response, parses JSON, rebuilds the versioned prefix with the versions read before `next()`, and calls `storeProvider.set({ prefix, key: params, value: JSON.stringify(resJson), options: { ttl: KV_TTL } })` (`:264-281`). For non-2xx responses it skips `rbac/permissions` paths and, only for status ≥ 500, bumps the path and path-without-id versions (`:282-295`). 4xx responses cause no write and no bump.

**No cleanup path.** The only code that deletes data keys is `setRoutes` → `GET /api/http-cache/clear`, which `delByPrefix`s both prefixes (`:305-314`; provider SCAN/DEL loop at `redis/index.ts:102-117`). `seed.ts:397-407` calls it with the RBAC secret key at the end of seeding. The route is registered on `app` at `apps/api/app.ts:165`, before `isAuthorizedMiddleware` is `use`d at `:171-172`; it is also on the is-authorized allow-list (`is-authorized/routes/singlepage.ts:51-54`).

**Tests.** `index.spec.ts` covers key determinism and rotation, the clear route's namespace isolation, the exclusion-gate bump behaviour, and bump/broadcast topic parity, using a recording fake store (`libs/middlewares/src/lib/http-cache/index.spec.ts:46-71,131-440`). `routes/index.spec.ts` covers the exclusion matcher. No test exercises TTL, key growth, Redis failure, or timeouts.

### A2. Topic derivation for the subject collection

`resolveTopicsForPath` applies explicit rules first and falls back to `deriveTopicsFromPath` (`libs/shared/utils/src/lib/topics/index.ts:278-289`). No framework rule matches `/api/rbac/subjects` (`topics/singlepage.ts:16-118` lists only chat, knowledge, and checkout routes), so `POST /api/rbac/subjects` derives `rbac.subjects` (`index.ts:108-169`). A read of `/api/rbac/subjects` derives the same topic, so the read key's `t` vector rotates on every subject create, update, or delete anywhere in the system. The path-version bump for a POST with no UUID is the path itself (`pathWithoutId === path`).

### A3. Who mutates the subject collection: anonymous initialization

- `POST /api/rbac/subjects/authentication/init` (`init.ts:22-94`) calls `api.create({ data: {} })` on the subject server SDK with `X-RBAC-SECRET-KEY` (`:37-44`), signs a JWT and a refresh token, sets the `rbac.subject.jwt` cookie, and returns 201.
- The server SDK's `create` posts to `${API_SERVICE_URL}/api/rbac/subjects` (`libs/modules/rbac/models/subject/sdk/model/src/lib/index.ts:14-16`; `API_SERVICE_URL = http://api:4000` in deployment, `tools/deployer/api/api.env.j2:6-8`). That inner POST is an ordinary mutation: the HTTP-cache bump runs, the revalidation broadcast runs, and `revalidateTag` is fired at the Host (`libs/middlewares/src/lib/revalidation/index.ts:97-121,126-132`). The outer `/authentication/init` POST is on the revalidation skip-list (`revalidation/routes/singlepage.ts:11-14`) and on the cache exclusion list, but its own path version is still bumped because exclusions never skip the bump block (`http-cache/index.ts:158-166`).
- The Host root layout mounts `<RbacSubject isServer={false} variant="authentication-init-default" />` on every page (`apps/host/app/layout.tsx:42`). The client component refetches `init` whenever there is no valid JWT cookie and no valid refresh token, guarded by a per-action key and `init.isFetching` (`init-default/ClientComponent.tsx:108-164`). It runs in the browser only; a crawler that does not execute JavaScript does not trigger it.

### A4. Who reads the full subject collection: the page service

`libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts`:

- `findByUrl` rejects URLs with `?` (`:22-24`), splits the requested URL, loads **all** pages with `this.find()` (`:28`), and keeps pages whose URL has the same number of segments (or one more when the page URL contains `:pagination:`) (`:30-47`).
- For each candidate it awaits `withUrls({ id })` (`:51-61`). `withUrls` re-reads the page by id (`:127-129`) and, for every segment written as `[module.model.param]`, calls `fetchAllModuleEntities({ moduleName, modelName, secretKey })` (`:141-173`), which performs `fetch(`${API_SERVICE_URL}/api/${moduleName}/${modelName}`, { headers: { "X-RBAC-SECRET-KEY" } })` with no `Cache-Control` header and no query string (`:203-223`). It then expands the URL tree with `buildTreePaths` (`:184-198`).
- The first candidate whose expanded URL list contains the requested URL wins; otherwise the service throws `Not Found error. Page with url ... not found` (`:63-81`), which `getHttpErrorType` maps to a 404 `HTTPException` (`controller/singlepage/find-by-url/index.ts:31-42`).
- `urls()` runs `withUrls` for every page (`:225-239`). It backs `GET /api/host/pages/urls`, which is used by the sitemap (`apps/host/app/sitemap.xml/route.ts:8`), by `generateStaticParams` outside production builds (`page.tsx:14-32`), and by the page-cache agent (`cache.ts:23`).

The framework seed contains nine templated page URLs, including `/rbac/subjects/[rbac.subjects.slug]`, `/social/profiles/[social.profiles.slug]`, `/ecommerce/products/[ecommerce.products.slug]`, and `/blog/articles/[blog.articles.slug]` (`libs/modules/host/models/page/backend/repository/database/src/lib/data/*.json`). A lookup for any three-segment URL therefore issues `GET http://api:4000/api/rbac/subjects` (and the other module collections) through the API's own HTTP cache. Because the request carries the secret key, `IsAuthorizedMiddleware` passes it (`is-authorized/index.ts:59-61`), but the cache lookup happens first, so the response is served from — and written to — the shared, unauthenticated key space. The repository `find` applies `limit`/`offset` only when the caller supplies them (`repository/database/index.ts:86-93`), so the response is the entire table.

Within one generation the fetch above uses `params = ""` and produces one key. Other subject reads carry query strings — for example every `variant="find"` component filters by column (`widgets-to-external-widgets/.../default/rbac/Component.tsx:9-22` filters `id`), and admin tables pass filters, ordering, and pagination — and each distinct query string is a further key under the same `v`/`t` prefix.

### A5. KV provider and the Redis client

`libs/providers/kv/src/lib/redis/index.ts` (unchanged since `99e3037f08`):

- One static `Redis` instance per process (`:13,19-34`). Options: `host`, `port`, `username`, `password` from `KV_*` envs, `maxRetriesPerRequest: 10`, `retryStrategy: (times) => Math.min(times * 50, 2000)`, `reconnectOnError: (err) => { logger.error("Redis error:", err); return true; }` (`:20-31`). Nothing sets `commandTimeout`, `connectTimeout`, `enableOfflineQueue`, `lazyConnect`, or `keepAlive`; ioredis 5.6.0 defaults apply (`node_modules/ioredis/built/redis/RedisOptions.js`: `connectTimeout: 10000`, `enableOfflineQueue: true`, `enableReadyCheck: true`, `autoResendUnfulfilledCommands: true`).
- No `client.on("error", ...)`, `on("reconnecting")`, or `on("end")` listener exists in the provider (grep of `.on(` returns nothing). `reconnectOnError` is only consulted for errors that carry a Redis error reply.
- The first construction removes every `SIGINT`/`SIGTERM` listener on the process and installs a `quit()` + `process.exit(0)` handler (`:36-52`). `connect()` is a no-op (`:58-60`).
- `get` = `GET`; `incr` = `INCR` plus `EXPIRE` only when a TTL is passed and the value is 1 (`:71-85`); `set` = `SET key value EX ttl` (`:87-100`); `delByPrefix` = `SCAN MATCH prefix* COUNT 100` + `DEL` (`:102-117`); `flushall` exists and is documented as never for cache use (`:124-126`; interface `:17-23`).

The wrapper `libs/providers/kv/src/lib/index.ts` forwards calls without adding timeouts or fallbacks. `KV_PROVIDER` is `"redis"` only when the env equals that string; otherwise the Vercel KV client is selected (`envs/host.ts:54-55`). Other Redis consumers found by grep are the MCP OAuth store (`apps/mcp/lib/oauth.ts`, separate client) and none in the Host.

The API server itself: `Bun.serve({ fetch: app.fetch, port, websocket, idleTimeout: 0 })` (`apps/api/server.ts:9-14`); `apps/api/env.ts` loads `.env` with dotenv. `apps/api/package.json` starts with `bun server.ts`.

### A6. Environment values for TTL and the cache flag

| Source                                                    | `KV_TTL`                             | `MIDDLEWARE_HTTP_CACHE`           | Reference                                                                 |
| --------------------------------------------------------- | ------------------------------------ | --------------------------------- | ------------------------------------------------------------------------- |
| Code default                                              | `Number(process.env.KV_TTL) \|\| 30` | unset → middleware not registered | `libs/shared/utils/src/lib/envs/host.ts:59,83`; `apps/api/app.ts:162-166` |
| `apps/api/.env.production`                                | 43200                                | `true`                            | `:19,21`                                                                  |
| Deployer render (only when `REDIS_PASSWORD` is non-empty) | 86400                                | `true`                            | `tools/deployer/api/api.env.j2:92-99`                                     |
| Local `apps/api/create_env.sh`                            | not written                          | not written                       | `:75-81`                                                                  |

In deployment `start.sh api` first runs `./create_env.sh api deployment`, which materializes the container's `printenv` into `apps/api/.env` (`create_env.sh:3-11,33-37`), so the Swarm `env_file` (rendered from `api.env.j2`) is what dotenv loads. Which file Bun prefers when both `.env` and `.env.production` exist was not verified here; the issue reports the production value as 86400.

`STALE_TIME` (60 s) and `NEXT_PUBLIC_REVALIDATE` (43200 in `.env.production:13`) are separate lifetimes used by the frontend and by the revalidation broadcast (`envs/host.ts:17-20`; `revalidation/index.ts:108`).

### A7. Deployment templates and resource limits

- **Redis** (`tools/deployer/redis/docker-compose.redis.yaml.j2`): stock `redis` image; command `redis-server --port $REDIS_PORT --requirepass $REDIS_PASSWORD` (`:6-13`); volume `./redis_data:/data` (`:14-15`); `REDIS_DATABASES: 16` env (`:19`); manager-node placement (`:22-25`). No `maxmemory`, `maxmemory-policy`, `save`/`appendonly`, `deploy.resources`, or `healthcheck`. The Redis create playbook only renders the template and runs `docker stack deploy` (`tools/deployer/redis/create_redis.yaml:11-17`). Neither the API nor the MCP client passes a `db` option, so all keys share Redis database 0 with the MCP OAuth store (`redis/index.ts:20-31`; the clear-route test at `http-cache/index.spec.ts:211-273` lists the `mcp:oauth:*` and `rbac:subject:*` namespaces that share the instance).
- **API** (`tools/deployer/api/docker-compose.api.yaml.j2`): `command: sh -c './start.sh api'` (`:12`); `json-file` logging capped at 10 MB × 3 (`:13-17`); `update_config.order: start-first` (`:19-20`); Traefik labels on port 4000 (`:24-30`). No `deploy.resources`, no `healthcheck`.
- **Host** (`tools/deployer/host/docker-compose.host.yaml.j2`): same shape on port 3000 with a `next_static` volume (`:10-11,36-37`). No limits, no health check.
- **Traefik** (`tools/deployer/traefik/docker-compose.traefik.yaml.j2:11-21`): `--log.level={{ TRAEFIK_LOG_LEVEL | default('INFO') }}`, Swarm and file providers, `web`/`websecure` entrypoints. No `--accesslog` flags. `tools/deployer/.env.example:57` exposes only `TRAEFIK_LOG_LEVEL`.
- The API deploy playbook installs a Portainer webhook for image updates (`tools/deployer/api/create_api.yaml:25-58`) and contains no replica or readiness wait for the API service.
- **Docker image** (`Dockerfile`): installs Bun from `bun.sh/install` without a version pin (`:6`), sets `NODE_OPTIONS=--max-old-space-size=16384` for every Node process in the container (`:12`), builds the Host, and defaults to `tail -f /dev/null` so Swarm's `command` selects the role (`:46-63`).

### A8. Startup path: migrations and seed beside the serving process

- `start.sh:10-14`: `./create_env.sh api deployment`, then `./migrate.sh seed &`, then `npm run api:start` (`nx run api:start` → `bun server.ts`).
- `migrate.sh:7-23`: 17 sequential `npx nx run @sps/<module>:repository-migrate` commands (each a Node/Nx process), including `@sps/rbac:repository-natural-key-repair-apply` (`:15`). With `seed`, it then runs `npx nx run api:db:seed` (`:25-27`).
- `apps/api/project.json`: `db:seed` executes `bun run src/db/seed.ts` and declares `dependsOn: ["db:prepare"]`; `prepare` runs `nx run api:db:migrate`, which lists the same 16 module migration targets plus the repair target and is marked `cache: false`. Read literally, `migrate.sh seed` runs the migration chain from the shell and Nx runs it again as a dependency of `db:seed`; whether Nx skips the second pass was not verified at runtime.
- `apps/api/src/db/seed.ts` seeds every module's models and relations in sequence (`:26-391`), then with `RBAC_SECRET_KEY` present calls `GET /api/http-cache/clear` (`:397-407`), `GET <HOST>/api/revalidate?path=/&type=layout` (`:409-417`), and after a 10-second `setTimeout` `GET /api/agent/agents/host-module-page-cache` (`:419-440`). The process exits with `exit(0)` when the outer promise resolves (`:442-444`); the timer's fetch is issued before that because the `await`s complete first.
- The page-cache agent handler loads `urls()` (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts:23`) and, for every URL × language, calls the Host revalidate endpoint with `type=page` and then fetches the page (`:27-57`). ISSUE-218 research notes the seed's fetch omits `method`, so it is a GET while the route is registered as POST (`thoughts/shared/research/singlepagestartup/ISSUE-218.md`, "Existing non-UI invocation").
- `apps/api/specs/singlepage/index.spec.ts:74-91` asserts that `start.sh` contains `./migrate.sh seed &` before `npm run api:start` ("production migrations run without blocking the API").
- Git history: `start.sh` last changed in `53b059643c` and earlier in `e0273194c8`/`ecf319e3bf` (`git log -- start.sh`); `migrate.sh` last changed in `e0273194c8` (natural-key repair).

### A9. Middleware order and the authorization boundary

`apps/api/app.ts`:

1. CORS (`:41-64`), `onError` → `ExceptionFilter` (`:66-67`), `/public/*` static handler (`:69-114`).
2. `RequestIdMiddleware` (`:116-117`), `app.options("*")` → 204 (`:119-121`), `ObserverMiddleware` (`:123-124`), `/ws/revalidation` upgrade (`:126-144`).
3. `RevalidationMiddleware` (`:153-154`), then `HTTPCacheMiddleware` + `setRoutes` when `MIDDLEWARE_HTTP_CACHE === "true"` (`:162-166`), preceded by the in-file comment that authorized responses can be cached and served to unauthorized users and that `Cache-Control: no-store` is the mitigation (`:156-161`).
4. `ActionLoggerMiddleware` (`:168-169`), `IsAuthorizedMiddleware` (`:171-172`), `BillRouteMiddleware` (`:174-175`), `ParseQueryMiddleware` (`:177-178`), then module routers (`:180-195`).

`IsAuthorizedMiddleware` (`libs/middlewares/src/lib/is-authorized/index.ts`): secret-key bypass (`:59-61`), allow-list match (`:63-65`; framework list at `routes/singlepage.ts:9-67`, which includes `GET /api/(host|website-builder|file-storage)/.*`, `GET /api/rbac/subjects-to-roles`, `GET /api/rbac/roles-to-permissions`, `GET /api/rbac/permissions*`, `GET /api/http-cache/clear`, and the auth probes), otherwise a call to `authenticationIsAuthorized` with `Cache-Control: no-store`, memoized for 30 s in a 5000-entry in-memory cache keyed by method, path, token, and secret (`:27-28,67-104`). Failures become `HTTPException`s (`:105-108`). The seeded permission `GET /api/rbac/subjects` exists (`libs/modules/rbac/models/permission/.../data/55bce457-2de2-4006-bf51-966f9976cadc.json`) but no seeded `roles-to-permissions` record references it, so in framework seed data that read is reachable only with the secret key or a role granted elsewhere.

`ParseQueryMiddleware` parses `populate`, `filters`, `orderBy`, `offset`, and `limit` from the query string (`libs/shared/backend/api/src/lib/middleware/parse-query/index.ts:21-86`); the REST `find` handler passes them straight to the service (`controllers/rest/handler/find/index.ts:18-32`).

### A10. Error surfacing and request IDs on the API

- `RequestIdMiddleware` reads `x-request-id` or generates a `nanoid` and writes it onto the incoming request's headers (`request-id/index.ts:10-18`); it does not set a response header.
- `ExceptionFilter` reads that header (`exception/index.ts:23`), logs `🚨 Exception [<requestId>] <method> <url>` with the stack (`:52-59`), optionally sends a Telegram message for status ≥ 500 (`:61-102`), and returns JSON with `requestId`, `path`, `method`, `status`, `error`, `stack`, and `cause` (`:104-115`).
- `responsePipe` on the consumer side extracts `requestId` from the error JSON or the `x-request-id` response header (`libs/shared/utils/src/lib/response-pipe.ts:123-127`). With `catchErrors` it logs `❌ API Error` unless the status is in `silentErrorStatuses` and returns `undefined` (`:163-169`); on the server it otherwise throws an `HTTPException` (`:171-178`).

### B1. Host page render and the not-found path

- `apps/host/app/[[...url]]/page.tsx`: `revalidate = 86400`, `dynamicParams = true`, `experimental_ppr = true` (`:10-12`); `generateStaticParams` calls `urls()` and returns an empty list during production builds (`:14-32`); `generateMetadata` calls the metadata SDK, which performs `api.find()` on metadata records (`:34-36`; `libs/modules/host/models/metadata/sdk/server/src/lib/singlepage/actions/generate.ts:40-42`). `Page` strips the language prefix, routes `/admin*` to the admin component, and otherwise renders `HostModulePage variant="find-by-url"` with `silentNotFound` (`:38-66`). The render callback throws `notFound()` when `data` is falsy (`:67-70`).
- `find-by-url/server.tsx:8-16` calls `api.findByUrl({ url, catchErrors: true, silentErrorStatuses: [404] })` and swallows any rejection with `.catch(() => {})`. `find-by-url.ts:54-63` performs `fetch(`${host}${route}/find-by-url?url=...`)` with `next.tags: [route]`, no `signal`, and `Cache-Control: no-store` only during `next build` (`:25-31`); a non-OK response returns `undefined` via `responsePipe` (`:59-67`), and a payload without `id` also returns `undefined` (`:69-73`). A transport failure (for example undici's `UND_ERR_HEADERS_TIMEOUT`) rejects `fetch`, which the server component's `.catch` converts to `undefined`.
- `apps/host/app/not-found.tsx` renders `find-by-url` for `/404` and, when that lookup also returns nothing, a plain `Not found` element (`:4-27`). The not-found route therefore performs its own page-service lookup and, when a `/404` page exists, its own widget tree.
- `apps/host/app/layout.tsx:24-25` raises Node's `http`/`https` `globalAgent.maxSockets` to 1000. `apps/host/next.config.js` sets `staticPageGenerationTimeout: 6000` and `logging: false` (`:28,110`); it configures no fetch timeout.
- `apps/host/middleware.ts` redirects paths without a language prefix and excludes `_next`, `images`, `sitemap`, `robots`, `api`, `favicon`, `healthz`, and Google verification files from that redirect (`:4-28`). No `healthz` route exists under `apps/host/app`.

### B2. Render fan-out: server `find` components and their requests

- `libs/shared/frontend/components/src/lib/singlepage/default/index.tsx:14-39` wraps each model/relation variant in `ErrorBoundary` + `Suspense` and selects the server or client implementation by `isServer`. The `find` server implementation awaits `props.api.find(props.apiProps)` and renders `children({ data })` (`find/server.tsx:7-24`).
- The shared `find` action (`libs/shared/frontend/api/src/lib/actions/find/index.ts:23-68`) serializes `params` with `qs`, sends `credentials: "include"`, `next.tags: [route]`, `signal: AbortSignal.timeout(600000)`, and `Cache-Control: no-store` only during `next build`. `find-by-id` sets `next.tags: [route/id]` and no signal (`find-by-id/index.ts:23-60`).
- Component chain for the `default` page variant: `page/default/Component.tsx:19-87` → `PagesToLayouts` find (`pageId`, `variant`) → per layout `PagesToWidgets` find (`pageId`) → per relation `pages-to-widgets/default/Component.tsx:18-49` → `Widget` find (`id`) → `widget/default/Component.tsx:18-49` → `WidgetsToExternalWidgets` find (`widgetId`) → `widgets-to-external-widgets/default/Component.tsx:28-74` dispatches on `externalModule` to one of eleven module branches, each of which performs its own `find` by `id` (for example `default/rbac/Component.tsx:7-23`) and renders module-specific relations. Each `find` is one `GET <route>?filters[and][0][column]=...` and, on the API side, one cacheable key per distinct query string.
- Every level runs with the request's cookies forwarded through `credentials: "include"` semantics of the server SDK, but the API cache lookup ignores identity: the key is the URL, version vector, and query string only.

### B3. Public entry points that enumerate pages

- `apps/host/app/sitemap.xml/route.ts:6-52`: calls `hostModulePageApi.urls({})`, which triggers `withUrls` for every page and therefore every templated collection fetch; `revalidate = 60` and `s-maxage=86400`.
- `apps/host/app/robots.txt/route.ts:5-19`: returns `User-agent: *` and the sitemap URL from `NEXT_PUBLIC_HOST_SERVICE_URL`; no API call; `revalidate = 60`; `s-maxage=86400`.
- The API service exposes no `robots.txt`; a request for it reaches `IsAuthorizedMiddleware` (`apps/api/app.ts:171-172`) as an unlisted path before Hono returns 404.

### B4. Observability available today

- API: `RequestIdMiddleware` (see A10); `ObserverMiddleware` reacts only to successful `POST|PATCH|DELETE` (`observer/index.ts:61-65`); `ActionLoggerMiddleware` and `LoggerMiddleware` exist but no access log records per-request duration or bytes for GETs in the files read here; the exception filter logs every thrown error with request ID.
- Host: `next.config.js` `logging: false`; server SDK actions do not send `x-request-id`; `responsePipe` prints `❌ API Error` JSON for non-silent failures.
- Edge: Traefik has no access log (A7).
- Redis: no metrics, no `INFO`/`MEMORY` polling, no key-count reporting in the repository.
- Readiness: no health or readiness route in `apps/api/app.ts`; Swarm relies on container liveness only.

### Verification of the issue's claims against live code

| Issue claim                                                     | Live code                                                                                                                                                                      | Result                                                                            |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------- |
| Key construction L53–64                                         | `buildVersionedDataPrefix` at `:53-64`                                                                                                                                         | Confirmed                                                                         |
| Awaited reads L173–196                                          | Read block `:173-208`, Redis reads at `:183-196`                                                                                                                               | Confirmed                                                                         |
| Mutation invalidation L217–255                                  | Block `:217-260`, awaited `Promise.all` at `:248-256`                                                                                                                          | Confirmed (block extends to `:260`)                                               |
| Retained response TTL L262–279                                  | Write IIFE `:262-299`, `ttl: KV_TTL` at `:279`                                                                                                                                 | Confirmed                                                                         |
| ioredis provider without command deadline                       | `redis/index.ts:25-30`; no `commandTimeout`                                                                                                                                    | Confirmed; also no `error` listener                                               |
| `api.env.j2#L98` hardcodes `KV_TTL=86400`                       | `:98`, inside the `REDIS_PASSWORD` guard `:92-99`                                                                                                                              | Confirmed                                                                         |
| Redis template has no memory budget, eviction, or limits        | `docker-compose.redis.yaml.j2:1-29`                                                                                                                                            | Confirmed                                                                         |
| Concurrent startup migration `start.sh#L10`                     | `./migrate.sh seed &` is `start.sh:12` (`:10` is the `elif`)                                                                                                                   | Confirmed, line shifted by 2                                                      |
| Page lookup suppresses errors                                   | `find-by-url/server.tsx:8-16`                                                                                                                                                  | Confirmed                                                                         |
| Host maps missing data to `notFound` at `page.tsx#L68`          | `:67-70`                                                                                                                                                                       | Confirmed                                                                         |
| Anonymous init creates a Subject and invalidates the collection | `init.ts:37-44` → `POST /api/rbac/subjects`; bump at `http-cache/index.ts:222-256`                                                                                             | Confirmed                                                                         |
| "robot retrieval can fail authorization" (comment)              | Host `/robots.txt` is static and public (`robots.txt/route.ts`; `middleware.ts:26`); only the API service, which has no robots route, would answer with an authorization error | Not supported for the Host route; holds only for requests sent to the API service |
| Redis `maxmemory=0`, `noeviction`                               | Template sets neither; the values are Redis's documented defaults                                                                                                              | Consistent (not set by the repository)                                            |

## Code References

- `libs/middlewares/src/lib/http-cache/index.ts:17-19` — cache prefixes and default version
- `libs/middlewares/src/lib/http-cache/index.ts:53-64` — `buildVersionedDataPrefix`
- `libs/middlewares/src/lib/http-cache/index.ts:146-168` — `params`, absolute `path`, `pathname`, cacheable-GET gate
- `libs/middlewares/src/lib/http-cache/index.ts:173-208` — awaited version and data reads, early return on hit
- `libs/middlewares/src/lib/http-cache/index.ts:217-260` — awaited mutation bump set
- `libs/middlewares/src/lib/http-cache/index.ts:262-299` — fire-and-forget write with `KV_TTL`, 5xx bump
- `libs/middlewares/src/lib/http-cache/index.ts:305-314` — `/api/http-cache/clear`
- `libs/middlewares/src/lib/http-cache/routes/singlepage.ts:18-48` — framework cache exclusions
- `libs/middlewares/src/lib/http-cache/index.spec.ts:1-440` — existing BDD coverage
- `libs/providers/kv/src/lib/redis/index.ts:18-34` — ioredis singleton and options
- `libs/providers/kv/src/lib/redis/index.ts:36-52` — signal handlers
- `libs/providers/kv/src/lib/redis/index.ts:66-117` — `get`, `incr`, `set ... EX`, `delByPrefix`
- `libs/providers/kv/src/lib/index.ts:5-71` — provider wrapper
- `libs/shared/utils/src/lib/envs/host.ts:54-66,83` — `KV_*` and `MIDDLEWARE_HTTP_CACHE`
- `libs/shared/utils/src/lib/topics/index.ts:108-169,278-289` — topic derivation and resolver
- `libs/shared/utils/src/lib/hash/sha256/index.ts:22-27` — key hashing
- `apps/api/app.ts:116-195` — middleware registration order and module mounts
- `apps/api/server.ts:9-14` — Bun `serve` with `idleTimeout: 0`
- `apps/api/.env.production:13-21` — `NEXT_PUBLIC_REVALIDATE`, `KV_TTL`, `MIDDLEWARE_HTTP_CACHE`
- `apps/api/specs/singlepage/index.spec.ts:25-91` — middleware order and background-migration contract tests
- `apps/api/src/db/seed.ts:393-440` — post-seed cache clear, layout revalidate, page-cache agent trigger
- `apps/api/project.json` — `db:migrate`, `db:seed` (`dependsOn: db:prepare`), `prepare`
- `libs/middlewares/src/lib/is-authorized/index.ts:27-28,59-108` — secret bypass, allow-list, memoized authorization
- `libs/middlewares/src/lib/is-authorized/routes/singlepage.ts:9-67` — routes allowed without authentication
- `libs/middlewares/src/lib/request-id/index.ts:10-18` — request ID assignment
- `libs/middlewares/src/lib/revalidation/index.ts:85-132` — broadcast and `revalidateTag`
- `libs/middlewares/src/lib/revalidation/routes/singlepage.ts:10-27` — non-revalidating routes
- `libs/shared/backend/api/src/lib/filters/exception/index.ts:19-116` — error logging and JSON shape
- `libs/shared/backend/api/src/lib/middleware/parse-query/index.ts:21-86` — query parsing
- `libs/shared/backend/api/src/lib/repository/database/index.ts:53-110` — repository `find` with optional limit/offset
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/init.ts:22-94` — anonymous subject creation
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/init-default/ClientComponent.tsx:108-164` — client trigger for init
- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:21-88,122-239` — `findByUrl`, `withUrls`, `fetchAllModuleEntities`, `urls`
- `libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:13-43` — handler and error mapping
- `libs/modules/host/models/page/backend/repository/database/src/lib/data/*.json` — seeded templated page URLs
- `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:18-76` — Host-side lookup fetch
- `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/urls.ts:10-65` — Host-side `urls` fetch
- `libs/modules/host/models/page/frontend/component/src/lib/singlepage/find-by-url/server.tsx:7-23` — error-swallowing server component
- `libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:19-87` — layout and widget fan-out
- `libs/modules/host/relations/pages-to-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:18-49` — widget find
- `libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:18-49` — external-widget find
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:28-74` — module dispatch
- `libs/shared/frontend/components/src/lib/singlepage/find/server.tsx:7-24` — generic server `find`
- `libs/shared/frontend/api/src/lib/actions/find/index.ts:23-68` — shared `find` fetch (tags, 600 s signal)
- `libs/shared/frontend/api/src/lib/actions/find-by-id/index.ts:23-60` — shared `findById` fetch (no signal)
- `libs/shared/utils/src/lib/response-pipe.ts:98-218` — response handling, `catchErrors`, request ID extraction
- `apps/host/app/[[...url]]/page.tsx:10-87` — ISR settings, `generateStaticParams`, `notFound`
- `apps/host/app/not-found.tsx:4-27` — `/404` page lookup
- `apps/host/app/layout.tsx:24-25,42-43` — socket limit, auth-init and revalidation mounts
- `apps/host/app/robots.txt/route.ts:1-19` — static robots
- `apps/host/app/sitemap.xml/route.ts:6-52` — sitemap from `urls()`
- `apps/host/app/api/revalidate/route.ts:7-32` — tag/path revalidation endpoint
- `apps/host/middleware.ts:4-28` — language redirect matcher
- `apps/host/next.config.js:25-111` — Next configuration
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts:15-86` — page-cache agent
- `start.sh:10-14` — API entrypoint
- `migrate.sh:7-27` — migration chain and seed
- `Dockerfile:6,12,46-63` — Bun install, `NODE_OPTIONS`, entry
- `tools/deployer/api/api.env.j2:6-8,92-99` — `API_SERVICE_URL`, Redis/KV block
- `tools/deployer/api/docker-compose.api.yaml.j2:1-34` — API stack
- `tools/deployer/host/docker-compose.host.yaml.j2:1-37` — Host stack
- `tools/deployer/redis/docker-compose.redis.yaml.j2:1-29` — Redis stack
- `tools/deployer/redis/create_redis.yaml:1-17` — Redis playbook
- `tools/deployer/traefik/docker-compose.traefik.yaml.j2:11-21` — Traefik command flags
- `tools/deployer/api/create_api.yaml:25-58` — Portainer webhook setup
- `create_env.sh:3-37` — deployment env materialization
- `node_modules/ioredis/built/redis/RedisOptions.js` — ioredis 5.6.0 defaults

## Architecture Documentation

**Request path on the API (production, cache enabled).** CORS → static `/public` → request ID → OPTIONS short-circuit → observer → WebSocket upgrade → revalidation (post-`next` broadcast) → HTTP cache (pre-`next` awaited reads, post-`next` awaited bumps, detached write) → action logger → authorization → bill-route → query parsing → module controller. The cache is an unauthenticated, identity-blind response memo keyed on absolute URL, version vector, and query string; the documented mitigation for private data is the caller's `Cache-Control: no-store`.

**Version-rotation model.** Reads embed the current path version and the versions of every topic derived from the read path. Writes increment counters and never touch data keys. Each increment starts a new generation; earlier generations remain readable only by their old key and are released by TTL. Version counters themselves persist without TTL.

**Realtime contract dependencies.** The revalidation README (`libs/middlewares/src/lib/revalidation/README.md`) fixes the bump-before-broadcast order, the metadata-only broadcast, and the shared topic resolver. Any change to when a bump happens must keep the WebSocket broadcast after it; the contract test in `apps/api/specs/singlepage/index.spec.ts:53-68` guards the registration order.

**Host rendering model.** Pages are trees of server `find` components. Each node awaits its own API call; there is no request-scoped batching, deduplication, or budget in the shared components or actions. Page existence is resolved by the API page service, which materializes every templated URL by fetching whole collections.

**Service discovery and key hosts.** In Swarm, API-internal calls use `API_SERVICE_URL=http://api:4000` and Host calls use the same host, so all server-side reads share one key family. The page service's `fetchAllModuleEntities` and the anonymous-init `api.create` both use `API_SERVICE_URL`.

**Startup model.** The API container is also the migration and seed runner. Migrations are Nx/Node processes launched by `migrate.sh` beside the Bun server; the seed's final steps clear the cache, revalidate the Host layout, and ask the page-cache agent to render every page.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-195.md` and the ISSUE-195 plan/process/handoff describe the topic-versioned cache, the revalidation-before-cache reorder, awaited mutation bumps, and the exclusion route lists. The process log records the reviewer finding that `KV_TTL=43200` with `MIDDLEWARE_HTTP_CACHE=true` in production made server-side exclusions load-bearing (`thoughts/shared/processes/singlepagestartup/ISSUE-195.md:63-65`). The plan's "KV without mget" note explains the per-topic `Promise.all` reads (`thoughts/shared/plans/singlepagestartup/ISSUE-195.md:545-566`).
- `thoughts/shared/research/singlepagestartup/ISSUE-215.md` documents the Redis/Traefik/Portainer deployment surfaces, the shared ioredis provider, and the absence of Redis health probes. Its process log's Incident 12 records a production case where long-lived API and MCP ioredis clients did not recover after Redis was recreated and required force restarts (`thoughts/shared/processes/singlepagestartup/ISSUE-215.md:198-207`) — the same recovery pattern the issue reports. The Redis template has since gained `--requirepass` and lost its Traefik TCP router; the ISSUE-215 description of an env-only Redis service is no longer current.
- `thoughts/shared/research/singlepagestartup/ISSUE-218.md` covers the page-cache agent handler and notes the seed's method-less fetch to the POST route.
- `thoughts/shared/tickets/singlepagestartup/ISSUE-216.md` states that the canonical Docker/Swarm path runs `migrate.sh seed` in the foreground and that migration failure must prevent the API from starting. Live `start.sh:12` runs it in the background, and `apps/api/specs/singlepage/index.spec.ts:74-91` asserts that form. Issue #233's description of the startup path matches live code; the ISSUE-216 ticket text does not.
- `thoughts/shared/tickets/singlepagestartup/ISSUE-178.md` records an earlier `The operation was aborted` log-watch signature; the issue itself notes it does not establish this cause.
- No research, plan, or process artifact existed for #233, #223, or #234 when this research started. Untracked `ISSUE-223` and `ISSUE-234` research and process files appeared in the worktree while it ran (parallel sessions) and were not consulted here; the planner should read them for the page-cache-agent abort and anonymous-Subject-retention scopes.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-195.md` — realtime cache/invalidation contract
- `thoughts/shared/research/singlepagestartup/ISSUE-215.md` — deployment templates, Redis client surfaces
- `thoughts/shared/research/singlepagestartup/ISSUE-218.md` — page-cache agent and Host URL contract

## Open Questions

1. **Effective `KV_TTL` at runtime.** Both the Swarm env (86400, materialized into `apps/api/.env`) and `apps/api/.env.production` (43200) exist in the container. Bun's precedence between these files was not verified here; the issue observed 86400 in production.
2. **Origin of the per-generation query variants.** The framework shows the parameterless full-list fetch from the page service and filter-shaped reads from widgets; the roughly 356 keys per generation measured in the child project need a key sample or a child-project widget inventory to attribute.
3. **Exact hang state.** The code shows awaited Redis reads with no timeout, no error listener, and an offline queue enabled by default; which of these produced the observed indefinite GET after Redis recovery requires a runtime reproduction against Bun 1.3.14 and ioredis 5.6.0.
4. **Double migration pass.** `migrate.sh seed` runs the migration targets from the shell and then `api:db:seed`, whose `dependsOn: db:prepare` runs `api:db:migrate` again. Whether Nx re-executes the chain (targets are `cache: false`) should be confirmed from a deployment log.
5. **ISR behaviour for `notFound()`.** The issue observed `x-nextjs-cache: HIT` on a 200 shell rendering "Not found". Whether Next keeps a `notFound()` result for the full `revalidate = 86400` window, and how `experimental_ppr` interacts, was not established from repository code.
6. **Per-render request multiplier.** Without request-ID propagation from the Host, the number of API calls per external render must be measured with added instrumentation or a proxy; the component tree gives the shape, not the count.
7. **Clear-route exposure.** `/api/http-cache/clear` is registered before the authorization middleware and is also allow-listed; whether it is reachable from the public API hostname without credentials was not tested.
