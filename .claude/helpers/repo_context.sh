#!/usr/bin/env bash
# Resolve the target GitHub repository for SPS workflow commands.
#
# Do not derive workflow paths from bare `gh repo view`: in forks or template
# checkouts GitHub CLI may resolve to an upstream/default repository that is
# different from the workspace's `origin`.
#
# Resolution order:
#   1. SPS_TARGET_REPO (intentional override, owner/name)
#   2. GITHUB_REPOSITORY (CI-style owner/name)
#   3. git remote.origin.url
#   4. ambient GH_REPO
#   5. gh repo view fallback
#
# Exports:
#   SPS_REPO_FULL_NAME  owner/name
#   SPS_REPO_OWNER      owner
#   SPS_REPO_NAME       short repository name
#   SPS_REPO_URL        https://github.com/owner/name
#   GH_REPO             owner/name, for gh issue/comment defaults

sps_normalize_github_repo() {
  local raw="${1:-}"
  local value

  if [ -z "$raw" ]; then
    return 1
  fi

  value="${raw%.git}"

  case "$value" in
    https://github.com/*)
      value="${value#https://github.com/}"
      ;;
    http://github.com/*)
      value="${value#http://github.com/}"
      ;;
    ssh://git@github.com/*)
      value="${value#ssh://git@github.com/}"
      ;;
    git@github.com:*)
      value="${value#git@github.com:}"
      ;;
    github.com/*)
      value="${value#github.com/}"
      ;;
  esac

  value="${value%/}"

  case "$value" in
    */*)
      printf "%s\n" "$value"
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

sps_resolve_repo_context() {
  local full_name=""
  local origin_url=""
  local gh_repo_view=""

  if [ -n "${SPS_TARGET_REPO:-}" ]; then
    full_name="$(sps_normalize_github_repo "$SPS_TARGET_REPO")"
  elif [ -n "${GITHUB_REPOSITORY:-}" ]; then
    full_name="$(sps_normalize_github_repo "$GITHUB_REPOSITORY")"
  else
    origin_url="$(git config --get remote.origin.url 2>/dev/null || true)"
    if [ -n "$origin_url" ]; then
      full_name="$(sps_normalize_github_repo "$origin_url" || true)"
    fi

    if [ -z "$full_name" ] && [ -n "${GH_REPO:-}" ]; then
      full_name="$(sps_normalize_github_repo "$GH_REPO" || true)"
    fi

    if [ -z "$full_name" ]; then
      if command -v gh_retry >/dev/null 2>&1; then
        gh_repo_view="$(gh_retry repo view --json nameWithOwner -q '.nameWithOwner')"
      else
        gh_repo_view="$(gh repo view --json nameWithOwner -q '.nameWithOwner')"
      fi
      full_name="$(sps_normalize_github_repo "$gh_repo_view")"
    fi
  fi

  if [ -z "$full_name" ]; then
    echo "Error: Could not resolve target GitHub repository. Set SPS_TARGET_REPO=owner/name or configure remote.origin.url." >&2
    return 1
  fi

  SPS_REPO_FULL_NAME="$full_name"
  SPS_REPO_OWNER="${full_name%%/*}"
  SPS_REPO_NAME="${full_name#*/}"
  SPS_REPO_URL="https://github.com/$SPS_REPO_FULL_NAME"
  GH_REPO="$SPS_REPO_FULL_NAME"

  export SPS_REPO_FULL_NAME
  export SPS_REPO_OWNER
  export SPS_REPO_NAME
  export SPS_REPO_URL
  export GH_REPO
}

if [ "${BASH_SOURCE[0]}" = "$0" ]; then
  sps_resolve_repo_context
  printf "%s\n" "$SPS_REPO_FULL_NAME"
fi
