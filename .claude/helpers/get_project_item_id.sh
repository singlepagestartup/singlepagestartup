#!/bin/bash
# Get GitHub Project item ID for a GitHub issue
# Usage: ./get_project_item_id.sh <ISSUE_NUMBER>
# Output: Project item ID (e.g., PVTI_lADOB3eWkc4A1nYszgmWN9M)

set -e

ISSUE_NUMBER=$1

if [ -z "$ISSUE_NUMBER" ]; then
  echo "Error: Issue number required" >&2
  exit 1
fi

# Load config
SCRIPT_DIR="$(dirname "$0")"
source "$SCRIPT_DIR/load_config.sh"
source "$SCRIPT_DIR/validate_project_context.sh"
validate_project_artifact_context "$ISSUE_NUMBER"

# Get project item ID using gh project item-list (REST API)
# This is simpler and more reliable than GraphQL for this use case
PROJECT_ITEMS_JSON=$(gh_retry project item-list "$GITHUB_PROJECT_NUMBER" --owner "$GITHUB_PROJECT_CLI_OWNER" --format json)
TARGET_REPO_URL="https://github.com/$TARGET_REPO_FULL_NAME"
MATCHING_ITEMS_JSON=$(echo "$PROJECT_ITEMS_JSON" | \
  jq -c --arg num "$ISSUE_NUMBER" --arg repo "$TARGET_REPO_URL" '
    [
      .items[]
      | select((.content.type // "") == "Issue")
      | select(.content.number == ($num | tonumber))
      | select((.repository // "") == $repo or ((.content.url // "") | startswith($repo + "/issues/")))
    ]
  ')
MATCHING_COUNT=$(echo "$MATCHING_ITEMS_JSON" | jq 'length')

if [ "$MATCHING_COUNT" -eq 0 ]; then
  echo "Error: Issue #$ISSUE_NUMBER from $TARGET_REPO_FULL_NAME not found in GitHub Project #$GITHUB_PROJECT_NUMBER ($GITHUB_OWNER)" >&2
  exit 1
fi

if [ "$MATCHING_COUNT" -gt 1 ]; then
  echo "Error: Multiple Project items matched issue #$ISSUE_NUMBER from $TARGET_REPO_FULL_NAME in Project #$GITHUB_PROJECT_NUMBER." >&2
  exit 1
fi

PROJECT_ITEM_ID=$(echo "$MATCHING_ITEMS_JSON" | jq -r '.[0].id // ""')

echo "$PROJECT_ITEM_ID"
