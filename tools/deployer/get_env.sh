#!/bin/bash

get_env() {
    local CALLER_SCRIPT="$1"
    local KEY="$2"
    local ENV_PATH="${3:-.env}"

    local CALLER_DIR="$(dirname "$CALLER_SCRIPT")"
    local ENV_FILE="$(realpath "$CALLER_DIR/$ENV_PATH")"

    if [ ! -f "$ENV_FILE" ]; then
        echo "Error: Environment file '$ENV_FILE' not found at '$ENV_FILE'!" >&2
        return 1
    fi

    local ENV_VALUE=$(grep "^$KEY=" "$ENV_FILE" | cut -d '=' -f2-)

    echo "$ENV_VALUE"
}

export -f get_env
