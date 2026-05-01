---
description: Legacy wrapper for implementation flow (delegates to core/30-implement with the same quality gates)
model: sonnet
---

# Ralph Implement (Legacy Wrapper)

This command is kept for backward compatibility.
Use it to run the same workflow and quality gates as `core/30-implement.md`.

## Behavior

1. Resolve `ISSUE_NUMBER`:
   - If an issue number is passed, use it.
   - If not passed, select highest-priority `size:xs`/`size:small` issue in `Ready for Dev`.
2. Read and follow `.claude/commands/core/30-implement.md` directly.
3. Do not apply custom legacy logic that bypasses `core/30-implement.md` guards.

## Issue Auto-Selection (when ISSUE_NUMBER is omitted)

```bash
source .claude/helpers/load_config.sh
gh project item-list "$GITHUB_PROJECT_NUMBER" --owner "$GITHUB_PROJECT_CLI_OWNER" --format json | \
  jq --arg repo "$TARGET_REPO_URL" '[.items[] | select((.repository // "") == $repo) | select(.status == "Ready for Dev") | select((.labels // []) | any(.name == "size:xs" or .name == "size:small"))] | sort_by(.priority // 999) | .[0]'
```

If no suitable issue exists, exit and report that no `size:xs`/`size:small` issue is ready.

## Notes

- Single source of truth for quality gates: `core/30-implement.md`.
- Utility command paths are resolved from `core/30-implement.md` (`.claude/commands/utilities/*`).
- This wrapper exists only to preserve old command entry points.
