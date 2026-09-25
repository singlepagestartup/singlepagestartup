---
repository: singlepagestartup/singlepagestartup
date: 2026-09-11
status: implemented-locally
---

# Product preservation and independent presentation content

The client confirmed two products: Code Framework (`singlepagestartup`) and
AI Chat (`ai-chat`). Startup's first product must replace the entire singlepage
catalog. Documents own their content; dependency statuses represent semantic
impact review, not runtime imports or automatic text substitution.

## Cause and correction

The catalog introduced in `838f6e6dc1` already contained only Code Framework.
`40c799f86c` retained the AI service separately in Portfolio as a future
acquisition program. The subsequent Portfolio removal preserved that earlier
classification and deleted the service's separate Research instead of preserving
its product identity. Strategy did not execute a deletion. The earlier response
attributing disappearance to Strategy was inaccurate.

This supersedes the product-membership interpretation in the products-only
report. Restored AI Chat with its own Research, Sales, Product, Website, Creative,
and Presentation sources. Restored historical facts and explicitly unselected
terms; no fresh market validation, commercial offer, launch, or whole-document
approval was invented. Brief and Business now name both products. Strategy's
experiment and thresholds remain; only catalog-exclusion statements were repaired.

## Implementation

- Catalog selection remains atomic: empty startup inherits both framework
  products; the first startup product replaces all of them and all source paths.
- Shared `ProjectPresentation` now provides slide layout/export only. Existing
  Code Framework composition moved into its own product folder; its 13-slide
  content was captured once into `presentation/data.yaml`. AI Chat owns six slides.
- Each entry declares `presentation_data`; the loader validates `product_id`
  and passes only that source's `content` to the selected React component.
  The old shared Strategy/Business/Brand/Design extraction was removed.
- Presentation owns confirmation and semantic review metadata. Its local React
  entry point is fingerprinted as another review input. Shared review rules still
  flag Business price changes without rewriting Product or Presentation text.
- Export discovers slide IDs/count from the selected rendered deck rather than
  importing the Code Framework slide list. Unknown requested products fail
  explicitly rather than silently exporting the first product.
- Workflow, roles, templates, AGENTS/CLAUDE, and Studio guides now prohibit
  removing confirmed products because of experiment priority or migration.

## Verification and remaining review

80 Studio tests pass, including the two live framework products, complete
replacement by one startup product, own presentation source validation, and
semantic price-change propagation without content mutation. Studio TypeScript,
workspace validator/self-check, and production Storybook build pass. Export
script compiles. Browser checks show both tabs, independent 13/6-slide decks,
no slide-content overflow, and no errors on the restored AI Chat deck.

The source cursor is `10-strategy / in_progress` for product Research and
Strategy semantic review after correcting scope. Existing approvals are retained
as historical metadata; stale dependencies and unconfirmed AI Chat drafts remain
visible. This restoration does not complete commercial research, select new
terms, approve Design, or publish either product. No commit or push was performed.

## Subsequent workspace cleanup

The operator requested only current project files and inheritance support in
workspace. Removed 22 files (150 → 128): two retired agency/role comparison
documents, three generic knowledge guides and their empty startup siblings,
the unused `resolveLayeredComponent` helper and its tests, and 12 `.gitkeep`
placeholders. Removed their index entries, imports/exports, dependency edges,
obsolete review fingerprints, raw import glob, and test-command reference.
Professional methods remain in canonical roles; optional knowledge is created
only for a material project decision, not as predefined generic folders.

Kept both products, primary singlepage/startup documents, the required Decision
Profile, workflow/GitHub cursors, rendering code, styles, and referenced assets
including client intake and font licenses. All asset files have a registry or
source reference. Empty indexed startup files still implement inheritance;
optional product/asset directories are created with their first real file.

Compared all 44 retained resolved review documents across both layers with a
pre-cleanup snapshot: body fingerprints, approval metadata, review states, and
remaining dependency fingerprints are unchanged. The 77 remaining tests,
TypeScript, workspace validator (21 entries, 13 imports/exports), and Storybook
build pass. Browser checks cover both products in default and singlepage and
the expected empty startup view. Catalog tests still verify full replacement
by the first startup product.

## Decision Profile retired by the operator

The operator subsequently removed the separate Decision Profile. This supersedes
the required-profile retention above. Workspace now has 126 files and no
`knowledge/` directory. Removed both profile sources, the profile template, index
entries/imports/exports, Business's obsolete dependency fingerprint, and the
loader's special profile kind. Business still depends directly on Brief.

Reusable domain checks and stage criteria are consolidated in the existing
`.agents/workflows/pre-development.md` and all seven canonical roles. Updated
contracts, templates, AGENTS/CLAUDE, and Studio guides to read project questions
from their owning documents and approval from source metadata. The migration
contract handles old profile files and cursors without recreating them or
treating a partial profile approval as whole-document confirmation.

Existing profile facts, unknowns, and limits were already present in Brief,
Business, Strategy, Design, and product documents. Preserved the unique method
source links beside their existing application and limitations in Code Framework
Product Overview; removed Strategy's obsolete profile instruction comment.
No project decisions or approvals were invented, and the stage cursor is unchanged.

Compared 42 retained resolved documents across both layers: all confirmation
metadata and resolved states are unchanged. Only the Product method links and
Strategy comment changed body fingerprints. The 77 tests, Studio TypeScript,
Storybook build, and validator self-check in both layers pass. Self-check fixtures
now verify direct Business-to-Brief dependency routing; generic `knowledge` is
not a layered kind and must not substitute for the removed profile fixture.
Browser checks confirm Brand and Business still render with their prior states.

## Workspace utilities consolidated

Moved 103 files into `apps/studio/workspace/utils` without changing the total
of 126 workspace files. The workspace root now contains README plus `brief`,
`business`, `strategy`, `brand`, `design`, `products`, and `utils`. Technical
components, stories, styles, loaders, configuration, indexes, cursors, and assets
live in utils. The operator explicitly retained product Sales YAML and
Presentation data YAML beside each product's Markdown documents.

Updated source imports, raw document globs, catalog resolution, asset paths,
review tooling, export paths, tests, and workflow documentation. Catalog data
paths resolve under `products/<layer>`; React entry points resolve under
`utils/products/<layer>`. Public `/workspace-assets` URLs remain stable.

Verified every move and byte equality for all 57 moved asset/license files.
Only Asset Index and Code Framework Marketing Creative body fingerprints changed
because their asset paths changed. Refreshed three previously matching Assets
review fingerprints after this structural move; existing mismatches remain.
Approval metadata and resolved document statuses are unchanged.

All 77 Studio tests, five GitHub preflight tests, Studio TypeScript, validator
self-checks for both layers, production Storybook build, and diff whitespace
checks pass. Restarted the local Storybook server for its changed static asset
directory. Browser verification covers both products, their independent 13/6-slide
presentations, all nine Design images, and local font declarations/loading.

## Assets, Products, and Styles restored to the workspace root

The operator revised the directory boundary: `assets/`, `products/`, and
`styles/` belong at the workspace root because they are working project
materials. This supersedes their placement in utils above. Moved 74 files;
the total remains 126. Merged the product catalog, loaders, tests, and React
entry points back into the existing product document tree. Shared components,
stories, review helpers, configuration, indexes, and cursors remain in utils.

All catalog document and component paths now resolve under `products/<layer>/`.
Updated imports, globs, asset registry paths, staticDirs, tests, and canonical
directory instructions. Verified all 57 asset/license files are byte-identical.
Refreshed five already-reviewed dependency hashes for path-only Asset Index and
presentation-renderer changes. Approval records and all 42 resolved document
states across both layers remain unchanged.

The 77 Studio tests, TypeScript, both validator self-checks, production Storybook
build, and diff checks pass. Restarted Storybook on its existing port for the
static directory change. Browser checks confirm product switching, independent
13/6-slide presentations, all nine loaded Design images, local fonts, and no
console errors in the verification tab.

## Explicit product layer directories

The operator requested the same explicit base/extension boundary used by
`libs/modules`. Verified the existing pattern in Blog Article:
`frontend/component/src/lib/variants.ts:1` combines singlepage/startup registries,
`startup/variants.ts:1` retains an empty extension registry, and
`sdk/client/src/lib/startup/index.ts:3` reuses the base API. Host Metadata's
`backend/app/api/src/lib/service/startup/index.ts:3` extends its base service.

Moved product catalogs, byte-for-byte, into
`products/singlepage/catalog.yaml` and `products/startup/catalog.yaml`. Both
source directories now exist with real files. Individual product folders remain
layer-owned; there are no duplicate framework products under startup. Unlike
module variant-map merging, product resolution intentionally remains atomic:
empty startup inherits all products, and its first product replaces the base
catalog completely, as the operator previously required.

Updated source imports/globs, indexes, tests, and canonical documentation.
The live-catalog test now reads the actual startup catalog; review fixtures use
the colocated paths and still verify isolation from unavailable base product
documents. Both catalogs and all 42 resolved document bodies/statuses remain
unchanged. The 77 Studio tests, TypeScript, both validator self-checks, Storybook
build, and diff checks pass. Browser checks show both inherited products and the
empty startup projection with its new catalog path; no console errors occurred.

## Product utilities and extensible page trees

Moved the seven shared TypeScript helpers/tests from the products root into
`workspace/utils/products/`. `products/` now contains only `singlepage/` and
`startup/`; product-specific JSX/TSX, HTML, media, and nested files remain in
their owning product directory. No working product content was relocated.

Added optional catalog `sections` with titled `pages` and recursive `children`.
Core IDs augment the existing six tabs, retaining their document/deck as
Overview; custom IDs add numbered tabs. Explicit declarations keep helper files
out of navigation. Page sources must stay in their product folder. The resolver
uses only the selected layer and rejects missing files/default component exports.
Studio's CLI validator also checks declared page files in the selected catalog.

JSX/TSX pages use default component exports at arbitrary nested paths; existing
Presentation `{ content }`, Website, and legacy Content entry points still work.
HTML previews use an isolated iframe with a stable `/workspace-products` static
root, so relative image and nested HTML links survive development and builds.
Markdown resolves relative media/links from its source directory. Images, video,
audio, and other files receive previews or a download link. Additional React
decks opt into the existing mounted-slide PDF contract with `export: pdf`.

The browser fixture lives outside workspace under `tools/studio/products` and
has its own reproducible Storybook configuration. Verified: HTML relative assets
and nested links, interactive JSX, campaign imagery, a three-level lesson tree,
Markdown confirmation, and successful PDF generation from two imported TSX pages
at 320×180 CSS pixels. Explicit fixture Tailwind sources are required outside
workspace; the production runtime already scans workspace JSX/TSX/HTML.
The isolated config sets the Studio root for dependency resolution.

All 83 tests, Studio TypeScript, both workspace validator self-checks, main
Storybook build, and isolated fixture build pass. Static HTML and its relative
assets are present in the fixture build. Main-browser checks retain Code
Framework's 13 slides, AI Chat's six slides, and product switching without console
errors. Both live catalogs are byte-identical; all 42 reviewed document bodies
and states are unchanged. Updated the README, template, pipeline/context-loading
contracts, workflow, and synchronized AGENTS/CLAUDE guidance. The main server
remains on 4320; the temporary verification server and tab were closed.

## Project-owned Design layouts

The operator required Design to support different stylistic requirements across
projects. Replaced the fixed rendering contract with explicit ordered layouts in
`workspace/design/{singlepage,startup}/layout.yaml`. The base declares the original
six blocks; startup is `{}`. Empty startup inherits the complete base layout,
while a populated configuration replaces it atomically. This layout resolution
is independent of the existing Markdown section merge, asset resolution, and CSS
cascade. Custom sources always come from the selected layout layer without
per-file fallback; inherited base components can render resolved startup inputs.

`utils/design/layout.ts` parses and validates built-in/custom sections and an
optional full-page TSX/JSX template. `utils/design/source.ts` discovers only
declared layer-owned sources for rendering. `DesignRenderer` composes selected
blocks and keeps the primary document status visible without Overview. A custom
template receives raw resolved Design/Assets, confirmation, and section children;
legacy parsed data is optional and omitted when no built-in blocks are needed.
Thus a complete custom template does not require the old Markdown field schema.
The original ProjectDesign remains an optional shell and reusable block registry.

Extracted the existing product page resolver and renderer into shared
`utils/pages.ts` and `utils/components/WorkspacePage.tsx`. Product wrappers keep
their API and behavior. Design uses the same Markdown, React, isolated HTML,
image/media and file rendering; relative URLs use `/workspace-design/<layer>/`.
Design section Markdown hides its duplicate H1 and retains its own confirmation.
CLI validation checks declared template/section files in both layer directories.

Updated the workspace/app READMEs, synchronized AGENTS/CLAUDE pre-development
guidance, and canonical workflow/role/context/reconciliation/template instructions.
The old prohibition on layer-owned Design components is superseded. Layouts and
additional pages are not automatically approved by the primary document badge;
agents inspect the rendered result and review semantic impact, retaining stale
markers where unresolved. Omitting a starter block does not satisfy an outstanding
requirement; the client brief determines the applicable visual families.

Verification: 90 tests / 423 assertions pass; Studio TypeScript, both layer
validator self-checks, main Storybook build, isolated Design fixture build, and
diff checks pass. Existing workspace Markdown/YAML documents and approval records
are byte-identical to the scoped pre-change backup. Browser checks cover selected
section order, omitted blocks, interactive TSX Icons, Markdown relative SVG,
HTML relative image and nested navigation, a full template without legacy data,
and duplicate-heading suppression. The narrow-screen fixture has no horizontal
overflow (actual reported viewport 487 CSS pixels). Main Design retains all six
blocks and nine images (three logos and six lazy-loaded media); startup source
inspection remains empty. No console errors occurred in the checked pages.

The repeatable fixture lives under `tools/studio/design`, outside workspace.
Local server startup inside the sandbox reported an unavailable port; starting
the same scoped loopback-only command with approved escalation worked. The QA
server on 4321 was stopped and successful verification tabs were closed. Main
Studio on 4320 remains running. The pre-change backup is
`/private/tmp/studio-before-design-extension.zip`; final check logs/builds use
the `/private/tmp/studio-design-extension-*` prefix. No commit or push performed.
