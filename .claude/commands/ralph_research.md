---
description: Research highest priority GitHub Project issue needing investigation
---

## PART I - IF A GITHUB ISSUE IS MENTIONED

0c. run `gh issue view ISSUE_NUMBER --json number,title,body,comments,labels,url` and save to `thoughts/shared/tickets/ISSUE-XXXX.md`
0d. read the issue and all comments to understand what research is needed and any previous attempts

## PART I - IF NO ISSUE IS MENTIONED

0.  read `.claude/commands/github.md`
    0a. fetch issues from the GitHub Project in status "Research Needed":
    `bash
    gh project item-list PROJECT_NUMBER --owner PROJECT_OWNER --format json | \
      jq '[.items[] | select(.status == "Research Needed")] | sort_by(.priority // 999) | .[0:10]'
    `
    If that doesn't work, try: `gh issue list --label "status:research-needed" --json number,title,labels,url`
    0b. select the highest priority issue with size label `xs` or `small` (if none exist, EXIT IMMEDIATELY and inform the user)
    0c. run `gh issue view ISSUE_NUMBER --json number,title,body,comments,labels,url` and save to `thoughts/shared/tickets/ISSUE-XXXX.md`
    0d. read the issue and all comments to understand what research is needed and any previous attempts

## PART II - NEXT STEPS

think deeply

1. move the item to "Research in Progress" status in the GitHub Project (see `.claude/commands/github.md` for the GraphQL mutation pattern)
   1a. read any linked documents or file references in the issue description/comments
   1b. if insufficient information to conduct research, add a comment asking for clarification:
   `bash
    gh issue comment ISSUE_NUMBER --body "Need clarification before research: [specific question]"
    `
   Then move back to "Research Needed" and EXIT

think deeply about the research needs

2. conduct the research:
   2a. read `.claude/commands/research_codebase_generic.md` for guidance on effective codebase research
   2b. if the issue comments suggest web research is needed, use WebSearch to research external solutions, APIs, or best practices
   2c. search the codebase for relevant implementations and patterns
   2d. examine existing similar features or related code
   2e. identify technical constraints and opportunities
   2f. Be unbiased — document all related files and how the systems work today, don't jump to implementation ideas
   2g. document findings in a new thoughts document: `thoughts/shared/research/YYYY-MM-DD-ISSUE-XXXX-description.md`
   - Format: `YYYY-MM-DD-ISSUE-XXXX-description.md` where:
     - YYYY-MM-DD is today's date
     - ISSUE-XXXX is the GitHub issue number
     - description is a brief kebab-case description of the research topic
   - Examples:
     - `2025-01-08-ISSUE-42-parent-child-tracking.md`
     - `2025-01-08-ISSUE-78-error-handling-patterns.md`

think deeply about the findings

3.  synthesize research into actionable insights:
    3a. summarize key findings and technical decisions
    3b. identify potential implementation approaches
    3c. note any risks or concerns discovered

4.  update the issue with research results:
    4a. add a comment with the research summary and link to the document:
    ```bash
    gh issue comment ISSUE_NUMBER --body "Research complete: \`thoughts/shared/research/FILENAME.md\`

        Key findings:
        - [Major finding 1]
        - [Major finding 2]
        - [Major finding 3]

        Potential approaches:
        - [Approach A]
        - [Approach B]"
        ```

    4b. move the item to "Research in Review" status in the GitHub Project

think deeply, use TodoWrite to track your tasks. Get the top 10 items by priority but only work on ONE — specifically the highest priority issue.

## PART III - When you're done

Print a message for the user (replace placeholders with actual values):

```
✅ Completed research for #ISSUE_NUMBER: [issue title]

Research topic: [research topic description]

The research has been:

Created at thoughts/shared/research/YYYY-MM-DD-ISSUE-XXXX-description.md
Attached to the GitHub issue as a comment
Issue moved to "Research in Review" status

Key findings:
- [Major finding 1]
- [Major finding 2]
- [Major finding 3]

View the issue: [ISSUE_URL]
```
