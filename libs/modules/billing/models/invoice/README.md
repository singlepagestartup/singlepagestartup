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

## Variants

- `default`: shows invoice status and a Pay button when `paymentUrl` is present.
- `find`: data-fetch wrapper for querying invoices.
- `admin-form`: admin create/edit form for status and variant.
- `admin-select-input`: admin select input for choosing an invoice.
- `admin-table`: admin table listing invoices.
- `admin-table-row`: admin row showing status and variant.
