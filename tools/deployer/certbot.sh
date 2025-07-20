#!/bin/bash
. ./get_environment_type.sh
get_environment_type "$2"

./create_inventory.sh

. ./get_env.sh

SERVICE_NAME=$(get_env "$BASH_SOURCE" "CERTBOT_SERVICE_NAME")

USE_CLOUDFLARE_SSL=$(get_env "$BASH_SOURCE" "USE_CLOUDFLARE_SSL")
DOMAIN=$(get_env "$BASH_SOURCE" "DOMAIN")

HOST_SERVICE_SUBDOMAIN=$(get_env "$BASH_SOURCE" "HOST_SERVICE_SUBDOMAIN")
API_SERVICE_SUBDOMAIN=$(get_env "$BASH_SOURCE" "API_SERVICE_SUBDOMAIN")
TELEGRAM_SERVICE_SUBDOMAIN=$(get_env "$BASH_SOURCE" "TELEGRAM_SERVICE_SUBDOMAIN")
TRAEFIK_SERVICE_SUBDOMAIN=$(get_env "$BASH_SOURCE" "TRAEFIK_SERVICE_SUBDOMAIN")
PORTAINER_SERVICE_SUBDOMAIN=$(get_env "$BASH_SOURCE" "PORTAINER_SERVICE_SUBDOMAIN")

if [ -z "$SERVICE_NAME" ]; then
    echo "Skip $0 (SERVICE_NAME not set)"
    exit 0
fi

if [ "$USE_CLOUDFLARE_SSL" == "true" ]; then
    echo "Skip $0 (Cloudflare SSL in use)"
    exit 0
fi

if [ "$1" != "down" ]; then
    ansible-playbook \
        ./certbot/install_certbot.yaml && \
    ansible-playbook \
        ./certbot/create_certbot.yaml \
        -e "SERVICE_NAME=$SERVICE_NAME" && \
    ansible-playbook \
        ./certbot/generate_certbot_renew_script.yaml \
        -e "DOMAIN=$DOMAIN \
            HOST_SERVICE_SUBDOMAIN=$HOST_SERVICE_SUBDOMAIN \
            API_SERVICE_SUBDOMAIN=$API_SERVICE_SUBDOMAIN \
            TELEGRAM_SERVICE_SUBDOMAIN=$TELEGRAM_SERVICE_SUBDOMAIN \
            TRAEFIK_SERVICE_SUBDOMAIN=$TRAEFIK_SERVICE_SUBDOMAIN \
            PORTAINER_SERVICE_SUBDOMAIN=$PORTAINER_SERVICE_SUBDOMAIN"
else
    ansible-playbook \
        ./certbot/delete_certbot_renew_script.yaml && \
    ansible-playbook \
        ./certbot/delete_certbot.yaml \
        -e "SERVICE_NAME=$SERVICE_NAME"
fi
