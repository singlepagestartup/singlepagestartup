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
- [ ] Completed: —
- [ ] Automated verification: —

**Notes**: Phase 3 started from the user-reported dev-only regression after `npm run host:dev`. The Turbopack dev server OOM was reproduced locally after the app reached ready state and the catch-all route rendered. A first pass replaced the eager external-widget dispatcher imports with `next/dynamic`, but the dev process still OOMed. The dispatcher was then reworked so the server path resolves the selected external widget with a runtime `await import(...)` instead of one eager fan-in file, and the host `next:dev` / `host:dev` entrypoint was switched to webpack mode, which stayed alive on the same route path where Turbopack crashed. Full Phase 3 completion is still pending because production `start` and API-backed external-widget validation need a full local stack.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 1 -->

### Incident 1 — Next 16 Turbopack dev OOM persisted after the host route rendered

- **Occurrences**: 1
- **Stage**: Phase 3 - Cold-State Validation and External Widget Regression Coverage
- **Symptom**: `npm run host:dev` reached ready state, served the catch-all route, then consumed ~8.5-9 GB heap and crashed with `Ineffective mark-compacts near heap limit Allocation failed - JavaScript heap out of memory`.
- **Root Cause**: Next.js 16 dev still defaulted to Turbopack even when the Nx target did not explicitly add `--turbo`, and the host route graph remained too large for Turbopack to handle stably in this app.
- **Fix**: Confirmed the direct webpack path via `next dev --webpack`, rewired the host `next:dev` / `host:dev` entrypoint to use webpack mode, removed the stale `turbo` hint from the Nx target, and reworked the external-widget dispatcher so the server path selects the external module with a runtime import instead of a single eager import fan-in.
- **Reusable Pattern**: When Next 16 Nx dev still prints `Turbopack` after removing `turbo` options, check `next dev --help` and switch the dev entrypoint to `--webpack` explicitly; omitting Nx `turbo` flags is not sufficient to opt out.

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
- Switched the host `next:dev` / `host:dev` entrypoint to webpack dev mode because the Next 16 Turbopack path continued to OOM after route render.

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [ ] All phases completed
- [ ] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-04-19T08:54:12Z
