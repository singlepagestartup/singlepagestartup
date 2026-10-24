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
    resolution: professional-choice
    sources:
      - ../../../strategy/singlepage.md
      - ../../../brand/singlepage.md
      - sales.yaml
    supports: Makers can prepare and review business and product documents in AI Chat, export them and brief a coding agent to build with the free Code Framework. People with an existing brief can go directly to the code.
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

The Code Framework website helps a person with a business idea prepare a development brief and build a web product with a coding agent. It serves the `makers` Sales segment: creators who need accounts, content, orders or payments and want to describe their own product's rules instead of defining those common functions again.

Someone whose idea is still scattered across notes can prepare a business model, concept, plan and product documents in AI Chat. They review the drafts, keep unanswered questions visible and export the accepted text. A coding agent then uses that material to develop a landing page or product on Code Framework. Someone with a usable brief can go directly to GitHub. Access to the framework requires no AI Chat purchase.

Visitors arrive through AI Chat, an architecture article, a demonstration, search or a shared link. The page answers what the framework contains, where business decisions come from, what the person and coding agent do next, and which costs belong to separate services. The `developer-agents` segment follows module documentation and source links to assess the fit for the person's task; the person owns the adoption decision.

The primary action is **Describe my idea**, opening AI Chat registration. **How it works** opens the three-step explanation on this page. Visitors can understand the offer and try AI Chat before choosing a coding app or downloading code. The shared features let them spend development tokens on their own requirements; the page makes no numerical savings claim.

## Final page specification

| Page                                    | Visitor question and required content                                                                                                                                                                      | Next action                                                                                      |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Framework `/framework`                  | What could I make, which features are ready and where do I start? Short hero, selectable project examples, illustrated capabilities, preparation and development steps, articles, free-code terms and FAQ. | **Describe my idea** → AI Chat registration; **How it works** → the page's development sequence. |
| Modules `/framework/modules`            | Which existing functions fit my product? Grouped responsibilities, concrete uses and source links.                                                                                                         | Open a module guide, documentation or a related article.                                         |
| Blog `/blog`                            | How is a product on this framework assembled? Frontend, Backend and DevOps categories, article covers, titles, excerpts, dates and authors.                                                                | Open a category or article.                                                                      |
| Blog category `/blog/categories/[slug]` | What can I learn about this part of the product? Category description, article count and its actual articles.                                                                                              | Open an article or return to all articles.                                                       |
| Article `/blog/articles/[slug]`         | Why does this SPS pattern work this way? Cover, title, category, author, date, full explanation, code, linked GitHub sources and related reading.                                                          | Read source, prepare the business brief or return to Framework.                                  |
| Tokens `/ecommerce`                     | What pays for hosted AI Chat, and what does the free framework cost? Free allowance, monthly Pro and fixed-rate top-ups, with the same account balance and currency choices used in AI Chat.               | Choose an offer, then continue to AI Chat's account purchase flow.                               |
| AI Chat `/`                             | How do I turn existing notes and decisions into development material? Upload, document review, saved text, continued discussion and export.                                                                | Prepare or continue a project; return with reviewed documents when ready to develop.             |

The header uses the current SinglePageStartup lockup linked to `/framework`. On the landing, **Framework**, **Modules**, **Blog** and **Tokens** accompany one primary **Try AI Chat** action leading to registration. Modules opens `/framework/modules`. A compact mobile menu exposes the public destinations. Other Product pages retain their AI Chat and GitHub navigation. Personal chats belong in account actions, outside the public navigation.

The footer groups **Build** (Framework, modules, source documentation, source licence), **Learn** (Blog, Frontend, Backend, DevOps) and **Your project** (AI Chat, tokens, account access). **Issues and help** opens GitHub and says that framework help is available as time permits. Existing Privacy and Terms links retain their real destinations. No invented contact details, support schedule or unavailable legal page appears.

### Preparation and development

The preparation panel names the material to bring: notes, customer and offer decisions, a business model or plan, existing documents and visual references. AI Chat helps the person examine gaps and review written Brief, Strategy, Brand, Design and Product documents. The person exports selected reviewed files and gives them to Claude Code, Codex Desktop or another chosen coding agent. The coding agent opens the repository, runs it locally and changes the product; the person reviews the interface and business behaviour.

The visible sequence has three steps: describe the idea, review the plan and build when ready. It names the coding app as a separate application on the person's computer. A collapsed **Already have a plan?** disclosure contains a copyable request and the GitHub link. The request asks the coding app to use reviewed documents, reuse suitable features and show what needs review. The person attaches their own exports outside this public page.

The free-code block remains visible alongside this sequence. Code and documentation use the MIT licence. Coding tools, infrastructure and hosted AI Chat usage have separate costs. This manual development route is available independently of future AI Chat landing-page assembly and server deployment.

### Module explanations

Capabilities use the responsibility of each module, not an unexplained inventory count. Accounts and permissions point to RBAC; profiles and conversations to Social; articles and categories to Blog; source material and retrieval to Knowledge; products, carts and orders to Ecommerce; invoices and currencies to Billing; reusable page content to Website Builder; pages and metadata to Host; contact requests to CRM; scheduled work to Agent. The text distinguishes the Agent module's background jobs from the person's external coding agent.

The landing gives each of eight capability groups a distinct illustration, a consumer-facing label and one short description. **Explore all features** opens the module guides, where the technical responsibilities and repository documentation belong. Supporting articles explain a Next.js page, a Hono request or local development. Example interfaces illustrate possible projects; they do not claim that every integration is already configured for the visitor.

### Blog and articles

The landing shows three featured articles, one per category, with a **Read all articles** action. The initial Blog contains six SPS architecture articles: Next.js readers and Widget slots; React Query, realtime and principal scopes; Hono controllers and owning services; subscription access to private article content; Nx, Bun, Docker and generated migrations; and builds, revalidation and content cutovers.

Article cards show their real cover, one or more categories, title, excerpt, publication date and Social-profile author. The image, title and empty card area open the article. Category and author links keep their own destinations. Category cards use their actual descriptions, covers and article counts. Covers with people are editorial illustrations of work, not portraits of the author or proof of a customer result. The SinglePageStartup editorial profile is valid for project explanations; fabricated individual biographies are not.

An article keeps its full body, headings, code and source links. Every mentioned repository file opens the exact file on GitHub; a monospace path without a link is insufficient. The article's category returns to its list, the byline opens its public profile, and related articles remain directly reachable. After the explanation, **Prepare the business brief** opens AI Chat and **Build with Code Framework** returns to `/framework`. These actions explain the next task without implying that reading a code example publishes a product.

Public article content remains readable without an account. A private widget shows its actual access state and a route to the relevant account or subscription decision. Its preview states distinguish unavailable content, sign-in, subscription required and granted access. Neither a generated example nor a hidden client panel is presented as proof of entitlement.

### Token catalogue and return to work

The token page connects both products through one AI Chat account. Its lead is **Keep working on your business documents.** Free framework access stays explicit. A registration allowance of 3,000 tokens is granted once and is not a product to buy. Pro includes 5,000 tokens per month for USD 29 or RUB 1,900. The monthly period is visible beside each price. Top-ups of RUB 100, 300, 500, 1,000 and 3,000 use the same RUB 0.13 per internal token; a larger package carries no discount.

Offer selection shows the chosen amount, currency, interval where applicable and token quantity before continuing to the existing AI Chat account purchase flow. Account balance, sign-in and payment recovery belong to that flow. A guest can compare offers and sign in with the intended selection retained. A signed-in person returns to the saved project after a confirmed payment; a cancelled or failed payment preserves the saved work and balance. Choosing a card in the static Product view displays a selection, never a paid receipt or credited balance.

## Design constraints

Apply the Living Focus identity: Onest headings and body copy, white and cool gray surfaces, graphite text and panels, and lime actions. The hero illustration shows a website assembled from reusable account, shop and article features. Each capability has its own graphite-and-lime infographic. Article photography remains editorial.

The nine acquisition illustrations are registered under `framework-acquisition-v2`. Their native square originals are also the square deliveries; preserve the files and show the full composition on white. Apply native bitmap colors without CSS recoloring or background masks. Article cards use landscape frames for their existing covers. Narrow screens stack content and allow buttons to wrap. Navigation, selectors, copy feedback and FAQ disclosures remain accessible by keyboard.

Vary the section structure: a short illustrated hero; a graphite panel with four selectable project previews; an illustrated capability grid; a dark three-step sequence; an asymmetric request example; compact article cards; and a centered lime registration panel. Keep detailed answers and the technical request in disclosures. The four previews cover a contact page, community, shop and content project, using local presentation state without submitting forms. Main actions lead to the AI Chat registration preview.

## Metadata and review

**Title:** Code Framework — Build your idea. The essentials are ready. | SinglePageStartup

**Description:** Describe your idea in AI Chat, then build on reusable accounts, articles, products and payments. Keep the features you need and adapt the free Code Framework.

**Open Graph title:** Build your idea. The essentials are ready.

**Open Graph description:** Work out your idea in AI Chat and build your own product on SinglePageStartup's reusable code.

The website is planned in English (`en`) and Russian (`ru`), using the framework’s existing internationalization configuration. Each version includes its headings, body, navigation, actions, tooltips, messages, accessibility labels and metadata in that language. Use the same semantic content keys for both versions; keep names such as SinglePageStartup, Code Framework, AI Chat, Claude Code and Codex Desktop unchanged. The first action is **Describe my idea** in English and **Описать мою идею** in Russian. The current Product landing preview uses the authored English source.

The Framework route is `/framework`; AI Chat uses `/`. Canonical URLs include the selected public domain and locale when published. Blog and category titles name their subject and SinglePageStartup; each article supplies its own description and cover for Open Graph. Token metadata describes hosted AI Chat usage and never calls Code Framework a paid subscription.

<!-- Product-owned editable page copy lives in website/*.md. Static compositions
read that copy and local props without importing Studio Modules, production SDKs
or runtime business logic. The first implementation boundary is the complete
Product journey; Modules/Host and runtime transfer follow separately. Historical
confirmation metadata is not renewed by this scoped revision. -->
