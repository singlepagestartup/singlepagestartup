#!/usr/bin/env bash
# Materialize only the explicit secret mappings for the selected Actions step.
# Refuse values the deployer's line-based .env reader cannot represent.
set -euo pipefail
umask 077
file=$(mktemp .env.XXXXXX)
trap 'rm -f "$file"' EXIT
for variable in ${!SPS_DEPLOY_@}; do
    value=${!variable}
    if [[ "$value" == *$'\n'* || "$value" == *$'\r'* ]]; then
        echo "Deployer variable ${variable#SPS_DEPLOY_} must be single-line." >&2
        exit 1
    fi
    printf '%s=%s\n' "${variable#SPS_DEPLOY_}" "$value" >> "$file"
done
mv "$file" .env
