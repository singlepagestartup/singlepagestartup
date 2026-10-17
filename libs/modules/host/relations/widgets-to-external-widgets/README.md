# Host Widgets To External Widgets Relation

## Purpose

Links host widgets to external module widgets.

AI Chat composition starts from the target Widget's persisted module and ID.
Projects, authentication and Help target RBAC Widgets. RBAC resolves their own
Website Builder content and CRM links; Host does not search a content variant or
global authentication slug. The original project creation card and photograph
remain attached to the selected RBAC Widget. A separate runtime manifest command
performs and can roll back the data cutover without changing Host Page, Layout
or Widget IDs.

Website Builder targets render their stored variant directly. Landing owns its
local interactive demonstration and imports no Social Chat reader. The Navbar
adapter supplies account/project controls and route presentation flags through
children; public Widget record reads do not consume session cookies. Subject
controls own their authenticated client SDK reads.

The three Profile/Chat/Thread screen adapters resolve IDs through Host Page
`url-segment-value`, using the page mask stored in the database. They pass those
IDs and the locale to RBAC Widgets. The Navbar adapter supplies `helpSelected`
to Website Builder and `settingsSelected` to the Subject account menu. The raw
Page URL remains in Host; external Widgets receive model IDs, locale and
presentation flags. Host relation filters stay on the relation reader and are
not forwarded to a target Widget's SDK.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant/style.
- `orderIndex`: ordering index for the relation.
- `className`: custom CSS classes.
- `widgetId`: related reference.
- `externalModule`: related reference.
- `externalWidgetId`: related reference.

## Variants

- `default`: renders the related target for this link.
- `find`: data-fetch wrapper for querying relations.
- `admin-select-input`: admin UI select input for linking relations.
- `admin-table-row`: admin UI row for relation listings.
- `admin-form`: admin UI create/edit form.
- `admin-table`: admin UI table for browsing relations.
