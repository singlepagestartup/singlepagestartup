---
customer_segments:
  - makers
  - developer-agents
confirmation:
  confirmed: false
sources:
  owner_time_allocation:
    classification: client-claim
    resolution: operator-fact
    source: Operator clarification in chat, 2026-10-06.
    supports: Development and support time split equally between AI Chat and Code Framework; remaining owner activities allocated 80% to AI Chat and 20% to Code Framework.
    limitation: No recurring hours or new cash-expense allocation is supplied.
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
      - intake.product_direction
      - sources.ai_chat_launch_stage
      - intake.framework_preparation_journey
    date: 2026-10-24
    supports: AI Chat prepares a business model, concept, business plan and structured project and product documents for human review. Makers export the useful accepted material, brief Claude Code or Codex Desktop and build a landing page or product on the free foundation. Existing business material can enter the same coding-agent handoff directly. Hosted automatic landing-page assembly and publication remain future development.
    limitation: Selected product journey; public chat readiness, automatic setup and measured conversion are not established. Future AI Chat deployment commercial terms are undecided and the free code does not establish free deployment.
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
    source: Research sources.current_repository_inspection at aa780be0f99f78f5d25802d259059cb1b66f4cb0.
    finding_ids: [CF-SPS-38]
    inspected_at: 2026-10-24
    supports: Named module responsibilities and source-backed examples describe the foundation; public copy does not depend on volatile catalog totals.
    limitation: A module or variant entry does not establish finished visual coverage, live operation, customer adoption or comparative savings.
review:
  dependencies:
    brief: 490a648452b91afd083215d3b2420e6990deedbfcc94442dc30b731613cb3258
    product.singlepagestartup.research: 2bfd1f9d4d535851fb7ed25de7883719ca25fe296a41e6f6366613a9fc5f16b8
---

# Product

## Product identity

| Decision              | Definition                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Brand and product     | **SinglePageStartup Code Framework** (`singlepagestartup`): a reusable foundation for building web products with a coding agent.                                                                             |
| Category              | A boilerplate combining common business functions, documentation and instructions for agents.                                                                                                                |
| Development direction | Build on the existing team-developed codebase to make SPS a convenient starting point for a maker's current and future products. The project owner defines its scope.                                        |
| Boundary              | Code Framework supplies reusable code. **AI Chat** prepares business and product material that a person can review, export and give to a coding agent; it is a separate hosted offer on the same foundation. |

## Customer Segments

The primary segment, `makers`, is novice creators and vibe coders who want their own product. They mainly communicate with Claude Code or Codex Desktop; the agent changes code while the person directs the work and reviews the interface.

The maker or adopting team is the user, beneficiary and decision-maker. There is no framework buyer; the maker separately pays for chosen coding tools and infrastructure. People preparing business material can start with AI Chat and continue using its hosted workspace without beginning software development.

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

The offer includes source code, documentation and agent instructions; account and access functions; catalogs, carts and orders; payment integrations; and the shared application foundation. Business-specific rules and presentation are developed for each project. Module explanations and linked Blog articles show which existing responsibility fits a task, which records and relationships it uses and what the coding agent still needs to change. These are source-backed examples, not promises that every variant has a finished design or every integration is configured for a new project.

The selected distribution model is free code under MIT through GitHub. [Revenue Streams](#revenue-streams) owns the money terms. Coding-agent subscriptions, infrastructure and hosted AI Chat usage are separate. Help and maintenance are provided as time permits; custom implementation and managed hosting are outside the offer.

The intended preparation route starts in AI Chat: supply notes and files, describe the business model and offer, review the project and product documents, and export the useful accepted material. The maker gives that context to a coding agent with the desired landing-page action or product behavior, then uses GitHub and the local setup guide to begin Code Framework development. The Framework landing introduces this route alongside module explanations, Blog articles and token purchases. Tokens fund hosted AI Chat work; acquiring the MIT code requires no token purchase.

A maker with sufficient business material can begin directly from a demonstration, task guide, community answer or repository. The maker directs changes, reviews the interface and develops the product; the same foundation can support the next idea. AI Chat's future automatic page assembly and publication remain separate from this export-and-coding-agent route, and their commercial terms are undecided.

## Revenue Streams

| Segment | Payer and unit                                            | Terms                                                                                                                                                                                             |
| ------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Makers  | The maker pays nothing in money for the code.             | MIT licence, no checkout, no licence fee. The price is paid in social capital: a star, a fork, a recommendation, an improvement contributed back.                                                 |
| Project | The maker who later needs hosted work arrives at AI Chat. | Trust in the foundation may introduce a maker to paid AI Chat preparation or continued document work. This return is intended, not measured; no conversion rate from adoption to purchase exists. |

The recorded attention baseline is 4 stars and 2 forks. Attention, adoption,
repeat use and contributions are counted separately, because a star costs the
maker nothing while a contribution costs them work. What a star or a fork is
worth against a paid AI Chat customer is unmeasured.

## Key Activities

Develop and maintain the shared foundation, its modules and its documentation,
and keep them usable by makers and their coding agents. Help makers adapt the
code to their own businesses, as time permits.

Promotion includes demonstrations and tutorials, short videos, searchable use-case
pages and answers in relevant communities. Code Framework carries 20% of the owner's
activities outside development and support, including promotion; AI Chat carries 80%.
The intended framework journey is in [Sales](sales.yaml).

## Key Resources

| Resource ID       | Scope and share                                                                                                         | Availability                                                                                |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `founder-time`    | 50% of development and support time, plus 20% of remaining owner activities. AI Chat carries the complementary shares.  | Allocated as the project develops; no recurring hours committed.                            |
| `repository`      | The shared code and documentation, developed by a team over several years. Counted here; AI Chat runs on the same base. | Named modules, documented models, relations and SDKs; source scope is recorded in Research. |
| `identity-assets` | The shared brand, fonts and visual materials.                                                                           | Current approved identity and registered assets.                                            |

## Key Partnerships

GitHub distributes the code and is the intended repository and deployment
dependency of AI Chat's future publication route. No agreement or dedicated supplier terms exist;
the dependency rests on a public platform's ordinary service. Makers choose the
coding agents and external services for their own projects, and those choices
are outside this product.

## Cost Structure

| Expense              | Basis                                                                                                                                                                                                    |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Development and help | 50% of the owner's development and support time, per the `founder-time` split.                                                                                                                           |
| Promotion            | 20% of owner time outside development and support, including demonstrations, short videos, searchable pages and community participation. Promotional cash remains allocated here; no amount is supplied. |
| Distribution         | None. GitHub carries the code at no charge to the project.                                                                                                                                               |

No cash spend is recorded. Owner time is allocated by activity under the same
resource ID in both products: 50% of development and support and 20% of remaining
activities here; the complementary shares sit in AI Chat. The same hours are
counted once.

### Funding

The owner's time and money fund this product, and AI Chat revenue is what makes
that affordable. No external financing is committed and no recurring budget is
set.

## Assumptions and decision rules

- `bridge`: reviewed business and product material from AI Chat can become a
  coding-agent brief for a landing page or product on the foundation. Handoff
  usefulness and adoption remain unmeasured.
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
