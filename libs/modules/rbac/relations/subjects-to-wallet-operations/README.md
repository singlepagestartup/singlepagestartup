# Subject wallet operations

A wallet is the sum of a Subject's balance rows in a single Billing currency. A reservation holds part of that balance for a particular store, CRM task and attempt. Its available amount excludes open holds. Settlement records the actual charge, releases the remainder and posts transfers under the same PostgreSQL transaction. A repeated operation key returns the original receipt when the parties and terms match. Changed terms are a conflict.

For a model call, the funding Subject pays the assigned assistant for the work. The assistant transfers the computation charge to the store's technical provider Subject. If the owner advances funds to that provider for this attempt, settlement applies the advance to computation and refunds any excess. The provider bills the external account attached to the API key separately. The reservation records the account label, request ID, measured usage or rate-card estimate, and attempt state.

Amounts use decimal strings with at most twelve fractional places. The ledger locks the affected wallets in a stable order before checking balances. Application code calls the Subject's work ledger. Store owners read their scoped receipts through the provider settings endpoint. Ledger records are excluded from fixture dump and seed.
