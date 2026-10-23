# ISSUE-376: Widget presentation relations

Source: uncommitted `codex/issue-376-framework-visual`, base `3e6447dbf9fbd90b380ab771684a68dadc7d2d7c`.
Implementation owner: `public_widget_relations`. Independent review of these
two packages belongs to another agent.

## Blog and Social packages

Both modules expose the ordinary
`widgets-to-website-builder-module-widgets` relation through backend CRUD,
client/server/model SDKs, public frontend entrypoints, `find`, `default`, admin
and admin-v2 variants. Their module app registries, leaf generate/migrate targets
and aggregate relation targets include the relation. Widget admin forms expose the relation filtered by the
current `widgetId`. MCP registry and Host graph preview discover these standard
SDK entrypoints without additional registration.

Each relation stores `widgetId`, `websiteBuilderModuleWidgetId`, ordering and
ordinary metadata. Both references cascade; each owner/target pair is unique.
The default renderer reads the exact linked Website Builder Widget and renders
its saved variant with `dataSource="props"`. Locale, rendered children and an
optional rendered footer pass through. There are no business modes, forms or
presentation overrides inside the relation.

The owning directories are:

- `libs/modules/blog/relations/widgets-to-website-builder-module-widgets`
- `libs/modules/social/relations/widgets-to-website-builder-module-widgets`

Legacy admin form boundaries select only `isServer`, `variant`, `data`,
`apiProps`, `className` and declared relation slots. Admin-v2 also receives
`panelDepth` and `isTop`. New client views select `isServer={false}` for nested
SPS components. Existing Blog relation slots remain available.

## Generation and verification

The following underlying target commands ran sequentially in each relation's
`backend/repository/database` directory, Blog first and Social second:

```sh
bun /Users/rogwild/code/singlepagestartup/sps-lite/node_modules/drizzle-kit/bin.cjs up --config=./src/lib/config.ts
bun /Users/rogwild/code/singlepagestartup/sps-lite/node_modules/drizzle-kit/bin.cjs generate --config=./src/lib/config.ts
```

All four commands exited 0. Each generator reported one new table, eight
columns and two foreign keys. It requested no broad changes or interactive
decisions. SQL and migration metadata are generator output.

| Module | Generated migration                           | Table                                   |
| ------ | --------------------------------------------- | --------------------------------------- |
| Blog   | `src/lib/migrations/0000_simple_stranger.sql` | `public.sps_blog_ws_to_we_br_me_ws_c76` |
| Social | `src/lib/migrations/0000_hot_plazm.sql`       | `public.sl_ws_to_we_br_me_ws_c76`       |

Root reports both local database migrations and provider consistency migration
`0009_consistency-capture.sql` applied with exit 0. Source inspection confirms
both new resources in that generated capture migration and `capture.json`.
This report does not replace runtime generation/outbox/cache checks.

Each relation has an isolated-schema PostgreSQL integration test for its generated
migration: missing owner and target fail, duplicate pairs fail, multiple ordered
links and the default variant work, deleting either reference cascades, and
deleting an owner retains the unrelated presentation record. The two tests passed
sequentially against local PostgreSQL with a 1536 MiB cap and no worker pool.
No Nx graph, full typecheck, build or watcher was launched by this agent. Direct
formatting used a 512 MiB Node cap and excluded migrations, metadata and data
snapshots.

Exact commands from the repository root:

```sh
NODE_OPTIONS=--max-old-space-size=1536 ./node_modules/.bin/dotenv -e apps/api/.env -- node node_modules/jest/bin/jest.js --runInBand --config libs/modules/blog/jest.integration.config.ts --runTestsByPath /Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/blog/relations/widgets-to-website-builder-module-widgets/backend/repository/database/src/lib/schema.integration.spec.ts
NODE_OPTIONS=--max-old-space-size=1536 ./node_modules/.bin/dotenv -e apps/api/.env -- node node_modules/jest/bin/jest.js --runInBand --config libs/modules/social/jest.integration.config.ts --runTestsByPath /Users/rogwild/code/singlepagestartup/sps-lite/libs/modules/social/relations/widgets-to-website-builder-module-widgets/backend/repository/database/src/lib/schema.integration.spec.ts
```

Both commands used the approved local database sandbox escalation and exited 0.
Blog passed one suite and one test in 1.649 seconds; Social passed one suite and
one test in 1.563 seconds. No fixture or runtime changes were needed. Each passing
test awaited `DROP SCHEMA ... CASCADE` within its transaction before completion;
`afterAll` closed and reset its PostgreSQL client. Neither test left a running
process. Both runs emitted the dependency's `punycode` deprecation warning.

## Independent source review of other changes

Reviewer: `public_widget_relations`; skill: `review-pr`.
Scope: root's RBAC `widgets-to-ecommerce-module-widgets` package, its API/admin
registrations, curated Product reader, and Website Builder loaded-props fixes.
The Blog/Social packages above are excluded from this independent conclusion.

No actionable finding remains in this source scope:

- RBAC depends downward on Ecommerce. Its relation uses ordinary CRUD/SDK
  layers, exact owner/target references, a generated unique-pair migration and
  both cascading foreign keys. The default renderer retains the saved target
  variant, locale and children. API, admin and public frontend registrations
  are present. Generated consistency capture includes the new table.
- The Product reader selects one exact owner association and only its ordered
  `widgets-to-products` records. It filters Product IDs explicitly, preserves
  relation order, and presents an empty or unavailable state instead of reading
  the global Product collection. Product rows retain current-Subject actions
  through the owning RBAC model. See
  `libs/modules/rbac/models/widget/frontend/component/src/lib/singlepage/subject-me-ecommerce-module-product-list-default/Content.tsx:38`.
- The eight changed Website Builder default relation renderers keep their
  actual `find` read and pass loaded targets with `dataSource="props"` and
  ID-based keys. Hero, feature grid, feature card, footer groups, footer columns
  and Logotype pass loaded relation rows in props mode as well. The duplicate
  read/Provider path identified by the previous review is removed in these
  inspected compositions.

Limits: this is source review, not browser or warmed-cache acceptance. Missing-only
public GET policy, local saved graph apply/repeat/rollback, actual subscribed
readers, generated-schema constraints and the final frozen Host build remain
part of root integration verification. `git diff --check` passed for the inspected
module paths. This review does not approve the reviewer's own relation code or
advance the issue status.
