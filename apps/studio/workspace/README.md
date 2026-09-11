# Workspace

Workspace is the durable pre-development memory of one business. AI agents edit
the files in this directory; Storybook Studio renders the same files as a
read-only review surface. There is no generated `default` file and no separate
JSON content store.

The owner should be able to review the project in order without understanding a
marketing framework. Earlier stages change less often and have a wider effect.
Product materials change more often and affect only their own offer.

## Review order

| Stage               | Review these documents                                                                                    | Typical change rate | If it is wrong                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------- |
| `00 Client Request` | Brief, client-factual Business                                                                            | Rare after approval | Every later decision may be based on the wrong direction, sales process, audience, facts, or constraints |
| `10 Strategy`       | Product Research, then Strategy                                                                           | Occasional          | Brand, design, and product priorities may target the wrong opportunity                                   |
| `20 Brand`          | Brand                                                                                                     | Rare                | Every product may communicate the wrong meaning, promise, voice, or proof boundary                       |
| `30 Design`         | Design, Assets                                                                                            | Occasional          | Every product may use an inconsistent or unsuitable visual system                                        |
| `40 Products`       | Research, Sales, Product, Website, Marketing Creative, Presentation, and optional product-defined Content | Frequent            | Only that product's outputs need correction unless they expose an upstream contradiction                 |

Review `default` first. Open `singlepage` or `startup` only when you need to see
where a value came from.

## Document review status

The header has one confirmation badge above the document title. Its source layer
belongs to that confirmation. The badge shows one of four states:

| State                                | Meaning                                                   |
| ------------------------------------ | --------------------------------------------------------- |
| `unconfirmed` — Not confirmed        | The current document has no user confirmation             |
| `confirmed` — User confirmed         | Its body is confirmed and its reviewed inputs are current |
| `changed` — Needs confirmation again | The document changed since confirmation                   |
| `stale` — Review upstream changes    | An input changed or has an unresolved material effect     |

For example, a capacity change in Business makes Strategy stale even while its
text stays unchanged; Brand and product materials can become stale through that
same dependency chain. The agent reviews the actual impact. If the decision is
unaffected, it updates only the input snapshot and preserves the prior approval.
If affected, it corrects the owning document and obtains the confirmation required
by that stage. A known material problem keeps `review.stale` until resolved.
A commit or an agent answer never means that the user approved a document.

`review.dependencies` lives beside `confirmation` in document metadata. It records
only the current reviewed input fingerprints, not a timeline. Dependencies resolve
through the same selected layers as the document: a hidden base edit has no effect;
an inherited section change does. Selected product files keep their own inputs.
Startup still needs its own user approval at approval gates.

Agents follow [the shared status contract](../../../.agents/contracts/document-confirmation.md).

## The three views

Every shared artifact has two editable sources and one resolved view:

| View         | Meaning                                                                     | Editable source                       |
| ------------ | --------------------------------------------------------------------------- | ------------------------------------- |
| `singlepage` | The SinglePageStartup framework project's own business and design decisions | `<artifact>/singlepage.md` or `.yaml` |
| `startup`    | Changes owned by the current downstream project                             | `<artifact>/startup.md` or `.yaml`    |
| `default`    | The effective result after startup overrides singlepage                     | Read-only; resolved in memory         |

An empty startup shared document passes the complete singlepage document
through. A downstream project writes only its changes to startup; it does not
copy unchanged framework prose.

The canonical framework repository is mapped to `singlepage`. Unknown
downstream repositories default to `startup` through `utils/config.yaml`, so a user of
the framework normally configures nothing.

## File map

The workspace root contains document folders (`brief`, `business`, `strategy`,
`brand`, `design`), `assets`, `products`, `styles`, its README, and `utils`.
Assets and font licenses remain directly accessible. Products keep their catalog,
Markdown, YAML data, and product-specific React entry points together. Layered
brand styles live in `styles`. Shared components, stories, review helpers,
indexes, configuration, and workflow state live in `utils`.

```text
apps/studio/workspace/
  <artifact>/{singlepage,startup}.md
  design/{singlepage,startup}/layout.yaml
  design/<layer>/**             # optional project-owned components and section files
  assets/{singlepage,startup}.yaml
  assets/<layer>/{fonts,intake,generated}/
  styles/{singlepage,startup,default}.css
  products/{singlepage,startup}/catalog.yaml
  products/<layer>/<product-id>/
    product.md
    research.md
    sales.yaml
    website.md
    marketing-creative.md
    presentation/
      data.yaml
      ProjectPresentation.tsx
    content/Content.tsx # optional; supporting data stay with the product
  utils/
    config.yaml
    index/{singlepage,startup}.yaml
    pre-development/{singlepage,startup}.yaml
    pre-development/github/{singlepage,startup}.yaml
    components/
    stories/<artifact>.stories.tsx
```

All catalog paths, including document data and React entry points, resolve below
`products/<layer>/`. Components accept their own product data and may import
their product's supporting files; they must not import another document's
decisions at render time. A startup catalog still replaces the complete base
catalog, including component selection. No compatibility copy is kept at old
paths.

Project facts, open questions, and constraints live in their owning documents.
AI methods and stage completion rules live in `.agents/roles/` and
`.agents/workflows/pre-development.md`. There is no separate decision checklist
or approval summary in workspace.
`utils/index/` describes dependency and inheritance rules; it does not contain business
prose.

Keep this tree limited to current documents, their source assets, rendering code,
and workflow state. Git retains retired material and migration history. Remove
unused files together with their index entries, imports, and review dependencies.
Empty indexed startup sources are required inheritance boundaries; retain them.
Keep both `products/singlepage/` and `products/startup/` from the outset, each
with its own `catalog.yaml`. Add individual product and optional asset folders
when their first real file is added. Supplied references and font licenses remain useful
inputs even when they are not rendered directly on a product page.

## Product catalogs

Products use a stricter rule than shared documents because products from two
different businesses must never be mixed.

Both product layers have an explicit source folder, like the `singlepage` and
`startup` extension points in `libs/modules`. The framework owns
`products/singlepage/catalog.yaml` and its product folders; downstream projects
edit `products/startup/catalog.yaml` and add their own products beside it.
The empty startup catalog is a working inheritance boundary and must be retained.
It does not need copies of the framework product folders. Unlike module variant
maps, the product catalog is replaced as a whole under the rules below.

- If `products/startup/catalog.yaml` contains `products: []`, `default` shows the entire
  singlepage catalog.
- If startup defines at least one product, `default` shows only startup
  products. The complete singlepage catalog is replaced.
- Every catalog product owns six core tabs in the same layer, displayed as
  Product Overview, Research, Sales, Website, Marketing Creative, and Presentation.
  Opening the catalog or switching products starts with Product Overview so the
  reader sees the product, audience, and offer first. This reading order does not
  change the workflow's research and decision dependencies.
- A product may extend any core tab and add more tabs through `sections`, with
  nested `pages` and `children`. Page files may be Markdown, HTML, JSX/TSX,
  images, video, audio, or downloadable files. The legacy `content` and
  `website_component` fields remain supported.
- There is no fallback from a partially defined startup product to a
  singlepage product folder.

Example downstream catalog:

```yaml
schema: singlepagestartup.product-catalog.v1
products:
  - id: commercial-property-reletting
    name: Commercial property reletting
    summary: Find a more profitable replacement tenant and manage the change.
    research: commercial-property-reletting/research.md
    sales: commercial-property-reletting/sales.yaml
    product: commercial-property-reletting/product.md
    website: commercial-property-reletting/website.md
    marketing_creative: commercial-property-reletting/marketing-creative.md
    presentation: commercial-property-reletting/presentation/ProjectPresentation.tsx
    presentation_data: commercial-property-reletting/presentation/data.yaml
    # Optional flexible review surface:
    # content: commercial-property-reletting/content/Content.tsx
```

The product folder applies the approved Business, Strategy, Brand, and Design.
It may narrow those decisions for one offer, but it must not silently redefine
them.

### Additional product pages

Only `singlepage/` and `startup/` live directly under `products/`. Shared parsers,
loaders, and their tests live in `utils/products/`. Product-specific React
components, HTML pages, campaign images, data, and nested folders stay beside
their owning documents in `products/<layer>/<product-id>/`.

Add `sections` to a catalog product. IDs `product`, `research`, `sales`,
`website`, `creative`, and `presentation` add pages to the existing core tab;
its main document/deck remains available as **Overview**. Other IDs create
additional tabs in declaration order, numbered from 07. A page with `children`
may be a group or have its own `source`. Page IDs are unique within their section;
`overview` is reserved for the core document. Titles are explicit display labels.

```yaml
sections:
  - id: website
    title: Website
    pages:
      - id: landing
        title: Landing page
        source: my-product/website/index.html
      - id: checkout
        title: Checkout
        source: my-product/website/pages/Checkout.jsx
  - id: creative
    title: Marketing Creative
    pages:
      - id: launch
        title: Launch campaign
        children:
          - id: banner
            title: Main banner
            source: my-product/marketing-creative/launch/banner.png
          - id: preview
            title: Campaign preview
            source: my-product/marketing-creative/launch/Preview.tsx
  - id: academy
    title: Academy
    pages:
      - id: course
        title: Course
        children:
          - id: lesson
            title: Introduction
            source: my-product/content/course/lesson.md
          - id: lesson-slides
            title: Lesson slides
            source: my-product/content/course/Deck.tsx
            export: pdf
```

Replace `my-product` with that catalog product's ID. Every `source` is relative
to the selected layer and must stay in that product's folder. Missing declared
files fail validation; files from another layer are never used as fallback.
Supporting files appear in navigation only when declared as pages.

React pages default-export a component without required props. They may import
their own nested components, data, images, and the shared Studio layout. The core
Presentation entry point still receives its own YAML `{ content }` prop. It can
compose any number of imported TSX slide components; slide files are not required
to be individually registered as pages. Use `utils/components/ProjectPresentation`
to wrap the deck, or retain its `data-slide-id` and uniform fixed-size page contract.
The existing Presentation tab offers PDF export; additional React decks enable
the same export with `export: pdf`. Export captures all mounted slide elements in
DOM order. HTML and image pages do not automatically become PDF decks.

HTML loads in a sandboxed iframe from `/workspace-products/<layer>/…`, preserving
relative image, script, and nested HTML links. Markdown relative links/images
resolve from their source folder. Styles for React remain Tailwind-based.
Images, video, and audio have native previews; other formats have a download link.

Markdown pages use their own confirmation metadata. Rendering a page does not
approve it or its owning document. Agents review semantic effects on the owning
Product/Website/Creative/Presentation when its supporting pages change; arbitrary
component imports do not establish content approval. Keep all sections and page
trees inside the chosen catalog: startup replaces them with the product set.

## What each stage owns

### 00 Client Request

Client Request contains the client's request and supplied business facts.
The internal workflow stage ID remains `00-business`.

- Brief records the confirmed subject, current situation, desired outcome,
  scope, constraints, owner-controlled facts, and products in scope. Supporting
  acquisition activities and internal work remain brief context in Brief and
  Strategy.
- Business records client-supplied value, money, responsibility, capacity, and
  routing facts. Distinguish reported reality, confirmed intention, inspected
  supplied materials, calculations, and unknowns, with sources. Each product's
  Sales intake records its supplied process and missing details.
- Keep material source attribution with each owning statement. Product Research
  owns external sources; Assets owns files and rights. User confirmation and
  current dependency review are document metadata. Git keeps previous versions.
  There is no separate Evidence document or replacement fact/change log.
- No market, audience, competitor, or demand research is performed in this stage.
  External contradictions become client-clarification questions, not silent edits.

An error here has the largest propagation cost. Do not continue from an
unconfirmed scope or an invented operator fact.

### 10 Strategy

Before selecting the strategy, research each relevant product separately: its
buyer, purchase situation, alternatives, prices, channels, findings, and sources.
The files live under Products from the start; the stage number describes the
work order, not the ownership of Research. Cross-product comparisons belong to
Strategy and cite those product files. No shared Research document is created.

Strategy names one audience-growth priority, one sales-product priority, the
exact product set participating in the current experiment, and one experiment track.
Priorities do not disable other active directions. Positioning, commercial
logic, acquisition focus, rejected
alternatives, and the bounded experiment stay proposed until the operator
approves or corrects them.

### 20 Brand

Brand defines the meaning that should form in the customer's mind: intended
perception, promise, proof boundary, objections, voice, naming, CTA, and
governance. It does not contain colors, typography, photographs, illustrations,
or page layouts.

### 30 Design

Design translates approved Brand into a reusable visual system: identity,
colors, typography, grid, shapes, photography, illustration, iconography,
motion, accessibility, and usage rules. Assets records file provenance and
rights. Accepted source files live in `assets/<layer>/intake/`; generated
outputs live in `assets/<layer>/generated/<proposal-id>/`. Local font files and
their licenses live in `assets/<layer>/fonts/`; an empty startup Assets layer
inherits the singlepage font declarations without copying their files. Assets
is a machine-readable YAML registry and is intentionally absent from the
human-review Storybook sidebar.

Photography and Illustration use the same five blocks in `design.md`: purpose
and evidence boundary, one objective style master prompt, production
specification, a generation-example table linked to exact asset IDs, and a
review/quality gate. Each active media family needs at least three materially
different real examples reviewed together. The default Design blocks render
those Markdown tables and blockquotes; a project may select the blocks it needs
or supply a different structure through its own layout.

#### Project-specific Design structure

`design/<layer>/layout.yaml` owns the order and selection of visible sections.
An empty startup file (`{}`, comments only, or blank) inherits the complete
singlepage layout. A populated startup layout **replaces the complete layout**;
unlisted base blocks disappear. This is separate from the existing section-level
inheritance of `design/<layer>.md` and the cascading CSS tokens in `styles/`.
An inherited layout reads its custom files from singlepage while using the
resolved project document/data and styles. A startup layout reads every declared
file from startup; a missing file is an error, never a base-file fallback.

For example, this startup layout shows colors, a project-owned icon gallery,
motion guidance, and typography in that order:

```yaml
sections:
  - { id: colors, builtin: colors }
  - id: icons
    title: Icons
    source: icons/Icons.tsx
  - id: motion
    title: Motion
    source: motion/rules.md
  - { id: typography, builtin: typography }
```

Sources are relative to `design/<layer>/`. Built-in IDs are `overview`, `logos`,
`colors`, `typography`, `photography`, and `illustration`; each uses the same
value for `id` and `builtin`. A custom section needs a unique kebab-case `id`,
a `title`, and a `source`. It may replace a built-in ID with its own source.
Files may be nested freely. TSX/JSX files export a default component with no
required props; they may import other local components/data and render any
structure. Markdown, HTML, SVG/raster images, video, audio, and file downloads
use the shared page renderer. HTML runs in an isolated iframe under
`/workspace-design/<layer>/` with its relative links/assets intact. Markdown
resolves relative links/images from its own directory. Adding an unconfigured
Markdown heading or a file alone does not add a visible section.

To replace the entire visual template:

```yaml
template: Layout.tsx
sections: []
```

`Layout.tsx` default-exports a component typed with `IDesignTemplateProps` from
`workspace/utils/design/layout.ts`. It receives the resolved `document` Markdown,
`assetIndex` YAML, document `confirmation`, and `children` for declared sections.
It can render those children in its own shell or build the page itself. Parsed
legacy `data` is supplied only when built-in blocks are used; an entirely custom
template does not require the old Markdown field schema. Use Tailwind utilities
and the project's layered styles. Shared loader/rendering code stays in utils;
project components and their data stay in `design/<layer>/`.

Studio keeps the Design document status visible even without the default
Overview. That status applies to the primary document, not automatic approval
of a template, assets, or extra pages. Additional Markdown shows its own status.
Agents review the rendered result and assess semantic impact after layout or
section changes; record unresolved impact with `review.stale` in the affected
document. Hiding a section does not resolve an outstanding design requirement;
select the required visual families from the client brief and record scope there.

Typography roles are table rows with an exact CSS family, weights, usage, and
registered font asset ID. Review must load the real file and confirm the
computed family; labels never stand in for font verification. Photography and
illustration masters are always square, keep essential content in the centered
crop-safe area, and appear uncropped as squares in Design. Grid, spacing,
breakpoint, container, and radius rules use named Tailwind utilities rather
than a separate arbitrary-pixel system.

### 40 Products

For each client-confirmed product:

1. Product defines the bounded offer, buyer, value, commercial model, delivery,
   proof, constraints, and success.
2. Website defines the visitor journey, final copy, page and interaction states,
   responsive behavior, and post-conversion path.
3. Marketing Creative defines only the formats and channels selected by
   Strategy for this product.
4. Presentation owns its content in `presentation/data.yaml` and its React entry point. Shared components provide layout and export only; no text is extracted from another document. PDF and PNG are replaceable exports.

The catalog retains every client-confirmed product, including products outside the current experiment. Strategy never filters or deletes products. Every entry traces to
an operator-confirmed Brief product; a showcase, reference project, possible
future payment, repository folder, or agent idea never becomes a product by
inference.

## Working with agents

Invoke `singlepagestartup` or ask in plain language to start, continue, inspect,
or change the active project. You do not run a separate command for every
stage. The workflow reads `utils/pre-development/<layer>.yaml`, checks the earliest
incomplete prerequisite, reconciles existing documents with the current shared
pipeline and templates, loads only affected dependencies, and asks for the
highest-impact missing operator fact.

After shared `.agents/**` changes are synchronized into this repository, the
next ordinary invocation checks completed, active, and later non-empty artifacts
for missing files, sections, schema keys, and newly required decisions. It moves
the cursor to the earliest affected stage automatically. There is no pipeline
version file, migration journal, or separate validation command.

When correcting an existing decision, state the correction in ordinary
language. The agent updates the earliest document that owns it and revisits only
the downstream documents contradicted by the change. Git retains prior history;
the living documents contain only the current decision, not an appended session
log.

Primary documents must stay readable in five to seven minutes. Repeated
decisions, interview history, stale alternatives, and workflow handoffs do not
belong in them. Keep material attribution with the owning decision and historical
versions in Git; do not repeat the same explanation in several files.

## Boundaries

Workspace stops before engineering. Production components, APIs, analytics
implementation, QA, publication, and deployment remain in the normal code and
engineering workflow under `thoughts/shared/**`.

### Independent documents and semantic review

Every document stores its own content. Agents read related documents as context;
Studio does not import their decisions into another document at render time.
For example, a Business price change triggers a Product impact review: update
Product's own price if affected, otherwise retain its content. `stale` requests
that review; it is not automatic content propagation. Presentation owns its
content and confirmation in the catalog's `presentation_data` YAML source.

Structural migrations preserve every confirmed product. One product in startup
replaces the entire singlepage product catalog in default, including its
documents, presentations and optional surfaces. No product-level fallback is allowed.
