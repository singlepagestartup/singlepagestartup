# Social Thread Model

## Purpose

Threads group messages within chats.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `className`: optional CSS class name.
- `variant`: display variant.
- `title`: thread title.
- `description`: thread description.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: placeholder thread view.
- `find`: data-fetch wrapper for querying threads.
- `admin-form`: admin create/edit form for thread fields.
- `admin-select-input`: admin select input for choosing a thread.
- `admin-table`: admin table listing threads.
- `admin-table-row`: admin row showing thread fields.
