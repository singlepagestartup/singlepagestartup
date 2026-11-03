#!/bin/bash
# Get more info in documentation
# https://internetcomputer.org/docs/current/developer-docs/production/custom-domain/dns-setup

FULL_DOMAIN_NAME=$1
CLOUDFLARE_SUBDOMAIN=""

if [ ! -z $(echo $FULL_DOMAIN_NAME | cut -d '.' -f3) ];
then
    CLOUDFLARE_SUBDOMAIN=$(echo $FULL_DOMAIN_NAME | cut -d '.' -f1)
fi

CLOUDFLARE_ZONE_ID=$(cat .env.cloudflare | grep "CLOUDFLARE_ZONE_ID" | cut -d '=' -f2)
CLOUDFLARE_ZONE_NAME=$(cat .env.cloudflare | grep "CLOUDFLARE_ZONE_NAME" | cut -d '=' -f2)
CLOUDFLARE_API_TOKEN=$(cat .env.cloudflare | grep "CLOUDFLARE_API_TOKEN" | cut -d '=' -f2)

# echo $CLOUDFLARE_ZONE_ID
# echo $CLOUDFLARE_ZONE_NAME
# echo $CLOUDFLARE_API_TOKEN

CANISTER_ID=$(./icp-get-canister-address.sh)

echo "CANISTER_ID: $CANISTER_ID"

BODY_1=""
BODY_2=""
BODY_3=""

if [ -z "$CLOUDFLARE_SUBDOMAIN" ];
then
    BODY_1='{
        "name": "@",
        "type": "CNAME",
        "content": "icp1.io",
        "proxied": false,
        "ttl": 1
    }'

    BODY_2='{
        "name": "_acme-challenge",
        "type": "CNAME",
        "content": "_acme-challenge.'"$CLOUDFLARE_ZONE_NAME"'.icp2.io",
        "proxied": false,
        "ttl": 1
    }'

    BODY_3='{
        "name": "_canister-id",
        "type": "TXT",
        "content": "'"$CANISTER_ID"'",
        "proxied": false,
        "ttl": 1
    }'
else
    BODY_1='{
        "name": "'"$CLOUDFLARE_SUBDOMAIN"'",
        "type": "CNAME",
        "content": "icp1.io",
        "proxied": false,
        "ttl": 1
    }'

    BODY_2='{
        "name": "_acme-challenge.'"$CLOUDFLARE_SUBDOMAIN"'",
        "type": "CNAME",
        "content": "_acme-challenge.'"$CLOUDFLARE_SUBDOMAIN"'.'"$CLOUDFLARE_ZONE_NAME"'.icp2.io",
        "proxied": false,
        "ttl": 1
    }'

    BODY_3='{
        "name": "_canister-id.'"$CLOUDFLARE_SUBDOMAIN"'",
        "type": "TXT",
        "content": "'"$CANISTER_ID"'",
        "proxied": false,
        "ttl": 1
    }'
fi

echo "Pass BODY_1 to Cloudflare:"
echo $BODY_1
curl --request POST \
  --url https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --data "$BODY_1"

echo "Pass BODY_2 to Cloudflare:"
echo $BODY_2
curl --request POST \
  --url https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --data "$BODY_2"

echo "Pass BODY_3 to Cloudflare:"
echo $BODY_3
curl --request POST \
  --url https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records \
  --header 'Content-Type: application/json' \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  --data "$BODY_3"