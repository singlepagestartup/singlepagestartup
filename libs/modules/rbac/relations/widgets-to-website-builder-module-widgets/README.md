# RBAC Widgets to Website Builder Widgets

Connects an exact RBAC Widget to an exact Website Builder Widget. The RBAC
Widget owns the principal, queries, forms and operations. Website Builder owns
layout, copy and imagery and receives the functional content through children.

Fields: UUID `id`, timestamps, `widgetId`, `websiteBuilderModuleWidgetId`,
`variant`, `orderIndex`, `className`. Both references cascade on deletion; an
owner/target pair is unique. Multiple ordered links are supported. A Widget
whose composition needs one frame validates that requirement in its own view.

The standard `find` renderer filters by the owning `widgetId`. The `default`
renderer loads the exact `websiteBuilderModuleWidgetId`, uses its saved variant
with `dataSource="props"`, and forwards locale and rendered children. Shared
readers retain SDK/Provider/cache ownership. Relations contain no authentication,
registration, project or support modes and choose no business forms or copy.
Other standard variants expose admin and admin-v2 editing.

RBAC Widget's admin-v2 form has a Website Builder relation tab. The API is
`/api/rbac/widgets-to-website-builder-module-widgets`; generic MCP content tools
discover the SDK. Host page-preview includes this nested content edge. Public
configuration GET permissions are distinct from privileged writes; a widgetId
filter alone is not authorization.

Generate schema migrations with
`npx nx run @sps/rbac:relations:widgets-to-website-builder-module-widgets:repository-generate`
and deploy using the matching `repository-migrate` target. The generated index
removal preserves records. Use `tools/runtime/ai-chat-widget-links.ts` to move
existing links to default and fork shared authentication frames into independent
registration/recovery presentations. The command preserves source content,
relation IDs, ordering and linked media. See `tools/runtime/README.md` for
manifest preparation, readback, repeat and rollback. Do not edit seed snapshots.
