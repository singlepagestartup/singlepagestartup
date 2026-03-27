---
description: Create implementation plan for GitHub issue in "Ready for Plan" status
model: opus
---

# Plan Implementation

You create a detailed implementation plan for a researched issue, or update an existing plan based on GitHub issue discussion. Plans should be brief and focused — WHAT to do, WHERE, and WHY — NOT how with actual code.

## Status Gate

**Entry**: Issue must be in "Ready for Plan" or "Plan in Progress" status (the latter allows resuming an interrupted session or revising a plan after review feedback)

```bash
CURRENT_STATUS=$(.claude/helpers/get_issue_status.sh ISSUE_NUMBER)

if [[ "$CURRENT_STATUS" != "Ready for Plan" && "$CURRENT_STATUS" != "Plan in Progress" ]]; then
  echo "❌ Cannot proceed: Issue #$ISSUE_NUMBER has status '$CURRENT_STATUS'"
  echo "This command requires status: 'Ready for Plan' or 'Plan in Progress'"
  exit 1
fi
```

## Process

1. **Update status to "Plan in Progress"**:

   ```bash
   .claude/helpers/update_issue_status.sh ISSUE_NUMBER "Plan in Progress"
   ```

2. **Read existing ticket and research files**:

   - Run `gh repo view --json name -q '.name'` to get REPO_NAME
   - Read `thoughts/shared/tickets/REPO_NAME/ISSUE-{NUMBER}.md` completely
   - Find research document from issue comments or `thoughts/shared/research/REPO_NAME/`
   - Read research document completely if it exists
   - Read any linked documents from issue comments or description
   - **IMPORTANT**: Use Read tool WITHOUT limit/offset parameters to read entire files

2.5 **Intent clarification checkpoint (before drafting):**

- If ticket language is potentially ambiguous (for example: "close", "replace", "align", "migrate", "decommission"), explicitly summarize your interpretation in 1-2 lines and ask for confirmation.
- Do not write or overwrite the plan file until this interpretation is confirmed by the user.
- If issue comments contain a newer explicit direction, use the newest direction and state that in your summary.

3. **Check whether a plan already exists**:

   ```bash
   REPO_NAME=$(gh repo view --json name -q '.name')
   find "thoughts/shared/plans/$REPO_NAME" -name "*ISSUE-${ISSUE_NUMBER}*.md" -type f | sort -r | head -1
   ```

   **If no plan exists** → proceed to step 4 (create new plan).

   **If a plan already exists** → read it completely, then proceed to step 5 (sync GitHub comments and update).

4. **Create implementation plan** (new plan):

   a. **Spawn parallel sub-tasks for context gathering** (before writing):

   - **codebase-locator**: Find all files related to the task
   - **codebase-analyzer**: Understand how the current implementation works
   - **thoughts-locator**: Find any existing thoughts documents about this feature
   - **codebase-pattern-finder**: Find similar features to model after

   b. **Read all files identified by research tasks** FULLY before proceeding

   c. **Analyze and verify understanding**:

   - Cross-reference requirements with actual code
   - Identify discrepancies or misunderstandings
   - Note assumptions that need verification
   - Determine true scope based on codebase reality
   - Be skeptical — verify assumptions against actual codebase patterns; include specific file paths and line numbers

   d. **Create initial plan outline** and get buy-in before writing details:

   ```
   Here's my proposed plan structure:

   ## Overview
   [1-2 sentence summary]

   ## Implementation Phases:
   1. [Phase name] - [what it accomplishes]
   2. [Phase name] - [what it accomplishes]
   3. [Phase name] - [what it accomplishes]

   Does this phasing make sense?
   ```

   e. **Write the full plan only after explicit approval** to `thoughts/shared/plans/REPO_NAME/ISSUE-{NUMBER}.md`:

   - Require an explicit confirmation response (for example: "yes", "approved", "looks good") after step 4d.
   - If confirmation is not explicit, pause and clarify before writing.

   ```markdown
   # [Feature/Task Name] Implementation Plan

   ## Overview

   [Brief description of what we're implementing and why — 1-2 sentences max]

   ## Current State Analysis

   [What exists now, what's missing, key constraints discovered]

   ## Desired End State

   [A Specification of the desired end state after this plan is complete, and how to verify it]

   ### Key Discoveries:

   - [Important finding with file:line reference]
   - [Pattern to follow]
   - [Constraint to work within]

   ## What We're NOT Doing

   [Explicitly list out-of-scope items to prevent scope creep]

   ## Implementation Approach

   [High-level strategy and reasoning]

   ## Phase 1: [Descriptive Name]

   ### Overview

   [What this phase accomplishes]

   ### Changes Required:

   #### 1. [Component/File Group]

   **File**: `path/to/file.ext`
   **Why**: [Rationale based on research — what this file does and why it needs modification]
   **Changes**: [Summary of what to do — NOT actual code]

   ### Success Criteria:

   #### Automated Verification:

   - [ ] Type checking passes: `npm run typecheck`
   - [ ] Linting passes: `npm run lint`
   - [ ] Tests pass: `npm test`

   #### Manual Verification:

   - [ ] Feature works as expected when tested
   - [ ] No regressions in related features

   ---

   ## Phase 2: [Descriptive Name]

   [Similar structure...]

   ---

   ## Testing Strategy

   ### Unit Tests:

   - [What to test]
   - [Key edge cases]

   ### Integration Tests:

   - [End-to-end scenarios]

   ### Manual Testing Steps:

   1. [Specific step to verify feature]
   2. [Another verification step]

   ## Performance Considerations

   [Any performance implications or optimizations needed]

   ## Migration Notes

   [If applicable, how to handle existing data/systems]

   ## References

   - Original ticket: `thoughts/shared/tickets/REPO_NAME/ISSUE-{NUMBER}.md`
   - Related research: `thoughts/shared/research/REPO_NAME/[relevant].md`
   ```

   Skip to step 6 after saving.

5. **Sync GitHub comments and update existing plan** (idempotent — safe to run multiple times):

   a. **Find last sync marker** in the plan file:

   - Look for `<!-- Last synced at: YYYY-MM-DDTHH:MM:SSZ -->` near the end of the file
   - If no marker exists, use the plan's first git commit date as the cutoff

   b. **Fetch GitHub issue comments** newer than the marker:

   ```bash
   source .claude/helpers/gh_retry.sh
   ensure_gh_ready
   gh_retry issue view ISSUE_NUMBER --json comments | jq -r '.comments'
   ```

   Filter to only those newer than the last sync timestamp.
   If no new comments → skip to step 6 (re-attach plan without changes).

   c. **Analyze new comments** for plan changes:

   - Explicit requests ("Please add X") → apply change
   - Decisions ("We decided to skip Y") → update scope
   - Conflicting instructions → use most recent
   - Observations / FYI → document but no plan change
   - If research is needed to validate a requested change, spawn `codebase-locator` / `codebase-analyzer` sub-tasks

   d. **Make surgical edits** to the plan:

   - Use Edit tool, not wholesale rewrites
   - Re-read the file immediately before each edit (Edit tool requires exact string matches)
   - Maintain existing structure; only modify what changed
   - Handle edit failures gracefully: log and continue with remaining changes

   e. **Update the sync marker** at the end of the plan:

   ```markdown
   <!-- Last synced at: CURRENT_UTC_TIMESTAMP -->
   ```

   f. **Create a commit** confirming the update:

   ```bash
   git add "$PLAN_FILE"
   git commit -m "docs: update plan for #ISSUE_NUMBER based on GitHub discussion

   - [Bullet list of changes made]"
   ```

   Only create the commit after all edits are complete. If the commit fails, do NOT post a GitHub comment.

   g. **Post a reply comment** on the GitHub issue:

   ```bash
   source .claude/helpers/gh_retry.sh
   ensure_gh_ready
   gh_retry issue comment ISSUE_NUMBER --body "Plan updated based on discussion.

   **Changes made:**
   - [Change 1]
   - [Change 2]

   Commit: [COMMIT_HASH]"
   ```

6. **Attach plan to GitHub issue** (always — whether newly created or updated):

   ```bash
   source .claude/helpers/gh_retry.sh
   ensure_gh_ready
   gh_retry issue comment ISSUE_NUMBER --body "Implementation plan: \`thoughts/shared/plans/REPO_NAME/PLAN_FILENAME.md\`

   [Brief summary of approach and phases]"
   ```

   Skip this step if step 5g already posted a comment that references the plan.

7. **Update status to "Plan in Review"**:

   ```bash
   .claude/helpers/update_issue_status.sh ISSUE_NUMBER "Plan in Review"
   ```

## Exit

- [ ] Implementation plan created or updated at `thoughts/shared/plans/REPO_NAME/ISSUE-{NUMBER}.md`
- [ ] Sync marker updated in plan file (if plan was updated)
- [ ] Plan referenced in GitHub issue comment
- [ ] If existing plan was updated: commit created and reply posted in GitHub
- [ ] Status updated to "Plan in Review" in GitHub Project

## Plan Revision

If a reviewer requests changes while the issue is in "Plan in Review", manually set the status back to "Plan in Progress" via `.claude/helpers/update_issue_status.sh ISSUE_NUMBER "Plan in Progress"`, then re-run `20-plan.md`. It will detect the existing plan, sync any new GitHub comments, apply changes, commit, and re-submit for review.

## Important Guidelines

1. **Be Skeptical**: Question vague requirements. Identify potential issues early. Don't assume — verify with code.

2. **Be Brief — NO CODE IN PLANS**: Plans describe WHAT to do and WHERE, not HOW with code. Do NOT include actual code snippets or implementations.

3. **Be Thorough**: Read all context files COMPLETELY before planning. Research actual code patterns using parallel sub-tasks. Include specific file paths and line numbers. Write measurable success criteria with clear automated vs manual distinction.

4. **Be Practical**: Focus on incremental, testable changes. Consider migration and rollback. Include "what we're NOT doing".

5. **No Open Questions in Final Plan**: If you encounter open questions during planning, STOP. Research or ask for clarification immediately. Do NOT write the plan with unresolved questions.

6. **Separate Success Criteria**:

   - **Automated Verification**: Commands that can be run (make, npm, etc.)
   - **Manual Verification**: UI/UX, performance under real conditions, edge cases

7. **Shell Path Safety**:
   - Quote file paths that include shell glob characters (such as `[]`, `*`, `?`) in command examples and executions.
   - Example: use `"apps/host/app/[[...url]]/page.tsx"` instead of an unquoted path.

## Completion Message

```
✅ Completed implementation plan for #ISSUE_NUMBER: [issue title]

Approach: [selected approach description]

The plan has been:

Created at thoughts/shared/plans/REPO_NAME/ISSUE-NUM.md
Attached to the GitHub issue as a comment
Issue moved to "Plan in Review" status

Implementation phases:
- Phase 1: [phase 1 description]
- Phase 2: [phase 2 description]
- Phase 3: [phase 3 description if applicable]

View the issue: [ISSUE_URL]
```
