# Ecommerce Order Model

## Purpose

Orders store cart and checkout information, including status and metadata.
The cart quantity counts primary line quantities. Attached service lines do not
increase the badge; a service bought as its own primary line still counts.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `status`: order status (default: `new`).
- `type`: order type (default: `cart`).
- `receipt`: receipt reference string.
- `comment`: optional comment.
- `subscriptionPeriodStartsAt`, `subscriptionPeriodEndsAt`: nullable fixed
  subscription delivery interval.
- `subscriptionPeriodInvoiceId`: nullable accepted paid Invoice anchor.
- `subscriptionRevokedAt`: nullable server time of explicit Role revocation;
  ordinary updates cannot set or clear it.
- `paymentFailureCanceledAt`: nullable server time identifying an automatic
  unpaid-payment cancellation. Ordinary writes cannot set it; an explicit
  cancellation clears it.
- `subscriptionSourceOrderId`, `subscriptionSourceInvoiceId`,
  `subscriptionSourceInterval`: server-managed source of the next delivery.
  A unique source-order/invoice pair makes retries return the same next Order.
- `subscriptionScheduledStartsAt`, `subscriptionScheduledEndsAt`: trusted provider
  coverage dates. Legacy accepted dates remain unchanged when provider facts
  establish the boundary for future periods.
- `subscriptionProviderInvoiceId`: unique provider/Invoice identity used to
  correlate replayed subscription events with their own Order.

The Subject purchase-history response adds `purchaseDetails` to the Order.
Its SDK interface groups saved invoice shares, receipts, the next period and
available payment actions for the current buyer. Orders, Invoices and their
relations supply those records.

## Legacy cart and saved payments

An older open cart without an offer cannot pay through a Product price.
The buyer selects a Store on the cart line. The standard Subject selection
operation saves the current quote and delivery before checkout can reserve stock.
Multiple products, ambiguous offers, missing delivery or unavailable stock leave
the cart open for correction. Existing durable historical Invoices resume their
own payment context without a new catalog quote.

## Subscription delivery period

RBAC order proceed calls the internal `acceptSubscriptionPeriod` capability
after checking the current Subject's ownership and product Role grants. The
Order service reads the configured interval and its own paid Invoices. It
records the paid period once on that Order. Each subsequent period has a new
Order, PaymentIntent and Invoice. A provider receipt supplies its coverage
dates for automatic billing. The local interval and previous paid deadline
determine coverage for a separately paid period.

Generic create/update cannot change period fields. Unchanged fields in existing
full-record update payloads are removed before writing. An OPEN Invoice and an
unrelated Order update do not change the deadline. Access expires at
`now >= subscriptionPeriodEndsAt`; requested cancellation keeps the original
deadline. Explicit Role deletion stamps `subscriptionRevokedAt` on affected
owned subscription Orders. Proceed, repeated paid transitions, recreated Roles
and automatic renewal cannot restore those Orders.

When an original checkout and its retry both settle for the same Product,
Proceed accepts each Order's Invoice and configured Token allocation once.
Each Order keeps its own paid period; those periods may overlap and are not
combined into consecutive months. The newest accepted Order by creation time,
then ID, keeps renewal. The older Order requests cancellation and retains its
paid access until its original deadline. Settlement order and repeated checks
do not change that selection.

A legacy provider-managed Payment Intent shared by several Orders keeps renewal
so cancellation cannot stop other Products. An independent retry requests
cancellation instead. New subscription checkouts use one Payment Intent per
Order. Two legacy shared contracts cannot be split automatically; their
cancellation fails explicitly for operator reconciliation. Provider cancellation
runs after delivery commits, and pending requests retry through Proceed.

Extended Order reads preserve existing payment terms when a Product's prices
or offered currencies change. The latest paid Invoice on a successful Payment
Intent in the Order's currency supplies the amount and interval. Creation time
and then Invoice ID determine the order. The Product type still selects delivery.
A Telegram `one_off` payment can settle a subscription with its saved interval.
New purchase snapshots supply each Order's own charges and share of a common
Invoice. History retains seller, fulfiller, destination and service quantities
after catalog changes. Older shared Invoices without an allocation show their
total once with the related Orders.

During the final 24 hours of a paid period, Subject Proceed prepares its next
Order. A unique source-order/accepted-Invoice pair makes repeated cron runs,
concurrent requests and receipt replays reuse that period. The next selection
keeps the primary Product and services with `recurrence=each`; first-only
services stay on the original purchase. Current prices and available stock
must still support the selection. A changed price leaves the new cart for
buyer confirmation; unavailable stock stops an automatic Stripe renewal.

For an existing Stripe subscription contract, preparation reserves stock and
creates the local Intent, Currency link and draft Invoice without a provider
checkout or debit request. Stripe owns the charge schedule. Its authenticated
Invoice adopts the draft and settles that period's reservation once. Webhooks
and the scheduled provider reconciliation use the same correlation. Ordinary
Stripe one-off payments and manual providers retain their hosted payment flow.
A prepared successor is available through its owning Subject's
`purchaseDetails.nextPeriod`, including status, dates, totals and payment URL.

Cancellation stops the provider contract and closes unpaid successors, voids
their local Invoices and releases their stock. Paid access retains its accepted
deadline. The `four_weeks` interval is 28 days; Stripe represents it as four
weekly intervals. A legacy digital/service subscription with one Product and
an unambiguous payment/currency can continue using its existing Product price
without retrofitting an offer. Ambiguous allocations and legacy physical
stock without an offer require reconciliation.

While payment is pending, the customer can still see the saved terms from a
paid Invoice or a sole open Invoice. Reading the Order leaves its accepted
period unchanged. Starting or renewing a period requires a confirmed payment.
Missing anchors,
conflicting payment currencies and ambiguous Invoice contexts require
reconciliation rather than an arbitrary fallback.

An unbilled new cart uses current Product prices. If its previously selected
currency is no longer offered, its extended read can show the saved
Order-to-Currency amount. This keeps an old cart inspectable; the checkout
attributes command still requires a current Product price in that currency.
The internal initial-Free zero one-off settlement retains its Product's
subscription delivery contract. No retired price is added to the public catalog
or new checkout through this read compatibility.

At expiry the fulfillment service sets `status=expired` and removes access
unless another paid Order still grants it. The expired Order keeps its paid
Invoice. Role changes, credits and period acceptance share one transaction
under Subject and Order locks. Notifications run after commit. The scheduler
processes pending payments and cleanup before scanning for due renewals.

Legacy delivering orders require the operator-only Subject freeze operation.
It checks exact ownership, current product Roles and the expected previous
`updatedAt`, then calls `freezeSubscriptionPeriod`. The server preserves the
old delivery start and calendar interval; it does not accept caller-supplied
period timestamps. Missing grants, unpaid or ambiguous invoice context and
concurrent changes require data reconciliation. Repeating a completed freeze
does not change the period.

## Variants

- `default`: order card wrapper with header and child content.
- `cart-default`: cart layout showing products, quantities, and totals. Pass the owner-scoped lines as `ordersToProducts` in customer views. Standalone use reads the lines with the permissions of the caller.
- `cart-card-default` displays a cart order from the Subject’s loaded `cartDetails`. Pass the order with `dataSource="props"`, quantity controls keyed by line ID, and currency and removal controls as JSX slots. A grouped order shows its subtotal and removal action once.
- `orders-to-products-quantity-default`: renders quantities from order-product relations.
- `purchase-ai-chat`: purchase history row. The buyer's account passes the
  Order and its `purchaseDetails` from the Subject order list. The row shows
  the paid period, invoice status, charges and the next payment when available.
- `form-field-default`: writes order data into a form field.
- `create`: client action to create a cart/order.
- `delete`: client action to delete an order.
- `find`: data-fetch wrapper for querying orders.
- `admin-form`: admin create/edit form for order fields.
- `admin-select-input`: admin select input for choosing an order.
- `admin-table`: admin table listing orders.
- `admin-table-row`: admin row showing order fields.

## Total cache and realtime

`GET /api/ecommerce/orders/:id/total` calculates totals from order-product
quantities, product price attributes and billing currencies. Its SDK query
subscribes to the contributing collection topics. The shared topic rule in
`libs/shared/utils/src/lib/topics/singlepage.ts` uses the same dependencies for
HTTP-cache generations, so a refetch after a quantity, price, relation or
currency mutation reads a fresh aggregate response. Additional aggregate
inputs must be covered in both the query and the backend topic rule.

## Cart detail capability

The backend Service exposes findByIdCartDetails for a caller that has already
established Order access. It loads the Order's lines, only their referenced
Products, totals and saved Order–Currency links through existing services. The
projection exposes `availableCurrencyIds` (the intersection of price currencies
across every line) and `billingModuleCurrencyId` when exactly one distinct
currency is saved. A saved currency may be obsolete; readers must check that it
is still available before offering checkout. It does not establish a Subject
or bypass caller authorization. The RBAC Subject order-list endpoint supplies
ownership scope and a consistent read snapshot before invoking this capability.
The SDK model exports ICartDetails; no database field or migration is needed.

## Unpriced cart lines

`findByIdTotal` returns `{ totals, unpriced, availableCurrencyIds }` internally. HTTP total routes keep
amount arrays under `data` and return diagnostics beside them. Existing SDK
`total` readers retain the `data` array. `findByIdCartDetails` and Subject purchase
history keep `totals` as an array and expose optional `unpriced` diagnostics;
each diagnostic names `ordersToProductsId`, `productId` and `reason`.

A missing or incomplete product price contributes no amount and leaves its cart
line available for removal. Missing order lines, missing configuration and source
failures still fail the read. Current Subject checkout shows the diagnostics and
blocks payment until those lines are removed. Payment calculation retains its
separate checkout validation; an omitted cart amount is not a zero-price grant.

## Payment success extension

The Order bootstrap supplies reservation settlement, late-payment validation and
release callbacks when it constructs Billing's Payment Intent app. It binds the
returned service as the Order service's `billingModule.paymentIntent` and exports
it as `orderPaymentIntentService` for higher consumers. The Ecommerce module
mounts the same model app in its exported `billingApp`, so provider callbacks,
checkout failures and Order payment operations use one configured lifecycle.

The payment check route uses `controller/startup/find-by-id/check/index.ts`. Override its protected `onPaymentSucceeded({ order })` method to run project logic before persisting `paid`. The default hook does nothing. A failed hook leaves the order in `paying`, so a subsequent check can repeat the operation. Use idempotent SDK operations and keep payment confirmation independent of notification delivery.

The checker locks and re-reads the Order before invoking the hook. Concurrent
checks cannot invoke it after another check succeeds or explicit cancellation
wins. The hook runs inside the Order transaction; use local services for work
in that transaction. A hook must not update its own locked Order through
self-HTTP, because that separate request waits for the hook's transaction.
The payment lock permits a separate request to create a child relation that
references the Order without updating it.
Receipts and attachments run after the paid transition commits.

Runtime SDK create calls generate IDs. For partial retries, find an existing side effect by a stable unique key, such as a slug, and use the returned ID in relations. Include all required relation fields when updating a link.

Automatic payment failures retain `paymentFailureCanceledAt` through
`canceling` and `canceled`. A later confirmed payment advances that unfulfilled,
unrevoked Order to `paid` through the normal check, including the project hook,
receipts and fulfillment. Confirmation takes precedence over the recovery
timeout. Conditional status writes preserve a concurrent explicit cancellation
or completed delivery. The scheduled checker scans these marked failures in a
separate bounded queue that rotates by ID. Explicit cancellations and legacy
unmarked canceled Orders require reconciliation; their cancellation cause
cannot be inferred from payment status alone.
Scheduled deletion retains marked payment failures and Orders with payment
links, and rechecks status under the lifecycle lock before deleting an old
unpaid cancellation.

Checkout can reopen the exact saved payment selection across several currencies.
It returns the original invoices and their current statuses. A paid currency
invoice stays paid while an unpaid currency invoice retains its own payment URL;
selecting only that remaining invoice's complete set of Orders also reuses it.
Reverse Invoice → Payment Intent → Order checks reject an incomplete selection
of a shared invoice. Recovery of a committed, unsent purchase uses the saved
allocation and provider context rather than current catalog prices or retry
request terms. An unknown provider outcome keeps the attempt and reservation
pending for reconciliation.
