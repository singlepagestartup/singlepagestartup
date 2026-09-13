# Research of Sales segments and alternatives

Research tests the preceding Product and Sales proposals; it does not treat the
proposal itself as market evidence. At 10-strategy inspect available intake;
at 40-products audit each defined Sales segment before deriving Website and
Marketing Creative claims. This format applies to framework and downstream
projects, with their own segment IDs and market facts.

## Workspace and coverage

Keep the six-section `research.md` as a decision summary. Add an internal Research
tree through the product catalog: Customer segments → one Markdown page per Sales
segment; Competitors and alternatives → one or more comparison/detail pages.
The shared page browser renders and exports these files; no project-specific UI
is required. Follow `document-readability.md`: no aggregate or source-count cap.

For a completed segmented audit, set `sales_audit: true` in `research.md` metadata.
Each segment page declares `sales_segment: <Sales segments[].id>` and
`sales_dimensions: [needs, motivations, purchase_trigger, decision_criteria,
objections, acquisition, journey]`. Register every page in catalog section
`research`. Validation checks complete segment/dimension coverage and finding-ID
uniqueness across that product's Research corpus, not just the summary.
These keys demonstrate coverage only; prose and evidence establish quality.
Legacy intake can omit the audit flag until migrated; a completed 40-products
review with defined Sales segments must use the segmented audit.

## Investigation and resulting reference

For every material hypothesis record: exact segment/profile field, acquisition
ID or CJM step ID; proposed pain, desired progress or decision driver; evidence
and counterevidence with source/date/sample/fit; verdict (supported, partially
supported, contradicted, unresolved); confidence, limits and commercial impact.
Inspect every route and CJM step. Keep vendor capability claims distinct from
actual customer behavior. Distinguish novice/noncoder/professional samples, user,
buyer, payer and delegated tool; an agent's actions are not a human emotion or
an independent purchase. Do not invent interviews, conversion rates or proof of
product-specific demand from a broad survey.

Compare relevant direct competitors, substitutes, informal approaches and doing
nothing. Record offer, target situation, acquisition/promise, included/excluded
value, price/units/date and relevant terms, ownership/control, appeal, limitations
and implications for each segment. Preserve individual detail where a matrix
cannot express the decision. Compare fairly; category parity is not an exclusive
advantage. Link every material statement to attributable evidence and limitations.

Keep stable finding IDs across all pages, declared once; summaries cite them.
Retain all material sources, contrary evidence and unresolved hypotheses. Report
which Sales assumptions survive, need refinement or lack evidence, and what this
means for Website/Creative claims. Correct client facts only with attributed
client input; professional proposals may be revised by their owning role.
Research is business work, not installation, source-code or runtime auditing.

## Review dependencies without an approval cycle

The Research summary uses its declared detail pages; their changes invalidate
Research and its consumers. Research with `sales_audit: true` and segment pages
observe the fingerprint of Sales as the hypothesis under investigation. This
inspected input participates in `review.dependencies`, but does not recursively
inherit Sales approval/staleness: Sales already uses Product, which uses Research.
A changed Sales body therefore requests a fresh audit without a circular approval
gate. Brief/model inputs retain normal dependency semantics. Snapshot refresh
requires actual impact review; it never grants approval or copies an old hash.
