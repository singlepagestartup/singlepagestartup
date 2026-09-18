## Summary

Phase 4 of compacting the pre-development instruction corpus: the executable parts catch up with the prose. Templates lose the restatements phase 3 had to leave in place because the goldens hash their bodies; the pipeline check gains the four gates the phase-5 dry run found missing; the review helper can write the snapshot it inspected; and the tests stop pinning sentences, with a new lint that fails when one instruction sentence has two homes. Stage IDs, statuses, the `active_artifacts` vocabulary, the cursor schema and every document anchor are unchanged.

## Changes

### Templates

- The nine readability restatements are gone: `brand.md`, `creative.md`, `design.md`, `product.md`, `product-model.md`, `product-research.md`, `sales-process.yaml`, `strategy.md` and `website.md` no longer repeat the workflow's per-page target. `brief.md` keeps its own 500-800 word figure without the second sentence.
- `brief.md` `Visual reference intake` and `design.md` `Interface and product surfaces` keep only what the template owns. `brief.md` now names the five `visual_references` frontmatter keys that existed only in `checks.ts`; `design.md` keeps the required specimen minimum and the IDs `studio:validate` enforces. The Brand Designer role gains the two facts the template held alone.
- The intake status vocabulary is aligned on four values: the template and the Account Manager role gain `out-of-scope`, which `visual-intake-ready` already accepted, together with what earns it.
- `github-reconciliation.yaml` gains a commented example whose `summary` is a block scalar, with the reason: a plain scalar stops the preflight parsing the ledger once the text contains a colon and a space.
- `asset-index.yaml` records when one entry may cover a produced set.

### Checks

- A detected legacy shape becomes a structural gap of the stage named in its new `owning_stage`. The computed stage ignored `legacy_shapes` entirely, so an unmigrated workspace reported every stage complete.
- `brief.stamp-current` fails `00-business` when the Brief's confirmation no longer covers its body. A document with no stamp has nothing to invalidate and passes.
- `generated-assets-registered` accepts a registry entry whose `path` is a non-empty directory as covering the files below it.
- The report prints the document's own state beneath `stale`: the resolver keeps it as `underlying` and the detail reads `state is stale over changed`.

### Tools

- `document-review.ts` gains `--repository-root` and `--refresh`. The refresh splices the new fingerprints over the existing node's source range instead of re-rendering the metadata, which rewrapped long scalars and expanded flow sequences elsewhere in the file. It never touches `confirmation` or `review.stale`, and refuses a document that records no `dependencies` block.

### Tests and lint

- `structure.test.ts` loses 26 assertions that quoted role sentences; what replaces them is the contract between files. A new scenario reads `VISUAL_CATEGORIES` and `ACCEPTED_INTAKE_STATUSES` out of `checks.ts` and holds the template, the role and the check to one vocabulary.
- `editorial-pass.test.mjs` requires the contract path in a role and forbids the heading; workflows and skills keep their section. The 15 roles lose the section and the 26 engineering workflows lose the sentence that restated the contract.
- `tools/agents/duplicate-sentences.ts` (new, wired into `studio:validate` with its own test) fails when one sentence has two homes across `.agents/**`, `CLAUDE.md`, `AGENTS.md`, `.claude/commands/**` and `.codex/skills/**`. `CLAUDE.md` and `AGENTS.md` count as one home, and the Claude commands and Codex skills as one adapter layer, because both are required to mirror.

## Verification

- [x] `npm run studio:validate` passes after each of the four groups: 173 + 3 + 5 + 5 + 15 tests and the duplicate check.
- [x] `npm run singlepagestartup:pipeline:check -- --format text` on the framework layer reads 20 passed, 4 gaps (0 structural, 3 approval, 1 decision), 0 legacy shapes, computed cursor `10-strategy`. One check more than phase 3 because `brief.stamp-current` passes there; the same four gaps.
- [x] The resolved workspace snapshot differs from the phase-3 goldens in exactly 44 of 182 lines, the hashes of the eleven edited templates in both layers and both projections. No document state, resolution or dependency count changed. The new baseline is `2026-09-18-pre-development-goldens-phase4.txt`.
- [x] The check against a read-only copy of the m2commerce startup workspace moves from 15 passed, 8 gaps to 15 passed, 9 gaps. The new gap is `brief.stamp-current`; the directory rule removes 105 false orphan findings and leaves 10 files that no entry covers.
- [x] Refreshing the six shared documents of that copy changes only fingerprint lines, and a refresh that computes the same values writes nothing.
- [x] Removing `out-of-scope` from the Brief template fails the new vocabulary scenario.
- [x] Every commit message carries validated `Downstream-*` trailers.

## Notes

- Owner decisions taken before this phase: a directory entry in the asset registry covers the files below it; a role keeps a pointer to the editorial contract instead of its own section.
- The rule-ledger TSV keeps its phase-3 disposition and gains no `phase4` column. Its 222 template rows are marked `template:unchanged-until-phase-4`, but a row's recorded sentence is often assembled from several comment lines or table cells, so no substring test distinguishes a rewritten comment block from an untouched one; a mechanical column would have relabelled 80 sentences this work never touched. The ledger's prose section is the per-file record instead.
- Ten duplicate sentences remain, all in the engineering workflows and their adapters, which no phase of this work rewrote. They are recorded in `KNOWN` in the lint so anything new fails while the debt stays countable.
- `tools/studio/products/MIGRATION.md` still documents a retired migration in Russian. Translating or retiring it is still a separate decision.
- Phase 6 (optional second dry run on the merged main, and the framework Strategy, Brand and AI Chat stamps whose bodies never matched) follows.

## Downstream migration

- Impact: required on all four groups. Templates and two roles changed wording and the Brief intake vocabulary gained a fourth status; stages that silently reported complete over a legacy shape or an invalidated Brief stamp now report gaps; a directory entry in the asset registry becomes a supported shape; the editorial pass loses its section in every role; and `studio:validate` gains a check that fails on a sentence written in two places.
- Applies to: projects with owned copies of `.agents` templates, roles or workflows, owned checks over Brief `visual_references`, a workspace carrying an unmigrated shape or a Brief edited after confirmation, generated assets registered as directories, and any tooling that reads the pipeline report or invokes `document-review.ts` from another checkout.
- Actions and verification are in the `Downstream-*` trailers of the four commits.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
