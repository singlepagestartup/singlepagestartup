# Billing Payment Intent Model

## Purpose

Payment intents represent an upcoming or in-progress payment with amount and status metadata.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `amount`: payment amount as integer.
- `status`: payment status (default: `requires_payment_method`).
- `interval`: recurring interval (optional).
- `type`: payment type (default: `one_off`).

## Atomic payment confirmation

All supported providers use the Payment Intent settlement service:
`stripe`, `cloudpayments`, `tiptoppay`, `0xprocessing`, `payselection`,
`paykeeper`, `telegram-star` and `dummy`. Each provider authenticates its
notification and checks its successful-payment condition before calling
`settlePayment({ invoiceId, provider, amount, ... })`. Provider API requests
finish before database locks are acquired.

Settlement locks the linked Payment Intents in ascending UUID order, then the
Invoice, and rereads their amounts, statuses, provider identity and associations.
It writes `Invoice.status = paid` and `PaymentIntent.status = succeeded` through
the effective owning services in one PostgreSQL transaction. A write failure
rolls back both statuses. Concurrent deliveries wait for the same records;
retries preserve already completed statuses and timestamps. A canceled Invoice
or Payment Intent cannot be revived by a callback. Multiple linked intents
consume their allocated amount even when already succeeded, preventing a
retry from allocating that amount again. An invoice that cannot cover all its
linked intents is rejected without writes.

The existing integer amount schema remains in force. A provider confirmation
must match the saved invoice amount; decimals are never truncated or used to
replace it. CloudPayments and TipTopPay use `Amount`, which represents the
original purchase amount, rather than the card's `PaymentAmount`. Stripe
Checkout requires a completed session with `payment_status = paid` or
`no_payment_required`; completing an unpaid session does not settle it.
Recurring Stripe invoice creation, association and settlement share the same
transaction and Payment Intent lock. Pending out-of-order events do not
reset an existing paid invoice.

Telegram Stars binds the successful charge ID under the lock; a different
charge cannot replace it. The zero-amount dummy path also uses settlement and
accepts only dummy invoices. Provider response formats and authentication
remain provider-specific. Database idempotence does not initiate, refund or
prevent an external charge.

The scheduled CloudPayments check calls the same settlement operation only
for a completed, incoming, non-refunded transaction. Invoice expiry and stale
orphan recovery also reread under the same Payment Intent locks, so stale
checks cannot overwrite a committed success. Capture, generations and outbox
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
Billing amounts retain the existing integer schema; received decimals are
compared exactly in minor units and are never truncated into a matching amount.

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

## Variants

- `default`: renders related invoices via the payment-intents-to-invoices relation.
- `find`: data-fetch wrapper for querying payment intents.
- `admin-form`: admin create/edit form for amount, status, type, interval, and relations.
- `admin-select-input`: admin select input for choosing a payment intent.
- `admin-table`: admin table listing payment intents.
- `admin-table-row`: admin row showing status and variant.
