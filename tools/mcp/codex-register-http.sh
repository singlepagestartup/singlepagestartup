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

codex mcp remove "$name" >/dev/null 2>&1 || true
codex mcp add "$name" --url "$url"

escaped_url="$(toml_escape "$url")"
perl -0pi -e 's/\n\[mcp_servers\.sps-mcp\]\n(?:(?!\n\[).)*//s' "$config_file"
printf '\n[mcp_servers.sps-mcp]\nurl = "%s"\nenv_http_headers = { "X-RBAC-SECRET-KEY" = "RBAC_SECRET_KEY" }\n' "$escaped_url" >>"$config_file"

codex mcp get "$name"
