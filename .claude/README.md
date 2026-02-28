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
│   ├── iterate_plan.md    # Update plan with local edits
│   ├── iterate_plan_external.md  # Sync GitHub comments to plan
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

## Development Process

This is the day-to-day guide for working with AI agents. Read this fully before starting your first task.

### The Core Idea

Every piece of work starts as a GitHub Issue. The issue moves through statuses as AI agents research, plan, and implement it. **You, the developer, act as a reviewer at two gates** — after research, and after the plan — before any code is written. This prevents wasted implementation effort from misunderstood requirements.

```
You create issue → Agent researches → You review → Agent plans → You review → Agent implements → You review PR
```

The `thoughts/` directory in the project root is where agents write their outputs. It persists across sessions and is committed to git alongside code:

```
thoughts/
├── shared/
│   ├── tickets/
│   │   └── REPO_NAME/       ← namespaced by repo (e.g. singlepagestartup/)
│   │       └── ISSUE-42.md
│   ├── research/
│   │   └── REPO_NAME/       ← namespaced by repo
│   │       └── YYYY-MM-DD-ISSUE-42-description.md
│   ├── plans/
│   │   └── REPO_NAME/       ← namespaced by repo
│   │       └── YYYY-MM-DD-ISSUE-42-description.md
│   └── handoffs/
│       └── REPO_NAME/       ← namespaced by repo
│           └── ISSUE-42/
│               └── YYYY-MM-DD_HH-MM-SS_description.md
```

`REPO_NAME` is the short repository name derived automatically at runtime via `gh repo view --json name -q '.name'` (e.g. `singlepagestartup`). This namespacing keeps ticket snapshots organised if the `thoughts/` directory is ever shared across multiple repositories.

---

### Getting Started on Your Machine

**Prerequisites:** Node.js 20+, Bun, Docker, [Claude Code](https://claude.ai/code) installed.

#### Step 1 — Clone and install dependencies

```bash
git clone <repo-url>
cd sps-lite
npm install
```

#### Step 2 — Start infrastructure (Postgres + Redis)

```bash
./up.sh
```

This creates `.env` files, starts Docker containers, and runs database migrations. Wait for it to complete before continuing.

#### Step 3 — Configure AI agent access

```bash
./ai.sh
```

This script:

- Installs `gh` CLI and `jq` if missing
- Authenticates your GitHub account with the required scopes (`repo`, `read:project`, `project`)
- Creates `.claude/.env` from the example and prompts you to fill in the project number
- Validates that you can access the GitHub Project

When it prints ✅, everything is ready.

#### Step 4 — Open the project in Claude Code

```bash
claude
```

Claude Code reads `.claude/commands/` and makes all slash commands available. You are now ready to work.

---

### Plan Iteration Workflow

When working with implementation plans, there are **two interaction modes**:

| Mode                   | Command                           | Source of Changes                                                      | When to Use |
| ---------------------- | --------------------------------- | ---------------------------------------------------------------------- | ----------- |
| **Local iteration**    | `/iterate_plan ISSUE_ID`          | Direct edits to plan file (you specify changes in CLI)                 |
| **External iteration** | `/iterate_plan_external ISSUE_ID` | Sync from GitHub issue comments to plan (discussions happen in GitHub) |

### How External Iteration Works

```
1. GitHub Issue (external system)
   ↓ Discuss, make decisions
2. /iterate_plan_external 142
   ↓ Syncs comments to plan file
3. Review synced comments
4. /iterate_plan 142
   ↓ Apply changes to plan based on comments
```

**Key points:**

- All discussion happens in **GitHub issue** — this is the "cloud" system
- `/iterate_plan_external` is a **one-way sync** from GitHub to plan
- No console questions — decisions are made in GitHub comments
- Re-running `/iterate_plan_external` picks up new comments since last sync
- `/iterate_plan` is for local plan editing (you specify what to change)

### Command Summary

| Command                  | Purpose                                | Input Format                        |
| ------------------------ | -------------------------------------- | ----------------------------------- |
| `/iterate_plan`          | Update plan with local edits           | `142` or `142 - add error handling` |
| `/iterate_plan_external` | Sync GitHub comments to plan           | `142`                               |
| `/ralph_research`        | Research "Research Needed" issue       | `142` (or auto-picks)               |
| `/ralph_plan`            | Create plan for "Ready for Plan" issue | `142` (or auto-picks)               |
| `/ralph_impl`            | Implement "Ready for Dev" issue        | `142` (or auto-picks)               |

**Status checks:** All `ralph_*` commands verify the issue is in the correct status before proceeding.

---

### How to Work on a Task

This section describes the **linear development workflow** using AI agents. Each step must be completed in order — steps cannot be skipped or jumped. Within each step, there may be cycles of iteration/rework, but these loops are contained within the bounds of that step.

**Workflow overview:**

```
Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6 → Step 7
  ↓         ↓         ↓         ↓         ↓         ↓         ↓
Create    Research   Review     Plan      Review     Implement   Review PR
issue    (agent)   research   (agent)   plan       (agent)     (manual)
                                            (loop)               (loop)
```

**Key principle:** At each step, the AI agent produces an output, and you (the developer) make a decision based on that output. This creates **two review gates** where you approve before code is written — after research (Step 3) and after the plan (Step 5).

---

### Step 1 — Create an Issue

**Purpose:** Define the problem to solve and initialize the workflow.

**Action:** Run `/github` in Claude Code and ask it to create an issue. The command will prompt you for:

- A clear description of the **problem to solve** (from the user's perspective)
- The size label: `size:xs`, `size:small`, `size:medium`, or `size:large`
- The area label: `area:api`, `area:host`, etc.

**What happens:**

- The issue is created in GitHub
- It is automatically added to the GitHub Project with status `Triage`

**Your decision:** Move the issue to `Research Needed` when ready (manually in the GitHub Project UI or via `/github`).

**Note:** Only `size:xs` and `size:small` issues are processed by automated commands (`/ralph_research`, `/ralph_plan`, `/ralph_impl`). For `size:medium` and `size:large`, use manual planning commands.

---

### Step 2 — Run Research

**Purpose:** Investigate the codebase to understand the problem and identify implementation approaches.

**Command:** `/ralph_research 42` (replace `42` with the issue number, or omit to auto-pick)

**What the agent does:**

1. Validates the issue is in `Research Needed` status
2. Fetches the issue from GitHub, saves it as readable Markdown to `thoughts/shared/tickets/REPO_NAME/ISSUE-42.md`
3. Sets the issue status to `Research in Progress`
4. Spawns parallel sub-agents to investigate:
   - **codebase-locator** — finds relevant files and entry points
   - **codebase-analyzer** — reads files in depth to explain implementation details
   - **codebase-pattern-finder** — finds similar implementations to follow
   - **thoughts-locator** — searches for existing notes on the topic
   - **thoughts-analyzer** — extracts research context from thoughts documents
   - **web-search-researcher** — searches for external docs, APIs, or best practices (if needed)
5. Writes findings to `thoughts/shared/research/YYYY-MM-DD-ISSUE-42-description.md`
6. Posts a summary comment on the GitHub issue
7. Sets the issue status to `Research in Review`

**Your decision:** Proceed to Step 3 to review the research findings.

---

### Step 3 — Review the Research (First Gate)

**Purpose:** Validate that the agent understood the problem correctly and identified relevant approaches.

**Action:** Open the research file:

```
thoughts/shared/research/YYYY-MM-DD-ISSUE-42-description.md
```

**Verify:**

- [ ] Is the problem understood correctly? The agent should have identified which parts of the codebase are relevant
- [ ] Are the findings grounded in actual code? Look for file:line references — these mean the agent actually read the code, not guessed
- [ ] Are the proposed approaches reasonable? The document typically outlines 2–3 possible directions with tradeoffs
- [ ] Is anything missing? If the agent missed a relevant module or misunderstood a constraint, note it

**Your decision:**

| Outcome                   | Action                                                                                            | Next Step      |
| ------------------------- | ------------------------------------------------------------------------------------------------- | -------------- |
| Research looks good       | Move issue to `Ready for Plan` (via GitHub Project UI or `/github`)                               | Step 4         |
| Research needs correction | Add a comment to the GitHub issue explaining what was missed, then run `/ralph_research 42` again | Back to Step 2 |

**Loop within Step 3:** If the research needs correction, the command `/ralph_research` reads the previous research and your new comment before starting again. This loop repeats until the research is approved. You cannot skip to Step 4 without passing this gate.

---

### Step 4 — Run Planning

**Purpose:** Create a detailed implementation plan based on approved research.

**Prerequisite:** Issue must be in `Ready for Plan` status.

**Command:** `/ralph_plan 42`

**What the agent does:**

1. Validates the issue is in `Ready for Plan` status
2. Reads the issue, all comments, and the linked research document
3. Sets the issue status to `Plan in Progress`
4. Researches the codebase again, focusing on implementation details:
   - **codebase-locator** — finds files to be modified
   - **codebase-analyzer** — understands current implementation patterns
   - **codebase-pattern-finder** — finds similar implementations to follow
   - **thoughts-locator** — searches for related decisions or patterns
   - **thoughts-analyzer** — extracts relevant context from existing plans
5. Writes a detailed implementation plan to `thoughts/shared/plans/YYYY-MM-DD-ISSUE-42-description.md`
6. Posts a summary comment on the GitHub issue linking to the plan
7. Sets the issue status to `Plan in Review`

**Your decision:** Proceed to Step 5 to review the plan.

---

### Step 5 — Review the Plan (Second Gate)

**Purpose:** Validate that the implementation plan is complete, feasible, and follows project patterns.

**Action:** Open the plan file:

```
thoughts/shared/plans/YYYY-MM-DD-ISSUE-42-description.md
```

**Verify the plan contains:**

- [ ] **Phases** — a numbered list of implementation steps
- [ ] **File changes** — specific files to create or modify, with the expected changes described
- [ ] **Success criteria** — how to verify each phase worked correctly
- [ ] **No ambiguity** — every step should be clear enough that the agent can execute it without asking questions

**Check for issues:**

- [ ] Do the phases cover everything the issue requires?
- [ ] Are the file paths and module names real (not hallucinated)?
- [ ] Does the approach match existing patterns in the codebase?
- [ ] Are there any steps that would break something else?

**Your decision:**

| Outcome            | Action                                                             | Next Step     |
| ------------------ | ------------------------------------------------------------------ | ------------- |
| Plan looks good    | Move issue to `Ready for Dev` (via GitHub Project UI or `/github`) | Step 6        |
| Plan needs changes | Choose local or external iteration (see below)                     | Repeat Step 5 |

**Loop within Step 5:** If the plan needs changes, you have two iteration options:

**Option A: Local iteration (direct conversation)**

```
/iterate_plan thoughts/shared/plans/YYYY-MM-DD-ISSUE-42-description.md
```

Tell the agent what needs to change: "Phase 2 should use the existing `X` utility instead of creating a new one" or "The plan doesn't cover error handling for Y case." The agent will update the plan file. Review again and repeat until satisfied.

**Option B: External iteration (GitHub issue discussion)**

1. Add comments to the GitHub issue describing what needs to change
2. Run `/iterate_plan_external 42` to sync those comments to the plan
3. The command is fully autonomous — it reads comments, updates the plan, creates a commit, and posts a reply
4. Review the updated plan and repeat if needed

Use external iteration when:

- Multiple people need to collaborate on plan changes
- You want a full audit trail in GitHub issue comments
- You prefer the "cloud" system for discussions and local CLI for final execution

**Important:** You cannot proceed to Step 6 without passing this gate. The loop repeats until the plan is approved.

---

### Step 6 — Run Implementation

**Purpose:** Execute the approved implementation plan.

**Prerequisite:** Issue must be in `Ready for Dev` status.

**Command:** `/ralph_impl 42`

**What the agent does:**

1. Validates the issue is in `Ready for Dev` status
2. Reads the issue and finds the linked plan file from the issue comments
3. Sets the issue status to `In Dev`
4. Executes each phase of the plan, checking success criteria after each one
5. Creates a commit for the changes
6. Opens a PR and posts the PR link as a comment on the issue
7. Sets the issue status to `Code Review`

**Your decision:** Proceed to Step 7 to review the PR.

---

### Step 7 — Review the PR

**Purpose:** Verify that the implementation matches the plan and follows project patterns.

**Action:** Open the PR link that the agent posted. Review the code diff normally:

- Does the implementation match what was described in the plan?
- Are there edge cases the agent missed?
- Does the code follow the project's patterns (TypeScript, Tailwind, SDK-based data fetching)?

**To verify the implementation thoroughly:**

```
/validate_plan thoughts/shared/plans/YYYY-MM-DD-ISSUE-42-description.md
```

This command reads both the plan and the actual changed files, then reports which success criteria passed and which didn't.

**Your decision:**

| Outcome                | Action                                                                                 | Final Step     |
| ---------------------- | -------------------------------------------------------------------------------------- | -------------- |
| Everything looks good  | Merge the PR and move the issue to `Done` (via `/github`)                              | Complete       |
| Something needs fixing | Comment on the PR or issue with specific instructions, then run `/ralph_impl 42` again | Back to Step 6 |

**Loop within Step 6/7:** If the implementation needs fixes, `/ralph_impl` reads all prior comments before re-implementing. This loop repeats until the PR is approved and merged.

---

### Shortcut: Research + Plan in One Step

For straightforward issues where you trust the research will be quick:

```
/oneshot 42
```

This runs `/ralph_research` then `/ralph_plan` in sequence. You still review the plan before running `/ralph_impl`.

---

### Larger Issues (medium / large)

For `size:medium` and `size:large` issues, use the interactive planning flow instead. These issues are too complex for fully automated handling.

#### Interactive planning

```
/create_plan thoughts/shared/tickets/REPO_NAME/ISSUE-42.md
```

Claude will ask you questions, research the codebase, and iterate on the plan with you in real time. This is a back-and-forth conversation — you guide it toward the right approach. The result is saved to `thoughts/shared/plans/`.

Once the plan is finalized:

1. Move the issue to `Ready for Dev`
2. Run `/ralph_impl 42` (the agent follows the plan exactly)
3. Or open a new session and use `/implement_plan` to implement it manually

---

### Debugging

If something breaks during development:

```
/debug
```

Describe what you observed. The agent investigates logs, database state, and git history without modifying any files. It reports what it finds and suggests next steps. You then decide whether to fix it manually or create a new issue for the agent to handle.

---

### Multi-Session Work

If you need to stop mid-task and hand off to a later session:

```
/create_handoff
```

This writes a handoff document to `thoughts/shared/handoffs/` with everything the next session needs to know: current status, key files, decisions made, and what to do next.

To resume:

```
/resume_handoff thoughts/shared/handoffs/YYYY-MM-DD_ISSUE-42_description.md
```

The agent reads the handoff and picks up exactly where you left off.

---

### How Agents Work Internally

Commands spawn **sub-agents** from `.claude/agents/` to do parallel research. You never call sub-agents directly.

| Sub-agent                 | What it does                                                   |
| ------------------------- | -------------------------------------------------------------- |
| `codebase-locator`        | Finds files and entry points for a feature across the monorepo |
| `codebase-analyzer`       | Reads files in depth to explain implementation details         |
| `codebase-pattern-finder` | Finds similar implementations and usage examples to follow     |
| `thoughts-locator`        | Searches `thoughts/` for existing notes on the topic           |
| `thoughts-analyzer`       | Deep-reads thoughts documents to extract research context      |
| `web-search-researcher`   | Searches the web for external docs, APIs, or best practices    |

When you run `/ralph_plan`, for example, the command spawns several of these in parallel, then synthesizes their findings into the plan. This is why plans reference real file paths and actual patterns from the codebase rather than guesses.

---

## Command Reference

```
/github                → create/update/comment on issues; update statuses
/ralph_research [#]    → research a "Research Needed" issue (auto-picks highest priority if no # given)
/ralph_plan [#]        → plan a "Ready for Plan" issue
/ralph_impl [#]        → implement a "Ready for Dev" issue
/oneshot [#]           → research + plan in sequence
/oneshot_plan [#]      → plan + implement in sequence
/create_plan [file]    → interactive plan creation (for medium/large issues)
/iterate_plan [file]   → update an existing plan with local edits (you specify changes)
/iterate_plan_external → sync GitHub issue comments to plan (discussions happen in GitHub)
/implement_plan [file] → implement a plan file manually
/validate_plan [file]  → verify implementation against a plan's success criteria
/research_codebase     → deep codebase research — asks what to investigate, then runs parallel agents
/commit                → create a commit with a clear message
/describe_pr           → generate a PR description from the current branch
/debug                 → investigate logs, DB state, and git history without editing files
/create_handoff        → write a handoff document for the next session
/resume_handoff [file] → resume work from a handoff document
/create_worktree       → create an isolated git worktree for implementation
/local_review          → set up a worktree to review a colleague's branch
/setup_github_project  → one-time: create the GitHub Project with statuses and labels
```

---

## Notes

- `.claude/.env` is gitignored — every developer needs their own copy (run `./ai.sh`)
- Plans and research in `thoughts/` should be committed to git — they are the reasoning history for your codebase
- If `gh` CLI is not installed: `brew install gh && gh auth login`
- Status names in the GitHub Project must match exactly (case-sensitive) — if a status update silently fails, check the name spelling
