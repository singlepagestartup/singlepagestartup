# Business

<!-- One shared portfolio business model. Maximum 1,400 words. Product-specific
sales and delivery workflows live in portfolio/<layer>/<product-id>/sales.yaml.
Do not combine several products into one funnel here. -->

## Business model

- Customer problem, value exchange, offer unit, price, costs, capacity, goals
- Normalize the confirmed Portfolio: state which mechanics are shared across
  directions. Keep distinct buyers, money flows, delivery, support, and capacity
  in each active product's Sales process. Do not add a direction that the
  operator did not confirm.
- Buyer/user/payer/beneficiary roles, monetization mechanics, unit economics,
  material dependencies, and scaling constraints required by the active profile

## Shared operating process

Cover only company-wide routing, ownership, resource allocation, and handoffs
that affect more than one direction. Product-specific inquiry → qualification →
payment → delivery → completion belongs in that product's Sales file.

Use at most ten decision-relevant steps. Combine routine substeps.

| State | Step | Actor/owner | Input and action | Output/complete when | Failure and fallback |
| ----- | ---- | ----------- | ---------------- | -------------------- | -------------------- |

## Shared routing and control rules

- Company-wide contact receiver, direction-routing fields, decision authority,
  resource conflict rules, and cross-product constraints. Product-specific
  qualification, price, SLA, payment, and fulfillment belong in Sales.

## Promises and constraints

- Supported promises, prohibited promises, assumptions, unknowns
- Answer or block every decision-profile row owned by `business.md`; do not
  replace domain economics with generic business-model language
