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
    date: 2026-09-18
    supports: MIT is the selected distribution license, and inspected origin/main carries the MIT text.
    inspected_snapshot: https://github.com/singlepagestartup/singlepagestartup/blob/1df352484f23a8615962da490771028b7f87f536/LICENSE
    limitation: The license governs the distributed source only; it establishes no runtime behavior, adoption or support commitment.
  inventory:
    classification: verified-fact
    source: Brief repository observation, 2026-09-12.
    supports: Sixteen modules, 65 models and 91 relations describe repository scope.
    limitation: Earlier supplied 1836 frontend variants and 24 Studio examples are not used as current product counts; Research owns revalidation.
review:
  dependencies:
    brief: 875a271cca75b070f276f7ceced7e439bd642272c7b0b289166050ac0f3a82e0
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

## Revenue Streams

| Segment | Payer and unit                                            | Terms                                                                                                                                                                   |
| ------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Makers  | The maker pays nothing in money for the code.             | MIT licence, no checkout, no licence fee. The price is paid in social capital: a star, a fork, a recommendation, an improvement contributed back.                       |
| Project | The maker who later needs hosted work arrives at AI Chat. | A maker who trusts the foundation is the cheapest customer AI Chat can get. This return is intended, not measured; no conversion rate from adoption to purchase exists. |

The recorded attention baseline is 4 stars and 2 forks. Attention, adoption,
repeat use and contributions are counted separately, because a star costs the
maker nothing while a contribution costs them work. What a star or a fork is
worth against a paid AI Chat customer is unmeasured.

## Key Activities

Develop and maintain the shared foundation, its modules and its documentation,
and keep them usable by makers and their coding agents. Help makers adapt the
code to their own businesses, as time permits.

This product also carries the project's promotion: demonstrations and tutorials,
short videos cut from them, searchable use-case pages and answers in relevant
communities. Promotion belongs here because what it buys is exactly what this
product is paid in, and because a maker who arrives through it can go on to AI
Chat. The intended journey is in [Sales](sales.yaml); it is not repeated here.

## Key Resources

| Resource ID       | Scope and share                                                                                                                           | Availability                                                     |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `founder-time`    | Half of the owner's working time, split evenly with AI Chat because development and promotion serve both and cannot be traced separately. | Allocated as the project develops; no recurring hours committed. |
| `repository`      | The shared code and documentation, developed by a team over several years. Counted here; AI Chat runs on the same base.                   | 16 modules, 65 models, 91 relations.                             |
| `identity-assets` | The shared brand, fonts and visual materials.                                                                                             | Current approved identity and registered assets.                 |

## Key Partnerships

GitHub distributes the code and holds the repository that each published
customer page is created in, which makes it a dependency of both this product
and AI Chat's publication step. No agreement or dedicated supplier terms exist;
the dependency rests on a public platform's ordinary service. Makers choose the
coding agents and external services for their own projects, and those choices
are outside this product.

## Cost Structure

| Expense              | Basis                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Development and help | Half of the owner's time, per the `founder-time` split. Owner time, not cash.                                             |
| Promotion            | All of it: demonstrations, short videos, searchable pages and community participation, in owner time and any money spent. |
| Distribution         | None. GitHub carries the code at no charge to the project.                                                                |

This product spends no cash of its own. Its whole cost is owner time, and the
half it does not carry sits in AI Chat under the same resource ID, so the same
hours are never counted twice.

### Funding

The owner's time and money fund this product, and AI Chat revenue is what makes
that affordable. No external financing is committed and no recurring budget is
set.

## Assumptions and decision rules

- `bridge`: a useful chat experience encourages interested makers to adopt the
  foundation.
- `framework-growth`: attention and stars are counted apart from product use,
  repeat use and contributions, because only the last two show the price was
  actually paid.
- `channel-access`: use the selected organic channels and prioritise the topics
  that attract relevant makers.
- `capacity`: promotion and help scale to available time and money; help with
  the code stays best-effort, with no response or resolution commitment.
- `proof`: [Research](research.md) examines these assumptions. No numerical
  growth or savings claim is established.

## Business goals and metrics

| Goal                        | Metric                                                                               |
| --------------------------- | ------------------------------------------------------------------------------------ |
| Grow recognition            | Relevant visits, recommendations and GitHub stars.                                   |
| Turn interest into adoption | Makers choosing SPS and projects built on the framework.                             |
| Earn continued use          | Products developed further on SPS and makers choosing it for another product.        |
| Strengthen the foundation   | Useful community contributions and improvements to code, examples and documentation. |
| Support agent-led adoption  | Projects where a coding agent recommends or selects SPS.                             |

These are planned outcomes. Numerical growth targets are unset. Framework adoption and community growth remain separate from AI Chat token revenue.
