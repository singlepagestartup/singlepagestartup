# Ecommerce Widget Model

## Purpose

Ecommerce widgets render lists and overview layouts for orders, products, categories, and stores.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `className`: optional CSS class name.
- `anchor`: optional anchor id.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.
- `title`: localized title.
- `subtitle`: localized subtitle.
- `description`: localized description.

## Variants

- `default`: placeholder widget view.
- `order-list-default`: wrapper for listing orders.
- `product-list-default`: card layout for product lists.
- `product-overview-default`: card layout for product overviews.
- `category-list-default`: card layout listing categories.
- `category-overview-default`: wrapper for category overview content.
- `store-list-default`: wrapper for listing stores.
- `store-overview-default`: wrapper for store overview content.
- `find`: data-fetch wrapper for querying widgets.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing a widget.
- `admin-table`: admin table listing widgets.
- `admin-table-row`: admin row showing widget fields.
