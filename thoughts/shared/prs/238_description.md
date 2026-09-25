## Summary

Studio review pages can now be downloaded as portable Markdown and standalone HTML. This makes complete business, brand, design, product, Research, and Sales context easier to move into ChatGPT Projects or review outside Storybook while keeping the implementation shared by the singlepage, startup, and resolved default projections.

## Changes

- Add shared `workspace/utils` helpers and download controls for canonical Markdown and rendered standalone HTML.
- Add `.md` and `.html` downloads to Brief, Strategy, Brand, Design, core product documents, Sales, and nested product pages.
- Remove review frontmatter from Markdown without flattening headings, tables, lists, or links; inline active styles and same-origin images into HTML snapshots and omit Studio export controls.
- Include product, page, and full human-readable customer-segment context in downloaded file names.
- Add BDD coverage and document the portable export behavior and layer ownership.

## Verification

- [x] `npm run studio:validate` — 144 Studio tests and 5 GitHub reconciliation tests passed.
- [x] `npm run studio:storybook:build` — production Storybook build completed successfully.
- [x] Browser review — verified Markdown and HTML controls on Product, both Sales segments, Brand, and Design, including contextual Sales file names.

## Notes

No schema, database, or content migration is required. Existing Storybook extensionless-import, bundle-size, and third-party direct-eval warnings remain unchanged.

## Downstream migration

The shared exporter is inherited automatically. A child project only needs adaptation when it owns overrides of `ArtifactBrowser`, `DesignRenderer`, `DocumentHeader`, `ProductCatalog`, `ProductPages`, Sales composition, or another document/page renderer. Keep the exporter in `workspace/utils`; connect applicable owned renderers to `DocumentDownloads` with resolved Markdown and either the rendered target or owned raw HTML URL, and pass product/page/full segment names for contextual files. Do not copy the exporter into `products/startup` or `products/singlepage`. Verify with `npm run studio:validate`, `npm run studio:storybook:build`, and downloads from the singlepage, startup, and default projections.
