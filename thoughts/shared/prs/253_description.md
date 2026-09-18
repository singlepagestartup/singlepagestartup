## Summary

Phase 6 closes point 1 of the Studio audit: the last one-time migration procedure leaves the tree, the contradiction between the Brief and the rest of the framework workspace is resolved in the owner's favour, and the confirmation backlog the new `underlying` state exposed is recorded rather than quietly worked around. Nothing here changes the instruction corpus; it applies the machine the previous five phases built to the framework's own project.

## Changes

- `tools/studio/products/MIGRATION.md` is deleted. It was the ninth one-time procedure and the only one still in the tree; its page map and catalog example repeated the workspace README and the templates, and its transfer table belongs with the eight retired into Git history on 2026-09-18. The `standalone-business` and `catalog-v1` detectors stay executable and `.agents/migrations/README.md` carries the command that reads the maps from `818f097d22`; the workspace README link follows it.
- `apps/studio/workspace/brief/singlepage.md` states the product the owner selected: AI Chat organizes supplied material into a reviewable project model, keeps it as context for later work, assembles a landing-page sandbox and publishes through GitHub, a repository in the user's account and a connected server. `intake.product_direction` records the decision and what it supersedes; the obsolete local-deployment wording is replaced, not annotated.
- The same Brief records the seven service terms that Brand, Product and Sales stated without a source: 24-hour support, payments in Russia through an online cash register, a free token allowance at registration, an hour-long first session, email-and-password authentication only, Beget or Timeweb as example hosting providers, and six-month provider backups. The owner confirmed each as a real decision; `sources.service_terms` attributes them.
- The Brief is confirmed against the body in its commit, verified again after the commit hooks ran.
- `tools/singlepagestartup/pipeline/check.test.ts`: the assertion that pinned `00-business` as clean now compares the stamp gate with the Brief's own state. The pinned form failed on an ordinary workspace edit.
- `thoughts/shared/research/singlepagestartup/2026-09-18-pre-development-rule-ledger.md`: the phase-6 section.

## What the stamps turned out to be

The four documents the dry run named were not missing an approval. In `818f097d22` each stamp was updated with a real operator quote dated 2026-09-17; the recorded `content_sha256` simply matches no version of its file anywhere in Git history, while the same commit's dependency snapshots are correct. The likely mechanism is that the hash was computed and the body edited again before committing, and the commit hooks reformat staged Markdown. This phase therefore verifies a stamp after the hooks, not only before.

With `stale` no longer hiding a document's own state, the framework workspace resolves as 53 review documents: 9 whose stamp does not cover their body, 3 carrying an explicit unresolved material impact, 36 never confirmed, and 5 confirmed. The dry run had named four of the nine because the report could not previously tell `stale over changed` from `stale over confirmed`; the other five are `product.ai-chat.website` and four of its page documents. Clearing that chain is pre-development work on the framework's own project, in the order the confirmation contract sets, and is deliberately not in this pull request.

## Verification

- [x] `npm run studio:validate` passes: 173 + 3 + 5 + 5 + 15 tests and the duplicate check.
- [x] `npm run singlepagestartup:pipeline:check -- --format text` reports `00-business complete` after the Brief confirmation, with the computed cursor at `10-strategy`.
- [x] The Brief resolves as `confirmed` in the committed tree, checked after the commit hooks ran.
- [x] No file outside `thoughts/` and the `git show` command in the migrations README references the deleted path.
- [x] Every commit message carries validated `Downstream-*` trailers.

## Notes

- Owner decisions in this phase: retire `MIGRATION.md`; the Strategy/Brand/Product mechanics are correct and the Brief follows them; all seven service terms are real; skip a second dry run for now.
- `tools/studio/products/migrate.ts` is the executable half of the retired migration, with no caller and no test. Retiring it was not part of the decision, so it stays.
- Audit points 2 and 3 remain open: section-level inheritance leaking base metadata into startup projects, and stale propagation as whole-file cascades.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
