#!/usr/bin/env bash
# Load Claude Code project configuration
# Source: .claude/.env
# Returns: GITHUB_LOGIN, GITHUB_OWNER, GITHUB_PROJECT_NUMBER, GITHUB_PROJECT_OWNER_TYPE

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

if [ ! -f "$ENV_FILE" ]; then
  echo "Error: Missing GitHub project config at $ENV_FILE" >&2
  return 1 2>/dev/null || exit 1
fi

if [ ! -f "$GH_RETRY_FILE" ]; then
  echo "Error: Missing helper script at $GH_RETRY_FILE" >&2
  return 1 2>/dev/null || exit 1
fi

# Load the config
# shellcheck source=/dev/null
source "$ENV_FILE"
# shellcheck source=/dev/null
source "$GH_RETRY_FILE"
ensure_gh_ready

# Get auto-detected values
GITHUB_LOGIN=$(gh_retry repo view --json owner -q '.owner.login')

# Use configured values or defaults
GITHUB_OWNER="${GITHUB_PROJECT_OWNER:-$GITHUB_LOGIN}"
GITHUB_PROJECT_OWNER_TYPE="${GITHUB_PROJECT_OWNER_TYPE:-user}"

# Export variables
export GITHUB_LOGIN
export GITHUB_OWNER
export GITHUB_PROJECT_OWNER_TYPE
export GITHUB_PROJECT_NUMBER

unset LOAD_CONFIG_SOURCE_PATH
unset LOAD_CONFIG_REPO_ROOT
unset ENV_FILE
unset GH_RETRY_FILE
