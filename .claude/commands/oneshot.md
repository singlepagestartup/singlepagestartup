---
description: Research GitHub issue and launch planning session
---

# Oneshot — Research + Plan

Combined shortcut: runs the research phase and then the planning phase for the same issue in one session.

> **Invocation mechanism**: "Run" means read the target command file and execute its instructions directly in the current session. Do NOT use `SlashCommand()` — that spawns a separate agent context which loses issue-number state.

## Process

1. Resolve `ISSUE_NUMBER` (from the argument, or via the auto-selection rules in `.claude/commands/ralph_research.md`).
2. Read and follow `.claude/commands/core/10-research.md` for the issue.
3. After research completes, the issue is in `Research in Review`. Since the operator explicitly chose the combined flow, advance it and continue:
   ```bash
   .claude/helpers/update_issue_status.sh ISSUE_NUMBER "Ready for Plan"
   ```
4. Read and follow `.claude/commands/core/20-plan.md` for the same issue.

## Rules

- All status gates, artifacts, and issue comments of both phases apply unchanged.
- Stop after planning: the plan still requires human review (`Plan in Review`) before implementation.
- If the research phase exits early (for example, clarification requested), stop — do not proceed to planning.
