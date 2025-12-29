#!/bin/bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$ROOT_DIR/.env"
HTTPYAC_FILE="$ROOT_DIR/.httpyac.json"
HTTPYAC_TEMPLATE="$ROOT_DIR/.httpyac.json.example"
API_ENV_FILE="$ROOT_DIR/../api/.env"

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

generate_httpyac() {
        if [[ -f "$HTTPYAC_TEMPLATE" ]]; then
                cp "$HTTPYAC_TEMPLATE" "$HTTPYAC_FILE"
        elif [[ ! -f "$HTTPYAC_FILE" ]]; then
                cat > "$HTTPYAC_FILE" <<'JSON'
{
    "environments": {
        "dev": {
            "baseUrl": "https://api.example.com/api",
            "contentType": "application/json"
        },
        "local": {
            "baseUrl": "http://localhost:4000/api",
            "contentType": "application/json"
        },
        "prod": {
            "baseUrl": "https://api.singlepagestartup.com/api",
            "contentType": "application/json"
        }
    }
}
JSON
        fi

    if [[ ! -f "$API_ENV_FILE" ]]; then
        echo "⚠️  Skipping httpYac env: $API_ENV_FILE not found"
        return
    fi

    local api_url
    api_url=$(grep "^NEXT_PUBLIC_API_SERVICE_URL=" "$API_ENV_FILE" | tail -n 1 | cut -d '=' -f2-)

    if [[ -z "$api_url" ]]; then
        echo "⚠️  NEXT_PUBLIC_API_SERVICE_URL not found in $API_ENV_FILE"
        return
    fi

    local tmp="$HTTPYAC_FILE.tmp"

    jq \
        --arg url "${api_url}/api" \
        '.environments.dev.baseUrl = $url' \
        "$HTTPYAC_FILE" > "$tmp"

    mv "$tmp" "$HTTPYAC_FILE"

    echo "✅ Generated $HTTPYAC_FILE (dev → ${api_url}/api)"
}

generate_httpyac

echo "Done."