---
description: Implement highest priority small GitHub Project issue
model: sonnet
---

## PART I - IF AN ISSUE IS MENTIONED

0b. **CRITICAL: Check issue status in GitHub Project** — only proceed if status is "Ready for Dev"

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
if [ "$CURRENT_STATUS" != "Ready for Dev" ]; then
  echo "❌ Cannot proceed: Issue #ISSUE_NUMBER has status '$CURRENT_STATUS'"
  echo "This command requires status: 'Ready for Dev'"
  echo "Please move the issue to 'Ready for Dev' in the GitHub Project UI first, or use:"
  echo "  /github  (to update the status)"
  exit 1
fi
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

1. move the item to "In Dev" status in the GitHub Project (see `.claude/commands/github.md` for the GraphQL mutation pattern)
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

    3d. move the item to "Code Review" status in the GitHub Project
    ````

think deeply, use TodoWrite to track your tasks. Get the top 10 items by priority but only work on ONE — specifically the highest priority xs or small sized issue.
