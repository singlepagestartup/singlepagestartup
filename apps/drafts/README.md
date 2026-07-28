# Drafts Workspace

`apps/drafts` is the fast prototyping workspace for SPS interfaces.

The draft module tree mirrors `libs/modules`: module first, then entity type,
then entity, then the `singlepage` or `startup` layer.

## Goals

- Keep generated prototype UI isolated from production apps.
- Mirror the visible block surface of `libs/modules`.
- Preview `singlepage` base blocks and `startup` overrides in one Storybook.
- Keep Figma components aligned with the same tokens, block IDs, layers, and source mapping.

## Directory Layout

```txt
apps/drafts/
  package.json
  system.manifest.json
  system.manifest.schema.json
  block.schema.json
  .storybook/
  foundations/
  runtime/
  inventory/
  modules/
    <module>/
      models/
        <model>/
          singlepage/
            <variant-or-block-id>/
          startup/
            <variant-or-block-id>/
      relations/
        <relation>/
          singlepage/
            <variant-or-block-id>/
          startup/
            <variant-or-block-id>/
  runnable/
    singlepage/
      <standalone-draft>/
    startup/
      <standalone-draft>/
```

Examples:

```txt
libs/modules/website-builder/models/widget/frontend/component/src/lib/singlepage/default
apps/drafts/modules/website-builder/models/widget/singlepage/content-default

libs/modules/host/models/page/frontend/component/src/lib/singlepage/default
apps/drafts/modules/host/models/page/singlepage/landing-page-basic

libs/modules/startup/models/widget/frontend/component/src/lib/singlepage/default
apps/drafts/modules/startup/models/widget/singlepage/default
```

## Storybook

Storybook is the main draft viewer. It loads every story from:

```txt
apps/drafts/modules/**/*.stories.@(ts|tsx|mdx)
```

Run:

```bash
npm run drafts:storybook
```

Build:

```bash
npm run drafts:storybook:build
```

Manifest `files.story` values must point to a Storybook-discoverable
`*.stories.ts`, `*.stories.tsx`, or `*.stories.mdx` file. Use Storybook to
compare `singlepage` and `startup` variants of the same block.
Startup overrides should keep the same source contract and normally the same
`id`, while setting `"layer": "startup"` in `block.manifest.json`.

## Module Blocks

Every reusable block lives below the module/entity it represents:

```txt
apps/drafts/modules/<module>/models/<model>/<singlepage|startup>/<block-id>/
  <Component>.tsx
  <Component>.stories.tsx
  block.manifest.json
  figma.json
  styles.css
```

Relations use the same structure:

```txt
apps/drafts/modules/<module>/relations/<relation>/<singlepage|startup>/<block-id>/
```

`block.manifest.json` must include:

- `id`: stable block ID shared with Figma.
- `layer`: `singlepage` or `startup`.
- `source.module`, `source.entityType`, `source.entity`, `source.variant`.
- `files.component` and `files.story`.
- `figma.metadataFile`.

The paired `figma.json` mirrors the Figma shared plugin data for the block.
`block.manifest.json` and `figma.json` must agree on `componentName`,
`pageName`, `variantName`, `nodeId`, and `variantNodeId`. `figma.syncStatus`
uses only `not-created`, `created`, `needs-update`, or `verified`.
`figma.json.metadata` stores the `sps.drafts.*`, `sps.figma.*`,
`sps.source.*`, and `sps.code.*` fields written to managed Figma nodes.
Storybook screenshot references are review nodes placed next to added or
updated Figma components; they are not managed component implementations.

Remote Figma component creation is not a Codex-owned workflow for this catalog.
Codex may maintain local inventory, documentation, and metadata, but
high-fidelity Figma components must be created and reviewed manually in Figma
or with Figma Agents. Connect `figma.json` and manifest node IDs after the
accepted Figma components exist.

## Pages

Pages are not stored in a top-level `pages/` directory. They are host module
drafts:

```txt
apps/drafts/modules/host/models/page/<singlepage|startup>/<page-variant>/
  <Page>.tsx
  <Page>.stories.tsx
  page.manifest.json
  figma.json
  styles.css
```

Page `figma.json` files follow the same metadata contract as block metadata.
Host page recipes use `pageName: "host"`, `componentName: "host.page"`, and
`variantName` equal to the page manifest `id`.

## Runnable Drafts

Standalone imported prototypes live under `runnable/` and keep their own
`manifest.json`:

```txt
apps/drafts/runnable/singlepage/<draft-id>/
apps/drafts/runnable/startup/<draft-id>/
```

Commands:

- `npm run drafts:list`
- `npm run drafts:validate`
- `npm run drafts:dev -- runnable/startup/singlepagestartup`
- `npm run drafts:init -- runnable/startup/landing-v1`

## System Commands

- Refresh module/block inventory: `npm run drafts:ds:inventory`
- Validate module manifests and file links: `npm run drafts:ds:validate`
- Legacy static preview: `npm run drafts:ds:dev -- modules/website-builder/models/widget/singlepage/content-default`

## Guardrails

- Do not place backend code in `apps/drafts`.
- Do not import from `apps/api`, SDK packages, React Query, or production module code.
- Keep draft components presentation-only and data-static.
- Use `runtime/styles.css` tokens before hardcoded values.
- Keep Figma metadata next to every reusable block.
