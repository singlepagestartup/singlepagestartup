---
description: Explicitly adapt project-owned code and documents after upstream integration using local Git history
---

# Adapt already integrated upstream changes

Read `.agents/contracts/engineering/downstream-migrations.md`. Run this separate
workflow only when the user requests `adapt-upstream` or explicitly asks to
review/adapt already integrated upstream changes. A request to sync upstream
alone does not invoke it. Git synchronization and ordinary agent startup never
depend on this review or its checkpoint. Issue status gates still apply to issue work.

Use local Git objects and files only: no fetch, pull, remote API, dependency
download, or network-dependent verification. Missing local history or tooling
leaves the corresponding adaptation check pending; report what is needed for a
later run. Do not obtain it from the network automatically. This command never
merges, rebases, cherry-picks, or pushes changes.

1. Inspect `git status`, current branch, configured remotes, remote-tracking refs,
   and any existing sync/review context. Preserve local edits. Resolve the source
   remote and branch from user intent and actual Git configuration; do not infer
   a different source from the framework's identity. The default helper remote
   is `upstream`. Pass `--remote` and `--ref refs/remotes/<remote>/<branch>` when
   needed. Ask only if the source cannot be determined.
2. Run `node tools/upstream/migrations.mjs check --report <temporary-json-file>`
   (with the resolved remote/ref options). Exit 2 means pending work, not a tool
   failure. Keep this report outside tracked project documents. The command
   inspects commits already integrated into HEAD using the locally available
   upstream ref. Fetched-only changes remain outside adaptation scope.
3. Read the report's commit messages;
   inspect diffs and relevant recorded knowledge for **all** pending commits,
   including `none`, legacy commits, and merge resolutions. Use commit/path
   filters to keep inspection focused. At first adoption or after rewritten
   history, the report includes shared historical commits: group verified
   historical changes, and audit current child overrides and documents against
   current architecture/contracts. Do not wave away legacy history as irrelevant.
   For cherry-picked/squashed imports, also inspect the recorded original source
   range even when it is absent from the ancestry report. If the range was not
   recorded, reconstruct it from local Git history and inspect the imported diff;
   uncertain scope remains an unresolved review, not a clean result.
4. Apply relevant instructions to this project's own files. Search beyond files
   changed by Git: overrides and documents can retain incompatible assumptions
   without conflicts. Inspect affected frontend/backend contracts, schema and
   migration procedures, configuration, tests, and Studio sections as relevant.
   Use the contract's Evidence catch-up procedure where applicable. Do not copy
   upstream business content over client facts. Run the checks that establish
   the resulting behavior; record precise outstanding limitations.
5. Add a short review outcome to the adaptation commit's rationale (or the
   existing issue process artifact if needed for unresolved work); keep detailed
   scratch reviews temporary. Create authorized adaptation commits through the
   `commit` workflow. Report adaptation separately from Git synchronization:
   a completed merge may still have pending adaptation work.
6. After committing and checking the result, regenerate the helper report because
   its token includes HEAD. In that JSON add `reviews` entries of this shape:

   ```json
   {
     "commits": ["<full pending commit SHA>"],
     "outcome": "applied",
     "reason": "Which owned files or behavior were adapted, or why this project is unaffected.",
     "verification": "Actual checks and their results."
   }
   ```

   Outcomes also include `already-applied` and `not-applicable`. Every pending
   SHA must appear exactly once. Include `compatibilityReview` as a short string
   naming inspected areas, findings, and verification when `bootstrap` is true.
   Reuse verified conclusions only for identical changes; include any separately
   inspected cherry-pick/squash range in the review rationale. Then run
   `node tools/upstream/migrations.mjs complete --report <temporary-json-file>`.
   Failure leaves the checkpoint unchanged. Do not manufacture passing reviews
   to clear it. Run `check` again and report adaptations and unresolved issues.

If no upstream remote is configured, report that rather than silently attaching
one. Pending adaptation stays available for the next explicit `adapt-upstream`
invocation and does not block Git operations or unrelated agent tasks.

## Final editorial pass

When the work contains prose intended for a person, apply
`.agents/contracts/editorial-pass.md` as the last content-editing step.
