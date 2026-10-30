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
- Design includes a dedicated Icons block naming its library or custom drawing method and showing the glyphs. Generate photographic and illustrative masters with unconstrained aspect ratios, then prepare square delivery images by expanding the canvas with an image-editing tool; preserve the originals. Follow `.agents/templates/design.md` and `.agents/roles/brand-designer.md`.
- Always use SDK providers for data access from `libs/modules/<module>/models/<model|relation>/sdk/<client|server>`.
- Before implementing or reviewing frontend variants, read `.agents/contracts/engineering/frontend-components.md` for required file roles, layer registration, shared or specialized client/server readers, explicit UI props and JSX slots, and query-cache/store/realtime ownership.
- Use relation components with `variant="find"` and filter via `apiProps.params.filters.and`.
- Keep principal/data/form/mutation logic in the owning domain Widget and layout/copy/imagery in Website Builder Widget variants. Connect exact instances through default relations and rendered JSX slots; relations must not switch on business screens or inject their presentation. See the Functional Widgets and presentation Widgets section of the frontend contract.
- Read named URL values through Page variant="url-segment-values" render callbacks in Host leaf compositions. Keep the complete map inside the reader callback and pass only explicit IDs or slugs directly to domain components; do not thread routeParams through Page, Widget and relation props. Keep session operations and business variant registries in their owning modules.
- Backend only hosted in `apps/api/app.ts`.
- Backend route middleware must live in the module's `backend/app/middlewares/src/lib/*` folder and be exported from that middleware package; controllers should only compose route definitions, middleware instances, and handlers.
- Put a new file where its kind already lives, not beside whatever calls it: a constant belongs with the shared constants, a pure predicate in a utils package, a service beside the other services. List the target directory first and check the siblings are the same kind of thing. Do not add a layer, a top-level directory, or a shared package to make a change fit; where nothing fits, say so and agree the exception before writing it. See `.agents/contracts/engineering/code-placement.md`.
- When one file is no longer enough for a thing, move it into a folder named after it and make it that folder's `index.ts`. Never leave a file beside a folder of the same name — importers of `./thing` resolve to either, so the thing ends up living in two places under one name.
- Do not edit repository data snapshots under `libs/modules/<module>/<relations|models>/<name>/backend/repository/database/src/lib/data/*` to implement behavior or UI fixes; change runtime code, configuration, migrations, or explicit data-management flows instead.
- When changing a Drizzle table schema or fields, run the appropriate `repository-generate` target instead of hand-writing migration SQL or `migrations/meta/*` journal/snapshot files. For example, use `npx nx run @sps/<module>:models:<model>:repository-generate` or the matching relation target; use `npx nx run api:db:generate` only when intentionally regenerating all repository migrations.
- Model/relation `repository-generate` targets run uncached and automatically regenerate Consistency Capture after Drizzle, including Startup models and `fields/startup.ts` changes. Preserve that final step in custom targets; commit the generated migrations and capture catalog together. Apply migrations with `npx nx run api:db:migrate`, then run `npx nx run @sps/providers-db:consistency-check`. Never hand-edit capture SQL or `capture.json`; see `libs/providers/db/README.md`.

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

## Validation timing and machine resources

- Run implementation checks only after the requested changes are complete, before a commit or the final message reporting results. This includes tests, type checks, lint, builds, browser checks, and HTTP requests that trigger compilation. Do not run them between edits or after each phase when continuing with more phases in the same task. Reading source, diffs, and existing logs remains part of implementation.
- Collect the required checks while implementing and run them at that completion boundary. If a check fails, finish the related fixes before rerunning the affected checks. Report any checks that could not run; do not claim unverified work passed.
- Run resource-intensive checks one at a time. Do not overlap builds, type checks, test suites, or browser-triggered compilation. Keep only the local services needed for the current check running, and reuse existing instances.
- Before starting checks, inspect available memory, swap use, free disk space, and running development processes. Set supported memory and worker limits, and monitor resource use during the check. A JavaScript heap limit alone does not limit total system memory use. If memory pressure or swap use keeps rising, stop the agent-started check and resolve the resource constraint before retrying.

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

## Code Review Rules

For pull request and local diff reviews, read and apply
`.agents/workflows/engineering/review_pr.md` before reporting findings. This is
the shared guidance for the `review-pr` skill and built-in Code Review: module
dependency direction, API and cache consistency across affected readers, and
evidence-based findings with the architecture decision left to the developer.
Read `.agents/contracts/engineering/module-dependencies.md` for the confirmed
module order. A lower module must not import a higher module, including through
types, SDKs, schemas, frontend composition or reexports. Review changed modules
against that order; changes to the order or exceptions require operator confirmation.

## Code Review Checklist

- Enforce TypeScript interface-first style, PascalCase components, and consistent export order.
- Confirm frontend changes obey the Tailwind/shadcn preset rules, required variant file roles, matching registration and props union in the owning layer, and SDK-based data fetching. Specialized local `client.tsx`/`server.tsx` readers follow the same component contract.
- Confirm domain Widget logic and Website Builder presentation remain separate, with exact instance links and default relation renderers; specialized relations require association-specific behavior.
- Confirm backend changes preserve the layered architecture (repository/service/controller) and never bypass shared utilities (logging, caching, RBAC, revalidation).
- Confirm every new file sits with its own kind: constants with constants, pure helpers in a utils package, services beside services; and that no new layer, top-level directory, or shared package was introduced to fit the change.
- Ensure schema changes were followed by the Drizzle generation command; do not manually create migration SQL, snapshots, or `_journal.json` entries.
- List rows are memoized (`React.memo`) with stable id-based keys; handlers passed to rows are wrapped in `useCallback`.
- Pending state is scoped per item (`<action>ingId: string | null`), never a shared boolean broadcast to every row.
- Form `watch` subscriptions live in the lowest component that needs them; child components must use `useWatch({ control })` — `form.watch(name)` rerenders the `useForm` host component.
- Keep API results in the shared React Query cache and realtime events in `globalActionsStore`. Its `sessionStorage` snapshot is for debugging and is not restored as entity data or persistent UI state.
- Mutations patch the React Query cache via the shared helpers (`@sps/shared-frontend-client-api` — factory mutations do this automatically; hand-written SDKs follow the documented contract in `libs/shared/frontend/client/api/README.md`) and never replace WebSocket invalidation as the consistency fallback.
