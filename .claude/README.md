# Claude Code Configuration

This directory contains Claude Code agents, commands (skills), and local configuration for this project.

## Directory Structure

```
.claude/
├── agents/              # Subagents used by commands for parallel research
│   ├── codebase-analyzer.md
│   ├── codebase-locator.md
│   ├── codebase-pattern-finder.md
│   ├── thoughts-analyzer.md
│   ├── thoughts-locator.md
│   └── web-search-researcher.md
├── commands/            # Slash commands (skills) available in Claude Code
│   ├── github.md        # GitHub Project issue management
│   ├── ralph_plan.md    # Create plan for highest priority issue
│   ├── ralph_research.md
│   ├── ralph_impl.md
│   ├── oneshot.md
│   ├── oneshot_plan.md
│   ├── create_plan_generic.md
│   ├── implement_plan.md
│   └── ...
├── .env          # ⚠ Gitignored — per-project config (you must create this)
├── settings.local.json  # Local Claude Code settings
└── README.md            # This file
```

---

## Setup

Run the setup script from the project root — it installs required tools, authenticates `gh`, creates `.claude/.env`, and validates project access:

```bash
./ai.sh
```

The script will prompt for any missing values interactively. Once it exits with ✅, everything is ready.

### Manual setup (if needed)

If you prefer to configure manually:

### Step 1 — Create the file

```bash
cp .claude/.env.example .claude/.env
```

### Step 2 — Fill in the project number

Run `gh project list --me` to find your project number:

```
NUMBER  TITLE             OWNER     URL
3       My Startup Board  flakecode   github.com/users/flakecode/projects/3
```

Then set it in `.claude/.env`:

```env
GITHUB_PROJECT_NUMBER=3
```

That's it for personal projects. `GITHUB_LOGIN`, `GITHUB_REPO`, and all GraphQL IDs are auto-detected at runtime.

### Organization projects

If the GitHub Project belongs to an organization (e.g. `github.com/orgs/my-org/projects/2`), set two additional values:

```env
GITHUB_PROJECT_NUMBER=2
GITHUB_PROJECT_OWNER=my-org
GITHUB_PROJECT_OWNER_TYPE=organization
```

`GITHUB_PROJECT_OWNER` overrides the auto-detected repo owner. `GITHUB_PROJECT_OWNER_TYPE=organization` switches the GraphQL query from `user(...)` to `organization(...)`. Leave both unset for personal projects.

---

## GitHub Project Setup

The commands expect a GitHub Project (v2) with a **single-select "Status" field** containing the following options. Create them in this order — it reflects the workflow progression.

### Required Status Options

| Status name            | When an issue has this status                                                       |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `Triage`               | Newly created — needs initial review and categorization                             |
| `Spec Needed`          | The problem or solution is unclear — more detail required before research can begin |
| `Research Needed`      | Needs investigation before a plan can be written                                    |
| `Research in Progress` | Active research underway (set automatically by `/ralph_research`)                   |
| `Research in Review`   | Research findings complete, awaiting review                                         |
| `Ready for Plan`       | Research approved, needs an implementation plan                                     |
| `Plan in Progress`     | Actively writing the plan (set automatically by `/ralph_plan`)                      |
| `Plan in Review`       | Plan written, awaiting approval                                                     |
| `Ready for Dev`        | Plan approved, ready for implementation                                             |
| `In Dev`               | Active development (set automatically by `/ralph_impl`)                             |
| `Code Review`          | PR submitted                                                                        |
| `Done`                 | Completed                                                                           |

> **Names must match exactly** (case-sensitive). The commands resolve status UUIDs by name at runtime — if the name differs, the status update will silently fail.

### Required Issue Labels

The commands filter issues by size label to pick the right scope of work. Create these labels in your repo:

| Label         | Meaning                       |
| ------------- | ----------------------------- |
| `size:xs`     | Trivial change, under an hour |
| `size:small`  | A few hours                   |
| `size:medium` | 1–2 days                      |
| `size:large`  | Multiple days or more         |

`/ralph_plan` and `/ralph_impl` only pick up `size:xs` and `size:small` issues — larger issues require manual planning.

### How to Create the Project

Run the setup command — it creates the project, configures all statuses, and creates labels automatically:

```
/setup_github_project
```

The command will:

1. Create a new GitHub Project (or use an existing one if `GITHUB_PROJECT_NUMBER` is set)
2. Replace the Status field options with the full 12-step workflow above
3. Create all `size:*` and `area:*` labels in the repo

After it runs, set the project number in `.claude/.env` if it wasn't already saved.

---

## Workflow Overview

Once configured, the full issue workflow works like this:

```
/github          → manage issues (create, comment, update status)
/ralph_research  → research highest priority "Research Needed" issue
/ralph_plan      → write implementation plan for "Ready for Plan" issue
/ralph_impl      → implement "Ready for Dev" issue
/oneshot         → research + plan in sequence
/oneshot_plan    → plan + implement in sequence
```

---

## Notes

- `.env` is listed in `.gitignore` — it will never be committed
- Each developer or project clone needs its own `.env`
- If `gh` CLI is not installed: `brew install gh && gh auth login`
