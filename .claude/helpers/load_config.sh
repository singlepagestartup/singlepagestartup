#!/usr/bin/env bash
# Load Claude Code project configuration
# Source: .claude/.env
# Returns: GITHUB_LOGIN, GITHUB_OWNER, GITHUB_PROJECT_NUMBER, GITHUB_PROJECT_OWNER_TYPE,
#          SPS_REPO_*, TARGET_REPO_*, GH_REPO

if [ -n "${BASH_SOURCE[0]:-}" ]; then
  LOAD_CONFIG_SOURCE_PATH="${BASH_SOURCE[0]}"
else
  LOAD_CONFIG_REPO_ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"

  if [ -d "$LOAD_CONFIG_REPO_ROOT/.claude/helpers" ]; then
    LOAD_CONFIG_SOURCE_PATH="$LOAD_CONFIG_REPO_ROOT/.claude/helpers/load_config.sh"
  else
    LOAD_CONFIG_SOURCE_PATH="$0"
  fi
fi

if [ -z "${LOAD_CONFIG_SOURCE_PATH:-}" ] || [ "$LOAD_CONFIG_SOURCE_PATH" = "bash" ] || [ "$LOAD_CONFIG_SOURCE_PATH" = "zsh" ]; then
  echo "Error: Could not resolve load_config.sh path. Run from the repo root or execute the helper chain inside bash -lc." >&2
  return 1 2>/dev/null || exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "$LOAD_CONFIG_SOURCE_PATH")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"
GH_RETRY_FILE="$SCRIPT_DIR/gh_retry.sh"
REPO_CONTEXT_FILE="$SCRIPT_DIR/repo_context.sh"

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: Missing GitHub project config at $ENV_FILE" >&2
  return 1 2>/dev/null || exit 1
fi

if [ ! -f "$GH_RETRY_FILE" ]; then
  echo "Error: Missing helper script at $GH_RETRY_FILE" >&2
  return 1 2>/dev/null || exit 1
fi

if [ ! -f "$REPO_CONTEXT_FILE" ]; then
  echo "Error: Missing helper script at $REPO_CONTEXT_FILE" >&2
  return 1 2>/dev/null || exit 1
fi

# Load the config
# shellcheck source=/dev/null
source "$ENV_FILE"
# shellcheck source=/dev/null
source "$GH_RETRY_FILE"
ensure_gh_ready || return 1 2>/dev/null || exit 1
# shellcheck source=/dev/null
source "$REPO_CONTEXT_FILE"
resolve_repo_context || return 1 2>/dev/null || exit 1

# Get authenticated user for user-owned Projects.
GITHUB_AUTH_LOGIN=$(gh_retry api user -q '.login') || return 1 2>/dev/null || exit 1
GITHUB_LOGIN="$GITHUB_AUTH_LOGIN"

# Use configured values or defaults
GITHUB_PROJECT_OWNER_TYPE="${GITHUB_PROJECT_OWNER_TYPE:-user}"
if [ -n "${GITHUB_PROJECT_OWNER:-}" ]; then
  GITHUB_OWNER="$GITHUB_PROJECT_OWNER"
elif [ "$GITHUB_PROJECT_OWNER_TYPE" = "organization" ]; then
  GITHUB_OWNER="$TARGET_REPO_OWNER"
else
  GITHUB_OWNER="$GITHUB_AUTH_LOGIN"
fi

if [ "$GITHUB_PROJECT_OWNER_TYPE" = "user" ]; then
  GITHUB_PROJECT_CLI_OWNER="@me"
else
  GITHUB_PROJECT_CLI_OWNER="$GITHUB_OWNER"
fi

# Export variables
export GITHUB_LOGIN
export GITHUB_AUTH_LOGIN
export GITHUB_OWNER
export GITHUB_PROJECT_OWNER_TYPE
export GITHUB_PROJECT_CLI_OWNER
export GITHUB_PROJECT_NUMBER
export SPS_REPO_FULL_NAME
export SPS_REPO_OWNER
export SPS_REPO_NAME
export SPS_REPO_URL
export TARGET_REPO_FULL_NAME
export TARGET_REPO_OWNER
export TARGET_REPO_NAME
export TARGET_REPO_URL
export GH_REPO

unset LOAD_CONFIG_SOURCE_PATH
unset LOAD_CONFIG_REPO_ROOT
unset ENV_FILE
unset GH_RETRY_FILE
unset REPO_CONTEXT_FILE
