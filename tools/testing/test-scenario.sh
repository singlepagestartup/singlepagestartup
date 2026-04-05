#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

PROJECT_NAMESPACE="${SCENARIO_PROJECT_NAMESPACE:-singlepagestartup}"
SCENARIO_ROOT="apps/api/specs/scenario/${PROJECT_NAMESPACE}"

if [ ! -d "$SCENARIO_ROOT" ]; then
  echo "[scenario] Scenario namespace not found: $SCENARIO_ROOT"
  exit 1
fi

ISSUE_DIRS="$(find "$SCENARIO_ROOT" -maxdepth 1 -mindepth 1 -type d -name "issue-*" | sort)"

if [ -z "$ISSUE_DIRS" ]; then
  echo "[scenario] No issue scenarios found in $SCENARIO_ROOT"
  exit 1
fi

while IFS= read -r ISSUE_DIR; do
  [ -z "$ISSUE_DIR" ] && continue
  ISSUE_NUMBER="${ISSUE_DIR##*/issue-}"
  bash tools/testing/test-scenario-issue.sh "$PROJECT_NAMESPACE" "$ISSUE_NUMBER"
done <<< "$ISSUE_DIRS"
