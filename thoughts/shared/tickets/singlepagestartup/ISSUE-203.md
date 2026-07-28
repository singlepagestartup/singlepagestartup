---
repository: singlepagestartup
issue_number: 203
status: Done
created: 2026-07-03
---

# Issue: Synchronize Figma components with the Storybook module catalog

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/203
**Status**: Done
**Created**: 2026-07-03
**Priority**: medium
**Size**: large
**Type**: feature

---

## Closure Note (2026-07-06)

Codex was not able to complete the Figma component migration at the required quality bar. The attempted automated transfer produced inaccurate component structures and did not provide reviewable parity with the Storybook references.

Remote Figma component migration for this catalog is now closed for Codex. The components will be recreated manually in Figma and with Figma Agents. After those Figma components are created and reviewed, they will be connected back to the components that currently exist in Storybook, using `block.manifest.json`, `page.manifest.json`, and `figma.json` as the repository-side metadata contract.

Issue #203 is marked Done to stop further Codex-driven Figma implementation work. Repository-side metadata can be reconciled again only after the manual/Figma Agents component set is accepted.

## Problem to Solve

The `apps/drafts/modules` Storybook catalog is becoming the source for SPS reusable visual blocks, but the Figma file `Single Page Startup` is only partially synchronized with that catalog. The Figma structure must be aligned module-by-module with Storybook, using the same module/model breakdown and the same stable block identity so future updates can move between Figma and code without manual remapping.

Every model variant represented in Storybook must have a corresponding Figma component implementation, not just a loose frame. Existing Figma components should be inspected first and used as the implementation/reference pattern for the rest of the catalog.

The synchronization must also update local metadata (`block.manifest.json` and `figma.json`) so each code block records the matching Figma component/variant information and each Figma component can be traced back to the Storybook source.

## Key Details

- Target Figma file: `Single Page Startup` at `https://www.figma.com/design/Yvkhhu5ABaYUVwzZs5f6Ui/Single-Page-Startup?node-id=890-5`.
- Storybook module structure lives under `apps/drafts/modules` and mirrors `libs/modules`: `<module>/models|relations/<entity>/<singlepage|startup>/<variant-or-block-id>`.
- Figma module grouping must match the Storybook grouping module-by-module.
- Each model has variants; each variant must be represented through Figma component variants or component instances, not unmanaged frames.
- Existing Figma work is partial and should be reconciled, reused, and extended instead of duplicated.
- Initial local scan of the current checkout found:
  - 133 Storybook story files under `apps/drafts/modules`;
  - 133 `figma.json` metadata files;
  - 109 `block.manifest.json` files.
- The count mismatch means the task must include an inventory/reconciliation pass before creating or updating Figma nodes.
- Metadata must stay consistent across `block.manifest.json`, `figma.json`, and the actual Figma nodes.

## Implementation Notes

- Work module-by-module, following the same module breakdown that Storybook exposes.
- For each Storybook block/model variant:
  - identify the module, entity type, model/relation name, layer, and variant from `block.manifest.json` and directory path;
  - inspect the matching existing Figma component, if one exists;
  - create or update a Figma component/variant when missing or stale;
  - preserve stable component names and variant names such as `blog.article` + `card`;
  - record the Figma node/component IDs back into `figma.json` and `block.manifest.json`.
- Keep `figma.json` metadata aligned with the current local contract:
  - `componentName`;
  - `pageName`;
  - `nodeId`;
  - `variantNodeId` where applicable;
  - `variantName`;
  - `metadata.sps.drafts.blockId`;
  - `metadata.sps.drafts.layer`;
  - `metadata.sps.drafts.syncKey`;
  - `metadata.sps.figma.component`;
  - `metadata.sps.figma.variant`;
  - `metadata.sps.source.*`;
  - `metadata.sps.code.component`;
  - `metadata.sps.code.story`.
- Keep `block.manifest.json` aligned with the actual Figma sync state:
  - `figma.componentName`;
  - `figma.pageName`;
  - `figma.nodeId`;
  - `figma.syncStatus`;
  - `figma.metadataFile`.
- Do not change production module runtime behavior while doing the sync. This task is about Storybook/Figma/catalog metadata.
- Validate code-side catalog integrity after metadata updates:
  - `npm run drafts:ds:validate`;
  - `npm run drafts:storybook:build`;
  - targeted checks that Storybook still exposes updated stories.
- Record any remaining Figma gaps explicitly if a component cannot be synchronized in one pass.
