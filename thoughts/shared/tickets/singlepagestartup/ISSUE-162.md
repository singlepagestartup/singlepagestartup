# Issue: Migrate host app to Next.js 16.2.4

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/162
**Status**: Research Needed
**Created**: 2026-04-19
**Priority**: medium
**Size**: large
**Type**: refactoring

---

## Problem to Solve

The host application is still pinned to `next@15.4.8` in both the workspace root and [apps/host/package.json](/Users/rogwild/code/singlepagestartup/sps-lite/apps/host/package.json), while the current stable release is `next@16.2.4` (released April 15, 2026). We need a controlled migration to Next.js 16 for `apps/host`, including the required code and configuration updates for removed or deprecated APIs, package alignment, and verification of Nx compatibility.

## Key Details

- Current workspace state:
  - Root [package.json](/Users/rogwild/code/singlepagestartup/sps-lite/package.json) and [apps/host/package.json](/Users/rogwild/code/singlepagestartup/sps-lite/apps/host/package.json) both pin `next` to `15.4.8`.
  - The repo already uses `react@19.0.0`, `react-dom@19.0.0`, `typescript@5.x`, and `@nx/next@22.0.2`.
  - [apps/host/project.json](/Users/rogwild/code/singlepagestartup/sps-lite/apps/host/project.json) runs the app through Nx `@nx/next` executors with `turbo: true` in dev.
- Official compatibility and upgrade notes:
  - Next.js 16 upgrade guide: [nextjs.org/docs/app/guides/upgrading/version-16](https://nextjs.org/docs/app/guides/upgrading/version-16)
  - Next.js 16 release notes: [nextjs.org/blog/next-16](https://nextjs.org/blog/next-16)
  - Latest stable patch `v16.2.4`: [github.com/vercel/next.js/releases/tag/v16.2.4](https://github.com/vercel/next.js/releases/tag/v16.2.4)
  - Nx `@nx/next` support matrix says `next >=14.0.0 <17.0.0` is supported: [nx.dev/docs/technologies/react/next/introduction](https://nx.dev/docs/technologies/react/next/introduction)
- Repo-specific migration hotspots already identified:
  - [apps/host/middleware.ts](/Users/rogwild/code/singlepagestartup/sps-lite/apps/host/middleware.ts) still uses the deprecated `middleware` file convention. Next.js 16 renames this convention to `proxy`.
  - [apps/host/app/[[...url]]/page.tsx](/Users/rogwild/code/singlepagestartup/sps-lite/apps/host/app/[[...url]]/page.tsx) exports `experimental_ppr = true`, which was removed in Next.js 16.
  - The same catch-all page already uses async `params`, which is good because synchronous request APIs are fully removed in Next.js 16.
  - Route handlers such as [apps/host/app/api/revalidate/route.ts](/Users/rogwild/code/singlepagestartup/sps-lite/apps/host/app/api/revalidate/route.ts), [apps/host/app/robots.txt/route.ts](/Users/rogwild/code/singlepagestartup/sps-lite/apps/host/app/robots.txt/route.ts), and [apps/host/app/sitemap.xml/route.ts](/Users/rogwild/code/singlepagestartup/sps-lite/apps/host/app/sitemap.xml/route.ts) should be regression-checked after the upgrade because Next.js 16 changes the long-term direction around Cache Components and route segment config.
  - Supporting packages tied to Next.js are still on 15.x and must be aligned during the migration: `@next/bundle-analyzer`, `@next/third-parties`, and `eslint-config-next`.
  - The host relation renderer in [libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx) is a known high-risk path because the previous upgrade attempt surfaced an out-of-memory crash while rendering module widgets through `widgets-to-external-widgets`, while host-level `layouts`, `pages`, and `widgets` still rendered.
  - Prior migration attempt reference: GitHub issue [#113](https://github.com/singlepagestartup/singlepagestartup/issues/113) targeted `next@16.0.1-canary.1`, but the user later reported a Turbopack dev crash with `FATAL ERROR: Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory` after the app became ready and started rendering external module widgets.
- Version 16 removal and behavior changes relevant to this repo:
  - `middleware` is deprecated/renamed to `proxy`.
  - `experimental_ppr` route segment config is removed.
  - `next lint` is removed, though this repo already relies on Nx + ESLint instead of `next lint`.
  - Node.js 20.9+ is required; repo baseline already targets Node 20+.

## Implementation Notes

- Use the Next.js codemod path as a first pass, but expect manual cleanup for Nx config and SPS-specific routing:
  - `npx @next/codemod@canary upgrade latest`
  - `npx @next/codemod@latest middleware-to-proxy .`
  - `npx @next/codemod@latest remove-experimental-ppr .`
- Update `next`, `@next/bundle-analyzer`, `@next/third-parties`, and `eslint-config-next` together; verify whether `react`, `react-dom`, `@types/react`, and `@types/react-dom` also need alignment to the latest supported pair.
- Decide explicitly whether the app should stay on the previous caching model after the version bump or opt into `cacheComponents`; do not silently replace `experimental_ppr` without validating the intended rendering model.
- Before verification, delete Next.js build/dev artifacts so checks run from a cold state instead of reusing stale `.next` or Turbopack outputs.
- Verification must include both production build and production start, not just dev mode: at minimum `host:next:build` and `host:next:start`, plus the scoped lint/test surface touched by the migration.
- During verification, explicitly exercise the rendering path for module widgets mounted through `widgets-to-external-widgets` and treat memory growth or OOM in that path as a blocking regression even if the host shell, `layouts`, `pages`, and host `widgets` still render.
