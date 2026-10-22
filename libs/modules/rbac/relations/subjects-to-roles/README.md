# RBAC Subjects to Roles Relation

## Purpose

Links subjects to roles.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `orderIndex`: ordering index for display.
- `className`: optional CSS class name.
- `subjectId`: linked subject ID.
- `roleId`: linked role ID.

## Natural key and startup extension

The database permits exactly one relation for `(subjectId, roleId)`. The named
composite unique index is declared in `constraints/singlepage.ts` and is
retained by the `singlepage -> startup -> index` composition. Startup may add
indexes; replacing the pair requires coordinated service filters, repair, and
a generated migration.

Repository columns use the same extension boundary: SPS defaults live in
`fields/singlepage.ts`, `fields/startup.ts` inherits them and may add or
override startup-specific columns, and `fields/index.ts` exposes the composed
set to `schema.ts`. Constraints never own column declarations.

## Variants

- `default`: renders the related role using its frontend variant.
- `find`: data-fetch wrapper for querying relations.
- `admin-form`: admin create/edit form for relation fields and IDs.
- `admin-select-input`: admin select input for choosing a relation.
- `admin-table`: admin table listing relations.
- `admin-table-row`: admin row showing relation fields.

## Subscription revocation

Generic delete and reassignment use the owning relation Service. Its API-host
composition marks matching owned subscription Orders through the effective
Ecommerce Service before deleting or changing the grant. Both writes share the
owning grant transaction and Subject delivery lock. An unconfigured Service
fails closed for these operations; recreating a Role does not clear an Order's
server-owned revocation marker.

`deleteForOrderFulfillment` is an internal capability with an exact Subject,
Order and grant scope. It verifies natural subscription expiry or completion
or cancellation of an owned Order. Subscription cancellation requires that
Order's revocation marker. The operation preserves grants required by another
current subscription. No REST parameter bypasses explicit revocation.

`apps/api/app.ts` calls `configureRevocation({ revoke, canFulfill })` on both
the HTTP relation Service and the Subject-injected relation Service. These
callbacks delegate Order reads and revocation to the effective Ecommerce
Service. Tests constructing this relation Service directly must provide the
callbacks before delete or reassignment. The owning repository locks only
Subject grant rows and tracks that read through the shared consistency layer.
