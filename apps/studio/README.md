# SinglePageStartup Studio

`apps/studio` is the repository's read-only presentation system. It combines
two projections without becoming a second source of truth:

- existing presentation-only module and page components;
- validated business, marketing, brand, design, and asset artifacts
  from an indexed workspace.

Canonical project artifacts are readable Markdown and YAML files under
`apps/studio/workspace/<artifact>/`. Assets, products, and layered styles stay
at the workspace root. Shared components, read-only stories, and technical
helpers live in `apps/studio/workspace/utils/`.
The workspace-specific operating guide is
`apps/studio/workspace/README.md` and is also rendered as
`Workspace/README` in Storybook.
Each story imports its corresponding `singlepage` and `startup` sources directly;
Studio does not create a second content inventory.
`apps/studio/workspace/utils/index/<layer>.yaml` remains the artifact/dependency
registry and points to those files. No repository-root `workspace/` directory
is used.

## Production Docker boundary

The root [`.dockerignore`](../../.dockerignore) excludes the entire
`apps/studio` directory from production build contexts. This includes both
workspace layers, source documents, intake files, images, fonts, runnable
prototypes, generated PDFs, and future files added anywhere under Studio.
Studio remains available in the checkout for development and review; its
contents are not copied into production images.

Production applications must not import or read files from `apps/studio` at
build time or runtime. Publish approved content through the owning module,
its database and file-storage flows, or the production application’s static
assets. Put reusable code in the appropriate shared library. Configure any
runtime knowledge corpus outside Studio. Database snapshots under
`libs/modules/**/backend/repository/database/src/lib/data/` remain part of the
production context.

Downstream projects must retain this exclusion when syncing the framework.
If a project adds a Dockerfile-specific ignore file or an alternative build
context, preserve the same boundary there. Required production assets should
be published to their runtime location instead of re-including Studio.

## Commands

```bash
npm run studio:list
npm run studio:dev -- runnable/startup/singlepagestartup
npm run studio:init -- runnable/startup/landing-v1
npm run studio:validate
npm run studio:inventory
npm run studio:storybook
npm run studio:storybook:build
npm run studio:presentation:export
```

`studio:validate` type-checks Workspace stories and checks runnable manifests,
module/page/Figma metadata, both canonical workspace layers, inheritance rules,
dependency cycles, and isolated validator fixtures.

`studio:inventory` regenerates `inventory/modules.generated.json` from
production module variant contracts and Studio manifests. Workspace documents
are not copied into generated JSON.

`studio:presentation:export` builds the resolved semantic React/HTML presentation,
resolves `singlepage` or `startup` from repository identity, and writes a
standalone HTML snapshot, paginated PDF, per-slide PNG files, and a manifest to
`apps/studio/output/<resolved-layer>/`. These files are gitignored derivatives;
the React story and indexed workspace artifacts remain the editable sources.

## Browser PDF export

Every product's Presentation tab includes the shared
`workspace/utils/components/PresentationPdfDownload.tsx` controls. Export starts only
when the operator clicks **Prepare PDF**; opening the tab performs no PDF capture.
The button shows progress, exposes a **Download PDF** Blob link on success, and
allows retry after an error. Leaving the tab, changing product/content, or
unmounting releases the URL and invalidates an unfinished generation.

Presentation components expose each page with a unique `data-slide-id`. Pages
must be mounted, use one fixed logical size, and appear in export order. The
wrapper reads these existing pages without creating a duplicate hidden deck.
It derives a 2× PNG raster and PDF point dimensions at 72/96 from the source CSS
size. The default 1600 × 900 presentation becomes 3200 × 1800 raster pixels on
1200 × 675 pt PDF pages. Fonts, image readiness, ordered PDF assembly and URL
lifecycle come from `@sps/shared-frontend-client-pdf`; its README documents the
browser/capture limitations and API for other Studio surfaces.

The direct `?document=presentation` route remains a plain deck for the existing
CLI HTML/PDF/PNG exporter. Product data, layer resolution and slide content use
the same components for both export paths.

## Portable document export

Brief, Strategy, Brand, Design, and every product-owned document or nested page
offer downloads in the same review surface. Markdown downloads remove review
frontmatter but retain the complete authored heading, list, link, and table
structure. Product file names include the product and page or customer-segment
name, so independently uploaded files remain identifiable.

HTML downloads capture the currently rendered page without Storybook chrome or
the download controls. They inline the active styles and same-origin images so
Brand, Design, product layouts, and Markdown renderings remain useful as a
portable visual reference. Text-first paired pages always keep their canonical
Markdown download; switching to Layout changes the HTML snapshot, not its source
text. Existing raw HTML pages download their owned source file directly.

## Layout

```text
apps/studio/
  .storybook/                 Storybook configuration
  foundations/                Shared presentation tokens and Figma variables
  inventory/                  Derived module navigation and coverage data
  modules/                    Existing module/page projections
  runnable/<layer>/           Standalone imported prototypes
  runtime/                    Studio-only styles and static runtime
  output/<layer>/             Gitignored HTML, PDF, and PNG presentation exports
  workspace/                  Living documents and their presentation
    assets/                   Registered images, fonts, intake, and generated files
    products/                 Catalogs, product documents, data, and React entry points
    styles/                   Layered singlepage, startup, and default brand CSS
    utils/                    Shared components, stories, helpers, indexes, and state
  system.manifest.json        Studio roots and module inventory pointer
```

Reusable module blocks continue to mirror `libs/modules`:

```text
apps/studio/modules/<module>/<models|relations>/<entity>/<layer>/<variant>/
  Component.tsx
  Component.stories.tsx
  block.manifest.json
  figma.json
```

Host pages remain under
`apps/studio/modules/host/models/page/<layer>/<page-variant>/`. Existing stable
component/page IDs are preserved across the Studio rename.

## Workspace presentation

Storybook discovers `apps/studio/workspace/utils/stories/*.stories.tsx`. Every agreed
living-artifact section exposes three read-only projections: `default` is the
resolved result, `singlepage` is the framework source, and `startup` is the
project override alone. Each shared document has a readable folder such as
`apps/studio/workspace/brand/`, containing `singlepage.md`,
and `startup.md`. Its story in `workspace/utils/stories/` imports both sources
directly. Studio aggregates them in memory, shows their repository paths as
provenance, and never creates a second artifact set. Assets use
`singlepage.yaml` and `startup.yaml`. Project facts, questions, constraints, and
sources stay in the documents that own them. AI methods and completion rules
live in `.agents/`; workspace has no separate decision checklist or approval
summary. Final documents merge sections and assets merge by ID. Shared profession responsibilities and methods live
together under `.agents/roles/`; artifact templates live under
`.agents/templates/` and are referenced by the workspace indexes.

Each layer also owns `apps/studio/workspace/utils/pre-development/<layer>.yaml`. This
file is not business content and is not shown in Storybook: it is the minimal
agent cursor for `00-business`, `10-strategy`, `20-brand`, `30-design`, or
`40-products`.
Every new workflow task reconciles it against the indexed artifacts before
continuing, so Markdown/YAML remains authoritative if an earlier task ended
between writes.

Storybook exposes owner-review documents under numbered `Workspace/**` stages.
Engineering research, plans, and implementation notes stay exclusively in
`thoughts/shared/**` and are not included in Studio inventory or navigation.

`Workspace/30 Design/default` renders the effective Design document and assets
through the selected `workspace/design/<layer>/layout.yaml`. The base lists
reusable overview, logo, color, typography, photography, and illustration blocks.
Projects may reorder or omit these blocks, add Markdown/React/HTML/media sections,
or provide a complete TSX/JSX template. Layout files resolve atomically: empty
startup inherits the base; a populated startup layout replaces it, and every
custom file comes from that layout's own layer without file fallback. Design
Markdown continues to inherit by sections and CSS by the existing layer cascade.
The workspace README documents the schema, custom-template props, and examples.

All three projections use the same loader and review-status wrapper. An entirely
custom template receives the resolved source document and assets without requiring
the legacy field schema. Startup inspection remains empty until startup has
meaningful data or its own layout. Layout and component changes require visual
review; document confirmation does not automatically approve extra sources.

`Workspace/00 Client Request` contains Brief; initial Product, model and Sales sources are prepared next under Products. It records
client statements, confirmed intentions, supplied-material observations, and
unknowns, with attribution. External market research belongs to individual
products and starts before strategic selection at `10-strategy`.

`Workspace/40 Products` displays every client-confirmed product, including products outside the current launch or experiment. Each product
links a model and owns Product, Sales, Research, Website, Marketing Creative, and
Presentation outputs. Product `sections` can extend these tabs or add further
tabs with nested Markdown, HTML, JSX/TSX, image, and media pages. Shared loaders
and tests live in `workspace/utils/products/`; page files and supporting materials
stay inside their product's layer folder. React decks retain PDF export. The
catalog schema and examples are in `workspace/README.md`. An
empty `products/startup/catalog.yaml` inherits the complete singlepage catalog.
Both layer folders and their catalogs are retained from the outset as explicit
base/extension boundaries, following the structure used in `libs/modules`. A
startup catalog with at least one product replaces the complete singlepage
catalog, so offers from unrelated businesses are never mixed. The exporter
renders the selected default product's Presentation from the same story.
Current generated identity
assets registered below the workspace asset tree render as actual SVG or raster
content. Client intake, legacy material, stock, and public references remain
provenance-only unless their registry disposition explicitly allows the
requested rendered use.

Studio runtime CSS is project-neutral. Font files and their licenses are
registered below `workspace/assets/<layer>/fonts/`.
`workspace/styles/singlepage.css` defines the
framework tokens, `startup.css` contains downstream overrides only, and
`default.css` imports both in that order. The singlepage source story imports
the base stylesheet; resolved stories and exports import `default.css`.

SinglePageStartup itself is developed through the colocated `singlepage` files.
A downstream project starts with zero-content sibling `startup` files and writes
only its overrides there. `apps/studio/workspace/utils/index/singlepage.yaml` and
`apps/studio/workspace/utils/index/startup.yaml` remain structural registries, not
content stores. The startup index explicitly declares each `extends` relation
and resolution strategy. Missing or empty startup content passes through the
singlepage source; populated content follows the declared strategy in the
resolved `default` view.

## Document confirmation

Primary Markdown review sources carry YAML frontmatter with
`confirmation.confirmed: false`; Sales and Assets use the same root key in YAML.
After explicit user confirmation, the record also contains `by`, `at`, `source`,
and `content_sha256`. The header shows confirmation, its layer, the document's
purpose, and how to use it. It hides metadata and the duplicate body H1.

Empty startup inherits singlepage content and its attributed status. Changed
startup content requires its own approval; explicit false overrides base true.
Startup can confirm the complete inherited or partially overridden document
with metadata only. Its fingerprint covers the resolved body, including retained
base sections. An effective body change invalidates the old confirmation.
An inherited singlepage approval does not satisfy a startup approval gate.

Read the current effective fingerprint without recording consent:

```bash
bun tools/studio/workspace/document-review.ts --file apps/studio/workspace/products/startup/models/example/model.md
```

The agent loader and browser share `tools/studio/workspace/document.ts` and the
merge contract. Sources and templates start unconfirmed; partial decisions do
not approve a whole document. See
[the shared confirmation contract](../../.agents/contracts/document-confirmation.md).

The resolved status is `unconfirmed`, `confirmed`, `changed`, or `stale`.
`review.dependencies` records the last inspected direct input fingerprints.
Changes to effective inputs, missing inputs, and upstream stale states trigger
`stale` even when this document's body is unchanged. The shared review resolver
adds product-local dependencies from the selected catalog and is used by Studio,
the agent loader, and the review helper. Metadata-only edits do not change body
fingerprints. A hidden base-section change has no effect on a startup override.

The helper returns current input fingerprints as well as the current body hash.
After an impact review with no material effect, update only the input snapshot;
preserve unchanged approval. For material impact, retain `review.stale` with a
reason and source IDs until revision and any required user confirmation finish.
Never copy hashes to make unresolved work appear approved. No standalone Evidence
source is loaded: current facts and attribution belong to the owning documents,
external sources to product Research, rights to Assets, and history to Git.

## Figma metadata

Each reusable block/page keeps its paired manifest and `figma.json`. The files
must agree on component/page/variant names and node identifiers. Studio can
maintain local inventory and metadata; creation or editing in a real Figma file
requires an explicitly available Figma capability and target.

## Guardrails

- Keep all Studio components presentation-only and driven by static props.
- Render registered current generated identity outputs in React; an asset ID by
  itself is not a visual brand review.
- Do not import production APIs, SDK providers, authentication, React Query, or
  mutation code.
- Do not edit generated inventory as a business or design source.
- Keep project evidence distinct from generated, stock, reference, and
  decorative assets.
- Pre-development ends at concrete static design decisions. The existing
  GitHub-gated engineering workflow remains the separate next system; production
  implementation, testing, analytics, deployment, and the bridge into them are
  outside issue 222.

Presentation content is owned by the selected product's `presentation_data` YAML
source and passed as `{ content }` to its React entry point. Shared components
provide layout/export; they do not extract Strategy or other document copy.
Document dependencies are semantic review relationships: `stale` requests an
impact review without automatically replacing any dependent text.
