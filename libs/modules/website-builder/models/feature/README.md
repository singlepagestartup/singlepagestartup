# Website Builder Feature Model

## Purpose

Features describe highlighted content blocks with text and optional media.

## Fields

- `className`: custom CSS classes.
- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant/style.
- `title`: feature title (localized).
- `subtitle`: feature subtitle (localized).
- `description`: feature description (localized, rich text).
- `adminTitle`: title shown in admin interface.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: renders title/description and linked media files.
- `definition-card`: one capability card with saved subtitle, title, rich description and exact linked action groups.
- `definition-item`: the same saved content in a compact ruled layout.
- `definition-checklist`: the ruled layout with a Phosphor check-circle glyph.
- `step`: one numbered process item; the number is its saved localized subtitle.
- `copy-request`: one saved request with a selectable body, localized clipboard feedback and guarded pending state. Rich text is converted to plain text through the installed TipTap parser and serializer before copying. Empty content disables copying. Changing the record, title or copyable text clears feedback and invalidates an earlier pending result.
- `dropdown`: one native disclosure; its saved title supplies the summary and its rich description supplies the answer.
- `find`: data-fetch wrapper for querying features.
- `admin-select-input`: admin UI select input for linking features.
- `admin-table-row`: admin UI row for feature listings.
- `admin-form`: admin UI create/edit form.
- `admin-table`: admin UI table for browsing features.

## Presentation and reading

These variants use the standard saved-record Feature SDK template and the
effective singlepage/startup registry. Definition layouts share a
server-compatible presentation within the model. Their action associations are
filtered by Feature ID, ordered by position and association ID, and rendered
through the default relation with its loaded record. In `definition-card`, the
first button in the first ordered action group supplies the card's stretched
link; later saved links remain independently clickable.

`copy-request/Component.tsx` reads localized saved data and constructs explicit
serializable UI props plus the rendered description node. Its client component
receives no SDK, Provider or server component constructor. Copying changes only
the browser clipboard and local feedback.

## Icons

The shared Phosphor adapter supplies `file-text` ▤, `check` ✓,
`check-circle` ✓ and `plus` +. Disclosure and copy controls retain keyboard
focus styles and visible pending or result feedback.
