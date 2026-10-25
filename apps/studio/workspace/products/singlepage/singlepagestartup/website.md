---
confirmation:
  confirmed: false
sources:
  offer:
    classification: client-claim
    sources:
      - product.md
    supports: Free reusable framework, coding-agent workflow, separate hosted costs and help as time permits.
  visitor_path:
    classification: promise
    resolution: operator-fact
    source: operator instruction in the Product landing review
    date: 2026-10-25
    supports: Novice makers describe their business in ordinary language, develop pages and functions with the AI assistant, publish a first version through the same chat and continue improving it there. The result is a working project with a client-facing URL and access to its code.
    limitation: Proposed Product journey. GitHub and hosting integrations are not implemented by the landing preview; existing Product and Sales documents describe the self-directed coding route.
  preparation_handoff:
    classification: client-claim
    source: apps/studio/workspace/brief/singlepage.md#intake.framework_preparation_journey
    date: 2026-10-24
    supports: The Framework landing connects business preparation, modules, architecture articles and token purchases; AI Chat's reviewed written material supplies the development brief.
    limitation: A selected customer journey, not evidence of automatic publication, runtime readiness or measured customer outcomes.
  acquisition_path:
    classification: client-claim
    source: operator instruction in the Product landing review
    date: 2026-10-24
    supports: The landing introduces reusable features in consumer language and invites a new visitor to register and describe an idea in AI Chat. Detailed development instructions belong after that first step.
    limitation: Product Storybook scope. Runtime and Studio Modules transfer require a separate review.
  first_version_delivery:
    classification: client-claim
    source: operator instruction in the Product landing review
    date: 2026-10-25
    supports: The proposed service uses business and product documents to assemble pages from default framework components. The person reviews the first version, connects GitHub and a hosting account, and requests publication in the same AI Chat. The service creates their repository, deploys the project and populates it through MCP. Client-specific visuals are photography and infographics. Saved project knowledge supports subsequent changes and new chats.
    limitation: Planned Product experience. Repository and server integrations require implementation; delivery pricing and token consumption are unspecified. The requested today wording is the operator's launch target, not a measured completion time or a one-day service guarantee.
  review_language:
    classification: constraint
    source: operator instruction in the Product landing review
    date: 2026-10-24
    supports: The current landing copy is reviewed in Russian. The English version follows the Russian content review.
  framework_reuse:
    classification: client-claim
    source: operator instruction in the Product landing review
    date: 2026-10-24
    supports: SinglePageStartup is an open-source framework with a modular, extensible codebase tested across dozens of projects; its modules originate in client requests and are tested and maintained by the SPS team.
    limitation: Operator-supplied internal-use statement. No independent project inventory or measured time saving is asserted.
  mobile_examples:
    classification: assumption
    resolution: professional-choice
    source: operator instruction in the Product landing review
    date: 2026-10-24
    supports: Four interactive mobile examples cover SPS course enrolment, a vibe-coder community, a course shop and an AI blog. Example people, programmes and course prices are illustrative fixtures.
    limitation: Product-only local state. Forms, chat, course checkout and subscriber access do not create runtime records, make payments or grant real entitlements. Existing AI Chat pricing and token accounting remain outside this revision.
  account_offer:
    classification: client-claim
    sources:
      - apps/studio/workspace/brief/singlepage.md#sources.ai_chat_commercial_terms
      - apps/studio/workspace/brief/singlepage.md#sources.ai_chat_allowance_and_pro
    supports: One-time Free allowance of 3000 tokens, Pro with 5000 tokens per month at USD 29 or RUB 1900, and unchanged fixed-rate top-ups.
    limitation: Commercial requirements; neither a Product preview nor this specification establishes a successful payment, renewal or token credit.
  article_examples:
    classification: verified-fact
    source: thoughts/shared/research/singlepagestartup/ISSUE-376-blog-content.json
    supports: Six project-authored architecture examples, category labels, article slugs and source references available for the Blog composition.
    limitation: An editorial source for examples, not an independent customer case or a fresh runtime publication check.
  module_scope:
    classification: verified-fact
    sources:
      - libs/modules/rbac/README.md
      - libs/modules/social/README.md
      - libs/modules/blog/README.md
      - libs/modules/knowledge/README.md
      - libs/modules/ecommerce/README.md
      - libs/modules/billing/README.md
      - libs/modules/website-builder/README.md
      - libs/modules/host/README.md
      - libs/modules/crm/README.md
      - libs/modules/agent/README.md
    supports: Module responsibilities shown in the page's capability groups and linked source documentation.
    limitation: Documented source responsibilities do not establish a finished product for every use case.
  module_count:
    classification: verified-fact
    source: libs/modules/*/README.md
    inspected_at: 2026-10-25
    supports: 15 module directories have a root README; the landing separately illustrates eight capability groups.
    limitation: Repository inventory establishes the count, not runtime readiness or completed integration setup for every module.
  example_change:
    classification: assumption
    resolution: professional-choice
    supports: Workshop bookings and email enquiries illustrate a change a maker can request for an existing project.
  visual_application:
    classification: constraint
    source: ../../../design/singlepage.md
    asset_ids:
      - singlepage-generated-living-focus-primary-lockup
      - singlepage-generated-framework-acquisition-v2-hero
      - singlepage-generated-framework-acquisition-v2-accounts
      - singlepage-generated-framework-acquisition-v2-social
      - singlepage-generated-framework-acquisition-v2-blog
      - singlepage-generated-framework-acquisition-v2-knowledge
      - singlepage-generated-framework-acquisition-v2-ecommerce
      - singlepage-generated-framework-acquisition-v2-billing
      - singlepage-generated-framework-acquisition-v2-pages
      - singlepage-generated-framework-acquisition-v2-forms
    supports: Living Focus imagery, Onest typography, cool neutral surfaces, graphite and lime actions from the selected Design direction.
route_intent:
  landing: /framework
  blog: /blog
  category: /blog/categories/[slug]
  article: /blog/articles/[slug]
  token_catalog: /ecommerce
  ai_chat: /
  account_checkout_preview: /ai-chat/rbac/subjects/tokens
  locales: [en, ru]
  limitation: Routes describe the shared public journey. The account checkout retains the existing AI Chat Product-preview alias; it is not a second checkout owned by Framework.
review:
  dependencies:
    brand: c11095b305b2ccb166e46b5d488d95a74a1c541bcabb4fd22b44ed243e848a73
    design: 467a919279dda57ee7fb3966994a6f68c5d6f39f6e6b5d41aa12fa94485c982a
    product.singlepagestartup.product: d43a14f03a02493cd45ed9020b42868d739925087e816d4e8d60a90dc050f287
    product.singlepagestartup.sales: 9274aa239ae9f522707a0a540dcfcffef10a01d62809d298ee274946b75a0184
    strategy: 75701c732f48b6bbe5574855fed8d5d05aa7e8a18741d2eec1f14125fa023fd5
---

# Website

## Objective and visitor paths

The Code Framework landing describes a path from a business idea to a published website or web service. Its primary audience is the `makers` segment in Product and Sales: novice creators who describe what customers should be able to do and assess the result through the interface. Copy names pages, functions, text, images and a link to the working project. Programming knowledge is not a prerequisite for understanding the offer.

The person describes their business in AI Chat, works with the assistant on functions, pages and content, views a first version built from existing components, and requests publication from that chat. They connect GitHub for code storage and register with a hosting service for the live project. A published URL lets them show the result to clients. They can continue requesting changes in the same chat and reuse saved project knowledge. This is the proposed Product experience; the free code remains available independently for people who develop and host it themselves.

Visitors arrive through AI Chat, an architecture article, a demonstration, search or a shared link. The page answers what they can create, which functions the framework supplies, how to publish a first version and how to develop it further. The `developer-agents` segment follows module documentation and source links to assess the fit for the person's task; the person owns the adoption decision.

The primary action is **Создать продукт**, opening AI Chat registration with a sign-in alternative. The hero says **Создайте свой продукт уже сегодня** and describes functions, pages, content and publication through the chat. The framework introduction explains its modular, extensible codebase through functions that can be added as the business develops. GitHub remains a secondary text link in the journey. The today wording expresses the intended launch experience; integration readiness and achievable delivery time remain unverified.

## Final page specification

| Page                                    | Visitor question and required content                                                                                                                                                                                              | Next action                                                                                                |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Framework `/framework`                  | What could I make, which features are ready and where do I start? Short hero, interactive mobile examples, illustrated capabilities, creation and publication steps, reusable project knowledge, articles, code ownership and FAQ. | **Создать продукт** → AI Chat registration with a sign-in alternative.                                     |
| Modules `/framework/modules`            | Which existing functions fit my product? Grouped responsibilities, concrete uses and source links.                                                                                                                                 | Open a module guide, documentation or a related article.                                                   |
| Blog `/blog`                            | How is a product on this framework assembled? Frontend, Backend and DevOps categories, article covers, titles, excerpts, dates and authors.                                                                                        | Open a category or article.                                                                                |
| Blog category `/blog/categories/[slug]` | What can I learn about this part of the product? Category description, article count and its actual articles.                                                                                                                      | Open an article or return to all articles.                                                                 |
| Article `/blog/articles/[slug]`         | Why does this SPS pattern work this way? Cover, title, category, author, date, full explanation, code, linked GitHub sources and related reading.                                                                                  | Read source, prepare the business brief or return to Framework.                                            |
| Tokens `/ecommerce`                     | What pays for hosted AI Chat, and what does the free framework cost? Free allowance, monthly Pro and fixed-rate top-ups, with the same account balance and currency choices used in AI Chat.                                       | Choose an offer, then continue to AI Chat's account purchase flow.                                         |
| AI Chat `/`                             | How do I create, publish and continue developing my project? Proposed page assembly, publication through the chat and reusable project knowledge.                                                                                  | Create a first version, connect code storage and hosting, request publication and continue making changes. |

The header uses the current SinglePageStartup lockup linked to `/framework`. On the landing, **Фреймворк**, **Модули**, **Блог** and **Токены** accompany one primary **Создать продукт** action leading to registration. Modules opens `/framework/modules`. A compact mobile menu exposes the public destinations. Other Product pages retain their AI Chat and GitHub navigation. Personal chats belong in account actions, outside the public navigation.

The footer groups **Build** (Framework, modules, source documentation, source licence), **Learn** (Blog, Frontend, Backend, DevOps) and **Your project** (AI Chat, tokens, account access). **Issues and help** opens GitHub and says that framework help is available as time permits. Existing Privacy and Terms links retain their real destinations. No invented contact details, support schedule or unavailable legal page appears.

### Creation, publication and continued work

The three steps are **Создайте аккаунт**, **Создайте проект с ИИ** and **Опубликуйте проект**. The person describes their business, chooses functions and pages with the assistant, supplies or prepares text and images, views the first version and asks for changes. Publication is requested through the same chat after connecting the required accounts. Hosting is explained as the service where the website runs; GitHub is explained in the FAQ as the place where the code is stored. Brief, Strategy, Brand, Design and Product are saved descriptions with expandable explanations and examples, not prerequisites the visitor must already understand.

The proposed first-version service creates the client's repository through a GitHub integration, deploys Code Framework to the person's hosting account and populates the deployed project through MCP. It uses the framework's existing default component variants. Client-specific visual work supplies photography and infographics; generating custom component variants is outside this initial version. The person receives a working project URL and access to their repository. They can request changes through the same chat or extend a module themselves with an AI coding assistant or a developer. Repository and server integrations still require implementation. This Product preview specifies the intended experience and does not establish that those integrations are operational. Token consumption, delivery pricing and hosting terms remain unspecified.

A collapsed **Хотите работать с кодом самостоятельно?** disclosure contains a copyable request for people using a coding application on their own computer. They can download their repository, attach reviewed project documents in Claude Code or Codex and adapt the code themselves. The FAQ distinguishes this self-directed development route from the proposed first-version service. Source ownership, documentation and licence links remain available; the journey contains neither a sample chat bubble nor a licence card. Framework code and documentation use the MIT licence; no free hosting or delivery price is promised.

### Module explanations

The headline states **15 модулей уже готовы к подключению**. The count comes from the 15 module directories with root READMEs under `libs/modules`: agent, analytic, billing, blog, broadcast, crm, ecommerce, file-storage, host, knowledge, notification, rbac, social, startup and website-builder. The number describes source modules, not the eight illustrated capability groups or a claim that all integrations are configured. The introduction explains modules as functions the person can add to a project. Accounts and permissions point to RBAC; profiles and conversations to Social; articles and categories to Blog; source material and retrieval to Knowledge; products, carts and orders to Ecommerce; invoices and currencies to Billing; reusable page content to Website Builder; pages and metadata to Host; contact requests to CRM; scheduled work to Agent. The text distinguishes the Agent module's background jobs from the person's external coding agent.

The landing gives each of eight capability groups a distinct illustration, a consumer-facing label and one short description. Each illustrated capability card opens its relevant module guide, where the technical responsibilities and repository documentation belong. Supporting articles explain individual modules, their associations and concrete use cases. Example interfaces illustrate possible projects; they do not claim that every integration is already configured for the visitor.

The Social guide at `/framework/modules/social` expands this format into a complete product introduction. A short hero leads to three selectable examples: a community, an expert platform and a Knowledge-assisted chat. Each example has a profile view, conversation view and local message composer with only an input and send action. Own messages appear on the right without an author label; replies appear on the left with the sender’s name. The author profile contains expandable Blog article excerpts. The assistant profile separates linked Knowledge sources from skills and their explicit slash commands. Messages remain in the preview; replies are authored examples, and switching scenarios resets the example. The page labels the fictional data before the interface. It does not call a model, send messages or mutate runtime records.

The article explains Profile, Chat, Thread and Message through one school example, then covers Skill, Attribute, Attribute Key, Action and Widget. A component section shows Product-only visual specimens of the author card, public author page, thread navigation and chat/document frame. Article excerpts expand, selecting a thread changes its preview, and narrow screens switch between conversation and document panes. These specimens illustrate the corresponding runtime components linked later in the guide; they do not fetch runtime data. Related capabilities explain RBAC access, File Storage attachments, Blog articles, Knowledge sources and Ecommerce products. These claims are based on the Social module, model and relation READMEs and the named component sources; Social does not take ownership of authentication, retrieval, payments or AI orchestration.

All guide and example copy is editable in `website/Modules/page.md`. In-page navigation leads to scenarios, models, components, connections and implementation steps. The closing action opens the existing AI Chat registration preview and provides a copyable product task. Source README and component links stay inside a secondary disclosure and open in a new tab. Existing Phosphor glyphs and the registered dark Social cover supply the visual language. Other module guides retain their current content and routes.

### Blog and articles

The landing links to three module articles (Social, Billing and Knowledge) and the full module index. Each of the 15 modules has a Russian article covering its behavior, related responsibilities and a concrete example, with a link to its source README. The initial Blog contains six SPS architecture articles: Next.js readers and Widget slots; React Query, realtime and principal scopes; Hono controllers and owning services; subscription access to private article content; Nx, Bun, Docker and generated migrations; and builds, revalidation and content cutovers.

Article cards show their real cover, one or more categories, title, excerpt, publication date and Social-profile author. The image, title and empty card area open the article. Category and author links keep their own destinations. Category cards use their actual descriptions, covers and article counts. Covers with people are editorial illustrations of work, not portraits of the author or proof of a customer result. The SinglePageStartup editorial profile is valid for project explanations; fabricated individual biographies are not.

An article keeps its full body, headings, code and source links. Every mentioned repository file opens the exact file on GitHub; a monospace path without a link is insufficient. The article's category returns to its list, the byline opens its public profile, and related articles remain directly reachable. After the explanation, **Prepare the business brief** opens AI Chat and **Build with Code Framework** returns to `/framework`. These actions explain the next task without implying that reading a code example publishes a product.

Public article content remains readable without an account. A private widget shows its actual access state and a route to the relevant account or subscription decision. Its preview states distinguish unavailable content, sign-in, subscription required and granted access. Neither a generated example nor a hidden client panel is presented as proof of entitlement.

### Token catalogue and return to work

The token page connects both products through one AI Chat account. Its lead is **Keep working on your business documents.** Free framework access stays explicit. A registration allowance of 3,000 tokens is granted once and is not a product to buy. Pro includes 5,000 tokens per month for USD 29 or RUB 1,900. The monthly period is visible beside each price. Top-ups of RUB 100, 300, 500, 1,000 and 3,000 use the same RUB 0.13 per internal token; a larger package carries no discount.

Offer selection shows the chosen amount, currency, interval where applicable and token quantity before continuing to the existing AI Chat account purchase flow. Account balance, sign-in and payment recovery belong to that flow. A guest can compare offers and sign in with the intended selection retained. A signed-in person returns to the saved project after a confirmed payment; a cancelled or failed payment preserves the saved work and balance. Choosing a card in the static Product view displays a selection, never a paid receipt or credited balance.

## Design constraints

Apply the Living Focus identity: Onest headings and body copy, white and cool gray surfaces, graphite text and panels, and lime actions. The hero illustration shows a website assembled from reusable account, shop and article features. Each capability has its own graphite-and-lime infographic. Article photography remains editorial.

The nine acquisition illustrations are registered under `framework-acquisition-v2`. Their native square originals are also the square deliveries; preserve the files and show the full composition on white. Apply native bitmap colors without CSS recoloring or background masks. The three module-guide cards use separate `framework-article-covers-dark-v1` edits: graphite backgrounds, white linework and lime accents in 4:3 frames. Their complete square compositions remain visible, and the capability grid keeps its light images. Narrow screens stack content and allow buttons to wrap. Navigation, selectors, copy feedback and FAQ disclosures remain accessible by keyboard.

Vary the section structure: a short illustrated hero; a graphite panel with four selectable mobile apps; an illustrated capability grid; a dark three-step sequence; an asymmetric request example; compact article cards; and a centered lime registration panel. Keep detailed answers and the technical request in disclosures. Main actions lead to the AI Chat registration preview.

The mobile examples share a phone frame and use the existing Phosphor icons. Their forms and controls are real local interactions. Course enrolment includes a programme, required name and email fields, study format, confirmation and editing. The community includes project reactions, member profiles, local joining, publishing a project and a members' chat. The shop includes course details, RUB/USD selection, cart additions and removals, a checkout with currency-compatible payment methods and an explicitly simulated order. The blog includes search, categories, article bodies, author pages, bookmarks and a subscriber block with explicit demo access. A native-style phone status bar shows time, signal, Wi-Fi and battery. Local form, payment and access states retain their contextual simulation notices; the external demo badge and caption are removed. No payment or server request runs.

## Metadata and review

**Title:** Создайте свой продукт уже сегодня | SinglePageStartup

**Description:** Опишите идею ИИ-помощнику, создайте страницы из готовых блоков и опубликуйте первую версию через чат SinglePageStartup.

**Open Graph title:** Создайте свой продукт уже сегодня

**Open Graph description:** От описания бизнеса до ссылки для клиентов: выберите функции, подготовьте страницы и опубликуйте проект через тот же чат.

The current Product landing preview uses Russian for content review, including navigation, examples, instructions, image descriptions and accessibility labels. The English version follows that review. The planned website supports English (`en`) and Russian (`ru`) through the framework's internationalization configuration. Keep the same semantic content keys and product names in both versions: SinglePageStartup, Code Framework, AI Chat, Claude Code and Codex Desktop.

The Framework route is `/framework`; AI Chat uses `/`. Canonical URLs include the selected public domain and locale when published. Blog and category titles name their subject and SinglePageStartup; each article supplies its own description and cover for Open Graph. Token metadata describes hosted AI Chat usage and never calls Code Framework a paid subscription.

<!-- Product-owned editable page copy lives in website/*.md. Static compositions
read that copy and local props without importing Studio Modules, production SDKs
or runtime business logic. The first implementation boundary is the complete
Product journey; Modules/Host and runtime transfer follow separately. Historical
confirmation metadata is not renewed by this scoped revision. -->

### Registration and publication

The Russian landing uses **Создать продукт** in the hero and navigation, **Зарегистрироваться** in the first journey step and **Начать** in the final lime panel. Each opens the same registration destination. The final panel says **Запустите проект уже сегодня и начните показывать его клиентам**. It asks the person to describe the business, view the first version and publish it through the chat. GitHub and hosting accounts are prerequisites in the expanded publication answer. The Product preview does not create repositories or deploy projects.

The knowledge section explains that the person's understanding of the business becomes editable documents: the idea, customers, functions and visual choices. They can return to these documents, add new information and use them in subsequent tasks. The example asks to add a new course page using the school's saved description and appearance. An explicit `@knowledge` mention connects a new chat to saved knowledge, consistent with the Social and Knowledge README contracts. The copy does not imply that every chat automatically receives every document.

### Example identities and icons

Four fictional example brands use independently generated horizontal wordmarks: **Firstship** for free-webinar registration, **Buildfolk** for the vibe-coder community, **Lessonloop** for the course shop and **Signalnote** for the AI journal. The purple launch stroke, green connecting letters, terracotta learning loop and blue editorial lettering belong to `framework-example-brands-v1`. Originals, exact prompts, dimensions and hashes are recorded in Assets under `singlepage-generated-framework-example-*`. No external logo reference was supplied; these are new concept identities for review, not real customer brands or trademark-cleared names. Existing Phosphor icons remain for actions and question controls. Course descriptions, programmes and prices are illustrative. The blog lead card uses native type and line shapes in its blue editorial palette.

The dark example block includes its introduction. Only the selected example reveals its short explanation, directly below its control. One lime outline encloses both the active button and its expanded text. The removed footer identity caption and licence sentence are omitted; documentation and licence destinations remain available in navigation.

### Document explanations and next actions

The five project documents have click-to-open explanations in both the preparation step and the saved-knowledge card. Each explanation names its purpose and gives a concrete example. Native disclosures work with touch and keyboard and expose their expanded state. Both groups use full-width rows before and after expansion. Journey numbers have no accompanying decorative icons. The first step has a full-width registration button; the third, **Опубликуйте проект**, describes hosting registration, publication through the chat and access to the result, followed by a quiet GitHub text link with its logo and no trailing arrow. The section is titled **Три шага до запуска вашего проекта** and describes creating an account, making the project with the assistant and publishing it.

The open-code paragraph explains that the project uses the SPS framework, that SPS maintains the shared modules and fixes bugs, and that the person can extend a module or create a custom one with an AI assistant or developer. Access to their project code remains with them. Its **Код остаётся у вас** label has the same uppercase styling as the other section labels. The FAQ retains accurate cost information for visitors who ask what is free; no hosting price or free hosted service is promised. First-version delivery follows the proposed service described above; integration work remains a runtime implementation dependency.

FAQ questions appear in rounded white cards with a lime circular plus control. Opening a card reveals the answer, tints the card pale green and changes the Phosphor plus glyph to minus; the full summary is clickable and retains visible keyboard focus. The footer describes the purpose of the open framework: helping people create and develop websites, shops and web services.

### Webinar example and benefit-led section labels

Firstship presents a fictional free webinar about a first AI product. Three illustrated topics explain the brief, product assembly and publication checks. The form offers live or recorded participation and saves the submission only in the example. Its confirmation does not claim an email was sent or a real event reservation was made. A generated portrait accompanies fictional instructor Алексей Миронов; the card explicitly identifies him as a demonstration character, and the illustrative biography is not evidence of SPS staff credentials.

The Firstship header is the only place its wordmark appears. The lead uses launch artwork; Lessonloop course covers use connected interface glyphs, Buildfolk uses a green composition about building together, and Signalnote keeps its blue editorial lead with subject tags. Native selects retain keyboard behavior and have inset custom chevrons with reserved space for text. All icons are from Phosphor; example cover compositions use the existing code, users, chat-circle, robot and check-circle glyphs.

The three lavender topic illustrations and portrait are registered under `singlepage-generated-framework-webinar-v1-*`, with original masters and square deliveries linked in Assets. The knowledge capability is named **База знаний** and shows an AI assistant retrieving document excerpts; **Конструктор сайтов** describes the page-building capability. Short section labels name the intended outcome, including the operator-requested **Запустите проект уже сегодня**. This is a proposed launch target with no measured completion time or delivery guarantee; publication depends on the integrations and account setup described above. The knowledge illustration preserves the graphite and lime line-art family and has no human searching the files.
