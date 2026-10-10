---
confirmation:
  confirmed: true
  by: operator
  at: 2026-09-17
  source: "Operator confirmed the complete revised Business workspace in chat: «Здесь всё окей, можно подтверждать и давать следующую страницу»."
  content_sha256: b6dcff3727fcebc01171b581bd96aa6fb45cb9273193633a6153ca84d36e8321
review:
  dependencies:
    product.ai-chat.page.content.project-model: f17aa0f1649f24c00b387547fb0800c632db2e752cdc54fd696b53e07d8a3473
    product.ai-chat.website: db31acbb2f6bff59d196207b3f6245f4fc7674dbe685f71a18c890fef7e2d2cf
---

# Project chat

Open a document's working thread to discuss and edit it with the AI agent. Each file keeps its own conversation, draft and review state. The agent points out gaps and proposes changes; review the text before saving it. In the general project workspace, create separate threads and attach selected saved documents for each conversation. The documents remain available for export.

## Choose and manage a project

The project selector lists this account's projects. **New project** first asks for a name. Creating the named project opens its material-upload screen. Switching projects preserves each project's name, files, messages and document drafts.

**Project settings** belongs to the selected project. Rename it, open its products and document threads, or export its current texts. Password changes, purchases and account deletion remain in account Settings. The profile menu shows the account's remaining free and purchased tokens, including a negative balance, and links to token purchases and account Settings. Export reviewed documents appears below the project-name form.

## Project setup

| Step             | Screen and action                                                                                                                                          |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Name**      | Enter a project name and create its workspace.                                                                                                             |
| **2. Materials** | Upload documents, notes and images, with an optional explanation. Review the processing disclosure before upload.                                          |
| **3. Analysis**  | Follow the analysis progress, inspect the supplied sources and see which document drafts need information. Open the document chats when analysis is ready. |
| **4. Documents** | Discuss each file with the AI agent, review proposed changes and edit its sections. Save the version you have checked.                                     |
| **5. Work**      | Name a topic and attach selected reviewed documents as its knowledge base. Continue the conversation in that thread.                                       |

Upload and analysis are separate setup screens. Document chats have a file list, conversation, message composer and editable document. Each file retains its own messages and draft when you switch files. Project threads become available after the first document has a reviewed version; other files can remain unfinished.

The arrow beside **Documents** collapses or opens the document list while keeping project threads visible. Opening or creating a project thread collapses the list automatically. The account navbar stays visible at the top while scrolling. The selected conversation header sticks below it. On mobile, the menu icon in the conversation header opens a drawer below the navbar containing project settings, documents and threads; selecting an item closes the drawer. The navbar remains accessible above the drawer. On wider screens, the same icon hides or shows the navigation panel; the selected conversation, messages and drafts remain in place. On mobile, Help and the project picker open from the header menu; the profile icon to the left of the menu button opens its own dropdown. On wider screens, Help and the project picker remain visible beside Profile. Working on uses a menu with checkboxes for multiple sections. Analysis progress uses the same lime accent and rounded track as the other controls.

Setup steps stay in one horizontal row, with scrolling to the screen edges when needed. Completed steps show a check circle; pressing it opens the step explanation. Current and future steps keep their labels.

The sidebar groups **Settings** and **Documents** in one navigation block, each with an icon. Documents uses a folder icon and shows the file count and its expandable list. The whole Documents block has a darker background, with a permanently grey button above the inset list. The file list stays in one column at every screen width. File rows use the same grey highlight on hover and when selected. File names appear on a single row without a Draft label; a green circle with a dark grey check to the right marks a reviewed document and disappears when that document changes. **Threads** follows below this block. When New thread is unavailable, hovering over or focusing it shows that at least one document must be filled in and saved as reviewed.

On mobile, the conversation log is at least half a screen high, with the message composer below it.

The document shown in Document is included in its chat automatically. Working on sits in the message composer: choose the whole document, one section or several sections. Selecting a section's discussion action opens chat with that section selected. Each reply records the scope and context used; later selection or document edits leave that record unchanged. Document chat replies show the context they used in a compact disclosure. Project threads show their current context documents in the header. The agent profile shows only the role.

Attach documents or images directly in a document chat or project thread. The composer shows the selected files, with image previews and a removal button for each attachment. Send them with a message or on their own. Press ⌘ Enter on Mac or Ctrl Enter on Windows to send; Enter adds a new line. Unsent attachments stay with their own conversation when switching documents, threads or projects. Sent files remain beside the message and in that conversation's context. Attach a sent file to a document section when it belongs there; document changes and file approval still require review. After Brief has a reviewed version, document chats use it without repeating the original notes and source text as separate context items.

## References and generated files

Uploaded images retain their originals and appear as previews in Brief’s Visual reference intake and Design’s Outputs and provenance sections. Their contents and intended use remain open until discussed and reviewed. Classify visual references as identity, interface and website, typography, photography, illustration or marketing creative, then attach them to the relevant document section.

Each section holds references and generated files alongside its text. Attach an existing project file or upload another one. A file card shows its preview, origin, category, intended use and review status. Generated files also retain the generation prompt and tool; a prepared square delivery can be linked to its original. Both files remain available for download. Approving a file is a separate action from reviewing the document text.

Reviewed document versions include the attached files and their metadata. Later edits or detachment leave the last reviewed version available to project threads until the revised document is reviewed. Thread messages retain the file context used for that answer.

## Project stages

| Section      | What you review                                                                                                                 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| **Brief**    | The project, current situation, products, intended result, boundaries, constraints and supplied material.                       |
| **Strategy** | Priority audiences, product roles, positioning, customer paths, channels and measures of success.                               |
| **Brand**    | Meaning, promise, supported claims, evidence, voice, objections and calls to action.                                            |
| **Design**   | A written description of the visual direction, existing assets and constraints.                                                 |
| **Products** | Separate products with their own descriptions, operations and economics, Sales, Promotion, Analytics and research where needed. |

Selecting Brief.md, Strategy.md, Brand.md, Design.md or Products.md opens that file's thread, with its conversation and editable text. Selecting a product opens that product's own sections:

| Product section            | Contents                                                                                                                                                |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Product**                | Customer, problem, offer, value and conditions.                                                                                                         |
| **Operations & Economics** | Delivery, revenue, resources, activities, partners, costs and financing owned by this Product. Shared resources include this Product's allocated share. |
| **Sales**                  | Discovery, evaluation, purchase, delivery, use, support and continued use.                                                                              |
| **Promotion**              | A written description of how this product will be presented publicly, with Website, Creative and Presentation texts where relevant.                     |
| **Analytics & Research**   | Measures, observations, questions and evidence needed to examine this Product's assumptions.                                                            |

Text is marked **accepted**, **proposal**, **unknown** or **conflict**. Acceptance records your review of the wording, not proof that its assumptions are true. Resolve a supplied conflict or leave an unknown fact open; the agent does not invent an answer.

## Work with AI Chat

| Action                              | What happens                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| **Evaluate an idea**                | Compare it with your reviewed descriptions, examine its assumptions and weigh alternatives.                  |
| **Correct identified shortcomings** | Review what the AI agent points out and edit the affected description.                                       |
| **Change a section**                | Review a proposed revision before it replaces accepted text.                                                 |
| **Improve supplied material**       | Revise an uploaded document or draft written content using the reviewed project.                             |
| **Add another product**             | Create its own Product, Operations & Economics, Sales, Promotion, Analytics and research sections as needed. |
| **Export the documents**            | Download the current texts as Markdown or HTML and freely use them outside AI Chat.                          |

## Create a project thread

Choose **New thread**, give it a name and select the saved, reviewed documents to attach. **Create thread** opens a separate conversation with those attachments visible. Return to a thread to continue its discussion, or create another thread with different documents. Changes to a document are reviewed in that file's working thread.

On the thread creation screen, choose a preset agent, create your own role, or select **No agent**. No agent uses the selected model with the attached documents and conversation, without preset or custom role instructions. The open thread shows its attached documents, conversation and composer. An agent’s avatar beside a reply opens its role description. Replies retain the role and document context used at the time.

Attached document names appear on the right side of the thread header, beside its settings button. Thread settings lets you rename the thread, add or remove reviewed documents for future replies, or delete the thread and its messages after confirmation. Changing context documents preserves earlier messages and their recorded context. Removing every document leaves future replies with the conversation and its sent attachments. Closing settings without saving leaves the thread unchanged.

You can start a thread with one reviewed document while other sections remain unfinished. When you edit a reviewed document, project threads keep using its last reviewed version until you save the new text after review.

## Continue working

Documents remain visible beside the conversation. A green check marks a reviewed document; editing it removes the mark until the revised version is reviewed. The token balance remains visible. It may go below zero. At −2,000 internal tokens or lower, new paid AI requests are restricted; top up above the threshold to continue the saved task. Failed or cancelled AI requests restore all their token deductions for a net charge of zero.

If a text edit cannot be saved, keep the last saved description, name the failed action and offer retry or support. Proposed changes remain available for review. Export does not create another editable copy inside the workspace or establish rights in third-party inputs.

Landing-page generation and paid server deployment are future capabilities outside this first release. Their descriptions remain available under future capabilities; creation and publication are disabled.

[Buy tokens](/tokens) · [Add project material](/projects/example#materials) · [Export the documents](/projects/example#documents)

## Document fields

These fields remain available in each document's editor. The agent discusses the selected field in that document’s chat. The fields follow Studio’s canonical document templates; the question beside a file or section opens its purpose, completion guidance and methodological basis in a right-hand panel. Empty fields stay marked as unknown. A suggested edit requires an explicit **Apply to draft** action; **Save reviewed version** records the user's review, including any questions left open.

Each section has **Editor** and **Preview** modes. Filled sections open in Preview; empty sections open in Editor. Preview displays Markdown headings, lists, tables, links and emphasis. Editor retains the source text, including significant whitespace. Switching modes does not change the draft or its reviewed status. The downloaded document and agent context use this same Markdown.

<!-- document: brief -->

### Brief.md

| Field                   | Question or information to work through                                                                                                                                                     |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Project and products    | What is this project, which products belong to it, and what is outside its scope? Keep exact names, IDs, owners and current or intended availability.                                       |
| Customers and value     | Who uses, buys or benefits from the offer? Describe their situation, problem and the value currently delivered or intended.                                                                 |
| Current state           | What exists or has been observed? Attribute supplied statements, tested work, results and assets; distinguish them from intentions.                                                         |
| Business and resources  | What is known about channels, delivery, prices, revenue, funding, people, partners, costs and capacity? State units, sources and constraints.                                               |
| Goals and success       | What does the owner want to achieve, with which priorities, baseline, target and time horizon where supplied?                                                                               |
| Visual reference intake | Record identity and references for interface and website, typography, photography, illustration and marketing creative. Attach exact files and record preferences, rights and review state. |

<!-- document: strategy -->

### Strategy.md

| Field                       | Question or information to work through                                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Strategic direction         | Describe the intended marketing system, positioning and durable trade-offs that fulfill the reviewed Brief.                           |
| Audiences and product roles | Which audiences and situations matter, what value does each confirmed product deliver, and what behavior should it support?           |
| Growth system               | How do prioritized channels work together? Give each a role, audience, content or value, destination and growth mechanism.            |
| Customer journey            | Describe discovery, useful value, purchase or adoption, continued use and recommendations from the customer's perspective.            |
| Measurement and priorities  | Connect outcomes to observable signals and management decisions. State resource priorities and risks that could change the direction. |

<!-- document: brand -->

### Brand.md

| Field                         | Question or information to work through                                                                           |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Brand identity                | What are the exact public brand and product names, their relationship, naming rules and optional slogan?          |
| Intended perception           | What should the audience understand, trust and remember? Describe character, difference and impressions to avoid. |
| Meaning and message hierarchy | Connect the audience's situation to the promise, supporting proof, objections and next action.                    |
| Voice and language            | Define terminology, tone, sentence and evidence rules, with examples of suitable and unsuitable wording.          |
| Consistency rules             | Which naming, promise, evidence, commercial and support rules must hold across products and channels?             |

<!-- document: design -->

### Design.md

| Field                          | Question or information to work through                                                                                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Design intent                  | Describe the reviewed visual preferences, brand character, reusable graphic language and do/do-not rules. Keep all five taste categories distinct.                      |
| Identity application           | Describe how the approved name and identity assets appear in lockups and different contexts. Attach real sources.                                                       |
| Visual system                  | Define semantic colors, typography, weights, languages, licenses, fallbacks and their usage.                                                                            |
| Iconography                    | Name the library, version, source and license, or the custom drawing method. Specify the family, states, labels and actual glyph examples.                              |
| Interface and product surfaces | Define reusable layout, components, interaction states, accessibility and responsive principles. Product-specific pages belong to that product.                         |
| Photography                    | Define purpose, evidence limits, style prompt, production specification, example assets and the review gate. Preserve masters and prepare square deliveries separately. |
| Illustration and diagrams      | Define purpose, evidence limits, style prompt, production specification, example assets and the review gate for illustrations and diagrams.                             |
| Outputs and provenance         | Identify actual supplied and generated assets, originals and deliveries, prompts, tools, rights, review and permitted use.                                              |

<!-- document: products -->

### Products.md

| Field    | Question or information to work through                                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Products | List every confirmed product with a stable ID, name, summary and its own document. Retain drafts and products outside the current priority. |

<!-- document: product -->

### Product document

| Field                          | Question or information to work through                                                                                                                                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product identity               | State the brand, product name, category, lifecycle, owner and boundary.                                                                                                                                                                                 |
| Customer Segments              | Distinguish user, buyer, payer, beneficiary and decision-maker. Give segments stable IDs, qualifying situations, triggers and exclusions.                                                                                                               |
| Problem and desired progress   | Describe the customer's circumstance, desired progress, functional, social and emotional forces, pains and gains.                                                                                                                                       |
| Value Propositions             | Compare actual alternatives, differentiated capabilities and the customer value they enable. Link the offer to jobs, pains and gains.                                                                                                                   |
| Offer and usage                | Define access or deliverable unit, included and excluded scope, experience, support, rights and dependencies.                                                                                                                                           |
| Revenue Streams                | For each segment state payer, unit, price or pricing rule, currency, cadence, payment timing and conditions. For a free offer record the intended non-cash exchange separately from money revenue.                                                      |
| Key Activities                 | Which work creates and delivers the value, and who owns it? Reference the Sales process without duplicating it.                                                                                                                                         |
| Key Resources                  | Identify people, infrastructure, finance and intellectual resources, owners, availability and constraints. Record this product's share and allocation basis for shared resources.                                                                       |
| Key Partnerships               | Which suppliers and partners contribute, what do they do, and which dependencies or agreements have evidence?                                                                                                                                           |
| Cost Structure                 | Describe fixed and variable costs, amount, currency, period and calculation basis. Separate cash from founder time and state shared allocations. Include Funding: capital or subsidy provider, conditions and limits, separately from customer revenue. |
| Assumptions and decision rules | Give material assumptions stable IDs, sources and states, with signals and consequences for the affected decisions. Link the Research that tests them.                                                                                                  |
| Business goals and metrics     | Connect acquisition, customer value, adoption, revenue and continued use to relevant business signals and management decisions. Give numerical targets a basis.                                                                                         |
| Sales                          | Describe the complete customer process for each segment: discovery, evaluation, purchase or adoption, delivery, use, help and continued use. Reference the Product's money terms.                                                                       |
| Promotion                      | Describe this product's Website, Marketing Creative and Presentation where relevant, applying the reviewed Strategy, Brand and Design.                                                                                                                  |
| Analytics & Research           | Keep measured results, source and time window separate from research findings and hypotheses. Link findings to this Product's assumptions.                                                                                                              |
