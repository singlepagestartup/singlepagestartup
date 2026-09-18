# Document confirmation

Each primary review document owns a `confirmation` parameter: YAML frontmatter
for Markdown, the same root key for Sales, Assets and other YAML review
sources. New sources start with `confirmation: { confirmed: false }`. Missing
metadata is unconfirmed; fluent prose, a completed cursor, a commit, an agent
answer, a review snapshot or an inherited approval never becomes user consent.
Keep the document title in the source; Studio omits the leading H1 when its
header supplies the title, and frontmatter is never rendered as prose.

After an explicit, attributable user confirmation, record:

```yaml
confirmation:
  confirmed: true
  by: operator
  at: "YYYY-MM-DD"
  source: "Attributable confirmation reference or wording"
  content_sha256: "fingerprint of the reviewed effective body"
```

The stamp is not a signature and not proof of the document's factual claims; it
never certifies market claims, runtime behavior, generated assets or permission
to publish. Approval of scope, one font, one asset or another partial decision
does not confirm a document; partial decisions stay scoped in their owning
source, including frontmatter. Brief keeps `intake.scope` with the confirmed
subject and product IDs and its attribution; that is not whole-document
confirmation and is revisited when the scope changes.

Read the current fingerprint without recording consent:

```bash
bun tools/studio/workspace/document-review.ts --file apps/studio/workspace/<artifact>/<layer>.md
```

The helper accepts product-local Markdown and Sales YAML and returns the
`content_sha256`, the current `review.dependencies` and the transitive
dependents with their states. `--repository-root <path>` inspects another
checkout instead of the working directory. It is read-only. Copy its hash only after
reviewing the exact current body and receiving approval. On rejection set
`confirmed: false`; on a substantive correction leave the old fingerprint
invalid until review or set false; never regenerate a valid stamp silently.
Hashing ignores metadata and outer whitespace but not body edits, so
metadata-only edits do not change the fingerprint. Confirmation is never
duplicated in body prose, a gate table, a checklist or an approval register;
the metadata and the Studio badge are its only surfaces.

## States and dependencies

Use exactly four resolved states:

| State         | Meaning                                                                                                     | Next action                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `unconfirmed` | No valid user confirmation of this body                                                                     | Review the proposal; obtain confirmation where the stage requires it |
| `confirmed`   | The user confirmed this body and its recorded inputs are current                                            | Use within the approval's scope and owning layer                     |
| `changed`     | The body differs from its approval fingerprint, or approval details are incomplete                          | Review the new body; do not silently renew approval                  |
| `stale`       | An upstream input changed, an input is missing or unreviewed, or a material impact is explicitly unresolved | Reconcile upstream impact before consuming this document             |

`stale` takes precedence: `confirmed: true` is a historical approval, not
permission to consume a stale result. Missing dependency snapshots never make a
confirmed document green; a new draft without a snapshot stays unconfirmed
until its snapshot is initialized after checking the current inputs.

Precedence hides the document's own state, so the resolver keeps it as
`underlying` and readers name both. A document reported as `stale` over
`changed` needs its own body confirmed as well as its inputs reconciled;
reconciling the inputs alone leaves the approval covering a body that no longer
exists. The pipeline check prints this pair and fails `00-business` on a Brief
whose stamp no longer covers its body.

Each document records its last reviewed direct inputs in its own metadata:

```yaml
review:
  dependencies:
    model.example: "fingerprint returned by the read-only review helper"
    product.example.research: "fingerprint returned by the helper"
  # Add only while a material impact remains unresolved:
  stale:
    reason: "The client changed capacity; the launch scope needs revision."
    sources: [model.example]
```

A dependency is a semantic review relationship, never a runtime import, a
formula or a text substitution. Shared edges come from the index `uses` graph;
the resolver adds product inputs from the selected atomic catalog: a model uses
Brief and the resource-owning models it references; Research uses Brief and its
model; Product uses Brief, Research and its model; Sales uses Product and the
model; Strategy uses the models and each product's Research and Sales;
Analytics uses Product, Sales and the model; Website uses Product, Sales, the
model, Strategy, Brand and Design; Creative and Presentation keep their product
and design inputs; a Research summary uses its registered detail pages.
Research remains the upstream evidence owner: model or Product citations of
findings are reviewed by the agent, never reciprocal edges. Two edges are
`observes` rather than `uses`: every product Research observes its product's
Analytics as evidence, and a segmented Sales audit observes the Sales body as
the hypothesis under test. An observed input's fingerprint is stored in
`review.dependencies` without inheriting its approval or staleness, which is
what keeps `research → analytics → product → research` from being a cycle.
Only `uses` edges propagate upstream stale states; both edge kinds detect
changed or missing inspected content. Added or removed inputs require review.
The implementation of these edges is `tools/studio/workspace/review.ts`.

## Impact review

Before consuming an artifact, inspect its resolved state with the workspace
loader or the helper. After editing an owning upstream document:

1. Resolve reverse dependencies, including product-local files. Fingerprint
   differences, missing, added or removed inputs and upstream `stale` propagate
   to dependents even when their bodies did not change. Detection is a review
   trigger, not a verdict that the decision is wrong.
2. Review the actual effect in dependency order. If a change has no material
   effect, update only that document's dependency snapshot, preserve its valid
   confirmation and explain a consequential no-effect judgment in the task
   response or the change text, not in a project log. Write the snapshot with
   the helper rather than by hand:

   ```bash
   bun tools/studio/workspace/document-review.ts --file <document> --refresh
   ```

   It replaces the recorded fingerprints of that one document, leaves every
   other byte of the file alone, and touches neither `confirmation` nor
   `review.stale`. Run it only after the review, because a refreshed snapshot
   is a statement that the inputs were examined.

3. For a material effect, set `review.stale` with the source IDs and a concise
   reason, correct the earliest owning document, then reconcile the affected
   owners. Do not rewrite a dependent's body automatically or update its stamp
   from another document; compare its claims with the changed source and edit
   its derived wording where needed, even when that dependent's own stage gate
   is closed (a full rerun of the dependent is not allowed then). The marker
   stays until the owner's correction is complete; copying current hashes never
   clears a known problem.
4. Once the owner's correction is complete, refresh the snapshot and remove
   `review.stale` even if the revised body still awaits confirmation: the
   document then resolves as `changed` until the user confirms it, and a stage
   that permits an unconfirmed draft leaves it false. Inspection, not
   confirmation, is the precondition for a snapshot. Move the cursor to the
   earliest remaining incomplete stage.

Because `stale` takes precedence, clear inherited staleness first, starting from
the root input whose snapshot no longer matches, and only then read a document's
own approval state. A stamp whose fingerprint never matched the body it was
committed with surfaces as `changed` once the chain is clear; it is treated like
any other mismatch and needs a fresh confirmation, never a copied hash. A
snapshot is not refreshed against a body that an open operator question is
about to change.

Keep proposed, approved and stale meaning explicit. A professional proposal is
not an approved upstream dependency, and a confirmed correction that changes a
premise makes every contradicted downstream artifact stale until its owner has
reconciled it.

## Layers

- Empty startup inherits the whole singlepage body and its confirmation; the
  badge stays concise and the projection names singlepage. This is not
  confirmation by the startup project's user, and an inherited framework
  approval never satisfies a startup approval gate.
- New or changed startup content without its own confirmation is unconfirmed
  even when the singlepage base is approved. An explicit startup false
  overrides base true, including from a metadata-only file.
- Startup may confirm inherited or partially overridden text without copying
  it; its hash covers the full resolved body, including every retained base
  section. Both the `default` and the startup source view evaluate that same
  confirmation while the source view shows only the local fragment. A later
  change to a retained base section invalidates the startup confirmation; a
  change hidden by a startup replacement does not change the effective body.
- Review metadata follows the same effective body. An unchanged inherited
  document inherits its input snapshot; a changed startup body needs its own. A
  metadata-only startup `review` replaces the review object atomically, so a
  local impact review can clear inherited staleness without copying the body,
  while confirmation still belongs to the user and layer that approved it.
  Hidden changes in replaced base sections do not invalidate startup
  dependents; a retained changed base section does.
- Product catalogs stay atomic: confirmation belongs to the files of the
  selected product's own layer, with no per-product fallback and no
  cross-product approval.

Strategy, Brand and complete Design approval gates read valid confirmation of
the active project's layer directly from the owning document; the pipeline
check executes them. Other documents report their review state without
replacing their factual completion criteria. Source descriptions and header
help explain a document's purpose and use; editing paths and dependency detail
stay in the metadata area below the document.
