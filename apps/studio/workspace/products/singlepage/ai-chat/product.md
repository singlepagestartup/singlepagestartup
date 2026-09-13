---
sources:
  scope: Client inventory confirmation, 2026-09-11; retained by Brief intake.scope, 2026-09-13.
  audience-value-and-flow: Brief intake.audience_value_and_flow and sources.answer_quality; operator correction, 2026-09-13, defines business-data chat, separately scoped vector knowledge, useful business answers, token buying and a local-framework branch.
  intention: Client scope and experiment decisions, 2026-08-09–10; support remains best effort.
  planning-scope: Operator correction, 2026-09-13; the Product describes the intended business before implementation. Planned outcomes and commercial choices remain distinct from observed customer results.
confirmation:
  confirmed: false
review:
  dependencies:
    brief: bf0f72b61cb12fc4a6fea78bd136dddb34e57921a7d8dbb528c25f85f30e68e1
    model.framework-service: 504fbbc151ee8cff9d740e06b44a6264c07206b1f9a8631f42702f5ab08d1f32
    product.ai-chat.research: 4a33b01f4414eff99200a5c8a73981a17b8e48873f296848faaec8bd02b363f2
---

# Product

## Product identity

| Decision          | Intended product                                                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Brand and product | **AI Chat** (`ai-chat`) is SinglePageStartup's central intended hosted service and a demonstration of its framework.                     |
| Category          | Business-specific AI chat using the user's supplied facts and documents.                                                                 |
| Lifecycle         | Intended product developed under the project owner's direction.                                                                          |
| Boundary          | Hosted chat consumption and token purchases belong here; local code deployment and reuse belong to Code Framework (`singlepagestartup`). |

## Customer Segments

| Role           | Known situation and responsibility                                                                                                                                              |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User           | `business-users`: people who bring their business facts/documents, configure a chat and seek relevant answers or advice. A narrower industry or business stage is not selected. |
| Buyer          | A user deciding to purchase tokens after positive use; an organization's separate purchasing role is unspecified.                                                               |
| Payer          | The person or organization funding those purchases; payer identity and purchasing authority remain commercial decisions.                                                        |
| Beneficiary    | The user and the business whose information informs the answers.                                                                                                                |
| Decision-maker | The user chooses questions, materials and continued use; organizational data authority remains unspecified.                                                                     |

Users interested in building can branch to the framework; others continue as hosted consumers.

## Problem and desired progress

| Dimension                   | Client intention and remaining limit                                                                                             |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Circumstance                | A person wants advice about their own business and has facts or documents that should inform it.                                 |
| Progress sought             | Get a useful result grounded in that business context, then return when further questions arise.                                 |
| Functional forces           | Bring relevant business knowledge into answers instead of relying only on a generic conversation.                                |
| Social and emotional forces | Distinct emotional/social drivers are not supplied.                                                                              |
| Pains and gains             | More relevant answers and less repeated explanation of the business context are desired; quantitative gains are not established. |

## Value Propositions

The user uploads business materials and configures the chat. Each chat is intended to have its own knowledge scope; relevant material from that scope informs its answers and advice.

Ordinary ChatGPT without that business context is the operator's comparison. More useful answers are the desired customer outcome; comparative evidence belongs to [Research](research.md). Demonstrating SPS is an additional project purpose.

## Offer and usage

Access provides a hosted chat, its configured business knowledge and interactions. The intended loop is supplying or updating context, asking questions, judging usefulness and continuing use. After positive use, consumers may buy tokens. [Revenue Streams](../models/framework-service/model.md#revenue-streams) owns token definitions and money terms.

The visible “Развернуть проект на своей машине” action introduces interested makers to GitHub and the separate framework journey. Token purchase is not required for this optional branch.

[Sales](sales.yaml) owns discovery, access, supplying knowledge, useful answers, purchases, repeat use, help and the framework handoff. Help is best effort without a response-time guarantee.

The offer still needs decisions on token price and unit, purchase conditions, selling entity, payer authority, access eligibility, rights to supplied business materials, retention/deletion and support policy. These open commercial and service decisions belong to AI Chat; they do not change the free framework offer. The product offers answers and advice; autonomous business actions and guaranteed outcomes are outside this intake.

## Business goals and metrics

| Goal                  | Intended business outcome                                         | Metric and management use                                                                             |
| --------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Discovery             | Attract people with relevant business questions and materials.    | Interested visits and people beginning chat use; prioritize explanations that attract suitable users. |
| Customer value        | Make business context useful in everyday questions and decisions. | User-rated useful answers and return use; refine the offer around recurring valuable tasks.           |
| Revenue and retention | Earn token purchases and continued paid use.                      | Purchases, repeat purchases and service costs; assess the offer's economics.                          |
| Framework discovery   | Introduce interested makers to the foundation behind the chat.    | Repository handoffs and subsequent framework use, separate from chat purchases.                       |

These are intended outcomes. Numerical targets, customer gains and revenue forecasts are unset.
