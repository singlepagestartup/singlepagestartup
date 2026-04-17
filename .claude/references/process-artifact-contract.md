# Process Artifact Contract

This document defines the persistent cross-phase process artifact used by the SPS core workflow.

## Purpose

The process file captures workflow friction, debugging incidents, reusable fixes, and phase outcomes across the full lifecycle of an issue.

It is **not** a replacement for:

- the ticket file;
- the research file;
- the implementation plan;
- the implementation progress/handoff file.

Instead, it is the durable operational memory for how the work actually unfolded and what future agents should avoid re-debugging.

## Path

Use:

`thoughts/shared/processes/REPO_NAME/ISSUE-{NUMBER}.md`

Before the GitHub issue number exists during `core/00-create`, a temporary file may be created as:

`thoughts/shared/processes/REPO_NAME/ISSUE-{TEMP_IDENTIFIER}.md`

Rename it to `ISSUE-{NUMBER}.md` once the issue number is known.

## Required Structure

```markdown
---
issue_number: ISSUE_NUMBER
issue_title: "Issue Title"
repository: REPO_NAME
created_at: YYYY-MM-DDTHH:MM:SSZ
last_updated: YYYY-MM-DDTHH:MM:SSZ
status: active
current_phase: create | research | plan | implement | complete
---

# Process Log: ISSUE-{NUMBER} - Issue Title

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: not_started | in_progress | completed
- Research: not_started | in_progress | completed
- Plan: not_started | in_progress | completed
- Implement: not_started | in_progress | completed
- Current phase: <phase>
- Next step: <short instruction>

## Phase Notes

### Create
- Summary:
- Outputs:
- Notes:

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

<!-- incident-count: 0 -->

### Incident N — [Short title]
- **Phase**: Create | Research | Plan | Implement
- **Occurrences**: 1
- **Symptom**: [Observable problem]
- **Root Cause**: [What actually caused it]
- **Fix**: [What resolved it]
- **Preventive Action**: [What future agents should do differently]
- **References**: [Relevant files, artifacts, commands, commits]

## Reusable Learnings

- [Portable rule, helper idea, workflow note, or guardrail worth reusing]
```

## Recording Rules

1. Record an incident only after the agent understands the root cause or has a high-confidence mitigation.
2. If the same root cause appears again, increment `Occurrences` instead of creating a duplicate incident.
3. Keep the file concise and cumulative; do not paste large logs.
4. Every core phase must:
   - read the process file if it exists;
   - update its phase status;
   - append a short phase summary before exit;
   - record substantive incidents discovered in that phase.
5. `core/30-implement` still maintains the operational progress file in `thoughts/shared/handoffs/...`; implementation incidents must also be mirrored into the persistent process file.

## Promotion Guidance

Use the process file to preserve execution knowledge that would otherwise be lost when the implementation progress file is deleted after merge.

Promote an item into `## Reusable Learnings` when it is:

- likely to recur in other issues;
- tied to `.claude`, `.codex`, helper scripts, or workflow structure;
- a concrete rule that can make future execution faster or safer.
