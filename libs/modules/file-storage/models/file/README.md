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
mount another Provider. `Component.tsx` passes explicit display props and a
lazy JSX text-reader slot to `ClientComponent.tsx`.

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
