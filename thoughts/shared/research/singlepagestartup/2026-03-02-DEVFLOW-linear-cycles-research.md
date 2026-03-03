---
date: 2026-03-02T20:35:58Z
researcher: rogwild
git_commit: 5ac64cb879342735a827bfac067bd244ee42a93d
branch: main
repository: singlepagestartup/sps-lite
topic: "Research current development workflow for single-track cycles unification"
tags: [research, codebase, workflow, commands, ralph-loop, github-project]
status: complete
last_updated: 2026-03-02
last_updated_by: rogwild
---

# Research: Current Development Workflow for Single-Track Cycles Unification

**Date**: 2026-03-02T20:35:58Z
**Researcher**: rogwild
**Git Commit**: 5ac64cb879342735a827bfac067bd244ee42a93d
**Branch**: main
**Repository**: singlepagestartup/sps-lite

## Research Question

Analyze the current development workflow to understand how commands are structured, how the Ralph Loop operates, how status checking works, how the thoughts directory is organized, and how GitHub Project is configured - in preparation for unifying the workflow with single-track cycles.

## Summary

The current development workflow consists of 31 command files in `.claude/commands/` organized into multiple functional groups with overlapping responsibilities. The Ralph Loop provides a linear progression through research, planning, and implementation phases, but lacks explicit phase gates and focus. GitHub Project integration uses helper scripts to manage 12 workflow statuses. The `thoughts/` directory stores persistent artifacts in four subdirectories (tickets, plans, research, handoffs) with consistent naming conventions.

## Detailed Findings

### 1. Current Commands Structure

The `.claude/commands/` directory contains 31 command files organized as follows:

#### Command Groups by Type

**Plan Creation Commands (3 variants):**

- `create_plan.md` - Interactive planning with thoughts/ sync, includes code snippets
- `create_plan_nt.md` - Brief high-level plans without code snippets, no code snippets
- `create_plan_generic.md` - Generic version with dynamic repo name detection

**Plan Iteration Commands (3 variants):**

- `iterate_plan.md` - Interactive, takes plan file path
- `iterate_plan_nt.md` - Uses issue ID instead of file path, no thoughts sync
- `iterate_plan_external.md` - Fully autonomous, creates commit and posts comment

**PR Description Commands (3 variants):**

- `describe_pr.md` - Reads template from `thoughts/shared/pr_description.md`
- `describe_pr_nt.md` - Hardcoded template, saves to `/tmp/`
- `ci_describe_pr.md` - Identical to `describe_pr.md`

**Commit Commands (2 variants):**

- `commit.md` - Interactive, asks user to proceed
- `ci_commit.md` - Non-interactive, no user feedback, no Claude attribution

**Research Codebase Commands (3 variants):**

- `research_codebase.md` - Full research with historical context from thoughts/
- `research_codebase_nt.md` - No thoughts-locator/analyzer agents, uses repo name
- `research_codebase_generic.md` - Uses `hack/spec_metadata.sh`, saves with ENG prefix

**Ralph Loop Commands (3 core):**

- `ralph_research.md` - Researches "Research Needed" issues
- `ralph_plan.md` - Creates plans for "Ready for Plan" issues
- `ralph_impl.md` - Implements "Ready for Dev" issues

**Special Purpose Commands (13):**

- `linear.md` - Linear ticket management
- `oneshot.md` - Combines ralph_plan + ralph_impl
- `oneshot_plan.md` - Combines ralph_research + ralph_plan
- `create_worktree.md` - Sets up git worktree for implementation
- `debug.md` - Investigates logs, database state, git history
- `founder_mode.md` - Post-hoc workflow for experimental features
- `implement_plan.md` - Implements plans with phase verification
- `local_review.md` - Sets up worktree for reviewing colleague's branch
- `validate_plan.md` - Validates implementation against plan
- `setup_github_project.md` - Creates GitHub Project with workflow
- `github_status.md` - Checks issue status (single source of truth)
- `create_handoff.md` - Creates handoff document
- `resume_handoff.md` - Resumes work from handoff
- `github.md` - GitHub Project issue management

#### The `_nt` Suffix Convention

Commands ending in `_nt` (No Thoughts) have these characteristics:

- Do not read from or write to `thoughts/` directory
- Do not run `humanlayer thoughts sync`
- Use temporary directories (`/tmp/{repo_name}/...`) instead
- Example: `describe_pr_nt.md` saves to `/tmp/{repo_name}/prs/`

#### Command Interconnections

Commands reference each other through:

- **SlashCommand() calls**: `oneshot.md` calls `/ralph_plan` and `/ralph_impl`
- **Direct file references**: `ralph_plan.md` references `create_plan_generic.md`
- **Helper scripts**: Multiple commands use `get_issue_status.sh` and `update_issue_status.sh`

#### Command Header Format

All commands use YAML frontmatter:

```yaml
---
description: [brief description]
model: [optional: opus, sonnet, haiku]
---
```

### 2. Status Checking and GitHub Project Integration

#### Configuration Files

**`.claude/.env`** - Contains project configuration:

```
GITHUB_PROJECT_NUMBER=2
GITHUB_PROJECT_OWNER=singlepagestartup
GITHUB_PROJECT_OWNER_TYPE=organization
```

#### Helper Scripts

**`.claude/helpers/load_config.sh`** - Loads configuration:

- Sources `.claude/.env`
- Auto-detects `GITHUB_LOGIN` via `gh repo view`
- Sets `GITHUB_OWNER` and `GITHUB_PROJECT_OWNER_TYPE`
- Exports variables for other scripts

**`.claude/helpers/get_issue_status.sh`** - Retrieves issue status:

- Takes ISSUE_NUMBER as argument
- Uses REST API `gh project item-list` with jq filtering
- Outputs status name to stdout

**`.claude/helpers/get_project_item_id.sh`** - Gets project item ID:

- Takes ISSUE_NUMBER as argument
- Uses `gh project item-list` to fetch all items
- Filters by issue number and extracts project item ID

**`.claude/helpers/update_issue_status.sh`** - Updates issue status:

- Takes ISSUE_NUMBER and NEW_STATUS as arguments
- Uses GraphQL to resolve status field and option IDs
- Updates status via `gh project item-edit`

#### Status Update Process

1. Load configuration from `.claude/.env`
2. Get project item ID using `get_project_item_id.sh`
3. Build GraphQL query to fetch project fields
4. Extract `STATUS_FIELD_ID`, `STATUS_OPTION_ID`, `PROJECT_NODE_ID`
5. Update status using `gh project item-edit`

#### The `github_status` Command

Located at `.claude/commands/github_status.md:1`, it is the "single source of truth for checking issue status":

- Loads project config from `.claude/.env`
- Gets issue node ID via `gh issue view`
- Uses different GraphQL query paths for organization vs user
- Executes GraphQL query to fetch status field value

#### GitHub Project Workflow Statuses (12 total)

**Flow**: Triage → Done

| Status               | Description                                                        |
| -------------------- | ------------------------------------------------------------------ |
| Triage               | Newly created — needs initial review and categorization            |
| Spec Needed          | Problem or solution unclear — more detail required before research |
| Research Needed      | Needs investigation before a plan can be written                   |
| Research in Progress | Active research underway                                           |
| Research in Review   | Research findings complete, awaiting review                        |
| Ready for Plan       | Research approved, needs an implementation plan                    |
| Plan in Progress     | Actively writing the implementation plan                           |
| Plan in Review       | Plan written, awaiting approval                                    |
| Ready for Dev        | Plan approved, ready for implementation                            |
| In Dev               | Active development                                                 |
| Code Review          | PR submitted                                                       |
| Done                 | Completed                                                          |

**Key principle**: Review and alignment happen at the plan stage (not PR stage) to move faster and avoid rework.

#### Status Transitions by Command

| Command          | Entry Status    | Exit Status        |
| ---------------- | --------------- | ------------------ |
| `ralph_research` | Research Needed | Research in Review |
| `ralph_plan`     | Ready for Plan  | Plan in Review     |
| `ralph_impl`     | Ready for Dev   | Code Review        |

### 3. Ralph Loop Implementation

The Ralph Loop is a GitHub Project-driven workflow system that automates the progression of issues through research, planning, and implementation phases.

#### `ralph_research` Command

**Entry Status**: "Research Needed"

**Exit Status**: "Research in Review"

**Workflow**:

1. Issue selection - Fetch from GitHub Project filtered by "Research Needed" status
2. Ticket documentation - Save to `thoughts/shared/tickets/REPO_NAME/ISSUE-NUM.md`
3. Status transition to "Research in Progress"
4. Research execution - Use `research_codebase_generic.md` guidance
5. Document findings in `thoughts/shared/research/REPO_NAME/YYYY-MM-DD-ISSUE-NUM-description.md`
6. Status transition to "Research in Review"

#### `ralph_plan` Command

**Entry Status**: "Ready for Plan"

**Exit Status**: "Plan in Review"

**Workflow**:

1. Issue selection - Fetch from GitHub Project filtered by "Ready for Plan" status
2. Read existing ticket file
3. Status transition to "Plan in Progress"
4. Create plan using `create_plan_generic.md` guidance
5. Save plan to `thoughts/shared/plans/REPO_NAME/`
6. Status transition to "Plan in Review"

#### `ralph_impl` Command

**Entry Status**: "Ready for Dev"

**Exit Status**: "Code Review"

**Workflow**:

1. Issue selection - Fetch from GitHub Project filtered by "Ready for Dev" status
2. Read existing ticket file
3. Status transition to "In Dev"
4. Find linked implementation plan from issue comments
5. Read plan document from `thoughts/shared/plans/`
6. Implement using `implement_plan.md`
7. Create commit using `commit.md`
8. Create PR using `describe_pr.md`
9. Add comment to issue with PR link
10. Status transition to "Code Review"

#### Ralph Loop Flow

```
ralph_research → ralph_plan → ralph_impl → (done)
                   ↓                ↑
                (status check)   (outside process)
```

**Characteristics**:

- Commands validate status before proceeding
- Status updates occur at start and completion of each phase
- Each phase produces a document in `thoughts/`
- `commit` and `describe_pr` are called manually from `ralph_impl`, not integrated into a separate workflow
- No intermediate validation gates between phases - implementation happens all at once

### 4. thoughts/ Directory Structure

The `thoughts/` directory stores persistent artifacts with this organization:

```
thoughts/
└── shared/
    ├── tickets/singlepagestartup/    - Issue/ticket context
    ├── plans/singlepagestartup/      - Implementation plans
    ├── research/singlepagestartup/   - Research findings
    └── handoffs/singlepagestartup/   - Session handoffs
```

#### File Naming Conventions

**Tickets**: `ISSUE-{NUMBER}.md` or `ISSUE-{IDENTIFIER}.md`

- Example: `ISSUE-142.md`, `ISSUE-DEVFLOW-linear-cycles.md`

**Plans**: `{YYYY-MM-DD}-{topic-description}.md`

- Example: `2026-02-28-ISSUE-142-admin-panel-v2-migration.md`

**Research**: `{YYYY-MM-DD}-{topic-description}.md`

- Example: `2026-02-28-ISSUE-142-admin-panel-v2-migration.md`

**Handoffs**: `{topic-description}-handoff-{YYYY-MM-DD}.md`

- Example: `drafts-runtime-and-manifest-init-handoff-2026-03-02.md`

#### Content Structure by Type

**Tickets Structure**:

- Title with issue number
- Metadata (URL, Status, Created date)
- Problem to solve
- Key details (bullet lists)
- Implementation notes
- References
- Comments section

**Plans Structure**:

- Title with descriptive name
- Overview section with goal
- Current state analysis
- Desired end state
- Implementation approach (phased)
- Testing strategy
- Performance considerations
- Migration notes
- References

**Research Structure**:

- Title with "Research:" prefix
- YAML frontmatter with metadata
- Summary section
- Context and current situation
- Analysis sections (numbered)
- Findings and gaps
- Technical decisions
- Open questions
- Recommended next steps

**Handoffs Structure**:

- Title with "Handoff" suffix
- Date, Workspace, Scope header
- Why work was done
- What user asked for
- Final result
- Architecture and behavior details
- Documentation updates
- Example usage
- User-driven decision log
- Current known limitations
- Files involved

### 5. GitHub Project Configuration

#### Project Labels

**Size Labels** (4 labels):

- `size:xs` - Green (#0E8A16) - "Trivial change, under an hour"
- `size:small` - Purple (#5319E7) - "A few hours"
- `size:medium` - Yellow (#FBCA04) - "1–2 days"
- `size:large` - Red (#D93F0B) - "Multiple days or more"

**Area Labels** - Dynamically generated from `apps/` directory:

- Format: `area:<app_name>` - Blue (#1D76DB)
- Description: "Changes in apps/<app_name>"

#### Issue Type Field

4 issue types (single select field):

- **Feature** (BLUE) - "New functionality or enhancement"
- **Bug** (RED) - "Something is broken"
- **Refactoring** (GRAY) - "Code improvement without behavior change"
- **Research** (YELLOW) - "Investigation or discovery task"

**Note**: "Type" is a reserved name in GitHub Projects, so "Issue Type" is used instead.

#### Workflow Structure

**Flow progression**:

1. Triage (initial review)
2. Spec Needed (clarification phase)
3. Research → Research in Progress → Research in Review (investigation phase)
4. Ready for Plan → Plan in Progress → Plan in Review (planning phase)
5. Ready for Dev → In Dev → Code Review → Done (implementation phase)

## Code References

### Commands Directory

- `.claude/commands/create_plan.md:1` - Interactive planning with code snippets
- `.claude/commands/create_plan_nt.md:1` - Brief high-level plans without code snippets
- `.claude/commands/create_plan_generic.md:1` - Generic version with dynamic repo name
- `.claude/commands/iterate_plan.md:1` - Interactive plan iteration with file path
- `.claude/commands/iterate_plan_nt.md:1` - Plan iteration using issue ID
- `.claude/commands/iterate_plan_external.md:1` - Fully autonomous plan iteration
- `.claude/commands/describe_pr.md:1` - PR description with template from thoughts/
- `.claude/commands/describe_pr_nt.md:1` - PR description with hardcoded template
- `.claude/commands/ci_describe_pr.md:1` - PR description for CI context
- `.claude/commands/commit.md:1` - Interactive git commit
- `.claude/commands/ci_commit.md:1` - Non-interactive git commit for CI
- `.claude/commands/research_codebase.md:1` - Research with historical context
- `.claude/commands/research_codebase_nt.md:1` - Research without thoughts/ agents
- `.claude/commands/research_codebase_generic.md:1` - Generic research with script metadata

### Ralph Loop Commands

- `.claude/commands/ralph_research.md:1` - Research phase command
- `.claude/commands/ralph_plan.md:1` - Planning phase command
- `.claude/commands/ralph_impl.md:1` - Implementation phase command

### Helper Scripts

- `.claude/helpers/load_config.sh:1` - Loads project configuration
- `.claude/helpers/get_issue_status.sh:1` - Retrieves issue status
- `.claude/helpers/get_project_item_id.sh:1` - Gets project item ID
- `.claude/helpers/update_issue_status.sh:1` - Updates issue status

### GitHub Integration

- `.claude/commands/github.md:1` - GitHub Project issue management
- `.claude/commands/github_status.md:1` - Status checking (single source of truth)
- `.claude/commands/setup_github_project.md:1` - Creates GitHub Project with workflow
- `.claude/.env:1` - Project configuration file

### Thoughts Directory

- `thoughts/shared/tickets/singlepagestartup/` - Ticket storage
- `thoughts/shared/plans/singlepagestartup/` - Plan storage
- `thoughts/shared/research/singlepagestartup/` - Research storage
- `thoughts/shared/handoffs/singlepagestartup/` - Handoff storage

## Architecture Documentation

### Current Command Patterns

1. **YAML Frontmatter**: All commands begin with header containing description and optional model
2. **Parallel Sub-tasks**: Research and plan commands spawn parallel Task agents
3. **Status Gates**: GitHub-related commands check project status before proceeding
4. **Sync Operations**: Non-`_nt` commands typically run `humanlayer thoughts sync`
5. **Repo Name Detection**: Many commands use `gh repo view --json name -q '.name'`
6. **TodoWrite Tracking**: Planning and research commands use TodoWrite to track progress
7. **Edit vs Write**: Updates use Edit tool for surgical changes, initial writes use Write tool

### Status Management Flow

1. **Status Check**: Command calls `get_issue_status.sh` to validate current status
2. **Status Update**: Command calls `update_issue_status.sh` at phase boundaries
3. **GraphQL Resolution**: Status updates resolve field and option IDs by name
4. **REST API for Queries**: Simple queries use `gh project item-list` REST API

### Document Generation Flow

1. **Research**: `thoughts/shared/research/REPO_NAME/YYYY-MM-DD-ISSUE-NUM-description.md`
2. **Plans**: `thoughts/shared/plans/REPO_NAME/YYYY-MM-DD-ISSUE-NUM-description.md`
3. **Tickets**: `thoughts/shared/tickets/REPO_NAME/ISSUE-NUM.md`
4. **Handoffs**: `thoughts/shared/handoffs/REPO_NAME/ISSUE-NUM/YYYY-MM-DD_HH-MM-SS_description.md`

### Ralph Loop Connection Pattern

1. **`ralph_research`** produces research document → issues ready for planning
2. **`ralph_plan`** reads research document → produces implementation plan → issues ready for development
3. **`ralph_impl`** reads implementation plan → produces commit + PR → issues in code review

Each command references the output of the previous phase via issue comments.

## Related Research

- `thoughts/shared/tickets/singlepagestartup/ISSUE-DEVFLOW-linear-cycles.md` - The original issue describing the workflow unification problem

## Open Questions

No open questions - this is a pure documentation research of the current state.
