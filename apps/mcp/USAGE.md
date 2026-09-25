# SinglePageStartup MCP Content Operations Guide

This guide defines the safe operating procedure for AI agents and human
operators using a SinglePageStartup MCP connector. It applies to local,
development, and production connectors.

Connection, OAuth, deployment, and transport setup live in
[`README.md`](./README.md).

## How AI Clients Receive This Guide

Remote ChatGPT, Claude, Codex, and other MCP clients do not read this repository
file directly. The MCP server publishes the same project and operating context
through standard protocol surfaces:

- server `instructions` during MCP initialization;
- read-only tools `project-guide` and `content-operations-guide`;
- resources `singlepagestartup://project-guide` and
  `singlepagestartup://content-operations-guide`;
- prompt `solve-singlepagestartup-task`;
- safety text embedded in every mutation tool description.

Models should call `project-guide` before the first SinglePageStartup operation
in a task and `content-operations-guide` before any create, update, or delete.
The tools are the compatibility fallback for clients that do not use MCP
resources, prompts, or server instructions.

## Core Invariant

Every mutation must follow this sequence:

```text
READ -> IMPACT CHECK -> DRY-RUN -> COMMIT -> READ-BACK -> COMPARE
```

The dry-run, commit, and read-back must use the same MCP connector. The commit
must use the same write tool, selector, record id, and data as the dry-run; only
`dryRun` changes from `true` to `false`.

Do not switch to another connector, a generic tool router, or a similarly named
plugin when a tool response is empty or unclear.

## Discover the Contract Before Reading Data

1. Call `module-list` to discover available modules, models, relations, and
   supported operations.
2. Call `model-schema` or `relation-schema` before constructing filters or
   write data.
3. Use `model-record-count` / `relation-record-count` when the number of
   matching records matters.
4. Use `model-record-find` / `relation-record-find` with explicit filters and a
   bounded `limit`.
5. Use `model-record-get` / `relation-record-get` after an id has been
   resolved.

Never invent module, model, relation, field, or variant names. A client may
display shortened or generated internal tool names; identify the tool by its
connector and published description, not by guessing an internal name.

## Safe Mutation Protocol

### 1. Read

Read the current record and retain the fields that will be changed. For
creates, search for an existing record using the relevant natural key before
creating a new one.

If a query returns more than one plausible record, refine the query or ask the
user to choose. Do not select an arbitrary result.

### 2. Impact Check

Inspect relations that reference the target record and list every known record
that will be affected.

Shared entities require special care. If the user asks to change one product,
page, subscription, or profile but the target entity is linked to several
records, do not mutate the shared entity silently. Either:

- obtain confirmation for the full impact;
- update a record that is scoped to the requested entity; or
- create a separate entity and update the relevant relation.

### 3. Dry-Run

Create and update tools default to `dryRun: true`. Pass it explicitly in
agent-driven workflows so the intended phase is visible:

```json
{
  "module": "blog",
  "model": "widget",
  "id": "<widget-id>",
  "data": {
    "adminTitle": "Fresh Articles"
  },
  "dryRun": true
}
```

Verify that the returned selector, id, and validated data match the user's
request and the impact check.

### 4. Commit Through the Same Connector

Apply the exact validated operation through the same connector and write tool:

```json
{
  "module": "blog",
  "model": "widget",
  "id": "<widget-id>",
  "data": {
    "adminTitle": "Fresh Articles"
  },
  "dryRun": false
}
```

Do not reinterpret or expand the patch between dry-run and commit. If the
payload must change, run a new dry-run.

### 5. Read-Back

A successful-looking commit response is not final proof of persisted state.
Read the record again through the original connector:

```json
{
  "module": "blog",
  "model": "widget",
  "id": "<widget-id>"
}
```

For creates, read the returned id. For deletes, verify that `get` or an exact
filtered `find` no longer returns the record. For URL-based page edits, run
`page-preview` again and inspect the same candidate.

### 6. Compare and Report

Compare the persisted fields with the expected values and use one of these
statuses:

- `VERIFIED`: read-back succeeded and the persisted state matches exactly.
- `NOT_APPLIED`: read-back succeeded and proves the requested change is absent.
- `UNKNOWN`: read-back could not establish the persisted state.

Report the connector, target selector and id, impact, before value, expected
value, read-back value, and status.

## Ambiguous or Missing Tool Responses

An empty, truncated, malformed, timed-out, or otherwise unclear response means
`UNKNOWN`. It does not prove that:

- the write succeeded;
- the write failed; or
- the connector became unavailable.

Do not immediately replay the write, because the first request may have been
applied. First perform read-back through the original connector:

1. If read-back matches the requested state, report `VERIFIED`.
2. If read-back proves the old state remains, report `NOT_APPLIED`.
3. If read-back also fails, report `UNKNOWN` with the observed tool error. Do
   not replace the observation with a guessed root cause.

## Operation-Specific Procedures

### Create

```text
SCHEMA -> UNIQUENESS READ -> IMPACT CHECK -> DRY-RUN CREATE
-> COMMIT CREATE -> GET RETURNED ID -> COMPARE
```

Never retry an unverified create before searching for the record. Blind retries
can create duplicates.

### Update

```text
SCHEMA -> GET -> IMPACT CHECK -> DRY-RUN UPDATE
-> COMMIT UPDATE -> GET -> COMPARE
```

Patch only the requested fields. Preserve localized objects and unrelated
fields.

### Delete

```text
GET -> IMPACT CHECK -> DELETE PREVIEW -> REVIEW RECORD AND RELATION CONTEXT
-> DELETE APPLY WITH THE SAME confirmationToken -> GET/FIND -> CONFIRM ABSENCE
```

Use `model-record-delete-preview` / `relation-record-delete-preview` and pass
the exact returned token to the matching `*-delete-apply` tool with
`confirm: true`.

### Localized Page Field Update

```text
PAGE PREVIEW -> SELECT ONE CANDIDATE -> MODEL SCHEMA -> MODEL RECORD GET
-> IMPACT CHECK -> MERGE TARGET LOCALE INTO THE COMPLETE LOCALIZED OBJECT
-> MODEL RECORD UPDATE DRY-RUN -> MODEL RECORD UPDATE COMMIT
-> MODEL RECORD GET -> PAGE PREVIEW
-> COMPARE TARGET LOCALE AND PRESERVED LOCALES
```

Use `page-preview` to resolve the page and select exactly one external widget
candidate. Take its `externalSelector` and `externalWidget.id`, read the model
schema and exact record, then call `model-record-update`. The update data must
contain the complete current localized object with only the requested locale
changed; never replace it with a one-locale object. Dry-run and commit must use
the same selector, id, and data. Read the record and page graph back afterward.

If `page-preview` does not resolve one unambiguous candidate, stop and refine
`widgetId`, `externalModule`, or `targetText`.

### File Create

Use `model-record-create` for `file-storage.file`. Send either a publicly
reachable `url` or `contentBase64` with `fileName` and `mimeType`. Never send a
local path from a ChatGPT, Claude, or Codex sandbox.

## Response Envelope

Successful SinglePageStartup MCP tools return a JSON envelope:

```json
{
  "ok": true,
  "type": "<tool-type>",
  "data": {}
}
```

Errors return:

```json
{
  "ok": false,
  "error": {
    "kind": "<error-kind>",
    "message": "<message>"
  }
}
```

`ok: true` confirms that the tool returned normally. A mutation is reported as
`VERIFIED` only after read-back and comparison.

## Client Instruction Block

Place the following instruction in any ChatGPT plugin, Claude project, Codex
skill, or other AI client that can mutate SinglePageStartup data:

```text
For every SinglePageStartup MCP mutation, use READ -> IMPACT CHECK -> DRY-RUN -> COMMIT
through the same connector and write tool -> READ-BACK through that connector
-> COMPARE. Change only dryRun from true to false between dry-run and commit.
Never switch connector namespaces or use a generic tool router as a substitute.
An empty, malformed, timed-out, or ambiguous response means UNKNOWN, not success,
failure, or connector unavailability. Before retrying any write, read the target
through the original connector. Report success only when read-back matches the
expected state. Before changing a shared entity, enumerate every linked record
that will be affected and obtain confirmation when that impact is broader than
the request.
```

## Final Checklist

- Correct connector selected and kept for the entire operation.
- Module, entity, operations, and fields confirmed from MCP schemas.
- Exact target resolved without ambiguity.
- Related records and shared-entity impact reviewed.
- Dry-run output matches the intended write.
- Commit reused the same connector, tool, selector, id, and data.
- Persisted state read back through the same connector.
- Result reported as `VERIFIED`, `NOT_APPLIED`, or `UNKNOWN`.
