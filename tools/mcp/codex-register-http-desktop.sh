#!/usr/bin/env bash
set -euo pipefail

name="sps-mcp"
url="${MCP_URL:-http://127.0.0.1:3001/mcp}"
config_file="${CODEX_HOME:-$HOME/.codex}/config.toml"

if ! command -v codex >/dev/null 2>&1; then
  echo "codex CLI is required to register MCP servers." >&2
  exit 1
fi

toml_escape() {
  local value="$1"
  value="${value//\\/\\\\}"
  value="${value//\"/\\\"}"
  printf "%s" "$value"
}

secret="${RBAC_SECRET_KEY:-}"
if [ -z "$secret" ]; then
  printf "RBAC_SECRET_KEY: " >&2
  IFS= read -r -s secret
  printf "\n" >&2
fi

if [ -z "$secret" ]; then
  echo "RBAC_SECRET_KEY is required." >&2
  exit 1
fi

codex mcp remove "$name" >/dev/null 2>&1 || true
codex mcp add "$name" --url "$url"

escaped_url="$(toml_escape "$url")"
escaped_secret="$(toml_escape "$secret")"
perl -0pi -e 's/\n\[mcp_servers\.sps-mcp\]\n(?:(?!\n\[).)*//s' "$config_file"
printf '\n[mcp_servers.sps-mcp]\nurl = "%s"\nhttp_headers = { "X-RBAC-SECRET-KEY" = "%s" }\n' "$escaped_url" "$escaped_secret" >>"$config_file"

codex mcp get "$name"
