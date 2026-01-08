# Ecommerce Attribute Key Model

## Purpose

Attribute keys define metadata about attribute fields, including type and labels.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `type`: attribute key type (e.g. feature, price).
- `field`: field selector (e.g. string, number).
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.
- `title`: localized title.
- `prefix`: localized prefix.
- `suffix`: localized suffix.

## Variants

- `default`: renders the attribute key title.
- `find`: data-fetch wrapper for querying attribute keys.
- `admin-form`: admin create/edit form for key metadata.
- `admin-select-input`: admin select input for choosing a key.
- `admin-table`: admin table listing attribute keys.
- `admin-table-row`: admin row showing key fields.
