#!/bin/bash
# Starting dfx at the background
dfx start --background

# Set canister id to variable
wallet_canister_id=$(cat singlepagestartup-deployer-wallet.txt)

# Now you are ready to deploy your canisters to Internet Computer network
# You can set your exported deployer as new by adding it with identity import
dfx identity import singlepagestartup-deployer singlepagestartup-deployer.pem --storage-mode plaintext

# Set that deployer as current
dfx identity use singlepagestartup-deployer

# Connect wallet to your identity
dfx identity set-wallet --network ic $wallet_canister_id

# Now you can test that wallet is connected by running command
# It should return something like that
# 2.124 TC (trillion cycles).
dfx wallet balance --network=ic