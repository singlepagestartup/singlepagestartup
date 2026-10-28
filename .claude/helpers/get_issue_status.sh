#!/bin/bash
# Get GitHub issue status in Project.
# Usage: ./get_issue_status.sh <ISSUE_NUMBER>

set -e

SCRIPT_DIR="$(dirname "$0")"
# The shared lookup loads config, validates artifact context and rejects
# memberships from another repository or a mismatched Project.
PROJECT_ITEM_JSON=$("$SCRIPT_DIR/get_project_item_id.sh" "${1:-}" --json)
printf "%s\n" "$PROJECT_ITEM_JSON" | jq -r '.status // ""'
