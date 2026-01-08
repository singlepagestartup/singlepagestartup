# Ecommerce Store Model

## Purpose

Stores represent collections of products with localized metadata and attributes.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.
- `title`: localized title.
- `shortDescription`: localized short description.
- `description`: localized long description.

## Variants

- `default`: store card with attributes and description.
- `overview-default`: overview card wrapper for store pages.
- `find`: data-fetch wrapper for querying stores.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing a store.
- `admin-table`: admin table listing stores.
- `admin-table-row`: admin row showing store fields.
