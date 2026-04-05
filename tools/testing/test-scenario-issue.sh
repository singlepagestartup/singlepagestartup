#!/bin/bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

PROJECT_NAMESPACE="${1:-}"
ISSUE_NUMBER="${2:-}"

if [ -z "$PROJECT_NAMESPACE" ] || [ -z "$ISSUE_NUMBER" ]; then
  echo "Usage: bash tools/testing/test-scenario-issue.sh <project-namespace> <issue-number>"
  echo "Example: bash tools/testing/test-scenario-issue.sh singlepagestartup 152"
  exit 1
fi

ISSUE_DIR="apps/api/specs/scenario/${PROJECT_NAMESPACE}/issue-${ISSUE_NUMBER}"

if [ ! -d "$ISSUE_DIR" ]; then
  echo "[scenario] Scenario directory not found: $ISSUE_DIR"
  exit 1
fi

API_PID=""
API_STARTED_BY_SCRIPT=0
CACHE_MIDDLEWARE_VALUE="${MIDDLEWARE_HTTP_CACHE:-true}"

cleanup() {
  set +e

  if [ "$API_STARTED_BY_SCRIPT" -eq 1 ] && [ -n "$API_PID" ]; then
    kill "$API_PID" >/dev/null 2>&1 || true
    wait "$API_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

if [ "${SCENARIO_BOOTSTRAP_INFRA:-0}" = "1" ]; then
  echo "[scenario] Bootstrapping infrastructure via ./up.sh ..."
  ./up.sh
fi

if curl --silent --output /dev/null --max-time 2 http://127.0.0.1:4000; then
  echo "[scenario] Reusing running API on http://127.0.0.1:4000"
else
  echo "[scenario] Starting API server..."
  (
    cd apps/api &&
      MIDDLEWARE_HTTP_CACHE="$CACHE_MIDDLEWARE_VALUE" bun run dev \
        > /tmp/sps-api-scenario.log 2>&1
  ) &
  API_PID=$!
  API_STARTED_BY_SCRIPT=1

  echo "[scenario] Waiting for API readiness..."
  READY=0
  for _ in $(seq 1 60); do
    if curl --silent --output /dev/null --max-time 2 http://127.0.0.1:4000; then
      READY=1
      break
    fi
    sleep 1
  done

  if [ "$READY" -ne 1 ]; then
    echo "[scenario] API did not become ready. Last log lines:"
    tail -n 80 /tmp/sps-api-scenario.log || true
    exit 1
  fi
fi

HTTP_CACHE_STATUS="$(
  curl --silent --output /tmp/sps-api-scenario-cache-check.log \
    --write-out "%{http_code}" \
    --max-time 5 \
    http://127.0.0.1:4000/api/http-cache/clear || true
)"

if [ "$HTTP_CACHE_STATUS" != "200" ]; then
  echo "[scenario] HTTP cache middleware preflight failed."
  echo "[scenario] Expected GET /api/http-cache/clear to return 200, got: $HTTP_CACHE_STATUS"
  echo "[scenario] If API is already running, restart it with MIDDLEWARE_HTTP_CACHE=true."
  echo "[scenario] Last response body:"
  cat /tmp/sps-api-scenario-cache-check.log || true
  exit 1
fi

if [ "${SCENARIO_ENSURE_SUBJECT:-0}" = "1" ]; then
  echo "[scenario] Ensuring fixed RBAC subject from apps/api/.env..."
  (cd apps/api && bash create_rbac_subject.sh)
else
  echo "[scenario] Skipping subject create/delete; using fixed RBAC creds from apps/api/.env"
fi

echo "[scenario] Running DB-backed scenario suite for ${PROJECT_NAMESPACE}/issue-${ISSUE_NUMBER}..."
NX_DAEMON=false NX_ISOLATE_PLUGINS=false nx run api:jest:scenario --runInBand --testPathPattern="$ISSUE_DIR"
