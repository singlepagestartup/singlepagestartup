# Social Thread Model

## Purpose

Threads group messages within chats.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `className`: optional CSS class name.
- `variant`: presentation or order conversation lifecycle variant.
- `title`: thread title.
- `description`: thread description.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.
- `metadata`: generic JSONB extension point for namespaced module-owned thread
  settings. The Social module does not interpret nested contracts.

## Variants

- `id-ai-chat`: Thread header, message and composer slots. A supplied context slot adds a sidebar at `xl` and a Chat/Context switch on smaller screens.
- `download-ai-chat`: presentation for a supplied document export action and pending state.
- `list-item-sidebar-ai-chat`: memoized document or topic link with a selected state, Studio glyphs and a localized destination.
- `default`: placeholder thread view.
- `find`: data-fetch wrapper for querying threads.
- `admin-form`: admin create/edit form for thread fields.
- `admin-select-input`: admin select input for choosing a thread.
- `admin-table`: admin table listing threads.
- `admin-table-row`: admin row showing thread fields.

Completed order discussions use the stored `closed` variant. Their human
support conversations use `support` and a protected chat-to-thread link. RBAC
handles access for the buyer and store owner. A thread keeps its ID and links
when its variant changes. Primary threads are resolved through chat-to-thread
relations using `orderIndex`, relation creation time, thread creation time,
and thread ID.

RBAC stores the versioned `rbacAiThreadPreferences` namespace in `metadata`
for chat-composer preferences such as the explicitly selected OpenRouter model.
Unknown metadata keys are preserved when that namespace is updated.

Earlier AI Chat projects may retain document and proposal metadata on existing
threads. The Social workspace opens those threads as conversations and preserves
their messages, attached files and historical metadata.

## Atomic metadata namespace updates

The Thread Repository and Service expose `updateMetadataNamespace({ id,
namespace, expectedValue, value })`. One SQL update compares the namespace's
current JSONB value and replaces only that key. Missing and JSON null values
compare as null. A stale comparison returns null; success returns the updated
Thread. Other metadata keys survive concurrent updates.

The server SDK exposes the same operation through the existing Thread PATCH
route, with `data.metadataNamespaceUpdate` as its sole field. Ordinary update
routing, output schemas, revalidation and WebSocket notification middleware
remain in use. Namespace names exclude prototype keys. Direct full-metadata
replacement remains ordinary CRUD; callers that modify one owned namespace use
the atomic operation.

RBAC uses it for preferences and `rbacAiThreadContext`.
Social stores that context as opaque JSON and does not summarize conversations
or interpret Profile memory, draft text, hashes or Source versions.
