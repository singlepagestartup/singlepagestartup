#!/bin/bash

# Import wallet to the file
touch singlepagestartup-deployer-wallet.txt
echo $ICP_DEPLOYER_WALLET > singlepagestartup-deployer-wallet.txt

# Import identity to the file from github secrets
touch singlepagestartup-deployer.pem.base64
echo $ICP_DEPLOYER_KEY > singlepagestartup-deployer.pem.base64

touch singlepagestartup-deployer.pem
openssl base64 -d -in singlepagestartup-deployer.pem.base64 -out singlepagestartup-deployer.pem