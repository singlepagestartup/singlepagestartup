---
date: 2026-06-13T00:22:05+03:00
researcher: flakecode
git_commit: 93fcafc4c767f0cf7c72b703e851ab673c0bee5b
branch: issue-195
repository: singlepagestartup
topic: "feat: add universal admin visual editor overlay for frontend components"
tags: [research, codebase, admin-v2, website-builder, widget, visual-editor, shadcn]
status: complete
last_updated: 2026-06-13
last_updated_by: flakecode
---

# Research: feat: add universal admin visual editor overlay for frontend components

**Date**: 2026-06-13T00:22:05+03:00
**Researcher**: flakecode
**Git Commit**: 93fcafc4c767f0cf7c72b703e851ab673c0bee5b
**Branch**: issue-195
**Repository**: singlepagestartup

## Research Question

Document how current code handles:

- admin role authentication gating in `apps/host` for `admin` and `admin-v2`;
- shared `admin-v2` frontend components for table, form, sidebar-item, and card;
- module wrappers that pass model metadata plus `Provider` / `clientApi` / `serverApi`;
- Website Builder widget public rendering plus current `admin-v2` create/edit/delete flows;
- current `shadcn` `Sheet` / `Dialog` availability.

## Summary

The catch-all host page routes any `/admin...` URL directly to `AdminV2`, while non-admin URLs render the resolved Host page plus the legacy `Admin` component (`apps/host/app/[[...url]]/page.tsx:56`, `apps/host/app/[[...url]]/page.tsx:74`). Both `admin` and `admin-v2` use the same client-side RBAC gate pattern: read the authenticated subject, find the `admin` role, then query `subjects-to-roles` for a matching `(subjectId, roleId)` pair before rendering protected UI (`apps/host/src/components/admin/ClientComponent.tsx:10`, `apps/host/src/components/admin-v2/ClientComponent.tsx:10`).

The shared `admin-v2` layer in `libs/shared/frontend/components/src/lib/singlepage/admin-v2` is split into framework wrappers and child renderers. Model/relation wrappers pass `Provider`, `clientApi`, `serverApi`, semantic metadata such as `module`/`name`, and sometimes `apiRoute`, `href`, or `searchableFields` into shared card/table/form/sidebar/table-row primitives (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/card/index.tsx:14`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/table/index.tsx:13`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/index.tsx:12`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/sidebar-item/index.tsx:12`).

Website Builder widgets are rendered on public pages through the Host page composition chain: page -> `pages-to-widgets` -> host widget -> `widgets-to-external-widgets` -> website-builder widget -> widget variant component (`libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:51`, `libs/modules/host/relations/pages-to-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:18`, `libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:18`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/website-builder/Component.tsx:7`). The current widget `admin-v2` flow is table-driven: the shared table controller opens create forms in a `Sheet`, each row opens edit forms in a `Sheet`, preview in a `Dialog`, and delete confirmation in an `AlertDialog` (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-controller/ClientComponent.tsx:188`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-row/ClientComponent.tsx:149`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-row/ClientComponent.tsx:183`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-row/ClientComponent.tsx:309`).

The current code already writes component identity into DOM attributes at several public and admin layers, including `data-module`, `data-model`, `data-relation`, `data-id`, and `data-variant` on Host and Website Builder wrappers (`libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:8`, `libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:7`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:11`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-row/ClientComponent.tsx:83`). The codebase does not currently expose a shared in-page visual-editor wrapper that draws an admin-only outline around arbitrary public components and opens model edit/delete surfaces from that outline; the closest existing public-page surface is the legacy `Admin` dashboard mounted next to public content, while the closest shared edit/delete controls live inside `admin-v2` tables and rows (`apps/host/app/[[...url]]/page.tsx:74`, `apps/host/src/components/admin/assets/Dashboard.tsx:37`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-row/ClientComponent.tsx:182`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-row/ClientComponent.tsx:309`).

## Detailed Findings

### 1. Host admin and admin-v2 authentication gating

The host catch-all page resolves `slashedUrl` from the route params. If that path starts with `/admin`, it renders `AdminV2`; otherwise it renders the Host page content and also mounts the legacy `Admin` component alongside the page body (`apps/host/app/[[...url]]/page.tsx:53`, `apps/host/app/[[...url]]/page.tsx:56`, `apps/host/app/[[...url]]/page.tsx:60`, `apps/host/app/[[...url]]/page.tsx:74`).

The legacy `Admin` path goes through `index.tsx` -> `Server` -> `Component` -> `ClientComponent`, with `Component` returning only the client guard (`apps/host/src/components/admin/index.tsx:4`, `apps/host/src/components/admin/server.tsx:9`, `apps/host/src/components/admin/Component.tsx:4`). The `admin-v2` path goes through `index.tsx`, where `ClientComponent` wraps the actual admin UI as `children` (`apps/host/src/components/admin-v2/index.tsx:5`).

Both client guards are structurally the same:

- `RbacSubject` with `variant="authentication-me-default"` reads the current authenticated subject and returns nothing if `me` is absent (`apps/host/src/components/admin/ClientComponent.tsx:10`, `apps/host/src/components/admin-v2/ClientComponent.tsx:10`).
- `RbacRole` with `variant="find"` loads roles and finds the row whose `slug` is `admin` (`apps/host/src/components/admin/ClientComponent.tsx:17`, `apps/host/src/components/admin/ClientComponent.tsx:19`, `apps/host/src/components/admin-v2/ClientComponent.tsx:17`, `apps/host/src/components/admin-v2/ClientComponent.tsx:19`).
- `RbacSubjectsToRoles` with `variant="find"` queries the junction relation with `apiProps.params.filters.and` for `subjectId = me.id` and `roleId = adminRole.id` (`apps/host/src/components/admin/ClientComponent.tsx:28`, `apps/host/src/components/admin/ClientComponent.tsx:31`, `apps/host/src/components/admin-v2/ClientComponent.tsx:28`, `apps/host/src/components/admin-v2/ClientComponent.tsx:31`).
- The legacy `admin` guard renders `<Dashboard isServer={false} />` when the relation exists (`apps/host/src/components/admin/ClientComponent.tsx:55`); the `admin-v2` guard renders `props.children` (`apps/host/src/components/admin-v2/ClientComponent.tsx:55`).

`AdminV2` itself is a full-page shell with module sidebar items and module overviews rendered together, all driven by the current `url` prop (`apps/host/src/components/admin-v2/Component.tsx:84`, `apps/host/src/components/admin-v2/Component.tsx:85`, `apps/host/src/components/admin-v2/Component.tsx:178`, `apps/host/src/components/admin-v2/Component.tsx:202`).

### 2. Shared admin-v2 frontend components

#### Table

The shared table framework wrapper chooses a client or server loader from `props.isServer`, selects `serverApi` or `clientApi`, wraps the tree in `ErrorBoundary`, `Suspense`, the passed `Provider`, and `TableController`, then renders the chosen loader with `api` injected (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/index.tsx:29`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/index.tsx:32`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/index.tsx:37`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/index.tsx:40`).

On the client side, the table reads shared state from `TableContext`, derives query params from search/pagination plus incoming `apiProps`, calls `api.count()` and `api.find()` with `Cache-Control: no-store`, updates `total`, `visibleRowIds`, and `selectedRowIds` in context, and renders bulk-selection / bulk-delete UI above the child renderer (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/client.tsx:47`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/client.tsx:62`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/client.tsx:135`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/client.tsx:145`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/client.tsx:161`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/client.tsx:171`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/client.tsx:233`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/client.tsx:324`).

The table controller owns local search, debounced search, selected field, pagination offset/limit, total count, visible/selected rows, and the create-form sheet (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-controller/Context.tsx:6`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-controller/ClientComponent.tsx:42`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-controller/ClientComponent.tsx:63`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-controller/ClientComponent.tsx:188`).

#### Form

The shared form framework wrapper mirrors the table wrapper: it chooses client or server hydration, injects `api`, and wraps the form in `ErrorBoundary`, `Suspense`, and the passed `Provider` (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/form/index.tsx:31`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/form/index.tsx:34`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/form/index.tsx:39`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/form/index.tsx:42`).

If `data.id` exists, the shared client/server loaders hydrate the full entity with `findById`; otherwise they pass through the create payload unchanged (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/form/client.tsx:24`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/form/client.tsx:34`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/form/server.tsx:22`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/form/server.tsx:37`).

The shared visual form renderer sets semantic `data-module`, `data-model` / `data-relation`, derives the header title from `props.id` and `props.name`, wraps `props.children` in `Form` when `props.form` is present, and renders a footer save button whose label and color depend on `props.status` and whether the form is in create or update mode (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:19`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:24`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:32`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:40`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:49`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:56`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:61`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:75`).

#### Sidebar item

The shared sidebar-item wrapper injects `api`, `Provider`, and either client or server loader, although the actual child renderer is a link button built only from semantic props and `isActive` (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/sidebar-item/index.tsx:13`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/sidebar-item/client.tsx:20`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/sidebar-item/server.tsx:21`).

The child renderer builds a link to `${ADMIN_BASE_PATH}/${props.module}/${props.name}`, writes `data-module` plus `data-model` / `data-relation`, and changes button styling and the leading dot indicator based on `props.isActive` (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/sidebar-item/Component.tsx:11`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/sidebar-item/Component.tsx:15`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/sidebar-item/Component.tsx:24`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/sidebar-item/Component.tsx:31`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/sidebar-item/Component.tsx:38`).

#### Card

The shared card wrapper injects `api`, `Provider`, and either a client or server count loader (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/index.tsx:13`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/client.tsx:20`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/server.tsx:19`).

Both loaders call `api.count()` with incoming `apiProps` and `Cache-Control: no-store`, then pass `count`, `module`, `name`, `type`, `apiRoute`, and `href` into the card child renderer (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/client.tsx:21`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/client.tsx:32`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/server.tsx:20`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/server.tsx:31`).

The child renderer displays the model/relation name, a badge with the count, the configured API route, and an "Open model" link button when `href` is present (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/Component.tsx:9`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/Component.tsx:17`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/Component.tsx:22`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/Component.tsx:29`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/Component.tsx:35`).

### 3. Component metadata and current in-page editor gap

Public components already expose identity metadata that a visual editor can read without parsing text content. Host page, page-to-widget relation, host widget, external-widget relation, and Website Builder widget wrappers all render semantic `data-*` attributes around their visible output (`libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:8`, `libs/modules/host/relations/pages-to-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:7`, `libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:7`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:17`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:11`).

Shared admin-v2 rows and forms also write the same metadata family while owning the current edit/delete surfaces (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-row/ClientComponent.tsx:83`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:24`). This means metadata and CRUD UI exist today, but they are not connected by a public-page overlay component.

The existing public-page `Admin` component is mounted before public Host page content on non-admin routes and renders a floating dashboard launcher (`apps/host/app/[[...url]]/page.tsx:74`, `apps/host/src/components/admin/assets/Dashboard.tsx:37`). That legacy dashboard is a global admin entry point, not a wrapper around each rendered component. The current shared `singlepage/default` and `singlepage/find` wrappers load data and pass it to child components, but they do not draw admin outlines or own admin modal/sheet state (`libs/shared/frontend/components/src/lib/singlepage/default/index.tsx:14`, `libs/shared/frontend/components/src/lib/singlepage/find/client.tsx:14`).

### 4. Module wrapper pattern for model metadata and APIs

The current wrapper pattern is model-local and variant-specific:

- `find` variants pass `Provider`, `clientApi`, and `serverApi` into the shared `singlepage/find` wrapper (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/find/index.tsx:11`).
- `default` / `content-default` / `footer-default` variants pass the same API objects plus a child component into the shared `singlepage/default` wrapper (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/default/index.tsx:12`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/content-default/index.tsx:12`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/footer-default/index.tsx:12`).
- `admin-v2-sidebar-item` adds `module="website-builder"` and `name="widget"` to the shared sidebar-item wrapper (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/sidebar-item/index.tsx:17`).
- `admin-v2-card` adds `module`, `name`, `apiRoute`, and default `href` to the shared card wrapper (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/card/index.tsx:19`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/card/index.tsx:22`).
- `admin-v2-table` adds `module`, `name`, and `searchableFields={Object.keys(insertSchema.shape)}` to the shared table wrapper (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/table/index.tsx:13`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/table/index.tsx:16`).
- `admin-v2-form` passes the same Provider/client/server API trio into the shared form wrapper (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/index.tsx:12`).

This same pattern is used at the Website Builder module overview layer. The overview components are variant dispatchers, and the route-gated table wrappers only wire active overview routes to model-level `admin-v2-table` and overview-level `admin-v2-form` components (`libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/variants.ts:1`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-table/ClientComponent.tsx:19`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:19`).

### 5. Website Builder widget public rendering path

The public route path begins in the host catch-all page, which resolves a Host page by URL with `variant="find-by-url"` and then renders the matched Host page variant (`apps/host/app/[[...url]]/page.tsx:61`, `apps/host/app/[[...url]]/page.tsx:75`).

The Host page default component loads `pages-to-layouts` for the page, and within the layout render-prop it loads `pages-to-widgets` filtered by `pageId = props.data.id` (`libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:19`, `libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:51`).

Each `pages-to-widgets` row resolves the Host widget whose `id` matches `widgetId`, then renders the Host widget variant with the current `url` and `language` (`libs/modules/host/relations/pages-to-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:18`, `libs/modules/host/relations/pages-to-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:38`).

Each Host widget loads `widgets-to-external-widgets` filtered by its own `widgetId`, then renders each relation row by variant with `url` and `language` forwarded (`libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:18`, `libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:38`).

The Host external-widget relation component branches by `externalModule`; when that value is `website-builder`, it renders the Website Builder branch component (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:68`).

The Website Builder branch loads the Website Builder widget whose `id` equals `externalWidgetId`, then renders that widget twice:

- first as `variant="find"` to load the Website Builder model row;
- then as `variant={entity.variant}` to render the actual Website Builder variant;
- with a `children` payload supplied by the host-side Website Builder widget wrapper (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/website-builder/Component.tsx:7`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/website-builder/Component.tsx:27`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/website-builder/Component.tsx:34`).

The Website Builder widget model exposes these singlepage variants today: `find`, old admin variants, `admin-v2-*`, `default`, `content-default`, `footer-default`, and `navbar-default` (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/variants.ts:16`). The SDK model exports the allowed public widget variant strings as `["default", "content-default", "footer-default", "navbar-default"]` (`libs/modules/website-builder/models/widget/sdk/model/src/lib/index.ts:23`).

The current public widget variants render as follows:

- `default` renders title, subtitle, TipTap description, `widgets-to-buttons-arrays`, `widgets-to-file-storage-module-files`, `widgets-to-sliders`, and `widgets-to-features`, all filtered by `widgetId = props.data.id`; it also renders `props.children` between buttons and attached files (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:22`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:37`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:69`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:71`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:104`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:137`).
- `content-default` renders the same core widget fields and relation lookups, plus a `ClientComponent` counter button at the top (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/content-default/Component.tsx:24`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/content-default/ClientComponent.tsx:5`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/content-default/Component.tsx:39`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/content-default/Component.tsx:71`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/content-default/Component.tsx:106`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/content-default/Component.tsx:139`).
- `footer-default` renders logotypes and button arrays grouped by relation `variant` values `additional`, `default`, and `extra` (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/footer-default/Component.tsx:22`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/footer-default/Component.tsx:58`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/footer-default/Component.tsx:96`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/footer-default/Component.tsx:144`).
- `navbar-default` hydrates the widget by id, builds `logotype` and `content` props from local asset components, and renders them through a client component that controls mobile open/close state (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/navbar-default/server.tsx:15`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/navbar-default/server.tsx:24`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/navbar-default/server.tsx:32`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/navbar-default/ClientComponent.tsx:7`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/navbar-default/assets/logotype/index.tsx:7`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/navbar-default/assets/content/index.tsx:8`).

On the Host side, the injected child wrapper for Website Builder widgets only defines a `navbar-default` variant. That host-side `navbar-default` child renders `RbacSubject` with `variant="me-ecommerce-module-cart-default"` (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/website-builder/widget/singlepage/variants.ts:1`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/website-builder/widget/singlepage/navbar-default/Component.tsx:1`).

### 6. Website Builder widget admin-v2 create/edit/delete flows

The Website Builder module overview becomes active only when `isAdminRoute(props.url, "website-builder")` is true, and its card grid is shown only on the exact `/website-builder` overview route. It still renders all per-model table wrappers, including `Widget`, on module routes (`libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/Component.tsx:15`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/Component.tsx:16`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/Component.tsx:25`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/Component.tsx:67`).

The Website Builder sidebar module item uses the same route helper and expands its child model links only when the current route belongs to the module (`libs/modules/website-builder/frontend/component/src/lib/admin-v2/sidebar-module-item/Component.tsx:16`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/sidebar-module-item/Component.tsx:56`). The widget child item sets `isActive` with `isAdminRoute(props.url, "website-builder", "widget")` and delegates to the widget model's `admin-v2-sidebar-item` variant (`libs/modules/website-builder/frontend/component/src/lib/admin-v2/sidebar-module-item/widget/Component.tsx:5`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/sidebar-module-item/widget/Component.tsx:8`).

The module-level widget table wrapper is route-gated with `isAdminRoute(props.url, "website-builder", "widget")`. When active, it renders a heading and delegates to the widget model's `admin-v2-table` variant, supplying `adminForm` that returns the overview-level widget `admin-v2-form` (`libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-table/ClientComponent.tsx:9`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-table/ClientComponent.tsx:19`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-table/ClientComponent.tsx:22`).

The widget model's `admin-v2-table` wrapper passes `module="website-builder"`, `name="widget"`, `searchableFields={Object.keys(insertSchema.shape)}`, and the widget Provider/client/server APIs into the shared table wrapper (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/table/index.tsx:13`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/table/index.tsx:16`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/table/index.tsx:18`).

Its table child maps loaded rows into widget `admin-v2-table-row` components, forwarding `adminForm` from the shared controller so the row-level edit sheet can reuse the same form callback (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/table/Component.tsx:8`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/table/Component.tsx:10`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/table/Component.tsx:16`).

The shared table controller opens the create flow in a right-side `Sheet` when `props.adminForm` exists. It calls `props.adminForm({ isServer: false })` inside `SheetContent` (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-controller/ClientComponent.tsx:188`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-controller/ClientComponent.tsx:199`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-controller/ClientComponent.tsx:207`).

The shared row component opens:

- preview in a `Dialog` for non-relation rows (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-row/ClientComponent.tsx:148`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-row/ClientComponent.tsx:160`);
- edit in a `Sheet` when `props.adminForm` exists (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-row/ClientComponent.tsx:182`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-row/ClientComponent.tsx:196`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-row/ClientComponent.tsx:204`);
- left/right related model forms in their own `Sheet`s when relation callbacks exist (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-row/ClientComponent.tsx:212`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-row/ClientComponent.tsx:247`);
- delete confirmation in an `AlertDialog` that calls `props.onDelete` from the row wrapper (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-row/ClientComponent.tsx:309`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-row/ClientComponent.tsx:329`).

The widget row wrapper binds delete to the widget SDK client mutation. `onDelete` checks `props.data.id` and then calls `deleteEntity.mutate({ id: props.data.id })` (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/table-row/Component.tsx:8`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/table-row/Component.tsx:13`).

The overview-level widget form wrapper injects five relation render callbacks into the widget model form: `widgetsToButtonsArrays`, `widgetsToFeatures`, `widgetsToFileStorageModuleFiles`, `widgetsToLogotypes`, and `widgetsToSliders` (`libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:23`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:76`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:129`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:182`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:235`).

Each relation callback:

- returns nothing if the current widget data is absent (`libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:24`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:77`);
- renders the relation model as `variant="admin-v2-table"` filtered by `widgetId = data.id` (`libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:29`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:60`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:82`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:113`);
- configures `leftModelAdminForm` to reopen the owning widget form by `widgetId`, and `rightModelAdminForm` to open the related model form by the relation's foreign key (`libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:34`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:47`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:87`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:100`).

The widget model form itself owns field rendering and mutation wiring. It:

- creates `updateEntity = api.update()` and `createEntity = api.create()` (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:27`);
- derives `status` through `useGetAdminFormState({ updateEntity, createEntity })` (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:30`);
- initializes `useForm` with `insertSchema`, populating defaults from `props.data` or `randomWordsGenerator(...)` for `slug` and `adminTitle` (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:35`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:41`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:45`);
- updates when `props.data.id` exists and creates otherwise (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:50`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:56`);
- computes relation section metadata from the injected callbacks and exposes `Details` / `Relations` tabs plus nested relation tabs (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:61`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:105`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:138`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:257`);
- renders fields for `adminTitle`, localized `title`, localized `subtitle`, localized `description`, `slug`, `anchor`, `className`, and `variant` (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:168`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:176`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:191`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:206`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:221`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:229`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:237`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:245`).

### 7. shadcn Sheet/Dialog availability

The shared shadcn package exports `Dialog`, `AlertDialog`, and `Sheet` from its package root (`libs/shared/ui/shadcn/src/index.ts:6`, `libs/shared/ui/shadcn/src/index.ts:13`, `libs/shared/ui/shadcn/src/index.ts:32`).

`Dialog` is implemented in `libs/shared/ui/shadcn/src/lib/dialog/index.tsx` on top of `@radix-ui/react-dialog`, with exported `Dialog`, `DialogTrigger`, `DialogContent`, `DialogTitle`, and `DialogDescription` (`libs/shared/ui/shadcn/src/lib/dialog/index.tsx:4`, `libs/shared/ui/shadcn/src/lib/dialog/index.tsx:8`, `libs/shared/ui/shadcn/src/lib/dialog/index.tsx:31`, `libs/shared/ui/shadcn/src/lib/dialog/index.tsx:87`, `libs/shared/ui/shadcn/src/lib/dialog/index.tsx:102`, `libs/shared/ui/shadcn/src/lib/dialog/index.tsx:114`).

`Sheet` is also implemented on top of Radix dialog primitives, with exported `Sheet`, `SheetTrigger`, `SheetContent`, `SheetTitle`, and `SheetDescription`, and side-specific variants defined by `sheetVariants` (`libs/shared/ui/shadcn/src/lib/sheet/index.tsx:4`, `libs/shared/ui/shadcn/src/lib/sheet/index.tsx:9`, `libs/shared/ui/shadcn/src/lib/sheet/index.tsx:32`, `libs/shared/ui/shadcn/src/lib/sheet/index.tsx:55`, `libs/shared/ui/shadcn/src/lib/sheet/index.tsx:104`, `libs/shared/ui/shadcn/src/lib/sheet/index.tsx:116`, `libs/shared/ui/shadcn/src/lib/sheet/index.tsx:128`).

`AlertDialog` is implemented on top of `@radix-ui/react-alert-dialog`, with exported `AlertDialog`, `AlertDialogTrigger`, `AlertDialogContent`, `AlertDialogTitle`, `AlertDialogDescription`, `AlertDialogAction`, and `AlertDialogCancel` (`libs/shared/ui/shadcn/src/lib/alert-dialog/index.tsx:4`, `libs/shared/ui/shadcn/src/lib/alert-dialog/index.tsx:8`, `libs/shared/ui/shadcn/src/lib/alert-dialog/index.tsx:29`, `libs/shared/ui/shadcn/src/lib/alert-dialog/index.tsx:75`, `libs/shared/ui/shadcn/src/lib/alert-dialog/index.tsx:87`, `libs/shared/ui/shadcn/src/lib/alert-dialog/index.tsx:100`, `libs/shared/ui/shadcn/src/lib/alert-dialog/index.tsx:112`, `libs/shared/ui/shadcn/src/lib/alert-dialog/index.tsx:128`).

The host app depends on the corresponding Radix packages in `apps/host/package.json`, including `@radix-ui/react-dialog` and `@radix-ui/react-alert-dialog` (`apps/host/package.json:19`, `apps/host/package.json:22`).

### 8. MCP content-management context

The current MCP content-management layer is relevant background for visual editing because it documents the same Host content graph and localized-field mutation semantics from an agent/tooling perspective. It registers content-management resources and tools from `apps/mcp/actions.ts`, including entity discovery, host graph preview, localized field update, and host-graph localized field update (`apps/mcp/actions.ts:63`, `apps/mcp/actions.ts:64`, `apps/mcp/content-management.ts:48`, `apps/mcp/content-management.ts:74`, `apps/mcp/content-management.ts:269`, `apps/mcp/content-management.ts:287`, `apps/mcp/content-management.ts:309`).

The content-management registry currently covers `host.page`, `host.widget`, `host.pages-to-widgets`, `host.widgets-to-external-widgets`, and `blog.widget`, with localized fields declared for `host.widget` and `blog.widget` (`apps/mcp/lib/content-management/registry.ts:80`, `apps/mcp/lib/content-management/registry.ts:106`, `apps/mcp/lib/content-management/registry.ts:143`, `apps/mcp/lib/content-management/registry.ts:176`). README guidance instructs content edits to resolve the host graph first and to use dry-run writes plus localized-field helpers for locale-keyed JSON fields (`README.md:110`, `README.md:112`, `README.md:206`).

## Code References

- `apps/host/app/[[...url]]/page.tsx:56` - `/admin...` routes render `AdminV2`.
- `apps/host/app/[[...url]]/page.tsx:74` - non-admin routes still mount legacy `Admin`.
- `apps/host/src/components/admin/ClientComponent.tsx:10` - legacy RBAC auth gate starts with `RbacSubject`.
- `apps/host/src/components/admin-v2/ClientComponent.tsx:10` - `admin-v2` RBAC auth gate starts with `RbacSubject`.
- `apps/host/src/components/admin-v2/Component.tsx:85` - host admin-v2 sidebar composition begins with `PanelComponent`.
- `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/index.tsx:40` - shared table wraps child content in `TableController`.
- `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/client.tsx:145` - shared table loads visible rows with `api.find`.
- `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-controller/ClientComponent.tsx:188` - create flow opens in `Sheet`.
- `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-row/ClientComponent.tsx:149` - preview flow opens in `Dialog`.
- `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-row/ClientComponent.tsx:183` - edit flow opens in `Sheet`.
- `libs/shared/frontend/components/src/lib/singlepage/admin-v2/table-row/ClientComponent.tsx:309` - delete flow opens in `AlertDialog`.
- `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/table/index.tsx:13` - widget model `admin-v2-table` binds shared table to widget SDK APIs.
- `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/table-row/Component.tsx:8` - widget row delete uses `api.delete`.
- `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:50` - widget form `onSubmit` switches between update and create.
- `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:23` - widget overview form injects relation tables into the widget form.
- `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/website-builder/Component.tsx:7` - host Website Builder branch resolves the external Website Builder widget by `externalWidgetId`.
- `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:37` - widget `default` variant renders attached button arrays.
- `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/footer-default/Component.tsx:58` - widget `footer-default` variant renders grouped button arrays by relation variant.
- `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/navbar-default/server.tsx:24` - widget `navbar-default` builds `logotype` and `content` props before rendering.
- `libs/shared/ui/shadcn/src/index.ts:32` - shadcn package exports `Sheet`.
- `libs/shared/ui/shadcn/src/lib/dialog/index.tsx:114` - dialog primitives are exported from the shadcn package.
- `libs/shared/ui/shadcn/src/lib/sheet/index.tsx:128` - sheet primitives are exported from the shadcn package.
- `libs/shared/ui/shadcn/src/lib/alert-dialog/index.tsx:128` - alert-dialog primitives are exported from the shadcn package.
- `apps/host/src/components/admin/assets/Dashboard.tsx:37` - legacy public-page admin launcher is a global dashboard surface, not a component wrapper.
- `libs/shared/frontend/components/src/lib/singlepage/default/index.tsx:14` - shared default wrapper handles provider/API wiring without visual-editor outline behavior.
- `apps/mcp/content-management.ts:269` - MCP content-management host graph preview resolves page widgets and external widget candidates.
- `apps/mcp/content-management.ts:309` - MCP host-graph localized field update resolves a host URL before applying locale-safe changes.

## Architecture Documentation

The current admin-v2 architecture is layered:

1. The host shell always renders module sidebar items and module overview components, leaving route-specific visibility to module-level client wrappers (`apps/host/src/components/admin-v2/Component.tsx:84`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/Component.tsx:18`).
2. Module-level overview wrappers handle route activation and form wiring only (`libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-table/ClientComponent.tsx:9`, `libs/modules/website-builder/frontend/component/src/lib/admin-v2/overview/widget/admin-v2-form/ClientComponent.tsx:17`).
3. Model-level `singlepage/admin-v2/*` variants bind shared admin-v2 primitives to the model SDK provider and APIs (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/table/index.tsx:13`, `libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/index.tsx:12`).
4. Shared admin-v2 primitives own generic list, row, form, sidebar, card, and overlay behavior (`libs/shared/frontend/components/src/lib/singlepage/admin-v2/table/index.tsx:29`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/form/index.tsx:31`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/sidebar-item/index.tsx:13`, `libs/shared/frontend/components/src/lib/singlepage/admin-v2/card/index.tsx:13`).
5. Public Website Builder rendering is reached through Host module composition rather than direct page routing to Website Builder (`libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:19`, `libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/website-builder/Component.tsx:7`).
6. Public component identity metadata exists in DOM attributes, but the current shared wrappers do not expose an admin-only visual outline/edit/delete surface for arbitrary rendered components (`libs/shared/frontend/components/src/lib/singlepage/default/index.tsx:14`, `libs/shared/frontend/components/src/lib/singlepage/find/client.tsx:14`).

## Historical Context (from thoughts/)

The admin-v2 rollout playbook in `thoughts/shared/research/singlepagestartup/ISSUE-145-admin-v2-playbook.md` documents the same current responsibility split that appears in the live widget code: overview `admin-v2-table` handles route gating, overview `admin-v2-form` wires relations, and model-level `singlepage/admin-v2/form/ClientComponent.tsx` owns `Details` / `Relations` tabs plus nested relation sections (`thoughts/shared/research/singlepagestartup/ISSUE-145-admin-v2-playbook.md`).

Prior research for issue 146 documents the same RBAC gate structure for `admin-v2` as the live code still shows today in `apps/host/src/components/admin-v2/ClientComponent.tsx` (`thoughts/shared/research/singlepagestartup/ISSUE-146.md`).

Prior research for issue 161 documents the same Website Builder overview delegation pattern that is still present for the widget route: the module overview renders all per-model table wrappers, and each route-gated wrapper delegates to model-level `admin-v2` variants (`thoughts/shared/research/singlepagestartup/ISSUE-161.md`).

Prior research and PR notes for issue 187 document the Host graph traversal and content-management path that now exists for agent-side content operations: `host.page` -> `host.pages-to-widgets` -> `host.widget` -> `host.widgets-to-external-widgets` -> external widget candidates, with localized updates preserving sibling locales (`thoughts/shared/research/singlepagestartup/ISSUE-187.md`, `thoughts/shared/prs/188_description.md`).

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-145-admin-v2-playbook.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-146.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-161.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-187.md`
- `thoughts/shared/prs/188_description.md`

## Open Questions

- Whether the in-page editor controls are always visible to authenticated admins or gated by an explicit visual-edit mode toggle.
- Which nested wrapper level owns the visible outline when Host page, Host widget, external-widget relation, and source-module widget wrappers overlap on the same rendered content.
- Whether content-only edits should reuse model-specific `admin-v2-form` callbacks directly in the browser or route through a host-graph/content-management abstraction for page-context edits.
