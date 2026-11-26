# Wallet currency balances

Each row records an amount in one currency for one wallet. The available balance is the sum of those rows less outstanding reservations. The migration preserves historical row IDs and amounts, including separate top-ups in the same currency. Transfers update both wallets in one database transaction.
