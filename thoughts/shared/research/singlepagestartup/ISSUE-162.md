---
date: 2026-04-19T03:05:06+0300
researcher: flakecode
git_commit: c1140573010393d7b53459d3d7f1c5e48c9a1b02
branch: issue-162
repository: singlepagestartup
topic: "Migrate host app to Next.js 16.2.4"
tags: [research, codebase, host, nextjs, nx]
status: complete
last_updated: 2026-04-19
last_updated_by: flakecode
---

# Research: Migrate host app to Next.js 16.2.4

**Date**: 2026-04-19T03:05:06+0300
**Researcher**: flakecode
**Git Commit**: c1140573010393d7b53459d3d7f1c5e48c9a1b02
**Branch**: issue-162
**Repository**: singlepagestartup

## Research Question

Document how `apps/host` is wired to Next.js and Nx today, which current files already match or conflict with the Next.js 16 migration scope described in issue `#162`, and how the host page rendering flow reaches the `widgets-to-external-widgets` path that previously hit an out-of-memory failure.

## Summary

The repo currently runs the host app as an Nx-managed Next.js application. The workspace root pins `next` to `15.4.8`, `@next/bundle-analyzer` and `@next/third-parties` to `15.1.3`, `eslint-config-next` to `15.1.3`, and `@nx/next` to `22.0.2`, while `apps/host/package.json` separately pins `next` to `15.4.8` and the two `@next/*` companion packages to `15.2.2` (`package.json:47`, `package.json:48`, `package.json:126`, `package.json:171`, `package.json:209`, `apps/host/package.json:15`, `apps/host/package.json:16`, `apps/host/package.json:70`).

The host app’s catch-all App Router page is the primary Next-specific migration surface. It exports `experimental_ppr = true`, uses async `params`, generates static params from the host page SDK, and routes `/admin` traffic into the custom admin-v2 shell while all other traffic resolves through the host page frontend component with variant `find-by-url` (`apps/host/app/[[...url]]/page.tsx:9`, `apps/host/app/[[...url]]/page.tsx:11`, `apps/host/app/[[...url]]/page.tsx:13`, `apps/host/app/[[...url]]/page.tsx:37`, `apps/host/app/[[...url]]/page.tsx:55`, `apps/host/app/[[...url]]/page.tsx:60`).

The current i18n redirect still lives in `apps/host/middleware.ts`, where it prepends the default language unless the request already has a locale segment; the matcher explicitly excludes `_next`, `api`, `favicon`, and `healthz` (`apps/host/middleware.ts:4`, `apps/host/middleware.ts:15`, `apps/host/middleware.ts:24`). That `healthz` exclusion is also preserved in earlier planning history under `thoughts/shared/plans/singlepagestartup/2026-03-02-integration-e2e-modular-rollout.md:111`.

The page rendering chain that matters for the prior memory regression is: catch-all route -> host page `find-by-url` -> host page default variant -> page/layout and page/widget relations -> host widget default variant -> `widgets-to-external-widgets` relation -> module-specific external widget component selected by `externalModule` (`apps/host/app/[[...url]]/page.tsx:60`, `libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:19`, `libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:51`, `libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:18`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:28`).

## Detailed Findings

### Workspace and Nx/Next version surface

The workspace root exposes the user-facing host commands through Nx: `host:dev` runs `nx run host:next:dev`, `host:build` runs `nx run host:next:build`, and `host:start` runs `nx run host:next:start` (`package.json:8`, `package.json:9`, `package.json:11`).

The same root manifest pins `next` to `15.4.8`, `@nx/next` to `22.0.2`, and `eslint-config-next` to `15.1.3`, while the root `engines.node` currently requires `^24.x` (`package.json:126`, `package.json:171`, `package.json:209`, `package.json:249`).

`apps/host/project.json` defines the host targets with `@nx/next:server` for dev and start, `@nx/next:build` for production build output, and `turbo: true` on the dev server target (`apps/host/project.json:8`, `apps/host/project.json:16`, `apps/host/project.json:19`, `apps/host/project.json:29`).

`apps/host/package.json` separately pins `next` to `15.4.8`, uses `next start` as its local script, and carries `@next/bundle-analyzer` and `@next/third-parties` at `15.2.2` (`apps/host/package.json:6`, `apps/host/package.json:7`, `apps/host/package.json:15`, `apps/host/package.json:16`, `apps/host/package.json:70`).

### Host app Next configuration and entrypoints

`apps/host/next.config.js` wraps the app with `withNx(...)` and `@next/bundle-analyzer`, sets `reactStrictMode`, configures image remote patterns from environment-derived hosts, injects CORS headers for `/api/:path*`, adds custom webpack rules for SVG and ignore-loader patterns, and pushes `pino-pretty`, `lokijs`, and `encoding` into webpack externals (`apps/host/next.config.js:1`, `apps/host/next.config.js:12`, `apps/host/next.config.js:25`, `apps/host/next.config.js:28`, `apps/host/next.config.js:50`, `apps/host/next.config.js:74`, `apps/host/next.config.js:105`, `apps/host/next.config.js:113`).

The catch-all App Router page at `apps/host/app/[[...url]]/page.tsx` exports `revalidate = 86400`, `dynamicParams = true`, and `experimental_ppr = true` (`apps/host/app/[[...url]]/page.tsx:9`, `apps/host/app/[[...url]]/page.tsx:10`, `apps/host/app/[[...url]]/page.tsx:11`).

That route already consumes `params` as a promise, resolves locale prefixes from `internationalization.languages`, normalizes the page URL, routes `/admin` paths into `AdminV2`, and otherwise renders the host page component with variant `find-by-url` (`apps/host/app/[[...url]]/page.tsx:37`, `apps/host/app/[[...url]]/page.tsx:40`, `apps/host/app/[[...url]]/page.tsx:47`, `apps/host/app/[[...url]]/page.tsx:55`, `apps/host/app/[[...url]]/page.tsx:60`).

The i18n redirect logic remains in `apps/host/middleware.ts`. It clones `request.nextUrl`, prefixes the default locale when no locale segment is present, and applies to all paths except the matcher exclusions including `healthz` (`apps/host/middleware.ts:4`, `apps/host/middleware.ts:15`, `apps/host/middleware.ts:16`, `apps/host/middleware.ts:24`).

### Build-time page and metadata resolution

`generateStaticParams()` in the catch-all route calls `spsHostPageApi.urls({ catchErrors: true })` and only returns the non-root paths when `NEXT_PHASE` is not `PHASE_PRODUCTION_BUILD`; production builds return an empty array (`apps/host/app/[[...url]]/page.tsx:13`, `apps/host/app/[[...url]]/page.tsx:16`, `apps/host/app/[[...url]]/page.tsx:18`, `apps/host/app/[[...url]]/page.tsx:30`).

The underlying server SDK action for page URLs adds `Cache-Control: no-store` during production builds, fetches `${host}${route}/urls`, and transforms `/` to an empty segment array while splitting non-root URLs into path parts (`libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/urls.ts:12`, `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/urls.ts:17`, `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/urls.ts:30`, `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/urls.ts:49`).

The host page `find-by-url` server SDK action uses the same production-build `no-store` pattern, fetches `${host}${route}/find-by-url?url=...`, and returns a transformed page model only when an `id` is present (`libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:21`, `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:25`, `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:47`, `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:61`, `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:63`).

`generateMetadata()` in the route delegates to the metadata server SDK, whose current implementation seeds metadata from `NEXT_PUBLIC_HOST_METADATA_*` environment variables and then overlays values from the first metadata entity with variant `primary` returned by `api.find()` (`apps/host/app/[[...url]]/page.tsx:33`, `libs/modules/host/models/metadata/sdk/server/src/lib/singlepage/actions/generate.ts:16`, `libs/modules/host/models/metadata/sdk/server/src/lib/singlepage/actions/generate.ts:41`, `libs/modules/host/models/metadata/sdk/server/src/lib/singlepage/actions/generate.ts:68`).

### Host page, widget, and external-widget composition

The host page frontend package uses a variant dispatcher: the public component resolves `variants[props.variant]`, and `find-by-url` plus `default` are both part of that map (`libs/modules/host/models/page/frontend/component/src/lib/index.tsx:4`, `libs/modules/host/models/page/frontend/component/src/lib/index.tsx:5`, `libs/modules/host/models/page/frontend/component/src/lib/singlepage/variants.ts:8`, `libs/modules/host/models/page/frontend/component/src/lib/singlepage/variants.ts:15`).

The `find-by-url` variant is a wrapper that picks either `Server` or `Client` and provides the host page client SDK provider around it (`libs/modules/host/models/page/frontend/component/src/lib/singlepage/find-by-url/index.tsx:4`, `libs/modules/host/models/page/frontend/component/src/lib/singlepage/find-by-url/index.tsx:5`, `libs/modules/host/models/page/frontend/component/src/lib/singlepage/find-by-url/index.tsx:10`).

The host page `default` component fetches `pages-to-layouts` with `variant="find"` and a `pageId` plus `variant="default"` filter, then nests a `pages-to-widgets` `find` query filtered by the same `pageId` (`libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:19`, `libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:27`, `libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:32`, `libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:51`, `libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:59`).

The host widget `default` component then fetches `widgets-to-external-widgets` by `widgetId` and re-renders each relation entity through the same relation frontend package (`libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:18`, `libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:26`, `libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:38`).

The relation’s `default/index.tsx` uses the shared singlepage wrapper with the relation SDK `Provider`, `clientApi`, and `serverApi` (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/index.tsx:1`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/index.tsx:12`).

The relation’s `default/Component.tsx` is a module dispatcher. It renders one of the module-specific child components based on `props.data.externalModule`, with explicit branches for `analytic`, `billing`, `blog`, `crm`, `ecommerce`, `file-storage`, `notification`, `rbac`, `social`, `startup`, and `website-builder` (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:28`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:32`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:36`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:40`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:44`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:48`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:52`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:56`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:60`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:64`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:68`).

The module README and relation README describe the same architecture at the documentation level: host widgets are containers, real content is connected through `widgets-to-external-widgets`, and that relation’s `default` variant renders the related external widget target (`libs/modules/host/README.md:49`, `libs/modules/host/README.md:58`, `libs/modules/host/relations/widgets-to-external-widgets/README.md:3`, `libs/modules/host/relations/widgets-to-external-widgets/README.md:21`).

### Route handlers and revalidation surfaces

The host app exposes a revalidation route that is always dynamic, runs on the Node runtime, and applies `revalidateTag` or `revalidatePath` based on `tag`, `path`, and `type` query params (`apps/host/app/api/revalidate/route.ts:4`, `apps/host/app/api/revalidate/route.ts:5`, `apps/host/app/api/revalidate/route.ts:7`, `apps/host/app/api/revalidate/route.ts:13`, `apps/host/app/api/revalidate/route.ts:17`).

The `robots.txt` and `sitemap.xml` routes are both static `GET` handlers with `revalidate = 60` (`apps/host/app/robots.txt/route.ts:3`, `apps/host/app/robots.txt/route.ts:9`, `apps/host/app/sitemap.xml/route.ts:4`, `apps/host/app/sitemap.xml/route.ts:42`).

`sitemap.xml` currently depends on the same host page URL server SDK used by `generateStaticParams()`, mapping each returned page URL into an XML `<loc>` entry under `NEXT_PUBLIC_HOST_SERVICE_URL` (`apps/host/app/sitemap.xml/route.ts:8`, `apps/host/app/sitemap.xml/route.ts:21`, `apps/host/app/sitemap.xml/route.ts:25`).

### Prior migration evidence recorded outside the codebase

The current ticket already identifies the migration-sensitive hotspots and points to the prior Next 16 attempt under GitHub issue `#113` (`thoughts/shared/tickets/singlepagestartup/ISSUE-162.md:29`).

The live GitHub history for issue `#113` records that the app reached the ready state on `Next.js 16.0.1-canary.1 (Turbopack)` and then crashed with `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory` while rendering widgets at `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx`, while host-level layouts, pages, and widgets still rendered ([Issue #113](https://github.com/singlepagestartup/singlepagestartup/issues/113)).

## Code References

- `package.json:8` - Root host build command delegates to `nx run host:next:build`.
- `package.json:126` - Workspace root currently pins `next` to `15.4.8`.
- `package.json:171` - Workspace root uses `@nx/next` version `22.0.2`.
- `package.json:209` - Workspace root currently pins `eslint-config-next` to `15.1.3`.
- `apps/host/package.json:15` - Host package pins `@next/bundle-analyzer` to `15.2.2`.
- `apps/host/package.json:70` - Host package pins `next` to `15.4.8`.
- `apps/host/project.json:8` - Host dev target uses `@nx/next:server`.
- `apps/host/project.json:16` - Host dev target enables `turbo: true`.
- `apps/host/next.config.js:25` - Next config starts the `withBundleAnalyzer`/`withNx` app configuration.
- `apps/host/app/[[...url]]/page.tsx:11` - Catch-all route exports `experimental_ppr = true`.
- `apps/host/app/[[...url]]/page.tsx:13` - Catch-all route defines `generateStaticParams()`.
- `apps/host/app/[[...url]]/page.tsx:60` - Non-admin traffic resolves through host page variant `find-by-url`.
- `apps/host/middleware.ts:4` - Locale redirect currently lives in `middleware.ts`.
- `apps/host/middleware.ts:24` - Matcher exclusions include `healthz`.
- `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/urls.ts:30` - Page URL discovery fetches the `/urls` endpoint.
- `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:47` - Page resolution fetches the `/find-by-url` endpoint.
- `libs/modules/host/models/metadata/sdk/server/src/lib/singlepage/actions/generate.ts:41` - Metadata generation overlays values from the `primary` metadata entity.
- `libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:19` - Host page default fetches `pages-to-layouts`.
- `libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:51` - Host page default fetches `pages-to-widgets`.
- `libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:18` - Host widget default fetches `widgets-to-external-widgets`.
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/index.tsx:12` - Relation default binds the shared wrapper to the relation Provider and APIs.
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:28` - Relation dispatcher renders the `analytic` external module branch.
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:68` - Relation dispatcher renders the `website-builder` external module branch.
- `apps/host/app/api/revalidate/route.ts:13` - Revalidation route applies `revalidateTag`.
- `apps/host/app/sitemap.xml/route.ts:8` - Sitemap generation calls the host page URL SDK.

## Architecture Documentation

The host application uses a layered composition pattern rather than embedding page content directly inside the route file. The route resolves the current site path, then delegates page lookup and rendering to the host module frontend package, which in turn resolves layouts and widgets through relation components using the repository-standard `variant="find"` plus `apiProps.params.filters.and` pattern (`apps/host/app/[[...url]]/page.tsx:60`, `libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:21`, `libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:53`).

Host widgets are only slots. The actual content fan-out happens one layer deeper in `widgets-to-external-widgets`, where a single relation renderer dispatches into many module-specific widget implementations based on `externalModule` (`libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:18`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:28`).

Build-time page discovery, page lookup, metadata generation, sitemap generation, and manual revalidation are all still wired through the current App Router plus server-SDK flow, so the migration scope is not limited to the top-level route file. It also includes the server actions that fetch page URLs and page records during build/runtime and the route handlers that participate in cache invalidation and static document generation (`apps/host/app/[[...url]]/page.tsx:13`, `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/urls.ts:21`, `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:29`, `apps/host/app/api/revalidate/route.ts:7`, `apps/host/app/sitemap.xml/route.ts:6`).

## Historical Context (from thoughts/)

No prior research document specific to the Next.js 16 host migration was found under `thoughts/shared/research/`.

The current ticket file already captures the repo-scoped migration hotspots for issue `#162`, including the `middleware.ts` convention, `experimental_ppr`, the route handlers to regression-check, and the `widgets-to-external-widgets` risk path (`thoughts/shared/tickets/singlepagestartup/ISSUE-162.md:29`).

The March 2 integration/e2e rollout plan records a prior host routing change: `apps/host/app/healthz/route.ts` was added and `apps/host/middleware.ts` was updated so `healthz` bypasses the locale redirect matcher (`thoughts/shared/plans/singlepagestartup/2026-03-02-integration-e2e-modular-rollout.md:111`, `thoughts/shared/plans/singlepagestartup/2026-03-02-integration-e2e-modular-rollout.md:116`).

## Related Research

No directly related host-migration research document was found in `thoughts/shared/research/`. The nearest live artifact for this topic before the current research was the ticket file at `thoughts/shared/tickets/singlepagestartup/ISSUE-162.md`.

## Open Questions

- No repo-local research or plan artifact was found for the earlier GitHub issue `#113`; the prior OOM evidence currently lives in the GitHub issue comments rather than in `thoughts/shared/`.
- The prior OOM report narrows the failing area to the `widgets-to-external-widgets` rendering layer, but it does not identify which specific external module branch triggered the memory growth.
