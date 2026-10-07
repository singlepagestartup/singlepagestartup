---
confirmation:
  confirmed: true
  by: operator
  at: 2026-09-17
  source: "Operator confirmed the complete current AI Chat Website Overview in
    chat: «Так, страницу подтверждаем. Теперь давай переходим дальше к
    посадочной»."
  content_sha256: c9caa468b93440f6b5c8f0a8315937c8e9a0fd6d5bb2a970d7e487295641606a
review:
  dependencies:
    brand: 83560cbabdd3b93b883965c9dc409e11ca0f3ca5fa9fee61a1da2eefa50fa7ca
    design: 29967227ba81c137910289b30db8f2450b978369ea2f09f9e4020a2e2947a2d1
    product.ai-chat.product: 5212a0163b9d453689340ff925ed6d6d94d729e0c890e8e0d75209b6e6eb50bb
    product.ai-chat.sales: 79f28a18291ea9aeffdbc17c4218f2327421e23092f86dc7540319e09ce66ede
    strategy: 52e2689631863b62a99a9bc849739ff248247183179044a87fc6fdff2e2a6cbc
---

# AI Chat website

## Objective and customer result

AI Chat helps a person starting a business work with the notes, files, photos and plans they already have. The person names a project, uploads existing material and follows the analysis before opening the document chats. The AI agent checks it, identifies gaps, asks questions and drafts short project and product documents. Each generated document opens its own working thread for questions, discussion and edits. The person reviews and saves the text, then creates topics in the general project workspace with selected saved documents attached as their knowledge base.

The documents cover a shortened Brief, Strategy, Brand and written Design, plus separate Products. Each product keeps its own customer and offer, Operations & Economics, Sales, Promotion, Analytics and applicable research. The customer can freely export the text and use it outside AI Chat.

The first session is planned for about one focused hour. The person can pause with open questions and return to the files, drafts and each thread's conversation. A completed section reflects the person's review; it does not establish demand or make an unsupported statement true.

Landing-page creation and paid server deployment belong to later development. The first release delivers written documents and continued work in chat. Future deployment prices and availability are undefined.

## Customer journey and site structure

| Route                    | Customer situation and page responsibility                                                          | Primary next action                     |
| ------------------------ | --------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `/`                      | Recognize a place to bring project material, see the chat and try reviewing and editing a document. | **Start with my files** → `/register`   |
| `/register`              | Create an account with email and password and see the current free token allowance.                 | Continue to `/projects/new`             |
| `/login`                 | Return to the last project or interrupted task.                                                     | Continue working                        |
| `/projects/[project-id]` | Choose a project; add materials, edit document threads and manage that project inside its chat.     | Open a file, create a topic or export   |
| `/tokens`                | Top up voluntarily or resume saved work after the balance reaches −2,000 internal tokens or lower.  | Buy tokens and return to the saved task |
| `/settings`              | Change the password, view purchases and manage account deletion.                                    | Save a setting or return to work        |
| `/help`                  | Get help with access, materials, documents, export, chat or payment.                                | Send a support request                  |

`/projects/new` opens the project-name screen. After creation, the workspace shows material upload, analysis and document chats in that order. Materials, document threads and future website or deployment workflows appear inside chat rather than as separate site pages.

## Key product interactions

### Files and review in chat

The starting screen asks for a project name. After creation, a separate upload screen accepts notes, documents and images, with an optional explanation. Analysis has its own screen with progress, supplied sources, document drafts and missing information. The person then opens each document as a chat with the AI agent. The document structure becomes visible during review.

The AI agent checks the material, links extracted statements to their sources and identifies missing facts or contradictions. It asks about the next unresolved point in chat. An answer updates the affected project or product draft for the person's review. Missing information stays visible when the person cannot answer it.

Registration and upload show [How your materials are processed and stored](/projects/example#how-your-materials-are-processed-and-stored) before files are supplied. Settings links to the same disclosure before deletion.

### Chat tools and project settings

The account can hold several projects. The chat has a project selector and a **New project** action. Each project follows name creation, upload, analysis, document chats and project threads. After setup, materials and future website tools remain available inside the workspace. Switching tools or projects preserves the owning project's work. The detailed document sections remain available inside each file's thread.

**Project settings** inside chat contains the selected project's name, products, documents and export actions. Account Settings contains password changes, purchases and account deletion. The email address is an account identifier, with no email-editing form in Settings.

Every authenticated header shows the remaining account balance: free tokens plus purchased tokens. The value can be negative and opens the token page, which shows the same balance and its breakdown. A missing balance is shown as unavailable rather than zero.

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

The general project workspace holds separate discussion topics. The person names a topic and selects which saved, reviewed documents to attach. Each topic keeps its own conversation and visible attachments. The agent uses those documents to develop an idea, question a decision or prepare written material. Document changes return to the owning file's thread for review.

One reviewed document is enough to create a topic; other sections may still have open questions. If an attached document has a new draft, the topic uses its last reviewed version until the new text is reviewed and saved.

The person can freely export the documents and use them outside AI Chat. An unanswered fact stays open, and a contradiction remains visible until it is resolved. Acceptance does not invent evidence or guarantee that the business will work.

### Token purchase

The balance remains visible, including below zero. At −2,000 internal tokens or lower, equivalent to −USD 2 of provider cost, new paid AI requests are restricted. A top-up above that threshold restores work at the saved point; the user may top up earlier.

The purchase page shows top-ups of 100, 300, 500, 1,000 and 3,000 roubles at 0.13 roubles per internal token, without package discounts. Tokens do not expire. Cash refunds for purchases are decided case by case.

One token is charged when input is sent. A successful answer settles at actual provider cost, rounded up to a whole internal token, with a minimum of one token. Failed or cancelled AI requests restore all deductions, including the initial token and any settlement charge. Their net charge is zero; the service bears provider expense.

A failed or cancelled payment preserves the saved work and token balance. Explain the payment result and offer retry or support.

### Future landing page and deployment

After evaluation and improvement of the document workflow, the AI agent will build a landing page from reviewed project descriptions, with the purpose of collecting initial enquiries and testing a hypothesis. The future workflows inside chat describe a block-based preview, a GitHub repository in the user's account and deployment on a connected server.

These branches are outside the first release. Future deployment is a paid offer with prices and availability not yet set. The chat's future website tool holds the planned workflows with creation and publication disabled. Code Framework remains a separate existing software product, not evidence that AI Chat's future deployment flow is available.

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

After saving a document, the visitor opens the general project workspace, names a topic and selects saved files to attach. The topic opens its own conversation and uses the actual saved text. Returning to a document restores that file's discussion and draft. Editing it preserves its last reviewed version for topic use until the visitor reviews and saves the revision. The visitor can create another topic with different attachments and a separate conversation. The pottery project is a fictional walkthrough, not an attributable customer case or evidence of a business result. The interface states **Interactive walkthrough; changes stay in this page.**

The page uses the chat, file rows, document editor and review indicator to explain the product. A short four-step strip supplies the sequence without a long document catalogue. The complete project and per-product structure belongs to the overview and Presentation. Future development and deployment do not occupy the public landing.

Access, token charging, refunds, the debt threshold, support and material processing sit in one labelled expandable area. The page ends with the same registration action and a short export statement. Narrow layouts keep the current action, chat and document controls readable without placing a wide workspace beyond the canvas.
