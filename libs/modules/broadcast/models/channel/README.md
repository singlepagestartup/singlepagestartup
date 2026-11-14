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

## Custom API Routes

- `POST /api/broadcast/channels/push-message`
- `GET /api/broadcast/channels/:id/messages`
- `POST /api/broadcast/channels/:id/messages`
- `DELETE /api/broadcast/channels/:id/messages/:messageId`

These routes are available in channel SDKs as:

- `api.pushMessage(...)`
- `api.messageFind(...)`
- `api.messageCreate(...)`
- `api.messageDelete(...)`

## Worker queues

Each channel can serve a group of competing workers. The producer supplies an
existing channel ID, a stable key for the logical job, and a string payload.
Publishing the same key to that channel again returns `created: false` and
preserves the original payload. The queue creates the payload in Message and its owner link in
`channels-to-messages` in one transaction. The relation enforces one job per
channel and key and records the worker's receipt and lease. Set
`announce: true` to show this link in the channel feed. The feed is subject to route permissions; announcing a message does not grant
access to its channel. Leave the option off for internal work.

Backend services can inject the Channel service and call `channel.queue`.
Remote services can call the Channel server SDK's `api.delivery({data, options})` or
send JSON to `POST /api/broadcast/channels/delivery` with the existing
`X-RBAC-SECRET-KEY` server credential. The available commands are listed
below. A receipt identifies one reservation and expires after `leaseSeconds`.

| Command           | Required inputs in addition to `channelId` | Result                                                                                    |
| ----------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `publish`         | `key`, `payload`                           | `{created}`; optional `announce` links the message to the feed                            |
| `reserve`         | `leaseSeconds`                             | An array of available deliveries with `id`, `key`, `receipt` and `payload`; empty if busy |
| `start`           | `key`, `receipt`                           | Starts this reservation once                                                              |
| `renew`           | `key`, `receipt`, `leaseSeconds`           | Extends the lease of a running worker                                                     |
| `acknowledge`     | `key`, `receipt`                           | Completes the delivery and optionally replaces its `payload` with the result              |
| `release`         | `key`, `receipt`                           | Makes the delivery available for retry                                                    |
| `removeCompleted` | `before` (UTC timestamp), `limit` (1–1000) | Deletes older completed deliveries and returns `{removed}`                                |

The HTTP worker processes one delivery at a time per channel. Local services
set a common concurrency limit for their workers. Use a separate channel for
each independent consumer group. A worker starts its reservation before
performing the job and acknowledges it only after the job succeeds. A lost
worker's lease eventually expires. Its replacement receives a new receipt.
A stale receipt returns HTTP 409. A crash after an external operation but
before acknowledgement can repeat that operation. Use the job key to
deduplicate payments and other irreversible effects in the receiving system.

Ordinary pushes keep their expiration policy. Cleanup deletes expired rows in
indexed batches of 100. Completed deliveries keep their keys until the owner
removes them. The cron scheduler retains its keys to calculate the next run.

Run `npx nx run api:db:migrate` before starting workers that use the queue.

Delivery consumers can call `queue.checkpoint(owner, payload)` to save progress
while retaining a live lease. The receipt and lease are checked in the same SQL
statement as the payload update, so an expired worker cannot overwrite its
successor. `queue.removeExpired(channelId, before, limit)` removes old jobs in
that channel only when no lease is active; consumers choose their retention
period. Notification uses it for the same expiration period as its records.

The channel-owned delivery repository preserves publication, reservation,
checkpoint and cleanup transactions. Message does not import ChannelsToMessages.
`GET /api/broadcast/channels/:id/messages` applies caller filters to the visible
feed. Ordinary and announced durable messages retain the same public message shape.

For downstream callers, move `message.queue` to `channel.queue` and the server
SDK's `delivery` operation to the Channel package. The HTTP command endpoint is
`POST /api/broadcast/channels/delivery`; the old Message endpoint is removed.
The schema and existing queue rows do not change.
