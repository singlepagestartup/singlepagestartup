---
issue_number: 163
issue_title: "Create standalone Waku app to validate apps/host frontend startup behavior"
start_date: 2026-04-25T00:42:10Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-163.md
status: in_progress
---

# Implementation Progress: ISSUE-163 - Create standalone Waku app to validate apps/host frontend startup behavior

**Started**: 2026-04-25
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-163.md`

## Phase Progress

### Phase 1: Standalone App Scaffold And Workspace Wiring

- [x] Started: 2026-04-25T00:42:10Z
- [x] Completed: 2026-04-25T13:27:06Z
- [x] Automated verification: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run waku-host:build`

**Notes**: Created `apps/waku-host` as a separate Nx app, added root `waku-host:*` scripts, wired Waku config/route files, and shared `apps/host/public` into the spike app. `lint` and `dev` were not run in this phase.

### Phase 2: Route Boundary And App Shell Parity

- [x] Started: 2026-04-25T13:27:06Z
- [x] Completed: 2026-04-25T13:27:06Z
- [x] Automated verification: build plus HTTP checks for `/`, `/admin`, and `/en/admin`

**Notes**: Reused the host shell in Waku, added default-language normalization, metadata/not-found wrappers, and the admin branch. A route-precedence bug that produced `/en/en/admin` was fixed by normalizing localized segments inside `PrefixedHostPage` and by handling already-prefixed paths in the generic catch-all page.

### Phase 3: Host Page, Layout, Widget, And External-Widget Parity

- [x] Started: 2026-04-25T13:27:06Z
- [ ] Completed: —
- [x] Automated verification: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run waku-host:build` and `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run waku-host:start`

**Notes**: The Waku app now reuses the host page entrypoints and renders the shared shell successfully on `/en` and `/ru`, but only through the current not-found fallback because live API-backed page data was not proven in this turn. The host render path also required an ESM-safe `dataDirectory` fix across backend repository barrels.

### Phase 4: Verification, Comparison Artifact, And Viability Call

- [x] Started: 2026-04-25T13:27:06Z
- [ ] Completed: —
- [ ] Automated verification: `lint`, `dev`, and issue-specific tests not run; README/process/handoff artifacts updated

**Notes**: `apps/waku-host/README.md` now records the verified parity slice, the Waku/ESM compatibility shims, and the current go/no-go recommendation. Final completion is blocked on live API-backed public-page verification plus the remaining `dev`/`lint` checks.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 3 -->

### Incident 1 — Waku `0.21.x` emitted ESM entry files that did not match the runtime lookup paths

- **Occurrences**: 3
- **Stage**: Phase 1-3 - Waku build/runtime wiring
- **Symptom**: The production build output did not start cleanly because runtime entry lookups expected `.js` paths while Waku emitted `.mjs` files.
- **Root Cause**: Waku `0.21.x` in this workspace produced ESM filenames that did not match the runtime lookup assumptions used during production start.
- **Fix**: Added a compatibility step in `apps/waku-host/waku.config.ts` to copy and rewrite the emitted entry/runtime references.
- **Reusable Pattern**: Inspect Waku `dist` output immediately after the first successful build and add a post-build compatibility rewrite when runtime expectations and emitted filenames diverge.

### Incident 2 — Backend repository barrels were not ESM-safe when imported through the Waku render path

- **Occurrences**: 2
- **Stage**: Phase 3 - host render path reuse
- **Symptom**: Waku build/start failed on `__dirname` usage, and the first `node:url`-based fix then broke browser-bundle output.
- **Root Cause**: Repository `dataDirectory` exports assumed CommonJS globals, but the Waku render path imported those barrels inside an ESM bundle.
- **Fix**: Replaced the affected exports with `new URL("./data", import.meta.url).pathname`.
- **Reusable Pattern**: Audit `__dirname` exports before reusing SPS repository barrels inside Waku or other ESM-first runtimes.

### Incident 3 — Full `./up.sh` bootstrap was too broad for quick parity verification

- **Occurrences**: 1
- **Stage**: Phase 3-4 - live API verification
- **Symptom**: The default bootstrap stayed inside a long migration fan-out and did not reach a stable seeded API state quickly enough for same-turn public-page verification.
- **Root Cause**: `./up.sh` is a full workspace bootstrap, not a scoped host-page parity fixture path.
- **Fix**: Finished build/start/admin-shell verification and left API-backed public-page plus external-widget parity as the remaining gap.
- **Reusable Pattern**: Use or create a narrower API/bootstrap target before depending on `./up.sh` for frontend parity verification.

## Summary

### Changes Made

- Added a standalone `apps/waku-host` Waku app with Nx targets, root scripts, localized routes, host-shell reuse, and a `next/*` compatibility layer.
- Added a Waku build compatibility step so the generated production output can start despite `.mjs`/`.js` runtime mismatches.
- Updated backend repository `dataDirectory` exports to be ESM-safe when imported through the Waku render path.
- Documented the current parity result and remaining live-data gaps in the app README and workflow artifacts.

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [ ] All phases completed
- [ ] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-04-25T13:27:06Z
