---
confirmation:
  confirmed: true
  by: operator
  at: "2026-09-18"
  source: "Operator re-confirmed the current Strategy on 2026-09-18 after the coordinator checked it against the confirmed Brief and found no correction needed: «Да, оба». The 2026-09-17 approval it replaces was stamped against a body the commit hooks then reformatted."
  content_sha256: d68e88a81632b3ddf4f57431d6963c9d74c28bf2ba0a3d9578fb2d925fe3bf82
review:
  dependencies:
    brief: 6b2c413d4d8f686e53dc2886c93c5ad79c8e04b93d75158f0a1fb15051b3fe2f
    model.framework-service: 24505045708eaee8184c7d988841e54b6408be46051b785d18989c6329a14a80
    product.ai-chat.research: 28aa90e90dfe6cdc80b4dade029f6447cb7c861f2f9657156e36ce4a9cee64bc
    product.ai-chat.sales: 9ce83a549912024d0916ae119c2f6ddb55502ed0d727983f60dfc89e63b60400
    product.singlepagestartup.research: 629f3131efae5b5778d2bf8cb4a6bf7b98b5d223f4174d6583c93ad3a1bcf01e
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
    date: 2026-09-17
    supports: AI Chat as the hosted entry and token-revenue product; files, images
      and guided answers structured into a business and marketing model; later
      discussion and criticism grounded in that model; an exportable document, a
      private landing-page sandbox and guided publication through the user's
      GitHub repository and server; free framework for the deployed site or
      another concrete software need; agent editing, human review, server
      deployment and next-product reuse.
    limitation: Intended journey does not establish public-service readiness, setup
      time for a separate site, customer results, automatic deployment or paid
      adoption.
  reusable_foundation:
    classification: client-claim
    source: apps/studio/workspace/brief/singlepage.md
    source_keys:
      - sources.current_business
    date: 2026-09-12
    supports: Registration, carts and payments configured and tested together; reuse
      benefit.
    limitation: Client-reported team testing is not quantified time/token savings or
      external novice-completion evidence.
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
    supports: Competing tools already accept files/context and can discuss ideas;
      attributable structuring, correction and reasoned continued use must
      establish preference.
    limitation: Vendor documentation verifies features, not preference, relative
      answer quality or willingness to pay.
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
    supports: Demonstrations lead to hosted chat; eligible own public videos can
      supply Shorts linked to the full video; clickable external descriptions
      require advanced features.
    limitation: Platform mechanics are verified; channel fit is inferred. No
      operating account, existing reach, publication quota or performance is
      asserted.
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
    supports: Helpful use-case pages and maker task guidance connect search intent
      to demonstrations, hosted chat and repository onboarding.
    limitation: Official content/link guidance supports mechanics; demand, existing
      traffic, indexing and ranking are unestablished.
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
    supports: Contextual helpful participation and permitted relevant links; real
      questions can improve explanations.
    limitation: Reddit is a bounded policy example, not universal community rules,
      confirmed audience concentration or access.
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
    supports: Coordinated discovery and use; project structuring, new questions,
      idea criticism and knowledge updates support repeat paid use; optional
      agent-assisted setup, adaptation, reuse and contributions strengthen
      future explanations.
    limitation: Proposed mechanism, not observed retention or self-sustaining
      growth. Agent capabilities establish neither automatic setup nor
      independent agent selection of SPS. Use only publishable materials for
      examples.
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
    supports: Allocate effort to usefulness and reusable organic material; expand
      acquisition only where activation, paid retention or adoption supports it;
      separate attention, use, revenue and contributions.
    limitation: Ongoing capacity/budget, token terms and operating costs remain
      unselected. No scoped experiment ceiling becomes a recurring commitment.
  release_license:
    classification: client-claim
    source: apps/studio/workspace/brief/singlepage.md
    source_keys:
      - sources.license
    date: 2026-09-12
    inspected_snapshot: https://github.com/singlepagestartup/singlepagestartup/blob/48fff95f2ffe5c6fcfb435ae50700df029608bbe/LICENSE
    limitation: Operator selected MIT and reported publication; inspected local HEAD
      and origin/main contained proprietary terms. Match a release claim to its
      exact source; no claim here that inspected main is MIT.
---

# Strategy

## Strategic direction

SinglePageStartup operates as one business with two complementary products. **AI Chat (`ai-chat`)** is the primary hosted experience and revenue product: people bring existing notes, documents and partial decisions or answer guided questions; the service organizes that input into a project for review, then remains available for developing and critically examining ideas, preparing materials and assembling a private landing-page sandbox from SinglePageStartup blocks. Sandbox data is stored with the project and can be rendered immediately in the frontend. When the page is ready, AI Chat guides GitHub authorization, repository creation, server connection and automatic deployment. They buy tokens when continued use remains valuable. **Code Framework (`singlepagestartup`)** supplies the deployable foundation for that public site or another concrete software need: makers reuse tested common functions, deploy to their server, adapt the product with coding agents and can improve the shared base. AI Chat demonstrates and applies the framework without requiring the customer to configure every technical step manually.

The **audience-growth priority** is recognition through a visible progression from scattered project material to an approved structure, a useful follow-up discussion, a landing-page sandbox and publication through the user's repository and server. The **sales-product priority** is repeat use of AI Chat and token revenue. SinglePageStartup is positioned as a practical system for organizing an early project, thinking through it with a context-aware counterpart and turning accepted decisions into products and customer-facing materials.

The final system satisfies the Brief when the hosted service turns a person's available material into an accepted project context, helps them develop and challenge later ideas from that context, assembles the first landing page for review in a sandbox, and can carry the approved page through a user-owned repository to a user-controlled server. The central trade-off is depth over reach: approved project foundations, useful continued work, usable results and reusable guidance receive priority over broad distribution that does not lead to use, revenue or adoption.

## Audiences and product roles

| Audience and situation                                                                                                      | Value and promise                                                                                                                                                                                    | Product role and desired behavior                                                                                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| People with a business idea or early-stage project whose information is scattered across notes, documents and conversations | Supply available material or answer guided questions; review the proposed project structure; develop and question later ideas from the accepted context; prepare and inspect a landing-page sandbox. | **AI Chat (`ai-chat`)**: primary hosted entry, token-based revenue and a live demonstration of the framework. Earn continued use by structuring project knowledge and supporting reasoned later discussion, decisions, materials and products. |
| Novice makers, including vibe coders, with a concrete site, chatbot or product need                                         | Reuse team-tested registration, carts, payments and other relevant common functions while concentrating on their product's own rules.                                                                | **Code Framework (`singlepagestartup`)**: free code and documentation for server deployment, adaptation and reuse. Adoption and community improvements are its outcomes.                                                                       |

Agents that independently select SPS form an additional adoption audience. Clear machine-readable documentation, reliable shared functions and attributable examples let agents recommend the framework without changing the primary human customer paths.

## Growth system

The growth system is a closed, organic loop built around demonstrated customer value. A real project moves from scattered input to an approved structure, a useful discussion or criticism, a landing-page sandbox and a later decision or product change. That progression becomes a working demonstration, a searchable explanation, short-form material and a relevant community answer. Every representation returns the audience to the same owned use case and then to the appropriate product experience.

| Channel or mechanism                             | Role and audience                                                     | Content or value                                                                                                                       | Destination and contribution                                                                                  |
| ------------------------------------------------ | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| YouTube demonstrations and tutorials             | Explain the value to project owners; show makers what they can build. | Show mixed files and images becoming a business model, then show one reasoned idea discussion and the landing-page sandbox.            | **Organize your materials** is the main CTA; lead viewers into registration and upload.                       |
| Repurposed short videos                          | Introduce one understandable transition to new viewers.               | Extract the moment where scattered input becomes a clear structure, an assumption is challenged or a landing-page preview takes shape. | Link the Short to its full video, where viewers can understand the example and continue into AI Chat.         |
| Searchable use-case pages and task documentation | Help people looking for a way to start or for building guidance.      | Explain the project situation, the page produced, the next decision and the limits of the example.                                     | Connect to the matching demonstration and workspace; concrete maker tasks also lead to repository onboarding. |
| Contextual community participation               | Meet relevant business and maker questions.                           | Give useful answers; include an example when relevant and permitted by the community.                                                  | Lead to the matching explanation and discover questions needing better guidance.                              |

One demonstrated progression is reused across these channels without changing its underlying claim or evidence boundary. Useful AI Chat experiences create return visits, recommendations and relevant maker interest. Completed project pages, landing-page sandboxes, later questions, separately deployed sites, successful adaptations and voluntary framework improvements supply stronger examples and documentation. The resulting material improves discovery while the product experience remains the proof behind the message.

## Customer journey

This is the intended customer experience inside the operating system, rather than a rollout plan for building it.

1. **Discover and understand.** A demonstration, search result or relevant answer shows mixed project input becoming an approved structure and useful later work, then leads to AI Chat.
2. **Supply and review.** Add existing notes, documents and decisions or complete guided sections. Review where the service placed the information, correct it and approve the project foundation.
3. **Prepare the first page.** Assemble a landing page from SinglePageStartup blocks, save its data with the project and inspect the immediate frontend preview. This sandbox is not published or deployed.
4. **Develop and challenge ideas.** Return for later questions, criticism, comparisons, materials or product additions without repeating accepted context; buy tokens when continued use is valuable. Clear balance and purchase terms support confidence.
5. **Publish or build when needed.** When the landing page is ready, choose **Publish on my server**, authenticate with GitHub, create the project repository, connect the server and run the configured deployment. A chatbot or another digital product follows the same Code Framework foundation. This branch does not require a token purchase.
6. **Adapt and retain.** Ask Claude Code or Codex Desktop to deploy and make changes through conversation. The agent edits the code; the person reviews the interface and checks the result. Continue the product and choose SPS again for the next one.
7. **Recommend and improve.** Recommend a separately deployed example or another result; makers can contribute improvements to the foundation and documentation.

## Measurement and priorities

| Strategic outcome      | Observable signals                                                                                                    | Management consequence                                                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Recognition            | Relevant visits, movement from demonstrations into project creation and GitHub stars                                  | Attention receives more resources only when it produces qualified use; weak activation redirects effort to examples and entry points.   |
| Project activation     | Material supplied, information attributed to sections, corrections before acceptance and approved project foundations | Acquisition never outgrows the core experience; abandonment redirects resources to intake, structuring, explanation or review problems. |
| Continued hosted value | User-rated useful discussions, criticism acted on, later materials, return use and repeated-input problems            | Weak usefulness or return use redirects resources to reasoning quality and reuse of accepted project context.                           |
| Revenue                | Completed token purchases, repeat paid use and service costs                                                          | Paid growth remains bounded by repeat value and viable service economics; spend does not expand while either is unsupported.            |
| Framework adoption     | GitHub connections, project repositories, working server deployments, useful adaptations and next-product reuse       | Documentation and shared capabilities concentrate on actual connection, deployment, adaptation and reuse points where users stall.      |
| Community growth       | Recommendations, useful contributions and later agent-led adoption                                                    | Recurring needs and accepted improvements become clearer documentation and stronger public examples.                                    |

Resource allocation follows a durable hierarchy: completed project foundations, useful results and repeat use outrank reach; reusable demonstrations and documentation outrank one-off distribution; additional acquisition is justified only by activation, repeat paid use or framework adoption. Organic distribution fits owner funding and lets one verified example serve several channels. Separate-site operation and support remain within the owner's confirmed capacity and funding, which are not invented by this Strategy.

Token offers, project-page acceptance, landing-page sandbox requirements and server-adoption requirements remain owned by the relevant Product, model and Sales sources. Strategy uses their approved definitions without duplicating or silently changing them.
