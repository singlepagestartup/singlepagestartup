---
description: Manage GitHub Project issues - create, update, comment, and follow workflow patterns
---

# GitHub Projects - Issue Management

## Project Configuration

**IMPORTANT:**

- `GITHUB_PROJECT_NUMBER` = numeric project ID (e.g., `2`)
- `PROJECT_NODE_ID` = global project ID (e.g., `PVTI_lADO...`) — resolved from GraphQL
- When using `gh project item-edit`, always pass `--project-id "$PROJECT_NODE_ID"`, NOT the numeric number

**Only `GITHUB_PROJECT_NUMBER` is required in `.claude/.env`.** All other IDs are resolved dynamically by name.

At the start of every session, load config and fetch the project structure:

```bash
# Auto-detect repo context from gh CLI
GITHUB_REPO=$(gh repo view --json nameWithOwner -q '.nameWithOwner')
GITHUB_LOGIN=$(gh repo view --json owner -q '.owner.login')

# Load project config from .env
source .claude/.env

# Determine project owner and entity type
# GITHUB_PROJECT_OWNER defaults to repo owner if not set
# GITHUB_PROJECT_OWNER_TYPE defaults to "user" if not set
PROJECT_OWNER="${GITHUB_PROJECT_OWNER:-$GITHUB_LOGIN}"
PROJECT_OWNER_TYPE="${GITHUB_PROJECT_OWNER_TYPE:-user}"

# Fetch project structure — resolves all IDs from status names
# Use organization(...) or user(...) depending on PROJECT_OWNER_TYPE
if [ "$PROJECT_OWNER_TYPE" = "organization" ]; then
  PROJECT_DATA=$(gh api graphql -f query='
    query($login: String!, $number: Int!) {
      organization(login: $login) {
        projectV2(number: $number) {
          id
          fields(first: 20) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
                options { id name }
              }
            }
          }
        }
      }
    }
  ' -f login="$PROJECT_OWNER" -F number="$GITHUB_PROJECT_NUMBER")
  PROJECT_NODE_ID=$(echo "$PROJECT_DATA" | jq -r '.data.organization.projectV2.id')
  STATUS_FIELD_ID=$(echo "$PROJECT_DATA" | jq -r '[.data.organization.projectV2.fields.nodes[] | select(.name == "Status")] | .[0].id')
  PROJECT_FIELDS_PATH=".data.organization.projectV2.fields.nodes"
else
  PROJECT_DATA=$(gh api graphql -f query='
    query($login: String!, $number: Int!) {
      user(login: $login) {
        projectV2(number: $number) {
          id
          fields(first: 20) {
            nodes {
              ... on ProjectV2SingleSelectField {
                id
                name
                options { id name }
              }
            }
          }
        }
      }
    }
  ' -f login="$PROJECT_OWNER" -F number="$GITHUB_PROJECT_NUMBER")
  PROJECT_NODE_ID=$(echo "$PROJECT_DATA" | jq -r '.data.user.projectV2.id')
  STATUS_FIELD_ID=$(echo "$PROJECT_DATA" | jq -r '[.data.user.projectV2.fields.nodes[] | select(.name == "Status")] | .[0].id')
  PROJECT_FIELDS_PATH=".data.user.projectV2.fields.nodes"
fi
```

To resolve a status name to its UUID (use this whenever you need an `optionId`):

```bash
get_status_id() {
  echo "$PROJECT_DATA" | jq -r "[$PROJECT_FIELDS_PATH[] | select(.name == \"Status\")] | .[0].options[] | select(.name == \"$1\") | .id"
}

# Example:
READY_FOR_DEV_ID=$(get_status_id "Ready for Dev")
```

If `GITHUB_PROJECT_NUMBER` is empty, ask the user to fill in `.claude/.env`:

- Personal project: run `gh project list --me`
- Org project: run `gh project list --owner ORG_NAME`

You are tasked with managing GitHub Project issues, including creating issues, updating status fields, adding comments, and following the team's workflow.

## Initial Setup

First, discover the project context:

```bash
# List available projects
gh project list --me

# Or for an org
gh project list --owner OWNER
```

If the project cannot be found, respond:

```
I need access to a GitHub Project. Please ensure `gh` CLI is authenticated and the project exists.
Run `gh project list --me` to see available projects.
```

If found, respond based on the user's request:

### For general requests:

```
I can help you with GitHub Project issues. What would you like to do?
1. Create a new issue from a thoughts document
2. Add a comment to an issue
3. Search for issues by status
4. Update issue status or details
```

Then wait for the user's input.

## Team Workflow & Status Progression

The team follows this workflow (Status is a custom field in the GitHub Project):

1. **Triage** → All new issues start here for initial review
2. **Spec Needed** → More detail is needed — problem to solve and solution outline necessary
3. **Research Needed** → Issue requires investigation before plan can be written
4. **Research in Progress** → Active research/investigation underway
5. **Research in Review** → Research findings under review (optional step)
6. **Ready for Plan** → Research complete, issue needs an implementation plan
7. **Plan in Progress** → Actively writing the implementation plan
8. **Plan in Review** → Plan is written and under discussion
9. **Ready for Dev** → Plan approved, ready for implementation
10. **In Dev** → Active development
11. **Code Review** → PR submitted
12. **Done** → Completed

**Key principle**: Review and alignment happen at the plan stage (not PR stage) to move faster and avoid rework.

## Helper Functions

### Getting Issue's Project Item ID

To update a project field, you need the item ID (not the issue number):

```bash
gh api graphql -f query='
  query($issueId: ID!) {
    node(id: $issueId) {
      ... on Issue {
        projectItems(first: 5) {
          nodes {
            id
            project { title }
          }
        }
      }
    }
  }
' -f issueId="ISSUE_NODE_ID"
```

Get issue node ID via: `gh issue view ISSUE_NUMBER --json id -q '.id'`

### Updating Status Field

**IMPORTANT:** Use `gh project item-edit` with the global PROJECT_NODE_ID (not the numeric project number).

```bash
# Resolve the target status name to its UUID
TARGET_STATUS_ID=$(get_status_id "Ready for Dev")

# Get the project item ID for the issue (see "Getting Issue's Project Item ID" above)
ITEM_ID="..."

# Update status using gh CLI (NOT GraphQL mutation)
# NOTE: --project-id must be PROJECT_NODE_ID (the global ID), NOT GITHUB_PROJECT_NUMBER (numeric)
gh project item-edit \
  --id "$ITEM_ID" \
  --project-id "$PROJECT_NODE_ID" \
  --field-id "$STATUS_FIELD_ID" \
  --single-select-option-id "$TARGET_STATUS_ID"
```

Alternative GraphQL mutation (same result, more complex):

```bash
gh api graphql -f query='
  mutation($projectId: ID!, $itemId: ID!, $fieldId: ID!, $optionId: String!) {
    updateProjectV2ItemFieldValue(input: {
      projectId: $projectId
      itemId: $itemId
      fieldId: $fieldId
      value: { singleSelectOptionId: $optionId }
    }) {
      projectV2Item { id }
    }
  }
' -f projectId="$PROJECT_NODE_ID" -f itemId="$ITEM_ID" -f fieldId="$STATUS_FIELD_ID" -f optionId="$TARGET_STATUS_ID"
```

### Listing Issues by Status

```bash
gh project item-list PROJECT_NUMBER --owner GITHUB_LOGIN --format json | \
  jq '[.items[] | select(.status == "STATUS_NAME")] | sort_by(.priority // 999)'
```

Or via labels:

```bash
gh issue list --label "status:research-needed" --json number,title,labels,url
```

## Action-Specific Instructions

### 1. Creating Issues from Thoughts

#### Steps after receiving the request:

1. **Locate and read the thoughts document:**

   - If given a path, read the document directly
   - If given a topic/keyword, search `thoughts/` using Grep
   - Create a TodoWrite list: Read document → Analyze → Draft issue → Get user input → Create issue

2. **Analyze the document content:**

   - Identify the core problem or feature being discussed
   - Extract key implementation details or technical decisions
   - Note specific code files or areas mentioned
   - Look for action items or next steps

3. **Draft the issue summary:**
   Present a draft to the user:

   ```
   ## Draft GitHub Issue

   **Title**: [Clear, action-oriented title]

   **Description**:
   [2-3 sentence summary of the problem/goal]

   ## Key Details
   - [Bullet points of important details from thoughts]
   - [Technical decisions or constraints]
   - [Any specific requirements]

   ## Implementation Notes (if applicable)
   [Any specific technical approach or steps outlined]

   ## References
   - Source: `thoughts/[path/to/document.md]`
   - Related code: [any file:line references]

   ---
   Based on the document, this seems to be at the stage of: [ideation/planning/ready to implement]
   ```

4. **Interactive refinement:**
   Ask the user:

   - Does this summary capture the issue accurately?
   - What size label? (xs / small / medium / large)
   - Any additional context to add?

5. **Create the GitHub issue:**

   ```bash
   gh issue create \
     --title "TITLE" \
     --body "DESCRIPTION" \
     --label "size:small,status:triage"
   ```

6. **Add to GitHub Project and set status to Triage:**

   ```bash
   # Add issue to project
   gh project item-add PROJECT_NUMBER --owner GITHUB_LOGIN --url ISSUE_URL

   # Then update status field to Triage (use graphql mutation above)
   ```

7. **Post-creation actions:**
   - Show the created issue URL
   - Ask if user wants to update the original thoughts document with the issue reference
   - If yes, add at the top of the document:
     ```
     ---
     github_issue: [URL]
     created: [date]
     ---
     ```

### 2. Adding Comments to Existing Issues

When user wants to add a comment to an issue:

1. **Determine which issue** from conversation context or ask
2. **Format comments for clarity:**

   - Keep concise (~10 lines) unless more is needed
   - Focus on key insight, not just what was done
   - Include relevant file references with backticks

3. **Comment structure example:**

   ```markdown
   Implemented retry logic in webhook handler to address rate limit issues.

   Key insight: The 429 responses were clustered during batch operations,
   so exponential backoff alone wasn't sufficient — added request queuing.

   Files updated:

   - `apps/api/src/webhooks/handler.ts`
   - `thoughts/shared/rate_limit_analysis.md`
   ```

4. **Add the comment:**
   ```bash
   gh issue comment ISSUE_NUMBER --body "COMMENT_BODY"
   ```

### 3. Searching for Issues by Status

```bash
# Via project items
gh project item-list PROJECT_NUMBER --owner GITHUB_LOGIN --format json | \
  jq '[.items[] | select(.status == "Research Needed")]'

# Via labels (if using label-based status)
gh issue list --label "status:research-needed" --json number,title,url,labels
```

### 4. Updating Issue Status

```bash
# Update status field in GitHub Project (use graphql mutation above)
# With correct optionId for the target status
```

Consider adding a comment explaining the status change.

### 5. Fetching Issue into Thoughts

To save an issue for reference as readable Markdown:

```bash
REPO_NAME=$(gh repo view --json name -q '.name')
```

Then fetch the issue data and format it as Markdown before saving to `thoughts/shared/tickets/$REPO_NAME/ISSUE-XXXX.md`. The Markdown format must include:

- Header: `# Issue #XXX: [title]`
- Metadata: URL, status (from labels), created date
- Sections: Problem to solve, Key details, Implementation notes (if applicable), References, Comments
- All comments formatted as subsections with author and date

Do NOT save raw JSON — always format as human-readable Markdown.

## Issue Quality Guidelines

- All issues must include a clear **problem to solve** — if the user gives only implementation details, ask: "To write a good issue, please explain the problem you're trying to solve from a user perspective"
- Focus on "what" and "why"; include "how" only if well-defined
- Use labels for: size (`size:xs`, `size:small`, `size:medium`, `size:large`), area (`area:api`, `area:frontend`, `area:db`)
- Keep issues concise but complete

## Comment Quality Guidelines

Focus on extracting the **most valuable information** for a human reader:

- **Key insights over summaries**: What's the "aha" moment?
- **Decisions and tradeoffs**: What approach was chosen and what it enables/prevents
- **Blockers resolved**: What was preventing progress and how it was addressed
- **State changes**: What's different now and what it means for next steps
- **Surprises or discoveries**: Unexpected findings

Avoid:

- Mechanical lists of changes without context
- Restating what's obvious from code diffs
- Generic summaries that don't add value
