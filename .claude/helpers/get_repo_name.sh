#!/usr/bin/env bash
# Print the short repository name used for thoughts/shared artifact namespaces.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/repo_context.sh"

sps_resolve_repo_context
printf "%s\n" "$SPS_REPO_NAME"
