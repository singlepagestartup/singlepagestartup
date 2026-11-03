#!/bin/bash
# Starting dfx at the background
dfx start --background

# Creating new identity with name "singlepagestartup-deployer"
# you will get your seed phrase, please save it
dfx identity new singlepagestartup-deployer

# You can list all your identites by running command
dfx identity list

# For selecting created identity "singlepagestartup-deployer" run command
dfx identity use singlepagestartup-deployer

# Export your identity by running command
# And store exported key at the file
# You can use that file on another machine for deploying canisters
# !!! DO NOT COMMIT IT TO GIT !!!
dfx identity export singlepagestartup-deployer > singlepagestartup-deployer.pem

# Transform to base64 for github actions
openssl base64 -in singlepagestartup-deployer.pem -out singlepagestartup-deployer.pem.base64

# Check that you selected correct identity by running command
# Should return "singlepagestartup-deployer"
dfx identity whoami

# Check your ledger wallet balance now
# And fill it with ICP if needed
chmod +x ./icp-wait-for-account-topped-up.sh
./icp-wait-for-account-topped-up.sh


# Now run command for creating wallet for cycles and
# passing data to get-wallet-address script, that creates .txt file with wallet id
# It will took some time and you will get something like that
# Transfer sent at block height 6719981
# Using transfer at block height 6719981
# Canister created with id: "cfhaf-gaaaa-aaaal-qccpq-cai"
chmod +x ./icp-save-wallet-address.sh
dfx ledger --network ic create-canister $(dfx identity get-principal) --amount 1 | ./icp-save-wallet-address.sh

# Set canister id to variable
wallet_canister_id=$(cat singlepagestartup-deployer-wallet.txt)

# Copy id of created canister and deploy wallet to it, !!! CHANGE ID OF CANISTER !!!
# dfx identity --network=ic deploy-wallet <paste_your_wallet_canister_id_here>
# 
# You will get something like that
# Creating a wallet canister on the ic network./
# The wallet canister on the "ic" network for user "singlepagestartup-deployer" is "cfhaf-gaaaa-aaaal-qccpq-cai"
dfx identity --network=ic deploy-wallet $wallet_canister_id

# Now you can check your wallet cycles balance
# You will get something like that
# 2.124 TC (trillion cycles).
dfx wallet balance --network=ic