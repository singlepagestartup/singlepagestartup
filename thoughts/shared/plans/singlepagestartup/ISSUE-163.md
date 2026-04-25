# Standalone Waku Host Parity Spike Implementation Plan

## Overview

Build a separate `apps/waku-host` frontend spike that proves whether SPS can boot, route, fetch host page data, and render the existing host page/layout/widget pipeline on Waku without modifying `apps/host` in place. The spike must be strong enough to answer the practical viability question for dev startup, production build/start, `/admin`, database-driven public pages, and at least one external-widget render path.

## Current State Analysis

`apps/host` is the only frontend application currently wired into the workspace runtime. Root scripts expose only `host:dev`, `host:build`, and `host:start`, and those scripts delegate to Nx Next targets in `apps/host/project.json`, so there is no existing Waku app scaffold to adapt in place ([package.json:8](/Users/rogwild/code/singlepagestartup/sps-lite/package.json:8), [apps/host/project.json:8](/Users/rogwild/code/singlepagestartup/sps-lite/apps/host/project.json:8)).

The public runtime contract is concentrated in the host app shell and catch-all route. `apps/host/app/layout.tsx` bootstraps global fonts, Tailwind, RBAC subject initialization, revalidation, analytics, and toasts for every page render, while `apps/host/app/[[...url]]/page.tsx` drives static param enumeration, metadata delegation, language stripping, `/admin` branching, and public page lookup by URL. Language-prefix enforcement is split into `apps/host/middleware.ts`, and missing pages fall through the dedicated `/404` lookup path in `apps/host/app/not-found.tsx` ([apps/host/app/layout.tsx:27](/Users/rogwild/code/singlepagestartup/sps-lite/apps/host/app/layout.tsx:27), [apps/host/app/[[...url]]/page.tsx:14](/Users/rogwild/code/singlepagestartup/sps-lite/apps/host/app/[[...url]]/page.tsx:14), [apps/host/middleware.ts:4](/Users/rogwild/code/singlepagestartup/sps-lite/apps/host/middleware.ts:4), [apps/host/app/not-found.tsx:4](/Users/rogwild/code/singlepagestartup/sps-lite/apps/host/app/not-found.tsx:4)).

Public page resolution already runs through the SPS host SDK and backend API rather than direct route logic. The server page lookup action calls `GET /api/host/pages/find-by-url`, tags the request for cache invalidation, and switches to `no-store` during production builds, so the spike must preserve the same lookup contract instead of inventing a parallel fetch layer ([find-by-url.ts:16](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:16)).

The actual render tree is layered through host model and relation components. The page default component resolves `pages-to-layouts` and `pages-to-widgets`; the layout default component renders `default` widgets, then page children, then `additional` widgets; the widget default component resolves `widgets-to-external-widgets`; and the external-widget relation dispatches into module-specific branches such as `rbac`, `startup`, and `website-builder`. That relation-driven tree is the key parity surface because it is the same path issue `#162` identified as high risk during the failed Next.js upgrade work ([page default:19](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:19), [layout default:18](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/host/models/layout/frontend/component/src/lib/singlepage/default/Component.tsx:18), [widget default:18](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:18), [widgets-to-external-widgets:15](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:15)).

## Desired End State

After implementation:

- a new standalone frontend app exists at `apps/waku-host` with explicit Nx dev/build/start targets and matching root scripts for local execution;
- `apps/host` remains intact and continues to run through the existing Next.js targets while the spike lives beside it;
- the Waku app preserves the current host shell responsibilities that matter for parity: fonts/Tailwind bootstrap, RBAC subject init, revalidation wiring, analytics/toast shell, and access to the current admin components;
- non-prefixed URLs normalize to the default language, language-prefixed URLs resolve correctly, and `/admin` still branches into the admin shell instead of the public page lookup flow;
- public page rendering still begins with the existing host page `find-by-url` contract and flows through host page -> layout -> widget -> `widgets-to-external-widgets` using SPS SDK/model/relation components;
- a representative database-driven public page renders in Waku, `/admin` works, missing pages follow the `/404` fallback behavior, and at least one existing external-widget branch renders through the host relation dispatcher;
- `apps/waku-host/README.md` records the runnable commands, parity status, known gaps, and a viability recommendation for whether Waku is strong enough to continue beyond the spike.

### Key Discoveries

- The workspace currently exposes only the Next.js host startup flow, so the spike must introduce a brand-new app surface instead of adapting an existing Waku prototype ([package.json:8](/Users/rogwild/code/singlepagestartup/sps-lite/package.json:8), [apps/host/project.json:8](/Users/rogwild/code/singlepagestartup/sps-lite/apps/host/project.json:8)).
- The real route contract is split across the root layout, catch-all page, middleware redirect, and not-found page, not just one page component ([apps/host/app/layout.tsx:27](/Users/rogwild/code/singlepagestartup/sps-lite/apps/host/app/layout.tsx:27), [apps/host/app/[[...url]]/page.tsx:38](/Users/rogwild/code/singlepagestartup/sps-lite/apps/host/app/[[...url]]/page.tsx:38), [apps/host/middleware.ts:15](/Users/rogwild/code/singlepagestartup/sps-lite/apps/host/middleware.ts:15), [apps/host/app/not-found.tsx:6](/Users/rogwild/code/singlepagestartup/sps-lite/apps/host/app/not-found.tsx:6)).
- Host metadata generation is already SDK-driven and effectively global, which means the spike can preserve current behavior by reusing the host metadata server action instead of redesigning metadata semantics in this issue ([apps/host/app/[[...url]]/page.tsx:34](/Users/rogwild/code/singlepagestartup/sps-lite/apps/host/app/[[...url]]/page.tsx:34)).
- Production page lookup deliberately switches to `no-store` and route-tagged fetches, so the spike should reuse the existing server action path and avoid a separate caching layer for host page resolution ([find-by-url.ts:21](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts:21)).
- Layout slot order and descendant `url` / `language` propagation are hard requirements of the current render tree, especially for downstream external widgets that read URL-derived context ([page default:51](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:51), [layout default:54](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/host/models/layout/frontend/component/src/lib/singlepage/default/Component.tsx:54), [widget default:38](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:38)).
- The `widgets-to-external-widgets` dispatcher is the highest-risk runtime surface because it fans out into many module families and was the path previously associated with startup/runtime instability in issue `#162` ([widgets-to-external-widgets:28](/Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:28)).

## What We're NOT Doing

- No in-place migration, replacement, or decommissioning of `apps/host`.
- No broad Next.js 16 retry under a new issue title.
- No refactor of the host backend API, host data model, or module/relation architecture beyond the minimum extraction needed to let a second frontend app reuse it.
- No blanket port of every host-specific route handler such as image/email generators, sitemap, robots, or revalidation endpoints unless one of them blocks the required parity slice.
- No attempt to achieve exhaustive route-by-route parity across the entire host surface in this spike.
- No fallback framework implementation beyond documenting Waku blockers and viability findings.

## Implementation Approach

Create `apps/waku-host` as a sibling app and keep the route-level adaptation as thin as possible. The spike should reuse existing public SPS entrypoints such as `@sps/host/models/page/frontend/component`, `@sps/host/models/page/sdk/server`, and the current host admin components instead of reimplementing host behavior in a new local tree. If Waku cannot consume some app-local host pieces directly, extract only those pieces into shared repo locations with no behavioral change for `apps/host`, then bind the new app to the same SDK/model/relation flow. Treat the final outcome as an evaluation artifact: the implementation should leave behind a runnable app plus a concise comparison record that explains what parity holds, what breaks, and whether Waku is worth pursuing further.

## Phase 1: Standalone App Scaffold And Workspace Wiring

### Overview

Introduce the new Waku app as a first-class workspace application with its own runtime commands, package metadata, and local documentation, while keeping the current Next.js host untouched.

### Changes Required

#### 1. New app target registration

**Files**:

- `package.json`
- `apps/waku-host/project.json`
- `apps/waku-host/package.json`

**Why**: the workspace only exposes `apps/host` startup commands today, so the spike needs its own executable surface before parity work can be validated.
**Changes**:

- add explicit Nx targets for Waku dev, build, and start flows using repo-consistent command conventions;
- add matching root scripts so the spike can be run without bespoke shell commands;
- define the Waku app package/runtime metadata without modifying the existing `apps/host` package contract.

#### 2. App directory, bootstrap files, and local README

**Files**:

- `apps/waku-host/*`
- `apps/waku-host/README.md`

**Why**: the spike needs a clear, isolated location for framework bootstrap, app entrypoints, and runnable documentation.
**Changes**:

- create the initial app directory structure required by the chosen Waku runtime;
- add the base bootstrap files for client/server startup, global styles, and route mounting;
- document how to run the spike, what parity slice it targets, and which behaviors are intentionally deferred.

### Success Criteria

#### Automated Verification

- [ ] `npm run lint` passes with the new workspace files included.
- [ ] `nx run waku-host:dev` starts the standalone app successfully.
- [ ] `nx run waku-host:build` produces a production build artifact for the new app.

#### Manual Verification

- [ ] Developers can run the Waku spike without changing `apps/host` targets or scripts.
- [ ] The app location and runtime intent are obvious from the directory structure and README.

---

## Phase 2: Route Boundary And App Shell Parity

### Overview

Recreate the host runtime boundary that sits above page data resolution: root shell bootstrap, language normalization, `/admin` branching, metadata delegation, and not-found behavior.

### Changes Required

#### 1. Root shell bootstrap for the new app

**Files**:

- `apps/waku-host/*`
- `apps/host/app/layout.tsx`
- `apps/host/src/components/admin/`
- `apps/host/src/components/admin-v2/`
- `libs/shared/*` (only if extraction is required)

**Why**: `apps/host` currently initializes fonts, Tailwind, RBAC auth bootstrap, revalidation, analytics, and toasts before any page-specific work happens.
**Changes**:

- mirror the shell concerns that are part of the current host runtime contract in the Waku app bootstrap;
- reuse or carefully extract the existing admin shell components if cross-app imports from `apps/host` are not maintainable;
- keep any extraction behaviorally neutral for `apps/host`.

#### 2. Language handling, catch-all routing, metadata, and not-found behavior

**Files**:

- `apps/waku-host/*`
- `apps/host/app/[[...url]]/page.tsx`
- `apps/host/middleware.ts`
- `apps/host/app/not-found.tsx`

**Why**: the parity question is invalid unless the new runtime preserves the same URL normalization and top-level routing decisions as the host app.
**Changes**:

- reproduce default-language redirect or equivalent normalization for non-prefixed URLs using the shared `en` / `ru` configuration;
- normalize catch-all route input the same way the host page does before page lookup;
- preserve the `/admin` hard branch and the separation between public page lookup and admin rendering;
- delegate metadata to the existing host metadata SDK path and preserve the `/404` page lookup plus fallback-not-found behavior.

### Success Criteria

#### Automated Verification

- [ ] `npm run lint` passes for the Waku route/bootstrap code and any shared extractions.
- [ ] `nx run waku-host:build` succeeds with the new route boundary in place.

#### Manual Verification

- [ ] Visiting a non-prefixed URL redirects or normalizes to the default language consistently with the host app.
- [ ] `/admin` routes render the admin shell instead of attempting public page lookup.
- [ ] A missing public page follows the `/404` lookup path and falls back to a plain not-found screen only when `/404` is absent.

---

## Phase 3: Host Page, Layout, Widget, And External-Widget Parity

### Overview

Bind the Waku app to the existing SPS host page rendering pipeline so viability is measured against the real host model/relation tree rather than a simplified demo.

### Changes Required

#### 1. Preserve host page lookup through the existing SDK/backend path

**Files**:

- `apps/waku-host/*`
- `libs/modules/host/models/page/frontend/component/src/lib/singlepage/find-by-url/*`
- `libs/modules/host/models/page/sdk/server/src/lib/singlepage/actions/find-by-url.ts`
- `libs/shared/frontend/components/src/lib/index.ts` (only if compatibility extraction is needed)

**Why**: the route contract depends on `HostModulePage variant="find-by-url"` and the current backend `/find-by-url` resolution logic, including production caching semantics.
**Changes**:

- call the existing host page lookup path from the new app instead of duplicating API fetch logic;
- preserve the normalized `url` and active `language` values as they move into the host page component tree;
- extract only framework-specific wrapper assumptions if they block reuse of the public host component entrypoints.

#### 2. Keep the page -> layout -> widget composition intact

**Files**:

- `libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx`
- `libs/modules/host/models/layout/frontend/component/src/lib/singlepage/default/Component.tsx`
- `libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx`
- `libs/modules/host/relations/pages-to-layouts/frontend/component/src/lib/singlepage/default/Component.tsx`
- `libs/modules/host/relations/pages-to-widgets/frontend/component/src/lib/singlepage/default/Component.tsx`
- `libs/modules/host/relations/layouts-to-widgets/frontend/component/src/lib/singlepage/default/Component.tsx`

**Why**: SPS frontend behavior is implemented through the current variant/find relation composition, not through direct route-local rendering.
**Changes**:

- verify the Waku app can drive the same host page default flow that loads layouts and page widgets by relation filters;
- preserve the current layout slot order of default widgets -> page children -> additional widgets;
- keep `url` and `language` propagation intact so downstream widgets can continue resolving page-context-dependent behavior.

#### 3. Prove at least one `widgets-to-external-widgets` path end-to-end

**Files**:

- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx`
- one or more existing module-specific branches under `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/*`
- `apps/waku-host/README.md`

**Why**: the spike is not meaningful unless it exercises the relation dispatcher that previously exposed runtime instability in the Next.js migration work.
**Changes**:

- render at least one real external-widget branch through the existing host relation dispatcher rather than a mocked shortcut;
- document which representative module/widget path was used for parity validation and why it was chosen;
- capture any runtime-specific blockers, required compatibility shims, or remaining gaps in the app README.

### Success Criteria

#### Automated Verification

- [ ] `npm run lint` passes with any shared compatibility extractions required by the host component tree.
- [ ] `nx run waku-host:build` and `nx run waku-host:start` succeed with the real host page/render pipeline wired in.

#### Manual Verification

- [ ] A representative public page resolves by database URL and renders through the existing host page component tree.
- [ ] Page-level widgets and layout widgets render in the same order as the current host runtime.
- [ ] At least one external-widget path renders through `widgets-to-external-widgets` without bypassing the host relation layer.

---

## Phase 4: Verification, Comparison Artifact, And Viability Call

### Overview

Finish the spike with the exact verification slice the ticket requires and leave behind a concise comparison artifact that makes the Waku decision easy to review later.

### Changes Required

#### 1. Verification commands and targeted coverage

**Files**:

- `package.json`
- `apps/waku-host/README.md`
- `apps/api/specs/scenario/singlepagestartup/issue-163/*.spec.ts` (only if stable issue-specific scenario coverage is practical)
- any extracted helper spec files added during implementation

**Why**: the issue is about startup/runtime viability, so the implementation needs reproducible verification instead of an undocumented manual demo.
**Changes**:

- ensure the repo exposes the final dev/build/start commands for the Waku app clearly;
- add focused automated coverage only where the spike introduces stable, reusable logic such as URL normalization helpers or compatibility adapters;
- avoid brittle automation that bypasses the real parity surface or depends on ad hoc local state.

#### 2. Runnable comparison artifact and recommendation

**Files**:

- `apps/waku-host/README.md`

**Why**: the issue explicitly requires a final artifact that explains what matches `apps/host`, what differs, and whether Waku is viable enough to continue.
**Changes**:

- record the parity slice that was achieved and the exact commands used to prove it;
- list any remaining gaps or runtime mismatches, especially around startup stability, metadata behavior, or external-widget rendering;
- end with a clear recommendation on whether Waku is strong enough for follow-on work or whether the spike exposed blockers.

### Success Criteria

#### Automated Verification

- [ ] `npm run lint` passes for all touched files.
- [ ] `nx run waku-host:dev`, `nx run waku-host:build`, and `nx run waku-host:start` all succeed.
- [ ] Any issue-163 helper/spec coverage added during implementation passes.

#### Manual Verification

- [ ] The Waku app starts in development mode and serves a representative public page successfully.
- [ ] The production build and production start flows work for the same representative page.
- [ ] `/admin`, missing-page handling, and at least one external-widget page behave closely enough to `apps/host` to support a viability recommendation.
- [ ] The README leaves a future implementer or reviewer with a clear go/no-go assessment for Waku adoption.

## Testing Strategy

### Unit Tests

- Add tests only for extracted pure helpers or compatibility adapters introduced by the spike, such as URL normalization or language-prefix handling helpers.
- Keep tests in BDD format and validate behavior rather than implementation text.

### Integration Tests

- Add issue-specific scenario or integration coverage only if the new app introduces a stable, automatable parity check that can run against the existing API/database setup.
- Prefer coverage that exercises real host page lookup and route normalization behavior over isolated mocks.

### Manual Testing Steps

1. Start the SPS API and any required infrastructure, then run `nx run waku-host:dev`.
2. Visit a non-prefixed public URL and verify it normalizes to the default language before page lookup.
3. Visit a representative database-driven public page and confirm it renders layouts, page widgets, and at least one external-widget path.
4. Visit `/admin` and verify the admin shell still renders under the new app.
5. Visit a missing page and confirm the `/404` lookup/fallback behavior matches the current host contract.
6. Run `nx run waku-host:build` and `nx run waku-host:start`, then repeat the representative public-page and external-widget checks in the production flow.

## Performance Considerations

- Treat startup instability, runaway memory usage, or external-widget rendering regressions as blocking findings because issue `#162` already identified that surface as the main risk.
- Reuse the existing host SDK/request pipeline instead of layering duplicate fetch logic on top of it.
- Keep shared extractions narrow so the spike does not destabilize `apps/host` while proving Waku parity.

## Migration Notes

- `apps/host` remains the reference implementation and must continue to run unchanged throughout the spike.
- Any shared extraction from `apps/host` into reusable libraries must preserve current host behavior as a no-op refactor.
- Waku-specific limitations or mismatches should be documented explicitly in `apps/waku-host/README.md` rather than hidden behind scope expansion.
- If the spike fails on the external-widget/runtime surface, capture that as the intended evaluation outcome instead of widening the issue into a generic frontend rewrite.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-163.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-163.md`
- Related prior issue context: `thoughts/shared/tickets/singlepagestartup/ISSUE-162.md`
- Related prior process notes: `thoughts/shared/processes/singlepagestartup/ISSUE-162.md`
- Related prior retrospective: `thoughts/shared/retrospectives/singlepagestartup/ISSUE-162/2026-04-19_02-56-44.md`
