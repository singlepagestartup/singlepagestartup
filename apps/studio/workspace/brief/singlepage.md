---
confirmation:
  confirmed: true
  by: operator
  at: "2026-10-06"
  source: "Operator confirmed the current Brief in this chat, retaining the previously approved business text and accepting the listed visual-requirement changes: «давай его подтверждено, фиксируем». The changes cover Living Focus, Onest, the cool palette, Interface kit, icons and square image preparation."
  content_sha256: 1636c06e5e68d369527a3efb1939e956cd3c559b1a9672b19f7df047fbb6a960
intake:
  scope:
    confirmed: true
    at: 2026-09-13
    source: Operator audience, value and acquisition-flow correction in chat, 2026-09-13; retains the two product IDs explicitly confirmed on 2026-09-11.
    project: SinglePageStartup
    products:
      - singlepagestartup
      - ai-chat
  audience_value_and_flow:
    confirmed: true
    by: operator
    at: 2026-09-13
    source: Operator explicit correction in chat, 2026-09-13, describing business-data AI Chat, token purchases, novice makers working through Claude Code or Codex Desktop, and the button «Развернуть проект на своей машине» leading to GitHub.
    scope: Confirms the intended audiences, the token-purchase monetization direction and that answers are grounded in the material the person supplies. The framing of the chat's value and the path from the hosted service to the framework were superseded on 2026-09-18; product_direction owns them. The retrieval capability was not superseded; see sources.retrieval. It does not confirm the whole Brief wording, measured answer superiority or public service readiness.
  product_direction:
    confirmed: true
    by: operator
    at: 2026-10-06
    source: "Operator launch-stage correction in this chat: «первичный этап у нас — это создание тех артефактов, которые, по сути, те же самые, что и в WorkSpace ... только сокращенной версии»; «нам важно, чтобы люди зашли и описали свои проекты»; paid server deployments follow evaluation and improvement of that experience."
    scope: Confirms a first-stage offer of written project documents in a shortened Workspace structure, with a project brief, Strategy, Brand, a written Design description and separate Products with their own sections, including short written Promotion descriptions. The AI agent identifies shortcomings for the user to correct, and the accepted material remains context for later work. Landing-page assembly, editing and server publication belong to subsequent development, with deployment sales following evaluation and improvement of project description. The future technical publication flow uses GitHub authorization, a repository in the user's account, a connected server and automatic deployment. This confirms the staged direction only, not the whole Brief wording, implementation status, measured outcomes or future deployment prices.
  framework_preparation_journey:
    confirmed: true
    by: operator
    at: 2026-10-24
    source: Operator goal supplied in /Users/rogwild/.codex/attachments/e0e35281-16a6-4247-a2e2-ad1e63ff1e3b/goal-objective.md.
    scope: Confirms the intended route from AI Chat preparation of a business model, concept, business plan and structured project documents to coding-agent development with Code Framework. The Framework landing explains this route and links to AI Chat, Blog, module explanations and token purchases. Product Storybook prototypes precede Studio Modules/Host composition and runtime implementation. This scoped requirement retains both product IDs, the selected visual identity, free framework access and the later-stage limits on hosted landing-page assembly and deployment; it does not confirm the whole Brief or implementation readiness.
  visual_direction:
    confirmed: true
    by: operator
    at: 2026-10-03
    source: "Operator selected the second generated concept, Living Focus, in chat on 2026-10-03, asked to apply it across the design system, and preferred its proportional sans typography over JetBrains."
    scope: Confirms Living Focus as the selected shared visual direction, with Onest proportional sans for headings, body, interface text and labels, and no JetBrains. Supersedes the monospaced-body, two-family and decorative-heading requirements. The five supplied reference sets, pixel-grid S, accent, open-license and Latin/Cyrillic requirements remain inputs. This is scoped direction approval, not whole-Brief or complete Design-document confirmation.
    selected_preview: /Users/rogwild/.codex/generated_images/01a10349-97f3-7f92-9a08-dd2a647e8f7a/exec-4ca5f894-a482-49ce-9383-e41d9124277f.png
  visual_component_corrections:
    confirmed: true
    by: operator
    at: 2026-10-04
    source: "Operator response after the seven browser-comment corrections were implemented: «Да, отлично, то, что надо», followed by the request for a complete framework Interface kit."
    scope: Confirms the Material type chips and Starting point choices with neutral tracks, white selected options and small lime checks; the neutral graphite-gray Needs review badge; the Create project tile filling its grid cell in width and row height; and cool-white bitmap backgrounds in Illustration and text, the Coffee and Creative project previews, and the entire Illustration gallery. Includes the rule excluding warm yellow and cream backgrounds. This confirms these seven visual corrections only, not the whole Brief, complete Design or pending business decisions.
sources:
  current_business:
    type: client-claim
    source: Operator Brief review and annotations, 2026-09-12.
    scope: Product purpose, tested installation and integrations, team development, worldwide distribution, best-effort support, and popularity/use/agent-adoption goals.
  product_scope:
    type: client-claim
    source: Operator product inventory correction, 2026-09-11; brand/product distinction, 2026-08-14.
    scope: SinglePageStartup owns Code Framework (singlepagestartup) and AI Chat (ai-chat).
  audience_value_and_flow:
    type: client-claim
    source: Operator audience, value and acquisition-flow correction in chat, 2026-09-13.
    scope: Primary hosted AI Chat for people supplying their own project material. Users may buy tokens and continue as consumers. Novice makers work through coding agents and review the resulting UI. The framing of the chat's value and the route to the framework were superseded on 2026-09-18 by product_direction; the retrieval capability was not. These are intended product behaviors, not verified implementation or adoption.
  answer_quality:
    type: client-claim
    source: Operator desired AI Chat outcome in the audience and value correction, 2026-09-13.
    scope: Useful advice grounded in the user's business data and better answer quality than ordinary ChatGPT without that context are desired, testable outcomes; no independent comparative measurement is supplied.
  ai_chat_commercial_terms:
    type: client-claim
    resolution: operator-fact
    source: Operator selected token-purchase monetization in chat, 2026-09-13, then stated the token unit, billing moment, margin and expiry, 2026-09-18.
    scope: |
      The billable unit is the provider tokens one request consumes, and generation
      consumes the larger share. The customer does not pick the model: the service runs
      one selected model while the offer is being tested, and the model router chooses
      per request once more than one is offered. The
      service charges a small amount when it sends the input to the model, then debits
      the final amount once the answer returns and its actual cost is known. Token
      top-ups are resold at a thirty per cent margin over the provider cost, which is
      the service's revenue. Purchased tokens do not expire. The committed billing code
      sets one internal token at USD 0.001 of provider cost and charges one token up
      front, then settles the difference once the exact cost is known; that file
      verifies the constants, not the running service, and carries no thirty per cent
      markup, which is applied at top-up and deliberately not applied again on
      consumption. Settlement rounds each turn up to the next whole token, which costs a
      customer more than the turn did, most visibly on cheap models and short requests.
      That surplus is accepted as ordinary market pricing and as rough
      compensation for service costs that are not billed at all, chiefly writing and
      storing the uploaded corpus. That offset is a judgement, not a measured one, and
      the two amounts are not reconciled anywhere. Top-ups are sold in five packages of
      100, 300, 500, 1,000 and 3,000 roubles; the token price is the
      same in every package, so a larger package buys proportionally
      more and carries no extra discount. Customers are billed in Russian roubles,
      converted at a fixed internal accounting rate of 100 roubles per US dollar, so one
      internal token costs the customer 0.13 roubles and the one-token pre-charge makes
      0.13 roubles the smallest amount a successful request can cost. That rate is a working figure rather than a
      market quote, and because it is fixed while the market rate moves, the thirty per cent is a margin over
      provider cost only while the real rate stays at or below 100. Purchases are
      normally final: tokens are bought to be used, and the operator may still refund a
      customer who insists, as a case-by-case decision rather than a published
      entitlement. Whether Russian consumer-protection rules oblige more than that is not
      assessed here. These are intended
      commercial terms, not an implemented billing system or a measured margin.
  ai_chat_balance_and_output_use:
    type: client-claim
    resolution: operator-fact
    source: Operator clarification in chat, 2026-10-06; failed or cancelled request policy confirmed with «возвращаем всё».
    scope: |
      The balance may become negative down to USD 2 of provider cost, equivalent to
      2,000 internal tokens. At or below that threshold, new paid AI requests are
      restricted. The final cost of an already-sent request is known after completion,
      so an in-flight request may take the balance beyond that threshold. Users may
      freely export their results and use them outside the service. All token deductions
      for a failed or cancelled AI request are returned to the balance, including the
      initial token and any settlement. The net charge is zero; any provider expense
      for that request is borne by the service. This token return is separate from
      the case-by-case policy for cash refunds of top-up purchases.
    implementation_discrepancy:
      type: missing-evidence
      resolution: evidence-gap
      status: unresolved
      source: Committed billing route at aa780be0f99f78f5d25802d259059cb1b66f4cb0, including ef09fd069a09cf3f3ea3201d25983d7c39c243a4; libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/billing/route.ts.
      scope: The source requires the aggregate balance to cover the precharge and rejects a balance of zero or below, while the operator's commercial terms restrict new paid requests at −2000 internal tokens. Source inspection establishes a mismatch, not a replacement policy or deployed behavior. Billing-policy alignment remains unresolved; the visual work preserves the operator's deduction terms.
  ai_chat_allowance_and_pro:
    type: client-claim
    resolution: operator-fact
    source: Operator requested an initial Free allowance of 3000 tokens and Pro with 5000 tokens, then confirmed 29 USD or 1900 roubles and a monthly period in this task's chat replies; the operator explicitly retained the existing deduction rules.
    scope: Registration grants 3000 internal tokens once. Free is the default registration allowance, not a public product to purchase. Pro grants 5000 internal tokens per month at 29 USD or 1900 roubles per month. The 0.13-rouble token price, five top-up amounts, cost-based deduction, failure returns and other existing token terms remain unchanged. These are commercial requirements, not proof of live grant, renewal or payment behavior.
  owner_time_allocation:
    type: client-claim
    resolution: operator-fact
    source: Operator clarification in chat, 2026-10-06 — development and support split equally; 80% of remaining activities allocated to AI Chat because it is closer to people.
    scope: |
      Development and support time is split equally between AI Chat and Code Framework.
      Remaining owner activities are allocated 80% to AI Chat and 20% to Code Framework.
      No recurring hours, cash budget or new allocation of cash expenses is supplied.
  ai_providers:
    type: client-claim
    resolution: operator-fact
    source: Operator named OpenRouter in chat, 2026-09-18; source configuration inspected at aa780be0f99f78f5d25802d259059cb1b66f4cb0, including bb450b2aef601486a1d2a3e72ef99725ed80ab39.
    scope: |
      OpenRouter is the selected AI provider. The committed router configuration in
      `libs/shared/utils/src/lib/constants/open-router-models.ts`, version
      `2026-10-13-gpt-6.1-sol-high`, declares `openai/gpt-6.1-sol` for CHAT, CODER and
      VISION, with high reasoning, text/image/file inputs and text output. IMAGE is
      empty. This verifies the source configuration at the named snapshot, not model
      availability, image generation or customer access in a deployed service.
      Consumption is normalised in money rather than in provider tokens: OpenRouter
      reports what each call actually cost, the costs of the calls used by a turn are
      summed, and the total is converted into internal tokens at USD 0.001 each. No
      price table is maintained in the product.
      Embeddings are produced by a Qwen model on OpenRouter:
      the committed default is `qwen/qwen3-embedding-8b` at 768 dimensions, overridable
      through `KNOWLEDGE_OPEN_ROUTER_EMBEDDING_MODEL`, with a local `apps/llm` provider as
      the alternative. The vectors themselves are kept in the project's own PostgreSQL
      using pgvector, with an HNSW cosine index on the chunk table, so the corpus is not
      handed to a third-party vector service; document text still reaches OpenRouter to be
      embedded and again as retrieved context. This is the customer's own risk to take, on the
      same footing as pasting material into any general assistant. The service processes
      material for the customer's requested work and does not independently analyse or
      reuse it; this does not establish the AI provider's own terms. AI Chat runs on Contabo in Amsterdam, in the
      Netherlands, because the Russian hosts it offers customers restrict access to
      OpenRouter; those hosts are enough for customers, whose published projects need no
      model access. Deleting an account removes the material from the product immediately, while the host's backups
      keep copies for up to six months, which the operator cannot shorten. The Website
      defines customer-facing processing, storage and deletion information before upload
      and beside account deletion; this is a material specification, not proof of a live service.
  ai_chat_launch_stage:
    type: constraint
    resolution: operator-fact
    source: "Operator correction in this chat, 2026-10-06: «нужно сделать создание именно текста, описания каждого из разделов»; «бренд-стратегия, бренд, дизайн и отдельно продукты со своей структурой, каждый продукт со своими разделами ... только сокращенной версии». Annotated copy uses «первый шаг к клиентам» and «Устраните недочеты, которые укажет ИИ агент»."
    scope: |
      The first AI Chat stage helps people describe their projects through written
      documents in a shortened Workspace structure. Project-wide Brief, Strategy,
      Brand and a written Design description sit beside separate Products, each with
      customer and offer, economics and operations, Sales, Analytics, research where
      needed and a short written Promotion description. Promotion covers the wording
      for public presentation, including Website, Creative and Presentation where
      applicable; these are text descriptions, not produced visual assets or websites. The first conversion is entering and describing a project; completion
      is a reviewed, editable set of project and product descriptions. The AI agent
      identifies shortcomings for the user to correct. The project owner evaluates
      how well this workflow works and improves it before selling landing-page
      deployments on servers. Block assembly, the landing-page editor and publication
      are subsequent development. The future landing page is intended to collect
      initial enquiries and test a hypothesis; neither result is guaranteed. This is
      scoped operator direction, not whole-document approval or implementation evidence.
  ai_chat_landing_presentation:
    type: constraint
    resolution: operator-fact
    source: "Operator correction of the AI Chat public landing page and subsequent browser comments in this chat, 2026-10-06: the customer uploads notes, photographs and files in chat; the agent checks them and helps edit the generated documents. «Каждый вот этот вот файл — это своего рода рабочее пространство»: each file has its own discussion and editing thread. Later topics in the general project workspace use attached, saved files as context. The walkthrough prefills an audience answer, opens and enriches Products.md after Send answer, and enables the user's Save and review action. The page must explain the work in fifteen seconds; detailed project structure and business exposition belong in Presentation. The solo-founder imagery requirement remains; a dark photo hero is acceptable."
    scope: |
      The first-stage AI Chat landing page addresses a person starting an
      entrepreneurial project alone. Within fifteen seconds, the page must explain
      the intended customer flow: upload materials in chat, let the AI agent identify
      gaps, work together in each document's own thread, then create new discussion
      topics in the general project workspace with selected saved files attached as
      context. Request.md, Strategy.md, Brand.md, Design.md and Products.md each keep
      their own discussion and editing history. Show uploaded files, document editing
      and visible indicators of how much information each section contains and what
      is still needed. In the interactive walkthrough, prefill the audience answer
      with editable text. Send answer opens Products.md with the additional information
      already filled in and enables Save and review for the user to click. These are
      intended product and presentation requirements, not a measured comprehension
      result, new commercial terms or evidence of implemented capability.
      Use concise customer copy, varied section compositions and emotionally relevant
      imagery. A dark hero with a solo-founder photograph is acceptable; the hero
      excludes teamwork scenes and a man-and-woman meeting. Public demonstration copy
      uses concrete file names and actions without generic Example badges. Detailed
      project and per-product structure, business rationale and future-development
      exposition belong in Presentation. These requirements apply to the AI Chat
      public landing page, not to all product imagery or the shared photography
      direction, and do not approve a replacement image, layout or whole document.
  future_deployment_commercial_terms:
    type: unknown
    resolution: operator-fact
    source: Operator placed deployment sales after evaluation and improvement of project description in this chat, 2026-10-06; no future deployment price or availability was supplied.
    scope: Future deployment prices and availability remain undecided. They affect the later deployment offer and do not block the first-stage written-document offer. Publication without a token purchase does not establish that the future deployment service is free.
  deployment_terms:
    type: client-claim
    resolution: operator-fact
    source: Operator stated the technical publication terms in chat, 2026-09-18; launch-stage correction in this chat, 2026-10-06, places this flow in subsequent development.
    scope: |
      The following requirements apply only to future publication.
      GitHub authorization is requested for the single repository the service creates,
      not for the customer's wider account. Beget and Timeweb are the supported hosting
      providers. A domain the customer has already purchased is attached through the
      chosen provider's own API; the service does not sell or register domains. Both the
      first deployment and any redeployment run through GitHub Actions, so a failed
      deployment is recovered by running the workflow again. How the deployment
      credentials are stored and protected is settled: the service keeps the hosting
      deployment key it needs to reach the customer's server, and the customer's GitHub
      repository already holds its own copy for the Actions workflow. Where the service
      stores its copy and under what protection is an engineering decision, not a
      business one. These are intended
      technical requirements, not an implemented or tested publication flow or an
      available first-stage offer.
  retrieval:
    type: client-claim
    resolution: operator-fact
    source: Operator statement in chat, 2026-09-18, after the coordinator reported that the
      Brief rewrite had dropped the per-chat knowledge base.
    scope: |
      Documents the person uploads are split into chunks, vectorized and stored so the
      service retrieves the relevant parts as context, a retrieval-augmented generation
      design. There is no ceiling on the number of files: every uploaded document is
      vectorized and can take part in answering, and the service selects the most relevant
      parts for each question. There is no file limit at all, and that capacity counts
      among the product's selling points, against general assistants that hold a
      project's files in the low tens; product Research records the documented limit and
      the confidence in it. Storage and vectorization for an unbounded corpus are a
      variable service cost that the selected token terms do not price; the shared model
      carries that consequence. Two things are not
      settled and are not asserted here. How the capability is described to a customer is
      undecided, since Brand keeps the mechanism out of the ordinary product flow. Whether a
      larger corpus produces better answers for this customer is unresolved; the capacity
      difference is documented, the benefit is not.
  service_terms:
    type: client-claim
    resolution: operator-fact
    source: Operator confirmed each term in chat, 2026-09-18, after the coordinator listed the terms that Brand, Product and Sales stated without a Brief source.
    scope: AI Chat support requests processed within 24 hours as the initial service level, with help on the free framework code unchanged and best-effort; payments accepted in Russia through an online cash register, whose accepting party, payment details and receipt flow the operator configures in the product interface rather than recording them here; a free token allowance granted at registration; a first setup session of about one focused hour; email-and-password authentication with no social sign-in; Beget or Timeweb as example hosting providers for the deployment key; provider backups retained up to six months. These are operator decisions, not verified implementation or measured service levels.
  funding:
    type: client-claim
    source: Operator business intake, 2026-08-14.
    scope: The project owner's time and money fund framework development; AI Chat service revenue is separate from it.
  framework_exchange:
    type: client-claim
    resolution: operator-fact
    source: Operator stated the barter in chat, 2026-09-19, when rejecting a shared model between the two products.
    scope: |
      Code Framework is a product with its own price, and that price is not money.
      The customer pays in social capital: a star, a fork, a recommendation, an
      improvement contributed back, and the chance that they arrive at AI Chat as a
      customer who already trusts the foundation. No invoice is issued and no licence
      fee exists, which makes the exchange easy to mistake for an absence of
      economics. Both products stand on their own in the catalog; the infrastructure,
      codebase and owner time they share are the shape of one business, not a third
      thing to describe. What a star or a fork is worth against a paid AI Chat
      customer is unmeasured.
  repository:
    type: verified-fact
    source: Repository Git history and libs/modules inspection, 2026-09-12.
    scope: The recorded history baseline has an earliest reachable commit dated 2023-02-14 and 3936 reachable commits. These are dated repository history observations, not counts of distinct developers or measured customer outcomes.
  repository_schema_inventory:
    type: verified-fact
    source: Repository tree at aa780be0f99f78f5d25802d259059cb1b66f4cb0, inspected 2026-10-24.
    scope: The source inventory contains 15 modules, 61 models and 94 relations, counting model and relation backend/repository/database/src/lib/schema.ts files. This is a census of the named source snapshot, not a fixed product limit or proof that each function is deployed and integrated.
  framework_presentation_scope:
    type: constraint
    resolution: operator-fact
    source: Operator goal supplied in /Users/rogwild/.codex/attachments/e0e35281-16a6-4247-a2e2-ad1e63ff1e3b/goal-objective.md; scoped intake.framework_preparation_journey.
    scope: The Code Framework website needs a complete landing page, Blog and article pages, explanations of the modules and their responsibilities, and ecommerce/token pages connecting Framework and AI Chat. Product previews are independent of Studio Modules and production components; Tailwind is preferred. The transfer order is Product Storybook, Studio Modules/Host and runtime code with existing functionality preserved. Copy uses the existing Studio material, and imagery follows the selected style. This defines the development scope without approving the resulting pages or changing the products' availability.
  repository_metrics:
    type: verified-fact
    source: GitHub repository API, singlepagestartup/singlepagestartup, inspected 2026-09-12.
    scope: Four stars and two forks are repository attention/activity counts, not a count of adopted projects.
  license:
    type: client-claim
    source: Operator Brief review, 2026-09-12.
    scope: MIT is the selected distribution license.
    publication_verification: Confirmed on 2026-09-18. The operator directed the change and the repository LICENSE now carries the MIT text; the README states the same terms. Before that date both files carried proprietary terms while this record already said MIT.
  identity:
    type: client-claim
    source: Operator identity intake, 2026-08-11; registered source SVG inspection.
    scope: Use and modification rights supplied; pixel S is mandatory and wordmark type is replaceable. Two 200x200 marks, two 590x200 lockups, and the supplied accent sample are available.
    asset_ids:
      - singlepage-operator-logo-square-black
      - singlepage-operator-logo-square-white
      - singlepage-operator-logo-lockup-black
      - singlepage-operator-logo-lockup-white
      - singlepage-operator-accent-sample-bfef61
  visual_preferences:
    type: client-claim
    source: Categorized operator-supplied references and existing identity requirements; operator requested fresh source analysis in chat, 2026-09-13.
    scope: All five source sets and their files remain accepted inputs, alongside the identity and accent requirements. Their category descriptions record the supplied taste references; the selected Living Focus direction determines the applied typography.
  visual_direction_correction:
    type: constraint
    source: Operator correction of Workspace Design and subsequent selection of the second generated concept, Living Focus, in chat, 2026-10-03.
    scope: Living Focus is the selected direction across the shared design system. It must draw on all five supplied reference sets and avoid the Anthropic association and writing-on-paper appearance the operator dislikes. The resemblance is the operator's perception, not an independent comparison. Onest proportional sans applies to headings, body, interface text and labels; JetBrains is excluded.
  background_palette:
    type: constraint
    source: Operator browser comments and explicit background correction in chat, 2026-10-04; warm yellow and cream backgrounds evoke Claude or Anthropic for the operator.
    scope: "The project palette uses graphite, cool gray, white and lime #BFEF61. Warm yellow, cream and warm off-white backgrounds are excluded throughout the design, including illustrations. This supersedes the earlier warm off-white illustration-background preference. Living Focus and Onest remain selected."
  component_consistency:
    type: constraint
    source: Operator browser comments and subsequent acceptance of the seven visual corrections, 2026-10-04; the scoped confirmation is intake.visual_component_corrections.
    scope: Material type chips and Starting point choices use neutral tracks, white selected options and small lime checks. The Needs review badge uses graphite and cool gray. The Create project tile fills its grid cell in width and row height.
  interface_kit:
    type: constraint
    source: Operator request for a complete framework Interface kit in chat, 2026-10-04, following acceptance of the seven visual corrections.
    scope: The framework Interface kit must cover all common UI components in clear categories, with working component variants and states. Downstream projects must be able to restyle the kit through shared design tokens. Content blocks are compositions of the kit's components. This defines the required scope and does not approve an expanded kit before review.
  icon_direction:
    type: constraint
    source: Operator correction and subsequent requirement for a dedicated icon section in chat, 2026-10-04; the current icons appear untidy and dated to the operator.
    scope: Icons need a neat, contemporary appearance and a dedicated section in the design system specifying the library or custom drawing method. A different library or custom icons is acceptable; no replacement library has operator approval. Living Focus, Onest and the selected colors remain in force.
  photography_reanalysis:
    type: verified-fact
    source: Coordinator visual inspection of all seven original photography files, 2026-09-13.
    scope: Seven files represent six distinct compositions because foliage-closeup-narrow.png and foliage-closeup-wide.png crop the same portrait. Human presence, gesture and motion recur; natural light, film-like softness, warm and cool palettes, close details and wider figures vary across examples. Blur, foreground occlusion, backlight and light trails occur as distinct techniques. None of the seven files shows a phone or computer.
    interpretation_status: confirmed
  other_visual_reference_reanalysis:
    type: verified-fact
    source: Brand Designer visual inspection of the 35 original non-photography source files, 2026-09-13.
    scope: Five identity files, 12 interface references, two typography examples, five illustrations and 11 marketing examples were reviewed directly. The category descriptions summarize recurring visible traits and optional variations. The typography screenshots show expressive serif/italic contrast.
    interpretation_status: confirmed
  identity_inventory:
    type: verified-fact
    source: Current supplied identity files and Workspace intake inspection, 2026-09-12.
    scope: Four logo SVGs and an accent sample are registered; no slogan is supplied in the current materials. This does not assert that no slogan exists elsewhere.
  visual_method:
    type: constraint
    source: Operator clarification of reference-based style discovery, 2026-09-12; fresh visual-reference and composition correction in chat, 2026-09-13; image generation and subsequent enlargement-to-square clarification in chat, 2026-10-04.
    scope: Compare original examples and propose plain-language descriptions separately for photography, typography, UI, illustration/infographics and marketing/handout materials. Devices are optional in people-and-business scenes. Master prompts and tooltips do not prescribe fixed subject-position percentages, aspect ratios, or anatomy/device checklists. Generate images in free or varied proportions suited to their composition and quality, without requiring a square at generation time. Use a separate tool to enlarge them to square versions for consistent presentation, and preserve the originals. New photography input needs more than three distinct photographs, usually five.
    production_interpretation: The coordinator interprets enlargement as extending the shorter canvas side through outpainting while preserving the full original composition, without cropping or stretching, as communicated in chat on 2026-10-04. This policy governs subsequent production and does not assert that earlier derivative edits used strict outpainting.
  experiment_context:
    type: constraint
    source: Operator experiment limits, 2026-08-10.
    scope: Prior specific experiment only; not a continuing business capacity or support commitment.
    values: Three weeks; six founder hours per week and 18 hours total; USD 0 paid media; AI Chat promotion at most USD 1 actual provider cost per user per day and USD 200 aggregate.
visual_references:
  interface-and-website-appearance:
    source_directory: assets/singlepage/intake/interface
    status: ready
    interpretation_status: confirmed
    asset_ids:
      - singlepage-interface-reference-risk-balance-landing
      - singlepage-interface-reference-conduit-pricing-landing
      - singlepage-interface-reference-dashboard-theme-settings
      - singlepage-interface-reference-dashboard-book-grid
      - singlepage-interface-reference-agency-portfolio-landing
      - singlepage-interface-reference-pricing-plan-cards
      - singlepage-interface-reference-onboarding-role-form
      - singlepage-interface-reference-mobile-invoice-bottom-sheet
      - singlepage-interface-reference-subscription-access-card
      - singlepage-interface-reference-license-download-card
      - singlepage-interface-reference-license-add-to-cart-card
      - singlepage-interface-reference-product-license-selection-card
  typography:
    source_directory: assets/singlepage/intake/typography
    status: ready
    interpretation_status: confirmed
    asset_ids:
      - singlepage-typography-reference-editorial-serif-italic-highlight
      - singlepage-typography-reference-editorial-serif-italic-contrast
  photography:
    source_directory: assets/singlepage/intake/photography
    status: ready
    interpretation_status: confirmed
    file_count: 7
    distinct_compositions: 6
    asset_ids:
      - singlepage-photography-reference-motion-runner
      - singlepage-photography-reference-foliage-closeup-narrow
      - singlepage-photography-reference-foliage-closeup-wide
      - singlepage-photography-reference-motion-portrait
      - singlepage-photography-reference-hand-light-streaks
      - singlepage-photography-reference-figure-light-streaks
      - singlepage-photography-reference-low-angle-sunburst
  illustration:
    source_directory: assets/singlepage/intake/illustration
    status: ready
    interpretation_status: confirmed
    asset_ids:
      - singlepage-illustration-reference-isometric-building
      - singlepage-illustration-reference-isometric-platform
      - singlepage-illustration-reference-isometric-workflow
      - singlepage-illustration-reference-isometric-ai-chip
      - singlepage-illustration-reference-isometric-devices
  marketing-creative:
    source_directory: assets/singlepage/intake/marketing-creative
    status: ready
    interpretation_status: confirmed
    asset_ids:
      - singlepage-marketing-reference-body-signal
      - singlepage-marketing-reference-longevity-journey
      - singlepage-marketing-reference-low-energy
      - singlepage-marketing-reference-signal-motion
      - singlepage-marketing-reference-soft-guidance
      - singlepage-marketing-reference-connected-data
      - singlepage-marketing-reference-expression-story
      - singlepage-marketing-reference-archive-type
      - singlepage-marketing-reference-introspection
      - singlepage-marketing-reference-health-tags
      - singlepage-marketing-reference-low-angle-prompt
---

# Brief

## Project and products

SinglePageStartup is a project and brand with two related products:

| Product                              | Role and availability                                                                                                                                                                                                                                                                                                       |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AI Chat (`ai-chat`)                  | The intended primary hosted experience: AI work on written project and product descriptions, using a shortened Workspace structure, with a registration allowance, Pro and token top-ups. Prepared material can guide Code Framework development; hosted landing-page assembly and server deployment are later development. |
| Code Framework (`singlepagestartup`) | An existing reusable software foundation distributed through GitHub. Makers and coding agents use it to build products from a clear description of the business, which they can prepare in AI Chat.                                                                                                                         |

The project owner makes product decisions. Selling custom websites is outside the current offer.

## Customers and value

The first-stage AI Chat audience is a person starting an entrepreneurial project alone, with an idea or early-stage project described in scattered notes, documents and half-made decisions. They upload notes, photographs and files in chat, or answer the agent's questions there. The AI agent reviews the material, identifies missing or contradictory information and drafts project and per-product files. Each generated file is a working thread: the person and agent discuss and edit Request.md, Strategy.md, Brand.md, Design.md and Products.md separately, preserving each file's conversation and edits. Each section shows how much information it contains and what still needs work; questions that have no answer yet stay open. After reviewing the files, the person can create new discussion topics in the general project workspace and attach selected saved documents as a knowledge base for that topic. A first session is intended to take about an hour of concentration.

The first-stage result follows a shortened Workspace structure: a project brief, Strategy, Brand, a written Design description and separate Products. Each product has its own customer and offer, economics and operations, Sales, Analytics, research where needed and a short written Promotion description. Promotion describes how the product is presented publicly, including Website, Creative and Presentation wording where applicable. Users can review and edit these documents, freely export their results and use them outside the service.

For people preparing to build, AI Chat is the first step: structure the business model, concept, business plan and project documents, review the material, then use it to give a coding agent a concrete development task. Code Framework supplies the code for the landing page and product. Its landing page must explain this route and offer AI Chat preparation alongside access to the free framework. Buying tokens pays for hosted AI work; it is not a condition of using Code Framework.

The project owner evaluates how well this workflow helps people describe their projects and improves it before selling landing-page deployments. Subsequent development uses the accepted documents to assemble a landing page from SinglePageStartup blocks, edit it in a private sandbox and publish it on a connected server. Its purpose is to collect initial enquiries and test a hypothesis. Landing-page assembly, the editor and publication are outside the first-stage offer; first enquiries and a successful hypothesis test are not promised.

Every uploaded file is split into chunks and vectorized, and each question retrieves the parts that bear on it. The number of files is not capped, which is the difference the operator sells against: a general assistant holds a project's files in the low tens. How to say that to a customer is undecided, because Brand keeps vectors and retrieval out of the ordinary product flow, so the benefit has to be described without naming the mechanism.

The first-stage value is a set of project and product descriptions the person can use and improve, with answers grounded in their own material. This is the first step toward customers. Whether it answers better than a general chat without that context is a goal to test, not a claim.

The second audience is novice AI-assisted makers, or vibe coders. They work mainly by talking to a coding agent in Claude Code or Codex Desktop. The agent changes the code; the person judges the result and the interface, for example in VS Code.

Code Framework supplies common functions, among them registration, product carts and payments, already configured and tested against each other. Reusing them is intended to spend less build and test time and fewer AI tokens on the foundation, which leaves more of both for the product's own rules.

## Current state

A team has developed the codebase over several years and tested installation and the module integrations. The inspected repository snapshot holds source code and documentation for 15 modules, 61 models and 94 relations, among them identity and access, ecommerce and payments. These counts describe the source inventory; they do not verify deployed behavior.

The current development scope connects Code Framework and AI Chat through a revised Framework landing page, Blog and article pages, module explanations and ecommerce/token pages. Navigation must make these destinations visible. The work starts with independent Product prototypes in Storybook using existing Studio information and the selected visual style. Product components do not import Studio Modules or production components. After review, the pages move through Studio Modules/Host composition into runtime code, preserving the current functionality.

## Business and resources

| Item                 | Current model                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AI Chat revenue      | Users continue as hosted-service consumers and buy tokens. The billable unit is the provider tokens a request consumes, with generation the larger share. The customer does not pick the model; the router selects one per request, and what the balance is charged follows the money that request cost, not the provider tokens it used. One token is charged when the input is sent; the balance is debited once the answer returns and its cost is known. One internal token is USD 0.001 of provider cost, resold at a 30% margin and converted at a fixed 100 roubles per dollar, so a token costs 0.13 roubles and no successful request costs less than that. Purchased tokens do not expire, purchases are normally final, and a refund is a case-by-case decision rather than a published entitlement. Top-ups are available at 100, 300, 500, 1,000 and 3,000 roubles with the same token price in every package. At a balance of −2,000 internal tokens or lower, new paid AI requests are restricted; an already-sent request may settle beyond that threshold. All token deductions for failed or cancelled AI requests are returned to the balance, including the initial token and any settlement. The net charge is zero; any provider expense is borne by the service. This differs from the case-by-case cash refund policy for top-up purchases. |
| AI Chat access       | Email-and-password registration and login; Google and other social sign-in are not planned. Registration grants 3000 internal tokens once. Free is the default allowance, not a product to purchase. Pro supplies 5000 internal tokens per month for 29 USD or 1900 roubles per month; token deduction and top-up terms stay unchanged.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Payments             | Accepted in Russia through an online cash register. The operator configures the payment-accepting party's legal name, payment details and receipt flow in the product's own interface, so they are not recorded here.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Path to building     | Future landing-page publication authenticates the user with GitHub for the one repository it creates in their account, accepts a deployment key for Beget or Timeweb, and configures deployment through GitHub Actions, which also runs any redeployment. A domain the customer already owns is attached through the hosting provider's API. This technical flow belongs to subsequent development; future deployment prices and availability remain undecided. No token purchase is required by the publication flow, but that does not establish a free deployment service. A maker can use reviewed business and product documents from AI Chat to brief a coding agent and build with the existing free Code Framework. This development route does not require the future hosted publication service.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Framework price      | No money changes hands, and the product is still paid for. The customer pays in social capital: a star, a fork, a recommendation, a contribution back to the code, and the chance of arriving at AI Chat already trusting the foundation. There is no checkout and no licence fee.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Distribution         | Worldwide through GitHub. Operator-selected license: MIT; users can modify the code for their own projects.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Funding              | The project owner's time and money fund framework development, and AI Chat revenue is what makes that affordable.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Support              | AI Chat support requests are processed within 24 hours as the initial service level, without continuous live coverage or a resolution deadline. Help with the free framework code stays best-effort, as time permits.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Data retention       | Account deletion removes the active account and the project data the service controls. Infrastructure-provider backups may retain copies for up to six months under the provider's own process.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Core work            | Develop and maintain the shared foundation and its documentation, and make it easier for makers and agents to use.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Continuing resources | Allocated as the project develops. No ongoing budget or staffing figure is set.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Owner time           | Development and support are split equally between AI Chat and Code Framework. Remaining owner activities are allocated 80% to AI Chat and 20% to Code Framework; no recurring hours are committed.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

## Goals and success

- Help people enter and describe their projects through reviewed project and product documents, evaluate how well this works and improve the experience.
- Make AI Chat useful enough for people to keep using it and buy tokens.
- Connect reviewed business material from AI Chat to a concrete coding-agent task and development with Code Framework.
- Develop landing-page assembly and server deployment as a later offer, after evaluating and improving project description.
- Grow recognition and GitHub stars through a product experience that introduces people to the framework.
- Help interested makers deploy locally, build their own products and keep using the framework as their foundation.
- Attract community improvements that make the framework more useful and reliable.
- Develop it into a tool that AI agents can select and use in software development.

First-stage AI Chat success is read from people entering and describing projects, reviewing and correcting their documents, using those documents in later work and continuing paid chat use. Landing-page enquiries, hypothesis tests and deployment sales belong to later-stage evaluation. Framework success is read from makers who come back for a second product, outside contributions and agents that pick it up. The recorded repository baseline is 4 stars and 2 forks. No numerical growth target is set.

## Visual reference intake

Living Focus is the shared visual direction across the project, grounded in all five supplied reference sets. Avoid the Anthropic association and writing-on-paper appearance the operator dislikes. Use Onest proportional sans for headings, body, interface text and labels; exclude JetBrains. The open-license and Latin/Cyrillic requirements remain in force. The supplied identity and visual preferences follow, each with its files.

The AI Chat public landing page must explain the customer's next action within fifteen seconds: bring existing materials into chat, discuss and edit each generated file in its own thread, then create general project topics with selected saved documents attached as context. Show the files' separate conversations and editors, uploaded materials and indicators of information sufficiency. The interactive walkthrough prefills an editable audience answer; Send answer opens and enriches Products.md, then Save and review becomes active for the user to click. Use concrete file names and actions in the demonstration, concise copy and varied section compositions. The imagery addresses someone starting an entrepreneurial project alone; a dark hero with a solo-founder photograph is acceptable. The hero excludes teamwork scenes and a man-and-woman meeting. Presentation holds the detailed project and per-product structure, business rationale and future-development narrative. These are AI Chat presentation requirements; the shared photography direction and the other products retain their own subjects.

The project palette uses graphite, cool gray, white and lime #BFEF61. Warm yellow, cream and warm off-white backgrounds are excluded throughout the design, including illustrations.

Material type chips and Starting point choices use neutral tracks, white selected options and small lime checks. The Needs review badge uses graphite and cool gray. The Create project tile fills its grid cell in width and row height.

The framework Interface kit must cover all common UI components in clear categories, with working component variants and states. Downstream projects must be able to restyle the kit through shared design tokens. Content blocks are compositions of the kit's components.

Icons need a neat, contemporary appearance and a dedicated section in the design system specifying the library or custom drawing method. A different library or custom icons is acceptable; no replacement library has operator approval.

Generate images in free or varied proportions suited to their composition and quality, without requiring a square at generation time. Use a separate tool to enlarge the canvas to a square by outpainting its shorter side. Preserve the full original composition without cropping or stretching, and keep the original files.

| Element                          | Description and references                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Project name                     | SinglePageStartup. Preserve this exact spelling.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Logo                             | Pixel-grid S. The mark stays; the wordmark typeface may change. Four supplied SVG drafts are available for use and modification.<br /><br />**Files:** [operator-logo-square-black.svg](/workspace-assets/singlepage/intake/operator-logo-square-black.svg), [operator-logo-square-white.svg](/workspace-assets/singlepage/intake/operator-logo-square-white.svg), [operator-logo-lockup-black.svg](/workspace-assets/singlepage/intake/operator-logo-lockup-black.svg), [operator-logo-lockup-white.svg](/workspace-assets/singlepage/intake/operator-logo-lockup-white.svg)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Slogan                           | Not supplied.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Accent color                     | Supplied accent: #BFEF61.<br /><br />**Files:** [accent-sample-bfef61.png](/workspace-assets/singlepage/intake/identity/accent-sample-bfef61.png)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Interface and website appearance | Light neutral surfaces, generous spacing, clear hierarchy. Introductions carry large expressive headlines; work screens hold aligned grids, compact navigation, rounded cards, thin borders and restrained shadows. Dark primary actions and occasional green accents mark selection and progress.<br /><br />**Files:** [risk-balance-landing.png](/workspace-assets/singlepage/intake/interface/risk-balance-landing.png), [conduit-pricing-landing.jpg](/workspace-assets/singlepage/intake/interface/conduit-pricing-landing.jpg), [dashboard-theme-settings.png](/workspace-assets/singlepage/intake/interface/dashboard-theme-settings.png), [dashboard-book-grid.png](/workspace-assets/singlepage/intake/interface/dashboard-book-grid.png), [agency-portfolio-landing.png](/workspace-assets/singlepage/intake/interface/agency-portfolio-landing.png), [pricing-plan-cards.png](/workspace-assets/singlepage/intake/interface/pricing-plan-cards.png), [onboarding-role-form.png](/workspace-assets/singlepage/intake/interface/onboarding-role-form.png), [mobile-invoice-bottom-sheet.png](/workspace-assets/singlepage/intake/interface/mobile-invoice-bottom-sheet.png), [subscription-access-card.png](/workspace-assets/singlepage/intake/interface/subscription-access-card.png), [license-download-card.png](/workspace-assets/singlepage/intake/interface/license-download-card.png), [license-add-to-cart-card.png](/workspace-assets/singlepage/intake/interface/license-add-to-cart-card.png), [product-license-selection-card.png](/workspace-assets/singlepage/intake/interface/product-license-selection-card.png)                                                                  |
| Typography                       | Onest, an open-license Google Fonts family supporting Latin and Cyrillic, for headings, body, interface text and labels. JetBrains is excluded. The supplied examples show expressive serif/italic contrast and highlighted text; these source traits inform hierarchy and emphasis within the selected sans-serif direction.<br /><br />**Files:** [editorial-serif-italic-highlight.png](/workspace-assets/singlepage/intake/typography/editorial-serif-italic-highlight.png), [editorial-serif-italic-contrast.png](/workspace-assets/singlepage/intake/typography/editorial-serif-italic-contrast.png)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Photography                      | People and business connected through candid presence, gesture and movement. The supplied photographs use natural daylight or dusk, a tactile film-like softness and warm or cool palettes. Tight face or hand details, moving figures and wider scenes; blur, foreground occlusion, backlight and light trails are alternative techniques. Devices may be ordinary scene props.<br /><br />**Files:** [motion-runner-teal-orange.png](/workspace-assets/singlepage/intake/photography/motion-runner-teal-orange.png), [foliage-closeup-narrow.png](/workspace-assets/singlepage/intake/photography/foliage-closeup-narrow.png), [foliage-closeup-wide.png](/workspace-assets/singlepage/intake/photography/foliage-closeup-wide.png), [motion-portrait-neutral.png](/workspace-assets/singlepage/intake/photography/motion-portrait-neutral.png), [hand-light-streaks.png](/workspace-assets/singlepage/intake/photography/hand-light-streaks.png), [figure-light-streaks-dusk.png](/workspace-assets/singlepage/intake/photography/figure-light-streaks-dusk.png), [low-angle-sunburst-reference.png](/workspace-assets/singlepage/intake/photography/low-angle-sunburst-reference.png)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Illustration and infographics    | Airy isometric drawings with fine contours, pale secondary lines, dotted guides and restrained colored details. Recognizable objects explain connections with little fill or texture. Closer crops, more detail and short labels are optional variations. Use the project's colors.<br /><br />**Files:** [isometric-building-connection.png](/workspace-assets/singlepage/intake/illustration/isometric-building-connection.png), [isometric-circular-platform.png](/workspace-assets/singlepage/intake/illustration/isometric-circular-platform.png), [isometric-workflow-gears.png](/workspace-assets/singlepage/intake/illustration/isometric-workflow-gears.png), [isometric-ai-chip.png](/workspace-assets/singlepage/intake/illustration/isometric-ai-chip.png), [isometric-connected-devices.png](/workspace-assets/singlepage/intake/illustration/isometric-connected-devices.png)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Marketing and handout materials  | Expressive human photography, gestures, movement, close crops and varied viewpoints, with soft blur or sharp backlit detail. Short prominent text, thin diagrams, light labels and translucent overlays sit over the image; spare typographic compositions are also part of the set. The supplied examples include warm and cool scenes independently of the brand accent.<br /><br />**Files:** [body-signal-water-overlay.png](/workspace-assets/singlepage/intake/marketing-creative/body-signal-water-overlay.png), [longevity-journey-portrait.png](/workspace-assets/singlepage/intake/marketing-creative/longevity-journey-portrait.png), [low-energy-statement.png](/workspace-assets/singlepage/intake/marketing-creative/low-energy-statement.png), [signal-motion-labels.png](/workspace-assets/singlepage/intake/marketing-creative/signal-motion-labels.png), [soft-guidance-notifications.png](/workspace-assets/singlepage/intake/marketing-creative/soft-guidance-notifications.png), [connected-data-overlay.png](/workspace-assets/singlepage/intake/marketing-creative/connected-data-overlay.png), [expression-story-poster.png](/workspace-assets/singlepage/intake/marketing-creative/expression-story-poster.png), [archive-type-poster.png](/workspace-assets/singlepage/intake/marketing-creative/archive-type-poster.png), [introspection-blur-poster.png](/workspace-assets/singlepage/intake/marketing-creative/introspection-blur-poster.png), [health-tags-landscape.png](/workspace-assets/singlepage/intake/marketing-creative/health-tags-landscape.png), [low-angle-prompt-poster.png](/workspace-assets/singlepage/intake/marketing-creative/low-angle-prompt-poster.png) |
