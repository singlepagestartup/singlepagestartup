#!/usr/bin/env bash
# Print the owner/name repository identity used for GitHub issue operations.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/repo_context.sh"

sps_resolve_repo_context
printf "%s\n" "$SPS_REPO_FULL_NAME"
