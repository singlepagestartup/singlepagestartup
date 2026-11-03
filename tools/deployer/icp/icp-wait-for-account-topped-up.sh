#!/bin/bash
balance=$(dfx ledger --network ic balance | awk '{print $1}')

if (( $(echo "$balance < 1" | bc -l) ));
then
  echo "Current amout balance is $balance, but should be reater than 1 ICP"
  echo "Waiting for account to be topped up..."
  echo "Please transfer minimum 1 ICP:"
  echo $(dfx ledger account-id --network ic)
fi

while (( $(echo "$balance < 1" | bc -l) ));
do
  sleep 5
  echo "..."
  balance=$(dfx ledger --network ic balance | awk '{print $1}')
done

echo "Account topped up! You can create containers!"