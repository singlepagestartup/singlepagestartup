---
date: 2026-04-25T03:14:29+0300
researcher: flakecode
git_commit: b2a1870eaa43847c34958866af2b6bcd16d6686e
branch: issue-163
repository: singlepagestartup
topic: "Create standalone Waku app to validate apps/host frontend startup behavior"
tags: [research, codebase, host, routing, metadata, widgets, waku]
status: complete
last_updated: 2026-04-25
last_updated_by: flakecode
---

# Research: Create standalone Waku app to validate apps/host frontend startup behavior

**Date**: 2026-04-25T03:14:29+0300
**Researcher**: flakecode
**Git Commit**: b2a1870eaa43847c34958866af2b6bcd16d6686e
**Branch**: issue-163
**Repository**: singlepagestartup

## Research Question

Document the current `apps/host` behavior that issue `#163` treats as the parity contract for a standalone Waku spike, with emphasis on:

- catch-all URL resolution and language-prefix behavior;
- `/admin` routing;
- metadata generation and `notFound` behavior;
- public page lookup by URL;
- host page/layout/widget rendering;
- external module widget rendering through `widgets-to-external-widgets`;
- the existing app/runtime structure that currently hosts those behaviors.

## Summary

`apps/host` is an Nx Next.js application whose active runtime contract is centered on the catch-all route in `apps/host/app/[[...url]]/page.tsx:14-74` and the language-prefix redirect middleware in `apps/host/middleware.ts:4-25`. The catch-all page normalizes the incoming `params.url`, strips an optional leading language segment using the configured language codes from `libs/shared/configuration/src/lib/internationalization/index.ts:1-17`, builds a canonical slash-prefixed URL, routes `/admin` requests directly to `AdminV2`, and otherwise resolves a public page through `HostModulePage` with `variant="find-by-url"` (`apps/host/app/[[...url]]/page.tsx:45-69`).

Public page resolution is implemented through the host page SDK and backend API chain. The server-side `find-by-url` wrapper calls `api.findByUrl(...)` in `libs/modules/host/models/page/frontend/component/src/lib/singlepage/find-by-url/server.tsx:7-18`, which fetches `/api/host/pages/find-by-url` through the server SDK action in `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:13-68`. The page backend exposes `/find-by-url`, `/urls`, and `/url-segment-value` from `libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/index.ts:20-38`, while the service resolves URLs in `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:21-241`.

Once a page is found, rendering flows through nested host model and relation components instead of direct data access in the route. The page default component queries `pages-to-layouts` and `pages-to-widgets` using `variant="find"` filters (`libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:18-72`). Layouts then query `layouts-to-widgets` for `default` and `additional` widget buckets (`libs/modules/host/models/layout/frontend/component/src/lib/singlepage/default/Component.tsx:17-90`). Widgets resolve `widgets-to-external-widgets` relations (`libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:15-41`), and the host external-widget relation dispatches by `externalModule` to module-specific adapters such as the `website-builder` and `rbac` paths (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:28-71`).

Metadata and not-found behavior are also split across host-specific entrypoints. `generateMetadata` delegates to the host metadata SDK in `apps/host/app/[[...url]]/page.tsx:34-35`, and the metadata action builds defaults from shared env-derived values before overlaying the primary metadata entity from the host metadata model in `libs/modules/host/models/metadata/sdk/server/src/lib/singlepage/actions/generate.ts:16-94`. Missing public pages cause `throw notFound()` inside the catch-all route (`apps/host/app/[[...url]]/page.tsx:61-69`), while `apps/host/app/not-found.tsx:4-24` separately resolves `/404` through the same `find-by-url` host page path and falls back to a plain “Not found” screen if no `/404` page exists.

## Detailed Findings

### 1. Current app/runtime surface for `apps/host`

The host frontend is registered as an Nx application in `apps/host/project.json:1-36`. Its configured targets are:

- `next:dev` via `@nx/next:server` with `dev: true`, `port: 3000`, and `turbo: true` (`apps/host/project.json:7-18`);
- `next:build` via `@nx/next:build` with `outputPath: "apps/host"` (`apps/host/project.json:19-27`);
- `next:start` via `@nx/next:server` with `buildTarget: "host:next:build"` and `port: 3000` (`apps/host/project.json:28-36`).

This is the currently documented frontend runtime that issue `#163` treats as the behavioral reference for a separate app under `apps/`.

### 2. Catch-all routing, language handling, `/admin`, metadata, and not-found behavior

The main runtime entrypoint is `apps/host/app/[[...url]]/page.tsx:14-74`.

- `generateStaticParams()` calls `spsHostPageApi.urls({ catchErrors: true })` and only returns non-empty URLs outside production builds (`apps/host/app/[[...url]]/page.tsx:14-32`).
- `generateMetadata(props)` forwards directly to `metadataApi.generate({ catchErrors: true, ...props })` (`apps/host/app/[[...url]]/page.tsx:34-35`).
- The page function reads `params.url`, derives available language codes from `internationalization.languages`, defaults to `internationalization.defaultLanguage.code`, strips a leading language segment when present, then joins the remaining segments into `slashedUrl` (`apps/host/app/[[...url]]/page.tsx:38-54`).
- Requests whose normalized URL starts with `/admin` return `<AdminV2 ... />` immediately (`apps/host/app/[[...url]]/page.tsx:56-57`).
- All other requests resolve a host page with `<HostModulePage isServer={true} variant="find-by-url" url={slashedUrl}>` (`apps/host/app/[[...url]]/page.tsx:60-61`).
- If the render-prop receives no `data`, the route throws `notFound()` (`apps/host/app/[[...url]]/page.tsx:62-65`).
- When a page exists, the route renders the legacy `<Admin isServer={true} />` plus a second `HostModulePage` invocation using the stored page variant and resolved data (`apps/host/app/[[...url]]/page.tsx:67-73`).

Language-prefix enforcement also exists outside the catch-all page in `apps/host/middleware.ts:4-25`.

- The middleware derives `languages` and `defaultLanguage` from `internationalization` (`apps/host/middleware.ts:4-6`).
- For non-static paths that do not already start with a configured language prefix, it rewrites `nextUrl.pathname` to `/${defaultLanguage}${pathname}` and returns a redirect (`apps/host/middleware.ts:8-18`).
- The matcher excludes API routes, Next internals, image optimization, and common asset file extensions (`apps/host/middleware.ts:24-30`).

The not-found page uses the same page-resolution contract rather than a separate data path.

- `apps/host/app/not-found.tsx:4-24` resolves `/404` through `HostModulePage variant="find-by-url"`.
- If `/404` is missing, it renders a plain fallback block with the text `Not found` (`apps/host/app/not-found.tsx:8-13`).
- If `/404` exists, it renders that page through the standard host page component using the default configured language (`apps/host/app/not-found.tsx:15-23`).

### 3. Public page lookup by URL

The current page lookup chain is:

`apps/host/app/[[...url]]/page.tsx`
-> `libs/modules/host/models/page/frontend/component/src/lib/singlepage/find-by-url/index.tsx`
-> `libs/modules/host/models/page/frontend/component/src/lib/singlepage/find-by-url/server.tsx`
-> `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts`
-> `libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/index.ts`
-> `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts`

Current behavior in that chain:

- The `find-by-url` frontend wrapper chooses `Server` or `Client` by `props.isServer` and wraps the component in the page SDK `Provider` (`libs/modules/host/models/page/frontend/component/src/lib/singlepage/find-by-url/index.tsx:5-13`).
- The server wrapper calls `api.findByUrl({ url: props.url, catchErrors: true })` and passes the result into a render-prop child (`libs/modules/host/models/page/frontend/component/src/lib/singlepage/find-by-url/server.tsx:7-18`).
- The client wrapper uses the client SDK hook `api.findByUrl({ url: props.url })` and renders a `Skeleton` while loading (`libs/modules/host/models/page/frontend/component/src/lib/singlepage/find-by-url/client.tsx:8-20`).
- The server SDK action requests `${host}${route}/find-by-url?...`, tags the request with `[route]`, runs `responsePipe`, and normalizes the payload with `transformResponseItem` (`libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:27-68`).
- The host page controller registers `/find-by-url`, `/urls`, and `/url-segment-value` endpoints in the singlepage controller (`libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/index.ts:20-38`).
- The page service implements `findByUrl`, `urls`, and `urlSegmentValue`; `findByUrl` starts at `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:21`, and `urls` / `urlSegmentValue` start at `:225` and `:241`.

### 4. Host page/layout/widget render flow

The host page model documentation describes pages as routable containers for layouts, widgets, and metadata, with `find-by-url` acting as the routing helper and `default` assembling layout structure and in-page widgets (`libs/modules/host/models/page/README.md:1-21`).

The live render chain follows that description:

- The page default component queries `pages-to-layouts` filtered by `pageId` and `variant = "default"` (`libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:18-37`).
- Inside each resolved layout relation, the same page component also queries `pages-to-widgets` filtered by `pageId` (`libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:45-71`).
- The `pages-to-layouts` default component loads the target layout by `layoutId` and renders the concrete layout variant with `language={props.language}` (`libs/modules/host/relations/pages-to-layouts/frontend/component/src/lib/singlepage/default/Component.tsx:17-44`).
- The layout default component loads `layouts-to-widgets` twice: first for `variant = "default"`, then again for `variant = "additional"`, with `props.children` rendered between those buckets (`libs/modules/host/models/layout/frontend/component/src/lib/singlepage/default/Component.tsx:17-90`).
- The `pages-to-widgets` and `layouts-to-widgets` default components both resolve a host widget by `widgetId`; the page-scoped variant also forwards `url` to the widget (`libs/modules/host/relations/pages-to-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:17-45`, `libs/modules/host/relations/layouts-to-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:17-43`).
- The widget model documentation defines host widgets as placement containers whose `default` variant resolves linked external widgets through `widgets-to-external-widgets` (`libs/modules/host/models/widget/README.md:1-17`).
- The widget default component queries `widgets-to-external-widgets` filtered by `widgetId = props.data.id` and renders each resolved relation variant (`libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:15-41`).

### 5. External widget rendering through `widgets-to-external-widgets`

The host relation documentation defines `widgets-to-external-widgets` as the link between host widgets and external module widgets (`libs/modules/host/relations/widgets-to-external-widgets/README.md:1-18`).

The live relation component is a dispatcher over `externalModule`:

- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:28-71` conditionally renders module-specific adapter components for `analytic`, `billing`, `blog`, `crm`, `ecommerce`, `file-storage`, `notification`, `rbac`, `social`, `startup`, and `website-builder`.
- The `website-builder` adapter loads a `website-builder` widget by `externalWidgetId` using `variant="find"` and then renders the concrete widget variant with a nested host-side `Widget` adapter (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/website-builder/Component.tsx:7-43`).
- The host module README describes this same data model at the documentation level: host widgets are containers/pointers, and visible content appears only when the host widget is linked to an external module widget through `widgets-to-external-widgets` (`libs/modules/host/README.md:49-75`).

This relation-dispatch layer is also the path called out in issue `#162` as the previously observed high-risk render surface.

### 6. Metadata generation

Metadata generation is delegated from the route to the host metadata SDK in `apps/host/app/[[...url]]/page.tsx:34-35`.

The current metadata action:

- initializes a default `Metadata` object from shared environment variables such as `NEXT_PUBLIC_HOST_METADATA_TITLE`, `NEXT_PUBLIC_HOST_METADATA_DESCRIPTION`, `NEXT_PUBLIC_HOST_METADATA_ICON`, and `NEXT_PUBLIC_HOST_SERVICE_URL` (`libs/modules/host/models/metadata/sdk/server/src/lib/singlepage/actions/generate.ts:1-38`);
- loads metadata entities through `api.find()` and selects the first entity whose `variant === "primary"` (`libs/modules/host/models/metadata/sdk/server/src/lib/singlepage/actions/generate.ts:41-43`);
- overlays the primary entity onto `title`, `description`, `openGraph`, `twitter`, and `keywords` when present (`libs/modules/host/models/metadata/sdk/server/src/lib/singlepage/actions/generate.ts:68-90`);
- returns the default object unchanged when the find call fails and `catchErrors` is enabled (`libs/modules/host/models/metadata/sdk/server/src/lib/singlepage/actions/generate.ts:91-94`).

The current implementation reads host metadata globally through `api.find()` rather than deriving metadata from the resolved page URL inside this action.

## Code References

- `apps/host/project.json:7` - host dev target uses `@nx/next:server`.
- `apps/host/project.json:16` - dev target enables `turbo: true`.
- `apps/host/project.json:20` - host build target uses `@nx/next:build`.
- `apps/host/project.json:30` - host start target reuses the Nx Next server executor.
- `apps/host/app/[[...url]]/page.tsx:14` - `generateStaticParams()` entrypoint.
- `apps/host/app/[[...url]]/page.tsx:34` - `generateMetadata()` delegates to the metadata SDK.
- `apps/host/app/[[...url]]/page.tsx:45` - catch-all route initializes `urlSegments`.
- `apps/host/app/[[...url]]/page.tsx:48` - leading language segment is stripped when present.
- `apps/host/app/[[...url]]/page.tsx:56` - `/admin` routes are handled by `AdminV2`.
- `apps/host/app/[[...url]]/page.tsx:61` - public page lookup starts with `variant="find-by-url"`.
- `apps/host/app/[[...url]]/page.tsx:64` - missing page data throws `notFound()`.
- `apps/host/app/[[...url]]/page.tsx:69` - resolved public pages also render the `Admin` component.
- `apps/host/middleware.ts:17` - non-prefixed routes redirect to the default language prefix.
- `apps/host/middleware.ts:25` - middleware matcher configuration.
- `apps/host/app/not-found.tsx:6` - `/404` is resolved through the same host page `find-by-url` path.
- `libs/modules/host/models/page/frontend/component/src/lib/singlepage/find-by-url/server.tsx:9` - server wrapper calls `api.findByUrl`.
- `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:34` - page lookup request is tagged with the page route.
- `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:47` - page lookup fetches `/find-by-url`.
- `libs/modules/host/models/page/backend/app/api/src/lib/controller/singlepage/index.ts:26` - backend registers `/find-by-url`.
- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:21` - page service `findByUrl`.
- `libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:21` - page default begins relation-driven layout lookup.
- `libs/modules/host/relations/pages-to-layouts/frontend/component/src/lib/singlepage/default/Component.tsx:28` - page-to-layout relation resolves a layout by `layoutId`.
- `libs/modules/host/models/layout/frontend/component/src/lib/singlepage/default/Component.tsx:33` - layout default resolves `default` widget bucket.
- `libs/modules/host/models/layout/frontend/component/src/lib/singlepage/default/Component.tsx:70` - layout default resolves `additional` widget bucket.
- `libs/modules/host/relations/pages-to-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:28` - page-to-widget relation resolves a widget by `widgetId`.
- `libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:26` - widget default resolves external-widget relations by `widgetId`.
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:56` - `rbac` external widget adapter branch.
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:68` - `website-builder` external widget adapter branch.
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/website-builder/Component.tsx:17` - `website-builder` adapter fetches by `externalWidgetId`.
- `libs/modules/host/models/metadata/sdk/server/src/lib/singlepage/actions/generate.ts:41` - metadata action loads all metadata entities.
- `libs/modules/host/models/metadata/sdk/server/src/lib/singlepage/actions/generate.ts:68` - metadata action overlays the primary metadata entity.
- `apps/host/src/components/admin-v2/Component.tsx:81` - admin-v2 sidebar/content shell begins.
- `apps/host/src/components/admin-v2/Component.tsx:170` - admin-v2 overview components render for module sections.

## Architecture Documentation

The current host frontend uses the repository-wide variant and SDK-provider pattern described in `apps/host/README.md:1-124`:

- route-level components call module SDKs instead of talking directly to backend code;
- model and relation components expose `find` variants that hide data fetching behind shared component APIs;
- nested rendering is composed through `variant="find"` plus `apiProps.params.filters.and` filters;
- `isServer` is propagated through model/relation layers so server and client wrappers can render the same variant trees.

For the issue-163 surface specifically, that means the live page path is not a single route implementation. It is a composed tree:

1. route normalization in `apps/host/app/[[...url]]/page.tsx`;
2. page lookup through the host page SDK/backend;
3. page model rendering through host relation components;
4. layout/widget expansion through additional host relations;
5. external module dispatch through `widgets-to-external-widgets`.

The host module documentation describes the same structure at the module level: pages organize routable site structure, layouts organize layout buckets, widgets act as containers, metadata stores SEO data, and `widgets-to-external-widgets` connects host widgets to content widgets from other modules (`libs/modules/host/README.md:1-75`).

## Historical Context (from thoughts/)

Issue `#163` is documented as a separate Waku parity spike created because the current Next.js path is blocked by unresolved startup/runtime problems from issue `#162` (`thoughts/shared/tickets/singlepagestartup/ISSUE-163.md`, `thoughts/shared/processes/singlepagestartup/ISSUE-163.md`).

The issue-163 ticket defines the parity contract around the current `apps/host` behavior documented in this research: catch-all routing, language prefixes, `/admin`, page lookup by URL, metadata/not-found behavior, and external widget rendering through `widgets-to-external-widgets` (`thoughts/shared/tickets/singlepagestartup/ISSUE-163.md`).

Issue `#162` supplies the immediate historical context for why the external-widget path is treated as high risk. Its ticket records the prior Next.js migration attempt and the report that the host shell, layouts, pages, and host widgets rendered while external module widgets through `widgets-to-external-widgets` triggered a Turbopack out-of-memory crash (`thoughts/shared/tickets/singlepagestartup/ISSUE-162.md`).

The issue-162 retrospective documents workflow-level friction from that ticket creation session: GitHub helper escalation was needed in the sandbox, create-time migration constraints had to be amended after issue creation, and the retrospective artifact base path did not exist at first (`thoughts/shared/retrospectives/singlepagestartup/ISSUE-162/2026-04-19_02-56-44.md`).

No repo-local `thoughts/shared/research/.../ISSUE-162.md` or `.../ISSUE-163.md` artifact existed before this run. The issue-163 ticket also references a local `deep-research-report.md`, but no such file was found anywhere in the workspace during this research pass.

## Related Research

- No prior `thoughts/shared/research/singlepagestartup/ISSUE-162.md` artifact was found.
- No prior `thoughts/shared/research/singlepagestartup/ISSUE-163.md` artifact was found.
- Related context currently lives in:
  - `thoughts/shared/tickets/singlepagestartup/ISSUE-162.md`
  - `thoughts/shared/processes/singlepagestartup/ISSUE-162.md`
  - `thoughts/shared/tickets/singlepagestartup/ISSUE-163.md`
  - `thoughts/shared/processes/singlepagestartup/ISSUE-163.md`
  - `thoughts/shared/retrospectives/singlepagestartup/ISSUE-162/2026-04-19_02-56-44.md`

## Open Questions

- The issue-163 ticket references `deep-research-report.md`, but that file is not present in this workspace.
- There is no existing issue-162 or issue-163 research artifact in `thoughts/shared/research/` to extend from.
- This research documents the current `apps/host` implementation only; the Waku runtime comparison itself does not exist yet in the codebase.
