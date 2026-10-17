---
description: Review PRs and local diffs for SPS dependency boundaries, API/cache consistency, and concrete behavior risks.
---

# Review a pull request

Review the selected diff and the paths it changes. Report the behavior at risk,
its trigger, and the evidence the developer needs to choose a fix or an
exception. Reviewing does not authorize implementation, publication of GitHub
comments, Project transitions, approval, or merge.

## Scope and evidence

Use the requested PR, base branch, commit, or uncommitted diff. Record the
revision and comparison base when available. Reuse relevant ticket, process,
research, and plan artifacts under the repository-context and knowledge-first
contracts; verify their load-bearing claims against the selected revision.

Read root guidance, then the changed module and entity READMEs. Follow unchanged
callers, middleware, relations, and consumers only as needed to establish a
finding. If the code conflicts with its documentation, report the mismatch and
identify which behavior the current implementation provides.

A module-level import graph is a starting point. Distinguish schema references,
type imports, frontend composition, SDK calls, and backend execution before
calling an edge a runtime cycle or a forbidden dependency. An existing pattern
is evidence of current practice, not automatic permission to repeat it.

## Dependency boundaries

Read `.agents/contracts/engineering/module-dependencies.md` and check changed
modules against its confirmed top-to-bottom order. For each cross-module import
or reexport, determine the owning source and target modules, resolve aliases and
barrels, and flag a target above the source. This applies to backend code,
schemas, SDKs, frontend composition and type-only imports. A type-only violation
is a boundary finding without being proof of a runtime cycle. Applications
compose modules outside this order.

Keep these orders separate:

- **Backend execution:** controller/handler → service → repository → database
  or storage provider. App/bootstrap owns composition and DI. Route middleware
  belongs to its module middleware package; global middleware is assembled in
  `apps/api/app.ts`.
- **Domain ownership:** a consuming model or orchestration service depends on
  the lower capability it uses. Check the applicable module README for the
  established direction. File Storage owns stored bytes and File records;
  Knowledge owns Source reconstruction. Ecommerce owns reusable commerce data;
  RBAC subject surfaces own authenticated commerce orchestration.
- **Framework inheritance:** `singlepage` supplies the base, `startup` extends
  or overrides it, and the public entrypoint exposes the effective result.
  Do not confuse the `startup` business module with that extension layer.

The established boundaries include Knowledge → File Storage and RBAC subject →
Ecommerce. Flag a new reverse dependency with the concrete path and consequence.
Keep domain rules out of the global permission resolver. Shared primitives and
storage providers must not acquire domain orchestration responsibilities;
global middleware and host/widget composition are integration code and need
their own dependency analysis.

Model associations use explicit relation packages. Trace relation ownership,
foreign keys, cascades, and consumers when an association changes. A deletion
can affect more models than its returned entity describes.

Frontend and external callers use model/relation SDK providers. Backend DI
composition is already documented for Broadcast hot paths and the RBAC
permission resolver. For any direct service, repository, or SQL call, establish
which API-boundary responsibilities it bypasses and how those responsibilities
are fulfilled. Preserve transaction and partial-failure semantics when
considering a replacement with separate HTTP calls. Do not report a direct
read or a documented DI call as a cache bug without tracing its actual effect.

The confirmed module order is mandatory. A proposed change to that order or
an exception requires operator confirmation; an existing upward import does not
establish an exception. Report unclear ownership with its path and consequence
and keep accepted exceptions within their documented scope.

## Structural checks that need more than an import-order scan

Apply these checks to the affected paths and their real consumers. A passing
broad test run does not replace the checks below. Record each manual-review
comment against a verified finding, proposed correction or evidence-based
explanation; distinguish planned work from implemented and tested work.

### Studio and frontend contracts

- Workspace is independent of Modules in implementations, tests, fixtures,
  stories and generated stories. Resolve aliases, reexports, type imports,
  literal dynamic imports, assets/styles and expanded globs; trace dependencies
  through helpers and tools. Check the actual Storybook entrypoints. Separate
  Modules stories in the same Storybook are allowed; a Workspace dependency
  reaching Modules is not. An isolation check that excludes tests does not
  establish this boundary.
- Read the frontend component contract and applicable Studio docs. Public props
  belong in `interface.ts`; each variant has a literal discriminator. Verify
  the effective public union and registry through both base and startup
  implementations, including an override with different required props.
  Check the generator as well as authored output. Meaningless `VariantN`,
  `IdentityActionN` and `Example` wrappers require descriptive names; distinguish
  a story wrapper from the component it renders.
- Static icons render without a Website Builder Feature record. Studio Modules
  use their shared icon entry with layered collection variants; Workspace owns
  its own assets. Genuine database-backed Feature views keep model ownership.
  Review loading coverage for each affected model and distinct variant layout;
  a parent frame is not a substitute for child loading. Production transfer
  uses the existing `Skeleton` node parameter for Suspense and client loading.
- A locally specialized reader is allowed for a documented SDK operation.
  Preserve one query/Provider owner and the standard index/client/server/view
  roles. Trace extra wrappers, queries in visual components, and constant
  query functions that would freeze an initial result. Verify refresh after a
  mutation or realtime event, not just the first render.

### Instance composition and complete user operations

- Trace Host `externalWidgetId` through the owning module Widget and explicit
  relation to its content Widget. A variant selects a renderer; global
  `find({ variant })` or fixed-slug lookup does not establish an instance
  association. Flag Host business-variant branches that compensate for missing
  relations. Check schema, SDK, admin/MCP consumers, data cutover, idempotence
  and rollback; generate Drizzle migrations and leave snapshots untouched.
- A local scripted landing demo must work without a saved Social Chat record
  or live AI request. Keep its state in the owning Website Builder view and
  follow the module order when moving presentation code.
- CRM forms follow Form → Step → Input/options. Trace `control`, stable field
  paths, required/disabled state and ordered multiple Steps all the way through
  submitted data, stored Request, Form–Request relation and notification.
  Visual parity or a successful Request write alone does not prove submission
  correctness. Verify ownership of the referenced inputs/options before writes.

### Service ownership and transport changes

- A model service uses its own repository. A module facade, handler or indexer
  delegates to the effective child model/relation or lower-module service;
  constructing its repository, importing a private service implementation or
  querying its tables directly bypasses that owner. Review bootstrap/startup
  selection and hidden entrypoints such as generic CRUD, CLI and jobs. Do not
  fix this by renaming the same repository or creating circular service calls.
- Preserve a shared transaction scope, lock order, conditional revisions,
  attachment snapshots and post-commit publication across service boundaries.
  Never mutate a shared repository's database handle per request. Do not split
  one atomic operation into SDK HTTP calls. External storage/model calls have
  separate failure and compensation behavior from database rollback.
- Before replacing self-HTTP with DI, enumerate the inner writes and actual
  route topic resolution, cache bumps, WebSocket events, authorization and
  other middleware effects. A controller's outer route need not cover those
  writes; a job has no outer HTTP route. Retain or explicitly replace each
  effect for every entrypoint and verify a warmed reader plus another client.
- For Knowledge attachments, SVG is unsupported across upload, existing File
  association, generic relation CRUD, CLI, rebuild and AI history/context.
  Check bytes as well as declared MIME/name before writes or model payloads;
  renamed files and legacy records need coverage. Preserve original stored
  Files and render a blocked Knowledge card. Do not claim an access exploit or
  XSS solely from a layer violation or the presence of an SVG file.
- For catch-all generation changes, compare dev and production branches and
  distinguish build-time path enumeration from on-demand rendering/ISR. Check
  `dynamicParams`, effective fetch/dynamic behavior, first/repeated requests,
  revalidation and authenticated cache isolation. A build's SSG label alone
  does not prove the route's cache behavior.

## API and cache review

Check cache behavior for changed API routes, SDK requests, backend mutations,
and their readers. Also check a job or CLI mutation when it affects data served
by the API: it has no outer HTTP middleware by default.

1. **Read identity and access.** Trace authorization before a response-cache
   hit. The consistency cache partitions full URL/params, host, credentials,
   locale/representation and epoch, then checks PostgreSQL generations.
   Redis is disposable. The legacy HTTP cache remains identity-blind and needs
   private-route exclusions or `Cache-Control: no-store`. A fetch `cache`
   option alone does not bypass an API cache.
2. **Capture and read coverage.** Check the generated catalog and deployed row
   and TRUNCATE triggers for each changed Table, including cascades, direct SQL,
   CLI and jobs. Reads record candidate scopes before SQL, including empty
   relations, count and top-K candidates. Custom SQL calls `trackRepositoryRead`
   for every source Table; run `node tools/dev/audit-consistency-reads.mjs`.
   Unsupported predicates widen to collection generations. Missing coverage or
   descriptors exclude an answer from the new cache. Effective service calls
   use the shared transaction scope; domain publisher setters and another
   cache relation graph are not required.
3. **Ordering and recovery.** Generations and outbox commit with the write.
   Check serialized delivery sequence/checkpoint, Next invalidation before
   journal delivery, per-process journal readers, replay/resync, bounded frames,
   renewable private refs and epoch reset. A late cache SET must fail a later
   generation check. An API response remains verifiable during dispatcher
   outage; public Next ISR retains an eventual window and finite TTL. Private
   mutable reads stay dynamic/no-store at the Next boundary.
4. **Client consistency.** Query identity includes every parameter, API host
   and principal. The shared consistency lifecycle binds metadata to that query,
   coalesces refetches and checks versions after reconnect, focus or missed
   heartbeats. Legacy suppression applies only to an accepted, unexpired ref
   for that query. Hand-written SDKs retain topic metadata and subscription
   cleanup for uncovered reads. Mutations patch shared list/detail/count caches
   before consumer callbacks and retain cross-client reconciliation.
5. **Aggregates and UI.** Follow actual reads through services, nested HTTP
   descriptors, memory caches and Next tags. Snapshot-dependent aggregates use
   one SQL snapshot. Warm the answer, mutate a relation/quantity/price, then
   check another client. Preserve mounted content on background fetch/error,
   clear data after 401/403, and verify draft, selection, stable row references
   and scroll anchors. Healthy chat has no component-level polling.
6. **Rollout evidence.** Distinguish off, observe, compatibility and enabled.
   Observe mode compares a candidate answer with a fresh read without serving
   the candidate. Keep cache serving separately configurable and report shadow
   mismatches, outbox lag, coverage and cache-hit cost. Generate migrations with
   the owning Drizzle target; test repeated generation and maintenance reset.
   Verify both dev and production rendering. A passing no-store run is a
   control, not proof that warmed response caching is correct.

Flag a missing or incorrect cache path as a finding even if the data write
succeeds. Name the setting, request, and reader that make the problem observable.
For a suspected stale-data regression, meaningful verification warms the GET,
performs the mutation, then repeats the GET and checks a second subscribed
client. Include creation, update, deletion, and relation changes only where the
diff affects them. Disabled-cache or `no-store` runs are controls, not proof of
cache correctness. When verification is unavailable, say which part is proved
by code and which still needs reproduction.

## Other applicable repository rules

Load the source that governs the change rather than copying its whole checklist:

| Change                           | Source and review focus                                                                                                                                                                                                                                                                                                                        |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| API routes, DI, authorization    | Root and module READMEs; RBAC authorization layering; boundary guards, ownership scope, middleware registration, and transport/transaction effects                                                                                                                                                                                             |
| Queries, mutations, realtime     | `libs/shared/frontend/client/api/README.md`, `libs/shared/frontend/client/store/README.md`, `libs/middlewares/src/lib/http-cache/README.md`, `libs/middlewares/src/lib/revalidation/README.md`; query cache, runtime events, persistence scope and subscriber consistency                                                                      |
| Model/relation schemas           | Root instructions and entity README; relation ownership, cascading impact, Drizzle `repository-generate`, and runtime behavior instead of data-snapshot edits                                                                                                                                                                                  |
| Frontend variants                | `.agents/contracts/engineering/frontend-components.md`, root Code Review Checklist and applicable entity docs; file roles, layer registry and props union, justified local client/server readers, Provider ownership, RSC props and JSX slots, SDK/cache/realtime data flow, memoized rows, per-item pending state and lowest-level `useWatch` |
| File placement                   | `.agents/contracts/engineering/code-placement.md`; reuse an existing home and avoid a file beside a folder with the same name                                                                                                                                                                                                                  |
| Studio or downstream inheritance | `.agents/workflows/design-to-implementation.md`, `.agents/contracts/inheritance.md`, and applicable Studio docs; source ownership, production data flow, and isolation of prototype material                                                                                                                                                   |
| Tests and validation             | Root BDD/scoped-testing convention and the change's real consumer; observable behavior, relevant integration/scenario coverage, and explicit gaps                                                                                                                                                                                              |

A verified violation of a mandatory framework contract is a structural finding
even when the first render succeeds. State its ownership, compatibility or
maintenance consequence separately from any reproduced functional failure.
Keep deterministic lint/format failures in normal checks. Include other
conventions in findings when they create a concrete behavior, compatibility or
maintenance problem. Cursor rules are supporting context;
verify them against canonical guidance and code, especially middleware order.

## Findings and developer decisions

Lead with actionable findings in impact order. For each finding provide:

- A concise title, affected file/line, and the changed behavior or activated
  pre-existing risk.
- The triggering operation/configuration, expected result, actual result, and
  affected users or consumers.
- Evidence level: reproduced, established code path, or a hypothesis requiring
  verification. Do not turn an unsupported hypothesis into a confirmed bug.
- Likelihood/frequency when supported by usage or code; otherwise mark it
  unknown. Consider consequence, duration, and exposure as well as frequency.
- The smallest relevant correction or verification, and any documented
  exception that changes the recommendation. A finding may justify an issue
  or a local invalidation fix instead of a module-wide rewrite.

The developer chooses fix now, defer to an issue, or accept a bounded exception.
Temporary code and infrequent cases can remain when the reason and affected
conditions are documented. A frequent, reproducible failure on a used path
supports a stronger correction. Do not assume rare usage without evidence or
treat an exception as an automatic waiver of a serious consequence.

Keep accepted exceptions visible with their limits and revisit condition.
Report remaining verification gaps separately. If there are no findings, state
the reviewed scope and material limitations without claiming universal safety.

## Final editorial pass

Before returning or saving review prose, apply
`.agents/contracts/editorial-pass.md` with
`.agents/references/unslop-patterns.md`. Preserve evidence, uncertainty, code
references, and the developer's decision authority.
