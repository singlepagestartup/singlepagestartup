#!/bin/bash
# Update GitHub Project issue status
# Usage: ./update_issue_status.sh <ISSUE_NUMBER> <NEW_STATUS>
# Example: ./update_issue_status.sh 142 "Plan in Progress"

set -e

ISSUE_NUMBER=$1
NEW_STATUS=$2

if [ -z "$ISSUE_NUMBER" ] || [ -z "$NEW_STATUS" ]; then
  echo "Error: Issue number and new status required" >&2
  echo "Usage: ./update_issue_status.sh <ISSUE_NUMBER> <NEW_STATUS>" >&2
  exit 1
fi

# Load config (source .env directly to avoid subshell issues)
SCRIPT_DIR="$(dirname "$0")"
source "$SCRIPT_DIR/../.env"

# Get repo owner from gh
REPO_OWNER=$(gh repo view --json owner -q '.owner.login')
GITHUB_OWNER="${GITHUB_PROJECT_OWNER:-$REPO_OWNER}"
GITHUB_PROJECT_OWNER_TYPE="${GITHUB_PROJECT_OWNER_TYPE:-user}"

# Get project item ID using helper
PROJECT_ITEM_ID=$("$SCRIPT_DIR/get_project_item_id.sh" "$ISSUE_NUMBER")

# Get project fields to resolve status ID
if [ "$GITHUB_PROJECT_OWNER_TYPE" = "organization" ]; then
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
  ' -f login="$GITHUB_OWNER" -F number="$GITHUB_PROJECT_NUMBER")

  STATUS_FIELD_ID=$(echo "$PROJECT_DATA" | jq -r '.data.organization.projectV2.fields.nodes[] | select(.name == "Status") | .id')
  STATUS_OPTION_ID=$(echo "$PROJECT_DATA" | jq -r --arg status "$NEW_STATUS" '.data.organization.projectV2.fields.nodes[] | select(.name == "Status") | .options[] | select(.name == $status) | .id')
  PROJECT_NODE_ID=$(echo "$PROJECT_DATA" | jq -r '.data.organization.projectV2.id')
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
  ' -f login="$GITHUB_OWNER" -F number="$GITHUB_PROJECT_NUMBER")

  STATUS_FIELD_ID=$(echo "$PROJECT_DATA" | jq -r '.data.user.projectV2.fields.nodes[] | select(.name == "Status") | .id')
  STATUS_OPTION_ID=$(echo "$PROJECT_DATA" | jq -r --arg status "$NEW_STATUS" '.data.user.projectV2.fields.nodes[] | select(.name == "Status") | .options[] | select(.name == $status) | .id')
  PROJECT_NODE_ID=$(echo "$PROJECT_DATA" | jq -r '.data.user.projectV2.id')
fi

if [ -z "$STATUS_OPTION_ID" ]; then
  echo "Error: Status '$NEW_STATUS' not found in project" >&2
  exit 1
fi

# Update status
gh project item-edit \
  --id "$PROJECT_ITEM_ID" \
  --project-id "$PROJECT_NODE_ID" \
  --field-id "$STATUS_FIELD_ID" \
  --single-select-option-id "$STATUS_OPTION_ID"

echo "Updated issue #$ISSUE_NUMBER to status: $NEW_STATUS"
