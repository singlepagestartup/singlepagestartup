# Issue: Migrate host app to Next.js 16.2.4

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/162
**Status**: Dev, build and start verified on `next@16.3.6` with a postinstall shim; branch `issue-162` awaits review
**Created**: 2026-04-19
**Verified**: 2026-09-25
**Priority**: medium
**Size**: large
**Type**: refactoring
**Latest tested version**: `next@16.3.6`

---

## Problem to Solve

`main` pins the host application to `next@15.4.8` in the workspace root and in [apps/host/package.json](/Users/rogwild/code/singlepagestartup/sps-lite/apps/host/package.json). Every earlier move to Next.js 16 produced a working production build and a Turbopack dev server that exhausted the V8 heap on the first request through the single `[[...url]]` catch-all route.

The route is the site builder's only composition entry point: one page renders host layouts, pages and widgets, and through `widgets-to-external-widgets` any widget of any business module. Splitting it into route segments, fragments, micro frontends or separate Next.js apps is not an acceptable workaround.

## Root cause

The dev-mode crash is not a Turbopack compilation problem. It is the React Flight client that `next` bundles for development.

- `transferReferencedDebugInfo` in the Flight client copies every unnamed `_debugInfo` entry (async I/O debug info) from a referenced chunk into the receiving chunk each time a `$ref` resolves. In a deep server-component tree with many awaited fetches the arrays grow multiplicatively. The SSR process allocates about 350 MB/s and dies within 25 to 85 seconds, either with `RangeError: Invalid array length` followed by `TypeError: chunk.reason.enqueueModel is not a function`, or with `FATAL ERROR: Ineffective mark-compacts near heap limit`.
- Evidence: a sampling heap profile taken through the Node inspector during the request (`next dev --inspect`, `HeapProfiler.startSampling`) attributes 5.19 GB of 5.55 GB live allocations to `transferReferencedDebugInfo` in `node_modules/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js`.
- Upstream: [facebook/react#37343](https://github.com/facebook/react/issues/37343), fixed by [facebook/react#37481](https://github.com/facebook/react/pull/37481) (merged 2026-09-02, released in React 19.3.0). `next@16.3.6` bundles `react@19.3.0-canary-cbb046ab-20260731`, which predates the fix. `next@16.4.0-canary.47` bundles `react@19.3.0-canary-8b0da1c6-20260922`, which contains it.
- Production runtimes carry no debug info, which is why `next build` and `next start` passed in every attempt.
- Raising `--max-old-space-size`, `experimental.turbopackMemoryEviction`, `--disable-source-maps` and `--no-server-fast-refresh` do not change the outcome.

## Current state of branch `issue-162`

- `next`, `@next/bundle-analyzer`, `@next/third-parties` and `eslint-config-next` at `16.3.6`; `react` and `react-dom` at `19.2.8`; `@types/react` at `19.2.17`; `@nx/next` at `22.0.2`, which supports `next <17`.
- [tools/runtime/patch-next-flight-debug-info.mjs](/Users/rogwild/code/singlepagestartup/sps-lite/tools/runtime/patch-next-flight-debug-info.mjs) runs from the root `postinstall` script and rewrites `transferReferencedDebugInfo` in the 20 development Flight client bundles under `node_modules/next/dist/compiled` to the upstream implementation, a per-chunk `Set` that transfers each entry once. The script is idempotent, never fails an install, and prints `nothing to patch` once the installed Next ships the fix; that message is the signal to delete the script and the hook. Tests: `node --test tools/runtime/patch-next-flight-debug-info.test.mjs`.
- [apps/host/next.config.js](/Users/rogwild/code/singlepagestartup/sps-lite/apps/host/next.config.js) sets `agentRules: false`, because Next 16.3 otherwise writes `AGENTS.md` and `CLAUDE.md` into `apps/host` on every dev start, and no longer sets `experimental.turbopackMemoryEviction`, whose default is already `auto`.
- Kept from the earlier retry: [apps/host/proxy.ts](/Users/rogwild/code/singlepagestartup/sps-lite/apps/host/proxy.ts) replaces `middleware.ts`, `experimental_ppr` is gone from the catch-all page, the revalidate route calls `revalidateTag(tag, "max")`, and the Next config is exported as an async function that drops the removed `eslint` key.
- `main` is merged into the branch through PR [#301](https://github.com/singlepagestartup/singlepagestartup/pull/301).

## Verification

Cold install in a fresh worktree without `node_modules`, `.nx` or `apps/host/.next`; API served from the same branch.

| Check                                                                      | Result                                                                                                                                                                         |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npx nx run host:next:dev` (Turbopack), first `GET /en` after a cold start | 200 in 44.8 s, full page                                                                                                                                                       |
| warm `GET /en`                                                             | 200 in 2.4 to 6.5 s, 1.05 MB, widgets from billing, crm, ecommerce, file-storage, host, rbac and website-builder                                                               |
| `GET /`                                                                    | 307 to `/en` through `proxy.ts`                                                                                                                                                |
| `GET /en/admin`                                                            | 200                                                                                                                                                                            |
| `next-server` RSS during the cold request                                  | peaks near 3 GB, returns to about 0.5 GB after memory eviction                                                                                                                 |
| the same request without the shim                                          | heap OOM at 9.0 to 9.4 GB in every run                                                                                                                                         |
| `host:next:build` (Turbopack, `--max-old-space-size=12288`)                | passes: compiled in 45 s, TypeScript 2.3 min, 7 static pages                                                                                                                   |
| `host:next:start`, `GET /en`                                               | 200 in 1.2 s, 257 KB with billing, crm, ecommerce, file-storage, host and website-builder widgets; cached repeat 5 ms; `/` 307 to `/en`; `/en/admin` and `/api/revalidate` 200 |
| shim unit tests                                                            | 6 passed                                                                                                                                                                       |

## Remaining work

- Review the branch and open the pull request from `issue-162` to `main`.
- Delete the shim and its `postinstall` hook when the installed `next` bundles React with facebook/react#37481; `node tools/runtime/patch-next-flight-debug-info.mjs` then prints `nothing to patch`.
- `next@16.4.0-canary.47` ships the fixed Flight client (checked by reading its bundled `app-page-turbo.runtime.dev.js`); it was not run against this app. The branch stays on the stable release.

## References

- Next.js 16 upgrade guide: [nextjs.org/docs/app/guides/upgrading/version-16](https://nextjs.org/docs/app/guides/upgrading/version-16)
- Next.js 16.3 Turbopack memory eviction: [nextjs.org/blog/next-16-3-turbopack](https://nextjs.org/blog/next-16-3-turbopack)
- `@nx/next` support matrix, `next >=14.0.0 <17.0.0`: [nx.dev/docs/technologies/react/next/introduction](https://nx.dev/docs/technologies/react/next/introduction)
- Earlier attempt on `next@16.0.1-canary.1`: [#113](https://github.com/singlepagestartup/singlepagestartup/issues/113)
