---
date: 2026-05-04T00:26:56+0300
researcher: flakecode
git_commit: d665c77702603f683b3b23fd2b33c571733a2c0d
branch: debug
repository: singlepagestartup
topic: "[log-watch] [LW-c5696ab78964] host_host Not Found error. Page with url /%22/_next/static/chunks/<id>.js%22 not found"
tags: [research, codebase, host, nextjs, routing, not-found, doctorgpt-production]
status: complete
last_updated: 2026-05-04
last_updated_by: flakecode
---

# Research: Issue #180 - Host arbitrary URL and not-found flow

**Date**: 2026-05-04T00:26:56+0300
**Researcher**: flakecode
**Git Commit**: d665c77702603f683b3b23fd2b33c571733a2c0d
**Branch**: debug
**Repository**: singlepagestartup

## Research Question

How the host app currently handles arbitrary URLs and `404`/not-found responses, with focus on quoted chunk paths such as `/%22/_next/static/chunks/729-b75c2cb2d6e12e41.js%22` and `/%22/_next/static/chunks/app/%5B%5B...url%5D%5D/page-...js%22`, and how those failures become `❌ API Error` log lines in the host process. This issue is being researched against the restored local database that the process log notes is the same database used by the production server where the error occurred (`thoughts/shared/processes/singlepagestartup/ISSUE-180.md:34-39`).

## Summary

The host app routes nearly every non-excluded pathname through `apps/host/app/[[...url]]/page.tsx`. The middleware exclusion only skips paths that begin with `_next`, `api`, `favicon`, and similar prefixes; a quoted pathname such as `/%22/_next/static/...%22` does not match the `_next` exclusion because its first segment is `%22`, so it still passes through the host middleware and then through the catch-all page (`apps/host/middleware.ts:4-18`, `apps/host/middleware.ts:24-27`, `apps/host/app/[[...url]]/page.tsx:38-80`).

That catch-all page converts the URL segments into a single page URL string and resolves it through the host page `find-by-url` server component. The server component calls the backend endpoint `/api/host/pages/find-by-url` with `catchErrors: true`; backend `findByUrl` looks up pages from the host page repository, expands dynamic URL masks, and throws `Not Found error. Page with url ... not found` when no page matches. The shared response pipe logs that `404` as `❌ API Error` and returns `undefined`, which makes the catch-all page call `notFound()`. Next then renders `apps/host/app/not-found.tsx`, which performs a second `find-by-url` lookup for `/404` and renders the DB-backed `/404` page when it exists (`apps/host/app/not-found.tsx:4-27`, `libs/modules/host/models/page/backend/repository/database/src/lib/data/120ea332-d70a-4ca7-a538-59d0c9f4c25f.json:3-10`).

Local reproduction on 2026-05-04 used the current running services and the API database configured as `doctorgpt-production`. A direct request to `http://127.0.0.1:4000/api/host/pages/find-by-url?url=%2F%2522%2F_next%2Fstatic%2Fchunks%2F729-b75c2cb2d6e12e41.js%2522` returned HTTP `404` with `error: "Not Found error. Page with url /%22/_next/static/chunks/729-b75c2cb2d6e12e41.js%22 not found"` and stack ending at `libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:41`. A host request to `http://127.0.0.1:3000/%22/_next/static/chunks/729-b75c2cb2d6e12e41.js%22` first returned a `307` redirect to `/en/%22/_next/static/chunks/729-b75c2cb2d6e12e41.js%22`; while following that request, the host dev process emitted the matching `❌ API Error` payload.

## Detailed Findings

### Catch-all route for arbitrary host URLs

- `apps/host/app/[[...url]]/page.tsx:10-12` enables dynamic catch-all routing with `dynamicParams = true`, so arbitrary segment arrays can be handled at runtime.
- `apps/host/app/[[...url]]/page.tsx:14-31` uses `spsHostPageApi.urls({ catchErrors: true })` only for static params generation. In production builds it returns `[]`, so production routing does not rely on a prebuilt path list.
- `apps/host/app/[[...url]]/page.tsx:41-55` awaits `params`, strips a language prefix if the first segment matches a configured language, joins the rest into `pageUrl`, and ensures the lookup key starts with `/`.
- `apps/host/app/[[...url]]/page.tsx:56-58` sends `/admin...` URLs into `AdminV2` instead of the page lookup flow.
- `apps/host/app/[[...url]]/page.tsx:60-80` resolves every other URL through `<HostModulePage isServer={true} variant="find-by-url" url={slashedUrl}>`; when the child callback receives no `data`, it throws `notFound()`.

### Middleware behavior before the catch-all route

- `apps/host/middleware.ts:4-18` reads `request.nextUrl.pathname`, checks whether the first path segment is one of the configured language codes, and redirects to `/${defaultLanguage}${pathname}` when no language prefix is present.
- `apps/host/middleware.ts:24-27` limits the middleware to paths matching `"/((?!_next|images|_next/static|_next/image|sitemap|robots|api|favicon|healthz).*)"`.
- Because the negative lookahead is anchored at the start of the pathname, a request whose first segment is `%22` is not excluded by `_next`. A path like `/%22/_next/static/chunks/...%22` therefore still enters the language-prefix logic instead of being treated as a real Next static asset path by this middleware.

### Host page lookup from the server component

- `libs/modules/host/models/page/frontend/component/src/lib/index.tsx:4-14` dispatches page component variants dynamically.
- `libs/modules/host/models/page/frontend/component/src/lib/singlepage/variants.ts:15-18` maps `"find-by-url"` to the dedicated wrapper component.
- `libs/modules/host/models/page/frontend/component/src/lib/singlepage/find-by-url/index.tsx:6-13` chooses the server or client implementation based on `props.isServer`.
- `libs/modules/host/models/page/frontend/component/src/lib/singlepage/find-by-url/server.tsx:7-21` calls `api.findByUrl({ url: props.url, catchErrors: true })`, swallows thrown fetch-level errors in `.catch(...)`, and passes `{ data: data || undefined }` into the render prop.
- `libs/modules/host/models/page/sdk/server/src/lib/singlepage/index.ts:20-28` exposes the page server SDK actions, including `findByUrl`.
- `libs/modules/host/models/page/sdk/model/src/lib/index.ts:14-16` sets `serverHost = API_SERVICE_URL` and `route = "/api/host/pages"`, so the server-side host app fetches the API service at `/api/host/pages/find-by-url`.
- `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:38-55` serializes `{ url }`, performs `fetch(${host}${route}/find-by-url?... )`, and runs the response through `responsePipe` with `catchErrors: catchErrors || productionBuild`.
- `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:57-67` returns `undefined` when the response pipe returns no JSON or when the transformed item has no `id`.

### API route and backend page lookup

- `apps/api/app.ts:172-173` mounts the host module app at `/api/host`.
- `libs/modules/host/backend/app/api/src/lib/apps.ts:31-35` mounts the host page model app at `/pages`, producing the final route prefix `/api/host/pages`.
- `libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/index.ts:24-28` binds `GET /find-by-url`.
- `libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:13-18` reads `c.req.query("url")`, strips any query string suffix with `split("?")[0]`, and otherwise leaves the path string unchanged.
- `libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:19-29` special-cases `/favicon.ico` and normalizes empty or leading `index` paths back to `/`.
- `libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:31-38` calls `this.service.findByUrl({ url, params: c.var.parsedQuery })` and returns `{ data: entity }`.
- `libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:39-42` converts thrown errors through `getHttpErrorType` into `HTTPException`.

### DB-backed page resolution

- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:21-28` rejects URLs containing `?`, splits the requested path into non-empty segments, and loads all pages with `this.find()`.
- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:30-47` filters candidate pages by URL segment count, with special handling for `:pagination:` masks.
- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:49-61` calls `withUrls({ id })` for each candidate page and accumulates expanded URLs.
- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:63-81` searches those expanded URLs for an exact match to `props.url` and throws `Not Found error. Page with url ${props.url} not found` when there is no match.
- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:83-87` resolves the matched page again with `findById`.
- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:122-200` shows how `withUrls` builds concrete URL strings from stored page URL masks and dynamic segments.
- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:203-223` fetches dynamic segment candidates from other module APIs when a page URL mask references bracketed module fields.

### Repository wiring to the database

- `libs/modules/host/models/page/backend/app/api/src/lib/bootstrap.ts:13-19` binds the page `Repository`, `Service`, and `Configuration` into the DI container.
- `libs/modules/host/models/page/backend/app/api/src/lib/repository.ts:3-7` defines the page repository as `DatabaseRepository<typeof Table>`.
- `libs/modules/host/models/page/backend/app/api/src/lib/configuration.ts:13-39` configures that repository to use the page `Table`, schemas, and model metadata from the host page database package.
- `libs/shared/backend/api/src/lib/service/crud/index.ts:25-44` shows that `CRUDService.find()` and `CRUDService.findById()` delegate to the injected repository.
- `libs/shared/backend/api/src/lib/repository/database/index.ts:30-39` initializes the Drizzle database handle from the configured table.
- `libs/shared/backend/api/src/lib/repository/database/index.ts:41-88` implements `find()` as a Drizzle `select().from(this.Table)...execute()` query.

### Local database-backed reproduction

- The running API env points the database connection at local Postgres on port `5433` with `DATABASE_NAME=doctorgpt-production`.
- The local Postgres container also has a default `POSTGRES_DB=sps-lite`, but the API route used for this issue is backed by `doctorgpt-production`, not the default database name from `apps/db/.env`.
- `docker-compose exec -T db psql -U sps-lite -d doctorgpt-production -c "select count(*) as page_count from sps_h_page;"` returned `6`, so the restored database contains host page rows.
- `docker-compose exec -T db psql -U sps-lite -d doctorgpt-production -c "select id, url, variant from sps_h_page where url in ('/404','/%22/_next/static/chunks/729-b75c2cb2d6e12e41.js%22') or url like '%_next%' order by url;"` returned only `/404` (`df288bf4-292d-4d88-a98d-701fc44625f9`, variant `default`) and no quoted `_next` URL rows.
- The direct API reproduction returned the same decoded error text as the ticket: `Not Found error. Page with url /%22/_next/static/chunks/729-b75c2cb2d6e12e41.js%22 not found`.
- The host process reproduced the production-side `❌ API Error` log after the quoted `_next` request passed through the catch-all page lookup.

### 404 normalization and `❌ API Error` logging

- `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts:48-63` defines `"Not Found error"` as status `404`.
- `libs/shared/backend/utils/src/lib/http-error/index.ts:58-82` maps error messages containing that category to `{ status: 404, category: "Not Found error" }`.
- `libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:39-42` uses that mapper before throwing `HTTPException`.
- `libs/shared/backend/api/src/lib/filters/exception/index.ts:104-115` serializes the final API error response as JSON with `status`, `error`, `stack`, and `cause`.
- `libs/shared/utils/src/lib/response-pipe.ts:98-150` reads the non-OK JSON body, builds `errorPayload = { message, status, cause }`, and preserves the backend `404` response data.
- `libs/shared/utils/src/lib/response-pipe.ts:152-155` logs `console.error("❌ API Error:", JSON.stringify(errorPayload, null, 2))` and returns `undefined` when `catchErrors` is enabled.
- The copied ticket preserves that exact host-side log shape for the quoted chunk paths at `thoughts/shared/tickets/singlepagestartup/ISSUE-180.md:114-147` and `thoughts/shared/tickets/singlepagestartup/ISSUE-180.md:151-169`.

### Next.js not-found rendering path

- `apps/host/app/[[...url]]/page.tsx:61-65` is the point where missing page data becomes `notFound()`.
- `apps/host/app/not-found.tsx:4-27` defines the app-level not-found page and resolves `/404` through the same page `find-by-url` variant.
- `apps/host/app/not-found.tsx:8-14` renders a plain full-screen `Not found` fallback only when the `/404` lookup also has no `data`.
- `apps/host/app/not-found.tsx:16-24` renders the DB-backed `/404` page by feeding the returned page `variant`, `data`, `url`, and default language back into `HostModulePage`.
- `libs/modules/host/models/page/backend/repository/database/src/lib/data/120ea332-d70a-4ca7-a538-59d0c9f4c25f.json:3-10` shows a seeded page row with `url: "/404"` and `variant: "default"`.

## Code References

- `apps/host/middleware.ts:4-18` - language-prefix redirect logic for non-excluded paths.
- `apps/host/middleware.ts:24-27` - matcher exclusions for `_next`, `api`, `favicon`, and similar prefixes.
- `apps/host/app/[[...url]]/page.tsx:14-31` - runtime/static param handling for page URLs.
- `apps/host/app/[[...url]]/page.tsx:41-65` - URL normalization and `notFound()` trigger.
- `libs/modules/host/models/page/frontend/component/src/lib/singlepage/find-by-url/server.tsx:7-21` - server component lookup with `catchErrors: true`.
- `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:47-55` - fetch to `/api/host/pages/find-by-url`.
- `libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:15-18` - URL query extraction and sanitization.
- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:79-80` - exact missing-page error string.
- `libs/shared/utils/src/lib/response-pipe.ts:152-155` - `❌ API Error` logging path.
- `apps/host/app/not-found.tsx:6-24` - DB-backed `/404` rendering path.
- `apps/api/.env:20` - local API database name used for this reproduction is `doctorgpt-production`.

## Architecture Documentation

The current host routing flow crosses four layers:

- Next middleware decides whether a pathname is excluded from host routing or receives a default language prefix (`apps/host/middleware.ts:4-27`).
- The Next catch-all route turns the resulting segment list into a page URL and asks the host page frontend component to resolve it (`apps/host/app/[[...url]]/page.tsx:41-80`).
- The host page server SDK calls the API service route `/api/host/pages/find-by-url` (`libs/modules/host/models/page/sdk/model/src/lib/index.ts:14-16`, `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:47-55`).
- The backend page service resolves that URL against the host page repository, which is backed by the configured Drizzle database table (`libs/modules/host/models/page/backend/app/api/src/lib/repository.ts:3-7`, `libs/shared/backend/api/src/lib/repository/database/index.ts:30-39`, `libs/shared/backend/api/src/lib/repository/database/index.ts:41-88`).

## Historical Context (from thoughts/)

- `thoughts/shared/tickets/singlepagestartup/ISSUE-180.md:101-176` preserves the copied production log samples, including repeated `❌ API Error` entries for quoted `/_next/static/...` paths.
- `thoughts/shared/processes/singlepagestartup/ISSUE-180.md:34-39` records that the current local DB is the same DB used on the production server where this error was observed, and that research should treat the issue as locally reproducible through DB-backed paths.
- `thoughts/shared/research/singlepagestartup/ISSUE-164.md:49` documents the same host catch-all page resolution path for live host pages.
- `thoughts/shared/tickets/singlepagestartup/ISSUE-182.md:112-114` preserves a sibling production backend request to `/api/host/pages/find-by-url?url=%2F%2522%2F_next%2Fstatic%2Fchunks...%2522` returning the same 404 shape.
- `thoughts/shared/tickets/singlepagestartup/ISSUE-184.md:58-65` preserves sibling `host_host` quoted `_next/static/chunks` failures for chunk files under `main-app`, `app/layout`, and `app/global-error`.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-164.md` - related host catch-all routing research.
- `thoughts/shared/research/singlepagestartup/ISSUE-174.md` - related copied production research that used the restored `doctorgpt-production` database for local reproduction.
- `thoughts/shared/tickets/singlepagestartup/ISSUE-182.md` and `thoughts/shared/tickets/singlepagestartup/ISSUE-184.md` - sibling production log-watch tickets for the same quoted `_next/static/chunks` pattern.

## Open Questions

- The preserved production samples show the repeated `❌ API Error` payloads but do not include the original raw request line or request ID, so the exact pre-normalization browser URL that produced the quoted chunk requests is not present in the stored ticket text.
- Following the host URL locally produced the matching server-side log but did not complete an HTTP response within a 30-second `curl -L` timeout after the initial locale redirect; the direct backend reproduction completed immediately with the expected 404.
