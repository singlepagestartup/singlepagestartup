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
text formats use a scrolling plain-text view. The Social message composer also
accepts HTML and HTM. Knowledge source uploads keep their own format list.
Legacy SVG attachments keep their noninteractive card.

Opening an HTML attachment reads up to 2 MiB into an isolated document.
Inline JavaScript runs there. Scripts and stylesheets may load from
`cdn.tailwindcss.com`, `cdn.jsdelivr.net` and `cdnjs.cloudflare.com`.
The attachment has an opaque origin. The enclosing frame restricts navigation
to data documents, and the inherited content policy blocks API requests.
The viewer also offers source text and a download. A draft never links to a
top-level Blob document. External CDN requests disclose the viewer's IP to the
CDN. Only open an interactive preview when you want its scripts to run.

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

### Reading file content by ID

`GET` and `HEAD /api/file-storage/files/:uuid/content` resolve a File record
by ID and read the original bytes through the File service. The `content`
SDK operation sends the caller's credentials and supports cancellation.
Responses carry `Cache-Control: private, no-store`. The default API serves this route publicly. Downloading a file requires its
ID and does not check a role, chat membership or article subscription.

The API also serves local files under `/public/...` by path. Anyone with a
public URL can read those bytes. Both API routes sandbox directly opened
documents and send HTML as an attachment. Raw object-storage URLs use the
storage provider's own delivery headers and access rules.

## Create from a URL

`POST /api/file-storage/files/create-from-url` downloads the file at `data.url`
and stores it like an upload. The API fetches that URL itself, so it accepts only
`http` and `https` URLs without a user name or password whose origin is one of
the deployment's own origins or whose host resolves to public addresses only.
Loopback, private, shared (carrier-grade NAT), link-local (including the cloud
metadata address), unique-local, unspecified, multicast and reserved addresses
are refused with 400, and every redirect is checked the same way. The download
is bounded by `FILE_STORAGE_MAX_UPLOAD_BYTES` like any other upload (see the
module README): a larger body answers 413 and nothing is stored. The observer
pipeline applies the same address rules to the URLs of its steps and reads at
most `OUTBOUND_URL_MAX_RESPONSE_BYTES` of each response.

The deployment's own origins are those of `API_SERVICE_URL`,
`NEXT_PUBLIC_API_SERVICE_URL`, `HOST_SERVICE_URL` and
`NEXT_PUBLIC_HOST_SERVICE_URL`. `POST /api/file-storage/files/generate` relies
on this: it downloads the image the host renders under `HOST_SERVICE_URL`.

| Variable                          | Default    | Meaning                                                                                                              |
| --------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| `OUTBOUND_URL_ALLOWED_ORIGINS`    | empty      | Further origins the API may reach although they resolve to non-public addresses, comma-separated (`http://crm:8080`) |
| `OUTBOUND_URL_TIMEOUT_MS`         | `30000`    | Deadline for one download, redirects and body included                                                               |
| `OUTBOUND_URL_MAX_RESPONSE_BYTES` | `52428800` | Largest response body an observer pipeline step reads (50 MiB)                                                       |
