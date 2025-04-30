#!/bin/bash
# Do every stage in icp-create-identity.sh
# ./icp-create-identity.sh

# Now you can deploy your canisters to Internet Computer network
# You need to prepare your repo for deploying
# Fill well-known/ic-domains with data
FULL_DOMAIN=$(cat .env.icp | grep "NEXT_PUBLIC_HOST_SERVICE_URL" | cut -d '=' -f2 | sed 's/https:\/\///g')
echo $FULL_DOMAIN > .well-known/ic-domains

# Delete canister_ids.json that you get from singlepagestartup repository
# You will create your own canister_ids.json with your canister_id
rm -rf ./canister_ids.json

# Run initialization script
chmod +x ./icp-update-canister.sh
./icp-update-canister.sh

# Create records in Cloudflare
chmod +x ./icp-create-dns-records-in-cloudflare.sh
./icp-create-dns-records-in-cloudflare.sh $FULL_DOMAIN

# Give access to connect domain script
chmod +x ./icp-connect-domain.sh
./icp-connect-domain.sh $domain