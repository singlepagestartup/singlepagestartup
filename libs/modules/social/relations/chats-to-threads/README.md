# Social Chats to Threads Relation

## Purpose

Links chats to threads.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `className`: optional CSS class name.
- `chatId`: linked chat ID.
- `threadId`: linked thread ID.

The `(chatId, threadId)` pair is unique. Relations with `variant = default`
also enforce at most one default thread per chat; Telegram topic threads use
their Telegram-specific relation variant.

## Variants

- `default`: renders the related thread using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
