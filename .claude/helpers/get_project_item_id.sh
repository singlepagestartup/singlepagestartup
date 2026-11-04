#!/bin/bash
# Get GitHub Project item ID for a GitHub issue.
# Usage: ./get_project_item_id.sh <ISSUE_NUMBER> [--json]
# Output: Project item ID, or the matched item with --json.

set -e

ISSUE_NUMBER=${1:-}
OUTPUT_FORMAT=${2:-}

if ! [[ "$ISSUE_NUMBER" =~ ^[0-9]+$ ]] || { [ -n "$OUTPUT_FORMAT" ] && [ "$OUTPUT_FORMAT" != "--json" ]; }; then
  echo "Usage: ./get_project_item_id.sh <ISSUE_NUMBER> [--json]" >&2
  exit 1
fi

SCRIPT_DIR="$(dirname "$0")"
source "$SCRIPT_DIR/load_config.sh"
source "$SCRIPT_DIR/validate_project_context.sh"
validate_project_artifact_context "$ISSUE_NUMBER"

# Prefer the Project list, but newly added items can be absent from this view.
PROJECT_ITEMS_JSON=$(gh_retry project item-list "$GITHUB_PROJECT_NUMBER" --owner "$GITHUB_PROJECT_CLI_OWNER" --format json --limit 1000)
TARGET_REPO_URL="https://github.com/$TARGET_REPO_FULL_NAME"
if ! echo "$PROJECT_ITEMS_JSON" | jq -es 'length == 1 and (.[0].items | type == "array")' >/dev/null; then
  echo "Error: Could not read items from GitHub Project #$GITHUB_PROJECT_NUMBER ($GITHUB_OWNER)." >&2
  exit 1
fi
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
  case "$GITHUB_PROJECT_OWNER_TYPE" in
    organization) PROJECT_OWNER_TYPE=Organization ;;
    user) PROJECT_OWNER_TYPE=User ;;
    *) echo "Error: Unsupported GitHub Project owner type '$GITHUB_PROJECT_OWNER_TYPE'." >&2; exit 1 ;;
  esac

  # Read only the target issue's memberships. Match the configured Project by
  # owner, owner type and number; another repository or archived item cannot win.
  PROJECT_ITEMS_CURSOR=""
  while true; do
    PROJECT_QUERY_ARGS=(-f owner="$TARGET_REPO_OWNER" -f repo="$TARGET_REPO_NAME" -F issue="$ISSUE_NUMBER")
    if [ -n "$PROJECT_ITEMS_CURSOR" ]; then
      PROJECT_QUERY_ARGS+=(-f after="$PROJECT_ITEMS_CURSOR")
    fi
    ISSUE_PROJECTS_JSON=$(gh_retry api graphql -f query='
      query($owner: String!, $repo: String!, $issue: Int!, $after: String) {
        repository(owner: $owner, name: $repo) {
          issue(number: $issue) {
            url
            number
            projectItems(first: 100, after: $after) {
              nodes {
                id
                isArchived
                project {
                  number
                  owner {
                    __typename
                    ... on Organization { login }
                    ... on User { login }
                  }
                }
                fieldValueByName(name: "Status") {
                  ... on ProjectV2ItemFieldSingleSelectValue { name }
                }
              }
              pageInfo { hasNextPage endCursor }
            }
          }
        }
      }
    ' "${PROJECT_QUERY_ARGS[@]}")

    if ! echo "$ISSUE_PROJECTS_JSON" | jq -es --arg url "$TARGET_REPO_URL/issues/$ISSUE_NUMBER" --argjson number "$ISSUE_NUMBER" '
      length == 1 and (.[0] |
      ((.errors // []) | length == 0)
      and .data.repository.issue.url == $url
      and .data.repository.issue.number == $number
      and (.data.repository.issue.projectItems.nodes | type == "array")
      and (.data.repository.issue.projectItems.pageInfo.hasNextPage | type == "boolean"))
    ' >/dev/null; then
      echo "Error: Could not verify Project memberships for issue #$ISSUE_NUMBER from $TARGET_REPO_FULL_NAME." >&2
      exit 1
    fi

    PAGE_MATCHES_JSON=$(echo "$ISSUE_PROJECTS_JSON" | jq -c \
      --arg owner "$GITHUB_OWNER" --arg ownerType "$PROJECT_OWNER_TYPE" --argjson project "$GITHUB_PROJECT_NUMBER" '
      [
        .data.repository.issue.projectItems.nodes[]
        | select(.isArchived == false)
        | select(.project.number == $project)
        | select(.project.owner.__typename == $ownerType)
        | select((.project.owner.login | ascii_downcase) == ($owner | ascii_downcase))
        | {id, status: (.fieldValueByName.name // "")}
      ]
    ')
    MATCHING_ITEMS_JSON=$(jq -cn --argjson items "$MATCHING_ITEMS_JSON" --argjson page "$PAGE_MATCHES_JSON" '$items + $page')
    if [ "$(echo "$ISSUE_PROJECTS_JSON" | jq -r '.data.repository.issue.projectItems.pageInfo.hasNextPage')" != "true" ]; then
      break
    fi
    NEXT_PROJECT_ITEMS_CURSOR=$(echo "$ISSUE_PROJECTS_JSON" | jq -r '.data.repository.issue.projectItems.pageInfo.endCursor // ""')
    if [ -z "$NEXT_PROJECT_ITEMS_CURSOR" ] || [ "$NEXT_PROJECT_ITEMS_CURSOR" = "$PROJECT_ITEMS_CURSOR" ]; then
      echo "Error: Could not paginate Project memberships for issue #$ISSUE_NUMBER." >&2
      exit 1
    fi
    PROJECT_ITEMS_CURSOR="$NEXT_PROJECT_ITEMS_CURSOR"
  done
  MATCHING_COUNT=$(echo "$MATCHING_ITEMS_JSON" | jq 'length')
fi

if [ "$MATCHING_COUNT" -eq 0 ]; then
  echo "Error: Issue #$ISSUE_NUMBER from $TARGET_REPO_FULL_NAME not found in GitHub Project #$GITHUB_PROJECT_NUMBER ($GITHUB_OWNER)" >&2
  exit 1
fi

if [ "$MATCHING_COUNT" -gt 1 ]; then
  echo "Error: Multiple Project items matched issue #$ISSUE_NUMBER from $TARGET_REPO_FULL_NAME in Project #$GITHUB_PROJECT_NUMBER." >&2
  exit 1
fi

if ! echo "$MATCHING_ITEMS_JSON" | jq -e '.[0].id | type == "string" and length > 0' >/dev/null; then
  echo "Error: Matched Project item has no ID for issue #$ISSUE_NUMBER." >&2
  exit 1
fi

if [ "$OUTPUT_FORMAT" = "--json" ]; then
  echo "$MATCHING_ITEMS_JSON" | jq -c '.[0]'
else
  echo "$MATCHING_ITEMS_JSON" | jq -r '.[0].id'
fi
