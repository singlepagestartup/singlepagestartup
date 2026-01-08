# Social Message Model

## Purpose

Messages store social chat content and interaction data.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `className`: optional CSS class name.
- `variant`: display variant.
- `title`: message title.
- `subtitle`: message subtitle.
- `description`: message body text.
- `sourceSystemId`: external source id.
- `interaction`: interaction payload (JSON).

## Variants

- `default`: card-like message view.
- `find`: data-fetch wrapper for querying messages.
- `admin-form`: admin create/edit form for message fields.
- `admin-select-input`: admin select input for choosing a message.
- `admin-table`: admin table listing messages.
- `admin-table-row`: admin row showing message fields.
