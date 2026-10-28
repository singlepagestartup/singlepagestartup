---
finding_prefix: AC
sales_audit: true
confirmation:
  confirmed: false
sources:
  current_repository_inspection:
    classification: verified-fact
    inspected_at: 2026-10-24
    head: aa780be0f99f78f5d25802d259059cb1b66f4cb0
    finding_ids: [AC-SPS-26, AC-SPS-27]
    scope:
      - libs/modules/rbac/models/subject/README.md; SDK-backed account, owned project, document, purchase and balance flows.
      - libs/modules/knowledge/README.md and libs/modules/knowledge/models/source/README.md; editable Source, derived Chunk, original attachment links, scoped tools and confirmed document proposals.
      - libs/shared/utils/src/lib/constants/open-router-models.ts; configured text-output answering policy.
      - libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/billing/route.ts; aggregate balance admission before paid generation.
      - apps/studio/README.md; local preview isolation from runtime Modules and SDKs.
    limitation: Source inspection only. No new running session, provider call, payment, renewal, request-reversal or deployment test is established.
  current_checkout_allowance_inspection:
    classification: verified-fact
    inspected_at: 2026-10-24
    head: 5cb165c6a5175012380dbcf5e567768b5b59fdab
    scope: libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/billing/free-subscription.ts and libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts; one-time Free bootstrap with prior-delivery guard and additive paid credits.
    limitation: Current local branch source, separate from the fetched snapshot. This inspection did not execute registration, payment or renewal.
  allowance_and_pro:
    classification: client-claim
    resolution: operator-fact
    date: 2026-10-24
    source: Brief sources.ai_chat_allowance_and_pro; explicit operator price, monthly-period and unchanged-deduction answers.
    scope: Registration grants 3000 internal tokens once; Pro grants 5000 per month for 29 USD or 1900 roubles per month. The five rouble top-ups and existing deduction and request-return terms remain unchanged.
  preparation_journey:
    classification: client-claim
    date: 2026-10-24
    source: Brief intake.framework_preparation_journey; current operator goal-objective.md.
    scope: Prepare a business model, concept, business plan and project and product documents; review and export useful material; brief a coding agent for a landing page or product on free Code Framework.
    limitation: Intended process, not measured handoff success or availability of hosted automatic page assembly and deployment.
  admission_policy_mismatch:
    classification: missing-evidence
    resolution: evidence-gap
    finding_ids: [AC-SPS-27]
    source: Brief sources.ai_chat_balance_and_output_use and committed billing/route.ts at aa780be0f99f78f5d25802d259059cb1b66f4cb0, including ef09fd069a09cf3f3ea3201d25983d7c39c243a4.
    observation: The source admits a paid request only when the aggregate matching balance covers its precharge, normally at least one internal token. The operator's commercial intent permits debt until −2000 internal tokens. These are different admission rules.
    consequence: Runtime alignment remains unresolved. Preserve the operator's financial and deduction terms; neither source existence nor this visual task authorizes substituting one policy for the other. UI examples cannot prove the promised debt allowance.
review:
  dependencies:
    brief: 490a648452b91afd083215d3b2420e6990deedbfcc94442dc30b731613cb3258
    product.ai-chat.analytics: 852d411eb0dc57dc45502b9ab350be564455540f6d06e285b8042cb2bdb007d4
    product.ai-chat.page.research.business-users: 90c4cb52056fd8f8d588e9c86de4a8a2b22edaf53518e1bb5e3b35e0f793a60f
    product.ai-chat.page.research.competitors: 097730def82a7ee11dc044f94defbf89a38d17d47e36b5611028e39c466666e2
    product.ai-chat.sales: f765054d5282a8c8a02a98e1fab7e1338c1f4df231b7d77318b0ec4d684ab82a
---

# AI Chat research

## Decision and scope

For `ai-chat`, assess whether the proposed first-stage workspace helps `business-users` describe their projects in shortened, editable documents. The scope covers Brief, Strategy, Brand and a written Design description, plus each product's own customer and offer, Operations & Economics, Sales, Promotion, Analytics and applicable research. Promotion describes the intended public presentation in words, including Website, Creative and Presentation text where relevant. Users review the drafts, correct shortcomings identified by the AI agent, accept the descriptions and reuse or export them. The service owner uses their work and feedback to improve that workflow. [Product](product.md#revenue-streams) owns service economics and its share of shared resources.

Landing-page assembly, editing and paid server deployment are future development after evaluation and improvement of the description workflow. Their hypotheses remain explicitly deferred; they are outside current activation, completion and research tests. Future deployment prices do not block research of the first-stage document offer. [C1]

This purposive desk review combines scoped operator direction with product and platform documentation accessed 2026-09-13 and the limited file-capacity source checked 2026-09-18. Those dated sources describe capabilities and channel mechanics, not representative demand, successful customer outcomes or willingness to pay. External facts have not been rechecked for this scope correction. The [segment audit](research/business-users.md) checks all proposed Sales dimensions, routes and current Customer Journey Map steps. [Competitors and alternatives](research/competitors.md) preserves the offer-level comparison.

## Buyer and purchase situation

**AC-SPS-01 — client intention.** People with an idea or early-stage project supply notes, documents and partial decisions, then review shortened Brief, Strategy, Brand, written Design and separate product documents. Each product retains its own customer and offer, Operations & Economics, Sales, Promotion, Analytics and applicable research. The setup aims to create useful context in about one focused hour without forcing unknown answers. Users correct the shortcomings the AI agent identifies, accept or export the descriptions and reuse them in later discussion. The intended paid continuation is a top-up or monthly Pro after useful work. The accepted material can also become a coding-agent brief for a landing page or product on free Code Framework. The owner evaluates and improves this workflow before selling later landing-page deployments. Buyer, payer and organizational authority remain unobserved. [C1]

The current qualifying trigger is a project or business idea whose notes, documents and essential decisions are scattered, incomplete or repeatedly re-explained. The desired progress is a reviewed set of project and product descriptions that can support later discussion and work outside the service. Demand for the user's project and superior AI answers are unproven. The narrower market, geography and business stage remain unselected.

## Alternatives and competition

**AC-SPS-02 — verified capability comparison.** ChatGPT Projects keeps files and instructions available across project chats. Chatbase accepts documents, text and websites as knowledge for an agent. General assistants, document tools, website builders, consultants, informal notes and doing nothing also compete for parts of the proposed workflow. These alternatives confirm that shared context and generated pages are available categories; they do not confirm preference for SinglePageStartup's connected decision structure. They differ in how much material they hold: ChatGPT Projects caps files per project in the low tens, so its context is a working set rather than a document corpus. [S1, S2, AC-SPS-25]

**AC-SPS-03 — differentiation hypothesis.** The proposed distinction has two parts. The first is attribution of mixed input to editable project documents and separate product sections, with visible shortcomings, user corrections and accepted descriptions reused in later discussion. The second is the size of the corpus the service answers from: the operator's selected design vectorizes every uploaded document without a file ceiling and retrieves relevant parts for each answer. The dated ChatGPT Projects comparison records a limit in the low tens; whether a larger corpus produces better answers for this customer is unresolved. Compare the same source material, document coverage, correction paths, export and later idea question. Preference and willingness to pay remain unproven. [AC-SPS-02, AC-SPS-20, AC-SPS-25]

## Price, channels, and evidence

**AC-SPS-04 — client intention.** Token purchases are the selected revenue direction. The SinglePageStartup creator is the intended seller, and the Russian payment party requires an online receipt flow. [Product](product.md#revenue-streams) defines the one-time registration allowance, monthly Pro, top-ups, unit price, currency, payment timing, intended negative-balance limit, expiry, top-up cash refund policy and full token return for failed or cancelled AI requests. Payment-party details and receipts are configured in the product interface. Attributable service costs, including provider expense on failed or cancelled requests, remain unmeasured. Competitor prices may inform a comparison but cannot determine a viable SinglePageStartup offer. [C1]

**AC-SPS-05 — channel hypothesis.** Full demonstrations, short vertical extracts, searchable explanations and contextual community answers can show scattered input becoming editable project and product descriptions, the user correcting a shortcoming and a later discussion using the accepted text. Official platform guidance supports link, Shorts, search and community mechanics; it does not establish reach or conversion. [S3, S4, S5, S6]

The three Sales acquisition routes — `demonstration`, `search` and `community` — remain proposed. Their messages and destinations now share the same structuring, review and continued-thinking proposition. Audience concentration, production capacity and attributable channel results are unknown.

## Findings and unknowns

- **AC-SPS-06 — unresolved:** learn whether people can supply material without sorting it first, review shortened project documents and each product's own sections in about one focused hour, correct where AI Chat placed statements and consider the resulting descriptions useful. The hour is a proposed target, not a measured completion time. [AC-SPS-11, AC-SPS-12]
- **AC-SPS-07 — unresolved:** test whether later discussion reduces repeated explanation, provides useful criticism rather than automatic agreement and lets users identify which accepted decision informed a result. [AC-SPS-12]
- **AC-SPS-08 — unresolved:** test whether the shorter documents retain each product's essential decisions, whether users can correct the AI agent's identified shortcomings and whether they can export and use the accepted text outside the service. Landing-page and deployment questions in AC-SPS-13 are deferred.
- **AC-SPS-09 — unresolved:** distinguish project starts, usable accepted descriptions, correction of shortcomings, return use, export and token purchase. These observations inform the workflow; they do not prove demand for the user's project. Track reviewed-document exports and coding-agent handoffs to Code Framework separately from token purchases and future hosted publication. [AC-SPS-14]
- **AC-SPS-10 — evidence gap:** price acceptance, repeat use, data expectations, support needs and service costs require direct product-specific learning. Broad assistant adoption or a successful example cannot fill those gaps.

The first-stage Sales process has no open operator-fact blockers: Product specifies full token return for failed or cancelled AI requests. The proposal still requires customer validation. [Website](website/new-project.md#how-your-materials-are-processed-and-stored) defines processing, storage and deletion disclosure; its visibility and customer comprehension still need verification in the implemented service. Email/password access, the free portion, saved written descriptions and the initial 24-hour support promise are operator intentions. The customer profile and journeys are proposals, not observed behavior. Future deployment terms are undecided and outside the current offer.

### Source implementation and proof limits

**AC-SPS-26 — verified source scope.** Account, owned-project, Source-document editing, export, settings, balance and purchase paths have SDK-backed implementations. Knowledge stores editable Source content, derives Chunk retrieval and keeps original File Storage attachments linked. Document threads stage an exact proposal for later user confirmation; linked profile Knowledge remains available for scoped reading, while an unsaved draft is distinct from saved material. The configured answering policy produces text; model routing does not itself authorize writes. Product Storybook screens use independent local fixtures. These facts establish source responsibilities, not a completed hosted customer journey, quality of generated business material, successful payments or renewal. [Repository snapshot](https://github.com/singlepagestartup/singlepagestartup/tree/aa780be0f99f78f5d25802d259059cb1b66f4cb0), `sources.current_repository_inspection`.

**AC-SPS-27 — unresolved source-policy mismatch.** The implemented admission check requires the aggregate balance to cover a paid request's precharge. Product's operator-supplied terms permit new requests above a −2000-token debt threshold. The difference concerns admission, not the internal-token unit, package pricing or successful-request settlement. Runtime alignment under the operator's retained financial terms remains unverified. [Billing route](https://github.com/singlepagestartup/singlepagestartup/blob/aa780be0f99f78f5d25802d259059cb1b66f4cb0/libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/billing/route.ts), `sources.admission_policy_mismatch`.

## Sources

Source IDs in this table are local to this summary.

| ID  | Source and date                                                                                                                          | Application and limits                                                                                                                                                                                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| C1  | [Brief](../../../brief/singlepage.md), operator clarifications 2026-09-13, 2026-09-16, 2026-09-17, 2026-09-18, 2026-10-06 and 2026-10-24 | Written project and per-product documents, review/export-to-Framework route, one-time allowance, monthly Pro, unchanged deductions and later deployment limits. Client intention, not demand evidence. |
| S1  | OpenAI, [Projects and chats](https://learn.chatgpt.com/docs/projects), accessed 2026-09-13                                               | Shared project context alternative, AC-SPS-02; vendor documentation, no comparative outcome sample.                                                                                                    |
| S2  | Chatbase, [Data sources](https://www.chatbase.co/docs/user-guides/chatbot/data-sources), accessed 2026-09-13                             | Business-knowledge agent alternative, AC-SPS-02; documented capability, not customer preference.                                                                                                       |
| S3  | Google/YouTube, [Sharing links with your audiences](https://support.google.com/youtube/answer/13748639?hl=en), accessed 2026-09-13       | External-link mechanics, AC-SPS-05; no reach or conversion evidence.                                                                                                                                   |
| S4  | Google/YouTube, [Create Shorts from your videos](https://support.google.com/youtube/answer/12836917?hl=en), accessed 2026-09-13          | Short extracts from eligible public videos, AC-SPS-05; no audience-fit evidence.                                                                                                                       |
| S5  | Google, [Search Essentials](https://developers.google.com/search/docs/essentials), updated 2025-12-10, accessed 2026-09-13               | Searchable helpful-content mechanics, AC-SPS-05; no indexing or ranking guarantee.                                                                                                                     |
| S6  | Reddit, [Spam](https://support.reddithelp.com/hc/en-us/articles/360043504051-Spam), updated 2026-05-19, accessed 2026-09-13              | Contextual participation boundary, AC-SPS-05; each community has its own rules.                                                                                                                        |
