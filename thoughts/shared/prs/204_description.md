# PR Description Template

## Summary

Synchronizes the `apps/drafts/modules` Storybook catalog with the Single Page Startup Figma library so future design-to-code updates can resolve module, component, variant, and screenshot references directly from metadata.

## Changes

- Added or completed Figma metadata across draft module manifests and paired `figma.json` files, including Figma node IDs, variant IDs, Storybook reference IDs, screenshot counts, and verified sync status.
- Added the missing CRM draft module catalog entries, stories, demo data, and metadata so the Storybook/Figma module split matches the rest of the catalog.
- Preserved existing `website-builder` components in Figma and only created missing variants/references.
- Added `figma` schema support and stricter design-system validation for local metadata invariants.
- Regenerated the draft module inventory and documented the Figma sync ledger and QA results.

## Verification

- [x] `npm run drafts:ds:validate`
- [x] `npm run drafts:ds:inventory`
- [x] `npm run drafts:storybook:build`
- [x] Figma component/reference QA: 110 Storybook reference rows populated with 129 screenshots.
- [x] Figma overlap QA: module pages and reference boards checked after layout fixes; created review boards do not overlap existing components.

## Notes

- Existing Figma `website-builder` components were not modified unless the requested variant/reference was missing.
- Three unrelated local `Component.tsx` edits were left unstaged and are not part of this PR.
