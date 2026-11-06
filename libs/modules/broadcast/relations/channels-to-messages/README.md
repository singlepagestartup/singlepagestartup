# Broadcast Channels to Messages Relation

## Purpose

Links channels to messages and controls ordering/appearance.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `className`: optional CSS class name.
- `channelId`: linked channel ID.
- `messageId`: linked message ID.

## Delivery state

The queue stores a delivery key, receipt, claim time, start time, lease expiry
and completion time on the owning link. The database enforces a unique key per
channel and one owner per durable message. The worker API updates this state.
The relation CRUD and the channel feed return only visible links and omit
worker fields. Ordinary links remain editable through CRUD.

## Variants

- `default`: renders the related message using its frontend variant.
- `subscription`: placeholder variant for real-time message streams.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
