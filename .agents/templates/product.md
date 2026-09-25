---
confirmation:
  confirmed: false
customer_segments: [] # Stable IDs described in Customer Segments and referenced by Sales v2.
---

# Product

<!-- One product or service in a prospective business plan.
Describe the intended offer and experience before engineering. Keep client facts,
market evidence and proposed outcomes distinct; do not invent operator numbers.
Runtime checks, bug repair and release/license-source audits are not completion
criteria. -->

## Product identity

| Decision          | Required answer                                                                          |
| ----------------- | ---------------------------------------------------------------------------------------- |
| Brand and product | Brand, distinct product name, and one-sentence category description                      |
| Category          | The market context that makes the product's value understandable                         |
| Lifecycle         | Current foundation, owner and intended development direction; approval lives in metadata |
| Boundary          | What belongs to this product and which related offers or showcases do not                |

## Customer Segments

- Distinguish user, buyer, payer, beneficiary, and decision-maker; combine
  roles only when they are genuinely the same person. Give distinct segments
  stable names/IDs, declare the IDs in customer_segments frontmatter, and connect
  each to its value proposition below. Sales uses these IDs for its segment pages.
- State the qualifying situation and trigger, the status quo or alternatives,
  the characteristics that make this customer care more than adjacent
  segments, and explicit exclusions.

## Problem and desired progress

| Dimension                   | Required answer                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------ |
| Circumstance                | What has changed or become urgent enough to create a decision                        |
| Progress sought             | The outcome the customer is trying to reach, not a feature request                   |
| Functional forces           | Tasks, constraints, costs, and risks in getting there                                |
| Social and emotional forces | Confidence, accountability, reputation, anxiety, or control when material            |
| Pains and gains             | What must become easier, safer, faster, or more valuable, and how that is recognized |

## Value Propositions

| Element                     | Required answer                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------- |
| Competitive alternatives    | What the customer would do if this product did not exist, including the status quo |
| Differentiated capabilities | Capabilities the relevant alternatives do not provide in the same way              |
| Customer value              | The practical consequence enabled by each differentiated capability                |

Map jobs, pains, and gains to the offer, but do not call the mapping product-market
fit without customer evidence.

## Offer and usage

- Define the intended access or deliverable unit, included and excluded scope,
  usage experience, support, rights and dependencies. Revenue Streams below
  carries the money terms; Sales owns the complete customer process.
- Describe how the customer obtains value, continues using the offer and, when
  relevant, adopts it again. These are product requirements, not installation
  instructions, runtime acceptance checks or a debugging plan.

## Revenue Streams

Per segment: the payer, the unit they pay for, the price or the rule that
calculates it, the currency, whether it is one-off or recurring, when payment is
taken, and the commercial conditions that matter. A product that charges no money
is still paid: state what it receives instead, such as attention, adoption,
contributions or the customers it sends to another product, and keep the exchange
as concrete as a price. Distinguish customer revenue from financing. Terms live
here once; Sales references them while keeping its own process.

## Key Activities

The activities that create and deliver this product's value, and who owns each.
Link the Sales process rather than describing it again.

## Key Resources

The people, infrastructure, financial and intellectual resources this product
needs, with stable resource IDs, owner, availability and material constraints. A
resource shared with another product is named in both, each stating the share it
carries and the basis for that share.

## Key Partnerships

Suppliers and partners, what each one does, how much the product depends on them,
and the evidence for that. An integration is not a partnership agreement. State
material unknowns rather than filling them.

## Cost Structure

The costs that follow from the activities, resources and partners above: fixed or
variable, the amount, currency and period when known, and the assumptions behind
any calculation. Separate cash expense from founder time. A cost shared with
another product appears in both with the basis for its split stated, so the same
money is never counted twice.

### Funding

Who supplies capital or subsidy, on what conditions and within what limits, kept
separate from customer Revenue Streams. Do not invent budgets, financing or
contribution margins.

## Assumptions and decision rules

Stable assumption IDs tied to this product's decisions, with attribution and
state; material unknowns, objections, signals and the consequence of each for a
decision. Link the Research that tests an assumption instead of copying its
findings. An operator fact blocks only the decisions that need it.

## Business goals and metrics

| Goal                       | Intended business outcome                             | Metric and management use                                             |
| -------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------- |
| Acquisition or recognition | Who should discover and consider the offer            | A relevant measure of interest and its use in business decisions      |
| Value and adoption         | Why people should choose and use it                   | Customer value, adoption or revenue measures appropriate to the model |
| Retention and growth       | Why use, purchases or recommendations should continue | Continued use, repeat business or other project-fit growth measures   |

Choose only goals that fit the product. Distinguish planned outcomes from measured
results. Numerical targets and forecasts need a stated basis; leave unsupplied
operator budgets and figures unknown. Business learning can inform these choices,
but this section does not prescribe engineering tests or release gates.

Initial client-factual Product is created after confirmed Brief, before Strategy.
Later apply approved Strategy, Brand, Design and Assets as a coherent business
proposal without redefining them. Confirmation belongs to metadata.
