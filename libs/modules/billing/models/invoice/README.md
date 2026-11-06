# Billing Invoice Model

## Purpose

Invoices track payable amounts and statuses for completed or pending transactions.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: server-assigned, immutable creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `status`: invoice status (default: `draft`).
- `paymentUrl`: payment URL used for checkout flows.
- `successUrl`: redirect URL after successful payment.
- `cancelUrl`: redirect URL after cancelled payment.
- `amount`: invoice amount as integer.
- `providerId`: provider-specific identifier.
- `provider`: payment provider name.

The owning repository rejects `createdAt` on create and changed values on
ordinary or conditional updates. Provider updates may include the unchanged
creation date in an existing full-record payload; the repository removes it
from the SQL patch. This keeps the subscription Invoice ordering stable when
payment status changes or a webhook is repeated.

## Payment confirmation

Provider handlers delegate payment confirmation to the Payment Intent
settlement service. It updates the Invoice and linked Payment Intents in one
transaction, with Payment Intents locked in UUID order before the Invoice.
`lockForSettlement` requires the caller's transaction; it cannot hold a lock
outside that transaction. Successful retries do not rewrite paid invoices.
Invoice expiry uses the same locking order and preserves a committed payment.
See the [Payment Intent contract](../payment-intent/README.md#atomic-payment-confirmation)
for provider authentication, amount checks and custom adapter migration.

## Variants

- `default`: shows invoice status and a Pay button when `paymentUrl` is present.
- `find`: data-fetch wrapper for querying invoices.
- `admin-form`: admin create/edit form for status and variant.
- `admin-select-input`: admin select input for choosing an invoice.
- `admin-table`: admin table listing invoices.
- `admin-table-row`: admin row showing status and variant.
