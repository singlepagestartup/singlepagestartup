# Broadcast Channel Model

## Purpose

Channels define broadcast streams used to group and deliver messages.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `title`: channel title (unique).
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: placeholder channel view.
- `subscription`: client-only wrapper that subscribes to channel messages.
- `find`: data-fetch wrapper for querying channels.
- `find-by-id`: fetch a channel by ID on server or client.
- `admin-form`: admin create/edit form for channel fields.
- `admin-select-input`: admin select input for choosing a channel.
- `admin-table`: admin table listing channels.
- `admin-table-row`: admin row showing channel fields.
