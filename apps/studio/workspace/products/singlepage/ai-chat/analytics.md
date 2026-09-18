---
confirmation:
  confirmed: false
review:
  dependencies:
    model.framework-service: 24505045708eaee8184c7d988841e54b6408be46051b785d18989c6329a14a80
    product.ai-chat.product: 128b557ac48280f0ad09eefbe05fdc4e54a8aaa4c8c972205ffa5f53cb6cbc9e
    product.ai-chat.sales: 9ce83a549912024d0916ae119c2f6ddb55502ed0d727983f60dfc89e63b60400
---

# AI Chat analytics

## Measurement scope

This page is the single product-owned place for current AI Chat observations. It follows the `business-users` customer journey from acquisition through material intake, project structuring and approval, later idea work, landing-page sandbox preparation, token purchase, GitHub repository creation and deployment to the user's server. The intended stages and metric definitions remain in [Sales](sales.yaml); goals remain in [Product](product.md); revenue and cost terms remain in [Operations & Economics](../models/framework-service/model.md).

As of 17 September 2026, no production analytics, CRM, payment or support dataset has been supplied for this review. The current state is **not measured**, rather than zero. Planned events are not reported as observations.

## Funnel observations

| Sales reference                                     | Observation  | Period                       | Source and limitation                                                                                                                    |
| --------------------------------------------------- | ------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Acquisition: `demonstration`, `search`, `community` | Not measured | No reporting window supplied | No attributable traffic or campaign dataset is connected.                                                                                |
| Journey: `discover` → `access`                      | Not measured | No reporting window supplied | Visitor and workspace-entry events are unavailable.                                                                                      |
| Journey: `describe` → `review`                      | Not measured | No reporting window supplied | Supplied-material, five-stage review, question, correction, unknown, time-to-reviewed-model and accepted-project events are unavailable. |
| Journey: `landing-preview`                          | Not measured | No reporting window supplied | No sandbox creation, saved-edit, preview-render or publication-start dataset is available.                                               |
| Journey: `continue`                                 | Not measured | No reporting window supplied | Idea discussions, requested criticism, useful-result ratings, token purchases and continued-use cohorts are unavailable.                 |
| Journey: `framework`                                | Not measured | No reporting window supplied | GitHub authorization, repository creation, server connection, deployment, public address and later-update events are unavailable.        |

## Product usage and retention

Activation, supplied-material processing, completion and correction of each compact stage, time to a reviewed project model, accepted project completion, landing-page sandbox creation and revision, repository and deployment completion, useful idea discussions, criticism acted on, repeated work, token consumption, repeat purchase, support use and abandonment cannot yet be reported. When instrumentation exists, each observation must identify its event definition, cohort, denominator and time window. Qualitative feedback can be included with its collection method and sample; it must not be presented as representative usage data.

## Revenue and cost observations

No customer revenue, token-sales volume, refunds or attributable service-cost observations have been supplied. Owner funding described in the shared model is financing, not customer revenue. Shared costs must use the allocation basis recorded by Operations & Economics before they are attributed to AI Chat.

## Sources and limitations

The current entry was prepared from the confirmed Product, the intended Sales process and the shared model only to define the measurement boundary. Those planning documents are not evidence of actual behavior. A future update should name the inspected analytics, CRM, payment, support or research source; record its reporting window and coverage; and preserve unknowns where attribution is unavailable. [Research](research.md) should cite these observations when interpreting demand, channel, offer or retention questions instead of copying the table.
