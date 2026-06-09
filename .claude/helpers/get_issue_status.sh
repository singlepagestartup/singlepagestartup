#!/bin/bash
# Get GitHub issue status in Project
# Usage: ./get_issue_status.sh <ISSUE_NUMBER>

set -e

ISSUE_NUMBER=$1

if [ -z "$ISSUE_NUMBER" ]; then
  echo "Error: Issue number required"
  exit 1
fi

# Load config
SCRIPT_DIR="$(dirname "$0")"
source "$SCRIPT_DIR/load_config.sh"
source "$SCRIPT_DIR/validate_project_context.sh"
validate_project_artifact_context "$ISSUE_NUMBER"

# Get issue status using gh project item-list (REST API)
# This is simpler and more reliable than GraphQL for this use case
PROJECT_ITEMS_JSON=$(gh_retry project item-list "$GITHUB_PROJECT_NUMBER" --owner "$GITHUB_PROJECT_CLI_OWNER" --format json --limit 1000)
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
  echo "Error: Issue #$ISSUE_NUMBER from $TARGET_REPO_FULL_NAME was not found in GitHub Project #$GITHUB_PROJECT_NUMBER ($GITHUB_OWNER)." >&2
  echo "Refusing to use a Project item from another repository or a mismatched Project." >&2
  exit 1
fi

if [ "$MATCHING_COUNT" -gt 1 ]; then
  echo "Error: Multiple Project items matched issue #$ISSUE_NUMBER from $TARGET_REPO_FULL_NAME in Project #$GITHUB_PROJECT_NUMBER." >&2
  echo "Resolve duplicate Project items before continuing." >&2
  exit 1
fi

CURRENT_STATUS=$(echo "$MATCHING_ITEMS_JSON" | jq -r '.[0].status // ""')

echo "$CURRENT_STATUS"
