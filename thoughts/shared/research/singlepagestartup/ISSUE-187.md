---
date: 2026-05-04T02:52:03+03:00
researcher: flakecode
git_commit: bfb41a28a8b19b66cda5fcfabf6f62b55737f96e
branch: issue-187
repository: singlepagestartup
topic: "Enable Codex content management through the MCP server"
tags: [research, codebase, mcp, content-management, host, blog, relations]
status: complete
last_updated: 2026-05-04
last_updated_by: flakecode
---

# Research: Enable Codex Content Management Through The MCP Server

**Date**: 2026-05-04T02:52:03+03:00
**Researcher**: flakecode
**Git Commit**: bfb41a28a8b19b66cda5fcfabf6f62b55737f96e
**Branch**: issue-187
**Repository**: singlepagestartup

## Research Question

What exists today in the SPS MCP server, SDK/API stack, and host/blog content graph that Codex can use to add, edit, delete, discover, and traverse content records for workflows such as resolving `/about`, following `host.pages-to-widgets` and `host.widgets-to-external-widgets`, and updating a linked `blog.widget` English title?

## Summary

- `apps/mcp` is a Bun/stdio MCP server. It imports `./env`, creates a `McpServer` named `singlepagestartup-mcp`, connects it to `StdioServerTransport`, and registers module resource/tool bundles plus documentation tools (`apps/mcp/index.ts:1`, `apps/mcp/actions.ts:64`, `apps/mcp/actions.ts:69`, `apps/mcp/actions.ts:99`).
- The current MCP entity surface is generated per model/relation. A representative entity exposes one resource, one count tool, and list/by-id/create/update/delete tools backed by the entity's server SDK and zod insert schema (`apps/mcp/host/page/index.ts:7`, `apps/mcp/host/page/index.ts:31`, `apps/mcp/host/page/index.ts:39`, `apps/mcp/host/page/index.ts:81`, `apps/mcp/host/page/index.ts:121`, `apps/mcp/host/page/index.ts:164`, `apps/mcp/host/page/index.ts:212`).
- MCP talks to `apps/api` through the existing server SDK factories. SDK model files define routes such as `/api/host/pages`, `/api/host/pages-to-widgets`, `/api/host/widgets-to-external-widgets`, and `/api/blog/widgets`, with `serverHost` coming from `API_SERVICE_URL` (`libs/modules/host/models/page/sdk/model/src/lib/index.ts:14`, `libs/modules/host/relations/pages-to-widgets/sdk/model/src/lib/index.ts:14`, `libs/modules/host/relations/widgets-to-external-widgets/sdk/model/src/lib/index.ts:14`, `libs/modules/blog/models/widget/sdk/model/src/lib/index.ts:14`, `libs/shared/utils/src/lib/envs/host.ts:7`).
- Generic CRUD exists below MCP in the shared REST stack. `apps/api/app.ts` mounts module apps under `/api/*`, module apps mount their model/relation apps, default entity apps apply parse-query middleware, and the shared REST controller provides list, count, by-id, create, update, delete, find-or-create, and bulk routes (`apps/api/app.ts:172`, `libs/modules/host/backend/app/api/src/lib/apps.ts:20`, `libs/shared/backend/api/src/lib/app/default/index.ts:53`, `libs/shared/backend/api/src/lib/controllers/rest/index.ts:32`).
- The host/content traversal in the issue already exists as frontend composition. A host page resolved by URL renders `pages-to-widgets`, then host widgets render `widgets-to-external-widgets`, then the external-module switch renders a `blog` widget by filtering `externalWidgetId` (`apps/host/app/[[...url]]/page.tsx:60`, `libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:51`, `libs/modules/host/relations/pages-to-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:18`, `libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:18`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/blog/Component.tsx:7`).
- Current MCP discovery surfaces are documentation tools, static collection resources, zod input schemas on write tools, count-tool filters, SDK model exports, and README/YAML docs. There is no current MCP tool dedicated to semantic content graph traversal, relation-path preview, ambiguous-match reporting, or locale-specific field patching; those concepts are represented today by generic entity tools, API query filters, model docs, and frontend/admin composition.

## Detailed Findings

### MCP Server Entry And Registration

- `apps/mcp/index.ts` imports `./env`, imports the `mcp` instance from `actions.ts`, creates a stdio transport, and connects the server (`apps/mcp/index.ts:1`).
- Environment loading checks `apps/mcp/.env.production`, then `apps/mcp/.env`, then the process default dotenv location (`apps/mcp/env.ts:6`).
- `apps/mcp/actions.ts` imports registerers for agent, analytic, billing, blog, broadcast, crm, ecommerce, file-storage, host, notification, rbac, social, startup, telegram, website-builder, and documentation (`apps/mcp/actions.ts:2`).
- The MCP server instance is created as `{ name: "singlepagestartup-mcp", version: "1.0.0" }` (`apps/mcp/actions.ts:64`).
- The host module registers resources/tools for widget, layout, metadata, page, pages-to-widgets, pages-to-layouts, pages-to-metadata, layouts-to-widgets, and widgets-to-external-widgets (`apps/mcp/host/index.ts:39`, `apps/mcp/host/index.ts:51`).
- The blog module MCP surface includes widgets, articles, categories, and blog relations such as widgets-to-articles and widgets-to-categories (`apps/mcp/blog/widget/index.ts:1`, `libs/modules/blog/backend/app/api/src/lib/apps.ts:21`).
- Current file counts show 143 MCP resources and 719 `registerTool(...)` calls under `apps/mcp`; issue 160 historical implementation notes record that 143 entity count tools were added after shared count support landed (`thoughts/shared/handoffs/singlepagestartup/ISSUE-160-progress.md`).

### Current MCP Entity Tool Shape

- A model example, `host.page`, registers a static resource named `host-module-pages` at `sps://host/pages` and returns `hostModulePageApi.find()` JSON (`apps/mcp/host/page/index.ts:7`).
- The `host-module-page-get` tool lists all host pages. Its MCP input schema is `{}`, and the handler calls `hostModulePageApi.find(...)` with `X-RBAC-SECRET-KEY` (`apps/mcp/host/page/index.ts:39`, `apps/mcp/host/page/index.ts:52`).
- The `host-module-page-get-by-id` tool accepts only `id` from the model insert schema and calls `hostModulePageApi.findById({ id })` (`apps/mcp/host/page/index.ts:81`, `apps/mcp/host/page/index.ts:96`).
- The `host-module-page-post`, `host-module-page-patch`, and `host-module-page-delete` tools call `create`, `update`, and `delete` on the server SDK with `X-RBAC-SECRET-KEY` in options headers (`apps/mcp/host/page/index.ts:121`, `apps/mcp/host/page/index.ts:181`, `apps/mcp/host/page/index.ts:229`).
- Relation examples follow the same shape. `host-pages-to-widgets` exposes list/by-id/create/update/delete over `@sps/host/relations/pages-to-widgets/sdk/server` (`apps/mcp/host/pages-to-widgets/index.ts:2`, `apps/mcp/host/pages-to-widgets/index.ts:40`, `apps/mcp/host/pages-to-widgets/index.ts:123`, `apps/mcp/host/pages-to-widgets/index.ts:166`, `apps/mcp/host/pages-to-widgets/index.ts:214`).
- `host-widgets-to-external-widgets` exposes the same operations over `@sps/host/relations/widgets-to-external-widgets/sdk/server` (`apps/mcp/host/widgets-to-external-widgets/index.ts:2`, `apps/mcp/host/widgets-to-external-widgets/index.ts:40`, `apps/mcp/host/widgets-to-external-widgets/index.ts:123`, `apps/mcp/host/widgets-to-external-widgets/index.ts:167`, `apps/mcp/host/widgets-to-external-widgets/index.ts:216`).
- `blog-module-widget-patch` updates a `blog.widget` by id using `blogWidgetApi.update({ id, data: args, options: { headers: { "X-RBAC-SECRET-KEY": RBAC_SECRET_KEY }}})` (`apps/mcp/blog/widget/index.ts:164`, `apps/mcp/blog/widget/index.ts:181`).
- The shared count-tool accepts optional `filters.and[]` entries with column, method, and value, validates `RBAC_SECRET_KEY`, calls `api.count(...)`, and returns `{ data: count }` JSON text (`apps/mcp/lib/count-tool.ts:19`, `apps/mcp/lib/count-tool.ts:44`, `apps/mcp/lib/count-tool.ts:70`).

### API And SDK Path Under MCP

- Server SDK factories expose `findById`, `find`, `count`, `update`, `create`, `findOrCreate`, `delete`, `bulkCreate`, and `bulkUpdate`; each merges route/host defaults with call-specific props (`libs/shared/frontend/server/api/src/lib/factory/index.ts:37`).
- The shared `find` action serializes query params with `qs`, fetches `${host}${route}?${stringifiedQuery}`, and unwraps the `{ data }` response (`libs/shared/frontend/api/src/lib/actions/find/index.ts:23`).
- The shared `count` action fetches `${host}${route}/count?${stringifiedQuery}` and returns a number (`libs/shared/frontend/api/src/lib/actions/count/index.ts:23`).
- The shared `create` and `update` actions put JSON-stringified `data` inside multipart `FormData` via `prepareFormDataToSend(...)` before POST/PATCH (`libs/shared/frontend/api/src/lib/actions/create/index.ts:23`, `libs/shared/frontend/api/src/lib/actions/update/index.ts:24`, `libs/shared/utils/src/lib/preapare-form-data-to-send.ts:1`).
- Backend create/update handlers parse multipart bodies, require `body["data"]` to be a string, parse JSON, and call service create/update (`libs/shared/backend/api/src/lib/controllers/rest/handler/create/index.ts:17`, `libs/shared/backend/api/src/lib/controllers/rest/handler/update/index.ts:17`).
- Backend delete handlers take `:uuid` from the route and call service delete (`libs/shared/backend/api/src/lib/controllers/rest/handler/delete/index.ts:17`).
- `ParseQueryMiddleware` converts query strings into `parsedQuery` with `populate`, `filters`, `orderBy`, `offset`, and `limit`, including JSON parsing for `filters.and` and `orderBy.and` when needed (`libs/shared/backend/api/src/lib/middleware/parse-query/index.ts:20`).
- The database repository applies `filters.and`, limit, offset, and orderBy in `find(...)`, and applies `filters.and` in `count(...)` (`libs/shared/backend/api/src/lib/repository/database/index.ts:41`, `libs/shared/backend/api/src/lib/repository/database/index.ts:100`).
- The filter builder accepts only the `and` group, normalizes scalar values by table column type, supports JSON-field syntax with `->>`, and maps supported methods to Drizzle predicates (`libs/shared/backend/api/src/lib/query-builder/filters.ts:39`, `libs/shared/backend/api/src/lib/query-builder/filters.ts:84`, `libs/shared/backend/api/src/lib/query-builder/filters.ts:130`).

### Authorization And Headers

- `apps/api/app.ts` installs `IsAuthorizedMiddleware` before route mounts, and CORS allows `X-RBAC-SECRET-KEY` (`apps/api/app.ts:49`, `apps/api/app.ts:160`).
- The authorization middleware immediately allows requests when `X-RBAC-SECRET-KEY` or `rbac.secret-key` matches `RBAC_SECRET_KEY` (`libs/middlewares/src/lib/is-authorized/index.ts:100`, `libs/middlewares/src/lib/is-authorized/index.ts:116`).
- The same middleware allows unauthenticated `GET` requests for `/api/(host|website-builder|file-storage)/.*`, but not for `/api/blog/.*` (`libs/middlewares/src/lib/is-authorized/index.ts:56`).
- MCP list/create/update/delete/count tools generally include `X-RBAC-SECRET-KEY`; representative examples are `host-module-page-get`, `host-module-page-post`, `host-module-page-patch`, `host-module-page-delete`, and `registerCountTool` (`apps/mcp/host/page/index.ts:52`, `apps/mcp/host/page/index.ts:134`, `apps/mcp/host/page/index.ts:181`, `apps/mcp/host/page/index.ts:229`, `apps/mcp/lib/count-tool.ts:70`).
- MCP resources and by-id tools call SDK methods without explicit secret headers in representative files (`apps/mcp/host/page/index.ts:16`, `apps/mcp/host/page/index.ts:96`, `apps/mcp/blog/widget/index.ts:16`, `apps/mcp/blog/widget/index.ts:96`).

### Documentation And Schema Metadata

- `AI_GUIDE.md` defines the repository AI entry path and says MCP tools expose `get-project-doc`, `get-module-doc`, and `get-entity-doc` for documentation lookup (`AI_GUIDE.md:21`, `AI_GUIDE.md:91`).
- `apps/mcp/documentation.ts` implements those three tools by resolving repo paths and reading README files (`apps/mcp/documentation.ts:87`, `apps/mcp/documentation.ts:137`, `apps/mcp/documentation.ts:172`).
- The root README documents the model/relation architecture, SDK-provider data access, `variant="find"` relation filtering, generic REST operations, and the `apps/mcp` role (`README.md:25`, `README.md:133`, `README.md:241`, `README.md:42`).
- `host.page` docs describe routable pages with fields including `title`, `url`, `language`, and variants including `find` and `find-by-url` (`libs/modules/host/models/page/README.md`).
- `host.widget` docs describe placement containers that render external content connected through `widgets-to-external-widgets` (`libs/modules/host/models/widget/README.md`).
- `host.pages-to-widgets` docs define `pageId`, `widgetId`, and `orderIndex` for ordering page widgets (`libs/modules/host/relations/pages-to-widgets/README.md`).
- `host.widgets-to-external-widgets` docs define `widgetId`, `externalModule`, and `externalWidgetId` for linking host widgets to external module widgets (`libs/modules/host/relations/widgets-to-external-widgets/README.md`).
- `blog.widget` docs define localized `title`, `subtitle`, and `description`, plus article/category list and overview variants (`libs/modules/blog/models/widget/README.md`).
- SDK model files also export route, variant, schema, and relation metadata. `host.widgets-to-external-widgets` exports `externalModules` containing `blog` and other module names (`libs/modules/host/relations/widgets-to-external-widgets/sdk/model/src/lib/index.ts:16`, `libs/modules/host/relations/widgets-to-external-widgets/sdk/model/src/lib/index.ts:18`).
- OpenAPI-style YAML files define endpoint paths and input schemas for the same models/relations, including `filters.yaml` references and multipart `data` payload shape (`libs/modules/host/models/page/sdk/model/src/lib/paths.yaml:1`, `libs/modules/host/relations/pages-to-widgets/sdk/model/src/lib/paths.yaml:1`, `libs/modules/host/relations/widgets-to-external-widgets/sdk/model/src/lib/paths.yaml:1`, `libs/modules/blog/models/widget/sdk/model/src/lib/blog-widget-input.yaml:1`).

### Host And Blog Content Graph

- The host module README describes host as the central module for page structure, widget management, external widgets, and content relationships (`libs/modules/host/README.md:5`).
- Its publishing flow is: create content widget in the source module, create host widget, link them via `widgets-to-external-widgets`, then attach the host widget to a page via `pages-to-widgets` (`libs/modules/host/README.md:49`).
- It lists `blog` as an allowed external widget source (`libs/modules/host/README.md:67`).
- `host.pages-to-widgets` database schema stores `pageId` and `widgetId` with cascade references to page and widget tables, plus `orderIndex` (`libs/modules/host/relations/pages-to-widgets/backend/repository/database/src/lib/schema.ts:10`).
- The relation SDK route is `/api/host/pages-to-widgets`, and its default query orders by `orderIndex asc` (`libs/modules/host/relations/pages-to-widgets/sdk/model/src/lib/index.ts:16`, `libs/modules/host/relations/pages-to-widgets/sdk/model/src/lib/index.ts:18`).
- `host.widgets-to-external-widgets` database schema stores `widgetId`, `externalModule`, and `externalWidgetId`; `externalWidgetId` is text and `externalModule` defaults to `website-builder` (`libs/modules/host/relations/widgets-to-external-widgets/backend/repository/database/src/lib/schema.ts:16`).
- `blog.widget` schema stores localized `title`, `subtitle`, and `description` as JSONB maps keyed by language, with `slug`, `adminTitle`, `variant`, and timestamps (`libs/modules/blog/models/widget/backend/repository/database/src/lib/fields/singlepage.ts:4`).
- The blog widget SDK route is `/api/blog/widgets`, and its exported variants include article list, article overview, category overview, and category list variants (`libs/modules/blog/models/widget/sdk/model/src/lib/index.ts:16`, `libs/modules/blog/models/widget/sdk/model/src/lib/index.ts:17`).

### Runtime Traversal For The Canonical Example

- The Next.js catch-all route resolves language prefixes, builds `slashedUrl`, and renders `HostModulePage` with `variant="find-by-url"` and `url={slashedUrl}` (`apps/host/app/[[...url]]/page.tsx:38`, `apps/host/app/[[...url]]/page.tsx:60`).
- The host page server variant calls `api.findByUrl({ url })`, which fetches `/api/host/pages/find-by-url?url=...` (`libs/modules/host/models/page/frontend/component/src/lib/singlepage/find-by-url/server.tsx:7`, `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:49`).
- The backend `find-by-url` handler sanitizes query strings, normalizes `index` to `/`, and calls `service.findByUrl({ url, params: c.var.parsedQuery })` (`libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/find-by-url/index.ts:13`).
- The page service finds pages, builds saturated URL candidates for dynamic segments, and returns the matching page by id (`libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:21`, `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:122`).
- The default host page variant renders `PagesToWidgets` with `variant="find"` and a filter where `pageId eq props.data.id` (`libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:51`).
- The default `pages-to-widgets` relation variant renders `HostWidget` with `variant="find"` and a filter where `id eq props.data.widgetId` (`libs/modules/host/relations/pages-to-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:18`).
- The default host widget variant renders `WidgetsToExternalWidgets` with `variant="find"` and a filter where `widgetId eq props.data.id` (`libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:18`).
- The default `widgets-to-external-widgets` relation switches on `props.data.externalModule`; when the value is `blog`, it renders the blog branch (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:28`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:36`).
- The blog branch renders `BlogModuleWidget` with `variant="find"` and a filter where `id eq props.data.externalWidgetId`, then renders the resolved widget using its own `variant` and `language` (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/blog/Component.tsx:7`).
- The shared `find` component executes `props.api.find(props.apiProps)` server-side or `props.api.find(props.apiProps)` through React Query client-side, so the relation filters in this traversal use the same SDK/API query shape available to generic code (`libs/shared/frontend/components/src/lib/singlepage/find/server.tsx:13`, `libs/shared/frontend/components/src/lib/singlepage/find/client.tsx:14`).

### Admin Content Management Surface

- The AI guide describes content publishing through content widget, host widget, `pages-to-widgets`, and `widgets-to-external-widgets` steps, and instructs AI agents to use MCP tools/resources instead of direct DB access when available (`AI_GUIDE.md:72`, `AI_GUIDE.md:91`).
- The admin-v2 host widget form already composes related admin views for layouts-to-widgets, pages-to-widgets, and widgets-to-external-widgets, filtering relation tables by the current widget id (`libs/modules/host/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:71`, `libs/modules/host/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:124`, `libs/modules/host/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:177`).
- That host admin-v2 form also resolves the external widget admin form by switching `externalModule`; the `blog` branch renders `BlogWidget` with `variant="admin-v2-form"` and `data: { id: externalWidgetId }` (`libs/modules/host/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:23`, `libs/modules/host/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:38`).
- The `widgets-to-external-widgets` admin form exposes select inputs for host widget, external module, and the external widget selector for the selected module (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/admin/form/ClientComponent.tsx:101`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/admin/form/ClientComponent.tsx:108`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/admin/form/ClientComponent.tsx:163`).
- The blog widget admin-v2 form stores localized fields under `title.<language>`, `subtitle.<language>`, and `description.<language>` using `internationalization.languages` (`libs/modules/blog/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:152`, `libs/modules/blog/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:168`, `libs/modules/blog/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:184`).

## Code References

- `apps/mcp/index.ts:1` - stdio MCP server entrypoint.
- `apps/mcp/actions.ts:64` - MCP server instance and global module registration.
- `apps/mcp/documentation.ts:87` - project/module/entity documentation tools.
- `apps/mcp/lib/count-tool.ts:44` - shared count MCP tool helper.
- `apps/mcp/host/page/index.ts:39` - representative model list tool.
- `apps/mcp/host/page/index.ts:121` - representative model create tool.
- `apps/mcp/host/page/index.ts:164` - representative model update tool.
- `apps/mcp/host/page/index.ts:212` - representative model delete tool.
- `apps/mcp/host/pages-to-widgets/index.ts:40` - representative relation list tool.
- `apps/mcp/host/widgets-to-external-widgets/index.ts:40` - external-widget relation list tool.
- `apps/mcp/blog/widget/index.ts:164` - blog widget update tool.
- `apps/api/app.ts:160` - authorization middleware before module route mounts.
- `apps/api/app.ts:172` - mounted module API apps.
- `libs/middlewares/src/lib/is-authorized/index.ts:116` - secret-key bypass path.
- `libs/shared/frontend/server/api/src/lib/factory/index.ts:37` - server SDK CRUD/count factory.
- `libs/shared/frontend/api/src/lib/actions/find/index.ts:23` - generic collection GET action.
- `libs/shared/frontend/api/src/lib/actions/create/index.ts:23` - generic create action.
- `libs/shared/frontend/api/src/lib/actions/update/index.ts:24` - generic update action.
- `libs/shared/backend/api/src/lib/controllers/rest/index.ts:32` - shared REST route table.
- `libs/shared/backend/api/src/lib/repository/database/index.ts:41` - database find implementation.
- `libs/shared/backend/api/src/lib/repository/database/index.ts:100` - database count implementation.
- `libs/modules/host/models/page/sdk/model/src/lib/index.ts:16` - host page API route.
- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:21` - find-by-url service logic.
- `libs/modules/host/relations/pages-to-widgets/sdk/model/src/lib/index.ts:16` - pages-to-widgets API route and default ordering.
- `libs/modules/host/relations/widgets-to-external-widgets/sdk/model/src/lib/index.ts:16` - widgets-to-external-widgets API route and external module list.
- `libs/modules/blog/models/widget/backend/repository/database/src/lib/fields/singlepage.ts:19` - blog widget localized title JSONB field.
- `apps/host/app/[[...url]]/page.tsx:60` - page URL to host page rendering entry.
- `libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:51` - page to page-widget relation traversal.
- `libs/modules/host/relations/pages-to-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:18` - page-widget to host widget traversal.
- `libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:18` - host widget to external widget relation traversal.
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/blog/Component.tsx:7` - external blog widget resolution.

## Architecture Documentation

- SPS models and relations share a layered Repository -> Service -> Controller -> App backend pattern, mounted only through `apps/api/app.ts` (`README.md:80`, `apps/api/app.ts:172`).
- The generic backend path for MCP reads/writes is: MCP tool -> module server SDK -> shared frontend server API action -> `apps/api` route -> shared REST handler -> CRUD service -> database repository.
- The generic frontend content graph path is: Next catch-all route -> `host.page` find-by-url -> `host.pages-to-widgets` find -> `host.widget` find -> `host.widgets-to-external-widgets` find -> external module branch -> source module widget find.
- Relation traversal in frontend code follows the repository rule that relation components use `variant="find"` and `apiProps.params.filters.and` (`README.md:133`, `AI_GUIDE.md:57`).
- Host widgets are composition containers; content lives in external module widgets, and `widgets-to-external-widgets` is the current bridge that records `externalModule` and `externalWidgetId` (`libs/modules/host/README.md:49`).
- Localized content fields are JSONB maps, so the canonical "English title" update on a `blog.widget` corresponds to updating the `title.en` property in the `title` JSON object rather than a scalar `title` column (`libs/modules/blog/models/widget/backend/repository/database/src/lib/fields/singlepage.ts:19`).

## Historical Context (from thoughts/)

- Issue 160 added generic shared `/count` support and then added 143 MCP entity count tools through `registerCountTool`; its progress artifact records successful `npx tsc -p apps/mcp/tsconfig.json --noEmit` and `npx nx run mcp:eslint:lint` verification for that MCP change set (`thoughts/shared/handoffs/singlepagestartup/ISSUE-160-progress.md`).
- Issue 160 research documents the shared REST/query pipeline that remains relevant here: `ParseQueryMiddleware`, `FindHandler`, `CRUDService.find`, `Database.find`, and `queryBuilder.filters` (`thoughts/shared/research/singlepagestartup/ISSUE-160.md`).
- Issue 164 research documents host route-first composition and cross-module widgets for social chat pages; the same host route and `widgets-to-external-widgets` composition pattern appears in the blog widget traversal researched for this issue (`thoughts/shared/research/singlepagestartup/ISSUE-164.md`).
- The current issue process artifact records the user-facing natural-language example as a reusable learning for later phases (`thoughts/shared/processes/singlepagestartup/ISSUE-187.md`).

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-160.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-164.md`
- `thoughts/shared/handoffs/singlepagestartup/ISSUE-160-progress.md`

## Open Questions

- Which live code surface should be treated as the source of truth for MCP-discoverable entity metadata when docs, SDK zod schemas, SDK YAML, and frontend admin composition all contain overlapping information?
- What exact ambiguity contract should MCP expose when a natural-language target such as "Articles widget on `/about`" matches zero, one, or multiple host/external widgets?
- How should destructive MCP operations distinguish preview, confirmation, and apply phases while still using the existing SDK/API delete paths?
- How should locale-specific patches represent JSONB field updates such as `title.en` while preserving sibling language keys in the current whole-record update API?

## Known Pitfalls (from implementation)

### GitHub CLI network blocked in sandbox

- **Phase**: Create, Research
- **Occurrences**: 2
- **Symptom**: GitHub helper/CLI calls failed with `error connecting to api.github.com` when run in the sandbox.
- **Root Cause**: The sandboxed command did not have network access to GitHub.
- **Fix**: Re-run the same GitHub helper or `gh` command with escalated network access.
- **Preventive Action**: For core workflow GitHub helper failures that explicitly report GitHub connectivity errors, retry the same helper sequence with network escalation instead of rewriting the helper flow.
- **References**: `.claude/helpers/create_issue_with_project.sh`, `gh issue view 187 --repo singlepagestartup/singlepagestartup`, `https://github.com/singlepagestartup/singlepagestartup/issues/187`
