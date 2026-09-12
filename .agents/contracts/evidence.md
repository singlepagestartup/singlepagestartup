# Claim sources and asset contract

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
outcomes. Record those limitations beside the affected claim during GitHub reconciliation.

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

## Source ownership

There is no separate project Evidence document or global fact/change register.
Record client answers and material constraints once in Brief or product models. The
dialogue and explicit document confirmation establish the user's decisions;
do not create a second record of every question, answer, edit, or approval.
Keep only source attribution or limitations needed to interpret a current claim.

External market findings, dated sources, inference, and missing proof belong to
the relevant product Research. File origin and usage rights belong to Assets.
Document metadata owns confirmation and upstream review status. Git retains
previous wording and change history. Current documents must be self-contained;
do not force agents to reread Git history for ordinary stage work.

In a current document, a source title, retired register code, or phrase such as
"operator confirmation" is not enough on its own. State the relevant fact,
decision, or observation in a short sentence beside the reference, with its
source/date and scope or limitation where needed. For an approval, say what was
approved and what remains outside it. Keep working links and asset IDs for
navigation, but never make their labels the only explanation. When retiring a
source, recover only the material meaning from attributable records; do not
invent missing context or copy its full history into the document.

Inherited framework facts are reference context, not automatically the client's
facts. Record applicable client answers in the startup owner and obtain the
required project-specific confirmation. A research finding cannot silently
overwrite client input; ask when it contradicts that input.

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

Before cleanup, preserve the current constraint in its owning Design/Brief
section and identify the exact retired proposal in the change description. Git
retains the rejection history; do not create a second rejection register. The
retired proposal cannot remain current in Design, Assets, or generated files.

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
