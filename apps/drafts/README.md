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
apps/drafts/modules/**/*.stories.tsx
```

Run:

```bash
npm run drafts:storybook
```

Build:

```bash
npm run drafts:storybook:build
```

Use Storybook to compare `singlepage` and `startup` variants of the same block.
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

## Pages

Pages are not stored in a top-level `pages/` directory. They are host module
drafts:

```txt
apps/drafts/modules/host/models/page/<singlepage|startup>/<page-variant>/
  <Page>.tsx
  <Page>.stories.tsx
  page.manifest.json
  styles.css
```

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
