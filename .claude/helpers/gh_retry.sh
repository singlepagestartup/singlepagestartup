#!/bin/bash
# Retry and preflight helpers for GitHub CLI calls.

is_gh_retryable_error() {
  local error_text="$1"

  echo "$error_text" | grep -qiE \
    'error connecting to api\.github\.com|connection reset|connection refused|timeout|timed out|temporary failure|tls handshake timeout|502 bad gateway|503 service unavailable|504 gateway timeout'
}

print_gh_retry_guidance() {
  local error_text="$1"

  if is_gh_retryable_error "$error_text"; then
    printf "%s\n" \
      "Hint: if this helper is running inside a sandboxed Codex/Claude session, rerun it with elevated permissions so gh can reach GitHub." >&2
  fi
}

gh_retry() {
  local max_attempts="${GH_RETRY_MAX_ATTEMPTS:-5}"
  local base_delay_seconds="${GH_RETRY_BASE_DELAY_SECONDS:-1}"
  local attempt=1
  local output
  # Use a non-reserved name: in zsh, "status" is readonly.
  local exit_code=0

  while true; do
    if output=$(gh "$@" 2>&1); then
      printf "%s" "$output"
      return 0
    fi

    exit_code=$?

    if ! is_gh_retryable_error "$output"; then
      printf "%s\n" "$output" >&2
      return "$exit_code"
    fi

    if [ "$attempt" -ge "$max_attempts" ]; then
      printf "%s\n" "$output" >&2
      print_gh_retry_guidance "$output"
      return "$exit_code"
    fi

    local sleep_seconds=$((base_delay_seconds * (2 ** (attempt - 1))))
    echo "gh transient failure (attempt $attempt/$max_attempts), retrying in ${sleep_seconds}s..." >&2
    sleep "$sleep_seconds"
    attempt=$((attempt + 1))
  done
}

ensure_gh_ready() {
  if [ "${GH_SKIP_PREFLIGHT:-0}" = "1" ]; then
    return 0
  fi

  if [ "${GH_PREFLIGHT_DONE:-0}" = "1" ]; then
    return 0
  fi

  gh_retry api rate_limit >/dev/null
  GH_PREFLIGHT_DONE=1
  export GH_PREFLIGHT_DONE
}
