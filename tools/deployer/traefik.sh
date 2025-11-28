#!/bin/bash
. ./get_environment_type.sh

get_environment_type $2

./create_inventory.sh

. ./get_env.sh

DOMAIN=$(get_env "$BASH_SOURCE" "DOMAIN")

TRAEFIK_SERVICE_SUBDOMAIN=$(get_env "$BASH_SOURCE" "TRAEFIK_SERVICE_SUBDOMAIN")
TRAEFIK_USERNAME=$(get_env "$BASH_SOURCE" "TRAEFIK_USERNAME")
TRAEFIK_PASSWORD=$(get_env "$BASH_SOURCE" "TRAEFIK_PASSWORD")
USE_CLOUDFLARE_SSL=$(get_env "$BASH_SOURCE" "USE_CLOUDFLARE_SSL")

SERVICE_URL=$TRAEFIK_SERVICE_SUBDOMAIN.$DOMAIN
SERVICE_A=$TRAEFIK_SERVICE_SUBDOMAIN

if [ "$1" != "down" ]
then
    ansible-playbook \
        ./traefik/create_traefik.yaml \
        -e "DOMAIN=$DOMAIN \
            SERVICE_URL=$SERVICE_URL \
            TRAEFIK_USERNAME=$TRAEFIK_USERNAME \
            TRAEFIK_PASSWORD=$TRAEFIK_PASSWORD \
            USE_CLOUDFLARE_SSL=$USE_CLOUDFLARE_SSL \
            ENVIRONMENT_TYPE=$ENVIRONMENT_TYPE" && \
    ./domain.sh present $SERVICE_URL $SERVICE_A
else
    ansible-playbook \
        ./traefik/delete_traefik.yaml && \
    ./domain.sh down $SERVICE_URL $SERVICE_A
fi