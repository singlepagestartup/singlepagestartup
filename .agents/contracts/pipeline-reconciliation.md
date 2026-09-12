# Pre-development pipeline reconciliation contract

## Purpose

The current checked-out `.agents/workflows/pre-development.md`, its referenced
roles, templates, contracts, and the active Workspace index define the pipeline
that every framework and downstream project must satisfy. After those shared
files are synchronized into a repository, the next `singlepagestartup`
invocation must discover any artifact work introduced by the new pipeline
without relying on chat history, context compaction, a stored pipeline version,
or a separate user command.

Run this reconciliation on every invocation after the mandatory GitHub preflight
and after reading the repository-owned layer cursor, but before accepting the
cursor or launching a professional owner. An unchanged pipeline makes this a
no-op. The repeated comparison is the change detector; do not add a workflow
version, migration ledger, timestamp, or pipeline hash to the cursor or living
artifacts.

This process checks compatibility and routes missing work. It is not an
automated prose-quality score and it never marks a professional artifact
complete merely because headings exist.

## Retiring the former Decision Profile

Do not recreate `knowledge/decision-profile/<layer>.md` or its template. If an
older checkout still has it, inspect that active layer once during migration.
Move only unique current facts, questions, constraints, sources, and partial
client decisions into their owning documents; omit duplicated or stale stage
summaries. Reusable rules belong in `.agents/`, never in another workspace
checklist. Preserve whole-document approvals in source metadata; profile-only
approval rows do not establish approval of a complete document.

Remove the retired source, template bindings, index entries, `uses` references,
and obsolete review fingerprints after reconciling its consumers. Preserve
remaining semantic dependencies and unresolved impact. If an old cursor names
`decision-profile`, route it to the earliest affected owning document in
`00-business` or a later stage; do not infer completion from deleting the file.
Empty startup overrides and atomic product-catalog inheritance remain unchanged.

## Retiring standalone Business

Apply `product-models.md` before accepting an old cursor or stage completion.
Inspect the active layer's old Business, Product Overview, Research, Sales,
custom pages and bindings. Make a section/field transfer map before deleting
anything. Brief receives request/authority/initial constraints; Product receives
customer/value/offer/acceptance; model sources receive revenue/resources/costs/
funding; whole processes stay in Sales; Research keeps connected evidence.
Unique material, source IDs and uncertainty must survive. Do not automatically
split a whole topic across BMC blocks or copy facts into every model.

A cursor with `active_artifacts: [business]` resumes at `00-business` with
`[product-models]`. A later cursor must also return there if initial model
membership or client-factual coverage is incomplete; only affected decisions
are blocked. `00-business` remains the stage ID, never a new Business page.
V1 catalogs remain readable while content attribution is pending. Upgrade to v2
only after model boundaries are explicitly chosen and sources created. Preserve
all products and extensions; empty startup stays empty. Remove Business sources,
stories, template/index/uses entries and obsolete fingerprints only after the
transfer is checked; mark affected consumers stale without copying new hashes.
Legacy bookmarks redirect to Products at the same source projection.

## Inspection scope

Use the current workflow and active index to inspect:

- every artifact and dependency belonging to a stage the cursor claims is
  complete;
- the recorded active artifacts and their prerequisite closure;
- every later non-empty living artifact, so an existing downstream document is
  not left on an obsolete shape merely because the cursor moved backward;
- product Research and Sales already created for confirmed Brief products,
  including sources prepared before the Products catalog;
- every product entry already present in the active resolved catalog and all
  files referenced by that entry.

First compare file existence, index declarations, headings, and schema keys.
Load full artifact content only for a discovered gap and its dependency closure.
This preserves decision-scoped context while still checking the complete
existing Workspace.

Primary review sources also need document-owned confirmation metadata per
`.agents/contracts/document-confirmation.md`. Migrate only existing attributable
whole-document approvals; otherwise use false. Empty startup remains pass-through.
Remove duplicated approval-status prose after preserving any partial decisions.

For Markdown artifacts, the current artifact template's second-level headings
are required structural sections unless the workflow explicitly says otherwise.
For YAML artifacts, require the schema and keys used by the current template and
workflow. For Products, require both `products/singlepage/catalog.yaml` and
`products/startup/catalog.yaml`. When migrating the earlier flat layer-named
catalog files, move each existing catalog into its own layer folder, preserving
its content and approval metadata, and update the index and source imports.
Keep the empty startup catalog as an explicit extension point; do not populate
it with framework product copies. Resolve every document and component field under
`products/<layer>/`, then require the atomic catalog shape and every referenced
`research.md`, `sales.yaml`, `product.md`, and every declared model source.
Website, Creative and Presentation are required at their delivery stage, not
at initial intake; if declared, their files must exist, including both
Presentation React entry and `presentation_data`. When a catalog entry declares optional
`content`, require its referenced React entry point but do not require any
particular supporting file extension or content schema. For optional `sections`,
recursively validate unique navigation IDs, page sources inside their selected
product folder, and file existence. A section using a core ID augments that tab;
other IDs add tabs. Do not recreate removed pages from the base catalog in startup.
React PDF pages must keep the shared mounted-slide contract. No extra section
is required merely because the template demonstrates one. Also compare the artifact's decisions
with the current stage completion rules and the material questions and
constraints in the owning document. A changed requirement inside an existing heading is therefore
still discoverable.

The stage ownership map is:

| Stage         | Existing artifacts to reconcile                                       |
| ------------- | --------------------------------------------------------------------- |
| `00-business` | Brief, catalog/model membership, initial Product/models, Sales intake |
| `10-strategy` | Product Research, then Strategy                                       |
| `20-brand`    | Brand                                                                 |
| `30-design`   | Design, Assets                                                        |
| `40-products` | Product catalog and every product-local output                        |

## Layer and inheritance rules

Resolve the active layer through the repository resolver before inspecting
sources.

- In the framework repository, reconcile and write only `singlepage` sources.
- In a downstream repository, inspect the resolved `default` artifact but write
  project-specific repairs only to `startup` sources.
- An empty startup source remains valid pass-through until that artifact becomes
  active for the downstream project. It cannot satisfy a project-specific scope,
  approval or evidence gate merely by inheriting an unrelated
  SinglePageStartup decision.
- When a newly added section is inherited from singlepage, inspect whether its
  content is genuinely applicable to the downstream project. Keep valid
  inheritance unchanged; write a startup section when the project needs a
  different answer; block and ask when applicability depends on an unknown
  operator fact.
- Do not copy an entire singlepage document into startup just to match a new
  template. Add only the project-owned section or decision required by the
  current pipeline.
- Product catalogs retain atomic inheritance. Once startup owns any product,
  reconcile only the complete startup catalog; never repair it with a
  singlepage product fallback.
  When an existing product uses an earlier directory layout, relocate its existing
  Research and Sales into its product folder and update the catalog references.
  Use only that layer's attributable sources, preserve product IDs and current
  content, and check references before removing obsolete owned files. Supporting
  activities stay in Brief/Strategy; they do not need a replacement registry.

When retiring a shared Research document, move each attributable finding and its
sources into the product it actually describes. Preserve source dates and IDs;
relocation is not fresh verification. Ask only when product attribution cannot
be established. Remove obsolete global index, sidebar, and dependency references
after updating consumers. Put unresolved research questions in the named
product Research for `10-strategy`. Separate market hypotheses and designed funnels from client
product models facts; preserve confirmed intentions with attribution. Keep existing
approvals unless the underlying decision changed.

When retiring the Evidence register, keep only material current facts, source
attribution, and constraints in their existing owners; preserve document approval
metadata. Replace remaining register links and presentation data bindings, then
remove the source, story, template, index entries, and mandatory loading steps.
Do not copy the register into another knowledge file or a duplicate log. Git
retains history; client dialogue and document confirmation remain the review flow.

Also scan the child-owned Brief, product models, Strategy, Brand, Design, nested
product Markdown/YAML, and data bindings for dangling register paths and old
row codes (including `ST-EV-*` and `SP-EV-*`). Recover each material meaning from
that child's earlier Git sources and replace the code with a short explanation
and attribution, retaining dates and limits where relevant. Deleting the code
or substituting only a document title loses context. Keep valid local Research
and asset references and historical engineering records. See
`engineering/downstream-migrations.md` for the general upstream review procedure.

## Gap classification and repair

Classify each discovered incompatibility before changing content:

- `structural-gap`: a current workflow artifact, index entry, file, required
  heading, schema key, product reference, or stable approval row is absent;
- `operator-fact`: the new section or rule requires a fact controlled by the
  operator;
- `research-question`: current external evidence is required;
- `professional-choice`: the owning role must make or remake a decision;
- `evidence-gap`: the required proof does not exist and must remain explicit.

For every gap:

1. Identify the earliest owning artifact and stage.
2. If current attributable facts and approved upstream decisions are sufficient,
   let that artifact's owner repair only the missing section or regenerate the
   artifact when the current workflow requires full replacement.
3. Never insert placeholder prose, infer an operator fact, copy SinglePageStartup
   business data into a downstream project, or preserve an obsolete decision
   merely to make the shape pass.
4. Compute reverse dependencies and mark only contradicted downstream artifacts
   stale. A new section that records an already-approved decision does not by
   itself invalidate that decision.
5. Move the layer cursor to the earliest incomplete stage. Set `status` to
   `in_progress` when an owner can repair it immediately, or `blocked` with exact
   artifact-section references when operator input or unavailable evidence is
   required.
6. Persist the repaired artifact and cursor before continuing. Re-run this
   reconciliation; normal stage work may resume only when no earlier pipeline
   compatibility gap remains.

If a required role, template, contract, index entry, or source file is missing
from the synchronized checkout, stop with a structural blocker. Do not recreate
shared pipeline files inside a project-specific Workspace.

## Handoff

Report whether reconciliation was a no-op or found gaps, the earliest affected
stage, repaired and still-missing sections, downstream artifacts invalidated,
and the resumed stage. Do not expose routine heading-by-heading checks when no
gap exists.

## Preserve product identity during structural migrations

Compare the client-confirmed product inventory before and after every Portfolio
or catalog migration. Move each confirmed product's attributable materials into
its own Products folder. Supporting acquisition value, lack of readiness, a
future launch, or exclusion from the current experiment never authorizes dropping
a confirmed product. Membership changes require an explicit client decision.

When migrating a derived presentation, capture its current displayed content in
its own presentation/data.yaml, register presentation_data, and remove runtime
extraction. Preserve the existing rendering where possible. Do not mark the new
independent document confirmed without attributable whole-presentation approval.

Design layout compatibility is checked separately from document decisions.
`design/<layer>/layout.yaml` selects ordered blocks or a custom template; its
absence/blank content can use inherited defaults. Do not restore omitted starter
blocks solely because a project intentionally changes its visual scope. Check
that declared section/template files exist in the selected layout layer, and
that actual in-scope decisions remain complete. Run the workspace validator and
browser review for structure changes. A new layout does not renew confirmation.
