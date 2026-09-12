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

### Pre-development workflow

Use `singlepagestartup` (Codex), `/singlepagestartup` (Claude), or a
plain-language request to start, continue, inspect, or change a project before
engineering. The workflow uses `00-business`, `10-strategy`, `20-brand`,
`30-design`, and `40-products`. Before every invocation it fetches the configured GitHub branch,
scans relevant commits published after the first approved strategy commit, and
applies fact and dependency side effects before stage work. Its layer-local
`apps/studio/workspace/utils/pre-development/<layer>.yaml` cursor survives new model
contexts and is reconciled against the indexed living artifacts at every launch.
After the cursor is read, mandatory pipeline compatibility reconciliation
compares completed, active, and later non-empty artifacts with the current
checked-out workflow, templates, index, and completion rules. A synchronized
shared-pipeline change therefore routes missing files, sections, schema keys, or
decisions to the earliest affected stage in both framework and downstream
repositories without a separate command or stored pipeline version.
AI methods, question-routing rules, and stage completion criteria live in
`.agents/`. During `00-business`, confirmed Brief is followed by initial Product, shared
Operations & Economics model sources, and whole Sales intake from client inputs.
There is no standalone Business document. Models have stable catalog IDs and
may serve several products; sources live in `products/<layer>/models/<id>/`.
Product owns Customer Segments and Value Propositions; Sales owns the complete
customer process; model sources own resources, activities, partnerships, revenue,
costs and financing. Follow `.agents/contracts/product-models.md`. Material questions, metrics, risks,
constraints, and sources stay in the documents that own those decisions;
confirmation stays in source metadata. Do not maintain a separate workspace
decision checklist or approval summary. Template headings or generic prose
never complete a stage. Named professional methods or benchmarks are used only with an
authoritative source, explicit fit, and limitations for a material decision.
Before business or market work starts, the operator confirms a compact brief
that separates the primary decision subject, reference projects, historical
context, and out-of-scope topics, and records the current or intended products
in scope. Supporting acquisition activities and internal work remain concise
context in Brief and Strategy. `00-business` records only client statements,
confirmed intentions, supplied-material observations, and explicit unknowns;
external research never fills or silently corrects client facts. Each active
product owns Research and a machine-readable Sales process in its product
folder. Product Research starts at `10-strategy` before strategic selection;
cross-product conclusions belong to Strategy and cite the relevant products.
There is no business-wide Research document. Product Sales intake records
supplied current or confirmed intended processes. Strategy names separate audience-growth and sales-product priorities,
one experiment track, and an exact experiment product set;
`40-products` retains every client-confirmed Brief product, including products outside the current experiment. Strategy never removes catalog entries. Unknowns are routed as operator facts,
research questions, professional choices, or evidence gaps. An assumption never
answers an operator-controlled fact such as budget, capacity, rights, support,
or decision authority. Strategy and brand remain proposals until confirmed in
plain language; no separate stage command is required. Quality and completeness
take precedence over response length, number of turns, execution time, or token
use.
Primary review documents own `confirmation` metadata under
`.agents/contracts/document-confirmation.md`. Studio shows user confirmation and
its source layer in the header. Empty startup inherits the base status; changed
startup content requires its own confirmation. A confirmation fingerprint covers
the complete resolved body and becomes invalid when that body changes. Inherited
singlepage confirmation never approves a downstream project's stage.
Resolved states are `unconfirmed`, `confirmed`, `changed`, and `stale`. Each
document's `review.dependencies` stores fingerprints of inspected direct inputs.
Changed upstream inputs make dependents stale, including product-local files.
Agents review impact before consuming them: no material effect refreshes only
the input snapshot; material impact keeps `review.stale` until corrected and,
where required, confirmed. Never renew approval by copying a hash. The canonical
confirmation contract defines the shared resolver and transitions.
Every primary review document appears in the resolved `default` projection and
contains at most 1,400 words so
the operator can read and edit it in five to seven minutes; Git retains history; material sources stay with their owning statements. Brand owns the meaning that
should form in the audience's mind. During `30-design`, a separate layered
`design.md` translates approved Brand into visual identity, photography, and
illustration decisions. Photography and illustration use the same objective
prompt, production, example, and visual-review contract. Design structure is
project-configurable through `design/<layer>/layout.yaml`: ordered built-in or
custom Markdown/React/HTML/media sections, or a complete TSX/JSX template. Empty
startup inherits the base layout; a populated startup layout replaces it with
layer-owned files and no implicit base-file fallback. Document section inheritance
and layered CSS stay separate. Shared support stays in `utils/design/` and
`utils/components/`; project templates and section data stay in `design/<layer>/`. During `40-products`, each active product
adds a self-contained Product, Website, Marketing Creative, and Presentation set
to its existing Research and Sales tabs, plus an optional product-defined
Product Content surface when needed. Products may extend any core tab or add sections with nested Markdown, HTML,
JSX/TSX, image, and media pages through the catalog. Product-specific files stay
in their layer folder; shared loaders and tests live in `utils/products/`.
React presentations compose TSX pages and retain PDF export. No mandatory
Markdown schema applies to additional pages. A non-empty startup Product catalog replaces the entire
singlepage catalog including models so unrelated products and models never mix.
None may redefine an upstream decision.
The framework repository writes the `singlepage` sources; downstream
repositories write the `startup` sources. Workspace keeps `assets/`, `products/`,
and `styles/` at its root. Products contain their catalog, Markdown, YAML data,
and React entry points. Both `products/singlepage/` and `products/startup/`
exist from the outset with their own `catalog.yaml`; an empty startup catalog
is the explicit inheritance boundary. Shared components, stories, review helpers, indexes,
configuration, and workflow state live in `workspace/utils/`. All project business context
lives under `apps/studio/workspace/**`; only project-invariant role methods and
templates live under `.agents/**`.
`apps/studio/workspace/utils/config.yaml` defaults unknown repositories to `startup`
and explicitly maps the canonical framework repository to `singlepage`.
Layered startup index entries declare their base with `extends` and use
`sections`, `replace`, `keyed`, or atomic `product-catalog`
resolution. Inherited framework facts are reference context until the client confirms
applicability in the owning startup source. There is no standalone Evidence
document; current facts, sources, and constraints stay in their owning documents.
Studio consistently exposes `singlepage`, `startup`, and resolved `default`;
agents edit only the active source layer and never write a default copy.

The seven pre-development professions are executable custom agents, not merely
Markdown references. Codex discovers them from `.codex/agents/*.toml` and Claude
from `.claude/agents/*.md`; every adapter must explicitly load its canonical
role, which contains responsibility and professional method in one file. Source
URLs in `.agents/roles/SOURCES.md` are provenance only. The agent researches
external sources only when the current project needs fresh evidence.

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
- Ensure migrations/seeds or Nx targets are updated when schema changes.
- List rows are memoized (`React.memo`) with stable id-based keys; handlers passed to rows are wrapped in `useCallback`.
- Pending state is scoped per item (`<action>ingId: string | null`), never a shared boolean broadcast to every row.
- Form `watch` subscriptions live in the lowest component that needs them; child components must use `useWatch({ control })` — `form.watch(name)` rerenders the `useForm` host component.
- Mutations patch the React Query cache via the shared helpers (`@sps/shared-frontend-client-api` — factory mutations do this automatically; hand-written SDKs follow the documented contract in `libs/shared/frontend/client/api/README.md`) and never replace WebSocket invalidation as the consistency fallback.
