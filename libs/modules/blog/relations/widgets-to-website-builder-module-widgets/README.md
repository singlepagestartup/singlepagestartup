# Blog Widgets to Website Builder Widgets

Connects an exact Blog Widget to an exact Website Builder Widget. The Blog
Widget owns SDK reads and domain operations. Website Builder owns saved copy,
layout and imagery, and receives rendered `children` and an optional `footer`.

Fields are UUID `id`, timestamps, `widgetId`, `websiteBuilderModuleWidgetId`,
`variant`, `orderIndex` and `className`. Both references cascade on deletion.
An owner/target pair is unique; multiple ordered links are supported. A Widget
that requires one presentation frame validates that requirement in its own view.

Query the relation with `variant="find"` and a `widgetId` filter under
`apiProps.params.filters.and`. The `default` renderer reads the exact linked
Website Builder Widget, selects its saved variant with `dataSource="props"`,
and forwards locale and JSX slots. The relation chooses no business screens,
forms or presentation overrides.

Standard admin and admin-v2 forms expose this relation from the Blog Widget.
The SDK route is `/api/blog/widgets-to-website-builder-module-widgets`.
MCP content-management discovery and Host preview discover the ordinary SDK
entrypoints; they need no separate registry. Public configuration GET permissions
remain distinct from privileged writes. A Widget filter is not authorization.

Generate migrations with
`npx nx run @sps/blog:relations:widgets-to-website-builder-module-widgets:repository-generate`.
Deploy with the matching `repository-migrate` target, then generate and deploy
provider consistency capture before publishing saved links. The normal generation
commands are also stored in `libs/modules/blog/project.json`. Do not create
links through data snapshots.
