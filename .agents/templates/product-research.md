---
finding_prefix: EX
confirmation:
  confirmed: false
---

# Product research

<!-- One named product, preferably about 1,400 words per page, without a hard cap. Prepared before its strategic
selection and maintained with the product. No business-wide Research document.
Sources and findings remain here; they do not become client facts in Product or a model. -->

## Decision and scope

Product ID, decision this research can change, scope/geography, evidence window,
method and limitations. Name the model ID, assumption ID and decision owner
being tested. Keep questions, methods, observations, limitations, contradictions
and implications together here; owners cite finding IDs rather than copying them.
Include only materially relevant supporting activities.

## Buyer and purchase situation

Distinguish client-stated audience from observed customers and inferred needs.
Identify user, buyer, payer, trigger, and commitment where supported.

## Alternatives and competition

Direct competitors, substitutes, informal options, and doing nothing. Explain
why the comparison set fits this product; availability does not prove demand.

## Price, channels, and evidence

Separate the client's current price/constraints from external prices, channel
observations, and proposed routes. State sources, dates, fit, and limitations.

## Findings and unknowns

Consequential findings with stable references, observation/inference class,
confidence, decision impact, contrary evidence, and unresolved gaps. Link client
contradictions as questions rather than silently correcting client facts.

Set `finding_prefix` to a stable uppercase product prefix, replacing the example
`EX`. It must start with a letter, contain only letters/digits, and be unique
among products in the same source-layer catalog. Give each finding the short ID
`<product-prefix>-<SPS|S>-<number>`: `EX-SPS-01` belongs to `singlepage`, and
`EX-S-01` belongs to `startup`. Use at least two digits for the number. Keep the
source marker when inherited; `default` never owns findings. Declare findings
as bold IDs at the start of a paragraph, list item or table row. Use the complete
short ID in every citation and metadata `finding_ids` entry; spell out ranges as
complete IDs. Dotted namespaces and unqualified IDs are not valid.

## Sources

As many compact source rows as material findings need, with no hard cap: stable ID, attributable source/link,
original access date, supported finding, and limitation. Sources shared by
products need an explicit applicability statement in each consuming product.
Source IDs may be local to this document; cross-document source references must
include its Research path. Include repository identity when combining repositories.

Apply `.agents/contracts/research-sales-audit.md` for segment-by-segment Sales
validation, competitor detail, evidence verdicts and the reusable Research tree.
