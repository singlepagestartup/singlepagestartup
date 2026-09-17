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

Before storing, publishing, or returning prose intended for a person, make the
final editorial pass defined in `.agents/contracts/editorial-pass.md`. Codex
loads `.codex/skills/unslop/SKILL.md`; other providers apply the same canonical
contract directly. Run it after facts, evidence, links, identifiers, required
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
| Per-checkout engineering configuration | `.claude/.env` (gitignored; created by `./ai.sh`)                          |
| Provider adapters                      | Claude Code: `.claude/**`; Codex: `.codex/**`                              |

`.agents/` is the only canonical source of shared workflow and role semantics.
Claude and Codex files retain only provider discovery metadata and routes to
those sources. `.claude/helpers/*.sh` remains path-stable because it is the
shared executable backend for GitHub Project automation, not a process copy.

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
customer process through an overview and per-segment decision profiles and Customer
Journey Maps (CJM). Product declares stable customer_segments IDs; shared Studio
utilities render the segment sidebar and maps from Sales v2. Model sources own
resources, activities, partnerships, revenue, costs and financing. Follow
`.agents/contracts/product-models.md`. Material questions, metrics, risks,
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
supplied current or confirmed intended processes. Strategy defines one concrete
final picture of the whole project after it satisfies the approved Brief as
fully as known constraints allow. It connects project-wide marketing goals,
audiences, positioning, product roles, coordinated channels, customer journeys
and measurable growth, with separate audience-growth and sales-product
priorities. It describes the intended operating state and durable management
rules, not the roadmap or transition path. Product work owns campaign execution
and business learning; engineering tests remain in engineering. Strategy is not
a first-experiment plan.
The same five-section Strategy template and quality criteria apply to framework
and downstream projects. Each startup derives its strategy from its own Brief
and research; inherited framework choices and approval remain reference context.
After shared workflow updates, pipeline reconciliation reviews existing startup
strategies even when their cursor has advanced to a later stage.
The `40-products` set is a prospective business plan and requirements for later
engineering in both framework and downstream projects. Product ends with
`Business goals and metrics`; Sales readiness means the intended business process
is complete. Research concerns market and business choices; Presentation addresses
clients, partners or investors. Installation checks, runtime tests, bug repair and
release/license-source audits are not business-stage completion gates. Keep planned
behavior and forecasts distinct from observed results and never invent operator
budgets or figures. Reconcile old implementation-audit product documents at
`40-products`, preserving valid approvals of unchanged upstream decisions. See
`.agents/contracts/product-models.md` and
`.agents/contracts/pipeline-reconciliation.md`.
`40-products` retains every client-confirmed Brief product regardless of marketing priority. Strategy never removes catalog entries. Unknowns are routed as operator facts,
research questions, professional choices, or evidence gaps. An assumption never
answers an operator-controlled fact such as budget, capacity, rights, support,
or decision authority. Strategy and brand remain proposals until confirmed in
plain language; no separate stage command is required. Quality and completeness
take precedence over response length, number of turns, execution time, or token
use.
Primary review documents own `confirmation` metadata under
`.agents/contracts/document-confirmation.md`. Studio shows a concise confirmation
state in the header; the projection and metadata retain source-layer provenance.
Empty startup inherits the base status; changed
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
strongly targets a five-to-seven-minute review (about 1,400 words per page),
without a hard word, line, source or segment cap. Preserve material information;
split long topics into navigable pages under `.agents/contracts/document-readability.md`.
Git retains history; material sources stay with their owning statements. Brand owns the meaning that
should form in the audience's mind. During `30-design`, a separate layered
`design.md` translates approved Brand into visual identity, interface, photography, and
illustration decisions. Photography and illustration use the same objective
prompt, production, example, and visual-review contract. Design structure is
project-configurable through `design/<layer>/layout.yaml`: ordered built-in or
custom Markdown/React/HTML/media sections, or a complete TSX/JSX template. Empty
startup inherits the base layout; a populated startup layout replaces it with
layer-owned files and no implicit base-file fallback. Document section inheritance
and layered CSS stay separate. Shared support stays in `utils/design/` and
`utils/components/`; project templates and section data stay in `design/<layer>/`. During `40-products`, each active product
adds a self-contained Product, Sales, Promotion, and Analytics set around its
model and Research. Product groups Overview with optional product-defined Product
Content; Promotion groups Website, Marketing Creative, and Presentation without
merging their sources; Analytics groups current observations and Research. Every
active product owns Analytics by `40-products`; missing measurements stay
explicitly `not measured`. Products may extend any core tab or add sections with nested Markdown, HTML,
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

### GitHub Project is the control plane

All phase decisions are made through the GitHub Project status field — not chat history and not local state:

- Each issue moves through 12 statuses: Triage → Spec Needed → Research Needed → Research in Progress → Research in Review → Ready for Plan → Plan in Progress → Plan in Review → Ready for Dev → In Dev → Code Review → Done.
- Every phase command has an entry status gate and an exit status transition. Agents must refuse to run a phase when the current status does not match the gate — even when asked directly.
- Human review gates: `Research in Review`, `Plan in Review`, `Code Review`. Only the human operator moves an issue out of these statuses; this is where work is reviewed and the decision to proceed is made.
- Status reads/writes go through `.claude/helpers/get_issue_status.sh` and `.claude/helpers/update_issue_status.sh`.

Phases (canonical files in `.agents/workflows/engineering/core/`):

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

These artifacts are the durable memory of the project. Before searching the codebase, agents must consult them first — see `.agents/contracts/engineering/knowledge-first.md`.

### Running the workflow from any provider

- **Claude Code**: `/core/next [issue]` — `.claude/commands/**` routes to the canonical workflow.
- **Codex**: `core-next` and the other skills in `.codex/skills/` — thin wrappers over the canonical files (see `.codex/README.md`). Run modes: `codex --profile sps-safe` (default) or `codex --profile sps-auto`.
- **Any other agent**: read the canonical command file (start with `.agents/workflows/engineering/core/next.md`) and execute its instructions in the current context, applying this tool mapping:

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

- Shared workflow files (`AGENTS.md`, `CLAUDE.md`, `.agents/**`, `.claude/**`, `.codex/**`) must stay project-agnostic — never hard-code a repository or project name in them.
- Repository identity comes from the checkout, not from these files: `TARGET_REPO` in `.claude/.env`, or `remote.origin.url` — see `.agents/contracts/engineering/repository-context.md`.
- Artifacts self-identify their home: every ticket/process/research/plan file lives under `thoughts/shared/<kind>/<repo-name>/` and carries a `repository:` frontmatter field, so upstream artifacts and each child project's artifacts never mix — even if a `thoughts/` directory is shared or synced.
- Each checkout has its own `.claude/.env` (gitignored) pointing at its own GitHub repository and its own GitHub Project.
- Framework-level fixes discovered in a child project should be backported to `sps-lite`; project-specific behavior must stay in the child repository.

### Durable knowledge and continuity

The workflow prioritizes accurate, complete, reusable results. Do not skip
questions, investigation, verification, or corrections to reduce response
length, execution time, or token use:

- Consult recorded knowledge before searching the codebase: follow `.agents/contracts/engineering/knowledge-first.md` (lookup order: process log → ticket → research/plans → READMEs → targeted search).
- Each phase reads the previous phase's artifact instead of re-deriving it; artifacts must be self-contained for exactly this reason.
- Incidents and their fixes are recorded once in the process log (`.agents/contracts/engineering/process-artifact.md`); future agents read them instead of re-debugging.
- Documentation order (root `README.md` → module README → model/relation README) provides the canonical context before targeted code inspection.

## Test format (BDD)

All test files (`*.spec.*`, `*.test.*`, `*.e2e.*`) must use the repository BDD format:

- Top-level JSDoc with `BDD Suite` or `BDD Scenario`.
- Mandatory `Given`, `When`, `Then` lines in that header.
- Behavior-first test naming; avoid inline `Given/When/Then` comments in test bodies.
- JSDoc with `BDD Suite` or `BDD Scenario` above test case.

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
- Ensure schema changes were followed by the Drizzle generation command; do not manually create migration SQL, snapshots, or `_journal.json` entries.
- List rows are memoized (`React.memo`) with stable id-based keys; handlers passed to rows are wrapped in `useCallback`.
- Pending state is scoped per item (`<action>ingId: string | null`), never a shared boolean broadcast to every row.
- Form `watch` subscriptions live in the lowest component that needs them; child components must use `useWatch({ control })` — `form.watch(name)` rerenders the `useForm` host component.
- Mutations patch the React Query cache via the shared helpers (`@sps/shared-frontend-client-api` — factory mutations do this automatically; hand-written SDKs follow the documented contract in `libs/shared/frontend/client/api/README.md`) and never replace WebSocket invalidation as the consistency fallback.
