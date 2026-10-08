# Social Thread Model

## Purpose

Threads group messages within chats.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `className`: optional CSS class name.
- `variant`: display variant.
- `title`: thread title.
- `description`: thread description.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.
- `metadata`: generic JSONB extension point for namespaced module-owned thread
  settings. The Social module does not interpret nested contracts.

## Variants

- `default`: placeholder thread view.
- `find`: data-fetch wrapper for querying threads.
- `admin-form`: admin create/edit form for thread fields.
- `admin-select-input`: admin select input for choosing a thread.
- `admin-table`: admin table listing threads.
- `admin-table-row`: admin row showing thread fields.

`variant` controls presentation only. It does not identify a unique or system
thread inside a chat. When a legacy flow needs a primary thread, it resolves the
chat-to-thread relations deterministically by `orderIndex`, relation creation
time, thread creation time, and finally thread ID.

RBAC stores the versioned `rbacAiThreadPreferences` namespace in `metadata`
for chat-composer preferences such as the explicitly selected OpenRouter model.
Unknown metadata keys are preserved when that namespace is updated.
