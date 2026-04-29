# Agent Model

## Purpose

Agents define automated jobs (cron-like tasks) with a title, interval, and
configuration metadata used by the automation layer.

## Fields

- `title`: agent title.
- `adminTitle`: title shown in admin interface.
- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant/style.
- `slug`: URL-friendly unique identifier.
- `interval`: execution interval string for scheduled runs.

## Variants

- `default`: placeholder runtime variant (no rendering logic yet).
- `find`: data-fetch wrapper for querying agents.
- `admin-select-input`: admin UI select input for linking agents.
- `admin-table-row`: admin UI row for agent listings.
- `admin-form`: admin UI create/edit form.
- `admin-table`: admin UI table for browsing agents.

## Telegram Thread Commands

The singlepage agent service owns Telegram thread commands:

- `/threads` lists `social.thread` records for the current `social.chat`.
- `/thread_new <title>` creates a thread through the RBAC thread create flow.
- `/thread_rename <title>` renames the current non-default thread through the
  RBAC thread update flow.
- `/thread_delete confirm` deletes the current non-default thread through the
  RBAC thread delete flow.

Commands must run from the sender subject, resolved from the incoming
`social.message`, not from the Telegram adapter process identity. Replies must
be created through the thread-aware Telegram bot reply path so they remain in
the command thread.

`apps/telegram` must not call RBAC thread find/create/update/delete for these
commands. It remains responsible for Telegram auth/bootstrap and incoming
message/action ingestion only.
