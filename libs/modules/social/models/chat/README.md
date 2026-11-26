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

Telegram chats have a partial unique natural key on `sourceSystemId` when
`variant = telegram`, preventing two internal chats from representing the same
Telegram chat.

## Chat settings

The Social Chat settings dialog groups the title, description, cover, threads and participants. Chat covers use the `cover` variant of `chats-to-file-storage-module-files`. The profile-scoped detail returns the current `coverFileId`. Members read its bytes through the authenticated chat cover endpoint.

## Variants

- `id-ai-chat`: server container for the selected Chat, with a Thread content slot.
- `default`: placeholder chat view.
- `find`: data-fetch wrapper for querying chats.
- `admin-form`: admin create/edit form for chat fields.
- `admin-select-input`: admin select input for choosing a chat.
- `admin-table`: admin table listing chats.
- `admin-table-row`: admin row showing chat fields.
