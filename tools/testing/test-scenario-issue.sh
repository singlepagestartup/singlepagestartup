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
SCENARIO_API_HOST="${SCENARIO_API_HOST:-127.0.0.1}"
PREFERRED_API_PORT="${SCENARIO_API_PORT:-4000}"
SCENARIO_REUSE_API="${SCENARIO_REUSE_API:-1}"
API_PORT="$PREFERRED_API_PORT"
API_BASE_URL="http://${SCENARIO_API_HOST}:${API_PORT}"
API_LOG_FILE="/tmp/sps-api-scenario.log"

set_api_endpoint() {
  API_PORT="$1"
  API_BASE_URL="http://${SCENARIO_API_HOST}:${API_PORT}"
  export API_SERVICE_PORT="$API_PORT"
  export API_SERVICE_URL="$API_BASE_URL"
}

is_api_ready() {
  curl --silent --output /dev/null --max-time 2 "$API_BASE_URL"
}

cleanup() {
  set +e

  if [ "$API_STARTED_BY_SCRIPT" -eq 1 ] && [ -n "$API_PID" ]; then
    kill "$API_PID" >/dev/null 2>&1 || true
    wait "$API_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT

start_api_server() {
  echo "[scenario] Starting API server on ${API_BASE_URL}..."

  (
    cd apps/api &&
      API_SERVICE_PORT="$API_PORT" API_SERVICE_URL="$API_BASE_URL" MIDDLEWARE_HTTP_CACHE="$CACHE_MIDDLEWARE_VALUE" bun run dev \
        > "$API_LOG_FILE" 2>&1
  ) &

  API_PID=$!
  API_STARTED_BY_SCRIPT=1

  echo "[scenario] Waiting for API readiness on ${API_BASE_URL}..."
  READY=0
  for _ in $(seq 1 60); do
    if is_api_ready; then
      READY=1
      break
    fi

    if ! kill -0 "$API_PID" >/dev/null 2>&1; then
      break
    fi

    sleep 1
  done

  if [ "$READY" -eq 1 ]; then
    return 0
  fi

  if [ -n "$API_PID" ]; then
    kill "$API_PID" >/dev/null 2>&1 || true
    wait "$API_PID" 2>/dev/null || true
  fi

  API_PID=""
  API_STARTED_BY_SCRIPT=0

  return 1
}

if [ "${SCENARIO_BOOTSTRAP_INFRA:-0}" = "1" ]; then
  echo "[scenario] Bootstrapping infrastructure via ./up.sh ..."
  ./up.sh
fi

set_api_endpoint "$PREFERRED_API_PORT"

if [ "$SCENARIO_REUSE_API" = "1" ] && is_api_ready; then
  echo "[scenario] Reusing running API on ${API_BASE_URL}"
else
  STARTED=0
  for CANDIDATE_PORT in "$PREFERRED_API_PORT" 4001 4002 4003 4004 4005 4010 4100; do
    set_api_endpoint "$CANDIDATE_PORT"

    if is_api_ready; then
      if [ "$SCENARIO_REUSE_API" = "1" ]; then
        echo "[scenario] Reusing running API on ${API_BASE_URL}"
        STARTED=1
        break
      fi

      echo "[scenario] Port ${API_PORT} already has a running API; trying next port for isolated scenario run..."
      continue
    fi

    if start_api_server; then
      STARTED=1
      break
    fi

    if grep -q "EADDRINUSE" "$API_LOG_FILE"; then
      echo "[scenario] Port ${API_PORT} is in use, trying next port..."
      continue
    fi

    echo "[scenario] API did not become ready. Last log lines:"
    tail -n 80 "$API_LOG_FILE" || true
    exit 1
  done

  if [ "$STARTED" -ne 1 ]; then
    echo "[scenario] Could not start or reuse API server on candidate ports"
    tail -n 80 "$API_LOG_FILE" || true
    exit 1
  fi
fi

HTTP_CACHE_STATUS="$(
  curl --silent --output /tmp/sps-api-scenario-cache-check.log \
    --write-out "%{http_code}" \
    --max-time 5 \
    "$API_BASE_URL/api/http-cache/clear" || true
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
SCENARIO_TEST_FILES=()
while IFS= read -r scenario_test_file; do
  SCENARIO_TEST_FILES+=("$scenario_test_file")
done < <(
  find "$ISSUE_DIR" -type f \( -name "*.scenario.spec.ts" -o -name "*.scenario.spec.tsx" \) | sort
)

if [ "${#SCENARIO_TEST_FILES[@]}" -eq 0 ]; then
  echo "[scenario] No scenario spec files found in: $ISSUE_DIR"
  exit 1
fi

npx jest --config apps/api/jest.scenario.config.ts --runInBand --runTestsByPath "${SCENARIO_TEST_FILES[@]}"
