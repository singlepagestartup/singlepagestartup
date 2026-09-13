---
confirmation:
  confirmed: true
  by: operator
  at: 2026-09-13
  source: "Operator explicitly confirmed the current Strategy in chat: «теперь статус поставь, что подтверждена стратегия и идем дальше»."
  content_sha256: 2622dc1d9ee86e33532abfba58728e3b1999c2ac9759162cd5d9f3ec07887cc0
review:
  dependencies:
    brief: bf0f72b61cb12fc4a6fea78bd136dddb34e57921a7d8dbb528c25f85f30e68e1
    model.framework-service: 504fbbc151ee8cff9d740e06b44a6264c07206b1f9a8631f42702f5ab08d1f32
    product.ai-chat.research: 4a33b01f4414eff99200a5c8a73981a17b8e48873f296848faaec8bd02b363f2
    product.ai-chat.sales: cb92e6d326152867bfe7aa6a3ff103fa32db30a176cb92cb88f1430a50239afb
    product.singlepagestartup.research: 8445093c77d7cc877f76752e5ee3d0f616facdc6fa81e6bb1844d2d42ef3644f
    product.singlepagestartup.sales: 5f4d91f14898077c62d3576a0dd298c4393d3aa788e05df4d42bf6d85b0cbf13
sources:
  strategic_direction_and_products:
    classification: client-claim
    source: apps/studio/workspace/brief/singlepage.md
    source_keys:
      - intake.scope
      - intake.audience_value_and_flow
      - sources.audience_value_and_flow
      - sources.funding
      - sources.current_business
    date: 2026-09-13
    supports: Business-data AI Chat as hosted entry and token revenue; free framework; novice makers, agent editing and human UI review; optional GitHub branch and next-product reuse; recognition and contribution goals.
    limitation: Scoped facts authorize this revision; changed whole-Brief confirmation is unrenewed. Intended journey does not establish public service readiness, customer results, automatic deployment or paid adoption.
  reusable_foundation:
    classification: client-claim
    source: apps/studio/workspace/brief/singlepage.md
    source_keys:
      - sources.current_business
    date: 2026-09-12
    supports: Registration, carts and payments configured and tested together; reuse benefit.
    limitation: Client-reported team testing is not quantified time/token savings or external novice-completion evidence.
  positioning_and_quality:
    classification: verified-fact
    research: apps/studio/workspace/products/singlepage/ai-chat/research.md
    finding_ids:
      - AC-SPS-01
      - AC-SPS-02
      - AC-SPS-05
      - AC-SPS-06
    accessed: 2026-09-13
    urls:
      - https://learn.chatgpt.com/docs/projects
      - https://www.chatbase.co/docs/user-guides/chatbot/data-sources
    supports: Competing tools already accept files/context; grounded usefulness must establish preference.
    limitation: Vendor documentation verifies features, not preference, relative answer quality or willingness to pay.
  demonstration_and_short_content:
    classification: assumption
    resolution: professional-choice
    research:
      - apps/studio/workspace/products/singlepage/ai-chat/research.md
      - apps/studio/workspace/products/singlepage/singlepagestartup/research.md
    finding_ids:
      - AC-SPS-04
      - AC-SPS-07
      - CF-SPS-04
      - CF-SPS-08
    accessed: 2026-09-13
    urls:
      - https://support.google.com/youtube/answer/13748639?hl=en
      - https://support.google.com/youtube/answer/12836917?hl=en
    supports: Demonstrations lead to hosted chat; eligible own public videos can supply Shorts linked to the full video; clickable external descriptions require advanced features.
    limitation: Platform mechanics are verified; channel fit is inferred. No operating account, existing reach, publication quota or performance is asserted.
  searchable_explanations:
    classification: assumption
    resolution: professional-choice
    research:
      - apps/studio/workspace/products/singlepage/ai-chat/research.md
      - apps/studio/workspace/products/singlepage/singlepagestartup/research.md
    finding_ids:
      - AC-SPS-08
      - CF-SPS-09
    accessed: 2026-09-13
    urls:
      - https://developers.google.com/search/docs/essentials
    supports: Helpful use-case pages and maker task guidance connect search intent to demonstrations, hosted chat and repository onboarding.
    limitation: Official content/link guidance supports mechanics; demand, existing traffic, indexing and ranking are unestablished.
  community_participation:
    classification: assumption
    resolution: professional-choice
    research:
      - apps/studio/workspace/products/singlepage/ai-chat/research.md
      - apps/studio/workspace/products/singlepage/singlepagestartup/research.md
    finding_ids:
      - AC-SPS-09
      - CF-SPS-10
    accessed: 2026-09-13
    urls:
      - https://support.reddithelp.com/hc/en-us/articles/360043504051-Spam
    supports: Contextual helpful participation and permitted relevant links; real questions can improve explanations.
    limitation: Reddit is a bounded policy example, not universal community rules, confirmed audience concentration or access.
  growth_and_retention:
    classification: assumption
    resolution: professional-choice
    research:
      - apps/studio/workspace/products/singlepage/ai-chat/research.md
      - apps/studio/workspace/products/singlepage/singlepagestartup/research.md
    finding_ids:
      - AC-SPS-03
      - AC-SPS-06
      - AC-SPS-10
      - CF-SPS-02
      - CF-SPS-05
      - CF-SPS-07
      - CF-SPS-11
      - CF-SPS-12
    accessed: 2026-09-13
    urls:
      - https://code.claude.com/docs/en/overview
    supports: Coordinated discovery and use; new questions and knowledge updates support repeat paid use; optional agent-assisted setup, adaptation, reuse and contributions strengthen future explanations.
    limitation: Proposed mechanism, not observed retention or self-sustaining growth. Agent capabilities establish neither automatic setup nor independent agent selection of SPS. Use only publishable materials for examples.
  resources_and_measurement:
    classification: assumption
    resolution: professional-choice
    source: apps/studio/workspace/brief/singlepage.md
    crosscheck: apps/studio/workspace/products/singlepage/models/framework-service/model.md
    source_keys:
      - sources.funding
      - sources.current_business
      - sources.ai_chat_commercial_terms
    date: 2026-09-13
    supports: Prioritize usefulness and reuse of organic material, then expand effort based on activation, paid retention and adoption; separate attention, use, revenue and contributions.
    limitation: Ongoing capacity/budget, token terms and operating costs remain unselected. No scoped experiment ceiling becomes a recurring commitment.
  release_license:
    classification: client-claim
    source: apps/studio/workspace/brief/singlepage.md
    source_keys:
      - sources.license
    date: 2026-09-12
    inspected_snapshot: https://github.com/singlepagestartup/singlepagestartup/blob/48fff95f2ffe5c6fcfb435ae50700df029608bbe/LICENSE
    limitation: Operator selected MIT and reported publication; inspected local HEAD and origin/main contained proprietary terms. Match a release claim to its exact source; no claim here that inspected main is MIT.
---

# Strategy

## Strategic direction

Grow SinglePageStartup through repeat token revenue and lasting adoption of its free framework. The **audience-growth priority** is recognition through visible business results; the **sales-product priority** is AI Chat.

Position SinglePageStartup as a practical route from solving a business task with AI to building a product on tested common functions. The hosted service must stand on its own for consumers; building is an optional second outcome.

Earn preference through useful answers grounded in the user's materials and demonstrations of working products. Concentrate production effort on showing business outcomes and adaptation through coding agents.

## Audiences and product roles

| Audience and situation                                                    | Value and promise                                                                                                                                           | Product role and desired behavior                                                                                                                                       |
| ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| People with a current business question and relevant facts or documents   | Configure business knowledge and receive answers that use it. Each chat has a separately scoped vector knowledge base; retrieval supplies relevant context. | **AI Chat (`ai-chat`)**: primary hosted entry, token-based revenue and a live demonstration of the framework. Earn continued use through useful answers.                |
| Novice makers, including vibe coders, who want to build their own product | Reuse team-tested registration, carts, payments and other common functions while concentrating on their product's logic.                                    | **Code Framework (`singlepagestartup`)**: free code and documentation for local deployment, adaptation and reuse. Adoption and community improvements are its outcomes. |

Agents independently selecting SPS are a longer-term audience; clear documentation and reliable functions support that goal.

## Growth system

Lead the proposed organic system with working demonstrations. Short content and searchable explanations extend each example; community answers connect it to relevant questions.

| Channel or mechanism                             | Role and audience                                                     | Content or value                                                                                                        | Destination and contribution                                                                           |
| ------------------------------------------------ | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| YouTube demonstrations and tutorials             | Explain the value to business users; show makers what they can build. | A real business question, supporting facts and resulting answer; complementary tutorials show a working product change. | **Try AI Chat** is the main CTA; lead viewers into the hosted experience.                              |
| Repurposed short videos                          | Introduce one understandable result to new viewers.                   | Extract a useful moment from the full demonstration.                                                                    | Link the Short to its full video, where viewers can understand the example and continue into the chat. |
| Searchable use-case pages and task documentation | Help people actively looking for an answer or building guidance.      | Explain the business task or maker's goal, required context, outcome and limitations.                                   | Connect to the matching demonstration and chat; maker guidance also leads to repository onboarding.    |
| Contextual community participation               | Meet relevant business and maker questions.                           | Give useful answers; include an example when relevant and permitted by the community.                                   | Lead to the matching explanation and discover questions needing better guidance.                       |

Reuse one demonstrated task across these channels. Useful experiences create return visits, recommendations and maker interest; their questions, adaptations and voluntary improvements supply better examples and documentation. This cycle strengthens the next discovery and use experience.

## Customer journey

1. **Discover and understand.** A demonstration, search result or relevant answer leads to a use case and the hosted chat.
2. **Get a useful result.** Supply business materials and ask a real question. Judge whether the answer is supported and useful.
3. **Continue as a consumer.** Return with further questions or updated knowledge; buy tokens when continued use is valuable. Clear balance and purchase terms support confidence.
4. **Choose to build.** After a positive experience, interested makers use **Развернуть проект на своей машине** to reach GitHub. This branch does not require a token purchase.
5. **Adapt and retain.** Ask Claude Code or Codex Desktop to deploy locally and make changes through conversation. The agent edits the code; the person reviews the interface and checks the result. Continue the product and choose SPS again for the next one.
6. **Recommend and improve.** Recommend the public example or a result; makers can contribute improvements to the foundation and documentation.

## Measurement and priorities

| Strategic outcome             | Observable signals                                                                           | Management consequence                                                                                                         |
| ----------------------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Recognition                   | Relevant visits, demonstration-to-chat movement and GitHub stars                             | Expand topics that bring interested people into use. Attention without activation calls for clearer examples and entry points. |
| Chat activation and retention | Supported, user-rated useful answers; return use with further questions or updated knowledge | Improve the knowledge experience before increasing acquisition when usefulness or return use is weak.                          |
| Revenue                       | Completed token purchases, repeat paid use and service costs                                 | Refine the offer and judge commercial viability before increasing spending.                                                    |
| Framework adoption            | Working local deployments, useful adaptations and next-product reuse                         | Improve the setup or reuse guidance where makers stall; invest in capabilities they actually reuse.                            |
| Community growth              | Recommendations, useful contributions and later agent-led adoption                           | Turn recurring needs and accepted improvements into clearer documentation and stronger examples.                               |

Prioritize usefulness and a clear path into use, then reusable demonstrations and documentation. Broaden distribution as activation, repeat paid use and adoption justify the effort. Organic emphasis fits owner funding and reuses material across channels. Scale publication and support to the owner's available time and funding.

Product-level work defines token offers and validates answer quality, paid continuation and local adoption.
