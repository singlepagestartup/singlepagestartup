Closes #307.

Stacked on #331 (`claude/issue-304-upload-delivery`): this pull request merges after it and then targets `main`.

## Summary

`create-from-url` and observer pipeline steps passed a URL from the request, or from a stored broadcast message, straight to `fetch`. The API followed its redirects and read the whole body without a deadline, from inside the network it shares with the database, the cache and the other services. Under Bun the same `fetch` also reads `file:` URLs from disk and signs `s3:` URLs with the process credentials.

Both call sites now go through one guard in `@sps/backend-utils`. A URL passes when it is `http` or `https`, carries no credentials, and either sits on one of the deployment's own origins (the API and host service URLs, plus any origin listed in `OUTBOUND_URL_ALLOWED_ORIGINS`) or names a host that resolves to public addresses only. Every redirect hop is checked again, and the exchange stops after `OUTBOUND_URL_TIMEOUT_MS` (30 s). The body is read once, under a limit the caller chooses. `create-from-url` passes #331's `FILE_STORAGE_MAX_UPLOAD_BYTES` and answers 413 `Payload Too Large error. The upload limit is N bytes` above it. Observer steps use `OUTBOUND_URL_MAX_RESPONSE_BYTES` (50 MiB). A refused URL answers 400 in `create-from-url` and is logged and skipped by the observer.

The API's own flows keep working because their targets are service origins. The checkout observer calls `NEXT_PUBLIC_API_SERVICE_URL`, `/generate` downloads the host's image from `HOST_SERVICE_URL` (`http://host:3000` in deployment), and MCP content management sends public image URLs.

## Changes

- `libs/shared/backend/utils/src/lib/outbound-url/index.ts` (new): `assertOutboundUrl` and `fetchOutboundUrl(value, init, options)`, exported from `@sps/backend-utils`.
  - Refused ranges: loopback, private (10/8, 172.16/12, 192.168/16), shared (100.64/10), link-local including `169.254.169.254`, this network, multicast, reserved and broadcast, and the IPv6 unspecified, loopback, unique-local, link-local and multicast ranges. IPv4-mapped IPv6 addresses meet the IPv4 rules.
  - Ranges are matched on address bytes. `BlockList` from `node:net` matches nothing in Bun 1.2.5, the release the API runs from `node_modules`.
  - Redirects are followed by the wrapper: every location is checked; a 303, and a 301 or 302 after a POST, continue as GET; `Authorization`, `Cookie`, `Proxy-Authorization` and `X-RBAC-SECRET-KEY` are dropped on a redirect to another origin.
  - A plain-HTTP request is sent to the address that passed the check, with the original `Host` header, so a second DNS answer cannot redirect it. HTTPS keeps the name, and certificate verification covers it.
  - A host that does not resolve gets the same message as one that resolves privately.
  - `options.maxResponseBytes` (default `OUTBOUND_URL_MAX_RESPONSE_BYTES`) bounds the body: a declared length above it is refused before the body is read, and a streamed body is cancelled at the chunk that passes it. The refusal is `Payload Too Large error. The <options.limitName> limit is N bytes`, the 413 category #331 adds; the default name is `response`.
- `libs/shared/utils/src/lib/envs/api.ts`: `OUTBOUND_URL_ALLOWED_ORIGINS` (empty), `OUTBOUND_URL_TIMEOUT_MS` (`30000`), `OUTBOUND_URL_MAX_RESPONSE_BYTES` (`52428800`).
- `libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/create-from-url/index.ts`: `fetchOutboundUrl(data.url, {}, { maxResponseBytes: FILE_STORAGE_MAX_UPLOAD_BYTES, limitName: "upload" })` instead of `fetch`, and #331's private `readBody` is removed, so the download is read once.
- `libs/middlewares/src/lib/observer/index.ts`: `fetchOutboundUrl` instead of `fetch`, with the default limit. Prettier re-indents the `.then` block; ignoring whitespace, the change is one import and one call.
- Merge of `claude/issue-304-upload-delivery` (no rebase). Its route spec stubs `node:dns/promises` with a public answer, because the guard resolves the fetched host. Its streamed `create-from-url` case keeps the 413 expectation and leaves the reader checks to the outbound URL spec.
- Specs: `outbound-url/index.spec.ts` (72 cases), `create-from-url/index.spec.ts` (6), `observer/index.spec.ts` (3).
- Deployer: the three variables in `tools/deployer/.env.example`, `api.sh`, `github_deployer.sh`, `api/api.env.j2` (rendered only when set) and `.github/workflows/ansible.yml`.
- `libs/modules/file-storage/models/file/README.md`: "Create from a URL" section with the address rules, the upload limit and the settings.
- `thoughts/shared/`: research, plan, process log and implementation progress for #307.

Framework layer only: no `startup` file, no schema change and no new dependency. Authorization of these routes is unchanged (#303, #308).

## Verification

- [x] `npx nx run @sps/backend-utils:jest:test`: 7 suites, 201 tests.
- [x] `npx nx run @sps/middlewares:jest:test`: 11 suites, 67 tests.
- [x] `npx nx run @sps/file-storage:jest:test`: 5 suites, 28 tests.
- [x] `npx nx run @sps/backend-utils:eslint:lint`, `@sps/shared-utils:eslint:lint`, `@sps/file-storage:eslint:lint`, and `npx eslint` on the observer files.
- [x] `npx tsc --noEmit -p` for `libs/shared/backend/utils`, `libs/middlewares`, `libs/modules/file-storage`, `libs/shared/utils`: 0 errors.
- [x] `node tools/agents/code-placement.mjs`: no same-name file and folder pairs.
- [x] Mutation checks, each restored afterwards:
  - address check disabled: 33 guard cases fail;
  - IPv4 compared without the mapped-form offset: 21 fail;
  - per-hop check skipped: 3 fail;
  - plain HTTP sent by name: 2 fail;
  - credential headers kept across origins: 1 fails;
  - caller limit ignored: 2 fail; limit name ignored: 1 fails; stream not cancelled: 1 fails;
  - `create-from-url` without the upload limit: both route 413 cases fail;
  - both call sites back on `fetch`: every refusal case there fails while the allowed flows still pass.
- [x] HTTP run against the API on port 4307 under its own runtime (`node_modules/bun`, 1.2.5), default limits:
  - 201: public HTTPS image, public image behind a redirect, public plain-HTTP image, and a file on the API's own origin;
  - 413 `Payload Too Large error. The upload limit is 52428800 bytes`: `https://speed.cloudflare.com/__down?bytes=60000000` and `https://proof.ovh.net/files/1Gb.dat`, without downloading the body (the whole run took 4 s);
  - 400 with the guard's message: `127.0.0.1:4307`, `localhost:5433`, `10.0.0.1`, `192.168.1.1`, `169.254.169.254`, `[::1]:4307`, `file:///etc/hostname`, and a URL with credentials.
- [x] HTTP run with `FILE_STORAGE_MAX_UPLOAD_BYTES=1024`: a 13 KB image with a declared length and `https://www.google.com/`, which sends no `Content-Length`, both answer 413 `Payload Too Large error. The upload limit is 1024 bytes`; an 800-byte file answers 201.
- [x] Observer run on the same API with two throwaway messages. The step to the metadata address was not sent and its message stayed; the step on the API origin ran and its message was deleted.
- [x] Every record, message and stored file created by the runs was deleted.
- [x] `bash -n` on the changed shell scripts, the workflow YAML parses, and `api.env.j2` renders the three lines only when they are set.

## How to verify it

1. Start the API and call `POST /api/file-storage/files/create-from-url` with `data={"url":"https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png"}`: 201.
2. Repeat with `http://127.0.0.1:<api port>/`, `http://169.254.169.254/latest/meta-data/` and `file:///etc/hostname`: 400 each, with no outgoing request.
3. Repeat with `https://speed.cloudflare.com/__down?bytes=60000000`: 413 `Payload Too Large error. The upload limit is 52428800 bytes`, answered at once.
4. Run a checkout end to end: the observer pipeline still calls the order and subject checks and deletes its messages.

## Notes

- The unit lane runs under Node, where `BlockList` works. Only the HTTP run exercises Bun 1.2.5, which is how the byte matching became necessary. The process log records this.
- The merge of #331 carries two semantic resolutions with no textual conflict: #331's route spec host does not resolve, and the handler would have read the download twice. The merge commit message and the process log describe both.
- Not covered: IPv4 addresses embedded in NAT64 or 6to4 prefixes are not decoded, and HTTPS requests are not bound to the checked address.

## Downstream migration

Adaptation is required where a project's server-side requests reach internal services, download large or slow files, or where a project keeps its own deployer scripts.

**Applies to:** projects whose observer pipelines or `create-from-url` callers reach an internal service other than the API and host service URLs; projects that download files through `create-from-url` above 50 MiB or slower than 30 seconds; projects that keep their own copies of the deployer scripts; projects whose own server code fetches URLs taken from requests or stored data.

**New environment variables:**

| Variable                          | Default    | Meaning                                                                                                     |
| --------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `OUTBOUND_URL_ALLOWED_ORIGINS`    | empty      | Further origins the API may reach although they resolve to non-public addresses, comma-separated, no spaces |
| `OUTBOUND_URL_TIMEOUT_MS`         | `30000`    | Deadline for one outbound request, redirects and body included                                              |
| `OUTBOUND_URL_MAX_RESPONSE_BYTES` | `52428800` | Largest response body an observer pipeline step reads                                                       |

**Actions:**

- List each internal origin those requests need (scheme, host and port, for example `http://crm:8080`) in `OUTBOUND_URL_ALLOWED_ORIGINS` in the API environment and the deployer `.env`.
- Raise `FILE_STORAGE_MAX_UPLOAD_BYTES` (#331) to allow larger `create-from-url` downloads, `OUTBOUND_URL_TIMEOUT_MS` for slower ones, and `OUTBOUND_URL_MAX_RESPONSE_BYTES` only for larger observer step responses.
- In project-owned deployer copies, pass the three variables through `tools/deployer/api.sh`, `tools/deployer/github_deployer.sh`, `.github/workflows/ansible.yml` and `tools/deployer/api/api.env.j2` as the framework files do.
- Route project server code that fetches a URL taken from a request or stored data through `fetchOutboundUrl` from `@sps/backend-utils` instead of `fetch`, passing `{ maxResponseBytes, limitName }` where the download has a limit of its own.

**Verify:** against the running API, `create-from-url` with a public image URL answers 201, with `http://127.0.0.1:<api port>/` answers 400, and with a public file above `FILE_STORAGE_MAX_UPLOAD_BYTES` answers 413; after a checkout, the observer pipeline still deletes its messages.
