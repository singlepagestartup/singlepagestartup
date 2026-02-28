---
description: Create implementation plan for highest priority GitHub Project issue ready for plan
---

## PART I - IF AN ISSUE IS MENTIONED

0b. **CRITICAL: Check issue status in GitHub Project** — only proceed if status is "Ready for Plan"

```bash
CURRENT_STATUS=$(.claude/helpers/get_issue_status.sh ISSUE_NUMBER)

if [ "$CURRENT_STATUS" != "Ready for Plan" ]; then
  echo "❌ Cannot proceed: Issue #ISSUE_NUMBER has status '$CURRENT_STATUS'"
  echo "This command requires status: 'Ready for Plan'"
  echo "Please move the issue to 'Ready for Plan' in the GitHub Project UI first, or use:"
  echo "  /github  (to update the status)"
  exit 1
fi
```

0c. run `gh repo view --json name -q '.name'` to get REPO_NAME, then fetch the issue data.

- **IMPORTANT:** Check if the ticket file already exists at `thoughts/shared/tickets/REPO_NAME/ISSUE-XXXX.md`
- If file exists: skip creation and proceed to step 0d (read existing file)
- If file does NOT exist: format the issue data as readable Markdown and save to `thoughts/shared/tickets/REPO_NAME/ISSUE-XXXX.md`
- The Markdown format must include:
  - Header: `# Issue #XXX: [title]`
  - Metadata: URL, status (from labels), created date
  - Sections: Problem to solve, Key details, Implementation notes (if applicable), References, Comments
  - All comments formatted as subsections with author and date
    0d. read the issue and all comments to learn about past implementations and research

## PART I - IF NO ISSUE IS MENTIONED

0.  read `.claude/commands/github.md`
    0a. fetch issues from the GitHub Project in status "Ready for Plan":
    `bash
gh project item-list PROJECT_NUMBER --owner PROJECT_OWNER --format json | \
  jq '[.items[] | select(.status == "Ready for Plan")] | sort_by(.priority // 999) | .[0:10]'
`
    If that doesn't work, try: `gh issue list --label "status:ready-for-plan" --json number,title,labels,url`

0b. select the highest priority issue with size label `xs` or `small` (if none exist, EXIT IMMEDIATELY and inform the user)
0c. run `gh repo view --json name -q '.name'` to get REPO_NAME, then fetch the issue data.

- **IMPORTANT:** Check if the ticket file already exists at `thoughts/shared/tickets/REPO_NAME/ISSUE-XXXX.md`
- If file exists: skip creation and proceed to step 0d (read existing file)
- If file does NOT exist: format the issue data as readable Markdown and save to `thoughts/shared/tickets/REPO_NAME/ISSUE-XXXX.md`
- The Markdown format must include:
  - Header: `# Issue #XXX: [title]`
  - Metadata: URL, status (from labels), created date
  - Sections: Problem to solve, Key details, Implementation notes (if applicable), References, Comments
  - All comments formatted as subsections with author and date
    0d. read the issue and all comments to learn about past implementations and research

## PART II - NEXT STEPS

think deeply

1. move the item to "Plan in Progress" status in the GitHub Project (see `.claude/commands/github.md` for the GraphQL mutation pattern)
   1a. read `.claude/commands/create_plan_generic.md`
   1b. check if the issue has a linked implementation plan document mentioned in comments or description
   1d. if the plan exists and is complete, you're done — respond with a link to the issue
   1e. if the plan is missing or has unanswered questions, create a new plan document following the instructions in `.claude/commands/create_plan_generic.md`

think deeply

2. when the plan is complete, attach a link to the plan file in the issue as a comment:

   ```bash
   gh issue comment ISSUE_NUMBER --body "Implementation plan created: \`thoughts/shared/plans/REPO_NAME/PLAN_FILENAME.md\`

   [Brief summary of the plan approach and phases]"
   ```

   2a. move the item to "Plan in Review" status in the GitHub Project

think deeply, use TodoWrite to track your tasks. Get the top 10 items by priority but only work on ONE — specifically, highest priority xs or small sized issue.

## PART III - When you're done

Print a message for the user (replace placeholders with actual values):

```
✅ Completed implementation plan for #ISSUE_NUMBER: [issue title]

Approach: [selected approach description]

The plan has been:

Created at thoughts/shared/plans/REPO_NAME/YYYY-MM-DD-ISSUE-XXXX-description.md
Attached to the GitHub issue as a comment
Issue moved to "Plan in Review" status

Implementation phases:
- Phase 1: [phase 1 description]
- Phase 2: [phase 2 description]
- Phase 3: [phase 3 description if applicable]

View the issue: [ISSUE_URL]
```
