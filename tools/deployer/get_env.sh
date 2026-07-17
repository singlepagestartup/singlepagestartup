#!/bin/bash

get_env() {
    local CALLER_SCRIPT="$1"
    local KEY="$2"
    local ENV_PATH="${3:-.env}"

    local CALLER_DIR="$(dirname "$CALLER_SCRIPT")"
    local ENV_FILE

    if [[ "$ENV_PATH" = /* ]]; then
        ENV_FILE="$(realpath "$ENV_PATH")"
    else
        ENV_FILE="$(realpath "$CALLER_DIR/$ENV_PATH")"
    fi

    if [ ! -f "$ENV_FILE" ]; then
        echo "Error: Environment file '$ENV_FILE' not found at '$ENV_FILE'!" >&2
        return 1
    fi

    local ENV_VALUE=$(grep "^$KEY=" "$ENV_FILE" | cut -d '=' -f2-)

    echo "$ENV_VALUE"
}

get_env_or_default() {
    local CALLER_SCRIPT="$1"
    local KEY="$2"
    local DEFAULT_VALUE="$3"
    local ENV_PATH="${4:-.env}"
    local ENV_VALUE

    ENV_VALUE=$(get_env "$CALLER_SCRIPT" "$KEY" "$ENV_PATH") || return 1

    if [ -z "$ENV_VALUE" ]; then
        echo "$DEFAULT_VALUE"
        return 0
    fi

    echo "$ENV_VALUE"
}

export -f get_env
export -f get_env_or_default
