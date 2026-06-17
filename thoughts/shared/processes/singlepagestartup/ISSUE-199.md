---
issue_number: 199
issue_title: "Add OpenRouter tool calling with authenticated MCP execution"
repository: singlepagestartup
created_at: 2026-06-17T18:33:37Z
last_updated: 2026-06-17T18:34:30Z
status: active
current_phase: create
---

# Process Log: ISSUE-199 - Add OpenRouter tool calling with authenticated MCP execution

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: not_started
- Plan: not_started
- Implement: not_started
- Current phase: create
- Next step: Run `core-10-research` for issue 199.

## Phase Notes

### Create

- Summary: Created feature issue for OpenRouter tool calling and authenticated self-MCP execution from `react-by/openrouter`.
- Outputs:
  - GitHub issue: https://github.com/singlepagestartup/singlepagestartup/issues/199
  - Ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-199.md`
  - Process: `thoughts/shared/processes/singlepagestartup/ISSUE-199.md`
- Notes:
  - User explicitly requested `core-00-create`.
  - Scope preserves the user's requirement that backend call the project MCP and that MCP calls are authenticated as the sender `rbac.subject`.
  - Initial `load_config` call resolved repository context but reported GitHub API connectivity errors inside the sandbox; GitHub helper creation succeeded with network escalation.
  - Issue was added to GitHub Project and moved through `Triage` to `Research Needed` by `.claude/helpers/create_issue_with_project.sh`.

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

### Incident 1 — GitHub CLI connectivity from sandbox

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: `load_config.sh` printed `error connecting to api.github.com` while resolving GitHub context.
- **Root Cause**: Network access from the sandboxed command path was unavailable for GitHub CLI calls.
- **Fix**: Run the GitHub helper sequence with escalated network access as required by `core-00-create`.
- **Preventive Action**: If `gh` reports `error connecting to api.github.com`, rerun the same fail-fast `bash -lc` helper block with network escalation instead of rewriting the helper sequence.
- **References**: `.codex/skills/core-00-create/SKILL.md`, `.claude/commands/core/00-create.md`

## Reusable Learnings

- For OpenRouter tool execution through MCP, keep external MCP OAuth unchanged and add an internal short-lived MCP access token flow backed by the sender subject's SPS JWT.
