#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
. "$SCRIPT_DIR/get_env.sh"

ENV_PATH="${DEPLOYER_ENV_FILE:-.env}"
INVENTORY_PATH="${DEPLOYER_INVENTORY_FILE:-$SCRIPT_DIR/inventory.yaml}"

get_deployer_env() {
    get_env "${BASH_SOURCE[0]}" "$1" "$ENV_PATH"
}

yaml_quote() {
    local value="$1"
    value=${value//\'/\'\'}
    printf "'%s'" "$value"
}

decode_private_key() {
    local encoded_key="$1"
    local destination="$2"

    mkdir -p "$(dirname "$destination")"

    if printf '%s' "$encoded_key" | base64 --decode > "$destination" 2>/dev/null; then
        :
    elif printf '%s' "$encoded_key" | base64 -D > "$destination" 2>/dev/null; then
        :
    else
        rm -f "$destination"
        echo "Error: ANSIBLE_PRIVATE_KEY_BASE64 is not valid base64." >&2
        return 1
    fi

    chmod 600 "$destination"
}

ANSIBLE_HOST="$(get_deployer_env "ANSIBLE_HOST")"
ANSIBLE_USER="$(get_deployer_env "ANSIBLE_USER")"
ANSIBLE_PORT="$(get_deployer_env "ANSIBLE_PORT")"
ANSIBLE_PASSWORD="$(get_deployer_env "ANSIBLE_PASSWORD")"
ANSIBLE_PRIVATE_KEY_FILE="$(get_deployer_env "ANSIBLE_PRIVATE_KEY_FILE")"
ANSIBLE_PRIVATE_KEY_BASE64="$(get_deployer_env "ANSIBLE_PRIVATE_KEY_BASE64")"

ANSIBLE_PORT="${ANSIBLE_PORT:-22}"

if [ -z "$ANSIBLE_HOST" ]; then
    echo "Error: ANSIBLE_HOST must be configured." >&2
    exit 1
fi

if [ -z "$ANSIBLE_USER" ]; then
    echo "Error: ANSIBLE_USER must be configured (use 'ubuntu' for AWS Lightsail Ubuntu images)." >&2
    exit 1
fi

if ! [[ "$ANSIBLE_PORT" =~ ^[0-9]+$ ]] || [ "$ANSIBLE_PORT" -lt 1 ] || [ "$ANSIBLE_PORT" -gt 65535 ]; then
    echo "Error: ANSIBLE_PORT must be an integer between 1 and 65535." >&2
    exit 1
fi

if [ -n "$ANSIBLE_PRIVATE_KEY_FILE" ] && [ -n "$ANSIBLE_PRIVATE_KEY_BASE64" ]; then
    echo "Error: Configure either ANSIBLE_PRIVATE_KEY_FILE or ANSIBLE_PRIVATE_KEY_BASE64, not both." >&2
    exit 1
fi

if [ -n "$ANSIBLE_PRIVATE_KEY_BASE64" ]; then
    ANSIBLE_PRIVATE_KEY_FILE="$SCRIPT_DIR/.ansible_private_key.key"
    decode_private_key "$ANSIBLE_PRIVATE_KEY_BASE64" "$ANSIBLE_PRIVATE_KEY_FILE"
fi

if [ -n "$ANSIBLE_PRIVATE_KEY_FILE" ]; then
    if [ ! -f "$ANSIBLE_PRIVATE_KEY_FILE" ]; then
        echo "Error: SSH private key '$ANSIBLE_PRIVATE_KEY_FILE' does not exist." >&2
        exit 1
    fi

    chmod 600 "$ANSIBLE_PRIVATE_KEY_FILE"
    ANSIBLE_PRIVATE_KEY_FILE="$(cd "$(dirname "$ANSIBLE_PRIVATE_KEY_FILE")" && pwd -P)/$(basename "$ANSIBLE_PRIVATE_KEY_FILE")"
elif [ -z "$ANSIBLE_PASSWORD" ]; then
    echo "Error: Configure ANSIBLE_PRIVATE_KEY_FILE, ANSIBLE_PRIVATE_KEY_BASE64, or ANSIBLE_PASSWORD." >&2
    exit 1
fi

mkdir -p "$(dirname "$INVENTORY_PATH")"

{
    echo "ungrouped:"
    echo "  vars:"
    echo "    ansible_ssh_common_args: '-o StrictHostKeyChecking=accept-new -o UserKnownHostsFile=/dev/null'"
    echo "  hosts:"
    printf "    %s:\n" "$(yaml_quote "$ANSIBLE_HOST")"
    printf "      ansible_user: %s\n" "$(yaml_quote "$ANSIBLE_USER")"
    printf "      ansible_port: %s\n" "$ANSIBLE_PORT"

    if [ -n "$ANSIBLE_PRIVATE_KEY_FILE" ]; then
        printf "      ansible_ssh_private_key_file: %s\n" "$(yaml_quote "$ANSIBLE_PRIVATE_KEY_FILE")"
    else
        printf "      ansible_password: %s\n" "$(yaml_quote "$ANSIBLE_PASSWORD")"
    fi
} > "$INVENTORY_PATH"
