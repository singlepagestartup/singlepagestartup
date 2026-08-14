# Pre-development artifact templates

These files define the minimum structure of the business and design artifacts,
plus one compact project-specific decision-profile structure. They are not
project data, role instructions, or a separate methodology. The workflow loads
one template only when it creates an artifact or repairs missing required
sections; agents do not load this directory wholesale.

## Sequence

| Stage       | Owner                                       | Template output                                                                      | Depends on                                                         |
| ----------- | ------------------------------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 00 Business | Account Manager and coordinator             | `brief.md` with confirmed offer portfolio, `decision-profile.md`, evidence proposals | founder request and existing materials                             |
| 00 Business | Business Analyst                            | `business.md`, decision-profile proposals                                            | scope-confirmed brief, decision profile, evidence                  |
| 00 Business | Market Researcher                           | `research.md`, decision-profile and evidence proposals                               | scope-confirmed brief and material research question               |
| 10 Strategy | Strategist                                  | proposed, then approved `strategy.md` with active product set and priority           | brief, business, research, and evidence                            |
| 20 Brand    | Communication Strategist and Brand Designer | proposed, then approved `brand.md`                                                   | approved strategy and evidence                                     |
| 30 Design   | Brand Designer                              | `design.md`, `asset-index.yaml`                                                      | approved brand, confirmed existing assets and preferred references |
| 40 Products | Strategist                                  | one `product.md` per catalog entry                                                   | approved shared decisions and exact Strategy-selected product set  |
| 40 Products | Web Designer                                | product-local `website.md`                                                           | product, shared decisions, evidence, assets                        |
| 40 Products | Brand Designer                              | product-local `marketing-creative.md`                                                | product, shared decisions, evidence, assets, selected channels     |
| 40 Products | Communication Strategist and Brand Designer | product-local React/HTML presentation                                                | product and its approved review documents                          |

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
the previous body from stable upstream dependencies; Git retains prior versions.
Every primary review document is limited to 1,400 words so the operator can read
and edit it in five to seven minutes. This is a usability rule rather than a
token budget.
In particular, `strategy.md` uses exactly its four second-level sections and
does not contain interview chronology, profile disposition, invalidation logs,
evidence proposals, or coordinator handoff prose.

`github-reconciliation.yaml` is an operational template, not a living business
artifact. Each layer instantiates it under `pre-development/github/` to define
GitHub relevance rules and record the outcome of each reconciled relevant
commit. The normal stage cursor remains minimal and contains no commit history.

`decision-profile.md` is working knowledge, not a client-facing final artifact. It
records the compound business-model classification and only the domain
questions, metrics, evidence, risks, regulations, and viability conditions that
can change a decision. Its singlepage source describes SinglePageStartup; its
startup source is initially empty and replaces the complete domain profile once
populated. Consumers read only the resolved profile.

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
translates that approved meaning into the reusable visual system. Product-local
`website.md`, `marketing-creative.md`, and the presentation apply those shared
decisions to one offer. None may redefine the decisions owned by another.
