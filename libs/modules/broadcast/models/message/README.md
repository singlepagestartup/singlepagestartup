# Broadcast Message Model

## Purpose

Messages represent payloads delivered through broadcast channels.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `expiresAt`: optional expiration timestamp.
- `payload`: message payload string.

## Variants

- `default`: placeholder message container.
- `find`: data-fetch wrapper for querying messages.
- `admin-form`: admin create/edit form for message payload.
- `admin-select-input`: admin select input for choosing a message.
- `admin-table`: admin table listing messages.
- `admin-table-row`: admin row showing message fields.
