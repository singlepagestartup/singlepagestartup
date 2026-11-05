# File Storage File Model

## Purpose

Files store uploaded media and metadata for images, videos, and documents.

File Storage does not import Knowledge. Its service deletes the stored bytes
and the File record, and ordinary updates use the model's CRUD repository.
Knowledge owns operations that also rebuild Sources using that File.

## Fields

- `id`: unique identifier (UUID).
- `file`: file path or URL.
- `containerClassName`: optional container CSS class name.
- `className`: optional CSS class name for media.
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `adminTitle`: title used in admin UI.
- `width`: media width.
- `height`: media height.
- `alt`: alt text.
- `size`: file size.
- `extension`: file extension.
- `mimeType`: MIME type.

## Variants

- `default`: renders image/video output based on MIME type.
- `attachment-ai-chat`: compact card that opens a centered file preview dialog.
- `find`: data-fetch wrapper for querying files.
- `admin-form`: admin create/edit form for file metadata.
- `admin-select-input`: admin select input for choosing a file.
- `admin-table`: admin table listing files.
- `admin-table-row`: admin row showing file fields.

The effective File service exposes stored-byte reads, path imports and transaction-bound reference/update locks for consuming services. Its repository owns File table SQL. Knowledge supplies its attachment policy before an import and before creating a Knowledge relation; File Storage remains independent of Knowledge.

## Attachment preview

`attachment-ai-chat` uses the shared record reader and `FilePreview` UI adapter
for Knowledge and message attachments. A parent with an authorized File result
passes `dataSource="props"`; the card does not repeat the metadata query or
mount another Provider. The shared reader passes the loaded File to the
`index.tsx` renderer, which selects only the File, variant and language for
`client.tsx`. The client reader composes a lazy JSX text-reader slot and passes
it through `Component.tsx` to `ClientComponent.tsx`. Views do not import the
local reader; SDK bindings and request options stay above the client boundary.

The local `client.tsx` reads original text only while its preview is open using
`fileApi.previewText`. This separate byte query belongs to the shared React
Query client, carries File realtime topics and keys its result by ID, path and
`updatedAt`. It stays fresh for 60 seconds and is removed after 120 seconds
without observers. The original bytes do not enter the global action debug
snapshot. Both declared and streamed text sizes are limited to 2 MiB.

`fileApi.download({ src, signal? })` retrieves public original bytes without
credentials for PDF rendering and the Download action. Preview does not widen
File metadata access. PDF pages render in the browser through the app's lazy
PDF.js bundle; images support zoom, Markdown has formatted/source modes, and
text formats use a scrolling plain-text view. Unsupported formats and preview
errors retain original/download actions. Blocked legacy SVG/unavailable
attachments keep their noninteractive card.

## Protected article media

`ProtectedMediaProvider` receives a principal/article/slot scope key from the
granted RBAC content boundary. Within that subtree, the registered
`authenticated-content` variant reads original bytes through `fileApi.content`
and displays a Blob URL. It receives already loaded metadata and does not add
a second record query or SDK Provider. Public `default` rendering is unchanged.

Byte queries belong to React Query, carry File realtime topics and the captured
API-host/principal scope, and are cancelled and removed when that scope closes.
Blob URLs are revoked on replacement, denial and unmount. A 401/403 removes the
previous source immediately; transient failures preserve currently mounted media
while exposing Retry. No protected Blob enters the global action debug snapshot.

### Protected bytes

`GET` and `HEAD /api/file-storage/files/:uuid/content` use the owning File
service to return managed bytes after the API host verifies all private roots.
The client/server SDK operation `content` returns a Blob and supports request
cancellation. It sends current credentials with no-store request options;
protected responses have private/no-store headers. The protected File reader
owns the temporary object URL and removes it when its access scope closes.
The public `download` operation keeps its existing behavior.

The same access check protects File metadata, canonical managed byte aliases
and direct `/public/...` GET/HEAD paths. A protected file's storage location
cannot be replaced through ordinary multipart update. Private graphs use
isolated managed bytes; existing public files are copied before marking.
