---
issue_number: 162
issue_title: "Migrate host app to Next.js 16.2.4"
repository: singlepagestartup
created_at: 2026-04-18T23:49:01Z
last_updated: 2026-09-25T20:30:00Z
status: active
current_phase: implement
---

# Process Log: ISSUE-162 - Migrate host app to Next.js 16.2.4

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: folded into the implementation retries (see Incident 3)
- Plan: not_started
- Implement: in_review on branch `issue-162`
- Current phase: implement
- Next step: review the branch and open the pull request from `issue-162` to `main`

## Phase Notes

### Create

- Summary: Created GitHub issue `#162` for the Next.js 16.2.4 migration, added it to the project, and advanced the project status to `Research Needed` after documenting repo-specific migration hotspots and official upgrade references.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-162.md`, `https://github.com/singlepagestartup/singlepagestartup/issues/162`
- Notes: Local preflight identified two concrete Next 16 migration hotspots before issue creation: deprecated `middleware.ts` and removed `experimental_ppr`. After issue creation, the verification scope was tightened to require clean-state build/start checks and to treat the prior OOM regression from GitHub issue `#113` on `widgets-to-external-widgets` rendering as a blocking risk during research and implementation.

### Research

- Summary: The dev-mode heap exhaustion has a single cause in the React Flight client bundled with `next`, documented in the ticket and in Incident 3.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-162.md` (section "Root cause")
- Notes: The heap profile, not the Turbopack trace, identified the allocation site.

### Plan

- Summary:
- Outputs:
- Notes:

### Implement

- Summary: `main` merged into `issue-162` through PR `#301`; Next.js packages moved from `16.3.0-canary.97` to `16.3.6`; the postinstall shim `tools/runtime/patch-next-flight-debug-info.mjs` ports facebook/react#37481 into the bundled development Flight clients; `agentRules: false` keeps Next from writing agent files into `apps/host`.
- Outputs: `package.json`, `package-lock.json`, `apps/host/package.json`, `apps/host/next.config.js`, `tools/runtime/patch-next-flight-debug-info.mjs`, `tools/runtime/patch-next-flight-debug-info.test.mjs`
- Notes: Verification table in the ticket. The shim is temporary; `node tools/runtime/patch-next-flight-debug-info.mjs` printing `nothing to patch` after an install means the installed Next ships the fix and the script and hook can be deleted.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 3 -->

### Incident 1 — GitHub helper sequence required escalated network access

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: The initial `bash -lc` workflow block failed with `error connecting to api.github.com` while trying to create the issue through `gh`.
- **Root Cause**: GitHub API access was blocked by the sandboxed network context for the `gh` helper sequence.
- **Fix**: Re-ran the same `bash -lc` issue/project workflow block with escalated network permissions, then completed issue creation and project status updates successfully.
- **Preventive Action**: For future `core-*` GitHub helper flows in this environment, rerun the unchanged `bash -lc` block with escalation as soon as `gh` reports connectivity failures to `api.github.com`.
- **References**: `.claude/commands/core/00-create.md`, `.codex/skills/core-00-create/SKILL.md`, `thoughts/shared/tickets/singlepagestartup/ISSUE-162.md`

### Incident 2 — Next 16.3 memory eviction does not prevent the catch-all dev OOM

- **Phase**: Implement
- **Occurrences**: 3
- **Symptom**: A cold `next dev --turbo` became ready, but the first request to `/[[...url]]` exhausted the V8 heap immediately after Turbopack finished writing roughly 1.2 GB to its filesystem cache. The HTTP response began with status 200 and then closed before the body completed.
- **Root Cause**: The React Flight client bundled with `next@16.3.0-canary.97` copies async debug info multiplicatively while the SSR renderer consumes the catch-all page's RSC stream (see Incident 3). Turbopack's compilation graph and the filesystem cache write finish before the growth starts; they only precede it.
- **Fix**: None on that version. Both `experimental.turbopackMemoryEviction: "auto"` and `"full"` failed near the default 9 GB heap limit. A separate cold run with `--max-old-space-size=16384` consumed the increased heap and failed near 15.8 GB, confirming that raising the limit only postpones the OOM.
- **Verification**: The production Turbopack build succeeds on `16.3.0-canary.97` after applying the required Next 16 API/config migrations. `next start` returns HTTP 200 for `/en`. The single `[[...url]]/page.tsx` architecture was preserved.
- **Preventive Action**: Do not propose route segmentation, fragments, or microfrontends for this issue. Profile the JavaScript heap of the `next-server` process before attributing a dev OOM to Turbopack.
- **References**: `apps/host/app/[[...url]]/page.tsx`, `apps/host/next.config.js`, `apps/host/app/api/revalidate/route.ts`, https://github.com/vercel/next.js/issues/81161

### Incident 3 — Heap profile attributes the dev OOM to React Flight debug info, not Turbopack

- **Phase**: Implement
- **Occurrences**: 6 runs on `next@16.3.6`
- **Symptom**: With a cold or warm Turbopack cache, the first `GET /en` through the catch-all route ends either in `RangeError: Invalid array length` plus `TypeError: chunk.reason.enqueueModel is not a function` (the response stays open) or in `FATAL ERROR: Ineffective mark-compacts near heap limit` at 9.0 to 9.4 GB, 25 to 85 seconds after the request. `--disable-source-maps`, `--no-server-fast-refresh` and memory eviction settings change nothing.
- **Root Cause**: `transferReferencedDebugInfo` in the bundled React Flight client (`react@19.3.0-canary-cbb046ab-20260731`) pushes every unnamed `_debugInfo` entry of a referenced chunk into the receiving chunk on each `$ref` resolution; in the catch-all page's deep tree of awaited fetches the arrays grow multiplicatively. A sampling heap profile taken through `next dev --inspect` and `HeapProfiler.startSampling` during the request attributes 5.19 GB of 5.55 GB live allocations to that function. Upstream fix: facebook/react#37481 (React 19.3.0), absent from `next@16.3.6`, present in `next@16.4.0-canary.47`.
- **Fix**: `tools/runtime/patch-next-flight-debug-info.mjs`, run from the root `postinstall` script, rewrites the function in the 20 development Flight client bundles under `node_modules/next/dist/compiled` to the upstream per-chunk `Set` implementation. Production runtimes contain no debug info and are untouched.
- **Verification**: Cold `npx nx run host:next:dev` serves `GET /en` with every module widget in 44.8 s; warm requests take 2.4 to 6.5 s; `next-server` RSS peaks near 3 GB and falls back after eviction. Shim unit tests pass under `node --test`.
- **Preventive Action**: For a dev-only OOM in the `next-server` process, attach the inspector and take a sampling heap profile during the failing request before changing bundler settings; the allocation site names the subsystem. Re-run `node tools/runtime/patch-next-flight-debug-info.mjs` after every `next` upgrade and delete it once it prints `nothing to patch`.
- **References**: `tools/runtime/patch-next-flight-debug-info.mjs`, `tools/runtime/patch-next-flight-debug-info.test.mjs`, https://github.com/facebook/react/issues/37343, https://github.com/facebook/react/pull/37481

## Reusable Learnings

- For Next.js major upgrades in this repo, capture both official framework changes and the exact `apps/host` usages they affect before opening the issue, so the later research phase starts with verified migration hotspots instead of a generic upgrade request.
- A V8 heap OOM inside `next-server` while Turbopack is idle is a JavaScript allocation problem; Turbopack's Rust graph lives outside the V8 heap. A sampling heap profile through the inspector costs one run and names the allocation site.
- Next.js bundles its own React copy under `next/dist/compiled`; `overrides` in `package.json` cannot replace it, so a React fix that Next has not picked up yet needs either a newer Next or a postinstall rewrite of the bundled file.
- `next build` through `@nx/next` fails with `No pending promise found for transaction "nx/core/package-json…:createNodes:0"` when `NX_DAEMON=false`; run the build with the daemon enabled.
