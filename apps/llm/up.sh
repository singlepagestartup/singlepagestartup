#!/bin/bash
chmod +x ./create_env.sh
./create_env.sh

if [ -z "${DOCKER_CONFIG:-}" ] &&
  [ -f "$HOME/.docker/config.json" ] &&
  grep -q '"credsStore"[[:space:]]*:[[:space:]]*"desktop"' "$HOME/.docker/config.json" &&
  ! command -v docker-credential-desktop >/dev/null 2>&1; then
  DOCKER_CONFIG="/private/tmp/docker-no-creds"
  mkdir -p "$DOCKER_CONFIG"
  printf '{}\n' > "$DOCKER_CONFIG/config.json"
  export DOCKER_CONFIG
fi

if [ -z "${DOCKER_HOST:-}" ] && [ -S "$HOME/.docker/run/docker.sock" ]; then
  export DOCKER_HOST="unix://$HOME/.docker/run/docker.sock"
fi

docker-compose up -d --build
