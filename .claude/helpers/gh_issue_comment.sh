#!/bin/bash
# Safely create/edit GitHub issue comments using body-file semantics.
# This avoids shell interpolation pitfalls for markdown content (e.g. backticks).
#
# Usage:
#   cat message.md | .claude/helpers/gh_issue_comment.sh 152
#   .claude/helpers/gh_issue_comment.sh 152 --body-file /tmp/message.md
#   .claude/helpers/gh_issue_comment.sh 152 --edit-last --body-file /tmp/message.md

set -euo pipefail

ISSUE_NUMBER="${1:-}"
shift || true

if [ -z "$ISSUE_NUMBER" ]; then
  echo "Error: Issue number required" >&2
  echo "Usage: ./gh_issue_comment.sh <ISSUE_NUMBER> [--edit-last] [--body-file <path>]" >&2
  exit 1
fi

EDIT_LAST="0"
BODY_FILE=""

while [ $# -gt 0 ]; do
  case "$1" in
    --edit-last)
      EDIT_LAST="1"
      shift
      ;;
    --body-file)
      BODY_FILE="${2:-}"
      if [ -z "$BODY_FILE" ]; then
        echo "Error: --body-file requires a path" >&2
        exit 1
      fi
      shift 2
      ;;
    *)
      echo "Error: Unknown argument: $1" >&2
      exit 1
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/gh_retry.sh"

TEMP_BODY_FILE=""
if [ -z "$BODY_FILE" ]; then
  TEMP_BODY_FILE="$(mktemp)"
  cat > "$TEMP_BODY_FILE"
  BODY_FILE="$TEMP_BODY_FILE"
fi

if [ ! -f "$BODY_FILE" ]; then
  echo "Error: Body file not found: $BODY_FILE" >&2
  [ -n "$TEMP_BODY_FILE" ] && rm -f "$TEMP_BODY_FILE"
  exit 1
fi

ensure_gh_ready

if [ "$EDIT_LAST" = "1" ]; then
  gh_retry issue comment "$ISSUE_NUMBER" --edit-last --body-file "$BODY_FILE"
else
  gh_retry issue comment "$ISSUE_NUMBER" --body-file "$BODY_FILE"
fi

if [ -n "$TEMP_BODY_FILE" ]; then
  rm -f "$TEMP_BODY_FILE"
fi
