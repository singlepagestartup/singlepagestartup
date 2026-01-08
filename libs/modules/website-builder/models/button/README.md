# Website Builder Button Model

## Purpose

Buttons represent clickable actions and links used in UI sections.

## Fields

- `title`: button title (localized).
- `subtitle`: button subtitle (localized).
- `url`: destination URL.
- `className`: custom CSS classes.
- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant/style.
- `adminTitle`: title shown in admin interface.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: standard button style.
- `primary`: main call-to-action emphasis.
- `secondary`: secondary action style.
- `outline`: outlined button style.
- `link`: link-like button style.
- `ghost`: minimal button style.
- `destructive`: destructive action emphasis.
- `children`: wraps custom children in a link container.
- `find`: data-fetch wrapper for querying buttons.
- `admin-select-input`: admin UI select input for linking buttons.
- `admin-table-row`: admin UI row for button listings.
- `admin-form`: admin UI create/edit form.
- `admin-table`: admin UI table for browsing buttons.
