# SinglePageStartup

Use this file as the universal entry point for any AI agent (any provider) working in this repository. Claude Code additionally reads `CLAUDE.md`; shared rules in both files must stay in sync, and this file is canonical for provider-neutral content.

## Repository Overview

SinglePageStartup (SPS) is an Nx monorepo with:

- API app: `apps/api` (Bun + Hono).
- Host app: `apps/host` (Next.js App Router).
- MCP server: `apps/mcp` (tools/resources for creating data in apps/api by MCP).
- Business modules: `libs/modules/<module>`.

Each module contains:

- `models/<model>` and `relations/<relation>` with backend and frontend layers.
- Module-level docs: `libs/modules/<module>/README.md`.
- Per-model docs: `libs/modules/<module>/models/<model>/README.md`.
- Per-relation docs: `libs/modules/<module>/relations/<relation>/README.md`.

## Documentation order

- Root overview: `README.md`
- Module summary: `libs/modules/<module>/README.md`
- Entity docs: `libs/modules/<module>/models/<model|relation>/README.md`.

## Key rules (short)

- TailwindCSS only, no ad-hoc CSS.
- Always use SDK providers for data access from `libs/modules/<module>/models/<model|relation>/sdk/<client|server>`.
- Use relation components with `variant="find"` and filter via `apiProps.params.filters.and`.
- Backend only hosted in `apps/api/app.ts`.
- Backend route middleware must live in the module's `backend/app/middlewares/src/lib/*` folder and be exported from that middleware package; controllers should only compose route definitions, middleware instances, and handlers.
- Do not edit repository data snapshots under `libs/modules/<module>/<relations|models>/<name>/backend/repository/database/src/lib/data/*` to implement behavior or UI fixes; change runtime code, configuration, migrations, or explicit data-management flows instead.
- When changing a Drizzle table schema or fields, run the appropriate `repository-generate` target instead of hand-writing migration SQL or `migrations/meta/*` journal/snapshot files. For example, use `npx nx run @sps/<module>:models:<model>:repository-generate` or the matching relation target; use `npx nx run api:db:generate` only when intentionally regenerating all repository migrations.

If anything is unclear, read the relevant README files instead of guessing.

## Environment & Requirements

- Node.js 20+, npm 10+ (as per package engines).
- Bun runtime installed (used by `apps/api`).
- Docker & Docker Compose **required** for Postgres and Redis (the `./up.sh` script expects Docker to be available on the agent machine).

## Setup & Execution

- Install dependencies: `npm install`
- Bootstrap infrastructure & migrations (requires Docker): `./up.sh`
  - Creates environment files, starts Postgres (`apps/db`) and Redis (`apps/redis`), then runs `npx nx run api:db:migrate`.
- Start API server: `npm run api:dev`
- Start host (Next.js) server: `npm run host:dev`

## AI Development Workflow (any agent, any provider)

This repository uses one provider-agnostic, status-gated development workflow. Claude Code, Codex, and any other AI agent must follow the same process definitions and produce the same artifacts.

### Single source of truth

| Concern                                                         | Canonical location                                                        |
| --------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Process definitions (phases, gates, artifact templates)         | `.claude/commands/**/*.md`                                                |
| Workflow contracts (repo context, process log, knowledge reuse) | `.claude/references/*.md`                                                 |
| GitHub Project / issue automation                               | `.claude/helpers/*.sh` (plain bash, provider-independent)                 |
| Per-checkout configuration                                      | `.claude/.env` (gitignored; created by `./ai.sh`)                         |
| Provider adapters                                               | Claude Code: `.claude/commands` as slash commands; Codex: `.codex/skills` |

The `.claude/` directory name is historical: the command documents, helper scripts, and reference contracts inside it are provider-neutral and are the canonical definition of the workflow. Adapters for other providers must wrap these files (read them and execute their instructions), never fork or duplicate their content.

### GitHub Project is the control plane

All phase decisions are made through the GitHub Project status field — not chat history and not local state:

- Each issue moves through 12 statuses: Triage → Spec Needed → Research Needed → Research in Progress → Research in Review → Ready for Plan → Plan in Progress → Plan in Review → Ready for Dev → In Dev → Code Review → Done.
- Every phase command has an entry status gate and an exit status transition. Agents must refuse to run a phase when the current status does not match the gate — even when asked directly.
- Human review gates: `Research in Review`, `Plan in Review`, `Code Review`. Only the human operator moves an issue out of these statuses; this is where work is reviewed and the decision to proceed is made.
- Status reads/writes go through `.claude/helpers/get_issue_status.sh` and `.claude/helpers/update_issue_status.sh`.

Phases (canonical files in `.claude/commands/core/`):

| Phase        | Canonical file    | Status transition                       |
| ------------ | ----------------- | --------------------------------------- |
| Dispatch     | `next.md`         | reads status, routes to the right phase |
| Create issue | `00-create.md`    | — → Triage → Research Needed            |
| Research     | `10-research.md`  | Research Needed → Research in Review    |
| Plan         | `20-plan.md`      | Ready for Plan → Plan in Review         |
| Implement    | `30-implement.md` | Ready for Dev → Code Review             |

### Workflow artifacts

All artifacts live under `thoughts/shared/<kind>/<repo-name>/` and are committed to git:

| Kind        | Path                                                  | Purpose                                          |
| ----------- | ----------------------------------------------------- | ------------------------------------------------ |
| Ticket      | `thoughts/shared/tickets/<repo>/ISSUE-N.md`           | Local snapshot of the GitHub issue               |
| Process log | `thoughts/shared/processes/<repo>/ISSUE-N.md`         | Cross-phase incidents, fixes, reusable learnings |
| Research    | `thoughts/shared/research/<repo>/ISSUE-N.md`          | Codebase findings with file:line references      |
| Plan        | `thoughts/shared/plans/<repo>/ISSUE-N.md`             | Phased implementation plan with success criteria |
| Handoff     | `thoughts/shared/handoffs/<repo>/ISSUE-N-progress.md` | Operational progress (deleted after merge)       |

These artifacts are the durable memory of the project. Before searching the codebase, agents must consult them first — see `.claude/references/knowledge-first-contract.md`.

### Running the workflow from any provider

- **Claude Code**: `/core/next [issue]` — slash commands map 1:1 onto `.claude/commands/**`.
- **Codex**: `core-next` and the other skills in `.codex/skills/` — thin wrappers over the canonical files (see `.codex/README.md`). Run modes: `codex --profile sps-safe` (default) or `codex --profile sps-auto`.
- **Any other agent**: read the canonical command file (start with `.claude/commands/core/next.md`) and execute its instructions in the current context, applying this tool mapping:

| Canonical instruction                   | Any-provider equivalent                                                                                              |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Spawn sub-agent (`codebase-locator`, …) | Use the provider's sub-agent/task feature if available; otherwise perform the same investigation sequentially        |
| `TodoWrite` task tracking               | Any progress tracking; a plain markdown checklist is sufficient                                                      |
| `SlashCommand()` / "run command X"      | Read the referenced command file and follow it in the same context (never spawn a detached context that loses state) |
| Read/Edit/Write tools                   | The provider's file tools; preserve exact artifact paths                                                             |
| Shell blocks that source helpers        | Run inside a single `bash -lc '…'` block (not zsh) so `source .claude/helpers/load_config.sh` exports stay in scope  |

Hard requirements for every provider: respect status gates, write artifacts at the exact canonical paths, use `.claude/helpers/*.sh` for GitHub operations, and keep issue comments and review checkpoints identical to the canonical command.

### Upstream and child repositories

`singlepagestartup/sps-lite` is the upstream framework repository. Projects built on SPS use it as an upstream remote (the child repository name is chosen by the developer) and sync workflow improvements in both directions. To keep this safe:

- Shared workflow files (`AGENTS.md`, `CLAUDE.md`, `.claude/**`, `.codex/**`) must stay project-agnostic — never hard-code a repository or project name in them.
- Repository identity comes from the checkout, not from these files: `TARGET_REPO` in `.claude/.env`, or `remote.origin.url` — see `.claude/references/repository-context-contract.md`.
- Artifacts self-identify their home: every ticket/process/research/plan file lives under `thoughts/shared/<kind>/<repo-name>/` and carries a `repository:` frontmatter field, so upstream artifacts and each child project's artifacts never mix — even if a `thoughts/` directory is shared or synced.
- Each checkout has its own `.claude/.env` (gitignored) pointing at its own GitHub repository and its own GitHub Project.
- Framework-level fixes discovered in a child project should be backported to `sps-lite`; project-specific behavior must stay in the child repository.

### Token efficiency

The workflow is designed to spend tokens once and reuse the result:

- Consult recorded knowledge before searching the codebase: follow `.claude/references/knowledge-first-contract.md` (lookup order: process log → ticket → research/plans → READMEs → targeted search).
- Each phase reads the previous phase's artifact instead of re-deriving it; artifacts must be self-contained for exactly this reason.
- Incidents and their fixes are recorded once in the process log (`.claude/references/process-artifact-contract.md`); future agents read them instead of re-debugging.
- Documentation order (root `README.md` → module README → model/relation README) is the cheapest way to understand a module — read it before scanning code.

## Test format (BDD)

All test files (`*.spec.*`, `*.test.*`, `*.e2e.*`) must use the repository BDD format:

- Top-level JSDoc with `BDD Suite` or `BDD Scenario`.
- Mandatory `Given`, `When`, `Then` lines in that header.
- Behavior-first test naming; avoid inline `Given/When/Then` comments in test bodies.
- JSDoc with `BDD Suite` or `BDD Scenario` above test case.

## Code Review Checklist

- Enforce TypeScript interface-first style, PascalCase components, and consistent export order.
- Confirm frontend changes obey the Tailwind/shadcn preset rules, variant structure, and SDK-based data fetching.
- Confirm backend changes preserve the layered architecture (repository/service/controller) and never bypass shared utilities (logging, caching, RBAC, revalidation).
- Ensure schema changes were followed by the Drizzle generation command; do not manually create migration SQL, snapshots, or `_journal.json` entries.
- List rows are memoized (`React.memo`) with stable id-based keys; handlers passed to rows are wrapped in `useCallback`.
- Pending state is scoped per item (`<action>ingId: string | null`), never a shared boolean broadcast to every row.
- Form `watch` subscriptions live in the lowest component that needs them; child components must use `useWatch({ control })` — `form.watch(name)` rerenders the `useForm` host component.
- Mutations patch the React Query cache via the shared helpers (`@sps/shared-frontend-client-api` — factory mutations do this automatically; hand-written SDKs follow the documented contract in `libs/shared/frontend/client/api/README.md`) and never replace WebSocket invalidation as the consistency fallback.
