---
customer_segments:
  - makers
  - developer-agents
confirmation:
  confirmed: false
sources:
  product_scope_and_testing:
    classification: client-claim
    source: apps/studio/workspace/brief/singlepage.md
    keys:
      - sources.product_scope
      - sources.current_business
      - sources.funding
    date: 2026-09-12
    supports: Existing team-developed foundation; common registration, carts and payments configured and tested together; free code, owner funding and best-effort support.
    limitation: Team testing does not establish measured customer savings or successful independent novice use.
  audience_and_journey:
    classification: client-claim
    source: apps/studio/workspace/brief/singlepage.md
    keys:
      - intake.audience_value_and_flow
      - sources.audience_value_and_flow
    date: 2026-09-13
    supports: Novice makers direct Claude Code or Codex Desktop and inspect the UI; publishing an AI Chat page creates the customer's own repository on this foundation, and a maker with another concrete software need reaches it through GitHub for adaptation and next-product reuse, in both cases without a token purchase.
    limitation: Selected product journey; public chat readiness, automatic setup and measured conversion are not established.
  approved_direction:
    classification: constraint
    sources:
      - apps/studio/workspace/strategy/singlepage.md
      - apps/studio/workspace/brand/singlepage.md
      - apps/studio/workspace/design/singlepage.md
    date: 2026-09-13
    supports: Useful business outcomes, human-directed changes, free reusable foundation and separate hosted service; approachable language and actual UI evidence.
  included_scope:
    classification: verified-fact
    research: apps/studio/workspace/products/singlepage/singlepagestartup/research.md
    findings:
      - CF-SPS-11
    source_id: R1
    inspected_at: 2026-09-13
    source_paths:
      - libs/modules/ecommerce/README.md
      - libs/modules/billing/README.md
    supports: Repository documentation describes catalog, cart, order and payment functions and related interfaces.
    limitation: Documented source scope; runtime testing remains the separately attributed client claim.
  agent_onboarding:
    classification: verified-fact
    research: apps/studio/workspace/products/singlepage/singlepagestartup/research.md
    findings:
      - CF-SPS-02
      - CF-SPS-05
      - CF-SPS-11
    inspected:
      - AGENTS.md
      - CLAUDE.md
      - .agents/workflows/pre-development.md
    urls:
      - https://code.claude.com/docs/en/overview
      - https://learn.chatgpt.com/docs/environments/modes
      - https://learn.chatgpt.com/docs/agent-configuration/agents-md
    accessed: 2026-09-13
    supports: The repository supplies recurring project instructions and workflows; coding agents can inspect files, edit and run commands.
    limitation: Availability of instructions and agent capabilities does not prove the SPS novice setup path succeeds.
  competitive_choice:
    classification: assumption
    resolution: professional-choice
    research: apps/studio/workspace/products/singlepage/singlepagestartup/research.md
    findings:
      - CF-SPS-02
      - CF-SPS-13
    urls:
      - https://code.claude.com/docs/en/overview
      - https://github.com/nextjs/saas-starter/blob/main/README.md
      - https://shipfa.st/
    accessed: 2026-09-13
    supports: Compare a coordinated foundation and guided reuse with prior projects, generic agent scaffolding and other starters; common auth/payment functions are not exclusive to SPS.
    limitation: Alternative capabilities are documented; customer preference and comparative savings are unmeasured.
  business_goals:
    classification: assumption
    resolution: professional-choice
    research: apps/studio/workspace/products/singlepage/singlepagestartup/research.md
    findings:
      - CF-SPS-05
      - CF-SPS-07
    supports: Product adoption, continued use, next-product reuse and community improvements are distinct business outcomes.
    limitation: Planned business outcomes and measurement categories, without invented targets or reported customer results.
  license:
    classification: client-claim
    source: apps/studio/workspace/brief/singlepage.md#sources.license
    date: 2026-09-12
    supports: MIT is the selected distribution license and publication is reported.
    inspected_snapshot: https://github.com/singlepagestartup/singlepagestartup/blob/48fff95f2ffe5c6fcfb435ae50700df029608bbe/LICENSE
    limitation: The inspected local HEAD and origin/main contain proprietary terms; MIT remains the operator-selected distribution model.
  inventory:
    classification: verified-fact
    source: Brief repository observation, 2026-09-12.
    supports: Sixteen modules, 65 models and 91 relations describe repository scope.
    limitation: Earlier supplied 1836 frontend variants and 24 Studio examples are not used as current product counts; Research owns revalidation.
review:
  dependencies:
    brief: 875a271cca75b070f276f7ceced7e439bd642272c7b0b289166050ac0f3a82e0
    model.framework-service: a511d19e3b8a0e67ce12e2b3d559a19fb9ca8d6f5732627d43db940fd14d3cbd
    product.singlepagestartup.research: 629f3131efae5b5778d2bf8cb4a6bf7b98b5d223f4174d6583c93ad3a1bcf01e
---

# Product

## Product identity

| Decision              | Definition                                                                                                                                                            |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Brand and product     | **SinglePageStartup Code Framework** (`singlepagestartup`): a reusable foundation for building web products with a coding agent.                                      |
| Category              | A boilerplate combining common business functions, documentation and instructions for agents.                                                                         |
| Development direction | Build on the existing team-developed codebase to make SPS a convenient starting point for a maker's current and future products. The project owner defines its scope. |
| Boundary              | Code Framework supplies the foundation. **AI Chat** is a separate hosted service and its planned public demonstration.                                                |

## Customer Segments

The primary segment, `makers`, is novice creators and vibe coders who want their own product. They mainly communicate with Claude Code or Codex Desktop; the agent changes code while the person directs the work and reviews the interface.

The maker or adopting team is the user, beneficiary and decision-maker. There is no framework buyer; the maker separately pays for chosen coding tools and infrastructure. People seeking only hosted answers use AI Chat.

The longer-term segment, `developer-agents`, is agents selecting SPS as a foundation for assigned projects. Clear project instructions and reusable functions support that direction.

## Problem and desired progress

A maker wants to turn a business idea into a useful product without repeatedly creating registration, carts, payments and their connections. Starting from scratch diverts attention from the rules that distinguish that business.

The desired progress is to spend development time and AI tokens on the product's own logic, reach the market sooner and keep improving the product. The person should be able to express the desired result in ordinary language and stay in control of the direction.

## Value Propositions

**Build your product on a foundation you can reuse.**

| Alternative                          | Value offered by SPS                                                                                                             |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| Generate the foundation from scratch | Start with common functions configured and tested together by the team; concentrate new work on the business's own logic.        |
| Adapt an earlier project             | Reuse a shared foundation with module documentation and agent instructions instead of carrying over another product's decisions. |
| Choose another starter               | Connect common-function code, a workflow from business definition to product design, and the example provided by AI Chat.        |

Other starters also offer authentication and payments. SPS positions the complete path from a useful example to one's own product and subsequent reuse. Its strongest fit is a product that needs several of the foundation's existing functions.

## Offer and usage

The offer includes source code, documentation and agent instructions; account and access functions; catalogs, carts and orders; payment integrations; and the shared application foundation. Business-specific rules and presentation are developed for each project.

The selected distribution model is free code under MIT through GitHub. [Revenue Streams](../models/framework-service/model.md#revenue-streams) owns the money terms. Coding-agent subscriptions, infrastructure and hosted AI Chat usage are separate. Help and maintenance are provided as time permits; custom implementation and managed hosting are outside the offer.

In the intended experience, a person discovers SPS through AI Chat, a demonstration, task guidance or a relevant community answer. Publishing a page from AI Chat creates the customer's repository on this foundation; a maker with another concrete software need instead follows **Run the project on your machine** to GitHub and asks a coding agent to deploy and adapt the project. Buying chat tokens is not required. The maker describes changes, reviews the interface and develops the product; the same foundation can support the next idea.

## Business goals and metrics

| Goal                        | Metric                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------ |
| Grow recognition            | Relevant visits, recommendations and GitHub stars.                                   |
| Turn interest into adoption | Makers choosing SPS and projects built on the framework.                             |
| Earn continued use          | Products developed further on SPS and makers choosing it for another product.        |
| Strengthen the foundation   | Useful community contributions and improvements to code, examples and documentation. |
| Support agent-led adoption  | Projects where a coding agent recommends or selects SPS.                             |

These are planned outcomes. Numerical growth targets are unset. Framework adoption and community growth remain separate from AI Chat token revenue.
