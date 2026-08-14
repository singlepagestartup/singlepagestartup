# Workspace

Workspace is the durable pre-development memory of one business. AI agents edit
the files in this directory; Storybook Studio renders the same files as a
read-only review surface. There is no generated `default` file and no separate
JSON content store.

The owner should be able to review the project in order without understanding a
marketing framework. Earlier stages change less often and have a wider effect.
Product materials change more often and affect only their own offer.

## Review order

| Stage         | Review these documents                                            | Typical change rate | If it is wrong                                                                                                     |
| ------------- | ----------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `00 Business` | Brief, Business, Research, Evidence                               | Rare after approval | Every later decision may be based on the wrong business, audience, facts, or constraints                           |
| `10 Strategy` | Strategy                                                          | Occasional          | Brand, design, and product priorities may target the wrong opportunity                                             |
| `20 Brand`    | Brand                                                             | Rare                | Every product may communicate the wrong meaning, promise, voice, or proof boundary                                 |
| `30 Design`   | Design, Assets                                                    | Occasional          | Every product may use an inconsistent or unsuitable visual system                                                  |
| `40 Products` | Product, Website, Marketing Creative, Presentation for each offer | Frequent            | Only that product's sales and communication materials need correction unless they expose an upstream contradiction |

Review `default` first. Open `singlepage` or `startup` only when you need to see
where a value came from.

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
downstream repositories default to `startup` through `config.yaml`, so a user of
the framework normally configures nothing.

## File map

```text
apps/studio/workspace/
  README.md
  config.yaml
  pre-development/
    singlepage.yaml
    startup.yaml
  brief/{singlepage,startup}.md
  business/{singlepage,startup}.md
  research/{singlepage,startup}.md
  evidence/{singlepage,startup}.md
  strategy/{singlepage,startup}.md
  brand/{singlepage,startup}.md
  design/{singlepage,startup}.md
  assets/{singlepage,startup}.yaml
  assets/<layer>/{intake,generated}/
  products/{singlepage,startup}.yaml
  products/<layer>/<product-id>/
    product.md
    website.md
    marketing-creative.md
    presentation/ProjectPresentation.tsx
  knowledge/
  index/
```

`knowledge/` contains project-specific decision routing used by agents. It is
not a second owner-facing deliverable and therefore is not shown in the main
Storybook navigation. `index/` describes dependency and inheritance rules; it
does not contain business prose.

## Product catalogs

Products use a stricter rule than shared documents because products from two
different businesses must never be mixed.

- If `products/startup.yaml` contains `products: []`, `default` shows the entire
  singlepage catalog.
- If startup defines at least one product, `default` shows only startup
  products. The complete singlepage catalog is replaced.
- Every active product owns all four outputs in the same layer: Product,
  Website, Marketing Creative, and Presentation.
- There is no fallback from a partially defined startup product to a
  singlepage product folder.

Example downstream catalog:

```yaml
schema: singlepagestartup.product-catalog.v1
products:
  - id: commercial-property-reletting
    name: Commercial property reletting
    summary: Find a more profitable replacement tenant and manage the change.
    product: commercial-property-reletting/product.md
    website: commercial-property-reletting/website.md
    marketing_creative: commercial-property-reletting/marketing-creative.md
    presentation: commercial-property-reletting/presentation/ProjectPresentation.tsx
```

The product folder applies the approved Business, Strategy, Brand, and Design.
It may narrow those decisions for one offer, but it must not silently redefine
them.

## What each stage owns

### 00 Business

- Brief records the confirmed subject, current situation, desired outcome,
  scope, constraints, owner-controlled facts, and every current or intended
  offer. Each offer is classified as a product candidate, supporting only, or
  deferred so later agents cannot create products by inference.
- Business records how value, money, delivery, responsibility, and capacity
  work.
- Research records only market and customer findings that can change a
  decision.
- Evidence is a concise source register, not a narrative report.

An error here has the largest propagation cost. Do not continue from an
unconfirmed scope or an invented operator fact.

### 10 Strategy

Strategy selects one practical business-level direction, the exact product set
that enters `40 Products`, and one primary product, audience, and situation for
the first experiment. It also keeps supporting-only and deferred offers
explicit. Positioning, commercial logic, acquisition focus, rejected
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
different real examples reviewed together. One shared React template turns
those Markdown tables and blockquotes into the Design page for `singlepage`,
`startup`, and resolved `default`; project layers do not own React Design
components. Their visual differences come only from Markdown/YAML decisions and
the cascading tokens in `workspace/styles/`.

Typography roles are table rows with an exact CSS family, weights, usage, and
registered font asset ID. Review must load the real file and confirm the
computed family; labels never stand in for font verification. Photography and
illustration masters are always square, keep essential content in the centered
crop-safe area, and appear uncropped as squares in Design. Grid, spacing,
breakpoint, container, and radius rules use named Tailwind utilities rather
than a separate arbitrary-pixel system.

### 40 Products

For each selected offer:

1. Product defines the bounded offer, buyer, value, commercial model, delivery,
   proof, constraints, and success.
2. Website defines the visitor journey, final copy, page and interaction states,
   responsive behavior, and post-conversion path.
3. Marketing Creative defines only the formats and channels selected by
   Strategy for this product.
4. Presentation is semantic React/HTML derived from the same sources. PDF and
   PNG are replaceable exports, not canonical knowledge.

The catalog must equal the Strategy-selected product set. Every entry traces to
an operator-confirmed Brief offer; a showcase, reference project, possible
future payment, repository folder, or agent idea never becomes a product by
inference.

## Working with agents

Invoke `singlepagestartup` or ask in plain language to start, continue, inspect,
or change the active project. You do not run a separate command for every
stage. The workflow reads `pre-development/<layer>.yaml`, checks the earliest
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
belong in them. Evidence IDs and Git preserve provenance without forcing the
owner to reread the same explanation in several files.

## Boundaries

Workspace stops before engineering. Production components, APIs, analytics
implementation, QA, publication, and deployment remain in the normal code and
engineering workflow under `thoughts/shared/**`.
