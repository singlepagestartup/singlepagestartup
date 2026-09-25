---
date: 2026-09-18T13:30:00+03:00
researcher: rogwild
git_commit: c9ea8e5cb0
branch: claude/agents-pipeline-prose
repository: singlepagestartup
topic: "Pre-development instruction compaction: phases 4 to 6 after the phase 3 rewrite and the phase 5 dry run"
tags: [implementation, strategy, agents, pipeline, studio, workspace]
status: complete
last_updated: 2026-09-18
last_updated_by: rogwild
type: implementation_strategy
---

# Handoff: general Finishing the pre-development instruction compaction

## Task(s)

Point 1 of the Studio audit: one home per pre-development rule, executable
gates, fewer tokens per invocation, downstream projects survive.

1. Phase 1, inventory and goldens: merged as PR #247.
2. Phase 2, executable stage machine: merged as PR #248 (`80bf5cdb14`).
3. Phase 3, prose rewrite by the ledger: PR #250 on `claude/agents-pipeline-prose`, open, CI running, awaiting the owner's review and merge. Six commits, each with validated `Downstream-*` trailers.
4. Phase 5, dry run: done before phase 4 at the owner's request; report in `thoughts/shared/research/singlepagestartup/2026-09-18-pre-development-dry-run.md`; the prose gaps it exposed are closed in commit `c9ea8e5cb0` on the same branch.
5. Phase 4, tests, lint, templates and check fixes: not started; the backlog is in the dry-run report and repeated below.
6. Phase 6, ship and close: not started.

## Critical References

- `thoughts/shared/research/singlepagestartup/2026-09-18-pre-development-rule-ledger.md` and `.tsv`: the phase-1 plan, the decisions taken, the phase-3 outcome and the `phase3` column.
- `thoughts/shared/research/singlepagestartup/2026-09-18-pre-development-dry-run.md`: the A/B runs, cost table, parity review and the phase-4 backlog.
- `thoughts/shared/research/singlepagestartup/2026-09-18-pre-development-goldens-phase3.txt`: the workspace snapshot baseline for phases 4 and 5 (182 lines; the ledger's Goldens section says how a line is rebuilt: SHA-256 over the raw resolved content, 16 hex characters).
- `thoughts/shared/prs/250_description.md`: the PR body, synced with `gh pr edit --body-file`.
- `.agents/contracts/engineering/downstream-migrations.md` and `.agents/workflows/engineering/utilities/commit.md`: every commit needs validated `Downstream-*` trailers, no Claude attribution.

## Recent changes

- `.agents/contracts/inheritance.md` (new), `evidence.md`, `document-confirmation.md`, `github-reconciliation.md` rewritten; six contracts removed; `.agents/migrations/README.md` (new); workflow 10,341 to about 2,200 words; seven roles trimmed; `.agents/templates/README.md` with the ownership table; entry files and Studio READMEs point at the owners; templates unchanged except four reference fixes.
- `tools/studio/presentation/structure.test.ts` and `tools/singlepagestartup/pipeline/check.test.ts`: pinned strings retargeted only.
- Dry-run fixes on `c9ea8e5cb0`: `review.stale` removal rule, stale hiding changed, `observes` edges, blockers format, preflight side effects, legacy shapes and stage completeness, snapshot refreshes as reconciliation, rerun fact inventory, per-document owners at `40-products`, later-stage requests while blocked, one question with several gates.

## Learnings

- Work only in the worktree `.claude/worktrees/agents-pipeline-compaction` (EnterWorktree by path); the main checkout is shared with a Codex session. The Bash guard refuses compound git commands and commands whose text contains `git` (including `github` in a loop) or a runtime variable feeding `find`, `bun`, `sed`; put such steps in a script file under the scratchpad and run `sh <file>`.
- `npm run studio:validate` takes about 12 seconds; the pipeline report on singlepage must stay `19 passed, 4 gaps (0 structural, 3 approval, 1 decision), 0 legacy`; the snapshot must equal the phase-3 goldens until templates change on purpose.
- lint-staged runs prettier on staged Markdown; it does not rewrap prose (proseWrap preserve) but reformats tables.
- Subagent dry runs: use `model: "opus"`, `isolation: "worktree"`, explicit `git checkout --detach <sha>`, `ln -s <main>/node_modules node_modules`, `--no-fetch` for the preflight when several agents share the repository, and one shell command at a time. The harness injects the launch checkout's `CLAUDE.md` (main branch) into every subagent; the Write tool may refuse report files in subagents (they concatenate with `cat`). Agent worktrees and `worktree-agent-*` branches must be removed by hand afterwards.
- The only live downstream project with a Studio workspace is `flakecode/m2commerce` (`/Users/rogwild/code/flakecode/m2commerce`, `default_layer: startup`); copy `apps/studio/workspace` into a plain directory beside an unpacked `git archive` of the framework tree so the resolver falls back to `default_layer: startup`; no legacy shapes there. `tools/singlepagestartup/pipeline/fixture.ts` builds a synthetic downstream with a v1 catalog and `ST-EV-04` codes for the legacy path.
- The framework workspace itself has Strategy and Brand stamps that never matched their bodies (both changed inside commit `818f097d`), and `ai-chat/product.md` and `sales.yaml` carry the same mismatch; every workflow run stops there until the owner confirms the current bodies. In m2commerce, Brief and Strategy contradict each other about whether the introductory course includes construction modules.

## Artifacts

- PR #250: https://github.com/singlepagestartup/singlepagestartup/pull/250
- `thoughts/shared/research/singlepagestartup/2026-09-18-pre-development-dry-run.md`
- `thoughts/shared/research/singlepagestartup/2026-09-18-pre-development-rule-ledger.md`, `.tsv`, `2026-09-18-pre-development-goldens.txt`, `2026-09-18-pre-development-goldens-phase3.txt`
- `thoughts/shared/prs/250_description.md`
- Memory: `agents-pipeline-compaction-progress.md` in the project memory directory.

## Action Items & Next Steps

1. Finish PR #250: wait for CI, address review comments on the branch, merge with a merge commit (the repository convention), then create `claude/agents-pipeline-tests` from `origin/main` inside the worktree.
2. Phase 4, templates: trim the template comments that restate roles (`brief.md` visual intake, `design.md` interface block) and the nine remaining readability restatements; keep every heading, table and schema key byte-identical because the pipeline check reads them. Align the Brief intake status vocabulary: either the check accepts `missing`, `supplied-unreviewed`, `ready` and `out-of-scope`, or the template and the account-manager role adopt the check's set; name the five `visual_references` keys in `.agents/templates/brief.md`. Add a block-scalar `summary` example to `.agents/templates/github-reconciliation.yaml`. Rebuild the snapshot into `2026-09-18-pre-development-goldens-phase4.txt` and record in the ledger which template hashes changed and why.
3. Phase 4, checks (`tools/singlepagestartup/pipeline/checks.ts`, `check.ts`, `pre-development.yaml`, `check.test.ts`): a legacy shape in the active layer becomes a structural gap of the stage that owns the affected documents; a Brief whose stamp no longer matches its body is an approval gap at `00-business` (only when a stamp exists); `generated-assets-registered` accepts a registry entry whose `path` is a directory as covering the files below it, or the contract requires one entry per file, whichever the owner chooses; the report prints the underlying `changed` state beneath `stale`. Keep stage IDs, statuses, `active_artifacts` and anchors unchanged.
4. Phase 4, tools: add `--repository-root` and a `--refresh` mode to `tools/studio/workspace/document-review.ts` that rewrites `review.dependencies` for one document after inspection, so impact reviews stop hand-editing YAML.
5. Phase 4, tests: rewrite the prose-pinned assertions in `tools/studio/presentation/structure.test.ts` into semantic ones (template headings, yaml checks, component contracts); decide with the owner whether `tools/agents/editorial-pass.test.mjs` may drop the per-role heading requirement now that the rule lives in the contract and the workflow; add a TypeScript duplicate-sentence lint under `tools/agents/` that fails on identical normalized sentences across `.agents/**`, `CLAUDE.md`, `AGENTS.md`, `.claude/commands/**`, `.codex/skills/**` with an allowlist for the intentionally identical pre-development pointer, wired into `studio:validate`.
6. Phase 4, ship: `npm run studio:validate`, pipeline report unchanged, snapshot equal to the phase-4 goldens, commits with validated trailers, PR with `thoughts/shared/prs/<n>_description.md`, owner review, merge.
7. Phase 6: optional second dry run with Sonnet executors on the merged main (same six tasks, results compared with the phase-5 report); retire or translate `tools/studio/products/MIGRATION.md` (owner decision); the owner confirms or corrects the framework Strategy, Brand, AI Chat Product and Sales bodies whose stamps never matched, and answers the m2commerce course-scope contradiction in that project; update the memory file and close the audit point.

## Other Notes

- Audit points 2 and 3 (section-level inheritance leaking base metadata into startup projects; stale propagation as whole-file cascades) remain open after point 1.
- The phase-5 raw agent reports live only in the session scratchpad (`dryrun/T*-{old,new}/report.md`); the research document carries their substance.
