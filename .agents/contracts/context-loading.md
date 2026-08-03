# Context loading contract

## Resolution

1. Use an explicit workspace root when supplied.
2. Otherwise read gitignored `workspace/config.local.yaml` when present.
3. Otherwise select `singlepage` only when repository identity is
   `singlepagestartup/singlepagestartup`; select `startup` for every downstream
   repository.

Every artifact and knowledge item is declared in the active layer's
`index.yaml` with a stable ID, kind, path, concise description, and `uses` IDs.

## Selective inheritance

Startup may load a singlepage item only when both conditions hold:

- the singlepage index exports the ID;
- the startup index imports the same ID.

Never expose non-exported singlepage brief, evidence, business, research,
strategy, brand, website, or assets to startup context. This is deterministic
semantic isolation over a normally merged Git repository; it is not a promise
of physical confidentiality.

## Minimal context

Load the active artifact, its transitive `uses` dependencies, the active role,
the workflow section that invokes it, and only the indexed knowledge selected
for the decision. Do not load both complete layers, every profession reference,
all channel knowledge, or every template.

Reverse dependencies are computed from `uses`; they are not stored as editable
lists. Missing IDs, missing files, invalid import/export pairs, and cycles are
hard failures.
