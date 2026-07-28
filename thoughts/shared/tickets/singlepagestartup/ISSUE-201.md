---
repository: singlepagestartup
issue_number: 201
status: Research Needed
created: 2026-06-30
---

# Issue: Migrate remaining runnable drafts into the Storybook module catalog

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/201
**Status**: Research Needed
**Created**: 2026-06-30
**Priority**: medium
**Size**: large
**Type**: refactoring

---

## Problem to Solve

`apps/drafts` is becoming the SPS design-system workspace. Part of the imported runnable UI has already been moved from `apps/drafts/runnable` into `apps/drafts/modules` and reshaped around SPS module/model boundaries, Storybook stories, Tailwind, manifests, and Figma metadata. The remaining runnable components still need to be migrated or intentionally classified so Storybook can become the primary place for maintaining design-system blocks, creating new layout variants, and letting downstream startup projects override `singlepage` components/functions through the `startup` layer.

The migration must also verify that every reusable block, page, and model-facing draft is assigned to the correct module and model/relation according to `libs/modules/*`, not only copied into Storybook by visual similarity.

## Key Details

- Current draft contract is documented in `apps/drafts/README.md`: `apps/drafts/modules` mirrors `libs/modules` as `<module>/models|relations/<entity>/<singlepage|startup>/<block-id>`.
- Storybook loads stories from `apps/drafts/modules/**/*.stories.tsx`.
- Runnable sources still exist under:
  - `apps/drafts/runnable/singlepage/admin-v2`
  - `apps/drafts/runnable/startup/singlepagestartup`
  - `apps/drafts/runnable/singlepage/admin-panel-redesign-html`
  - `apps/drafts/runnable/singlepage/examples/basic-html`
- Existing runnable React prototypes include app shells, routes, mock data, layouts, page components, entity drawers, auth/cart contexts, editor components, and shadcn-style UI primitives that must be either migrated, replaced by existing draft blocks, or explicitly left as standalone runnable-only code with a reason.
- Existing Storybook module coverage already includes `blog`, `ecommerce`, `host`, `rbac`, `social`, `startup`, and `website-builder` draft folders, but `apps/drafts/inventory/modules.generated.json` still reports broad uncovered production variant surface from `libs/modules`.
- The target Storybook role is broader than screenshot review: it should support the design system, new variant mockups, and project-specific startup overrides without mixing reusable SPS blocks with standalone imported prototype code.

## Implementation Notes

- Start with an inventory of runnable files excluding `node_modules`, generated lockfiles, and package-manager artifacts.
- Map remaining runnable components into explicit destinations before moving code:
  - full route/page compositions -> `apps/drafts/modules/host/models/page/...`
  - website content sections, navbars, footers, buttons, feature blocks -> `apps/drafts/modules/website-builder/models/...`
  - products, cart, checkout, order summaries -> `apps/drafts/modules/ecommerce/models/...`
  - articles, categories, tags, author/article widgets -> `apps/drafts/modules/blog/models/...`
  - login/register/reset/account/subject surfaces -> `apps/drafts/modules/rbac/models/...`
  - profile/byline/comment/profile-owned surfaces -> `apps/drafts/modules/social/models/...`
  - project-specific overrides -> `startup` layer with the same source contract where applicable.
- Validate ownership against the actual `libs/modules/<module>` model/relation tree and relevant README files. Do not invent draft-only modules when an SPS module/model already owns the concept.
- Keep draft components presentation-only and static-data driven. Do not import from `apps/api`, production SDK packages, React Query, or production module runtime code.
- Use Tailwind and existing `apps/drafts/runtime/styles.css` / token conventions instead of standalone prototype CSS where practical.
- Every migrated reusable block/page must include the expected story file plus `block.manifest.json` or `page.manifest.json`, and Figma metadata where the current draft contract expects it.
- Keep `runnable/` only for standalone imported prototypes that are intentionally not part of the reusable Storybook module catalog. Document any retained runnable entries and why they remain.
- Verification should include:
  - `npm run drafts:ds:inventory`
  - `npm run drafts:ds:validate`
  - `npm run drafts:storybook:build`
  - browser or shell confirmation that Storybook exposes the migrated stories through `index.json` on `127.0.0.1:4320` when running `npm run drafts:storybook`.
