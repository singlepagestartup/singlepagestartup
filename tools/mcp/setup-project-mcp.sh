#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

REMOTE_URL="https://mcp.<domain>/mcp"
LOCAL_URL="http://127.0.0.1:3001/mcp"
WRITE_PROJECT=false
APPLY_CLAUDE=false
APPLY_CODEX=false

usage() {
  cat <<'EOF'
Usage: tools/mcp/setup-project-mcp.sh [options]

Resolve MCP names from the GitHub repository name and print or apply MCP setup commands.

Options:
  --remote-url <url>   Production MCP URL. Defaults to https://mcp.<domain>/mcp.
  --write-project      Rewrite .mcp.json so the project MCP key matches the repo name.
  --apply-claude       Run Claude Code local and production HTTP MCP add commands.
  --apply-codex        Run Codex local and production HTTP MCP add/login commands.
  -h, --help           Show this help.

Environment:
  TARGET_REPO          Optional owner/name override used by .claude/helpers/get_repo_name.sh.
  GITHUB_REPOSITORY    Optional owner/name fallback used by .claude/helpers/get_repo_name.sh.
EOF
}

while [ "$#" -gt 0 ]; do
  case "$1" in
    --remote-url)
      if [ "$#" -lt 2 ] || [ -z "${2:-}" ]; then
        echo "Error: --remote-url requires a value." >&2
        exit 1
      fi
      REMOTE_URL="$2"
      shift 2
      ;;
    --write-project)
      WRITE_PROJECT=true
      shift
      ;;
    --apply-claude)
      APPLY_CLAUDE=true
      shift
      ;;
    --apply-codex)
      APPLY_CODEX=true
      shift
      ;;
    -h | --help)
      usage
      exit 0
      ;;
    *)
      echo "Error: unknown option '$1'." >&2
      usage >&2
      exit 1
      ;;
  esac
done

cd "$REPO_ROOT"

REPO_NAME="$("$REPO_ROOT/.claude/helpers/get_repo_name.sh")"
PROJECT_MCP_NAME="$REPO_NAME"
LOCAL_MCP_NAME="${REPO_NAME}-local"
PRODUCTION_MCP_NAME="${REPO_NAME}-production"

quote_arg() {
  local value="${1//\\/\\\\}"
  value="${value//\"/\\\"}"
  printf '"%s"' "$value"
}

write_project_config() {
  local config_path="$REPO_ROOT/.mcp.json"
  local tmp_path="$config_path.tmp"

  cat > "$tmp_path" <<EOF
{
  "mcpServers": {
    "$PROJECT_MCP_NAME": {
      "command": "bun",
      "args": ["./apps/mcp/index.ts"],
      "cwd": "./"
    }
  }
}
EOF

  mv "$tmp_path" "$config_path"
  echo "Updated .mcp.json project MCP name to '$PROJECT_MCP_NAME'."
}

ensure_apply_remote_url() {
  if [[ "$REMOTE_URL" == *"<domain>"* ]]; then
    echo "Error: --apply-claude/--apply-codex requires a real production URL." >&2
    echo "Pass --remote-url https://mcp.your-domain.com/mcp." >&2
    exit 1
  fi
}

print_commands() {
  echo "Resolved repository MCP names:"
  echo "  Project .mcp.json: $PROJECT_MCP_NAME"
  echo "  Local HTTP:        $LOCAL_MCP_NAME"
  echo "  Production HTTP:   $PRODUCTION_MCP_NAME"
  echo
  echo "Claude Code:"
  printf '  claude mcp add --transport http %s %s\n' \
    "$(quote_arg "$LOCAL_MCP_NAME")" \
    "$(quote_arg "$LOCAL_URL")"
  printf '  claude mcp add --transport http %s %s\n' \
    "$(quote_arg "$PRODUCTION_MCP_NAME")" \
    "$(quote_arg "$REMOTE_URL")"
  echo
  echo "Codex:"
  printf '  codex mcp add %s --url %s\n' \
    "$(quote_arg "$LOCAL_MCP_NAME")" \
    "$(quote_arg "$LOCAL_URL")"
  printf '  codex mcp login %s --scopes mcp:content\n' \
    "$(quote_arg "$LOCAL_MCP_NAME")"
  printf '  codex mcp add %s --url %s\n' \
    "$(quote_arg "$PRODUCTION_MCP_NAME")" \
    "$(quote_arg "$REMOTE_URL")"
  printf '  codex mcp login %s --scopes mcp:content\n' \
    "$(quote_arg "$PRODUCTION_MCP_NAME")"
  echo
  echo "Claude UI / Desktop custom connector:"
  echo "  Name: $PRODUCTION_MCP_NAME"
  echo "  URL:  $REMOTE_URL"
  echo "  OAuth Client ID/Secret: leave empty"
}

apply_claude() {
  claude mcp add --transport http "$LOCAL_MCP_NAME" "$LOCAL_URL"
  claude mcp add --transport http "$PRODUCTION_MCP_NAME" "$REMOTE_URL"
}

apply_codex() {
  codex mcp add "$LOCAL_MCP_NAME" --url "$LOCAL_URL"
  codex mcp login "$LOCAL_MCP_NAME" --scopes mcp:content
  codex mcp add "$PRODUCTION_MCP_NAME" --url "$REMOTE_URL"
  codex mcp login "$PRODUCTION_MCP_NAME" --scopes mcp:content
}

if [ "$WRITE_PROJECT" = true ]; then
  write_project_config
fi

if [ "$APPLY_CLAUDE" = true ]; then
  ensure_apply_remote_url
  apply_claude
fi

if [ "$APPLY_CODEX" = true ]; then
  ensure_apply_remote_url
  apply_codex
fi

if [ "$WRITE_PROJECT" = false ] && [ "$APPLY_CLAUDE" = false ] && [ "$APPLY_CODEX" = false ]; then
  print_commands
fi
