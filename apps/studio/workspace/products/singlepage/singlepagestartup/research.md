---
finding_prefix: CF
sales_audit: true
sales_audit_scope: Operator accepted the Sales structure only; its customer assumptions and process details remain proposals under investigation.
confirmation:
  confirmed: false
sources:
  license:
    classification: client-claim
    source: Brief sources.license and Product sources.license; operator selected MIT, and commit 914115d1be published it, 2026-09-18.
    limitation: The fetched origin/main LICENSE carries the MIT text and the README states the same terms. The license covers the downloadable source only; competitor comparisons still rest on their own published terms.
    inspected_snapshot: https://github.com/singlepagestartup/singlepagestartup/blob/1df352484f23a8615962da490771028b7f87f536/LICENSE
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
  current_repository_inspection:
    classification: verified-fact
    inspected_at: 2026-10-24
    head: aa780be0f99f78f5d25802d259059cb1b66f4cb0
    finding_ids: [CF-SPS-38]
    source: Local committed snapshots inspected during the required GitHub preflight; source evidence only.
    scope:
      - libs/modules/knowledge/README.md and libs/modules/file-storage/README.md; editable Source, derived Chunk and original File ownership.
      - libs/modules/rbac/models/subject/README.md and libs/modules/social/README.md; current-Subject access, profiles, chats, threads and saved-material scope.
      - libs/modules/agent/README.md and libs/shared/utils/src/lib/constants/open-router-models.ts; configured AI processing and text-output answering, not hosted quality.
      - .agents/contracts/engineering/frontend-components.md and libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/rbac/Component.tsx; domain-owned Widgets, exact-instance presentation slots and explicit Host route IDs.
      - libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/access.ts and libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/list.ts; owned cart and purchase projections.
      - libs/shared/backend/api/src/lib/repository/database/context.ts, libs/shared/backend/api/src/lib/mutation-effects/consistency.ts and libs/providers/db/README.md; service snapshots, PostgreSQL generations and durable invalidation.
      - libs/shared/frontend/client/api/README.md, libs/shared/frontend/client/store/README.md and apps/host/src/components/revalidation/ClientComponent.tsx; principal-scoped React Query data, SDK patches and one Host realtime transport.
      - apps/studio/README.md and apps/mcp/README.md; independent local previews and authenticated project MCP configuration.
    limitation: Committed implementation and configuration only. No new deployment, runtime, full visual coverage, customer, compatibility, savings or independent-installation result is established. The schema census is snapshot-specific and is not a public product promise.
  preparation_journey:
    classification: client-claim
    date: 2026-10-24
    source: Brief intake.framework_preparation_journey; current operator goal-objective.md.
    scope: AI Chat preparation, human review and export precede a coding-agent brief for a landing page or product. The Framework landing, module and Blog explanations and token-purchase pages make that connection visible; direct MIT reuse remains available.
    limitation: A selected process and communication requirement; handoff usefulness, search acquisition and conversion remain unmeasured.
review:
  dependencies:
    brief: 490a648452b91afd083215d3b2420e6990deedbfcc94442dc30b731613cb3258
    product.singlepagestartup.analytics: be0f193e75ae44c3c92ff3ceabe02814f23c1958b57ef812bfcb3440a005cd20
    product.singlepagestartup.page.research.competitors: 6efcf5101e989dfc5ad439d9fa04fcc41792696fdc97e520c795b03128673a6a
    product.singlepagestartup.page.research.developer-agents: d0ac4e91c7d319e4e796c69be6b76a77b2a8aa8dee7f14fbe27fbb10910899a5
    product.singlepagestartup.page.research.makers: 13ddcd6b09cb312bd06cc7ec810b7cd7d2d0d25be3ca5ecbca35e714344f7f19
    product.singlepagestartup.sales: 9274aa239ae9f522707a0a540dcfcffef10a01d62809d298ee274946b75a0184
---

# Code Framework research

## Decision and scope

For `singlepagestartup`, assess audience needs, alternatives, differentiation and distribution for a framework that charges no money and is paid in social capital. The project owner decides priorities; [Product](product.md) owns `bridge`, `framework-growth`, `channel-access` and `proof`.

This worldwide desk review combines client input, primary user studies, first-person practitioner accounts and official offers checked 2026-09-13. It assesses the proposed Sales details for both segments, not just whether their tools exist. Document structure is not market evidence; audience assumptions and desired experiences remain proposals. This review contains no direct SPS customer interviews or tracked complete customer journeys.

| Detailed research                                               | What it answers                                                                                                     |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [Makers](research/makers.md)                                    | Needs, motivations, triggers, criteria, objections, all acquisition routes and journey stages for `makers`.         |
| [Coding agents acting for people](research/developer-agents.md) | The same seven dimensions for `developer-agents`, with the human as beneficiary and decision owner.                 |
| [Competitor offers](research/competitors.md)                    | Free/paid starters, managed builders, generated projects and informal alternatives, with current prices and limits. |

Verdicts distinguish `supported`, `partially-supported`, `contradicted` and `unresolved`. Evidence applies to each source's population and setting; neither vendor features nor experienced-developer surveys establish novice SPS demand.

## Buyer and purchase situation

**CF-SPS-01 — client intention.** Novice makers want their own products and mainly direct coding agents through conversation. They seek reusable registration, carts and payments so they can concentrate on their business logic. The maker or team chooses the framework; no code purchase is required. Reviewed business and product descriptions from AI Chat can supply the coding-agent brief for a landing page or product. A maker with existing material can enter directly; remaining a hosted consumer is equally valid. [C1]

The Framework landing is intended to explain that preparation route, name module responsibilities and link to Blog articles and hosted token purchases. Articles can connect a concrete task to the responsible module and its source; search traffic and adoption from these pages remain unmeasured.

The second route is a coding agent recommending or using a foundation for a human-assigned task. The person remains the beneficiary and decision owner; evidence for this route is assessed in the [delegated-agent review](research/developer-agents.md) (CF-SPS-22, CF-SPS-24 and CF-SPS-28). An agent is not a separate paying customer.

## Alternatives and competition

**CF-SPS-13 — documented alternatives.** Free Next.js SaaS Starter and Open SaaS; paid ShipFast and Makerkit; Lovable, Replit and v0 managed builders; agent-generated projects; and previous-project reuse compete for this decision. The [detailed comparison](research/competitors.md) owns their offers, prices, distribution and limits. [S9, S10]

Free common functions, demonstrations and agent guidance are already offered elsewhere. Their presence is not exclusive differentiation. A managed builder can be preferable when the maker values convenience more than operating a local foundation; some also support code export. SPS should win a suitable task on its relevant reusable functions and understandable guidance, without assumed superiority.

## Price, channels, and evidence

**CF-SPS-03 — client terms.** The code carries no charge and is funded by the owner; its price is paid in stars, forks, recommendations and contributions. Agent and infrastructure charges are the maker's own. AI Chat token revenue is a different product income stream. [C1]

| Finding       | Distribution implication                                                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CF-SPS-04** | YouTube demonstrations can introduce AI Chat and optional framework adoption. Clickable external long-form links require advanced features; Shorts description URLs are not clickable. [S4] |
| **CF-SPS-08** | Eligible own-video Shorts link to the original: use an understandable result to introduce the full explanation. [S5]                                                                        |
| **CF-SPS-09** | Useful, searchable task pages can connect maker questions to examples. Google does not guarantee indexing. [S6]                                                                             |
| **CF-SPS-10** | Relevant community answers can introduce the project; Reddit requires contextual participation and local rules. Reach is unestablished. [S7]                                                |

### Source-backed framework scope

**CF-SPS-38 — verified source scope.** The inspected repository connects Host route composition, RBAC account scope, Social profiles and conversations, Knowledge Source documents and derived Chunk retrieval, File Storage originals, Agent work, Ecommerce catalogs and orders, and Billing balances and payment integration. Domain Widgets own session, SDK, form and mutation work; Website Builder owns presentation connected through exact saved relations and JSX slots. Host reads named URL values at the page boundary and passes explicit IDs or slugs. Current-Subject commerce projections constrain carts and purchase details to their owner. Server reads use service snapshots and PostgreSQL-backed cache generations; clients keep loaded API data in principal-scoped React Query, patch mutations through SDK helpers and reconcile other changes through the shared Host realtime transport. The store's sessionStorage snapshot is diagnostic. Studio Product previews remain local demonstrations independent of production SDKs; project MCP configuration and OAuth are separate setup steps. [Repository snapshot](https://github.com/singlepagestartup/singlepagestartup/tree/aa780be0f99f78f5d25802d259059cb1b66f4cb0), `sources.current_repository_inspection`.

Knowledge coordinates stored-file changes and analysis while File Storage owns the original bytes. Saved material is distinct from bounded retrieval excerpts and paged tool reads. AI Chat account, project and document paths have SDK-backed source implementations; a local Product preview does not prove a running service. These facts support module explanations and architecture articles. They establish neither complete visual coverage nor installed cache coverage, live payment behavior, answer quality, independent setup success or customer savings.

## Findings and unknowns

- **CF-SPS-02 — observation:** coding agents support conversational changes to local projects. This makes the selected audience plausible, without proving SPS preference. [S1, S8]
- **CF-SPS-05 — professional implication:** explain a useful business change and show the resulting product, so a beginner understands the value of adopting the foundation.
- **CF-SPS-06 — observation:** GitHub supports distributing starter projects and voluntary feedback; neither is a purchase requirement. [S2, S3]
- **CF-SPS-11 — inference, medium confidence:** connecting a demonstrated product, reusable functions and understandable guidance can make SPS easier to evaluate. Open SaaS and Makerkit also package agent guidance; show task-specific fit, continuing responsibilities and support rather than claiming an exclusive combination.
- **CF-SPS-07 — evidence gap:** attention, adoption, next-product reuse and contributions are separate outcomes. Demand, comparative time/token savings and independent agent selection remain unmeasured.
- **CF-SPS-12 — hypothesis, medium confidence:** reviewed AI Chat documents may help a maker formulate a coding-agent task; useful adaptations and contributions may supply stronger examples and recommendations. This is a proposed growth mechanism, not observed retention.

The [maker audit](research/makers.md), CF-SPS-15, CF-SPS-16, CF-SPS-17, CF-SPS-18 and CF-SPS-19, partially supports accessible creation, understandable results, task-led adoption and cost concerns. It adds differences between nontechnical users and beginners who want to learn, as well as guidance, continuing costs and managed alternatives. It does not establish that AI Chat is a frequent adoption trigger.

The [delegated-agent audit](research/developer-agents.md), CF-SPS-22, CF-SPS-23, CF-SPS-24, CF-SPS-25 and CF-SPS-26, supports considering human-supplied references and prior work. Independent discovery, SPS recommendation and repeat selection remain unresolved. The proposed CJMs can remain planning maps; their desired experiences and transition rates are not observed facts. Current no-purchase, human-authority and alternative-selection boundaries remain appropriate. Acquisition and journey assessments are CF-SPS-20, CF-SPS-21, CF-SPS-27 and CF-SPS-28.

## Sources

Source IDs in this table are local to this document.

Accessed 2026-09-13. Vendor sources reflect commercial/ecosystem interests, not independent customer samples; applicability is worldwide documentation, without a regional demand study.

| ID      | Source                                                                                                                                                                                                                                             | Scope                         |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| C1      | [Brief](../../../brief/singlepage.md), [Product](product.md)                                                                                                                                                                                       | Client intentions and terms.  |
| S1      | Anthropic, [Claude Code](https://code.claude.com/docs/en/overview)                                                                                                                                                                                 | Agent capabilities.           |
| S2 / S3 | GitHub, [templates](https://docs.github.com/en/repositories/creating-and-managing-repositories/creating-a-repository-from-a-template), [feedback](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue) | Distribution mechanics.       |
| S4 / S5 | YouTube, [links](https://support.google.com/youtube/answer/13748639?hl=en), [Shorts](https://support.google.com/youtube/answer/12836917?hl=en)                                                                                                     | Discovery mechanics.          |
| S6      | Google, [Search Essentials](https://developers.google.com/search/docs/essentials)                                                                                                                                                                  | Search visibility.            |
| S7      | Reddit, [Spam](https://support.reddithelp.com/hc/en-us/articles/360043504051-Spam)                                                                                                                                                                 | Participation rules.          |
| S8      | OpenAI, [Environments](https://learn.chatgpt.com/docs/environments/modes), [project guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md)                                                                                        | Conversational development.   |
| S9      | Vercel/Next.js, [SaaS Starter](https://github.com/nextjs/saas-starter/blob/main/README.md), [license](https://github.com/nextjs/saas-starter/blob/main/LICENSE)                                                                                    | Free alternative.             |
| S10     | [ShipFast](https://shipfa.st/)                                                                                                                                                                                                                     | Offer and promotional prices. |
