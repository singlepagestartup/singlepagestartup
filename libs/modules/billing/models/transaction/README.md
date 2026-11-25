# Transaction

A reservation holds funds in the sender’s wallet until work settles or the payer releases the hold. Posting a transfer debits the sender and credits the recipient in the same currency. Settlement records the work charge, provider charge and any refund of an unused advance. An unknown provider result leaves the reservation open for reconciliation.

The store and operation key identify one transaction. Retrying the same terms returns the saved receipt. Retrying with a different amount, party, task or currency fails. `transactions-to-wallets` identifies the wallets that supplied and received the funds. The transaction retains the subject IDs used to authorize the work and attribute the charge.

The Subject service checks access and resolves wallet ownership. Billing posts the transfer and its wallet links within the caller’s transaction.

## Upgrading an installation

Pause paid intake, checkout and wallet writes. Drain accepted provider requests and record outstanding request IDs for reconciliation. Back up PostgreSQL and receipt storage.

From `apps/api`, save the opening balances, invoices, payment intents, store IDs and receipt links to a private manifest outside the checkout. Then run the standard repository migration and compare the result before reopening intake.

```sh
bun src/db/wallet-cutover.ts prepare /absolute/private/wallets-before.json
(cd ../.. && npx nx run api:db:migrate)
bun src/db/wallet-cutover.ts verify /absolute/private/wallets-before.json
bun src/db/order-receipts.ts --list
```

The migration preserves each balance row, receipt ID, operation key, provider connection ID and credential version. Old tables remain available with a `_legacy` suffix. Any conflicting ID or missing provider connection rolls back the cutover. The previous clients’ subject–currency route reads and writes the corresponding Billing balances. Install the API and workers together so all transfers use the same ledger.
