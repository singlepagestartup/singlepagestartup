#!/bin/bash
while read line; do
  echo "$line"

  if [[ $line == *"Canister created with id"* ]]; then
    canister_id=$(echo $line | sed -e 's/Canister created with id://' | sed -e 's/"//g')

    echo $canister_id > singlepagestartup-deployer-wallet.txt

    echo $canister_id
  fi
done