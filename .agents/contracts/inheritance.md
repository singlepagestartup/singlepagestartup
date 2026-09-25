# Inheritance contract

Two source layers and one resolved view describe every project. The unit of
inheritance is a whole indexed document or catalog keyed by its stable ID, in
the same way `libs/modules` variants extend a base: startup adds or replaces a
unit, and nothing merges by accident.

## Layers and projections

| View         | Meaning                                                             | Editable source                       |
| ------------ | ------------------------------------------------------------------- | ------------------------------------- |
| `singlepage` | The SinglePageStartup framework's own business and design decisions | `<artifact>/singlepage.md` or `.yaml` |
| `startup`    | Changes owned by the current downstream project                     | `<artifact>/startup.md` or `.yaml`    |
| `default`    | The effective result after startup is applied to singlepage         | Read-only; resolved in memory         |

- Agents and Studio resolve `singlepage → startup → default` with the same
  parser, merger and confirmation resolver, in memory. Nobody writes a
  `default` file, a resolved copy, a release version, a snapshot, a run journal
  or a second editable artifact set; Git is the history.
- An agent writes only the indexed source of the active layer: the framework
  repository writes `singlepage`, a downstream repository writes `startup`,
  including for GitHub reconciliation effects. A downstream checkout never
  edits the inherited `singlepage` base.
- Startup sources begin as zero-content files and hold only project-specific
  additions and overrides. Do not copy unchanged framework prose into them, and
  do not copy an entire singlepage document into startup to satisfy a new
  template. Retain empty indexed startup sources; they are the explicit
  inheritance boundary.
- Singlepage artifacts describe the actual SinglePageStartup project. They are
  worked examples of the method, not templates, and never the downstream
  project's facts, direction or approval.

## Layer resolution

1. Resolve repository identity from the `origin` remote; fall back to
   `TARGET_REPO` or `GITHUB_REPOSITORY` only when `origin` has no recognizable
   GitHub identity.
2. With an identity, apply its mapping in
   `apps/studio/workspace/utils/config.yaml`, then `default_layer`. The
   canonical `singlepagestartup/singlepagestartup` repository is mapped to
   `singlepage`; the committed default is `startup`, so a downstream user
   configures nothing.
3. Only without an identity, use `active_layer` from the gitignored
   `config.local.yaml`, then the committed default. That file may contain only
   `active_layer`; a value that conflicts with a detected identity is an error.

A heading is part of the structure a layer inherits, not of its content. Every
heading the framework document declares appears in the layer that inherits it,
spelled exactly the same way, including the title: a document headed `# Design`
upstream stays `# Design` downstream, and `## Strategy` never becomes
`## Стратегия`. A layer writes the body of an inherited section in its own
language and adds whatever sections its business needs beside them; it does not
translate, rename or drop one it inherits, because the name is how both layers
refer to the same section. The pipeline check reports a renamed heading.

The GitHub preflight, the workspace loader, the pipeline check and the
presentation export share this resolver. Explicit layer arguments exist only as
assertions for validators, diagnostics and read-only source projections; a
mismatch is a hard failure and never overrides repository routing.

## Workspace and indexes

All project business context lives under `apps/studio/workspace/**`; there is
no repository-root `workspace/` namespace. Reusable methods, templates and
contracts live under `.agents/**` and never receive project facts, findings or
communication decisions.

```text
apps/studio/workspace/
  <artifact>/{singlepage,startup}.md          # brief, strategy, brand, design
  design/{singlepage,startup}/layout.yaml     # plus layer-owned section files
  assets/{singlepage,startup}.yaml
  assets/<layer>/{fonts,intake,generated}/
  styles/{singlepage,startup,default}.css
  products/{singlepage,startup}/catalog.yaml
  products/<layer>/models/<model-id>/model.md
  products/<layer>/<product-id>/              # documents, data and React entry points together
  knowledge/<kind>/{singlepage,startup}.md    # optional indexed project knowledge
  utils/config.yaml
  utils/index/{singlepage,startup}.yaml
  utils/pre-development/{singlepage,startup}.yaml
  utils/pre-development/github/{singlepage,startup}.yaml
  utils/{components,products,design,media,stories}/
```

- `utils/index/<layer>.yaml` is the artifact graph: stable IDs, kinds, paths,
  descriptions and `uses` edges. It stores no content. Missing IDs, missing
  files, invalid import/export pairs and cycles are hard failures.
- Every layered startup entry names its singlepage source with `extends` and a
  merge `strategy`. A declared but empty startup file is no override;
  `sections` merges Markdown headings and lets non-empty startup sections win;
  `replace` swaps the whole document once startup has meaningful content;
  `keyed` merges YAML objects and ID-keyed arrays with startup values winning;
  `product-catalog` is atomic, as described below. One effective artifact stays
  in context, and both source paths remain provenance.
- Section merging can replace an inherited base section but never remove it. A
  base section the project does not want needs a startup override or an
  explicit out-of-scope decision in the owning document.
- Brief is the root client input with no `uses` edges on later decisions; its
  attachments and reference asset IDs are provenance, not approval edges. Do
  not reconstruct Brief facts from later documents.
- The cursor and the GitHub ledger under `utils/pre-development/` are
  layer-local and never inherited.
- Startup may load an indexed `.agents` resource only when the singlepage index
  exports its ID and the startup index imports it. Role and template files are
  invariant across projects. This is deterministic semantic isolation over one
  merged Git repository, not physical confidentiality.
- Remove retired files together with their index entries, imports and exports,
  `uses` edges and obsolete review fingerprints; check references first, and
  preserve current bodies, approvals and unresolved impact. The workspace holds
  current inputs and executable support, not migration archives.

## Products and models

Product catalogs use a stricter rule because products of two businesses must
never mix. Both `products/singlepage/` and `products/startup/` exist from the
outset with their own `catalog.yaml`, like the explicit base and extension
folders in `libs/modules`.

- An empty startup catalog (`products: []`) inherits the complete singlepage
  catalog, including its models. The first startup product replaces the whole
  catalog: models, products, materials and component selection.
- Every product and model belongs to exactly one layer and owns every file its
  catalog entry references. Every catalog path, including presentation data,
  React entry points and nested `sections` pages, resolves below
  `products/<layer>/`; a missing startup file is an error, never a fallback to
  a singlepage folder. Do not copy framework product folders into startup, and
  never repair a startup catalog with a singlepage product.
- A shared model is registered once by its catalog ID and referenced by its
  products; load it once for all consumers and never merge model collections
  across replaced catalogs. Product-local JSX/TSX, HTML, images, data and
  nested folders stay inside the product folder; shared loaders, components and
  tests stay in `workspace/utils/`.

## Design layout, styles and fonts

- `design/<layer>/layout.yaml` selects and orders the visible Design sections
  or names a complete template. An empty startup layout inherits the complete
  singlepage layout; a populated startup layout replaces it and reads every
  declared file from its own layer. Load only the selected layout's declared
  template, sections and relevant imports. Section inheritance of
  `design/<layer>.md`, Assets resolution and the cascade of
  `styles/{singlepage,startup,default}.css` stay independent of the layout.
- Font files and licenses belong to the layer that selected them, below
  `assets/<layer>/fonts/`, beside that layer's registry. Keep
  `assets/startup/fonts/` empty until the downstream project selects its own
  fonts and never copy inherited singlepage fonts. A startup typography
  override supplies its own complete role rows, registered font assets and
  layered CSS; an empty startup keeps the singlepage rows and files. Resolved
  presentation styles use startup font declarations when they exist and
  otherwise continue through the singlepage layer.
- Accepted intake files live below `assets/<layer>/intake/<category>/` and
  generated outputs below `assets/<layer>/generated/<proposal_id>/` of the
  layer that accepted or produced them. Never place a singlepage input in
  startup or a startup input in singlepage.
- The shared review shell, one neutral document header with confirmation
  badge, title, purpose and usage, belongs to Studio and is inherited by every
  project. Project templates start their content at H2 and scope their styles
  to the canvas; a downstream design owns its visual choices and never restyles
  the Workspace shell.
- The presentation export writes derivatives only below
  `apps/studio/output/<layer>/`; a caller assertion that conflicts with
  repository identity stops the export.

## Downstream applicability

- Inherited framework facts, decisions and approvals are reference context.
  They become the downstream project's facts only when the client confirms
  applicability in the owning startup source, and a startup document that
  changes inherited content needs its own confirmation under
  `.agents/contracts/document-confirmation.md`.
- An empty startup source is valid pass-through until its artifact becomes
  active for the project. It cannot satisfy a project-specific scope, approval,
  evidence or visual-intake gate by inheriting an unrelated SinglePageStartup
  decision; the pipeline check reads such gates from the layer's own file.
- When a synchronized template adds a section that startup inherits, inspect
  whether the inherited content genuinely applies: keep valid inheritance
  unchanged, write a startup section when the project needs a different
  answer, and block on the owning document when applicability depends on an
  unknown operator fact. Add only the project-owned section or decision the
  current pipeline requires.
- Strategy, Brand, Design and every product document use the same templates and
  completion criteria in both layers; there is no reduced downstream version.
  A downstream project authors `strategy/startup.md`, `brand/startup.md`,
  `design/startup.md` and its own catalog from its own Brief and research. It
  does not inherit the framework's product count, audiences, monetization,
  channels, human/agent roles, metrics, offers, numbers, personas or resource
  commitments without project-specific grounds.
- A downstream project owns its brandbook. Once its cursor reaches `30-design`,
  `design/startup.md` must hold decisions of its own with its own operator
  confirmation and `assets/startup.yaml` must register at least one owned
  asset. An inherited singlepage approval never satisfies this gate: write the
  startup layer or move the cursor back to the stage that is actually current,
  and never copy framework prose to silence the check.
