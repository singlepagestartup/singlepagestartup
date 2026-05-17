# Enable Codex Content Management Through The MCP Server Implementation Plan

## Overview

Add a focused MCP content-management layer that lets Codex discover SPS content entities, query and mutate model/relation records through existing SDK/API runtime paths, traverse the host page/widget graph, and apply locale-safe updates for workflows such as changing the English title of the Articles widget on `/about`.

## Current State Analysis

`apps/mcp` already registers a Bun/stdio `McpServer` and imports all module resource/tool bundles from `apps/mcp/actions.ts:64` through `apps/mcp/actions.ts:99`. Existing MCP entity files are generated-style per-model/per-relation wrappers: representative files expose static resources plus count/list/by-id/create/update/delete tools over server SDKs (`apps/mcp/host/page/index.ts:31`, `apps/mcp/host/page/index.ts:39`, `apps/mcp/host/page/index.ts:81`, `apps/mcp/host/page/index.ts:121`, `apps/mcp/host/page/index.ts:164`, `apps/mcp/host/page/index.ts:212`).

The current generic list tools are not practical content-management tools because they accept no filters (`apps/mcp/host/page/index.ts:44`, `apps/mcp/host/pages-to-widgets/index.ts:46`, `apps/mcp/host/widgets-to-external-widgets/index.ts:46`, `apps/mcp/blog/widget/index.ts:44`). The shared SDK/API path already supports filtered `find`, `count`, `create`, `update`, and `delete` operations (`libs/shared/frontend/server/api/src/lib/factory/index.ts:37`), and backend query parsing supports filter and order parameters (`libs/shared/backend/api/src/lib/middleware/parse-query/index.ts:46`, `libs/shared/backend/api/src/lib/query-builder/filters.ts:39`).

The host traversal needed by the canonical example exists in frontend composition, not MCP. The route resolves a URL to `host.page` (`apps/host/app/[[...url]]/page.tsx:60`), the page renders `pages-to-widgets` filtered by `pageId` (`libs/modules/host/models/page/frontend/component/src/lib/singlepage/default/Component.tsx:51`), page-widget rows resolve host widgets (`libs/modules/host/relations/pages-to-widgets/frontend/component/src/lib/singlepage/default/Component.tsx:18`), host widgets resolve `widgets-to-external-widgets` rows (`libs/modules/host/models/widget/frontend/component/src/lib/singlepage/default/Component.tsx:18`), and the blog branch resolves the linked `blog.widget` by `externalWidgetId` (`libs/modules/host/relations/widgets-to-external-widgets/frontend/component/src/lib/singlepage/default/blog/Component.tsx:7`).

`blog.widget` localized fields are JSONB maps keyed by locale (`libs/modules/blog/models/widget/backend/repository/database/src/lib/fields/singlepage.ts:19`), and the admin form writes nested field paths such as `title.en` (`libs/modules/blog/models/widget/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:152`). A locale-specific MCP edit must read the current entity, merge the target locale key, and update the whole localized object so sibling locale values are preserved.

## Desired End State

Codex can use MCP tools to:

- list content-manageable SPS model/relation entities with route, kind, fields, variants, and relation metadata;
- find records with filters, order, limit, and offset instead of dumping whole tables;
- create and update model/relation records through the existing server SDK/API path with RBAC secret headers;
- preview and apply deletes with explicit confirmation;
- resolve a host page URL into page, host widget, external-widget relation, and external module widget candidates;
- update a localized JSONB field such as `blog.widget.title.en` while preserving other locale keys.

The canonical verification flow should resolve `/about`, identify the matching `blog.widget` candidate for an Articles widget, preview the title change to `Fresh articles`, apply the English title update through MCP, and confirm the updated record without touching repository snapshot data.

### Key Discoveries:

- `apps/mcp/actions.ts:99` is the current final global MCP registration point, so new content-management tools can be registered there without changing the stdio entrypoint.
- Existing per-entity tools call server SDKs and already follow the correct runtime path for writes (`apps/mcp/blog/widget/index.ts:181`, `apps/mcp/host/widgets-to-external-widgets/index.ts:185`).
- `registerCountTool` already models a reusable filtered MCP helper shape and RBAC header injection (`apps/mcp/lib/count-tool.ts:44`, `apps/mcp/lib/count-tool.ts:70`).
- SDK model exports provide the route, variants, zod insert/select schemas, and selected relation metadata needed for MCP discovery (`libs/modules/host/relations/widgets-to-external-widgets/sdk/model/src/lib/index.ts:16`, `libs/modules/host/relations/widgets-to-external-widgets/sdk/model/src/lib/index.ts:18`).
- `host.pages-to-widgets` has a default `orderIndex asc` query that traversal should preserve when listing widgets for a page (`libs/modules/host/relations/pages-to-widgets/sdk/model/src/lib/index.ts:18`).
- The shared query builder supports JSON field filters with `column->>locale` syntax, which can support localized search during discovery (`libs/shared/backend/api/src/lib/query-builder/filters.ts:70`).

## What We're NOT Doing

- Not building a natural-language parser inside `apps/mcp`; Codex remains responsible for interpreting user text and calling the MCP tools.
- Not editing repository data snapshots under `backend/repository/database/src/lib/data`.
- Not adding Drizzle schema changes, migrations, or migration metadata.
- Not replacing the existing generated per-entity MCP tools in this issue.
- Not changing `apps/api/app.ts` or backend CRUD route contracts unless implementation discovers a runtime bug in the existing path.
- Not adding frontend UI for content management.
- Not implementing full relation-impact analysis for every SPS entity; destructive guardrails should be explicit and conservative, with deeper graph impact handled for the host/blog content path in scope.

## Implementation Approach

Add a new `apps/mcp/content-management.ts` registration module and a small `apps/mcp/lib/content-management/*` helper layer. Keep existing per-entity MCP files backward compatible, but expose new generic tools that are easier for Codex to use. Use SDK model exports and zod schemas as the machine-readable metadata source, with README documentation tools remaining explanatory context.

Start with a registry that covers the canonical host/blog content graph entities and the same generic adapter shape needed to add other SPS entities incrementally. Register all tools centrally from `apps/mcp/actions.ts`, inject `X-RBAC-SECRET-KEY` consistently, return structured JSON envelopes, and keep destructive operations split into preview and confirmed apply behavior.

## Phase 1: MCP Content Foundation

### Overview

Create reusable MCP helper primitives for entity metadata, structured responses, RBAC-protected SDK calls, filtering input, and guarded mutation contracts.

### Changes Required:

#### 1. Content Management Types And Registry

**File**: `apps/mcp/lib/content-management/types.ts`
**Why**: New generic tools need a typed contract for supported model/relation entities, SDK adapters, route metadata, field metadata, and operation capabilities.
**Changes**: Define interfaces for content entity descriptors, SDK adapters, entity keys, filter/order inputs, mutation previews, and tool result envelopes.

**File**: `apps/mcp/lib/content-management/registry.ts`
**Why**: Codex needs a discoverable source of truth for content-manageable entities without scraping all MCP tool names.
**Changes**: Add descriptors for at least `host.page`, `host.widget`, `host.pages-to-widgets`, `host.widgets-to-external-widgets`, and `blog.widget`, using each entity's server SDK and SDK model exports. Include kind, module, entity name, route, variants, relation fields, localized fields, external module metadata, and CRUD capabilities.

#### 2. Shared Tool Helpers

**File**: `apps/mcp/lib/content-management/response.ts`
**Why**: Existing tools return raw JSON strings or `Error: ${error}` strings, which makes Codex parsing less reliable.
**Changes**: Add helpers for successful JSON envelopes, validation errors, not-found errors, ambiguity responses, and operation previews. Keep output compatible with MCP text content.

**File**: `apps/mcp/lib/content-management/auth.ts`
**Why**: RBAC secret header checks are repeated in current MCP tools and missing in representative resource/by-id reads.
**Changes**: Centralize `RBAC_SECRET_KEY` validation and return SDK `options.headers` with `X-RBAC-SECRET-KEY`.

**File**: `apps/mcp/lib/content-management/schemas.ts`
**Why**: Generic content tools need consistent zod input for entity selectors, filters, ordering, pagination, dry-run mutation, delete confirmation, and localized field patches.
**Changes**: Define reusable schemas that mirror the existing backend `filters.and` and `orderBy.and` shapes, add a conservative max limit, and validate destructive operations through explicit confirmation fields.

#### 3. Localized Field Helper

**File**: `apps/mcp/lib/content-management/localized-field.ts`
**Why**: A direct patch of `title.en` must preserve existing `title.ru` and any other configured locale keys.
**Changes**: Add read-before-merge helper behavior for locale-keyed JSON objects. It should accept current entity data, field name, locale, and new value; verify the field is configured as localized for that entity; and return the merged update payload.

### Success Criteria:

#### Automated Verification:

- [x] BDD unit tests cover entity selector validation, response envelopes, RBAC header helper behavior, and localized field merge behavior.
- [x] `npx tsc -p apps/mcp/tsconfig.json --noEmit`
- [x] `npx nx run mcp:eslint:lint`

#### Manual Verification:

- [ ] The registry can answer which fields and variants exist for the canonical host/blog entities.
- [x] No repository data snapshot files are modified.

---

## Phase 2: Entity Discovery And Generic Operations

### Overview

Register generic MCP tools for discovering content entities and performing filtered reads plus guarded create/update/delete operations through existing server SDKs.

### Changes Required:

#### 1. Content Management Tool Registration

**File**: `apps/mcp/content-management.ts`
**Why**: The new tools should be isolated from generated-style entity files and registered once from the MCP entry graph.
**Changes**: Export `registerResources` and `registerTools` for content-management resources/tools. Register a metadata resource such as `sps://content/entities` and the generic tools described below.

**File**: `apps/mcp/actions.ts`
**Why**: This is where all module MCP resources/tools are currently registered.
**Changes**: Import the content-management registerers and call them after existing module/documentation registration.

#### 2. Discovery Tools

**File**: `apps/mcp/content-management.ts`
**Why**: Codex needs a predictable starting point before selecting a CRUD or traversal tool.
**Changes**: Add tools for listing content entities and reading one entity descriptor. Responses should include entity key, kind, module, name, route, fields, localized fields, relation fields, variants, available operations, and recommended follow-up tools.

#### 3. Filtered Read Tools

**File**: `apps/mcp/content-management.ts`
**Why**: Current generated `*-get` tools accept no filters and can require Codex to inspect whole collections.
**Changes**: Add generic `find`, `count`, and `get-by-id` tools that accept an entity selector and optional filters/order/limit/offset. Use the registry SDK adapter and shared auth helper. Cap default results to prevent accidental large dumps.

#### 4. Guarded Write Tools

**File**: `apps/mcp/content-management.ts`
**Why**: The issue requires add/edit/delete support for model and relation records through MCP.
**Changes**: Add generic create, update, delete-preview, and delete-apply tools. Create/update should validate entity capability and pass data through the server SDK. Delete-preview should return the current record and known host/blog relation context where available. Delete-apply should require exact entity key, id, `confirm: true`, and a confirmation token or expected id from preview before calling SDK delete.

### Success Criteria:

#### Automated Verification:

- [x] BDD tests cover entity list/schema lookup for supported canonical entities.
- [x] BDD tests cover filtered read argument forwarding to mocked SDK adapters.
- [x] BDD tests cover create/update forwarding through mocked SDK adapters with RBAC headers.
- [x] BDD tests cover delete preview vs confirmed delete behavior.
- [x] `npx nx run mcp:jest:test`

#### Manual Verification:

- [ ] MCP Inspector can list content entities through the new discovery tool.
- [ ] MCP Inspector can find `host.page` by URL filter and find `blog.widget` records by localized field filter.
- [ ] Create/update/delete calls go through SDK/API tools, not direct database access.

---

## Phase 3: Host Content Graph Traversal

### Overview

Add dedicated MCP tools that translate a host URL and optional widget/content hints into a structured page-widget-external-widget path preview.

### Changes Required:

#### 1. Host Graph Resolver

**File**: `apps/mcp/lib/content-management/host-graph.ts`
**Why**: The canonical workflow needs semantic traversal that exists today only in frontend composition.
**Changes**: Implement resolver helpers that use the registry SDK adapters to find a `host.page` by URL, fetch `host.pages-to-widgets` rows ordered by `orderIndex`, fetch each linked `host.widget`, fetch `host.widgets-to-external-widgets` rows by `widgetId`, and fetch the external module widget for supported modules.

#### 2. Blog External Widget Adapter

**File**: `apps/mcp/lib/content-management/host-graph.ts`
**Why**: The ticket's concrete example targets `blog.widget`, and the current frontend branch resolves blog widgets by `externalWidgetId`.
**Changes**: Support `externalModule: "blog"` by loading `blog.widget` records by id and including localized `title`, `subtitle`, `description`, `adminTitle`, `slug`, and `variant` in candidate summaries.

#### 3. Path Preview Tools

**File**: `apps/mcp/content-management.ts`
**Why**: Codex needs to preview relation paths and detect zero/multiple matches before writing.
**Changes**: Add host graph preview tools that accept URL, optional language, optional external module, optional target text, optional widget id, and optional filters. Return the resolved page, page-widget rows, host widgets, external-widget rows, external widget candidates, and a match status of `none`, `single`, or `multiple`.

#### 4. Ambiguity Contract

**File**: `apps/mcp/lib/content-management/host-graph.ts`
**Why**: Natural-language targets like "Articles widget" may match zero, one, or multiple widgets.
**Changes**: Define deterministic matching rules for candidate summaries: exact id first, then exact localized/admin title, then case-insensitive contains across admin title, localized title for requested language, slug, and variant. Return all candidates when more than one matches and never write during preview.

### Success Criteria:

#### Automated Verification:

- [x] BDD tests cover URL-to-page traversal using mocked adapters.
- [x] BDD tests cover ordered `pages-to-widgets` handling.
- [x] BDD tests cover blog external widget resolution by `externalWidgetId`.
- [x] BDD tests cover `none`, `single`, and `multiple` match responses.

#### Manual Verification:

- [ ] Previewing `/about` returns a page path with host widgets and external-widget candidates.
- [ ] A target such as `Articles` returns either one candidate or an explicit ambiguity response.
- [ ] Preview output includes enough ids for a follow-up update/delete tool call.

---

## Phase 4: Locale-Safe Mutations And Canonical Workflow

### Overview

Add MCP behavior that applies a localized field update after a record or host graph path has been resolved, preserving existing locale values and returning before/after previews.

### Changes Required:

#### 1. Generic Localized Field Update Tool

**File**: `apps/mcp/content-management.ts`
**Why**: The canonical "English title" edit should be possible without manually fetching and reconstructing all locale keys.
**Changes**: Add a localized field update tool that accepts entity key, id, field, locale, value, and optional dry-run. It should fetch the current record with RBAC headers, use the localized-field merge helper, validate that the field is localized for the entity, and call the generic update adapter only when dry-run is false.

#### 2. Host Graph Localized Update Tool

**File**: `apps/mcp/content-management.ts`
**Why**: Codex should be able to apply the canonical URL/path-based edit after previewing the graph.
**Changes**: Add a composed tool that accepts URL, target text or explicit candidate id, external module, field, locale, value, and dry-run. It should reuse the host graph resolver, require a single candidate before applying, and return the resolved path plus before/after localized field values.

#### 3. Apply Guardrails

**File**: `apps/mcp/lib/content-management/host-graph.ts`
**Why**: Cross-module content writes must not silently update the wrong widget.
**Changes**: Require exact candidate id or a single unambiguous match for apply mode. For dry-run mode, return candidates and proposed patch only. If multiple candidates match, return an ambiguity response and skip the update.

### Success Criteria:

#### Automated Verification:

- [x] BDD tests cover `blog.widget.title.en` update preserving sibling locale keys.
- [x] BDD tests cover dry-run returning a proposed patch without invoking update.
- [x] BDD tests cover ambiguous host graph apply refusing to update.
- [x] BDD tests cover canonical `/about` -> `blog.widget` flow with mocked SDK adapters.

#### Manual Verification:

- [ ] Dry-run for changing the Articles widget title on `/about` returns the selected `blog.widget` and proposed `title.en = "Fresh articles"`.
- [ ] Apply mode updates only the selected `blog.widget` through SDK/API.
- [ ] Readback confirms `title.en` changed and other locale keys remain unchanged.

---

## Phase 5: Documentation And Verification

### Overview

Document the new MCP content-management workflow and verify the MCP app with focused automated and manual checks.

### Changes Required:

#### 1. MCP Documentation

**File**: `AI_GUIDE.md`
**Why**: AI agents already use this as the repository entry path and it mentions MCP tools.
**Changes**: Add a short content-management workflow that starts with entity discovery, uses filtered reads or host graph preview, performs dry-run before mutations, and applies locale-safe updates.

**File**: `README.md`
**Why**: The root overview documents app/module architecture and MCP role.
**Changes**: Add a concise note pointing content-management users to the MCP discovery and host graph tools.

**File**: `libs/modules/host/README.md`
**Why**: Host owns the page/widget/external-widget graph.
**Changes**: Add a brief MCP traversal note describing the page -> pages-to-widgets -> host widget -> widgets-to-external-widgets path.

#### 2. Test Placement

**Files**: `apps/mcp/lib/content-management/*.spec.ts` and/or `apps/mcp/content-management.spec.ts`
**Why**: `apps/mcp` has a Jest target but no focused MCP behavior tests today.
**Changes**: Add BDD-format tests with top-level `BDD Suite` headers and `BDD Scenario` headers above each test case. Prefer pure helper tests and mocked SDK adapters so tests do not require API, Postgres, or Redis.

### Success Criteria:

#### Automated Verification:

- [x] `npx nx run mcp:jest:test`
- [x] `npx tsc -p apps/mcp/tsconfig.json --noEmit`
- [x] `npx nx run mcp:eslint:lint`
- [x] `npm run lint` if the focused lint target passes and time allows

#### Manual Verification:

- [ ] Start API with `npm run api:dev`.
- [ ] Start MCP with `npm run mcp:dev` or inspect with `npm run mcp:inspector`.
- [ ] Use the discovery tool to find `blog.widget` schema and localized fields.
- [ ] Use the host graph preview tool for `/about`.
- [ ] Dry-run the canonical title update.
- [ ] Apply the canonical update only against an appropriate local/dev dataset and read back the updated widget.

---

## Testing Strategy

### Unit Tests:

- Entity registry selector and metadata summaries.
- Filter/order/limit schema validation.
- RBAC header helper and missing-secret error behavior.
- JSON response envelope shape.
- Localized field merge behavior.
- Host graph resolver candidate matching and ambiguity behavior.
- Generic mutation dry-run/confirm behavior with mocked SDK adapters.

### Integration Tests:

- Keep the first implementation focused on MCP unit tests with mocked adapters.
- If a local API/database scenario already exists for issue-specific MCP flows, add a scenario that boots API and validates the canonical host/blog traversal; otherwise record the manual MCP Inspector workflow as the integration check.

### Manual Testing Steps:

1. Ensure `.env` values provide `API_SERVICE_URL` and `RBAC_SECRET_KEY` for local API access.
2. Run `npm run api:dev`.
3. Run `npm run mcp:inspector`.
4. Call content entity discovery and confirm `host.page`, `host.pages-to-widgets`, `host.widgets-to-external-widgets`, and `blog.widget` are listed.
5. Preview `/about` host graph traversal and inspect candidate ids.
6. Dry-run the Articles title update to `Fresh articles`.
7. Apply only if the candidate is unambiguous and the local dataset is safe to mutate.
8. Read back the `blog.widget` and confirm `title.en` changed while sibling locale keys remain.

## Performance Considerations

Filtered generic reads should default to a bounded limit and expose a max limit to avoid returning large collections through MCP. Host graph traversal should avoid broad external module fetches by using relation ids wherever possible: page by URL, page-widget rows by page id, host widget by id, external-widget rows by host widget id, and external widget by `externalWidgetId`.

## Migration Notes

No Drizzle schema migration is planned. Do not run repository migration generation commands unless implementation discovers a schema change that is explicitly approved. Existing generated per-entity MCP files can remain in place; the new content-management layer is additive.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-187.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-187.md`
- Process artifact: `thoughts/shared/processes/singlepagestartup/ISSUE-187.md`
- Related MCP count work: `thoughts/shared/research/singlepagestartup/ISSUE-160.md`
- Related host graph work: `thoughts/shared/research/singlepagestartup/ISSUE-164.md`

<!-- Last synced at: 2026-05-04T20:49:39Z -->
