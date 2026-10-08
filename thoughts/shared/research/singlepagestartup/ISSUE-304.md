---
date: 2026-09-26T00:09:11+03:00
researcher: flakecode
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-304-upload-delivery
repository: singlepagestartup
topic: "Harden upload validation and static file delivery"
tags: [research, codebase, file-storage, uploads, static-files, apps-api, hono, deployer, security]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Harden upload validation and static file delivery

**Date**: 2026-09-26T00:09:11+03:00
**Researcher**: flakecode
**Git Commit**: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
**Branch**: claude/issue-304-upload-delivery
**Repository**: singlepagestartup

## Research Question

The ticket (`thoughts/shared/tickets/singlepagestartup/ISSUE-304.md`, findings
N-03, SEC-31 and SEC-10 of the 2026-09-25 security review) states that the
file-storage upload routes accept any content with no size cap, that the local
provider writes uploads under the API's public folder, that `/public/*`
serves them from the API origin without `nosniff` or a
`Content-Security-Policy`, and that the multipart create handler stores only
the first of several files. The agreed scope ("Scope after review") keeps SVG
allowed and asks for: `X-Content-Type-Options: nosniff` and
`Content-Security-Policy: sandbox` on every `/public/*` response, a
configurable size cap on the upload routes, the multi-file early `return`
fixed, and documentation that production should store uploads with the
`aws-s3` or `vercel-blob` provider.

This research verifies each claim against the tree, finds every caller of the
code that will change, and records the constraints the fix has to respect.

## Summary

- The static route is inline in `apps/api/app.ts:69-114`. It sets only
  `Content-Type` (from `Bun.file(...).type`, which is derived from the file
  extension) and `Content-Length`, reads the whole file into memory for `GET`,
  and has no security headers. It is registered after CORS and before every
  other middleware, so no request-id, observer, cache or authorization
  middleware runs for `/public/*`.
- The local provider writes to `<cwd>/public/<FILE_STORAGE_FOLDER>` and returns
  the path `/<folder>/<name>.<ext>`; clients prefix it with
  `${NEXT_PUBLIC_API_SERVICE_URL}/public`. The API runs with `cwd` `apps/api`,
  so uploads land in `apps/api/public/file-storage/{static,dynamic}` and are
  served from the API origin.
- Three handlers accept uploaded bytes: `POST /` (create), `PATCH /:uuid`
  (update) and `POST /create-from-url`. None has a size cap; the only bound
  today is Bun's default `maxRequestBodySize` of 128 MiB for request bodies,
  and none for the body `create-from-url` fetches. SVG is accepted through an
  explicit `.svg` fallback after `file-type` finds no signature.
- Both multipart handlers collect every `File` field into a map keyed by field
  name and `return` inside the loop after the first entry. Several distinct
  file fields are therefore reduced to the first silently; a repeated field
  keeps only the last value (Hono's `parseBody()` default), and a `file[]`
  array is never collected at all. The existing message
  `Validation error. Multiple files are not allowed` (already mapped to 400)
  is unreachable.
- Every caller sends at most one file per request, under the field name
  `file`, and reads a single entity back. The file table has one file column
  (`file`, `notNull().unique()`). The single-file contract is the current
  API contract; a request with several files has no column to store them in.
- Route middlewares are registered with `hono.use(route.path, ...)`, so they
  run for every method on a matching path; a middleware on `PATCH /:uuid` also
  runs on `GET /:uuid`, `DELETE /:uuid`, `/count`, `/generate` and
  `/create-from-url`.
- Hono 4.10.4 ships `bodyLimit` (`hono/body-limit`). It refuses by
  `Content-Length` before the body is read, and for a chunked body it counts
  bytes while the handler reads and errors the stream with
  `BodyLimitError: Payload Too Large`. Inside an SPS handler that error is
  caught and mapped by `getHttpErrorType`, which today maps that message to 500.
- Uploaded files are rendered by `<img>` (through `next/image` with
  `unoptimized: true`), `<video>`, `<audio>`, and a plain link that opens
  other types in a new tab. Server-side consumers (Telegram, LLM providers,
  the host image generator) fetch the URL or read the file from disk.
- `nosniff` applies only to script and style loads, and a CSP header applies
  only to documents and workers, so neither changes `<img>`, `<video>`,
  `<audio>` or CSS background loads (A8). Bare `sandbox` gives a file opened
  as a document an opaque origin with scripts disabled. The one rendering
  affected is a PDF shown inside a frame (blank in Chromium) or, per a 2024
  report, opened directly in Safari.
- The deployer does not forward `FILE_STORAGE_PROVIDER` to the API container,
  and it forwards the bucket as `AWS_S3_BUCKET` while the S3 provider reads
  `AWS_S3_BUCKET_NAME`. A deployment made with `tools/deployer/api.sh` runs the
  local provider regardless of the provider set in the deployer environment.

## Detailed Findings

### A1. Static delivery in `apps/api/app.ts`

- `app.ts:41-64` registers the CORS middleware for every path, so it also
  runs for `/public/*`.
- `app.ts:66-67` registers the `ExceptionFilter` as the app error handler.
- `app.ts:69-114` is the `/public/*` route for `GET` and `HEAD`:
  - `:70-76` decodes and normalizes the path and refuses `..`.
  - `:78-81` tries two roots: `<cwd>/public` and `<cwd>/apps/api/public`.
  - `:86-88` skips a resolved path outside the root.
  - `:96-100` builds the response headers: `Content-Type` from
    `Bun.file(filePath).type` when present, and `Content-Length`.
  - `:102-106` answers `HEAD` with the headers and no body.
  - `:108-110` answers `GET` with `await file.arrayBuffer()`, the whole file
    in memory.
  - `:113` falls through to `c.notFound()`.
- `app.ts:116-178` registers request-id, observer, the websocket route,
  revalidation, the optional HTTP cache, the action logger, `is-authorized`,
  bill-route and parse-query after the static route, so none of them runs for
  `/public/*`.
- The route replaced `serveStatic({ root: "./" })` from `hono/bun` in commit
  `1ec3d43cb0` ("Implement threaded SPS chat and Telegram flows").
- `Bun.file(...).type` for the common extensions: `image/svg+xml`, `image/png`,
  `image/jpeg`, `image/webp`, `image/gif`, `video/mp4`, `video/webm`,
  `audio/mpeg`, `audio/ogg`, `audio/x-wav`, `audio/x-m4a`,
  `text/plain;charset=utf-8`, `application/pdf`, `text/html;charset=utf-8`,
  `application/octet-stream` for an unknown or missing extension (checked with
  Bun 1.3.6).
- `apps/api/public/file-storage/static/` holds 47 tracked files (seed media,
  including `1205d017.svg` and several `.txt` files).
- `libs/middlewares/src/lib/is-authorized/routes/singlepage.ts:40` allows
  `/public/file-storage/.*`, although the static route answers before that
  middleware is reached.

### A2. The local provider and where uploads land

- `libs/providers/file-storage/src/lib/local/index.ts:11-19`: `filesPath` is
  `join(process.cwd(), "public", folder)`; `baseUrl` is the folder.
- `:25-57` `uploadFile`: takes the extension from `file.name`, generates a
  random hexadecimal name, creates the folder on demand, reads the whole file
  with `arrayBuffer()`, writes it and returns `/<folder>/<name>.<ext>`.
- `apps/api/project.json` runs `dev` and `start` with `cwd: apps/api`, so the
  provider writes to `apps/api/public/<folder>`.
- `libs/shared/utils/src/lib/envs/file-storage.ts:1-18`:
  `FILE_STORAGE_PROVIDER` (`local` unless `vercel-blob` or `aws-s3`),
  `FILE_STORAGE_FOLDER` (default `file-storage/static`),
  `BLOB_READ_WRITE_TOKEN`.
- `libs/providers/file-storage/src/lib/index.ts:7-52` selects the provider;
  `aws-s3` requires `AWS_REGION` and `AWS_S3_BUCKET_NAME`
  (`libs/shared/utils/src/lib/envs/third-party-services.ts:3-4`) and uploads
  with `ACL: "public-read"` to `https://<bucket>.s3.amazonaws.com/<key>`
  (`aws-s3/index.ts:62-71`); `vercel-blob` uploads with `access: "public"` and
  returns the blob URL (`vercel-blob/index.ts:46-55`). Both return absolute
  `https` URLs on another origin.

### A3. Upload handlers

Controller: `libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/index.ts:20-61`
binds `POST /` → create (`:36-40`), `POST /generate` (`:41-45`),
`POST /create-from-url` (`:46-50`), `PATCH /:uuid` → update (`:51-55`),
`DELETE /:uuid`. The startup controller
(`controller/startup/index.ts`) extends it without changes.

`create/index.ts`:

- `:19` `c.req.parseBody()` with Hono's defaults (`all: false`).
- `:34-47` collects values that are `instanceof File` into
  `parsedBody.files[fieldName]`; an array value (a repeated field ending in
  `[]`) is not a `File` and is skipped.
- `:49-60` with no file, calls `service.create({ data: parsedBody.data })`
  before `data` is parsed (`:62-66`), so `data` is `undefined` there.
- `:68-127` loops over the files and `return`s a 201 inside the first
  iteration (`:121-126`); `:69-71` (`Array.isArray`) and `:73-75`
  (`typeof file === "string"`) cannot trigger because only `File` values were
  collected; `:129` is unreachable when a file exists.
- `:79-95` reads the file with `arrayBuffer()`, detects the type with
  `fileTypeFromBuffer`, falls back to `image/svg+xml` for a `.svg` name with no
  signature, and keeps the browser-sent type for `audio/*`.
- `:107-117` stores the returned URL under the field name
  (`data[name] = uploadedFileUrl`).

`update/index.ts`:

- `:25` `parseBody()`; `:40-53` the same collection; `:55-59` parses `data`.
- `:61-72` with no file, calls `service.create` (not `update`) and answers 201.
- `:74-140` loops and `return`s inside the first iteration (`:134-139`),
  uploading, updating the row and deleting the previous stored file.

`create-from-url/index.ts`:

- `:25-33` requires a `data` JSON field with `url`.
- `:35-45` `fetch(data.url)`, then `res.blob()`, then builds a `File` named
  after the last URL segment. No status check and no size bound.
- `:51-58` uploads through the provider; `:60-84` detects type and size.
- URL validation for this route is owned by issue #307.

`generate/index.ts:46-56` calls the server SDK `createFromUrl` with a URL on
the host's image generator and the operator secret.

### A4. Hono body parsing and body limits

- `node_modules/hono/dist/utils/body.js` (Hono 4.10.4): `parseBody` keeps the
  last value of a repeated key unless `all: true` or the key ends in `[]`,
  in which case values are collected into an array.
- `node_modules/hono/dist/middleware/body-limit/index.js`: `bodyLimit({ maxSize, onError })`
  skips requests with no body; with `Content-Length` and no
  `Transfer-Encoding` it compares the header and calls `onError` without
  reading; otherwise it wraps the body in a counting stream that errors with
  `BodyLimitError("Payload Too Large")` once `maxSize` is exceeded, and after
  `next()` replaces the response only when `c.error` is that
  `BodyLimitError`.
- Probe with Bun 1.3.6 (scratch script, not committed): `fetch` with a
  `FormData` body sends `Content-Length`; an over-limit body with
  `Content-Length` is refused before the handler runs; an over-limit chunked
  body reaches the handler, and `parseBody()` rejects with
  `BodyLimitError: Payload Too Large`. An under-limit chunked multipart body
  parses normally.
- `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts:96-121`: the
  400 Validation list includes `/multiple files are not allowed/i` (`:119`)
  and `/files are not supported/i` (`:118`); no entry matches
  `Payload Too Large`, so `getHttpErrorType` returns 500 with
  `Internal server error: Payload Too Large`
  (`http-error/index.ts:125-130`).
- `libs/shared/backend/api/src/lib/filters/exception/index.ts:27` takes the
  status from an `HTTPException`; `:64-105` sends a Telegram bug report for
  every status of 500 or above when the bug-service variables are set.
- `apps/api/server.ts:42-47` calls `serve()` without `maxRequestBodySize`;
  Bun's default is `1024 * 1024 * 128`
  (`node_modules/bun-types/bun.d.ts:3934-3936`).

### A5. Route middleware registration

- `libs/shared/backend/api/src/lib/app/default/index.ts:72-82`: for each
  route with `middlewares`, `this.hono.use(route.path, middleware)`, then
  `this.hono.on(route.method, route.path, route.handler)`. The middleware runs
  for every method on the path, and a `/:uuid` pattern matches every single
  segment path of the model router.
- `libs/shared/backend/api/src/lib/controllers/interface.ts:14-19`:
  `IHttpRoute.middlewares?: ReturnType<typeof createMiddleware>[]`.
- The only model-level route middleware package is
  `libs/modules/rbac/models/subject/backend/app/middlewares/` (`index.ts`,
  `src/index.ts`, `src/lib/<name>/index.ts`, no `project.json`), imported by
  the controller as `../../../../../middlewares`
  (`rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:7-13`).
  Its classes expose `init()` returning a Hono middleware and export
  `IMiddlewareGeneric`. The module projects (`@sps/rbac`, `@sps/file-storage`)
  lint, type-check and test every file under the module
  (`libs/modules/file-storage/tsconfig.json`, `jest.config.ts`).

### A6. Callers of the upload routes

Every caller sends at most one `File` per request, under the field name
`file`, and reads one entity back:

- Admin forms v1 and v2:
  `file-storage/models/file/frontend/component/src/lib/singlepage/admin/form/ClientComponent.tsx:55-64,103-110`
  and `admin-v2/form/ClientComponent.tsx` use one `FormField type="file" name="file"`
  and the client SDK `create`/`update`.
- Client and server SDKs use the shared factories; the serializer
  `libs/shared/utils/src/lib/preapare-form-data-to-send.ts:1-36` puts the
  non-file values in a `data` JSON field and appends each `File` under its key
  (a `File[]` becomes a repeated field).
- RBAC social-module messages accept several files on their own route and
  call `POST /api/file-storage/files` once per file
  (`rbac/.../chat/find-by-id/message/create.ts:184-214`, `message/update.ts:108-138`).
  The Telegram bot sends albums and voice notes through that route
  (`apps/telegram/src/lib/telegram-bot.ts:2010-2045,2120-2131`).
- The AI-profile avatar update creates one file per request
  (`rbac/.../profile/find-by-id/avatar/update.ts:95-106`).
- MCP `model-record-create` uploads one base64-decoded file with a manual
  `FormData` (`data` and `file`) or calls `createFromUrl`
  (`apps/mcp/lib/content-management/file-storage.ts:142-172,174-240`).
- The ecommerce order update calls `generate`, which calls `create-from-url`
  with a host image-generator URL
  (`ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/update/index.ts:196-243,318-364`).

Existing tests around these routes: none for the four handlers. The MCP
operations spec (`apps/mcp/lib/content-management/operations.spec.ts:373-509`)
and the avatar spec (`rbac/.../avatar/update.spec.ts:80-125`) assert the
request shape callers send. `libs/modules/file-storage/**` has three specs,
all structural.

### A7. Consumers of served files

- `file-storage/models/file/frontend/component/src/lib/singlepage/default/Component.tsx:8-10`
  builds `${NEXT_PUBLIC_API_SERVICE_URL}/public${file}` for relative paths;
  `:58-80` renders images with `next/image`, `:82-94` video with `<source>`,
  `:96-111` audio with `<source>`, `:113-127` any other type as a link with
  `target="_blank"`.
- `apps/host/next.config.js:29-31`: `images.unoptimized: true`, so the
  browser loads images from the API origin directly.
- The same URL shape is built by the admin forms, the social chat-profile
  avatar component, `rbac/.../notify.ts:134` (sent to Telegram) and the agent
  service (sent to LLM providers).
- `react-by-openrouter.ts:3342`, `audio-transcription.ts:685` and the
  notification service (`notification/.../service/singlepage/index.ts:618-627`)
  read files from `apps/api/public` on disk.
- The host image generator (`apps/host/app/api/image-generator/...`) renders
  templates that reference `/public` files server-side.

### A8. Browser behavior of `nosniff` and `CSP: sandbox`

- `X-Content-Type-Options: nosniff` is checked by the Fetch standard only for
  `script`-like and `style` destinations
  ([Fetch, X-Content-Type-Options](https://fetch.spec.whatwg.org/#x-content-type-options-header);
  [MDN](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/X-Content-Type-Options)).
  Image, video, audio and CSS background loads have other destinations and
  are not blocked by it; a `fetch()` in `cors` mode has an empty destination
  and is not affected either.
- For cross-origin `no-cors` loads (the host page embedding
  `api.<domain>/public/...`), opaque response blocking
  ([ORB](https://github.com/annevk/orb/blob/main/README.md)) lets
  `image/svg+xml` through as an opaque-safelisted type and admits images,
  audio and video by sniffing their signatures. With `nosniff`, a
  `text/plain` or `text/html` response is blocked in an `<img>`; those types
  are not embedded as images by SPS.
- A `Content-Security-Policy` header applies to a document or a worker
  ([CSP3](https://www.w3.org/TR/CSP3/#intro)); on an image, video, audio or
  background-image response it has nothing to attach to and is ignored.
- Bare `sandbox` sets every sandboxing flag
  ([MDN, CSP sandbox](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/sandbox);
  [CSP3 sandbox](https://www.w3.org/TR/CSP3/#directive-sandbox)): the document
  gets an opaque origin, and scripts, forms, popups and plugins are disabled.
  An SVG with `<script>` opened in a tab does not run the script, and a script
  in an opaque origin could not read the serving origin's cookies or storage.
- `raw.githubusercontent.com` serves user content with
  `x-content-type-options: nosniff` and
  `content-security-policy: default-src 'none'; style-src 'unsafe-inline'; sandbox`
  ([urlscan capture](https://urlscan.io/result/70b18657-387c-4f59-a6ce-ca37cfdc35d4));
  [web.dev](https://web.dev/articles/securely-hosting-user-data) describes the
  same pair for user uploads.
- Neither header takes part in `Range` handling for media seeking.
- PDFs: Chromium does not run its PDF viewer inside a sandboxed frame, so an
  `<iframe>`, `<embed>` or `<object>` of a sandboxed PDF stays blank
  ([Chromium 41131921](https://issues.chromium.org/issues/41131921);
  [WHATWG html#3958](https://github.com/whatwg/html/issues/3958)). Opened
  directly in a tab, Chrome and Firefox render it; Safari 17.6 was reported to
  show an empty page
  ([adobe/aem-core-wcm-components#2839](https://github.com/adobe/aem-core-wcm-components/issues/2839),
  August 2024). Current Safari behavior is unconfirmed. SPS embeds no uploaded
  file in a frame (no `<iframe>`, `<embed>` or `<object>` in `libs` or
  `apps/host`) and opens PDFs only through the default variant's
  `target="_blank"` link.

### A9. Deployment configuration

- `tools/deployer/api/api.env.j2:10` renders `FILE_STORAGE_FOLDER` (default
  `file-storage/dynamic`); `:56-62` render `AWS_S3_BUCKET` and
  `BLOB_READ_WRITE_TOKEN` when defined. `FILE_STORAGE_PROVIDER` and
  `AWS_S3_BUCKET_NAME` are not rendered.
- `tools/deployer/api.sh:16,44,47,129,153-154` reads and forwards
  `FILE_STORAGE_FOLDER`, `AWS_S3_BUCKET` and `BLOB_READ_WRITE_TOKEN` only.
- `tools/deployer/.env.example:47-49` sets `FILE_STORAGE_PROVIDER=vercel-blob`
  with a placeholder token; `.github/workflows/ansible.yml:53,172` write a
  `FILE_STORAGE_PROVIDER` secret into the deployer environment. Neither value
  reaches the API container today.
- `apps/api/create_env.sh:24,94` sets `FILE_STORAGE_FOLDER=file-storage/static`
  and `FILE_STORAGE_PROVIDER=local` for local development;
  `apps/api/.env.production:15-16` sets `local` and `file-storage/dynamic`.
- Numeric variables with a code default are mirrored in the template with the
  same default through Jinja's `default` filter, for example
  `RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS` (`api.env.j2:24`, `api.sh:28,135`).

### Verification of the ticket's claims

| Claim                                                                            | Status                 | Evidence                                                                                                                                |
| -------------------------------------------------------------------------------- | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Both upload routes detect the type with `file-type` and accept `.svg` explicitly | confirmed              | `create/index.ts:80-87`, `create-from-url/index.ts:61-68`; also `update/index.ts:95-102`                                                |
| No size cap                                                                      | confirmed              | no limit in the handlers, controller or app; Bun's 128 MiB request default only                                                         |
| Local provider writes under `<cwd>/public/<folder>`                              | confirmed              | `local/index.ts:12-17`                                                                                                                  |
| `/public/*` has no `nosniff`, `Content-Disposition` or CSP                       | confirmed              | `app.ts:96-100`                                                                                                                         |
| Content type comes from the extension                                            | confirmed              | `Bun.file(...).type` at `app.ts:97-98`                                                                                                  |
| Whole file read into memory                                                      | confirmed              | `app.ts:108`                                                                                                                            |
| Multi-file create stores the first and answers 201                               | confirmed, with detail | `create/index.ts:68-127`; a repeated field keeps the last file, a `file[]` array is dropped; `update/index.ts:74-140` has the same loop |

## Code References

- `apps/api/app.ts:69-114` - `/public/*` static route
- `apps/api/app.ts:96-100` - response headers for served files
- `apps/api/server.ts:42-47` - Bun `serve()` without `maxRequestBodySize`
- `libs/providers/file-storage/src/lib/local/index.ts:11-57` - local provider paths and upload
- `libs/shared/utils/src/lib/envs/file-storage.ts:1-18` - file-storage environment values
- `libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/index.ts:20-61` - file routes
- `libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/create/index.ts:19-133` - multipart create
- `libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/update/index.ts:25-146` - multipart update
- `libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/create-from-url/index.ts:19-102` - create from URL
- `libs/modules/file-storage/models/file/backend/repository/database/src/lib/fields/singlepage.ts:6` - single `file` column
- `libs/shared/backend/api/src/lib/app/default/index.ts:72-82` - route middleware registration
- `libs/modules/rbac/models/subject/backend/app/middlewares/src/index.ts` - model-level middleware package pattern
- `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts:96-121` - 400 validation keywords
- `libs/shared/utils/src/lib/preapare-form-data-to-send.ts:1-36` - SDK multipart serializer
- `libs/modules/file-storage/models/file/frontend/component/src/lib/singlepage/default/Component.tsx:8-127` - rendering of stored files
- `tools/deployer/api/api.env.j2:10,56-62` and `tools/deployer/api.sh:16,44,47` - file-storage values forwarded to the API

## Architecture Documentation

- App-level HTTP behavior (CORS, the static route, the global middleware
  order) is composed inline in `apps/api/app.ts`; module routers are mounted
  with `app.route(...)`.
- A model controller composes route definitions, middleware instances and
  handler classes; handlers catch errors and rethrow
  `HTTPException(status)` from `getHttpErrorType`, which classifies by message
  keyword.
- Route middleware for a model lives in
  `<module>/models/<model>/backend/app/middlewares/src/lib/<name>/index.ts` as
  a class with `init()`; the rbac subject model is the existing example.
- Environment values are read in `libs/shared/utils/src/lib/envs/*.ts` with a
  code default, and mirrored in the deployer template with the same default.
- Behavior tests drive middlewares and handlers through a throwaway `Hono`
  instance with `hono.request(...)`, mocking `@sps/shared-utils` with getters
  (`libs/middlewares/src/lib/operator-secret/index.spec.ts`). The API
  scenario lane (`apps/api/specs/scenario/<project>/issue-<n>/`) runs specs
  against a booted API (`tools/testing/test-scenario-issue.sh`, which reuses an
  API already listening on its preferred port).
- Existing `apps/api/specs/*` unit specs read `app.ts` as text; the README's
  testing convention lists that as an anti-pattern for new tests.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-213.md` and `ISSUE-211.md`
  describe the create, update and delete handlers uploading or deleting the
  stored object before the database write.
- `thoughts/shared/research/singlepagestartup/ISSUE-189.md` and the ISSUE-209
  research, plan and progress files document the Telegram voice-note and
  avatar flows that create file records through these routes.
- `thoughts/shared/research/singlepagestartup/ISSUE-233.md` (A9) records the
  same `apps/api/app.ts` middleware order, with the static route before
  request-id.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-233.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-213.md`

## Open Questions

None blocking. Observed outside the agreed scope:

- `update/index.ts:61-72` calls `service.create` when a `PATCH` carries no
  file, so a metadata-only edit creates a row instead of updating one.
- `create/index.ts:49-60` creates with `data` still unparsed when no file is
  sent.
- `apps/api/app.ts:108` buffers each served file whole and supports no
  `Range`, `ETag` or `Cache-Control` (SEC-10).
- The deployer does not forward `FILE_STORAGE_PROVIDER` or
  `AWS_S3_BUCKET_NAME` to the API (A9).

## Known Pitfalls (from implementation)

### Mutation run hung on an endless stream

- **Occurrences**: 2
- **Stage**: Phase 3 - Upload size limit
- **Symptom**: with the `create-from-url` limit removed, the controller spec
  produced no result: one run printed nothing, the next never ended and was
  killed. A retry wrapped in `timeout` did nothing, because macOS has no
  `timeout` binary.
- **Root Cause**: the scenario fed an endless `ReadableStream`; without the
  limit, `res.blob()` kept reading and jest's timeout never fired.
- **Fix**: the stream ends after 20 chunks of 100 bytes, over the 256-byte test
  limit, so the mutation fails the assertions instead of hanging.
- **Reusable Pattern**: give guard tests finite over-limit inputs, and do not
  rely on `timeout` on macOS.
