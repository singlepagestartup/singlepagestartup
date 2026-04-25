---
issue_number: 163
issue_title: "Create standalone Waku app to validate apps/host frontend startup behavior"
repository: singlepagestartup
created_at: 2026-04-24T23:50:06Z
last_updated: 2026-04-25T13:27:06Z
status: active
current_phase: implement
---

# Process Log: ISSUE-163 - Create standalone Waku app to validate apps/host frontend startup behavior

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: in_progress
- Current phase: implement
- Next step: finish live API-backed public page parity verification, then run the remaining checks and submit PR

## Phase Notes

### Create

- Summary: Created GitHub issue `#163` for a standalone Waku parity spike, added it to the project, and advanced the status to `Research Needed` after documenting the required behavioral parity with `apps/host` and the constraints inherited from issue `#162`.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-163.md`, `https://github.com/singlepagestartup/singlepagestartup/issues/163`
- Notes: The issue scope stays explicitly separate from an in-place `apps/host` migration. It uses issue `#162`, its process/retro artifacts, and the prior architecture research as required context for evaluating whether Waku can support SPS frontend startup and rendering paths.

### Research

- Summary: Completed a fresh codebase/documentation pass for the `apps/host` parity contract that issue `#163` assigns to the standalone Waku spike. The resulting research captures the active catch-all routing flow, language-prefix middleware, `/admin` branch, metadata/not-found behavior, the host page lookup-by-URL chain, and the page -> layout/widget -> `widgets-to-external-widgets` render stack, with issue `#162` artifacts included as historical context for the high-risk external-widget path.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-163.md`
- Notes: The ticket's referenced `deep-research-report.md` was not present anywhere in the workspace, and there were no pre-existing issue-162 or issue-163 research artifacts under `thoughts/shared/research/`.

### Plan

- Summary: Created the implementation plan for a standalone `apps/waku-host` parity spike, attached it to GitHub issue `#163`, and anchored the work around four phases: workspace/app scaffold, route and shell parity, host render-chain parity, and final verification plus viability documentation.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-163.md`, `https://github.com/singlepagestartup/singlepagestartup/issues/163#issuecomment-4317236862`
- Notes: The plan keeps `apps/host` intact, treats `apps/waku-host` as the new evaluation surface, and makes the existing `widgets-to-external-widgets` path the main runtime viability gate because that was the highest-risk surface in issue `#162`.

### Implement

- Summary: Built a standalone `apps/waku-host` spike that reuses the current SPS host shell and host page entrypoints through Waku-specific routes, `next/*` compatibility shims, and a Waku build compatibility layer. Production build/start now succeed, `/` and `/admin` normalize into language-prefixed routes, and `/en/admin` renders the reused admin shell. The remaining gap is live API-backed public-page and external-widget parity: `/en` and `/ru` currently prove shell startup plus not-found fallback, but they do not yet prove database-driven page resolution.
- Outputs: `apps/waku-host/`, `apps/waku-host/README.md`, `package.json`, `package-lock.json`, `thoughts/shared/handoffs/singlepagestartup/ISSUE-163-progress.md`
- Notes: Implementation started on 2026-04-25 after the issue status gate passed in `Ready for Dev`, the GitHub status was advanced to `In Dev`, and no new post-plan GitHub requirements were found in the synced issue comments. The spike also required an ESM-safe `dataDirectory` export adjustment across backend repository barrels because the Waku render path imported those modules during bundling.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 7 -->

### Incident 1 — GitHub helper sequence required escalated network access

- **Phase**: Create
- **Occurrences**: 2
- **Symptom**: The initial `bash -lc` GitHub workflow block failed with `error connecting to api.github.com` while trying to create the issue through `gh`, and the same connectivity failure recurred during the research-phase status/helper reads for issue `#163`.
- **Root Cause**: GitHub API access was blocked by the sandboxed network context for the `gh` helper sequence.
- **Fix**: Re-ran the same `bash -lc` GitHub helper blocks with escalated network permissions, then completed both the create-phase issue/project updates and the research-phase status transitions successfully.
- **Preventive Action**: For future `core-*` GitHub helper flows in this environment, rerun the unchanged `bash -lc` block with escalation as soon as `gh` reports connectivity failures to `api.github.com`.
- **References**: `.claude/commands/core/00-create.md`, `.codex/skills/core-00-create/SKILL.md`, `.claude/commands/core/10-research.md`, `thoughts/shared/tickets/singlepagestartup/ISSUE-163.md`

### Incident 2 — `codebase-analyzer` sub-agents stalled during research synthesis

- **Phase**: Research
- **Occurrences**: 2
- **Symptom**: Two separate `codebase-analyzer` sub-agents did not return within repeated wait windows, including one interrupted retry with a narrower scope.
- **Root Cause**: The analyzer role stalled while processing the requested host-runtime summary, even after the task was narrowed and re-issued.
- **Fix**: Closed the stalled analyzer sessions, then completed the synthesis from direct local file reads plus the successful `codebase-locator`, `codebase-pattern-finder`, `thoughts-locator`, and `thoughts-analyzer` outputs.
- **Preventive Action**: When research synthesis depends on a `codebase-analyzer` pass in this environment, keep the scope narrow from the start and fall back quickly to local reads plus locator/pattern findings if the analyzer misses repeated timeout windows.
- **References**: `.codex/agents/codebase-analyzer.toml`, `thoughts/shared/research/singlepagestartup/ISSUE-163.md`

### Incident 3 — Planning GitHub helper steps required escalated network access

- **Phase**: Plan
- **Occurrences**: 3
- **Symptom**: The first attempt to move issue `#163` into `Plan in Progress` failed with repeated `error connecting to api.github.com`, and the later comment-sync and plan-attachment GitHub steps also required networked helper access outside the sandbox.
- **Root Cause**: GitHub API access for the planning helper sequence was still blocked by the sandboxed network context.
- **Fix**: Re-ran the status update with escalated network permissions, then used the same escalated helper path for issue comment sync and posting the final plan comment.
- **Preventive Action**: During future planning sessions in this environment, escalate GitHub helper reads/writes immediately after the first `api.github.com` connectivity failure instead of retrying the sandboxed path.
- **References**: `.claude/commands/core/20-plan.md`, `.claude/helpers/update_issue_status.sh`, `.claude/helpers/gh_issue_comment.sh`

### Incident 4 — `codebase-analyzer` never returned after the interrupted planning turn

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: After the earlier interrupted turn, the restarted `codebase-analyzer` planning sub-task never produced a result despite repeated extended waits, while the other planning sub-agents completed successfully.
- **Root Cause**: The analyzer session stalled or was lost across the interrupted planning turn, leaving the planning pass without its dedicated synthesis output.
- **Fix**: Completed the plan from direct local reads plus the successful `codebase-locator`, `codebase-pattern-finder`, and `thoughts-locator` outputs, then folded the necessary line-level references into the final plan manually.
- **Preventive Action**: For future planning passes in this repo, treat direct file reads as the primary source of truth and stop waiting on `codebase-analyzer` after one extended timeout window when other context gatherers have already returned.
- **References**: `.codex/agents/codebase-analyzer.toml`, `thoughts/shared/plans/singlepagestartup/ISSUE-163.md`

### Incident 5 — Waku `0.21.x` emitted ESM entry files that did not match the runtime lookup paths

- **Phase**: Implement
- **Occurrences**: 3
- **Symptom**: The Waku production build completed, but the generated output failed because runtime entry lookups expected `dist/entries.js`, `rsdw-server.js`, and `.js` asset references while the build emitted `.mjs` files.
- **Root Cause**: The Waku `0.21.x` build output in this workspace used ESM filenames that did not match the runtime path assumptions used during production start.
- **Fix**: Added a compatibility step in `apps/waku-host/waku.config.ts` that copies `entries.mjs` to `entries.js`, rewrites `rsdw-server` and `rsf` asset references to `.mjs`, and writes a `dist/package.json` with `"type": "module"`.
- **Preventive Action**: When introducing Waku `0.21.x` into this Nx workspace, inspect the produced `dist` filenames before assuming the runtime will resolve them directly; keep a post-build compatibility rewrite ready if `.mjs` output and `.js` runtime assumptions diverge.
- **References**: `apps/waku-host/waku.config.ts`, `apps/waku-host/project.json`

### Incident 6 — Backend repository barrels were not ESM-safe when imported through the Waku render path

- **Phase**: Implement
- **Occurrences**: 2
- **Symptom**: Production build/start failed with `__dirname is not defined in ES module scope`, and the first attempt to replace it with `node:url` helpers then broke public-bundle output because `node:url` was externalized.
- **Root Cause**: Many backend repository `dataDirectory` exports assumed CommonJS globals, but the Waku parity spike pulled those barrels into an ESM bundling path.
- **Fix**: Replaced the affected `dataDirectory` exports with `new URL("./data", import.meta.url).pathname`, which removed the `__dirname` dependency without introducing a browser-bundle `node:url` import.
- **Preventive Action**: Before reusing SPS server-side repository barrels in Waku or other ESM-first runtimes, scan for `__dirname` exports and convert path resolution to `import.meta.url`-based forms that do not require `node:*` helpers in shared bundle paths.
- **References**: `libs/modules/*/backend/repository/database/src/lib/index.ts`, `apps/waku-host/src/components/PrefixedHostPage.tsx`

### Incident 7 — Full `./up.sh` bootstrap was too broad for quick parity verification

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: The standard infrastructure bootstrap entered a long repo-wide migration fan-out and never reached a stable state quickly enough to support same-turn verification of a seeded API-backed public page.
- **Root Cause**: The default bootstrap path is optimized for full workspace setup, not for a narrow host-page parity spike that only needs enough data to prove `find-by-url` and external-widget rendering.
- **Fix**: Completed the build/start/admin-shell validation in this turn and recorded live API-backed public-page plus external-widget verification as the remaining implementation gap.
- **Preventive Action**: For future frontend parity spikes, provide a scoped API/bootstrap plus seed path before relying on `./up.sh` for verification.
- **References**: `./up.sh`, `thoughts/shared/handoffs/singlepagestartup/ISSUE-163-progress.md`

## Reusable Learnings

- When a framework migration is blocked by unresolved runtime regressions, open a separate parity spike issue instead of broadening the original migration ticket until it mixes evaluation work with in-place upgrade work.
