---
confirmation:
  confirmed: true
  by: operator
  at: "2026-09-18"
  source: "Operator re-confirmed the current Brand on 2026-09-18 after the coordinator checked it against the confirmed Brief and found no correction needed: «Да, оба». The 2026-09-17 approval it replaces was stamped against a body the commit hooks then reformatted."
  content_sha256: 8dbe5a27b000710a03ca504b7a56040516cfdb9b54be0a95d910ee4506361590
review:
  dependencies:
    strategy: 75701c732f48b6bbe5574855fed8d5d05aa7e8a18741d2eec1f14125fa023fd5
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
    source: apps/studio/workspace/brief/singlepage.md
    source_keys:
      - intake.product_direction
    date: 2026-10-06
    crosscheck: apps/studio/workspace/strategy/singlepage.md
    sections:
      - Strategic direction
      - Audiences and product roles
    supports: AI Chat accepts supplied material or guided answers and drafts a
      shortened Workspace description with a project brief, Strategy, Brand,
      written Design and separately structured Products. Users correct the
      shortcomings the agent identifies, accept and export their documents,
      and use the saved context for later discussion and criticism.
    limitation: Proposed audience meaning, not observed perception or customer outcomes.
  one_page_meaning:
    classification: client-claim
    source: apps/studio/workspace/brief/singlepage.md
    source_keys:
      - intake.product_direction
      - intake.framework_preparation_journey
    date: 2026-10-24
    supports: The connected project description is the first-stage result.
      Reviewed or exported business material can brief a coding agent that adapts
      the existing free Code Framework into a landing page or product. Automatic
      landing-page assembly, a hosted editor and server publication through AI
      Chat remain future development, intended to collect initial enquiries and
      test a hypothesis. Paid hosted deployment follows evaluation and improvement
      of project description. “Start with one page” is not the value proposition
      or a literal translation of the brand name.
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
    source: apps/studio/workspace/brief/singlepage.md
    source_keys:
      - intake.product_direction
      - intake.framework_preparation_journey
    date: 2026-10-24
    crosschecks:
      - apps/studio/workspace/strategy/singlepage.md
      - apps/studio/workspace/products/singlepage/ai-chat/sales.yaml
      - apps/studio/workspace/products/singlepage/singlepagestartup/sales.yaml
    supports: Begin with supplied material or guided answers, review the draft
      project and product documents, correct shortcomings, accept or export the
      result and continue through project-aware discussion. For software
      development, use the reviewed material to brief a coding agent working
      with the existing free Code Framework. Automatic landing-page assembly,
      hosted editing and server publication through AI Chat belong to subsequent
      development.
    limitation: Intended first-stage journey, not verified service readiness or
      customer results. Future deployment prices and commercial terms remain
      unselected.
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
    supports: Address whether a person can supply unsorted material, review the
      written project and separate product sections, correct the proposed
      descriptions and receive useful criticism. Show supplied facts, open
      questions and user approval in a worked example.
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
      - intake.product_direction
      - intake.framework_preparation_journey
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

Use **SinglePageStartup** with this exact spelling. The name connects a working description of the business with the products and customer-facing materials developed from it. Customer value begins with organizing the material the person already has and making it useful in later work. Do not use “start with one page” as a literal promise or a translation of the name.

SinglePageStartup brings together **AI Chat**, the guided workspace for describing and developing the project, and **Code Framework**, the free software foundation for building its digital products. Introduce them as “SinglePageStartup AI Chat” and “SinglePageStartup Code Framework”; use the shorter product names once the relationship is clear. Use the full brand name in public introductions before any abbreviation.

A permanent slogan is unnecessary. Use the audience messages below where they explain the offer.

## Intended perception

SinglePageStartup should be understood as a way to write a project description from an idea, notes and partial decisions. The person supplies material in its current form or answers guided questions. AI Chat drafts the sections, points out missing or contradictory decisions and returns the documents for review.

The business user should remember, “I can give it what I already have, correct the resulting description and keep working with the same project context.” The founder should remember, “I can check my project with an agent that knows its decisions and points out what needs work.” When a site, chatbot or another digital product is needed, the reviewed or exported documents become a brief for a coding agent. Code Framework offers relevant common functions for adaptation.

The character is practical, calm and direct. Make the next useful step clear. Let the interface and the result show that the system understands the project; do not make the person learn how the underlying context or retrieval works.

## Meaning and message hierarchy

1. **Bring what already exists.** The person can supply notes, documents and partial decisions or use guided sections. They do not need to know in advance where every fact belongs.
2. **Describe the project and each product.** AI Chat drafts a project brief, Strategy, Brand, a written Design description and separate Products in a shortened Workspace structure. Each product has its own sections for customers, offer, Operations & Economics, Sales, Promotion, Analytics and research where needed. Promotion describes how the product will be presented publicly, including Website, Creative and Presentation where relevant. The result is text the user can inspect, edit and export.
3. **Correct the shortcomings the agent identifies.** Review the proposed descriptions, check missing or contradictory decisions and correct the sections. Facts supplied by the user, assumptions and unanswered questions remain distinguishable. Acceptance records what the user is ready to use; it does not prove demand or guarantee a successful business.
4. **Keep working with the project.** Accepted documents remain context for later questions, idea assessment, comparisons and criticism. The agent uses settled information and asks for what the current decision still needs. Users can freely export their results and use them outside the service.
5. **Build from the reviewed documents.** Use the accepted or exported business material to give a coding agent a concrete task. The agent adapts the existing free Code Framework into a landing page or product while the person directs the work and checks the result. Name the relevant common functions and what must be adapted. Automatic assembly, a hosted editor and server publication through AI Chat remain future development; the owner evaluates and improves project description before selling that deployment service.

| Audience concern                                           | Response and proof to show                                                                                                                                                              |
| ---------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| “Do I need to sort all my information before I can start?” | Show mixed notes and guided answers becoming attributed project and product sections, followed by correction and acceptance.                                                            |
| “Will the chat only agree with my ideas?”                  | Show an idea discussion that exposes an assumption, offers a reasoned objection and keeps the accepted project context visible.                                                         |
| “Can I use the result outside the chat?”                   | Show editable project documents and a separate description for each product, with export for use outside the service.                                                                   |
| “What happens when I need a site, chatbot or system?”      | Show reviewed documents becoming a coding-agent brief for adaptation of Code Framework. Label automatic assembly, hosted editing and publication through AI Chat as future development. |

The primary action is **Organize my materials**. It leads to registration and upload. The next actions are **Review my project**, **Correct a section**, **Export my documents** and **Continue with my project**. Public first-stage copy sells the work of describing the project and its products. When the person is ready to develop software, **Explore Code Framework** connects that material to the existing code and coding-agent guidance. Automatic landing-page assembly, a hosted editor, GitHub authorization and server publication through AI Chat remain future capabilities, not active CTAs for the hosted offer.

## Voice and language

Speak directly to the person as “you.” Use short sentences and concrete verbs: upload, explain, review, correct, compare, export. Explain one useful action at a time. Use the accepted project documents in responses and ask a plain question when information is missing. “Assess an idea” means checking it against project decisions and identifying what needs evidence or correction. Avoid vague instructions to “break down an idea.” Do not explain vectors, retrieval or database storage in the ordinary product flow.

Introduce a “coding agent,” such as Claude Code or Codex Desktop, only when the person moves from describing the project to changing software. Explain it as the tool that changes the code while the person directs the work and checks the result.

| Use                                                                                             | Avoid                                                                       |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| “Add the notes and decisions you already have. Review how we organize them.”                    | “Start with one connected page.”                                            |
| “Let’s test this idea against the project and find what does not hold up.”                      | “Your idea is great!” without reasons, limits or criticism.                 |
| “Review the description of each product. Correct what is missing before you accept it.”         | “Add documents to a vector knowledge base so retrieval can supply context.” |
| “You need a chatbot. Start with the framework and adapt the parts that are specific to you.”    | “Build anything automatically with a universal AI platform.”                |
| “The framework includes registration and payments. Check what your product needs you to adapt.” | “Thousands of founders save 90% of development time.”                       |

## Consistency rules

- Use a concise project overview to connect the documents. Each product retains its own structure and sections. Do not promise that all project and product work fits on one literal page or use “start with one page” as the value proposition.
- Lead with the person's existing material and the written project and product descriptions produced from it. A written Design description is part of this result; generated design assets and a rendered landing page are not first-stage deliverables.
- Use reviewed or exported documents to connect AI Chat preparation to coding-agent development with the existing free Code Framework. Label automatic assembly, a hosted editor and server publication through AI Chat as future development. Initial enquiries and a hypothesis test describe intended uses of a landing page, not guaranteed outcomes. Future hosted deployment prices and commercial terms remain unselected.
- Treat the accepted project as the context for later discussion, comparison and criticism. Do not make the assistant uniformly agreeable or require the person to repeat settled information.
- Let relevant responses demonstrate that the system understands the project. Do not sell relevance as a separate feature or require the person to instruct the chat to use information they have already provided.
- Recommend Code Framework in response to a concrete product need. Name only the functions relevant to that need, distinguish what is already available from what must be built and use the person's server as the deployment destination.
- “Free” describes the framework code. Hosted chat, coding-agent charges and infrastructure costs are separate. State that initial AI Chat support requests are processed within 24 hours without promising continuous live coverage or a resolution deadline.
- Describe a demonstration as a demonstration. Attribute a customer result only to evidence of that result. Claiming better answers than ChatGPT, quantified savings, guaranteed correctness or complete data isolation requires specific proof.
