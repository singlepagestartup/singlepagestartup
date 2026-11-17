# Ecommerce Orders to Billing Module Payment Intents Relation

## Purpose

Links orders to billing payment intents.

New purchases link each quoted Order line to its Payment Intent. Legacy rows
without a line or snapshot remain readable.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `className`: optional CSS class name.
- `orderId`: linked order ID.
- `billingModulePaymentIntentId`: linked payment intent ID.
- `orderLineId`, `offerId`: purchased line and exact seller offer.
- `reservationQuantity`: held stock units, including attempts created while an offer has no stock limit.
- `reservationStatus`: `none`, `held`, `consumed`, `released`, or `reconciliation`.
- `purchaseSnapshot`: saved currency, amount, order share, seller and fulfiller,
  destination, service schedule, and formula version and inputs.

`reservedOfferQuantities` is exported by the owning API repository. It reads
held and reconciliation quantities in one batch and accepts the caller's
database or ambient Consistency transaction. `lockOffers` requires that
transaction and locks offers in UUID order; `withOfferLocks` opens or reuses it.

`reserveCharges` checks the complete attempt under those locks. A unique index
on Payment Intent and Order line prevents a second hold for the same line.
`settleReservations` consumes stock once, in the Billing settlement transaction.
Confirmed expiry releases held units once. An unknown provider result keeps the
hold. A late payment that cannot be fulfilled enters `reconciliation`; its paid
Invoice remains recorded and its Intent cannot issue goods or credits.
Late payment of a canceled new purchase is recorded for review. Replayed
callbacks cannot release it from reconciliation or issue the purchase.

The API host composes Billing's neutral payment lifecycle with this service.
Billing does not import Ecommerce.

## Variants

- `default`: renders the related payment intent using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
