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

# Get issue status using gh project item-list (REST API)
# This is simpler and more reliable than GraphQL for this use case
CURRENT_STATUS=$(gh project item-list "$GITHUB_PROJECT_NUMBER" --owner "$GITHUB_OWNER" --format json 2>/dev/null | \
  jq -r --arg num "$ISSUE_NUMBER" '.items[] | select(.content.number == ($num | tonumber)) | .status')

echo "$CURRENT_STATUS"
