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

## Compact Brief migration

Use the six current Brief template sections. Consolidate legacy Source request,
Founder wording, Decision subject and scope, Products in scope and Initial
context into current Project/products, Customers/value and Current state facts.
Restore the concise client-supplied business/resource facts formerly replaced
by links; do not derive them from later professional proposals. Transfer useful
goals/constraints into their owning section and retain visual preferences.
Compaction must preserve all five reference categories and their separately
reviewed descriptions, not merely keep file IDs. Do not discard or restart
confirmed visual discovery. Missing per-category analysis is completed from
supplied images by the professional owner; the client need not write it.
Preserve exact source and asset IDs, category readiness and unchanged scope
confirmation in frontmatter. Discuss contradictions with the operator; retain
only a material unresolved discrepancy in source metadata. Do not restore the
retired quotation, scope-status or unknowns sections to satisfy old headings.
Remove Brief's downstream `uses` edges and obsolete snapshots after inspection.

Review downstream impact before consuming it. Pure relocation is not a new
business decision; changed value, support, goals or facts can require substantive
model, research, strategy or brand work. Preserve unresolved stale markers and
valid partial decisions; never renew document approval during this migration.

## Compact Strategy migration

Strategy uses the five current template sections and owns the project-wide
marketing direction: goals, audiences, positioning, product roles, coordinated
channels, customer journey, retention, measurement and resource priorities.
Replace an experiment-centric legacy strategy instead of just renaming its
headings. Preserve current facts and strategic choices. Keep still-applicable
operator-supplied trial limits in their owning product/model sources; do not
promote them to ongoing budgets. Retire unapproved proposed test mechanics.
Replace roadmap, phased transition, backlog-style “next step”, preparation and
configuration prose with one concrete final picture of the whole project that
satisfies the approved Brief as fully as known constraints allow, plus durable
management rules. Keep the actual unfinished deliverables in their product
documents or coordinator handoff.
Detailed campaign and business-learning plans belong to product work; engineering
tests and runtime verification remain in the engineering workflow.

Remove a legacy Decision status section after retaining material unresolved
decisions beside their owning choice. Confirmation and stale state belong to
metadata and the Studio badge. Move consequential attribution to decision-keyed
frontmatter; remove empty blocker tables, downstream-document citations and
interview-history qualifiers. Update cursor anchors from `#decision-status`,
`#commercial-choice` or `#first-experiment` to `#strategic-direction`. This does
not renew approval. Review affected Brand, Design and product consumers.

## Strategy consistency across projects

The five sections in `.agents/templates/strategy.md` and the substantive
completion criteria in `pre-development.md` apply to both source layers.
There is no reduced downstream version of the marketing strategy.

- For a new downstream project, use its own Brief and relevant external
  research to author `strategy/startup.md`. The imported `template.strategy`
  supplies the common structure. An empty startup file can show the framework
  example in Studio, but cannot complete that project's Strategy stage.
- Reuse the method, not the example's business choices. Do not inherit its
  product count, audiences, monetization, channels, human/agent roles, metrics
  or resource commitments without project-specific grounds. Describe only
  outcomes and cross-product paths that fit the actual project.
- For an existing downstream project, the next `singlepagestartup` invocation
  after the shared files are synchronized checks the resolved Strategy even
  when the cursor is already later than `10-strategy`. Missing sections or an
  experiment-centric/tactic-only body route back to Strategy unless an earlier
  affected input also needs work. Repair the startup source, preserve applicable
  facts and flag materially affected dependents for review.
- Inherited sections may remain only when their applicability is explicitly
  confirmed in the owning startup source. Framework confirmation never approves
  a startup Strategy. Changed wording requires that project's review under the
  document-confirmation contract; synchronization does not renew approval.
- Section presence is necessary but insufficient. Review whether the goals,
  audiences, positioning, product roles, channels, journey, continued use and
  measures form a coherent project-specific target state that fulfills the
  approved Brief as fully as known constraints allow. A body organized around
  the path from the current state, transition phases, what to prepare, configure
  or do next is a Strategy compatibility gap even when all five headings exist.
  Do not claim that a structural validator alone certifies strategic quality.

These rules take effect in a checkout when it receives the shared workflow,
role and template changes. They do not update unsynchronized repositories or
require a separate stored pipeline version or manual migration command.

## Business-plan product consistency across projects

Apply the current `40-products` business-planning contract to both framework and
downstream product sets, including non-empty documents whose cursor is later or
whose previous headings already passed validation. Product defines the intended
offer and experience; its sixth H2 is `Business goals and metrics`. The complete
set forms a prospective business plan for later engineering.

- Inspect Product, model, Sales, Analytics, Research, Website, Creative, Presentation and
  optional customer content for implementation-audit framing. Installation
  checks, runtime acceptance matrices, bug repair, release/license-source audits
  and next-verification tasks cannot substitute for business decisions or gate
  this stage. Route affected product documents to `40-products`, not back to
  unchanged Brief, Strategy, Brand or Design merely because runtime proof is absent.
- Replace the former `Evidence and decision rules` section with project-specific
  goals, intended outcomes and useful business metrics. Preserve attributable
  client facts, market findings and commercial choices; distinguish planned
  outcomes and forecasts from measured results. Never invent operator figures.
- Reinterpret Sales `readiness` as completeness of the intended business process.
  Remove implementation-only blockers and replace technical `failure` text with
  relevant commercial alternatives, abandonment and help or continuation paths.
  Re-evaluate real business gaps; do not mark a process ready just by renaming fields.
- For a product Website with concrete pages, reconcile navigation into a site
  tree. Keep the journey in Overview and pair each route's Markdown text and
  optional React/HTML layout in one node using `representations`. Preserve actual
  copy and existing compositions when separating mixed overview/text/layout
  entries. Begin with Text; wire React to the same text source or update separate
  HTML alongside it. Missing layout does not prevent work on text. Apply this
  structure within the owning product layer; generic optional content stays free
  to use the existing mixed-format page contract.
- Keep Research focused on market and business decisions and Presentation focused
  on its business audience. Preserve material technical observations in source
  metadata when useful; Git retains removed history. Do not require customer
  guides, debugging material or test plans to complete the product set.
- Preserve valid approvals of unchanged upstream decisions. Review the semantic
  impact of revised product material, refresh only genuinely inspected dependency
  snapshots when there is no material effect, and keep changed document approvals
  unrenewed. Never copy a new hash to approve the rewritten plan.
- Apply changes only to the repository-owned layer and retain the atomic product
  catalog. A startup receives the method, not framework-specific customers,
  business targets, channels or product content.

This reconciliation runs after shared files are synchronized on the next normal
invocation, without a separate command, stored version or blanket approval reset.

## Compact Brand migration

Use the five current Brand template sections. Replace Decision status with
Brand identity, retaining exact names and brand/product relationships. Replace
process-heavy Governance with material Consistency rules. Approval records and
source attribution stay in metadata; preserve current meaning, messages, claims
and any scoped naming decisions. Route old Brand approval anchors to
`#intended-perception`. A changed meaning requires review and cannot inherit an
old body approval; valid visual inputs remain in Brief and Assets for Design.

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
`research.md`, `analytics.md`, `sales.yaml`, `product.md`, and every declared
model source. Every current product must declare its own `analytics` source.
An older product without it is valid migration input, not a compatible final
catalog: create the source in the repository-owned layer from the current
template, preserve any attributable observations found in existing materials,
and record unavailable measurements explicitly as `not measured`. Never copy
framework observations, infer zero values, or renew confirmation.
Website, Creative and Presentation are required at their delivery stage, not
at initial intake; if declared, their files must exist, including both
Presentation React entry and `presentation_data`. When a catalog entry declares optional
`content`, require its referenced React entry point but do not require any
particular supporting file extension or content schema. For optional `sections`,
recursively validate unique navigation IDs, page sources inside their selected
product folder, and file existence. A section using a core ID augments that tab;
other IDs add tabs. Require Analytics canonical headings and preserve current
values, periods, sources and explicit measurement gaps.
Promotion and Analytics are navigation groups rather than replacement documents;
retain the underlying Website, Creative, Presentation, Research and Analytics
sources. Do not recreate removed pages from the base catalog in startup.
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
future launch, or a lower marketing priority never authorizes dropping
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
The neutral Workspace header stays outside every project visual template: one
Design H1, status badge, purpose and usage, with content headings starting at H2.
Check this in inherited and populated startup layouts, including custom
templates and layouts without overview. Correct missing or duplicated headers
and project styles leaking into the review shell without changing or renewing
business-document confirmations when their meaning is unaffected.

## Sales segment compatibility

When Sales is revised in its owning layer, inspect Product Customer Segments and
migrate flat v1 intake to v2 under product-models.md. Declare stable Product IDs
in customer_segments metadata; preserve unique client facts, source attribution,
commercial unknowns, responsibilities and continuation paths. Add missing segment
profiles, motivations, acquisition and customer-perspective CJMs from attributable
facts or explicit professional proposals. Validate coverage so no Product segment
silently disappears. Shared rendering supplies the tree and selected segment;
never copy framework personas or create a project-specific navigation utility.
Keep empty blocked intake explicit. V1 readability is migration support, not proof
that an existing document meets the segmented Sales method. The owning stage is
00-business for missing factual intake or 40-products for professional development
of the confirmed audience. Review Website, Creative and Presentation impact;
preserve unchanged strategic direction and do not renew approval hashes.

## Material workspace compatibility

At the next invocation, inspect product materials in the owned layer. Split
undifferentiated creative galleries into meaningful selected outputs with paired
Text/Layout, preserving unique copy and assets. Adopt shared artboard/PNG tools;
use shared motion playback/MP4 only when selected. Presentations expose individual
slides and retain full-deck PDF. Content stays optional and free-form. Preserve
source-layer finding namespaces and whole-document confirmations. Changes to
layout utilities alone do not rewrite or reconfirm unchanged business decisions.
