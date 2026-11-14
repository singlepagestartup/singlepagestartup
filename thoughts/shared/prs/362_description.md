Closes #357.

## Order fulfilment

A customer receives a product role or balance credit when the order has a linked successful Payment Intent with a paid Invoice. This applies to provider payments, manually recorded payments and the zero-amount settlement for the initial Free subscription.

Before this change, a paid Invoice was sufficient for the first grant even while its Payment Intent was still processing. The same confirmation rule now determines **which payment** supplies the amount, interval and Invoice for a subscription renewal. If a customer has an earlier successful payment and a newer attempt is still processing, the earlier payment cannot confirm that newer Invoice. The next order check can accept the renewal when its own intent succeeds. A previously revoked role stays revoked.

A customer can still inspect the invoice while payment is pending. The recurring order check scans up to 100 orders at a time and advances through both new purchases and recurring orders, including when the first batch remains unconfirmed. The API logs skipped fulfilment with the order ID, status and subject ID. Per-process deduplication keeps up to 10,000 keys for 24 hours.

## Verification

- Real API and PostgreSQL, using an isolated order and subject. Setting the order to `paid` gave the customer zero grants and zero balance. Linking a paid invoice to a processing intent had the same result. Confirming that intent advanced the order to `approving`, granted one role and credited 100 units. Repeating the check kept one role and 100 units.
- The renewal regression tests cover two payment attempts on one order. The new invoice and its terms take effect only after its own intent succeeds.
- All 1,472 RBAC, Ecommerce and Billing unit tests and eight PostgreSQL integration tests passed. API type checking, lint on the changed TypeScript and the module dependency check also passed.

## Downstream migration

Projects with custom payment handlers, offline payments or imported orders should link the Payment Intent to the Order and its currency, and the paid Invoice to that same successful intent. Supply the amount and terms for that purchase. The operator procedure is documented under “Ecommerce Order Fulfilment” in `libs/modules/rbac/models/subject/README.md`.

Verify that a manually flagged order waits for payment, a confirmed purchase grants its role and balance once, and a pending renewal leaves the current subscription period intact. This change introduces no database migration or new environment setting.
