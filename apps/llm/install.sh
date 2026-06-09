#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")"

MODE="${1:-}"

is_macos() {
  [ "$(uname -s)" = "Darwin" ]
}

has_brew() {
  command -v brew >/dev/null 2>&1
}

is_supported_python() {
  "$1" - <<'PY'
import sys
raise SystemExit(0 if sys.version_info[:2] in {(3, 11), (3, 12)} else 1)
PY
}

python_version() {
  "$1" - <<'PY'
import sys
print(f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")
PY
}

find_python() {
  if [ -n "${PYTHON_BIN:-}" ]; then
    if command -v "$PYTHON_BIN" >/dev/null 2>&1 && is_supported_python "$PYTHON_BIN"; then
      command -v "$PYTHON_BIN"
      return 0
    fi

    echo "PYTHON_BIN must point to Python 3.11 or 3.12. Got: ${PYTHON_BIN}" >&2
    return 1
  fi

  for candidate in python3.12 python3.11; do
    if command -v "$candidate" >/dev/null 2>&1 && is_supported_python "$candidate"; then
      command -v "$candidate"
      return 0
    fi
  done

  echo "Python 3.11 or 3.12 is required for apps/llm requirements." >&2
  echo "Install python3.12/python3.11 or run with PYTHON_BIN=/path/to/python." >&2
  return 1
}

ensure_python() {
  local python_path

  if python_path="$(find_python 2>/dev/null)"; then
    echo "$python_path"
    return 0
  fi

  if [ -n "${PYTHON_BIN:-}" ]; then
    find_python
    return 1
  fi

  if is_macos && has_brew; then
    echo "Python 3.11/3.12 was not found. Installing python@3.12 with Homebrew..." >&2
    brew install python@3.12 >&2
  fi

  find_python
}

ensure_ffmpeg() {
  if command -v ffmpeg >/dev/null 2>&1; then
    return 0
  fi

  if [ "${LLM_INSTALL_FFMPEG:-true}" = "false" ]; then
    echo "ffmpeg is not installed. Audio transcription endpoints may fail."
    return 0
  fi

  if is_macos && has_brew; then
    echo "Installing ffmpeg with Homebrew..."
    brew install ffmpeg
    return 0
  fi

  echo "ffmpeg is not installed. Install it manually for audio transcription support."
}

has_ollama_app_runtime() {
  [ -x /Applications/Ollama.app/Contents/Resources/ollama ] &&
    [ -x /Applications/Ollama.app/Contents/Resources/llama-server ]
}

ensure_ollama() {
  if [ "${LLM_INSTALL_OLLAMA:-true}" = "false" ]; then
    if [ -n "${OLLAMA_BIN:-}" ] && [ -x "$OLLAMA_BIN" ]; then
      return 0
    fi

    if command -v ollama >/dev/null 2>&1; then
      return 0
    fi

    echo "Ollama is not installed. Set LLM_INSTALL_OLLAMA=true or install Ollama manually."
    return 1
  fi

  if is_macos; then
    if ! has_ollama_app_runtime; then
      if ! has_brew; then
        echo "Ollama.app is required on macOS, but Homebrew is not available."
        echo "Install Ollama from https://ollama.com/download or set OLLAMA_BIN=/path/to/ollama."
        return 1
      fi

      echo "Installing Ollama.app with Homebrew..."
      if brew list --cask ollama-app >/dev/null 2>&1; then
        brew reinstall --cask ollama-app
      else
        brew install --cask ollama-app
      fi
    fi

    if has_ollama_app_runtime; then
      return 0
    fi

    if [ -n "${OLLAMA_BIN:-}" ] && [ -x "$OLLAMA_BIN" ]; then
      return 0
    fi

    echo "Ollama.app is installed incorrectly: llama-server was not found."
    return 1
  fi

  if [ -n "${OLLAMA_BIN:-}" ] && [ -x "$OLLAMA_BIN" ]; then
    return 0
  fi

  if command -v ollama >/dev/null 2>&1; then
    return 0
  fi

  echo "Ollama CLI is required. Install it or set OLLAMA_BIN=/path/to/ollama."
  return 1
}

STARTED_OLLAMA_FOR_INSTALL=false

cleanup_ollama_for_install() {
  if [ "$STARTED_OLLAMA_FOR_INSTALL" = "true" ]; then
    bash ./ollama.sh stop >/dev/null 2>&1 || true
    STARTED_OLLAMA_FOR_INSTALL=false
  fi
}

ensure_ollama_models() {
  ensure_ollama

  if bash ./ollama.sh status --quiet; then
    echo "Using running project Ollama for model pull."
  else
    bash ./ollama.sh start
    STARTED_OLLAMA_FOR_INSTALL=true
  fi

  trap cleanup_ollama_for_install EXIT
  bash ./ollama.sh pull
  cleanup_ollama_for_install
  trap - EXIT
}

if [ "$MODE" = "--check" ]; then
  PYTHON_PATH="$(find_python)"
  echo "Selected Python: $PYTHON_PATH ($(python_version "$PYTHON_PATH"))"

  if [ -x .venv/bin/python ]; then
    echo "Existing venv Python: $(python_version .venv/bin/python)"
  else
    echo "Existing venv Python: none"
  fi

  if command -v ffmpeg >/dev/null 2>&1; then
    echo "ffmpeg: $(command -v ffmpeg)"
  else
    echo "ffmpeg: missing"
  fi

  if has_ollama_app_runtime; then
    echo "Ollama runtime: /Applications/Ollama.app/Contents/Resources/ollama"
  elif command -v ollama >/dev/null 2>&1; then
    echo "Ollama runtime: $(command -v ollama)"
  else
    echo "Ollama runtime: missing"
  fi

  exit 0
fi

if [ ! -f .env ]; then
  bash ./create_env.sh
fi

if [ -x .venv/bin/python ] && ! is_supported_python .venv/bin/python; then
  echo "Existing .venv uses Python $(python_version .venv/bin/python), but apps/llm requires Python 3.11 or 3.12."
  echo "Recreating apps/llm/.venv..."
  rm -rf .venv
fi

if [ ! -d .venv ]; then
  PYTHON_PATH="$(ensure_python)"
  "$PYTHON_PATH" -m venv .venv
fi

. .venv/bin/activate

if ! is_supported_python python; then
  echo "Active venv Python $(python_version python) is not supported. Remove apps/llm/.venv and rerun npm run llm:install."
  exit 1
fi

python -m pip install -r requirements.txt

REQUIREMENTS_HASH="$(shasum -a 256 requirements.txt | awk '{print $1}')"
printf "%s" "$REQUIREMENTS_HASH" > .venv/.requirements.sha256

ensure_ffmpeg
ensure_ollama_models
