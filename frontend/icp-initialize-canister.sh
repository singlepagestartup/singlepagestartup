#!/bin/bash
# Do every stage in icp-create-identity.sh
# ./icp-create-identity.sh

# Now you can deploy your canisters to Internet Computer network
# You need to prepare your repo for deploying
# Fill well-known/ic-domains with data
# Replace your_domain_name.com with your domain
# echo "<your_domain_name.com>" > .well-known/ic-domains
# domain="<your_domain_name.com>"
domain="sps-lite.singlepagestartup.com"
echo $domain > .well-known/ic-domains

# Set your domain in .env.icp file
cp .env.production .env.production.dump
sed -i -e "s/sps-lite.singlepagestartup.com/$domain/" .env.production && rm .env.production-e
sed -i -e "s/https:\/\/sps-lite-api.singlepagestartup.com/http:\/\/127.0.0.1:1337/" .env.production && rm .env.production-e

# Your repo is ready for deploying now
# Give access to ./icp-build-static.sh script
chmod +x ./icp-build-static.sh

# Run that script
# It will build your frontend for Internet Computer network
# !!! Your backend should be started at your local machine !!!
./icp-build-static.sh

# Delete canister_ids.json that you get from sps-lite repository
# You will create your own canister_ids.json with your canister_id
rm -rf ./canister_ids.json

# Give access to initialization script
chmod +x ./icp-create-canister.sh

# Run initialization script
./icp-create-canister.sh

# Give access to connect domain script
chmod +x ./icp-connect-domain.sh

# Connect domain to your project
./icp-connect-domain.sh $domain