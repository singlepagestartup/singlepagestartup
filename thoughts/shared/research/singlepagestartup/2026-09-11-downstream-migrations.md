---
repository: singlepagestartup/singlepagestartup
date: 2026-09-11
status: implemented
---

# Carry adaptation intent from commits into child projects

The operator requested a general mechanism for frontend, backend, workflow,
and document changes: capture the conversation's rationale at commit time and
adapt child-owned sources through a separately requested command after upstream
integration. Synchronization must remain independent of agent availability. Evidence retirement exposed
the gap because a clean merge could leave old row references in startup documents.

## Findings and implementation

The previous commit workflow described rationale but did not require downstream
instructions. README's upstream recipe stopped at `git pull`. Existing Studio
GitHub/pipeline reconciliation did not supply a general engineering integration
workflow. Some plan and post-merge cleanup steps also bypassed the commit command.

- `.agents/contracts/engineering/downstream-migrations.md` defines a final Git
  trailer paragraph: Impact, Reason, and conditional Applies-To, Action, Verify.
  The commit agent considers dialogue intent and the exact staged diff; the
  validator checks shape, while the agent remains responsible for meaning.
- The canonical commit/PR workflows retain migration instructions, including
  authorized squash/reword publication. Direct commit recipes in core plan and
  cleanup flows now route through the same commit workflow.
- `.agents/workflows/engineering/adapt-upstream.md` and thin Codex/Claude adapters
  inspect commit notes and diffs, resolve applicability, adapt owned sources,
  verify behavior, and only then acknowledge adaptation completion. Shared entry
  instructions in AGENTS.md and CLAUDE.md route only explicit adaptation requests;
  they do not run checks at startup or during Git synchronization.
- `tools/upstream/migrations.mjs` reads common Git ancestry across all parents,
  identifies legacy/invalid messages, emits a temporary detailed report, and
  records only reviewed source frontiers and the adaptation commit under local
  Git metadata. Rewritten histories, another unadapted branch, and fresh worktrees
  require review again. Fetched-only updates are not acknowledged.
- `complete` rejects stale reports, dirty trees, incomplete outcomes, and missing
  initial compatibility audits. It verifies review completeness, not the truth
  of an agent's semantic judgment. Commit text is never executed.
- Synchronization has no migration hooks. `adapt-upstream` uses local Git objects
  and installed tools only; missing history/tooling stays pending for a later run.
  The helper disables lazy fetching and reports shallow history instead of
  silently accepting incomplete coverage.

No Evidence replacement register was added. The previous local source-context
cleanup is preserved as separate working-tree work.

## First publication and existing children

The first publication must carry a **required** downstream note explicitly
covering both adoption of this workflow and already-merged Evidence retirement.
Children must scan owned Brief, Business, Strategy, Brand, Design, nested product
Markdown/YAML, and bindings for obsolete Evidence paths/codes. Recover each
material statement from that child's earlier Git history, replace opaque
references with brief attributed explanations, and preserve dates, limits,
client facts, valid Research/asset references, approvals, and inheritance.
This is also in pipeline compatibility reconciliation, so it does not depend
on historical commits already having the new message format.

Ancestry scanning cannot identify original commits after cherry-pick/squash;
the workflow requires a separately inspected source range and imported diff.
No shared history or ambiguous source configuration is an explicit error.
New checkouts perform an initial current-project audit and historical review
when the separate adaptation command is explicitly requested.

## Verification

- `npm run adapt-upstream:test`: 13 scenarios pass using temporary local Git repositories.
  Covers trailer validation (including unknown object-property names), legacy
  bootstrap, pending persistence, merge parents, incremental scans, fetched-only
  commits, history rewrite, branch/worktree isolation, stale/incomplete reports,
  dirty trees, CLI validation/completion, inert command-like commit text, and
  explicit adaptation with inaccessible remotes and shallow history.
- Node syntax and `git diff --check` pass. No merge/rewrite migration hooks remain.
- New skill YAML, metadata, canonical routes, and the identical shared entry
  paragraphs validate with the installed Node YAML parser. The bundled Python
  skill validator could not run because neither system Python has PyYAML; no
  dependency was installed solely for that validator.
- In this checkout the read-only helper reports `not-configured`: no upstream
  remote was added, fetched, or merged during implementation.

Implementation and verification were local; publication is handled by the
subsequent commit request. No child synchronization or runtime restart was performed.
