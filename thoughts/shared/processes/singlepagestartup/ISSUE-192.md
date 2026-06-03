---
issue_number: 192
issue_title: "feat: enable profile-scoped Knowledge RAG in social chats"
repository: singlepagestartup
created_at: 2026-05-25T12:12:51Z
last_updated: 2026-05-25T21:54:54Z
status: active
current_phase: implement
---

# Process Log: ISSUE-192 - feat: enable profile-scoped Knowledge RAG in social chats

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: in_progress
- Current phase: implement
- Next step: Commit implementation, open PR, and submit it for code review.

## Phase Notes

### Create

- Summary: Created a feature issue for Knowledge/RAG integration with profile-scoped social chats.
- Outputs: GitHub issue https://github.com/singlepagestartup/singlepagestartup/issues/192; local ticket `thoughts/shared/tickets/singlepagestartup/ISSUE-192.md`.
- Notes: Issue was added to GitHub Project #2 and moved from `Triage` to `Research Needed`.

### Research

- Summary: Completed and reviewed codebase research for profile-scoped Knowledge/RAG in social chats.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-192.md`; GitHub research comment https://github.com/singlepagestartup/singlepagestartup/issues/192#issuecomment-4534194232.
- Notes: Research documents current chat/profile variants, RBAC OpenRouter routes, frontend thread-scoped chat composer, social message attachments, agent dispatch, Knowledge API mount, Knowledge profile-scoped search/generation/indexing, existing skill-transcript ingestion, and LLM gateway provider flow. Reviewed under `core-10-research`; line references were validated and the research artifact was expanded with missing API/frontend integration surfaces. Issue remains in `Research in Review`.

### Plan

- Summary: Completed implementation plan for profile-scoped Knowledge/RAG in social chats.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-192.md`.
- Notes: GitHub issue body and comments were synced; no newer direction beyond the completed research comment was found. User added frontend scope before plan approval, and the final plan includes a dedicated frontend phase based on the current default chat with an upward `/learn` command picker and command descriptions.

### Implement

- Summary: Implemented profile-scoped Knowledge/RAG in social chats, including chat variant routing, `/react-by/knowledge`, `/learn` ingestion/indexing, Agent dispatch, frontend command picker, and documentation.
- Outputs: `thoughts/shared/handoffs/singlepagestartup/ISSUE-192-progress.md`; code changes under `libs/modules/social`, `libs/modules/knowledge`, `libs/modules/rbac`, and `libs/modules/agent`.
- Notes: GitHub comments were synced before code changes; no newer scope changes were found after the plan comment. Automated verification passed for targeted Social, RBAC, Knowledge, and Agent tsc/jest checks. Manual browser/DB/LLM smoke remains for reviewer validation.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 2 -->

### Incident 1 - GitHub network sandbox blocked issue creation

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: `gh` returned `error connecting to api.github.com` during the first helper run.
- **Root Cause**: GitHub network access was blocked in the sandboxed command execution.
- **Fix**: Reran the same `create_issue_with_project.sh` helper block with escalated network access.
- **Preventive Action**: When `gh` reports API connectivity failure in this workflow, rerun the same helper block with network escalation instead of changing helper sequence.
- **References**: `.codex/skills/core-00-create/SKILL.md`, `.claude/commands/core/00-create.md`.

### Incident 2 - Frontend command test environment gaps

- **Phase**: Implement
- **Occurrences**: 3
- **Symptom**: The new command picker spec failed on missing `ResizeObserver`, missing `scrollIntoView`, and unavailable jest-dom matchers such as `toBeDisabled`.
- **Root Cause**: The RBAC frontend Jest environment is jsdom without browser-only APIs and without jest-dom matcher setup, while shadcn/cmdk command primitives expect those APIs during layout effects.
- **Fix**: Added test-local jsdom polyfills for `ResizeObserver`, `scrollTo`, and `scrollIntoView`; used plain DOM property assertions instead of jest-dom-only matchers.
- **Preventive Action**: For RBAC frontend specs around command/popover primitives, add local browser API polyfills in `beforeEach` and assert native DOM properties unless the package explicitly configures jest-dom.
- **References**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.spec.tsx`.

## Reusable Learnings

- Use `social.chat.variant` as the explicit routing switch between Knowledge/RAG and existing non-RAG chat response behavior.
- Use `.claude/helpers/create_issue_with_project.sh` for fail-fast GitHub issue creation, Project assignment, and status transitions.
- RBAC frontend specs that render shadcn/cmdk command primitives need jsdom polyfills for layout-related browser APIs.
