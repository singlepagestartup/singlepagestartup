#!/bin/bash
# Load Claude Code project configuration
# Source: .claude/.env
# Returns: GITHUB_LOGIN, GITHUB_OWNER, GITHUB_PROJECT_NUMBER, GITHUB_PROJECT_OWNER_TYPE

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Load the config
source "$SCRIPT_DIR/../.env"
source "$SCRIPT_DIR/gh_retry.sh"
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
