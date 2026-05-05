#!/usr/bin/env bash
set -euo pipefail

name="${SPS_MCP_NAME:-sps-mcp}"
url="${SPS_MCP_URL:-http://127.0.0.1:3001/mcp}"
token_env="${SPS_MCP_BEARER_TOKEN_ENV:-SPS_JWT}"

if ! command -v codex >/dev/null 2>&1; then
  echo "codex CLI is required to register MCP servers." >&2
  exit 1
fi

codex mcp remove "$name" >/dev/null 2>&1 || true
codex mcp add "$name" --url "$url" --bearer-token-env-var "$token_env"
codex mcp get "$name"
