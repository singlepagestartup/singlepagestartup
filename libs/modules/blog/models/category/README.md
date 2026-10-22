# Blog Category Model

## Purpose

Categories group articles and provide localized metadata for category pages.

## Fields

- `id`: unique identifier (UUID).
- `className`: optional CSS class name.
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `title`: localized title.
- `subtitle`: localized subtitle.
- `description`: localized rich description.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: compact category card with localized rich subtitle and the category link.
- `overview-default`: category header, rich description, ordered Website Builder widgets and related articles in one container.
- `loading`: one category skeleton; collection Widgets compose the grid.
- `find`: data-fetch wrapper for querying categories.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing a category.
- `admin-table`: admin table listing categories.
- `admin-table-row`: admin row showing category fields.
