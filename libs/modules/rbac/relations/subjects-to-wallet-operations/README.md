# Subject wallet operations

A wallet is the sum of a Subject's balance rows in a single Billing currency. A reservation holds part of that balance for a particular store, CRM task and attempt. Its available amount excludes open holds. Settlement records the actual charge, releases the remainder and posts transfers under the same PostgreSQL transaction. A repeated operation key returns the original receipt when the parties and terms match. Changed terms are a conflict.

For a model call, the funding Subject pays the assigned assistant for the work. The assistant transfers the computation charge to the store's technical provider Subject. If the owner advances funds to that provider for this attempt, settlement applies the advance to computation and refunds any excess. The provider bills the external account attached to the API key separately. The reservation records the account label, request ID, measured usage or rate-card estimate, and attempt state.

Amounts use decimal strings with at most twelve fractional places. The ledger locks the affected wallets in a stable order before checking balances. Application code calls the Subject's work ledger. Store owners read their scoped receipts through the provider settings endpoint. Ledger records are excluded from fixture dump and seed.

## Upgrade an installation

Pause wallet writes, checkout and incoming paid work on the installation. Drain accepted provider requests and record outstanding provider request IDs for reconciliation. The previous route did not persist a work attempt for every external call, so match uncertain requests against the external account statement before reopening traffic. Back up PostgreSQL and receipt storage.

From `apps/api`, run the commands below with the target installation's database settings. The private manifest contains opening balances by Subject and Currency, invoice and payment intent amounts and states, store IDs and receipt links. Store it outside the checkout. Prepare takes a read-only snapshot and refuses to overwrite a file.

```sh
bun src/db/wallet-cutover.ts prepare /absolute/private/wallets-before.json
# Run the installation's repository migrations with its existing balances and data.
bun src/db/wallet-cutover.ts verify /absolute/private/wallets-before.json
bun src/db/order-receipts.ts --list
```

Verify checks every saved amount and ID before accepting new writes. Inspect each reported difference against the backup. A wallet continues to use the existing Subject–Currency rows. Its first new transfer records the actual sender, recipient and task. Install the new clients and workers together, migrate historical receipts, then configure the owner, outbound identity and spending terms for each funded store. Test a paid reply and a private download as the buyer. A failed check leaves paid intake paused while the operator reconciles the existing reservations and payments.
