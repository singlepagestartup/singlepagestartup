#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  bash ./create_env.sh
fi

if [ "${1:-}" = "--check" ]; then
  . .venv/bin/activate 2>/dev/null || true

  if [ -x .venv/bin/python ]; then
    python --version
  else
    echo "apps/llm/.venv is missing. Run npm run llm:install first."
    exit 1
  fi

  if python -c "import uvicorn" >/dev/null 2>&1; then
    echo "uvicorn ok"
  else
    echo "Python dependencies are not installed. Run npm run llm:install first."
    exit 1
  fi

  bash ./ollama.sh status || true
  echo "LLM dev command is ready."
  exit 0
fi

if [ ! -x .venv/bin/python ]; then
  echo "apps/llm/.venv is missing. Run npm run llm:install first."
  exit 1
fi

STARTED_OLLAMA=false
OLLAMA_LOGS_PID=""

if [ "${LLM_START_OLLAMA:-true}" != "false" ]; then
  if bash ./ollama.sh status --quiet; then
    STARTED_OLLAMA=false
  else
    bash ./ollama.sh start
    STARTED_OLLAMA=true
  fi
fi

cleanup() {
  if [ -n "$OLLAMA_LOGS_PID" ] &&
    kill -0 "$OLLAMA_LOGS_PID" >/dev/null 2>&1; then
    kill "$OLLAMA_LOGS_PID" >/dev/null 2>&1 || true
  fi

  if [ "$STARTED_OLLAMA" = "true" ] &&
    [ "${LLM_STOP_OLLAMA_ON_EXIT:-true}" != "false" ]; then
    bash ./ollama.sh stop
  fi
}

trap cleanup EXIT INT TERM

if [ "${LLM_START_OLLAMA:-true}" != "false" ] &&
  [ "${LLM_TAIL_OLLAMA_LOGS:-true}" != "false" ]; then
  bash ./ollama.sh logs &
  OLLAMA_LOGS_PID="$!"
fi

. .venv/bin/activate

if ! python - <<'PY'
import sys
raise SystemExit(0 if sys.version_info[:2] in {(3, 11), (3, 12)} else 1)
PY
then
  echo "apps/llm/.venv must use Python 3.11 or 3.12. Run npm run llm:install."
  exit 1
fi

if ! python -c "import uvicorn" >/dev/null 2>&1; then
  echo "Python dependencies are not installed. Run npm run llm:install first."
  exit 1
fi

if ! command -v ffmpeg >/dev/null 2>&1; then
  echo "Warning: ffmpeg is not installed. Audio transcription endpoints may fail."
fi

set -a
. .env
set +a

python -m uvicorn main:app --host "${LLM_HOST:-0.0.0.0}" --port "${LLM_PORT:-8765}" --reload
