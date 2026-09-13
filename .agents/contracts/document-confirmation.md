# Document confirmation

Each primary review document owns a `confirmation` parameter. Markdown uses
YAML frontmatter; Sales and other YAML review sources use the same root key.
Start with `confirmation: { confirmed: false }`. Missing metadata is unconfirmed,
never implicitly approved from fluent prose, a completed cursor, or a commit.
Keep document titles in the source; Studio omits the leading Markdown H1 when
its page header already supplies a title. Frontmatter is never rendered as prose.

After explicit user confirmation, record:

```yaml
confirmation:
  confirmed: true
  by: operator
  at: "YYYY-MM-DD"
  source: "Attributable confirmation reference or wording"
  content_sha256: "fingerprint of the reviewed effective body"
```

Only an attributable user decision authorizes setting true. This metadata is
not a digital signature or independent proof of the document's factual claims.
Approval of scope, one font, one asset, or another partial decision does not
confirm an entire document. Partial decisions remain explicitly scoped in their
owning source, including frontmatter when status prose would clutter the body.
Brief may retain `intake.scope` with its confirmed subject/product IDs and
attributable source; this is not whole-document `confirmation` and must be
revisited when that scope changes. Existing explicit whole-document Strategy/Brand confirmations
may be migrated without asking the operator to repeat unchanged decisions.

Get the current fingerprint without changing approval:

```bash
bun tools/studio/workspace/document-review.ts --file apps/studio/workspace/<artifact>/<layer>.md
```

The helper also accepts product-local Markdown and Sales YAML. It is read-only;
never treat running it as confirmation. Copy its hash only after reviewing the
exact current body and receiving approval. On rejection, set confirmed false.
On a substantive correction, retain the old fingerprint as invalid until review,
or set false; never silently regenerate a valid confirmation stamp. The resolver
reports changed content or an incomplete true record as needing confirmation
again. Hashing ignores metadata and outer whitespace, not body edits.

## Content ownership and semantic dependencies

Each document owns its content. A dependency is a semantic review relationship,
not a runtime import, formula, or text substitution. If a model changes a price,
mark affected product materials stale, compare their claims with the model,
and edit their derived wording when needed, and obtain any required renewed confirmation. Do not rewrite its
body automatically or update its approval hash from another document. A source
change with no material effect needs only an impact review and snapshot refresh.
Presentation follows the same rule with its own content and confirmation.

## Status and upstream review

Use exactly four resolved document states:

| State         | Meaning                                                                                                  | Next action                                                          |
| ------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `unconfirmed` | No valid user confirmation of this body                                                                  | Review the proposal; obtain confirmation where the stage requires it |
| `confirmed`   | The user confirmed this body and its recorded inputs are current                                         | Use within the approval's scope and owning layer                     |
| `changed`     | The body differs from its approval fingerprint, or approval details are incomplete                       | Review the new body; do not silently renew approval                  |
| `stale`       | An upstream input changed, an input is missing/unreviewed, or a material impact is explicitly unresolved | Reconcile upstream impact before consuming this document             |

`stale` takes precedence over the other states; `confirmed: true` in source
metadata is a historical approval, not permission to consume a stale result.
Missing dependency snapshots never make a previously confirmed document green.
New drafts without a snapshot stay unconfirmed; initialize their snapshot after
checking the current inputs. Metadata-only edits do not change body fingerprints.

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

The review helper above returns both `content_sha256` and the current
`review.dependencies`, plus transitive `dependents` with paths and current states
for impact review. The shared workspace index `uses` graph defines shared
inputs. The resolver adds product inputs from the selected atomic catalog:
Model and product review edges follow `product-models.md`. Model sources are
registered once as `model.<id>` and shared changes propagate to their actual
consumers. Research remains the evidence owner; tested-assumption links never
create reciprocal approval dependencies. Added or removed inputs require review.
A Research summary uses its registered Research detail pages, so changed evidence
invalidates downstream decisions. Under `research-sales-audit.md`, Research also
observes Sales as the hypothesis being tested: the raw body fingerprint is stored
in `review.dependencies`, but Sales approval/staleness is not recursively inherited
through that observation. A changed Sales body requests a fresh audit without a
Research → Product → Sales approval cycle. Only regular `uses` edges propagate
upstream stale states; both edge kinds detect changed/missing inspected content.

Before consuming an artifact, inspect its resolved status with the workspace
loader or review helper. After editing an owning upstream document:

1. Resolve reverse dependencies, including product-local files. Body fingerprint
   differences, missing/added/removed inputs, and upstream `stale` propagate to
   dependents, even if their own bodies did not change. Automatic detection is a
   review trigger; it does not establish that the semantic decision is wrong.
2. Review the actual effect in dependency order. For no material effect, update
   only that artifact's dependency snapshot. Preserve an unchanged valid user
   confirmation; do not ask the user to approve the same decision again. Explain
   a consequential no-effect judgment in the task response or Git change text,
   not in a new project log.
3. For material impact, set `review.stale` with its source IDs and concise current
   reason. Update the earliest owning artifact, then reconcile affected owners.
   Keep this marker until the correction and any required user confirmation are
   complete; merely copying current hashes must not clear a known problem.
4. Once the owner's decision is current, update its dependency snapshot and remove
   `review.stale`. Refresh confirmation only after explicit user confirmation of
   the revised body. If the stage permits an unconfirmed draft, leave confirmation
   false. Move the cursor to the earliest remaining incomplete stage.

There is no standalone Evidence document, approval registry, or change register.
Client facts and material source attribution stay with the owning statement;
external sources stay in the product Research; asset provenance stays in Assets.
Git retains previous versions. Never turn a commit, an agent answer, a review
snapshot, or an inherited approval into new user consent.

## Layer resolution

- Empty startup inherits the whole singlepage body and its confirmation. The UI
  names singlepage; this is not confirmation by the startup project's user.
- New or changed startup content without its own confirmation is unconfirmed,
  even when its singlepage base is approved.
- An explicit startup false overrides base true, including a metadata-only file.
- Startup may explicitly confirm inherited text without copying it. Its hash
  covers the full resolved document, including every retained base section.
- For partial overrides, record the full resolved body's hash, never just the
  startup fragment. Both default and startup source views evaluate that same
  confirmation while the source view still displays only its local fragment.
- A later change to a retained base section invalidates startup confirmation.
  A change hidden by a startup replacement does not change the effective body.
- Review metadata follows the same effective body. An unchanged inherited
  document inherits its input snapshot; a changed startup body needs its own.
  A metadata-only startup `review` replaces that review object atomically, so a
  local impact review can clear inherited staleness without copying the body.
  Its confirmation still belongs to the user/layer that actually approved it.
  Compare effective inputs: hidden changes in replaced base sections do not
  invalidate startup dependents. A retained changed base section does.
- Products keep atomic catalogs: confirmation belongs to files in the selected
  product's own layer, with no per-product fallback or cross-product approval.

The shared agent loader and Studio use the same parser, merger, and confirmation
resolver. Do not write a default file, approval registry, or a second editable
status copy. Source descriptions and header help explain the document's purpose
and how the operator uses it; editing paths and technical dependency information
stay in the source metadata area below the document.

## Stage gates and GitHub baseline

Strategy, Brand, and complete Design approval gates read valid confirmation
metadata for the active project's layer. Inherited framework approval cannot
satisfy a startup approval gate. Read approval directly from the owning document;
do not duplicate it in a gate table or separate checklist.
Other document statuses report review state without replacing their existing
factual completion criteria. Document confirmation never certifies individual
market claims, runtime behavior, generated assets, or permission to publish.

For historical published strategies without confirmation metadata, GitHub's
baseline detector retains its legacy approved-row support. Once metadata is
present it is authoritative: false or a mismatched fingerprint cannot be
rescued by an old approved sentence in the body. A published startup confirmation
is checked against the singlepage base at the same commit.
