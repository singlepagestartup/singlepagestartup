---
repository: singlepagestartup/singlepagestartup
date: 2026-09-14
kind: implementation-knowledge
scope: Workspace directory ownership, startup reuse and presentation compatibility
---

# Directory and startup audit

The operator requested review and correction of the directories changed during
Workspace business/design/product work, with special attention to the confusing
`models/framework-service/model.md` entry and inherited startup functionality.
No business content revision, approval change, commit or publication was requested.

## Ownership findings and cleanup

- `products/<layer>/models/<id>/model.md` intentionally owns shared business
  economics. `framework-service` serves Code Framework and AI Chat; it is not
  a third product, a backend module or a server. Keeping it once avoids duplicate
  funding/resources/costs. `models` is a reserved catalog namespace, already
  rejected as a product ID by `utils/products/catalog.ts`.
- Product folders keep overview Markdown/YAML, detailed Research, Website,
  Marketing Creative, Presentation and optional Content. Overview `.md` beside
  a detail folder is intentional; generated Sales pages are not duplicated files.
- Shared components/resolvers/export engines stay under `workspace/utils/`.
  Project-specific styles/assets remain under workspace styles/assets and the
  selected product layer. CF presentation/types.ts legitimately describes its own
  authored copy/visual schema; it does not duplicate the shared slide engine.
- Shared agent methods/templates stay in `.agents/`; Claude/Codex discovery
  adapters keep their provider locations. Tests and synthetic browser fixtures
  stay in `tools/studio/`, outside client business sources.
- Removed empty obsolete `workspace/business/`. Added products/README.md and
  updated the main Workspace file map to explain these boundaries and startup
  reuse. No ID/path migration of existing business documents was necessary.

## Inheritance and real repairs

Empty startup resolves the complete base catalog as reference. A populated
startup catalog replaces models/products together. Catalog/page/source resolvers
use the selected layer and reject missing files; no per-product base fallback.
The shared Sales/CJM, Research tree, Text/Layout, artboards and MP4 engines have
no framework-product imports. Example layouts properly use their own layer's
copy/style/assets and are not mandatory downstream compositions.

Found a compatibility regression: raw custom core presentations satisfying the
existing data-slide-id contract lost PDF because controls had moved exclusively
inside the shared slide adapter. PresentationWorkspace now owns the outer PDF
control for both raw and shared decks. PresentationReview supplies its complete
export deck. PresentationPdfDownload prefers that dedicated export deck, excluding
the selected visible preview; raw decks continue using their mounted slides.
Full slide navigation/Text/Layout/PNG requires the shared ProjectPresentation
adapter; arbitrary rendered HTML is not reverse-extracted into editable copy.

The old browser fixture borrowed the framework's first product. Replaced that
coupling with an independent startup course: own model, Product, Sales, Research,
material copy, cover/motion and presentation data. NestedPages verifies raw-deck
compatibility; SharedSlides verifies the shared adapter. Virtual startup static
URLs map only to test files; real startup/catalog.yaml remains empty.

## Verification

- `npm run studio:validate` passed, including the new BDD regression cases.
- `npx tsc --noEmit -p apps/studio/tsconfig.json` and `git diff --check` passed.
- Tests cover raw startup PDF availability and exact full-deck selection despite
  a duplicate selected preview, alongside existing atomic-inheritance and layer
  isolation tests.
- A temporary Chrome checked independent startup Sales Markdown isolation,
  Research links, Text/Layout, 640×360 PNG and MP4, raw and shared presentations,
  and a 375px viewport without document overflow. No SPS business copy appeared.
- Actual H.264 MP4: 640×360, 30fps, 30 frames. PDF inspection confirms two
  240×135pt pages for raw startup, two 480×270pt pages for shared startup, and ten
  pages for the current framework presentation while Layout is selected.
- Browser helper `/tmp/sps-startup-inheritance-qa.ts`; exported review evidence
  `/tmp/sps-startup-inheritance-qa/`. These are temporary verification outputs,
  not runtime dependencies or editable project sources.

An initial outer-PDF version exported the selected preview as a third page.
Actual pdfinfo inspection caught this despite correct hidden-deck DOM counts;
the dedicated-deck selector and regression test now cover it. Always inspect the
exported page count, not only mounted-source counts, when changing export scope.
