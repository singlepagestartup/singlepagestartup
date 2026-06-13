---
issue_number: 193
issue_title: "feat: sync profile skills to provider-native AI Skills for Knowledge chats"
repository: singlepagestartup
created_at: 2026-06-04T20:44:33Z
last_updated: 2026-06-13T20:28:22Z
status: active
current_phase: research
---

# Process Log: ISSUE-193 - feat: sync profile skills to provider-native AI Skills for Knowledge chats

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: not_started
- Implement: completed_direct
- Current phase: research
- Next step: human review, then move to Ready for Plan and run core/20-plan

## Phase Notes

### Create

- Summary: Created GitHub issue #193 for provider-native profile skills in Knowledge chats and moved it to Research Needed.
- Outputs: Ticket `thoughts/shared/tickets/singlepagestartup/ISSUE-193.md`; process log `thoughts/shared/processes/singlepagestartup/ISSUE-193.md`; GitHub issue https://github.com/singlepagestartup/singlepagestartup/issues/193.
- Notes: Initial sandboxed GitHub call failed with `error connecting to api.github.com`; reran the same helper-driven workflow with escalated network access, then project assignment and status transitions completed.

### Research

- Summary: Completed reconciliation research for provider-native profile skills in Knowledge chats, documenting current `social.skill`, `profiles-to-skills`, provider-sync, Knowledge generation, LLM gateway, legacy `react-by-knowledge`, and OpenRouter skill behavior.
- Outputs: Research artifact `thoughts/shared/research/singlepagestartup/ISSUE-193.md`.
- Notes: Existing implementation notes in this process log were treated as historical context and verified against live code before writing the research artifact. Live code contains provider-native sync/gateway infrastructure, while current chat reply handlers apply selected skills as prompt instructions.

### Plan

- Summary:
- Outputs:
- Notes:

### Implement

- Summary: Implemented provider-native profile skills sync and Knowledge chat usage directly from the user-provided plan.
- Outputs: Added RBAC profile skill provider-sync endpoint, SDK actions, Knowledge `providerSkills` propagation, OpenAI/Anthropic gateway payload support, and focused tests.
- Notes: This implementation bypassed the normal `core/10-research` and `core/20-plan` issue phases because the user explicitly requested direct implementation after the create artifact was produced. Research reconciliation is now complete and GitHub Project status is `Research in Review`.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 1 -->

### Incident 1 — GitHub network blocked by sandbox

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: `.claude/helpers/create_issue_with_project.sh` returned repeated `error connecting to api.github.com` messages and no issue URL in the sandboxed run.
- **Root Cause**: Network access is restricted in the default sandbox.
- **Fix**: Reran the same `bash -lc` helper block with escalated network access.
- **Preventive Action**: When `core-00-create` sees `error connecting to api.github.com`, rerun the unchanged helper workflow with network escalation rather than rewriting the GitHub sequence.
- **References**: `.codex/skills/core-00-create/SKILL.md`; `.claude/helpers/create_issue_with_project.sh`.

## Reusable Learnings

- Use `.claude/helpers/create_issue_with_project.sh` for new SPS issues so GitHub issue creation, project assignment, and status transition fail fast in one helper-driven sequence.
