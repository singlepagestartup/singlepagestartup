---
customer_segments:
  - business-users
sources:
  scope: Client inventory confirmation, 2026-09-11; retained by Brief
    intake.scope, 2026-09-13.
  audience-value-and-flow: Brief intake.product_direction and
    sources.service_terms; operator decision, 2026-09-18, defines the
    project-model workspace, the landing-page sandbox, publication to the
    customer's own server and token buying, superseding the business-data chat
    and local-framework branch recorded on 2026-09-13.
  one-page-workspace: Operator clarification, 2026-09-16; guided cards form one
    concise project page covering the request, intended result, strategy and
    brand; the service reuses that page for ordinary-language work and a
    landing-page sandbox, then adds products and detail as needed.
  one-hour-setup: Operator clarification, 2026-09-17; AI Chat keeps the five
    framework stages—Request, Strategy, Brand, Design and Products—but
    compresses their first pass into an approximately one-hour guided session
    that begins with supplied material and ends with useful project context; the
    Products stage retains the complete business-model coverage through grouped
    decisions instead of nine forms.
  structured-project-partner: Operator clarification, 2026-09-17; people may
    supply existing notes and materials or complete the relevant sections
    directly, AI Chat structures the information for approval, and the accepted
    project remains available for developing and critically examining later
    ideas.
  business-workspace-and-journey: Operator correction, 2026-09-17; people upload
    text, documents and images, receive a business and marketing model with
    visible gaps, continue working with project-aware chat, prepare a landing
    page in a sandbox, buy tokens whenever the available balance is exhausted,
    and are actively led to Code Framework when a public site or other software
    need appears.
  landing-page-sandbox: Operator correction, 2026-09-17; the landing page is
    assembled from SinglePageStartup blocks, edits are stored in the service
    database and appear immediately in the frontend preview. The sandbox itself
    is not public.
  assisted-publication: Operator clarification, 2026-09-18; a user can continue
    from the sandbox, authenticate with GitHub, create a project repository,
    connect an existing server or a hosting provider such as Beget or Timeweb
    with the required deployment key, and let SinglePageStartup configure
    automatic deployment. The authorized GitHub integration keeps the repository
    available for later approved changes.
  ai-agent-method: Operator clarification, 2026-09-17; the connected model follows
    a SinglePageStartup method developed through long-term work with business,
    marketing and product-development methods and adapted so AI agents can
    interpret, question and update the same project structure consistently.
  contextual-framework: Confirmed Brand, 2026-09-16; offer Code Framework when a
    concrete site, chatbot or digital-product need appears, and describe
    deployment to the user's server.
  service-operations: Operator clarification, 2026-09-17; one project owner runs
    every stage, email/password unlocks the free service, support requests are
    processed within 24 hours without continuous live coverage, the
    payment-accepting party is in Russian jurisdiction and uses an online cash
    register, account deletion removes active data while infrastructure backups
    may persist for up to six months, and the service owner provides hosting and
    domain management.
  intention: Client scope and experiment decisions, 2026-08-09–10; the initial
    support promise remains deliberately limited.
  planning-scope: Operator correction, 2026-09-13; the Product describes the
    intended business before implementation. Planned outcomes and commercial
    choices remain distinct from observed customer results.
confirmation:
  confirmed: true
  by: operator
  at: "2026-09-18"
  source: "Operator read the Product after it gained the five Business Model Canvas
    sections it now owns, the editorial pass removed the publication path stated three
    times over, and the terms that had been recorded as undefined were replaced by the
    settled token, provider and publication decisions: «да, подтверждаю продукт»."
  content_sha256: 42ddf02fc96144fbda92fbffde2ff32d5c115b3d66f5108cad5855e271b2f5dd
review:
  dependencies:
    brief: c58b70512b9bc7ea71c0051f5ffecf1c0b733d413e96023e491b2ec08a39cb5e
    product.ai-chat.research: 43ac95c2a57afc5c0e31b2d805e9b2785355eeafb32a9499061a01638f65dafa
---

# Product

## Product identity

| Decision          | Intended product                                                                                                                                                                                                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand and product | **AI Chat** (`ai-chat`) is SinglePageStartup's central intended hosted workspace and a working demonstration of its framework.                                                                                                                                                                                                |
| Category          | Guided AI business workspace that turns existing files and answers into an editable business model, marketing decisions and working materials.                                                                                                                                                                                |
| Lifecycle         | Intended product developed under the project owner's direction.                                                                                                                                                                                                                                                               |
| Boundary          | File and image intake, guided questions, the business workspace, project-aware chat, landing-page creation, guided publication and hosted token use belong here. Code Framework (`singlepagestartup`) supplies the deployable code and server runtime; AI Chat guides repository creation, server connection and publication. |

## Customer Segments

| Role           | Known situation and responsibility                                                                                                                                                                                                                             |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User           | `business-users`: people with a business idea or early-stage project who need to turn available files, notes and images into a usable business model, see what is missing and prepare a landing page for a customer test. A narrower industry is not selected. |
| Buyer          | A user deciding to purchase tokens whenever the available balance is insufficient for the next requested work; an organization's separate purchasing role is unspecified.                                                                                      |
| Payer          | The person or organization funding those purchases; payer identity and purchasing authority remain commercial decisions.                                                                                                                                       |
| Beneficiary    | The user and the project or business being described, tested and developed.                                                                                                                                                                                    |
| Decision-maker | The user approves the project description, controls the landing-page sandbox, adds products and decides when to publish the page on a connected server; a future organization's internal purchasing authority remains customer-specific.                       |

When the landing page is ready, the user can publish it through a GitHub repository and a connected server. Other concrete software needs continue through Code Framework. People who only need the hosted workspace can remain AI Chat users.

## Problem and desired progress

| Dimension                   | Client intention and remaining limit                                                                                                                                                                                                                                                                                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Circumstance                | A person has a startup or business idea and a mixture of notes, documents, screenshots, images and partial decisions, but no usable view of how the business, marketing, products and first customer-facing offer should work.                                                                                                                                        |
| Progress sought             | Upload the material already available, turn it into a useful project model during one focused setup session, refine it through conversation, prepare a landing-page preview and publish it through a connected repository and server when ready. The first session is structured to take about one hour; unresolved questions can remain open and be completed later. |
| Functional forces           | Accept mixed files, images and guided answers; place information into the relevant business and marketing sections; expose gaps and contradictions; keep the result editable; and use it in later chat, exported documents and customer-facing materials.                                                                                                             |
| Social and emotional forces | Distinct emotional or social drivers are not supplied. The intended experience reduces the sense that the whole business must be designed before work can begin.                                                                                                                                                                                                      |
| Pains and gains             | Avoid fragmented files, repeated explanations and generic AI answers. Gain one maintained project model, a clear account of what is missing, a document usable inside or outside the service and a landing page that can move from a private preview to the user's server. No quantitative time saving or market result is established.                               |

## Value Propositions

The user can upload notes, documents, screenshots and images or enter what is known through a compact guided setup. AI Chat keeps the five stages of the full framework—Request, Strategy, Brand, Design and Products. Each stage collects the information needed to understand the project, choose a direction and prepare the first product materials. The Products stage groups customer and value, access and relationship, money and delivery, and sales and learning so all nine Business Model Canvas aspects remain covered without nine separate forms.

The setup is structured to produce a reviewed project model in about one focused hour. A person can leave an answer unknown, return later or open the relevant detailed section when a decision, process or material needs more work.

The model is assembled through the SinglePageStartup method, which the owner built by combining and adapting business, marketing and product-development practice. Its structure, its ownership of decisions and the links between sections exist so an agent can work in it: place a fact where it belongs, find a gap or a contradiction, correct the owning section and reuse an accepted decision later.

The result stays editable and exports as a document for use elsewhere. Inside the chat the person can develop an idea, ask for criticism, weigh alternatives or prepare a material without explaining the business again, because the chat asks only for what the current decision is missing.

The same decisions assemble a landing-page sandbox from SinglePageStartup blocks. Edits are saved with the project and appear immediately in the preview, which has no public address until the person publishes it. Publication is described under Offer and usage.

General AI chats without a maintained project structure, separate planning documents and independent landing-page tools are relevant alternatives. Current [Research](research.md) compares business-context chat alternatives; the guided-project and first-page progression requires further comparison. More useful work and a shorter path from the sandbox to a public customer test are intended outcomes, not established advantages.

## Offer and usage

Access provides the hosted workspace and this intended sequence:

1. Register with email and password and receive the currently available free token allowance.
2. Upload notes, documents and images, then review the facts AI Chat extracts instead of repeating them in a form.
3. Work through compact Request, Strategy, Brand, Design and Products stages. Each stage presents one material question, the relevant source statements and a live project-page update.
4. Review the project model, including visible unknowns and conflicts, and accept it as the working context.
5. Use chat to develop or challenge ideas, modify the owning documents and improve supplied or new business materials.
6. Assemble and edit a landing page from the same decisions, save its data with the project and inspect the private frontend preview.
7. Buy tokens whenever the available balance is insufficient for the next operation; return to the exact saved task after payment.
8. When the page is ready, authenticate with GitHub, create the project repository, connect a server and publish through the configured deployment pipeline. Use the same Code Framework route for another concrete software need.

Registration is by email and password; Google and other social sign-in are not planned. Uploaded documents are split into chunks, vectorized and retrieved as context for each answer, with no limit on how many a person adds. Brand keeps that mechanism out of the ordinary customer explanation.

Publication authorizes GitHub for the single repository it creates in the person's account, accepts a deployment key for Beget or Timeweb, and configures deployment through GitHub Actions, which also runs any redeployment. A domain the person already owns is attached through the hosting provider's API. This branch needs no token purchase, and the same route serves a chatbot or another digital product built on Code Framework.

The balance is visible during intake and later work. When it runs out the current task is preserved, and the person picks a package, pays and returns to it. Revenue Streams below owns the money terms.

A request sends the data it needs to the selected AI provider under that provider's terms. Deleting an account removes the account and the project data the service controls, while the host's backups keep copies for up to six months, which the project cannot shorten.

[Sales](sales.yaml) owns the whole customer process from discovery to continued use. The owner runs every service stage alone and processes support requests within 24 hours as the initial service level, without continuous live coverage. AI Chat does not act on behalf of the business or guarantee market results.

## Revenue Streams

| Element        | Terms                                                                                                                                                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Payer and unit | The person using the chat buys tokens. One internal token is USD 0.001 of provider cost.                                                                                 |
| Price          | Sold at a thirty per cent margin over that cost, converted at a fixed 100 roubles per dollar, so a token costs 0.13 roubles.                                             |
| Packages       | Five top-ups: 100, 300, 500, 1,000 and 3,000 roubles, at the same token price, so a larger package carries no discount.                                                  |
| Payment timing | One token is charged when the input is sent to the model; the balance is settled once the answer returns and its cost is known. No request costs less than 0.13 roubles. |
| Conditions     | Tokens do not expire. Purchases are normally final; a refund is a case-by-case decision, not a published entitlement. Registration grants the current free allowance.    |
| Collection     | Payments are accepted in Russia through an online cash register. The accepting party and its details are configured in the product interface, not decided here.          |

The margin is taken at top-up and not again on consumption, which is charged at
cost. Settlement rounds each turn up to a whole token, which adds an unmeasured
surplus, largest on cheap models. The fixed 100-rouble rate holds the margin only
while the market rate stays at or below it. No revenue or paying-customer
forecast is set.

## Key Activities

Develop and operate the hosted chat: intake of the customer's material, the
project model built from it, retrieval over the uploaded corpus, the landing-page
sandbox, and publication to the customer's own repository and server. Process
support requests within 24 hours as the initial service level, without continuous
live coverage or a resolution deadline. The intended customer process is in
[Sales](sales.yaml); it is not repeated here.

## Key Resources

| Resource ID       | Scope and share                                                                                                                                  | Availability                                                          |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| `founder-time`    | Half of the owner's working time, split evenly with Code Framework because development and promotion serve both and cannot be traced separately. | Allocated as the project develops; no recurring hours committed.      |
| `repository`      | The same shared codebase Code Framework distributes, which this service runs on. Counted under Code Framework.                                   | 16 modules, 65 models, 91 relations.                                  |
| `service-host`    | A Contabo server in Amsterdam running the service and its PostgreSQL with pgvector, where the uploaded corpus and its vectors are stored.        | Carried entirely by this product; Code Framework consumes none of it. |
| `provider-budget` | Owner-funded AI, storage and payment expenses.                                                                                                   | No ongoing cash allowance is set.                                     |

## Key Partnerships

| Partner              | Function and dependence                                                                                                                                                                                   |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OpenRouter           | Every model call and every embedding. The offered models are the ones its router declares, and `qwen/qwen3-embedding-8b` vectorizes uploads. A change to its prices changes this product's cost directly. |
| Contabo              | The Amsterdam server holding the service and the corpus. Its backups keep copies for up to six months after an account is deleted, which the project cannot shorten.                                      |
| Online cash register | Accepting payments in Russia.                                                                                                                                                                             |
| GitHub               | Authorization for the single repository publication creates in the customer's account, and the Actions workflow that deploys it.                                                                          |
| Beget, Timeweb       | The hosting providers a customer deploys their own page to, named as the supported options. Their restrictions on OpenRouter are why this service does not run there.                                     |

No partnership agreement or dedicated supplier terms exist with any of them. The
customer's own domain is attached through their provider's API and is never sold
or registered by this product.

## Cost Structure

| Expense                 | Basis                                                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Development and support | Half of the owner's time, per the `founder-time` split. Owner time, not cash.                                                                              |
| AI usage                | OpenRouter calls, variable with use. Charged to the customer's balance through the token terms above.                                                      |
| Embedding and storage   | Vectorizing each uploaded document and holding the corpus in pgvector. Variable with what customers upload, not with what they pay, and charged to no one. |
| Hosting                 | The Contabo server, fixed against use.                                                                                                                     |
| Payment acceptance      | Online cash register fees.                                                                                                                                 |

Promotion is not a cost of this product; it sits with Code Framework, which is
what promotion is paid in. The half of owner time this product does not carry is
in Code Framework under the same resource ID, so the same hours are never counted
twice. Recurring totals are unset.

### Funding

The owner's time and money cover the service until its receipts do. Revenue from
this product is what makes the free framework affordable, and the two are kept
apart so neither hides the other. No external financing is committed.

## Assumptions and decision rules

- `service-viability`: useful answers and repeat token purchases have to cover
  the service's costs. The selected terms price answers alone, while embedding
  and storage grow with each customer's uploads because the offer sets no file
  limit. The rounding surplus is treated as rough compensation; the two have
  never been compared, and no cost per document is defined.
- `capacity`: support scales to available time, at 24 hours as the initial
  service level and no resolution commitment.
- `answer-quality`: answers grounded in the customer's own material are intended
  to beat a general chat without that context. This is a goal to test; no
  comparison has been made.
- `proof`: [Research](research.md) examines these assumptions. No adoption,
  retention or margin result is established.

## Business goals and metrics

| Goal                  | Intended business outcome                                                                                       | Metric and management use                                                                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project activation    | Turn a suitable user's available material into an accepted project foundation.                                  | Projects started, material supplied, sections completed, corrections before acceptance and unresolved contradictions; improve intake and structuring.                                         |
| Landing page          | Turn accepted project decisions into a saved preview and, when requested, a public site controlled by the user. | Sandboxes created and revised; GitHub connections, repositories created, servers connected, successful deployments and updates; keep preview activity distinct from public customer response. |
| Continued value       | Help the user develop, question and apply ideas from the accepted project context.                              | User-rated useful discussions, accepted criticism, later materials, return use and repeated-input problems; improve work that creates a reason to continue.                                   |
| Revenue and retention | Earn token purchases and continued paid use.                                                                    | Purchases, repeat purchases and attributable service costs; assess the offer's economics.                                                                                                     |
| Framework deployment  | Use Code Framework when the landing page or another concrete software need must run on the user's server.       | Repository connections, deployment starts, successful deployments, failures and later updates, separate from chat purchases.                                                                  |

These are intended outcomes. Numerical targets, time-to-site claims, customer gains, market response and revenue forecasts are unset.
