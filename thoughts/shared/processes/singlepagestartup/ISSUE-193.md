---
issue_number: 193
issue_title: "feat: sync profile skills to provider-native AI Skills for Knowledge chats"
repository: singlepagestartup
created_at: 2026-06-04T20:44:33Z
last_updated: 2026-06-15T00:00:00Z
status: active
current_phase: implement
---

# Process Log: ISSUE-193 - feat: sync profile skills to provider-native AI Skills for Knowledge chats

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: in_progress
- Current phase: implement
- Next step: complete implementation and submit PR for code review

## Phase Notes

### Create

- Summary: Created GitHub issue #193 for provider-native profile skills in Knowledge chats and moved it to Research Needed.
- Outputs: Ticket `thoughts/shared/tickets/singlepagestartup/ISSUE-193.md`; process log `thoughts/shared/processes/singlepagestartup/ISSUE-193.md`; GitHub issue https://github.com/singlepagestartup/singlepagestartup/issues/193.
- Notes: Initial sandboxed GitHub call failed with `error connecting to api.github.com`; reran the same helper-driven workflow with escalated network access, then project assignment and status transitions completed.

### Research

- Summary: Reworked reconciliation research after operator feedback invalidated the first plan. The corrected research documents that `react-by/openrouter` is the required Knowledge chat reply path for provider-native skill integration, while current OpenRouter behavior uses prompt-instruction skills only.
- Outputs: Research artifact `thoughts/shared/research/singlepagestartup/ISSUE-193.md`.
- Notes: Existing implementation notes in this process log were treated as historical context and verified against live code before writing the research artifact. Live code contains provider-native sync/gateway infrastructure, while current `react-by/openrouter` applies selected skills as prompt instructions and the shared OpenRouter wrapper has no provider-skill request surface.
- Notes: External documentation check confirmed that OpenRouter documents standard messages/tools/plugins/provider routing, but not OpenAI `skill_reference` or Anthropic `container.skills` mounting. The research artifact now records prompt/tool-based, hybrid provider-native, experimental passthrough, and custom shell options.
- Notes: Clarified the planning rule: if generation stays on OpenRouter, skills are SPS-managed text/tool instructions. Native OpenAI/Anthropic Skills require a direct provider branch from `react-by/openrouter`.

### Plan

- Summary: Created replacement implementation plan for OpenRouter message-attached social skill instructions. The plan supersedes the original provider-native ticket wording where it conflicts with the corrected research and operator clarification.
- Outputs: Plan artifact `thoughts/shared/plans/singlepagestartup/ISSUE-193.md`.
- Notes: The previous plan was invalidated and deleted because it scoped provider-native skill integration to legacy `react-by/knowledge` instead of required `react-by/openrouter`.
- Notes: Do not reuse the deleted plan scope. Future implementation should use the corrected research artifact and the replacement plan.
- Notes: Operator clarified during planning that OpenRouter skills must be SPS-managed text instructions attached to the beginning of the triggering user message, not `system` or `developer` messages. Reply profile description is the specialist/persona context and belongs in system context; `@knowledge` can still add RAG fragments.
- Notes: Reviewer clarified that skill invocation in chat must use slash syntax (`/skill-slug`), only skills already linked to the replying profile can be invoked, current thread context must continue to be sent, and implementation verification must use the authenticated Browser session plus `npm run api:dev` backend logs.

### Implement

- Summary: Implemented provider-native profile skills sync and Knowledge chat usage directly from the user-provided plan.
- Outputs: Added RBAC profile skill provider-sync endpoint, SDK actions, Knowledge `providerSkills` propagation, OpenAI/Anthropic gateway payload support, and focused tests.
- Notes: This implementation bypassed the normal `core/10-research` and `core/20-plan` issue phases because the user explicitly requested direct implementation after the create artifact was produced. The previous plan was later invalidated; planning must restart from the corrected `react-by/openrouter` research.
- Summary: Started corrected implementation from the approved OpenRouter message-attached skill plan.
- Outputs: Implementation branch `codex/issue-193-openrouter-skill-prefix`.
- Notes: GitHub comments were synchronized before coding; the only post-plan comment was the review clarification already applied in commit `f32c07a8d9`.
- Summary: Implemented corrected OpenRouter slash-skill flow.
- Outputs: `react-by/openrouter` now injects linked profile skills as a trigger-message prefix, adds profile persona as system context, keeps `@knowledge` RAG fragments as system grounding, and updates composer slash picker behavior.
- Verification: `npx nx run @sps/rbac:jest:test --testFile=libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts`; `npx nx run @sps/rbac:jest:test --testFile=libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.spec.tsx`; `npx nx run @sps/rbac:tsc:build`.
- Verification: Browser checked `RAG` chat on `localhost:3000` with `npm run api:dev` logs. `/` and `@knowledge /` showed `/learn` plus linked `/youtube-description`, ArrowDown+Tab inserted `/youtube-description`, a single slash skill badge appeared, keyboard deletion cleared it, and no new API errors appeared during valid-page checks.
- Notes: The planned `npm run test:file -- <path>` command is incompatible with the current Nx script because it invokes `nx run` without a project. Equivalent direct `npx nx run @sps/rbac:jest:test --testFile=...` commands were used.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 2 -->

### Incident 1 — GitHub network blocked by sandbox

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: `.claude/helpers/create_issue_with_project.sh` returned repeated `error connecting to api.github.com` messages and no issue URL in the sandboxed run.
- **Root Cause**: Network access is restricted in the default sandbox.
- **Fix**: Reran the same `bash -lc` helper block with escalated network access.
- **Preventive Action**: When `core-00-create` sees `error connecting to api.github.com`, rerun the unchanged helper workflow with network escalation rather than rewriting the GitHub sequence.
- **References**: `.codex/skills/core-00-create/SKILL.md`; `.claude/helpers/create_issue_with_project.sh`.

### Incident 2 — Plan scoped provider-native skills to legacy `react-by/knowledge`

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: Operator rejected the plan because it left provider-native skill integration out of `react-by/openrouter`, while current Knowledge chats use the OpenRouter reaction path.
- **Root Cause**: The first research/plan pass treated the existing OpenRouter prompt-skill behavior as follow-up context instead of the required implementation surface.
- **Fix**: Deleted the invalid plan artifact, rewrote the research artifact around `react-by/openrouter`, and moved the issue back through the research workflow.
- **Preventive Action**: For social Knowledge chat work, treat the current dispatch/reply path (`react-by/openrouter`) as in scope unless the issue explicitly says legacy `react-by/knowledge` only.
- **References**: `thoughts/shared/research/singlepagestartup/ISSUE-193.md`; deleted `thoughts/shared/plans/singlepagestartup/ISSUE-193.md`.

## Reusable Learnings

- Use `.claude/helpers/create_issue_with_project.sh` for new SPS issues so GitHub issue creation, project assignment, and status transition fail fast in one helper-driven sequence.
- For social Knowledge chat skill work, verify the live reply path before planning. Current UI/agent flows use `react-by/openrouter`; legacy `react-by/knowledge` findings are compatibility context, not sufficient implementation scope by themselves.
- OpenRouter-compatible skills and provider-native Skills are different implementation classes. Use prompt/tool activation for broad OpenRouter model support; use a direct OpenAI/Anthropic branch when the requirement is native `SKILL.md` mounting.
