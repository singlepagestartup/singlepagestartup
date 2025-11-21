#!/bin/bash
. ../../tools/deployer/get_env.sh

add_env() {
    echo "$1=$2" >> .env.local
}

generate_random_string() {
    echo $RANDOM | md5sum | head -c 32;
}

# Check is .env.local file exists
if [ -f .env.local ]; then
    echo "File .env.local already exists"
    exit 1
fi

# Clear env file
> .env.local
echo "Created /.env.local file"

if [ ! -z $CODESPACE_NAME ]; then
    NEXT_PUBLIC_API_SERVICE_URL=https://$CODESPACE_NAME-4000.app.github.dev
    # add_env "NEXT_PUBLIC_API_SERVICE_URL" $NEXT_PUBLIC_API_SERVICE_URL
    echo "NEXT_PUBLIC_API_SERVICE_URL=$NEXT_PUBLIC_API_SERVICE_URL" >> .env.development.local
    echo "NEXT_PUBLIC_API_SERVICE_WS_URL=wss://$CODESPACE_NAME-4000.app.github.dev" >> .env.development.local

    NEXT_PUBLIC_HOST_SERVICE_URL=https://$CODESPACE_NAME-3000.app.github.dev
    # add_env "NEXT_PUBLIC_HOST_SERVICE_URL" $NEXT_PUBLIC_HOST_SERVICE_URL
    echo "NEXT_PUBLIC_HOST_SERVICE_URL=$NEXT_PUBLIC_HOST_SERVICE_URL" >> .env.development.local
    echo "API_SERVICE_URL=http://localhost:4000" >> .env.development.local
elif [ ! -z $GITPOD_WORKSPACE_URL ]; then
    # replace https:// with https://3000-
    REPLACED_WITH_PORT_URL=$(echo $GITPOD_WORKSPACE_URL | sed 's/https:\/\//https:\/\/3000-/g')

    NEXT_PUBLIC_API_SERVICE_URL=$REPLACED_WITH_PORT_URL
    # add_env "NEXT_PUBLIC_API_SERVICE_URL" $NEXT_PUBLIC_API_SERVICE_URL
    echo "NEXT_PUBLIC_API_SERVICE_URL=$NEXT_PUBLIC_API_SERVICE_URL" >> .env.development.local
    echo "NEXT_PUBLIC_API_SERVICE_WS_URL=wss://$REPLACED_WITH_PORT_URL" >> .env.development.local

    NEXT_PUBLIC_HOST_SERVICE_URL=$REPLACED_WITH_PORT_URL
    # add_env "NEXT_PUBLIC_HOST_SERVICE_URL" $NEXT_PUBLIC_HOST_SERVICE_URL
    echo "NEXT_PUBLIC_HOST_SERVICE_URL=$NEXT_PUBLIC_HOST_SERVICE_URL" >> .env.development.local

    echo "API_SERVICE_URL=http://localhost:4000" >> .env.development.local
# else
    # NEXT_PUBLIC_API_SERVICE_URL=http://localhost:4000
    # add_env "NEXT_PUBLIC_API_SERVICE_URL" $NEXT_PUBLIC_API_SERVICE_URL

    # NEXT_PUBLIC_HOST_SERVICE_URL=http://localhost:3000
    # add_env "NEXT_PUBLIC_HOST_SERVICE_URL" $NEXT_PUBLIC_HOST_SERVICE_URL
fi