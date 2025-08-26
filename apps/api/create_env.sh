#!/bin/bash
. ../../tools/deployer/get_env.sh

add_env() {
    echo "$1=$2" >> .env
}

generate_random_string() {
    echo $RANDOM | md5sum | head -c 32;
}

# Check is .env file exists
if [ -f .env ]; then
    echo "File .env already exists"
    exit 1
fi

# Clear env file
> .env
echo "Created /.env file"

add_env "HOST_SEED" true
add_env "WEBSITE_BUILDER_SEED" true
add_env "FILE_STORAGE_SEED" true
add_env "STARTUP_SEED" true

if [ ! -z $CODESPACE_NAME ]; then
    NEXT_PUBLIC_API_SERVICE_URL=https://$CODESPACE_NAME-4000.app.github.dev
    # add_env "NEXT_PUBLIC_API_SERVICE_URL" $NEXT_PUBLIC_API_SERVICE_URL
    echo "NEXT_PUBLIC_API_SERVICE_URL=$NEXT_PUBLIC_API_SERVICE_URL" >> .env

    NEXT_PUBLIC_HOST_SERVICE_URL=https://$CODESPACE_NAME-3000.app.github.dev
    # add_env "NEXT_PUBLIC_HOST_SERVICE_URL" $NEXT_PUBLIC_HOST_SERVICE_URL
    echo "NEXT_PUBLIC_HOST_SERVICE_URL=$NEXT_PUBLIC_HOST_SERVICE_URL" >> .env
    echo "API_SERVICE_URL=http://localhost:4000" >> .env
elif [ ! -z $GITPOD_WORKSPACE_URL ]; then
    # replace https:// with https://3000-
    REPLACED_WITH_PORT_URL=$(echo $GITPOD_WORKSPACE_URL | sed 's/https:\/\//https:\/\/3000-/g')

    NEXT_PUBLIC_API_SERVICE_URL=$REPLACED_WITH_PORT_URL
    # add_env "NEXT_PUBLIC_API_SERVICE_URL" $NEXT_PUBLIC_API_SERVICE_URL
    echo "NEXT_PUBLIC_API_SERVICE_URL=$NEXT_PUBLIC_API_SERVICE_URL" >> .env

    NEXT_PUBLIC_HOST_SERVICE_URL=$REPLACED_WITH_PORT_URL
    # add_env "NEXT_PUBLIC_HOST_SERVICE_URL" $NEXT_PUBLIC_HOST_SERVICE_URL
    echo "NEXT_PUBLIC_HOST_SERVICE_URL=$NEXT_PUBLIC_HOST_SERVICE_URL" >> .env

    echo "API_SERVICE_URL=http://localhost:4000" >> .env
# else
    # NEXT_PUBLIC_API_SERVICE_URL=http://localhost:4000
    # add_env "NEXT_PUBLIC_API_SERVICE_URL" $NEXT_PUBLIC_API_SERVICE_URL

    # NEXT_PUBLIC_HOST_SERVICE_URL=http://localhost:3000
    # add_env "NEXT_PUBLIC_HOST_SERVICE_URL" $NEXT_PUBLIC_HOST_SERVICE_URL
fi

DATABASE_HOST=localhost
add_env "DATABASE_HOST" $DATABASE_HOST

DATABASE_NAME=$(get_env "$BASH_SOURCE" "POSTGRES_DB" "../db/.env")
add_env "DATABASE_NAME" $DATABASE_NAME

DATABASE_USERNAME=$(get_env "$BASH_SOURCE" "POSTGRES_USER" ../db/.env)
add_env "DATABASE_USERNAME" $DATABASE_USERNAME

DATABASE_PASSWORD=$(get_env "$BASH_SOURCE" "POSTGRES_PASSWORD" ../db/.env)
add_env "DATABASE_PASSWORD" $DATABASE_PASSWORD

DATABASE_PORT=$(get_env "$BASH_SOURCE" "POSTGRES_PORT" ../db/.env)
add_env "DATABASE_PORT" $DATABASE_PORT

add_env "DATABASE_NO_SSL" true

KV_PORT=$(get_env "$BASH_SOURCE" "REDIS_PORT" ../redis/.env)
add_env "KV_PORT" $KV_PORT

KV_PASSWORD=$(get_env "$BASH_SOURCE" "REDIS_PASSWORD" ../redis/.env)
add_env "KV_PASSWORD" $KV_PASSWORD

RBAC_COOKIE_SESSION_SECRET=$(generate_random_string)
add_env "RBAC_COOKIE_SESSION_SECRET" $RBAC_COOKIE_SESSION_SECRET

RBAC_JWT_SECRET=$(generate_random_string)
add_env "RBAC_JWT_SECRET" $RBAC_JWT_SECRET

RBAC_SECRET_KEY=$(generate_random_string)
add_env "RBAC_SECRET_KEY" $RBAC_SECRET_KEY

add_env "FILE_STORAGE_PROVIDER" "local"

add_env "RBAC_SUBJECT_IDENTITY_EMAIL" "admin@example.com"
add_env "RBAC_SUBJECT_IDENTITY_PASSWORD" "Password123!"