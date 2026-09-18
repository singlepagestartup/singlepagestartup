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
  source: "Operator re-confirmed the current AI Chat Product on 2026-09-18 after
    the coordinator checked its body against the confirmed Brief and corrected
    the superseded audience-value-and-flow source record: «Да, оба». The
    2026-09-17 approval it replaces was stamped against a body the commit hooks
    then reformatted."
  content_sha256: 91f9368e4f450d3a1b82a775df616972fe8aab756c6890331292f5327fdc4d84
review:
  dependencies:
    brief: 875a271cca75b070f276f7ceced7e439bd642272c7b0b289166050ac0f3a82e0
    model.framework-service: 24505045708eaee8184c7d988841e54b6408be46051b785d18989c6329a14a80
    product.ai-chat.research: 6b9b404ced17a62287e65b1e631e3244c3258a5f4515483d60303bd4a9786a1b
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

AI Chat assembles this model through the SinglePageStartup method, developed through long-term work combining and adapting business, marketing and product-development methods. The document structure, ownership of decisions and links between sections are designed for work with AI agents: an agent can identify where a fact belongs, find gaps and contradictions, update the owning section and reuse accepted decisions in later work.

The resulting project model remains editable and can be exported as a document for use elsewhere. Inside AI Chat, the user can discuss an idea, request criticism, compare alternatives, update the relevant sections or prepare a material without restating the business. AI Chat uses what is already known, points out weak reasoning and asks only for information needed by the current decision.

The same foundation supports a landing-page sandbox assembled from SinglePageStartup blocks. Its offer and text come from the project decisions. Edits are stored with the project and appear immediately in the frontend preview. The preview itself has no public address.

When the user is ready to publish, the interface asks them to authenticate with GitHub and authorize access to the project repository. SinglePageStartup creates the repository in the user's account. The user then connects an existing server or opens an account with a hosting provider such as Beget or Timeweb and supplies the required deployment key. The system configures automatic deployment from the repository to that server. The authorized GitHub connection remains available so later approved changes can update the same repository and public site. Code Framework supplies the deployable SinglePageStartup blocks and application foundation.

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

Access uses email-and-password registration and login. The free portion becomes available after authentication; Google and other social sign-in are not planned. The intended implementation splits the project page, uploaded documents and permitted extensions into chunks, vectorizes them and retrieves the relevant parts as context for an answer. This technical mechanism stays out of the normal customer explanation.

The service sends the data needed for a request to selected AI model providers under their applicable terms. Account deletion removes the active account and project data controlled by SinglePageStartup. Infrastructure-provider backups may retain copies for up to six months under the provider's system process; the project cannot shorten that backup period. Generated project materials are produced within the service for the user's project. The current offer does not rely on third-party creative materials, while provider terms still govern model processing.

The interface shows the token balance during intake and continued work. When the balance is insufficient, the current work is preserved and the user can choose a token package, pay and return to the interrupted task. This purchase point may occur while materials are being processed, while documents are being refined or during later chat. [Revenue Streams](../models/framework-service/model.md#revenue-streams) owns token definitions and money terms.

When a site, chatbot or another digital product is needed, AI Chat introduces Code Framework in that context, names the relevant functions already available and leads to **Publish on my server**. For a landing page, the guided path connects GitHub, creates the repository, accepts the user's server key and configures automatic deployment. The interface shows this route beside relevant product and landing-page work. Token purchase is not required for this branch.

[Sales](sales.yaml) owns discovery, project intake, landing-page sandbox creation and review, repository and server publication, continued work, purchases, help and the contextual framework path. The project owner currently handles every service stage alone. Support requests are processed within 24 hours as the initial service level; continuous live coverage is not promised.

The SinglePageStartup creator operates AI Chat and owns its hosting and domain management. The landing-page sandbox is available only inside the workspace. Publication uses a repository in the user's GitHub account and a server or hosting account controlled by the user. The user authorizes the repository access required to create it and apply later approved changes, then provides the deployment key required by the connected server. The exact GitHub authorization scope, supported hosting providers, key lifecycle, domain connection and failure recovery remain implementation decisions. The payment-accepting party is in Russian jurisdiction and will use an online cash register. Token price, unit, packages, payment timing, expiry, refunds and the exact legal/payment details still need definition. These open commercial terms belong to AI Chat; they do not change the free framework offer. AI Chat does not act on behalf of the business or guarantee market results.

## Business goals and metrics

| Goal                  | Intended business outcome                                                                                       | Metric and management use                                                                                                                                                                     |
| --------------------- | --------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project activation    | Turn a suitable user's available material into an accepted project foundation.                                  | Projects started, material supplied, sections completed, corrections before acceptance and unresolved contradictions; improve intake and structuring.                                         |
| Landing page          | Turn accepted project decisions into a saved preview and, when requested, a public site controlled by the user. | Sandboxes created and revised; GitHub connections, repositories created, servers connected, successful deployments and updates; keep preview activity distinct from public customer response. |
| Continued value       | Help the user develop, question and apply ideas from the accepted project context.                              | User-rated useful discussions, accepted criticism, later materials, return use and repeated-input problems; improve work that creates a reason to continue.                                   |
| Revenue and retention | Earn token purchases and continued paid use.                                                                    | Purchases, repeat purchases and attributable service costs; assess the offer's economics.                                                                                                     |
| Framework deployment  | Use Code Framework when the landing page or another concrete software need must run on the user's server.       | Repository connections, deployment starts, successful deployments, failures and later updates, separate from chat purchases.                                                                  |

These are intended outcomes. Numerical targets, time-to-site claims, customer gains, market response and revenue forecasts are unset.
