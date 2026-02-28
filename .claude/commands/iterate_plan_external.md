---
description: Sync and iterate plan from GitHub issue comments (fully autonomous)
model: sonnet
---

# Iterate Plan from External (Autonomous)

Syncs comments from GitHub issue, updates the plan based on them, creates a commit, and posts a reply comment. Fully autonomous — no console interaction.

## When to Use

After discussions happen in GitHub issue comments and you want the plan updated and committed.

```
/iterate_plan_external 142
```

## Process Steps

### Step 1: Find the Plan File

```bash
# Get repo name
REPO_NAME=$(gh repo view --json name -q '.name')

# Find the most recent plan for this issue
PLAN_FILE=$(find "thoughts/shared/plans/$REPO_NAME" -name "*ISSUE-${ISSUE_ID}*.md" -type f | sort -r | head -1)
```

If no plan found, exit with error:

```
No plan found for issue #ISSUE_NUMBER in thoughts/shared/plans/$REPO_NAME/

Please create a plan first using /ralph_plan.
```

### Step 2: Get Last Sync Marker

Read the plan file and find the last sync marker.

If marker exists (e.g., `<!-- Last synced at: 2026-02-28T14:30:00Z -->`), extract the timestamp.

If marker doesn't exist, use the plan creation date (first commit date) as the cutoff.

### Step 3: Fetch GitHub Issue Comments

```bash
# Fetch all comments from the issue
gh issue view ISSUE_NUMBER --json comments | jq -r '.comments'
```

### Step 4: Filter New Comments

Filter comments to only those newer than the last sync timestamp.

If no new comments, inform user and exit:

```
No new comments since last sync.
```

### Step 5: Analyze Comments and Determine Plan Changes

Analyze each new comment to understand what plan changes are implied:

- Explicit requests (e.g., "Please add X to the plan")
- Decisions made that affect the plan scope
- New requirements mentioned
- Corrections to existing phases

**Key decisions:**

- If comments imply conflicting changes → Use the most recent decision
- If no clear action is requested → Just sync comments without plan changes
- If action items are unclear → Be conservative, document observations

Create a summary of changes to make:

```
Plan changes:
- [Action item 1]
- [Action item 2]
- [Observation only, no change]
```

### Step 6: Apply Plan Changes

Apply the determined changes to the plan:

1. **Use Edit tool** for surgical modifications
2. **Maintain existing structure** unless the change requires restructuring
3. **Add/modify phases** as needed
4. **Update success criteria** if requirements changed
5. **Add implementation notes** for new context

### Step 7: Create a Commit

```bash
# Create a commit with clear message
git add "$PLAN_FILE"

# Commit message format
git commit -m "$(cat <<'EOF'
docs: update plan for #ISSUE_NUMBER based on GitHub discussion

- [Summary of changes]
Co-Authored-By: Claude Code <noreply@anthropic.com>
EOF
)"
```

### Step 8: Update Last Sync Marker

At the end of the plan, update the sync marker:

```markdown
<!-- Last synced at: [current UTC timestamp] -->
```

Use current UTC timestamp (ISO 8601 format).

### Step 9: Post Reply Comment in GitHub Issue

Post a comment in the GitHub issue that:

1. **Acknowledges the latest user comment** (the one that triggered this iteration)
2. **Summarizes the changes made** to the plan
3. **Confirms** the plan has been updated and committed

Comment format:

```markdown
I've updated the plan based on the discussion above.

**Changes made:**

- [Change 1]
- [Change 2]

The plan has been updated and committed.
```

### Step 10: Complete Confirmation

Print completion summary:

```
✅ Plan updated and committed for #ISSUE_NUMBER

Plan file: thoughts/shared/plans/$REPO_NAME/[filename].md
Changes: [summary of changes]
Commit: [commit hash]
GitHub comment: posted

The plan is now ready for review and implementation.
```

## Decision Rules for Plan Changes

When analyzing comments, follow these rules:

| Scenario                                      | Action                                     |
| --------------------------------------------- | ------------------------------------------ |
| Explicit request ("Please add X")             | Add X to the plan                          |
| Decision ("We decided to skip Y")             | Remove Y or add to "Not Doing"             |
| Clarification ("Actually, we need Z instead") | Update to use Z                            |
| Observation ("FYI: note about W")             | Add as comment/observation, no plan change |
| Conflicting instructions                      | Use most recent, add note about conflict   |
| No clear action needed                        | Sync comments only, no plan changes        |

**Important:** Always read ALL new comments before making decisions. Earlier comments may provide context or override previous requests.

## Format Specifications

### Comment Header Format

```markdown
### Comment by [@author] (YYYY-MM-DDTHH:MM:SSZ)
```

### Sync Marker Format

```markdown
<!-- Last synced at: 2026-02-28T14:30:00Z -->
```

This is an HTML comment, invisible in rendered Markdown but parsable.

### Commit Message Format

```
docs: update plan for #ISSUE_NUMBER based on GitHub discussion

- [Bullet list of changes]
Co-Authored-By: Claude Code <noreply@anthropic.com>
```

## Example Output

```
✅ Plan updated and committed for #142

Plan file: thoughts/shared/plans/singlepagestartup/2026-02-28-ISSUE-0142-admin-panel-v2-migration.md

Changes made:
- Added Phase 4: Migration rollout to remaining modules
- Updated success criteria for Phase 3

Commit: a1b2c3d4

GitHub comment: posted
```

GitHub issue comment:

```
I've updated the plan based on the discussion above.

**Changes made:**
- Added Phase 4: Migration rollout to remaining modules
- Updated success criteria for Phase 3

The plan has been updated and committed.
```

## Important Notes

- **Fully autonomous**: No console questions, no user prompts. Reads comments, updates plan, commits, replies.
- **One-way sync**: GitHub → Plan only. Never modifies GitHub issues.
- **Idempotent**: Running multiple times with no new comments is safe and quick.
- **Commit first**: Plan changes are committed before posting comment, providing proof of work.
- **Context-aware**: Reads ALL new comments, not just the last one, to understand the full discussion.
