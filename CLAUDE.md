# Claude Instructions (SPS)

Use this file as the Claude-specific entry point for working in this repository.

The provider-neutral entry point (for any AI agent) is the root `AGENTS.md` — it is canonical for shared repository rules and the AI development workflow. Shared sections in both files must stay in sync; when editing one, mirror the change in the other.

Shared workflows, roles, contracts, and tool capabilities are canonical under
`.agents/`. Files under `.claude/commands`, `.claude/references`, and
`.claude/agents` are Claude-native adapters. Executable GitHub helpers remain in
`.claude/helpers/` for compatibility.

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

- Node.js 24+, npm 11+ (as per package engines).
- Bun runtime installed (used by `apps/api`).
- Docker & Docker Compose **required** for Postgres and Redis (the `./up.sh` script expects Docker to be available on the agent machine).

## Setup & Execution

- Install dependencies: `npm install`
- Bootstrap infrastructure & migrations (requires Docker): `./up.sh`
  - Creates environment files, starts Postgres (`apps/db`) and Redis (`apps/redis`), then runs `npx nx run api:db:migrate`.
- Start API server: `npm run api:dev`
- Start host (Next.js) server: `npm run host:dev`

## Test format (BDD)

All test files (`*.spec.*`, `*.test.*`, `*.e2e.*`) must use the repository BDD format:

- Top-level JSDoc with `BDD Suite` or `BDD Scenario`.
- Mandatory `Given`, `When`, `Then` lines in that header.
- Behavior-first test naming; avoid inline `Given/When/Then` comments in test bodies.
- JSDoc with `BDD Suite` or `BDD Scenario` above test case.

## Development Workflow Commands

The unified development workflow is defined in
`.agents/workflows/engineering/core/` and exposed through Claude adapters in
`.claude/commands/core/`.

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

For work before development, use `/singlepagestartup` or ask to start,
continue, inspect, or change the active project. The canonical four-stage
workflow is `.agents/workflows/pre-development.md`; its layer-local
`apps/studio/workspace/pre-development/<layer>.yaml` cursor records the last
reconciled `00`, `10`, `20`, or `30` stage across model contexts.
During `00`, update the active layer's source for the resolved
singlepage-to-startup `knowledge/decision-profile/<layer>.md`. It classifies the
potentially compound business model and records only material domain questions,
metrics, evidence, risks, regulations, and viability rules. Assigned profile
rows are mandatory quality gates; headings or generic prose do not complete an
artifact. Use a named method or benchmark only with an authoritative source,
explicit fit, and limitations for a material decision.
Workspace configuration defaults unknown repositories to `startup` and maps the
canonical framework repository to `singlepage`. Inherited singlepage evidence
is provenance only in a startup unless explicitly adopted by startup evidence.

The seven pre-development professions are executable custom agents, not merely
Markdown references. Codex discovers them from `.codex/agents/*.toml` and Claude
from `.claude/agents/*.md`; every adapter must explicitly load its canonical
role, which contains responsibility and professional method in one file. Source
URLs in `.agents/roles/SOURCES.md` are provenance only. The agent researches
external sources only when the current project needs fresh evidence.

## Code Review Checklist

- Enforce TypeScript interface-first style, PascalCase components, and consistent export order.
- Confirm frontend changes obey the Tailwind/shadcn preset rules, variant structure, and SDK-based data fetching.
- Confirm backend changes preserve the layered architecture (repository/service/controller) and never bypass shared utilities (logging, caching, RBAC, revalidation).
- Ensure migrations/seeds or Nx targets are updated when schema changes.
- List rows are memoized (`React.memo`) with stable id-based keys; handlers passed to rows are wrapped in `useCallback`.
- Pending state is scoped per item (`<action>ingId: string | null`), never a shared boolean broadcast to every row.
- Form `watch` subscriptions live in the lowest component that needs them; child components must use `useWatch({ control })` — `form.watch(name)` rerenders the `useForm` host component.
- Mutations patch the React Query cache via the shared helpers (`@sps/shared-frontend-client-api` — factory mutations do this automatically; hand-written SDKs follow the documented contract in `libs/shared/frontend/client/api/README.md`) and never replace WebSocket invalidation as the consistency fallback.
