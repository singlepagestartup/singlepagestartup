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
All confirmed products survive regardless of experiment priority. V1 remains
readable as migration input; absence of a model is an unresolved migration,
not permission to infer one model per product.

## Whole-page ownership

| Page                                        | Owns                                                                                                                                                                                                                                                            | Business Model Canvas coverage                                                   |
| ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Product                                     | Identity/owner/state/boundary; five customer roles; circumstances, jobs, pains/gains, desired result; alternatives and value; included/excluded scope, access/result unit, usage and acceptance, support promise and rights; evidence/objections/decision rules | Customer Segments; Value Propositions                                            |
| Operations & Economics                      | Model scope; per-product money terms; shared resources, activities, partners, costs/allocation; funding and material unknowns                                                                                                                                   | Revenue Streams; Key Resources; Key Activities; Key Partnerships; Cost Structure |
| Sales                                       | Complete process from awareness/evaluation through purchase, delivery, support/retention and recovery; owners, inputs/actions/transitions/handoffs, failure and metrics                                                                                         | Channels; Customer Relationships; operational Key Activities                     |
| Research                                    | Questions and tested model/assumption IDs; methods, observations, evidence, contradictions, limits and implications                                                                                                                                             | Whichever model decisions need evidence                                          |
| Website / Marketing Creative / Presentation | Usable product materials in existing supported formats; presentation owns data and React pages/PDF                                                                                                                                                              | Derived applications, never independent sources of price or scope                |
| Product Content (optional)                  | Materials delivered to/used by the consumer, with product-defined nesting/formats                                                                                                                                                                               | Product delivery, separate from marketing                                        |

Use exactly the canonical H2s in each primary template in both source layers;
project extensions belong in catalog sections/pages (no prescribed Markdown
schema for extra pages). Do not create nine mandatory tabs or a duplicate canvas
overview. A complete Sales process stays on one page even though it covers
several blocks. The owner map documents coverage, without an extra canvas-block navigation menu or a claim
that the model is validated. Keep each primary document within 1,400 words.

Brief owns the request, goals, authority, product inventory and initial project
constraints. Model specifics must not accumulate in Brief. Source attribution
stays with claims; edit history and review chronology live in Git/metadata.
Dates in content are retained for material fact conditions and observations.

## Work order and evidence

After scope confirmation at `00-business`, Business Analyst records initial
Product/model and supplied Sales intake. Intake may contain explicit unknowns;
unknown prices, budgets, capacity or owners are never invented. Practical
Website/Creative/Presentation fields may be absent until prepared. All declared
files must exist. The initial stage persists; it no longer has a Business output.

At `10-strategy`, product Research tests named model/product assumptions before
selection. Market observations never override client facts; agreement with a
model never proves demand. Later owners develop the agreed offer and materials.
Read and preserve unique existing content before a rerun or migration.

## Dependencies

Shared model review IDs are `model.<id>`; each is registered once. Models use
Brief and explicitly referenced resource-owning models. Research uses Brief and its model; its assumption links identify the question
being tested. Model citations of Research findings are reviewed by the agent,
not reciprocal approval edges. Product uses Brief, Research and its model. Sales uses Product and model.
Strategy uses models and product Research/Sales. Website uses Product, Sales,
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
