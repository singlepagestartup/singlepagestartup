# Billing Payment Intent Model

## Purpose

Payment intents represent an upcoming or in-progress payment with amount and status metadata.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `amount`: decimal payment amount in main currency units, stored as `numeric(24,8)` with the existing numeric SDK field.
- `status`: payment status (default: `requires_payment_method`).
- `interval`: recurring interval (optional).
- `type`: payment type (default: `one_off`).

## Payment providers

- `POST /api/billing/payment-intents/:uuid/:provider` starts a payment for the
  payment intent through the provider.
- `POST /api/billing/payment-intents/:provider/webhook` receives the provider's
  payment notification and settles the invoice.

Both routes answer 400 for a provider that `ALLOWED_BILLING_SERVICE_PROVIDERS`
does not list. The value is a comma-separated list of exact names, and a
webhook's path segment must be listed as it appears in the webhook URL. The
default is `stripe,0xprocessing,payselection,cloudpayments,tiptoppay`.

The `dummy` provider marks an invoice paid without a payment provider: its
webhook settles the invoice named in the request. List it only in a project
that runs without real payments; `apps/api/create_env.sh` lists it for local
development. The check is `Service.isProviderAllowed`, which a project can
override in its `startup` service.

The internal `stopSubscriptionRenewal` capability stops future Stripe charges
with `cancel_at_period_end`, after checking the subscription's Payment Intent
metadata. It preserves paid Invoices and the current paid period. Already
canceled Stripe subscriptions and repeated calls are safe. Provider failures
leave Order cancellation pending for the next Proceed check.

The standard CloudPayments, TipTopPay, 0xProcessing, Payselection, PayKeeper,
Telegram Stars and dummy adapters create individual payments, even when an
older intent retains `type = subscription`. They have no remote renewal contract
to cancel. One-off intents and zero-price payments also require no provider
cancellation. A custom adapter with recurring charges must override
`subscriptionRenewalContext` and `stopSubscriptionRenewal` in its owning startup
service. Unknown recurring providers fail explicitly and remain pending.

## PayKeeper webhook identifiers

## Atomic payment confirmation

All supported providers use the Payment Intent settlement service:
`stripe`, `cloudpayments`, `tiptoppay`, `0xprocessing`, `payselection`,
`paykeeper`, `telegram-star` and `dummy`. External providers verify their
notifications before calling `settlePayment({ invoiceId, provider, amount, ... })`.
The dummy provider simulates a payment when explicitly enabled. Provider API
requests finish before database locks are acquired.

Settlement locks the linked Payment Intents in ascending UUID order, then the
Invoice, and rereads their amounts, statuses, provider identity and associations.
It writes `Invoice.status = paid` and `PaymentIntent.status = succeeded` through
the effective owning services in one PostgreSQL transaction. A write failure
rolls back both statuses. Concurrent deliveries wait for the same records;
retries preserve already completed statuses and timestamps. A canceled Invoice
or Payment Intent without a reservation snapshot cannot be revived by a callback.
For a new reserved purchase, the host records a late canceled payment as paid
with `requires_reconciliation` on its Intent and blocks fulfillment. Multiple linked intents
consume their allocated amount even when already succeeded, preventing a
retry from allocating that amount again. An invoice that cannot cover all its
linked intents is rejected without writes.

Amounts are compared as exact scaled integers. A provider confirmation must
match the saved invoice and its Payment Intent shares. Unsupported precision
is rejected before payment creation; it is never truncated. CloudPayments and TipTopPay use `Amount`, which represents the
original purchase amount, rather than the card's `PaymentAmount`. Stripe
Checkout requires a completed session with `payment_status = paid` or
`no_payment_required`; completing an unpaid session does not settle it.
Recurring Stripe invoice creation, association and settlement share the same
transaction and Payment Intent lock. Pending out-of-order events do not
reset an existing paid invoice.

`paymentProviderPrecision(provider, currency)` is the shared boundary used by
checkout and provider creation. Dummy keeps the configured currency precision;
Telegram Stars require integers. The current external adapters accept two
decimal places. Stripe rejects a differently configured currency because its
current conversion does not implement that currency's minor units. An amount
such as `1.005` can use an exact supported provider instead of being truncated
for PayKeeper.

Telegram Stars binds the successful charge ID under the lock; a different
charge cannot replace it. For a zero-price checkout, the creation handler reads
the stored intent under lock, creates or reuses its free invoice and settles
it within the same transaction. The selected provider receives no synthetic
webhook. Repeating the checkout for the same Payment Intent returns the succeeded
intent. Subject checkout registers its order observer and checks free orders
immediately. Each provider keeps its own response format and authentication.

The scheduled CloudPayments check calls the same settlement operation only
for a completed, incoming, non-refunded transaction. Invoice expiry and stale
orphan recovery also reread under the same Payment Intent locks, so stale
checks cannot overwrite a committed success. An expired invoice fails the intent
only when all its linked invoices have failed. Capture, generations and outbox
remain part of the write transaction. No schema migration is required.

Custom provider adapters must inject `settle` and delegate both status writes
to it. CloudPayments, TipTopPay and Telegram Stars no longer accept a separate
post-write `callback`. The compatibility method `updatePaymentIntentStatus`
rereads an already paid invoice and uses the same settlement service; it does
not authenticate a provider notification. Custom pipelines previously attached
to internal Invoice/Payment Intent PATCH requests must observe committed
payment state through the existing consistency lifecycle. Separate self-HTTP
writes cannot participate in the settlement transaction.

Provider contracts: [Stripe fulfillment](https://docs.stripe.com/checkout/fulfillment.md?ui=full-page),
[CloudPayments notifications](https://developers.cloudpayments.ru/#uvedomleniya),
[TipTopPay notifications](https://developers.tiptoppay.kz/#uvedomleniya).

## PayKeeper notifications

Set `PAYKEEPER_WEBHOOK_SECRET` to the merchant's secret word (`secret_seed`) from
PayKeeper's POST notification settings. It is independent of the application
RBAC secret. The callback URL is
`POST /api/billing/payment-intents/paykeeper/webhook`. The provider sends an
ordinary form body; direct JSON payloads are supported as well. No internal
RBAC credential is required by the callback contract.

SPS sends the Payment Intent UUID as `orderid`. Before any lookup, the service
validates the payload and checks `key` against the documented MD5 digest of
`id + sum + clientid + orderid + secret_seed`, with the amount normalized to two
decimal places. The digest comparison is constant time. `id`, `sum` and `key`
are required; an absent `clientid` means an empty string. Malformed identifiers
return 400, an invalid/missing signature returns 403, and a signed unknown
Payment Intent retains 404. The legacy zero-Invoice envelope cannot bypass
this check.

The server reads the saved PayKeeper invoice through the authenticated provider
API and checks its paid status, invoice ID, payment ID, order ID, client and
amount. Both stored billing amounts must match. Mismatches and unpaid/canceled
payments receive no success acknowledgment. This integration creates RUB
payments only; selecting another currency is rejected before creating an Invoice.
PayKeeper amounts support two decimal places and are compared exactly in minor
units. Received decimals are never truncated into a matching amount.

The owning Payment Intent and Invoice services settle both records in one
PostgreSQL transaction, locking the Payment Intent before the Invoice. A failed
write rolls back both statuses. Repeated and concurrent valid callbacks leave
an already paid Invoice and succeeded Payment Intent unchanged. Row capture,
outbox and query invalidation remain transactional; no schema migration is needed.

Only after successful settlement does the route return HTTP 200 with the exact
plain-text body `OK <md5(id + secret_seed)>`. No internal error returns this
acknowledgment. The handler does not log PayKeeper headers or request bodies,
and the provider service does not dump credentials or raw provider responses.

[PayKeeper POST notification contract](https://docs.paykeeper.ru/metody-integratsii/priyom-post-opoveshhenij/)
and [invoice lookup contract](https://docs.paykeeper.ru/dokumentatsiya-json-api/scheta/)
define the external protocol. The merchant account must enable POST notifications
with this callback URL and the same secret word. Local tests use a loopback
provider fixture rather than charging an account.

## Checkout dispatch recovery

New Subject checkouts persist `checkoutDispatchState=prepared`, the selected
provider, currency and original provider metadata in the same transaction as the
Payment Intent and reserved purchase allocation. The provider route claims that
row once under its Payment Intent lock, committing `dispatching` before calling
the adapter. A successful adapter result records `exposed`.

A fresh service can resume `prepared` using the saved context without re-quoting
or creating another Payment Intent or reservation. Concurrent retries share the
same dispatch claim. `dispatching` with no invoice has an unknown outcome and
returns a conflict; a missing invoice alone never authorizes resending. Existing
invoice links remain reusable, including separate currency invoices and paid
members of a partially paid selection. Legacy Payment Intents keep the existing
invoice-based recovery rules.

Generic create, update and conditional-write operations cannot set or change the
five `checkout*` recovery fields. HTTP provider responses omit those fields;
recovery reads them through the owning service inside the application.

## Variants

- `default`: renders related invoices via the payment-intents-to-invoices relation.
- `find`: data-fetch wrapper for querying payment intents.
- `admin-form`: admin create/edit form for amount, status, type, interval, and relations.
- `admin-select-input`: admin select input for choosing a payment intent.
- `admin-table`: admin table listing payment intents.
- `admin-table-row`: admin row showing status and variant.
