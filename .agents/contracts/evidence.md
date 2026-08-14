# Evidence and asset contract

## Claims

Classify every consequential claim as one of:

- `verified-fact`
- `client-claim`
- `assumption`
- `promise`
- `constraint`
- `unknown`
- `missing-evidence`

Research findings cite a source and distinguish observation from inference.
Client wording is not independently verified evidence. Public-facing copy links
to evidence or keeps an explicit non-evidence classification.

A GitHub commit and file snapshot may verify the exact committed content at its
full SHA. A changed path alone is not a changed claim, and committed source does
not by itself verify runtime behavior, integration, compatibility, adoption, or
outcomes. Record those limitations when GitHub reconciliation creates evidence.

For workflow routing, separately classify who can resolve an unknown:

- an `operator-fact` requires operator input or an existing attributable
  operator source;
- a `research-question` requires external evidence;
- a `professional-choice` is proposed by the owning role;
- an `evidence-gap` remains missing until proof exists or an experiment produces
  it.

An `assumption` may make a proposal explicit but cannot satisfy an
`operator-fact`, including budget, available time, reachable contacts, current
customers or users, rights and license intent, support capacity, geography,
decision authority, assets, or non-goals.

Every evidence row also declares `Scope` as `singlepage`, `startup`, or
`shared`, and `State` as `active`, `not-applicable`, or `superseded`. When the
active layer is startup, inherited singlepage rows are provenance only: they do
not support startup claims unless a startup row explicitly adopts or supersedes
them. Reuse a stable ID to correct a row. Keep the living register within 1,400
words: consolidate evidence that supports the same current decision and let Git
retain replaced singlepage history. Use a minimal non-active startup row only
when it must suppress an inherited framework claim.

## Assets

Every asset entry records a stable ID, source type (`client`, `generated`,
`stock`, or `public-reference`), evidence flag, rights status, purpose, related
artifacts, allowed use, prohibited use, prompt when applicable, and source/tool.
Store accepted client and public-reference source files below
`assets/<layer>/intake/`; the layer that accepts the input owns the physical
file even when its registry entry is later visible through inheritance.
Every `generated` entry also records `lifecycle: proposed` until operator
approval changes it to `approved`, plus the stable `proposal_id` declared as the
current `Visual proposal ID` in the design artifact. Store it below
`assets/<layer>/generated/<proposal_id>/`. Rejection, withdrawal, supersession,
or upstream invalidation removes both the generated file and its registry entry;
do not add a `withdrawn`, `rejected`, `superseded`, `stale`, or provenance-only
lifecycle. Git is the history for committed outputs.

An operator rejection is a durable decision fact. Record it before cleanup as
`The operator rejected visual proposal <proposal_id>.`, with the stable proposal
ID in backticks, classification `client-claim`, and the normal source, date,
limitations, and consumers. It cannot remain current in the design source,
registry, or generated tree.

Before visual Design generation, record whether existing project assets and preferred
external references were supplied or explicitly absent. For owned materials,
record provenance, rights, and whether use is mandatory, adaptable,
replaceable, or reference-only. For every materially used external reference,
record the source and the specific observable quality to pursue or avoid.
Reference status is preference evidence only; it grants no permission to copy,
derive from, publish, or reuse protected expression, trade dress, trademarks,
imagery, or source files.

Generated, stock, or public-reference imagery must not be presented as the
client's portfolio, completed work, customer result, team, office, or owned
equipment without explicit evidence and rights confirmation.

Automatic cleanup is limited to exact paths owned by `generated` entries that
are no longer referenced by a current proposed or approved artifact. Remove a
client, stock, or public-reference input only after an attributable owning
decision marks the exact item rejected, replaced, duplicated, or no longer
needed. Verify its registry ID, exact path, and current references first, then
remove the file, registry entry, and stale current-artifact mentions in one
change. Git retains history; age alone never authorizes deletion. A handoff
fails when Design, registry, and file do not
share one current proposal ID, a generated registry path is missing, a generated
output remains orphaned anywhere below `assets/<layer>/generated/`, or Design still
names an asset absent from the active registry.

## Research conduct

Record material limitations, uncertainty, conflicts of interest, and the date a
source was accessed. Do not fabricate participants, quotations, market size,
competitor facts, or causal conclusions. Escalate decisions that depend on
missing high-impact evidence.
