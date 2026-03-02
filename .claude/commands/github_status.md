---
description: Check GitHub issue status in Project (single source of truth)
---

# GitHub Issue Status Checker

You check the status of a GitHub issue in the GitHub Project.

**IMPORTANT:** This is the single source of truth for checking issue status. Use this skill whenever you need to know if an issue is in a specific status.

## Input

Issue number (e.g., `142`)

## Process

1. **Load project config**:

```bash
source .claude/.env
GITHUB_LOGIN=$(gh repo view --json owner -q '.owner.login')
PROJECT_OWNER="${GITHUB_PROJECT_OWNER:-$GITHUB_LOGIN}"
PROJECT_OWNER_TYPE="${GITHUB_PROJECT_OWNER_TYPE:-user}"
```

2. **Get issue node ID**:

```bash
ISSUE_NODE_ID=$(gh issue view ISSUE_NUMBER --json id -q '.id')
```

3. **Determine GraphQL query path** based on owner type:

If `PROJECT_OWNER_TYPE=organization`:

```bash
QUERY_PATH=".data.organization.projectV2.items.nodes[] | select(.content.id == \"$ISSUE_NODE_ID\") | [0].fieldValues.nodes[] | select(.field.name == \"Status\") | [0].option.name"
```

If `PROJECT_OWNER_TYPE=user`:

```bash
QUERY_PATH=".data.user.projectV2.items.nodes[] | select(.content.id == \"$ISSUE_NODE_ID\") | [0].fieldValues.nodes[] | select(.field.name == \"Status\") | [0].option.name"
```

4. **Get current status**:

If organization:

```bash
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
```

If user:

```bash
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
' -f login="$PROJECT_OWNER" -F number="$GITHUB_PROJECT_NUMBER" | jq -r "$QUERY_PATH")
```

## Output

Return the status name:

- `Research Needed`
- `Research in Progress`
- `Research in Review`
- `Ready for Plan`
- `Plan in Progress`
- `Plan in Review`
- `Ready for Dev`
- `In Dev`
- `Code Review`
- `Done`
- `Triage`
- `Spec Needed`

## Usage in other commands

When a command needs to check status:

```
/skill github_status 142
```

Then check the returned status against your required status.
