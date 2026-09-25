---
issue_number: 304
issue_title: "Harden upload validation and static file delivery"
start_date: 2026-09-25T21:17:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-304.md
status: in_progress
---

# Implementation Progress: ISSUE-304 - Harden upload validation and static file delivery

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-304.md`

## Phase Progress

### Phase 1: Delivery headers for `/public/*`

- [x] Started: 2026-09-26
- [x] Completed: 2026-09-26
- [x] Automated verification: PASSED

**Notes**:

- `apps/api/app.ts`: `X-Content-Type-Options: nosniff` and
  `Content-Security-Policy: sandbox` on the headers of every served file
  (`GET` and `HEAD`), with a comment on their effect.
- Scenario spec `apps/api/specs/scenario/singlepagestartup/issue-304/backend-public-file-delivery.scenario.spec.ts`:
  `API_SERVICE_URL=http://localhost:4304 npx jest -c apps/api/jest.scenario.config.ts apps/api/specs/scenario/singlepagestartup/issue-304`
  → 3 passed (upload, `GET` headers, `HEAD` headers, delete then 404).
- Mutation: with the two header lines removed (the watched API reloaded in
  9 s), the `GET` and `HEAD` scenarios failed and the delete scenario passed;
  restored, reloaded in 8 s.
- `curl -I` on an uploaded SVG: `HTTP/1.1 200 OK`,
  `Content-Type: image/svg+xml`, `X-Content-Type-Options: nosniff`,
  `Content-Security-Policy: sandbox`.
- Chromium (Browser pane), SVG with `<script>` opened in a tab: title stayed
  empty, console "Blocked script execution ... the document's frame is
  sandboxed", `self.origin` `null`, `document.cookie` and `localStorage`
  threw `SecurityError`.
- Chromium, page on `http://127.0.0.1:4399` embedding API files: SVG and PNG
  `<img>` decoded (8x8, 1024 wide), PNG CSS background rendered (screenshot),
  MP4 `<video>` `readyState` 4 and 64 px wide, MP3 `<audio>` `readyState` 4 and
  1 s long, no media errors.
- Chromium, the same PDF opened in a tab: renders from the API with
  `sandbox`, as it does from the static server without the header.

### Phase 2: One file per upload request

- [x] Started: 2026-09-26
- [x] Completed: 2026-09-26
- [x] Automated verification: PASSED

**Notes**:

- `create/index.ts` and `update/index.ts`: `parseBody({ all: true })` and a
  file count that throws `Validation error. Multiple files are not allowed`
  when it is above one.
- Controller spec `controller/singlepage/index.spec.ts` (model `App`, real
  controller, fake service, provider and `file-type` mocked): 11 scenarios
  pass, including two fields, a repeated field and a two-file update.
- Mutation: without the count check, the three multi-file scenarios failed;
  restored.
- `curl` with two files: `400`,
  `Validation error. Multiple files are not allowed`, no record.

### Phase 3: Upload size limit

- [x] Started: 2026-09-26
- [x] Completed: 2026-09-26
- [x] Automated verification: PASSED

**Notes**:

- `FILE_STORAGE_MAX_UPLOAD_BYTES` in `libs/shared/utils/src/lib/envs/file-storage.ts`
  (default `50 * 1024 * 1024`).
- New `libs/modules/file-storage/models/file/backend/app/middlewares/`
  (`RequestBodyFitsUploadLimit`, wrapping Hono `bodyLimit`), added to
  `POST /` and `PATCH /:uuid`.
- `/payload too large/i` added to the 400 validation keywords.
- `create-from-url`: `readBody` refuses a declared length over the limit and
  cancels a streamed body once it passes it.
- The `create-from-url` scenarios live in the controller spec with the other
  routes, not in a separate `create-from-url/index.spec.ts`: they share the
  app harness.
- Middleware spec: 5 passed. Mutation (pass-through middleware): the two
  over-limit middleware scenarios and the three over-limit route scenarios
  failed; restored.
- Mutation (`res.blob()` instead of `readBody`): the two `create-from-url`
  over-limit scenarios failed; restored.
- Mutation (keyword removed): the chunked create scenario and the
  `Payload Too Large` case of the error-mapping spec failed; restored.
- `curl` on the API (Bun) with the default limit: 53,477,376-byte upload →
  `400` in 0.07 s with 0 bytes uploaded,
  `Validation error. Payload Too Large. The upload limit is 52428800 bytes`;
  the same upload chunked → `400` in 0.2 s, `Payload Too Large`;
  `create-from-url` of the 51 MiB file → `400` in 0.02 s; of a 111-byte SVG
  → `201`, `image/svg+xml`.
- API restarted with `FILE_STORAGE_MAX_UPLOAD_BYTES=4096`: 8,586-byte MP3 →
  `400` ("The upload limit is 4096 bytes"), 111-byte SVG → `201`.

### Phase 4: Configuration and documentation

- [x] Started: 2026-09-26
- [x] Completed: 2026-09-26
- [x] Automated verification: PASSED

**Notes**:

- `tools/deployer/api/api.env.j2`, `tools/deployer/api.sh`,
  `tools/deployer/.env.example`, `apps/api/create_env.sh`: the new variable
  with the default `52428800`.
- `libs/modules/file-storage/README.md` section 4 and
  `tools/deployer/README.md` "File storage".
- `bash -n tools/deployer/api.sh` and `bash -n apps/api/create_env.sh`: OK.
- Prettier check on every changed file: clean.

## Verification Summary

- Unit lanes: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run-many --target=jest:test --projects=@sps/file-storage,@sps/backend-utils,@sps/shared-utils,api --parallel=2 --skip-nx-cache`
  → shared-utils 74, backend-utils 127, api 4, file-storage 22 tests passed.
- Integration lanes: `npx nx run-many --target=jest:integration --projects=@sps/file-storage,api`
  → 3 and 6 tests passed.
- Lint: `NODE_OPTIONS=--max-old-space-size=12288 npx nx run-many --target=eslint:lint --projects=@sps/shared-utils,@sps/backend-utils,@sps/file-storage,api --parallel=2 --skip-nx-cache`
  → 0 errors; 2 existing warnings in `apps/api/jest.integration.config.ts`
  and `apps/api/jest.scenario.config.ts`.
- Types: `npx tsc --noEmit -p` for `libs/modules/file-storage`,
  `libs/shared/utils` and `libs/shared/backend/utils` → exit 0;
  `apps/api/tsconfig.json` → the same 25 errors as before the change (none in
  changed code; one existing error moved from `create-from-url/index.ts:57`
  to `:61`).
- Placement: `node tools/agents/code-placement.mjs` → no same-name file and
  folder pairs.
- Fixtures: every record created for the proofs was deleted through the API
  (`200`, then `404` for the record and its `/public` URL);
  `git status --short apps/api/public` is empty. The API on 4304 and the
  static server on 4399 are stopped.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 4 -->

### Incident 1 — Blob return type conflicts in the API program

- **Occurrences**: 1
- **Stage**: Phase 3 - Upload size limit
- **Symptom**: `tsc -p apps/api/tsconfig.json` gained two errors at
  `create-from-url/index.ts` ("Type 'Blob' is missing ... json, formData")
  while the module program passed.
- **Root Cause**: the API program loads `bun-types`, whose `Blob` differs from
  the DOM `Blob` returned by `Response.blob()` and `new Blob()`; an explicit
  `Promise<Blob>` return type picked Bun's.
- **Fix**: removed the explicit return type so `readBody` returns what
  `Response.blob()` returns; typed the chunks as `Uint8Array<ArrayBuffer>[]`.
- **Reusable Pattern**: compare the API program's error list with the
  baseline (stash, run, pop) rather than expecting it to be clean; avoid
  annotating `Blob` in code the API compiles.

### Incident 2 — Mutation run hung on an endless stream

- **Occurrences**: 2
- **Stage**: Phase 3 - Upload size limit
- **Symptom**: with the `create-from-url` limit removed, the controller spec
  produced no result: the first run printed nothing, the second never ended
  and was killed (exit 143). A later attempt wrapped in `timeout` did nothing,
  because macOS has no `timeout` binary.
- **Root Cause**: the scenario fed an endless `ReadableStream`; without the
  limit, `res.blob()` kept reading and jest's timeout never fired.
- **Fix**: the stream now ends after 20 chunks of 100 bytes, over the 256-byte
  test limit, so the mutation fails the assertions (2 failed) instead of
  hanging.
- **Reusable Pattern**: give guard tests finite over-limit inputs; do not
  rely on `timeout` on macOS.

### Incident 3 — Scenario filter not applied through Nx

- **Occurrences**: 1
- **Stage**: Phase 1 - Delivery headers
- **Symptom**: `npx nx run api:jest:scenario --testPathPattern=issue-304` ran
  every scenario suite against the 4304 API.
- **Root Cause**: the option was not forwarded to jest by the Nx executor.
- **Fix**: ran `npx jest -c apps/api/jest.scenario.config.ts apps/api/specs/scenario/singlepagestartup/issue-304`.
  The other suites failed before writing (missing
  `RBAC_SUBJECT_IDENTITY_EMAIL` in the worktree `.env`); the issue-160 suite
  created one product and deleted it in `afterAll`.
- **Reusable Pattern**: run one scenario suite through the jest CLI with the
  scenario config and the issue directory.

### Incident 4 — Shared Redis does not answer

- **Occurrences**: 1
- **Stage**: Phase 1 - Delivery headers
- **Symptom**: `npm run test:scenario:issue -- singlepagestartup 304` stopped
  at the HTTP-cache preflight with `500`; the API logged
  "Stream isn't writeable and enableOfflineQueue options is false" and
  repeated "Command timed out".
- **Root Cause**: `sps-lite-redis-1` (localhost:6384) accepts TCP but answers
  no RESP command (a raw `PING` gets no reply; another agent's Redis on 6406
  answers `-NOAUTH` at once).
- **Fix**: ran the issue-304 suite through the scenario jest config against
  the 4304 API; the suite does not use the cache. The shared Redis was left
  untouched and is reported to the lead.
- **Reusable Pattern**: probe `(printf 'PING\r\n'; sleep 2) | nc localhost 6384`
  before blaming the cache middleware.

## Summary

### Changes Made

- Delivery headers on `/public/*` (`apps/api/app.ts`).
- One file per multipart request on create and update.
- `FILE_STORAGE_MAX_UPLOAD_BYTES` with a model route middleware, a 400
  keyword for Hono's body-limit error, and a capped read in `create-from-url`.
- Deployer, local environment and README changes.
- Specs: middleware, controller routes, error mapping, issue-304 scenario.

### Commits

- `473c88d29c` fix(file-storage): serve uploads sandboxed and limit upload size and count

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-25T21:58:16Z
