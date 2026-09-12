---
confirmation:
  confirmed: false
review:
  stale:
    reason: Business ownership migrated to Product, Sales and Operations & Economics; review the actual new inputs.
    sources: [model.framework-service]
  dependencies:
    brief: e890b56080b80919caf6111e3a17c7b5cf42b0cccf4b27e5235b577c0da96f51
---

# Code Framework research

## Decision and scope

Model `framework-service`: test `bridge`, `capacity` and `service-viability` only where they affect this product. The [model source](../models/framework-service/model.md#assumptions-and-decision-rules) owns these assumptions; findings, contrary observations and sources stay in this Research.

**Product:** Code Framework (`singlepagestartup`). Determine which developers have a reason to evaluate this free framework, what they compare it with, and what proof the evaluation needs. AI Chat is a separate product and can also serve as this product's intended acquisition bridge. Its buyers, pricing, and demand are researched separately.

**Evidence window:** recorded sources accessed 2026-08-08–10 and repository inventory dated 2026-08-14. These are dated findings, not a fresh market scan. Official/vendor documentation establishes mechanisms; no customer interviews, representative sample, or independent adoption study is supplied.

## Buyer and purchase situation

**Audience hypothesis:** an accountable founder-developer or small-team developer, including one using AI assistance, facing an architecture decision for a new web product involving several recurring foundations. The framework is free according to the operator; the commitments are evaluation time, migration risk, setup effort, and continuing ownership. Brief supplies the stated audience and funding context, not observed demand.

**Inferred evaluation concerns:** inherited complexity, prerequisites, dependency freshness, customization, security boundaries, documentation, and whether included capabilities work together. Testing a named need across at least three capability families is a proposed qualification rule, not an observed market segment or proven threshold.

## Alternatives and competition

Compare reuse of a prior codebase; repository templates and SaaS starters; generators; composed authentication, payment, CMS, and other services; application frameworks; AI-generated scaffolding; building only the first feature; and postponing the decision.

**Alternatives finding:** GitHub templates, Nx generators, Wasp/Vercel starters, Payload, and GitHub coding-agent documentation show available packaged or generated foundations. MR-13–MR-17 and MR-33, accessed 2026-08-08–09. Confidence is high for documented mechanisms only; commercial authorship and differing scope prevent a representative comparison, demand estimate, or claim of equivalence. This finding belongs to Code Framework and does not describe all products of the business.

## Price, channels, and evidence

**Client inputs:** framework price is zero and the founder funds development. The approved experiment uses a founder-led walkthrough and the intended demonstration service, with GitHub as the evaluation destination. Direct contacts are preflight participants. These are intended routes from Strategy, not observed acquisition performance.

**Owned-material observations:** the 2026-08-14 inventory lists 16 modules, 156 model/relation entities, and 1,836 declared frontend variants, with 24 linked to Studio examples. Ecommerce includes 7 models and 19 relations. These counts verify declared structure, not integration, readiness, successful use, time saving, or adoption.

The public-repository snapshot and discovery mechanisms establish availability and attention only (MR-31–MR-32).

**Current proof:** No independent external setup, capability-use, adoption, time-saving, reliability, or value result has been supplied; no channel-conversion baseline is available.

## Findings and unknowns

| Finding                                                                    | Basis and confidence                                        | Decision implication                                                                            |
| -------------------------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Coherent inspection of several foundations may differentiate the framework | Inference from alternatives and inventory; medium-low       | Test one named need; do not claim superiority or time saved                                     |
| Intended MIT distribution and the recorded restrictive license conflict    | Operator intent; dated MR-30 and MR-36                      | Verify published terms before inviting external evaluation                                      |
| Setup requirements disagree across README and package metadata             | Dated file observation; MR-34                               | A clean setup result and one authoritative path remain launch gates                             |
| AI assistance does not remove human authority and review needs             | Documented boundaries plus inference; MR-18–MR-19 and MR-33 | Keep accountability and data/secret boundaries explicit                                         |
| Views, stars, service use, evaluation, and adoption are different signals  | Measurement rule in approved Strategy; no outcome proof     | Require attributable setup and capability results; repeat use or a retain decision for adoption |

Actual developer language, objections, reasons to reject or defer, willingness to evaluate, setup failures, and continuing support expectations remain unobserved. Founder-reported internal use is not independent validation. The showcase route still requires readiness and attribution checks. These gaps permit a bounded learning experiment but cannot support product-market-fit, easy-setup, reliability, or adoption claims.

## Sources

| ID       | Source and access date                                                                                                                                                                                                                                                                                                                                                                | What it supports                                     | Limitation                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------- |
| MR-13    | [GitHub repository templates](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template), 2026-08-08                                                                                                                                                                                                                           | Template mechanism                                   | No outcome evidence                                 |
| MR-14    | [Nx generators](https://nx.dev/docs/features/generate-code), 2026-08-08                                                                                                                                                                                                                                                                                                               | Scaffolding and consistency mechanism                | Vendor documentation                                |
| MR-15–17 | [Wasp starters](https://wasp.sh/docs/project/starter-templates), [Vercel SaaS starter](https://vercel.com/new/templates/authentication/next-js-saas-starter), [Payload](https://payloadcms.com/get-started), 2026-08-08                                                                                                                                                               | Packaged common foundations                          | Promotional sources; no representative comparison   |
| MR-18–19 | [MCP security](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/security_best_practices), [authorization](https://modelcontextprotocol.io/docs/2026-07-28/tutorials/security/authorization), 2026-08-08                                                                                                                                                             | Authorization, consent, audit, token and scope risks | Not a project security review                       |
| MR-29–30 | [SinglePageStartup repository](https://github.com/singlepagestartup/singlepagestartup) and current LICENSE, 2026-08-09                                                                                                                                                                                                                                                                | Public snapshot and current terms                    | Project-authored; time-sensitive                    |
| MR-31–32 | GitHub [discovery](https://docs.github.com/en/get-started/exploring-projects-on-github/discovering-projects-on-github), [READMEs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes), and [releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases), 2026-08-09 | Discovery/evaluation mechanisms                      | No project channel-performance evidence             |
| MR-33    | [GitHub coding agent guidance](https://docs.github.com/en/copilot/concepts/agents/cloud-agent/about-cloud-agent), 2026-08-09                                                                                                                                                                                                                                                          | Agent capability and human-review boundary           | Vendor interest; no SinglePageStartup outcome proof |
| MR-34    | Local README and package.json, 2026-08-09                                                                                                                                                                                                                                                                                                                                             | Setup-version contradiction                          | No clean setup result                               |
| MR-36    | [MIT License](https://opensource.org/license/mit), 2026-08-10                                                                                                                                                                                                                                                                                                                         | Selected permission text                             | Not project-specific legal advice                   |
