# Decision profile

This is project-specific routing knowledge, not a generic industry report or a
client-facing final deliverable. Keep it within 1,400 words and at most twelve
material requirement rows. Keep only decision areas that can change an artifact,
an experiment, or whether the business is viable. Do not copy an encyclopedia
of business-model questions into this file.

## Business-model classification

Describe compound models when necessary instead of forcing one label.

| Dimension                                               | Current classification | Evidence or artifact reference | Confidence or unknown |
| ------------------------------------------------------- | ---------------------- | ------------------------------ | --------------------- |
| Primary value and delivery mechanism                    |                        |                                |                       |
| Secondary or enabling mechanism                         |                        |                                |                       |
| Buyer, user, payer, beneficiary, and decision authority |                        |                                |                       |
| Offer or transaction unit                               |                        |                                |                       |
| Revenue and money flow                                  |                        |                                |                       |
| Cost, capacity, and scaling mechanism                   |                        |                                |                       |
| Geography, regulation, and material dependencies        |                        |                                |                       |

## Selected methods and benchmarks

Select only methods that constrain a material decision. Record an authoritative
source and limitations; do not name-drop a framework or copy its full checklist.

| Method or benchmark | Decision it supports | Source | Why it fits | Limitations |
| ------------------- | -------------------- | ------ | ----------- | ----------- |

## Material decision requirements

Use stable IDs. Classify the required answer as an `operator-fact`,
`research-question`, `professional-choice`, or `evidence-gap` in the required
evidence or status text. `answered` requires an artifact/evidence reference;
`proposed` is a professional decision awaiting the confirmation required by its
stage; `approved` records that confirmation; `not-applicable` requires a reason.
`required`, `blocked`, and `proposed` prevent completion of their stage. An
`assumption` never answers an `operator-fact`.

| ID  | Stage | Decision or question | Why material | Required evidence | Metric or threshold | Risks or regulation | Viability rule | Owner artifact | Status and reference |
| --- | ----- | -------------------- | ------------ | ----------------- | ------------------- | ------------------- | -------------- | -------------- | -------------------- |

Allowed status values: `required`, `blocked`, `proposed`, `answered`,
`approved`, `not-applicable`.

## Stage gate

| Stage | Required profile IDs | Blocking gaps | Gate result |
| ----- | -------------------- | ------------- | ----------- |

A stage passes only when every factual row assigned to it is `answered`, every
material direction that requires operator confirmation is `approved`, and every
remaining row is explicitly `not-applicable`. The referenced artifact must
contain the project-specific decision, and consequential claims must link to
evidence or an explicit non-evidence classification. Every project profile must
include a `00-business` scope-confirmation row, a `10-strategy`
strategy-approval row, and a `20-brand` brand-approval row. Scope confirmation
includes the complete current/intended Portfolio with objective roles and
lifecycles. Strategy approval includes separate audience-growth and
sales-product priorities, the experiment track, and the exact active product
set selected from that Portfolio.
