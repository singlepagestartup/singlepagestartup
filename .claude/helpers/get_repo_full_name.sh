#!/usr/bin/env bash
# Print the owner/name repository identity used for GitHub issue operations.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/repo_context.sh"

target_resolve_repo_context
printf "%s\n" "$TARGET_REPO_FULL_NAME"
