---
description: Implement approved plan for GitHub issue in "Ready for Dev" status
model: sonnet
---

# Implement Plan

You implement an approved plan phase-by-phase with progress tracking. Plans are carefully designed, but reality can be messy — follow the plan's intent while adapting to what you find.

## Status Gate

**Entry**: Issue must be in "Ready for Dev" or "In Dev" status (the latter allows resuming an interrupted session)

```bash
CURRENT_STATUS=$(.claude/helpers/get_issue_status.sh ISSUE_NUMBER)

if [[ "$CURRENT_STATUS" != "Ready for Dev" && "$CURRENT_STATUS" != "In Dev" ]]; then
  echo "❌ Cannot proceed: Issue #$ISSUE_NUMBER has status '$CURRENT_STATUS'"
  echo "This command requires status: 'Ready for Dev' or 'In Dev'"
  exit 1
fi
```

**HARD GATE — no exceptions.** Do NOT proceed if the status check fails, even if the user explicitly invoked this command. The status gate exists to prevent implementing unreviewed plans. If the status is wrong, stop immediately and tell the user which status is required and how to advance the issue.

## Process

1. **Update status to "In Dev"**:

   ```bash
   .claude/helpers/update_issue_status.sh ISSUE_NUMBER "In Dev"
   ```

2. **Resolve issue, read ticket and plan**:

   - Run `gh repo view --json name -q '.name'` to get REPO_NAME
   - Read `thoughts/shared/tickets/REPO_NAME/ISSUE-{NUMBER}.md` completely (if exists)
   - Find the implementation plan from issue comments or `thoughts/shared/plans/REPO_NAME/`
   - If no plan exists, move the issue back to "Ready for Plan" and EXIT:
     ```bash
     COMMENT_FILE="$(mktemp)"
     cat > "$COMMENT_FILE" <<'EOF'
     No implementation plan found. Moving back to Ready for Plan.
     EOF
     .claude/helpers/gh_issue_comment.sh ISSUE_NUMBER --body-file "$COMMENT_FILE"
     rm -f "$COMMENT_FILE"
     .claude/helpers/update_issue_status.sh ISSUE_NUMBER "Ready for Plan"
     ```
   - Read the plan document COMPLETELY: `thoughts/shared/plans/REPO_NAME/PLAN_FILENAME.md`
   - Check for any existing checkmarks (`- [x]`) indicating previous progress
   - Read all files mentioned in the plan FULLY before starting

3. **Check for existing progress file** (resume detection):

   ```bash
   PROGRESS_FILE="thoughts/shared/handoffs/$REPO_NAME/ISSUE-${ISSUE_NUMBER}-progress.md"
   ```

   - If file exists and `status: in_progress` → read it, identify the last completed phase, continue from the next phase
   - If file does not exist → create it and start from Phase 1 (see progress file format below)
   - **Always read the `## Incident Log` section before writing any code.** If incidents are already recorded, treat them as known pitfalls — do not re-debug them from scratch. This is especially critical when multiple agents are working in parallel on the same issue.

4. **Sync GitHub comments** (before starting any code changes):

   ```bash
   gh issue view ISSUE_NUMBER --json comments | jq -r '.comments'
   ```

   Check `<!-- Last synced at: ... -->` marker in the plan file to determine the cutoff date. Read all comments since the plan was last synced.

   - **Significant changes** (new requirements, scope changes, explicit constraints like "please don't do X"): stop and inform the user — the plan needs updating before implementation can proceed. Instruct to re-run `20-plan.md` first.
   - **Clarifications or FYI** (technical hints, pointers to files, confirmations): record in the progress file Notes section and continue without blocking.
   - **No new comments**: proceed immediately.

5. **Create progress file** (if not already existing):

   Create at `thoughts/shared/handoffs/REPO_NAME/ISSUE-{NUMBER}-progress.md`:

   ```markdown
   ---
   issue_number: ISSUE_NUMBER
   issue_title: "Issue Title"
   start_date: YYYY-MM-DDTHH:MM:SSZ
   plan_file: thoughts/shared/plans/REPO_NAME/ISSUE-{NUMBER}.md
   status: in_progress
   ---

   # Implementation Progress: ISSUE-{NUMBER} - Issue Title

   **Started**: YYYY-MM-DD
   **Plan**: `thoughts/shared/plans/REPO_NAME/ISSUE-{NUMBER}.md`

   ## Phase Progress

   ### Phase 1: [Phase Name]

   - [ ] Started: —
   - [ ] Completed: —
   - [ ] Automated verification: —

   **Notes**: —

   [Additional phases from the plan...]

   ## Incident Log

   > Read this section FIRST before starting any implementation work.
   > Parallel agents: check here for known pitfalls before debugging independently.

   <!-- incident-count: 0 -->

   ## Summary

   ### Changes Made

   - (populated during implementation)

   ### Pull Request

   - [ ] PR created: —
   - [ ] PR number: —

   ### Final Status

   - [ ] All phases completed
   - [ ] All automated verification passed
   - [ ] Issue marked as Done

   ---

   **Last updated**: YYYY-MM-DDTHH:MM:SSZ
   ```

   **Incident Log format** (reference for recording incidents during implementation):

   ```markdown
   ### Incident N — [Short title]

   - **Occurrences**: 1
   - **Stage**: Phase N - [Phase Name]
   - **Symptom**: [Observable error or behavior]
   - **Root Cause**: [What actually caused it]
   - **Fix**: [Exact action taken to resolve it]
   - **Reusable Pattern**: [How to avoid or instantly fix this in future phases/modules]
   ```

   When the **same root cause** appears again in a later phase, do NOT create a duplicate — instead increment `Occurrences` on the existing incident entry and add a short note about the new occurrence context.

6. **Create a TodoWrite list** to track implementation phases from the plan

7. **Implement each phase** (sequential):

   For each phase N:

   a. Update progress file: mark phase N as started with timestamp

   b. Implement changes per plan:

   - Read all context files mentioned in the phase COMPLETELY
   - Follow the plan's intent while adapting to what you find in the codebase
   - Update checkboxes in the plan file as you complete items using Edit tool
   - If something doesn't match the plan, STOP and communicate clearly:

     ```
     Issue in Phase [N]:
     Expected: [what the plan says]
     Found: [actual situation]
     Why this matters: [explanation]

     How should I proceed?
     ```

   - **Record incidents while implementing**: whenever you hit an unexpected error, type error, runtime failure, or wrong assumption that required debugging — after resolving it, append an entry to `## Incident Log` in the progress file using the format defined in step 5. Check first if the same root cause is already logged; if so, increment `Occurrences` instead of adding a duplicate. Update the `<!-- incident-count: N -->` counter accordingly.

   c. Run automated verification (as specified in the phase's Success Criteria):

   - Type checking: `npm run typecheck`
   - Linting: `npm run lint`
   - Tests: `npm test`
   - Other checks specified in the plan
   - Fix any issues before proceeding

   d. Update progress file with verification results (PASSED/FAILED) and notes. If verification failed and required a fix, record the failure as an incident in `## Incident Log` (same format as step 7b — increment `Occurrences` if it is a recurrence of a known issue).

   e. **Pause for manual verification** (after automated checks pass):

   ```
   Phase [N] Complete - Ready for Manual Verification

   Automated verification passed:
   - [List automated checks that passed]

   Please perform the manual verification steps listed in the plan:
   - [List manual verification items from the plan]

   Let me know when manual testing is complete so I can proceed to Phase [N+1].
   ```

   Wait for human confirmation before proceeding to the next phase.
   Do NOT check off manual verification items until confirmed by the user.

   **Exception**: If instructed to execute multiple phases consecutively, skip the pause until the last phase.

   f. Update progress file: mark phase N as completed

   g. **Context limit handoff** — after completing each phase, check whether the conversation context is approaching ~70% of the context window. If it is:

   1. Update the progress file — mark the completed phase, add notes on the current state
   2. Ensure `status: in_progress` in the YAML frontmatter
   3. Stop and inform the user:
      ```
      Context at ~70% — handing off. Progress recorded at:
      thoughts/shared/handoffs/REPO_NAME/ISSUE-{NUMBER}-progress.md
      Run /core/next {NUMBER} or /core/30-implement {NUMBER} to continue from Phase N+1.
      ```

8. **After all phases complete**:

   a. **Create commit**:

   - Read and follow `.claude/commands/utilities/commit.md` (read the file and execute its instructions directly — do not use SlashCommand)

   b. **Create PR**:

   - Read and follow `.claude/commands/utilities/describe_pr.md` (read the file and execute its instructions directly)

   c. **Update progress file**:

   - Mark all phases complete
   - Add PR link
   - Add summary of changes
   - Update `status: complete` and `completed_date: CURRENT_DATE` in YAML frontmatter
   - **Promote recurring incidents to research**: review `## Incident Log`. For every incident with `Occurrences >= 2`, append it to `thoughts/shared/research/REPO_NAME/ISSUE-{NUMBER}.md` under a `## Known Pitfalls (from implementation)` section (create the section if absent). Use the same incident format. This makes the knowledge permanent and visible to future agents working on related issues.

   d. **Comment on issue with PR link**:

   ```bash
   COMMENT_FILE="$(mktemp)"
   cat > "$COMMENT_FILE" <<'EOF'
   PR submitted: [PR_URL]

   Implementation summary:
   - [Key change 1]
   - [Key change 2]
   EOF
   .claude/helpers/gh_issue_comment.sh ISSUE_NUMBER --body-file "$COMMENT_FILE"
   rm -f "$COMMENT_FILE"
   ```

9. **Update status to "Code Review"**:

   ```bash
   .claude/helpers/update_issue_status.sh ISSUE_NUMBER "Code Review"
   ```

## Exit

- [ ] Progress file created/updated at `thoughts/shared/handoffs/REPO_NAME/ISSUE-{NUMBER}-progress.md`
- [ ] All phases implemented and verified (automated + manual)
- [ ] Commit created with descriptive message
- [ ] PR created with comprehensive description
- [ ] Progress file updated with PR link and marked `status: complete`
- [ ] Issue commented with PR link
- [ ] Status updated to "Code Review" in GitHub Project

## Post-Merge Cleanup

After the PR is merged and issue is marked Done, run this cleanup:

```bash
# Verify the PR is merged and the issue is Done first
gh pr view PR_NUMBER --json state,mergedAt

# Delete operational handoff file
rm thoughts/shared/handoffs/REPO_NAME/ISSUE-{NUMBER}-progress.md
git add -A && git commit -m "chore: clean up handoff file for #ISSUE_NUMBER (merged)"
```

The progress file is deleted because its operational tracking content is already captured in git history. The ticket, research, and plan files are kept permanently.

**Before deleting**: if the progress file contains any incidents with `Occurrences >= 2` that were not yet promoted to the research file during step 8c, promote them now. Single-occurrence incidents (Occurrences = 1) are considered one-off and do not need preservation.

## Important Notes

- Plans are your guide, but your judgment matters — follow intent, adapt to reality
- Read all relevant files FULLY before implementing each phase
- Use TodoWrite to track implementation progress
- Never skip manual verification pauses without explicit instruction
- Group related changes together for atomic commits
- If you get stuck: make sure you've read all relevant code, consider if the codebase evolved since the plan was written, present the mismatch clearly
- GitHub markdown comments must use `.claude/helpers/gh_issue_comment.sh` with `--body-file` (or stdin), not inline `--body "..."` when text may include shell-sensitive content
