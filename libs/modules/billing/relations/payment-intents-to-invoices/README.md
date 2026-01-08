# Billing Payment Intents to Invoices Relation

## Purpose

Links payment intents to invoices and controls ordering/appearance.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `className`: optional CSS class name.
- `paymentIntentId`: linked payment intent ID.
- `invoiceId`: linked invoice ID.

## Variants

- `default`: renders the related invoice using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
