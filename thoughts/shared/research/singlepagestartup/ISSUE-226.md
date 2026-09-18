---
date: 2026-09-18T02:14:37+03:00
researcher: flakecode
git_commit: 29370bcbf85b195fbd1c2422707141135184d6e0
branch: worktree-issues-2026-09-18
repository: singlepagestartup
topic: "Remove legacy pre-development files after downstream project migration"
tags: [research, codebase, studio, workspace, agents, legacy-cleanup, downstream-migration, validation]
status: complete
last_updated: 2026-09-18
last_updated_by: flakecode
---

# Research: Remove legacy pre-development files after downstream project migration

**Date**: 2026-09-18T02:14:37+03:00
**Researcher**: flakecode
**Git Commit**: 29370bcbf85b195fbd1c2422707141135184d6e0
**Branch**: worktree-issues-2026-09-18
**Repository**: singlepagestartup

## Research Question

Issue #226 asks to delete `apps/studio/workspace/legacy/role-contract-evaluation.md`
and `apps/studio/workspace/legacy/legacy-agency.md` together with their index
entries, exports, references, and compatibility prose, but only after the
operator confirms that every maintained downstream project uses the current
pre-development architecture. It then requires
`npm run singlepagestartup:agents:validate` and `npm run studio:validate` to pass.

A preliminary check found that `apps/studio/workspace/legacy/` no longer exists
on `main`. This research establishes:

1. when and in which commit and pull request the two files were removed;
2. whether their index entries and references were removed with them;
3. whether any stale reference remains anywhere in the repository;
4. whether the two validation commands named in the issue exist;
5. what the remaining acceptance criterion (operator confirmation of downstream
   migration) depends on, and whether any such confirmation is recorded.

## Summary

- Both files were deleted on 2026-09-11 in commit `160ba86315`
  ("feat(studio): simplify workspace and support project-owned layouts"). That
  commit reached `main` through pull request #235 (merge commit `3e876a2159`,
  2026-09-11 17:31 +0300). The same commit removed the two workspace index
  entries, the startup import of `profession.role-contract-evaluation`, and the
  two `.agents/roles/SOURCES.md` lines that pointed at the file path. The
  deletion is 38 days after the issue was opened (2026-08-04) and predates this
  research.
- The files had been placed under `apps/studio/workspace/legacy/` in commit
  `aa28801d95` (2026-08-04, "refactor: make studio workspace artifact-first"),
  renamed from a `knowledge/migration` path, and merged through pull request #225.
- On `HEAD`, repository search for `legacy-agency`, `role-contract-evaluation`,
  and `workspace/legacy` finds only the issue's own ticket file
  (`thoughts/shared/tickets/singlepagestartup/ISSUE-226.md:35-36`). No code,
  index, agent document, or README references the paths. The current workspace
  indexes under `apps/studio/workspace/utils/index/` contain no `legacy` entry.
- `npm run singlepagestartup:agents:validate` does not exist and never existed
  on `main`. It was added in `bf5ac69b2c` (2026-08-04) as
  `bun tools/singlepagestartup/agents/validate.ts` and removed in `838f6e6dc1`
  (2026-08-14) together with that 829-line validator; both commits sit on the
  issue-222 branch that merged as PR #225 after the removal. No script with
  `agents` in its name replaced it; the only remaining `singlepagestartup:*`
  scripts are `singlepagestartup:github:check` and `singlepagestartup:github:test`
  (`package.json:57-58`). `npm run studio:validate` exists (`package.json:46`)
  and runs the seven-step sequence defined at `project.json:26-39`.
- No confirmation that downstream projects have migrated is recorded anywhere in
  the repository, and no inventory of maintained downstream projects exists. The
  downstream-migration contract records adaptation completion in each child
  project's local Git metadata, not upstream. The deletion commit `160ba86315`
  carries no `Downstream-*` trailers; the contract that requires them was added
  later the same day (`193531f0c3`, 22:06 +0300). The PR #235 description does
  not mention the legacy files or issue #226.

## Detailed Findings

### 1. Lifecycle of the two deferred files in Git

**Introduction under `legacy/`.** Commit `aa28801d95` (2026-08-04 23:44:38
+0300, "refactor: make studio workspace artifact-first", 173 files changed)
renamed `{.../knowledge/migration => apps/studio/workspace/legacy}/legacy-agency.md`
without content change and `role-contract-evaluation.md` with a two-line change.
`git log --diff-filter=A -- apps/studio/workspace/legacy/...` returns only this
commit. It reached `main` through pull request #225 (merge commit `0f01a15534`,
2026-08-14, branch `codex/issue-222-predevelopment-client-system`).

At that commit the files were referenced from:

- `.agents/roles/SOURCES.md:14` and `:31` (Account Manager and Strategist
  provenance lines naming `apps/studio/workspace/legacy/legacy-agency.md`);
- `apps/studio/workspace/index/singlepage.yaml:90-92` (entry
  `profession.role-contract-evaluation`, path `legacy/role-contract-evaluation.md`),
  `:120-122` (entry `knowledge.legacy-agency-migration`, path
  `legacy/legacy-agency.md`), and `:190` (export list);
- `apps/studio/workspace/index/startup.yaml:136` (import of
  `profession.role-contract-evaluation`);
- `apps/studio/workspace/legacy/role-contract-evaluation.md:8` (cross-reference
  to `legacy-agency.md`).

**Content at introduction.** `legacy-agency.md` (22 lines) was a migration map
table with columns "Retired source", "Canonical owner", "Retained", and
"Deliberately omitted", opening with the statement that it is migration
evidence, not automatically loaded project knowledge. `role-contract-evaluation.md`
(53 lines) was a contract-level decision audit comparing each compact role
contract with the nearest retired agency role and a generalist baseline.

**Deletion.** Commit `160ba86315` (2026-09-11 15:44:50 +0300, author rogwild,
"feat(studio): simplify workspace and support project-owned layouts", 246 files
changed, 11595 insertions, 5158 deletions) is the only commit returned by
`git log --diff-filter=D` for either path. Its stat lists
`apps/studio/workspace/legacy/legacy-agency.md | 22 -` and
`apps/studio/workspace/legacy/role-contract-evaluation.md | 53 ---`. The commit
message is the subject line only; `git log --format='%(trailers)'` returns
nothing.

The same commit removed every reference:

- `.agents/roles/SOURCES.md`: both path lines were removed and replaced by the
  wording now at `.agents/roles/SOURCES.md:14`, "Retired agency workflow,
  preserved in Git history — repository migration input; discovery ownership
  retained and premature creative decisions rejected."
- `apps/studio/workspace/index/singlepage.yaml` (281 lines) and
  `apps/studio/workspace/index/startup.yaml` (180 lines) were deleted; their
  replacements `apps/studio/workspace/utils/index/singlepage.yaml` (127 lines)
  and `apps/studio/workspace/utils/index/startup.yaml` (81 lines) were created
  without the `profession.role-contract-evaluation` and
  `knowledge.legacy-agency-migration` entries or the startup import.
- `git grep` for `legacy-agency`, `role-contract-evaluation`, and
  `workspace/legacy` at `160ba86315` (excluding `thoughts/` and
  `package-lock.json`) returns no match; at its parent `160ba86315^` it returns
  the nine lines listed above (with the index lines shifted to `:115-117`,
  `:145-147`, `:264`, and `startup.yaml:164`).

**Pull request attribution.** `git merge-base --is-ancestor` confirms that
`160ba86315` is on the second parent of merge `3e876a2159` ("Merge pull request
#235 from singlepagestartup/codex/studio-extensible-workspace", 2026-09-11
17:31:28 +0300) and is not an ancestor of that merge's first parent, so PR #235
introduced it to `main`. The PR branch contained three commits: `160ba86315`,
`266b1da29f` (PR description), and `f3373fa03c` (comment-scan fix). Merge
`48fff95f2f` (PR #236, same branch name, 2026-09-11) also contains the commit
because the branch was reused.

The recorded PR #235 description (`thoughts/shared/prs/235_description.md`) does
not contain the strings `legacy` or `#226`. Its Notes section states that
downstream repositories must update references to relocated workspace
utilities, indexes, and configuration and use the new layer-local product
catalog paths, and that removed Portfolio/Evidence paths have no compatibility
layer.

### 2. Stale references on `HEAD`

Repository-wide grep at `29370bcbf8`, excluding `node_modules`, `.git`, `.nx`,
`dist`, and `.next`:

| Pattern                    | Matches                                                          |
| -------------------------- | ---------------------------------------------------------------- |
| `legacy-agency`            | `thoughts/shared/tickets/singlepagestartup/ISSUE-226.md:36` only |
| `role-contract-evaluation` | `thoughts/shared/tickets/singlepagestartup/ISSUE-226.md:35` only |
| `workspace/legacy`         | the same two ticket lines only                                   |
| `legacy/`                  | see below; no match refers to the workspace directory            |

`legacy/` matches outside `thoughts/` are npm package names in
`package-lock.json:18826-18882` and `:22941`, and the comment "legacy/automatic
mode" at
`libs/modules/rbac/models/subject/sdk/model/src/lib/ai-reaction-request.ts:46`.
Matches inside `thoughts/` are the phrases "legacy/invalid messages"
(`thoughts/shared/research/singlepagestartup/2026-09-11-downstream-migrations.md:35`),
"legacy/theatrical" (`thoughts/shared/plans/singlepagestartup/ISSUE-222.md:386,664`),
and "legacy/unknown", "legacy/admin-v2" in two handoff files.

Two historical artifacts describe the gate without naming the paths:
`thoughts/shared/handoffs/singlepagestartup/ISSUE-222-progress.md:42` ("two
compatibility records remain pending downstream migration under issue #226")
and `thoughts/shared/prs/225_description.md:49` ("issue #226 tracks deletion of
the two compatibility records after downstream projects migrate").

The live workspace root contains `README.md`, `assets`, `brand`, `brief`,
`design`, `products`, `strategy`, `styles`, and `utils`; there is no `legacy`
directory. `apps/studio/workspace/utils/index/singlepage.yaml` and
`startup.yaml` contain neither `legacy` nor `role-contract`.

### 3. Validation commands named in the issue

**`npm run singlepagestartup:agents:validate`** is absent from `package.json`.
`git log -S'singlepagestartup:agents:validate' -- package.json` returns two
commits:

- `bf5ac69b2c` (2026-08-04, "feat: build pre-development client system (#222)")
  added `"singlepagestartup:agents:validate": "bun tools/singlepagestartup/agents/validate.ts"`
  at `package.json:51` of that revision. The script was a frontmatter and rule
  validator over agent source files (`parseFrontmatter`, `filesBelow`, and a
  `failures` list of `file`, `rule`, `evidence`).
- `838f6e6dc1` (2026-08-14 22:38 +0300, "feat(studio): complete pre-development
  product workspace") removed the script line and deleted
  `tools/singlepagestartup/agents/validate.ts` (829 lines). The same commit
  changed `tools/studio/workspace/validate.ts` (55 lines) to add product-catalog
  fixtures to the workspace self-check; it did not move agent-file validation
  there.

Both commits are on `codex/issue-222-predevelopment-client-system`; neither is
an ancestor of the first parent of the PR #225 merge (`0f01a15534`, 2026-08-14),
so the script existed only inside that feature branch and was gone before the
branch reached `main`.

`grep` for `agents:validate`, `agents-validate`, `validate-agents`, or
`validateAgents` across `package.json`, `project.json`, `apps/studio/project.json`,
`tools/`, `.agents/`, `.claude/commands/`, `.claude/helpers/`, `AGENTS.md`, and
`CLAUDE.md` returns nothing. `tools/agents/` does not exist. The current
`singlepagestartup:*` scripts are `singlepagestartup:github:check`
(`package.json:57`) and `singlepagestartup:github:test` (`package.json:58`).
The ISSUE-222 plan still lists the command at
`thoughts/shared/plans/singlepagestartup/ISSUE-222.md:1040-1041` as a
verification step; that plan is marked `status: completed`.

**`npm run studio:validate`** exists at `package.json:46` and delegates to
`nx run @sps/source:studio:validate`. The target at `project.json:26-39` runs,
in order and not in parallel:

1. `tsc -p apps/studio/tsconfig.json --noEmit`
2. `bun tools/studio/validate-manifests.ts`
3. `bun tools/studio/design-system/validate.ts`
4. `bun tools/studio/workspace/validate.ts --active-layer singlepage --self-check`
5. `bun tools/studio/workspace/validate.ts --active-layer startup`
6. `npm run studio:presentation:test`
7. `npm run singlepagestartup:github:test`

`apps/studio/README.md:58-60` describes the target as type-checking Workspace
stories and checking runnable manifests, module/page/Figma metadata, both
canonical workspace layers, inheritance rules, dependency cycles, and isolated
validator fixtures. `apps/studio/package.json` exposes `validate` as a wrapper
around the root script. `tools/studio/workspace/validate.ts:17-46` parses
`--self-check`, `--workspace-root`, `--repository`, and `--active-layer`;
`:48-70` builds temporary fixture workspaces. The file contains no `legacy`
handling.

**Preservation targets** named by the issue all exist on `HEAD`:
`.agents/roles/` (16 role files plus `SOURCES.md`), `.agents/roles/SOURCES.md`
(6528 bytes, header at `:1-8` describing it as provenance for maintenance, not
runtime context), and `.agents/templates/` (16 files including `brief.md`,
`brand.md`, `design.md`, `product.md`, `strategy.md`, `website.md`,
`sales-process.yaml`, `products.yaml`).

### 4. Downstream migration confirmation

**No inventory of maintained downstream projects exists in the repository.**
`apps/studio/workspace/utils/config.yaml` maps only
`singlepagestartup/singlepagestartup: singlepage` and defaults every other
repository to `startup`. `.agents/contracts/engineering/repository-context.md:45`
forbids hard-coding a project-specific namespace such as `doctorgpt` in shared
workflow instructions. `AGENTS.md:264` states that framework-level fixes found
in a child project are backported to `sps-lite`. The only child project named
in `thoughts/` is `doctorgpt`: `thoughts/shared/tickets/singlepagestartup/ISSUE-182.md:21`
links `https://github.com/flakecode/doctorgpt/issues/18`, and research for
issues #170, #180, and #183 used a restored `doctorgpt-production` database.

**The downstream-migration mechanism records state in the child, not upstream.**
`.agents/contracts/engineering/downstream-migrations.md` (added in `193531f0c3`,
2026-09-11 22:06:42 +0300) defines `Downstream-Impact`, `Downstream-Reason`,
`Downstream-Applies-To`, `Downstream-Action`, and `Downstream-Verify` commit
trailers (`:18-27`) and a separately requested `adapt-upstream` command
(`:54-60`). `thoughts/shared/research/singlepagestartup/2026-09-11-downstream-migrations.md:34-37`
states that `tools/upstream/migrations.mjs` records reviewed source frontiers and
the adaptation commit under local Git metadata in the child, and `:43-46` that
`complete` verifies review completeness, not the truth of an agent's semantic
judgment. Nothing in the framework repository receives or stores a child's
adaptation result.

**The deletion commit predates the contract.** `160ba86315` (15:44 +0300) has no
trailers; the contract commit `193531f0c3` (22:06 +0300) is later the same day.
PR #235's description carries a general note about relocated utilities and
indexes but no instruction about the legacy files.

**Sibling gate for comparison.** Issue #216 uses the same "every maintained
downstream project" wording and additionally requires a rollout inventory with
one row per project and environment
(`thoughts/shared/tickets/singlepagestartup/ISSUE-216.md:29,31`). Its process
log (`thoughts/shared/processes/singlepagestartup/ISSUE-216.md:24,30,32`)
restates the gate and records no inventory.

**Issue state.** `gh issue view 226` on 2026-09-18 returns `state: OPEN`, label
`size:small`, and zero comments. The process log for #226 records only the
Create phase and the note that "deletion is explicitly gated on
downstream-project migration"
(`thoughts/shared/processes/singlepagestartup/ISSUE-226.md:30`).

### 5. Issue claims checked against live code

| Issue claim                                                           | Live state at `29370bcbf8`                                                                                      |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Two files remain at `apps/studio/workspace/legacy/`                   | Stale. Deleted in `160ba86315` (PR #235, 2026-09-11).                                                           |
| Index entries, exports, imports, references must be removed with them | Already done in the same commit; no reference remains outside the #226 ticket file.                             |
| `npm run singlepagestartup:agents:validate` must pass                 | Stale. Script removed in `838f6e6dc1` before PR #225 merged; it never existed on `main` and has no replacement. |
| `npm run studio:validate` must pass                                   | Exists (`package.json:46`, `project.json:26-39`).                                                               |
| Preserve `.agents/roles/**`, `SOURCES.md`, `.agents/templates/**`     | All present.                                                                                                    |
| Every maintained downstream project is confirmed migrated             | No inventory and no confirmation recorded in the repository; the child-side contract does not report upstream.  |

## Code References

- `package.json:46` — `studio:validate` script delegating to `nx run @sps/source:studio:validate`.
- `package.json:57-58` — the only `singlepagestartup:*` scripts on `HEAD` (`github:check`, `github:test`).
- `project.json:26-39` — `studio:validate` target with its seven ordered commands.
- `apps/studio/package.json` (`scripts.validate`) — wrapper around the root `studio:validate`.
- `apps/studio/README.md:19-21` — workspace index location `apps/studio/workspace/utils/index/<layer>.yaml`.
- `apps/studio/README.md:58-60` — description of what `studio:validate` checks.
- `apps/studio/workspace/README.md:97-130` — current workspace file map (no `legacy` directory).
- `apps/studio/workspace/README.md:152-155` — rule that Git retains retired material and unused files are removed with their index entries, imports, and review dependencies.
- `apps/studio/workspace/utils/config.yaml:1-4` — repository-to-layer mapping (only the canonical repository is listed).
- `apps/studio/workspace/utils/index/singlepage.yaml`, `startup.yaml` — current registries without legacy entries.
- `.agents/roles/SOURCES.md:1-8` — provenance-only purpose statement.
- `.agents/roles/SOURCES.md:14` — replacement wording for the removed `legacy-agency.md` reference.
- `.agents/contracts/engineering/downstream-migrations.md:18-27` — required trailer paragraph.
- `.agents/contracts/engineering/downstream-migrations.md:54-60` — `adapt-upstream` consumption in the child.
- `.agents/contracts/engineering/repository-context.md:45` — no hard-coded child namespaces in shared instructions.
- `tools/studio/workspace/validate.ts:17-46` — CLI options of the workspace validator.
- `thoughts/shared/tickets/singlepagestartup/ISSUE-226.md:35-36` — the only remaining occurrences of the deleted paths.

Commits (read-only `git log` / `git show` on the worktree):

- `aa28801d95` (2026-08-04 23:44 +0300) — moved both files under `apps/studio/workspace/legacy/`; merged via PR #225 (`0f01a15534`, 2026-08-14).
- `bf5ac69b2c` (2026-08-04) — added `singlepagestartup:agents:validate` on the issue-222 branch.
- `838f6e6dc1` (2026-08-14 22:38 +0300) — removed `singlepagestartup:agents:validate` and `tools/singlepagestartup/agents/validate.ts` on the same branch; merged via PR #225.
- `160ba86315` (2026-09-11 15:44 +0300) — deleted both files, their index entries, and the `SOURCES.md` path references; relocated indexes to `utils/index/`.
- `3e876a2159` (2026-09-11 17:31 +0300) — merge of PR #235 carrying `160ba86315` to `main`.
- `193531f0c3` (2026-09-11 22:06 +0300) — added the downstream-migration contract.

## Architecture Documentation

- **Workspace ownership.** The workspace root holds document folders, `assets`,
  `products`, `styles`, and `utils`; technical registries, configuration, and
  workflow cursors live under `utils/` (`apps/studio/workspace/README.md:89-96`).
  The indexes are structural registries, not content stores
  (`apps/studio/README.md:220-225`).
- **Retired material.** The workspace README places retired files and migration
  history in Git and requires removal of unused files together with index
  entries, imports, and review dependencies (`apps/studio/workspace/README.md:152-155`).
  Commit `160ba86315` followed that rule for the two legacy files.
- **Agent provenance.** `.agents/roles/SOURCES.md` records where role synthesis
  came from and is not loaded at runtime (`:3-6`); the retired agency workflow is
  now cited as "preserved in Git history" (`:14`).
- **Validation.** One Nx target, `studio:validate`, chains type-check, manifest,
  design-system, workspace (both layers, with a self-check fixture), presentation
  test, and GitHub-helper test steps (`project.json:26-39`). There is no separate
  agent-file validator.
- **Downstream migration.** Adaptation intent travels in commit trailers and PR
  "Downstream migration" sections; children consume it with `adapt-upstream`
  and store completion locally (`.agents/contracts/engineering/downstream-migrations.md`).
  The framework repository does not maintain a registry of child projects or
  their adaptation state.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-222.md:305-335` documents
  the retired `tools/digital-agency` process that `legacy-agency.md` mapped to
  canonical owners; `:615` lists the migration mapping as an open question at
  research time.
- `thoughts/shared/plans/singlepagestartup/ISSUE-222.md:675-785` (Phase 2,
  "Legacy Migration and Selective Inheritance") requires deleting legacy files
  only after every useful item has a named canonical destination (`:761`) and
  leaving no compatibility copies (`:764`); `:1040-1043` lists both validation
  commands from the issue as verification steps.
- `thoughts/shared/handoffs/singlepagestartup/ISSUE-222-progress.md:42` and
  `thoughts/shared/prs/225_description.md:49` record that, at PR #225, the two
  compatibility records were kept pending downstream migration under #226.
- `thoughts/shared/processes/singlepagestartup/ISSUE-226.md` (Create phase)
  records the gate and the learning that deletion needs an explicit
  downstream-adoption gate rather than a date.
- `thoughts/shared/prs/235_description.md` records the PR that removed the files
  without mentioning them; its Notes section addresses relocated utilities and
  indexes.
- `thoughts/shared/research/singlepagestartup/2026-09-11-downstream-migrations.md`
  records how adaptation intent is carried and where completion is stored.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-222.md` — architecture
  research that introduced the legacy migration map.
- `thoughts/shared/research/singlepagestartup/2026-09-11-downstream-migrations.md`
  — downstream-migration mechanism.
- `thoughts/shared/research/singlepagestartup/2026-09-14-studio-directory-and-startup-audit.md`
  — workspace ownership audit; contains no mention of the legacy files.

## Open Questions

- Which repositories count as "maintained downstream projects" is not recorded;
  `doctorgpt` is the only child named in `thoughts/`, and no inventory exists
  for #226 or the similarly gated #216.
- The files were deleted on 2026-09-11 without a recorded downstream
  confirmation, `Downstream-*` trailers, or a mention in the PR #235
  description. Whether the operator treats the gate as satisfied, waived, or
  still open for a retroactive check is an operator decision.
- `npm run singlepagestartup:agents:validate` never existed on `main` and no
  agent validator replaced it; the acceptance criterion that names it cannot be
  run as written.
- The ticket file `thoughts/shared/tickets/singlepagestartup/ISSUE-226.md:35-36`
  is the only place the deleted paths still appear; whether that counts against
  "repository search finds no stale references" is not defined by the issue.
