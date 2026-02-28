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

# Get project item ID using gh project item-list (REST API)
# This is simpler and more reliable than GraphQL for this use case
PROJECT_ITEM_ID=$(gh project item-list "$GITHUB_PROJECT_NUMBER" --owner "$GITHUB_OWNER" --format json 2>/dev/null | \
  jq -r --arg num "$ISSUE_NUMBER" '.items[] | select(.content.number == ($num | tonumber)) | .id')

if [ -z "$PROJECT_ITEM_ID" ]; then
  echo "Error: Issue #$ISSUE_NUMBER not found in project" >&2
  exit 1
fi

echo "$PROJECT_ITEM_ID"
