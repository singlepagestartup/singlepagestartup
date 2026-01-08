# Social Chat Model

## Purpose

Chats group messages and threads for social conversations.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `className`: optional CSS class name.
- `variant`: display variant.
- `title`: chat title.
- `description`: chat description.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.
- `sourceSystemId`: external source id.

## Variants

- `default`: placeholder chat view.
- `find`: data-fetch wrapper for querying chats.
- `admin-form`: admin create/edit form for chat fields.
- `admin-select-input`: admin select input for choosing a chat.
- `admin-table`: admin table listing chats.
- `admin-table-row`: admin row showing chat fields.
