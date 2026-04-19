---
issue_number: 162
issue_title: "Migrate host app to Next.js 16.2.4"
repository: singlepagestartup
created_at: 2026-04-18T23:49:01Z
last_updated: 2026-04-19T00:07:40Z
status: active
current_phase: research
---

# Process Log: ISSUE-162 - Migrate host app to Next.js 16.2.4

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: not_started
- Implement: not_started
- Current phase: research
- Next step: human review, then core/20-plan

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

- Summary:
- Outputs:
- Notes:

### Implement

- Summary:
- Outputs:
- Notes:

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 1 -->

### Incident 1 — GitHub helper sequence required escalated network access

- **Phase**: Create
- **Occurrences**: 2
- **Symptom**: The initial `bash -lc` workflow block failed with `error connecting to api.github.com` while trying to create the issue through `gh`.
- **Root Cause**: GitHub API access was blocked by the sandboxed network context for the `gh` helper sequence.
- **Fix**: Re-ran the same `bash -lc` issue/project helper blocks with escalated network permissions, then completed both the create-phase issue setup and the research-phase status transition successfully.
- **Preventive Action**: For future `core-*` GitHub helper flows in this environment, rerun the unchanged `bash -lc` block with escalation as soon as `gh` reports connectivity failures to `api.github.com`.
- **References**: `.claude/commands/core/00-create.md`, `.claude/commands/core/10-research.md`, `.codex/skills/core-00-create/SKILL.md`, `.codex/skills/core-10-research/SKILL.md`, `thoughts/shared/tickets/singlepagestartup/ISSUE-162.md`

## Reusable Learnings

- For Next.js major upgrades in this repo, capture both official framework changes and the exact `apps/host` usages they affect before opening the issue, so the later research phase starts with verified migration hotspots instead of a generic upgrade request.
