#!/bin/bash

write_runtime_env() {
  local target_path="$1"

  # Deployment variables are injected by Docker/Swarm through env_file.
  # Materialize that process environment for applications that load `.env`.
  umask 077
  printenv > "$target_path"
  chmod 600 "$target_path"
}

write_host_runtime_env() {
  local target_path="apps/host/.env.local"

  umask 077
  : > "$target_path"

  # Next.js public variables may be baked into this file during image build.
  if [ -f apps/host/.env.production ]; then
    cat apps/host/.env.production >> "$target_path"
  fi

  printenv >> "$target_path"
  chmod 600 "$target_path"
}

if [ "$1" = "host" ]; then
  if [ "$2" = "deployment" ]; then
    write_host_runtime_env
    exit 0
  fi
elif [ "$1" = "api" ]; then
  if [ "$2" = "deployment" ]; then
    write_runtime_env "apps/api/.env"
    exit 0
  fi
elif [ "$1" = "telegram" ]; then
  if [ "$2" = "deployment" ]; then
    write_runtime_env "apps/telegram/.env"
    exit 0
  fi
elif [ "$1" = "mcp" ]; then
  if [ "$2" = "deployment" ]; then
    write_runtime_env "apps/mcp/.env"
    exit 0
  fi
fi

cd apps/db && ./create_env.sh
cd ../redis && ./create_env.sh
cd ../host && ./create_env.sh
cd ../api && ./create_env.sh
cd ../telegram && ./create_env.sh
cd ../mcp && ./create_env.sh
