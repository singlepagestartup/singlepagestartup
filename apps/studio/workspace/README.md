# Workspace

Workspace is the durable pre-development memory of one business. AI agents edit
the files in this directory; Storybook Studio renders the same files as a
read-only review surface. There is no generated `default` file and no separate
JSON content store.

The owner should be able to review the project in order without understanding a
marketing framework. Earlier stages change less often and have a wider effect.
Product materials change more often and affect only their own offer.

## Review order

| Stage               | Review these documents                                                                              | Typical change rate | If it is wrong                                                                                           |
| ------------------- | --------------------------------------------------------------------------------------------------- | ------------------- | -------------------------------------------------------------------------------------------------------- |
| `00 Client Request` | Brief, then initial Product/models and Sales intake                                                 | Rare after approval | Every later decision may be based on the wrong direction, sales process, audience, facts, or constraints |
| `10 Strategy`       | Product Research, then Strategy                                                                     | Occasional          | Brand, design, and product priorities may target the wrong opportunity                                   |
| `20 Brand`          | Brand                                                                                               | Rare                | Every product may communicate the wrong meaning, promise, voice, or proof boundary                       |
| `30 Design`         | Design, Assets                                                                                      | Occasional          | Every product may use an inconsistent or unsuitable visual system                                        |
| `40 Products`       | Product, Operations & Economics, Sales, Promotion, optional Product Content, Analytics and Research | Frequent            | Only that product's outputs need correction unless they expose an upstream contradiction                 |

Review `default` first. Open `singlepage` or `startup` only when you need to see
where a value came from.

Every review document can be downloaded without its confirmation frontmatter.
Use Markdown when another chat or project needs the complete semantic source;
headings and tables stay authored Markdown. Use HTML when the rendered Brand,
Design, product page, or other visual composition is also relevant. The HTML
snapshot contains the current layout, active styles, and local images, while
the Markdown remains the authoritative portable text.

## Document review status

The header has one concise confirmation badge above the document title. Source
layer provenance remains in the selected projection and document metadata. The
badge presents the four resolver states with three short labels:

| State         | Badge              | Meaning                                                   |
| ------------- | ------------------ | --------------------------------------------------------- |
| `unconfirmed` | Needs confirmation | The current document has no user confirmation             |
| `confirmed`   | Confirmed          | Its body is confirmed and its reviewed inputs are current |
| `changed`     | Needs confirmation | The document changed since confirmation                   |
| `stale`       | Needs review       | An input changed or has an unresolved material effect     |

Design uses the same neutral document header as Brief, Strategy and Brand:
status, the title `Design`, purpose and usage. The selected visual layout starts
below that header and applies the project's fonts, colors and imagery there.
The shared `DesignRenderer` owns the header even when the overview block is
omitted or a project supplies a complete custom template. Custom templates
start their content headings at H2 and do not repeat the document title or badge.
This boundary applies to inherited and project-owned startup layouts. Scope
project styles to the visual canvas so a new identity does not restyle the
Workspace header. Keep process metadata out of the mockup itself.

For example, a capacity change in a shared model makes Strategy stale even while its
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

The workspace root contains document folders (`brief`, `strategy`,
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
  products/<layer>/models/<model-id>/model.md
  products/<layer>/<product-id>/
    product.md
    research.md                 # research overview
    research/                   # segment audits and competitor detail
    sales.yaml                  # all segment profiles and CJMs; UI pages are derived
    website.md                  # website overview
    website/                    # page copy and product-specific layouts
    marketing-creative.md       # creative overview
    marketing-creative/         # covers, articles, storyboards and motion scenes
    presentation/
      data.yaml
      ProjectPresentation.tsx
    content/Content.tsx # optional; supporting data stay with the product
  utils/
    config.yaml
    index/{singlepage,startup}.yaml
    pre-development/{singlepage,startup}.yaml
    pre-development/github/{singlepage,startup}.yaml
    components/                 # shared review shell, trees, slides and exports
    products/                   # catalog, Sales and presentation data resolvers
    design/                     # shared design data/layout resolvers
    media/                      # shared artboards, PNG and MP4
    stories/<artifact>.stories.tsx
```

The [Products directory guide](products/README.md) explains the distinction
between shared business models and product folders, naming and startup reuse.
`models` contains Operations & Economics sources, not application/backend modules.
A primary `.md` beside a same-named folder is its overview; the folder owns detail
and authored layouts. Generated Sales pages are not duplicated as Markdown files.

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
- Products run from Product through Operations & Economics and Sales to Promotion
  and Analytics. Badge tabs place Overview/Product Content inside Product,
  Website/Marketing Creative/Presentation inside Promotion, and current
  observations/Research inside Analytics. The sources and review states remain
  separate. All declared files must exist.
- `40 Products` is a sidebar folder. It contains sibling `singlepage` and `startup`
  groups, each listing only products from its own catalog. An empty source has a
  `No products` state. There is no visible default branch and no per-product layer list.
  The computed default catalog retains its inheritance/replacement semantics.
  Opening a product starts with Product; its page contains only document navigation.
  Shared-model context is plain text inside Operations & Economics, without a
  second menu of canvas blocks. A missing source view never falls back to another product.
- Storybook derives its product stories into `.storybook/.generated/products/`
  on startup/build and updates them when a catalog changes. These ignored files
  contain references only; edit names/order/membership in the owning catalog.
- A product may extend any core tab and add more tabs through `sections`, with
  nested `pages` and `children`. Page files may be Markdown, HTML, JSX/TSX,
  images, video, audio, or downloadable files. The legacy `content` and
  `website_component` fields remain supported.
- There is no fallback from a partially defined startup product to a
  singlepage product folder.

Example downstream catalog:

```yaml
schema: singlepagestartup.product-catalog.v2
models:
  - id: reletting-service
    name: Reletting service model
    source: models/reletting-service/model.md
products:
  - id: commercial-property-reletting
    model: reletting-service
    name: Commercial property reletting
    summary: Find a more profitable replacement tenant and manage the change.
    research: commercial-property-reletting/research.md
    sales: commercial-property-reletting/sales.yaml
    product: commercial-property-reletting/product.md
    analytics: commercial-property-reletting/analytics.md
    website: commercial-property-reletting/website.md
    marketing_creative: commercial-property-reletting/marketing-creative.md
    presentation: commercial-property-reletting/presentation/ProjectPresentation.tsx
    presentation_data: commercial-property-reletting/presentation/data.yaml
    # Optional flexible review surface:
    # content: commercial-property-reletting/content/Content.tsx
```

The product folder links its model and applies approved Strategy, Brand, and Design.
It may narrow those decisions for one offer, but it must not silently redefine
them.

### Additional product pages

Only `singlepage/` and `startup/` live directly under `products/`. Shared parsers,
loaders, and their tests live in `utils/products/`. Product-specific React
components, HTML pages, campaign images, data, and nested folders stay beside
their owning documents in `products/<layer>/<product-id>/`.

Add `sections` to a catalog product. IDs `product`, `model`, `research`, `sales`,
`website`, `creative`, and `presentation` add pages to the existing core tab;
its main document/deck remains available as **Overview**. Other IDs create
additional tabs in declaration order, numbered after the available core tabs. A page with `children`
may be a group or have its own `source`. Page IDs are unique within their section;
`overview` is reserved for the core document. Titles are explicit display labels.

```yaml
sections:
  - id: website
    title: Website
    pages:
      - id: site-pages
        title: Site pages
        children:
          - id: landing
            title: Landing page
            route: /
            representations:
              text: my-product/website/landing.md
              preview: my-product/website/Landing.tsx
          - id: checkout
            title: Checkout
            route: /checkout
            representations:
              text: my-product/website/checkout.md
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

Website navigation is an expandable page tree with keyboard arrows, Home and End.
Select a route, then switch **Text / Layout** without leaving that page. Text opens
first; a missing preview disables Layout so copy can be developed before design.
A node uses either `source` or `representations`; the latter requires Markdown
`text` and accepts optional React/HTML `preview`. Both paths follow the same
product/layer ownership rules. Legacy `source` pages and mixed content still work.

Keep each page's wording in its Markdown source. React previews receive the full
Markdown, including frontmatter, through the optional `text?: string` prop and
parse their own content structure. Use stable section identifiers when binding
copy to a layout so wording and heading edits do not break that binding. Copy
edits then feed both Text and Layout. Layout edits that alter wording must update
the same Markdown in the same change. For separately authored HTML, update both
files together and review their consistency; Studio does not rewrite arbitrary
HTML. The Website overview owns the journey and sitemap, not duplicate page copy.

React pages default-export a component without required props. They may import
their own nested components, data, images, and the shared Studio layout. The core
Presentation entry point still receives its own YAML `{ content }` prop. It can
compose any number of imported TSX slide components; slide files are not required
to be individually registered as pages. Use `utils/components/ProjectPresentation`
to wrap the deck for per-slide navigation, Text/Layout and PNG. Existing custom
decks may retain `data-slide-id` and uniform fixed-size pages: the shared outer
Presentation workspace preserves their complete-deck PDF. Arbitrary rendered HTML
is not parsed back into editable text; adopting the shared slide adapter exposes
those additional controls while retaining the project's own slide composition.
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
- Business Analyst records initial Product and Operations & Economics model
  sources, with client-supplied value, money, responsibility, capacity and routing. Distinguish reported reality, confirmed intention, inspected
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
`colors`, `typography`, `interface`, `photography`, and `illustration`; each uses
the same value for `id` and `builtin`. A custom section needs a unique kebab-case `id`,
a `title`, and a `source`. It may replace a built-in ID with its own source.
Files may be nested freely. TSX/JSX files export a default component with no
required props; they may import other local components/data and render any
structure. Markdown, HTML, SVG/raster images, video, audio, and file downloads
use the shared page renderer. A Design HTML file is inlined into the page, so
plain HTML and Tailwind classes resolve against the project's own
`--workspace-brand-*` tokens and the compiled Tailwind build. Write it as a
fragment without `<html>`, `<head>`, or `<body>`, and express interaction with
CSS (`hover`, `focus-visible`, `has-[:checked]`): injected `<script>` tags do not
run. A variant that reaches a descendant needs `group` plus `group-has-[...]`,
because `peer-*` only matches siblings and fails silently otherwise. Tailwind
compiles these classes from the `@source` glob in `runtime/styles.css`, and a
newly created file is not fully rescanned by the running dev server: restart
Storybook after adding one, or utilities that appear nowhere else stay missing. Product HTML pages still run in an isolated iframe under
`/workspace-products/<layer>/` with their relative links and assets intact.
Markdown resolves relative links/images from its own directory. Adding an unconfigured
Markdown heading or a file alone does not add a visible section.

To replace the entire visual template:

```yaml
template: Layout.tsx
sections: []
```

`Layout.tsx` default-exports a component typed with `IDesignTemplateProps` from
`workspace/utils/design/layout.ts`. It receives the resolved `document` Markdown,
`assetIndex` YAML, document `confirmation`, and `children` for declared sections.
It can render those children in its own canvas below the shared document header. Parsed
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
illustration masters retain their original aspect ratio and appear uncropped
in Design. Choose composition and format per image; derivative crops follow
the actual product output. Keep style prompts compact and reference-derived;
the tooltip explains how to add a scene or relationship and source references.
After a master prompt changes, regenerate at least three different content
briefs with its exact current wording and documented reference inputs. Compare
their style and correct material drift before marking the prompt tested. Show
those actual outputs in Design; old images cannot verify a new prompt.
Choose illustration backgrounds for the project's visual direction and intended
placement; transparency is optional. Preserve original generated masters and
compare derivatives with them for thin lines, secondary detail, color and
contrast. Reject processing that degrades the image. Restoring a previously
tested prompt can reuse its unchanged original outputs and provenance when they
still fit the brief.
Device requirements, fixed margins and numerical limits are not universal style
rules. Grid, spacing,
breakpoint, container, and radius rules use named Tailwind utilities rather
than a separate arbitrary-pixel system.

### 40 Products

The product set is a prospective business plan and requirements for later
engineering. Describe the intended offer and experience, distinguish plans from
observed results, and use supplied figures or clearly based forecasts. Installation
checks, software bugs and release audits do not gate these business documents.
The same method applies to framework and downstream projects.

For each client-confirmed product:

1. Product defines identity, customers, their problem, value, offer and usage,
   ending with Business goals and metrics.
2. Operations & Economics defines revenue, resources, activities, partners,
   costs and funding in the owning shared model.
3. Sales defines the complete intended customer process. Readiness means its
   business decisions are complete, even before implementation.
4. Promotion groups Website, Marketing Creative and Presentation in one navigation
   surface while each material retains its own source and export.
5. Website defines visitor journeys and a site tree. Each page has its own Text
   and Layout representations with consistent copy.
6. Marketing Creative provides messages and compositions for selected channels.
7. Presentation explains the business to clients, partners or investors. It owns
   `presentation/data.yaml` and its React entry; PDF/PNG are replaceable exports.
8. Optional Product Content contains materials customers receive or use.
9. Analytics records observed values, periods and sources. Research remains beside
   it to interpret evidence and route changes back to Product, the model or Sales.

Review business coherence and the actual static materials. Engineering tests and
runtime verification remain in the engineering workflow. Unchanged approved
Brief, Strategy, Brand and Design decisions retain their approval.

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

Strongly prefer a five-to-seven-minute review per page (about 1,400 words),
without a hard word, line, source or segment cap. Preserve material information,
using navigable detail pages where useful. Aggregate Sales YAML and Research
corpora are not single review pages. Repeated
decisions, interview history, stale alternatives, and workflow handoffs do not
belong in them. Keep material attribution with the owning decision and historical
versions in Git; do not repeat the same explanation in several files.

## Boundaries

Workspace stops before engineering. Production components, APIs, analytics
implementation, QA, publication, and deployment remain in the normal code and
engineering workflow under `thoughts/shared/**`.

### Source ownership and semantic review

Product owns customer/value/offer decisions; Operations & Economics owns model
resources, per-product prices, costs and funding; Sales owns the whole customer
process. Analytics owns observed values and their source windows; Research owns
interpretation and decision implications. Website, Marketing Creative and Presentation apply these facts in their
own authored materials. They never establish a competing source for price or
scope. A changed source makes dependent materials stale for semantic review;
Studio does not automatically replace their copy or renew confirmation.

Presentation keeps its own data and React entry point, with the same preview and
PDF export. Additional pages keep the existing format/nesting support. Use
**Product Content** for delivered lessons, episodes, templates or files, separately
from marketing. Its structure remains product-defined and optional.

See [product-model migration](../../../tools/studio/products/MIGRATION.md) for the
page/transfer maps, old bookmarks, automatic structural steps, semantic decisions
and verification. Business is retired after content attribution, not copied into
Brief. The `00-business` stage ID remains compatible for initial Brief/model work.

### Producing and exporting product materials

The page tree and Text/Layout contract applies to Marketing Creative and optional
Product Content as well as Website. Register real deliverables: separate covers,
articles, posts, storyboards or other selected content. Related items form groups.
A paired layout receives canonical Markdown through `text?: string`; static and
animated variants can consume the same copy. Text download strips review metadata.
Agents author files in the current project conversation; Studio previews them.

Use [ArtifactFrame](utils/media/ArtifactFrame.tsx) for editable fixed-size HTML
artboards and PNG downloads. Use [MotionPreview](utils/media/MotionPreview.tsx)
for Remotion playback, seeking and browser MP4 rendering with progress/cancel.
See [the shared media API](utils/media/README.md). Utilities ship with the framework;
project-specific graphics and content remain in their layer folders.

Presentation has its own slide tree and Text/Layout view. YAML remains the source
of its words; existing React components provide slide layout. Generic/custom
decks can supply slide Markdown or a formatter. A selected slide exports to PNG;
full PDF retains every slide. The review header owns confirmation, so no badge
or editing control becomes part of a cover, slide or exported video.

Content is free-form. A GitHub-style README is one example; a course or another
product can register lessons, handouts, image/video sequences or arbitrary pages.
No full repository import and no universal README requirement are introduced.

### Language and vocabulary

Material localization reuses `internationalization` from
`@sps/shared-configuration` (`libs/shared/configuration/src/lib/internationalization/index.ts`),
currently English `en` and Russian `ru`, English by default. Runtime content
already stores translated fields by language key and renders the selected
language; see the Website Builder button component and `saveLanguageContext`.

Keep all customer-facing text in the language of its page, slide or material,
including actions, navigation, tooltips, error/progress messages, accessibility
labels and metadata. Preserve product names and stable content keys. Short
vocabulary fields use the existing `{ en: string, ru: string }` shape; longer
copy may use separate Markdown sources per locale. Text, Layout and exports
must select the same locale. A translation sent for operator review does not
add a runtime language switch or confer approval. Follow the Language and
vocabulary rules in `.agents/contracts/product-models.md` for new projects.

## Sales customer segments and CJM

Sales v2 uses the same internal page tree as Website and Marketing Creative:
Overview → Customer segments → one page per Product segment. Each page contains
the customer/situation, needs and pains, motives, decision trigger and criteria,
value proposition, objections and sales arguments, acquisition/message matrix,
and Customer Journey Map (CJM). The map shows customer goals, actions, questions,
desired experience, touchpoints, business responses, transitions, relationships
and metrics across the journey. Operational responsibility and handoffs remain
available in a collapsible section. These are intended business experiences;
proposed motives are not reported as observed customer psychology.

Use `singlepagestartup.sales-process.v2` in the product's `sales.yaml`. Keep shared
owner, seller, pricing, capacity, blockers and confirmation once. Put profiles in
`segments`, each with an `id` matching Product frontmatter `customer_segments`.
Every ready Product segment needs a Sales profile; unknown/duplicate IDs fail
validation. Each profile has `name`, `audience`, `roles`, `needs`, `motivations`,
`decision_criteria`, `purchase_trigger`, `value_proposition`, `objections`,
`acquisition` and `journey`. The exact fields and attribution guidance are in
`.agents/templates/sales-process.yaml`. Ready means business completeness.
Empty intake is blocked with `segments: []` and explicit business unknowns.

Shared `utils/products/sales.ts` parses both legacy v1 and current v2. V1 remains
readable; migrate it when revising its owned Sales rather than inventing profiles
on load. `utils/components/SalesSegment.tsx` builds the segment pages and map;
`ProductPages` owns navigation, header confirmation and the compact `.md` export.
The selected segment export contains only its profile and CJM, with no review
metadata. All segment pages display whole-Sales confirmation; selecting a page
never approves it. Additional catalog Sales pages remain supported. Generated IDs
`sales-customer-segments` and `sales-segment-<id>` are reserved for this navigation.
The source stays in the atomically selected product layer. An empty startup
inherits base examples; a populated startup uses only its own products/profiles.

Website and Creative authors use the relevant segment's needs, decision motives,
objections and CJM moment, recording target segment and journey/acquisition IDs
in the material's metadata. Sales is a direct review input of Website, Creative
and Presentation. Changes prompt impact review; they do not silently replace
material copy or renew approved Strategy/Brand/Design.

### Research audits of Sales segments

Use the shared Research tab with Overview, Customer segments and Competitors and
alternatives. Register Markdown detail pages in catalog section `research`.
Each completed segment audit identifies `sales_segment` and all seven
`sales_dimensions`; the main `research.md` opts in with `sales_audit: true`.
See `.agents/contracts/research-sales-audit.md` for evidence, verdict, competitor
and traceability requirements. Finding prefixes and unique IDs cover all declared
Research pages. Every Sales segment is checked, without an arbitrary count cap.

Research detail feeds its summary and downstream decisions. Research observes
the Sales body as a hypothesis, storing its fingerprint without recursively
inheriting Sales approval; this avoids the Research → Product → Sales review
cycle. Changes still request a new audit. No snapshot update grants user approval.
