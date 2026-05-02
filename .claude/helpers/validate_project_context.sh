#!/usr/bin/env bash
# Validate that local issue artifacts do not point at a different Project.

target_validate_project_artifact_context() {
  local issue_number="${1:-}"
  local file
  local search_files=()
  local project_line=""
  local hinted_number=""
  local hinted_owner=""
  local hinted_type=""

  if [ -z "$issue_number" ] || [ -z "${TARGET_REPO_NAME:-}" ]; then
    return 0
  fi

  search_files=(
    "thoughts/shared/processes/$TARGET_REPO_NAME/ISSUE-$issue_number.md"
    "thoughts/shared/tickets/$TARGET_REPO_NAME/ISSUE-$issue_number.md"
  )

  for file in "${search_files[@]}"; do
    if [ ! -f "$file" ]; then
      continue
    fi

    project_line="$(sed -n '1,120p' "$file" | grep -E 'Project #[0-9]+' | head -1 || true)"

    if [ -z "$project_line" ]; then
      continue
    fi

    hinted_number="$(printf "%s\n" "$project_line" | sed -n 's/.*Project #\([0-9][0-9]*\).*/\1/p')"
    hinted_owner="$(printf "%s\n" "$project_line" | sed -n 's/.*Project: `\([^`][^`]*\)`.*/\1/p')"

    if printf "%s\n" "$project_line" | grep -q 'organization Project'; then
      hinted_type="organization"
    elif printf "%s\n" "$project_line" | grep -q 'user Project'; then
      hinted_type="user"
    else
      hinted_type=""
    fi

    if [ -n "$hinted_number" ] && [ -n "${GITHUB_PROJECT_NUMBER:-}" ] && [ "$hinted_number" != "$GITHUB_PROJECT_NUMBER" ]; then
      echo "Error: Local artifact $file references GitHub Project #$hinted_number, but .claude/.env is configured for #$GITHUB_PROJECT_NUMBER." >&2
      echo "Refusing to use a mismatched Project for issue #$issue_number in $TARGET_REPO_FULL_NAME." >&2
      return 1
    fi

    if [ -n "$hinted_owner" ] && [ -n "${GITHUB_OWNER:-}" ] && [ "$hinted_owner" != "$GITHUB_OWNER" ]; then
      echo "Error: Local artifact $file references GitHub Project owner '$hinted_owner', but .claude/.env resolves owner '$GITHUB_OWNER'." >&2
      return 1
    fi

    if [ -n "$hinted_type" ] && [ -n "${GITHUB_PROJECT_OWNER_TYPE:-}" ] && [ "$hinted_type" != "$GITHUB_PROJECT_OWNER_TYPE" ]; then
      echo "Error: Local artifact $file references GitHub Project type '$hinted_type', but .claude/.env resolves '$GITHUB_PROJECT_OWNER_TYPE'." >&2
      return 1
    fi

    return 0
  done

  return 0
}

validate_project_artifact_context() {
  target_validate_project_artifact_context "$@"
}
