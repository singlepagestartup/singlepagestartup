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

## Telegram Command Registry

The SinglePage Agent service exposes protected Telegram command definitions with
a Telegram menu description and an explicit target: `telegram-bot` or
`artificial-intelligence`. System commands provide Agent handlers; `/learn` is
routed to an AI profile and is executed by the shared RBAC/OpenRouter learning
flow.

The startup service merges `getStartupTelegramCommandDefinitions()` after the
SinglePage definitions. Matching command names are merged field by field, so a
startup can change only a description without copying the framework handler;
new names extend the registry, and `enabled: false` removes a definition.
Telegram transport accepts generic `/command@bot` syntax, so startup commands
require no changes in `apps/telegram`.

`GET /api/agent/agents/telegram/commands` serializes the effective registry to
Telegram-compatible command names and descriptions. On transport startup,
`apps/telegram` reads that endpoint through the Agent server SDK with the
internal RBAC service key and calls `setMyCommands` before setting the webhook.
This keeps Agent as the command source of truth while preserving the application
boundary and startup DI override.

## Telegram Assistant Conversation

The built-in `/assistant` definition starts
`telegram-assistant-profile-management` inside the SinglePage Agent service.
The same registry owns `/cancel`, `/exit`, and `/stop`; the Telegram adapter
persists these commands like every other inbound message and never owns a
parallel conversation registry.

The conversation runtime is an explicitly singleton-scoped, replaceable
in-memory store. Its canonical key is `social.chat.id + social.thread.id +
sender social.profile.id`. Records contain only transient navigation/editor
state, a session nonce, a monotonic revision, presentation message identity,
and a 30-minute idle expiry. Per-key transition serialization and callback
revision reservation make repeated clicks stale before domain mutations run.

Every page reloads mutable data through subject-scoped RBAC server SDKs signed
for the sender subject. Profile selection and authorization are therefore
rechecked at the domain boundary instead of being trusted from callback data.
Agent resolves server data and builds the complete text plus inline keyboard
before publishing the first Social presentation message; no loading placeholder
is created. Navigation edits that message when possible, while a complete
replacement invalidates older controls. Restart/expiry recovery is to run
`/assistant` again, and a future distributed store can replace the current store
through DI.

Profile editing is a prefilled four-field draft. The sender can keep each
current value, clear optional subtitle/description values, review the complete
draft, and then save explicitly. The save re-reads authorization and merges the
Russian draft into the latest localized profile fields. MCP changes preserve
unknown stored identifiers while allowing only catalogued descriptors to be
toggled.

Assistant home resolves the latest profile avatar relation through Agent read
services. Telegram shows whether the avatar is configured and provides an
inline link to the same File Storage image rendered by the web profile sidebar.
