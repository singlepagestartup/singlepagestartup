---
confirmation:
  confirmed: false
sources:
  source_contract:
    classification: verified-fact
    inspected_snapshot: aa780be0f99f78f5d25802d259059cb1b66f4cb0
    sources:
      - libs/modules/rbac/models/subject/README.md
      - libs/modules/knowledge/README.md
    supports: The project chooser opens at /ai-chat/projects, direct creation at /ai-chat/projects?create=1, and ordinary threads use a title, current assistant and all Knowledge linked to the profile. New uploads use the supported image, PDF and text formats.
    limitation: Supplied Product state is not a real session. Document-reference selection is a proposed presentation feature and does not prove a restricted retrieval scope.
route_intent:
  projects: /ai-chat/projects
  create: /ai-chat/projects?create=1
  product_simulation_alias: /ai-chat/social/profiles/create
review:
  dependencies: {}
---

# Create a project and add your materials

Choose an existing project, or use **New project** and enter a name. The next screen accepts your notes, supported files and images, with an optional description. Continue to a separate analysis screen, where the AI agent checks the material and prepares the project and product documents. Open a document's working thread to discuss and edit that file with the agent, then save the section after review. The first session is planned for about one focused hour; you can pause or leave a question open.

[Choose a project](/ai-chat/projects) · [New project](/ai-chat/projects?create=1)

## Create the project, upload and analyze

**Project name:** Name the workspace before adding material.

**Project notes:** What are you working on, what already exists and what result do you need?

**Attach files:** Add PNG, JPG, WebP, GIF, PDF, TXT, MD, CSV or JSON. The attached files remain visible in the upload list and later beside the document chats. Open supported images, PDF, Markdown or text in a centered preview, with original-file and download actions when an inline view is unavailable. Existing SVG and SVGZ originals remain stored, with an unsupported-format message; they are unavailable for analysis, model context or active preview.

Before uploading, read [How your materials are processed and stored](#how-your-materials-are-processed-and-stored).

**Analyze materials** opens the analysis screen. It shows progress, supplied sources and draft readiness. **Open document chats** becomes available when analysis is ready.

The AI agent shows the proposed texts, their supplied sources and the shortcomings it identifies. Correct an inaccurate statement, resolve a contradiction or answer a question that affects the description. Unknown prices, budgets, rights, capacity and evidence stay unknown until a supplied source or your answer establishes them. Nothing is accepted automatically.

## Five short text stages

| Stage        | Written result                                                                                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Brief**    | The project, current situation, products, intended result, boundaries, constraints and supplied material.                                             |
| **Strategy** | Priority audiences, product roles, positioning, customer paths, channels and measures of success.                                                     |
| **Brand**    | Meaning, promise, supported claims, evidence, voice, objections and calls to action.                                                                  |
| **Design**   | A text description of the visual direction, existing assets, interface principles and constraints.                                                    |
| **Products** | Separate product descriptions, each with its own customer and offer, operations and economics, Sales, Promotion, Analytics and research where needed. |

The AI agent drafts these shortened texts using the same stages as Workspace. Design describes intended appearance; this step does not generate the visual identity or build a landing page.

## Review each product separately

| Product section            | What you review                                                                                                                     |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Product**                | Its customer, problem, offer, value, alternatives and conditions.                                                                   |
| **Operations & Economics** | How this product is delivered, its revenue, resources, activities, partners, costs and financing.                                   |
| **Sales**                  | How customers discover, evaluate, buy, receive and use it, including support and continued use.                                     |
| **Promotion**              | A written description of how this product will be presented publicly, with Website, Creative and Presentation texts where relevant. |
| **Analytics & Research**   | Measures, observations, questions and evidence needed to evaluate its assumptions. Include research where the decision needs it.    |

Each Product owns its economics. When products share a resource, each states its allocated share under the same resource identifier. The economics view displays these Product decisions rather than introducing a shared model between products.

## Correct, review and accept the texts

1. Read the draft for the selected project stage or product section.
2. Correct the shortcomings the AI agent identifies and edit the affected text.
3. Accept the reviewed description, or leave an unanswered question open.
4. Name a topic in the general project workspace for the next conversation, or freely export the documents. The assistant can use all Knowledge linked to the project's profile.

Each document keeps its own conversation, edits and review state. Opening another file leaves that thread's work in place. Acceptance applies to the text you reviewed. A new proposed change is reviewed in the owning file's thread; the last reviewed version remains available until you save the revision. An ordinary topic needs a title and can be created while documents remain unfinished. Selected-document controls in the intended view identify task references; other material linked to the project remains available to the assistant. Use `/skill-slug` explicitly when a conversation needs a connected skill.

[Review my project texts](/ai-chat/social/profiles/example)

Each document thread shows missing information and its draft or reviewed state beside the conversation. Review progress counts the sections you have reviewed; an unanswered question stays visible. The token balance remains visible. It may go below zero. At −2,000 internal tokens or lower, new paid AI requests are restricted; top up above that threshold to continue from the saved step. Failed or cancelled AI requests restore all their token deductions for a net charge of zero.

## How your materials are processed and stored

The service and your uploaded materials are hosted on a Contabo server in Amsterdam. The original materials and their search representations remain in the service's own storage and PostgreSQL database, with pgvector storing the vectors used to find relevant passages.

Document text is sent to OpenRouter to create those search representations. Relevant passages are also sent through OpenRouter as context for an AI answer. These requests are handled under the selected provider's terms; uploading a file does not keep its text entirely inside this service.

Deleting your account removes the account and active project data the service controls. Contabo backups may retain copies for up to six months after deletion, and the service cannot shorten that period.

This information is available before registration and upload, and beside the account-deletion action in Settings.
