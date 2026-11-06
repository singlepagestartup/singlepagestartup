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

## Worker queues

Each channel can serve a group of competing workers. The producer supplies an
existing channel ID, a stable key for the logical job, and a string payload.
Publishing the same key to that channel again returns `created: false` and
preserves the original payload. The queue creates the payload in Message and its owner link in
`channels-to-messages` in one transaction. The relation enforces one job per
channel and key and records the worker's receipt and lease. Set
`announce: true` to show this link in the channel feed. That feed is publicly readable in the default SPS
configuration. Leave the option off for internal work.

Backend services can inject the Message service and call `message.queue`.
Remote services can call the server SDK's `api.delivery({data, options})` or
send JSON to `POST /api/broadcast/messages/delivery` with the existing
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
