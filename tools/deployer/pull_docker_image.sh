#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/get_env.sh"

DOCKER_IMAGE="${1:-}"
ENVIRONMENT_TYPE="${2:-}"

if [ -z "$DOCKER_IMAGE" ]; then
    echo "Usage: $0 <docker-image> [environment-type]" >&2
    exit 1
fi

DOCKER_HUB_URL="$(get_env "${BASH_SOURCE[0]}" "DOCKER_HUB_URL")"
DOCKER_HUB_LOGIN_USERNAME="$(get_env "${BASH_SOURCE[0]}" "DOCKER_HUB_LOGIN_USERNAME")"
DOCKER_HUB_PASSWORD="$(get_env "${BASH_SOURCE[0]}" "DOCKER_HUB_PASSWORD")"

SPS_DOCKER_IMAGE="$DOCKER_IMAGE" \
SPS_DOCKER_HUB_URL="$DOCKER_HUB_URL" \
SPS_DOCKER_HUB_LOGIN_USERNAME="$DOCKER_HUB_LOGIN_USERNAME" \
SPS_DOCKER_HUB_PASSWORD="$DOCKER_HUB_PASSWORD" \
    ansible-playbook "$SCRIPT_DIR/docker/pull_image.yaml" \
        -e "ENVIRONMENT_TYPE=$ENVIRONMENT_TYPE"
