# Issue #DEVFLOW: Unify Development Workflow with Linear Single-Track Cycles

## Metadata

**URL**: (local issue, not in GitHub yet)
**Status**: Triage
**Created**: 2026-03-02
**Priority**: high
**Size**: medium

---

## Problem to Solve

The current command system in `.claude/commands/` has many branches and ambiguities that make it difficult to understand the development workflow:

### Logic Branches

1. **Multiple versions of similar commands**:

   - `create_plan`, `create_plan_nt`, `create_plan_generic` — all for planning
   - `iterate_plan`, `iterate_plan_nt` — all for plan iteration
   - `describe_pr`, `describe_pr_nt`, `ci_describe_pr` — all for PR description
   - `research_codebase`, `research_codebase_nt`, `research_codebase_generic` — all for research
   - `commit`, `ci_commit` — two versions for creating commits

2. **Commands are not integrated into a linear process**:

   - `commit`, `describe_pr` are called manually, not part of the `ralph_impl` flow
   - No explicit phase separation with completion checks
   - Impossible to determine which command comes next in the flow

3. **Duplicated logic across commands**:
   - Each command duplicates similar logic (status check, file creation)
   - No single source of truth for statuses

### Absence of a Linear Single-Track Cycle

The current Ralph Loop implements the full cycle end-to-end but does not enforce focus on a single phase:

**Current situation:**

```
Research → Plan → Dev → Code Review → Done
           ↓         ↓      ↓           ↓
         (full)    (full)  (full)      (full)
```

**Problem:**

- No explicit checkpoints between phases
- Implementation can start immediately even if the plan is not approved
- No enforced validation after each phase
- Cannot start phase N+1 while phase N is not yet complete

### Functional Requirements

**Required stages in the linear process:**

1. **Task creation** — local record + GitHub issue
2. **Research** — researches codebase, documents findings
3. **Planning** — creates a plan with phases
4. **Implementation** — implements the plan phase by phase, recording progress in a separate `progress.md` file
5. **Acceptance** — requests developer code review and moves to Done

---

## Key Details

### Current Commands Analysis

| Type      | Commands                                                                 | Problem                                        |
| --------- | ------------------------------------------------------------------------ | ---------------------------------------------- |
| Planning  | `create_plan`, `create_plan_nt`, `create_plan_generic`                   | 3 versions, unclear which to use               |
| Iteration | `iterate_plan`, `iterate_plan_nt`                                        | 2 versions, `_nt` without `thoughts/`          |
| Research  | `research_codebase`, `research_codebase_nt`, `research_codebase_generic` | 3 versions, `_nt` without recommendations      |
| PR        | `describe_pr`, `describe_pr_nt`, `ci_describe_pr`                        | 3 versions, `_nt` without template, CI version |
| Commits   | `commit`, `ci_commit`                                                    | Duplicated logic, not integrated into flow     |

### Current Ralph Loop Structure

```
ralph_research → ralph_plan → ralph_impl → (commit) → (describe_pr) → done
                   ↓                ↑
                (status check)    (outside process)
```

**Problem 1**: `commit` and `describe_pr` are called manually, not managed by `ralph_impl`

**Problem 2**: No intermediate validations — "do everything" immediately

### Desired Linear Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Single Line Pipeline                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                             │
│   create ──→ research ──→ plan ──→ implement ──→ done │
│      ↑              ↑          ↑          ↑          ↑         │
│      └─────────────────┴──────────────┴───────────────┴─────────┘          │
│                                                             │
│   Rule: only ONE active phase at any time                   │
└─────────────────────────────────────────────────────────────────────┘

Each phase:
├── Entry condition (status gate)
├── Main command
├── Automated steps
├── Exit condition (completion check)
└── Transition to the next phase
```

---

## Implementation Notes

### Proposed Command Structure

```
.claude/
├── commands/
│   ├── core/                    # Unified linear cycle
│   │   ├── 00-create.md       # Task creation
│   │   ├── 10-research.md     # Research
│   │   ├── 20-plan.md        # Planning
│   │   └── 30-implement.md   # Implementation
│   │
│   ├── utilities/                # Supporting commands
│   │   ├── commit.md        # Commit creation (integrated)
│   │   └── describe_pr.md   # PR description (integrated)
│   │
│   ├── github/                  # GitHub integration
│   │   ├── issues.md       # Issue creation
│   │   └── status.md       # Status checking
│   │
│   └── ralph/                   # Legacy Ralph Loop (for compatibility)
│       ├── ralph_plan.md
│       ├── ralph_research.md
│       └── ralph_impl.md
```

### Content Aggregation Requirement

> **Critical**: When implementing the new `core/` commands, the agent MUST NOT write content from scratch. Each new unified command must be built by reading and aggregating the existing fragmented files listed below. The goal is to consolidate existing knowledge, not to reinvent it.

| New File                   | Must aggregate content FROM                                                                                |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `core/10-research.md`      | `research_codebase.md`, `research_codebase_generic.md`, `ralph_research.md`                                |
| `core/20-plan.md`          | `create_plan.md`, `create_plan_generic.md`, `iterate_plan.md`, `iterate_plan_external.md`, `ralph_plan.md` |
| `core/30-implement.md`     | `implement_plan.md`, `ralph_impl.md`                                                                       |
| `utilities/commit.md`      | `commit.md` (move, not rewrite)                                                                            |
| `utilities/describe_pr.md` | `describe_pr.md` (move, not rewrite)                                                                       |

**Process for each new file:**

1. Read ALL source files listed in the table above
2. Identify unique logic, patterns, and edge cases from each
3. Merge into the unified command, preserving all meaningful behavior
4. Add the new structure (status gates, progress tracking) on top of the aggregated content

This ensures no hard-won logic or edge cases from the existing files are lost during the consolidation.

---

### How It Works

**1. Status Gates**

- The status of each ticket is checked before execution
- Uses `.claude/helpers/get_issue_status.sh` and `github_status`
- Automation (development) is triggered based on the current status

**2. Phase Focus**

- Each phase has its own TodoWrite list
- Cannot start phase N until phase N-1 is complete
- Phase complete = all todos in `completed` status

### Example Implementation Phase Flow

```markdown
# Phase 30 - Implementation

## Entry Condition

Issue status: "Ready for Dev" or "In Dev"

## Steps

1. Read the plan: `thoughts/shared/plans/...`
2. Implement phase 1 and record the result in `thoughts/shared/handoffs/XX-progress.md`
3. Run phase 1 validation: automated + manual, record result in `thoughts/shared/handoffs/XX-progress.md`
4. Implement phase 2 and record the result in `thoughts/shared/handoffs/XX-progress.md`
5. Run phase 2 validation: automated + manual, record result in `thoughts/shared/handoffs/XX-progress.md`
6. ... repeat for each phase
7. Update documentation (if it needs changes or contains discrepancies found during phase execution), create commit: `.claude/commands/utilities/commit.md`

## Exit Condition

- [ ] All automated checks passed
- [ ] Phase result matches what was described in the implementation plan
- [ ] Phase marked "Ready for review" in Github Projects
```
