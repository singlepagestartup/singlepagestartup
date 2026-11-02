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

## PayKeeper webhook identifiers

SPS sends the Payment Intent UUID as PayKeeper `orderid` when creating an invoice.
The configured PayKeeper webhook service validates that UUID before looking up
the Payment Intent–Invoice relation. Missing, malformed or non-string `orderid`
returns HTTP 400 with `Validation error. Invalid orderid`. A valid but unknown
UUID retains the existing 404 response. Values are compared by UUID equality;
the query builder is unchanged.

The shared `validateWebhookIdentifiers` utility is exported by
`@sps/backend-utils`. It accepts a plain object and explicit UUID/string field
lists. PayKeeper checks `id`, `sum` and `clientid` as strings when supplied;
empty strings and absent/null optional fields remain accepted. Validation
messages name fields without repeating submitted values.

PayKeeper service debug output no longer prints API Authorization headers,
webhook props, payment bodies or provider responses. The common webhook
controller's existing debug logging is unchanged.

This validation does not authenticate a callback. Provider signature checks and
PayKeeper's acknowledgment format remain separate integration work, described
in the [PayKeeper POST notification contract](https://docs.paykeeper.ru/metody-integratsii/priyom-post-opoveshhenij/).
No schema, provider permission or payment transition changes are included.

## Variants

- `default`: renders related invoices via the payment-intents-to-invoices relation.
- `find`: data-fetch wrapper for querying payment intents.
- `admin-form`: admin create/edit form for amount, status, type, interval, and relations.
- `admin-select-input`: admin select input for choosing a payment intent.
- `admin-table`: admin table listing payment intents.
- `admin-table-row`: admin row showing status and variant.
