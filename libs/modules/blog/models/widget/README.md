# Blog Widget Model

## Purpose

Blog widgets are reusable content blocks that render article and category lists or act as layout containers for blog views.

## Fields

- `id`: unique identifier (UUID).
- `className`: optional CSS class name.
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.
- `title`: localized title.
- `subtitle`: localized subtitle.
- `description`: localized rich description.

## Variants

- `default`: placeholder widget view.
- `category-list-default`: renders a card with all categories listed.
- `category-overview-default`: layout wrapper for category overview content.
- `article-list-default`: renders a card with related articles (or all articles if no relation).
- `article-overview-default`: layout wrapper for article overview content.
- `article-overview-with-private-content-default`: wrapper variant for private/child content.
- `article-overview-ecommerce-module-product-list-default`: layout wrapper for article + ecommerce product lists.
- `find`: data-fetch wrapper for querying widgets.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing a widget.
- `admin-table`: admin table listing widgets.
- `admin-table-row`: admin row showing widget fields.
