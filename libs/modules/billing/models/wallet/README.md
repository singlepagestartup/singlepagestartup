# Wallet

A wallet has its own UUID. RBAC links a subject to its default wallet through `subjects-to-billing-module-wallets`. Billing keeps each currency balance in `wallets-to-currencies` and records the wallets involved in each transaction through `transactions-to-wallets`.
