#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

COMMAND="${1:-status}"
QUIET="${2:-}"
PROJECT_ROOT="$(pwd)"
STATE_DIR="$PROJECT_ROOT/.ollama"
PID_FILE="$STATE_DIR/ollama.pid"
LOG_FILE="$STATE_DIR/ollama.log"
OLLAMA_MODELS_PATH=""
OLLAMA_BIN="${OLLAMA_BIN:-}"

get_available_port() {
  START=$1

  while nc -z localhost "$START"; do
    START=$((START + 1))
  done

  echo "$START"
}

upsert_env() {
  local key="$1"
  local value="$2"
  local tmp_file=".env.tmp.$$"

  if grep -q "^$key=" .env; then
    awk -v key="$key" -v value="$value" '
      BEGIN { done = 0 }
      $0 ~ "^" key "=" {
        if (done == 0) {
          print key "=" value
          done = 1
        }
        next
      }
      { print }
      END {
        if (done == 0) {
          print key "=" value
        }
      }
    ' .env > "$tmp_file"
    mv "$tmp_file" .env
  else
    echo "$key=$value" >> .env
  fi

  export "$key=$value"
}

ensure_env_file() {
  if [ ! -f .env ]; then
    bash ./create_env.sh
  fi

  set -a
  . .env
  set +a

  if [ -z "${OLLAMA_PORT:-}" ]; then
    if [ -n "${OLLAMA_URL:-}" ]; then
      OLLAMA_PORT="$(printf "%s" "$OLLAMA_URL" | sed -E 's#^https?://[^:]+:([0-9]+).*#\1#')"
    fi

    if [ -z "${OLLAMA_PORT:-}" ] || [ "$OLLAMA_PORT" = "$OLLAMA_URL" ]; then
      OLLAMA_PORT="$(get_available_port 11434)"
    fi

    upsert_env "OLLAMA_PORT" "$OLLAMA_PORT"
  fi

  if [ -z "${OLLAMA_URL:-}" ]; then
    OLLAMA_URL="http://localhost:$OLLAMA_PORT"
    upsert_env "OLLAMA_URL" "$OLLAMA_URL"
  fi

  if [ -z "${OLLAMA_MODEL_IDS:-}" ]; then
    OLLAMA_MODEL_IDS="${OLLAMA_MODELS:-nomic-embed-text,qwen3:1.7b}"
    upsert_env "OLLAMA_MODEL_IDS" "$OLLAMA_MODEL_IDS"
  fi

  if [ -z "${OLLAMA_MODELS_DIR:-}" ]; then
    OLLAMA_MODELS_DIR=".ollama/models"
    upsert_env "OLLAMA_MODELS_DIR" "$OLLAMA_MODELS_DIR"
  fi
}

is_running() {
  local pid
  pid="$(get_running_pid || true)"

  if [ -n "$pid" ]; then
    return 0
  fi

  curl -fsS "$OLLAMA_URL/api/tags" >/dev/null 2>&1
}

get_running_pid() {
  if [ -f "$PID_FILE" ]; then
    local pid
    pid="$(cat "$PID_FILE")"

    if [ -n "$pid" ] && kill -0 "$pid" >/dev/null 2>&1; then
      echo "$pid"
      return 0
    fi
  fi

  if command -v lsof >/dev/null 2>&1; then
    lsof -tiTCP:"$OLLAMA_PORT" -sTCP:LISTEN 2>/dev/null | head -n 1
    return 0
  fi

  return 1
}

resolve_models_dir() {
  mkdir -p "$STATE_DIR" "$OLLAMA_MODELS_DIR"
  OLLAMA_MODELS_PATH="$(cd "$OLLAMA_MODELS_DIR" && pwd)"
}

model_exists() {
  local model_id="$1"
  local model_name="$model_id"
  local models_json

  if [[ "$model_name" != *":"* ]]; then
    model_name="$model_name:latest"
  fi

  models_json="$(curl -fsS "$OLLAMA_URL/api/tags" 2>/dev/null || true)"

  if [ -z "$models_json" ]; then
    return 1
  fi

  printf "%s" "$models_json" | grep -F "\"name\":\"$model_name\"" >/dev/null 2>&1 ||
    printf "%s" "$models_json" | grep -F "\"model\":\"$model_name\"" >/dev/null 2>&1
}

ensure_free_project_port() {
  if is_running; then
    return 0
  fi

  if nc -z localhost "$OLLAMA_PORT" >/dev/null 2>&1; then
    local next_port
    next_port="$(get_available_port "$((OLLAMA_PORT + 1))")"

    OLLAMA_PORT="$next_port"
    OLLAMA_URL="http://localhost:$OLLAMA_PORT"

    upsert_env "OLLAMA_PORT" "$OLLAMA_PORT"
    upsert_env "OLLAMA_URL" "$OLLAMA_URL"

    echo "Configured Ollama port was busy. Using $OLLAMA_PORT for this project."
  fi
}

wait_until_ready() {
  for _ in $(seq 1 60); do
    if ! is_running; then
      echo "Ollama exited before becoming ready. See $LOG_FILE"

      if [ -f "$LOG_FILE" ]; then
        tail -n 20 "$LOG_FILE"
      fi

      return 1
    fi

    if curl -fsS "$OLLAMA_URL/api/tags" >/dev/null 2>&1; then
      return 0
    fi

    sleep 1
  done

  echo "Ollama did not become ready at $OLLAMA_URL. See $LOG_FILE"
  return 1
}

require_ollama() {
  if [ -n "$OLLAMA_BIN" ] && [ -x "$OLLAMA_BIN" ]; then
    return 0
  fi

  if [ -x /Applications/Ollama.app/Contents/Resources/ollama ]; then
    OLLAMA_BIN="/Applications/Ollama.app/Contents/Resources/ollama"
    return 0
  fi

  if command -v ollama >/dev/null 2>&1; then
    OLLAMA_BIN="$(command -v ollama)"
    return 0
  fi

  echo "Ollama CLI is required for native project-local Ollama."
  echo "Install it with: brew install ollama"
  echo "Or run with: OLLAMA_BIN=/path/to/ollama npm run llm:ollama:start"
  echo "After that, run: npm run llm:ollama:start"
  return 1
}

pull_models() {
  printf "%s\n" "${OLLAMA_MODEL_IDS:-nomic-embed-text,qwen3:1.7b}" |
    tr ',' '\n' |
    while IFS= read -r model_id; do
      model_id="$(printf "%s" "$model_id" | xargs)"

      if [ -z "$model_id" ]; then
        continue
      fi

      if model_exists "$model_id"; then
        echo "Ollama model already present: $model_id"
        continue
      fi

      OLLAMA_HOST="127.0.0.1:$OLLAMA_PORT" \
        OLLAMA_MODELS="$OLLAMA_MODELS_PATH" \
        "$OLLAMA_BIN" pull "$model_id"
    done
}

ensure_env_file

case "$COMMAND" in
  start)
    if is_running; then
      pid="$(get_running_pid || true)"

      if [ -n "$pid" ]; then
        echo "Ollama already running for this project: pid $pid, $OLLAMA_URL"
      else
        echo "Ollama already reachable for this project: $OLLAMA_URL"
      fi
      exit 0
    fi

    require_ollama
    ensure_free_project_port
    resolve_models_dir

    OLLAMA_HOST="127.0.0.1:$OLLAMA_PORT" \
      OLLAMA_MODELS="$OLLAMA_MODELS_PATH" \
      nohup "$OLLAMA_BIN" serve > "$LOG_FILE" 2>&1 &

    echo "$!" > "$PID_FILE"
    echo "Started Ollama for this project: pid $(cat "$PID_FILE"), $OLLAMA_URL"
    if ! wait_until_ready; then
      pid="$(cat "$PID_FILE")"
      kill "$pid" >/dev/null 2>&1 || true
      rm -f "$PID_FILE"
      exit 1
    fi

    if [ "${OLLAMA_AUTO_PULL:-false}" = "true" ]; then
      pull_models
    fi
    ;;

  stop)
    if ! is_running; then
      echo "Ollama is not running for this project."
      rm -f "$PID_FILE"
      exit 0
    fi

    pid="$(get_running_pid || true)"

    if [ -z "$pid" ]; then
      echo "Ollama is reachable but no managed process id was found for $OLLAMA_URL."
      echo "Stop it manually or remove the external process listening on $OLLAMA_PORT."
      exit 1
    fi

    kill "$pid"

    for _ in $(seq 1 20); do
      if ! kill -0 "$pid" >/dev/null 2>&1; then
        break
      fi

      sleep 0.5
    done

    if kill -0 "$pid" >/dev/null 2>&1; then
      echo "Ollama did not stop after SIGTERM. Leaving pid file in place: $PID_FILE"
      exit 1
    fi

    rm -f "$PID_FILE"
    echo "Stopped Ollama for this project."
    ;;

  status)
    if is_running; then
      if [ "$QUIET" != "--quiet" ]; then
        pid="$(get_running_pid || true)"

        if [ -n "$pid" ]; then
          echo "Ollama is running for this project: pid $pid, $OLLAMA_URL"
        else
          echo "Ollama is reachable for this project: $OLLAMA_URL"
        fi
      fi
      exit 0
    fi

    if [ "$QUIET" != "--quiet" ]; then
      echo "Ollama is not running for this project."
      exit 0
    fi

    exit 1
    ;;

  pull)
    require_ollama

    if ! is_running; then
      echo "Ollama is not running for this project. Run npm run llm:ollama:start first."
      exit 1
    fi

    resolve_models_dir
    pull_models
    ;;

  logs)
    if [ ! -f "$LOG_FILE" ]; then
      echo "No Ollama log file yet: $LOG_FILE"
      echo "Run npm run llm:ollama:start first."
      exit 0
    fi

    echo "Tailing project Ollama log: $LOG_FILE"
    tail -n "${OLLAMA_LOG_LINES:-80}" -f "$LOG_FILE"
    ;;

  *)
    echo "Usage: $0 start|stop|status|pull|logs"
    exit 1
    ;;
esac
