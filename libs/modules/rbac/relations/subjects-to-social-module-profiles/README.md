# RBAC Subjects to Social Module Profiles Relation

## Purpose

Links subjects to social profiles.

At sign-in, RBAC looks for a Profile of type `default` among the user's
`default` links. Two such Profiles are a data integrity error. If none exists,
RBAC reuses a single linked `telegram` Profile or provisions a personal Profile.
Publication channels (`publication-default`) can each have a `default` link.
An `assistant` link identifies a Profile owned by the user for AI Chat work. Assistant ownership
does not make the assistant the user's identity in Chat participants.

Agent Subjects retain their own `default` identity link. Their human owner's
separate link to that Profile uses `assistant`.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `className`: optional CSS class name.
- `subjectId`: linked subject ID.
- `socialModuleProfileId`: linked profile ID.

## Variants

- `default`: renders the related profile using its frontend variant.
- `assistant`: a user's owned AI Chat Profile; uses the default relation renderer.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
