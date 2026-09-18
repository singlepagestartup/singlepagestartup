---
confirmation:
  confirmed: false
sources:
  offer:
    classification: client-claim
    sources:
      - product.md
      - ../models/framework-service/model.md
    supports: Free reusable framework, coding-agent workflow, separate hosted costs and help as time permits.
  visitor_path:
    classification: promise
    resolution: professional-choice
    sources:
      - ../../../strategy/singlepage.md
      - ../../../brand/singlepage.md
      - sales.yaml
    supports: Planned maker-specific page leads from business value to local creation; AI Chat remains a separately useful choice.
  example_change:
    classification: assumption
    resolution: professional-choice
    supports: A minimum order quantity illustrates a business change a maker can request.
  visual_application:
    classification: constraint
    source: ../../../design/singlepage.md
    asset_ids:
      - singlepage-generated-measured-space-primary-lockup
      - singlepage-generated-measured-space-photography-business-conversation
      - singlepage-generated-measured-space-illustration-module-hierarchy
      - singlepage-generated-measured-space-illustration-coordinated-agents
    supports: Current Measured Space imagery and typography with unchanged original image masters.
review:
  dependencies:
    brand: 8dbe5a27b000710a03ca504b7a56040516cfdb9b54be0a95d910ee4506361590
    design: 6f29bf4c2ea795a190382e7091a7085ee9270f892486aeccd6c2aca62f1179c8
    model.framework-service: 24505045708eaee8184c7d988841e54b6408be46051b785d18989c6329a14a80
    product.singlepagestartup.product: 1bd3022ba57bd99882728e561cec47013e32d16dc2a138e8598efd17184e70e6
    product.singlepagestartup.sales: 5f4d91f14898077c62d3576a0dd298c4393d3aa788e05df4d42bf6d85b0cbf13
    strategy: d68e88a81632b3ddf4f57431d6963c9d74c28bf2ba0a3d9578fb2d925fe3bf82
---

# Website

## Objective and visitor paths

The Code Framework website helps people turn a business idea into their own product with a coding agent. It addresses the `makers` Sales segment: novice creators with a business idea who want ready common functions and room for their own business logic.

The `developer-agents` segment, a coding agent selecting the foundation for a person it works for, has no path on this page. Its needs are clear instructions, a visible separation of shared conventions from the human's product choices, and enough material to explain fit and remaining work to the responsible person. Whether the website serves that segment or the repository documentation does is an open decision for the project owner.

Visitors arrive through AI Chat, a demonstration, a tutorial, search or a shared link. The page explains the value, introduces the local workflow and leads to the GitHub project. Someone who only wants hosted answers can choose AI Chat instead.

The main action is **Run the project on your machine**. It opens GitHub, where the person starts local work with Claude Code or Codex Desktop. There is no purchase or lead form before accessing the framework.

## Final page specification

| Page             | Purpose                                                 | Content and action                                                                                           |
| ---------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Landing page `/` | Explain the foundation and invite the visitor to build. | Value proposition → reusable functions → local workflow → example business change → AI Chat → price and FAQ. |

The landing introduces accounts, ecommerce and payments through their value to the maker. The person describes a change, explores the resulting interface and continues developing the product. An example ordering rule makes that approach concrete.

Framework code and documentation are free. Coding-agent charges, infrastructure and hosted AI Chat are separate. The page offers available help without promising a support schedule.

[Landing text](website/page.md) and [Landing layout](website/Landing.tsx) are two views of this page. Navigation connects its sections; repository links provide documentation, source terms and help.

## Design constraints

Apply the approved Measured Space identity: expressive serif headings, monospaced body copy, light neutral surfaces and a restrained green accent. Human photography connects the page to business work; the module and agent illustrations explain reuse and direction.

Keep the registered images intact, including their original backgrounds and proportions. Narrow screens stack content and allow the main button to wrap; wider screens pair text and imagery. Navigation, button states and FAQ disclosures remain clear and accessible.

The setup request can be copied into a coding agent. AI Chat retains its own action; this static preview shows a short unavailable message until its destination is supplied.

## Metadata and review

**Title:** Code Framework — Build with a coding agent | SinglePageStartup

**Description:** Reuse common functions, describe your business logic to a coding agent and build your own product with SinglePageStartup Code Framework.

**Open Graph title:** Build on what already works.

**Open Graph description:** Reusable foundations. Your business logic.

The website is planned in English (`en`) and Russian (`ru`), using the framework’s existing internationalization configuration. Each version includes its headings, body, navigation, actions, tooltips, messages, accessibility labels and metadata in that language. Use the same semantic content keys for both versions; keep names such as SinglePageStartup, Code Framework, AI Chat, Claude Code and Codex Desktop unchanged. The local-project action is **Run the project on your machine** in English and **Развернуть проект на своей машине** in Russian. Never insert a label from another language into a page.

The planned page route is `/`. The public domain and AI Chat destination remain to be selected. Review the visitor promise, content order, main action and Text/Layout views together.
