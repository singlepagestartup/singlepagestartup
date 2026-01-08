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
