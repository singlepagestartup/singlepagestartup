---
date: 2026-05-04T00:35:13+0300
researcher: flakecode
git_commit: d665c77702603f683b3b23fd2b33c571733a2c0d
branch: debug
repository: singlepagestartup
topic: "[log-watch] [LW-ddbd3ed79c54] host_host API Error for missing host pages"
tags: [research, codebase, host, nextjs, routing, not-found, doctorgpt-production]
status: complete
last_updated: 2026-05-04
last_updated_by: flakecode
---

# Research: Issue #181 - Host API Error log for missing page URLs

**Date**: 2026-05-04T00:35:13+0300
**Researcher**: flakecode
**Git Commit**: d665c77702603f683b3b23fd2b33c571733a2c0d
**Branch**: debug
**Repository**: singlepagestartup

## Research Question

How the current host app produces repeated `❌ API Error` logs for issue #181, where the production samples contain backend page lookup misses for `/wp-json/gravitysmtp/v1/tests/mock-data` and quoted Next chunk URLs such as `/%22/_next/static/chunks/729-b75c2cb2d6e12e41.js%22`.

The user confirmed during research that the current local project database is the same database deployed on the production server where this error was observed. This research therefore treats local reproduction against `doctorgpt-production` as the primary reproduction path.

## Summary

The `❌ API Error` prefix comes from the shared frontend/server response pipe when it receives a non-OK API response with `catchErrors: true`. In this issue, the host route asks the backend to resolve arbitrary browser paths as host pages, the backend returns `404` with `Not Found error. Page with url ... not found`, and `responsePipe` logs that backend payload in the host process before returning `undefined` (`libs/shared/utils/src/lib/response-pipe.ts:98`, `libs/shared/utils/src/lib/response-pipe.ts:146`, `libs/shared/utils/src/lib/response-pipe.ts:152`).

The host catch-all route handles non-admin paths through `<HostModulePage isServer={true} variant="find-by-url" url={slashedUrl}>`. Missing data from that lookup becomes `notFound()`, after which the app-level not-found page renders the DB-backed `/404` page when present (`apps/host/app/[[...url]]/page.tsx:45`, `apps/host/app/[[...url]]/page.tsx:60`, `apps/host/app/[[...url]]/page.tsx:63`, `apps/host/app/not-found.tsx:6`).

Local reproduction used the running API and host dev servers with the current `apps/api/.env` database name `doctorgpt-production`. The `sps_h_page` table contained 6 rows: `/`, `/404`, `/rbac/subject/authentication/select-method`, `/social/chats`, `/social/chats/[social.chats.id]`, and `/.well-known/appspecific/com.chrome.devtools.json`. None of the issue #181 sample URLs existed in that table. Direct backend calls reproduced the exact `404` error messages for both `/wp-json/gravitysmtp/v1/tests/mock-data` and the quoted chunk URLs. Host requests reproduced the matching host-side `❌ API Error` log payloads after the locale redirect.

## Detailed Findings

### Host Middleware And Catch-All Routing

- `apps/host/middleware.ts:4` reads `request.nextUrl.pathname`; `apps/host/middleware.ts:8` splits the path into segments and checks whether the first segment is a configured language code.
- `apps/host/middleware.ts:15` redirects paths without a language prefix to `/${defaultLanguage}${pathname}`.
- `apps/host/middleware.ts:24` configures the matcher with exclusions for paths that start with `_next`, `images`, `_next/static`, `_next/image`, `sitemap`, `robots`, `api`, `favicon`, and `healthz`.
- The quoted sample path starts with `%22`, not `_next`, so the middleware treats `/%22/_next/static/...%22` as a regular host pathname and redirects it to `/en/%22/_next/static/...%22`.
- `apps/host/app/[[...url]]/page.tsx:38` is the App Router catch-all entrypoint. `apps/host/app/[[...url]]/page.tsx:48` strips a language prefix when present, and `apps/host/app/[[...url]]/page.tsx:53` joins the remaining segments into the backend lookup URL.
- `apps/host/app/[[...url]]/page.tsx:56` routes `/admin...` to `AdminV2`; all other paths go through page lookup at `apps/host/app/[[...url]]/page.tsx:60`.

### Host Page Lookup Flow

- `libs/modules/host/models/page/frontend/component/src/lib/singlepage/find-by-url/server.tsx:7` is the server implementation used by the host route.
- `libs/modules/host/models/page/frontend/component/src/lib/singlepage/find-by-url/server.tsx:8` calls `api.findByUrl`, passing `url: props.url` and `catchErrors: true` at `libs/modules/host/models/page/frontend/component/src/lib/singlepage/find-by-url/server.tsx:10`.
- `libs/modules/host/models/page/sdk/model/src/lib/index.ts:14` sets `serverHost = API_SERVICE_URL`, and `libs/modules/host/models/page/sdk/model/src/lib/index.ts:16` sets the model route to `/api/host/pages`.
- `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:38` serializes `{ url }` with `encodeValuesOnly: true`.
- `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:47` fetches `${host}${route}/find-by-url?...`.
- `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:52` sends the response through `responsePipe`, with catch mode enabled by caller input or production build mode.
- If `responsePipe` returns no JSON, the SDK returns `undefined` at `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:57`.

### Backend Page Route And Error Shape

- `apps/api/app.ts:173` mounts the host module app at `/api/host`.
- `libs/modules/host/backend/app/api/src/lib/apps.ts:31` mounts the host page model at `/pages`, producing `/api/host/pages`.
- `libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:15` reads the `url` query parameter and `libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:16` strips any embedded query string suffix.
- The controller special-cases `/favicon.ico` at `libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:19` and normalizes empty or `index` URLs to `/` at `libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:24`.
- `libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:31` calls `this.service.findByUrl`.
- `libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:39` catches service errors, maps them through `getHttpErrorType`, and rethrows `HTTPException`.
- `libs/shared/backend/utils/src/lib/http-error/index.ts:58` parses categories from messages, and `libs/shared/backend/utils/src/lib/http-error/index.ts:73` maps `Not Found error` to HTTP `404`.
- `libs/shared/backend/api/src/lib/filters/exception/index.ts:52` logs backend exceptions, then `libs/shared/backend/api/src/lib/filters/exception/index.ts:104` serializes `{ requestId, path, method, status, error, stack, cause }` as the API response body.

### DB-Backed Page Resolution

- `libs/modules/host/models/page/backend/repository/database/src/lib/schema.ts:4` uses module prefix `sps_h`; `libs/modules/host/models/page/backend/repository/database/src/lib/schema.ts:5` names the table `page`, producing the physical table `sps_h_page`.
- `libs/modules/host/models/page/backend/repository/database/src/lib/fields/singlepage.ts:7` defines the `url` field as non-null text with a unique constraint.
- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:21` implements `findByUrl`.
- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:26` splits the requested URL into non-empty path segments, and `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:28` loads all pages.
- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:30` first filters pages by segment count, with pagination-mask handling at `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:33`.
- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:51` expands each candidate through `withUrls`.
- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:63` searches expanded URLs for exact equality with `props.url`.
- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:79` throws the exact message template `Not Found error. Page with url ${props.url} not found` when no page matches.
- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:122` defines `withUrls`, which expands stored dynamic URL masks into concrete route URLs.

### Local Reproduction Against The Current Restored DB

- The running API environment points at local Postgres on port `5433` with `DATABASE_NAME=doctorgpt-production` (`apps/api/.env:20`). This matches the user's note that the current database is the production database where the issue was observed.
- `docker-compose ps` showed local Postgres and Redis running; API and host dev servers were started with `npm run api:dev` and `npm run host:dev`.
- A read-only SQL check returned `current_database = doctorgpt-production` and `total_pages = 6` for `sps_h_page`.
- A read-only SQL lookup for the issue sample URLs returned zero matching rows:
  - `/wp-json/gravitysmtp/v1/tests/mock-data`
  - `/%22/_next/static/chunks/729-b75c2cb2d6e12e41.js%22`
  - `/%22/_next/static/chunks/app/%5B%5B...url%5D%5D/page-65843dfda759d7ec.js%22`
  - `/_next/static/chunks/729-b75c2cb2d6e12e41.js`
- The six current page URLs in `sps_h_page` were `/`, `/404`, `/rbac/subject/authentication/select-method`, `/social/chats`, `/social/chats/[social.chats.id]`, and `/.well-known/appspecific/com.chrome.devtools.json`.
- Direct API reproduction for `/wp-json/gravitysmtp/v1/tests/mock-data` returned HTTP `404` with `error: "Not Found error. Page with url /wp-json/gravitysmtp/v1/tests/mock-data not found"`.
- Direct API reproduction for `/%22/_next/static/chunks/729-b75c2cb2d6e12e41.js%22` returned HTTP `404` with `error: "Not Found error. Page with url /%22/_next/static/chunks/729-b75c2cb2d6e12e41.js%22 not found"`.
- Direct API reproduction for `/%22/_next/static/chunks/app/%5B%5B...url%5D%5D/page-65843dfda759d7ec.js%22` returned HTTP `404` with `error: "Not Found error. Page with url /%22/_next/static/chunks/app/%5B%5B...url%5D%5D/page-65843dfda759d7ec.js%22 not found"`.
- A host request to `http://localhost:3000/wp-json/gravitysmtp/v1/tests/mock-data` redirected to `/en/wp-json/gravitysmtp/v1/tests/mock-data`; following it produced the app-level not-found render while the host process logged the matching `❌ API Error` payload.
- A host request to `http://localhost:3000/%22/_next/static/chunks/729-b75c2cb2d6e12e41.js%22` redirected to `/en/%22/_next/static/chunks/729-b75c2cb2d6e12e41.js%22`; following it produced the app-level not-found render while the host process logged the matching quoted chunk `❌ API Error` payload.

### Not-Found Rendering Path

- `apps/host/app/[[...url]]/page.tsx:63` checks whether the page lookup returned data.
- `apps/host/app/[[...url]]/page.tsx:64` calls `notFound()` when no data exists.
- `apps/host/app/not-found.tsx:6` resolves `/404` with the same host page `find-by-url` component.
- `apps/host/app/not-found.tsx:8` has a plain full-screen fallback only when `/404` is also missing.
- `apps/host/app/not-found.tsx:17` renders the DB-backed `/404` page variant when `/404` exists.

## Code References

- `apps/host/middleware.ts:15` - adds the default language prefix to non-localized paths.
- `apps/host/middleware.ts:24` - matcher exclusions for paths that start with `_next`, `api`, and similar reserved prefixes.
- `apps/host/app/[[...url]]/page.tsx:45` - receives catch-all URL segments.
- `apps/host/app/[[...url]]/page.tsx:53` - builds the page lookup URL from segments.
- `apps/host/app/[[...url]]/page.tsx:60` - resolves the path through host page `find-by-url`.
- `apps/host/app/[[...url]]/page.tsx:64` - missing lookup data becomes `notFound()`.
- `libs/modules/host/models/page/frontend/component/src/lib/singlepage/find-by-url/server.tsx:8` - server component calls the page SDK with `catchErrors: true`.
- `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:47` - SDK fetches `/api/host/pages/find-by-url`.
- `libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:31` - backend controller calls page service lookup.
- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:79` - source of `Page with url ... not found`.
- `libs/shared/utils/src/lib/response-pipe.ts:152` - source of the `❌ API Error` host log prefix.
- `apps/host/app/not-found.tsx:6` - app-level not-found page resolves `/404`.
- `libs/modules/host/models/page/backend/repository/database/src/lib/fields/singlepage.ts:7` - `url` is the persisted unique page route field.

## Architecture Documentation

The Host module is the routing and composition layer for project pages, layouts, metadata, and widgets (`libs/modules/host/README.md`). The Host Page model represents routable site pages, and its documented variants include `find-by-url` as the routing helper (`libs/modules/host/models/page/README.md`).

The runtime path for issue #181 crosses these layers:

- Next middleware applies language-prefix routing before the catch-all page.
- The catch-all page converts URL segments into a `slashedUrl` and resolves it through Host Page `find-by-url`.
- The Host Page server SDK fetches the API route `/api/host/pages/find-by-url`.
- The Host Page backend service resolves the URL against the `sps_h_page` table and expanded dynamic URL masks.
- The API exception filter returns a `404` JSON payload when the page service throws `Not Found error`.
- The shared response pipe logs that JSON payload as `❌ API Error` when called with `catchErrors: true`.
- The host route then renders the app-level not-found flow, which itself resolves `/404` through the same page model.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-180.md` documents the same current host catch-all, middleware, page `find-by-url`, backend 404 normalization, and response-pipe logging path for quoted `_next/static/chunks` URLs.
- `thoughts/shared/processes/singlepagestartup/ISSUE-180.md` records a reusable workflow note: copied production log-watch issues should use the API app's `DATABASE_NAME` rather than the Docker compose default database name when querying restored local Postgres.
- `thoughts/shared/tickets/singlepagestartup/ISSUE-182.md` preserves sibling `api_api` samples where direct `/api/host/pages/find-by-url?url=...` requests returned the same quoted `_next/static/chunks` 404 shape.
- `thoughts/shared/tickets/singlepagestartup/ISSUE-184.md` preserves sibling `host_host` samples for quoted chunk files under `main-app`, `app/layout`, and `app/global-error`.
- `thoughts/shared/research/singlepagestartup/ISSUE-174.md` documents the same restored `doctorgpt-production` local database pattern for copied production log-watch research.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-180.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-174.md`
- `thoughts/shared/tickets/singlepagestartup/ISSUE-182.md`
- `thoughts/shared/tickets/singlepagestartup/ISSUE-184.md`

## Open Questions

- The issue #181 production samples do not include the original raw request line, request headers, or browser referrer, so the source that produced paths wrapped in `%22` is not present in the ticket artifact.
- The local host reproduction produced the matching server-side `❌ API Error` payloads and rendered the app-level not-found page; the exact production outer HTTP response for the original browser requests is not included in the copied log samples.
