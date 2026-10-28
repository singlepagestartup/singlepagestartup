# Social Widget Model

## Purpose

Social widgets provide layout wrappers for profile and chat views.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `className`: optional CSS class name.
- `variant`: display variant.
- `title`: localized title.
- `subtitle`: localized subtitle.
- `description`: localized description.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: placeholder widget view.
- `profile-overview-default`: card layout wrapper for profile overview content.
- `author-list-default`: paginated public-author directory using allowlisted Author list/count SDK operations and Profile UUID links.
- `author-overview-default`: public author detail selected by explicit `profileId`, with linked public Articles and Products.
- `chat-list-default`: wrapper for chat list content.
- `chat-overview-default`: wrapper for chat overview content.
- `find`: data-fetch wrapper for querying widgets.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing a widget.
- `admin-table`: admin table listing widgets.
- `admin-table-row`: admin row showing widget fields.

## Page context and chat composition

Public author overview receives the Profile UUID as `profileId`, selected by
Host inside the Page URL reader callback. The legacy `profile-overview-default`
wrapper also uses an explicit `profileId` for its public-author content; a stored
private Profile slug is not a public lookup key. Authenticated chat lists and chat
overviews belong to RBAC Widgets. Their Website Builder frame receives rendered
Subject content, and Social model views retain the Chat/Thread/Message UI.
Social imports no RBAC code and the legacy chat Widget wrappers render only
supplied children; they do not extract chat IDs or invoke higher-module callbacks.

Both author Widgets resolve their exact
`widgets-to-website-builder-module-widgets` links with a `widgetId` filter and
the default relation renderer. Website Builder's saved `content-collection`
frame owns headings, description and layout. Social supplies rendered rows,
detail content and pagination through children/footer slots. Public Author DTOs
contain no private Profile slug, Subject/Identity ownership or AI workspace
configuration. Current-account and private Chat reads retain their own scopes.

Existing chat Widget records and their localized content are retained by
`tools/runtime/social-widget-links.ts`. Its prepare/apply/rollback flow copies
the frame fields into explicit Website Builder instances and switches the same
Host association IDs to RBAC Widgets. The inactive original source associations
prevent seed from recreating an active duplicate. A downstream upgrade using
these legacy bindings needs the data cutover as well as the new code.
