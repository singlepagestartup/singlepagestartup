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

The relation service reads held and reconciliation rows in one `find` call and
sums their quantities per offer in the current Consistency transaction.
`withOfferLocks` opens or reuses a transaction. Within it, `lockOffers` locks
the offers in UUID order.

`reserveCharges` checks the complete attempt under those locks. A unique index
on Payment Intent and Order line prevents a second hold for the same line.
`settleReservations` consumes stock once, in the Billing settlement transaction.
Confirmed expiry releases held units once. An unknown provider result keeps the
hold. A late payment that cannot be fulfilled enters `reconciliation`; its paid
Invoice remains recorded and its Intent cannot issue goods or credits.
Late payment of a canceled new purchase is recorded for review. Replayed
callbacks cannot release it from reconciliation or issue the purchase.

The service validates stock attributes and updates them through Attribute's
service in the same transaction. Its repository owns SQL reads, offer locks and
transaction boundaries.

The relation API exports `service` from the same DI container instance used by
its controller. The Order bootstrap supplies this service's reservation
operations to Billing's neutral payment lifecycle before constructing the
Payment Intent app. Billing does not import Ecommerce.
`createService` in the relation bootstrap assembles the same effective service
for other owners without initializing an HTTP app.

## Variants

- `default`: renders the related payment intent using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
