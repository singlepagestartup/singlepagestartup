#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

PROJECT_NAMESPACE="${SCENARIO_PROJECT_NAMESPACE:-singlepagestartup}"

bash tools/testing/test-scenario-issue.sh "$PROJECT_NAMESPACE" 154
