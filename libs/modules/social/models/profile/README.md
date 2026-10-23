# Social Profile Model

## Purpose

Profiles store localized user-facing information for social features.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `className`: optional CSS class name.
- `variant`: display variant.
- `title`: localized title.
- `subtitle`: localized subtitle.
- `description`: localized description.
- `allowedMcpServerIds`: stable identifiers of MCP servers the profile may
  use. The field is an empty list by default, so MCP access is opt-in.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.

## MCP Servers

The only supported identifier is `singlepagestartup`, which resolves to the
local SinglePageStartup `apps.mcp` service through environment configuration.
Unknown stored identifiers are shown as unavailable in the admin form and are
never treated as active servers.

The JSONB identifier list is an initial SinglePageStartup-MCP configuration
mechanism. A future dedicated MCP-server model and profile relation will own
connection parameters for additional servers.

## Variants

- `sidebar-ai-chat-project`: shared project navigation with Settings and New thread links, current-page states, and slots for Documents and Thread rows.
- `id-ai-chat-project`: server project frame with navigation and content slots.
- `id-settings-ai-chat`: personal Profile editor receiving an avatar slot and save callback from RBAC Subject.

- `byline`: Studio avatar/name presentation using the stored localized title and first ordered Profile→File attachment. The larger size includes the stored subtitle. Missing media shows initials derived from the stored title or slug; names and roles have no fixture fallback.

- `default`: profile card with title.
- `overview-default`: profile hero section with description and widgets.
- `articles-default`: responsive grid of linked Blog article cards, ordered by the relation's `orderIndex` ascending.
- `button-default`: compact button for profile.
- `select-ai-chat-project`: project navigation menu with the active Profile, project rows and a create link.
- `select-item-ai-chat-project`: Profile menu row with a destination URL and selected indicator.
- `thread-list-sidebar-ai-chat`: collapsible Documents navigation with Thread links, a document count and the selected item. It starts expanded and supports pointer and keyboard toggling.

Documents and topic rows use Social Thread `list-item-sidebar-ai-chat`.

- `find`: data-fetch wrapper for querying profiles.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing a profile.
- `admin-table`: admin table listing profiles.
- `admin-table-row`: admin row showing profile fields.

The public `BylineSkeleton` presentation renders one pending avatar/name entity
for both byline sizes. The byline reader, author association reader and Host
author lookup use this same skeleton; it owns no SDK or Provider.

## Blog articles

[profiles-to-blog-module-articles](../../relations/profiles-to-blog-module-articles/README.md)
links profiles to articles. Both admin generations expose an Articles relation
section for attaching, editing and removing links. The separate
`articles-default` frontend variant leaves `overview-default` and persisted
profile types unchanged.

```tsx
<Profile isServer={true} variant="articles-default" data={profile} language="ru" />
```

The caller needs RBAC access to the relation and linked Blog articles.
