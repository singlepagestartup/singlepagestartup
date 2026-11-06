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

Route-dependent module adapters and the Navbar leaf use Page
variant=url-segment-values. The complete map stays inside its render callback;
Host passes explicit IDs and module-qualified slugs to the public saved Widget
variant. Page, Layout, Widget and relation props do not carry the map. Missing
values remain undefined, and domain readers guard required IDs before querying.
Navigation Subject controls remain explicit JSX slots.

Host has no private Widget registries for RBAC, Blog, Social or Ecommerce.
Blog retains renderPrivateContent and renderProduct slots: its readers supply
loaded Article/Product records, and Host supplies the RBAC operation. Those
callbacks resolve within the same runtime before JSX crosses a client boundary.
Authenticated Social chat list and overview bindings target RBAC Widgets; the
Social adapter has no Subject imports or callbacks. Lower modules respect the
confirmed dependency order.

Purchasing scenarios target RBAC Widgets and their exact Website Builder
presentation links. Product cards, prices and media remain Ecommerce; Subject
owns scoped cart/checkout controls. Relation filters do not reach a target
Widget SDK. Routing maps do not become entity SDK parameters or query keys.

Four existing purchasing configurations transfer through
`tools/runtime/ecommerce-widget-links.ts`. Prepare it with explicit Host link
and source Ecommerce Widget IDs, inspect the before manifest, then apply it.
The active Host association IDs and order stay unchanged. An inactive hidden
association preserves each original seed lookup key. Source Widgets and their links
are retained for rollback. Website Builder copies preserve localized title,
subtitle, description, anchor and className. Repeat application is safe; the
command refuses stale records and writes Host bindings last.

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
- `hidden`: retains an inactive association without rendering or fetching its
  target. Keep this state for retired seeded links so later seed runs find the
  existing natural key instead of recreating an active duplicate. Active domain
  and presentation compositions still use default; hidden does not select a screen.
- `find`: data-fetch wrapper for querying relations.
- `admin-select-input`: admin UI select input for linking relations.
- `admin-table-row`: admin UI row for relation listings.
- `admin-form`: admin UI create/edit form.
- `admin-table`: admin UI table for browsing relations.
