#!/usr/bin/env bash
set -euo pipefail

config_file=".codex/config.toml"

remote_url="$(git remote get-url origin 2>/dev/null || true)"
if [ -n "$remote_url" ]; then
  server_name="$(basename "$remote_url")"
  server_name="${server_name%.git}"
else
  server_name="$(node -p "require('./package.json').name" 2>/dev/null || true)"
fi

if [ -z "$server_name" ]; then
  echo "Cannot determine MCP server name from git origin or package.json." >&2
  exit 1
fi

if [ ! -f "$config_file" ]; then
  echo "Missing $config_file. Run this command from the repository root." >&2
  exit 1
fi

if ! grep -q "^\[mcp_servers\\.$server_name\]" "$config_file"; then
  echo "Missing [mcp_servers.$server_name] in $config_file." >&2
  echo "MCP server name should match the GitHub repository name." >&2
  exit 1
fi

if ! grep -q 'env_http_headers = { "X-RBAC-SECRET-KEY" = "RBAC_SECRET_KEY" }' "$config_file"; then
  echo "Expected X-RBAC-SECRET-KEY to be mapped from RBAC_SECRET_KEY in $config_file." >&2
  exit 1
fi

configured_url="$(awk '
  $0 == "[mcp_servers." server_name "]" { in_server = 1; next }
  /^\[/ { in_server = 0 }
  in_server && /^url = / {
    sub(/^url = "/, "")
    sub(/"$/, "")
    print
    exit
  }
' server_name="$server_name" "$config_file")"

if [ -z "$configured_url" ]; then
  echo "Missing url in [mcp_servers.$server_name] in $config_file." >&2
  exit 1
fi

echo "Codex MCP server is configured in project-local $config_file."
echo "Name: $server_name"
echo "URL: $configured_url"
echo "Header env mapping: X-RBAC-SECRET-KEY=RBAC_SECRET_KEY"
echo
echo "Start Codex from an environment that contains RBAC_SECRET_KEY."

if command -v codex >/dev/null 2>&1; then
  echo
  codex mcp get "$server_name" 2>/dev/null || true
fi
