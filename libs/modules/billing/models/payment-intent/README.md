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

## Variants

- `default`: renders related invoices via the payment-intents-to-invoices relation.
- `find`: data-fetch wrapper for querying payment intents.
- `admin-form`: admin create/edit form for amount, status, type, interval, and relations.
- `admin-select-input`: admin select input for choosing a payment intent.
- `admin-table`: admin table listing payment intents.
- `admin-table-row`: admin row showing status and variant.
