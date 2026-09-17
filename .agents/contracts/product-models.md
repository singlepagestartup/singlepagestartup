# Product models and content ownership

## Model and layer boundary

A business model describes one coherent creation, delivery and capture of value.
Products are catalog entries, not automatically separate canvases. Use
`singlepagestartup.product-catalog.v2` with `models: [{id, name, source, uses?}]`
and each product's `model` ID. `source` is Markdown under
`products/<layer>/models/<id>/`. Optional `uses` links other models owning shared
resources; IDs must exist in this catalog and the graph must be acyclic.
Shared resources keep one owner, scope and allocation basis. A reference does
not create another budget. Per-product prices/terms retain their product IDs.

Empty startup inherits the entire base catalog including models. Nonempty
startup replaces the entire set; missing models never fall back to singlepage.
All confirmed products survive regardless of marketing priority. V1 remains
readable as migration input; absence of a model is an unresolved migration,
not permission to infer one model per product.

## Whole-page ownership

| Page                       | Owns                                                                                                                                                                                                                                                                                                                                | Business Model Canvas coverage                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Product                    | Overview: identity/owner/state/boundary; five customer roles; circumstances, jobs, pains/gains, desired result; alternatives and value; included/excluded scope, intended access and use, support promise and rights; business goals and metrics. Optional Product Content is nested beside Overview without merging their sources. | Customer Segments; Value Propositions                                            |
| Operations & Economics     | Model scope; per-product money terms; shared resources, activities, partners, costs/allocation; funding and material unknowns                                                                                                                                                                                                       | Revenue Streams; Key Resources; Key Activities; Key Partnerships; Cost Structure |
| Sales                      | Intended customer process from discovery and consideration through acquisition, use, support and retention; owners, inputs, handoffs, commercial alternatives and metrics                                                                                                                                                           | Channels; Customer Relationships; operational Key Activities                     |
| Promotion                  | One navigation surface for Website, Marketing Creative and Presentation; each material retains its own copy, layouts and permitted exports                                                                                                                                                                                          | Derived applications, never independent sources of price or scope                |
| Product Content (optional) | Materials delivered to/used by the consumer, with product-defined nesting/formats                                                                                                                                                                                                                                                   | Product delivery, separate from marketing                                        |
| Analytics                  | Current funnel, usage, retention, revenue and attributable-cost observations with periods, sources and limitations                                                                                                                                                                                                                  | Observed feedback about whichever model decisions are being tested               |
| Research                   | Market and business questions linked to model assumptions; customer, competitor, price and channel evidence, limits and implications                                                                                                                                                                                                | Whichever model decisions need evidence                                          |

Use exactly the canonical H2s in each primary template in both source layers;
project extensions belong in catalog sections/pages (no prescribed Markdown
schema for extra pages). Do not create nine mandatory tabs or a duplicate canvas
overview. Sales stays one product tab with an overview and an internal customer-segment
tree. Each segment has its own complete decision profile and Customer Journey Map
(CJM), rather than one undifferentiated process for every audience. The owner map
documents coverage without a canvas-block navigation menu or a claim that the model
is validated. Prefer about 1,400 words per reviewable page, preserving all material
information under `.agents/contracts/document-readability.md`. No aggregate Sales
YAML, Research corpus or segment-count cap applies.

Brief owns a self-contained current intake: request, goals, authority, product
inventory, customer/value/delivery facts, known price and funding, resources,
costs and constraints. Product, model and Sales elaborate those inputs; their
analysis, calculations and full processes do not accumulate in Brief. Its core
facts must never be replaced by links to these downstream documents. Source
attribution may be keyed to statements/sections in frontmatter; edit history
lives in Git and review state in metadata, not in the Brief body.

## Work order and evidence

After scope confirmation at `00-business`, Business Analyst records initial
Product/model and supplied Sales intake. Intake may contain explicit unknowns;
unknown prices, budgets, capacity or owners are never invented. Practical
Website/Creative/Presentation fields may be absent until prepared. Analytics may
begin with an explicit unmeasured state and gains observations only from inspected
sources. Every active product owns an Analytics source by `40-products`; Product
Content remains optional. All declared files must exist. The initial stage
persists; it no longer has a Business output.

At `10-strategy`, product Research tests named model/product assumptions before
selection. Market observations never override client facts; agreement with a
model never proves demand. Later owners develop the agreed offer and materials.
Read and preserve unique existing content before a rerun or migration.

## Business planning before engineering

At `40-products`, the product set forms one prospective business plan and product
requirements: who it serves, the value offered, intended customer experience,
economics, growth and communication. Describe expected behavior as requirements;
functioning implementation is an engineering responsibility, not a business-stage
acceptance test. Installation checks, runtime testing, bug repair and audits of
release or license-source files do not gate completion of these documents.

Keep current client facts, market observations, professional choices and forecasts
distinguishable. A planned capability or outcome is not an observed result.
Commercial assumptions need an explicit basis; never invent the operator's budget,
capacity, revenue, customers or numerical targets. Selected commercial/license
terms belong to the plan; inspecting their implementation belongs to engineering.

Sales `readiness` describes completeness of the intended business process. A ready
process can precede implementation. Block it only for missing material business
decisions; `failure` records commercial alternatives, abandonment, unavailable
offers and a help or continuation path, not technical error handling. Research
investigates the market and business choices. Presentation explains the opportunity,
customer, offer, model and growth to clients, partners or investors; it is not an
internal QA checklist. Optional customer guides belong to Product Content and do
not require debugging instructions or a test plan.

These rules apply equally to framework and downstream projects, using each
project's own facts and approved direction. Market learning may inform commercial
choices; engineering tests never become product-document completion gates.

## Segmented Sales workspace

Author new or revised Sales in `singlepagestartup.sales-process.v2`. Product owns
stable segment IDs in frontmatter `customer_segments: [segment-id]` and describes
those same segments under Customer Segments. Sales `segments[].id` references them.
A ready Sales covers every declared Product segment, with no unknown or duplicate
IDs. Segment IDs are scoped by the catalog product and source layer. Do not turn
a tool or intermediary into a payer; identify the human or organization receiving
value and making or delegating decisions.

The source remains product-owned `sales.yaml`. Shared rendering automatically
provides Overview → Customer segments → one page per segment, plus any explicitly
added catalog Sales pages. No project-specific sidebar component is needed.
Each segment defines audience and roles; needs/pains; motivations; decision
trigger and criteria; value proposition; objections, truthful responses and what
to show; acquisition channels with customer context, message, CTA and destination;
and its own `journey`. Name the visible map **Customer Journey Map (CJM)**.
A segment page also exports its own Markdown from the same YAML, excluding review
metadata. Whole-Sales confirmation appears beside its selected page title;
selecting a segment never grants it an independent approval.

Each CJM step retains operational owner, entry context, required information,
action, exit, alternative/continuation and metric, and adds customer goal, action,
question, desired experience and touchpoint. The map shows the customer's
perspective over time, with responsibilities in an expandable supporting section.
Help or community contribution may be optional continuations, not obligatory
conversions. Acquisition describes where and why this audience arrives, not only
a list of platforms. For free products, the decision is adoption; do not invent a
purchase. Motives, questions and emotional expectations may be professional
proposals with attribution; never report them as interview findings without data.
Use NN/g's Journey Mapping 101 (https://www.nngroup.com/articles/journey-mapping-101/)
for actor, scenario and perspective; a designed future journey is not observed behavior.

Website and Marketing Creative consume the relevant segment's needs, motives,
objections, message and CJM moment. Record the target segment and relevant journey
or acquisition ID in a material's metadata when authoring or revising it; write
copy to that situation rather than a generic average audience. Review Sales input
changes before reusing materials. Research remains a separate evidence owner.

Website must cover the complete applicable customer journey rather than only the
landing page and primary workspace. Turn Sales access, registration, purchase,
settings, fulfillment or publication, continuation, support and contextual
product handoffs into explicit routes or deliberate in-page transitions. Keep
the rendered Website and Creative bodies focused on project-specific customer
experience and final copy. Framework mechanics, approved-design reminders,
generic responsive/accessibility checklists, dependency or approval prose,
backend/security architecture and “awaiting review” conclusions belong to roles,
metadata and engineering work, not these business-facing documents.

V1 Sales remain readable during migration, without pretending a flat operational
sequence contains customer profiles. At the next owned Sales revision, transfer
unique intake and source attribution to v2, preserve product boundaries, and
review affected downstream materials. Empty blocked v2 intake uses `segments: []`
with explicit business unknowns. Never fill a startup with framework personas.

## Dependencies

Shared model review IDs are `model.<id>`; each is registered once. Models use
Brief and explicitly referenced resource-owning models. Research uses Brief and its model; its assumption links identify the question
being tested. Model citations of Research findings are reviewed by the agent,
not reciprocal approval edges. Product uses Brief, Research and its model. Sales uses Product and model.
Strategy uses models and product Research/Sales. Analytics uses Product, Sales and
the model without copying their definitions. Research observes Analytics as evidence
without making it a reciprocal approval dependency. Website uses Product, Sales,
model, Strategy, Brand and Design; Creative and Presentation retain their relevant
product/design dependencies. A local Product change can require review of shared
Strategy through Sales, so shared material review is intentional when that happens.

Research remains the upstream evidence owner. Do not add reciprocal Research ↔
model/Product approval edges: citations identify tested decisions without a cycle.
When model decisions change, the agent revisits affected research questions;
when findings change, the agent reviews their cited model assumptions before
consuming them. Never mutate client facts automatically from research.

Existing review resolution, confirmation metadata and content fingerprints remain
canonical. Added/removed inputs require impact review. A structural move does not
renew confirmation, replace approved text or clear stale state. Material effects
keep `review.stale` until resolved; no-effect review updates only genuinely
inspected inputs. Material wording in Website/Creative/Presentation is authored
from approved Product/model/Sales facts and reviewed when those inputs change.

## Material workspaces

Product is the first top-level Studio surface. Its badge tabs place Overview and
optional Product Content together while preserving separate sources, page trees
and confirmation. Promotion is the single top-level surface for Website,
Marketing Creative and Presentation; badge tabs preserve each material's source,
nested pages, Text/Layout views and exports. Analytics is the final top-level
surface; its badge tabs keep current observations and connected Research in one
evidence context. Agents edit product-owned source files in the same conversation;
Studio previews those files and exports results.
No external chat or manual copying pipeline is required.

Marketing Creative groups actual selected deliverables, such as covers, articles,
posts and storyboards, in the catalog tree. Use editable HTML text over registered
media with shared fixed-size artboards and PNG export. Short motion graphics use
the same copy and shared Remotion playback/browser MP4 export when selected. Do
not impose every format on every product. Canonical wording lives once in its
Markdown source and is passed to its layout; static/motion variants can share it.

Presentation copy stays in its own YAML. Each slide has a separate tree entry,
Text/Layout, bounded artboard and PNG export. Full-deck PDF includes the complete
ordered deck. Custom schemas provide explicit slide Markdown or a formatter;
never infer editable copy from rendered HTML or another business document.
Confirmation belongs to the whole deck, not individual slide selection.

Product Content remains optional and free-form: README, lessons, handouts,
templates, images and media can reuse these tools. Include only authored content,
not an entire repository to show its README. Keep tree, confirmation, artboard,
export and motion code in workspace utils; copy, images and compositions stay in
the owning product layer. Place confirmation beside the material title, outside
artboards and exports. See workspace/utils/media/README.md for the shared APIs.

## Language and vocabulary

Use the repository's existing internationalization configuration and language
codes for multilingual materials; do not introduce a competing locale registry.
Short localized fields follow the existing keyed-value convention (for example
`title: { en: "...", ru: "..." }`). Long-form copy may use separate locale-owned
Markdown files with the same semantic section IDs. The selected locale must be
the same in Text, Layout and exported output.

A customer-facing page, slide, cover or message uses one language throughout:
headings, body, navigation, CTA, tooltips, progress/errors, accessibility labels
and metadata. Keep proper product names and technical identifiers unchanged.
Translate the meaning of an operator-supplied CTA into the artifact language;
do not paste a chat-language quote into another language's published copy.
Language comparisons in specifications may explicitly show both translations.
Use the approved Brand vocabulary consistently across localized materials.
Missing translations must be completed before claiming that locale is ready;
never silently mix languages or claim an unimplemented language switch exists.
For production components, use the framework's existing localized fields,
language context and SDK providers. Studio authoring does not need live API data.
An operator-review translation in chat is not a second canonical `default` copy
and does not confirm the translated or source document.

Apply `.agents/contracts/research-sales-audit.md` for segment-by-segment Sales
validation, competitor detail, evidence verdicts and the reusable Research tree.
