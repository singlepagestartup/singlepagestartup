#!/bin/bash

is_hex_secret() {
    local VALUE="$1"
    local EXPECTED_LENGTH="$2"

    if [ ${#VALUE} -ne "$EXPECTED_LENGTH" ]; then
        return 1
    fi

    case "$VALUE" in
        *[!0-9a-f]*) return 1 ;;
    esac

    return 0
}

# Prints a cryptographic secret as lowercase hex, two characters per byte.
# The default of 32 bytes is 64 characters, the shape the deployer templates
# document. Prints nothing and returns 1 when no random source is usable, so a
# caller can never write an empty secret without noticing.
generate_secret() {
    local BYTES="${1:-32}"
    local EXPECTED_LENGTH=$((BYTES * 2))
    local VALUE=""

    if command -v openssl >/dev/null 2>&1; then
        VALUE=$(openssl rand -hex "$BYTES" 2>/dev/null | tr -d ' \t\r\n')

        if ! is_hex_secret "$VALUE" "$EXPECTED_LENGTH"; then
            VALUE=""
        fi
    fi

    if [ -z "$VALUE" ] && [ -r /dev/urandom ]; then
        VALUE=$(od -An -tx1 -N"$BYTES" /dev/urandom 2>/dev/null | tr -d ' \t\r\n')

        if ! is_hex_secret "$VALUE" "$EXPECTED_LENGTH"; then
            VALUE=""
        fi
    fi

    if [ -z "$VALUE" ]; then
        echo "Error: no cryptographic random source produced $EXPECTED_LENGTH hex characters. Tried 'openssl rand -hex' and /dev/urandom." >&2
        return 1
    fi

    echo "$VALUE"
}

# Deprecated. Kept one release so a project script that still calls the old
# name keeps working and silently receives the strong value instead. The output
# is now 64 characters rather than 32.
generate_random_string() {
    generate_secret 32
}

export -f is_hex_secret
export -f generate_secret
export -f generate_random_string
