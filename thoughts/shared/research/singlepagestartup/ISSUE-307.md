---
date: 2026-09-26T00:10:00+03:00
researcher: flakecode
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-307-outbound-url-guard
repository: singlepagestartup
topic: "Validate URLs the API fetches on behalf of callers"
tags: [research, codebase, file-storage, observer, broadcast, backend-utils, envs, deployer, security]
status: complete
last_updated: 2026-09-26
last_updated_by: flakecode
---

# Research: Validate URLs the API fetches on behalf of callers

**Date**: 2026-09-26
**Researcher**: flakecode
**Git Commit**: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
**Branch**: claude/issue-307-outbound-url-guard
**Repository**: singlepagestartup

## Research Question

Which API code passes a URL that a caller supplied, or that a caller stored, to
`fetch`; what that `fetch` can reach from the API process; which working flows
depend on reaching the deployment's own services through the same code; and
where a URL check, its settings and its tests belong in the repository.

The ticket names two call sites (finding N-05 of the 2026-09-25 security
review). Who may call the routes involved is decided by the permission rows and
the `is-authorized` allow rules, which #303 and #308 own; this research does not
assess them.

## Summary

- Two call sites hand a caller-controlled URL to `fetch` unchanged: the
  file-storage `create-from-url` handler
  (`libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/create-from-url/index.ts:35`)
  and the observer middleware's `executePipeline`
  (`libs/middlewares/src/lib/observer/index.ts:249`). Neither checks the
  scheme, embedded credentials, the host or the resolved address, and neither
  sets a timeout or bounds the response size. Both use the `fetch` default
  `redirect: "follow"`.
- The API runs under the Bun release installed in `node_modules` (1.2.5, the
  `bun` devDependency), because its npm scripts put `node_modules/.bin` first
  in `PATH`. Bun's `fetch` answers a `file:` URL with the contents of a local
  file and sends an `s3:` URL through Bun's S3 client, which signs with S3 or
  AWS credentials from the process environment. The reach of these call sites
  is therefore the local disk and object storage as well as every network the
  API container is attached to.
- Working flows reach the deployment's own services through both call sites.
  The only producer of observer pipelines, the RBAC checkout service, writes
  pipe URLs under `NEXT_PUBLIC_API_SERVICE_URL`. The file-storage `/generate`
  handler calls `create-from-url` with a URL under `HOST_SERVICE_URL`. Deployed,
  these are `https://<api domain>`, `http://api:4000` (fallback) and
  `http://host:3000`; locally, `http://localhost:4000` and
  `http://localhost:3000`. The internal names resolve to overlay-network
  addresses and `localhost` to loopback.
- MCP content management calls `create-from-url` through the server SDK with a
  public URL taken from the tool input.
- `lookup` from `node:dns` and `isIP` from `node:net` behave the same in Bun
  1.2.5, Bun 1.3.6 and Node (the Jest runtime). `BlockList` from `node:net`
  does not: in Bun 1.2.5 its `check` returns false for every address. Bun's
  `node:dns` lookup does not populate the DNS cache Bun's `fetch` uses, so a
  hostname is resolved again by `fetch` after any separate check.
- Nothing in the repository resolves hostnames or classifies addresses today.
  Backend-only helpers live in `libs/shared/backend/utils/src/lib/<name>/`;
  settings live in `libs/shared/utils/src/lib/envs/*.ts`; the shared error
  classifier answers a message that starts with `Validation error.` with 400.
- No spec covers `create-from-url` or `executePipeline`.
- Five other server-side reads fetch a URL stored in a database row or a chat
  message. They are listed at the end and are outside this issue.

## Detailed Findings

### The `create-from-url` handler

- Route: `POST /create-from-url` on the file model controller
  (`libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/index.ts:46-50,68-70`),
  mounted at `/api/file-storage/files` (`apps/api/app.ts:192`,
  `libs/modules/file-storage/backend/app/api/src/lib/apps.ts:17`). The startup
  controller (`controller/startup/index.ts:1-12`) inherits it unchanged.
- `create-from-url/index.ts:19-33` parses the multipart body, reads
  `JSON.parse(body.data)` and refuses a missing `data.url` with
  `Validation error. Invalid url`.
- `:35-45` calls `fetch(data.url)`, reads the whole body with `res.blob()`, and
  names the file after the last path segment of `data.url` (the query string is
  cut at `?`). The response status is not checked, so an error page is stored as
  the file.
- `:51-58` stores the file through `@sps/providers-file-storage`; `:60-84`
  detects the type with `file-type` and the dimensions with `image-size`;
  `:86-98` creates the row and answers 201.
- `:99-102` converts any error through `getHttpErrorType` into an
  `HTTPException`. A network failure from `fetch` has no matching pattern and
  becomes 500 `Internal server error: ...`.
- The route has one seeded permission row
  (`libs/modules/rbac/models/permission/backend/repository/database/src/lib/data/2c3bf198-0492-4826-aab6-2e662d4cd9bb.json`).

Callers:

- Server SDK action `createFromUrl`
  (`libs/modules/file-storage/models/file/sdk/server/src/lib/singlepage/actions/create-from-url.ts:32-63`)
  posts `data` as form data to `${API_SERVICE_URL}/api/file-storage/files/create-from-url`
  (`sdk/model/src/lib/index.ts:14,16`). The client SDK has no such action.
- `/generate` (`controller/singlepage/generate/index.ts:35-56`) builds
  `${HOST_SERVICE_URL}/api/image-generator/image.png?variant=...&width=...&height=...&data=...`
  and calls `createFromUrl` with the operator secret header. The image comes
  from the host app route `apps/host/app/api/image-generator/image.png/route.tsx`.
- MCP content management (`apps/mcp/lib/content-management/file-storage.ts:38-52`)
  takes `data.url`, `data.sourceUrl` or an `http(s)` `data.file` from the tool
  input and calls `descriptor.api.createFromUrl` (`:174-212`); the descriptor's
  `api` is the server SDK loaded by `registry.ts:397-441`. The registry
  advertises `https://example.com/image.webp` as the example
  (`registry.ts:342-352`). `operations.spec.ts:373-408` covers the dispatch.
- OpenAPI: `libs/modules/file-storage/models/file/sdk/model/src/lib/paths.yaml:134-149`,
  merged in `apps/openapi/openapi.yaml:879-880`. `apps/api/README.md:229-251`
  lists the action and the handler.

### The observer pipeline

- `ObserverMiddleware` is registered with no options (`apps/api/app.ts:123-124`)
  and acts after the handler (`observer/index.ts:55`). For a 2xx `POST`, `PATCH`
  or `DELETE` outside the skipped routes (`:57-65`) it loads channels titled
  `observer` (`:73-85`), loads their messages whose payload mentions the path
  and the method (`:103-128`, with the operator secret), and parses each payload
  as `{ trigger, pipe[] }` (`:27-39`, `:149`).
- A message fires when `trigger.method` equals the request method and
  `trigger.url` equals `${NEXT_PUBLIC_API_SERVICE_URL}${path}` (`:151-155`).
  `executePipeline` then runs without being awaited (`:169-176`).
- `executePipeline` (`:190-286`) copies `pipe[i].method` and `pipe[i].headers`
  into the request (`:200-205`), fills `[triggerResult.a.b]` and
  `[previouseResult.a.b]` placeholders in `pipe[i].body` and sends it as form
  data (`:207-247`), and calls `fetch(pipe[i].url, options)` (`:249`). On a 2xx
  it deletes the message and returns `res.json()` (`:250-269`); the next step
  receives that value (`:274-282`). Every error is logged, not thrown
  (`:283-285`).
- Messages are written by one producer: the RBAC checkout service
  (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:801-859`).
  Per order it pushes two messages to the `observer` channel:
  - trigger `POST ${NEXT_PUBLIC_API_SERVICE_URL}/api/billing/payment-intents/:provider/webhook`,
    pipe `POST ${NEXT_PUBLIC_API_SERVICE_URL}/api/ecommerce/orders/:id/check`;
  - trigger `PATCH ${NEXT_PUBLIC_API_SERVICE_URL}/api/ecommerce/orders/:id`,
    pipe `POST ${NEXT_PUBLIC_API_SERVICE_URL}/api/rbac/subjects/:id/check`.
    Both pipe steps carry `X-RBAC-SECRET-KEY` in `headers` and no `body`, so the
    placeholders are unused by framework code. No other code, seed row or
    document writes observer messages; the channel itself is seeded
    (`libs/modules/broadcast/models/channel/backend/repository/database/src/lib/data/7ced3ee2-30f8-420e-aa59-1478a1853968.json`).
- The generic broadcast routes and the admin message form accept any payload
  (`libs/modules/broadcast/models/channel/backend/app/api/src/lib/controller/singlepage/index.ts:25-29,55-59`,
  `libs/modules/broadcast/models/message/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:132-139`).
- No README describes the payload format or states whether a pipe may call an
  external URL. The root README calls the observer a request logger
  (`README.md:422`).

### What the service URLs are in each environment

| Variable                       | Code default (`envs/host.ts`)                            | Deployed API (`tools/deployer/api/api.env.j2`, `Dockerfile`)                    | Local API (`apps/api/create_env.sh`)      |
| ------------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------- | ----------------------------------------- |
| `API_SERVICE_URL`              | `http://localhost:4000` (`:7-8`)                         | `http://api:4000` (`api.env.j2:6-8`)                                            | not written; default applies              |
| `NEXT_PUBLIC_API_SERVICE_URL`  | `API_SERVICE_URL`, then `http://localhost:4000` (`:3-6`) | image `ENV` from the build argument `https://<api domain>` (`Dockerfile:16-17`) | not written outside Codespaces and Gitpod |
| `HOST_SERVICE_URL`             | `http://localhost:3000` (`:15-16`)                       | `http://host:3000` (`api.env.j2:1-4`)                                           | not written                               |
| `NEXT_PUBLIC_HOST_SERVICE_URL` | `http://localhost:3000` (`:13-14`)                       | `https://<host domain>` (`api.env.j2:2`)                                        | not written outside Codespaces and Gitpod |

The API also reaches itself through `API_SERVICE_URL` in every server SDK
(`sdk/model` `serverHost`) and the host through `HOST_SERVICE_URL` in the
revalidation middleware (`libs/middlewares/src/lib/revalidation/index.ts:128`).
`api.env.j2` names further internal services: `postgres` (`:15`), `redis`
(`:95`), `http://mcp:3001/mcp` (`:26`) and `http://llm:8765` (`:120`). The
compose file attaches the API to the external `traefik_overlay` network
(`tools/deployer/api/docker-compose.api.yaml.j2:6-7,32-34`).

### Runtime behavior of `fetch`, `node:dns` and `node:net`

The API process runs `node_modules/bun/bin/bun.exe`, Bun 1.2.5 from the `bun`
devDependency (`package.json:125`, `package-lock.json`). `npm run api:dev` and
`npm run api:start` (`start.sh:10-13`) start `bun run dev` or `bun run start`
through Nx with `node_modules/.bin` first in `PATH`, and `npm ci` installs the
devDependency in the image (`Dockerfile:39`), so the Bun the Dockerfile
installs globally (`Dockerfile:6-9`) is not the one these scripts start. The
items below were probed in the session scratchpad with Bun 1.2.5, Bun 1.3.6 and
Node 24.11.0 and hold in all three unless stated:

1. Bun `fetch("file:///<path>")` answers 200 with the file's bytes;
   `fetch("data:...")` answers 200; `fetch("s3://bucket/key")` fails with
   `ERR_S3_MISSING_CREDENTIALS` when no S3 or AWS credentials are set, which
   shows the S3 client handles it; `ftp:` fails with `ERR_INVALID_ARG_VALUE`.
2. `lookup(host, { all: true })` from `node:dns/promises` returns every address
   in both runtimes and returns an IP literal unchanged. In Bun it leaves the
   DNS cache that `fetch` uses untouched (`dns.getCacheStats()` from `bun` does
   not change after the lookup; the following `fetch` records a cache miss).
3. Bun's `fetch` sends a caller-supplied `Host` header when the URL names an IP
   address; Node's `fetch` replaces it with the URL host.
4. `BlockList` from `node:net`: in Bun 1.2.5 `check` returns false for every
   address, `10.0.0.1` against `10.0.0.0/8` included, and `addAddress` does not
   exist. In Node and Bun 1.3.6 it matches IPv4-mapped IPv6 addresses, dotted
   (`::ffff:127.0.0.1`) and hexadecimal (`::ffff:7f00:1`), against IPv4 rules;
   NAT64 (`64:ff9b::/96`) and IPv4-compatible (`::7f00:1`) addresses are not
   mapped, and for `fe80::1%eth0` Node reports a match with `fe80::/10` while
   Bun 1.3.6 does not.
5. The WHATWG URL parser in both runtimes rewrites `http://0x7f.1/` and
   `http://2130706433/` to host `127.0.0.1`, keeps brackets around an IPv6
   host, and rejects a zone index in a URL.
6. `redirect: "manual"` returns the 3xx response with a readable `Location`
   header in both runtimes.
7. `AbortSignal.timeout()` rejects with a `TimeoutError`; `AbortSignal.any()`
   exists in both runtimes.

### Where a check and its settings belong

- `libs/shared/backend/utils/src/lib/` holds backend-only helpers, one folder
  each, exported by name from `src/lib/index.ts:1-21`: `rbac-secret` (uses
  `node:crypto`), `bcrypt-columns`, `http-error` with sub-helpers in
  subfolders, `localized-field`, `jwt-verify`, `unique-constraint-error`,
  `logger`, `websocket-manager`. The package is `@sps/backend-utils` with
  `jest:test`, `eslint:lint` and `tsc:build` targets
  (`libs/shared/backend/utils/project.json`) and is imported by both call
  sites already (`getHttpErrorType`, `logger`). Its README is empty.
- `libs/middlewares/src/lib/http-cache/guard.ts:1-60` is the closest shape for
  a guarded operation: an options interface with injectable collaborators,
  defaults read from `@sps/shared-utils`, and a JSDoc on the reason for each
  default.
- Settings are exported from `libs/shared/utils/src/lib/envs/*.ts` through
  `export * from "./lib/envs"`. `envs/api.ts:1-9` holds API process settings
  (`API_SECRET_STRENGTH`); `envs/host.ts` holds the service URLs, the KV
  bounds and `HTTP_CACHE_MAX_ENTRY_BYTES` (`:67-96`). Lists are exported as raw
  strings and split where used, for example `ALLOWED_BILLING_SERVICE_PROVIDERS`
  (`envs/host.ts:9-11`, split at
  `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/provider/index.ts:85-87`).
- An operator-settable API variable is registered in
  `tools/deployer/.env.example`, `tools/deployer/github_deployer.sh` (read and
  `SECRETS` entry), `.github/workflows/ansible.yml` (preview and production
  arrays), `tools/deployer/api.sh` (read and `-e`) and
  `tools/deployer/api/api.env.j2`, for example
  `RBAC_OAUTH_EXCHANGE_LIFETIME_IN_SECONDS` (`.env.example:206`,
  `github_deployer.sh:98,211`, `ansible.yml:107,226`, `api.sh:37,144`,
  `api.env.j2:43-45`). Optional values render only when set:
  `{% if X is defined and X | length > 0 %}`. Bounds with a code default
  (`HTTP_CACHE_MAX_ENTRY_BYTES`, the `KV_*` timeouts, `API_SECRET_STRENGTH`) are
  registered in `envs/*.ts` and a README only. `apps/api/create_env.sh` writes
  only values a local setup needs (`:20-116`) and exits when `.env` exists
  (`:9-13`).
- READMEs document settings in an "Environment" table
  (`libs/middlewares/src/lib/http-cache/README.md:123-133`) or a list
  (`libs/modules/rbac/models/subject/README.md:75-82`).

### Error mapping

`getHttpErrorType` (`libs/shared/backend/utils/src/lib/http-error/index.ts:10-131`)
answers a message that starts with `Validation error` with 400
(`http-error/paterns/index.ts:76-81`); `/invalid url/i` is also a 400 pattern
(`:102`). `create-from-url` already converts its errors through it. The
observer logs errors with `logger.error` and answers nothing.

### Tests and patterns

- No spec exists for `create-from-url`, `generate` or any other file model
  controller; `@sps/file-storage:jest:test` runs the module's two unit suites
  (6 tests). The observer has a spec for its skip matcher only
  (`libs/middlewares/src/lib/observer/routes/index.spec.ts`). `checkout.spec.ts:605-651`
  asserts the two pushed messages and their URL suffixes.
- Handler specs call `new Handler(service).execute(context, next)` with a fake
  context and assert `rejects.toMatchObject({ status })` against the real
  `getHttpErrorType`
  (`libs/modules/notification/models/template/backend/app/api/src/lib/controller/singlepage/render/index.spec.ts:8-28,68-82`).
- Settings are mocked with getters on `@sps/shared-utils`
  (`libs/shared/backend/utils/src/lib/rbac-secret/index.spec.ts:10-16`).
  `globalThis.fetch` is replaced and restored per test in
  `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.spec.ts:50-100`.
  No spec stubs `node:dns`; `jest.mock("node:dns/promises", ...)` works under
  the repository's ts-jest transform (checked in the scratchpad).
- `@sps/backend-utils` (126 tests) and `@sps/middlewares` (64 tests) run through
  their own `jest:test` targets and are not in `test:unit:scoped`;
  `@sps/middlewares` has no `eslint:lint` target.

### Other server-side fetches of stored or caller-supplied URLs

Outside the ticket's two call sites, these read a URL that a caller stored:

- Notification attachments: `fetch(props.attachment.url)` and a `HEAD` request
  (`libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:576,695`),
  and `fetch(filePath)` for `http` paths in the SES sender
  (`libs/shared/third-parties/src/lib/aws/simple-email-service/index.ts:49-51`).
- OpenRouter media inlining, which fetches an image or file URL from a chat
  message part when its host looks local or private
  (`libs/shared/third-parties/src/lib/open-router/index.ts:104,132-152,172,205,231`).
- Chat file reads that fetch a file-storage row's `file` value when it starts
  with `http`: `/learn`
  (`.../social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:3315-3323`)
  and audio transcription (`.../message/audio-transcription.ts:652-658`).

## Code References

- `libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/create-from-url/index.ts:35-45` - `fetch(data.url)` and `res.blob()`
- `libs/modules/file-storage/models/file/backend/app/api/src/lib/controller/singlepage/generate/index.ts:46-56` - `createFromUrl` with a `HOST_SERVICE_URL` image URL
- `libs/modules/file-storage/models/file/sdk/server/src/lib/singlepage/actions/create-from-url.ts:51-54` - SDK request to the API
- `libs/middlewares/src/lib/observer/index.ts:190-286` - `executePipeline`, `fetch` at `:249`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/checkout.ts:801-859` - the observer message producer
- `apps/mcp/lib/content-management/file-storage.ts:38-52,174-212` - MCP URL uploads
- `libs/shared/utils/src/lib/envs/host.ts:1-16` - service URL defaults
- `libs/shared/utils/src/lib/envs/api.ts:1-9` - API process settings
- `libs/shared/backend/utils/src/lib/index.ts:1-21` - backend utility exports
- `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts:76-81,102` - 400 patterns
- `tools/deployer/api/api.env.j2:1-8,40-45,64` - deployed service URLs and optional settings

## Architecture Documentation

- Framework behavior sits in `singlepage` files and project overrides in
  `startup` files; the file model's startup controller and server SDK re-export
  the singlepage versions unchanged.
- Middleware classes take constructor options for project extension
  (`IMiddlewareOptions.skippedRoutes` in the observer); deployment-specific
  values come from environment settings.
- The API calls itself and the host by URL (server SDKs, revalidation, the
  observer, `/generate`), so its own service origins are ordinary destinations
  for server-side requests.

## Historical Context (from thoughts/)

- Finding N-05 of the 2026-09-25 security review names both call sites and asks
  for scheme, address, redirect and size checks.
- `thoughts/shared/plans/singlepagestartup/ISSUE-233.md` introduced the bounded
  settings pattern (`KV_COMMAND_TIMEOUT_MS`, `HTTP_CACHE_MAX_ENTRY_BYTES`) with
  code defaults and a README table.
- `thoughts/shared/research/singlepagestartup/ISSUE-213.md` records that
  checkout enqueues observer messages.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-233.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-213.md`

## Open Questions

None block planning. The plan decides the default allow-list, the timeout and
size defaults, how the fetch is bound to the checked address, and the answer
status for a refused URL.
