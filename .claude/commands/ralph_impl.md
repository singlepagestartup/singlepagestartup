---
description: Implement highest priority small GitHub Project issue
model: sonnet
---

## PART I - IF AN ISSUE IS MENTIONED

0b. **CRITICAL: Check issue status in GitHub Project** — only proceed if status is "Ready for Dev"

```bash
CURRENT_STATUS=$(.claude/helpers/get_issue_status.sh ISSUE_NUMBER)

if [ "$CURRENT_STATUS" != "Ready for Dev" ]; then
  echo "❌ Cannot proceed: Issue #ISSUE_NUMBER is not in 'Ready for Dev' status"
  echo "Current status: '$CURRENT_STATUS'"
  echo "This command only works with issues in 'Ready for Dev' status"
  echo ""
  echo "To move issue to 'Ready for Dev', use:"
  echo "  /github  (or manually in GitHub Project UI)"
  exit 1
fi

echo "✅ Issue #ISSUE_NUMBER is in 'Ready for Dev' status — proceeding with implementation"
```

0c. run `gh repo view --json name -q '.name'` to get REPO_NAME, then fetch the issue data and format it as readable Markdown before saving to `thoughts/shared/tickets/REPO_NAME/ISSUE-XXXX.md`. The Markdown format must include:

- Header: `# Issue #XXX: [title]`
- Metadata: URL, status (from labels), created date
- Sections: Problem to solve, Key details, Implementation notes (if applicable), References, Comments
- All comments formatted as subsections with author and date
  0d. read the issue and all comments to understand the implementation plan and any concerns

## PART I - IF NO ISSUE IS MENTIONED

0.  read `.claude/commands/github.md`
    0a. fetch issues from the GitHub Project in status "Ready for Dev":
    `bash
gh project item-list PROJECT_NUMBER --owner PROJECT_OWNER --format json | \
  jq '[.items[] | select(.status == "Ready for Dev")] | sort_by(.priority // 999) | .[0:10]'
`
    If that doesn't work, try: `gh issue list --label "status:ready-for-dev" --json number,title,labels,url`
    0b. select the highest priority issue with size label `xs` or `small` (if none exist, EXIT IMMEDIATELY and inform the user)
    0c. run `gh repo view --json name -q '.name'` to get REPO_NAME, then fetch the issue data and format it as readable Markdown before saving to `thoughts/shared/tickets/REPO_NAME/ISSUE-XXXX.md`. The Markdown format must include: - Header: `# Issue #XXX: [title]` - Metadata: URL, status (from labels), created date - Sections: Problem to solve, Key details, Implementation notes (if applicable), References, Comments - All comments formatted as subsections with author and date
    0d. read the issue and all comments to understand the implementation plan and any concerns

## PART II - NEXT STEPS

think deeply

1. move the item to "In Dev" status:
   ```bash
   .claude/helpers/update_issue_status.sh ISSUE_NUMBER "In Dev"
   ```
   1a. find the linked implementation plan document from the issue comments or description
   1b. if no plan exists, move the issue back to "Ready for Plan" and EXIT with an explanation:
   `bash
gh issue comment ISSUE_NUMBER --body "No implementation plan found. Moving back to Ready for Plan."
`

think deeply about the implementation

2.  implement the plan:
    2a. run `gh repo view --json name -q '.name'` to get REPO_NAME, then read the plan document completely: `thoughts/shared/plans/REPO_NAME/PLAN_FILENAME.md`
    2b. read `.claude/commands/implement_plan.md` and follow its instructions
    2c. implement each phase, verifying success criteria before proceeding

3.  when implementation is complete:
    3a. create a commit following `.claude/commands/commit.md`
    3b. create a PR following `.claude/commands/describe_pr.md`
    3c. add a comment to the issue with the PR link:

    ````bash
    gh issue comment ISSUE_NUMBER --body "PR submitted: [PR_URL]

        Implementation summary:
        - [Key change 1]
        - [Key change 2]"
        ```

    3d. move the item to "Code Review" status:
    ```bash
    .claude/helpers/update_issue_status.sh ISSUE_NUMBER "Code Review"
    ````

think deeply, use TodoWrite to track your tasks. Get the top 10 items by priority but only work on ONE — specifically the highest priority xs or small sized issue.
