#!/usr/bin/env bash
set -euo pipefail

project_dir="$(pwd -P)"
project_slug="$(basename "$project_dir" | tr "[:upper:]" "[:lower:]" | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')"
project_slug="${project_slug:-project}"
project_hash="$(printf "%s" "$project_dir" | cksum | awk '{print $1}')"
name="mcp-${project_slug}-${project_hash}"
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

upsert_project_binding() {
  SERVER_NAME="$name" PROJECT_DIR="$project_dir" perl -0pi -e '
    my $server = $ENV{"SERVER_NAME"};
    my $project = $ENV{"PROJECT_DIR"};
    my $project_re = quotemeta($project);

    if (s/\n?\[projects\."$project_re"\]\n((?:(?!\n\[).)*)/replace_project($project, $server, $1)/se) {
      # Existing project table updated.
    } else {
      $_ .= "\n[projects.\"$project\"]\ntrust_level = \"trusted\"\nmcp_servers = [\"$server\"]\n";
    }

    sub replace_project {
      my ($project, $server, $body) = @_;
      my @servers = ($server);
      if ($body =~ s/^mcp_servers\s*=\s*\[(.*?)\]\n?//ms) {
        my $list = $1;
        while ($list =~ /"((?:\\.|[^"\\])*)"/g) {
          my $item = $1;
          next if $item eq $server || $item eq "sps-mcp";
          push @servers, $item;
        }
      }
      $body = "trust_level = \"trusted\"\n" . $body unless $body =~ /^trust_level\s*=/m;
      $body =~ s/\n*\z/\n/;
      return "\n[projects.\"$project\"]\n$body" . "mcp_servers = [" . join(", ", map { "\"$_\"" } @servers) . "]\n";
    }
  ' "$config_file"
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
codex mcp remove sps-mcp >/dev/null 2>&1 || true
codex mcp add "$name" --url "$url"

escaped_url="$(toml_escape "$url")"
escaped_secret="$(toml_escape "$secret")"
SERVER_NAME="$name" perl -0pi -e '
  my $server = quotemeta($ENV{"SERVER_NAME"});
  s/\n\[mcp_servers\.sps-mcp\]\n(?:(?!\n\[).)*//s;
  s/\n\[mcp_servers\.$server\]\n(?:(?!\n\[).)*//s;
' "$config_file"
upsert_project_binding
printf '\n[mcp_servers.%s]\nurl = "%s"\nhttp_headers = { "X-RBAC-SECRET-KEY" = "%s" }\n' "$name" "$escaped_url" "$escaped_secret" >>"$config_file"

codex mcp get "$name"
