# Ecommerce Attribute Model

## Purpose

Attributes store typed values (string/number/boolean/date) that describe products and stores.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `number`: numeric value.
- `boolean`: boolean value.
- `date`: date value.
- `datetime`: datetime value.
- `string`: localized string value.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: renders the selected attribute field value and its currency if linked.
- `find`: data-fetch wrapper for querying attributes.
- `admin-form`: admin create/edit form for attribute values.
- `admin-select-input`: admin select input for choosing an attribute.
- `admin-table`: admin table listing attributes.
- `admin-table-row`: admin row showing attribute fields.
