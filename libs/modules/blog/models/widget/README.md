# Blog Widget Model

## Purpose

Blog widgets are reusable content blocks that render article and category lists or act as layout containers for blog views.

## Fields

- `id`: unique identifier (UUID).
- `className`: optional CSS class name.
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.
- `title`: localized title.
- `subtitle`: localized subtitle.
- `description`: localized rich description.

## Variants

- `default`: placeholder widget view.
- `category-list-default`: renders a card with all categories listed.
- `category-overview-default`: selects and renders the Category identified by its explicit slug.
- `article-list-default`: renders a card with related articles (or all articles if no relation).
- `article-overview-default`: selects and renders the Article identified by its explicit slug.
- `article-overview-with-private-content-default`: Article view with a higher-module private-content slot.
- `article-overview-ecommerce-module-product-list-default`: related Product views with a higher-module purchase slot.
- `find`: data-fetch wrapper for querying widgets.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing a widget.
- `admin-table`: admin table listing widgets.
- `admin-table-row`: admin row showing widget fields.

## Page context and higher-module slots

Article overview Widgets accept `articleSlug`; Category overview accepts
`categorySlug`. Host selects both inside its Page render-reader callback. They read the matching entity
through public model components and keep lower views on explicit loaded data.
Missing keys do not issue unfiltered reads. Host dispatches saved Widgets through
the public registry with dataSource=props. Stored Widget records and content
remain unchanged.

Both Article overview compositions expose `renderContent({ data: article })`. Host supplies the same client-only RBAC content operation for public and private article URLs. The private variant retains `renderPrivateContent` as a compatibility alias. The resolved JSX replaces the Article view's public fallback reader and preserves mixed public/private positions.
Article products expose `renderProduct({ data: product })`, with a public
Ecommerce view as the default. Host supplies the RBAC operations in those typed
slots; Blog imports no RBAC code. Callbacks execute beside the owning reader and
produce JSX before any client boundary. Lower entity reads do not receive the
routing map.

Article and Category collection Widgets keep their saved curated relation order,
fall back to the model collection when no links exist, and own their grid
skeleton and empty state. Entity `loading` variants render one item.
