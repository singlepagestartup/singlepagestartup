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

# Get issue node ID
ISSUE_NODE_ID=$(gh issue view "$ISSUE_NUMBER" --json id -q '.id')

# Build GraphQL query based on owner type
if [ "$GITHUB_PROJECT_OWNER_TYPE" = "organization" ]; then
  QUERY_PATH=".data.organization.projectV2.items.nodes[] | select(.content.id == \"$ISSUE_NODE_ID\") | [0].fieldValues.nodes[] | select(.field.name == \"Status\") | [0].option.name"

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
  }
' -f login="$GITHUB_OWNER" -F number="$GITHUB_PROJECT_NUMBER" | jq -r "$QUERY_PATH")
else
  QUERY_PATH=".data.user.projectV2.items.nodes[] | select(.content.id == \"$ISSUE_NODE_ID\") | [0].fieldValues.nodes[] | select(.field.name == \"Status\") | [0].option.name"

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
' -f login="$GITHUB_OWNER" -F number="$GITHUB_PROJECT_NUMBER" | jq -r "$QUERY_PATH")
fi

echo "$CURRENT_STATUS"
