#!/bin/bash
. ../../tools/deployer/ansible/get_env.sh

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

NODE_ENV=local
add_env "NODE_ENV" $NODE_ENV

add_env "SPS_HOST_SEED" true
add_env "SPS_WEBSITE_BUILDER_SEED" true
add_env "SPS_FILE_STORAGE_SEED" true
add_env "STARTUP_SEED" true

if [ ! -z $CODESPACE_NAME ]; then
    NEXT_PUBLIC_BACKEND_URL=https://$CODESPACE_NAME-3000.app.github.dev
    add_env "NEXT_PUBLIC_BACKEND_URL" $NEXT_PUBLIC_BACKEND_URL

    NEXT_PUBLIC_HOST_URL=https://$CODESPACE_NAME-3000.app.github.dev
    add_env "NEXT_PUBLIC_HOST_URL" $NEXT_PUBLIC_HOST_URL
elif [ ! -z $GITPOD_WORKSPACE_URL ]; then
    # replace https:// with https://3000-
    REPLACED_WITH_PORT_URL=$(echo $GITPOD_WORKSPACE_URL | sed 's/https:\/\//https:\/\/3000-/g')

    NEXT_PUBLIC_BACKEND_URL=$REPLACED_WITH_PORT_URL
    add_env "NEXT_PUBLIC_BACKEND_URL" $NEXT_PUBLIC_BACKEND_URL
    NEXT_PUBLIC_HOST_URL=$REPLACED_WITH_PORT_URL
    add_env "NEXT_PUBLIC_HOST_URL" $NEXT_PUBLIC_HOST_URL
else
    NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
    add_env "NEXT_PUBLIC_BACKEND_URL" $NEXT_PUBLIC_BACKEND_URL

    NEXT_PUBLIC_HOST_URL=http://localhost:3000
    add_env "NEXT_PUBLIC_HOST_URL" $NEXT_PUBLIC_HOST_URL
fi

DATABASE_HOST=localhost
add_env "DATABASE_HOST" $DATABASE_HOST

DATABASE_NAME=$(get_env POSTGRES_DB ../db/.env)
add_env "DATABASE_NAME" $DATABASE_NAME

DATABASE_USERNAME=$(get_env POSTGRES_USER ../db/.env)
add_env "DATABASE_USERNAME" $DATABASE_USERNAME

DATABASE_PASSWORD=$(get_env POSTGRES_PASSWORD ../db/.env)
add_env "DATABASE_PASSWORD" $DATABASE_PASSWORD

DATABASE_PORT=$(get_env POSTGRES_PORT ../db/.env)
add_env "DATABASE_PORT" $DATABASE_PORT

add_env "DATABASE_NO_SSL" true

KV_PORT=$(get_env REDIS_PORT ../redis/.env)
add_env "KV_PORT" $KV_PORT

KV_PASSWORD=$(get_env REDIS_PASSWORD ../redis/.env)
add_env "KV_PASSWORD" $KV_PASSWORD

SPS_RBAC_COOKIE_SESSION_SECRET=$(generate_random_string)
SPS_RBAC_JWT_SECRET=$(generate_random_string)
SPS_RBAC_SECRET_KEY=$(generate_random_string)

add_env "FILE_STORAGE_PROVIDER" "local"