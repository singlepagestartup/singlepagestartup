# Pre-development artifact templates

These files define the minimum structure of the business and design artifacts.
They are not project data, role instructions or a separate methodology. The
workflow loads one template only when it creates an artifact or repairs missing
required sections; agents never load this directory wholesale. The pipeline
check reads the second-level headings and schema keys of these templates as
the structural gates of each stage, so a synchronized template change routes a
missing section to its owning stage without filling it with placeholders or
inherited facts from an unrelated business.

Primary review documents start with `confirmation: { confirmed: false }` in
frontmatter, or at the YAML root for Sales and Assets. Templates describe shape
only; roles contain judgment and method; the workflow contains order; workspace
Markdown and YAML contain project facts and decisions. There is no decision
checklist template and no second approval summary.

## Sequence

| Stage                            | Owner                                       | Template output                                                                                | Depends on                                                         |
| -------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 00 Client Request                | Account Manager and coordinator             | `brief.md`, source notes in the owning document                                                | founder request and existing materials                             |
| 00 Client Request                | Business Analyst                            | `products.yaml`, initial `product.md`, `product-model.md`, `sales.yaml`                        | scope-confirmed brief, attributed facts                            |
| 10 Strategy                      | Market Researcher                           | product-local `research.md`                                                                    | completed fact intake, product-specific decision questions         |
| 10 Strategy                      | Strategist                                  | proposed, then approved target-state `strategy.md` with separate audience and sales priorities | brief, product models, product research, and sales                 |
| 20 Brand                         | Communication Strategist and Brand Designer | proposed, then approved `brand.md`                                                             | approved strategy and product research                             |
| 30 Design                        | Brand Designer                              | `design.md`, `asset-index.yaml`                                                                | approved brand, confirmed existing assets and preferred references |
| 40 Products                      | Strategist                                  | one `product.md` per active product                                                            | approved shared decisions and client-confirmed product inventory   |
| 40 Products                      | Web Designer                                | product-local `website.md`                                                                     | product, shared decisions, research, assets                        |
| 40 Products                      | Brand Designer                              | product-local `marketing-creative.md`                                                          | product, shared decisions, research, assets, selected channels     |
| 40 Products                      | Communication Strategist and Brand Designer | product-local React/HTML presentation                                                          | product and its approved review documents                          |
| 40 Products and ongoing learning | Product owner and Market Researcher         | `product-analytics.md`, then updated product Research                                          | Product, Sales, model, and inspected measurement sources           |
| 40 Products                      | Product owner for the applicable material   | optional nested product sections/pages (`Product Content`, legacy `content` supported)         | product-owned sources in any appropriate format                    |

## Ownership

| Page                                                         | Owns                                                                                                                                                                                                                                                              | Business Model Canvas coverage                                                   |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Product (`product.md`)                                       | Identity, owner, state and boundary; the five customer roles; circumstances, jobs, pains and gains, desired result; alternatives and value; included and excluded scope, intended access and use, support promise and rights; business goals and metrics          | Customer Segments; Value Propositions                                            |
| Operations & Economics (`product-model.md`)                  | Model scope; per-product money terms; shared resources, activities, partners, costs and allocation; funding and material unknowns                                                                                                                                 | Revenue Streams; Key Resources; Key Activities; Key Partnerships; Cost Structure |
| Sales (`sales-process.yaml`)                                 | Intended customer process from discovery and consideration through acquisition, use, support and retention; owners, inputs, handoffs, commercial alternatives and metrics, as an overview plus one decision profile and Customer Journey Map per customer segment | Channels; Customer Relationships; operational Key Activities                     |
| Promotion (`website.md`, `creative.md`, presentation data)   | One navigation surface for Website, Marketing Creative and Presentation; each material keeps its own copy, layouts and exports                                                                                                                                    | Derived applications, never independent sources of price or scope                |
| Product Content (optional)                                   | Materials delivered to or used by the consumer, with product-defined nesting and formats                                                                                                                                                                          | Product delivery, separate from marketing                                        |
| Analytics (`product-analytics.md`)                           | Current funnel, usage, retention, revenue and attributable-cost observations with periods, sources and limitations                                                                                                                                                | Observed feedback about whichever model decisions are being tested               |
| Research (`product-research.md` and the two detail starters) | Market and business questions linked to model assumptions; customer, competitor, price and channel evidence, limits and implications                                                                                                                              | Whichever model decisions need evidence                                          |

Use exactly the canonical second-level headings of each primary template in
both source layers; project extensions belong in catalog sections and pages
without a prescribed Markdown schema, and no extra section is required merely
because a template demonstrates one. `brand.md` owns meaning, message, voice
and intended perception; `design.md` translates that approved meaning into the
reusable visual system; product-local documents apply those shared decisions to
one product and never redefine a decision owned by another artifact.

`github-reconciliation.yaml` is an operational template, not a living business
artifact: each layer instantiates it under `pre-development/github/` for its
GitHub relevance rules and reconciled commits. Research uses
`product-research.md` as its summary, with `product-research-segment.md` and
`product-research-competitors.md` as adaptable detail starters registered under
the shared Research tree. Design presentation structure is project-owned in
`design/<layer>/layout.yaml`; the workspace README documents its schema.

## Provenance

The set is a compact SinglePageStartup synthesis, not a copied third-party
framework. Its sequence comes from the approved issue 222 pre-development
pipeline. Section coverage was reconciled with the former repository templates
`tools/digital-agency/templates/client_brief_template.md`,
`content_framework_template.md`, and `project_plan_template.md`; legacy
duplication, channel-production detail, engineering, QA, and deployment were
intentionally excluded. Professional responsibility and method were
consolidated in `.agents/roles/`, so these templates stay small and do not make
an agent repeat a persona or a generic marketing process in every artifact.
