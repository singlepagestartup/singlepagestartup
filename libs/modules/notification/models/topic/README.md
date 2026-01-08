# Notification Topic Model

## Purpose

Topics group notifications and define delivery types.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `title`: topic title.
- `type`: topic type (default: `info`).
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: placeholder topic view.
- `find`: data-fetch wrapper for querying topics.
- `admin-form`: admin create/edit form for topic fields.
- `admin-select-input`: admin select input for choosing a topic.
- `admin-table`: admin table listing topics.
- `admin-table-row`: admin row showing topic fields.
