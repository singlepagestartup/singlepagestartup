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

- `default`: profile card with title.
- `overview-default`: profile hero section with description and widgets.
- `button-default`: compact button for profile.
- `find`: data-fetch wrapper for querying profiles.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing a profile.
- `admin-table`: admin table listing profiles.
- `admin-table-row`: admin row showing profile fields.
