Closes #304.

## Summary

Files stored by the `local` file-storage provider are served by the API itself under `/public`. An uploaded SVG or HTML file opened in a tab therefore ran as a document of the API origin. The upload routes had no size limit, and the multipart create and update handlers returned inside their loop, so a request with several files stored the first, dropped the rest and answered 201.

Every file the API serves under `/public/*` now carries `X-Content-Type-Options: nosniff` and `Content-Security-Policy: sandbox`. A file opened as a document gets an opaque origin with scripts disabled, while images, video, audio and CSS backgrounds that embed it load as before. Uploads are bounded by `FILE_STORAGE_MAX_UPLOAD_BYTES` (50 MiB by default) and answer `413 Payload Too Large` above it, and an upload request carries one file. SVG uploads stay allowed; there is no content-type allow-list.

## Changes

- `apps/api/app.ts`: the static route sets both headers on every served file (`GET` and `HEAD`).
- `libs/shared/utils/src/lib/envs/file-storage.ts`: `FILE_STORAGE_MAX_UPLOAD_BYTES`, default `50 * 1024 * 1024`.
- `libs/modules/file-storage/models/file/backend/app/middlewares/` (new, same layout as `rbac/models/subject/backend/app/middlewares`): `RequestBodyFitsUploadLimit` wraps Hono's `bodyLimit`. A declared `Content-Length` over the limit is refused before the body is read; a chunked body fails once it passes the limit.
- File model controller: the middleware on `POST /` and `PATCH /:uuid`.
- `create` and `update` handlers: `parseBody({ all: true })`, so a repeated field is seen, and a request with more than one file answers `400 Validation error. Multiple files are not allowed` before anything is uploaded or written. Every caller in the repository already sends one file under `file`.
- `create-from-url` handler: the fetched body is read up to the same limit, refused early on a declared length and cancelled while streaming otherwise. The `fetch` call is unchanged; its URL checks belong to #307.
- `libs/shared/backend/utils` error mapping: a `Payload Too Large error` category answers 413 for `/payload too large/i`. The middleware and both `create-from-url` checks throw it with one message, `Payload Too Large error. The upload limit is N bytes`, and Hono's own error for a chunked body over the limit maps to the same category instead of 500.
- Deployer and local environment: `api/api.env.j2`, `api.sh`, `.env.example` and `apps/api/create_env.sh` carry the new variable with the same default.
- Documentation: `libs/modules/file-storage/README.md` (one file per request, the limit, the delivery headers, the providers), `tools/deployer/README.md` (file storage in production), and the new category in the root README's error table.

## Verification

- [x] Unit lanes: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run-many --target=jest:test --projects=@sps/file-storage,@sps/backend-utils,@sps/shared-utils,api` (file-storage 22, backend-utils 129, shared-utils 74, api 4 tests)
- [x] Integration lanes: `npx nx run-many --target=jest:integration --projects=@sps/file-storage,api` (3 and 6 tests)
- [x] Lint: `npx nx run-many --target=eslint:lint --projects=@sps/shared-utils,@sps/backend-utils,@sps/file-storage,api` (0 errors; 2 existing warnings in `apps/api` jest configs)
- [x] Types: `tsc --noEmit` is clean for the file-storage module, shared utils and backend utils; `apps/api/tsconfig.json` reports the same 25 errors as `main`
- [x] Scenario: `apps/api/specs/scenario/singlepagestartup/issue-304` against a booted API uploads an SVG, reads it with `GET` and `HEAD`, and deletes it (3 passed)
- [x] Mutation checks: without the headers the scenario fails; without the file count the three multi-file specs fail; a pass-through middleware fails the five over-limit specs; reading the fetched body without the limit fails the two `create-from-url` specs; without the 413 category three mapper cases and the seven over-limit upload specs fail
- [x] `curl` against the API: `curl -I` on an uploaded SVG shows both headers; a 51 MiB upload answers 413 with 0 bytes sent, the same upload chunked 413, `create-from-url` of it 413; two files 400; with `FILE_STORAGE_MAX_UPLOAD_BYTES=4096` an 8.5 KB file answers 413 and a 111-byte SVG 201
- [x] Chromium: an uploaded SVG with a script opened in a tab runs no script (origin `null`, cookies and storage throw `SecurityError`); from another origin the SVG and PNG images, a PNG CSS background, an MP4 video and an MP3 audio load; a PDF opened in a tab renders
- [ ] Safari: a sandboxed PDF opened in a tab, reported blank in Safari 17.6, is not checked

The scenario ran through `npx jest -c apps/api/jest.scenario.config.ts` because `npm run test:scenario:issue` stops at its HTTP-cache preflight while the shared local Redis does not answer; the suite does not use the cache.

## Notes

- `FILE_STORAGE_MAX_UPLOAD_BYTES` is new. Bun refuses request bodies above 128 MiB, so a value above that also needs `maxRequestBodySize` in `apps/api/server.ts`.
- `sandbox` also applies to PDFs. Chromium shows a sandboxed PDF blank inside a frame (SPS frames none), and Safari 17.6 was reported to show a directly opened one as an empty page. Leaving `sandbox` off `application/pdf` while keeping `nosniff` would keep inline PDFs in Safari.
- The deployer does not forward `FILE_STORAGE_PROVIDER` to the API, and `tools/deployer/.env.example` sets it to `vercel-blob` with a placeholder token. Forwarding it would switch existing deployments on their next deploy, so this PR documents the gap instead of wiring it.
- Streaming, `Range`, `ETag` and `Cache-Control` for `/public/*` are unchanged.

## Downstream migration

- **Upload limit.** Set `FILE_STORAGE_MAX_UPLOAD_BYTES` in the API environment, and in `tools/deployer/.env` for server deployments, when uploads exceed 50 MiB; above 128 MiB also raise Bun's `maxRequestBodySize` in `apps/api/server.ts`.
- **Rebound routes.** A startup controller of the file-storage file model that rebinds `POST /` or `PATCH /:uuid` adds `new RequestBodyFitsUploadLimit().init()` from the model's `backend/app/middlewares` package to those routes.
- **One file per request.** Clients send one file under `file` per request and split batches, as the social-module message routes do.
- **Size refusals.** An upload over the limit answers 413 with the category `Payload Too Large error`; project code that refuses an oversized body can throw `Payload Too Large error. <details>` to get the same status.
- **Framed or inline files.** Pages that frame uploaded files see a sandboxed PDF render blank in Chromium and uploaded HTML run without script; link such files to open in a new tab, or store uploads with `aws-s3` or `vercel-blob`.

_Verify:_ upload a file under the limit (201), one over it (413) and two files in one request (400), then `curl -I` the stored `/public` URL and expect `X-Content-Type-Options: nosniff` and `Content-Security-Policy: sandbox`.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
