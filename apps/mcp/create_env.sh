#!/bin/bash
. ../../tools/deployer/get_env.sh

echo "API_SERVICE_URL=http://127.0.0.1:4000" >> .env
echo "MCP_HTTP_HOST=127.0.0.1" >> .env
echo "MCP_HTTP_PORT=3001" >> .env
echo "MCP_PUBLIC_BASE_URL=http://127.0.0.1:3001" >> .env
echo "MCP_PUBLIC_URL=http://127.0.0.1:3001/mcp" >> .env
echo "MCP_AUTH_REQUIRED=true" >> .env
echo "MCP_ALLOW_RBAC_SECRET_FALLBACK=true" >> .env

RBAC_JWT_SECRET=$(get_env "$BASH_SOURCE" "RBAC_JWT_SECRET" "../api/.env")
RBAC_SECRET_KEY=$(get_env "$BASH_SOURCE" "RBAC_SECRET_KEY" "../api/.env")

add_env "RBAC_JWT_SECRET" $RBAC_JWT_SECRET
add_env "RBAC_SECRET_KEY" $RBAC_SECRET_KEY
