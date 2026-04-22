---
issue_number: 162
issue_title: "Migrate host app to Next.js 16.2.4"
start_date: 2026-04-19T00:29:33Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-162.md
status: in_progress
---

# Implementation Progress: ISSUE-162 - Migrate host app to Next.js 16.2.4

**Started**: 2026-04-19
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-162.md`

## Phase Progress

### Phase 1: Align Next.js 16 Dependency and Runtime Surface

- [x] Started: 2026-04-19T00:29:33Z
- [x] Completed: 2026-04-19T00:33:17Z
- [x] Automated verification: PASSED — `npm install`, `npm ls next @next/bundle-analyzer @next/third-parties eslint-config-next`, `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:eslint:lint`

**Notes**: Issue comments synced through 2026-04-19T00:24:57Z. No post-plan scope changes were found beyond the approved plan. Phase 1 aligned `next`, `@next/bundle-analyzer`, `@next/third-parties`, and `eslint-config-next` to `16.2.4`, removed `experimental_ppr`, and documented the explicit decision to keep the host on the previous caching model instead of enabling `cacheComponents` during the same migration step. `npm install` completed successfully despite a non-blocking engine warning because the repo requests `npm ^10.x` while this environment is on `npm 11.6.1`. `npm ls` confirmed a single resolved `16.2.4` dependency surface, and the host lint target passed with one pre-existing warning in `apps/host/styles/presets/shadcn.ts:63`.

### Phase 2: Migrate Host Entry Points and Route-Adjacent Surfaces

- [x] Started: 2026-04-19T00:33:17Z
- [x] Completed: 2026-04-19T00:39:14Z
- [x] Automated verification: PASSED — `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:next:build`

**Notes**: Phase 2 started after Phase 1 manual verification. The full host entrypoint and route-adjacent file set from the approved plan was read before editing. The locale redirect entrypoint was migrated from `apps/host/middleware.ts` to `apps/host/proxy.ts` while preserving the existing redirect behavior and matcher exclusions, including `healthz`. The host revalidation route was updated for Next 16 by changing `revalidateTag(tag)` to `revalidateTag(tag, "max")`. `apps/host/next.config.js` now strips the legacy `eslint` field that `@nx/next` injects through `withNx`, removing the Next 16 invalid-config warning during builds. The host production build now succeeds on Next 16; during static data collection it logs `ECONNREFUSED` when the local API is not running, but the host SDK paths already tolerate `catchErrors`, so static generation still completes.

### Phase 3: Cold-State Validation and External Widget Regression Coverage

- [x] Started: 2026-04-19T08:54:12Z
- [x] Completed: 2026-04-22T00:21:06Z
- [x] Automated verification: PASSED — `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx jest --config apps/host/jest.config.ts --runInBand apps/host/src/fragments/import-guard.spec.ts apps/host/src/fragments/fragment-renderers.spec.ts`, `npx tsc -p apps/host/tsconfig.json --noEmit`, `npx tsc -p apps/ecommerce/tsconfig.json --noEmit`, `npx tsc -p apps/rbac/tsconfig.json --noEmit`, `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run host:eslint:lint`, `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run host:next:build`, `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run ecommerce:next:build`, `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run rbac:next:build`, `npm run site:dev:poc`

**Notes**: Phase 3 changed direction after the app-local generated manifest approach was rejected for poor authoring UX. The temporary `apps/host/src/runtime/site` runtime and `apps/host/scripts/generate-site-runtime-manifests.cjs` were removed. `apps/host` now uses a server-only fragment orchestrator for the `[[...url]]` hot path and no longer imports ecommerce/rbac frontend component graphs there. A POC fragment split was added with `apps/ecommerce` and `apps/rbac` as standalone Next apps exposing `/api/sps/fragments/query`, `/api/sps/fragments/render`, and `/api/sps/fragments/capabilities`. The POC preserves host-owned cross-module composition by rendering rbac cart/checkout fragments first and passing their HTML into the ecommerce product fragment as a `children` slot. `site:dev:poc` starts host/ecommerce/rbac together in Turbopack dev mode. Host production build now uses explicit `next build --webpack` because the remaining admin graph still makes Turbopack production build impractical; host dev remains Turbopack.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 3 -->

### Incident 1 — Next 16 Turbopack dev OOM persisted after the host route rendered

- **Occurrences**: 2
- **Stage**: Phase 3 - Cold-State Validation and External Widget Regression Coverage
- **Symptom**: `npm run host:dev` reached ready state, served the catch-all route, then consumed ~8.5-9 GB heap and crashed with `Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory`.
- **Root Cause**: The catch-all host route imported too much of the `@sps/*/frontend/component` graph through `libs/modules/host` and later through the app-local generated manifest experiment. This made a single Turbopack dev process responsible for analyzing the entire modular page-builder graph.
- **Fix**: Rejected both the webpack-dev fallback and the generated manifest approach as final architecture. Replaced the `[[...url]]` hot path with a server-only fragment orchestrator and POC remote fragments in `apps/ecommerce` and `apps/rbac`, so host composes ecommerce/rbac output over HTTP instead of importing their frontend components.
- **Reusable Pattern**: Keep `apps/host` as the cross-module composition owner, but never let `[[...url]]` import broad module frontend component graphs. Cross-module slots must be represented as serializable recipes plus remote HTML fragments.

### Incident 2 — Next App Router private folders made `/_sps` endpoints unroutable

- **Occurrences**: 1
- **Stage**: Phase 3 - Fragment POC implementation
- **Symptom**: `apps/ecommerce` and `apps/rbac` builds succeeded, but the expected `/_sps/fragments/*` endpoints did not appear in the Next route table.
- **Root Cause**: App Router treats folders prefixed with `_` as private folders, so `app/_sps/...` is not routable.
- **Fix**: Moved fragment endpoints to `app/api/sps/fragments/*` and updated host remote calls to `/api/sps/fragments/query` and `/api/sps/fragments/render`.
- **Reusable Pattern**: Do not use leading-underscore folders for routable internal endpoints in Next App Router; use `/api/sps/...` or another explicit routable namespace.

### Incident 3 — Host Turbopack production build still pulls admin graph

- **Occurrences**: 1
- **Stage**: Phase 3 - Framework acceptance
- **Symptom**: `host:next:build` with the default Next 16 Turbopack build stayed at `Creating an optimized production build ...` for several minutes with no progress after the site hot path was moved to fragments.
- **Root Cause**: `apps/host` still has admin routes and layout/auth entrypoints that import broad `@sps/*/frontend/component` graphs. The fragment POC only removed the public `[[...url]]` site hot path from that graph.
- **Fix**: Changed `host:next:build` and `host:next:start` to explicit run-command targets and use `next build --webpack` for production build. `host:next:dev` remains `next dev --turbopack`.
- **Reusable Pattern**: Site runtime fragmentation fixes the public page-builder hot path. Admin/auth graphs need a separate migration before host production build can safely use Turbopack too.

## Summary

### Changes Made

- (populated during implementation)
- Aligned the root and host Next package surface to `16.2.4` and refreshed `package-lock.json`.
- Removed the obsolete `experimental_ppr` route export from the host catch-all page.
- Documented the explicit decision to keep the previous caching model during the framework migration instead of enabling `cacheComponents`.
- Renamed the host locale redirect entrypoint from `middleware.ts` to `proxy.ts` for Next 16.
- Updated the host revalidation route to use the new `revalidateTag(tag, "max")` signature.
- Removed the obsolete `eslint` build-config field injected by `@nx/next` so Next 16 builds stay clean.
- Reworked the external-widget dispatcher to resolve the selected server-side widget module at runtime instead of through one eager import fan-in.
- Removed the rejected app-local generated site runtime under `apps/host/src/runtime/site` and `apps/host/scripts`.
- Added shared fragment contracts and a host server-only fragment orchestrator for the `[[...url]]` site path.
- Added `apps/ecommerce` and `apps/rbac` Next fragment apps with `/api/sps/fragments/query`, `/api/sps/fragments/render`, and `/api/sps/fragments/capabilities`.
- Added a `site:dev:poc` script that starts host/ecommerce/rbac in Turbopack dev mode with one command.
- Kept host dev on Turbopack; switched only host production build to explicit webpack because admin/auth still pull broad module frontend graphs.

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [ ] All phases completed
- [ ] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-04-22T00:21:06Z
