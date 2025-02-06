#!/bin/bash
. ./get_env.sh

SERVICE_URL=$2
SERVICE_A=$3

DOMAIN=$(get_env "$BASH_SOURCE" "DOMAIN")

CLOUDFLARE_ACCOUNT_EMAIL=$(get_env "$BASH_SOURCE" "ROOT_CLOUDFLARE_ACCOUNT_EMAIL")
CLOUDFLARE_ACCOUNT_API_KEY=$(get_env "$BASH_SOURCE" "ROOT_CLOUDFLARE_ACCOUNT_API_KEY")

if [ "$1" != "down" ]
then
    ansible-playbook \
        ./cloudflare/create_ssl_certificate.yaml \
        -e "CLOUDFLARE_ACCOUNT_EMAIL=$CLOUDFLARE_ACCOUNT_EMAIL \
            CLOUDFLARE_ACCOUNT_API_KEY=$CLOUDFLARE_ACCOUNT_API_KEY \
            DOMAIN=$DOMAIN \
            STATE=present \
            SERVICE_URL=$SERVICE_URL" && \
    ansible-playbook \
        ./cloudflare/dns_records.yaml \
        -e "CLOUDFLARE_ACCOUNT_EMAIL=$CLOUDFLARE_ACCOUNT_EMAIL \
            CLOUDFLARE_ACCOUNT_API_KEY=$CLOUDFLARE_ACCOUNT_API_KEY \
            DOMAIN=$DOMAIN \
            STATE=present \
            SERVICE_URL=$SERVICE_URL \
            SERVICE_A=$SERVICE_A" && \
    ansible-playbook \
        ./traefik/add_service_cert_to_traefik.yaml \
        -e "SERVICE_URL=$SERVICE_URL"
else
    ansible-playbook \
        ./cloudflare/dns_records.yaml \
        -e "CLOUDFLARE_ACCOUNT_EMAIL=$CLOUDFLARE_ACCOUNT_EMAIL \
            CLOUDFLARE_ACCOUNT_API_KEY=$CLOUDFLARE_ACCOUNT_API_KEY \
            DOMAIN=$DOMAIN \
            STATE=absent \
            SERVICE_URL=$SERVICE_URL \
            SERVICE_A=$SERVICE_A" && \
    ansible-playbook \
        ./cloudflare/delete_ssl_certificate.yaml \
        -e "CLOUDFLARE_ACCOUNT_EMAIL=$CLOUDFLARE_ACCOUNT_EMAIL \
            CLOUDFLARE_ACCOUNT_API_KEY=$CLOUDFLARE_ACCOUNT_API_KEY \
            DOMAIN=$DOMAIN \
            STATE=absent \
            SERVICE_URL=$SERVICE_URL"
fi