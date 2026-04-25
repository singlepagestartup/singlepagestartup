---
issue_number: 164
issue_title: "Port draft chat UI into SPS subject social module"
repository: singlepagestartup
created_at: 2026-04-25T19:52:05Z
last_updated: 2026-04-25T20:56:10Z
status: active
current_phase: plan
---

# Process Log: ISSUE-164 - Port draft chat UI into SPS subject social module

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: not_started
- Current phase: plan
- Next step: human review, then core/30-implement

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

- Summary: Created the implementation plan for porting the draft chat workspace into the existing RBAC subject social-module chat surfaces, preserving host routes, SDK-provider data access, relation composition, and supported chat/thread/message/action APIs.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-164.md`, `https://github.com/singlepagestartup/singlepagestartup/issues/164#issuecomment-4320535556`
- Notes: Planning context gathered from the ticket, research artifact, GitHub issue comments, repository docs, draft chat UI, target RBAC subject chat components, and parallel code/thoughts discovery. The scope interpretation was confirmed on 2026-04-25: port the supported layout and chat/thread/message/action UX, while keeping unsupported draft-only member/settings/reaction/unread behaviors out of scope or visual-only unless separately backed by APIs.

### Implement

- Summary:
- Outputs:
- Notes:

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 2 -->

### Incident 1 — GitHub helper sequence required escalated network access

- **Phase**: Create
- **Occurrences**: 2
- **Symptom**: The initial `bash -lc` GitHub workflow block failed with `error connecting to api.github.com` while trying to create the issue through `gh`.
- **Root Cause**: GitHub API access was blocked by the sandboxed network context for the `gh` helper sequence.
- **Fix**: Re-ran the same `bash -lc` issue/project workflow block with escalated network permissions, then completed issue creation, project assignment, status updates, and later issue comment reads successfully.
- **Preventive Action**: For future `core-*` GitHub helper flows in this environment, rerun the unchanged `bash -lc` block with escalation as soon as `gh` reports connectivity failures to `api.github.com`.
- **References**: `.claude/commands/core/00-create.md`, `.codex/skills/core-00-create/SKILL.md`, `thoughts/shared/tickets/singlepagestartup/ISSUE-164.md`

### Incident 2 — Draft-only chat behaviors require scope confirmation

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: Planning cannot safely write a final implementation plan from the phrase "port draft chat UI" because the draft includes local-only settings, member management, unread snapshots, reactions, and attachment reorder behavior that do not all have supported SPS subject/social APIs.
- **Root Cause**: The ticket intentionally says to use the draft as visual source of truth while also saying not to assume unsupported chat/thread/member-management APIs exist.
- **Fix**: Paused before writing `thoughts/shared/plans/singlepagestartup/ISSUE-164.md` and requested explicit confirmation that the plan should port the layout and supported chat/thread/message/action UX while marking unsupported draft-only behaviors as out of scope or visual-only placeholders.
- **Preventive Action**: For draft-to-SPS ports, confirm whether draft-only local interactions should be persisted, hidden, or implemented as non-persistent UI before writing the plan.
- **References**: `thoughts/shared/tickets/singlepagestartup/ISSUE-164.md`, `thoughts/shared/research/singlepagestartup/ISSUE-164.md`, `apps/drafts/incoming/singlepagestartup/src/app/components/ChatPage.tsx`

## Reusable Learnings
