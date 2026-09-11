## Summary

Studio now keeps client facts and product work separate and lets downstream projects define their own product pages and Design layouts. This removes unused context and fixed presentation assumptions while preserving explicit `singlepage` → `startup` inheritance.

## Changes

- Replace Portfolio, the standalone Evidence register, global Research, and workspace knowledge profiles with client-request documents and product-local Research/Sales. Keep reusable agent methods in `.agents` and update the workflow, roles, templates, and provider entry points.
- Add document confirmation and review states (`unconfirmed`, `confirmed`, `changed`, `stale`). Track semantic upstream changes without importing another document's content or automatically granting approval; display resolved status without repeated headings and badges.
- Move technical workspace code and configuration into `utils`. Restore Code Framework and AI Chat as independent products, open Product Overview first, and keep presentation content within each product.
- Introduce explicit `products/<layer>/catalog.yaml` catalogs. An empty startup catalog inherits the framework catalog; any startup product replaces the entire catalog, preventing unrelated framework products and files from leaking into a client project.
- Support nested product sections containing Markdown, React, HTML, images, and other media. Allow Design to reorder or replace built-in sections, add custom sources, or use a complete project-owned React template through `design/<layer>/layout.yaml`.
- Add the shared browser PDF export library and connect it to Studio presentations, including custom React decks. Keep extension fixtures outside the live workspace and exclude Studio artifacts from the production Docker context.

## Verification

- [x] `npm run studio:presentation:test` — 90 tests and 423 assertions passed.
- [x] `npx tsc --project apps/studio/tsconfig.json --noEmit`.
- [x] Workspace validator with `--self-check` for both `singlepage` and `startup`.
- [x] Studio manifest and design-system validators.
- [x] `npm run singlepagestartup:github:test` — 5 tests passed.
- [x] PDF library Nx targets `tsc:build`, `eslint:lint`, and `jest:test` — 19 tests across 3 suites passed.
- [x] Main Storybook build and isolated product/Design extension fixture builds.
- [x] Browser checks: both products and their independent presentations; nested Markdown/React/HTML/media; relative HTML assets and links; custom deck PDF export; reordered and custom Design sections; complete template replacement; document statuses; narrow viewport layout and console checks.

## Notes

- Downstream repositories must update references to relocated workspace utilities/indexes/configuration and use the new layer-local product catalog paths. Removed Portfolio/Evidence paths have no compatibility layer.
- A populated startup Design layout replaces the entire base layout. Markdown section inheritance and style cascading remain independent; custom files resolve only from the selected layout layer.
- Existing confirmations are not new approvals. Agents must review affected documents for semantic consistency after upstream decisions change.
- Browser PDF export rasterizes rendered pages; exported text is not selectable. No database migration is required.
- Related to #222.
