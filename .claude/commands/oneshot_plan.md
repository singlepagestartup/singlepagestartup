---
description: Execute plan creation and implementation for a GitHub issue
---

# Oneshot Plan — Plan + Implement

Combined shortcut: runs the planning phase and then the implementation phase for the same issue in one session.

> **Invocation mechanism**: "Run" means read the target command file and execute its instructions directly in the current session. Do NOT use `SlashCommand()` — that spawns a separate agent context which loses issue-number state.

## Process

1. Resolve `ISSUE_NUMBER` from the argument (required for this combined flow).
2. Read and follow `.claude/commands/core/20-plan.md` for the issue.
3. After planning completes, the issue is in `Plan in Review`. Since the operator explicitly chose the combined flow, advance it and continue:
   ```bash
   .claude/helpers/update_issue_status.sh ISSUE_NUMBER "Ready for Dev"
   ```
4. Read and follow `.claude/commands/core/30-implement.md` for the same issue.

## Rules

- All status gates, artifacts, and issue comments of both phases apply unchanged.
- **Use with care**: this flow skips the human plan-review gate. It is only appropriate for `size:xs` / `size:small` issues where the operator accepts that trade-off; for anything larger, run `/core/20-plan`, review, then `/core/30-implement`.
- Do not advance to implementation if the plan phase stopped on an intent-clarification checkpoint or left `Open Questions (Blocking)` unresolved.
