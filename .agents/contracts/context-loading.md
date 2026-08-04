# Context loading contract

## Resolution

1. Use an explicit layer supplied by the operator when present.
2. Otherwise apply gitignored `apps/studio/workspace/config.local.yaml` when it
   declares `active_layer`.
3. Otherwise read `apps/studio/workspace/config.yaml`: use its repository
   mapping when one matches, then its `default_layer`.

The committed default is `startup`. The canonical
`singlepagestartup/singlepagestartup` repository is explicitly mapped to
`singlepage`, so downstream users need no configuration.

Every project artifact, project-specific knowledge item, shared profession
reference, and template is declared in a layer index with a stable ID, kind,
path, concise description, and `uses` IDs.

Workflow control state is the only exception: read
`apps/studio/workspace/pre-development/<layer>.yaml` before resolving artifact
dependencies. It is layer-local, is not inherited, and stores only the durable
pre-development cursor defined by `.agents/workflows/pre-development.md`.

The indexes are registries, not content stores. The eight editable living
sources are colocated with their read-only Studio stories:

```text
apps/studio/workspace/<artifact>/
  index.stories.tsx
  singlepage.md
  startup.md
```

`<artifact>` is `brief`, `evidence`, `business`, `research`, `strategy`,
`brand`, or `website`. Assets use the same layout with `singlepage.yaml` and
`startup.yaml`. Project-specific working knowledge follows the same terminal
layer pattern under `apps/studio/workspace/knowledge/<kind>/`. Resolve paths
from `apps/studio/workspace/index/<layer>.yaml`; do not hard-code a parallel
content path or treat a generated inventory as project knowledge. There is no
second repository-root `workspace/` namespace.

## Project artifact resolution

The `singlepage` brief, evidence, business, research, strategy, asset index,
brand, and website describe SinglePageStartup itself: its real business,
direction, communication, and design decisions. They are not templates.

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
- keep one effective artifact in context and retain both canonical source paths
  as provenance.

For an active startup, inherited evidence scoped `singlepage` is provenance
only and cannot support a startup claim. Only active `startup` or `shared`
evidence, or a startup row that explicitly adopts or supersedes a base row, may
be used. `not-applicable` and `superseded` rows remain visible history but are
excluded from active claim support.

Do not write a resolved copy. Agents and Studio use the same in-memory result.
An agent writes only the indexed source for the active layer. The operator reads
that same source file directly and reviews its `singlepage`, `startup`, or
resolved `current` projection in Storybook.

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

## Minimal context

Load the effective active artifact, its transitive `uses` dependencies, the
active role, the numbered workflow stage that invokes it, and only the indexed
knowledge selected for the decision. Begin from the durable cursor and verify
only its prerequisite closure; do not re-read every completed or downstream
artifact merely to resume work. Load only decision-profile rows assigned to the
current stage and owner. Project-specific domain, discovery, acquisition, and
communication dependencies resolve to one effective overlay just like the
project documents. Do not load both complete layers, unrelated roles, all
profile stages, all channel knowledge, or every template.

Reverse dependencies are computed from `uses`; they are not stored as editable
lists. Missing IDs, missing files, invalid import/export pairs, and cycles are
hard failures.
