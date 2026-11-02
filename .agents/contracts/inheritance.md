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
  parser and merger, in memory. Nobody writes a
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
  `uses` edges; check references first and preserve current facts and sources. The workspace holds
  current inputs and executable support, not migration archives.

## Product catalogs

Products of two businesses must never mix. Both source-layer folders have a
catalog from the outset. An empty startup catalog inherits the complete
singlepage catalog for the resolved view. The first startup product replaces
the whole catalog, including materials and component selection.

Every product owns its referenced files under `products/<layer>/<product-id>/`.
All paths, including React sources and nested pages, resolve within that layer.
A missing startup file is an error, not a fallback to a framework product.
Shared loaders, rendering and tests belong to `workspace/utils/`.

Use the current schema only. Product descriptions have reader-oriented headings;
site, presentation and advertising copy lives in the final artifact source.
The full file contract is `.agents/references/studio-artifacts.md`.

## Design layout, styles and fonts

- `design/<layer>/layout.yaml` selects and orders the visible Design sections
  or names a complete template. An empty startup layout inherits the complete
  singlepage layout; a populated startup layout replaces it and reads every
  declared file from its own layer. Load only the selected layout's declared
  template, sections and relevant imports. A section group has a title and
  nonempty `children`; every descendant source still belongs to that layout
  layer. Component categories preserve state while switching; catalogue HTML
  downloads include all categories. Section inheritance of
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
- The shared review shell, one neutral document header with current page title, product label and exports, belongs to Studio and is inherited by every
  project. Project templates start their content at H2 and scope their styles
  to the canvas; a downstream design owns its visual choices and never restyles
  the Workspace shell.
- The presentation export writes derivatives only below
  `apps/studio/output/<layer>/`; a caller assertion that conflicts with
  repository identity stops the export.

## Downstream applicability

- Inherited framework facts are reference context. Attribute
  project-specific facts to the customer's inputs; a proposed applicability
  statement is not customer confirmation.
- Empty startup documents may inherit their framework presentation. Such
  inheritance never establishes that the framework's audiences, economics,
  research or visual choices apply to the customer's business.
- When a synchronized template adds a section, preserve valid inherited
  structure and write the project's answer in its owning startup source.
  Ask about unknown facts needed by the selected decision and continue
  independent work. Missing answers never block navigation or reset the cursor.
- Both layers use the same templates. The downstream project owns its Brief,
  products, research, semantics, Strategy, Brand, Design and materials. Its
  product count, prices, audiences and commitments require project-specific
  grounds.
- A downstream project records its own Design and asset choices when working
  on that section. The brandbook diagnostic identifies inherited or missing
  choices without blocking Studio or moving the cursor. Never copy framework
  prose or manufacture approval to clear a diagnostic.
- Design review keeps the same catalogue structure in both layers: reusable
  foundations, task-based `Interface kit` categories, then `Content blocks`
  composed from kit elements. Put shared shape, spacing and interaction rules
  at the beginning of Interface kit. Put each component or composition rule
  beside its corresponding rendered example: show the intended treatment and
  what to avoid, with reference asset IDs in collapsed source details. Keep
  usage, states and implementation recipes in the example's own details. A
  separate grid of text-only pattern cards does not replace this presentation.
  The owning Design document remains the source of the rules and provenance;
  bind the review notes to that layer's resolved content instead of copying
  framework decisions into project components. Preserve canonical category
  and specimen IDs, titles and interaction contracts while applying the
  project's approved typography, semantic colors, icons, density and shapes.
  Framework layout structure does not require the Living Focus style or its
  eight reference patterns; the project supplies its own applicable rules,
  evidence and source records.
