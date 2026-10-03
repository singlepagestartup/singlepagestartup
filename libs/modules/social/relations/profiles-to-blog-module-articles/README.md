# Profiles to Blog module articles

Links `social/profile` records to `blog/article` records. A profile can have
multiple articles, and an article can be linked to multiple profiles.

## Fields

- `id`, `createdAt`, `updatedAt`: relation identity and timestamps.
- `profileId`: required Social profile UUID.
- `blogModuleArticleId`: required Blog article UUID.
- `variant`: display variant, defaulting to `default`.
- `orderIndex`: display order, defaulting to `0`.
- `className`: optional Tailwind classes for the relation wrapper.

Deleting a profile or article removes its relation rows. Deleting a relation
preserves both linked records. The relation adds no single-author constraint.

## API and SDKs

The standard CRUD route is `/api/social/profiles-to-blog-module-articles`.
SDK imports use `@sps/social/relations/profiles-to-blog-module-articles/sdk/client`
or `sdk/server`; schemas and `IModel` come from `sdk/model`.

Reads and writes use the existing RBAC permission resolution. Projects must
grant access to this route and the linked Blog article read routes through
their existing permission management. The relation adds no anonymous-access
exception. Root-role and service-key access follow the existing API rules.

MCP discovers the relation from its model/server SDK entry points. Dump and seed
remain disabled, matching the profile-to-Knowledge relation; their configuration
maps both foreign keys to the corresponding profile and article seed records.

## Frontend variants

- `find`: queries relation rows through the SDK provider.
- `default`: queries the linked article and renders its existing `default` card.
- `admin-form`, `admin-select-input`, `admin-table`, `admin-table-row`.
- `admin-v2-form`, `admin-v2-select-input`, `admin-v2-table`, `admin-v2-table-row`.

Both admin generations expose the relation from profile and article forms.
Tables filter by the current parent. Forms and tables accept optional
`defaultProfileId` and `defaultBlogModuleArticleId` for create mode; persisted
relation values take precedence when editing. Admin-v2 rows also open editors
for the linked profile and article.

Persisted relation forms and table rows offer deletion with confirmation.
The mutation uses the shared SDK cache updates and WebSocket revalidation.

The profile frontend variant `articles-default` renders these cards in a
responsive grid, ordered by `orderIndex` ascending:

```tsx
import { Component as Profile } from "@sps/social/models/profile/frontend/component";

<Profile isServer={true} variant="articles-default" data={profile} language="ru" />;
```

For a custom layout, query this relation with `variant="find"` and
`apiProps.params.filters.and` filtering `profileId`, then render each row with
`variant="default"`. Pass the language and runtime to each rendered relation.

## Migrations

```bash
npx nx run @sps/social:relations:profiles-to-blog-module-articles:repository-generate
npx nx run @sps/social:relations:profiles-to-blog-module-articles:repository-migrate
```

The profile and article tables must exist before applying this migration. The
API's combined migration target runs Blog before Social. Existing data needs
no backfill; links are created through the admin or SDK.

## Verification

Run the Social unit and integration targets:

```bash
npx nx run @sps/social:jest:test --runInBand
npx nx run @sps/social:jest:integration --runInBand
```

Set `SPS_RELATION_TEST_DATABASE_URL` to a disposable local PostgreSQL database
to run the relation's database integration suite. It applies the parent and
relation migrations and writes test fixtures. The suite is skipped when the
variable is absent.
