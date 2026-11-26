# RBAC Subjects to Billing Module Currencies Relation

The existing admin and SDK routes read and write Billing wallet balances through the subject’s default wallet. Historical balance IDs remain valid. [Wallet currency balances](../../../billing/relations/wallets-to-currencies/README.md)

## Purpose

A subject can hold several balance rows in one currency. Balance readers sum every row, including negative amounts.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `className`: optional CSS class name.
- `subjectId`: linked subject ID.
- `billingModuleCurrencyId`: linked Billing currency ID.
- `amount`: balance stored as a numeric string.

## Backend billing writes

`updateAmountIfUnchanged` changes one relation's amount only if it still equals
the amount read by its caller. It uses the shared repository's conditional
write. A missing result means a competing write changed the balance; billing
rereads the complete currency balance before trying again. Database mutation
capture publishes these writes through the normal consistency pipeline.

## Variants

- `default`: renders the related currency using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
