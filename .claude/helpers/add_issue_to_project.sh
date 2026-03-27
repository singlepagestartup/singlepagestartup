#!/bin/bash
# Add a GitHub issue to the configured GitHub Project.
# Usage: ./add_issue_to_project.sh <ISSUE_NUMBER> [ISSUE_URL]

set -euo pipefail

ISSUE_NUMBER=${1:-}
ISSUE_URL=${2:-}

if [ -z "$ISSUE_NUMBER" ]; then
  echo "Error: Issue number required" >&2
  echo "Usage: ./add_issue_to_project.sh <ISSUE_NUMBER> [ISSUE_URL]" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/load_config.sh"

if [ -z "${GITHUB_PROJECT_NUMBER:-}" ]; then
  echo "Error: GITHUB_PROJECT_NUMBER is not set in .claude/.env" >&2
  exit 1
fi

REPO_FULL_NAME=$(gh repo view --json nameWithOwner -q '.nameWithOwner')
REPO_OWNER=$(gh repo view --json owner -q '.owner.login')
REPO_NAME=$(gh repo view --json name -q '.name')

if [ -z "$ISSUE_URL" ]; then
  ISSUE_URL="https://github.com/$REPO_FULL_NAME/issues/$ISSUE_NUMBER"
fi

ITEM_ADD_ERROR_FILE="$(mktemp)"
if gh project item-add "$GITHUB_PROJECT_NUMBER" --owner "$GITHUB_OWNER" --url "$ISSUE_URL" >/dev/null 2>"$ITEM_ADD_ERROR_FILE"; then
  rm -f "$ITEM_ADD_ERROR_FILE"
  echo "Added issue #$ISSUE_NUMBER to project #$GITHUB_PROJECT_NUMBER via gh project item-add"
  exit 0
fi

ITEM_ADD_ERROR="$(cat "$ITEM_ADD_ERROR_FILE")"
rm -f "$ITEM_ADD_ERROR_FILE"

# Fallback for gh project item-add owner/type edge cases.
if [ "$GITHUB_PROJECT_OWNER_TYPE" = "organization" ]; then
  PROJECT_NODE_ID=$(gh api graphql -f query='
    query($login: String!, $number: Int!) {
      organization(login: $login) {
        projectV2(number: $number) { id }
      }
    }
  ' -f login="$GITHUB_OWNER" -F number="$GITHUB_PROJECT_NUMBER" | jq -r '.data.organization.projectV2.id')
else
  PROJECT_NODE_ID=$(gh api graphql -f query='
    query($login: String!, $number: Int!) {
      user(login: $login) {
        projectV2(number: $number) { id }
      }
    }
  ' -f login="$GITHUB_OWNER" -F number="$GITHUB_PROJECT_NUMBER" | jq -r '.data.user.projectV2.id')
fi

if [ -z "$PROJECT_NODE_ID" ] || [ "$PROJECT_NODE_ID" = "null" ]; then
  echo "Error: Could not resolve project node id for owner '$GITHUB_OWNER'" >&2
  echo "Original gh project item-add error: $ITEM_ADD_ERROR" >&2
  exit 1
fi

ISSUE_NODE_ID=$(gh api graphql -f query='
  query($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      issue(number: $number) { id }
    }
  }
' -f owner="$REPO_OWNER" -f name="$REPO_NAME" -F number="$ISSUE_NUMBER" | jq -r '.data.repository.issue.id')

if [ -z "$ISSUE_NODE_ID" ] || [ "$ISSUE_NODE_ID" = "null" ]; then
  echo "Error: Could not resolve issue node id for issue #$ISSUE_NUMBER" >&2
  exit 1
fi

gh api graphql -f query='
  mutation($projectId: ID!, $contentId: ID!) {
    addProjectV2ItemById(input: {projectId: $projectId, contentId: $contentId}) {
      item { id }
    }
  }
' -f projectId="$PROJECT_NODE_ID" -f contentId="$ISSUE_NODE_ID" >/dev/null

echo "Added issue #$ISSUE_NUMBER to project #$GITHUB_PROJECT_NUMBER via GraphQL fallback"
