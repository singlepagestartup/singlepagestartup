## Summary

Workspace Studio now supports a continuous path from business planning to customer-facing materials. Operators can review each Sales segment and its Research, refine page or slide text beside its layout, and export materials without moving between unrelated tools. The same methods and utilities are available to projects built on the framework.

## Changes

- Organize products around catalog v2 and shared Operations & Economics models. Retire standalone Business after moving its facts to their owners; preserve atomic startup inheritance, custom pages and legacy navigation.
- Make Brief self-contained and Strategy a complete marketing direction. Treat the product set as a prospective business plan, with engineering verification outside business completion gates. Keep visual reference files and descriptions; refresh the framework's photography and illustration examples.
- Add Sales v2 with stable Product segment IDs, decision profiles, motivations, objections, acquisition routes and customer-perspective CJMs. Add reusable Research segment/competitor pages, evidence verdicts, corpus-wide finding IDs and coverage validation. Prefer five-to-seven-minute pages without discarding material evidence to meet a hard cap.
- Add shared page trees, Text/Layout representations and Markdown downloads for Website, Marketing Creative and optional Product Content. Add editable covers, articles, posts, storyboards and optional Remotion playback/browser MP4 export.
- Add per-slide presentation review, PNG and full-deck PDF. Preserve custom raw-deck PDF and exclude duplicate selected previews from the full export.
- Keep status badges outside exported layouts. Track Sales hypotheses as observed inputs to Research without creating recursive approval dependencies. Preserve pending confirmations and stale dependent materials.
- Document directory ownership and verify shared functionality using an independent startup fixture with its own model, customers, copy and media.

## Verification

- [x] `npm run studio:validate`: 141 Studio tests and 5 GitHub reconciliation tests.
- [x] `npx tsc --noEmit -p apps/studio/tsconfig.json`.
- [x] `npm run studio:storybook:build`.
- [x] `git diff --check` and validated downstream trailers in the actual commit message.
- [x] Real Chrome: independent startup Sales/Research navigation, selected-segment Markdown, Text/Layout, 640×360 PNG and H.264 MP4, and a 375px viewport without overflow.
- [x] Exported PDFs inspected: two pages for raw startup, two for shared startup, and ten for the framework deck, without duplicate selected previews.

## Notes

Business materials retain their review states; publication of this code does not approve unreviewed business decisions. MP4 uses browser WebCodecs and requires a supported browser. The pinned Remotion packages have separate licensing, documented in the media utility README. Storybook builds successfully with a bundle-size advisory.

## Downstream migration

A clean merge brings shared utilities and templates, but cannot rewrite project-owned business meaning or layouts. Adapt only the child's owned sources, preserving facts, references, assets, custom content and confirmation history.

1. For legacy Business/catalog structures, follow `tools/studio/products/MIGRATION.md`. Recover each material statement from the child's prior sources; assign it to Brief, Product, shared model, Sales or Research before removing obsolete files and bindings. Declare complete catalog v2 product/model ownership; an empty startup continues to inherit as reference, while a populated startup replaces the whole catalog.
2. Reconcile owned Brief, Strategy, Brand, Design and product documents with the current templates. Preserve visual reference categories and analysis, current quantities and source attribution. Keep intended outcomes distinct from measured results and engineering checks; do not copy framework audiences, prices, channels or generated assets into client projects.
3. Transfer Sales v1 intake to v2 using stable Product `customer_segments` and complete profiles, acquisition and CJMs. Organize Research summary/segment/competitor pages under the audit contract, preserve material evidence, cover every route and journey step, and update all citations when assigning compact product/layer finding IDs.
4. Pair material copy/layout in the catalog and use shared page, artboard, motion and presentation utilities. Keep project compositions local. Custom decks retain `data-slide-id` PDF compatibility; full slide navigation and PNG use the shared adapter with explicit slide text. Preserve image quality/backgrounds and consistent language across views and exports.
5. Install the updated lockfile normally; keep Remotion packages on the same exact version and check their separate license for the intended use. Inspect owned review/index/workflow bindings, including observed Sales inputs, preserve pending approvals, and mark materially affected consumers stale rather than copying approval hashes.
6. Run the validation, TypeScript and Storybook commands above. Check the child's complete catalog, every segment and Research page, links, review states, Text/Layout and exports, exact PDF page counts, custom decks and mobile width. Confirm framework business copy does not leak into owned startup materials.

Both implementation commits retain detailed `Downstream-*` trailers so adaptation instructions remain available in local Git history.
