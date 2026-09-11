# GitHub reconciliation contract

## Purpose and boundary

Before every `singlepagestartup` invocation, inspect the configured GitHub
repository for relevant commits published after the first approved strategy
commit. Chat is not the change detector. Local, uncommitted, and unpushed files
are outside this preflight and remain protected as user work.

Run this before reading or reconciling the normal stage cursor:

```bash
npm run singlepagestartup:github:check
```

The command resolves the repository identity and active layer through the same
workspace resolver used to load artifacts, then fetches that layer's configured
GitHub remote, resolves its canonical branch, and returns structured JSON. The
caller does not select a layer. `--layer` may be supplied only as a diagnostic
assertion and fails when it disagrees with automatic resolution. A GitHub or
fetch failure is fail-closed: stop
before professional work and report the unavailable preflight. Never claim that
no changes exist from a stale local remote-tracking ref.

Repository routing is strict:

- `singlepagestartup/singlepagestartup` resolves to `singlepage` and may update
  only `singlepage` state, ledger, and living sources;
- an unlisted downstream repository resolves to `startup` and may update only
  `startup` state, ledger, and living sources;
- a conflicting gitignored `active_layer` is a hard failure and cannot override
  a detected repository identity;
- every strategy path and affected artifact ID in a reconciliation config must
  belong to its filename's layer, or the preflight fails before fetching or
  writing anything.

A downstream checkout never writes the inherited `singlepage` sources. When a
framework change is synchronized into a downstream repository, inspect its
effect on that project's resolved behavior and record only project-specific
adoption, contradiction, or evidence in `startup` sources. Framework-owned
truth is reconciled in the canonical framework repository.

## Baseline and ledger

The automatically resolved layer's committed configuration and reconciliation
ledger is:

```text
apps/studio/workspace/utils/pre-development/github/<layer>.yaml
```

The baseline is discovered on every invocation as the earliest commit on the
configured GitHub branch whose layer Strategy has valid user-confirmation
metadata. Historical sources without metadata retain their legacy approved
Decision status support. Present but false/stale metadata is authoritative;
see `.agents/contracts/document-confirmation.md`. Do not guess or store a chat-derived baseline. Before that commit is
published, `waiting-for-baseline` is expected and the normal workflow may
continue; report that GitHub monitoring is not active yet.

The scan covers every later commit. A commit is pending only when one of its
changed or renamed paths matches a configured relevance rule and its full SHA
is absent from `reconciliations`. Irrelevant commits require no ledger row. This
avoids a moving self-referential cursor and lets a fresh checkout reconstruct
the complete pending set from GitHub and committed reconciliation records.
Layer-configured ignore paths must exclude the reconciliation ledger and other
workflow-only files from broad application-code rules so recording a result
cannot trigger itself.

## Reconciliation

For each pending relevant commit, inspect its GitHub snapshot and diff without
checking out or overwriting the operator's working tree. A matching path is a
review trigger, not proof that a public claim changed.

Classify the result:

- `no-material-effect`: the current file change does not alter a business fact,
  proof boundary, decision, claim, experiment gate, brand rule, website
  behavior, or selected marketing creative;
- `material`: the current GitHub snapshot changes at least one of those items.

For a material result:

1. Identify the current fact, decision, or limitation affected by the commit.
   Preserve a commit/path reference beside that statement only when needed to
   support its meaning. A committed file proves its content, not runtime
   behavior or outcomes. Do not create an Evidence row or a duplicate changelog.
2. Update the earliest owning artifact.
3. Resolve reverse dependencies, including product files, under the document
   confirmation contract. Review `stale` inputs and rerun only contradicted
   owners; refresh dependency snapshots only after checking the impact.
4. Move the stage cursor to the earliest incomplete affected stage.
5. Record the commit, `material` outcome, affected artifacts, and
   a compact English summary in the layer ledger only after every required side
   effect succeeds.

For `no-material-effect`, record the commit and a concrete English reason after
inspection. Do not add document prose or move the stage cursor merely because a
configured path changed.

If any side effect fails, do not add the reconciliation row. The commit must
remain pending on the next invocation.

## Approval effects

Satisfying a gate already selected by an approved strategy does not itself
invalidate that approval. For example, verified MIT License publication removes
the publication blocker and updates proof and claim boundaries while the
approved audience, offer, acquisition focus, and experiment may remain intact.

When a GitHub change alters an approved audience, offer, positioning,
acquisition focus, budget, threshold, or other material direction, mark that
professional artifact stale under the document-confirmation contract, move the
cursor to its stage, and require fresh operator approval of the corrected
document before downstream work.
