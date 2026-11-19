# Order work

A work record connects one store order, its buyer and its CRM task. A physical order keeps its preparation, tracking and delivery history here. A commissioned service keeps a private original and a separate preview for each result version.

The offer and cart link to the order’s Social thread. Its message composer accepts both text and files. When the assigned agent publishes a result, its reply identifies the exact version. The buyer can view the image preview in that message and use the same acceptance controls as in the cart.

The customer can request changes or accept a particular version. Its price and currency are saved with the version. A cost-based price also records the settled reservations, conversion rate, source, timestamp and multiplier that produced it. Checkout uses the accepted amount and selected order lines. Editing the catalogue later affects future quotes.

The order service checks the payment intent, invoice, amount, currency and version before recording payment. In the same transaction it queues fulfillment. The worker grants access to the purchased original and receipt for that buyer. Repeating the payment notification or recovering an expired worker lease returns the same delivery. For a physical order, the assigned employee records preparation, tracking and delivery evidence through the CRM workspace or Subject order API.

At payment, an installation can also capture customer-facing product specifications for the exact offer. The authenticated buyer reads the snapshot from this order. Each document carries its source version. Deliveries made before the feature keep their historical data. If the specification reader fails, the payment remains valid and the server records a diagnostic for that order.

For the public Subject routes and authorized artifact reads, see the [order work SDK](../../../rbac/models/subject/sdk/model/src/lib/order-work.ts). To migrate previously public receipts, use the [Ecommerce receipt procedure](../../README.md#legacy-order-receipts).
