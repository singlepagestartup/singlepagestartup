---
date: 2026-07-03T01:34:05+03:00
issue_number: 203
repository: singlepagestartup
topic: "Synchronize Figma components with the Storybook module catalog"
status: closed
---

# Synchronize Figma Components With The Storybook Module Catalog Implementation Plan

## Closure Update (2026-07-06)

This plan is closed as a Codex execution plan. Codex was not able to complete the remote Figma component migration at the required quality bar: the generated Figma components did not provide reliable visual or structural parity with the Storybook sources.

Remote Figma component migration will be performed manually in Figma and with Figma Agents instead. After those components are created and reviewed manually, a later repository task can connect the accepted Figma components back to the existing Storybook components through `block.manifest.json`, `page.manifest.json`, and `figma.json`.

The research and inventory sections below remain useful as historical context, but they must not be treated as approval to resume Codex-driven Figma file edits.

## Overview

Synchronize the `Single Page Startup` Figma file with the current `apps/drafts/modules` Storybook catalog module-by-module, using real Figma components/variants rather than loose frames, and write the matching node metadata back into local manifests.

The plan follows the confirmed planning scope: include currently missing `crm`, `startup`, relation-backed blocks, stale remote shared metadata cleanup, schema-status normalization, and a Storybook screenshot reference placed next to every added or materially updated Figma component for visual review. Plan revision from 2026-07-03: existing `website-builder` Figma components are read-only for this issue; inspect and map them, but do not change them in Figma when they already exist. For `website-builder`, create only missing Figma components.

## Current State Analysis

`apps/drafts` already defines the target catalog shape: module first, then `models` or `relations`, entity, layer, and reusable block/page files. Storybook is the draft viewer, and Figma metadata is expected to stay aligned with tokens, block IDs, layers, and source mapping (`thoughts/shared/research/singlepagestartup/ISSUE-203.md:30`, `thoughts/shared/research/singlepagestartup/ISSUE-203.md:48`, `thoughts/shared/research/singlepagestartup/ISSUE-203.md:52`).

The local catalog currently has 133 Storybook story files, 109 block manifests, 24 page manifests, and 133 `figma.json` files. Those block manifests cover 103 model blocks and 6 relation blocks, but 71 blocks are still `not-created`, 74 block manifests have no Figma node ID, and 92 `figma.json` files have no node ID (`thoughts/shared/research/singlepagestartup/ISSUE-203.md:32`, `thoughts/shared/research/singlepagestartup/ISSUE-203.md:60`, `thoughts/shared/research/singlepagestartup/ISSUE-203.md:80`, `thoughts/shared/research/singlepagestartup/ISSUE-203.md:95`, `thoughts/shared/research/singlepagestartup/ISSUE-203.md:115`).

The target Figma file currently has component coverage for `website-builder`, `host`, `blog`, `ecommerce`, `social`, and `rbac`, with 13 component sets and 45 component variants. It does not expose scanned component sets for `crm`, `startup`, several existing entities, or relation blocks that now exist locally (`thoughts/shared/research/singlepagestartup/ISSUE-203.md:36`, `thoughts/shared/research/singlepagestartup/ISSUE-203.md:166`, `thoughts/shared/research/singlepagestartup/ISSUE-203.md:181`, `thoughts/shared/research/singlepagestartup/ISSUE-203.md:204`).

Existing Figma nodes already carry `sps` / `sps.drafts` shared plugin data, but sampled nodes still use older code paths such as `content/default/ContentDefault.tsx`, while local metadata uses the current `content-default/Component.tsx` path shape (`thoughts/shared/research/singlepagestartup/ISSUE-203.md:40`, `thoughts/shared/research/singlepagestartup/ISSUE-203.md:222`, `thoughts/shared/research/singlepagestartup/ISSUE-203.md:240`).

Validation currently checks Storybook-discoverable stories and paired Figma metadata files, but it does not validate remote Figma node existence or the full `figma.json` contract against manifests and actual Figma shared data (`thoughts/shared/research/singlepagestartup/ISSUE-203.md:34`, `thoughts/shared/research/singlepagestartup/ISSUE-203.md:147`, `thoughts/shared/research/singlepagestartup/ISSUE-203.md:148`).

## Desired End State

Every manifest-backed Storybook block under `apps/drafts/modules` has a corresponding Figma component set and variant, grouped on a Figma page that matches the module. Relation-backed blocks are represented as relation-owned component sets/variants under their module pages. Host page recipes keep their `host.page` component coverage.

Existing `website-builder` components that are already present in Figma remain unchanged in Figma, including their visual structure and shared plugin data. They can be mapped in the ledger and local metadata can point to them, but this issue must not overwrite those Figma nodes. Missing `website-builder` components are still created.

Every added or materially updated Figma component has an adjacent Storybook screenshot reference captured from the matching Storybook story, named and positioned so the component can be reviewed against the rendered source without hunting through Storybook. These screenshots are review references, not substitutes for proper Figma components.

`block.manifest.json`, `page.manifest.json`, `figma.json`, and Figma shared plugin data agree on component names, page names, variant names, node IDs, source module/entity/layer/variant, current code paths, and sync status wherever Figma mutation is allowed. Legacy remote shared metadata paths are rewritten to the current local contract outside existing `website-builder` components; stale metadata on preserved `website-builder` nodes is recorded in the ledger instead of rewritten.

All remaining gaps, if any, are recorded with a reason, owner, and next action in a checked-in sync ledger. A gap is acceptable only when the Figma tool/access or a concrete render failure prevents synchronization in this pass.

## Key Discoveries

- The module tree and reusable block folder contract are already documented under `apps/drafts/modules` (`thoughts/shared/research/singlepagestartup/ISSUE-203.md:48`, `thoughts/shared/research/singlepagestartup/ISSUE-203.md:52`).
- The local catalog is much wider than the Figma file: 109 block manifests locally versus 13 scanned Figma component sets and 45 variants remotely (`thoughts/shared/research/singlepagestartup/ISSUE-203.md:60`, `thoughts/shared/research/singlepagestartup/ISSUE-203.md:181`).
- `crm`, `startup`, several model entities, and relation blocks exist locally but not as scanned Figma component sets (`thoughts/shared/research/singlepagestartup/ISSUE-203.md:68`, `thoughts/shared/research/singlepagestartup/ISSUE-203.md:204`).
- Local manifests include non-schema statuses `pending` and `synced`; the block schema documents `not-created`, `created`, `needs-update`, and `verified` (`thoughts/shared/research/singlepagestartup/ISSUE-203.md:95`, `thoughts/shared/research/singlepagestartup/ISSUE-203.md:131`).
- Existing Figma shared metadata can be reused as the pattern, but sampled values contain stale path forms that need normalization (`thoughts/shared/research/singlepagestartup/ISSUE-203.md:222`, `thoughts/shared/research/singlepagestartup/ISSUE-203.md:240`).
- Code Connect is not available with the current Figma account/tool access, so implementation must rely on normal Figma plugin API inspection and writes (`thoughts/shared/research/singlepagestartup/ISSUE-203.md:42`, `thoughts/shared/research/singlepagestartup/ISSUE-203.md:340`).

## What We're NOT Doing

- Not changing production runtime behavior in `libs/modules`, `apps/api`, or `apps/host`.
- Not redesigning Storybook components or changing their visual intent beyond tiny fixes required to render screenshots correctly.
- Not replacing Figma components with screenshot images; screenshots are adjacent review references only.
- Not depending on Figma Code Connect, because it was unavailable during research.
- Not treating loose frames as synchronized components unless they are converted into managed components/variants with SPS metadata.
- Not marking unresolved items as verified; blocked or deferred items must remain explicit in the sync ledger.
- Not reverting unrelated draft work already present in the working tree.
- Not changing existing `website-builder` Figma components, variants, or shared plugin data when the component already exists in the Figma file.

## Implementation Approach

Work from the Storybook catalog outward. First create a row-by-row reconciliation ledger from local manifests, Storybook stories, and the current Figma file. Then normalize the metadata contract locally, synchronize Figma components and screenshot references module-by-module, write node IDs/statuses back to manifests, and finish with local validation plus a fresh Figma inventory report. The `website-builder` module has a special preserve rule: existing Figma components are read-only, while missing `website-builder` components may be created.

## Phase 1: Reconciliation Ledger And Naming Contract

### Overview

Create a durable sync matrix before writing to Figma so every local block/page has one intended Figma outcome and reviewer evidence target.

### Changes Required

#### 1. Figma Sync Ledger

**File**: `apps/drafts/inventory/figma-sync.md`
**Why**: The task spans 133 stories and partially synchronized remote components. A checked-in ledger prevents silent omissions and gives implementation/review a stable checklist.
**Changes**: Add a module-grouped table for every `block.manifest.json` and `page.manifest.json`. Each row records block/page ID, manifest path, Storybook story ID, source module/entity type/entity/layer/variant, target Figma page, component set, variant name, current local node IDs, current remote node IDs, required action (`preserve`, `reuse`, `create`, `update`, `verify`, `blocked`), and whether a Storybook screenshot reference must be placed next to the component. Existing `website-builder` Figma components use `preserve`, not `update`.

#### 2. Remote Figma Inventory Snapshot

**File**: `apps/drafts/inventory/figma-sync.md`
**Why**: Existing Figma components should be reused instead of duplicated.
**Changes**: Record the current Figma pages, component sets, variants, and shared SPS metadata discovered through the Figma plugin. Treat the linked `890:5` `author` frame as a reference frame, not a synced component; use the actual `social.profile` `variant=author` component as the reusable component match when applicable.

#### 3. Naming And Grouping Rules

**File**: `apps/drafts/inventory/figma-sync.md`
**Why**: Missing modules and relation blocks need deterministic destinations.
**Changes**: Define the sync naming contract: Figma pages match module names, component sets use `<module>.<entity-or-relation>`, variants use the Storybook block/page variant name, host pages use `host.page`, and relation-backed blocks use the relation name under the owning module page. Add `crm` and `startup` as in-scope Figma module pages when local manifest rows require them. If any module page is absent from Figma, create it before creating that module's components.

### Success Criteria

#### Automated Verification

- [ ] The ledger has one row for every current `block.manifest.json` and `page.manifest.json` under `apps/drafts/modules`.
- [ ] The ledger includes Storybook story IDs for rows that need screenshots.

#### Manual Verification

- [ ] Every missing Figma component set/variant is classified as `create`, `update`, `verify`, or `blocked`; every existing `website-builder` component is classified as `preserve`.
- [ ] `crm`, `startup`, and relation rows have explicit Figma destinations.

## Phase 2: Metadata Contract Normalization

### Overview

Normalize local metadata before and during Figma writes so implementation can safely update remote shared plugin data and write node IDs back without inventing per-component exceptions.

### Changes Required

#### 1. Manifest And `figma.json` Consistency

**Files**: `apps/drafts/modules/**/block.manifest.json`, `apps/drafts/modules/**/page.manifest.json`, `apps/drafts/modules/**/figma.json`
**Why**: The transfer contract depends on local metadata matching the Figma node metadata exactly.
**Changes**: For each row in the ledger, align `componentName`, `pageName`, `variantName`, `nodeId`, `variantNodeId`, source module/entity/layer/variant, `sps.drafts.syncKey`, and `sps.code.*` paths. Normalize `pending` and `synced` statuses into the existing schema statuses: `not-created`, `created`, `needs-update`, or `verified` based on remote node existence and metadata match. For preserved `website-builder` rows, do not rewrite the remote Figma node or its shared plugin data; record any remote metadata mismatch in the ledger and keep local metadata honest about that mismatch.

#### 2. Local Validation Coverage

**File**: `tools/drafts/design-system/validate.ts`
**Why**: Current validation checks paired metadata files but not the full local Figma metadata contract.
**Changes**: Extend validation to compare each block/page manifest against its paired `figma.json`: page/component/variant names, manifest metadata file path, code component/story paths, source fields, schema sync statuses, and node ID consistency. Keep remote Figma API validation out of the normal local validator so CI does not require Figma access.

#### 3. Metadata Documentation

**Files**: `apps/drafts/README.md`, `apps/drafts/inventory/figma-sync.md`
**Why**: Future Figma/code sync passes need the same contract.
**Changes**: Document the expected relationship between `block.manifest.json` or `page.manifest.json`, paired `figma.json`, Figma shared plugin data, and Storybook screenshot references.

### Success Criteria

#### Automated Verification

- [ ] `npm run drafts:ds:validate` fails on invalid local Figma statuses or manifest/`figma.json` mismatches.
- [ ] `npm run drafts:ds:validate` passes after metadata normalization.
- [ ] No local manifest uses `pending` or `synced` as `figma.syncStatus`.

#### Manual Verification

- [ ] Sample rows from existing, created, and updated components show identical source/path metadata in manifest, `figma.json`, and ledger.

## Phase 3: Storybook Screenshot Capture And Review References

### Overview

Add the user's requested visual review aid: place a screenshot from the matching Storybook component beside each added or materially updated Figma component.

### Changes Required

#### 1. Storybook Screenshot Capture Workflow

**Files**: no required source changes unless a small helper is added under `tools/drafts/design-system/`
**Why**: Reviewers need a direct visual comparison beside Figma components.
**Changes**: Start Storybook, render each relevant story in `iframe#storybook-preview-iframe`, and capture a stable desktop screenshot for every row marked `create` or `update`. Use the ledger's Storybook story ID as the capture source. If a component has an important responsive state, capture a second mobile-width reference and record it in the ledger.

#### 2. Figma Screenshot Reference Nodes

**Figma file**: `Single Page Startup`
**Why**: Screenshots should be visible beside the component being reviewed.
**Changes**: Import each screenshot into Figma as a non-component reference node placed next to the added or updated component/variant. Name references with the block/page ID and story ID, for example `storybook-reference / ecommerce.cart.drawer-default`. Add shared metadata that marks the node as a Storybook reference, not a managed SPS component.

#### 3. Screenshot Review Status

**File**: `apps/drafts/inventory/figma-sync.md`
**Why**: Screenshot placement is now part of the requested deliverable.
**Changes**: Record screenshot capture status and Figma screenshot reference node ID for every `create` or `update` row. Existing verified components and preserved `website-builder` components may keep `screenshot: not-required` unless a missing component is created in this issue.

### Success Criteria

#### Automated Verification

- [ ] Storybook build passes before screenshot capture: `npm run drafts:storybook:build`.
- [ ] Fresh Storybook `index.json` contains every story ID referenced by the screenshot ledger rows.

#### Manual Verification

- [ ] Every added or materially updated Figma component has an adjacent Storybook screenshot reference.
- [ ] Screenshot reference nodes are clearly named and are not confused with managed Figma components.
- [ ] Screenshots visually match the Storybook component at the captured viewport.

## Phase 4: Module-By-Module Figma Component Synchronization

### Overview

Synchronize remote Figma component sets and variants using the ledger, preserving existing components where possible and creating missing module/entity/relation coverage where required.

### Changes Required

#### 1. Existing Module Pages

**Figma pages**: `website-builder`, `host`, `blog`, `ecommerce`, `social`, `rbac`
**Why**: These pages already contain partial component sets and should be reconciled before adding missing coverage, but existing `website-builder` components were partially corrected manually and must not be overwritten.
**Changes**: For `website-builder`, inspect existing component sets/variants, map their node IDs, and mark them `preserve`; do not change their visual structure, variant names, or shared plugin data in Figma. Create only missing `website-builder` component sets/variants. For `host`, `blog`, `ecommerce`, `social`, and `rbac`, inspect existing component sets/variants, convert stale loose frames only when they correspond to manifest rows, update component/variant names to the contract when needed, write current shared SPS metadata, and place or refresh Storybook screenshot references for rows changed in this issue.

#### 2. Missing Module Pages And Component Sets

**Figma pages**: `crm`, `startup`, plus any missing component sets on existing module pages
**Why**: Local Storybook contains `crm` and `startup` blocks, plus model and relation entities absent from the scanned Figma inventory.
**Changes**: Create missing module pages, component sets, and variants according to the naming contract. Include local relation-backed blocks as relation component sets under the owning module page. Create the component implementation as editable Figma structure, then place the Storybook screenshot reference beside it for review. When an entire module page is missing, create the page first, then add that module's component groups.

#### 3. Host Page Recipes

**Figma page/component set**: `host` / `host.page`
**Why**: Page manifests are part of the Storybook catalog and already use local Figma metadata.
**Changes**: Reconcile `host.page` variants with all current page manifests. Update page manifest and `figma.json` node IDs/statuses where remote nodes exist or are created, and add screenshot references for added/updated page variants.

#### 4. Shared Plugin Data

**Figma nodes**: managed component sets, component variants, and screenshot references
**Why**: Future transfer from Figma back to code requires traceable metadata.
**Changes**: Write or update shared plugin data for `sps.drafts.*`, `sps.figma.*`, `sps.source.*`, `sps.code.*`, and contract version values from local `figma.json`. Replace stale remote path forms with current local code/story paths where Figma writes are allowed. Do not rewrite shared plugin data on existing `website-builder` components. Screenshot reference nodes get a separate metadata marker so tooling does not treat them as component implementations.

### Success Criteria

#### Automated Verification

- [ ] Local metadata updates after Figma write-back pass `npm run drafts:ds:validate`.
- [ ] Storybook still builds after any screenshot-related fixes: `npm run drafts:storybook:build`.

#### Manual Verification

- [ ] Figma component set and variant counts match the ledger's expected created/updated/verified rows.
- [ ] Existing components are reused instead of duplicated.
- [ ] Existing `website-builder` components are not modified in Figma.
- [ ] New `crm`, `startup`, model, relation, and host page coverage is visible in the Figma file.
- [ ] Added/updated components have adjacent Storybook screenshot references.

## Phase 5: Local Write-Back And Gap Reporting

### Overview

Write the final remote Figma node IDs and sync states back into repository metadata, then record any gaps that could not be closed.

### Changes Required

#### 1. Manifest Write-Back

**Files**: `apps/drafts/modules/**/block.manifest.json`, `apps/drafts/modules/**/page.manifest.json`
**Why**: Manifests are the catalog-level sync source for future updates.
**Changes**: Record `figma.pageName`, `figma.componentName`, `figma.nodeId`, `figma.syncStatus`, and `figma.metadataFile` from the completed Figma sync. Use `verified` only when the remote component/variant and metadata match the local contract and Figma writes were allowed; use `needs-update` for explicit remaining mismatches, including preserved `website-builder` rows whose remote shared metadata is stale but intentionally not changed.

#### 2. `figma.json` Write-Back

**Files**: `apps/drafts/modules/**/figma.json`
**Why**: `figma.json` is the local mirror of Figma shared plugin data.
**Changes**: Record component set IDs, variant node IDs, screenshot reference node IDs where represented in the metadata contract, current variant names, code paths, sync keys, and source mapping values.

#### 3. Final Gap Report

**File**: `apps/drafts/inventory/figma-sync.md`
**Why**: Any incomplete item must be intentional and reviewable.
**Changes**: Update all ledger rows to final status: `verified`, `needs-update`, or `blocked`. For `needs-update` and `blocked`, include the exact reason, whether the Storybook screenshot exists, and the next action needed.

### Success Criteria

#### Automated Verification

- [ ] `npm run drafts:ds:inventory`
- [ ] `npm run drafts:ds:validate`
- [ ] `npm run drafts:storybook:build`

#### Manual Verification

- [ ] Random samples from each module show matching manifest, `figma.json`, Figma component metadata, and adjacent screenshot reference, except preserved `website-builder` rows where the ledger explicitly documents any intentional remote metadata mismatch.
- [ ] No row remains in an ambiguous `created` state without either verification or a documented mismatch.

## Phase 6: Final Verification And Review Evidence

### Overview

Produce a compact evidence set so the human review can check the Figma sync without repeating the full investigation.

### Changes Required

#### 1. Verification Commands

**Files**: no direct file changes expected.
**Why**: The issue requires local catalog integrity after metadata updates.
**Changes**: Run the drafts verification suite and record results in the implementation handoff or PR description.

#### 2. Figma Verification Snapshot

**File**: `apps/drafts/inventory/figma-sync.md`
**Why**: The Figma file is an external artifact; the repo needs a durable summary of what was changed.
**Changes**: Record final Figma pages, component sets, variant totals, screenshot reference totals, and any remaining gap rows.

### Success Criteria

#### Automated Verification

- [ ] `npm run drafts:ds:inventory`
- [ ] `npm run drafts:ds:validate`
- [ ] `npm run drafts:storybook:build`
- [ ] Fresh `dist/drafts/storybook/index.json` is non-empty and includes all screenshot source story IDs.

#### Manual Verification

- [ ] In Figma, inspect one added/updated component from each module and confirm its adjacent screenshot reference exists.
- [ ] Confirm Figma shared plugin data for representative existing, created, and relation-backed components maps back to the current local `figma.json`.
- [ ] Confirm existing `website-builder` components were not changed in Figma.
- [ ] Confirm the ledger has no unexplained missing component rows.

## Testing Strategy

### Unit Tests

No unit tests are required unless implementation adds reusable parsing helpers to the drafts validator. If helper logic is added, cover manifest/`figma.json` mismatch detection and status normalization with focused tests using the repository's BDD test format.

### Integration Tests

Use the existing drafts commands as integration checks:

- `npm run drafts:ds:inventory` confirms catalog inventory can regenerate after metadata changes.
- `npm run drafts:ds:validate` confirms manifests, local Figma metadata, story paths, and page block references stay coherent.
- `npm run drafts:storybook:build` confirms the Storybook catalog still compiles for screenshot capture and review.

### Manual Testing Steps

1. Start Storybook with `npm run drafts:storybook`.
2. Confirm every ledger screenshot row maps to an entry in Storybook `index.json`.
3. Capture/import the Storybook screenshot reference beside each added or updated Figma component, excluding preserved existing `website-builder` rows.
4. Inspect Figma module pages and compare representative components against their adjacent screenshot references.
5. Re-run the Figma inventory script and compare final counts against the ledger.
6. Sample local metadata rows and confirm node IDs/statuses match the final Figma nodes.

## Performance Considerations

Screenshot capture should run against the existing Storybook build/dev server and should not introduce heavy runtime dependencies into draft components. Figma write operations should be batched by module/page to reduce repeated remote calls and to make partial recovery possible if the plugin session fails.

## Migration Notes

- Preserve existing `website-builder` Figma components whenever their component set and variant identity matches a local manifest row; do not change them in Figma during this issue.
- Reuse existing Figma components in other modules whenever their component set and variant identity matches a local manifest row, but those non-`website-builder` nodes may be updated when metadata or component structure is stale.
- Treat old remote shared metadata paths as stale and rewrite them to the current `apps/drafts/modules/.../<block-id>/Component.tsx` and `Component.stories.tsx` contract where Figma writes are allowed. For preserved `website-builder` components, document stale remote metadata instead of rewriting it.
- Relation-backed draft folders are in scope because the local catalog and issue structure include `relations`; represent them as relation component sets under their owning module pages.
- `crm` and `startup` are in scope as Figma module pages because local manifests exist for both modules.
- Do not store screenshot images as checked-in source artifacts unless implementation discovers a concrete review or tooling need; the required deliverable is the adjacent Figma screenshot reference.
- The current working tree already contains draft-related changes from prior work. Implementation must preserve unrelated changes and keep commits scoped to issue #203 artifacts.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-203.md`
- Process log: `thoughts/shared/processes/singlepagestartup/ISSUE-203.md`
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-203.md`
- Related Storybook migration plan: `thoughts/shared/plans/singlepagestartup/ISSUE-201.md`

<!-- Last synced at: 2026-07-03T20:14:47Z -->
