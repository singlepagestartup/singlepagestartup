---
description: Legacy wrapper for planning flow (delegates to core/20-plan with the same quality gates)
model: opus
---

# Ralph Plan (Legacy Wrapper)

This command is kept for backward compatibility.
Use it to run the same workflow and quality gates as `core/20-plan.md`.

## Behavior

1. Resolve `ISSUE_NUMBER`:
   - If an issue number is passed, use it.
   - If not passed, select highest-priority `size:xs`/`size:small` issue in `Ready for Plan`.
2. Read and follow `.claude/commands/core/20-plan.md` directly.
3. Do not apply custom legacy logic that bypasses `core/20-plan.md` preflight gates.

## Issue Auto-Selection (when ISSUE_NUMBER is omitted)

```bash
source .claude/.env
gh project item-list "$GITHUB_PROJECT_NUMBER" --owner "$GITHUB_PROJECT_OWNER" --format json | \
  jq '[.items[] | select(.status == "Ready for Plan") | select((.labels // []) | any(.name == "size:xs" or .name == "size:small"))] | sort_by(.priority // 999) | .[0]'
```

If no suitable issue exists, exit and report that no `size:xs`/`size:small` issue is ready.

## Notes

- Single source of truth for quality gates: `core/20-plan.md`.
- This wrapper exists only to preserve old command entry points.
