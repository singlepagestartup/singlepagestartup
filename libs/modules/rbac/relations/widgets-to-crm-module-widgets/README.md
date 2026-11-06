# RBAC Widgets to CRM Widgets

Links an exact RBAC Widget to an exact CRM Widget. RBAC owns the authenticated
operation; CRM owns Form, ordered Steps, Inputs and Options. Help follows
`rbac.widget → widgets-to-crm-module-widgets → crm.widget → widgets-to-forms → crm.form`.
The Subject receives the selected `crmModuleFormId`; no global Form slug lookup
is required.

Fields: UUID `id`, timestamps, `widgetId`, `crmModuleWidgetId`, `variant`,
`orderIndex`, `className`. Both references cascade and each owner/target pair
is unique. The generic relation supports multiple ordered links; AI Chat Help
requires exactly one CRM Widget with exactly one linked Form and reports
invalid configuration explicitly.

Standard API/SDK, `find`/`default`, admin and admin-v2 variants are registered.
The RBAC Widget admin-v2 editor exposes a CRM Widgets tab. Generic MCP content
tools discover the relation through its SDK entries. Collection and detail GET
configuration permissions are separate from privileged writes. Mutations and
readers use the shared Query cache and realtime subscription pipeline.

Generate with
`npx nx run @sps/rbac:relations:widgets-to-crm-module-widgets:repository-generate`
and deploy using the corresponding `repository-migrate` target. See
`tools/runtime/README.md` for the explicit, resumable data cutover and rollback.
