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

Every evidence row also declares `Scope` as `singlepage`, `startup`, or
`shared`, and `State` as `active`, `not-applicable`, or `superseded`. When the
active layer is startup, inherited singlepage rows are provenance only: they do
not support startup claims unless a startup row explicitly adopts or supersedes
them. Reuse a stable ID to correct a row; keep an explicit non-active row rather
than silently deleting evidence history.

## Assets

Every asset entry records a stable ID, source type (`client`, `generated`,
`stock`, or `public-reference`), evidence flag, rights status, purpose, related
artifacts, allowed use, prohibited use, prompt when applicable, and source/tool.

Generated, stock, or public-reference imagery must not be presented as the
client's portfolio, completed work, customer result, team, office, or owned
equipment without explicit evidence and rights confirmation.

## Research conduct

Record material limitations, uncertainty, conflicts of interest, and the date a
source was accessed. Do not fabricate participants, quotations, market size,
competitor facts, or causal conclusions. Escalate decisions that depend on
missing high-impact evidence.
