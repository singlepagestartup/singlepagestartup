---
date: 2026-09-18T02:12:51+03:00
researcher: flakecode
git_commit: 29370bcbf85b195fbd1c2422707141135184d6e0
branch: worktree-issues-2026-09-18
repository: singlepagestartup
topic: "Coerce JSON date values in generic MCP content mutations"
tags: [research, codebase, mcp, content-management, drizzle-zod, zod, dates, shared-backend-repository]
status: complete
last_updated: 2026-09-18
last_updated_by: flakecode
---

# Research: Coerce JSON Date Values In Generic MCP Content Mutations

**Date**: 2026-09-18T02:12:51+03:00
**Researcher**: flakecode
**Git Commit**: 29370bcbf85b195fbd1c2422707141135184d6e0
**Branch**: worktree-issues-2026-09-18
**Repository**: singlepagestartup

## Research Question

Issue #227 reports that the generic MCP content-management tools (`model-record-create`, `model-record-update`, `relation-record-create`, `relation-record-update`) reject ISO-8601 strings for fields backed by Zod `date` schemas, because `parseCreateData` and `parseUpdateData` validate raw JSON against each entity's Drizzle-Zod `insertSchema`, where timestamp columns are `z.date()`. This document records how the MCP mutation path, entity descriptors, dry-run envelopes, response serialization, shared backend date conversion, Drizzle-Zod schema generation, and the MCP test suite exist at commit `29370bcbf8`, and checks every load-bearing claim of the issue against that code.

## Summary

- The transport-boundary normalization the issue proposes is already in the tree. Commit `29fa75fec7` ("Coerce MCP JSON date mutation fields", 2026-08-04 23:24 +0300, about one hour after the issue was opened) added `unwrapSchema`, `isDateSchema`, and `coerceJsonDateFields` to `apps/mcp/lib/content-management/operations.ts:118-210` and wired them into `parseCreateData` (`operations.ts:212-225`) and `parseUpdateData` (`operations.ts:227-240`). It reached `main` through PR #228 (`961fe1bc37`, branch `codex/review-issue-227-and-suggest-fixes`) and is an ancestor of both HEAD and `origin/main`.
- All four generic mutation tools share `createContentRecord` and `updateContentRecord` (`operations.ts:866-942`), so the coercion applies equally to model and relation create and update. Dry-run returns `{ operation, module, model|relation, [id], data }` where `data` holds `Date` instances; `toMcpText` serializes the envelope with `JSON.stringify`, which renders those as ISO strings (`apps/mcp/lib/content-management/response.ts:11`).
- `coerceJsonDateFields` accepts only strings matching `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}` that produce a valid `Date`. Numbers, objects, date-only strings, and unparsable strings throw `Validation error. Field "<field>" must be a valid ISO-8601 date string.` before any SDK call (`operations.ts:187-206`). `undefined`, `null`, and existing `Date` values pass through untouched.
- `operations.spec.ts` uses a descriptor with `publishedAt: z.date().optional()` and `expiresAt: z.date().nullable().optional()` (`apps/mcp/lib/content-management/operations.spec.ts:89-90`) and has five date scenarios: model and relation create dry-run, model and relation update forwarding, and rejection of `"not-a-date"`, a number, and an object (`operations.spec.ts:299-370`, `operations.spec.ts:549-669`). Running `npx jest -c apps/mcp/jest.config.ts` on `operations.spec.ts` and `schemas.spec.ts` at HEAD passes 23 tests.
- Not present in live code: caller-facing guidance that date fields take ISO-8601 strings (no `ISO` or `8601` mention in `apps/mcp/lib/guidance.ts`, `apps/mcp/README.md`, or `apps/mcp/USAGE.md`); a `date` case in the registry's example-value builder (`apps/mcp/lib/content-management/registry.ts:295-317`, with `createdAt` and `updatedAt` excluded from write examples at `registry.ts:322`); test scenarios for `.default()`- or `.transform()`-wrapped date fields; and an assertion on the JSON-serialized dry-run envelope.
- The issue's root-cause description matches the pre-`29fa75fec7` code exactly (the commit diff removes `descriptor.insertSchema.safeParse(data)` and `.partial().safeParse(data)`). Three of its claims are contradicted by HEAD; see "Issue claims versus live code".

## Detailed Findings

### MCP tool surface for generic mutations

- `registerTools` (`apps/mcp/content-management.ts:151`) registers the four write tools with `inputSchema` taken from the shared zod shapes: `model-record-create` (`content-management.ts:264-279`, `ContentModelCreateInputSchema.shape` at `content-management.ts:269`), `model-record-update` (`content-management.ts:281-296`), `relation-record-create` (`content-management.ts:385-400`), and `relation-record-update` (`content-management.ts:402-417`). Each handler resolves caller headers through `getMcpAuthHeaders(extra)` and delegates to the matching operation.
- Every tool handler is wrapped by `withAuth` (`content-management.ts:60-68`), which converts a thrown `Error` into an error envelope through `unknownErrorResponse` (`response.ts:61-67`). A coercion failure therefore reaches the client as `{ ok: false, error: { kind: "error", message } }`.
- Write-tool descriptions append `MUTATION_SAFETY_DESCRIPTION` (`apps/mcp/lib/guidance.ts:66-67`): read the guides first, dry-run and commit through the same connector, read back and compare. No description or guide text mentions date formats.
- `updateLocalizedContentField` (`operations.ts:1010-1060`) exists and is tested (`operations.spec.ts:822-873`) but is neither imported nor registered in `content-management.ts` (imports at `content-management.ts:22-40`); `apps/mcp/content-management.spec.ts:122` asserts that `page-localized-field-update` is absent from the tool list. It builds its patch through `buildLocalizedFieldPatch` (`apps/mcp/lib/content-management/localized-field.ts:37-41`) and calls `descriptor.api.update` directly without `parseUpdateData`.

### Input schemas

- `ContentModelCreateInputSchema` (`apps/mcp/lib/content-management/schemas.ts:123-126`), `ContentRelationCreateInputSchema` (`schemas.ts:128-132`), `ContentModelUpdateInputSchema` (`schemas.ts:139-143`), and `ContentRelationUpdateInputSchema` (`schemas.ts:145-149`) all declare `data: z.record(z.any())` and `dryRun: z.boolean().default(true)`. The update schemas extend the get-by-id schemas, which add `id: z.string().min(1)` (`schemas.ts:107-116`).
- The entity-keyed generic forms `ContentCreateInputSchema` (`schemas.ts:118-121`) and `ContentUpdateInputSchema` (`schemas.ts:134-137`) carry the same `data` and `dryRun` shape. The model and relation wrappers translate `{ module, model | relation }` into `entity: "module.name"` before calling the generic operation (`operations.ts:64-70`, `operations.ts:450-456`, `operations.ts:471-477`, `operations.ts:597-603`, `operations.ts:618-624`).

### Date coercion in parseCreateData and parseUpdateData

- `unwrapSchema` (`operations.ts:118-159`) loops over `_def.typeName ?? _def.type`. It unwraps `ZodOptional`, `ZodNullable`, `ZodDefault`, `ZodCatch`, and `ZodBranded` (plus the lowercase zod v4 names) through `_def.innerType ?? _def.type`, `ZodEffects`/`effects` through `_def.schema`, and `ZodPipeline`/`pipe` through `_def.out`.
- `isDateSchema` (`operations.ts:161-171`) returns true when the unwrapped schema has `typeName === "ZodDate"`, `type === "date"`, or is `instanceof z.ZodDate`.
- `coerceJsonDateFields` (`operations.ts:173-210`) copies `data`, walks `descriptor.insertSchema.shape` (`operations.ts:177`), and for every date field: leaves `undefined`, `null`, and `Date` values untouched (`operations.ts:187-189`); throws for non-strings (`operations.ts:191-195`); requires the regex `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}` and a non-NaN `new Date(value)` (`operations.ts:197-204`); assigns the `Date` (`operations.ts:206`). Keys present in `data` but absent from the insert shape are not inspected.
- `parseCreateData` (`operations.ts:212-225`) calls `descriptor.insertSchema.safeParse(coerceJsonDateFields(descriptor, data))`; `parseUpdateData` (`operations.ts:227-240`) calls `descriptor.insertSchema.partial().safeParse(coerceJsonDateFields(descriptor, data))`. Both throw `parsed.error.message` on failure and return `parsed.data`.
- Verified with the installed zod 3.24.2: `z.date().safeParse("2022-07-06T21:00:00.000Z")` yields `Expected date, received string`; a number yields `Expected date, received number`; `z.date().optional()._def.innerType._def.typeName` is `ZodDate`. The regex rejects date-only `"2022-07-06"` even though `new Date("2022-07-06")` is a valid `Date`.

### Dry-run envelope and JSON serialization

- `createContentRecord` (`operations.ts:866-908`) parses input (`operations.ts:870`), loads the descriptor (`operations.ts:876`), checks `requireOperation(descriptor, "create")` (`operations.ts:880`), routes `file-storage.file` through `createFileStorageFileRecord` (`operations.ts:882-892`), then calls `parseCreateData` (`operations.ts:894`). With `dryRun` true it returns `{ operation: "create", ...publicSelector(descriptor), data }` (`operations.ts:896-902`); otherwise it calls `descriptor.api.create({ data, options })` (`operations.ts:904-907`).
- `updateContentRecord` (`operations.ts:910-942`) follows the same pattern with `parseUpdateData` (`operations.ts:926`). Dry-run returns `{ operation: "update", ...selector, id, data }` (`operations.ts:928-935`); commit calls `descriptor.api.update({ id, data, options })` (`operations.ts:937-941`).
- `publicSelector` (`operations.ts:72-76`) emits `{ module, model }` or `{ module, relation }`.
- `okResponse` calls `toMcpText`, which builds `{ content: [{ type: "text", text: JSON.stringify(payload) }] }` (`response.ts:3-15`, `response.ts:45-51`). `JSON.stringify` turns a `Date` into its ISO string, so the dry-run text shows `"publishedAt":"2022-07-06T21:00:00.000Z"`. The spec asserts the pre-serialization `Date` object (`operations.spec.ts:323-331`), not the serialized text.
- Dry-run and commit both use the `data` object produced by the parse helpers, so an identical payload yields the same `Date` in the preview and in the SDK call.

### Entity descriptors and `type: "date"` derivation

- Descriptors are discovered at runtime from `libs/modules/*/{models,relations}/*` directories that have both `sdk/model/index.ts` and `sdk/server/index.ts` (`registry.ts:88-93`, `registry.ts:114-163`), dynamically imported (`registry.ts:400-403`), and cached per key (`registry.ts:557-561`). Every entity receives all six `defaultOperations` (`registry.ts:15-22`, `registry.ts:110`).
- `IContentEntityDescriptor.insertSchema` is typed `z.AnyZodObject` (`apps/mcp/lib/content-management/types.ts:112`) and set from the SDK model export (`registry.ts:438`).
- The registry has its own `unwrapSchema` (`registry.ts:188-214`) built on `z.ZodFirstPartyTypeKind` constants. It unwraps `ZodOptional`, `ZodNullable`, and `ZodDefault` through `innerType` and `ZodEffects` through `schema`. `inferFieldType` (`registry.ts:216-242`) maps `ZodDate` to `"date"` (`registry.ts:227-228`). This is a separate implementation from `operations.ts:118-159`, which additionally handles `ZodCatch`, `ZodBranded`, `ZodPipeline`, and zod v4 names.
- `buildFields` (`registry.ts:261-293`) unions select-shape and insert-shape keys, marks `writable` when the key exists in the insert shape, and computes `required` through `safeParse(undefined)` (`registry.ts:244-250`).
- `buildExampleValue` (`registry.ts:295-317`) has cases for localized, `*Id`, number, boolean, array, and record/object fields; `date` falls to the default `<fieldName>` placeholder. `buildWriteExamples` (`registry.ts:319-340`) drops `id`, `createdAt`, and `updatedAt` and keeps the first eight writable fields.

### Drizzle-Zod insert schemas for representative entities

- `blog.article`: `createInsertSchema(Table).extend({ title, subtitle, description: z.record(z.any()).default({}) })` (`libs/modules/blog/models/article/backend/repository/database/src/lib/index.ts:6-10`). `createdAt` and `updatedAt` are `pgCore.timestamp(...).notNull().defaultNow()` (`libs/modules/blog/models/article/backend/repository/database/src/lib/fields/singlepage.ts:7-8`). The SDK model re-exports `insertSchema` and `selectSchema` (`libs/modules/blog/models/article/sdk/model/src/lib/index.ts:1-6`).
- `blog.categories-to-articles`: plain `createInsertSchema(Table)` and `createSelectSchema(Table)` (`libs/modules/blog/relations/categories-to-articles/backend/repository/database/src/lib/index.ts:5-6`); `createdAt` and `updatedAt` timestamps at `libs/modules/blog/relations/categories-to-articles/backend/repository/database/src/lib/schema.ts:12-13`; SDK re-export at `libs/modules/blog/relations/categories-to-articles/sdk/model/src/lib/index.ts:1-6` with route `/api/blog/categories-to-articles` (`index.ts:16`).
- Installed versions: `drizzle-zod` 0.6.1, `drizzle-orm` 0.38.4, `zod` 3.24.2. `drizzle-zod` maps `column.dataType === 'date'` to `z.date()` (`node_modules/drizzle-zod/index.mjs:79-80`). With `.notNull().defaultNow()` the insert schema wraps it as `ZodOptional<ZodDate>`, which both unwrappers handle.

### Shared backend date conversion on the API path

- The SDK `create` action passes `data` through `prepareFormDataToSend` (`libs/shared/frontend/api/src/lib/actions/create/index.ts:26`) and POSTs multipart (`create/index.ts:42-45`); `update` does the same with PATCH to `${route}/${id}` (`libs/shared/frontend/api/src/lib/actions/update/index.ts:27`, `update/index.ts:43-46`). `prepareFormDataToSend` appends `JSON.stringify(dataToSend)` as the `data` field (`libs/shared/utils/src/lib/preapare-form-data-to-send.ts:19`), so a `Date` leaves MCP as an ISO string again.
- The REST handlers parse the multipart body, require `body.data` to be a string, `JSON.parse` it, and call the service (`libs/shared/backend/api/src/lib/controllers/rest/handler/create/index.ts:19-32`, `libs/shared/backend/api/src/lib/controllers/rest/handler/update/index.ts:19-37`).
- `Service.create` and `Service.update` delegate to `CreateAction` and `UpdateAction` (`libs/shared/backend/api/src/lib/service/crud/index.ts:46-49`, `crud/index.ts:63-66`). Both actions `delete data.updatedAt` before calling the repository (`libs/shared/backend/api/src/lib/service/crud/actions/create/index.ts:16-18`, `libs/shared/backend/api/src/lib/service/crud/actions/update/index.ts:15-21`), so an explicit `updatedAt` never reaches the database layer through REST.
- `Database.insert` (`libs/shared/backend/api/src/lib/repository/database/index.ts:183-227`) deletes `data.id` (`database/index.ts:187`), converts string values to `Date` when the insert-shape entry satisfies `isDateSchema` (`database/index.ts:190-192`) or when the key is one of `expiresAt`, `date`, `datetime`, `sendAfter`, `updatedAt`, `createdAt` (`database/index.ts:194-206`), then calls `insertSchema.parse(data)` (`database/index.ts:209`). `updateFirstByField` (`database/index.ts:261-316`) applies the same conversion (`database/index.ts:272-289`), sets `updatedAt = new Date()` when absent (`database/index.ts:291-293`), and parses with the full insert schema (`database/index.ts:295`).
- The repository's `isDateSchema` (`database/index.ts:20-30`) recognizes `ZodDate` inside `ZodOptional` and `ZodNullable` only; the name list covers defaulted timestamps such as `createdAt`. There is no explicit invalid-date guard before `insertSchema.parse`; zod reports `Invalid date` for a NaN `Date`.
- Query filters convert values for `dataType === "date"` columns with `new Date(filter.value)` (`libs/shared/backend/api/src/lib/query-builder/filters.ts:84-86`).

### Existing MCP specs and BDD format

- `apps/mcp/jest.config.ts` uses `jest.server-preset.js` (ts-jest with `isolatedModules`, node environment, 20 s timeout, `jest.setup.ts`).
- Spec files under `apps/mcp`: `actions.spec.ts`, `content-management.spec.ts`, `lib/oauth.spec.ts`, and `lib/content-management/{auth,host-graph,localized-field,operations,response,schemas}.spec.ts`. Each opens with a `BDD Suite` JSDoc containing `Given`, `When`, and `Then` lines, and each `it` carries a `BDD Scenario` JSDoc (for example `operations.spec.ts:1-6`, `operations.spec.ts:299-304`, `schemas.spec.ts:1-6`, `schemas.spec.ts:15-20`), matching `AGENTS.md:277-284`.
- The `operations.spec.ts` descriptor factory (`operations.spec.ts:58-96`) uses mocked SDK adapters (`operations.spec.ts:27-56`) and a passthrough insert schema with `publishedAt: z.date().optional()` and `expiresAt: z.date().nullable().optional()` (`operations.spec.ts:89-90`). Date scenarios: model create dry-run (`operations.spec.ts:299-333`), relation create dry-run with the nullable field (`operations.spec.ts:335-370`), model update commit forwarding `new Date(...)` with auth headers (`operations.spec.ts:549-585`), relation update (`operations.spec.ts:587-623`), and `it.each(["not-a-date", 1657141200000, { iso: ... }])` rejecting create and update before any SDK call (`operations.spec.ts:625-669`). Neither `.default()` nor `.transform()`/`ZodEffects` wrapping is exercised.
- `content-management.spec.ts:85-248` pins the 20 registered tool names and checks that write-tool descriptions contain `project-guide`, `content-operations-guide`, `same connector`, `read back`, and `UNKNOWN` (`content-management.spec.ts:188-208`). `schemas.spec.ts` covers selectors, the limit cap, absent auth fields, and delete confirmation; it has no date cases.
- Run at HEAD: `npx jest -c apps/mcp/jest.config.ts apps/mcp/lib/content-management/operations.spec.ts apps/mcp/lib/content-management/schemas.spec.ts` produced 2 passing suites and 23 passing tests in 1.8 s.

### Git history of the coercion change

- `29fa75fec7` "Coerce MCP JSON date mutation fields" (flakecode, 2026-08-04 23:24:58 +0300, parent `036cdb033f`) changes only `operations.ts` (+103/-2) and `operations.spec.ts` (+199). The two removed lines are `descriptor.insertSchema.safeParse(data)` and `descriptor.insertSchema.partial().safeParse(data)`.
- It was merged by `961fe1bc37` "Merge pull request #228 from singlepagestartup/codex/review-issue-227-and-suggest-fixes" (2026-08-04 23:49:55 +0300, body "Coerce and validate ISO-8601 date strings for content create/update operations"). `origin/codex/review-issue-227-and-suggest-fixes` has no commits beyond `origin/main`.
- Issue #227 was created 2026-08-04T19:25:56Z (22:25 +0300) and has no comments; the ticket still records status `Research Needed`. No `thoughts/shared/prs/228_description.md` exists, and no thoughts artifact references PR #228.

### Issue claims versus live code

| Issue claim                                                                                                                                                | Live code at `29370bcbf8`                                                                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `parseCreateData` calls `descriptor.insertSchema.safeParse(data)` and `parseUpdateData` calls `.partial().safeParse(data)` without normalizing dates first | Both call `coerceJsonDateFields` first (`operations.ts:216-218`, `operations.ts:231-233`). The claim describes the pre-`29fa75fec7` tree.                                                             |
| A valid ISO timestamp fails dry-run with `Expected date, received string`                                                                                  | Not reproducible at HEAD for top-level insert-shape date fields; `operations.spec.ts:299-333` asserts the opposite. The raw zod behavior behind the message still exists: `z.date()` rejects strings. |
| Existing generic-operation tests use descriptors with localized records and string fields only                                                             | The descriptor has two `z.date()` fields (`operations.spec.ts:89-90`) and five date scenarios.                                                                                                        |
| MCP input schemas accept `data` as `z.record(z.any())`                                                                                                     | Confirmed (`schemas.ts:124`, `schemas.ts:130`, `schemas.ts:141`, `schemas.ts:147`).                                                                                                                   |
| Descriptors publish `type: "date"` for optional, nullable, defaulted, and effects-wrapped schemas                                                          | Confirmed (`registry.ts:188-214`, `registry.ts:227-228`).                                                                                                                                             |
| Drizzle-Zod maps timestamp columns to `z.date()`                                                                                                           | Confirmed (`node_modules/drizzle-zod/index.mjs:79-80`, version 0.6.1).                                                                                                                                |
| The shared backend repository converts string dates before its own insert/update parse                                                                     | Confirmed (`database/index.ts:189-207`, `database/index.ts:271-289`).                                                                                                                                 |
| The fault is shared by model and relation create/update                                                                                                    | Confirmed shared path (`operations.ts:866-942`); all four surfaces now coerce.                                                                                                                        |

## Code References

- `apps/mcp/content-management.ts:60-68` - `withAuth` error-to-envelope wrapper.
- `apps/mcp/content-management.ts:264-296` - `model-record-create` and `model-record-update` registration.
- `apps/mcp/content-management.ts:385-417` - `relation-record-create` and `relation-record-update` registration.
- `apps/mcp/lib/content-management/schemas.ts:118-149` - create and update input schemas with `data: z.record(z.any())` and `dryRun` default true.
- `apps/mcp/lib/content-management/operations.ts:118-159` - `unwrapSchema` used by coercion.
- `apps/mcp/lib/content-management/operations.ts:161-171` - `isDateSchema`.
- `apps/mcp/lib/content-management/operations.ts:173-210` - `coerceJsonDateFields`.
- `apps/mcp/lib/content-management/operations.ts:212-240` - `parseCreateData` and `parseUpdateData`.
- `apps/mcp/lib/content-management/operations.ts:438-478` - model create and update wrappers.
- `apps/mcp/lib/content-management/operations.ts:585-625` - relation create and update wrappers.
- `apps/mcp/lib/content-management/operations.ts:866-942` - `createContentRecord` and `updateContentRecord` with dry-run envelopes.
- `apps/mcp/lib/content-management/operations.ts:1010-1060` - `updateLocalizedContentField` (not registered as a tool).
- `apps/mcp/lib/content-management/response.ts:3-15` - `toMcpText` JSON serialization.
- `apps/mcp/lib/content-management/registry.ts:188-242` - registry `unwrapSchema` and `inferFieldType` producing `type: "date"`.
- `apps/mcp/lib/content-management/registry.ts:295-340` - example-value and write-example builders.
- `apps/mcp/lib/content-management/registry.ts:397-442` - descriptor loading from SDK model and server exports.
- `apps/mcp/lib/content-management/types.ts:96-115` - `IContentEntityDescriptor` with `insertSchema: z.AnyZodObject`.
- `apps/mcp/lib/guidance.ts:66-67` - `MUTATION_SAFETY_DESCRIPTION`.
- `apps/mcp/lib/content-management/operations.spec.ts:58-96` - test descriptor factory with `z.date()` fields.
- `apps/mcp/lib/content-management/operations.spec.ts:299-370` - create dry-run date coercion scenarios.
- `apps/mcp/lib/content-management/operations.spec.ts:549-669` - update coercion and invalid-value scenarios.
- `apps/mcp/content-management.spec.ts:85-248` - registered tool list and description assertions.
- `apps/mcp/jest.config.ts` - Jest preset for `apps/mcp`.
- `libs/modules/blog/models/article/backend/repository/database/src/lib/index.ts:6-15` - Drizzle-Zod schemas for `blog.article`.
- `libs/modules/blog/models/article/backend/repository/database/src/lib/fields/singlepage.ts:7-8` - timestamp columns.
- `libs/modules/blog/relations/categories-to-articles/backend/repository/database/src/lib/index.ts:5-6` - Drizzle-Zod schemas for `blog.categories-to-articles`.
- `libs/modules/blog/relations/categories-to-articles/backend/repository/database/src/lib/schema.ts:12-13` - relation timestamp columns.
- `node_modules/drizzle-zod/index.mjs:79-80` - `dataType === 'date'` mapped to `z.date()`.
- `libs/shared/frontend/api/src/lib/actions/create/index.ts:26-45` - SDK create action.
- `libs/shared/frontend/api/src/lib/actions/update/index.ts:27-46` - SDK update action.
- `libs/shared/utils/src/lib/preapare-form-data-to-send.ts:19` - `JSON.stringify` of `data` into multipart.
- `libs/shared/backend/api/src/lib/controllers/rest/handler/create/index.ts:19-32` - REST create handler.
- `libs/shared/backend/api/src/lib/controllers/rest/handler/update/index.ts:19-37` - REST update handler.
- `libs/shared/backend/api/src/lib/service/crud/index.ts:46-66` - `Service.create` and `Service.update`.
- `libs/shared/backend/api/src/lib/service/crud/actions/create/index.ts:14-21` - `CreateAction` strips `updatedAt`.
- `libs/shared/backend/api/src/lib/service/crud/actions/update/index.ts:14-24` - `UpdateAction` strips `updatedAt`.
- `libs/shared/backend/api/src/lib/repository/database/index.ts:20-30` - backend `isDateSchema`.
- `libs/shared/backend/api/src/lib/repository/database/index.ts:183-227` - `Database.insert` string-to-Date conversion.
- `libs/shared/backend/api/src/lib/repository/database/index.ts:261-316` - `Database.updateFirstByField` conversion and `updatedAt` default.
- `libs/shared/backend/api/src/lib/query-builder/filters.ts:84-86` - date filter value conversion.
- `AGENTS.md:277-284` - BDD test format rule.

## Architecture Documentation

- Generic write path: MCP tool handler (`content-management.ts`) -> `getMcpAuthHeaders` -> model or relation wrapper -> `createContentRecord` / `updateContentRecord` -> `coerceJsonDateFields` -> `insertSchema(.partial()).safeParse` -> dry-run envelope or `descriptor.api.create` / `descriptor.api.update` -> SDK action (`prepareFormDataToSend`, multipart) -> `apps/api` REST handler -> `Service.create` / `Service.update` -> `CreateAction` / `UpdateAction` (strip `updatedAt`) -> `Database.insert` / `updateFirstByField` (string-to-Date, `insertSchema.parse`) -> Drizzle.
- Two date-normalization layers now exist on that path: the MCP boundary (`operations.ts:173-210`; strict ISO regex; throws on invalid input) and the backend repository (`database/index.ts:189-207`, `database/index.ts:271-289`; lenient `new Date(string)` by schema or by field name; no invalid-date guard before `insertSchema.parse`).
- Three zod-unwrapping helpers exist with different wrapper coverage: `registry.ts:188-214` (descriptor typing), `operations.ts:118-159` (coercion), and `database/index.ts:20-30` (backend).
- Response contract: `{ ok: true, type, data, meta? }` or `{ ok: false, error: { kind, message, details? } }` as JSON text (`types.ts:160-174`, `response.ts:17-43`), always serialized through `JSON.stringify`, so `Date` values appear as ISO strings on the wire.
- Test conventions in `apps/mcp`: mocked SDK adapters injected through `options.registry`, no API or database dependency, BDD JSDoc headers on suites and scenarios.
- Guidance surface: `project-guide` and `content-operations-guide` resources and tools, `MUTATION_SAFETY_DESCRIPTION` on write tools, and per-entity `writeExamples` from `buildWriteExamples`.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-187.md` - MCP foundation research; at that time entity tools were generated per model and passed raw insert schemas to the SDK.
- `thoughts/shared/plans/singlepagestartup/ISSUE-187.md` - plan that introduced `apps/mcp/lib/content-management/*`, the registry, dry-run and confirm guardrails, the localized field helper, and BDD spec placement.
- `thoughts/shared/handoffs/singlepagestartup/ISSUE-187-progress.md` - records delivery of guarded generic create/update and later auth-forwarding follow-ups.
- `thoughts/shared/research/singlepagestartup/ISSUE-199.md` - documents the compact tool surface (19 tools then, 20 now with `content-operations-guide`), `dryRun` default true, the response envelope, and runtime registry discovery. Its `operations.ts:763-827` reference for dry-run predates the coercion commit; the same logic now sits at `operations.ts:866-942`.
- `thoughts/shared/processes/singlepagestartup/ISSUE-227.md` - create-phase note that the mismatch was reproduced in the then-current checkout, plus a reusable learning about normalizing transport representations before runtime-schema validation.
- `thoughts/shared/tickets/singlepagestartup/ISSUE-227.md` - ticket; matches the GitHub issue body; the issue has no comments.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-187.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-199.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-160.md` (shared REST and query pipeline)

## Open Questions

- Issue #227 is still `Research Needed` although PR #228 merged the coercion on 2026-08-04. Which acceptance criteria remain open for the plan phase: caller guidance that date fields take ISO-8601 strings, `date`-typed schema examples, spec coverage for `.default()`- and `ZodEffects`-wrapped fields, and an assertion on the JSON-serialized dry-run envelope are the items not found in live code.
- The MCP regex requires a `T` time component, so date-only strings such as `2022-07-06` are rejected at the MCP boundary while the backend repository would accept them through `new Date(string)`. Whether that difference is intended is not recorded anywhere.
- `CreateAction` and `UpdateAction` strip `updatedAt` before the repository call, so an explicit `updatedAt` cannot be persisted through REST regardless of MCP coercion. How this interacts with the acceptance criterion "any other explicit date field" is not stated in the issue.
- The registry and operations modules keep separate `unwrapSchema` implementations with different wrapper coverage; a descriptor field could be typed `date` by one and skipped by the other for wrappers only one handles (`ZodCatch`, `ZodBranded`, `ZodPipeline` are handled only in operations).
- `updateLocalizedContentField` is exported and tested but not registered as an MCP tool; whether it is intended to stay unregistered is not documented.
- The production reproduction against `blog.categories-to-articles` record `67abcb99-da18-4f58-b7c4-b585228d6df1` cannot be re-verified from the repository; it requires the production MCP endpoint.
