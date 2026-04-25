#!/bin/bash
# Create a GitHub issue, add it to the configured project, and update statuses.
# Usage: ./create_issue_with_project.sh <TITLE> <BODY_FILE> <SIZE_LABEL> [INITIAL_STATUS] [FINAL_STATUS]

set -euo pipefail

TITLE=${1:-}
BODY_FILE=${2:-}
SIZE_LABEL=${3:-}
INITIAL_STATUS=${4:-Triage}
FINAL_STATUS=${5:-}

if [ -z "$TITLE" ] || [ -z "$BODY_FILE" ] || [ -z "$SIZE_LABEL" ]; then
  echo "Error: title, body file, and size label are required" >&2
  echo "Usage: ./create_issue_with_project.sh <TITLE> <BODY_FILE> <SIZE_LABEL> [INITIAL_STATUS] [FINAL_STATUS]" >&2
  exit 1
fi

if [ ! -f "$BODY_FILE" ]; then
  echo "Error: Body file not found: $BODY_FILE" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/load_config.sh"

ISSUE_URL=$(gh_retry issue create \
  --title "$TITLE" \
  --body-file "$BODY_FILE" \
  --label "size:$SIZE_LABEL")

if [ -z "$ISSUE_URL" ]; then
  echo "Error: GitHub issue creation returned an empty URL" >&2
  exit 1
fi

case "$ISSUE_URL" in
  */issues/*) ;;
  *)
    echo "Error: Unexpected GitHub issue URL format: $ISSUE_URL" >&2
    exit 1
    ;;
esac

ISSUE_NUMBER=${ISSUE_URL##*/}

if [ -z "$ISSUE_NUMBER" ] || ! printf "%s" "$ISSUE_NUMBER" | grep -Eq '^[0-9]+$'; then
  echo "Error: Could not parse issue number from URL: $ISSUE_URL" >&2
  exit 1
fi

"$SCRIPT_DIR/add_issue_to_project.sh" "$ISSUE_NUMBER" "$ISSUE_URL"
"$SCRIPT_DIR/update_issue_status.sh" "$ISSUE_NUMBER" "$INITIAL_STATUS"

if [ -n "$FINAL_STATUS" ] && [ "$FINAL_STATUS" != "$INITIAL_STATUS" ]; then
  "$SCRIPT_DIR/update_issue_status.sh" "$ISSUE_NUMBER" "$FINAL_STATUS"
fi

printf "ISSUE_URL=%s\nISSUE_NUMBER=%s\n" "$ISSUE_URL" "$ISSUE_NUMBER"
