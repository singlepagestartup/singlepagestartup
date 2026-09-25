---
repository: singlepagestartup/singlepagestartup
date: 2026-09-13
scope: Studio product material authoring, previews and exports
---

# Reusable product material workspaces

## Operator intent

Keep producing and revising product materials in the same project conversation.
Marketing Creative needs actual covers, articles, posts and storyboards with
Text/Layout representations. Presentation needs individual slide selection,
source text, editable layouts and export. Product Content stays free-form, with a
Code Framework README as the current example. Move confirmation into the page
header. Qualify research finding IDs by source layer and product.

The operator supplied a working motion example at
`/Users/rogwild/code/flakecode/m2commerce/apps/studio/workspace/products/startup/course-self-storage/presentation/MotionDesign.tsx`.
Its `VideoMotionDesign.tsx` uses Remotion Player and browser rendering. Adopt the
reusable approach, without importing that checkout's business content or assets.

## Implementation boundaries

- `workspace/utils/components/ProductPages.tsx` owns the shared tree, Text/Layout,
  header confirmation and Markdown download without review frontmatter.
- `workspace/utils/components/PresentationWorkspace.tsx` owns slide selection and
  Text/Layout. `ProjectPresentation.tsx` retains direct slide/full-deck export.
  A separate hidden deck keeps every slide available for PDF, independently of
  the selected slide. The selected artboard exports PNG.
- `workspace/utils/media/ArtifactFrame.tsx` owns fixed dimensions and responsive
  display. `png.ts` reuses the existing PDF capture adapter to embed original
  images and fonts. UI controls never enter the exported artboard.
- `workspace/utils/media/MotionPreview.tsx` owns playback, capability checks,
  progress, cancellation and browser H.264 MP4 download. Remotion, Player and
  web-renderer use exactly 4.0.505. Third-party licensing remains separate; see
  the utility README and https://www.remotion.dev/license.
- Project-specific copy and compositions live under
  `products/singlepage/singlepagestartup/marketing-creative/` and `content/`.
  The catalog registers each pair. Static and animated walkthrough covers
  consume the same Markdown and raw HTML artwork. Original approved photographs
  and opaque illustration assets are reused without modifying their masters.
- The proposed README is product content; the actual root README is untouched.
- `tools/studio/products/research-ids.ts` validates the
  `<product-prefix>-<SPS|S>-<number>` identity, prefix ownership,
  duplicates and references. Ordinary model names such as GPT-4 are not IDs.

## Shared downstream contract

`product-models.md`, `pipeline-reconciliation.md`, `pre-development.md`, the
Creative template and Studio/media READMEs describe these shared capabilities.
Project files own copy and layout; shared utilities own navigation and export.
An empty startup catalog still inherits the base reference catalog; a populated
startup catalog stays an atomic replacement. No project must reimplement the
export engine. Free-form Product Content is optional; README is one example.

Research identifiers were changed mechanically, with no new market conclusions.
Reviewed dependency snapshots were refreshed for affected current documents;
existing Strategy, Brand and Design body fingerprints and confirmations remain
intact. New material sources remain unconfirmed for operator review. Existing
AI Chat Website/Creative/Presentation require their own later content revision;
this work does not clear their pre-existing stale state.

## Verification

- `npm run studio:validate`: passed, including 124 tests across 17 files and
  5 GitHub reconciliation tests.
- `npx tsc --noEmit -p apps/studio/tsconfig.json`: passed.
- `git diff --check`: passed.
- Separate local Chrome verified Website header status, tree selection,
  Marketing Text/Layout, README preview and Markdown download, slide navigation,
  selected-slide PNG and complete-deck PDF. Mobile widths at 375px had no
  horizontal overflow in the cover or slide workspace.
- Actual PNG downloads: 1280×720 walkthrough, 1200×630 repository,
  1080×1920 short cover, 1080×1080 post, and 1600×900 selected slide.
  Fonts and images were inspected in the exported files; no text overflow or
  missing images in the four creative artboards.
- Actual MP4: H.264, 1280×720, 30fps, 90 frames. Browser metadata and `ffprobe`
  agree; a decoded middle frame retains the composed text, fonts and photograph.
- Actual browser-generated PDF: 10 pages, 1200×675pt per page. First page rendered
  and visually inspected; selected slide does not limit the PDF to one page.
- Temporary verification outputs: `/tmp/sps-materials-qa-2/`; local CDP script:
  `/tmp/sps-materials-browser-qa.ts`. These are review outputs, not runtime inputs.

No publication, repository commit or push was performed.

## Material language and compact controls

The operator chose compact IDs such as `CF-SPS-09` for framework Research and
`CF-S-09` for a startup. Each Research source owns its `finding_prefix`; the
catalog-wide validator checks unique prefix ownership and duplicate findings.
The download control displays an icon and `.md`, retaining its full accessible
name. Customer-facing English copies now use “Run the project on your machine”
consistently in the offer, sales journey, Website, Creative and slides.

Multilingual authoring follows the existing `en`/`ru` internationalization
configuration and keyed localized fields used by Website Builder. The Website
specification and shared agent contract cover complete locale copies, stable
semantic keys and vocabulary consistency. This change establishes that authoring
contract; it does not add an unimplemented language switch to Studio. Russian
review translations are supplied in the conversation before operator approval.

Local Chrome verified the compact button, a downloaded Markdown with no review
frontmatter, and an entirely English landing Text/Layout CTA. Outputs are in
`/tmp/sps-cf-language-qa/`.
