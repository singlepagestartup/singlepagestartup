# Notification Notification Model

## Purpose

Notifications store delivery metadata for messages sent to users.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `status`: notification status (default: `new`).
- `method`: delivery method (default: `email`).
- `title`: notification title.
- `data`: payload data.
- `reciever`: receiver address or identifier.
- `attachments`: attachment references.
- `sendAfter`: scheduled send time.
- `sourceSystemId`: external source id.

## Variants

- `default`: placeholder notification view.
- `find`: data-fetch wrapper for querying notifications.
- `admin-form`: admin create/edit form for notification fields.
- `admin-select-input`: admin select input for choosing a notification.
- `admin-table`: admin table listing notifications.
- `admin-table-row`: admin row showing notification fields.
