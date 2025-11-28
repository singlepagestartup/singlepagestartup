#!/bin/bash
. ./get_env.sh

SERVICE_URL=$2
SERVICE_A=$3

DOMAIN=$(get_env "$BASH_SOURCE" "DOMAIN")
USE_CLOUDFLARE_SSL=$(get_env "$BASH_SOURCE" "USE_CLOUDFLARE_SSL")
CLOUDFLARE_ACCOUNT_EMAIL=$(get_env "$BASH_SOURCE" "ROOT_CLOUDFLARE_ACCOUNT_EMAIL")
CLOUDFLARE_ACCOUNT_API_KEY=$(get_env "$BASH_SOURCE" "ROOT_CLOUDFLARE_ACCOUNT_API_KEY")
CERTBOT_EMAIL=$(get_env "$BASH_SOURCE" "CERTBOT_EMAIL")

if [ "$1" != "down" ]; then
  echo "[INFO] Creating DNS record for $SERVICE_URL"
  ansible-playbook ./cloudflare/dns_records.yaml \
    -e "CLOUDFLARE_ACCOUNT_EMAIL=$CLOUDFLARE_ACCOUNT_EMAIL \
        CLOUDFLARE_ACCOUNT_API_KEY=$CLOUDFLARE_ACCOUNT_API_KEY \
        DOMAIN=$DOMAIN \
        STATE=present \
        SERVICE_URL=$SERVICE_URL \
        SERVICE_A=$SERVICE_A \
        USE_CLOUDFLARE_SSL=$USE_CLOUDFLARE_SSL"

  if [ "$USE_CLOUDFLARE_SSL" = "true" ]; then
    echo "[INFO] Issuing Cloudflare Origin Certificate for $SERVICE_URL"
    ansible-playbook ./cloudflare/create_ssl_certificate.yaml \
      -e "CLOUDFLARE_ACCOUNT_EMAIL=$CLOUDFLARE_ACCOUNT_EMAIL \
          CLOUDFLARE_ACCOUNT_API_KEY=$CLOUDFLARE_ACCOUNT_API_KEY \
          DOMAIN=$DOMAIN \
          STATE=present \
          SERVICE_URL=$SERVICE_URL"
  else
    echo "[INFO] Issuing Let's Encrypt certificate via Certbot for $SERVICE_URL"
    ansible-playbook ./certbot/create_ssl_certificate.yaml \
      -e "SERVICE_URL=$SERVICE_URL \
          CERTBOT_EMAIL=$CERTBOT_EMAIL"
  fi

  echo "[INFO] Registering certificate with Traefik"
  ansible-playbook ./traefik/add_service_cert_to_traefik.yaml \
    -e "SERVICE_URL=$SERVICE_URL"
else
  echo "[INFO] Removing DNS record for $SERVICE_URL"
  ansible-playbook ./traefik/remove_service_cert_from_traefik.yaml \
    -e "SERVICE_URL=$SERVICE_URL" && \
  ansible-playbook ./cloudflare/dns_records.yaml \
    -e "CLOUDFLARE_ACCOUNT_EMAIL=$CLOUDFLARE_ACCOUNT_EMAIL \
        CLOUDFLARE_ACCOUNT_API_KEY=$CLOUDFLARE_ACCOUNT_API_KEY \
        DOMAIN=$DOMAIN \
        STATE=absent \
        SERVICE_URL=$SERVICE_URL \
        SERVICE_A=$SERVICE_A \
        USE_CLOUDFLARE_SSL=$USE_CLOUDFLARE_SSL"

    if [ "$USE_CLOUDFLARE_SSL" = "true" ]; then
    echo "[INFO] Deleting Cloudflare Origin Certificate for $SERVICE_URL"
    ansible-playbook ./cloudflare/delete_ssl_certificate.yaml \
        -e "CLOUDFLARE_ACCOUNT_EMAIL=$CLOUDFLARE_ACCOUNT_EMAIL \
            CLOUDFLARE_ACCOUNT_API_KEY=$CLOUDFLARE_ACCOUNT_API_KEY \
            DOMAIN=$DOMAIN \
            STATE=absent \
            SERVICE_URL=$SERVICE_URL"
    else
    echo "[INFO] Deleting Let's Encrypt certificate for $SERVICE_URL"
    ansible-playbook ./certbot/delete_ssl_certificate.yaml \
        -e "SERVICE_URL=$SERVICE_URL"
    fi
fi
