#!/bin/bash
cp .env.production .env.production.dump
cp .env.icp .env.production

./icp-build-static.sh

cp .ic-assets.json out/.ic-assets.json
cp -R .well-known out/

dfx deploy --network ic

cp .env.production.dump .env.production
rm -rf .env.production.dump
# yes | dfx canister install sps_lite --mode reinstall --network ic