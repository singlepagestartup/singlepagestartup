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
- Put a new file where its kind already lives, not beside whatever calls it: a constant belongs with the shared constants, a pure predicate in a utils package, a service beside the other services. List the target directory first and check the siblings are the same kind of thing. Do not add a layer, a top-level directory, or a shared package to make a change fit; where nothing fits, say so and agree the exception before writing it. See `.agents/contracts/engineering/code-placement.md`.
- When one file is no longer enough for a thing, move it into a folder named after it and make it that folder's `index.ts`. Never leave a file beside a folder of the same name — importers of `./thing` resolve to either, so the thing ends up living in two places under one name.
- Do not edit repository data snapshots under `libs/modules/<module>/<relations|models>/<name>/backend/repository/database/src/lib/data/*` to implement behavior or UI fixes; change runtime code, configuration, migrations, or explicit data-management flows instead.
- When changing a Drizzle table schema or fields, run the appropriate `repository-generate` target instead of hand-writing migration SQL or `migrations/meta/*` journal/snapshot files. For example, use `npx nx run @sps/<module>:models:<model>:repository-generate` or the matching relation target; use `npx nx run api:db:generate` only when intentionally regenerating all repository migrations.

If anything is unclear, read the relevant README files instead of guessing.

Before storing, publishing, or returning prose intended for a person, make the
final editorial pass defined in `.agents/contracts/editorial-pass.md`. Every provider applies that
one contract, with `.agents/references/unslop-patterns.md` beside it while
editing. Run it after facts, evidence, links, identifiers, required
structure, and approval state are correct. It applies in the requested language
and must preserve meaning, uncertainty, terminology, formatting, and voice.

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

## AI Development Workflow (any agent, any provider)

This repository uses one provider-agnostic, status-gated development workflow. Claude Code, Codex, and any other AI agent must follow the same process definitions and produce the same artifacts.

### Single source of truth

| Concern                                | Canonical location                                                         |
| -------------------------------------- | -------------------------------------------------------------------------- |
| Engineering process definitions        | `.agents/workflows/engineering/**/*.md`                                    |
| Pre-development process                | `.agents/workflows/pre-development.md`                                     |
| Roles, templates, contracts, and tools | `.agents/roles`, `.agents/templates`, `.agents/contracts`, `.agents/tools` |
| GitHub Project / issue automation      | `.claude/helpers/*.sh` (plain bash, provider-independent)                  |
| Per-checkout engineering configuration | `.agents/.env` (gitignored; created by `./ai.sh`)                          |
| Provider adapters                      | Claude Code: `.claude/**`; Codex: `.codex/**`                              |

`.agents/` is the only canonical source of shared workflow and role semantics.
Claude and Codex files retain only provider discovery metadata and routes to
those sources. `.claude/helpers/*.sh` remains path-stable because it is the
shared executable backend for GitHub Project automation, not a process copy.

### Pre-development workflow

Use `singlepagestartup` (Codex), `/singlepagestartup` (Claude), or a
plain-language request to start, continue, inspect, or change a project before
engineering. The canonical process is `.agents/workflows/pre-development.md`.
Its stage machine, `00-business`, `10-strategy`, `20-brand`, `30-design` and
`40-products` with owners, active artifacts, executable checks and
manual-review criteria, is `.agents/pipeline/pre-development.yaml`, executed by
`npm run singlepagestartup:pipeline:check`. Every invocation runs the GitHub
preflight, reads the layer-local cursor
`apps/studio/workspace/utils/pre-development/<layer>.yaml`, runs the check and
repairs its gaps before stage work. Layers, projections and write ownership are
defined in `.agents/contracts/inheritance.md`; claims, unknowns and assets in
`.agents/contracts/evidence.md`; approval and review state in
`.agents/contracts/document-confirmation.md`. The seven pre-development
professions are executable custom agents discovered from `.codex/agents/*.toml`
and `.claude/agents/*.md`; every adapter loads its canonical role from
`.agents/roles/`, which holds responsibility and method in one file. All
project business context lives under `apps/studio/workspace/**`; only
project-invariant methods, templates and contracts live under `.agents/**`.

### Downstream adaptation command

Every agent-created commit follows
`.agents/contracts/engineering/downstream-migrations.md`: preserve conversation
intent, applicability, actions, and verification in the commit message.

Run `.agents/workflows/engineering/adapt-upstream.md` only when the user requests
`adapt-upstream` or explicitly asks to review/adapt already integrated upstream
changes. This separate command reads local Git history and adapts owned code and
documents. It never fetches, merges, pushes, downloads dependencies, or calls
remote services. Missing local history/tooling leaves adaptation pending.

Ordinary upstream synchronization and new agent tasks do not invoke migration
checks automatically and do not depend on an adaptation checkpoint or agent
availability. There are no migration hooks on merge/rewrite. Keep Git sync and
adaptation outcomes separate; a pending adaptation does not make a merge fail.

## Code Review Checklist

- Enforce TypeScript interface-first style, PascalCase components, and consistent export order.
- Confirm frontend changes obey the Tailwind/shadcn preset rules, variant structure, and SDK-based data fetching.
- Confirm backend changes preserve the layered architecture (repository/service/controller) and never bypass shared utilities (logging, caching, RBAC, revalidation).
- Confirm every new file sits with its own kind: constants with constants, pure helpers in a utils package, services beside services; and that no new layer, top-level directory, or shared package was introduced to fit the change.
- Ensure schema changes were followed by the Drizzle generation command; do not manually create migration SQL, snapshots, or `_journal.json` entries.
- List rows are memoized (`React.memo`) with stable id-based keys; handlers passed to rows are wrapped in `useCallback`.
- Pending state is scoped per item (`<action>ingId: string | null`), never a shared boolean broadcast to every row.
- Form `watch` subscriptions live in the lowest component that needs them; child components must use `useWatch({ control })` — `form.watch(name)` rerenders the `useForm` host component.
- Mutations patch the React Query cache via the shared helpers (`@sps/shared-frontend-client-api` — factory mutations do this automatically; hand-written SDKs follow the documented contract in `libs/shared/frontend/client/api/README.md`) and never replace WebSocket invalidation as the consistency fallback.
