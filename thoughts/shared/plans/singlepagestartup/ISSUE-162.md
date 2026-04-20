# Migrate host app to Next.js 16.2.4 Implementation Plan

## Overview

Upgrade `apps/host` from `next@15.4.8` to `next@16.2.4`, align the related Next package surface across the repo, migrate the known Next 16 breaking points, and verify that the Nx-managed host runtime still behaves correctly on both normal routes and the high-risk external widget rendering path.

## Current State Analysis

The host app currently mixes Next-related versions between the workspace root and `apps/host/package.json`, with `next` pinned to `15.4.8` in both places while `@next/bundle-analyzer`, `@next/third-parties`, and `eslint-config-next` remain on 15.x ranges in separate manifests. The app is served through Nx `@nx/next` targets with Turbopack enabled for development.

The main migration-sensitive host surfaces are the catch-all App Router page, the locale redirect convention, and the route/server-SDK flows that participate in page lookup, metadata generation, sitemap generation, and cache invalidation. The route currently exports `experimental_ppr = true`, and the locale redirect still uses `middleware.ts`, both of which conflict with Next.js 16 expectations.

The prior failed Next 16 attempt reported an out-of-memory crash after the app became ready and started rendering external module widgets through the host page -> host widget -> `widgets-to-external-widgets` chain. That path must be treated as blocking scope during verification, not as optional follow-up work.

## Desired End State

`apps/host` runs on `next@16.2.4` with aligned Next-adjacent dependencies, the deprecated or removed host app surfaces are migrated cleanly, and the host continues to build, start, and render through the existing SPS composition flow without reintroducing the historical widget-driven OOM regression.

Verification at the end of implementation should show:

- the root and host manifests agree on the intended Next.js 16 package surface;
- the host route/proxy conventions are valid for Next 16;
- the host build and production start succeed from a cold state;
- route handlers and server-SDK-backed host page flows still behave as expected;
- the `widgets-to-external-widgets` rendering path does not regress into runaway memory growth or process termination.

### Key Discoveries:

- `next` is pinned at the workspace root and inside `apps/host`, while companion Next packages are also split across those manifests, so the migration must update both dependency surfaces rather than only one file (`package.json:126`, `package.json:209`, `apps/host/package.json:15`, `apps/host/package.json:16`, `apps/host/package.json:70`).
- The catch-all route already uses async `params`, but it still exports `experimental_ppr = true`, which is removed in Next 16 and therefore needs an explicit replacement/removal decision (`apps/host/app/[[...url]]/page.tsx:11`, `apps/host/app/[[...url]]/page.tsx:37`).
- The locale redirect logic still lives in `apps/host/middleware.ts`, while Next 16 renames that convention to `proxy`; the existing matcher also preserves a `healthz` exclusion that must survive the rename (`apps/host/middleware.ts:4`, `apps/host/middleware.ts:24`, `thoughts/shared/plans/singlepagestartup/2026-03-02-integration-e2e-modular-rollout.md:116`).
- Host page rendering fans into layouts, widgets, and then `widgets-to-external-widgets`, so validation must explicitly cover that downstream relation path instead of stopping at route readiness (`libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:19`, `libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:18`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:28`).
- Build-time page discovery, runtime page lookup, metadata generation, sitemap generation, and manual revalidation are all wired through the current App Router plus server SDKs, so route-file edits alone are insufficient (`apps/host/app/[[...url]]/page.tsx:13`, `apps/host/app/api/revalidate/route.ts:7`, `apps/host/app/sitemap.xml/route.ts:8`, `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/urls.ts:30`, `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:47`, `libs/modules/host/models/metadata/sdk/server/src/lib/singlepage/actions/generate.ts:41`).

## What We're NOT Doing

- Re-architecting the host page/layout/widget composition model.
- Refactoring the `widgets-to-external-widgets` dispatcher into a different rendering strategy unless the migration exposes a concrete Next 16 incompatibility that forces it.
- Expanding unrelated Nx, React, or module-package upgrades beyond what is required for a stable Next 16 host migration.
- Treating generic dev-server readiness as sufficient verification without also checking production startup and the high-risk widget rendering chain.

## Implementation Approach

Apply the migration in narrow layers: first align the dependency and framework surface, then update the host-specific Next 16 entrypoints and removed APIs, and finally validate the full runtime from a cold state with explicit attention to the known OOM-prone rendering path. This keeps the migration incremental and makes it easier to isolate whether failures come from package alignment, route/proxy behavior, or deep widget composition.

## Phase 1: Align Next.js 16 Dependency and Runtime Surface

### Overview

Bring the repo onto a single intentional Next 16 package surface and confirm the host’s Nx-driven runtime/configuration is still compatible before changing route behavior.

### Changes Required:

#### 1. Root and host package manifests

**Files**: `package.json`, `apps/host/package.json`
**Why**: The root and host manifests currently pin `next` and related `@next/*` packages independently, so the migration must align both sources of truth to avoid mixed-version runtime behavior.
**Changes**: Update `next` to `16.2.4` where pinned, align `@next/bundle-analyzer`, `@next/third-parties`, and `eslint-config-next` to the intended Next 16-compatible versions, and verify whether any required type/runtime pairings around the existing React 19 setup need adjustment during the bump.

#### 2. Nx host target and framework configuration review

**Files**: `apps/host/project.json`, `apps/host/next.config.js`
**Why**: The host app is run entirely through `@nx/next` executors, with `turbo: true` in development and custom Next config behavior layered through `withNx` and `@next/bundle-analyzer`.
**Changes**: Confirm that the existing Nx target definitions and Next config conventions remain valid under Next 16, remove or adjust any settings that are no longer supported, and preserve the current custom webpack/header/image behavior unless the upgrade requires targeted changes.

#### 3. Caching-model decision at the catch-all route boundary

**File**: `apps/host/app/[[...url]]/page.tsx`
**Why**: The route currently relies on `experimental_ppr`, which is removed in Next 16, so the migration must explicitly choose whether to stay on the existing caching model or adopt the newer cache-components direction.
**Changes**: Remove the obsolete `experimental_ppr` usage and replace it with the intended Next 16-compatible routing/cache configuration without silently changing host rendering semantics.

### Success Criteria:

#### Automated Verification:

- [x] Dependency installation succeeds after the version alignment.
- [x] Host lint surface still runs for the changed files: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:eslint:lint`
- [x] The workspace can resolve the upgraded host dependency graph without mixed-version package errors.

#### Manual Verification:

- [ ] The dependency updates reflect a single intended Next 16 migration story rather than a partial bump split across root and host manifests.
- [ ] Any caching-model decision replacing `experimental_ppr` is explicit and documented in the implementation notes/PR summary.

---

## Phase 2: Migrate Host Entry Points and Route-Adjacent Surfaces

### Overview

Update the host-specific framework touchpoints that conflict with Next 16 and regression-check the route-adjacent server flows that the host runtime depends on.

### Changes Required:

#### 1. Catch-all route migration

**File**: `apps/host/app/[[...url]]/page.tsx`
**Why**: The catch-all route owns URL normalization, admin routing, page lookup, static params generation, and metadata delegation, making it the central host entrypoint for Next-specific behavior.
**Changes**: Keep the existing async `params` and route flow intact while removing unsupported route-segment config, confirming that `generateStaticParams`, metadata generation, and admin vs non-admin routing still line up with Next 16 expectations.

#### 2. Locale redirect rename from middleware to proxy

**Files**: `apps/host/middleware.ts` and its Next 16 replacement path
**Why**: The host still implements locale redirection through the deprecated `middleware` convention, and that file’s matcher already contains a repo-specific `healthz` exclusion that must be preserved.
**Changes**: Rename/migrate the locale redirect entrypoint to the Next 16 convention, keep the current redirect semantics, and preserve matcher exclusions for `_next`, API routes, static assets, and `healthz`.

#### 3. Host route handlers and server-SDK-backed runtime checks

**Files**: `apps/host/app/api/revalidate/route.ts`, `apps/host/app/robots.txt/route.ts`, `apps/host/app/sitemap.xml/route.ts`, `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/urls.ts`, `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts`, `libs/modules/host/models/metadata/sdk/server/src/lib/singlepage/actions/generate.ts`
**Why**: These handlers and server SDK actions support cache invalidation, sitemap generation, metadata composition, and page lookup, so the migration needs to confirm they still cooperate correctly with the updated Next runtime.
**Changes**: Regression-check the route handler behavior and the server SDK fetch/caching assumptions they rely on, then make targeted fixes only where the Next 16 migration exposes incompatibilities.

### Success Criteria:

#### Automated Verification:

- [x] The host production build succeeds after the route/proxy migration: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:next:build`
- [x] No import or config errors remain around the host proxy/route entrypoints.

#### Manual Verification:

- [ ] Locale redirects still apply correctly and do not intercept `healthz`, API routes, or static framework assets.
- [ ] Admin URLs still route into `AdminV2`, and non-admin URLs still resolve through the host page `find-by-url` flow.
- [ ] `robots.txt`, `sitemap.xml`, and the revalidation endpoint continue to respond with the expected behavior after the migration.

---

## Phase 3: Cold-State Validation and External Widget Regression Coverage

### Overview

Validate the upgraded host runtime from a clean state and explicitly cover the rendering path that previously crashed during the earlier Next 16 attempt.

### Changes Required:

#### 1. Clean-state verification workflow

**Files**: build/dev output directories and any touched verification helpers or notes
**Why**: The issue scope explicitly requires cold-state checks so the migration is not accidentally validated against stale `.next` or Turbopack artifacts.
**Changes**: Clear the host’s build/dev artifacts before verification runs and execute the required lint/build/start flow from that clean state.

#### 2. Production runtime validation

**Files**: `apps/host/project.json`, runtime commands, and any narrow fixes discovered during validation
**Why**: The ticket requires production `build` and `start`, not just development boot, because the host’s static params, metadata, and route-handler behavior depend on production code paths.
**Changes**: Run the host production build and production start flow, capture any Next 16 regressions that only appear in production mode, and apply only the fixes required to restore expected behavior.

#### 3. External widget rendering regression check

**Files**: `libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx`, `libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/index.tsx`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx`
**Why**: The previous Next 16 attempt reportedly reached ready state and then failed while rendering external module widgets, so this chain is the most important regression boundary for sign-off.
**Changes**: Exercise the host page -> widget -> `widgets-to-external-widgets` composition path under the upgraded runtime, identify whether any branch in the dispatcher causes memory growth or OOM, and treat that as blocking scope if reproduced.

### Success Criteria:

#### Automated Verification:

- [ ] Host lint passes on the final migration branch: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:eslint:lint`
- [ ] Host production build passes from a cold state: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:next:build`
- [ ] Host production start succeeds after the fresh build: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:next:start`

#### Manual Verification:

- [ ] The verification run starts from cleared host build/dev artifacts rather than reused `.next` output.
- [ ] The upgraded host renders ordinary page content without regressions in locale handling, layout/widget composition, or metadata behavior.
- [ ] The `widgets-to-external-widgets` rendering path is exercised explicitly and does not reproduce the prior memory/OOM failure.

## Testing Strategy

### Unit Tests:

- Run the host lint/test surface that covers touched files and any module-level components adjusted during the migration.
- Add or update targeted tests only where the migration changes observable host routing or rendering behavior.

### Integration Tests:

- Prefer the host build/start flow and any existing scoped verification commands that cover the host runtime as the main integration signal for this migration.
- If the migration requires code changes around route handlers or host rendering composition, run the smallest relevant scoped integration coverage that exercises those paths.

### Manual Testing Steps:

1. Clear host build/dev artifacts before running verification.
2. Run the host production build on the migrated branch.
3. Start the host in production mode and open a representative non-admin page.
4. Open an admin route and confirm it still resolves through the existing admin shell.
5. Request `robots.txt`, `sitemap.xml`, and the revalidation endpoint to confirm they still respond correctly.
6. Exercise a page that renders external module widgets through `widgets-to-external-widgets` and watch for memory growth, hangs, or process termination.

## Performance Considerations

The most important performance risk is not generic page speed but stability under the external widget rendering chain that previously exhausted heap memory. Validation should therefore watch for memory growth or repeated rendering churn when external module widgets are composed, especially after the app reaches ready state.

Any replacement for `experimental_ppr` should preserve the intended host rendering behavior without accidentally broadening server work or cache invalidation frequency across page, metadata, sitemap, or widget fetch flows.

## Migration Notes

Use the Next.js codemod workflow only as a starting point. Any automated rename or config cleanup must be reviewed against the repo’s Nx setup, the host-specific locale redirect matcher, and the SPS page/widget composition pattern before it is accepted.

If production validation fails only on the external widget path, keep that investigation inside this issue rather than splitting it into a follow-up, because the ticket explicitly defines that regression as blocking completion.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-162.md`
- Process log: `thoughts/shared/processes/singlepagestartup/ISSUE-162.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-162.md`
