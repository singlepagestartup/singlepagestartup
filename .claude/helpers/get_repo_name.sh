#!/usr/bin/env bash
# Print the short repository name used for thoughts/shared artifact namespaces.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# shellcheck source=/dev/null
source "$SCRIPT_DIR/repo_context.sh"

resolve_repo_context
printf "%s\n" "$TARGET_REPO_NAME"
