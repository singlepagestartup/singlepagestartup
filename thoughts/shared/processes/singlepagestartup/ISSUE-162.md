---
issue_number: 162
issue_title: "Migrate host app to Next.js 16.2.4"
repository: singlepagestartup
created_at: 2026-04-18T23:49:01Z
last_updated: 2026-04-22T00:21:06Z
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
- Next step: review the host-rbac-ecommerce fragment POC and decide whether to continue fragmenting admin/auth/module graphs

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

- Summary: Completed the Next 16 migration and replaced the rejected app-local generated site runtime with a host-rbac-ecommerce fragment POC. The public `[[...url]]` path now composes ecommerce product fragments and rbac cart/checkout fragments over internal HTTP instead of importing their frontend component graphs.
- Outputs: `thoughts/shared/handoffs/singlepagestartup/ISSUE-162-progress.md`, `package.json`, `package-lock.json`, `apps/host/package.json`, `apps/host/project.json`, `apps/host/next.config.js`, `apps/host/app/[[...url]]/page.tsx`, `apps/host/src/fragments/*`, `apps/ecommerce/*`, `apps/rbac/*`, `libs/shared/fragments/*`
- Notes: Current verification passes for fragment unit/import-guard tests, host/ecommerce/rbac TypeScript, host lint, host production build, ecommerce/rbac Turbopack production builds, and `site:dev:poc` smoke startup. Host production build is explicitly `next build --webpack` because admin/auth entrypoints still import broad module frontend graphs; host dev remains `next dev --turbopack`.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 4 -->

### Incident 1 — GitHub helper sequence required escalated network access

- **Phase**: Create
- **Occurrences**: 4
- **Symptom**: Multiple `bash -lc` workflow blocks failed with `error connecting to api.github.com` while trying to create/update/sync GitHub issue workflow state through `gh`.
- **Root Cause**: GitHub API access was blocked by the sandboxed network context for the `gh` helper sequence.
- **Fix**: Re-ran the same `bash -lc` issue/project helper blocks with escalated network permissions, then completed the create-phase issue setup, the research/plan status transitions, and the live issue comment sync successfully.
- **Preventive Action**: For future `core-*` GitHub helper flows in this environment, rerun the unchanged `bash -lc` block with escalation as soon as `gh` reports connectivity failures to `api.github.com`.
- **References**: `.claude/commands/core/00-create.md`, `.claude/commands/core/10-research.md`, `.claude/commands/core/20-plan.md`, `.codex/skills/core-00-create/SKILL.md`, `.codex/skills/core-10-research/SKILL.md`, `.codex/skills/core-20-plan/SKILL.md`, `thoughts/shared/tickets/singlepagestartup/ISSUE-162.md`

### Incident 2 — Next 16 Turbopack OOM on broad host site graph

- **Phase**: Implement
- **Occurrences**: 2
- **Symptom**: `npm run host:dev` reported `Next.js 16.2.4 (Turbopack)`, rendered the catch-all route, then climbed toward 9 GB heap and crashed with `Ineffective mark-compacts near heap limit`.
- **Root Cause**: The host catch-all route imported too much of the `@sps/*/frontend/component` graph, first through `libs/modules/host` generic runtime and then through the generated app-local manifest experiment.
- **Fix**: Removed the rejected generated runtime and replaced the public site hot path with a host-owned fragment orchestrator plus remote ecommerce/rbac fragment apps.
- **Preventive Action**: Keep `apps/host` as composition owner, but model cross-module slots as serializable recipes and remote HTML fragments instead of importing broad module frontend graphs into `[[...url]]`.
- **References**: `apps/host/app/[[...url]]/page.tsx`, `apps/host/src/fragments/*`, `apps/ecommerce/*`, `apps/rbac/*`, `libs/shared/fragments/*`

### Incident 3 — App Router private folder blocked internal endpoints

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: Fragment apps built successfully, but the planned `/_sps/fragments/*` endpoints were absent from the Next route output.
- **Root Cause**: App Router treats leading-underscore folders as private implementation folders, not routes.
- **Fix**: Moved the fragment protocol endpoints to `/api/sps/fragments/*` and updated host remote calls.
- **Preventive Action**: Avoid `_`-prefixed folders for routable internal endpoints in Next App Router.
- **References**: `apps/ecommerce/app/api/sps/fragments/*`, `apps/rbac/app/api/sps/fragments/*`, `apps/host/src/fragments/remote.ts`

### Incident 4 — Host Turbopack production build still includes admin graph

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: Host production build with Turbopack stayed on `Creating an optimized production build ...` for several minutes after the public site hot path was moved to fragments.
- **Root Cause**: Admin routes and auth/layout entrypoints still import broad module frontend graphs in `apps/host`; the POC only fragmented the public `[[...url]]` site path.
- **Fix**: Changed `host:next:build` to explicit `next build --webpack` while leaving `host:next:dev` on Turbopack for dev/OOM validation.
- **Preventive Action**: Treat admin/auth fragmentation as the next migration if host production builds must also move to Turbopack.
- **References**: `apps/host/project.json`, `apps/host/src/components/admin-v2/Component.tsx`, `apps/host/src/runtime/authentication/subject-init.tsx`

## Reusable Learnings

- For Next.js major upgrades in this repo, capture both official framework changes and the exact `apps/host` usages they affect before opening the issue, so the later research phase starts with verified migration hotspots instead of a generic upgrade request.
- In Next App Router, do not use `app/_name` for internal routes; underscore folders are private and will not be routed.
- Splitting the public site page builder does not remove admin/auth bundle pressure; those entrypoints need their own migration before host production build can use Turbopack safely.
