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

- `id-ai-chat`: Thread header and message/composer slots. An explicit `isDocument` prop enables responsive Chat/Document panes, Knowledge and download slots; ordinary conversations occupy the full width.
- `download-ai-chat`: document export button receiving a download action and pending state from RBAC Subject.
- `list-item-sidebar-ai-chat`: memoized document or topic link with a selected state, Studio glyphs and a localized destination.
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

RBAC also stores `rbacAiDocumentProposal` in document Thread metadata. It holds
one exact proposed Knowledge edit, the Source's original content hash, the
message showing the proposal, and its pending, applied or rejected state.
A later user confirmation applies the stored text. A changed Source requires
a new proposal; repeated confirmation of an applied proposal performs no write.

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

RBAC uses it for preferences, document proposals and `rbacAiThreadContext`.
Social stores that context as opaque JSON and does not summarize conversations
or interpret Profile memory, draft text, hashes or Source versions.
