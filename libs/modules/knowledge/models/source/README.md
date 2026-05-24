# Knowledge Source Model

## Purpose

Sources represent original content files imported into the Knowledge module. A source stores the full normalized text, file identity, indexing status, and document-level metadata used to recreate chunks idempotently.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `title`: source title shown in admin and search references.
- `type`: discovered content type, such as transcript, markdown, description, or YouTube description.
- `content`: normalized source text used for chunking.
- `description`: optional document summary or description text.
- `originalPath`: unique path to the source file.
- `contentHash`: hash of the normalized source content.
- `status`: import state such as `indexed`, `unchanged`, or `failed`.
- `lastIndexedAt`: timestamp of the most recent indexing pass.
- `metadata`: JSON metadata derived from the source path and parser.

## Indexing Behavior

The indexer looks up sources by `originalPath`, compares `contentHash`, and skips unchanged files. When content changes, the source is updated and its chunks are recreated.

## Variants

- `default`: placeholder source view.
- `find`: data-fetch wrapper for querying sources.
- `find-by-id`: fetch a source by ID on server or client.
- `admin-form`: admin create/edit form for source fields.
- `admin-select-input`: admin select input for choosing a source.
- `admin-table`: admin table listing sources.
- `admin-table-row`: admin row showing source fields.

## Related API

Knowledge-specific indexing and retrieval routes live at `/api/knowledge`. Generated CRUD routes remain available through the source model SDK.
