---
issue_number: 162
issue_title: "Migrate host app to Next.js 16.2.4"
repository: singlepagestartup
created_at: 2026-04-18T23:49:01Z
last_updated: 2026-04-19T08:54:12Z
status: active
current_phase: implement
---

# Process Log: ISSUE-162 - Migrate host app to Next.js 16.2.4

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: in_progress
- Current phase: implement
- Next step: complete Phase 3 cold-state verification in a full local stack, including production start and API-backed external-widget validation

## Phase Notes

### Create

- Summary: Created GitHub issue `#162` for the Next.js 16.2.4 migration, added it to the project, and advanced the project status to `Research Needed` after documenting repo-specific migration hotspots and official upgrade references.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-162.md`, `https://github.com/singlepagestartup/singlepagestartup/issues/162`
- Notes: Local preflight identified two concrete Next 16 migration hotspots before issue creation: deprecated `middleware.ts` and removed `experimental_ppr`. After issue creation, the verification scope was tightened to require clean-state build/start checks and to treat the prior OOM regression from GitHub issue `#113` on `widgets-to-external-widgets` rendering as a blocking risk during research and implementation.

### Research

- Summary: Documented the current `apps/host` Next/Nx version surface, App Router entrypoints, middleware and route-handler conventions, build-time page/metadata flows, and the host page -> widget -> `widgets-to-external-widgets` rendering chain together with the prior GitHub `#113` Turbopack OOM evidence.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-162.md`, `https://github.com/singlepagestartup/singlepagestartup/issues/162`
- Notes: Research completed after verifying the live issue metadata/status, reading the existing ticket and process artifacts, inspecting the host runtime/config files cited in the ticket, and checking the historical GitHub issue `#113` conversation referenced by the ticket.

### Plan

- Summary: Wrote the implementation plan for the Next.js 16.2.4 host migration after reconciling the ticket, research, live GitHub comments, and the current host route/widget composition code. The plan keeps the migration focused on dependency alignment, host entrypoint migration, and cold-state verification with explicit coverage for the historical `widgets-to-external-widgets` OOM path.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-162.md`
- Notes: Planning started after confirming the issue was in `Ready for Plan`, re-reading the ticket/process/research artifacts, syncing the live GitHub issue/comments, and re-checking the host Next.js/Nx code paths that will shape the migration phases. No additional scope contradictions or unresolved ambiguities were found during plan drafting, so the plan could be completed without reopening research.

### Implement

- Summary: Completed Phases 1 and 2 and started Phase 3. Production build remains green on Next 16, the external-widget dispatcher now uses server-side runtime selection instead of a single eager module fan-in, and the host dev target now starts Next.js in webpack mode because Next 16 dev continued to OOM under Turbopack after rendering the catch-all route.
- Outputs: `thoughts/shared/handoffs/singlepagestartup/ISSUE-162-progress.md`, `package.json`, `package-lock.json`, `apps/host/package.json`, `apps/host/project.json`, `apps/host/next.config.js`, `apps/host/app/[[...url]]/page.tsx`, `apps/host/proxy.ts`, `apps/host/app/api/revalidate/route.ts`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx`
- Notes: GitHub comments were synced through 2026-04-19T00:24:57Z with no post-plan scope changes. Phase 1 automated verification passed via `npm install`, `npm ls next @next/bundle-analyzer @next/third-parties eslint-config-next`, and `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:eslint:lint`; the lint target still reports an existing warning in `apps/host/styles/presets/shadcn.ts:63`. Phase 2 automated verification passed via `NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run host:next:build`. During static data collection the build logged `ECONNREFUSED` fetch failures from host SDK calls when the local API was unavailable, but those paths already tolerate `catchErrors`, so static page generation still completed successfully and the build exited cleanly. Phase 3 investigation reproduced the dev-only OOM after `GET /` under Turbopack, confirmed that `next/dynamic` at the external-widget dispatcher was insufficient, and verified that the updated `host:next:dev` / `npm run host:dev` webpack path stays alive on the same route path where Turbopack crashed.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 2 -->

### Incident 1 — GitHub helper sequence required escalated network access

- **Phase**: Create
- **Occurrences**: 4
- **Symptom**: Multiple `bash -lc` workflow blocks failed with `error connecting to api.github.com` while trying to create/update/sync GitHub issue workflow state through `gh`.
- **Root Cause**: GitHub API access was blocked by the sandboxed network context for the `gh` helper sequence.
- **Fix**: Re-ran the same `bash -lc` issue/project helper blocks with escalated network permissions, then completed the create-phase issue setup, the research/plan status transitions, and the live issue comment sync successfully.
- **Preventive Action**: For future `core-*` GitHub helper flows in this environment, rerun the unchanged `bash -lc` block with escalation as soon as `gh` reports connectivity failures to `api.github.com`.
- **References**: `.claude/commands/core/00-create.md`, `.claude/commands/core/10-research.md`, `.claude/commands/core/20-plan.md`, `.codex/skills/core-00-create/SKILL.md`, `.codex/skills/core-10-research/SKILL.md`, `.codex/skills/core-20-plan/SKILL.md`, `thoughts/shared/tickets/singlepagestartup/ISSUE-162.md`

### Incident 2 — Next 16 host dev still defaulted to Turbopack and OOMed after route render

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `npm run host:dev` reported `Next.js 16.2.4 (Turbopack)`, rendered the catch-all route, then climbed toward 9 GB heap and crashed with `Ineffective mark-compacts near heap limit`.
- **Root Cause**: In Next.js 16, `next dev` still defaulted to Turbopack even when the Nx executor did not pass `--turbo`, and the host app's catch-all route graph remained too large for Turbopack to keep stable in dev mode.
- **Fix**: Reworked the external-widget dispatcher to load the selected server component at runtime instead of through one eager import fan-in, verified that the production build still passed, then moved the host `next:dev` / `host:dev` entrypoint to `next dev --webpack`, which stayed up on the same route path without reproducing the OOM.
- **Preventive Action**: For this host app on Next 16, treat webpack as the stable default for interactive dev until the Turbopack graph issue is isolated separately; do not assume omitting Nx `turbo` options disables Turbopack in Next 16.
- **References**: `package.json`, `apps/host/project.json`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx`, `node_modules/@nx/next/src/executors/server/server.impl.js`, `node node_modules/next/dist/bin/next dev --help`

## Reusable Learnings

- For Next.js major upgrades in this repo, capture both official framework changes and the exact `apps/host` usages they affect before opening the issue, so the later research phase starts with verified migration hotspots instead of a generic upgrade request.
