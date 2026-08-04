# Decision profile

This is a project-specific routing contract, not a generic industry report or a
ninth final deliverable. Keep only decision areas that can change an artifact,
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

Use stable IDs. `answered` requires an artifact/evidence reference;
`not-applicable` requires a reason. A `blocked` row prevents completion of its
stage.

| ID  | Stage | Decision or question | Why material | Required evidence | Metric or threshold | Risks or regulation | Viability rule | Owner artifact | Status and reference |
| --- | ----- | -------------------- | ------------ | ----------------- | ------------------- | ------------------- | -------------- | -------------- | -------------------- |

Allowed status values: `required`, `answered`, `blocked`, `not-applicable`.

## Stage gate

| Stage | Required profile IDs | Blocking gaps | Gate result |
| ----- | -------------------- | ------------- | ----------- |

A stage passes only when every profile row assigned to it is `answered` or
`not-applicable`, the referenced artifact contains a project-specific decision,
and consequential claims are linked to evidence or an explicit non-evidence
classification.
