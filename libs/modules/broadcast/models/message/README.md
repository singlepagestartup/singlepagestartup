# Broadcast Message Model

## Purpose

Messages represent payloads delivered through broadcast channels.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `expiresAt`: expiration timestamp for ordinary messages, or `null` for durable deliveries.
- `payload`: message payload string.

## Variants

- `default`: placeholder message container.
- `find`: data-fetch wrapper for querying messages.
- `admin-form`: admin create/edit form for message payload.
- `admin-select-input`: admin select input for choosing a message.
- `admin-table`: admin table listing messages.
- `admin-table-row`: admin row showing message fields.

## Delivery ownership

Channel owns durable worker queues and their relation state. See the
[Channel queue contract](../channel/README.md#worker-queues). Message owns the
payload and expiration of ordinary messages. Its CRUD queries exclude durable
payloads; editing or deleting a durable payload through Message returns a conflict.
Read an announced delivery through Channel's message feed or the
ChannelsToMessages `message` SDK operation. Private deliveries stay outside both readers.
