#!/bin/bash
. ../../tools/deployer/get_env.sh

add_env() {
    echo "$1=$2" >> .env
}

# Check is .env file exists
if [ -f .env ]; then
    echo "File .env already exists"
    exit 1
fi

umask 077

echo "TELEGRAM_SERVICE_BOT_TOKEN=" >> .env

if [ ! -z $CODESPACE_NAME ]; then
    NEXT_PUBLIC_TELEGRAM_SERVICE_URL=https://$CODESPACE_NAME-8000.app.github.dev
    echo "NEXT_PUBLIC_TELEGRAM_SERVICE_URL=$NEXT_PUBLIC_TELEGRAM_SERVICE_URL" >> .env
elif [ ! -z $GITPOD_WORKSPACE_URL ]; then
    # replace https:// with https://8000-
    REPLACED_WITH_PORT_URL=$(echo $GITPOD_WORKSPACE_URL | sed 's/https:\/\//https:\/\/8000-/g')

    NEXT_PUBLIC_TELEGRAM_SERVICE_URL=$REPLACED_WITH_PORT_URL
    # add_env "NEXT_PUBLIC_TELEGRAM_SERVICE_URL" $NEXT_PUBLIC_TELEGRAM_SERVICE_URL
    echo "NEXT_PUBLIC_TELEGRAM_SERVICE_URL=$NEXT_PUBLIC_TELEGRAM_SERVICE_URL" >> .env
fi

RBAC_SECRET_KEY=$(get_env "$BASH_SOURCE" "RBAC_SECRET_KEY" "../api/.env")
add_env "RBAC_SECRET_KEY" $RBAC_SECRET_KEY

chmod 600 .env