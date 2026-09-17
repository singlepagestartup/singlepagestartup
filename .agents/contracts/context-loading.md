# Context loading contract

## Resolution

1. Resolve repository identity from the `origin` remote, then fall back to
   `TARGET_REPO` or `GITHUB_REPOSITORY` only when `origin` has no recognizable
   GitHub identity.
2. When repository identity exists, apply its mapping from
   `apps/studio/workspace/utils/config.yaml`, then `default_layer`. A conflicting
   gitignored `config.local.yaml` is an error; it cannot change repository
   ownership.
3. Only when repository identity is unavailable, use `active_layer` from
   `config.local.yaml`, then the committed `default_layer`.

Explicit layer arguments exist only for validators and read-only Studio source
projections. The pre-development workflow and GitHub preflight do not supply
one.

The gitignored config may contain only `active_layer`; it cannot replace the
committed repository map or default.

The committed default is `startup`. The canonical
`singlepagestartup/singlepagestartup` repository is explicitly mapped to
`singlepage`, so downstream users need no configuration.

Shared project artifacts, project-specific knowledge, profession references,
and templates are declared in a layer index with stable IDs, kinds, paths,
descriptions, and `uses` IDs. Product-local sources are referenced by their
product catalog entry; before catalog assembly they resolve from confirmed
Brief product IDs and their product folders.

Operational workflow files follow a separate loading order. First run the GitHub
preflight using the committed relevance and reconciliation ledger at
`apps/studio/workspace/utils/pre-development/github/<layer>.yaml`; then read
`apps/studio/workspace/utils/pre-development/<layer>.yaml`, follow
`.agents/contracts/pipeline-reconciliation.md`, and only then accept the cursor
and resolve artifact dependencies. The preflight and artifact loader call the same repository-layer
resolver; callers do not pass an independently chosen layer. Both operational
files are layer-local and are not inherited. The latter stores
only the durable pre-development cursor defined by
`.agents/workflows/pre-development.md`.

The indexes are registries, not content stores. Brief is the root client input
and has no semantic `uses` dependencies on later decisions, including Assets.
Its raw client attachments and exact reference asset IDs are provenance, not
approval edges. Inspect them when the intake requires it; do not reconstruct
Brief facts from Product, model, Research, Strategy, Brand or Design decisions.

The workspace root contains document folders (`brief`, `strategy`,
`brand`, `design`), `assets`, `products`, `styles`, its README, and `utils`.
Assets and font licenses remain directly accessible. Products keep their catalog,
Markdown, YAML data, and product-specific React entry points together. Layered
brand styles live in `styles`. Shared components, stories, review helpers,
indexes, configuration, and workflow state live in `utils`.

```text
apps/studio/workspace/
  <artifact>/{singlepage,startup}.md
  assets/{singlepage,startup}.yaml
  assets/<layer>/{fonts,intake,generated}/
  styles/{singlepage,startup,default}.css
  products/{singlepage,startup}/catalog.yaml
  products/<layer>/models/<model-id>/model.md
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

product models records product Sales intake from client inputs; Market Researcher
creates product Research at the start of Strategy, before strategic selection.
Resolve paths from confirmed Brief IDs or an existing catalog, without loading
later delivery files. There is no shared Research file. Load only the relevant
product findings; product models never loads them as client facts. Supporting
activities are concise Brief/Strategy context without a separate inventory.

Only layer folders live directly in `products/`; shared loading/validation code
and tests live in `utils/products/`. Product-local JSX/TSX, HTML, images, data,
and nested folders stay inside `products/<layer>/<product-id>/`.

Optional catalog `sections` extend core surfaces or create additional tabs. Each
has `id`, `title`, and `pages`; page nodes have `id`, `title`, optional `source`,
and recursive `children`. Read only the declared page and supporting files needed
for the current decision. The top-level sequence is `product`, `model`, `sales`,
`promotion`, and `analytics`. `content` is nested inside Product;
`website`, `creative`, and `presentation` are nested inside Promotion; `research`
is nested inside Analytics. These groups are shared navigation, not new editable
sources. Other section IDs add tabs; files do not become navigation automatically.
Every page source stays within its product and selected layer. Missing startup
sources fail rather than inheriting a base page. Full schema examples and
preview/export contracts live in the workspace README.
Markdown pages use their own confirmation; changes to supporting React/HTML/media
require semantic review of their owning document, not automatic approval.

The optional Product Content directory is a product-local context source rather than a
fixed document contract. When a catalog entry declares `content`, load the
entry component and only the supporting files relevant to the current product
decision. Do not assume Markdown, a video schema, or a universal set of content
types; follow the component's imports and the product's local organization.

Project-specific working knowledge follows the same terminal
layer pattern under `apps/studio/workspace/knowledge/<kind>/`. Resolve paths
from `apps/studio/workspace/utils/index/<layer>.yaml`; do not hard-code a parallel
content path or treat a generated inventory as project knowledge. There is no
second repository-root `workspace/` namespace.

## Project artifact resolution

The `singlepage` brief, models, strategy, asset
index, brand, design, and product catalog describe SinglePageStartup itself: its real
business, direction, communication, design, and offers. They are not templates.
Brand owns intended meaning and communication; Design is its medium-independent
visual translation. Product-local Website, Marketing Creative, and Presentation
apply those shared decisions and never serve as Brand or Design inputs. Analytics
records observations; Research interprets evidence. Their shared navigation does
not change source ownership or dependency direction.

AI methods, question-routing rules, and stage completion criteria live in
`.agents/`. Project facts, decisions, open questions, and constraints live in
Brief, product models, Strategy, Brand, Design, or the selected product's documents.
Do not maintain a separate decision checklist or approval register in workspace,
and do not move project content into the reusable agent definitions.

Workspace contains current inputs and executable support, not migration archives
or role comparisons. Remove retired files together with index imports/exports,
`uses` edges, and obsolete review fingerprints. Preserve current document bodies,
approvals, and unresolved semantic impact. Retain empty indexed startup sources.
Keep both `products/singlepage/` and `products/startup/` from the outset, each
with its own `catalog.yaml`, even when startup has `products: []`. This follows
the explicit base/extension folders in `libs/modules`; product catalogs still
replace atomically rather than merging module-style variant keys. Do not copy
base product folders into startup. Create individual product and optional asset
folders with their first real file. Check references before deleting.

Every layered startup index entry explicitly names its singlepage source with
`extends` and its merge `strategy`. Resolution follows these rules:

- treat a declared but empty startup file as no override;
- `sections`: merge Markdown headings and let non-empty startup sections win;
- `replace`: once startup has meaningful content, replace the entire
  domain-specific knowledge document;
- `keyed`: merge YAML objects and ID-keyed arrays with startup values winning;

- `product-catalog`: if startup has no products, inherit the complete
  singlepage catalog; otherwise use only the complete startup catalog and never
  merge entries across business layers;
- keep one effective artifact in context and retain both canonical source paths
  as provenance.

For an active startup, inherited framework facts are reference context until
the client confirms applicability in the owning startup document. There is no
standalone Evidence source or row-level override register.

Document confirmation metadata follows `.agents/contracts/document-confirmation.md`.
The resolved body determines the stamp; base confirmation never approves changed
startup content. The read-only source projection validates a startup stamp against
its resolved body while displaying the local fragment. Before consuming an artifact,
resolve its status and inspect `stale` sources through the review helper. Agents
must follow the contract's impact-review transitions, not infer freshness from
a cursor, commit, or raw `confirmed: true` field.

Do not write a resolved copy. Agents and Studio use the same in-memory result.
An agent writes only the indexed source for the active layer. The operator reads
that same source file directly and reviews its `singlepage`, `startup`, or
resolved `default` projection in Storybook.

In the canonical framework repository, GitHub reconciliation writes only
`singlepage` sources. In a downstream repository, it writes only `startup`
sources, including when synchronized framework code changes affect the
downstream project. It never modifies the inherited `singlepage` base there.

## Shared agent resources

Only material that does not change between projects belongs beside the agents:

```text
.agents/roles/
.agents/templates/
```

Each profession's responsibility and method live together in one role file.
Templates, taxonomies, and other invariant resources remain selective: startup
may load an indexed resource only when the singlepage index exports its ID and
the startup index imports the same ID. Do not move project findings, channel
searches, or communication decisions into `.agents`.

This is deterministic semantic isolation over a normally merged Git
repository; it is not a promise of physical confidentiality.

## Decision-scoped context

Load the effective active artifact, all relevant transitive `uses` dependencies,
the active role, the numbered workflow stage that invokes it, and the indexed
knowledge selected for the decision. Begin from the durable cursor and verify
current pipeline compatibility before accepting its prerequisite closure; do
not mix completed downstream artifacts into an
earlier decision unless invalidation makes them relevant. Read the current
stage's completion criteria in `.agents/` and the material questions in the
owning documents, plus any additional material needed to verify their claims. Project-specific domain, discovery, acquisition,
and communication dependencies resolve to one effective overlay just like the
project documents. Do not mix both complete layers, unrelated roles, unrelated
stages, unrelated channel knowledge, or every template into one model
context. The compatibility scan may compare headings and schema keys without
loading every document body. This separation prevents semantic collisions, not
thorough research.

Shared reverse dependencies are computed from `uses`. For product-local
Research/Sales, also follow confirmed Brief product IDs, catalog references,
and citations in Strategy and downstream outputs. Record explicit
product paths in those citations. A changed product finding invalidates its
consumers only; it does not rewrite client facts or unrelated product research.
Do not add a business-wide summary or a parallel dependency registry. Missing IDs, missing files, invalid import/export pairs, and cycles are
hard failures.

## Presentation content contract

The product catalog declares `presentation` (React entry point) and
`presentation_data` (its own YAML source). The YAML root contains
`schema: singlepagestartup.product-presentation.v1`, matching `product_id`,
`confirmation`, optional semantic `review`, and a product-owned `content` object.
The renderer is a default React component receiving `{ content }`; it never
loads other documents for copy. The shared catalog loader validates product
ownership and passes only that source's content. A product may define its own
content shape and compose shared layout/export components.

For structural migrations, preserve existing rendered content once in this
source; do not keep a live extraction binding. Review relationships remain
semantic: changed inputs trigger impact review, never automatic text replacement.

## Design layout context

Read `design/<layer>/layout.yaml` when changing the Design review structure.
Blank startup inherits the complete singlepage layout; a populated startup layout
replaces it. Load only its declared template/sections and their relevant imports,
from the selected layout's layer. Built-in blocks are optional, ordered choices;
custom sections support Markdown, TSX/JSX, HTML and media. Full templates may use
their own structure. Design Markdown, Assets, and CSS inheritance remain separate.
Use the workspace README for schema/props; shared helpers stay in utils. Do not
load every custom file into context or rebuild an old fixed template merely to
match historical headings. After changes, inspect the rendered result and review
semantic impact; confirmation of the primary document does not approve every
additional source. Record unresolved impact as stale in affected documents.

Model sources, source ownership and acyclic review edges follow `product-models.md`. Load a linked shared model once for all its consumers; never merge model collections across replaced catalogs.
