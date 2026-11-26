# RBAC Subjects to Identities Relation

## Purpose

Links subjects to sign-in identities and to credentials used for outbound provider requests.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `className`: optional CSS class name.
- `subjectId`: linked subject ID.
- `identityId`: linked identity ID.

Each authentication identity resolves to at most one subject. A subject can own identities for several providers.

For outbound credentials, `provider-connection` records the technical subject, identity, store, owner and credential version. A `provider-assignment` grants a capability and rate card to a store assistant. A `provider-default` supplies the store fallback. Ordinary identity reads and mutations exclude all three variants. Store owners use the provider settings to manage them.

## Variants

- `default`: renders the related identity using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.
