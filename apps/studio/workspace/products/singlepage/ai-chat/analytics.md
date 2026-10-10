---
confirmation:
  confirmed: false
observation_review:
  accessed: "2026-10-06"
  sources:
    - product.md
    - sales.yaml
  coverage: Planning documents only; no production analytics, CRM, payment or support dataset supplied.
review:
  dependencies:
    product.ai-chat.product: 5212a0163b9d453689340ff925ed6d6d94d729e0c890e8e0d75209b6e6eb50bb
    product.ai-chat.sales: 79f28a18291ea9aeffdbc17c4218f2327421e23092f86dc7540319e09ce66ede
---

# AI Chat analytics

## Measurement scope

This page is the single product-owned place for current AI Chat observations. The first-stage `business-users` journey starts with people entering and describing their projects. It follows input through draft written Brief, Strategy, Brand and Design documents and a separate full section structure for each product, then user corrections, acceptance, saved-context chat, export and repeat use. The owner uses these observations to assess the quality and usefulness of the description flow and improve it. The intended stages and metric definitions remain in [Sales](sales.yaml); goals remain in [Product](product.md); revenue and cost terms remain in [Product economics](product.md#revenue-streams).

Landing-page assembly, the block editor and paid server deployment are outside the first-stage offer. Their future IDs remain in Sales `future_journey`, with measurement disabled. A landing page, repository or published site is not a current acquisition promise, activation event or completion condition. Future deployment prices and availability are unknown and do not block learning from the written-document offer.

No production analytics, CRM, payment or support dataset has been supplied for this review. No reporting window or measured denominator is available. The current state is **not measured**; missing observations do not mean zero activity. The map below identifies the intended observations, not collected events or working instrumentation.

## Funnel observations

| Sales reference                                     | Value / denominator    | Intended observation boundary                                                                                                                                                   | Source and limitation                                                                                         |
| --------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Acquisition: `demonstration`, `search`, `community` | Not measured / unknown | Attributed visits and movement into discovery, by route.                                                                                                                        | No traffic or campaign dataset supplied.                                                                      |
| Journey: `discover`                                 | Not measured / unknown | Relevant visits, CTA use and exits before workspace access.                                                                                                                     | No visitor or navigation dataset supplied.                                                                    |
| Journey: `access`                                   | Not measured / unknown | Registration and login attempts, successful workspace entry, access failures and exits.                                                                                         | No account-access dataset supplied.                                                                           |
| Journey: `describe`                                 | Not measured / unknown | Supplied material, draft written project sections, separate product section coverage, questions, unknowns, contradictions and abandonment during intake.                        | No intake or document-progress dataset supplied.                                                              |
| Journey: `purchase`                                 | Not measured / unknown | Purchase entries by interrupted task, chosen packages, payment attempts, credited tokens, failures and return to the saved task.                                                | No payment or task-resumption dataset supplied; a purchase-page entry is not a completed payment.             |
| Journey: `review`                                   | Not measured / unknown | User corrections and acceptance, per-product completeness, unresolved decisions and evidence gaps, contradictions, useful-result feedback, exports and repeated-input problems. | No document-review or export dataset supplied.                                                                |
| Journey: `continue`                                 | Not measured / unknown | Useful saved-context discussions, requested criticism, acted-on criticism, later document changes and repeat-use cohorts.                                                       | No usage or feedback dataset supplied; token purchases are recorded under `purchase`.                         |
| Journey: `manage`                                   | Not measured / unknown | Account and saved-document changes, deletion requests and outcomes, and exits during management.                                                                                | No account-management dataset supplied; deletion from active service data does not establish backup deletion. |
| Journey: `support`                                  | Not measured / unknown | Requests by issue, response time, unresolved requests, resolution where observed, and return to work.                                                                           | No support dataset supplied; response and resolution are separate observations.                               |

The first-stage progression is supplied project input → draft written sections
→ user corrections and acceptance. Per-product coverage checks whether each
declared product has its own Product, Operations & Economics, Sales, Promotion,
Analytics and research or evidence where needed. Promotion coverage means a
written description of intended public presentation, including Website,
Creative and Presentation text where relevant. It does not require a built site,
published page or produced media. A present heading is structural coverage,
not a completed business decision. Unknowns, missing evidence and contradictions
must stay separately observable. Acceptance records the user's review of the
text; it does not establish demand or validate a market claim.

Document usefulness, corrections that resolve a gap and useful chat based on
saved context are learning signals. Export is a distinct intended use; an export
event alone does not establish use outside the service. Observed reuse requires
an attributable source. No such observations are currently available.

### Future measurements, disabled for the first stage

| Sales future reference    | Status                         | Future observation boundary                                                    | Current limitation                                                                               |
| ------------------------- | ------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Future: `landing-preview` | Disabled / outside first stage | Sandbox creation, block edits, saved previews and consideration of deployment. | No first-stage sandbox offer or measurement scope; not a current activation or completion event. |
| Future: `framework`       | Disabled / outside first stage | Repository and server connections, deployments, public addresses and updates.  | Future paid offer terms and availability are undecided; not current tested behavior or outcomes. |

When a later offer becomes available, its measurement scope must distinguish
AI Chat-originated publication from independent Code Framework adaptation.
Attribution would require the originating project, sandbox and repository;
without a traceable origin it stays unknown. Repeated deployment attempts do not
mean additional published projects. A deployed page does not establish customer
enquiries or a successful hypothesis test. These are future measurement rules,
not observations or enabled first-stage events.

## Product usage and retention

Project-description starts, written-section drafts, user corrections and
acceptance, completeness of each product's own sections, unresolved gaps,
contradictions, useful saved-context chat, exports, repeat use, repeat purchase,
support and abandonment are not measured. Each reported observation needs its
definition, cohort, denominator and reporting window. Returning to a saved task
after payment differs from returning for a later useful session. Support
observations distinguish the initial response commitment from resolution, and
account management distinguishes a deletion request from removal of active data.
Qualitative feedback needs its collection method and sample; it does not
establish representative usage, retention or document quality. Publication and
first customer enquiries are outside this first-stage learning scope.

## Revenue and cost observations

No customer revenue, top-up volume, token consumption, refunds or attributable
service-cost observations have been supplied. Package sales and credits,
request debits, settlement debits, token reversals and cash refunds for packages
are separate observation categories. Failed or cancelled requests return all
their deductions under Product's terms; no reversal dataset has been supplied
to verify delivery of that policy. Provider expenses for those requests are
borne by the service and remain unmeasured, independently of the customer's
zero net request charge. Other provider costs, embedding and storage, hosting,
and payment acceptance remain unmeasured; rounding surplus is not evidence
that those costs are covered.

Owner funding is financing, not customer revenue; owner time is not a cash
expense. Shared time follows Product's `founder-time` allocation: development
and support are split equally, and AI Chat carries 80% of remaining owner
activities. No observed hours or cash totals have been supplied, so no
attributed total, contribution margin or comparison with Code Framework is
calculated.

## Sources and limitations

[Product](product.md) and [Sales](sales.yaml) define this observation map. The
access date and inspected-source coverage are recorded in metadata. These
planning documents establish intended scope, not customer behavior, available
instrumentation or service results; no production system was inspected for
this entry. An observation requires an identified analytics, CRM, payment,
support or research source with its reporting window, coverage and attribution
rule. Missing values and uncertain attribution remain unknown.
[Research](research.md) cites this page when interpreting demand, channels,
offer or retention rather than keeping a second observation table.
