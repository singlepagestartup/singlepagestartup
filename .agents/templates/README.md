# Pre-development artifact templates

These files define the minimum structure of the business and design artifacts,
plus one compact project-specific decision-profile structure. They are not
project data, role instructions, or a separate methodology. The workflow loads
one template only when it creates an artifact or repairs missing required
sections; agents do not load this directory wholesale.

## Sequence

| Stage      | Owner                                       | Template output                                        | Depends on                                      |
| ---------- | ------------------------------------------- | ------------------------------------------------------ | ----------------------------------------------- |
| Understand | Account Manager and coordinator             | `brief.md`, `decision-profile.md`, evidence proposals  | founder request and existing materials          |
| Understand | Business Analyst                            | `business.md`, decision-profile proposals              | brief, decision profile, and evidence           |
| Understand | Market Researcher                           | `research.md`, decision-profile and evidence proposals | brief, decision profile, and research question  |
| Decide     | Strategist                                  | `strategy.md`                                          | brief, business, research, and evidence         |
| Package    | Communication Strategist and Brand Designer | `brand.md`, `asset-index.yaml`                         | strategy, evidence, and existing assets         |
| Design     | Web Designer                                | `website.md`                                           | business, strategy, brand, evidence, and assets |

The complete operating order, review rules, and invalidation behavior remain in
`.agents/workflows/pre-development.md`. Templates describe shape only;
role contracts contain responsibility, judgment, and reusable professional
methods; workspace Markdown and YAML contain project facts and decisions.

`decision-profile.md` is working knowledge, not a ninth final artifact. It
records the compound business-model classification and only the domain
questions, metrics, evidence, risks, regulations, and viability conditions that
can change a decision. Its singlepage source describes SinglePageStartup; its
startup source is initially empty and replaces the complete domain profile once
populated. Consumers read only the resolved profile.

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
