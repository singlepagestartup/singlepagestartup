#!/bin/bash

set -euo pipefail

if [ "${1:-}" = "host" ]; then
  ./create_env.sh host deployment
  npm run host:start
  exit 0
elif [ "${1:-}" = "api" ]; then
  ./create_env.sh api deployment
  ./migrate.sh seed &
  npm run api:start
  exit 0
elif [ "${1:-}" = "telegram" ]; then
  ./create_env.sh telegram deployment
  npm run telegram:start
  exit 0
elif [ "${1:-}" = "mcp" ]; then
  ./create_env.sh mcp deployment
  npm run mcp:http
  exit 0
elif [ "${1:-}" = "llm" ]; then
  cd apps/llm
  ./.venv/bin/uvicorn main:app --host 0.0.0.0 --port 8765
  exit 0
fi

echo "Usage: ./start.sh [host|api|telegram|mcp|llm]"
exit 1
