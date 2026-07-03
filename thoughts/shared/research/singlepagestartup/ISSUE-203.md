---
date: 2026-07-03T01:19:25+03:00
researcher: flakecode
git_commit: 14a353b128a54c4f95d8f1ed075f8af9b072a3a3
branch: codex/issue-201-drafts-storybook-migration
repository: singlepagestartup
topic: "Synchronize Figma components with the Storybook module catalog"
tags: [research, codebase, drafts, storybook, figma, metadata]
status: complete
last_updated: 2026-07-03
last_updated_by: flakecode
---

# Research: Synchronize Figma components with the Storybook module catalog

**Date**: 2026-07-03T01:19:25+03:00
**Researcher**: flakecode
**Git Commit**: 14a353b128a54c4f95d8f1ed075f8af9b072a3a3
**Branch**: codex/issue-201-drafts-storybook-migration
**Repository**: singlepagestartup

## Research Question

Document the current state for issue #203: how the `apps/drafts/modules` Storybook catalog is structured, how local `block.manifest.json` / `page.manifest.json` / `figma.json` metadata is shaped and validated, what currently exists in the target Figma file, and where the repo and Figma component inventories already line up or differ.

The issue asks for module-by-module synchronization of the Figma `Single Page Startup` component catalog with Storybook, with every model variant represented through Figma components and with metadata kept synchronized for future transfers between Figma and code.

## Summary

`apps/drafts` already defines the target catalog shape: the draft module tree mirrors `libs/modules` by module, entity type, entity, and `singlepage` / `startup` layer. The README also states that Storybook is the main draft viewer and that Figma components should stay aligned with tokens, block IDs, layers, and source mapping (`apps/drafts/README.md:5`, `apps/drafts/README.md:10`, `apps/drafts/README.md:61`).

Current local checkout inventory under `apps/drafts/modules` contains 133 Storybook-discoverable story files, 109 `block.manifest.json` files, 24 `page.manifest.json` files, and 133 `figma.json` files. The 109 block manifests are all `state: "draft"`; 103 target models and 6 target relations. Current block `figma.syncStatus` values are 71 `not-created`, 33 `created`, 3 `pending`, 1 `synced`, and 1 `verified`. Local `figma.json` files have 41 non-null `nodeId` values and 92 null `nodeId` values.

Current validation checks the draft catalog structure, story file discoverability, manifest file links, page block references, and presence of Figma metadata files. It does not currently validate remote Figma node existence or parse all `figma.json` metadata fields; for block manifests, it checks `figma.metadataFile` and that the referenced file exists (`tools/drafts/design-system/validate.ts:373`, `tools/drafts/design-system/validate.ts:398`).

Read-only Figma inspection of file `Yvkhhu5ABaYUVwzZs5f6Ui` found eight pages: `website-builder`, `admin`, `rogwild.radio`, `host`, `blog`, `ecommerce`, `social`, and `rbac`. The module pages contain 13 component sets and 45 component variants total across `website-builder`, `host`, `blog`, `ecommerce`, `social`, and `rbac`; `admin` and `rogwild.radio` contain frames/rectangles but no component sets or components in the scanned top-level page content.

The Figma URL in the ticket points to node `890:5`, which is a frame named `author` under the `website-builder` page, not a component or component set. The Figma file also has a `social.profile` component set with a component variant `variant=author` at node `782:3`.

Existing Figma components already carry machine-readable shared plugin data in namespaces such as `sps` and `sps.drafts`. A representative current Figma node, `website-builder.widget / variant=content-default`, contains `sps.drafts.blockId`, `sps.drafts.layer`, `sps.drafts.syncKey`, `sps.figma.component`, `sps.figma.variant`, `sps.source.*`, and `sps.code.*` keys. Some sampled Figma shared data still references older slash-separated code paths such as `website-builder/models/widget/singlepage/content/default/ContentDefault.tsx`, while current local `figma.json` for the same block references `website-builder/models/widget/singlepage/content-default/Component.tsx` (`apps/drafts/modules/website-builder/models/widget/singlepage/content-default/figma.json:12`, `apps/drafts/modules/website-builder/models/widget/singlepage/content-default/figma.json:20`).

Code Connect lookup through the Figma plugin was not available in this session because the connected Figma account/tool reported that Code Connect requires a Dev or Full seat on an Organization or Enterprise plan. Normal read-only Figma Plugin API inspection was available and returned pages, component sets, components, variants, and shared plugin data.

## Detailed Findings

### 1. Draft workspace and Storybook boundary

- The draft workspace states that `apps/drafts/modules` mirrors `libs/modules`: module first, then entity type, entity, and layer (`apps/drafts/README.md:5`).
- Its documented goals include isolated prototype UI, visible block-surface mirroring, Storybook preview for `singlepage` and `startup`, and Figma alignment for tokens, block IDs, layers, and source mapping (`apps/drafts/README.md:10`).
- Storybook discovery is explicitly `apps/drafts/modules/**/*.stories.@(ts|tsx|mdx)` in the README and in the Storybook config (`apps/drafts/README.md:63`, `apps/drafts/.storybook/main.ts:5`).
- The README says manifest `files.story` values must point to `*.stories.ts`, `*.stories.tsx`, or `*.stories.mdx`, and that startup overrides should keep the same source contract while setting `layer: "startup"` (`apps/drafts/README.md:81`).
- Reusable blocks live below `apps/drafts/modules/<module>/models/<model>/<singlepage|startup>/<block-id>/` with `Component.tsx`, `Component.stories.tsx`, `block.manifest.json`, and `figma.json`; relations use the same pattern under `relations` (`apps/drafts/README.md:87`, `apps/drafts/README.md:100`).
- Pages are host model drafts under `apps/drafts/modules/host/models/page/<singlepage|startup>/<page-variant>/` and use `page.manifest.json` (`apps/drafts/README.md:114`).
- Draft guardrails keep backend code, `apps/api`, SDK packages, React Query, and production module code out of `apps/drafts`, and require Figma metadata next to reusable blocks (`apps/drafts/README.md:150`).

### 2. Local Storybook and metadata inventory

Current snapshot from filesystem and JSON parsing:

```text
Storybook story files: 133
block.manifest.json files: 109
page.manifest.json files: 24
figma.json files: 133
Storybook build index entries: 154
```

Block manifests by module:

```text
blog: 16
crm: 13
ecommerce: 21
rbac: 15
social: 12
startup: 2
website-builder: 30
```

Block manifests by source entity type:

```text
model: 103
relation: 6
```

Block manifests by layer and state:

```text
singlepage: 107
startup: 2
draft: 109
```

Block Figma sync snapshot:

```text
figma.syncStatus not-created: 71
figma.syncStatus created: 33
figma.syncStatus pending: 3
figma.syncStatus synced: 1
figma.syncStatus verified: 1
block figma.nodeId set: 35
block figma.nodeId null: 74
```

Page Figma sync snapshot:

```text
page manifests: 24
page figma.nodeId set: 6
page figma.nodeId null: 18
```

`figma.json` snapshot:

```text
figma.json total: 133
figma.json nodeId set: 41
figma.json nodeId null: 92
figma.json variantNodeId set: 41
figma.json variantNodeId null: 39
```

All current `block.manifest.json` and `page.manifest.json` folders have a paired `figma.json`; all current manifest-declared story files exist.

### 3. Local metadata shape

- `block.schema.json` requires `id`, `title`, `layer`, `state`, `source`, `files`, `contentSlots`, and `figma` (`apps/drafts/block.schema.json:7`).
- Block `source.entityType` can be `model`, `relation`, or `module` in the schema, while the current validator accepts `model` and `relation` for source completeness checks and folder prefix checks (`apps/drafts/block.schema.json:49`, `tools/drafts/design-system/validate.ts:273`).
- The schema declares `figma.componentName`, optional `figma.pageName`, nullable `figma.nodeId`, enum `figma.syncStatus`, and `figma.metadataFile` (`apps/drafts/block.schema.json:119`).
- A representative synced block manifest is `website-builder.widget.content-default`. It records source module/entity/variant in the manifest, points to `Component.tsx` and `Component.stories.tsx`, and stores `figma.componentName`, `figma.pageName`, `figma.nodeId`, `figma.syncStatus`, and `figma.metadataFile` (`apps/drafts/modules/website-builder/models/widget/singlepage/content-default/block.manifest.json:8`, `apps/drafts/modules/website-builder/models/widget/singlepage/content-default/block.manifest.json:62`).
- The paired `figma.json` for that block stores component set ID `700:24`, variant ID `700:2`, variant name `content-default`, `sps.drafts.*`, `sps.figma.*`, `sps.source.*`, `sps.contractVersion`, and `sps.code.*` metadata (`apps/drafts/modules/website-builder/models/widget/singlepage/content-default/figma.json:1`).
- A local unsynced example is `ecommerce.cart.drawer-default`, whose `figma.json` has `nodeId: null` and no `variantNodeId`, while still carrying the intended component/variant/source/code metadata (`apps/drafts/modules/ecommerce/models/cart/singlepage/drawer-default/figma.json:1`).
- A local synced example outside website-builder is `blog.tag.button-default`, whose `figma.json` points to component set node `791:19` and variant node `791:17` (`apps/drafts/modules/blog/models/tag/singlepage/button-default/figma.json:1`).
- Host page metadata uses `page.manifest.json` with `blocks[]` references to block manifest directories and a `figma` object containing `pageName`, `componentName`, `variantName`, `syncStatus`, `metadataFile`, `nodeId`, and `variantNodeId` (`apps/drafts/modules/host/models/page/singlepage/root/page.manifest.json:1`).
- The paired root page `figma.json` mirrors the same component/variant node IDs and maps back to `host/models/page/singlepage/root` and `Component.stories.tsx` (`apps/drafts/modules/host/models/page/singlepage/root/figma.json:1`).

### 4. Validation and inventory behavior

- `apps/drafts/system.manifest.json` declares runtime CSS/JS, foundation tokens, Figma variables, inventory output, Storybook config dir, modules root, and host pages root (`apps/drafts/system.manifest.json:8`).
- The system schema requires both `foundations.tokens` and `foundations.figmaVariables` (`apps/drafts/system.manifest.schema.json:57`).
- `apps/drafts/foundations/figma.variables.json` already defines Figma-facing token collections for color, spacing, and radius, with variable names tied to CSS custom properties such as `--sps-color-background` and `--sps-space-xs` (`apps/drafts/foundations/figma.variables.json:4`).
- Inventory tooling reads production module roots from `libs/modules`, the draft design-system root from `apps/drafts`, and writes `apps/drafts/inventory/modules.generated.json` (`tools/drafts/design-system/inventory.ts:51`).
- Inventory coverage is built from `block.manifest.json` source fields, not from `figma.json` or remote Figma state (`tools/drafts/design-system/inventory.ts:180`, `tools/drafts/design-system/inventory.ts:227`).
- Validation builds production variant keys from inventory and enforces source membership only when a block manifest is `state: "ready"` (`tools/drafts/design-system/validate.ts:189`, `tools/drafts/design-system/validate.ts:281`).
- Validation enforces story file discoverability for blocks and pages through `isStorybookDiscoverableStoryPath(...)` checks (`tools/drafts/design-system/validate.ts:325`, `tools/drafts/design-system/validate.ts:444`).
- Validation checks `figma.metadataFile` and the existence of paired `figma.json`, but it does not currently validate that `figma.nodeId`, `variantNodeId`, `syncStatus`, or local `figma.json` values match actual Figma nodes (`tools/drafts/design-system/validate.ts:373`, `tools/drafts/design-system/validate.ts:398`).
- `npm run drafts:ds:validate` maps to `nx run @sps/source:drafts:ds:validate`, and `npm run drafts:storybook:build` maps to `nx run @sps/source:drafts:storybook:build` (`package.json:47`).

### 5. Current Figma file inventory

Read-only Figma Plugin API inspection of `Yvkhhu5ABaYUVwzZs5f6Ui` returned these top-level pages:

```text
website-builder: 4 top-level children
admin: 0 childCount from root page inventory; detailed page scan found screenshot rectangles/frames
rogwild.radio: 0 childCount from root page inventory; detailed page scan found image rectangles
host: 1 top-level child
blog: 3 top-level children
ecommerce: 2 top-level children
social: 2 top-level children
rbac: 1 top-level child
```

Component inventory by page:

```text
website-builder: 4 component sets, 20 component variants, 2 instances
host: 1 component set, 6 component variants, 65 instances
blog: 3 component sets, 5 component variants, 17 instances
ecommerce: 2 component sets, 10 component variants, 5 instances
social: 2 component sets, 3 component variants, 0 instances
rbac: 1 component set, 1 component variant, 0 instances
admin: 0 component sets, 0 component variants
rogwild.radio: 0 component sets, 0 component variants
```

Total scanned Figma component inventory:

```text
component sets: 13
component variants: 45
```

Module component sets found in Figma:

```text
website-builder.widget
website-builder.feature
website-builder.button
website-builder.buttons-array
host.page
blog.widget
blog.article
blog.tag
ecommerce.widget
ecommerce.product
social.profile
social.widget
rbac.subject
```

The Figma file does not currently expose scanned component sets for `crm`, `startup`, `ecommerce.cart`, `ecommerce.order`, `blog.category`, `rbac.identity`, `rbac.widget`, `social.chat`, `social.message`, `social.thread`, or current relation blocks. Those entities do appear in local `apps/drafts/modules` metadata where their directories exist.

The linked Figma node `890:5` is:

```text
id: 890:5
name: author
type: FRAME
childCount: 2
componentRelatedCount: 0
```

The `social` page contains a component set `social.profile` and a component variant `variant=author` at node `782:3`. This is a distinct Figma component from the linked `890:5` frame.

### 6. Figma shared metadata

Existing Figma component nodes already use shared plugin data:

- The scanned `website-builder.widget` component set has shared data under `sps.drafts`, including keys such as `syncStatus`, `syncKey`, `source.variant`, `source.entity`, `source.module`, `source.entityType`, `code.component`, `code.story`, `figma.variant`, `figmaComponentName`, `managed`, `contractVersion`, `layer`, and `blockId`.
- The scanned `website-builder.widget / variant=content-default` component has shared data under `sps.drafts`, including `sps.drafts.blockId`, `sps.drafts.layer`, `sps.drafts.syncKey`, `sps.figma.component`, `sps.figma.variant`, `sps.source.module`, `sps.source.entityType`, `sps.source.entity`, `sps.source.variant`, `sps.contractVersion`, `sps.code.component`, and `sps.code.story`.
- Sampled remote shared data for `variant=content-default` uses:

```text
sps.drafts.blockId = website-builder.widget.content-default
sps.drafts.layer = singlepage
sps.drafts.syncKey = website-builder/models/widget/singlepage/content/default
sps.figma.component = website-builder.widget
sps.figma.variant = content-default
sps.source.module = website-builder
sps.source.entityType = model
sps.source.entity = widget
sps.source.variant = content-default
sps.code.component = apps/drafts/modules/website-builder/models/widget/singlepage/content/default/ContentDefault.tsx
sps.code.story = apps/drafts/modules/website-builder/models/widget/singlepage/content/default/ContentDefault.stories.tsx
```

The current local `figma.json` for the same logical block uses `sps.drafts.syncKey = website-builder/models/widget/singlepage/content-default` and component/story paths under `content-default/Component.tsx` and `content-default/Component.stories.tsx` (`apps/drafts/modules/website-builder/models/widget/singlepage/content-default/figma.json:12`, `apps/drafts/modules/website-builder/models/widget/singlepage/content-default/figma.json:20`).

### 7. Historical context from issue #201

Issue #201 moved `apps/drafts` from runnable prototypes toward the Storybook-backed module catalog. Its research recorded the same architectural baseline: module tree mirrors `libs/modules`, Storybook loads `apps/drafts/modules/**/*.stories.@(ts|tsx|mdx)`, and runnable stays outside Storybook (`thoughts/shared/research/singlepagestartup/ISSUE-201.md:30`).

The issue #201 plan explicitly deferred remote Figma transfer/sync until after Storybook review. It allowed local `figma.json` maintenance only as repository validation metadata, and said no Figma file, node, component, plugin, or sync work should happen in that phase (`thoughts/shared/plans/singlepagestartup/ISSUE-201.md:19`).

Issue #201 also established that admin/admin-v2 surfaces are in Storybook migration scope and should be represented by host page recipes plus module-owned blocks, rather than staying silently runnable-only (`thoughts/shared/plans/singlepagestartup/ISSUE-201.md:17`, `thoughts/shared/plans/singlepagestartup/ISSUE-201.md:43`).

## Code References

- `apps/drafts/README.md:5` - draft module tree mirrors `libs/modules`.
- `apps/drafts/README.md:61` - Storybook is the draft viewer.
- `apps/drafts/README.md:81` - manifest stories must match Storybook-discoverable suffixes.
- `apps/drafts/README.md:87` - reusable block folder contract.
- `apps/drafts/README.md:114` - host page draft folder contract.
- `apps/drafts/README.md:150` - drafts guardrails and Figma metadata placement.
- `apps/drafts/.storybook/main.ts:5` - actual Storybook glob.
- `apps/drafts/block.schema.json:7` - required block manifest fields.
- `apps/drafts/block.schema.json:119` - block `figma` schema.
- `apps/drafts/modules/website-builder/models/widget/singlepage/content-default/block.manifest.json:8` - sample source metadata.
- `apps/drafts/modules/website-builder/models/widget/singlepage/content-default/block.manifest.json:62` - sample manifest Figma metadata.
- `apps/drafts/modules/website-builder/models/widget/singlepage/content-default/figma.json:1` - sample synced `figma.json`.
- `apps/drafts/modules/ecommerce/models/cart/singlepage/drawer-default/figma.json:1` - sample unsynced local `figma.json`.
- `apps/drafts/modules/host/models/page/singlepage/root/page.manifest.json:1` - sample host page manifest.
- `apps/drafts/modules/host/models/page/singlepage/root/figma.json:1` - sample host page Figma metadata.
- `tools/drafts/design-system/inventory.ts:180` - inventory reads block manifests.
- `tools/drafts/design-system/inventory.ts:227` - inventory maps block sources to coverage.
- `tools/drafts/design-system/validate.ts:325` - block story file discoverability validation.
- `tools/drafts/design-system/validate.ts:373` - block `figma.metadataFile` validation.
- `tools/drafts/design-system/validate.ts:398` - paired `figma.json` existence validation.
- `tools/drafts/design-system/validate.ts:444` - page story file discoverability validation.
- `tools/drafts/design-system/validate.ts:496` - page block references validation.
- `apps/drafts/foundations/figma.variables.json:4` - Figma variables token source.
- `package.json:47` - drafts inventory/validate/Storybook scripts.

## Architecture Documentation

Current repository architecture for synchronized draft blocks is:

```text
apps/drafts/modules/<module>/models/<model>/<layer>/<block-id>/
  Component.tsx
  Component.stories.tsx
  block.manifest.json
  figma.json
```

Current repository architecture for relation-backed draft blocks is:

```text
apps/drafts/modules/<module>/relations/<relation>/<layer>/<block-id>/
  Component.tsx
  Component.stories.tsx
  block.manifest.json
  figma.json
```

Current repository architecture for host page recipes is:

```text
apps/drafts/modules/host/models/page/<layer>/<page-id>/
  Component.tsx
  Component.stories.tsx
  page.manifest.json
  figma.json
```

Local metadata has two layers:

1. `block.manifest.json` / `page.manifest.json` store the catalog identity, source ownership, files, Figma component set/page/variant references, and sync state.
2. `figma.json` stores the transfer metadata expected to be mirrored into Figma node shared plugin data, including `sps.drafts.*`, `sps.figma.*`, `sps.source.*`, and `sps.code.*` keys.

Remote Figma metadata observed during research uses the same conceptual namespace, but sampled older nodes still contain older path forms alongside the newer local metadata contract.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-201.md` is the most relevant prior research. It documented the Storybook module catalog boundary and the previous counts before later issue #201 implementation.
- `thoughts/shared/plans/singlepagestartup/ISSUE-201.md` explicitly deferred remote Figma sync until after Storybook review and approval, making issue #203 the follow-up scope where remote Figma synchronization is now being described and researched.
- `thoughts/shared/processes/singlepagestartup/ISSUE-201.md` records the reusable learning that local `figma.json` edits are metadata maintenance only and not evidence of remote Figma work.

## Verification

Commands run during research:

```bash
npm run drafts:ds:validate
npm run drafts:storybook:build
node -e "const fs=require('fs'); const p='dist/drafts/storybook/index.json'; const j=JSON.parse(fs.readFileSync(p,'utf8')); console.log(Object.keys(j.entries||{}).length)"
```

Results:

- `npm run drafts:ds:validate` passed with `Drafts design system validation OK.`
- `npm run drafts:storybook:build` completed successfully and wrote `dist/drafts/storybook`.
- Fresh `dist/drafts/storybook/index.json` contains 154 Storybook entries.
- Current working tree had pre-existing draft changes before this research; counts above reflect the current checkout state, not only committed `main`.
- `dist/` is ignored; Storybook build output did not add tracked files.

Figma tools used during research:

- `get_metadata` for top-level Figma metadata and node `890:5`.
- `use_figma` read-only scripts for page, component set, component variant, instance, and shared plugin data inventory.
- `get_code_connect_map` attempted for representative pages; it returned a Figma account/seat limitation instead of Code Connect mappings.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-201.md`
- `thoughts/shared/plans/singlepagestartup/ISSUE-201.md`
- `thoughts/shared/handoffs/singlepagestartup/ISSUE-201-progress.md`

## Open Questions

- Whether `crm` should be added as a Figma page/component group in the same file, since local Storybook now contains `crm` module metadata but the scanned Figma file has no `crm` page.
- Whether the two local `startup` block manifests should map to a dedicated `startup` Figma page or remain represented through other module pages.
- Whether relation-backed local blocks should become Figma component variants in their module pages or remain metadata-only until relation design patterns are established.
- Whether legacy Figma shared plugin data paths such as `content/default/ContentDefault.tsx` should be treated as stale metadata during synchronization.
- Whether `pending` and `synced` `figma.syncStatus` values in current manifests are intentional local states, since `block.schema.json` documents `not-created`, `created`, `needs-update`, and `verified`.
