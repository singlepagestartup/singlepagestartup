# Social Profiles to Ecommerce Orders

Each Order belongs to one Profile through `profileId` and `ecommerceModuleOrderId`.
The order key is unique. Profile deletion is restricted while it owns Orders.
Deleting an Order removes its relation.

The relation uses standard CRUD SDKs, `find`, default and administrative frontend
variants. RBAC verifies the caller's access to a Profile before personal order operations.
Payment purchaser records belong to RBAC and use
`subjects-to-billing-module-payment-intents` with `variant="purchaser"`.

Order data and this relation are excluded from repository dump and seed.
Generate schema migrations through
`npx nx run @sps/social:relations:profiles-to-ecommerce-module-orders:repository-generate`.
