---
confirmation:
  confirmed: true
  by: operator
  at: 2026-09-17
  source: "Operator confirmed the complete current AI Chat Website Overview in
    chat: «Так, страницу подтверждаем. Теперь давай переходим дальше к
    посадочной»."
  content_sha256: c9caa468b93440f6b5c8f0a8315937c8e9a0fd6d5bb2a970d7e487295641606a
sources:
  framework_handoff:
    classification: client-claim
    source: apps/studio/workspace/brief/singlepage.md#intake.framework_preparation_journey
    date: 2026-10-24
    supports: AI Chat prepares reviewed business and product documents that a person can export and give to a coding agent building with Code Framework.
    limitation: The manual export and development route does not establish automatic landing-page publication or hosted deployment availability.
  account_offer:
    classification: client-claim
    sources:
      - apps/studio/workspace/brief/singlepage.md#sources.ai_chat_commercial_terms
      - apps/studio/workspace/brief/singlepage.md#sources.ai_chat_allowance_and_pro
    scope: Existing token-account terms plus the operator's current Free allowance and monthly Pro offer; Product and its model own the calculation and settlement rules.
  source_behavior:
    classification: verified-fact
    inspected_snapshot: aa780be0f99f78f5d25802d259059cb1b66f4cb0
    sources:
      - libs/modules/rbac/models/subject/README.md
      - libs/modules/knowledge/README.md
      - apps/studio/modules/host/layout/singlepage/ai-chat-landing/routes.ts
    supports: One owned token amount, verified account-email edits, project selection, title-only ordinary threads with all profile-linked Knowledge and supported attachment analysis.
    limitation: Committed source establishes these contracts, not deployed readiness. Selected-document presentation is proposed and does not establish a narrower retrieval scope; generated-image answers are outside the current text-answer policy.
route_intent:
  landing: /
  projects: /ai-chat/projects
  new_project: /ai-chat/projects?create=1
  framework: /framework
  public_token_catalog: /ecommerce
  account_preview_namespace: /ai-chat/
  account_preview_routes:
    registration: /ai-chat/rbac/subjects/authentication/registration
    sign_in: /ai-chat/rbac/subjects/authentication/select-method
    project: /ai-chat/social/profiles/[social.profiles.id]
    tokens: /ai-chat/rbac/subjects/tokens
    settings: /ai-chat/rbac/subjects/settings
    help: /ai-chat/help
  limitation: Root, projects and new-project entries are current source routes, with locale prefixes at runtime. Other listed account paths preserve Product simulation aliases; they do not establish the runtime destination. The legacy direct-create simulation at /ai-chat/social/profiles/create remains distinct from the project chooser.
review:
  dependencies:
    brand: c11095b305b2ccb166e46b5d488d95a74a1c541bcabb4fd22b44ed243e848a73
    design: 467a919279dda57ee7fb3966994a6f68c5d6f39f6e6b5d41aa12fa94485c982a
    product.ai-chat.product: 49726d69fab8cad21164c4df5e568d4e6e1a2abb60d7d2fa3dee1f2bfebe7c70
    product.ai-chat.sales: f765054d5282a8c8a02a98e1fab7e1338c1f4df231b7d77318b0ec4d684ab82a
    strategy: 75701c732f48b6bbe5574855fed8d5d05aa7e8a18741d2eec1f14125fa023fd5
---

# AI Chat website

## Objective and customer result

AI Chat helps a person starting a business work with the notes, files, photos and plans they already have. The person chooses or names a project, uploads existing material and follows the analysis before opening the document chats. The AI agent checks it, identifies gaps, asks questions and drafts short project and product documents. Each generated document opens its own working thread for questions, discussion and edits. The person reviews and saves the text, then names separate project threads for continued work. The assistant can use all Knowledge linked to that project's profile.

The documents cover a shortened Brief, Strategy, Brand and written Design, plus separate Products. Each product keeps its own customer and offer, Operations & Economics, Sales, Promotion, Analytics and applicable research. The customer can freely export the text and use it outside AI Chat.

For a person who wants a landing page or web product, those reviewed documents become a development brief. The person exports the files and gives them to a coding agent working with Code Framework. AI Chat prepares and continues the written work; the coding agent changes the code, and the person reviews the resulting product. Export is included. Code Framework is free; paid tokens cover continued AI Chat work.

The first session is planned for about one focused hour. The person can pause with open questions and return to the files, drafts and each thread's conversation. A completed section reflects the person's review; it does not establish demand or make an unsupported statement true.

Automatic landing-page creation inside AI Chat and paid server deployment belong to later development. The first release delivers written documents and continued work in chat. Future deployment prices and availability are undefined.

## Customer journey and site structure

| Route                                                 | Customer situation and page responsibility                                                                                                               | Primary next action                                                                              |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `/`                                                   | Recognize a place to bring project material, see the chat and try reviewing and editing a document.                                                      | **Start with my files** → `/ai-chat/rbac/subjects/authentication/registration`                   |
| `/ai-chat/rbac/subjects/authentication/registration`  | Create an account with email and password and see the current free token allowance.                                                                      | Continue to `/ai-chat/projects`.                                                                 |
| `/ai-chat/projects`                                   | Choose an owned project, see an empty account or retry a failed list load.                                                                               | Open the selected project or choose **New project**.                                             |
| `/ai-chat/projects?create=1`                          | Name a new project without losing existing projects.                                                                                                     | Create its workspace and add materials; Cancel returns to project selection.                     |
| `/ai-chat/rbac/subjects/authentication/select-method` | Return to the last project or interrupted task.                                                                                                          | Continue working                                                                                 |
| `/ai-chat/social/profiles/[social.profiles.id]`       | Choose a project; add materials, edit document threads and manage that project inside its chat.                                                          | Open a file, create a topic or export                                                            |
| `/ai-chat/rbac/subjects/tokens`                       | Top up voluntarily or resume saved work after the balance reaches −2,000 internal tokens or lower.                                                       | Buy tokens and return to the saved task                                                          |
| `/ai-chat/rbac/subjects/settings`                     | Verify an email change, change the password, view purchases and manage account deletion.                                                                 | Save a setting or return to work.                                                                |
| `/ai-chat/help`                                       | Get help with access, materials, documents, export, chat or payment.                                                                                     | Send a support request                                                                           |
| Reviewed project documents, inside the workspace      | Decide whether the accepted description is ready to brief a coding agent. Show reviewed files, unresolved facts and the option to continue written work. | **Export for development** → selected reviewed files; **Explore Code Framework** → `/framework`. |
| `/framework`                                          | Understand the common functions, local development process and what the coding agent can reuse.                                                          | Read module explanations or GitHub instructions, then develop with the exported documents.       |
| `/blog` and `/blog/articles/[slug]`                   | Learn how the framework's actual components, API and modules work.                                                                                       | Read an architecture example, open its source or return to the project brief.                    |
| `/ecommerce`                                          | Compare monthly Pro and token top-ups before opening the owning account purchase flow.                                                                   | Retain the chosen offer and continue to `/ai-chat/rbac/subjects/tokens`.                         |

`/ai-chat/projects` shows project selection, with distinct loading, error, empty and populated states. **New project** opens `/ai-chat/projects?create=1`; creation asks for a name and continues to the workspace. Guests sign in before reading or creating owned projects. After creation, the intended sequence is material upload, analysis and document chats. Materials, document threads and future website or deployment workflows appear inside chat rather than as separate site pages.

## Key product interactions

### Files and review in chat

The project chooser opens an existing project or a name form for a new one. After creation, a separate upload screen accepts PNG, JPG, WebP, GIF, PDF, TXT, MD, CSV and JSON, with an optional explanation. Analysis has its own screen with progress, supplied sources, document drafts and missing information. The person then opens each document as a chat with the AI agent. The document structure becomes visible during review.

An attachment opens a centered preview for supported images, PDF, Markdown or text, with original-file and download actions when an inline view is unavailable. Existing SVG and SVGZ originals stay stored, with an unsupported-format message; they are unavailable for analysis, model context or active preview. AI Chat produces text answers and can analyze supported supplied images. Generated-image production is a separate future capability.

The AI agent checks the material, links extracted statements to their sources and identifies missing facts or contradictions. It asks about the next unresolved point in chat. An answer updates the affected project or product draft for the person's review. Missing information stays visible when the person cannot answer it.

Registration and upload show [How your materials are processed and stored](/ai-chat/social/profiles/example#how-your-materials-are-processed-and-stored) before files are supplied. Settings links to the same disclosure before deletion.

### Chat tools and project settings

The account can hold several projects. The chat has a project selector and a **New project** action. Each project follows name creation, upload, analysis, document chats and project threads. After setup, materials and future website tools remain available inside the workspace. Switching tools or projects preserves the owning project's work. The detailed document sections remain available inside each file's thread.

**Project settings** inside chat contains the selected project's name, products, documents and export actions. Account Settings contains verified email changes, password changes, purchases and account deletion. Changing the email verifies the current address first, then the new address; a failed verification preserves the existing email and offers another code when available.

Every authenticated header shows one owned token amount containing granted and purchased credits. The value can be negative and opens the token page, which shows the same amount. It does not imply separately accounted Free and paid balances. A missing balance is shown as unavailable rather than zero.

### Project and product documents

| Project document | Working content                                                                       |
| ---------------- | ------------------------------------------------------------------------------------- |
| Brief            | The idea, current situation, intended result, boundaries and supplied material.       |
| Strategy         | The intended customer, the role of each product and the way the project will operate. |
| Brand            | The promise, available evidence, voice and calls to action.                           |
| Design           | A written visual direction, existing assets and constraints.                          |
| Products         | Separate product descriptions with their own customer, offer and working sections.    |

| Section within each product | Working content                                                                |
| --------------------------- | ------------------------------------------------------------------------------ |
| Product                     | Customer, problem, offer and scope.                                            |
| Operations & Economics      | Operating and money decisions, including allocated shares of shared resources. |
| Sales                       | Customer steps, decisions, payment and support.                                |
| Promotion                   | Website, Creative and Presentation texts where relevant.                       |
| Analytics & Research        | Questions, evidence and research where needed.                                 |

Each file has a working thread with its own conversation, editable draft and review state. Opening Brief.md, Strategy.md, Brand.md, Design.md or Products.md returns to that file's discussion and edits. The person answers the agent's questions there, edits directly or requests a revision, then reviews and saves the section.

The project shows each section's state and how many sections the person has reviewed. A section with an unanswered required fact remains incomplete. The indicator reflects missing answers and review, not text length, an AI confidence score or proof that the business will succeed. The person can save incomplete work and continue later. A document's last reviewed version remains available while a new draft is being edited. The new text replaces that version after review.

### Continued chat and export

The general project workspace holds separate discussion topics. The person gives a topic a title and creates a conversation with the current assistant profile. All Knowledge linked to that profile is available for replies. A connected skill is used explicitly with `/skill-slug`; an ordinary thread does not select a profession automatically. Document changes return to the owning file's thread for proposed-text review.

The intended document-selection view shows reviewed files as task references and preserves their last reviewed versions while a new draft is edited. It does not restrict the assistant to those selected files: other Knowledge linked to the project remains available. Thread creation itself needs a title; document-review gates shown in the interactive walkthrough describe its guided preparation sequence.

The person can freely export the documents and use them outside AI Chat. An unanswered fact stays open, and a contradiction remains visible until it is resolved. Acceptance does not invent evidence or guarantee that the business will work.

### From reviewed documents to Code Framework

The development handoff appears beside export and the selected project's reviewed documents. It becomes useful when a person has a customer, offer or page they want to develop; it does not interrupt material upload or require every document to be complete. A person who only wants continued discussion can stay in the workspace.

The panel heading is **Ready to turn these documents into a product?** Its copy is **Export the documents you have reviewed. Give them to your coding agent and use Code Framework for the accounts, content, orders or payments your product needs.** The actions are **Export for development** and **Explore Code Framework**. The second action opens `/framework` and retains the saved project as the return destination. It does not upload private documents to a public page.

Export lists the available documents and their review state. The person selects the reviewed files to include. A revised draft does not replace the last reviewed version in the export until it has been reviewed and saved. Missing customer, offer or required business facts remain visible; the interface lets the person return to the owning document rather than filling the gap automatically. A failed export preserves the files and selected documents and offers retry.

The handoff supplies a copyable development request: **Use the attached reviewed documents to plan a first landing page with SinglePageStartup Code Framework. Inspect the existing modules, keep unanswered facts visible and show me the first changes to review.** Copy feedback is **Development request copied. Attach your exported documents in your coding agent.** Copying the request does not copy or expose private file contents. The person opens their chosen coding agent and attaches the exports there.

The Framework page has a direct **Prepare my business in AI Chat** return route for a visitor without a usable brief. The shared Blog explains module and architecture choices; the token catalogue explains continued hosted work. These destinations accompany the task they support. The AI Chat landing continues to lead with material preparation; the development handoff appears with export and in the footer.

### Token purchase

Registration includes a one-time Free allowance of 3,000 tokens. It is an account grant, with no Free product to purchase. Pro includes 5,000 tokens per month for USD 29 or RUB 1,900. The chosen currency, monthly interval and included quantity are visible before payment. Token top-ups remain available separately for continued work.

The balance remains visible, including below zero. At −2,000 internal tokens or lower, equivalent to −USD 2 of provider cost, new paid AI requests are restricted. A top-up above that threshold restores work at the saved point; the user may top up earlier.

The purchase page shows top-ups of 100, 300, 500, 1,000 and 3,000 roubles at 0.13 roubles per internal token, without package discounts. Tokens do not expire. Cash refunds for purchases are decided case by case.

One token is charged when input is sent. A successful answer settles at actual provider cost, rounded up to a whole internal token, with a minimum of one token. Failed or cancelled AI requests restore all deductions, including the initial token and any settlement charge. Their net charge is zero; the service bears provider expense.

A failed or cancelled payment preserves the saved work and token balance. Explain the payment result and offer retry or support.

The public token catalogue and account purchase page describe the same offers. A guest signs in before an account purchase, with the chosen offer and saved return destination retained. A person can return without buying. Offer selection in an interactive Product walkthrough reports **Offer selected** and never reports payment success, a credited balance or an active subscription without that result.

### Future landing page and deployment

After evaluation and improvement of the document workflow, the AI agent will build a landing page from reviewed project descriptions, with the purpose of collecting initial enquiries and testing a hypothesis. The future workflows inside chat describe a block-based preview, a GitHub repository in the user's account and deployment on a connected server.

These branches are outside the first release. Future deployment is a paid offer with prices and availability not yet set. The chat's future website tool holds the planned workflows with creation and publication disabled. Code Framework is the existing software foundation for the manual development route. A person can export reviewed documents and use it with a coding agent independently of this future hosted flow.

### Settings and recovery

If a text edit fails, keep the last saved document, identify the failed action and offer retry or support. If a setting cannot be saved, keep its previous value. Deletion names the affected data, links to the processing and backup disclosure and asks for confirmation with Cancel selected.

Future preview failures preserve saved page data and identify the affected content, block or rendering step. Future connection or deployment failures preserve the repository and last working deployment, name the failed step and permit retry without rebuilding the page. These recovery paths belong to the future views.

## Page copy and metadata

Title: **Your notes, photos and plans. One project chat.**

Description: **Upload what you have. Work with AI in each document's thread, then attach saved files to new project conversations.**

The main action is **Start with my files**. Returning users see **Sign in**. The landing invites visitors to **Try the chat** before registration. Current workspace actions include **Check materials**, **Open document**, **Save and review section**, **Send message**, **New topic**, **Attach saved documents**, **Create topic**, **Export the documents** and **Buy tokens**.

### Public landing composition

The compact opening pairs a dark graphite copy panel and lime registration action with the solo founder photograph. The headline names notes, photos, plans and chat. The lead describes upload, checking, work in each document's thread and new topics using saved files. The photograph portrays one person at the start of a project; it represents no real customer or result. Living Focus keeps Onest, cool white, graphite and lime.

The next section lets the visitor try the working sequence through a pottery-workshop project. Three supplied files sit beside five document threads. Checking the files opens an audience question with an editable answer already filled in. **Send answer** opens Products.md with Customer, Offer and Format filled from the walkthrough material and answer. **Save and review section** is active, and the visitor clicks it to review the document. The section count changes from zero reviewed to one of five. Each document opens its own conversation and editor; sending a message or editing one file leaves the other threads unchanged. The walkthrough keeps questions visible and permits a restart.

After saving a document, the visitor opens the general project workspace and names a topic. The proposed reference selector keeps chosen saved files visible beside the conversation; it does not establish a restricted retrieval scope. Returning to a document restores that file's discussion and draft. Editing it preserves its last reviewed version until the visitor reviews and saves the revision. The visitor can create another topic with different task references and a separate conversation. The pottery project is a fictional walkthrough, not an attributable customer case or evidence of a business result. The interface states **Interactive walkthrough; changes stay in this page.**

The page uses the chat, file rows, document editor and review indicator to explain the product. A short four-step strip supplies the sequence without a long document catalogue. The complete project and per-product structure belongs to the overview and Presentation. Future development and deployment do not occupy the public landing.

Access, token charging, refunds, the debt threshold, support and material processing sit in one labelled expandable area. The page ends with the same registration action and a short export statement. Narrow layouts keep the current action, chat and document controls readable without placing a wide workspace beyond the canvas.
