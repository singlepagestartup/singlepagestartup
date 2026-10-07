# Social Message Model

## Purpose

Messages store social chat content and interaction data.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `className`: optional CSS class name.
- `variant`: display variant.
- `title`: message title.
- `subtitle`: message subtitle.
- `description`: message body text.
- `sourceSystemId`: external source id.
- `interaction`: interaction payload (JSON).
- `metadata`: opaque JSON extension point for module-owned request, processing,
  and audit contracts. Social persists this field but does not interpret RBAC,
  OpenRouter, Knowledge, or agent-specific keys. Internal messages use the
  shared `systemMessage` envelope with `excludeFromOpenRouter: true` when they
  must remain visible in chat but must not enter generation triggers or context.

## Variants

- `default`: card-like message view.
- `find`: data-fetch wrapper for querying messages.
- `admin-form`: admin create/edit form for message fields.
- `admin-select-input`: admin select input for choosing a message.
- `admin-table`: admin table listing messages.
- `admin-table-row`: admin row showing message fields.

## AI Chat conversation

The `ai-chat-conversation` variant shows messages and the context snapshots used
by each reply. Replies retain the active document name, selected
work sections, document text and attachment snapshots used for that message.
Later edits or selection changes preserve earlier context. Agent avatars open
the role description; project documents belong to the conversation context.
These records currently live in the AI Chat frontend prototype, without adding
fields to the Social message schema or invoking an AI provider.
