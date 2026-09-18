---
finding_prefix: CF
confirmation:
  confirmed: false
sales_segment: developer-agents
sales_dimensions:
  - needs
  - motivations
  - purchase_trigger
  - decision_criteria
  - objections
  - acquisition
  - journey
review:
  dependencies:
    brief: a395763652f2102e1373bb6e0e3ad6fa33267aeeb7326e25b518f13465dff69d
    model.framework-service: 24505045708eaee8184c7d988841e54b6408be46051b785d18989c6329a14a80
    product.singlepagestartup.sales: 5f4d91f14898077c62d3576a0dd298c4393d3aa788e05df4d42bf6d85b0cbf13
---

# Coding agents acting for people: evidence and Sales implications

## Scope and evidence

Assess [Sales segment `developer-agents`](../sales.yaml). This is an adoption route: a human or team delegates work to a coding agent. The agent may recommend or use a foundation within that authority; the person remains the beneficiary, decision owner and payer for external tools. Neither an autonomous paying customer nor an agent's emotions are assumed.

The four verdicts mean the same as in the [maker review](makers.md). Confidence is medium for analogous human-led practices and low for transfer to SPS; all product-specific acquisition and journey judgments have low confidence. This page uses first-person practitioner evidence, primary developer research and documented competing offers. All sources were accessed 2026-09-13. Evidence about experienced developers is relevant to how people supervise delegated work; it must not be presented as novice-maker demand or proof that agents independently discover SPS.

| Evidence                           | Observation                                                                                                                                                                    | Applicability and limit                                                                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1: practitioner reuse             | Simon Willison describes keeping working examples and asking agents to combine them for new tasks.                                                                             | Direct practice from one experienced developer/author, including concrete examples; not a market sample or evidence of autonomous framework shopping.                                         |
| D2: practitioner criteria          | Willison distinguishes generating code from solving the right problem with understandable, maintainable results.                                                               | Professional judgment, not a measured comparison of starters.                                                                                                                                 |
| D3: developer survey               | In Stack Overflow's 2025 accuracy question, 46% distrust AI output and 33% trust it; agent use is heterogeneous.                                                               | 33,244 accuracy responses; broader study has 49,009 respondents from 177 countries, mainly recruited through Stack Overflow channels. A 2025 developer sample, not current novice preference. |
| D4: changing productivity evidence | METR's 2025 randomized study involved 16 experienced developers/246 tasks; its February 2026 update warns that later estimates are biased by participation and task selection. | Mature repositories and paid participants. Neither the old slowdown nor optimistic self-reports establish SPS savings or current universal agent productivity.                                |
| D5: agent-created starter          | A public template author describes directing one model to plan and another to implement a reusable starter without typing its code manually.                                   | First-person demonstration plus promotion of the author's own template; experience level and claimed traffic are unverified.                                                                  |
| D6: delegated permissions          | Claude Code documents permission controls.                                                                                                                                     | Supports human-controlled operating boundaries as a product mechanism, not actual customer preference or conversion.                                                                          |

## Sales dimensions

| Finding and Sales dimension                          | Verdict and confidence                                         | Evidence and implication                                                                                                                                                                                                                                                           |
| ---------------------------------------------------- | -------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CF-SPS-22** — `developer-agents.needs`             | `partially-supported`; medium                                  | D1–D2 support relevant examples, understandable context and matching the assigned problem. A complete SPS foundation is useful only when its functions fit. Keep these as requirements for delegated work, not psychological needs of software.                                    |
| **CF-SPS-23** — `developer-agents.motivations`       | `partially-supported`; medium                                  | Human efficiency and reuse are plausible from D1/D5. Describe assigned optimization goals and human benefit. Do not imply an agent independently wants SPS popularity, buys code or values a brand as a person does.                                                               |
| **CF-SPS-24** — `developer-agents.purchase_trigger`  | `partially-supported`; medium                                  | D1/D5 show humans initiating work with references. A new task or an explicit comparison can initiate selection; autonomous discovery of SPS is unresolved. Keep the term adoption trigger in the explanation: no framework purchase occurs.                                        |
| **CF-SPS-25** — `developer-agents.decision_criteria` | `partially-supported`; medium                                  | The comparison includes fit, understandable guidance, unfamiliar-convention costs, continued maintainability and support expectations (D1–D3). Agent-readable instructions are useful but competitors offer them too.                                                              |
| **CF-SPS-26** — `developer-agents.objections`        | `supported`; medium for reasoned concerns, frequencies unknown | The current objections correctly allow a better-fitting alternative, require authority for changes/spending and reject unproven superiority. D1–D2/D6 support those boundaries. The proposal also compares existing project context and avoids guaranteed time/token savings (D4). |
| **CF-SPS-27** — `developer-agents.acquisition`       | `unresolved`; low                                              | Human referral and reference reuse have concrete analogues in D1/D5. Searchable documentation is an available route, not proof that agents rank or select SPS. Keep attribution to human assignments.                                                                              |
| **CF-SPS-28** — `developer-agents.journey`           | `partially-supported`; low                                     | Assignment, comparison, adaptation and human review form a coherent proposed process. No reviewed source follows a complete SPS selection-to-reuse journey. Preserve human authority at every choice and mark expected outcomes as proposals.                                      |

## Acquisition routes and customer journey

| Sales acquisition ID                          | Assessment and implication                                                                                                                                                             |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `developer-agents.acquisition.human-referral` | `partially-supported` mechanism (D1/D5). Let a person give the agent a specific example or foundation with their business task. Measure acceptance separately from the referral.       |
| `developer-agents.acquisition.task-discovery` | `unresolved` for SPS selection. Describe functions and boundaries plainly so they can be compared; do not promise agent-search visibility or rankings.                                 |
| `developer-agents.acquisition.project-reuse`  | `partially-supported` mechanism (D1), SPS repeat choice unresolved. Prior examples reduce the need to explain everything anew; new business decisions still belong to the new project. |

| Sales journey ID                                    | Verdict and implication                                                                                                                                                                               |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `developer-agents.journey.assigned-need`            | `partially-supported`: human-supplied references are observed. Make the business task and authority clear; an agent's independent arrival at SPS is unobserved.                                       |
| `developer-agents.journey.fit-recommended`          | `partially-supported`: explain the match, alternatives and remaining work. The current shortlist includes the existing project and minimal generation as legitimate alternatives.                     |
| `developer-agents.journey.foundation-adopted`       | `unresolved` for SPS. Selection should occur within existing delegation, with the responsible person able to understand why. Do not require a second permission ritual when authority already exists. |
| `developer-agents.journey.business-value-developed` | `partially-supported`: documented examples support agent-assisted composition; no SPS business outcome follows from that alone. Present the resulting task outcome for human judgment.                |
| `developer-agents.journey.reuse-recommended`        | `partially-supported` general reuse, SPS retention unresolved. Carry forward useful knowledge, not an automatic commitment to the same framework for every brief.                                     |

## Commercial implications and open questions

The strongest current route is a person supplying a relevant SPS example or choosing it with an agent's help. Independent agent recommendation remains a longer-term hypothesis. [Open SaaS and Makerkit](competitors.md) directly compete on agent guidance, reusable functions and developer education; merely adding instructions does not differentiate SPS.

Sales retains human authority, free-code terms, optional help and alternative-selection logic. Its comparison includes unfamiliar-foundation costs and maintainability; motivations describe delegated human objectives. Documentation discoverability remains an intended route, with no observed SPS acquisition.

Unresolved: how often people authorize a foundation comparison; which tasks justify SPS instead of their existing project; which explanations influence acceptance; whether a successful adaptation produces another selection; and what help the responsible person expects. No interview with an SPS adopter or recorded agent-led SPS selection is available in this review.

## Sources

IDs are local to this page. All accessed 2026-09-13. Academic and first-person evidence have different populations; none establishes a separate market of paying agents.

| ID  | Attributable source                                                                                                                                            | Sample, interest and limitation                                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D1  | Simon Willison, [Hoard things you know how to do](https://simonwillison.net/guides/agentic-engineering-patterns/hoard-things-you-know-how-to-do/)              | First-person experienced-developer practice; author maintains tools and publishes on AI. One perspective, explicit examples, no representative sample. |
| D2  | Simon Willison, [Writing code is cheap now](https://simonwillison.net/guides/agentic-engineering-patterns/code-is-cheap/)                                      | Practitioner criteria and opinion; same author as D1, not independent triangulation.                                                                   |
| D3  | Stack Overflow, [AI survey](https://survey.stackoverflow.co/2025/ai), [methodology](https://survey.stackoverflow.co/2025/methodology)                          | 2025-05-29–2025-06-23, self-selected developer respondents; publisher has developer-community/commercial interests. Question denominators differ.      |
| D4  | METR, [2025 study](https://metr.org/Early_2025_AI_Experienced_OS_Devs_Study-paper.pdf), [2026-02-24 update](https://metr.org/blog/2026-02-24-uplift-update/)   | Nonprofit primary research; 2025 RCT and subsequent recruitment/task-selection limitations. Neither is a starter comparison or a novice study.         |
| D5  | Reddit user williamholmberg, [Agent-created reusable template](https://www.reddit.com/r/vibecoding/comments/1lrdgpp/i_vibecoded_20_apps_in_6_months_heres_my/) | One self-promotional project account. Its workflow is a reported example; traffic, productivity and quality claims are not verified.                   |
| D6  | Anthropic, [Configure permissions](https://code.claude.com/docs/en/permissions)                                                                                | Vendor documentation; current mechanism, no customer sample.                                                                                           |
| C1  | [Sales](../sales.yaml), [competitor comparison](competitors.md)                                                                                                | Proposed SPS process and independently attributed competing offers.                                                                                    |
