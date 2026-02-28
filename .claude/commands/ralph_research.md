---
description: Research highest priority GitHub Project issue needing investigation
---

## PART I - IF A GITHUB ISSUE IS MENTIONED

0b. **CRITICAL: Check issue status in GitHub Project** — only proceed if status is "Research Needed"

```bash
# Load config and fetch project structure
source .claude/.env
GITHUB_LOGIN=$(gh repo view --json owner -q '.owner.login')
PROJECT_OWNER="${GITHUB_PROJECT_OWNER:-$GITHUB_LOGIN}"
PROJECT_OWNER_TYPE="${GITHUB_PROJECT_OWNER_TYPE:-user}"

# Get issue node ID
ISSUE_NODE_ID=$(gh issue view ISSUE_NUMBER --json id -q '.id')

# Determine GraphQL query path based on owner type
if [ "$PROJECT_OWNER_TYPE" = "organization" ]; then
  QUERY_PATH=".data.organization.projectV2.items.nodes[] | select(.content.id == \"$ISSUE_NODE_ID\") | [0].fieldValues.nodes[] | select(.field.name == \"Status\") | [0].option.name"
else
  QUERY_PATH=".data.user.projectV2.items.nodes[] | select(.content.id == \"$ISSUE_NODE_ID\") | [0].fieldValues.nodes[] | select(.field.name == \"Status\") | [0].option.name"
fi

# Get current status
CURRENT_STATUS=$(gh api graphql -f query='
  query($login: String!, $number: Int!) {
    organization(login: $login) {
      projectV2(number: $number) {
        items(first: 20) {
          nodes {
            content { ... on Issue { id } }
            fieldValues(first: 20) {
              nodes {
                field { name }
                ... on ProjectV2ItemFieldSingleSelectValue {
                  option { name }
                }
              }
            }
          }
        }
      }
    }
  }
' -f login="$PROJECT_OWNER" -F number="$GITHUB_PROJECT_NUMBER" | jq -r "$QUERY_PATH")

if [ "$PROJECT_OWNER_TYPE" = "user" ]; then
  CURRENT_STATUS=$(gh api graphql -f query='
    query($login: String!, $number: Int!) {
      user(login: $login) {
        projectV2(number: $number) {
          items(first: 20) {
            nodes {
              content { ... on Issue { id } }
              fieldValues(first: 20) {
                nodes {
                  field { name }
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    option { name }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
' -f login="$PROJECT_OWNER" -F number="$GITHUB_PROJECT_NUMBER" | jq -r "$QUERY_PATH")
fi

# Validate status
if [ "$CURRENT_STATUS" != "Research Needed" ]; then
  echo "❌ Cannot proceed: Issue #ISSUE_NUMBER has status '$CURRENT_STATUS'"
  echo "This command requires status: 'Research Needed'"
  echo "Please move the issue to 'Research Needed' in the GitHub Project UI first, or use:"
  echo "  /github  (to update the status)"
  exit 1
fi
```

0c. run `gh repo view --json name -q '.name'` to get REPO_NAME, then fetch the issue data and format it as readable Markdown before saving to `thoughts/shared/tickets/REPO_NAME/ISSUE-XXXX.md`. The Markdown format must include:

- Header: `# Issue #XXX: [title]`
- Metadata: URL, status (from labels), created date
- Sections: Problem to solve, Key details, Implementation notes (if applicable), References, Comments
- All comments formatted as subsections with author and date
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
    0c. run `gh repo view --json name -q '.name'` to get REPO_NAME, then fetch the issue data and format it as readable Markdown before saving to `thoughts/shared/tickets/REPO_NAME/ISSUE-XXXX.md`. The Markdown format must include: - Header: `# Issue #XXX: [title]` - Metadata: URL, status (from labels), created date - Sections: Problem to solve, Key details, Implementation notes (if applicable), References, Comments - All comments formatted as subsections with author and date
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
   2g. run `gh repo view --json name -q '.name'` to get REPO_NAME, then document findings in a new thoughts document: `thoughts/shared/research/REPO_NAME/YYYY-MM-DD-ISSUE-XXXX-description.md`
   - Format: `YYYY-MM-DD-ISSUE-XXXX-description.md` where:
     - YYYY-MM-DD is today's date
     - ISSUE-XXXX is the GitHub issue number
     - description is a brief kebab-case description of the research topic
   - Examples (for repo `singlepagestartup`):
     - `thoughts/shared/research/singlepagestartup/2025-01-08-ISSUE-42-parent-child-tracking.md`
     - `thoughts/shared/research/singlepagestartup/2025-01-08-ISSUE-78-error-handling-patterns.md`

think deeply about the findings

3.  synthesize research into actionable insights:
    3a. summarize key findings and technical decisions
    3b. identify potential implementation approaches
    3c. note any risks or concerns discovered

4.  update the issue with research results:
    4a. add a comment with the research summary and link to the document:

    ````bash
    gh issue comment ISSUE_NUMBER --body "Research complete: \`thoughts/shared/research/REPO_NAME/FILENAME.md\`

        Key findings:
        - [Major finding 1]
        - [Major finding 2]
        - [Major finding 3]

        Potential approaches:
        - [Approach A]
        - [Approach B]"
        ```

    4b. move the item to "Research in Review" status in the GitHub Project
    ````

think deeply, use TodoWrite to track your tasks. Get the top 10 items by priority but only work on ONE — specifically the highest priority issue.

## PART III - When you're done

Print a message for the user (replace placeholders with actual values):

```
✅ Completed research for #ISSUE_NUMBER: [issue title]

Research topic: [research topic description]

The research has been:

Created at thoughts/shared/research/REPO_NAME/YYYY-MM-DD-ISSUE-XXXX-description.md
Attached to the GitHub issue as a comment
Issue moved to "Research in Review" status

Key findings:
- [Major finding 1]
- [Major finding 2]
- [Major finding 3]

View the issue: [ISSUE_URL]
```
