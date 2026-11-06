#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bun --no-env-file "$SCRIPT_DIR/client-configs.ts" "$@"
