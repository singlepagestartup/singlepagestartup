## Summary

Phase 3 of compacting the pre-development instruction corpus: the prose is rewritten by the phase-1 ledger so that every rule lives in exactly one place or is removed with a recorded reason. The workflow keeps the invocation order, the stage table, the working rules and the handoff; a new inheritance contract owns layers, projections, indexes, atomic catalogs and downstream applicability; evidence and document-confirmation absorb the asset lifecycle and the review edges; roles keep method, thresholds and a one-line handoff; the tools catalog owns allowed capabilities; `CLAUDE.md` and `AGENTS.md` point at the workflow instead of summarizing it. Six contracts and the eight one-time migration procedures are removed. The cursor schema, stage IDs, `active_artifacts` vocabulary and document anchors are unchanged. A typical invocation now loads about 9,600 words of process instructions instead of about 27,700.

## Changes

- `.agents/contracts/inheritance.md` (new): layers and projections, layer resolution, workspace and indexes, products and models, design layout, styles and fonts, downstream applicability. `evidence.md` and `document-confirmation.md` rewritten; `github-reconciliation.md` trimmed. Removed without stubs: `artifact-lifecycle.md`, `context-loading.md`, `document-readability.md`, `pipeline-reconciliation.md`, `product-models.md`, `research-sales-audit.md`.
- `.agents/workflows/pre-development.md`: 10,341 to 2,113 words; entry, the every-invocation loop (preflight, cursor, pipeline check, gap repair, decision-scoped loading), stage table, working rules with the single readability paragraph, change loop, ownership, tool launch, handoff.
- `.agents/roles/*.md` (seven): method, thresholds, one-line handoff and editorial pointer; inputs, capabilities, readability and contract restatements removed; `brand-designer` absorbs the Design method of the workflow, `business-analyst` the segmented Sales method, `market-researcher` the Sales audit.
- `.agents/migrations/README.md` (new): the directory's purpose and the eight retired procedures with their detectors and the commit that holds their text. `.agents/pipeline/pre-development.yaml`: only the six `legacy_shapes[].procedure` pointers changed.
- `.agents/templates/README.md`: ownership table added, restatements removed. Template bodies unchanged except four references to removed contracts.
- `.agents/README.md`, `.claude/agents/*.md`, `.codex/agents/*.toml`, `.claude/commands/singlepagestartup.md`, `.codex/skills/singlepagestartup/SKILL.md`: names of the new owners.
- `CLAUDE.md`, `AGENTS.md`: the pre-development section is the same 140-word pointer in both files.
- `apps/studio/workspace/README.md`, `apps/studio/README.md`: operator and developer content kept; stage definitions, pipeline mechanics, readability, design method, Sales schema and confirmation rules point at their owners.
- `tools/studio/presentation/structure.test.ts`, `tools/singlepagestartup/pipeline/check.test.ts`: pinned strings retargeted to the new owners; the semantic rewrite is phase 4.
- `thoughts/shared/research/singlepagestartup/`: the ledger records the decisions taken, the phase-3 outcome and the deviations; the TSV gains a `phase3` column; `2026-09-18-pre-development-goldens-phase3.txt` is the post-rewrite snapshot.

## Verification

- [x] `npm run studio:validate` passes after each of the four groups.
- [x] `npm run singlepagestartup:pipeline:check -- --format text` prints the same report as phase 2 after every group: 19 passed, 4 gaps (3 approval, 1 decision), no structural gaps, no legacy shapes, computed cursor `10-strategy`.
- [x] The resolved workspace snapshot (both layers, both projections, every review document, 182 lines) is identical to the phase-1 goldens except the 8 lines that carry the hashes of `template.product` and `template.product-research`, whose references to removed contracts were fixed; every document state, dependency count and business hash is unchanged.
- [x] The check against a read-only copy of the m2commerce startup workspace reports the same result before and after the rewrite (15 passed, 8 gaps, 0 legacy shapes).
- [x] No file outside `thoughts/` and `.agents/migrations/README.md` references a removed contract.
- [x] Every commit message carries validated `Downstream-*` trailers.

## Notes

- Decisions taken by the owner before this phase: contracts removed without stubs; m2commerce is the only live downstream project with a Studio workspace and its copy may be used for dry runs; `.agents/migrations/` holds dated procedures loaded only on detection; all eight procedures are retired because no live workspace carries their shape. The detectors stay executable.
- Templates stay byte-identical except the reference fixes because the goldens hash their bodies and they load only on artifact creation; their comment trimming, the test rewrite and a duplicate-sentence lint are phase 4. The `## Final editorial pass` heading survives in every role as a one-line pointer because the editorial-pass test requires it.
- `tools/studio/products/MIGRATION.md` still documents the Business-to-model transfer in Russian; it was outside the ledger and is referenced from the migrations README and the workspace README. Translating or retiring it is a separate decision.
- Phases 4 (tests and lint), 5 (dry runs on singlepage and the m2commerce copy) and 6 (ship) follow.

## Phase 5 dry run

Twelve Opus runs of the workflow (six tasks, each with the pre-phase-3 and the rewritten instruction set, in isolated worktrees and read-only copies, nothing committed) produced the same decisions, the same stopping points and documents of the same essence; instruction context read per run fell by about 55 percent while end-to-end run cost stayed equal, because reconciliation work dominates. The report with the cost table, the parity review, the gaps the agents found and the phase-4 backlog is `thoughts/shared/research/singlepagestartup/2026-09-18-pre-development-dry-run.md`. The prose gaps the runs exposed are closed in the last commit of this branch.

## Downstream migration

- Impact: required. Children that inherited `.agents`, `.claude`, `.codex`, `CLAUDE.md` or `AGENTS.md` lose six contract files and the migration procedures; any child-owned override or document that cites them now points at a missing path.
- Resolve merge conflicts in favor of the upstream rewrite for the workflow, contracts, roles, templates README, adapters and the entry files; reapply a child-owned rule only if it is absent from the new owner named in the ledger's Phase 3 outcome section, and add it to that owner file rather than restoring a deleted contract.
- Replace references: `context-loading.md` and `artifact-lifecycle.md` with `inheritance.md` (layers, indexes, catalogs, downstream applicability), `evidence.md` (assets) or `document-confirmation.md` (approval state); `document-readability.md` with the workflow's working rules; `product-models.md` with the business-analyst and strategist roles and `.agents/templates/README.md`; `research-sales-audit.md` with the market-researcher role; `pipeline-reconciliation.md` with the workflow, `inheritance.md` or `.agents/migrations/README.md`.
- If a child still needs a retired migration procedure, read it from commit `80bf5cdb1483a2427c6566eebab1173667d8050f` and store it as a dated file under `.agents/migrations/`; if the child extended `legacy_shapes`, point each procedure at a file under `.agents/migrations/`.
- Keep the pre-development paragraph identical in `CLAUDE.md` and `AGENTS.md` and re-add only project-specific operator notes to the READMEs.
- Verify: `npm run studio:validate` passes; `npm run singlepagestartup:pipeline:check -- --format text` reports the same gaps as before the merge; a search of `.agents`, `.claude`, `.codex`, `CLAUDE.md`, `AGENTS.md` and `apps/studio/workspace` finds no removed contract name; the startup layer documents, confirmation states and review dependencies are unchanged.
