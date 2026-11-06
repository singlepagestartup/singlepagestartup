---
date: 2026-09-26T00:16:24+03:00
issue_number: 304
repository: singlepagestartup
topic: "Harden upload validation and static file delivery"
status: in_review
---

# Harden upload validation and static file delivery Implementation Plan

## Overview

Files uploaded through the local provider are served from the API origin, so
an uploaded SVG or HTML file opened in a tab runs as a document of that
origin. This plan adds `nosniff` and `Content-Security-Policy: sandbox` to
every file served under `/public/*`, caps the upload size through
configuration, and makes the multipart handlers refuse several files instead
of storing the first.

## Current State Analysis

Research: `thoughts/shared/research/singlepagestartup/ISSUE-304.md`.

- `apps/api/app.ts:69-114` serves `/public/*` with `Content-Type` from the
  file extension and `Content-Length` only.
- `POST /`, `PATCH /:uuid` and `POST /create-from-url` of the file model take
  uploaded bytes with no size bound; Bun refuses request bodies above 128 MiB
  by default, and nothing bounds the body `create-from-url` fetches.
- `create/index.ts:68-127` and `update/index.ts:74-140` return inside the
  loop after the first file; a repeated field keeps the last file and a
  `file[]` array is not counted.
- Every caller sends at most one file per request under the field `file`, and
  the table has one `file` column.

## Desired End State

- Every response that serves a file under `/public/*` (`GET` and `HEAD`)
  carries `X-Content-Type-Options: nosniff` and
  `Content-Security-Policy: sandbox`. An SVG opened in a tab renders without
  running script; `<img>`, `<video>`, `<audio>` and CSS background loads are
  unchanged.
- `FILE_STORAGE_MAX_UPLOAD_BYTES` (default 50 MiB) bounds the multipart body
  of `POST /` and `PATCH /:uuid`, refused before the handler buffers it, and
  the body `create-from-url` fetches, refused before it is buffered past the
  limit. Every size refusal answers 413 through a `Payload Too Large error`
  category of the shared error mapping.
- A multipart request with more than one file answers
  `400 Validation error. Multiple files are not allowed` and stores nothing; a
  request with one file behaves as before.
- The module README and `tools/deployer/README.md` explain the limit, the
  delivery headers, and why production should store uploads with `aws-s3` or
  `vercel-blob`.

Verification: unit specs for the middleware, the controller routes, the
create-from-url handler and the error mapping; an issue-304 scenario spec
against a booted API; `curl` against the API on port 4304.

### Key Discoveries:

- Route middlewares are registered method-independently with
  `hono.use(route.path, ...)` (`libs/shared/backend/api/src/lib/app/default/index.ts:72-82`);
  a body limit is inert for requests without a body.
- Hono 4.10.4 `bodyLimit` refuses by `Content-Length` before reading and, for
  a chunked body, errors the stream with `BodyLimitError: Payload Too Large`
  inside the handler's `parseBody()`. The handlers map errors through
  `getHttpErrorType`, which has no keyword for that message and answers 500
  (`libs/shared/backend/utils/src/lib/http-error/paterns/index.ts:96-121`).
- The rbac subject model keeps route middleware in
  `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/<name>/index.ts`,
  imported by its controller as `../../../../../middlewares`; the file model
  has no such folder yet.
- `hono.request` specs with `@sps/shared-utils` mocked through getters are the
  repository's middleware test pattern
  (`libs/middlewares/src/lib/operator-secret/index.spec.ts`); the identity
  controller spec imports a real module controller
  (`libs/modules/rbac/models/identity/backend/app/api/src/lib/controller/singlepage/index.spec.ts`).
- `file-type` 20 is ESM-only and must be mocked in jest; `image-size` 1.x is
  CommonJS.
- The scenario runner reuses any API already listening on its preferred port
  (`tools/testing/test-scenario-issue.sh`); the run must pin
  `SCENARIO_API_PORT=4304`.

## What We're NOT Doing

- No content-type allow-list; SVG stays allowed. An allow-list would only be
  added later as an opt-in setting.
- No `Content-Disposition: attachment`: files keep opening inline.
- No change to the URL checks of `create-from-url` (issue #307) and no change
  to the local provider's paths.
- No streaming, `Range`, `ETag` or `Cache-Control` for `/public/*` (SEC-10);
  the static route keeps reading the file whole.
- No change to Bun's `maxRequestBodySize` in `apps/api/server.ts`; a limit
  above 128 MiB needs that change as well, which the documentation states.
- No forwarding of `FILE_STORAGE_PROVIDER` or `AWS_S3_BUCKET_NAME` through
  `tools/deployer/api.sh` and `api.env.j2`. `tools/deployer/.env.example` sets
  `FILE_STORAGE_PROVIDER=vercel-blob` with a placeholder token, so forwarding
  it would switch existing deployments to a provider they never configured on
  the next deploy. The documentation states the gap; wiring it is a separate
  decision.
- No fix for the update handler creating a row when a `PATCH` carries no file,
  or for the create handler's unparsed `data` on the no-file path; both are
  outside this scope and reported separately.
- No exemption for PDFs from `sandbox`. Chromium does not render a PDF inside
  a sandboxed frame (SPS embeds none) and a 2024 report shows Safari 17.6
  rendering a directly opened sandboxed PDF as an empty page. The scope asks
  for the header on every response; the trade-off is documented and raised
  for a decision.

## Implementation Approach

Keep each change where its kind already lives: the delivery headers in the
static route of `apps/api/app.ts`, the body limit as route middleware of the
file model, the fetched-body limit in the `create-from-url` handler, the
limit in the file-storage environment module, and the error keyword in the
shared error mapping. Framework behavior goes into the `singlepage`
controller and handlers; the `startup` controller inherits it unchanged.

## Phase 1: Delivery headers for `/public/*`

### Overview

Every file response of the static route tells the browser not to sniff the
type and to treat a file opened as a document as sandboxed.

### Changes Required:

#### 1. Static route

**File**: `apps/api/app.ts`
**Why**: the route builds the headers for every served file (`:96-100`) and
is the single place files leave the API origin.
**Changes**: set `X-Content-Type-Options: nosniff` and
`Content-Security-Policy: sandbox` on the response headers used for both
`GET` and `HEAD`, with a comment stating what each header does and why
image, media and CSS background loads are unaffected.

#### 2. Scenario spec

**File**: `apps/api/specs/scenario/singlepagestartup/issue-304/backend-public-file-delivery.scenario.spec.ts` (new)
**Why**: the static route is composed inline in `app.ts`, and the scenario
lane is where the repository checks the booted API end to end.
**Changes**: upload an SVG through `POST /api/file-storage/files` with the
operator secret, read the returned path under `/public` with `GET` and
`HEAD`, and assert status, content type and both headers; delete the record
afterwards and assert the file is gone.

### Success Criteria:

#### Automated Verification:

- [x] Scenario spec passes against the worktree API. The runner
      (`SCENARIO_API_PORT=4304 npm run test:scenario:issue -- singlepagestartup 304`)
      stops at its HTTP-cache preflight while the shared Redis does not
      answer, so the suite ran through
      `npx jest -c apps/api/jest.scenario.config.ts apps/api/specs/scenario/singlepagestartup/issue-304`
- [x] Mutation: without the two header lines the scenario spec fails
- [x] Lint passes: `npx nx run api:eslint:lint`

#### Manual Verification:

- [x] `curl -I` on an uploaded SVG shows both headers
- [x] In a Chromium tab, an uploaded SVG with a script does not run it

---

## Phase 2: One file per upload request

### Overview

The create and update handlers refuse a request that carries more than one
file, with the message the error mapping already answers with 400.

### Changes Required:

#### 1. Create and update handlers

**Files**:
`libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/create/index.ts`,
`libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/update/index.ts`
**Why**: both keep the first of several file fields and answer success;
`parseBody()` hides repeated fields.
**Changes**: parse the body with `all: true` so repeated fields become
arrays, count every uploaded `File` in the body, and throw
`Validation error. Multiple files are not allowed` when there is more than
one, before anything is uploaded or written. The single-file path is
unchanged.

#### 2. Controller spec

**File**: `libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/index.spec.ts` (new)
**Why**: no spec covers these routes; driving the real controller through the
model `App` also proves the route composition of Phase 3.
**Changes**: build the model `App` with the real controller, a fake service
and a stub exception filter; mock `file-type` and the storage provider.
Scenarios: one file is stored and answers 201; two file fields, and one field
sent twice, answer 400 with nothing uploaded or written; the same on
`PATCH /:uuid`; an SVG upload is still accepted.

### Success Criteria:

#### Automated Verification:

- [x] Unit lane passes: `npx nx run @sps/file-storage:jest:test`
- [x] Mutation: without the file count check the multi-file scenarios fail
- [x] Lint passes: `npx nx run @sps/file-storage:eslint:lint`
- [x] Types check: `npx tsc --noEmit -p libs/modules/file-storage/tsconfig.json` (or the project's `tsc:build`)

#### Manual Verification:

- [x] A two-file `curl -F` upload answers 400 and creates no row

---

## Phase 3: Upload size limit

### Overview

One configurable limit bounds the multipart body of the upload routes and the
body `create-from-url` fetches.

### Changes Required:

#### 1. Environment value

**File**: `libs/shared/utils/src/lib/envs/file-storage.ts`
**Why**: environment values are read here with a documented default.
**Changes**: add `FILE_STORAGE_MAX_UPLOAD_BYTES`, default `50 * 1024 * 1024`,
with a comment naming what it bounds and Bun's 128 MiB request default.

#### 2. Route middleware

**Files** (new, mirroring `rbac/models/subject/backend/app/middlewares`):
`libs/modules/file-storage/models/file/backend/app/middlewares/index.ts`,
`.../middlewares/src/index.ts`,
`.../middlewares/src/lib/request-body-fits-upload-limit/index.ts`,
`.../middlewares/src/lib/request-body-fits-upload-limit/index.spec.ts`
**Why**: route middleware lives in the model's middleware package; Hono's
`bodyLimit` refuses a declared length before the body is read and counts a
chunked body while it streams.
**Changes**: a `Middleware` class whose `init()` returns `bodyLimit` with
`maxSize` from `FILE_STORAGE_MAX_UPLOAD_BYTES` and an `onError` that throws
the `HTTPException` produced by `getHttpErrorType` for a
`Payload Too Large error. The upload limit is N bytes` message. The package
exports it as
`RequestBodyFitsUploadLimit`. The spec covers a body under the limit, a
declared length over it (refused before the handler runs), a request with no
body, and the limit following the configured value.

#### 3. Controller wiring

**File**: `libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/index.ts`
**Why**: the controller composes route definitions, middleware instances and
handlers.
**Changes**: add the middleware to `POST /` and `PATCH /:uuid`.

#### 4. Error category

**Files**: `libs/shared/backend/utils/src/lib/http-error/type/index.ts`,
`libs/shared/backend/utils/src/lib/http-error/paterns/index.ts`,
`libs/shared/backend/utils/src/lib/http-error/index.spec.ts`, `README.md`
**Why**: an oversized body has its own status, 413, and the shared mapper is
where categories get their status; a chunked body over the limit fails inside
the handler with Hono's `Payload Too Large` message, which the mapping answers
with 500 today.
**Changes**: a `Payload Too Large error` category with status 413 matching
`/payload too large/i`, its cases in the spec, and a row in the root README's
category table. The middleware and both `create-from-url` checks throw that
category with the same message.

#### 5. Fetched body in `create-from-url`

**Files**:
`libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/create-from-url/index.ts`;
its scenarios live in the Phase 2 controller spec, which already builds the
model `App`
**Why**: the handler buffers whatever the URL returns.
**Changes**: read the fetched body through a method of the handler that
refuses a declared `Content-Length` above the limit before reading, counts a
body without one while it streams, and cancels the stream once it passes the
limit. The `fetch` call itself stays as it is for #307. The spec mocks
`fetch` for a declared length over the limit, an undeclared streamed body
over the limit and a body under it, and checks that nothing is uploaded when
the body is refused.

#### 6. Controller spec cases

**File**: the Phase 2 controller spec.
**Changes**: an over-limit multipart body with `Content-Length` and a chunked
one answer 413 on `POST /` and `PATCH /:uuid` with nothing uploaded or
written; a body under the limit is stored.

### Success Criteria:

#### Automated Verification:

- [x] Unit lanes pass: `npx nx run @sps/file-storage:jest:test`,
      `npx nx run @sps/backend-utils:jest:test`
- [x] Mutation: a pass-through middleware fails the middleware and
      controller over-limit scenarios; removing the fetched-body check fails
      the `create-from-url` scenarios
- [x] Lint passes for `@sps/file-storage`, `@sps/backend-utils`, `@sps/shared-utils`
- [x] Types check for the changed projects

#### Manual Verification:

- [x] An over-limit upload to the API on 4304 answers 413, with the default
      limit and with a lowered one
- [x] An upload under the limit still answers 201

---

## Phase 4: Configuration and documentation

### Overview

Operators can set the limit through the deployer, and the documentation
explains the limit, the headers and the production provider choice.

### Changes Required:

#### 1. Deployer and local environment

**Files**: `tools/deployer/api/api.env.j2`, `tools/deployer/api.sh`,
`tools/deployer/.env.example`, `apps/api/create_env.sh`
**Why**: a new variable is mirrored in the deployer template with the code
default and in the local environment script.
**Changes**: render and forward `FILE_STORAGE_MAX_UPLOAD_BYTES` with the
default `52428800`, document it in the example file, and add it to the local
`.env` the script writes.

#### 2. Documentation

**Files**: `libs/modules/file-storage/README.md`, `tools/deployer/README.md`
**Why**: the ticket asks for the production recommendation; the limit and the
headers need an operator-facing description.
**Changes**: a module section on uploads (one file per request under `file`,
the limit and its refusal, the delivery headers and their effect on
embedded media and on PDFs) and on storage providers (why `aws-s3` or
`vercel-blob` move uploads to another origin, the variables each needs). A
deployer section on file storage in production, including the current gap:
`api.sh` does not forward `FILE_STORAGE_PROVIDER`, so a deployment made with
it runs the local provider.

### Success Criteria:

#### Automated Verification:

- [x] `bash -n tools/deployer/api.sh apps/api/create_env.sh`
- [x] Prettier check on the changed Markdown and templates

#### Manual Verification:

- [x] The README text matches the implemented behavior

---

## Testing Strategy

### Unit Tests:

- Middleware: under the limit, declared length over it, no body, configured
  value.
- Controller routes through the model `App`: one file, several files (two
  fields, a repeated field) on create and update, over-limit bodies with and
  without `Content-Length`, SVG accepted.
- `create-from-url`: declared length over the limit, streamed body over it,
  body under it.
- Error mapping: `Payload Too Large` is a 413 `Payload Too Large error`.

### Integration Tests:

- Scenario spec for issue 304: upload, delivery headers on `GET` and `HEAD`,
  cleanup.

### Manual Testing Steps:

1. Boot the API from the worktree on 4304.
2. Upload a small SVG with the operator secret; `curl -I` its `/public` URL.
3. Upload a body above the limit; expect 413.
4. Open an SVG with a script in a Chromium tab; the script does not run.
5. Delete every fixture row and file.

## Use Cases That Keep Working

- Admin forms v1 and v2 upload one file under `file` (create and update).
- MCP `model-record-create` uploads one base64 file or calls
  `create-from-url`.
- RBAC social-module messages and the Telegram bot send several files to
  their own route, which calls create once per file.
- The AI-profile avatar update uploads one file.
- The ecommerce order update calls `generate`, which calls `create-from-url`
  with a host-generated image well under the limit.
- Images, video and audio embedded from the API origin; Telegram, LLM
  providers and the host image generator fetch the URL server-side; services
  that read `apps/api/public` from disk are untouched.
- Cross-origin API access: the CORS middleware still runs for `/public/*`.

## Performance Considerations

The body limit compares a header for ordinary uploads; only chunked bodies
are counted while they stream. The `create-from-url` read keeps the chunks it
receives and builds the same `Blob` as before.

## Migration Notes

- A downstream `startup` controller that rebinds the file routes keeps its own
  route list; it adds `RequestBodyFitsUploadLimit` to its upload routes.
- A project whose uploads exceed 50 MiB sets `FILE_STORAGE_MAX_UPLOAD_BYTES`;
  above 128 MiB it also raises Bun's `maxRequestBodySize`.
- A client that sent several files in one request, or a repeated `file`
  field, now receives 400 and sends one file per request.
- A project that relies on a sandboxed PDF opening inline in Safari, or on
  framing uploaded files, reviews the header behavior.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-304.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-304.md`
