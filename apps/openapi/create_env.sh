#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT_DIR/.env"
API_ENV_FILE="$ROOT_DIR/../api/.env"
TELEGRAM_ENV_FILE="$ROOT_DIR/../telegram/.env"
OPENAPI_FILE="$ROOT_DIR/openapi.yaml"

touch "$ENV_FILE"

upsert_env() {
    local key="$1"
    local value="$2"

    if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
        sed -i "s#^${key}=.*#${key}=${value}#" "$ENV_FILE"
    else
        echo "${key}=${value}" >> "$ENV_FILE"
    fi
}

echo "🔧 Updating $ENV_FILE"

upsert_env "TELEGRAM_SERVICE_BOT_TOKEN" ""

if [[ -n "${CODESPACE_NAME:-}" ]]; then
    NEXT_PUBLIC_TELEGRAM_SERVICE_URL="https://${CODESPACE_NAME}-8000.app.github.dev"
    upsert_env "NEXT_PUBLIC_TELEGRAM_SERVICE_URL" "$NEXT_PUBLIC_TELEGRAM_SERVICE_URL"
elif [[ -n "${GITPOD_WORKSPACE_URL:-}" ]]; then
    REPLACED_WITH_PORT_URL="${GITPOD_WORKSPACE_URL/https:\/\//https:\/\/8000-}"
    NEXT_PUBLIC_TELEGRAM_SERVICE_URL="$REPLACED_WITH_PORT_URL"
    upsert_env "NEXT_PUBLIC_TELEGRAM_SERVICE_URL" "$NEXT_PUBLIC_TELEGRAM_SERVICE_URL"
fi

read_env_value() {
    local file="$1"
    local key="$2"
    if [[ ! -f "$file" ]]; then
        return
    fi
    grep "^${key}=" "$file" | tail -n 1 | cut -d '=' -f2- | sed -e 's/^\"//' -e 's/\"$//'
}

normalize_api_url() {
    local url="$1"
    if [[ -z "$url" ]]; then
        return
    fi
    url="${url%/}"
    if [[ "$url" == */api ]]; then
        echo "$url"
    else
        echo "${url}/api"
    fi
}

update_openapi_servers() {
    if [[ ! -f "$OPENAPI_FILE" ]]; then
        echo "⚠️  Skipping OpenAPI update: $OPENAPI_FILE not found"
        return
    fi

    local api_url telegram_url
    api_url=$(read_env_value "$API_ENV_FILE" "NEXT_PUBLIC_API_SERVICE_URL")
    api_url=$(normalize_api_url "$api_url")
    telegram_url=$(read_env_value "$TELEGRAM_ENV_FILE" "NEXT_PUBLIC_TELEGRAM_SERVICE_URL")
    telegram_url="${telegram_url%/}"

    python3 - <<PY
from pathlib import Path

openapi_file = Path(r'''$OPENAPI_FILE''')
api_url = r'''$api_url'''
telegram_url = r'''$telegram_url'''

servers = [
    ("http://localhost:4000/api", "Local development"),
    ("https://api.singlepagestartup.com/api", "Production server"),
]

def add_server(url, desc):
    if not url:
        return
    if url.endswith("/"):
        url = url[:-1]
    if all(s[0] != url for s in servers):
        servers.append((url, desc))

add_server(api_url, "API service")
add_server(telegram_url, "Telegram service")

lines = openapi_file.read_text().splitlines()
out = []
i = 0
while i < len(lines):
    line = lines[i]
    if line.startswith("servers:"):
        out.append("servers:")
        for url, desc in servers:
            out.append(f"  - url: {url}")
            out.append(f"    description: {desc}")
        i += 1
        while i < len(lines) and (lines[i].startswith(" ") or lines[i].strip() == ""):
            i += 1
        continue
    out.append(line)
    i += 1

openapi_file.write_text("\\n".join(out) + "\\n")
PY

    echo "✅ Updated servers in $OPENAPI_FILE"
}

update_openapi_servers

echo "Done."
