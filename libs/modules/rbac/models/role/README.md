# RBAC Role Model

## Purpose

Roles group permissions and can be assigned to subjects.

## Fields

- `id`: unique identifier (UUID).
- `title`: role title.
- `slug`: role slug.
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `availableOnRegistration`: flag for default registration roles.

## Variants

- `default`: placeholder role view.
- `find`: data-fetch wrapper for querying roles.
- `admin-form`: admin create/edit form for role fields.
- `admin-select-input`: admin select input for choosing a role.
- `admin-table`: admin table listing roles.
- `admin-table-row`: admin row showing role fields.
