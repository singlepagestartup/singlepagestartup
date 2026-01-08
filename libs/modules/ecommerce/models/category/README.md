# Ecommerce Category Model

## Purpose

Categories group products and provide localized metadata for category pages.

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
- `description`: localized description.

## Variants

- `default`: category card linking to the category page with widget attachments.
- `overview-default`: category overview with media/widgets and child content.
- `button-default`: compact button link for a category.
- `find`: data-fetch wrapper for querying categories.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing a category.
- `admin-table`: admin table listing categories.
- `admin-table-row`: admin row showing category fields.
