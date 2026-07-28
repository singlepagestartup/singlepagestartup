---
date: 2026-07-01T00:09:07+03:00
issue_number: 201
repository: singlepagestartup
topic: "Migrate remaining runnable drafts into the Storybook module catalog"
status: implemented
---

# Migrate Remaining Runnable Drafts Into The Storybook Module Catalog Implementation Plan

## Overview

Complete the `apps/drafts/runnable` to Storybook migration by classifying every remaining runnable source, promoting reusable presentation blocks/pages into `apps/drafts/modules`, and leaving runnable entries only when they are explicitly standalone prototypes with a recorded reason.

The plan follows the user-confirmed interpretation from 2026-07-01: inventory first, migrate reusable blocks/pages by `libs/modules` ownership, model startup as overrides over singlepage contracts, document retained runnable prototypes, and fix the current non-discoverable `*.draft-story.tsx` startup stories.

Plan revision from 2026-07-01: the admin panel and admin-v2 runnable surfaces are explicitly in scope for Storybook migration. Admin shell/layouts, dashboards, model lists/forms, entity drawers, relation management, and editor-facing surfaces must be migrated, replaced by module-owned Storybook drafts, or documented in the migration matrix; they must not remain silently runnable-only.

Plan revision from 2026-07-01: Figma transfer/sync is explicitly out of scope until the user reviews Storybook and confirms that the migration is correct. The current implementation scope is only code under `apps/drafts/runnable` and Storybook-backed `apps/drafts/modules`/draft tooling. Local `figma.json` files may be preserved or minimally updated only as repository validation metadata required by the existing drafts contract; no Figma file, node, component, plugin, or sync work should happen in this phase.

## Current State Analysis

`apps/drafts` already documents the desired architecture: the draft module tree mirrors `libs/modules`, Storybook is the main draft viewer, reusable blocks live under `apps/drafts/modules/<module>/models|relations/<entity>/<layer>/<block-id>`, and runnable drafts are only standalone imported prototypes (`apps/drafts/README.md:5`, `apps/drafts/README.md:61`, `apps/drafts/README.md:85`, `apps/drafts/README.md:125`).

Storybook only discovers stories matching `../modules/**/*.stories.@(ts|tsx|mdx)` (`apps/drafts/.storybook/main.ts:5`). The current catalog has 102 manifest-backed entities, but only 100 glob-matching `Component.stories.tsx` files. Two startup widget manifests reference `*.draft-story.tsx`, so they pass design-system validation but are not discoverable as Storybook stories (`apps/drafts/modules/startup/models/widget/startup/default/block.manifest.json:14`, `apps/drafts/modules/startup/models/widget/startup/default/block.manifest.json:16`, `tools/drafts/design-system/validate.ts:179`).

The remaining runnable React trees still contain shared app shells, route maps, layouts, page components, auth/cart contexts, entity drawers, editor components, and UI primitives. The `singlepage/admin-v2` route map includes site routes for blog, services, checkout, auth, profile, chat, plus admin routes for dashboards and model editing (`apps/drafts/runnable/singlepage/admin-v2/src/app/routes.ts:1`, `apps/drafts/runnable/singlepage/admin-v2/src/app/routes.ts:26`, `apps/drafts/runnable/singlepage/admin-v2/src/app/routes.ts:89`). The startup runnable has the same route shape according to the research artifact.

The admin surface is not only an app shell: runnable admin code includes dashboards, model lists, model editing, settings/account surfaces, entity drawers, relation management, editor components, and shared admin UI primitives. Those pieces need Storybook destinations or explicit replacement/retention rows in the migration matrix.

Validation currently checks block source shape and expected path prefixes, but production source membership is enforced only for `state: "ready"` blocks (`tools/drafts/design-system/validate.ts:262`, `tools/drafts/design-system/validate.ts:277`, `tools/drafts/design-system/validate.ts:291`). Draft-state blocks therefore need an explicit ownership audit against `libs/modules`, not only a passing `drafts:ds:validate`.

## Desired End State

Every remaining runnable source has one recorded outcome:

- `migrated`: reusable presentation is represented by Storybook block/page files, manifests, stories, and any local validation metadata required by the drafts contract under the correct module/model/relation/layer.
- `replaced`: an existing Storybook block/page already covers the runnable source and the inventory points to that destination.
- `retained`: the runnable entry remains because it is intentionally standalone, with the reason documented.

Storybook exposes every migrated or existing reusable draft through `dist/drafts/storybook/index.json` and the dev-server `index.json` endpoint. No manifest references a story filename that the Storybook glob cannot discover. Runnable contains no unclassified imported prototype code.

The admin panel is represented in Storybook through host page recipes plus module-owned admin-v2 cards, tables, forms, relation blocks, and supporting static/editor presentation where applicable. Runnable admin code is not treated as the lasting source of truth for the admin design system.

No remote Figma work is part of this end state. Figma transfer/sync begins only after Storybook review and explicit user confirmation in a later phase or issue.

## Key Discoveries

- The draft module tree mirrors `libs/modules` and supports both model and relation block folders (`apps/drafts/README.md:5`, `apps/drafts/README.md:98`).
- Storybook discovery is filename-sensitive and currently ignores `*.draft-story.tsx` files (`apps/drafts/.storybook/main.ts:5`).
- The validator confirms referenced story files exist, but it does not currently guarantee they match the Storybook stories glob (`tools/drafts/design-system/validate.ts:179`).
- Source membership against production variant inventory is only enforced for `state: "ready"` blocks (`tools/drafts/design-system/validate.ts:277`).
- The existing services/blog migration spec defines the successful pattern: reusable Tailwind-only blocks plus host page recipes, no router/data-module/shadcn runtime imports, and static default props.
- The admin-v2 playbook requires admin-v2 surfaces to remain model-organized and relation-aware instead of flattening relation behavior into ad hoc pages.
- The chat/profile research places authenticated chat orchestration at the RBAC subject boundary while social owns pure chat/thread/message/profile display entities.

## What We're NOT Doing

- Not changing production runtime modules under `libs/modules` except if a later implementation discovers a tooling type export is strictly required for drafts.
- Not importing `apps/api`, production SDK packages, React Query, or production module runtime code into `apps/drafts`.
- Not migrating `node_modules`, lockfiles, package-manager artifacts, or generated runnable build output.
- Not keeping generic shadcn-style `ui/*` primitives as standalone Storybook blocks unless an SPS module owns the resulting reusable surface.
- Not leaving the admin panel or admin-v2 shell as runnable-only just because it is broad; admin surfaces are part of the Storybook migration scope.
- Not creating, updating, syncing, or transferring anything in Figma until the user has reviewed Storybook and explicitly approved the migrated result.
- Not running Figma plugins/tools or treating local `figma.json` validation files as evidence that remote Figma work has been done.
- Not marking draft blocks `state: "ready"` just to force inventory membership checks.
- Not deleting runnable entries until their sources are either migrated/replaced or documented as retained standalone prototypes.

## Implementation Approach

Treat the runnable React apps as source material, not as the target architecture. First create a migration matrix that maps each meaningful runnable file/component to a module-owned Storybook destination or retention reason. Then fix catalog discoverability/tooling, migrate reusable static UI into module folders using existing block/page patterns, run an explicit admin/admin-v2 Storybook migration lane, and finish by documenting the remaining runnable surface plus running the full drafts verification suite. Keep the work inside repository code for runnable and Storybook; defer all remote Figma work until after explicit Storybook acceptance.

## Phase 1: Runnable Inventory And Ownership Matrix

### Overview

Create a durable inventory so implementation can prove every runnable source was handled and so later reviewers do not need to rediscover the runnable tree.

### Changes Required

#### 1. Runnable Migration Matrix

**File**: `apps/drafts/inventory/runnable-migration.md`
**Why**: The issue requires every remaining runnable component to be migrated, replaced, or intentionally retained. A checked-in matrix makes that status explicit and reviewable.
**Changes**: Add a table grouped by runnable manifest and component area. Each row records source path, role, target module/entity/layer, outcome (`migrate`, `replace`, `retain`), and rationale. Exclude `node_modules`, lockfiles, package artifacts, and generated output. Treat admin shell, admin routes, dashboards, model lists/forms, entity drawers, relation management, editor components, and admin UI primitives as first-class rows, not as miscellaneous leftovers.

#### 2. Retained Runnable Documentation

**File**: `apps/drafts/runnable/README.md`
**Why**: Runnable should only contain standalone imported prototypes after this work. Reviewers need a local explanation for each retained runnable entry.
**Changes**: Document the retained runnable contract, list retained entries, and link each retained entry back to the migration matrix row explaining why it is not part of the reusable Storybook catalog.

#### 3. Ownership Cross-Check

**Files**: `libs/modules/*/README.md`, `apps/drafts/inventory/runnable-migration.md`
**Why**: The ticket explicitly requires ownership validation against `libs/modules`, not visual similarity.
**Changes**: For each destination, record the owning module/model/relation using the module README and existing draft patterns. Use `host.models.page` for route/page recipes, `website-builder` for generic content primitives, `ecommerce` for product/cart/order/checkout, `blog` for article/category/tag/author content, `rbac` for identity/subject/auth/account orchestration, `social` for profile/chat/message display, and `startup` only for startup-specific overrides.

### Success Criteria

#### Automated Verification

- [x] Runnable manifest validation passes: `npm run drafts:validate`
- [x] The migration matrix contains one outcome row for each meaningful runnable component/page/layout/context/editor source.

#### Manual Verification

- [x] Every retained runnable entry has a reason.
- [x] Every migrate/replace row has a module/model/relation destination consistent with `libs/modules`.

## Phase 2: Storybook Discoverability And Validation Guardrails

### Overview

Fix current catalog mismatches before adding more stories, so successful validation also means Storybook can discover the declared stories.

### Changes Required

#### 1. Startup Widget Story Filenames

**Files**:

- `apps/drafts/modules/startup/models/widget/singlepage/default/*`
- `apps/drafts/modules/startup/models/widget/startup/default/*`

**Why**: These two startup widget manifests reference `*.draft-story.tsx`, which passes validation but does not match the Storybook glob.
**Changes**: Rename story files to `*.stories.tsx`, update the corresponding `block.manifest.json` `files.story` fields, and update local `figma.json` `sps.code.story` metadata only if needed to keep repository validation metadata consistent. Do not sync, create, or update anything in Figma.

#### 2. Story Filename Validation

**File**: `tools/drafts/design-system/validate.ts`
**Why**: The validator should catch manifest story files that Storybook cannot load.
**Changes**: Extend block and page validation so `files.story` must point to a Storybook-discoverable filename matching `*.stories.ts`, `*.stories.tsx`, or `*.stories.mdx`. Keep this check scoped to the manifest-declared story path, not a broad Storybook runtime probe.

#### 3. Drafts Documentation

**File**: `apps/drafts/README.md`
**Why**: The README says Storybook loads `*.stories.tsx`, while the actual config allows `.ts`, `.tsx`, and `.mdx`; the docs should align with the enforced validation.
**Changes**: Clarify the supported Storybook story suffix and state that manifest `files.story` must match the Storybook glob.

### Success Criteria

#### Automated Verification

- [x] Design-system validation passes: `npm run drafts:ds:validate`
- [x] Storybook build passes: `npm run drafts:storybook:build`
- [x] No `apps/drafts/modules` manifest points at `*.draft-story.tsx`.

#### Manual Verification

- [x] `dist/drafts/storybook/index.json` includes the startup widget singlepage and startup stories after build.

## Phase 3: Migrate Public Reusable Blocks And Page Recipes

### Overview

Promote reusable public/site runnable UI into the Storybook module catalog using existing static Tailwind block/page patterns, while classifying duplicates as replaced by existing blocks. Admin-specific migration is handled in the next phase so it cannot be skipped or collapsed into a generic page copy.

### Changes Required

#### 1. Host Page Recipes

**Files**:

- `apps/drafts/modules/host/models/page/singlepage/*`
- `apps/drafts/modules/host/models/page/startup/*` where startup-specific page composition is needed

**Why**: Full route/page compositions belong to the host page model, not to the source runnable app shell.
**Changes**: Add or update page recipes for runnable pages that are not already covered. Compose module-owned blocks instead of copying full routed app components. Keep navbar/footer/layout composition consistent with existing `home-default` and the services/blog migration pattern.

#### 2. Website Builder Blocks

**Files**:

- `apps/drafts/modules/website-builder/models/widget/singlepage/*`
- `apps/drafts/modules/website-builder/models/widget/startup/*`

**Why**: Generic page sections, navigation, footer, content bands, buttons, feature blocks, terms/privacy content, and layout primitives belong to website-builder widgets unless a more specific module owns them.
**Changes**: Extract only reusable presentation sections from runnable components into static Tailwind blocks with typed default props, `Component.stories.tsx`, `block.manifest.json`, and local validation metadata required by the drafts contract. Replace router links with anchors and remove runnable-only context assumptions. Do not perform remote Figma work.

#### 3. Ecommerce Blocks

**Files**:

- `apps/drafts/modules/ecommerce/models/product/singlepage/*`
- `apps/drafts/modules/ecommerce/models/order/singlepage/*`
- `apps/drafts/modules/ecommerce/models/cart/singlepage/*`
- `apps/drafts/modules/ecommerce/models/widget/singlepage/*`

**Why**: Catalog, product detail, cart drawer, checkout, order summary, pricing, and purchase surfaces are ecommerce-owned.
**Changes**: Migrate remaining reusable ecommerce presentation from `CatalogPage`, `ProductPage`, `CheckoutPage`, cart context consumers, and related runnable components. Keep state static or props-driven for Storybook; do not import runnable cart/auth contexts.

#### 4. Blog Blocks

**Files**:

- `apps/drafts/modules/blog/models/article/singlepage/*`
- `apps/drafts/modules/blog/models/category/singlepage/*`
- `apps/drafts/modules/blog/models/tag/singlepage/*`
- `apps/drafts/modules/blog/models/widget/singlepage/*`

**Why**: Article, category, tag, author/article list, and blog widget surfaces are blog-owned unless the display is purely a social profile surface.
**Changes**: Mark already-covered services/blog blocks as `replaced` in the matrix, then add any missing reusable blog pieces with the same static-data and Tailwind-only constraints from the services/blog migration spec.

#### 5. RBAC And Social Blocks

**Files**:

- `apps/drafts/modules/rbac/models/identity/singlepage/*`
- `apps/drafts/modules/rbac/models/subject/singlepage/*`
- `apps/drafts/modules/rbac/models/widget/singlepage/*`
- `apps/drafts/modules/social/models/profile/singlepage/*`
- `apps/drafts/modules/social/models/chat|thread|message|widget/singlepage/*` if pure social display blocks are needed

**Why**: Auth/account/subject orchestration is RBAC-owned, while profile/chat/message display belongs to social when it is not subject-auth orchestration.
**Changes**: Migrate login/register/forgot/account/profile/chat presentation into the correct boundary. For chat, keep host page recipes and RBAC subject-owned orchestration distinct from pure social display blocks, following the issue #164 research.

### Success Criteria

#### Automated Verification

- [x] Runnable manifest validation passes: `npm run drafts:validate`
- [x] Inventory refresh completes: `npm run drafts:ds:inventory`
- [x] Design-system validation passes: `npm run drafts:ds:validate`
- [x] Storybook build passes: `npm run drafts:storybook:build`

#### Manual Verification

- [x] Each migrated block has a story visible in the Storybook index.
- [x] Each migrated page recipe renders without router/context errors.
- [x] Startup overrides import/reuse the singlepage contract where applicable instead of copying whole runnable app components.

## Phase 4: Admin Panel And Admin-V2 Storybook Migration

### Overview

Move the admin panel/admin-v2 design surface into Storybook as a first-class catalog area. The runnable admin app must become source material for module-owned Storybook drafts, not the only place where admin layouts, lists, forms, drawers, relation management, and editor surfaces can be reviewed.

### Changes Required

#### 1. Admin Host Page Recipes

**Files**:

- `apps/drafts/modules/host/models/page/singlepage/*admin*`
- `apps/drafts/modules/host/models/page/startup/*admin*` where startup admin overrides are needed

**Why**: Admin route/page compositions belong to the host page model, while their inner surfaces belong to the modules that own the represented entities.
**Changes**: Add or update Storybook page recipes for the admin dashboard shell, module dashboard, model list, model edit, settings, and account surfaces. Compose module-owned admin blocks instead of copying the runnable router/app shell wholesale.

#### 2. Module-Owned Admin Blocks

**Files**:

- `apps/drafts/modules/*/models/*/singlepage/*admin-v2*`
- `apps/drafts/modules/*/models/*/startup/*admin-v2*` where startup overrides are needed

**Why**: Admin cards, tables, forms, empty states, toolbar/search/filter areas, and field groups are owned by the module/model they represent.
**Changes**: Create or update static Storybook blocks for reusable admin model surfaces. Keep the structure compatible with the admin-v2 playbook: model-organized surfaces, table/form separation, and no flat copied dashboard-only components.

#### 3. Relation Management Blocks

**Files**:

- `apps/drafts/modules/*/relations/*/singlepage/*admin-v2*`
- `apps/drafts/modules/*/relations/*/startup/*admin-v2*` where startup overrides are needed

**Why**: Relation management is a distinct admin-v2 responsibility and should not be hidden inside model detail presentation when the relation owns the reusable surface.
**Changes**: Add relation-level draft blocks only where the admin-v2 ownership model requires relation behavior to be represented separately. Document relation ownership in the migration matrix.

#### 4. Admin Supporting Surfaces

**Files**:

- `apps/drafts/modules/website-builder/models/widget/singlepage/*admin*`
- `apps/drafts/modules/rbac/models/subject/singlepage/*admin*`
- `apps/drafts/modules/rbac/models/identity/singlepage/*admin*`

**Why**: Some admin pieces are not model CRUD themselves: shell layout, settings/account, authenticated subject account areas, editor chrome, drawers, and reusable navigation/toolbars need appropriate module ownership.
**Changes**: Classify and migrate supporting admin presentation into the correct module-owned draft folders. Do not keep generic admin UI primitives as orphan components unless the migration matrix records a module-owned destination or explicit retention reason.

### Success Criteria

#### Automated Verification

- [x] Admin Storybook stories are included by `npm run drafts:storybook:build`.
- [x] Design-system validation passes: `npm run drafts:ds:validate`.
- [x] Runnable validation passes after admin cleanup: `npm run drafts:validate`.

#### Manual Verification

- [x] Storybook exposes representative admin dashboard, model list, model edit/form, settings/account, entity drawer, and relation management stories.
- [x] Admin stories do not require runnable router/auth/cart contexts to render.
- [x] Admin-v2 migration matrix rows all resolve to `migrated`, `replaced`, or `retained` with module ownership recorded.

## Phase 5: Runnable Cleanup And Retention

### Overview

Make `apps/drafts/runnable` reflect its intended role after reusable UI has moved into Storybook.

### Changes Required

#### 1. Remove Or Retain Superseded Runnable Sources

**Files**:

- `apps/drafts/runnable/singlepage/admin-v2/*`
- `apps/drafts/runnable/startup/singlepagestartup/*`
- `apps/drafts/runnable/singlepage/admin-panel-redesign-html/*`
- `apps/drafts/runnable/singlepage/examples/basic-html/*`

**Why**: Runnable should not silently remain the source of truth for reusable SPS design-system blocks.
**Changes**: For any runnable entry that is fully superseded, either remove the entry or trim it from active runnable discovery only after the migration matrix marks all meaningful sources as migrated/replaced. For retained entries, keep their manifest valid and record the standalone reason in `apps/drafts/runnable/README.md`.

#### 2. Final Matrix Status Update

**File**: `apps/drafts/inventory/runnable-migration.md`
**Why**: The matrix is the audit trail for the migration.
**Changes**: Update every row to final status: `migrated`, `replaced`, or `retained`. Include destination paths for migrated/replaced rows and reasons for retained rows.

### Success Criteria

#### Automated Verification

- [x] Runnable validation still passes: `npm run drafts:validate`
- [x] No runnable manifest points to deleted or broken entries.

#### Manual Verification

- [x] `apps/drafts/runnable/README.md` explains every retained runnable entry.
- [x] There are no unclassified runnable source components left in the matrix.

## Phase 6: Final Verification And Review Evidence

### Overview

Verify both the static tooling contract and the actual Storybook catalog surface before moving the issue to code review.

### Changes Required

#### 1. Verification Commands

**Files**: no direct file changes expected.
**Why**: The issue explicitly requires drafts validation, inventory, Storybook build, and Storybook index confirmation.
**Changes**: Run the verification suite and record results in the implementation handoff or PR description.

### Success Criteria

#### Automated Verification

- [x] `npm run drafts:validate`
- [x] `npm run drafts:ds:inventory`
- [x] `npm run drafts:ds:validate`
- [x] `npm run drafts:storybook:build`

#### Manual Verification

- [x] Start Storybook with `npm run drafts:storybook`.
- [x] Confirm `http://127.0.0.1:4320/index.json` returns the expected migrated story IDs.
- [x] Inspect representative singlepage, startup override, host page, admin-v2, ecommerce, blog, RBAC, and social stories.
- [x] Verify `dist/drafts/storybook/index.json` after build is not empty and includes migrated story entries.

## Implementation Evidence

Completed on 2026-07-01. The implementation stayed inside runnable and Storybook-backed draft code; no remote Figma work was performed.

Verification commands passed:

- `npm run drafts:validate`
- `npm run drafts:ds:inventory` (`modules=16 entities=156 variants=1836 covered=15`)
- `npm run drafts:ds:validate`
- `npm run drafts:storybook:build`

Storybook was started with `npm run drafts:storybook` at `http://127.0.0.1:4320/`. Browser verification confirmed `index.json` and representative preview iframe stories. A final local HTTP check returned `200` with 153 Storybook entries and no missing required IDs, including:

- `modules-host-models-page-singlepage-admin-dashboard--default`
- `modules-host-models-page-singlepage-chat-default--default`
- `modules-host-models-page-singlepage-admin-model-edit--default`
- `draft-internals-startup-models-widget-startup-default--override`

The Storybook index includes runnable route coverage for `/chat`, `/profile`, `/admin`, `/admin/settings`, `/admin/settings/account`, `/admin/:moduleSlug`, `/admin/:moduleSlug/:modelSlug`, `/admin/:moduleSlug/:modelSlug/:id`, `/services`, `/services/:slug`, `/checkout`, `/login`, `/forgot-password`, `/register`, `/blog/:slug`, and `/blog/author/:authorSlug`.

The Storybook index also includes module-owned coverage for social chat/thread/message/widget blocks, ecommerce admin-v2 product list/form blocks, blog admin-v2 article list, RBAC admin-v2 subject settings, website-builder admin-v2 navigation/editor widgets, and the ecommerce `products-to-attributes` relation manager.

## Testing Strategy

### Unit Tests

No new unit tests are planned unless implementation changes validation utilities. If `tools/drafts/design-system/validate.ts` gains story-glob validation, add focused coverage only if the repo already has a local test harness for drafts tooling; otherwise rely on fixture-backed `npm run drafts:ds:validate` behavior.

### Integration Tests

Use the existing drafts commands as integration tests:

- `npm run drafts:validate` confirms runnable manifests remain coherent.
- `npm run drafts:ds:inventory` confirms production variant inventory and draft coverage can be regenerated.
- `npm run drafts:ds:validate` confirms manifests, paths, local validation metadata, and new story filename checks.
- `npm run drafts:storybook:build` confirms Storybook compiles the migrated catalog.

### Manual Testing Steps

1. Run Storybook locally on `127.0.0.1:4320`.
2. Fetch `http://127.0.0.1:4320/index.json` and confirm migrated story IDs are present.
3. Open representative stories in the Storybook preview iframe.
4. Check desktop and mobile widths for page recipes with dense admin and content layouts.
5. Confirm retained runnable entries still run through `npm run drafts:dev -- <entry>` when they remain documented as standalone.

## Performance Considerations

Keep migrated Storybook components static and props-driven. Avoid bringing runnable contexts, router state, rich editor runtime, Radix/embla, or SDK data flows into the catalog unless an owning module already has an accepted draft pattern for that behavior. Storybook build may continue to warn about large chunks; the implementation should avoid adding avoidable client dependencies that make that worse.

## Migration Notes

- Use the migration matrix as the source of truth during implementation and review.
- Preserve user or agent changes already present in the working tree; do not revert unrelated workflow artifacts.
- Keep `apps/drafts/runnable` valid until cleanup is intentional and documented.
- Regenerating `apps/drafts/inventory/modules.generated.json` is expected after adding/removing block manifests; review the diff to ensure coverage changed only because of intended draft changes.
- Relation-level draft folders are allowed by the docs and schema. Add them only when the reusable surface is genuinely relation-owned.
- Do not move anything into Figma during this issue. After Storybook is running and the user confirms the migration is visually and structurally correct, create a separate Figma follow-up if needed.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-201.md`
- Process log: `thoughts/shared/processes/singlepagestartup/ISSUE-201.md`
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-201.md`
- Related Storybook migration spec: `thoughts/shared/plans/services-blog-storybook-migration.md`
- Admin-v2 ownership playbook: `thoughts/shared/research/singlepagestartup/ISSUE-145-admin-v2-playbook.md`
- Chat/profile boundary research: `thoughts/shared/research/singlepagestartup/ISSUE-164.md`
