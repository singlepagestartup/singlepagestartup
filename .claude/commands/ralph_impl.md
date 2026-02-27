---
description: Implement highest priority small GitHub Project issue
model: sonnet
---

## PART I - IF AN ISSUE IS MENTIONED

0c. run `gh issue view ISSUE_NUMBER --json number,title,body,comments,labels,url` and save to `thoughts/shared/tickets/ISSUE-XXXX.md`
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
    0c. run `gh issue view ISSUE_NUMBER --json number,title,body,comments,labels,url` and save to `thoughts/shared/tickets/ISSUE-XXXX.md`
    0d. read the issue and all comments to understand the implementation plan and any concerns

## PART II - NEXT STEPS

think deeply

1. move the item to "In Dev" status in the GitHub Project (see `.claude/commands/github.md` for the GraphQL mutation pattern)
   1a. find the linked implementation plan document from the issue comments or description
   1b. if no plan exists, move the issue back to "Ready for Plan" and EXIT with an explanation:
   `bash
    gh issue comment ISSUE_NUMBER --body "No implementation plan found. Moving back to Ready for Plan."
    `

think deeply about the implementation

2.  implement the plan:
    2a. read the plan document completely: `thoughts/shared/plans/PLAN_FILENAME.md`
    2b. read `.claude/commands/implement_plan.md` and follow its instructions
    2c. implement each phase, verifying success criteria before proceeding

3.  when implementation is complete:
    3a. create a commit following `.claude/commands/commit.md`
    3b. create a PR following `.claude/commands/describe_pr.md`
    3c. add a comment to the issue with the PR link:
    ```bash
    gh issue comment ISSUE_NUMBER --body "PR submitted: [PR_URL]

        Implementation summary:
        - [Key change 1]
        - [Key change 2]"
        ```

    3d. move the item to "Code Review" status in the GitHub Project

think deeply, use TodoWrite to track your tasks. Get the top 10 items by priority but only work on ONE — specifically the highest priority xs or small sized issue.
