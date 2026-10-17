# RBAC Widgets to Website Builder Widgets

Connects an exact RBAC Widget to an exact Website Builder Widget. The RBAC
Widget owns authentication, account and project behavior; Website Builder owns
its content presentation. Runtime readers filter `widgetId` and then load the
linked `websiteBuilderModuleWidgetId`. A variant selects rendering, never a
replacement record by global variant or slug.

Fields: UUID `id`, timestamps, `widgetId`, `websiteBuilderModuleWidgetId`,
`variant`, `orderIndex`, `className`. Both references cascade on deletion; an
owner/target pair is unique. The `ai-chat-content` slot permits one link per
RBAC Widget, enforced by a partial unique index. Other ordered default links
remain available.

The registered `ai-chat-content` renderer accepts a typed mode:
`project-create`, `authentication`, `registration` or `help`, plus a rendered
children slot and locale. It validates the linked Website Builder variant.
Missing or mismatched configuration renders an error; it never discovers a
replacement from another Widget. Shared readers own SDK/Provider/cache; loaded
record composition uses `dataSource="props"` within its existing query owner.
Factory SDK topics cover relation and content changes through the existing
React Query/WebSocket pipeline.

Standard `find`, `default`, admin and admin-v2 variants expose the relation.
RBAC Widget's admin-v2 form has separate relation tabs. The API is
`/api/rbac/widgets-to-website-builder-module-widgets`; generic MCP content tools
discover the SDK. Host graph preview includes the nested content and the
owner/relation path. Public configuration GET permissions are distinct from
privileged writes; `widgetId` filtering alone is not an authorization policy.

Generate migrations with
`npx nx run @sps/rbac:relations:widgets-to-website-builder-module-widgets:repository-generate`.
Use the matching `repository-migrate` target for deployment. Runtime data
transfer uses the manifest command in `tools/runtime/README.md`; repository
snapshots are not the migration source.
