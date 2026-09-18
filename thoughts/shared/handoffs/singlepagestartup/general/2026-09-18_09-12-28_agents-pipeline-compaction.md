---
date: 2026-09-18T09:12:28+03:00
researcher: rogwild
git_commit: 29cfd89cd1
branch: claude/agents-pipeline-check
repository: singlepagestartup
topic: "Pre-development instruction compaction (Studio audit point 1) Implementation Strategy"
tags: [implementation, strategy, agents, pipeline, studio, workspace]
status: complete
last_updated: 2026-09-18
last_updated_by: rogwild
type: implementation_strategy
---

# Handoff: general Compacting the pre-development instruction corpus

## Task(s)

The session audited `apps/studio` and `.agents` and found three quality limits: about 25,000 words of duplicated process instructions per invocation (852 normative sentences in the narrow count, 2,268 in the full corpus), Studio document inheritance that diverges from `libs/modules` variant inheritance and leaks base metadata into downstream projects, and a stale/confirmation mechanism whose signal became noise. The user chose to work through the findings one at a time and started with point 1, the instruction corpus, as a six-phase plan.

1. Phase 1, inventory and goldens: completed and merged as PR #247.
2. Phase 2, executable stage machine (additive, report-only): completed, PR #248 open with green CI, awaiting merge.
3. Phase 3, rewrite prose by the ledger: not started; blocked on four user decisions (see Action Items).
4. Phase 4, rewrite prose-pinned tests and add a duplicate-sentence lint: planned.
5. Phase 5, dry run on singlepage and a downstream fixture: planned.
6. Phase 6, ship with Downstream trailers: planned.

Side work completed in the same session: PR #239 committed a Codex session's in-flight Studio work and added `.nxignore`/`.gitignore` entries for `.claude/worktrees`; PR #242 replaced regex HTML sanitization in `merge.ts`, `design/data.ts` and `presentation/export.ts` with the shared scanner and DOM-side removal, fixed the default presentation export, and lengthened the Chrome launch wait. Both merged.

## Critical References

- `thoughts/shared/research/singlepagestartup/2026-09-18-pre-development-rule-ledger.md` (with `.tsv` and `2026-09-18-pre-development-goldens.txt` beside it): the checklist for phases 3 and 4 and the baseline every rule move must reproduce.
- `.agents/pipeline/pre-development.yaml` and `tools/singlepagestartup/pipeline/check.ts`: the executable stage machine; `npm run singlepagestartup:pipeline:check -- --format text`.
- `.agents/contracts/downstream-migrations.md` via `.agents/workflows/engineering/utilities/commit.md`: every commit needs validated `Downstream-*` trailers and no Claude attribution.

## Recent changes

- `.agents/pipeline/pre-development.yaml`: stage machine, 23 checks, manual-review criteria, six legacy-shape detectors.
- `tools/singlepagestartup/pipeline/definition.ts`, `checks.ts`, `check.ts`, `fixture.ts`, `check.test.ts`: loader, checks, CLI, downstream fixture builder, ten BDD scenarios.
- `package.json:60-61`, `project.json:38-39`: `singlepagestartup:pipeline:check` and `:test`, wired into `studio:validate`.
- `.agents/workflows/pre-development.md` (Pipeline compatibility reconciliation section), `.agents/README.md`, `.claude/commands/singlepagestartup.md`, `.codex/skills/singlepagestartup/SKILL.md`: one paragraph each pointing at the command.

## Learnings

- Work happens in the Claude worktree `.claude/worktrees/agents-pipeline-compaction`; the main checkout is shared with a live Codex session that edits `.agents` and `apps/studio/workspace` files. Never work in the main checkout. Enter the worktree with EnterWorktree `path`, it is registered in `git worktree list`. `npm ci` is done there and `.claude/.env` was copied.
- The worktree guard refuses long compound shell commands that mention git; run git steps as short separate commands. Prefer Write/Edit for files.
- `thoughts/` holds Markdown and data only; the user removed throwaway Python tools from it. Never store code there. `*.csv` is gitignored, use `.tsv`.
- Background Bash tasks cannot launch headless Chrome (DevTools port never appears); run the presentation exporter in the foreground.
- CodeQL default setup fails a PR on any new high alert, including `js/incomplete-multi-character-sanitization` and `py/bad-tag-filter`; avoid regexes over `<!--` or `<script` anywhere, including tools under `thoughts`.
- Confirmation hashes cover the merged body; a startup document that overrides every section still gets the base head. `brandbook.ts` fingerprints the raw startup file instead, so the two agree only on full overrides. Section merging can replace but never remove an inherited base section; the pipeline check names such sections as inherited.
- Review resolver: a confirmed document without `review.dependencies` resolves as stale; the fixture writes snapshots in a second pass.
- On the framework workspace only Brief and the shared model are confirmed; Strategy, Brand and Design are stale and cascade to 43 of 53 documents. That is the golden state, not a bug to fix in this work.
- Commit messages: imperative, why-first, `Downstream-Impact`/`Downstream-Reason` trailers validated with `node tools/upstream/migrations.mjs message --file <file>`, no Co-Authored-By. PR descriptions are recorded in `thoughts/shared/prs/<n>_description.md` and synced with `gh pr edit --body-file`.
- The user reviews in Russian; documents and commits stay in English.

## Artifacts

- `thoughts/shared/research/singlepagestartup/2026-09-18-pre-development-rule-ledger.md`
- `thoughts/shared/research/singlepagestartup/2026-09-18-pre-development-rule-ledger.tsv`
- `thoughts/shared/research/singlepagestartup/2026-09-18-pre-development-goldens.txt`
- `thoughts/shared/prs/239_description.md`, `242_description.md`, `247_description.md`, `248_description.md`
- `.agents/pipeline/pre-development.yaml`
- `tools/singlepagestartup/pipeline/definition.ts`, `checks.ts`, `check.ts`, `fixture.ts`, `check.test.ts`
- Memory: `agents-pipeline-compaction-progress.md` and `studio-inheritance-parity-priority.md` in the project memory directory.

## Action Items & Next Steps

1. Confirm PR #248 is merged; if it is still open, wait for the user or leave it. Then create the phase-3 branch from `origin/main` inside the worktree, for example `claude/agents-pipeline-prose`.
2. Obtain the four remaining decisions from the user before rewriting prose: retire contracts without pointer stubs (recommended); which downstream projects are live and whether one workspace can be copied for a dry run; confirm `.agents/migrations/` with dated procedures loaded on detection; which migration procedures in the ledger can be dropped because their legacy shape no longer exists anywhere.
3. Phase 3 rewrite, file group by file group, using the ledger TSV as the checklist so every sentence ends in one place or is removed with a recorded reason: workflow to about 1,500 words; roles to method, red flags and handoff; contracts merged into evidence, confirmation, inheritance (new), editorial, tool-use, github; migration sections moved to `.agents/migrations/`; CLAUDE.md and AGENTS.md pre-development summaries replaced by short pointers kept in sync; workspace and Studio READMEs trimmed to operator content; Codex and Claude adapters updated. Keep cursor schema, stage IDs, `active_artifacts` vocabulary and document anchors unchanged.
4. After every group: `npm run studio:validate`, the pipeline check must reproduce the goldens on singlepage, and the workspace snapshot must match `2026-09-18-pre-development-goldens.txt` (rebuild the snapshot with the loader and review resolver as described in the ledger).
5. Phase 4: rewrite the assertions in `tools/studio/presentation/structure.test.ts` that read `.agents/workflows/pre-development.md`, roles and templates; add a TypeScript duplicate-sentence lint under `tools/agents` beside `editorial-pass.test.mjs`.
6. Phase 5: dry run `/singlepagestartup` on singlepage in the worktree and against the downstream fixture from `tools/singlepagestartup/pipeline/fixture.ts`; compare handoffs with the pre-change behavior.
7. Phase 6: one squash-able PR with `Downstream-Impact: required` trailers describing conflict resolution for children that edited `.agents`, `.claude`, `.codex`, `CLAUDE.md`, `AGENTS.md`.

## Other Notes

- Audit findings still open for later points: section-level inheritance of Brief/Strategy/Brand/Design leaks base metadata (`intake`, `visual_references`) and base sections into downstream projects; stale propagation is whole-file and cascades; evidence tiers and primary customer evidence are absent; the AI Chat product spec describes a guided one-hour intake the framework's own workflow does not use.
- Three older CodeQL alerts of the sanitization rule were fixed in PR #242; check `gh api code-scanning/alerts` before assuming a new alert is pre-existing.
- The exporter default without `--id` was broken on main until PR #242; `bun tools/studio/presentation/export.ts --skip-build --id singlepagestartup` is the fast verification path.
