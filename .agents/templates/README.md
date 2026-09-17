# Pre-development artifact templates

These files define the minimum structure of the business and design artifacts.
They are not
project data, role instructions, or a separate methodology. The workflow loads
one template only when it creates an artifact or repairs missing required
sections; agents do not load this directory wholesale.

Primary review documents start with `confirmation: { confirmed: false }` in
frontmatter (or the YAML root for Sales). Follow
`.agents/contracts/document-confirmation.md` before recording user confirmation;
partial startup overrides bind to the complete resolved body. Empty startup
files stay empty until they intentionally override content or confirmation.

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

The complete operating order, review rules, and invalidation behavior remain in
`.agents/workflows/pre-development.md`. Templates describe shape only;
role contracts contain responsibility, judgment, and reusable professional
methods; workspace Markdown and YAML contain project facts and decisions.
On every workflow invocation, pipeline compatibility reconciliation compares
the relevant current template headings and schema keys with existing artifacts.
A synchronized template change therefore routes a missing section to its owning
stage; it never fills that section with placeholders or inherited facts from an
unrelated business.

Professional artifacts are decision projections rather than cumulative working
notes. Studio names the resolved singlepage-plus-startup view `default`. A full
generation or rerun starts from the owning template and replaces
the previous body from stable upstream dependencies; Product/model migrations
first inspect and preserve unique client facts, sources and extensions. Git retains prior versions.
Strongly prefer a five-to-seven-minute review (about 1,400 words) per primary
page. This is not a word, line, source, segment or aggregate YAML/corpus cap.
Follow `.agents/contracts/document-readability.md`; completeness takes precedence.
In particular, `strategy.md` uses exactly its four second-level sections and
does not contain interview chronology, invalidation logs,
or coordinator handoff prose.

`github-reconciliation.yaml` is an operational template, not a living business
artifact. Each layer instantiates it under `pre-development/github/` to define
GitHub relevance rules and record the outcome of each reconciled relevant
commit. The normal stage cursor remains minimal and contains no commit history.

Material questions and constraints stay in the documents that need their
answers. AI methods and completion checks live in the canonical roles and
workflow; document metadata owns confirmation. There is no separate decision
checklist template or second approval summary.

Natural-language confirmations, not stage commands, approve the decision scope,
strategy, and brand direction. Professional roles still make the substantive
strategy and design choices; confirmation prevents an unreviewed proposal from
silently becoming a downstream dependency.

## Provenance

The set is a compact SinglePageStartup synthesis, not a copied third-party
framework. Its sequence comes from the approved issue 222 pre-development
pipeline. Section coverage was reconciled with the former repository templates
`tools/digital-agency/templates/client_brief_template.md`,
`content_framework_template.md`, and `project_plan_template.md`; legacy
duplication, channel-production detail, engineering, QA, and deployment were
intentionally excluded.

Professional responsibility and method were consolidated in `.agents/roles/`,
so these templates stay small and do not make an agent repeat a theatrical
persona or a generic marketing process in every artifact.

`brand.md` owns meaning, message, voice, and intended perception. `design.md`
translates that approved meaning into the reusable visual system. Each active
product owns Research and a machine-readable Sales process. Product-local `product.md`,
`website.md`, `marketing-creative.md`, and the presentation apply those shared
decisions to one active product. None may redefine decisions owned by another
artifact.

Design presentation structure is project-owned in `design/<layer>/layout.yaml`.
Use ordered built-in/custom sections or a full TSX/JSX template; see the workspace
README for the exact schema. Empty startup inherits; a populated startup layout
replaces the base, using its own files. Keep the applicable visual decisions in
the Design document and Assets; do not force every project into starter blocks.

Research uses `product-research.md` as its primary summary, with adaptable
`product-research-segment.md` and `product-research-competitors.md` detail starters.
Register detail under the shared Research tree; apply
`.agents/contracts/research-sales-audit.md` to validate the preceding Sales proposal.
