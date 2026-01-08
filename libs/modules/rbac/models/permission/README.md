# RBAC Permission Model

## Purpose

Permissions define allowed operations for resources (method/path pairs).

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `type`: permission type (default: `HTTP`).
- `method`: HTTP method.
- `path`: resource path.

## Variants

- `default`: placeholder permission view.
- `find`: data-fetch wrapper for querying permissions.
- `admin-form`: admin create/edit form for permission fields.
- `admin-select-input`: admin select input for choosing a permission.
- `admin-table`: admin table listing permissions.
- `admin-table-row`: admin row showing permission fields.
