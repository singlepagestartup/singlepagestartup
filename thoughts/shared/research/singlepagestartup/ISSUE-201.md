---
date: 2026-06-29T22:39:37Z
researcher: flakecode
git_commit: c993dc9b7aa0a2c49363869d4634c9bffc442e28
branch: main
repository: singlepagestartup
topic: "Migrate remaining runnable drafts into the Storybook module catalog"
tags: [research, codebase, drafts, storybook, runnable, modules]
status: complete
last_updated: 2026-06-30
last_updated_by: flakecode
---

# Research: Migrate remaining runnable drafts into the Storybook module catalog

**Date**: 2026-06-29T22:39:37Z
**Researcher**: flakecode
**Git Commit**: c993dc9b7aa0a2c49363869d4634c9bffc442e28
**Branch**: main
**Repository**: singlepagestartup

## Research Question

Document the current `apps/drafts` migration state for issue #201: what remains under `apps/drafts/runnable`, what already exists in the Storybook-backed `apps/drafts/modules` catalog, how the design-system validation expects module/model/relation ownership to be represented, and which production `libs/modules` boundaries are relevant for moving the remaining runnable components.

The issue asks to complete the migration from runnable draft prototypes into the Storybook design-system catalog and verify that model ownership follows `libs/modules/<module>` boundaries. Storybook is intended to be the design-system and mockup surface for singlepage/startup overrides, while runnable remains a standalone prototype area.

## Summary

`apps/drafts` is already documented as a design workspace whose module tree mirrors `libs/modules`: module -> `models` or `relations` -> entity -> layer. Storybook only loads stories from `apps/drafts/modules/**/*.stories.@(ts|tsx|mdx)`, so anything left only under `apps/drafts/runnable` is outside the Storybook catalog (`apps/drafts/README.md:5`, `apps/drafts/README.md:61`, `apps/drafts/.storybook/main.ts:5`).

The current runnable area has four valid manifests. Two of them are React/Vite app trees with substantial duplicated component sets: `singlepage/admin-v2` and `startup/singlepagestartup`. They share the same route shape: site routes for home/blog/services/auth/profile/chat plus admin routes for dashboard, settings, account, module list, model list, and model edit (`apps/drafts/runnable/singlepage/admin-v2/src/app/routes.ts:1`, `apps/drafts/runnable/startup/singlepagestartup/src/app/routes.ts:1`).

The current Storybook-backed catalog has 102 manifest-backed entities: 83 singlepage block manifests, 17 singlepage page manifests, and 2 startup block manifests. Of these, 100 ship a glob-matching `Component.stories.tsx`; the 2 startup-module widget block drafts instead reference `*.draft-story.tsx` files, which the Storybook stories glob does not match, so only 100 stories are actually discoverable in Storybook. The generated Storybook index currently contains 118 entries. `npm run drafts:validate`, `npm run drafts:ds:validate`, and `npm run drafts:storybook:build` all pass on this checkout.

The current `apps/drafts/modules` tree contains model/page/block drafts but no `relations` directories. This is consistent with current content, but the documented folder contract and block schema already allow relation-backed draft blocks through `source.entityType = "relation"` (`apps/drafts/README.md:15`, `apps/drafts/block.schema.json:51`).

Design-system inventory reads production variants from `libs/modules` and maps draft coverage from `apps/drafts/modules`. The checked-in generated inventory currently reports 16 modules, 156 entities, 1836 production variants, and 14 covered variants (`apps/drafts/inventory/modules.generated.json:2`, `tools/drafts/design-system/inventory.ts:51`, `tools/drafts/design-system/inventory.ts:227`).

Block validation enforces source membership against inventory only for `state: "ready"`. Most current draft blocks are `state: "draft"`, so planning cannot rely on validation alone to prove that a draft component is attached to an existing production variant (`tools/drafts/design-system/validate.ts:277`).

## Detailed Findings

### Draft workspace and Storybook boundary

- The draft workspace is explicitly for design-system prototypes and mockups, not backend behavior. Its goals are to isolate prototype UI, mirror visible SPS block surfaces, preview singlepage and startup variants in one Storybook, and keep Figma alignment metadata near implementation (`apps/drafts/README.md:3`, `apps/drafts/README.md:8`).
- The target folder layout is module-first and mirrors `libs/modules`: `apps/drafts/modules/<module>/{models|relations}/<entity>/{singlepage|startup}/<variant>` (`apps/drafts/README.md:15`).
- Storybook discovers only `apps/drafts/modules/**/*.stories.@(ts|tsx|mdx)`. It does not discover `apps/drafts/runnable` stories or components (`apps/drafts/README.md:61`, `apps/drafts/.storybook/main.ts:5`).
- The shared preview imports `runtime/styles.css`, so Storybook entries are expected to render through the drafts runtime styling contract (`apps/drafts/.storybook/preview.ts:1`).
- Guardrails forbid backend code, `apps/api` access, SDK/React Query wiring, and production module edits inside drafts. Drafts use static props and runtime/style tokens (`apps/drafts/README.md:148`).

### Current runnable sources

- Runnable manifest discovery validates `id`, `title`, `type`, `entry`, and `scope`; valid `type` values are `html`, `react`, and `next`, and valid scopes are `singlepage` and `startup` (`tools/drafts/validate-manifests.ts:6`, `tools/drafts/validate-manifests.ts:180`).
- `apps/drafts/runnable/singlepage/admin-v2/manifest.json` is a React runnable with `scope: "singlepage"` and a Vite dev command on `127.0.0.1:5173` (`apps/drafts/runnable/singlepage/admin-v2/manifest.json:1`).
- `apps/drafts/runnable/startup/singlepagestartup/manifest.json` is a React runnable with `scope: "startup"` and a Vite dev command on `127.0.0.1:5173` (`apps/drafts/runnable/startup/singlepagestartup/manifest.json:1`).
- `apps/drafts/runnable/singlepage/admin-panel-redesign-html/manifest.json` and `apps/drafts/runnable/singlepage/examples/basic-html/manifest.json` are HTML runnable drafts (`apps/drafts/runnable/singlepage/admin-panel-redesign-html/manifest.json:1`, `apps/drafts/runnable/singlepage/examples/basic-html/manifest.json:1`).
- The two React runnable route files share the same route composition: `SiteLayout`, `AdminLayout`, site pages, auth pages, profile/chat pages, and admin dashboard/model routes (`apps/drafts/runnable/singlepage/admin-v2/src/app/routes.ts:1`, `apps/drafts/runnable/startup/singlepagestartup/src/app/routes.ts:1`).
- Both React app entrypoints wrap the router in `AuthProvider`, so any migrated Storybook components need static/auth-state-friendly props instead of runnable-only global context assumptions (`apps/drafts/runnable/singlepage/admin-v2/src/app/App.tsx:1`, `apps/drafts/runnable/startup/singlepagestartup/src/app/App.tsx:1`).

### Current Storybook catalog patterns

- The host page draft `singlepage/home-default` is a page-level manifest that composes module blocks from website-builder, ecommerce, and blog under `apps/drafts/modules/host/models/page/...` (`apps/drafts/modules/host/models/page/singlepage/home-default/page.manifest.json:1`, `apps/drafts/modules/host/models/page/singlepage/home-default/Component.tsx:1`).
- Page drafts use `page.manifest.json`, `Component.tsx`, and `Component.stories.tsx`; the default story renders the full page in a fullscreen layout (`apps/drafts/modules/host/models/page/singlepage/home-default/Component.stories.tsx:1`).
- Reusable block drafts use `block.manifest.json`, `Component.tsx`, `Component.stories.tsx`, and Figma metadata in the same folder. The manifest records layer, state, source module/entity/variant, file paths, content slots, and Figma metadata (`apps/drafts/README.md:90`, `apps/drafts/block.schema.json:7`).
- Existing block components expose typed props, static default props, Tailwind classes, and `data-ds-block` / `data-ds-layer` markers (`apps/drafts/modules/website-builder/models/widget/singlepage/content-default/Component.tsx:13`, `apps/drafts/modules/website-builder/models/widget/singlepage/content-default/Component.tsx:75`).
- Startup overrides can import the singlepage component and keep the same public contract while overriding content or presentation (`apps/drafts/modules/website-builder/models/widget/startup/content-default/Component.tsx:1`).
- Current block manifests already point to production module ownership across website-builder, ecommerce, rbac, social, and startup model variants (`apps/drafts/modules/website-builder/models/widget/singlepage/content-default/block.manifest.json:8`, `apps/drafts/modules/ecommerce/models/product/singlepage/card/block.manifest.json:8`, `apps/drafts/modules/rbac/models/identity/singlepage/login-default/block.manifest.json:8`, `apps/drafts/modules/social/models/profile/singlepage/card/block.manifest.json:8`, `apps/drafts/modules/startup/models/widget/startup/default/block.manifest.json:8`).
- Two startup-module widget block drafts (`apps/drafts/modules/startup/models/widget/singlepage/default` and `apps/drafts/modules/startup/models/widget/startup/default`) declare their story as `*.draft-story.tsx` in the manifest `files.story` field. The Storybook stories glob `*.stories.@(ts|tsx|mdx)` does not match that suffix, so these two manifests are not discoverable as Storybook stories, even though `npm run drafts:ds:validate` still passes — validation only checks that the referenced story file exists, not that it matches the Storybook discovery glob (`apps/drafts/modules/startup/models/widget/startup/default/block.manifest.json:16`, `apps/drafts/.storybook/main.ts:5`, `tools/drafts/design-system/validate.ts:179`).

### Inventory and validation tooling

- `apps/drafts/system.manifest.json` defines runtime CSS/JS, foundations, inventory output, Storybook config, modules root, and pages root (`apps/drafts/system.manifest.json:8`).
- Inventory generation reads production module variants from `libs/modules` and draft block manifests from `apps/drafts/modules` (`tools/drafts/design-system/inventory.ts:51`, `tools/drafts/design-system/inventory.ts:180`).
- Production variants are parsed from variant registry source files with a regex-based scanner, then normalized into module/entity/layer/variant inventory records (`tools/drafts/design-system/inventory.ts:105`, `tools/drafts/design-system/inventory.ts:130`).
- Draft block coverage is collected from `block.manifest.json` files and aggregated into inventory totals (`tools/drafts/design-system/inventory.ts:227`, `tools/drafts/design-system/inventory.ts:320`).
- Design-system validation checks root manifest paths, block manifest IDs, layer/state/source fields, component/story file references, content slot records, Figma metadata, and expected folder prefixes (`tools/drafts/design-system/validate.ts:98`, `tools/drafts/design-system/validate.ts:179`).
- Source membership against production inventory is enforced only when a block manifest has `state: "ready"` (`tools/drafts/design-system/validate.ts:277`).
- Page validation is scoped to `apps/drafts/modules/host/models/page` and requires page components, stories, Figma metadata, and block references to existing block manifest directories (`tools/drafts/design-system/validate.ts:397`).

### Module ownership map for remaining migration

- Root architecture defines every business entity as a module model with backend APIs and frontend display components, and lists business modules under `libs/modules` (`README.md:9`, `README.md:78`).
- The blog module owns articles, categories, blog widgets, and their relations (`libs/modules/blog/README.md:5`, `libs/modules/blog/README.md:25`, `libs/modules/blog/README.md:35`).
- The ecommerce module owns catalog, carts/orders/products/stores/widgets, and related product/order/category/store relations. Its README also notes that authenticated cart/product orchestration belongs to RBAC subject surfaces (`libs/modules/ecommerce/README.md:5`, `libs/modules/ecommerce/README.md:31`, `libs/modules/ecommerce/README.md:45`).
- The host module owns pages, layouts, metadata, host widgets, and relations that place widgets or external widgets on pages (`libs/modules/host/README.md:9`, `libs/modules/host/README.md:17`, `libs/modules/host/README.md:28`, `libs/modules/host/README.md:49`).
- The RBAC module owns subjects, identities, roles, permissions, auth widgets, and authenticated orchestration surfaces (`libs/modules/rbac/README.md:5`, `libs/modules/rbac/README.md:53`, `libs/modules/rbac/README.md:66`).
- The social module owns profiles, chats, messages, skills, threads, social widgets, actions, attributes, keys, and their relations (`libs/modules/social/README.md:5`, `libs/modules/social/README.md:33`, `libs/modules/social/README.md:49`).
- The startup module currently owns startup-specific widget content (`libs/modules/startup/README.md:5`, `libs/modules/startup/README.md:19`).
- The website-builder module owns reusable content-building primitives such as buttons, button arrays, features, logotypes, slides, sliders, widgets, and their relations (`libs/modules/website-builder/README.md:5`, `libs/modules/website-builder/README.md:25`, `libs/modules/website-builder/README.md:39`).

### Production variant anchors

- Host page production variants include `find-by-url`, `find`, admin/admin-v2 variants, and default rendering (`libs/modules/host/models/page/frontend/component/src/lib/singlepage/variants.ts:1`).
- Ecommerce product variants include cart, find, admin/admin-v2, overview, price, and currency toggle surfaces (`libs/modules/ecommerce/models/product/frontend/component/src/lib/singlepage/variants.ts:1`).
- Ecommerce order variants include cart, orders-to-products quantity, form-field, admin/admin-v2, and default surfaces (`libs/modules/ecommerce/models/order/frontend/component/src/lib/singlepage/variants.ts:1`).
- RBAC identity variants include create-by-email, form-field, admin/admin-v2, and default surfaces (`libs/modules/rbac/models/identity/frontend/component/src/lib/singlepage/variants.ts:1`).
- Social profile variants include overview, button, chat profile sidebar/avatar/message-row, admin/admin-v2, default, and find surfaces (`libs/modules/social/models/profile/frontend/component/src/lib/singlepage/variants.ts:1`).
- Website-builder widget variants include content, footer, navbar, admin/admin-v2, default, and find surfaces (`libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/variants.ts:1`).

## Code References

- `apps/drafts/README.md:5` - draft folder tree mirrors `libs/modules` ownership.
- `apps/drafts/README.md:61` - Storybook story discovery contract for `apps/drafts/modules`.
- `apps/drafts/README.md:125` - runnable drafts remain a separate standalone prototype area.
- `apps/drafts/.storybook/main.ts:5` - actual Storybook stories glob.
- `apps/drafts/system.manifest.json:8` - design-system runtime, foundations, inventory, and Storybook roots.
- `apps/drafts/block.schema.json:51` - block source can target model, relation, or module entity types.
- `apps/drafts/manifest.schema.json:7` - runnable manifest contract.
- `tools/drafts/lib/discovery.ts:43-57` - runnable discovery roots and excluded draft system directories.
- `tools/drafts/validate-manifests.ts:180` - runnable manifest validation entrypoint.
- `tools/drafts/design-system/inventory.ts:51` - production module and draft module roots used by inventory.
- `tools/drafts/design-system/validate.ts:179` - block manifest validation.
- `tools/drafts/design-system/validate.ts:397` - host page manifest validation.
- `apps/drafts/runnable/singlepage/admin-v2/src/app/routes.ts:1` - runnable singlepage React route map.
- `apps/drafts/runnable/startup/singlepagestartup/src/app/routes.ts:1` - runnable startup React route map.
- `apps/drafts/modules/host/models/page/singlepage/home-default/page.manifest.json:1` - existing host page draft pattern.
- `apps/drafts/modules/website-builder/models/widget/startup/content-default/Component.tsx:1` - existing startup override pattern over a singlepage component contract.
- `README.md:9` - SPS module/model architecture overview.
- `libs/modules/host/README.md:49` - host widget/external widget ownership boundary.
- `libs/modules/ecommerce/README.md:5` - ecommerce module ownership boundary.
- `libs/modules/rbac/README.md:5` - RBAC module ownership boundary.
- `libs/modules/social/README.md:5` - social module ownership boundary.
- `libs/modules/website-builder/README.md:5` - website-builder module ownership boundary.

## Architecture Documentation

The Storybook migration target is a static design-system catalog, not a runnable app clone. The expected shape is:

```text
apps/drafts/modules/<module>/
  models/<model>/<singlepage|startup>/<variant>/
    Component.tsx
    Component.stories.tsx
    block.manifest.json
    figma.json
  relations/<relation>/<singlepage|startup>/<variant>/
    Component.tsx
    Component.stories.tsx
    block.manifest.json
    figma.json
```

Host pages compose blocks under:

```text
apps/drafts/modules/host/models/page/<singlepage|startup>/<page-id>/
  Component.tsx
  Component.stories.tsx
  page.manifest.json
  figma.json
```

The source ownership fields in `block.manifest.json` are the link between design-system drafts and production module boundaries:

```json
{
  "source": {
    "module": "ecommerce",
    "entityType": "model",
    "entity": "product",
    "variant": "card"
  }
}
```

For startup-specific drafts, existing catalog examples keep the singlepage component contract and layer the startup override in the startup folder. This matches the requested startup override model where child projects can override components/functions from singlepage without changing the base contract.

## Historical Context (from thoughts/)

- `thoughts/shared/handoffs/singlepagestartup/drafts-runtime-and-manifest-init-handoff-2026-03-02.md` records the initial runnable manifest workflow: `drafts:list`, `drafts:dev`, `drafts:init`, and `drafts:validate`; runnable React/Next entries use their own `run.dev`, `run.cwd`, install metadata, host, and port.
- `thoughts/shared/plans/services-blog-storybook-migration.md` describes the already-started migration from `apps/drafts/runnable/startup/singlepagestartup/src/app` into reusable Tailwind-only blocks and host page recipes under `apps/drafts/modules`; it names services/blog/author routes and records that the home page had already been migrated.
- `thoughts/shared/research/singlepagestartup/ISSUE-145-admin-v2-playbook.md` is relevant for admin-v2 ownership review. It requires admin-v2 overview structure by model and places relation wiring in model-level admin-v2 forms plus relation components, not ad hoc inline tables.
- `thoughts/shared/research/singlepagestartup/ISSUE-164.md` is relevant for chat/profile migration review. It documents that chat UI boundaries cross host route composition, RBAC subject orchestration, and social module chat/thread/message/profile entities.

## Verification

Commands run during research:

```bash
npm run drafts:validate
npm run drafts:ds:validate
npm run drafts:storybook:build
```

Results:

- `npm run drafts:validate` passed with `Validated 4 draft manifest(s). OK.`
- `npm run drafts:ds:validate` passed with `Drafts design system validation OK.`
- `npm run drafts:storybook:build` completed successfully and wrote `dist/drafts/storybook`.
- `dist/drafts/storybook/index.json` contains 118 entries in the generated Storybook index.
- The current `apps/drafts/modules` tree contains 100 glob-matching `Component.stories.tsx` files (plus 2 non-discoverable `*.draft-story.tsx` files), 85 block manifests, 17 page manifests, and 102 Figma metadata files.
- Manifest state snapshot: 83 `block:singlepage:draft`, 17 `page:singlepage:draft`, and 2 `block:startup:draft`.
- No `apps/drafts/modules/**/relations` directories are present in the current catalog snapshot.

## Related Research

- `thoughts/shared/plans/services-blog-storybook-migration.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-145-admin-v2-playbook.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-164.md`
- `thoughts/shared/handoffs/singlepagestartup/drafts-runtime-and-manifest-init-handoff-2026-03-02.md`

## Open Questions

- Which runnable UI primitives under `singlepage/admin-v2` and `startup/singlepagestartup` are still intended to be promoted to Storybook, and which are retained only as standalone runnable examples?
- Whether admin-v2 runnable surfaces should map to draft blocks under individual module models, host page recipes, or both needs planning against the issue scope and the admin-v2 playbook.
- Whether relation-level Storybook blocks are needed for this migration, since the tooling and schema allow them but the current drafts catalog has no relation directories.
- The exact treatment of duplicated React runnable components between `singlepage/admin-v2` and `startup/singlepagestartup` needs planning so startup overrides reuse singlepage contracts instead of copying whole runnable pages.
