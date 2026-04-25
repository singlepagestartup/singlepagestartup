---
issue_number: 164
issue_title: "Port draft chat UI into SPS subject social module"
repository: singlepagestartup
created_at: 2026-04-25T19:52:05Z
last_updated: 2026-04-25T20:18:00Z
status: active
current_phase: research
---

# Process Log: ISSUE-164 - Port draft chat UI into SPS subject social module

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

- Summary: Created GitHub issue `#164` for porting the draft chat UI into the SPS subject social-module, added it to the GitHub Project, and advanced it to `Research Needed` after documenting the required SPS architecture constraints and the already existing chat/thread APIs.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-164.md`, `https://github.com/singlepagestartup/singlepagestartup/issues/164`
- Notes: The issue scope is anchored to the draft chat page as the visual source of truth, but it explicitly requires SPS model/relation/component decomposition and reuse of the existing subject social chat, thread, and message methods already present in the main project.

### Research

- Summary: Researched the draft `ChatPage.tsx`, current RBAC subject social-module chat components, host `/social/chats/...` composition, subject-scoped social chat/thread/message/action SDK and backend routes, and historical issue-154 thread context.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-164.md`
- Notes: Current SPS chat surface already has host chat/thread routes, RBAC subject wrappers, thread list/create, thread-scoped message find/create, chat-scoped message update/delete, and action find/create. The draft source remains a local-state monolith with three-column desktop and single-panel mobile behavior.

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
- **Symptom**: The initial `bash -lc` GitHub workflow block failed with `error connecting to api.github.com` while trying to create the issue through `gh`.
- **Root Cause**: GitHub API access was blocked by the sandboxed network context for the `gh` helper sequence.
- **Fix**: Re-ran the same `bash -lc` issue/project workflow block with escalated network permissions, then completed issue creation, project assignment, and status updates successfully.
- **Preventive Action**: For future `core-*` GitHub helper flows in this environment, rerun the unchanged `bash -lc` block with escalation as soon as `gh` reports connectivity failures to `api.github.com`.
- **References**: `.claude/commands/core/00-create.md`, `.codex/skills/core-00-create/SKILL.md`, `thoughts/shared/tickets/singlepagestartup/ISSUE-164.md`

## Reusable Learnings
