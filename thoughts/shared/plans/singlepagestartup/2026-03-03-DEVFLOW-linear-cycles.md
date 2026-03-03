# Linear Single-Track Cycles Implementation Plan

## Overview

This plan refactors the development workflow to use a unified linear single-track cycle with explicit phase gates, eliminating duplicate commands and integrating all steps into a single cohesive pipeline: create → research → plan → implement → done.

## Current State Analysis

**Current Commands (31 total):**

| Type           | Commands                                                                 | Problem                            |
| -------------- | ------------------------------------------------------------------------ | ---------------------------------- |
| Plan Creation  | `create_plan`, `create_plan_nt`, `create_plan_generic`                   | 3 variants, unclear which to use   |
| Plan Iteration | `iterate_plan`, `iterate_plan_nt`, `iterate_plan_external`               | 3 variants, different workflows    |
| PR Description | `describe_pr`, `describe_pr_nt`, `ci_describe_pr`                        | 3 variants, `_nt` uses /tmp        |
| Commit         | `commit`, `ci_commit`                                                    | 2 variants, not integrated in flow |
| Research       | `research_codebase`, `research_codebase_nt`, `research_codebase_generic` | 3 variants, `_nt` no thoughts/     |
| Ralph Loop     | `ralph_research`, `ralph_plan`, `ralph_impl`                             | No explicit phase gates            |

**Current Ralph Loop Flow:**

```
ralph_research → ralph_plan → ralph_impl → (manual commit) → (manual describe_pr) → done
```

**Key Problems:**

1. Multiple `_nt` variant commands that skip `thoughts/` directory
2. No explicit validation gates between phases
3. Can start implementation before plan is approved
4. `commit` and `describe_pr` are manual steps, not part of automated flow
5. No progress tracking across implementation phases
6. Duplicate logic across similar commands

## Desired End State

A unified linear single-track pipeline where:

- Only one phase is active at any time
- Each phase has explicit entry/exit conditions
- Progress is tracked in `thoughts/shared/handoffs/REPO_NAME/ISSUE-{NUMBER}-progress.md`
- All commands are consolidated (no `_nt` variants)
- `commit` and `describe_pr` are integrated into the `implement` phase
- Status transitions happen automatically at phase boundaries

**Target Pipeline:**

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Single Line Pipeline                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                  │
│   create ──→ research ──→ plan ──→ implement ──→ done     │
│      ↑              ↑          ↑          ↑          ↑                │
│      └─────────────────┴──────────────┴───────────────┴──────────┘                │
│                                                                  │
│   Rule: only ONE active phase at any time                      │
└─────────────────────────────────────────────────────────────────────────┘
```

**Phase Transitions with GitHub Project Statuses:**

| Phase     | Entry Status     | Automated Exit Status | Human Review Sets Next Status |
| --------- | ---------------- | --------------------- | ----------------------------- |
| create    | None (new issue) | Research Needed       | —                             |
| research  | Research Needed  | Research in Review    | Ready for Plan                |
| plan      | Ready for Plan   | Plan in Review        | Ready for Dev                 |
| implement | Ready for Dev    | Code Review           | —                             |

> **Important**: After `research` and `plan` phases complete, the issue enters a review status ("Research in Review" / "Plan in Review"). A human reviewer must manually advance the issue to the next entry status ("Ready for Plan" / "Ready for Dev") in GitHub Project before the next phase command can run. This gate is intentional — it ensures alignment and approval before proceeding. The `done` phase is not a command; see note below.

### Key Discoveries:

- **`.claude/helpers/get_issue_status.sh`** already provides status checking via REST API - simpler than GraphQL approach in `github_status.md`
- **`.claude/helpers/update_issue_status.sh`** provides status updates with GraphQL - works reliably
- **`.claude/commands/github_status.md`** uses GraphQL and is more complex than needed for status checks
- **Ralph Loop commands** (`ralph_*.md`) already implement status gates but lack phase-level validation
- **`implement_plan.md`** already has phase-by-phase verification but no progress tracking file
- **File naming**: `_nt` suffix commands skip `thoughts/` directory and use `/tmp/` instead

## What We're NOT Doing

- Changing the GitHub Project status structure (12 statuses remain)
- Modifying the `.claude/.env` configuration system
- Changing the thoughts/ directory structure
- Removing special-purpose commands (debug, founder_mode, linear, etc.)
- Creating new GitHub API integrations (using existing helpers)

## Implementation Approach

The refactoring will be done in 4 phases:

1. **Phase 1**: Create new `core/` command structure — 4 phase commands + `next.md` smart dispatcher; create `utilities/` directory with `commit.md` and `describe_pr.md` moved from root; `20-plan.md` absorbs the plan-update and GitHub-comment-sync functionality from `iterate_plan` and `iterate_plan_external`
2. **Phase 2**: Define progress file format and handoff protocol at `thoughts/shared/handoffs/REPO_NAME/ISSUE-{NUMBER}-progress.md` (agent handoff point at 70% context)
3. **Phase 3**: Update documentation and examples to use new commands
4. **Phase 4**: Delete duplicate, `_nt`, and obsolete variant commands (explicit file list provided — done last so existing commands remain available as reference throughout Phases 1–3)

Each phase builds on the previous one and can be verified independently.

## Phase 1: Create New Core Command Structure

### Overview

Create new `core/` subdirectory with unified commands that implement the linear single-track cycle. Each command will have explicit status gates and follow a consistent pattern.

### Changes Required:

#### 1. Create `.claude/commands/core/` directory

**Directory**: `.claude/commands/core/`
**Changes**: Create new directory structure

```bash
mkdir -p .claude/commands/core
```

#### 2. Create `00-create.md` command

**File**: `.claude/commands/core/00-create.md`
**Changes**: New unified create command that combines task creation with initial documentation

```yaml
---
description: Create new issue with local documentation and GitHub issue
model: opus
---

# Create Issue

You create a new development issue with local documentation and GitHub issue creation.

## Status Gate

**Entry**: None (can be run anytime for new issues)

## Process

1. **Gather information**:
   - Ask user for issue title
   - Ask for problem description
   - Ask for priority (high/medium/low)
   - Ask for size label (xs/small/medium/large)

2. **Create local ticket file**:
   - Save to `thoughts/shared/tickets/REPO_NAME/ISSUE-{IDENTIFIER}.md`
   - Format: Use existing ticket structure with metadata
   - Include: title, problem, key details, implementation notes

3. **Create GitHub issue** (if user confirms):
   - Create issue via `gh issue create`
   - Add size and priority labels
   - Add to GitHub Project
   - Set initial status to "Triage"

4. **Update status to "Research Needed"**:
   - Run `.claude/helpers/update_issue_status.sh ISSUE_NUMBER "Research Needed"`
   - This signals the issue is ready for the `research` phase

## Exit

- [ ] Local ticket file created at `thoughts/shared/tickets/REPO_NAME/ISSUE-{IDENTIFIER}.md`
- [ ] GitHub issue created (or user declined)
- [ ] Status updated to "Research Needed" in GitHub Project
```

#### 3. Create `10-research.md` command

**File**: `.claude/commands/core/10-research.md`
**Changes**: New unified research command with explicit status gates

````yaml
---
description: Research codebase for GitHub issue in "Research Needed" status
model: opus
---

# Research Issue

You research the codebase to understand the issue context and document findings.

## Status Gate

**Entry**: Issue must be in "Research Needed" or "Research in Progress" status (the latter allows resuming an interrupted session)

```bash
CURRENT_STATUS=$(.claude/helpers/get_issue_status.sh ISSUE_NUMBER)

if [[ "$CURRENT_STATUS" != "Research Needed" && "$CURRENT_STATUS" != "Research in Progress" ]]; then
  echo "❌ Cannot proceed: Issue #$ISSUE_NUMBER has status '$CURRENT_STATUS'"
  echo "This command requires status: 'Research Needed' or 'Research in Progress'"
  exit 1
fi
````

## Process

1. **Update status to "Research in Progress"**:

   ```bash
   .claude/helpers/update_issue_status.sh ISSUE_NUMBER "Research in Progress"
   ```

2. **Read existing ticket file**:

   - Read `thoughts/shared/tickets/REPO_NAME/ISSUE-{NUMBER}.md`
   - Understand problem and key details

3. **Research codebase** (use parallel sub-tasks):

   - `codebase-locator`: Find relevant files
   - `codebase-analyzer`: Understand current implementation
   - `thoughts-locator`: Find related research/plans

4. **Document findings**:

   - Save to `thoughts/shared/research/REPO_NAME/YYYY-MM-DD-ISSUE-{NUMBER}-description.md`
   - Use existing research structure with YAML frontmatter
   - Include: summary, detailed findings, open questions

5. **Update status to "Research in Review"**:
   ```bash
   .claude/helpers/update_issue_status.sh ISSUE_NUMBER "Research in Review"
   ```

## Exit

- [ ] Research documented at `thoughts/shared/research/REPO_NAME/YYYY-MM-DD-ISSUE-{NUMBER}-description.md`
- [ ] Status updated to "Research in Review" in GitHub Project

```

```

#### 4. Create `20-plan.md` command

**File**: `.claude/commands/core/20-plan.md`
**Changes**: New unified planning command with explicit status gates

````yaml
---
description: Create implementation plan for GitHub issue in "Ready for Plan" status
model: opus
---

# Plan Implementation

You create a detailed implementation plan for a researched issue.

## Status Gate

**Entry**: Issue must be in "Ready for Plan" or "Plan in Progress" status (the latter allows resuming an interrupted session or revising a plan after review feedback)

```bash
CURRENT_STATUS=$(.claude/helpers/get_issue_status.sh ISSUE_NUMBER)

if [[ "$CURRENT_STATUS" != "Ready for Plan" && "$CURRENT_STATUS" != "Plan in Progress" ]]; then
  echo "❌ Cannot proceed: Issue #$ISSUE_NUMBER has status '$CURRENT_STATUS'"
  echo "This command requires status: 'Ready for Plan' or 'Plan in Progress'"
  exit 1
fi
````

## Process

1. **Update status to "Plan in Progress"**:

   ```bash
   .claude/helpers/update_issue_status.sh ISSUE_NUMBER "Plan in Progress"
   ```

2. **Read existing ticket and research files**:

   - Read `thoughts/shared/tickets/REPO_NAME/ISSUE-{NUMBER}.md`
   - Read research document from issue comments or thoughts/
   - Understand problem and findings

3. **Check whether a plan already exists**:

   ```bash
   REPO_NAME=$(gh repo view --json name -q '.name')
   find "thoughts/shared/plans/$REPO_NAME" -name "*ISSUE-${ISSUE_NUMBER}*.md" -type f | sort -r | head -1
   ```

   **If no plan exists** → proceed to step 4 (create new plan).

   **If a plan already exists** → read it completely, then proceed to step 5 (sync GitHub comments and update).

4. **Create implementation plan** (new plan, follow existing structure from `create_plan_generic.md`):

   - Think deeply about the problem. Spawn parallel sub-tasks (`codebase-locator`, `codebase-analyzer`, `thoughts-locator`) to gather technical context before writing.
   - Save to `thoughts/shared/plans/REPO_NAME/YYYY-MM-DD-ISSUE-{NUMBER}-description.md`
   - Include: overview, current state, desired state, phases with success criteria
   - Separate automated vs manual verification criteria in every phase
   - Be skeptical — verify assumptions against actual codebase patterns; include specific file paths and line numbers
   - Skip to step 6 after saving.

5. **Sync GitHub comments and update existing plan** (idempotent — safe to run multiple times):

   a. **Find last sync marker** in the plan file:

   - Look for `<!-- Last synced at: YYYY-MM-DDTHH:MM:SSZ -->` near the end of the file
   - If no marker exists, use the plan's first git commit date as the cutoff

   b. **Fetch GitHub issue comments** newer than the marker:

   ```bash
   gh issue view ISSUE_NUMBER --json comments | jq -r '.comments'
   ```

   Filter to only those newer than the last sync timestamp.
   If no new comments → skip to step 6 (re-attach plan without changes).

   c. **Analyze new comments** for plan changes:

   - Explicit requests ("Please add X") → apply change
   - Decisions ("We decided to skip Y") → update scope
   - Conflicting instructions → use most recent
   - Observations / FYI → document but no plan change
   - If research is needed to validate a requested change, spawn `codebase-locator` / `codebase-analyzer` sub-tasks

   d. **Make surgical edits** to the plan:

   - Use Edit tool, not wholesale rewrites
   - Re-read the file immediately before each edit (Edit tool requires exact string matches)
   - Maintain existing structure; only modify what changed
   - Handle edit failures gracefully: log and continue with remaining changes

   e. **Update the sync marker** at the end of the plan:

   ```markdown
   <!-- Last synced at: CURRENT_UTC_TIMESTAMP -->
   ```

   f. **Create a commit** confirming the update:

   ```bash
   git add "$PLAN_FILE"
   git commit -m "docs: update plan for #ISSUE_NUMBER based on GitHub discussion

   - [Bullet list of changes made]"
   ```

   Only create the commit after all edits are complete. If the commit fails, do NOT post a GitHub comment.

   g. **Post a reply comment** on the GitHub issue:

   ```bash
   gh issue comment ISSUE_NUMBER --body "Plan updated based on discussion.

   **Changes made:**
   - [Change 1]
   - [Change 2]

   Commit: [COMMIT_HASH]"
   ```

6. **Attach plan to GitHub issue** (always — whether newly created or updated):

   ```bash
   gh issue comment ISSUE_NUMBER --body "Implementation plan: \`thoughts/shared/plans/REPO_NAME/PLAN_FILENAME.md\`

   [Brief summary of approach and phases]"
   ```

   Skip this step if step 5g already posted a comment that references the plan.

7. **Update status to "Plan in Review"**:
   ```bash
   .claude/helpers/update_issue_status.sh ISSUE_NUMBER "Plan in Review"
   ```

## Exit

- [ ] Implementation plan created or updated at `thoughts/shared/plans/REPO_NAME/YYYY-MM-DD-ISSUE-{NUMBER}-description.md`
- [ ] Sync marker updated in plan file
- [ ] Plan referenced in GitHub issue comment
- [ ] If existing plan was updated: commit created and reply posted in GitHub
- [ ] Status updated to "Plan in Review" in GitHub Project

> **Plan Revision**: If a reviewer requests changes while the issue is in "Plan in Review", manually set the status back to "Plan in Progress" via `.claude/helpers/update_issue_status.sh ISSUE_NUMBER "Plan in Progress"`, then re-run `20-plan.md`. It will detect the existing plan, sync any new GitHub comments, apply changes, commit, and re-submit for review.

```

```

#### 5. Create `30-implement.md` command

**File**: `.claude/commands/core/30-implement.md`
**Changes**: New unified implement command with progress tracking and integrated commit/PR

````yaml
---
description: Implement approved plan for GitHub issue in "Ready for Dev" status
model: sonnet
---

# Implement Plan

You implement an approved plan phase-by-phase with progress tracking.

## Status Gate

**Entry**: Issue must be in "Ready for Dev" or "In Dev" status (the latter allows resuming an interrupted session)

```bash
CURRENT_STATUS=$(.claude/helpers/get_issue_status.sh ISSUE_NUMBER)

if [[ "$CURRENT_STATUS" != "Ready for Dev" && "$CURRENT_STATUS" != "In Dev" ]]; then
  echo "❌ Cannot proceed: Issue #$ISSUE_NUMBER has status '$CURRENT_STATUS'"
  echo "This command requires status: 'Ready for Dev' or 'In Dev'"
  exit 1
fi
````

## Process

1. **Update status to "In Dev"**:

   ```bash
   .claude/helpers/update_issue_status.sh ISSUE_NUMBER "In Dev"
   ```

2. **Check for existing progress file** (resume detection):

   ```bash
   PROGRESS_FILE="thoughts/shared/handoffs/$REPO_NAME/ISSUE-${ISSUE_NUMBER}-progress.md"
   ```

   - If file exists and `status: in_progress` → read it, identify the last completed phase, continue from the next phase
   - If file does not exist → create it (issue number, start date, plan reference, phase checklist) and start from Phase 1

3. **Read implementation plan**:

   - Read `thoughts/shared/plans/REPO_NAME/PLAN_FILENAME.md`
   - Understand all phases and success criteria

4. **Sync GitHub comments** (before starting any code changes):

   ```bash
   gh issue view ISSUE_NUMBER --json comments | jq -r '.comments'
   ```

   Read all comments since the plan was last synced. Check `<!-- Last synced at: ... -->` marker in the plan file to determine the cutoff date.

   - **Significant changes** (new requirements, scope changes, explicit constraints like "please don't do X"): stop and inform the user — the plan needs updating before implementation can proceed. Instruct to re-run `20-plan.md` first.
   - **Clarifications or FYI** (technical hints, pointers to files, confirmations): record in the progress file Notes section and continue without blocking.
   - **No new comments**: proceed immediately.

5. **Implement each phase** (sequential, fully automatic — no pauses):

   For each phase N:

   - Update progress file: mark phase N as started with timestamp
   - Implement changes per plan
   - Run automated verification:
     - Migrations: `make migrate` or `npm run db:migrate`
     - Tests: `make test` or `npm test`
     - Typecheck: `npm run typecheck`
     - Lint: `npm run lint` or `make lint`
   - Update progress file with verification results (PASSED/FAILED) and notes
   - If verification fails: attempt to fix, re-run, update progress file
   - Proceed to next phase automatically

6. **After all phases complete**:

   a. **Create commit**:

   - Read and follow `.claude/commands/utilities/commit.md` (do not use SlashCommand — read the file and execute its instructions directly)
   - Use plan-based commit message

   b. **Create PR**:

   - Read and follow `.claude/commands/utilities/describe_pr.md` (same — read the file and execute its instructions directly)
   - Auto-fill from progress file

   c. **Update progress file**:

   - Mark all phases complete
   - Add PR link
   - Add summary of changes

   d. **Comment on issue with PR link**:

   ```bash
   gh issue comment ISSUE_NUMBER --body "PR submitted: [PR_URL]

   Implementation summary:
   - [Key change 1]
   - [Key change 2]"
   ```

   e. **Mark progress file as complete**:

   Update YAML frontmatter in the progress file: set `status: complete` and `completed_date: CURRENT_DATE`.
   This signals that the issue is fully implemented and the progress file is now an archival record.

7. **Update status to "Code Review"**:
   ```bash
   .claude/helpers/update_issue_status.sh ISSUE_NUMBER "Code Review"
   ```

## Exit

- [ ] Progress file created/updated at `thoughts/shared/handoffs/REPO_NAME/ISSUE-{NUMBER}-progress.md`
- [ ] All phases implemented and verified
- [ ] Commit created with descriptive message
- [ ] PR created with comprehensive description
- [ ] Progress file updated with PR link and marked `status: complete`
- [ ] Issue commented with PR link
- [ ] Status updated to "Code Review" in GitHub Project

```

```

#### 6. No `40-done.md` command — done transition is manual

**Decision**: Do not create a `40-done.md` command.

**Rationale**: The PR is merged by a human. Moving the issue to "Done" after merge is a one-click action in GitHub Project and does not benefit from automation at this stage. A dedicated command adds friction without value.

**Instead, document the following in `.claude/commands/README.md` and `CLAUDE.md`**:

> After your PR is merged, open the GitHub Project board and move the issue from "Code Review" to "Done". Then run the `thoughts/` cleanup checklist below.

If automation is desired in the future (e.g., via GitHub Actions webhook on PR merge), it can be added as a separate infrastructure task.

#### `thoughts/` File Lifecycle and Cleanup After Done

The `thoughts/` directory accumulates files across the full lifecycle of an issue. Here is what to keep vs delete after the issue is marked Done:

| File                  | Location                                                                      | Keep?     | Reason                                                                                 |
| --------------------- | ----------------------------------------------------------------------------- | --------- | -------------------------------------------------------------------------------------- |
| Ticket file           | `thoughts/shared/tickets/REPO_NAME/ISSUE-{NUMBER}.md`                         | ✅ Keep   | Original problem statement — permanent project history                                 |
| Research file         | `thoughts/shared/research/REPO_NAME/YYYY-MM-DD-ISSUE-{NUMBER}-description.md` | ✅ Keep   | Documents why decisions were made — valuable context                                   |
| Plan file             | `thoughts/shared/plans/REPO_NAME/YYYY-MM-DD-ISSUE-{NUMBER}-description.md`    | ✅ Keep   | Design decisions and success criteria — reference for future changes                   |
| Progress/handoff file | `thoughts/shared/handoffs/REPO_NAME/ISSUE-{NUMBER}-progress.md`               | 🗑 Delete | Purely operational runtime tracking — all meaningful info is in the plan + git history |

**Post-merge cleanup** (manual, run once after issue is marked Done):

```bash
# Verify the PR is merged and the issue is Done first
gh pr view PR_NUMBER --json state,mergedAt

# Delete operational handoff file
rm thoughts/shared/handoffs/REPO_NAME/ISSUE-{NUMBER}-progress.md
git add -A && git commit -m "chore: clean up handoff file for #ISSUE_NUMBER (merged)"
```

> **Why keep the plan file separately from the progress file?**
> The plan is created and reviewed in the `plan` phase — _before_ implementation starts. The progress file is an operational log created _during_ implementation. They exist at different times and serve different audiences (plan = stakeholder review; progress = agent runtime state). After Done, the plan file is the lasting design document; the progress file is deleted because its only remaining value (what changed) is already captured in the git commit history and the plan file's phases.

> **What about the progress file living in `handoffs/`?**
> The `handoffs/` directory is intentionally operational — it holds in-flight agent state. Once an issue is Done, that state is obsolete. Keeping `handoffs/` clean ensures that `next.md` (which scans for `status: in_progress` files) doesn't pick up stale entries.

#### 7. Create `utilities/` directory and move existing commands

**Directory**: `.claude/commands/utilities/`
**Changes**: Create directory, move `commit.md` and `describe_pr.md` from `.claude/commands/` root

```bash
mkdir -p .claude/commands/utilities
git mv .claude/commands/commit.md .claude/commands/utilities/commit.md
git mv .claude/commands/describe_pr.md .claude/commands/utilities/describe_pr.md
```

> The plan-update and GitHub-comment-sync functionality from `iterate_plan.md` and `iterate_plan_external.md` has been merged into `core/20-plan.md`. Those original files are deleted in Phase 4 — they do not go to `utilities/`.

> **Note**: The `utilities/` directory does not exist yet. It must be created as part of this phase. Any existing references to `/commit` or `/describe_pr` slash-commands will break and must be updated to `/utilities/commit` and `/utilities/describe_pr`.

#### 8. Create `next.md` smart dispatcher command

**File**: `.claude/commands/core/next.md`
**Changes**: New command that reads GitHub Project status (and local progress file) to automatically determine and invoke the correct phase command

````yaml
---
description: Determine and run the next workflow phase for a GitHub issue based on its current status
model: sonnet
---

# Next — Smart Workflow Dispatcher

You determine what the next action is for a given issue and run the appropriate phase command automatically. The developer should not need to look at GitHub Project to know what to run next.

## Process

1. **Resolve issue number**:
   - If an issue number is provided as argument, use it
   - Otherwise, list all issues in active workflow statuses and ask user to pick one:
     ```bash
     gh project item-list PROJECT_NUMBER --owner PROJECT_OWNER --format json | \
       jq '[.items[] | select(.status | IN("Research Needed","Research in Progress","Ready for Plan","Plan in Progress","Ready for Dev","In Dev"))]'
     ```

2. **Read GitHub Project status**:
   ```bash
   CURRENT_STATUS=$(.claude/helpers/get_issue_status.sh ISSUE_NUMBER)
````

3. **Check local progress file** (if exists):

   ```bash
   REPO_NAME=$(gh repo view --json name -q '.name')
   PROGRESS_FILE="thoughts/shared/handoffs/$REPO_NAME/ISSUE-{NUMBER}-progress.md"
   ```

   Read the `status` field from YAML frontmatter if file exists.

4. **Dispatch based on status**:

   > **Invocation mechanism**: "Run" in this table means read the target command file and execute its instructions directly in the current session (same pattern as `ralph_impl.md` uses for `implement_plan.md`). Do NOT use `SlashCommand()` — that spawns a separate agent context which loses issue-number state.

   | GitHub Status        | Progress File        | Action                                                                                               |
   | -------------------- | -------------------- | ---------------------------------------------------------------------------------------------------- |
   | Research Needed      | —                    | Read and follow `core/10-research.md`                                                                |
   | Research in Progress | —                    | Read and follow `core/10-research.md` (gate accepts this status — resumes in-progress work)          |
   | Research in Review   | —                    | Inform: awaiting human review. Instruct to move to "Ready for Plan" in GitHub Project                |
   | Ready for Plan       | —                    | Read and follow `core/20-plan.md`                                                                    |
   | Plan in Progress     | —                    | Read and follow `core/20-plan.md` (gate accepts this status — resumes or revises plan)               |
   | Plan in Review       | —                    | Inform: awaiting human review. Instruct to move to "Ready for Dev" in GitHub Project                 |
   | Ready for Dev        | —                    | Read and follow `core/30-implement.md`                                                               |
   | In Dev               | exists (in_progress) | Read and follow `core/30-implement.md`; detects progress file and resumes from last incomplete phase |
   | Code Review          | exists               | Inform: PR submitted, awaiting review. Show PR link from progress file                               |
   | Triage               | —                    | Inform: issue needs human preparation before automation can proceed                                  |
   | Spec Needed          | —                    | Inform: issue needs human preparation before automation can proceed                                  |
   | Done                 | —                    | Inform: issue is complete                                                                            |

5. **Before dispatching**, always print a summary:
   ```
   Issue #NUMBER: [title]
   Current status: [CURRENT_STATUS]
   Action: [what will be run]
   ```
   Then proceed without asking for confirmation (unless status requires human action).

## Exit

- Correct phase command invoked based on current status
- If human action required: clear instruction printed, no command run

```

```

### Success Criteria:

#### Automated Verification:

- [ ] All 4 core phase commands created at `.claude/commands/core/` (`00-create`, `10-research`, `20-plan`, `30-implement`)
- [ ] `next.md` dispatcher created at `.claude/commands/core/next.md`
- [ ] `utilities/` directory created with `commit.md` and `describe_pr.md`
- [ ] Each phase command has status gate with status check
- [ ] Each command follows consistent structure (entry → process → exit)
- [ ] Commands reference correct helper scripts for status updates

#### Manual Verification:

- [ ] `00-create.md` creates ticket file and GitHub issue correctly
- [ ] `10-research.md` correctly checks status gate before proceeding
- [ ] `20-plan.md` creates a new plan when none exists; updates + commits when one exists
- [ ] `20-plan.md` is idempotent — re-running with no new GitHub comments skips the sync step
- [ ] `30-implement.md` syncs GitHub comments before starting — blocks on significant changes, continues on clarifications
- [ ] `30-implement.md` creates progress tracking file and runs all phases automatically
- [ ] `30-implement.md` writes a handoff message and stops at ~70% context usage
- [ ] `next.md` correctly routes to the right command based on GitHub status
- [ ] `next.md` shows helpful message for statuses requiring human action (Review statuses)
- [ ] Post-merge cleanup deletes progress file and leaves `thoughts/` clean

---

## Phase 2: Progress File Format and Agent Handoff Protocol

### Overview

Define the format and role of the progress file that `30-implement.md` creates and maintains at `thoughts/shared/handoffs/REPO_NAME/ISSUE-{NUMBER}-progress.md`.

This file serves two purposes:

1. **Progress tracking** — records which phases are done, verification results, and the PR link
2. **Agent handoff** — if an agent reaches ~70% of its context window before finishing all phases, it writes its current state into this file and stops. The next agent reads the file as the starting point and continues from the last incomplete phase. This is the mechanism `ralph_impl.md` and `next.md` use to resume `In Dev` issues.

### Changes Required:

#### 1. Define progress file structure

The file is created by `30-implement.md` at:

```
thoughts/shared/handoffs/REPO_NAME/ISSUE-{NUMBER}-progress.md
```

Example: `thoughts/shared/handoffs/singlepagestartup/ISSUE-142-progress.md`

**File format**:

```markdown
---
issue_number: ISSUE_NUMBER
issue_title: "Issue Title"
start_date: YYYY-MM-DDTHH:MM:SSZ
plan_file: thoughts/shared/plans/REPO_NAME/YYYY-MM-DD-ISSUE-{NUMBER}-description.md
status: in_progress
---

# Implementation Progress: ISSUE-{NUMBER} - Issue Title

**Started**: YYYY-MM-DD
**Plan**: `thoughts/shared/plans/REPO_NAME/YYYY-MM-DD-ISSUE-{NUMBER}-description.md`

## Phase Progress

### Phase 1: [Phase Name]

- [x] Started: YYYY-MM-DDTHH:MM:SSZ
- [x] Completed: YYYY-MM-DDTHH:MM:SSZ
- [x] Automated verification: PASSED

**Notes**: [Implementation notes or discoveries]

### Phase 2: [Phase Name]

- [x] Started: YYYY-MM-DDTHH:MM:SSZ
- [ ] Completed: —
- [ ] Automated verification: IN PROGRESS

**Notes**: [Context for the next agent if handoff occurs here]

[Additional phases as needed...]

## Summary

### Changes Made

- [Key change 1]
- [Key change 2]

### Pull Request

- [ ] PR created: [PR URL]
- [ ] PR number: {NUMBER}

### Final Status

- [ ] All phases completed
- [ ] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: YYYY-MM-DDTHH:MM:SSZ
```

#### 2. Handoff protocol for `30-implement.md`

Add the following rule inside `30-implement.md`:

> **Context limit handoff**: After completing each phase, check whether the conversation context is approaching ~70% of the context window. If it is:
>
> 1. Update the progress file — mark the completed phase, add notes on the current state
> 2. Set `status: in_progress` in the YAML frontmatter
> 3. Stop and inform the user:
>    ```
>    Context at ~70% — handing off. Progress recorded at:
>    thoughts/shared/handoffs/REPO_NAME/ISSUE-{NUMBER}-progress.md
>    Run /core/next {NUMBER} or /core/30-implement {NUMBER} to continue from Phase N+1.
>    ```

#### 3. Resumption protocol for `30-implement.md`

At startup, `30-implement.md` checks for an existing progress file:

```bash
PROGRESS_FILE="thoughts/shared/handoffs/$REPO_NAME/ISSUE-${ISSUE_NUMBER}-progress.md"
```

- If the file exists and `status: in_progress`: read it, identify the last completed phase, continue from the next phase
- If the file does not exist: create it and start from Phase 1

This is also how `next.md` detects `In Dev` issues — it reads the progress file to provide the correct resume context.

### Success Criteria:

#### Automated Verification:

- [ ] Progress file format documented (structure defined in this plan)
- [ ] Handoff and resumption protocol defined in `30-implement.md` content
- [ ] `next.md` dispatch table correctly handles `In Dev` + existing progress file
- [ ] `thoughts/` lifecycle table defined (which files to keep vs delete after Done)

#### Manual Verification:

- [ ] Progress file is human-readable and clearly shows which phase was last completed
- [ ] Handoff message gives enough context to continue without re-reading the full conversation
- [ ] Post-merge cleanup steps are documented and leave `thoughts/` in a clean state

---

## Phase 3: Update Documentation and Examples

### Overview

Update all documentation, README files, and examples to reference the new unified core commands instead of the deprecated variants.

### Changes Required:

#### 1. Update `.claude/commands/README.md` (or create if doesn't exist)

**File**: `.claude/commands/README.md`
**Changes**: Create/update commands directory README

```markdown
# Claude Code Commands

This directory contains commands for the SPS development workflow.

## Core Linear Cycle Commands

The main development workflow uses these unified commands with explicit phase gates:

| Command                | Purpose                            | Status Entry    | GitHub Status                        |
| ---------------------- | ---------------------------------- | --------------- | ------------------------------------ |
| `core/next.md`         | Auto-dispatch to the correct phase | Any             | Reads status, routes automatically   |
| `core/00-create.md`    | Create new issue                   | None            | Triage → Research Needed             |
| `core/10-research.md`  | Research codebase                  | Research Needed | Research Needed → Research in Review |
| `core/20-plan.md`      | Create implementation plan         | Ready for Plan  | Ready for Plan → Plan in Review      |
| `core/30-implement.md` | Implement approved plan            | Ready for Dev   | Ready for Dev → Code Review          |

**Linear Pipeline**:

create → research → plan → implement → done

Each command has an explicit **status gate** - you can only proceed when the issue is in the correct GitHub Project status.

## Special Purpose Commands

These commands serve specific needs outside the main linear cycle:

- `debug.md` - Investigate logs, database state, and git history
- `founder_mode.md` - Post-hoc workflow for experimental features
- `linear.md` - Linear ticket management
- `create_worktree.md` - Create git worktree for implementation
- `local_review.md` - Setup worktree for reviewing colleague's branch
- `validate_plan.md` - Validate implementation against plan
- `create_handoff.md` - Create handoff document
- `resume_handoff.md` - Resume work from handoff
- `setup_github_project.md` - Create GitHub Project with workflow
- `github.md` - GitHub Project issue management
- `github_status.md` - Check GitHub issue status

## Utility Commands

Supporting commands used by the main workflow:

- `utilities/commit.md` - Create git commits (used by implement phase)
- `utilities/describe_pr.md` - Generate PR descriptions (used by implement phase)

## Legacy Ralph Loop Commands

These commands are the original Ralph Loop workflow. They are still functional but the new core commands provide a more unified approach with explicit phase gates:

- `ralph_research.md` - Research phase
- `ralph_plan.md` - Planning phase
- `ralph_impl.md` - Implementation phase

## Deprecated Commands

Commands ending in `_nt` (No Thoughts) are deprecated. See `.claude/DEPRECATED.md` for details and replacements.

## Workflow Statuses

The GitHub Project uses these statuses to gate progress:

| Status                                                      | Purpose                              |
| ----------------------------------------------------------- | ------------------------------------ |
| Triage                                                      | Initial review and categorization    |
| Spec Needed                                                 | More detail required before research |
| Research Needed → Research in Progress → Research in Review | Investigation phase                  |
| Ready for Plan → Plan in Progress → Plan in Review          | Planning phase                       |
| Ready for Dev → In Dev → Code Review                        | Implementation phase                 |
| Done                                                        | Completed                            |

## Using the Commands

Each command is invoked via `/command_name` in Claude Code:

/core/next 142 # recommended — auto-detects phase and runs the right command
/core/00-create # create a new issue from scratch
/core/10-research 142 # run directly if needed
/core/20-plan 142
/core/30-implement 142
```

For issue-specific commands, you can specify the issue number:

```

/core/10-research 142

```

If no issue number is provided, the command will prompt you to select one from the appropriate GitHub Project status.

```

```

#### 2. Update `CLAUDE.md` with command references

**File**: `CLAUDE.md`
**Changes**: Add reference to new core commands

Add this section to `CLAUDE.md`:

```markdown
## Development Workflow Commands

The unified development workflow uses commands in `.claude/commands/core/`.

**Start here in most cases:**

- **`/core/next [issue-number]`** - Auto-detects the current phase from GitHub Project status and runs the correct command. No need to open GitHub Project separately.

**Individual phase commands (if you need direct control):**

- **`/core/00-create`** - Create new issue (→ Research Needed)
- **`/core/10-research`** - Research issue (Research Needed → Research in Review)
- **`/core/20-plan`** - Create implementation plan (Ready for Plan → Plan in Review)
- **`/core/30-implement`** - Implement approved plan (Ready for Dev → Code Review)

**After phases that require human review** (Research in Review, Plan in Review): manually advance the issue status in GitHub Project, then run `/core/next` again.

**After PR merge**: manually move the issue to "Done" in GitHub Project.

For special-purpose tasks, see `.claude/commands/README.md` for the full command list.
```

### Success Criteria:

#### Automated Verification:

- [ ] `.claude/commands/README.md` created with complete command listing
- [ ] `CLAUDE.md` updated with core commands reference
- [ ] No references to deprecated `_nt` commands in documentation

#### Manual Verification:

- [ ] README clearly shows the linear pipeline flow
- [ ] All special-purpose commands documented with purpose
- [ ] Status gate concept is clearly explained

---

## Phase 4: Delete Obsolete Commands

### Overview

Delete all duplicate, `_nt`, and superseded commands. Do not add deprecation notices — the files are simply removed. Move `commit.md` and `describe_pr.md` to `utilities/` (already done in Phase 1).

> **Why delete instead of deprecate**: Claude Code does not process a `deprecated:` frontmatter field — adding it has no effect on behavior. Keeping deprecated files in the directory causes confusion since they still appear as slash-commands. Deletion is the only effective approach.

### Changes Required:

#### 1. Delete the following files

```bash
# _nt variants (skip thoughts/ directory — no longer needed)
git rm .claude/commands/create_plan_nt.md
git rm .claude/commands/iterate_plan_nt.md
git rm .claude/commands/research_codebase_nt.md
git rm .claude/commands/describe_pr_nt.md
git rm .claude/commands/ci_commit.md
git rm .claude/commands/ci_describe_pr.md

# Superseded by core/20-plan.md (functionality merged in)
git rm .claude/commands/create_plan.md
git rm .claude/commands/create_plan_generic.md
git rm .claude/commands/iterate_plan.md
git rm .claude/commands/iterate_plan_external.md

# Superseded by core/10-research.md
git rm .claude/commands/research_codebase.md
git rm .claude/commands/research_codebase_generic.md
```

Total files deleted: **13**

> `iterate_plan.md` and `iterate_plan_external.md` are deleted because their functionality has been merged into `core/20-plan.md`. They are not moved to `utilities/`.

#### 2. Create deletion record document

**File**: `.claude/REMOVED_COMMANDS.md`
**Changes**: Record what was removed and why, for historical reference

```markdown
# Removed Commands

The following commands were removed as part of the linear cycle workflow refactoring.

## Deleted Files

| File                           | Replaced By                | Reason                                             |
| ------------------------------ | -------------------------- | -------------------------------------------------- |
| `create_plan_nt.md`            | `core/20-plan.md`          | \_nt variant — skipped thoughts/, no longer needed |
| `create_plan.md`               | `core/20-plan.md`          | Superseded by unified plan command                 |
| `create_plan_generic.md`       | `core/20-plan.md`          | Superseded by unified plan command                 |
| `iterate_plan_nt.md`           | `core/20-plan.md`          | \_nt variant — functionality merged into 20-plan   |
| `iterate_plan.md`              | `core/20-plan.md`          | Functionality merged into 20-plan (create + sync)  |
| `iterate_plan_external.md`     | `core/20-plan.md`          | Autonomous sync merged into 20-plan                |
| `research_codebase_nt.md`      | `core/10-research.md`      | \_nt variant — no longer needed                    |
| `research_codebase.md`         | `core/10-research.md`      | Superseded by unified research command             |
| `research_codebase_generic.md` | `core/10-research.md`      | Superseded by unified research command             |
| `describe_pr_nt.md`            | `utilities/describe_pr.md` | \_nt variant — no longer needed                    |
| `ci_describe_pr.md`            | `utilities/describe_pr.md` | CI variant — integrated into implement phase       |
| `ci_commit.md`                 | `utilities/commit.md`      | CI variant — plain commit.md is sufficient         |

## Moved Files

| Old Path         | New Path                   |
| ---------------- | -------------------------- |
| `commit.md`      | `utilities/commit.md`      |
| `describe_pr.md` | `utilities/describe_pr.md` |
```

### Success Criteria:

#### Automated Verification:

- [ ] All 13 files listed above are deleted from `.claude/commands/`
- [ ] `commit.md` and `describe_pr.md` exist at `utilities/` paths
- [ ] `.claude/REMOVED_COMMANDS.md` created
- [ ] No `_nt` files remain in `.claude/commands/`

#### Manual Verification:

- [ ] Running `/create_plan` in Claude Code returns "command not found" (file deleted)
- [ ] Running `/utilities/commit` works correctly
- [ ] Running `/core/20-plan` handles both new plan creation and existing plan update
- [ ] No broken references in `core/30-implement.md` to utility commands

---

## Testing Strategy

### Unit Tests:

- Each core command should be tested with a sample issue
- Verify status gates prevent incorrect status progression
- Verify progress file is created and updated correctly

### Integration Tests:

- End-to-end workflow: create → research → plan → implement → done
- Verify status transitions at each phase boundary
- Verify manual verification pauses work correctly

### Manual Testing Steps:

1. Test `00-create.md`:

   - Create a new issue
   - Verify local ticket file is created
   - Verify GitHub issue is created
   - Verify status is "Research Needed"

2. Test `10-research.md`:

   - Try to run with incorrect status (should fail)
   - Update status to "Research Needed"
   - Run research command
   - Verify research document is created
   - Verify status is "Research in Review"

3. Test `20-plan.md`:

   - Try to run with incorrect status (should fail)
   - Update status to "Ready for Plan"
   - Run plan command
   - Verify plan is created and attached to issue

4. Test `30-implement.md`:

   - Try to run with incorrect status (should fail)
   - Update status to "Ready for Dev"
   - Run implement command
   - Verify progress file is created
   - Verify phase pauses for manual verification
   - Verify commit and PR are created

5. Test `next.md` dispatcher:

   - Run `/core/next 142` with an issue in "Research Needed" — verify it runs `10-research.md`
   - Run `/core/next 142` with an issue in "Research in Review" — verify it prints a human-action message
   - Run `/core/next 142` with an issue in "Ready for Dev" — verify it runs `30-implement.md`
   - Run `/core/next 142` with an issue in "In Dev" + progress file present — verify it resumes from last phase

6. Test done transition (manual):
   - Merge the PR in GitHub
   - Manually move issue to "Done" in GitHub Project board
   - Verify `/core/next 142` reports "issue is complete"

## Performance Considerations

- Status checks use REST API via `get_issue_status.sh` - already optimized
- Progress tracking uses markdown files - minimal overhead
- No additional API calls beyond existing helper scripts
- Phase-by-phase implementation reduces risk of large rollbacks

## Migration Notes

### For Existing Issues

Issues already in progress will continue to work with the existing `ralph_*` commands. The new `core/` commands provide an alternative workflow but do not break existing functionality.

### For Command References

If you have scripts or documentation that reference the old commands:

- Update to use `core/XX-command.md` syntax
- Update any status check logic to use helper scripts
- Remove references to `_nt` variants

### Backward Compatibility

The `ralph_*` commands are preserved for compatibility. The new `core/` commands are a replacement, not a breaking change.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-DEVFLOW-linear-cycles.md`
- Research: `thoughts/shared/research/singlepagestartup/2026-03-02-DEVFLOW-linear-cycles-research.md`
- Current commands: `.claude/commands/`
- Status helpers: `.claude/helpers/get_issue_status.sh`, `.claude/helpers/update_issue_status.sh`
- Ralph Loop commands: `.claude/commands/ralph_*.md`
