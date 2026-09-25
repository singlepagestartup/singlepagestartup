---
repository: singlepagestartup
issue_number: 227
status: Research Needed
created: 2026-08-04
---

# Issue: Coerce JSON date values in generic MCP content mutations

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/227
**Status**: Research Needed
**Created**: 2026-08-04
**Priority**: medium
**Size**: small
**Type**: bug

---

## Problem to Solve

The generic SinglePageStartup MCP content-management create and update tools cannot accept explicit values for fields backed by Zod `date` schemas. MCP tool arguments cross the protocol as JSON, so callers can only send an ISO-8601 string, number, object, or null. However, `parseCreateData` and `parseUpdateData` pass that raw JSON data directly to each entity's Drizzle-Zod `insertSchema`, where timestamp columns are represented by `z.date()` and require a real JavaScript `Date` instance.

As a result, a valid ISO timestamp such as `2022-07-06T21:00:00.000Z` fails during MCP dry-run with `Expected date, received string`. Numeric timestamps and JSON objects also fail. The request never reaches the existing server SDK/API path, so neither dry-run nor commit can change `createdAt` or any other explicit date field.

This was reproduced against the production `blog.categories-to-articles` relation while attempting to update relation `67abcb99-da18-4f58-b7c4-b585228d6df1` from `createdAt: 2026-06-23T14:29:03.743Z` to `2022-07-06T21:00:00.000Z`. The dry-run was rejected and a read-back confirmed that production data remained unchanged.

## Key Details

- `ContentModelCreateInputSchema`, `ContentModelUpdateInputSchema`, `ContentRelationCreateInputSchema`, and `ContentRelationUpdateInputSchema` intentionally accept JSON-compatible `data` through `z.record(z.any())`.
- Generic `parseCreateData` calls `descriptor.insertSchema.safeParse(data)` and `parseUpdateData` calls `descriptor.insertSchema.partial().safeParse(data)` without normalizing date fields first.
- Entity descriptors already detect and publish Zod date fields as `type: "date"`, including optional, nullable, defaulted, and effects-wrapped schemas.
- Drizzle-Zod maps PostgreSQL timestamp columns to `z.date()`, which rejects the ISO strings produced by MCP JSON transport.
- The shared backend repository already converts string date fields to `Date` before its own insert/update parsing. MCP's earlier validation prevents the payload from reaching that compatible runtime path.
- The fault is shared by generic model and relation create/update operations whenever an explicit date field is supplied; it is not limited to `categories-to-articles` or `createdAt`.
- Existing MCP generic-operation tests use descriptors with localized records and string fields only, so they do not exercise transport-to-Zod date normalization.
- This is follow-up hardening for the generic content-management surface introduced in #187.

## Implementation Notes

Normalize JSON date inputs at the MCP content adapter boundary before entity-schema validation:

1. Inspect the entity `insertSchema` shape and recursively unwrap optional, nullable, default, and effects wrappers when identifying top-level date fields.
2. For a supplied date field, accept a valid ISO-8601 string and convert it to `new Date(value)` before calling the entity's create or partial-update schema.
3. Reject invalid date strings with an actionable validation error and never forward an invalid `Date` to the SDK.
4. Apply the same normalization to generic model/relation create and update paths while leaving non-date values untouched.
5. Keep dry-run output and tool response envelopes JSON-serializable and preserve the same validated payload between dry-run and commit.
6. Add BDD coverage for model and relation create/update, valid ISO timestamps, optional/nullable wrapped dates, invalid values, SDK forwarding, and dry-run no-write behavior.
7. Update schema examples or guidance so callers are explicitly told to send date values as ISO-8601 strings.

Do not solve this by bypassing MCP validation or changing production data directly. Prefer a transport-boundary normalization helper over broad changes to every generated Drizzle-Zod schema.

### Acceptance Criteria

- `model-record-create`, `model-record-update`, `relation-record-create`, and `relation-record-update` accept valid ISO-8601 strings for entity fields described as `type: "date"`.
- Dry-run succeeds, returns the intended normalized value in a JSON-safe response, and performs no SDK write.
- Commit reaches the existing SDK/API path with the same logical date value used in dry-run.
- Invalid strings, numbers, and arbitrary objects are rejected before SDK invocation with clear validation output.
- Optional, nullable, defaulted, and effects-wrapped top-level date schemas behave correctly.
- Existing localized-field, file-upload, authentication-header forwarding, and mutation-safety tests continue to pass.
