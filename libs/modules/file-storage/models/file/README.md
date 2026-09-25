# File Storage File Model

## Purpose

Files store uploaded media and metadata for images, videos, and documents.

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
- `find`: data-fetch wrapper for querying files.
- `admin-form`: admin create/edit form for file metadata.
- `admin-select-input`: admin select input for choosing a file.
- `admin-table`: admin table listing files.
- `admin-table-row`: admin row showing file fields.

## Create from a URL

`POST /api/file-storage/files/create-from-url` downloads the file at `data.url`
and stores it like an upload. The API fetches that URL itself, so it accepts only
`http` and `https` URLs without a user name or password whose origin is one of
the deployment's own origins or whose host resolves to public addresses only.
Loopback, private, shared (carrier-grade NAT), link-local (including the cloud
metadata address), unique-local, unspecified, multicast and reserved addresses
are refused with 400, and every redirect is checked the same way. The observer
pipeline applies the same rules to the URLs of its steps.

The deployment's own origins are those of `API_SERVICE_URL`,
`NEXT_PUBLIC_API_SERVICE_URL`, `HOST_SERVICE_URL` and
`NEXT_PUBLIC_HOST_SERVICE_URL`. `POST /api/file-storage/files/generate` relies
on this: it downloads the image the host renders under `HOST_SERVICE_URL`.

| Variable                          | Default    | Meaning                                                                                                              |
| --------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------- |
| `OUTBOUND_URL_ALLOWED_ORIGINS`    | empty      | Further origins the API may reach although they resolve to non-public addresses, comma-separated (`http://crm:8080`) |
| `OUTBOUND_URL_TIMEOUT_MS`         | `30000`    | Deadline for one download, redirects and body included                                                               |
| `OUTBOUND_URL_MAX_RESPONSE_BYTES` | `52428800` | Largest body downloaded (50 MiB)                                                                                     |
