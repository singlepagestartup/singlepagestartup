# SinglePageStartup

Use this file as the specific entry point for working in this repository.

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

## Codex Workflow (Phase 1)

Codex workflow now runs in parallel with `.claude` and preserves the same issue lifecycle and artifacts.

### Core skills

- `core-next` - dispatcher by current GitHub Project status.
- `core-00-create` - create/initialize issue in workflow.
- `core-10-research` - research phase.
- `core-20-plan` - plan phase.
- `core-30-implement` - implementation phase.

### Utility skills

- `github`, `github-status`, `validate-plan`, `create-handoff`, `resume-handoff`, `implement-plan`, `commit`, `describe-pr`.

### Legacy aliases

- `ralph-research` / `ralph_research`, `ralph-plan` / `ralph_plan`, `ralph-impl` / `ralph_impl`, `oneshot`, `oneshot-plan` / `oneshot_plan`.
- They are compatibility wrappers and delegate to `core-*` semantics.

### How to invoke skills

- In Codex App/IDE, type `/` and select skill by name (for example, `core-next`).
- Explicit invocation also works via `$` mention (for example, `$core-next`).
- Pass issue number in the same prompt (for example: `Run core-next for issue 142`).

### Status gates and artifacts

- Status transitions and gate logic remain equivalent to `.claude/commands/core/*.md`.
- GitHub status operations still use `.claude/helpers/*.sh` in this phase.
- Research/plans/handoffs remain in `thoughts/shared/{research,plans,handoffs}/...`.

### Run modes

- Safe default: `codex --profile sps-safe`
- No confirmation prompts (workspace sandbox): `codex --profile sps-auto`
- Equivalent one-off flags: `codex --ask-for-approval never --sandbox workspace-write`

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
