---
issue_number: 216
issue_title: "Remove temporary natural-key repair after SPS rollout"
repository: singlepagestartup
created_at: 2026-07-21T19:49:55Z
last_updated: 2026-09-17T23:15:41Z
status: active
current_phase: research
---

# Process Log: ISSUE-216 - Remove temporary natural-key repair after SPS rollout

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: not_started
- Implement: not_started
- Current phase: research
- Next step: human review, then `core/20-plan`. The removal gate still requires operator-recorded rollout evidence (compatibility version, per-project/environment inventory, repair-log and check output, index verification, log review, `/start` smoke test); none exists in the repository or the issue as of research.

## Phase Notes

### Create

- Summary: Created follow-up issue #216 for removing temporary deployment-time natural-key repair code after the downstream rollout is complete.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-216.md`, `thoughts/shared/processes/singlepagestartup/ISSUE-216.md`, and https://github.com/singlepagestartup/singlepagestartup/issues/216.
- Notes: The issue was added to SPS Project #2 and moved through Triage to Research Needed. Removal is explicitly gated on every maintained downstream project upgrading and completing the compatibility migrations.
- Notes: Clarified that the temporary apply command remains mandatory on every API deployment/restart until rollout completion. The removal gate now requires per-project/environment deployment evidence, a zero-count repair check, index verification, log review, and rapid `/start` database-cardinality smoke testing.

### Research

- Summary: Inventoried the temporary repair (runner, three repair modules sharing `NaturalKeyRepairMode`, two repair-only integration specs), its four wiring points (check/apply targets, last step of aggregate `@sps/rbac:repository-migrate`, pre-Social step of `api:db:migrate` and `migrate.sh`), the two log markers, the RBAC README rollout section, the fourteen permanent unique/partial-unique indexes with their generated migrations, the runtime bootstrap behavior that stays, and the release history (`0.0.290`, `0.0.291`, `0.0.292`, `0.0.295`; newest tag `0.0.302`). Verified every issue claim against live code.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-216.md`; ticket `thoughts/shared/tickets/singlepagestartup/ISSUE-216.md` gained a Comments section with an English summary of the Russian contract comment.
- Notes: Two claims are contradicted by live code. `start.sh:12` runs `./migrate.sh seed &` in the background since commit `ecf319e3bf` (tag `0.0.292`), which postdates the issue comment mandating foreground execution; `libs/modules/rbac/README.md:117-122` still states the foreground policy. The aggregate `@sps/rbac:repository-migrate` runs the apply step last (`libs/modules/rbac/project.json:50-52`, moved by `53b059643c`), while `README.md:131-133` says repair runs before migrations.
- Notes: No compatibility release version, downstream project list, or per-environment rollout evidence exists anywhere in the repository or the issue. The root `package.json` has no `version`; releases are `0.0.NNN` git tags.
- Notes: Research ran under caller constraints without the GitHub status helpers (no status change, no issue comment); those steps remain for the orchestrating session.

### Plan

- Summary:
- Outputs:
- Notes:

### Implement

- Summary:
- Outputs:
- Notes:

## Incident Log

<!-- incident-count: 4 -->

### Incident 1 — GitHub helper required network escalation

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: Repository-context preflight could not connect to `api.github.com` in the restricted command environment.
- **Root Cause**: Ordinary workspace commands do not have external network access.
- **Fix**: Re-ran the unchanged shared create/status helper workflow with approved network escalation.
- **Preventive Action**: Preserve the helper-driven workflow and escalate network access on the documented GitHub connectivity failure instead of replacing it with raw partial commands.
- **References**: `.codex/skills/core-00-create/SKILL.md`, `.claude/helpers/create_issue_with_project.sh`, `.claude/helpers/get_issue_status.sh`

### Incident 2 — Recorded notes and README lag behind live deployment code

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: The issue comments, the ticket, and `libs/modules/rbac/README.md:117-122` describe `start.sh api` running `migrate.sh seed` in the foreground with fail-fast semantics; `README.md:131-133` describes the aggregate RBAC migrate running repair first. `thoughts/shared/research/singlepagestartup/ISSUE-213.md` describes advisory locks in Telegram bootstrap and an `advisory-lock.ts` helper.
- **Root Cause**: Commits after those documents changed the code: `ecf319e3bf` (2026-07-22) backgrounded `migrate.sh seed` in `start.sh:12`; `53b059643c` (2026-07-25) moved the apply step to the end of `libs/modules/rbac/project.json:38-55`; `e0273194c8` (2026-07-22) removed the advisory locks and runtime cleanup from `bootstrap.ts`. None of the documents was updated.
- **Fix**: Recorded the live state and each contradiction in the research document's verification table and open questions; did not edit README or code (research is documentation-only).
- **Preventive Action**: Treat deployment scripts and README rollout sections as unverified by tests; read `start.sh`, `migrate.sh`, and the Nx target definitions directly before relying on any process description of them, and check `git log -- start.sh migrate.sh` for changes after the artifact date.
- **References**: `start.sh:10-14`, `migrate.sh:15-19`, `libs/modules/rbac/project.json:38-71`, `libs/modules/rbac/README.md:115-147`, `thoughts/shared/research/singlepagestartup/ISSUE-213.md:28`

### Incident 3 — Editorial-pass contract path does not exist in this checkout

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: `CLAUDE.md` requires the final editorial pass defined in `.agents/contracts/editorial-pass.md` and says Codex loads `.codex/skills/unslop/SKILL.md`. Neither path exists in the worktree; a repository-wide search found no file named `editorial-pass*` or `*unslop*`.
- **Root Cause**: The contract is referenced by the entry-point instructions but has not been added to the repository (or was removed) on this branch.
- **Fix**: Applied a plain editorial pass by hand (precise terminology, no filler, preserved uncertainty and file references) and recorded the gap here.
- **Preventive Action**: Until the contract file exists, agents should apply the general rule in `CLAUDE.md` directly and note the missing file rather than skipping the pass; a framework-level fix belongs in `utilities/post_commit_retro.md`.
- **References**: `CLAUDE.md` (editorial pass paragraph), `.agents/contracts/`

### Incident 4 — Worktree sandbox rejects compound git and variable-path commands

- **Phase**: Research
- **Occurrences**: 3
- **Symptom**: Bash calls that ran `git` inside a `for` loop, or `sed`/`cat` with a shell variable holding a path, were refused with "cannot be shown not to be git" / "too complex to verify that it stays inside the worktree". A zsh glob in `--include=*.ts` also failed with "no matches found".
- **Root Cause**: The worktree-isolated session only allows git invocations it can statically verify; unquoted variables and loops defeat that check. zsh expands unquoted globs in option values.
- **Fix**: Re-issued one plain `git` command per Bash call with literal paths, used literal file paths for `sed`/`cat`, and quoted `--include='*.ts'`.
- **Preventive Action**: In worktree sessions, write git commands as single plain invocations with literal arguments; never wrap git in loops or pass paths through variables; quote every glob.
- **References**: this session's Bash calls for `git show`, `git tag --contains`, and `grep --include`

## Reusable Learnings

- Migration compatibility code must have a recorded removal gate so one-time repair logic does not remain in steady-state application maintenance indefinitely.
- Deployment entry scripts (`start.sh`, `migrate.sh`) and README rollout sections have no test coverage; verify them against live code and `git log` before treating any process description as current.
- The repository records releases only as `0.0.NNN` git tags (no `version` in `package.json`, no CHANGELOG). Use `git tag --contains <commit>` and `git tag --sort=creatordate` to map a change to a release.
- In worktree-isolated sessions, run one plain `git` command per Bash call with literal paths; loops and shell variables around git are refused.
