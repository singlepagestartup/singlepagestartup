# RBAC Widgets to Ecommerce Widgets

Links an exact RBAC Widget to an exact Ecommerce Widget. RBAC owns current-Subject
purchase actions. Ecommerce owns the saved Product selection and commerce models;
Website Builder owns the separate presentation frame.

Fields are UUID `id`, timestamps, `widgetId`, `ecommerceModuleWidgetId`,
`variant`, `orderIndex` and `className`. Both references cascade on deletion.
An owner/target pair is unique; the relation supports multiple ordered links.
The curated catalog composition requires exactly one default owner link and
reports missing or ambiguous configuration as unavailable.

Standard CRUD API, client/server/model SDKs, `find`, `default`, admin and admin-v2
variants are registered. The route is
`/api/rbac/widgets-to-ecommerce-module-widgets`. RBAC Widget editors expose the
relation; generic MCP content-management tools discover its SDK entries.
Public configuration GET permissions remain separate from privileged writes.
A `widgetId` filter does not authorize a write.

The generic `default` renderer loads the exact `ecommerceModuleWidgetId`, renders
its saved variant with `dataSource="props"`, and forwards locale and rendered
children. It selects no business screen or current Subject.

The RBAC `subject-me-ecommerce-module-product-list-default` Widget reads its own
relation with `variant="find"` and a `widgetId` filter under
`apiProps.params.filters.and`. It reads only the target Ecommerce Widget's
ordered `widgets-to-products` membership, then those exact Products. Empty
membership remains empty; invalid configuration never falls back to all
Products. Product rows keep their RBAC Subject cart and checkout actions.

Generate schema migrations with
`npx nx run @sps/rbac:relations:widgets-to-ecommerce-module-widgets:repository-generate`
and deploy with the matching `repository-migrate` target. Both leaf targets are
included in the module's relation aggregates. Deploy the generated provider
consistency capture as well as the table migration.

Saved links are managed through the SDK publication flow in
`tools/runtime/platform-example-content.ts`. See `tools/runtime/README.md` for
prepare, readback, repeat, protected observations and rollback. Preserve paid
Order/Invoice references and the internal Free Product; do not edit data
snapshots to configure the public catalog.
