# Claim sources and asset contract

## Claims

Classify every consequential claim as `verified-fact`, `client-claim`,
`assumption`, `promise`, `constraint`, `unknown` or `missing-evidence`. Client
wording is not independently verified evidence, and client approval does not
make a market hypothesis true. Public-facing copy links to evidence or keeps an
explicit non-evidence classification.

Research observations cite a source and separate observation from inference.
Store them in the visible Audience, Competitors or Semantics page that owns
the subject. Use a direct source link for attribution and a Storybook story
with a heading anchor for cross-document references. Query-group and product
IDs remain domain identifiers; a separate finding-ID registry is not required.
Every consequential comparison, measurement and limitation used in a decision
must be readable on its owning page.

A GitHub commit and file snapshot verify the exact committed content at its
full SHA. A changed path alone is not a changed claim, and committed source
does not verify runtime behavior, integration, compatibility, adoption or
outcomes; record those limits beside the affected claim.

## Unknowns

Classify every material unknown by who can resolve it, once, in the document
that needs the answer, together with the decision it blocks:

- `operator-fact`: a current fact or constraint the operator controls or knows,
  including the project boundary, existing customers or users, the products in
  scope and the role of supporting activities, budget, available time and
  contacts, rights and license intent, support capacity, geography, decision
  authority, owned assets, preferred references and non-goals;
- `research-question`: an external fact that requires attributable evidence;
- `professional-choice`: a strategy, communication, design or experiment
  proposal that the owning role is expected to make;
- `evidence-gap`: proof that does not exist yet and stays explicitly missing or
  becomes the subject of an experiment.

An `assumption` may support a clearly labeled proposal but never answers an
`operator-fact`; ask the operator instead. Do not convert missing capacity,
budget, channel access, rights, support or decision authority into a number to
satisfy a template or pass a stage. Research answers external questions within
the named product. The agent must perform available research before calling a
fact unavailable; see `.agents/contracts/research-ownership.md`. When findings
contradict a private condition controlled by the owner, explain that conflict
and ask for the specific missing decision.

## Source ownership

There is no project Evidence document, transcript register, fact log or change
register. Client answers and material constraints are recorded once in Brief or
the owning product description; the dialogue establishes the user's decisions. External observations, dated sources, inference and missing proof
belong to the visible Audience, Competitors or Semantics page of the product;
file origin and rights belong to Assets;
previous wording and document review history belong to Git. Current documents stay self-contained: agents never reread Git
history for ordinary stage work, and a document states each fact or decision
once with only the attribution and limits needed to interpret it.

A source title, a retired register code or a phrase such as "operator
confirmation" is not enough on its own. State the fact, decision or observation
beside the reference with its source, date and scope, and for an approval say
what was approved and what remains outside it. Keep working links and asset IDs
for navigation, never as the only explanation. When retiring a source, recover
only the material meaning from attributable records; do not invent context or
copy its history into the document.

Current business facts, requirements, product conditions, decisions and proposals
belong in the visible body of their owning Studio page. Frontmatter keeps only
structural identifiers and concise source references for those visible statements.
It must not contain an alternate offer, hidden instructions, old decisions or
substantive facts absent from the page.

Do not create a second full version such as intake.md, details.md or
product-details.md to shorten a visible document. Consolidate relevant content
on its owning page; remove obsolete copies and update their references. Asset provenance remains in the asset registry, and original attachments may
remain as files. Imported CSV or API responses are inputs, not a substitute for
visible measurement tables. Keep all decision-relevant rows, source parameters,
comparisons and conclusions on the owning page. Do not create a separate
Research document or hidden findings register. Previous wording belongs to Git.

State a future feature as a plan and a desired benefit as a goal. Do not append
generic absence-of-measurement disclaimers to product descriptions or the Brief.
Keep a specific limitation where it changes the interpretation of a research
finding or a commercial condition. Never turn an unmeasured claim into a
measured result by removing its qualification.

## Assets

Every asset entry records a stable ID, source type (`client`, `generated`,
`stock` or `public-reference`), evidence flag, rights status, purpose, related
artifacts, allowed and prohibited use, prompt when applicable, and source or
tool. Accepted client and public-reference files are stored below
`assets/<layer>/intake/<category>/` with their category recorded in the
registry; the accepting layer owns the file even when the entry is later
visible through inheritance. Assets is a reference register loaded by current
use, not a linear document; it keeps only current material rows and concise
limitations.

Every `generated` entry records `lifecycle: proposed` until operator approval
changes it to `approved`, plus the `proposal_id` declared as the current
`Visual proposal ID` in Design, and lives below
`assets/<layer>/generated/<proposal_id>/`. Rejection, withdrawal, supersession
or upstream invalidation removes the generated file, its registry entry and its
detailed design from the living artifact in the same change; there is no
`withdrawn`, `rejected`, `superseded`, `stale` or provenance-only lifecycle and
no second rejection register. Before cleanup, record the constraint in the
owning document with the exact statement `The operator rejected visual proposal
<proposal_id>.`; a rejected proposal ID never remains current or returns.

Automatic cleanup is limited to exact paths owned by `generated` entries that
no current proposed or approved artifact references. Verify `source_type:
generated`, a path inside the active workspace asset tree and the absence of
current references first; stop and ask when provenance, ownership, path or
current use is ambiguous. Remove a `client`, `stock` or `public-reference`
input only after an attributable owning decision marks the exact item rejected,
replaced, duplicated or no longer needed; verify its registry ID, path and
current references, then remove the file, the entry and every stale
current-artifact mention together. Age alone never authorizes deletion.

Generated photographic and illustrative masters remain registered production
sources after a square delivery is prepared. The master keeps its original
file, hash, dimensions and exact generation prompt. The delivery records its
source asset ID, actual square dimensions, editing tool, exact canvas-expansion
prompt and review. Keeping a referenced master is not proposal rejection or
supersession. Put the delivery in the active Design role and use the master as
its production source. An already-square master may be reused unchanged with
that fact recorded. Historical generation and editing prompts remain immutable;
a later production rule does not retroactively describe earlier operations.

Icon libraries and custom icon sets have registered vector sources. Record the
library's version or pinned revision, source URL and license, or the custom
set's authorship and rights. The Design Iconography section defines the drawing
and usage rules; actual glyphs appear in its Icons block.

Before visual generation, record whether existing project assets and preferred
external references were supplied or explicitly absent, with provenance, rights
and whether use is mandatory, adaptable, replaceable or reference-only. For
every materially used external reference, record the source and the specific
observable quality to pursue or avoid. Reference status never grants permission
to publish or reuse a third-party file; inspect its recorded origin, license
and allowed use. Supplied identity assets, selected colors and permitted fonts
are inputs to apply within their recorded use; do not turn a reference label
into a blanket ban on them. Generated, stock or public-reference imagery is
never presented as the client's portfolio, completed work, customer result,
team, office or equipment without explicit evidence and rights confirmation.

A handoff fails when Design, the registry and the files do not share one
current proposal ID, when a registered generated path is missing, when a
generated output is orphaned anywhere below `assets/<layer>/generated/`, or
when Design names an asset absent from the active registry.

## Research conduct

Record material limitations, uncertainty, conflicts of interest and the access
date of every source. Use proportionate collection and protect participant
data. Do not fabricate participants, quotations, market size, competitor facts
or causal conclusions, and never disguise marketing as independent research.
Escalate decisions that depend on missing high-impact evidence.
