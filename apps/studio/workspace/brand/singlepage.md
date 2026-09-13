---
confirmation:
  confirmed: true
  by: operator
  at: 2026-09-13
  source: "Operator approved the reviewed Brief, Strategy and Brand in chat: «Всё подтверди и бриф в том числе. ... уже подтверждал. Всё подтверди бриф и давай двигаться дальше»."
  content_sha256: 691ec9f7a801d77e97daa4266fbd617c95568804eefb1ed07c3848dfd8add19d
review:
  dependencies:
    strategy: 2622dc1d9ee86e33532abfba58728e3b1999c2ac9759162cd5d9f3ec07887cc0
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
    supports: Exact SinglePageStartup spelling; AI Chat and Code Framework are its two products; no slogan was supplied.
    professional_choice: Use the full brand with product names on first mention; retain the two audience messages without selecting a permanent slogan.
    limitation: Naming usage is a proposed communication rule, not trademark registration or a supplied slogan.
  intended_perception:
    classification: promise
    resolution: professional-choice
    source: apps/studio/workspace/strategy/singlepage.md
    sections:
      - Strategic direction
      - Audiences and product roles
    supports: Practical usefulness first; confidence from understandable answers and an observable product result; optional progression from hosted use to building; practical, patient and candid character linking useful hosted service with a reusable foundation.
    limitation: Proposed audience meaning, not observed perception or customer outcomes.
  primary_message:
    classification: promise
    resolution: professional-choice
    source: apps/studio/workspace/brief/singlepage.md
    source_keys:
      - intake.audience_value_and_flow
      - sources.audience_value_and_flow
    supports: Business facts and documents inform answers through separately scoped knowledge for each chat.
    limitation: Intended product behavior; neither verified public readiness nor a physical-database, confidentiality or answer-accuracy guarantee.
  paid_continuation:
    classification: client-claim
    source: apps/studio/workspace/products/singlepage/models/framework-service/model.md
    section: Revenue Streams
    supports: Users may buy tokens for continued hosted use; framework code is free and has no checkout.
    limitation: Token price, units and transaction terms remain for the owning offer; no allowance or subscription is inferred.
  maker_message:
    classification: client-claim
    source: apps/studio/workspace/brief/singlepage.md
    source_keys:
      - sources.current_business
      - sources.audience_value_and_flow
      - sources.funding
    supports: Team-tested common registration, cart and payment functions; agent changes code, person directs and reviews the interface; next-product reuse.
    limitation: Team testing does not establish novice success, quantified time/token savings or external adoption.
  action_path:
    classification: constraint
    source: apps/studio/workspace/strategy/singlepage.md
    sections:
      - Growth system
      - Customer journey
    crosschecks:
      - apps/studio/workspace/products/singlepage/ai-chat/sales.yaml
      - apps/studio/workspace/products/singlepage/singlepagestartup/sales.yaml
    supports: Try AI Chat leads the message; the exact Russian local-deployment CTA leads to GitHub, followed by agent-assisted setup and adaptation. Token purchase is not a prerequisite for the framework path.
    limitation: Intended journey, not an implemented one-click installation claim.
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
    supports: Address relevance of answers and ability to build through conversation; show question, supplied facts and answer or requested change and working result.
    limitation: These are proposed communication concerns and evidence rules, not interview quotations. No observed customer results or comparative performance is supplied.
  voice_and_claims:
    classification: constraint
    resolution: professional-choice
    source: apps/studio/workspace/brief/singlepage.md
    source_keys:
      - sources.answer_quality
      - sources.current_business
      - sources.license
      - sources.identity_inventory
    supports: Plain language, exact product names, concrete examples and bounded proof; no supplied slogan, quantified savings, response-time guarantee or verified comparative superiority.
    limitation: Named release-license claims must match that release's source; selected MIT intent does not verify the inspected release.
  consistency_rules:
    classification: constraint
    resolution: professional-choice
    source: apps/studio/workspace/brief/singlepage.md
    source_keys:
      - sources.funding
      - sources.current_business
      - sources.license
    crosschecks:
      - apps/studio/workspace/products/singlepage/models/framework-service/model.md
      - apps/studio/workspace/products/singlepage/singlepagestartup/research.md#price-channels-and-evidence
    supports: Free code does not include hosted chat, coding-agent or infrastructure costs; support is help and maintenance as time permits; license statements describe the actual release.
    limitation: No new price, service allowance, guaranteed support schedule or license-publication claim is introduced.
---

# Brand

## Brand identity

Use **SinglePageStartup** with this exact spelling. It brings together **AI Chat**, the hosted service for business questions, and **Code Framework**, the free software foundation behind the chat. Introduce them as “SinglePageStartup AI Chat” and “SinglePageStartup Code Framework”; use the shorter product names once the relationship is clear. Use the full brand name in public introductions before any abbreviation.

A permanent slogan is unnecessary. Use the audience messages below where they explain the offer.

## Intended perception

SinglePageStartup should feel like a practical place to make progress with AI: understand an answer in the context of your business, then choose what to do next. The person stays in charge of the question and the result.

The business user should remember, “This chat works with the facts I bring.” The maker should remember, “I can use the foundation behind this product for my own.” Build confidence through a clear explanation and a result the person can inspect.

The character is practical, patient and candid. Make the next step approachable and explain what the result means. The memorable connection is a useful service people can keep using and a foundation they can reuse for their own products.

## Meaning and message hierarchy

1. **Start with the business question.** The person has a real question and relevant documents, but needs an answer that fits their situation. Lead with **“Answers grounded in your business.”** Explain: “Add your business facts and documents. Ask a question. AI Chat uses relevant material from that chat’s knowledge to answer.” Each chat has its own knowledge scope.
2. **Make continued use understandable.** Further questions and updated business materials give people reasons to return. Explain token purchases as a way to continue using AI Chat. Keep token quantities, prices and purchase terms with the actual offer.
3. **Introduce the foundation through the product.** For interested makers: **“Build your product on the foundation behind this chat.”** Code Framework provides free code with registration, carts, payments and other common functions tested together by the team. Reuse these functions while the coding agent works on the product’s own logic.

| Audience concern                      | Response and proof to show                                                                                                                                 |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| “Will the answer fit my business?”    | Show a concrete question, the supplied facts and how they inform the answer. Explain when those facts leave something unanswered.                          |
| “Can I build by talking to an agent?” | Show a person describing a change, the agent editing the project and the person checking the resulting interface. Follow setup with one useful adaptation. |

The primary action is **Try AI Chat**. The secondary action is **Развернуть проект на своей машине**, with the explanation: “Open the GitHub project and ask your coding agent to set it up locally.” A token purchase is not required. From there, the maker can adapt the project and reuse the foundation for the next product.

## Voice and language

Speak directly to the person as “you.” Use short sentences and concrete verbs: add, ask, check, change, build, reuse. Explain one action at a time. Say “business facts and documents” before technical terms such as “vector knowledge.” Introduce “coding agent,” such as Claude Code or Codex Desktop, as the tool that changes code while the person directs and checks the work.

| Use                                                                                          | Avoid                                                 |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| “Ask a question using your business documents.”                                              | “Unlock next-generation business intelligence.”       |
| “Ask your coding agent to change the order rule for your business, then check the checkout.” | “Launch any business automatically in one click.”     |
| “The team tested registration, carts and payments together.”                                 | “Thousands of founders save 90% of development time.” |

## Consistency rules

- Keep each product useful on its own. Chat explanations should let a person understand the answer and continue as a consumer. Maker explanations should connect a business change to functions already available in the foundation.
- “Free” describes the framework code. Hosted chat, coding-agent charges and infrastructure costs are separate. Describe support as help and maintenance as time permits, without response deadlines.
- Describe a demonstration as a demonstration. Attribute a customer result only to evidence of that result. Claiming better answers than ChatGPT, quantified savings, guaranteed correctness or complete data isolation requires specific proof.
