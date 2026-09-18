---
repository: singlepagestartup/singlepagestartup
date: 2026-09-18
status: phase-5-dry-run-complete
---

# Pre-development instruction dry run, phase 5

Twelve runs of the local pre-development workflow by Claude Opus agents: six
tasks, each executed once with the instruction set before phase 3 (commit
`80bf5cdb14`) and once with the rewritten set (branch
`claude/agents-pipeline-prose` at `f721ab2bde`). The question was whether the
compacted instructions produce the same documents and decisions as the
detailed ones, and what they cost.

## Setup

- Framework tasks (T1 to T4) ran in isolated git worktrees checked out at the
  variant commit, with the real GitHub preflight (`--no-fetch`, because twelve
  concurrent fetches share one repository and the harness had fetched seconds
  before) and the real workspace.
- The downstream task (T5) ran in a plain directory holding the variant's
  instruction set and a read-only copy of the m2commerce startup workspace;
  the preflight was declared unavailable by the harness and the layer resolved
  to `startup` through the workspace config.
- The legacy task (T6) ran against the framework's own synthetic fixture built
  with a v1 catalog and retired `ST-EV-04` codes, one fixture per instruction
  set.
- Agents could not spawn sub-agents and performed each role themselves from the
  canonical role file; the operator was absent, so a run ended at its first
  operator question. Nothing was committed. Each run wrote a report with its
  commands, pipeline output, changed files, handoff, question, instruction gaps
  and the instruction files it read.
- One distortion applies to every new-set run: the harness injects the launch
  checkout's `CLAUDE.md` into the agent context, and that checkout was still on
  `main` with the pre-phase-3 section, so the new runs carried the old 2,301-word
  entry file in addition to the new files they read.

## Tasks

| Task | Operator request                                                                                          | Expected exercise                                      |
| ---- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| T1   | «Продолжи работу над проектом.» on the framework workspace                                                | Preflight, cursor reconciliation, first useful action  |
| T2   | Rebuild Strategy from Brief, models, Research and Sales                                                   | Full professional rerun by the Strategist              |
| T3   | Rewrite `products/singlepage/ai-chat/product.md` preserving unique facts                                  | Full rerun of a product document and its impact review |
| T4   | A confirmed commercial fact for AI Chat (100 generations for 990 RUB, YooKassa, no expiry, 14-day refund) | The change loop across owners and dependents           |
| T5   | «Продолжи работу над проектом.» on the m2commerce copy                                                    | Downstream reconciliation with real structural gaps    |
| T6   | «Продолжи работу над проектом.» on the legacy fixture                                                     | Legacy-shape detection and the retired-procedure path  |

## Results

### Outcome parity

| Task | Old set                                                                                                                                                | New set                                                                                                                                                                                         | Same essence                                                                                                                       |
| ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| T1   | 4 files: two Research snapshots refreshed, 8 ledger rows (1 material), cursor to `10-strategy/blocked`; question: confirm Strategy                     | Same 4 files, same snapshots, 8 ledger rows (all no-material-effect), same cursor; same question                                                                                                | Yes; both discovered that the Strategy and Brand stamps never matched their bodies                                                 |
| T2   | Strategy rebuilt: 5 sections, two products with the same roles, organic channel system, no budget, open commercial terms; 2,568 words with frontmatter | Strategy rebuilt with the same decisions, plus a risk table; 2,886 words                                                                                                                        | Yes; both longer than the operator-confirmed 2,056-word original, neither invents facts                                            |
| T3   | `product.md` rebuilt, 11 `sources` kept, 2 added; snapshots of 7 dependents refreshed against the unconfirmed body; 11 files changed                   | `product.md` rebuilt, 11 `sources` kept unchanged, `review.stale` recorded on the Product itself; 3 files changed                                                                               | Yes on content (same six sections, same facts, Value Propositions as a table in both); different judgment on refreshing dependents |
| T4   | Fact recorded in Brief, model, Sales, Product, Research; 6 dependents marked stale; 15 files; question: what one generation is                         | Fact recorded in the same owners plus Website pages; whole stale cascade repaired (38 snapshot files); 50 files; question: confirm Strategy                                                     | Same owners and blocker resolution; the new run did far more reconciliation and resolved «one generation = one token» itself       |
| T5   | Cursor to `10-strategy/blocked`, Brief category key renamed to the current schema, 4 Strategy snapshots refreshed; question: confirm Strategy          | Same three edits; additionally found 35 documents with stale Brief fingerprints and a contradiction between Brief and Strategy about the introductory course; question about that contradiction | Yes; the new run found a real client-fact contradiction in the m2commerce workspace                                                |
| T6   | Cursor to `00-business/blocked` with six anchors, no document edits; `catalog-v1` reported as framework-owned; question: meaning of `ST-EV-04`         | Identical, with the procedure read from Git history through `migrations/README.md`                                                                                                              | Yes                                                                                                                                |

The documents produced by the new set preserve the decisions of the current
confirmed documents: two products with their roles, organic channels and no
budget, depth over reach, the same segment and roles for AI Chat, the same
eight-step offer and the same goal table. Differences are wording, table
shape and length, not decisions. Both sets stop at the same operator gates.

### Cost

| Task  | Tokens old | Tokens new | Tool uses old | Tool uses new | Instruction words read old | Instruction words read new |
| ----- | ---------- | ---------- | ------------- | ------------- | -------------------------- | -------------------------- |
| T1    | 226,078    | 209,163    | 83            | 98            | 22,308                     | 9,920                      |
| T2    | 275,083    | 283,019    | 103           | 116           | 45,752                     | 11,515                     |
| T3    | 310,093    | 261,678    | 118           | 117           | 30,959                     | 12,157                     |
| T4    | 278,617    | 339,875    | 146           | 170           | 29,969                     | 14,203                     |
| T5    | 270,109    | 295,350    | 83            | 106           | 25,482                     | 14,162                     |
| T6    | 174,983    | 140,635    | 57            | 41            | 27,879                     | 14,124                     |
| Total | 1,534,963  | 1,529,720  | 590           | 648           | 182,349                    | 76,081                     |

The instruction context read per run fell by about 55 percent, from 22 to 46
thousand words to 10 to 14 thousand. End-to-end run cost did not fall: the
runs are dominated by reading the workspace, inspecting commit diffs and the
amount of reconciliation an agent chose to do, which varies more between two
runs of the same task than the instruction saving. T4 and T5 with the new set
did strictly more work (the whole stale cascade, the client contradiction) and
cost more; T3 and T6 did the same work and cost less. The compaction pays in
maintenance and in the fixed context of every invocation, not in the length of
a reconciliation session.

### Instruction gaps that the runs surfaced

Reported by the agents; the first group was fixed on the branch after the
runs, the second is phase-4 work, the third is a decision for the owner.

Fixed in the new set:

- `document-confirmation.md` steps 3 and 4 contradicted each other about when
  `review.stale` is removed; now the marker goes when the owner's correction is
  complete and the document resolves as `changed` until confirmed.
- `stale` hides `changed`: the contract now says to clear inherited staleness
  from the root snapshot first and then read the document's own approval state.
- The `observes` edges (Research to Analytics, Sales audit to Sales) are now
  named in the edge list, with the resolver file.
- The cursor `blockers` format and the `active_artifacts` rule when a stage is
  blocked on an earlier document's fact are defined.
- The GitHub preflight is read-only; the workflow now says the agent performs
  the material side effects and writes the ledger rows before the pipeline
  check.
- A legacy shape in the active layer keeps its owning stage incomplete even when
  the check computes it complete; a legacy shape in the inherited singlepage
  base of a downstream checkout is framework-owned and only reported.
- Snapshot refreshes after a no-material-effect review are reconciliation, not
  stage work; a snapshot is never refreshed against a body an open operator
  question is about to change; inspection, not confirmation, is the
  precondition.
- A full rerun reads the previous document once to inventory the facts that
  must survive; the previous body is not generation input. Table cells do not
  count toward the readability target.
- Per-document owners at `40-products` are named in the workflow again.
- An explicit operator request for a later-stage document while an earlier
  stage is blocked is a narrowly scoped change; the cursor stays at the
  earliest incomplete stage.
- With several open gates, the single closing question concerns the earliest
  blocked stage.
- Correcting derived wording in a dependent during impact review is allowed
  even when that dependent's own gate is closed.

Phase 4, code and tests:

- The computed stage ignores `legacy_shapes`, so a workspace with unmigrated
  codes reports every stage complete; the check should turn an active-layer
  legacy shape into a structural gap of the owning stage.
- Editing a confirmed Brief body invalidates its stamp, but the `00-business`
  gate only checks that metadata exists and the scope is confirmed; a
  `changed` Brief passes silently.
- `generated-assets-registered` compares registry paths file by file, while the
  m2commerce registry registers directories; either the check accepts a
  directory entry that covers its files or the registry contract requires one
  entry per file. 105 false orphans on m2commerce.
- The Brief intake status vocabulary (`missing`, `supplied-unreviewed`,
  `ready` in template and role) differs from what `visual-intake-ready`
  accepts (`ready`, `out-of-scope`), and the five `visual_references` key
  names exist only in `checks.ts`.
- The GitHub ledger `summary` scalar breaks the preflight when it contains a
  colon followed by a space; the template comment should show a block scalar.
- There is no writer for dependency snapshots; agents refresh dozens of
  `review.dependencies` blocks by hand or with ad hoc scripts. A
  `document-review.ts --refresh` mode would make the impact review cheaper and
  less error-prone.
- `document-review.ts` resolves the repository from the working directory, so
  running it from another checkout silently reads that checkout.

Owner decisions:

- The Strategy and Brand confirmation stamps of the framework workspace were
  recorded against bodies that never existed in Git (both changed inside
  commit `818f097d`); every run stops on this. Confirm the current bodies or
  correct them.
- `products/singlepage/ai-chat/product.md` and `sales.yaml` carry the same
  kind of mismatch.
- In the m2commerce workspace, Brief and Strategy disagree about whether the
  introductory paid course version includes construction modules.

## Verdict

The compacted instruction set produced the same decisions, the same stopping
points and documents of the same essence as the detailed set on all six tasks,
with about 55 percent less instruction context per run and no measurable
change in end-to-end cost. The gaps the agents reported were almost all present
in both sets; the ones that the rewrite could close were closed on the branch.
Phase 4 is where the remaining gaps live: they are checks, tests and tooling,
not prose.
