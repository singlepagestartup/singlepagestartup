#!/usr/bin/env bash
# Submit an implemented issue for code review by linking its PR and moving the
# GitHub Project status from "In Dev" to "Code Review".
#
# Usage: .claude/helpers/submit_pr_for_code_review.sh <ISSUE_NUMBER> <PR_NUMBER_OR_URL>

set -euo pipefail

ISSUE_NUMBER="${1:-}"
PR_REF="${2:-}"

if [ -z "$ISSUE_NUMBER" ] || [ -z "$PR_REF" ]; then
  echo "Error: issue number and PR reference required" >&2
  echo "Usage: $0 <ISSUE_NUMBER> <PR_NUMBER_OR_URL>" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/load_config.sh"

if ! PR_JSON="$(gh_retry pr view "$PR_REF" \
  --repo "$TARGET_REPO_FULL_NAME" \
  --json number,url,title,state,isDraft,headRefName,baseRefName)" || [ -z "$PR_JSON" ]; then
  echo "Error: could not read PR '$PR_REF' from $TARGET_REPO_FULL_NAME" >&2
  exit 1
fi

PR_NUMBER="$(printf "%s\n" "$PR_JSON" | jq -r '.number')"
PR_URL="$(printf "%s\n" "$PR_JSON" | jq -r '.url')"
PR_TITLE="$(printf "%s\n" "$PR_JSON" | jq -r '.title')"
PR_STATE="$(printf "%s\n" "$PR_JSON" | jq -r '.state')"
PR_IS_DRAFT="$(printf "%s\n" "$PR_JSON" | jq -r '.isDraft')"

if [ -z "$PR_NUMBER" ] || [ "$PR_NUMBER" = "null" ]; then
  echo "Error: PR '$PR_REF' was not found in $TARGET_REPO_FULL_NAME" >&2
  exit 1
fi

if [ "$PR_STATE" != "OPEN" ]; then
  echo "Error: PR #$PR_NUMBER is not open (state: $PR_STATE)" >&2
  exit 1
fi

if [ "$PR_IS_DRAFT" = "true" ]; then
  echo "Error: PR #$PR_NUMBER is a draft; refusing to move issue #$ISSUE_NUMBER to Code Review" >&2
  exit 1
fi

if ! CURRENT_STATUS="$("$SCRIPT_DIR/get_issue_status.sh" "$ISSUE_NUMBER")" || [ -z "$CURRENT_STATUS" ]; then
  echo "Error: could not read issue #$ISSUE_NUMBER status from the GitHub Project" >&2
  exit 1
fi

case "$CURRENT_STATUS" in
  "Code Review")
    echo "Issue #$ISSUE_NUMBER is already in Code Review."
    echo "PR: $PR_URL"
    exit 0
    ;;
  "In Dev")
    ;;
  *)
    echo "Error: Issue #$ISSUE_NUMBER must be in 'In Dev' or 'Code Review' before PR submission; current status is '$CURRENT_STATUS'." >&2
    exit 1
    ;;
esac

COMMENT_MARKER="<!-- sps-code-review-pr:$PR_NUMBER -->"
if gh_retry issue view "$ISSUE_NUMBER" \
  --repo "$TARGET_REPO_FULL_NAME" \
  --json comments \
  -q '.comments[].body' | grep -Fq "$COMMENT_MARKER"; then
  echo "Issue #$ISSUE_NUMBER already has PR #$PR_NUMBER submission comment."
else
  COMMENT_FILE="$(mktemp)"
  cat > "$COMMENT_FILE" <<EOF
$COMMENT_MARKER
PR submitted: $PR_URL

Implementation summary:
- $PR_TITLE
EOF
  "$SCRIPT_DIR/gh_issue_comment.sh" "$ISSUE_NUMBER" --body-file "$COMMENT_FILE"
  rm -f "$COMMENT_FILE"
fi

if ! "$SCRIPT_DIR/update_issue_status.sh" "$ISSUE_NUMBER" "Code Review"; then
  echo "Error: failed to update issue #$ISSUE_NUMBER to Code Review" >&2
  exit 1
fi

if ! NEXT_STATUS="$("$SCRIPT_DIR/get_issue_status.sh" "$ISSUE_NUMBER")" || [ -z "$NEXT_STATUS" ]; then
  echo "Error: could not reread issue #$ISSUE_NUMBER status after update" >&2
  exit 1
fi
if [ "$NEXT_STATUS" != "Code Review" ]; then
  echo "Error: Issue #$ISSUE_NUMBER status update did not stick; current status is '$NEXT_STATUS'." >&2
  exit 1
fi

echo "Issue #$ISSUE_NUMBER submitted for Code Review."
echo "PR: $PR_URL"
