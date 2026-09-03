# Context loading contract

## Resolution

1. Resolve repository identity from the `origin` remote, then fall back to
   `TARGET_REPO` or `GITHUB_REPOSITORY` only when `origin` has no recognizable
   GitHub identity.
2. When repository identity exists, apply its mapping from
   `apps/studio/workspace/config.yaml`, then `default_layer`. A conflicting
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

Every project artifact, project-specific knowledge item, shared profession
reference, and template is declared in a layer index with a stable ID, kind,
path, concise description, and `uses` IDs.

Operational workflow files are the only exceptions. First run the GitHub
preflight using the committed relevance and reconciliation ledger at
`apps/studio/workspace/pre-development/github/<layer>.yaml`; then read
`apps/studio/workspace/pre-development/<layer>.yaml`, follow
`.agents/contracts/pipeline-reconciliation.md`, and only then accept the cursor
and resolve artifact dependencies. The preflight and artifact loader call the same repository-layer
resolver; callers do not pass an independently chosen layer. Both operational
files are layer-local and are not inherited. The latter stores
only the durable pre-development cursor defined by
`.agents/workflows/pre-development.md`.

The indexes are registries, not content stores. The editable living
sources are colocated with their read-only Studio stories:

```text
apps/studio/workspace/<artifact>/
  index.stories.tsx
  singlepage.md
  startup.md
```

`<artifact>` is `brief`, `evidence`, `business`, `research`, `strategy`,
`brand`, or `design`. Assets use the same layout with `singlepage.yaml` and
`startup.yaml`. The complete direction inventory and its direction-specific
Research and Sales sources use:

```text
apps/studio/workspace/portfolio/<layer>.yaml
apps/studio/workspace/portfolio/<layer>/<direction-id>/research.md
apps/studio/workspace/portfolio/<layer>/<product-id>/sales.yaml
```

Every direction has Research. Only an active `product` has Sales. Product-local
delivery and communication sources use:

```text
apps/studio/workspace/products/<layer>.yaml
apps/studio/workspace/products/<layer>/<product-id>/
  product.md
  website.md
  marketing-creative.md
  presentation/ProjectPresentation.tsx
  content/Content.tsx # optional; internal files and formats are product-owned
```

The optional Content directory is a product-local context source rather than a
fixed document contract. When a catalog entry declares `content`, load the
entry component and only the supporting files relevant to the current product
decision. Do not assume Markdown, a video schema, or a universal set of content
types; follow the component's imports and the product's local organization.

Project-specific working knowledge follows the same terminal
layer pattern under `apps/studio/workspace/knowledge/<kind>/`. Resolve paths
from `apps/studio/workspace/index/<layer>.yaml`; do not hard-code a parallel
content path or treat a generated inventory as project knowledge. There is no
second repository-root `workspace/` namespace.

## Project artifact resolution

The `singlepage` brief, evidence, business, portfolio, research, strategy, asset
index, brand, design, and product catalog describe SinglePageStartup itself: its real
business, direction, communication, design, and offers. They are not templates.
Brand owns intended meaning and communication; Design is its medium-independent
visual translation. Product-local Website, Marketing Creative, and Presentation
apply those shared decisions and never serve as Brand or Design inputs.

Project-specific domain, discovery, acquisition, and communication work is
grouped by knowledge kind:

```text
apps/studio/workspace/knowledge/{decision-profile,discovery,acquisition,communication}/
  singlepage.md
  startup.md
```

Every layered startup index entry explicitly names its singlepage source with
`extends` and its merge `strategy`. Resolution follows these rules:

- treat a declared but empty startup file as no override;
- `sections`: merge Markdown headings and let non-empty startup sections win;
- `replace`: once startup has meaningful content, replace the entire
  domain-specific knowledge document;
- `keyed`: merge YAML objects and ID-keyed arrays with startup values winning;
- `scoped-keyed`: merge evidence rows by stable ID while preserving scope and
  state;
- `portfolio-catalog`: if startup has no directions, inherit the complete
  singlepage Portfolio; otherwise use only the complete startup Portfolio and
  never merge directions or their referenced files across business layers;
- `product-catalog`: if startup has no products, inherit the complete
  singlepage catalog; otherwise use only the complete startup catalog and never
  merge entries across business layers;
- keep one effective artifact in context and retain both canonical source paths
  as provenance.

For an active startup, inherited evidence scoped `singlepage` is provenance
only and cannot support a startup claim. Only active `startup` or `shared`
evidence, or a startup row that explicitly adopts or supersedes a base row, may
be used. `not-applicable` and `superseded` rows remain visible history but are
excluded from active claim support.

Each Portfolio direction and product-catalog entry owns all referenced files in
its own layer. There is no per-direction, per-product, or per-file fallback after
the corresponding startup catalog becomes active.

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
earlier decision unless invalidation makes them relevant. Load decision-profile
rows assigned to the current stage and owner, plus any additional material
needed to verify their claims. Project-specific domain, discovery, acquisition,
and communication dependencies resolve to one effective overlay just like the
project documents. Do not mix both complete layers, unrelated roles, unrelated
profile stages, unrelated channel knowledge, or every template into one model
context. The compatibility scan may compare headings and schema keys without
loading every document body. This separation prevents semantic collisions, not
thorough research.

Reverse dependencies are computed from `uses`; they are not stored as editable
lists. Missing IDs, missing files, invalid import/export pairs, and cycles are
hard failures.
