# Ecommerce Attributes to Billing Module Currencies Relation

## Purpose

Links attributes to billing currencies, typically for price attributes.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `className`: optional CSS class name.
- `attributeId`: linked attribute ID.
- `billingModuleCurrencyId`: linked currency ID.

## Variants

- `default`: renders the related currency using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
