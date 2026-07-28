---
issue_number: 162
issue_title: "Migrate host app to Next.js 16.2.4"
repository: singlepagestartup
created_at: 2026-04-18T23:49:01Z
last_updated: 2026-04-18T23:53:48Z
status: active
current_phase: create
---

# Process Log: ISSUE-162 - Migrate host app to Next.js 16.2.4

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: not_started
- Plan: not_started
- Implement: not_started
- Current phase: create
- Next step: run core/10-research for issue 162

## Phase Notes

### Create

- Summary: Created GitHub issue `#162` for the Next.js 16.2.4 migration, added it to the project, and advanced the project status to `Research Needed` after documenting repo-specific migration hotspots and official upgrade references.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-162.md`, `https://github.com/singlepagestartup/singlepagestartup/issues/162`
- Notes: Local preflight identified two concrete Next 16 migration hotspots before issue creation: deprecated `middleware.ts` and removed `experimental_ppr`. After issue creation, the verification scope was tightened to require clean-state build/start checks and to treat the prior OOM regression from GitHub issue `#113` on `widgets-to-external-widgets` rendering as a blocking risk during research and implementation.

### Research

- Summary:
- Outputs:
- Notes:

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
- **Occurrences**: 1
- **Symptom**: The initial `bash -lc` workflow block failed with `error connecting to api.github.com` while trying to create the issue through `gh`.
- **Root Cause**: GitHub API access was blocked by the sandboxed network context for the `gh` helper sequence.
- **Fix**: Re-ran the same `bash -lc` issue/project workflow block with escalated network permissions, then completed issue creation and project status updates successfully.
- **Preventive Action**: For future `core-*` GitHub helper flows in this environment, rerun the unchanged `bash -lc` block with escalation as soon as `gh` reports connectivity failures to `api.github.com`.
- **References**: `.claude/commands/core/00-create.md`, `.codex/skills/core-00-create/SKILL.md`, `thoughts/shared/tickets/singlepagestartup/ISSUE-162.md`

## Reusable Learnings

- For Next.js major upgrades in this repo, capture both official framework changes and the exact `apps/host` usages they affect before opening the issue, so the later research phase starts with verified migration hotspots instead of a generic upgrade request.
