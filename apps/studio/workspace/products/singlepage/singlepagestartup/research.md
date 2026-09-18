---
finding_prefix: CF
sales_audit: true
sales_audit_scope: Operator accepted the Sales structure only; its customer assumptions and process details remain proposals under investigation.
confirmation:
  confirmed: false
sources:
  license:
    classification: client-claim
    source: Brief sources.license and Product sources.license; operator selected MIT and reported publication, 2026-09-12.
    limitation: Inspection on 2026-09-13 found the same proprietary terms in working-tree, HEAD and fetched origin/main LICENSE. The exact MIT source remains unresolved; selected terms do not establish the inspected download license.
    inspected_snapshot: https://github.com/singlepagestartup/singlepagestartup/blob/48fff95f2ffe5c6fcfb435ae50700df029608bbe/LICENSE
  repository_inspection:
    classification: verified-fact
    inspected_at: 2026-09-13
    head: e98f76e674686e890f0abda1d57929dfa080aafe
    finding_ids:
      - CF-SPS-14
    use: Technical source provenance only; not a market-research or business-plan completion condition.
    scope: README.md installation lines 463-508; package.json engines lines 280-283; up.sh lines 2-10; AGENTS.md; CLAUDE.md; canonical shared workflow; ecommerce and billing module READMEs plus ecommerce product/order READMEs; GitHub repository API.
    findings: Node 24/npm 11 in engines versus Node 20 in README; setup provisions environment and Postgres/Redis then migrates; agent instructions are present; GitHub template and Issues are enabled.
    limitation: Read-only source and platform inspection; no new installation, compatibility, novice completion or savings test.
review:
  dependencies:
    brief: 6b2c413d4d8f686e53dc2886c93c5ad79c8e04b93d75158f0a1fb15051b3fe2f
    model.framework-service: 24505045708eaee8184c7d988841e54b6408be46051b785d18989c6329a14a80
    product.singlepagestartup.analytics: ce1e12bfa58ab6764f42861a779e9a4d3d6b836f6bfb7b8b9d997c887bbc2015
    product.singlepagestartup.page.research.competitors: 6efcf5101e989dfc5ad439d9fa04fcc41792696fdc97e520c795b03128673a6a
    product.singlepagestartup.page.research.developer-agents: d0ac4e91c7d319e4e796c69be6b76a77b2a8aa8dee7f14fbe27fbb10910899a5
    product.singlepagestartup.page.research.makers: 13ddcd6b09cb312bd06cc7ec810b7cd7d2d0d25be3ca5ecbca35e714344f7f19
    product.singlepagestartup.sales: 5f4d91f14898077c62d3576a0dd298c4393d3aa788e05df4d42bf6d85b0cbf13
---

# Code Framework research

## Decision and scope

For `singlepagestartup`, assess audience needs, alternatives, differentiation and distribution for a free framework. The project owner decides priorities; model `framework-service` owns `bridge`, `framework-growth`, `channel-access` and `proof`.

This worldwide desk review combines client input, primary user studies, first-person practitioner accounts and official offers checked 2026-09-13. It assesses the proposed Sales details for both segments, not just whether their tools exist. Document structure is not market evidence; audience assumptions and desired experiences remain proposals. This review contains no direct SPS customer interviews or tracked complete customer journeys.

| Detailed research                                               | What it answers                                                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [Makers](research/makers.md)                                    | Needs, motivations, triggers, criteria, objections, all acquisition routes and journey stages for `makers`.         |
| [Coding agents acting for people](research/developer-agents.md) | The same seven dimensions for `developer-agents`, with the human as beneficiary and decision owner.                 |
| [Competitor offers](research/competitors.md)                    | Free/paid starters, managed builders, generated projects and informal alternatives, with current prices and limits. |

Verdicts distinguish `supported`, `partially-supported`, `contradicted` and `unresolved`. Evidence applies to each source's population and setting; neither vendor features nor experienced-developer surveys establish novice SPS demand.

## Buyer and purchase situation

**CF-SPS-01 — client intention.** Novice makers want their own products and mainly direct coding agents through conversation. They seek reusable registration, carts and payments so they can concentrate on their business logic. The maker or team chooses the framework; no code purchase is required. Useful AI Chat experience is an intended trigger, while remaining a hosted consumer is equally valid. [C1]

The second route is a coding agent recommending or using a foundation for a human-assigned task. The person remains the beneficiary and decision owner; evidence for this route is assessed in the [delegated-agent review](research/developer-agents.md) (CF-SPS-22, CF-SPS-24 and CF-SPS-28). An agent is not a separate paying customer.

## Alternatives and competition

**CF-SPS-13 — documented alternatives.** Free Next.js SaaS Starter and Open SaaS; paid ShipFast and Makerkit; Lovable, Replit and v0 managed builders; agent-generated projects; and previous-project reuse compete for this decision. The [detailed comparison](research/competitors.md) owns their offers, prices, distribution and limits. [S9, S10]

Free common functions, demonstrations and agent guidance are already offered elsewhere. Their presence is not exclusive differentiation. A managed builder can be preferable when the maker values convenience more than operating a local foundation; some also support code export. SPS should win a suitable task on its relevant reusable functions and understandable guidance, without assumed superiority.

## Price, channels, and evidence

**CF-SPS-03 — client terms.** Code costs 0, funded by the owner; agent and infrastructure charges are separate. AI Chat token revenue is a different product income stream. [C1]

| Finding       | Distribution implication                                                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CF-SPS-04** | YouTube demonstrations can introduce AI Chat and optional framework adoption. Clickable external long-form links require advanced features; Shorts description URLs are not clickable. [S4] |
| **CF-SPS-08** | Eligible own-video Shorts link to the original: use an understandable result to introduce the full explanation. [S5]                                                                        |
| **CF-SPS-09** | Useful, searchable task pages can connect maker questions to examples. Google does not guarantee indexing. [S6]                                                                             |
| **CF-SPS-10** | Relevant community answers can introduce the project; Reddit requires contextual participation and local rules. Reach is unestablished. [S7]                                                |

## Findings and unknowns

- **CF-SPS-02 — observation:** coding agents support conversational changes to local projects. This makes the selected audience plausible, without proving SPS preference. [S1, S8]
- **CF-SPS-05 — professional implication:** explain a useful business change and show the resulting product, so a beginner understands the value of adopting the foundation.
- **CF-SPS-06 — observation:** GitHub supports distributing starter projects and voluntary feedback; neither is a purchase requirement. [S2, S3]
- **CF-SPS-11 — inference, medium confidence:** connecting a demonstrated product, reusable functions and understandable guidance can make SPS easier to evaluate. Open SaaS and Makerkit also package agent guidance; show task-specific fit, continuing responsibilities and support rather than claiming an exclusive combination.
- **CF-SPS-07 — evidence gap:** attention, adoption, next-product reuse and contributions are separate outcomes. Demand, comparative time/token savings and independent agent selection remain unmeasured.
- **CF-SPS-12 — hypothesis, medium confidence:** useful chat experiences may create maker interest; adaptations and contributions may supply stronger examples and recommendations. This is a proposed growth mechanism, not observed retention.

The [maker audit](research/makers.md), CF-SPS-15, CF-SPS-16, CF-SPS-17, CF-SPS-18 and CF-SPS-19, partially supports accessible creation, understandable results, task-led adoption and cost concerns. It adds differences between nontechnical users and beginners who want to learn, as well as guidance, continuing costs and managed alternatives. It does not establish that AI Chat is a frequent adoption trigger.

The [delegated-agent audit](research/developer-agents.md), CF-SPS-22, CF-SPS-23, CF-SPS-24, CF-SPS-25 and CF-SPS-26, supports considering human-supplied references and prior work. Independent discovery, SPS recommendation and repeat selection remain unresolved. The proposed CJMs can remain planning maps; their desired experiences and transition rates are not observed facts. Current no-purchase, human-authority and alternative-selection boundaries remain appropriate. Acquisition and journey assessments are CF-SPS-20, CF-SPS-21, CF-SPS-27 and CF-SPS-28.

## Sources

Source IDs in this table are local to this document.

Accessed 2026-09-13. Vendor sources reflect commercial/ecosystem interests, not independent customer samples; applicability is worldwide documentation, without a regional demand study.

| ID      | Source                                                                                                                                                                                                                                             | Scope                         |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| C1      | [Brief](../../../brief/singlepage.md), [model](../models/framework-service/model.md)                                                                                                                                                               | Client intentions and terms.  |
| S1      | Anthropic, [Claude Code](https://code.claude.com/docs/en/overview)                                                                                                                                                                                 | Agent capabilities.           |
| S2 / S3 | GitHub, [templates](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template), [feedback](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue) | Distribution mechanics.       |
| S4 / S5 | YouTube, [links](https://support.google.com/youtube/answer/13748639?hl=en), [Shorts](https://support.google.com/youtube/answer/12836917?hl=en)                                                                                                     | Discovery mechanics.          |
| S6      | Google, [Search Essentials](https://developers.google.com/search/docs/essentials)                                                                                                                                                                  | Search visibility.            |
| S7      | Reddit, [Spam](https://support.reddithelp.com/hc/en-us/articles/360043504051-Spam)                                                                                                                                                                 | Participation rules.          |
| S8      | OpenAI, [Environments](https://learn.chatgpt.com/docs/environments/modes), [project guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md)                                                                                        | Conversational development.   |
| S9      | Vercel/Next.js, [SaaS Starter](https://github.com/nextjs/saas-starter/blob/main/README.md), [license](https://github.com/nextjs/saas-starter/blob/main/LICENSE)                                                                                    | Free alternative.             |
| S10     | [ShipFast](https://shipfa.st/)                                                                                                                                                                                                                     | Offer and promotional prices. |
