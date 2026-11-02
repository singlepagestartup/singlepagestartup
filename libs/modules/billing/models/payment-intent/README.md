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

Projects with custom observer pipelines attached to the former internal
Invoice/Payment Intent PATCH requests must adapt them to the committed payment
lifecycle. PayKeeper settlement now uses owning services atomically, rather
than separate HTTP writes. Other providers retain their existing flow.

## Variants

- `default`: renders related invoices via the payment-intents-to-invoices relation.
- `find`: data-fetch wrapper for querying payment intents.
- `admin-form`: admin create/edit form for amount, status, type, interval, and relations.
- `admin-select-input`: admin select input for choosing a payment intent.
- `admin-table`: admin table listing payment intents.
- `admin-table-row`: admin row showing status and variant.
