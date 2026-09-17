---
finding_prefix: CF
confirmation:
  confirmed: false
sales_segment: makers
sales_dimensions:
  - needs
  - motivations
  - purchase_trigger
  - decision_criteria
  - objections
  - acquisition
  - journey
review:
  dependencies:
    brief: 83d4aadfbdc83227f855dae61d050deabca18ad34de8bd3f6a38de0c4c0e70ed
    model.framework-service: c8a792962f8250e6fc649ac02a907dcbdccdeeb711603c670f06eebd101f9f8e
    product.singlepagestartup.sales: 5f4d91f14898077c62d3576a0dd298c4393d3aa788e05df4d42bf6d85b0cbf13
---

# Makers: customer evidence and Sales implications

## Scope and evidence

Assess the proposed [Sales segment `makers`](../sales.yaml): people with a business idea who use conversational coding tools. The actor is the human creator or team; framework adoption has no code checkout. Its audience assumptions and proposed experiences are hypotheses under evaluation.

**Verdicts:** `supported` means evidence supports the stated claim in the described setting; `partially-supported` means only part or an adjacent population is supported; `contradicted` means evidence opposes the claim; `unresolved` means the review cannot decide it. None means SPS conversion has been measured. Confidence is medium for recurring general needs and motivations, low for transfer to SPS. All acquisition and journey effectiveness judgments have low confidence; documented platform mechanics have high confidence.

This purposive desk review combines two primary academic studies, three first-person community accounts and the [competitor offers](competitors.md). Sources were accessed 2026-09-13. It is not a representative customer sample, interview programme or willingness-to-pay study. Public posts are self-reports; identity, bills and business results were not independently verified.

| Evidence                           | Observed signal                                                                                                                                                                                          | Boundary                                                                                                            |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| M1: experience-group survey        | 162 analysed Prolific responses, 54 each from non-developers, novices and professionals. Accessibility most motivates non-developers; novices emphasize learning and experimentation.                    | January–February 2026 recruitment; self-reported groups and behaviour, not SPS users or a geographic market sample. |
| M2: Brazilian university hackathon | 31 students in nine mixed/computing teams; 27 exit surveys. Fast first drafts lowered the perceived barrier to starting; one participant subsequently made a personal website.                           | One educational day, not commercial adoption or retained framework use.                                             |
| M3: nontechnical business user     | A Canadian nonprofit project manager reports choosing Lovable for a credible website without agency expense, disliking drag-and-drop builders, then considering a coding-agent-assisted move to Next.js. | One showcase post promoting the person's site; claimed expenditure and quality are not audited.                     |
| M4: cost surprise                  | A Replit hobby-project user reports expecting a monthly subscription to cover continued building, then exhausting credits after hours.                                                                   | One complaint; coding experience unspecified. It supports possible billing confusion, not its prevalence.           |
| M5: contrary preference            | Another Replit user reports cancelling a separate Claude subscription because the bundled offer suited them, while worrying about future terms.                                                          | One account, unknown experience; the colleague's hosting story is hearsay and is not counted as another customer.   |

## Needs, motivations and adoption decision

| Finding and Sales dimension                | Verdict and confidence        | Evidence and implication for Sales                                                                                                                                                                                                                                                                  |
| ------------------------------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **CF-SPS-15** — `makers.needs`             | `partially-supported`; medium | M1–M3 support accessible creation and understandable results. Demand for the exact registration/cart/payment bundle is not established for every maker. Sales keeps functions conditional on the business task; a brochure site may not need commerce.                                              |
| **CF-SPS-16** — `makers.motivations`       | `partially-supported`; medium | Accessibility, autonomy and learning have evidence; saving SPS tokens or repeatedly using SPS does not. Sales makes business progress the desired outcome and deeper technical learning optional. It can serve both a person avoiding technical work and a beginner who also wants to learn.        |
| **CF-SPS-17** — `makers.purchase_trigger`  | `partially-supported`; low    | M3–M4 start with a concrete website or hobby project. No reviewed account begins with SPS AI Chat. Sales makes the current idea or task the central trigger; useful chat experience is an optional source of interest.                                                                              |
| **CF-SPS-18** — `makers.decision_criteria` | `partially-supported`; medium | M3–M5 and competing offers support checking result fit, cost clarity, guidance, and hosted convenience versus control. Sales includes continued guidance, expected help and the reason to choose a local project. Neither lowest sticker price nor maximum code ownership is universally preferred. |

## Objections and responses

**CF-SPS-19 — `makers.objections`: `partially-supported`, medium confidence.** The current concerns and responses address coding knowledge, expense, alternatives and hosted convenience. The materials intended to answer them remain proposals; their effect on SPS adoption is unmeasured. These concerns are paraphrases, not interview quotations.

| Concern to cover                                                               | What the evidence permits                                                                                                                                                       | Proposed Sales response                                                                                                                                                                     |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| I can describe the idea, but what happens when I cannot judge the next change? | M1 distinguishes access to generation from the ability to evaluate it; M2 concerns early prototypes. A pleasant interface alone does not establish a complete business outcome. | Show a business scenario with its expected result and a plain-language explanation of changes. Explain where a maker can get help; keep best-effort support explicit.                       |
| How much will this actually cost?                                              | M4 establishes a possible mismatch between subscription expectations and usage charging; current competitor terms confirm these are different charges.                          | Separate code price, coding-agent use, operation, external services and optional chat purchases. Explain what makes costs change; do not imply free code makes the project free to operate. |
| Why leave a builder that already works for me?                                 | M5 and documented managed builders contradict any blanket assumption that users want local operation.                                                                           | Compare the maker's need for reusable code and customization with the convenience they would give up. Staying hosted is a valid outcome.                                                    |
| Why SPS instead of another foundation?                                         | Free and paid alternatives already offer common functions and agent guidance.                                                                                                   | Show which required functions fit, what remains specific to the idea, and what support the maker can expect. Do not promise universal savings.                                              |

## Acquisition and customer journey

**CF-SPS-20 — `makers.acquisition`: `unresolved` effectiveness.** Platform mechanics are supported in CF-SPS-04, CF-SPS-08, CF-SPS-09 and CF-SPS-10. Competitor use of demonstrations, documentation and communities shows these are established formats; it does not validate SPS reach or conversion.

| Sales acquisition ID                  | Assessment                                                                                                 | Implication                                                                                                                                       |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `makers.acquisition.hosted-chat`      | `unresolved`: no observed chat-consumer-to-framework conversion.                                           | Explain the optional move to a personal product, including who it suits. Preserve the consumer's ability to continue using chat.                  |
| `makers.acquisition.video`            | `partially-supported` as a format; channel performance unresolved.                                         | The planned demonstration shows a business task and its adaptation. Maker tutorials can lead directly to the framework; AI Chat remains optional. |
| `makers.acquisition.search-community` | `partially-supported`: M3's discussion shows learning and peer guidance, not attributable SPS acquisition. | Answer the actual task or comparison. Match the link to that need, respect community rules, and keep search visibility as an unmeasured outcome.  |

**CF-SPS-21 — `makers.journey`: `partially-supported`.** The proposed map is a useful planning structure. Individual accounts support trying, evaluating and seeking advice; no source observes this complete SPS journey or establishes the desired emotions.

| Sales journey ID                       | Verdict and current process implication                                                                                                                                         |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `makers.journey.reached-explanation`   | `partially-supported`: recognizable results can motivate exploration (M2–M3). The current map includes direct task-led discovery as well as chat.                               |
| `makers.journey.recorded-decision`     | `partially-supported`: fit and expense matter (M3–M5). The planned comparison includes staying with a managed builder and the need for guidance.                                |
| `makers.journey.evaluation-started`    | `unresolved` for SPS: interest is not a completed personal project. The intended handoff includes continued guidance and responsibilities, without a one-click outcome promise. |
| `makers.journey.capability-checked`    | `partially-supported`: natural-language iteration is observed, useful SPS business adaptation is not. The intended evaluation judges the task outcome alongside the interface.  |
| `makers.journey.adoption-decided`      | `unresolved` for retention: M2 contains one later personal project, not SPS reuse. Track first use, continued use and a new project separately.                                 |
| `makers.journey.support-and-community` | `partially-supported`: public discussions show advice seeking. The current process explains help before adoption and keeps it reachable throughout the journey.                 |

Keep questions about the maker's actual task, prior tools, preferred level of control, affordable continuing expense and help expectations open. Their answers should determine fit; this research supplies no population frequencies or numerical growth targets.

## Sources

All accessed 2026-09-13. IDs are local to this page. Academic sources report participant evidence; commercial pages in the linked comparison establish offers, not customer demand.

| ID  | Attributable source                                                                                                                                                | Sample, interest and limitation                                                                                                               |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| M1  | Fawzy, Tahir and Blincoe, [From Prompting to Verification](https://arxiv.org/html/2605.24521v1), 2026-05-23                                                        | Academic preprint, 162 screened online respondents, three equal experience groups; Prolific recruitment and self-report limit generalization. |
| M2  | [Can you feel the vibes?](https://arxiv.org/html/2512.02750v1), 2025-12-02                                                                                         | Academic study of one Brazilian public-university event; students and mixed teams, 31 participants/27 surveys; not paying business customers. |
| M3  | Reddit user FLLCY, [No experience with coding…](https://www.reddit.com/r/lovable/comments/1p0iy9w/no_experience_with_coding_and_my_real_estate/)                   | One self-described Canadian nonprofit project manager; showcase/self-promotion and selection bias; reported migration remains an intention.   |
| M4  | Reddit user missiondad, [Out of credits in 4 hours?](https://www.reddit.com/r/replit/comments/1rgnypq/out_of_credits_in_4_hours/)                                  | One hobby-project complaint; no verified invoice or demographic profile; historical bill is not current pricing.                              |
| M5  | Reddit user Routine-Data-1169, [Cancelled Claude subscription…](https://www.reddit.com/r/replit/comments/1w1n74p/cancelled_claude_subscription_because_of_replit/) | One favorable self-report and concern about future terms; coding experience and geography unknown.                                            |
| C1  | [Sales](../sales.yaml), [Brief](../../../../brief/singlepage.md)                                                                                                   | Client-selected audience and proposed process; the object's structure does not validate its details.                                          |
| C2  | [Competitor offers](competitors.md)                                                                                                                                | Current primary vendor terms and their separate limitations; comparison, not independent outcome evidence.                                    |
