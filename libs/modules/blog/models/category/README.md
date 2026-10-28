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

- `default`: category card with localized rich subtitle, a count of its linked articles and one stretched category link. Its cover is the first ordered attachment of the first ordered linked article; a category without that attachment has no cover.
- `overview-default`: light category introduction with a return link, rich description, ordered Website Builder widgets and the actual related Article collection/count in one container.
- `loading`: one category skeleton; collection Widgets compose the grid.
- `find`: data-fetch wrapper for querying categories.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing a category.
- `admin-table`: admin table listing categories.
- `admin-table-row`: admin row showing category fields.

The overview accepts a `renderAuthor` slot for its loaded Article cards. It
forwards the slot through the ordinary association renderer; Profile reads
stay with the higher Social/Host composition.
