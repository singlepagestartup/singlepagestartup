---
confirmation:
  confirmed: true
  by: operator
  at: "2026-09-18"
  source: "Operator re-confirmed the current Brand on 2026-09-18 after the coordinator checked it against the confirmed Brief and found no correction needed: «Да, оба». The 2026-09-17 approval it replaces was stamped against a body the commit hooks then reformatted."
  content_sha256: 8dbe5a27b000710a03ca504b7a56040516cfdb9b54be0a95d910ee4506361590
review:
  dependencies:
    strategy: d68e88a81632b3ddf4f57431d6963c9d74c28bf2ba0a3d9578fb2d925fe3bf82
sources:
  brand_identity:
    classification: constraint
    source: apps/studio/workspace/brief/singlepage.md
    source_keys:
      - sources.product_scope
      - sources.identity_inventory
    sections:
      - Project and products
      - Visual reference intake
    supports: Exact SinglePageStartup spelling; AI Chat and Code Framework are its
      two products; no slogan was supplied.
    professional_choice: Use the full brand with product names on first mention;
      retain the two audience messages without selecting a permanent slogan.
    limitation: Naming usage is a proposed communication rule, not trademark
      registration or a supplied slogan.
  intended_perception:
    classification: promise
    resolution: professional-choice
    source: Operator clarifications in chat, 2026-09-16 and 2026-09-17
    crosscheck: apps/studio/workspace/strategy/singlepage.md
    sections:
      - Strategic direction
      - Audiences and product roles
    supports: AI Chat accepts files, images, existing project material or guided
      answers, turns them into an editable business and marketing model and
      stays available for later idea development and criticism; an exportable
      document and first landing page are results of that work.
    limitation: Proposed audience meaning, not observed perception or customer outcomes.
  one_page_meaning:
    classification: client-claim
    source: Operator clarifications in chat, 2026-09-16 and 2026-09-17
    supports: The project can be read on one concise page and turned into a
      landing-page sandbox; when the page is ready, the product guides
      repository creation and deployment to the user's server through Code
      Framework. “Start with one page” is not the value proposition or a literal
      translation of the brand name.
    limitation: Intended product structure and naming meaning; implementation
      details, separate-site setup time and customer preference remain
      unverified.
  maker_message:
    classification: client-claim
    source: Operator clarifications in chat, 2026-09-16 and 2026-09-17
    crosscheck: apps/studio/workspace/brief/singlepage.md
    supports: When a person needs a site, chatbot or another digital product,
      present Code Framework in that context and explain which relevant common
      functions are already integrated; deployment is to the person's server.
    limitation: Recommend only functions relevant to the requested product; existing
      integrations do not establish complete fit, one-click deployment, novice
      success or quantified savings.
  action_path:
    classification: constraint
    source: Operator clarification in chat, 2026-09-16
    crosschecks:
      - apps/studio/workspace/strategy/singlepage.md
      - apps/studio/workspace/products/singlepage/ai-chat/sales.yaml
      - apps/studio/workspace/products/singlepage/singlepagestartup/sales.yaml
    supports: Begin with supplied material or guided answers, review and approve the
      proposed project structure, continue through project-aware discussion,
      assemble a landing-page sandbox, and guide the user through GitHub
      repository creation and server deployment when the page is ready.
    limitation: Intended journey; exact provider support, permissions, credential
      handling and deployment recovery remain implementation decisions.
  concerns_and_proof:
    classification: assumption
    resolution: professional-choice
    research:
      - apps/studio/workspace/products/singlepage/ai-chat/research.md
      - apps/studio/workspace/products/singlepage/singlepagestartup/research.md
    finding_ids:
      - AC-SPS-01
      - AC-SPS-02
      - AC-SPS-05
      - AC-SPS-06
      - CF-SPS-01
      - CF-SPS-02
      - CF-SPS-05
      - CF-SPS-07
    supports: Address whether a person can supply unsorted material, correct the
      proposed structure and receive useful criticism; show attribution and
      approval before a landing-page sandbox or relevant product adaptation.
    limitation: These are proposed communication concerns and evidence rules, not
      interview quotations. No observed customer results or comparative
      performance is supplied.
  voice_and_claims:
    classification: constraint
    resolution: professional-choice
    source: apps/studio/workspace/brief/singlepage.md
    source_keys:
      - sources.answer_quality
      - sources.current_business
      - sources.license
      - sources.identity_inventory
    supports: Plain language, exact product names, concrete next steps and bounded
      proof; the interface should demonstrate project understanding without
      explaining retrieval, vectors or database storage to the user.
    limitation: Named release-license claims must match that release's source;
      inspected origin/main carries the MIT text, which verifies the terms of the
      distributed code and nothing about its behavior.
  consistency_rules:
    classification: constraint
    resolution: professional-choice
    source: apps/studio/workspace/brief/singlepage.md
    source_keys:
      - sources.funding
      - sources.current_business
      - sources.license
    crosschecks:
      - apps/studio/workspace/products/singlepage/singlepagestartup/product.md
      - apps/studio/workspace/products/singlepage/singlepagestartup/research.md#price-channels-and-evidence
    supports: Free code does not include hosted chat, coding-agent or infrastructure
      costs; initial AI Chat support requests are processed within 24 hours
      without continuous live coverage; license statements describe the actual
      release.
    limitation: No new price, resolution-time guarantee, expanded service allowance
      or license-publication claim is introduced.
---

# Brand

## Brand identity

Use **SinglePageStartup** with this exact spelling. The name connects one working business document with the first landing page prepared from it. Do not turn the name into the literal promise “start with one page”; the customer value begins with organizing the material the person already has and making it useful in later work.

SinglePageStartup brings together **AI Chat**, the guided workspace for defining and developing the project, and **Code Framework**, the free software foundation for publishing and expanding it. Introduce them as “SinglePageStartup AI Chat” and “SinglePageStartup Code Framework”; use the shorter product names once the relationship is clear. Use the full brand name in public introductions before any abbreviation.

A permanent slogan is unnecessary. Use the audience messages below where they explain the offer.

## Intended perception

SinglePageStartup should feel like a practical way to turn an idea, notes and partial decisions into a coherent project and then move toward a visible test. The person can provide material in its current form or answer guided questions; AI Chat organizes it and returns the result for review.

The business user should remember, “I can give it what I already have, correct the resulting structure and keep thinking from the same project context.” The founder should remember, “I have a project-aware counterpart that can help develop an idea, question it and turn accepted decisions into useful materials.” When the work reaches a site, chatbot or another digital product, Code Framework provides a relevant starting point instead of sending the person back to zero.

The character is practical, calm and direct. Make the next useful step clear. Let the interface and the result show that the system understands the project; do not make the person learn how the underlying context or retrieval works.

## Meaning and message hierarchy

1. **Bring what already exists.** The person can supply notes, documents and partial decisions or use guided sections. They do not need to know in advance where every fact belongs.
2. **Work with the business model.** AI Chat places information into the relevant business, marketing and product areas, marks gaps and assumptions, and returns one editable result for correction, chat and export.
3. **Keep thinking with the project.** The accepted foundation remains available for ordinary questions, idea development, comparisons and constructive criticism. The system uses what is already known, challenges weak reasoning when useful and asks only for information missing from the current decision.
4. **Turn accepted decisions into a public page.** Prepare the offer, copy and first landing page from the reviewed project. Edit it in the sandbox and inspect the result immediately. When it is ready, connect GitHub, create the project repository, connect the user's server and publish through the configured deployment.
5. **Offer the framework at the moment it becomes useful.** When the person needs a site, chatbot or another digital product, recommend Code Framework in that context. Explain which relevant functions are already integrated and what still needs to be adapted. The point is practical: start from a working foundation and spend effort on the product's own rules.

| Audience concern                                           | Response and proof to show                                                                                                                                                             |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| “Do I need to sort all my information before I can start?” | Show mixed notes and guided answers becoming attributed project sections, followed by correction and approval.                                                                         |
| “Will the chat only agree with my ideas?”                  | Show an idea discussion that exposes an assumption, offers a reasoned objection and keeps the accepted project context visible.                                                        |
| “Can one page become a real test?”                         | Show the same project decisions becoming a landing-page sandbox, then a repository and a deployed site on the user's server. Keep deployment and observed customer response separate.  |
| “What happens when I need a site, chatbot or system?”      | Show Code Framework only when it fits the request. Name the relevant functions already available, deploy to the person's server and demonstrate one adaptation to the project's rules. |

The primary action is **Organize my materials**. It leads to registration and upload rather than implying that the person has not started the project. The next actions are **Work with the business model**, **Create the landing page** and **Publish on my server**. Publication explains what will be created in GitHub, which server credential is required and how later approved changes reach the site. A token purchase is not required for this path.

## Voice and language

Speak directly to the person as “you.” Use short sentences and concrete verbs: upload, explain, choose, preview, check, change. Explain one useful action at a time. Speak as a system that already understands the completed business documents. Ask a plain question when information is missing. Do not explain vectors, retrieval or database storage in the ordinary product flow.

Introduce a “coding agent,” such as Claude Code or Codex Desktop, only when the person moves from describing the project to changing software. Explain it as the tool that changes the code while the person directs the work and checks the result.

| Use                                                                                              | Avoid                                                                       |
| ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| “Add the notes and decisions you already have. Review how we organize them.”                     | “Start with one connected page.”                                            |
| “Let’s test this idea against the project and find what does not hold up.”                       | “Your idea is great!” without reasons, limits or criticism.                 |
| “Check the page in the sandbox. When it is ready, connect GitHub and publish it on your server.” | “Add documents to a vector knowledge base so retrieval can supply context.” |
| “You need a chatbot. Start with the framework and adapt the parts that are specific to you.”     | “Build anything automatically with a universal AI platform.”                |
| “Deploy the project to your server, then check the result.”                                      | “Thousands of founders save 90% of development time.”                       |

## Consistency rules

- Use “one page” for the connected working document and the landing page prepared from it. The sandbox is the review version; publication creates a repository and deploys to the user's server. Do not use “start with one page” as the value proposition or as a literal translation of the brand name.
- Lead with files, images and other material the person already has, the business model produced from them and the landing page that follows.
- Treat the accepted project as the context for later discussion, comparison and criticism. Do not make the assistant uniformly agreeable or require the person to repeat settled information.
- Let relevant responses demonstrate that the system understands the project. Do not sell relevance as a separate feature or require the person to instruct the chat to use information they have already provided.
- Recommend Code Framework in response to a concrete product need. Name only the functions relevant to that need, distinguish what is already available from what must be built and use the person's server as the deployment destination.
- “Free” describes the framework code. Hosted chat, coding-agent charges and infrastructure costs are separate. State that initial AI Chat support requests are processed within 24 hours without promising continuous live coverage or a resolution deadline.
- Describe a demonstration as a demonstration. Attribute a customer result only to evidence of that result. Claiming better answers than ChatGPT, quantified savings, guaranteed correctness or complete data isolation requires specific proof.
