## Summary

Research phase artifacts for the ten issues that sat in `Research Needed`, so the operator can review them and advance each issue to `Ready for Plan`. Every load-bearing claim in the issues was verified against `main` at `29370bcbf8`; the documents record where live code diverges from the issue text. Two new issues (#240, #241) capture test-infrastructure defects found while running every scoped lane from a clean worktree, and #244 records a thread-creation regression found by the scenario lane.

Issues covered: #216, #223, #224, #226, #227, #229, #230, #232, #233, #234 (all moved to `Research in Review`), plus a verification note for #213 and the create-phase artifacts for #240, #241 and #244.

## Changes

- `thoughts/shared/research/singlepagestartup/ISSUE-{216,223,224,226,227,229,230,232,233,234}.md`: new research documents in the canonical `10-research` structure (Research Question, Summary, Detailed Findings, Code References, Architecture Documentation, Historical Context, Related Research, Open Questions).
- `thoughts/shared/tickets/singlepagestartup/ISSUE-{223,229,230,232,233,234,240,241,244}.md`: new ticket snapshots; `ISSUE-216.md` gains the English summary of the Russian removal contract comment.
- `thoughts/shared/processes/singlepagestartup/ISSUE-*.md`: process logs advanced to `current_phase: research` with `Research: completed`, incidents and reusable learnings; `ISSUE-213.md` records that the advisory-lock claim was superseded by `e0273194c8`.
- `thoughts/shared/research/singlepagestartup/ISSUE-213.md`: verification note at the top of the Summary pointing planning at the constraint-only baseline (`libs/modules/rbac/README.md:107-113`).
- `thoughts/shared/prs/243_description.md`: this description.

Notable divergences the documents record:

- #226: the deferred files were already deleted by PR #235; the named `singlepagestartup:agents:validate` script never existed on `main`.
- #227: the requested coercion already merged in PR #228 (`29fa75fec7`); only guidance text, examples and wrapped-date specs remain.
- #230: the shared query builder guards non-UUID `eq` filters (`filters.ts:114-128`), so the issue's failure mechanism does not match live code and the literal `undefined` is not reproducible from the repository.
- #216 / #233: `start.sh:12` has run `migrate.sh seed &` in the background since tag `0.0.292`, contradicting the foreground contract recorded in #216 and the RBAC README.
- #229 / #232: the shared HTTP error mapper's spec has been red since `9d60d206df` (missing 422 category), see #241.

## Verification

- [x] `node tools/upstream/migrations.mjs message --file <commit message>` reports the downstream trailers as valid for every commit.
- [x] Every research document has the canonical frontmatter (`date`, `researcher`, `git_commit`, `branch`, `repository`, `status: complete`) and the eight required sections.
- [x] No file outside `thoughts/shared/{tickets,processes,research,prs}/singlepagestartup/` is touched.
- [ ] Human review of each research document before advancing the issues to `Ready for Plan`.

## Notes

- Downstream migration: none. Only upstream workflow artifacts under `thoughts/shared/*/singlepagestartup/` are added or annotated; child repositories keep their own `thoughts` namespace, and no runtime, schema, workflow or template file changes.
- The research agents applied a plain editorial pass because `.agents/contracts/editorial-pass.md`, referenced by `CLAUDE.md`, exists only on the unmerged `codex/studio-portable-document-exports` branch at this commit.
- The #148/#149 cleanup and the test-lane fixes for #240 are submitted as separate pull requests.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
