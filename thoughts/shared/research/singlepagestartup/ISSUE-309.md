---
date: 2026-09-25T21:23:47Z
researcher: flakecode
git_commit: 78d7d43125450fbf2d3c547c9b969a80cd9c3975
branch: claude/issue-309-dependency-upgrades
repository: singlepagestartup
topic: "Upgrade vulnerable runtime dependencies and add Dependabot version updates"
tags: [research, dependencies, next, hono, mcp, python-multipart, dependabot, npm-audit]
status: complete
last_updated: 2026-09-25
last_updated_by: flakecode
---

# Research: Upgrade vulnerable runtime dependencies and add Dependabot version updates

**Date**: 2026-09-25
**Researcher**: flakecode
**Git Commit**: 78d7d43125
**Branch**: claude/issue-309-dependency-upgrades
**Repository**: singlepagestartup

## Research Question

Which manifests pin `next`, `hono`, `@modelcontextprotocol/sdk` and
`python-multipart`, what code depends on the APIs those packages change between
the installed and the patched versions, what `npm audit fix` without `--force`
changes on top of the upgrades, and where a Dependabot version-update
configuration has to point. The agreed scope is the ticket's "Scope after
review": the latest `next` 15.5.x, the latest `hono` 4.12.x,
`@modelcontextprotocol/sdk` 1.26.x, `python-multipart` 0.0.31 or newer,
`npm audit fix` without `--force`, and `.github/dependabot.yml`.

## Summary

- The npm tree is installed from the root `package.json` and `package-lock.json`
  only; the root manifest has no `workspaces`. `.npmrc` sets
  `legacy-peer-deps=true`, so npm does not enforce peer ranges.
- `apps/host/package.json` is rewritten by `@nx/next:build` after every
  successful host build, but the build keeps every version already listed there
  and only adds missing packages. Its pins match the installed tree for 93 of
  94 entries (`openai` is the exception), so its pins for upgraded packages are
  edited by hand.
- hono 4.11.4 and later require the algorithm argument of `verify()` from
  `hono/jwt`; without it `verify()` throws `JwtAlgorithmRequired`. 23 live call
  sites pass only the token and the secret. A token whose header names a
  different algorithm now raises `JwtAlgorithmMismatch`, which the shared JWT
  helper does not treat as a credential failure and which no HTTP error pattern
  maps to 401.
- `@modelcontextprotocol/sdk` 1.26.0 declares `zod ^3.25 || ^4.0` as a required
  peer and as a dependency. With the installed zod 3.24.2 npm nests zod 4.6.5
  under the SDK; with zod 3.25.76 at the root the SDK shares the application's
  zod. A caret range `^1.26.0` resolves to 1.30.1.
- The MCP HTTP server creates one `McpServer` and one transport per session,
  which is the pattern the 1.26.0 reuse guards expect. `apps/mcp/lib/oauth.ts`
  uses `jsonwebtoken` and does not import the SDK.
- `next` 15.5.26 is the latest 15.5 release. The 15.5 notes add route export
  validation during `next build` and deprecation warnings; no option in
  `apps/host/next.config.js` is removed on the 15.5 line.
- `python-multipart` 0.0.32 works with the pinned `fastapi==0.115.6`
  (Starlette 0.41.3): FastAPI's install check passes, the audio route's
  `UploadFile` plus `Form` shape parses, and the 13 LLM unit tests pass.
- `npm audit --omit=dev` reports 4 critical, 34 high, 47 moderate and 6 low at
  baseline. On a scratch copy, the four upgrades alone give 3/33/46/6, and
  `npm audit fix` on top gives 1/8/28/0. That `npm audit fix` changes 949
  packages, including the Nx toolchain 22.0.2 to 22.7.12.
- No `.github/dependabot.yml` exists. Dependabot security updates already open
  pull requests (commit `4704a6df67`, "Bump hono from 4.4.5 to 4.10.2 in
  /apps/host").

## Detailed Findings

### Manifests and installation

- Root `package.json:161` pins `"next": "15.4.8"`; `package.json:144` has
  `"hono": "^4.10.2"`; `package.json:77` has
  `"@modelcontextprotocol/sdk": "^1.18.1"`; `package.json:194` has
  `"zod": "^3.24.1"`. The Next companions are caret ranges:
  `@next/bundle-analyzer` and `@next/third-parties` `^15.1.3`
  (`package.json:78-79`), `eslint-config-next` `^15.1.3` (`package.json:248`);
  all three are installed at 15.2.2.
- Exact pins are the root manifest's way of holding a version: `next`,
  `remotion`, `@remotion/player`, `@remotion/web-renderer`, `jspdf` and
  `html-to-image` are exact, everything else is a caret range.
- Installed at baseline: next 15.4.8, hono 4.10.4, `@modelcontextprotocol/sdk`
  1.18.1, zod 3.24.2, sharp 0.34.5, postcss 8.5.15 (next keeps its own postcss
  8.4.31), ajv 6.12.6 at the root.
- `.npmrc:1` is `legacy-peer-deps=true`.
- `apps/host/package.json` pins exact versions: `next` 15.4.8 (`:74`), `hono`
  4.10.4 (`:65`), `@modelcontextprotocol/sdk` 1.18.1 (`:15`), `zod` 3.24.2
  (`:102`), `sharp` 0.34.5 (`:91`), `ajv` 6.12.6 (`:49`).
- `apps/api/package.json:9`, `apps/openapi/package.json:10` and
  `apps/telegram/package.json:9` declare `"hono": "^4.6.17"`;
  `apps/mcp/package.json:8` declares `"@modelcontextprotocol/sdk": "^1.18.1"`.
  These manifests hold the `bun` scripts the Nx targets run
  (`apps/api/project.json` `dev` runs `bun run dev` in `apps/api`); nothing
  installs from them.
- The Docker image installs with `npm ci` at the repository root and builds the
  host with `npm run host:build` (`Dockerfile`); Vercel uses `npm ci` and
  `sh vercel.sh` (`vercel.json`).

### How `apps/host/package.json` is maintained

- `apps/host/project.json:21-27` runs `@nx/next:build` with
  `outputPath: "apps/host"`.
- `node_modules/@nx/next/src/executors/build/build.impl.js` writes
  `${outputPath}/package.json` from `createPackageJson()` after a successful
  build.
- `node_modules/nx/src/plugins/js/package-json/create-package-json.js`
  (`getVersion`, lines 59-73) returns the version already present in the
  project's `package.json` first and falls back to the installed version from
  the project graph only for packages the file does not list. The rewrite
  therefore adds new packages but never refreshes an existing pin
  (commit `a719ee8fd7` shows such an addition of `@modelcontextprotocol/sdk`,
  `@vercel/kv`, `ajv` and `ioredis`).

### Next.js host

- `apps/host/next.config.js` sets `reactStrictMode`, `deploymentId` (`:27`),
  `staticPageGenerationTimeout: 6000` (`:28`), `images.unoptimized: true`
  (`:30`) with `remotePatterns`, `headers()`, `trailingSlash: false`, a custom
  `webpack()` (`:78`), `eslint.ignoreDuringBuilds: true` (`:117-118`) and
  `logging: false` (`:120`), wrapped by `withNx` and `@next/bundle-analyzer`.
- `apps/host/middleware.ts:25` matches every path except `_next`, `images`,
  `sitemap`, `robots`, `api`, `favicon`, `healthz` and Google verification
  files; it only redirects page paths to a language prefix. File uploads go from
  the browser to the API, not through this middleware.
- `apps/host/app/[[...url]]/page.tsx:10-12` exports `revalidate = 86400`,
  `dynamicParams = true` and `experimental_ppr = true`; `next.config.js` does
  not set `experimental.ppr`.
- `apps/host/tsconfig.json` includes `.next/types/**/*.ts`, so types that
  `next build` generates are type-checked.
- Next.js 15.5 ([release notes](https://nextjs.org/blog/next-15-5)): Turbopack
  builds in beta (opt-in), Node.js middleware runtime stable (opt-in), typed
  routes stable behind `typedRoutes` (not set here), route export validation
  during `next build`, `next lint` deprecated while `next build` still lints
  unless `eslint.ignoreDuringBuilds` is set, and deprecation warnings for
  `legacyBehavior`, AMP, `next/image` qualities other than 75 without
  `images.qualities`, and local image `src` query strings without
  `images.localPatterns`. A search of `apps/host` and `libs` finds no
  `legacyBehavior`, `next/amp`, `next/legacy/image`, `serverRuntimeConfig` or
  `publicRuntimeConfig`.
- 15.5.x patch releases ([GitHub releases](https://github.com/vercel/next.js/releases?q=v15.5&expanded=true)):
  15.5.5 adds a deprecation warning for runtime config and
  `experimental.middlewareClientMaxBodySize`; 15.5.14 adds
  `images.maximumDiskCacheSize`; 15.5.22 rejects TypeScript 7 and later (the
  repository uses 5.9.3); 15.5.7, 15.5.9, 15.5.10, 15.5.13, 15.5.15, 15.5.16,
  15.5.18 and 15.5.21 are security releases; 15.5.24 fixes the two critical
  advisories [GHSA-p293-qw3h-jr36](https://github.com/vercel/next.js/security/advisories/GHSA-p293-qw3h-jr36)
  and [GHSA-2xp9-vwfh-vxw4](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4);
  15.5.25 re-enables AVIF optimization with newer `sharp`; 15.5.26 hardens
  `next/og` ([notes](https://nextjs.org/blog/nextjs-security-update-september-22-2026)).
- npm dist-tags on 2026-09-25: `backport` is 15.5.26, `latest` is 16.3.6.
- `@nx/next` 22.x supports `next >=14.0.0 <17.0.0` (the support matrix cited in
  `thoughts/shared/tickets/singlepagestartup/ISSUE-162.md`).

### hono

- Imports across `apps` and `libs`: `hono` (225), `hono/http-exception` (157),
  `hono/jwt` (39), `hono/types` (19), `hono/factory` (19), `hono/cookie` (16),
  `hono/utils/http-status` (9), `hono/cors` (3), `hono/utils/jwt/types` (2),
  `hono/bun` (2), `hono/utils/cookie` (1), `hono/logger` (1). No code uses
  `serveStatic`, `bodyLimit`, `ipRestriction`, the hono cache middleware,
  `toSSG`, `parseBody({ dot: true })`, `app.mount()` or the `jwt()` middleware.
- JWT verification. From 4.11.4 `verify(token, publicKey, algOrOptions)`
  requires `algOrOptions`; `dist/utils/jwt/jwt.js` in 4.12.34 throws
  `JwtAlgorithmRequired` when it is missing and `JwtAlgorithmMismatch` when the
  token header names another algorithm. 4.10.4 defaulted to `HS256` and ignored
  the header. `sign()` still defaults to `HS256`, and every `sign()` call in the
  repository uses that default.
- Live `verify()` calls that pass no algorithm (23):
  - the shared helper `libs/shared/backend/utils/src/lib/jwt-verify/index.ts:21`;
  - `libs/middlewares/src/lib/actions-logger/index.ts:71`;
  - RBAC subject services: `service/singlepage/init.ts:118`,
    `service/singlepage/billing/route.ts:83`,
    `service/singlepage/authentication/oauth/start.ts:134`;
  - RBAC subject controllers under
    `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/`:
    `identity/create.ts:35`, `identity/delete.ts:33`, `identity/update.ts:32`,
    `crm-module/from/request/create.ts:53`, `authentication/init.ts:26`,
    `authentication/ethereum-virtual-machine.ts:43`,
    `authentication/refresh.ts:47`, `authentication/oauth/exchange.ts:55`,
    `authentication/email-and-password/registration/index.ts:36`,
    `authentication/email-and-password/authentication/index.ts:43`,
    `ecommerce-module/order/create.ts:42`, `order/list.ts:37`,
    `order/quantity.ts:37`, `order/total.ts:40`, `order/id/delete.ts:52`,
    `order/id/quantity.ts:51`, `order/id/total.ts:51`, `order/id/update.ts:44`.
    `libs/middlewares/src/lib/bill-route/index.ts:80` is inside a commented-out
    block.
- `service/singlepage/init.ts:118` catches every verification error and
  returns `null`, so a throwing `verify()` makes session initialization create a
  new subject for a valid token. `init.spec.ts` ("When: a valid token is
  presented Then: the subject is reused without an insert") exercises this path
  with the real `hono/jwt`.
- Every verified token is an RBAC subject token signed with `RBAC_JWT_SECRET`
  (`libs/shared/utils/src/lib/envs/rbac.ts:29`), and every direct call site
  already imports that secret from `@sps/shared-utils`. No constant names the
  algorithm; `libs/shared/utils/src/lib/constants/index.ts` holds the
  framework's shared constants (for example `RBAC_PRIVILEGED_CONTEXT_KEY` at
  `:43`).
- Error mapping. The helper treats names matching
  `/^Jwt(Token|Header|Payload)/` (`jwt-verify/index.ts:11`) as credential
  failures and rethrows everything else. `http-error/paterns/index.ts:5-20`
  lists the 401 patterns; the message
  `JWT algorithm mismatch: expected "HS256", got "..."` matches none of the
  entries and falls through to `Internal server error: ...` (500) in
  `http-error/index.ts`. The existing hono message formats are unchanged in
  4.12.34, so `http-error/sanitize/index.ts` keeps matching them.
- Claims. 4.12.18 rejects non-numeric or non-finite `exp`, `nbf` and `iat`;
  every `sign()` payload in the repository computes them with `Math.floor` or
  numeric environment values.
- CORS. `apps/api/app.ts:42-61` passes an `origin` function that reflects the
  request origin, with `credentials: true`. The function branch of
  `dist/middleware/cors/index.js` is unchanged in 4.12.34; the 4.12.25 fix
  concerns the default wildcard origin.
- Cookies. 4.12.x rejects invalid cookie names and `;`, CR or LF in `domain`,
  `path`, `sameSite` and `priority`, returns the first of duplicate cookies and
  builds the parsed object without a prototype. The repository reads cookies
  only by name and writes `rbac.subject.jwt` and `rbac.oauth.exchange-code`
  (`oauth/cookie.ts`) with fixed options.
- Body parsing. `c.req.parseBody()` carries multipart writes (for example
  `libs/shared/backend/api/src/lib/controllers/rest/handler/create/index.ts:20`).
  4.12.34 buffers the body and builds `FormData` from it instead of calling
  `request.formData()`; the returned shape is unchanged.
- Versions. The latest 4.12.x is 4.12.34 and `latest` is 4.13.9. Three
  moderate advisories are fixed only in 4.13.5
  ([GHSA-crvj-82cr-hjcx](https://github.com/advisories/GHSA-crvj-82cr-hjcx),
  [GHSA-g6gw-c38x-mqfc](https://github.com/advisories/GHSA-g6gw-c38x-mqfc),
  [GHSA-gqvv-2mrq-wpjv](https://github.com/advisories/GHSA-gqvv-2mrq-wpjv));
  they affect the hono cache middleware and query-inspecting proxies,
  `parseBody({ dot: true })`, and `toSSG()`. 4.13.0
  ([release](https://github.com/honojs/hono/releases/tag/v4.13.0)) moves
  RegExpRouter's `UnsupportedPathError` from the first match to route
  registration and adds `QUERY` to the default CORS methods. Release notes:
  [4.11.4](https://github.com/honojs/hono/releases/tag/v4.11.4),
  [4.12.25](https://github.com/honojs/hono/releases/tag/v4.12.25),
  [4.12.34](https://github.com/honojs/hono/releases/tag/v4.12.34).

### Model Context Protocol SDK

- Server: `apps/mcp/http.ts:158-178` builds a new `McpServer` through
  `createMcpServer()` and a new `StreamableHTTPServerTransport` for each
  session, keyed by `sessionIdGenerator`; `apps/mcp/index.ts` connects one
  server to stdio; `apps/mcp/actions.ts:27` also builds a module-level instance
  that `http.ts` never connects. `apps/mcp/content-management.ts` registers
  tools with zod v3 raw shapes (`inputSchema: <Schema>.shape`) and derives
  `ToolHandler` from `Parameters<McpServer["registerTool"]>[2]`;
  `apps/mcp/lib/auth.ts` uses `RequestHandlerExtra` from `shared/protocol.js`.
- `apps/mcp/lib/oauth.ts:9` imports `jsonwebtoken`; the OAuth code does not
  import the SDK.
- Client: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/mcp/singlepagestartup-client.ts`
  uses `Client` and `StreamableHTTPClientTransport`, and imports `ajv` directly
  (`:3`) with the ajv 6 option `strictDefaults` (`:184`). The root manifest does
  not declare `ajv`; the hoisted copy is 6.12.6.
- 1.26.0 (`npm view`): dependencies add `hono ^4.11.4`, `@hono/node-server`,
  `jose`, `express ^5.2.1`, `ajv ^8.17.1`; `zod ^3.25 || ^4.0` is a dependency
  and a required peer. The built files import `zod/v4`, `zod/v4-mini`,
  `zod/v4/core` and `zod/v3`, which exist from zod 3.25.0.
- Behavior in 1.26.0: `Protocol.connect()` throws "Already connected to a
  transport" for a second transport on the same instance; a stateless transport
  throws when reused across requests; `enableDnsRebindingProtection` still
  defaults to `false`; the transport options used by `http.ts`
  (`sessionIdGenerator`, `onsessioninitialized`, `onsessionclosed`) and
  `handleRequest(req, res, parsedBody)` keep their names and shapes.
- Release notes 1.18.2 to 1.26.0
  ([releases](https://github.com/modelcontextprotocol/typescript-sdk/releases)):
  1.23.0 adds zod v4 with compatibility for zod 3.25 and later; 1.24.0 changes
  Origin validation inside DNS rebinding protection; 1.24.2 moves express out of
  the core server; 1.25.0 removes loose and passthrough types that the MCP
  specification does not define; 1.26.0 fixes
  [GHSA-345p-7cg4-v4c7](https://github.com/modelcontextprotocol/typescript-sdk/security/advisories/GHSA-345p-7cg4-v4c7).
- npm has only 1.26.0 on the 1.26 line; `latest` is 1.30.1.
- Specs: `apps/mcp/actions.spec.ts` (in-memory client round trip),
  `apps/mcp/content-management.spec.ts`, `apps/mcp/lib/oauth.spec.ts`,
  `apps/mcp/lib/content-management/auth.spec.ts` and the RBAC client spec
  `.../social-module/profile/mcp/singlepagestartup-client.spec.ts`.

### Dependency resolution on a scratch copy

Run on copies of `package.json`, `package-lock.json` and `.npmrc` in the
session scratchpad with `npm install --package-lock-only`:

| Root manifest change                                   | Result                                                                          |
| ------------------------------------------------------ | ------------------------------------------------------------------------------- |
| next 15.5.26, hono 4.12.34, SDK `^1.26.0`              | SDK resolves to 1.30.1; zod stays 3.24.2; zod 4.6.5 nested under the SDK        |
| next 15.5.26, hono 4.12.34, SDK 1.26.0, zod `^3.25.76` | SDK 1.26.0 shares root zod 3.25.76; root ajv stays 6.12.6; SDK nests ajv 8.20.0 |

`npm audit fix --package-lock-only` on the second copy leaves `package.json`
unchanged and changes 949 packages in the lockfile (346 entries added, 516
removed, 630 changed). Direct dependencies among them: the Nx packages
22.0.2 to 22.7.12 (pulled by `@nx/devkit` through `minimatch`), `@aws-sdk/*`
3.758.0 to 3.1141.0, eslint 9.22.0 to 9.39.5, `@tiptap/*` 2.11.5 to 2.27.3,
wagmi 2.14.13 to 2.19.5, react-router-dom 7.3.0 to 7.18.4, sass, lodash,
nanoid, js-cookie, flatted, path-to-regexp, image-size, postcss (root copy),
npm, verdaccio, `@vercel/blob` and jsonwebtoken, all within their declared
ranges.

### npm audit

| Tree                                          | critical | high | moderate | low |
| --------------------------------------------- | -------- | ---- | -------- | --- |
| baseline, `--omit=dev`                        | 4        | 34   | 47       | 6   |
| baseline, all                                 | 8        | 81   | 81       | 13  |
| scratch, four upgrades, `--omit=dev`          | 3        | 33   | 46       | 6   |
| scratch, upgrades and audit fix, `--omit=dev` | 1        | 8    | 28       | 0   |
| scratch, upgrades and audit fix, all          | 1        | 27   | 49       | 0   |

After the scratch `npm audit fix`, the runtime critical and high entries need a
major version or sit behind a pinned transitive range: `tar` through
`@mapbox/node-pre-gyp` (from `bcrypt` 5), `brace-expansion`, `drizzle-orm`
(fix in 0.45), `image-size` (fix in 2.x), `nodemailer` (fix in 10.x), next's own
`postcss` 8.4.31 (fix only in next 16), `undici` through `@vercel/blob` (fix in
2.x) and `ws` through wagmi's WalletConnect packages (fix in wagmi 3).

### Python LLM service

- `apps/llm/requirements.txt` pins `fastapi==0.115.6`,
  `python-multipart==0.0.20`, `uvicorn[standard]==0.34.0`,
  `pydantic-settings==2.7.1`; `apps/llm/Dockerfile` uses `python:3.12-slim`;
  `apps/llm/install.sh` accepts Python 3.11 or 3.12.
- `apps/llm/routers/openai/audio.py:23-27` takes `file: UploadFile` and four
  `Form(...)` fields.
- Advisories for python-multipart 0.0.20 (GitHub advisory database):
  GHSA-wp53-j4wj-2cfg (fixed 0.0.22), GHSA-mj87-hwqh-73pj (0.0.26),
  GHSA-pp6c-gr5w-3c5g (0.0.27), GHSA-5rvq-cxj2-64vf, GHSA-6jv3-5f52-599m and
  GHSA-vffw-93wf-4j4q (0.0.30), GHSA-v9pg-7xvm-68hf (0.0.31). The latest release
  is 0.0.32 (requires Python 3.10 or later).
  [Release notes](https://github.com/Kludex/python-multipart/releases).
- `fastapi==0.115.6` accepts `python-multipart>=0.0.7` and Starlette
  `>=0.40.0,<0.42.0`
  ([PyPI](https://pypi.org/project/fastapi/0.115.6/)).
- Scratch venv (Python 3.11, fastapi 0.115.6, Starlette 0.41.3,
  python-multipart 0.0.32): `python_multipart.__version__` and the legacy
  `multipart` module are present, `ensure_multipart_is_installed()` passes, a
  `TestClient` multipart POST with the audio route's parameters returns 200 with
  the parsed fields, `import main` registers `/v1/audio/transcriptions`, and
  `python -m unittest discover -s tests -p 'test_*.py'` in `apps/llm` runs 13
  tests, all passing.

### Dependabot and ecosystem locations

- `.github` holds `ISSUE_TEMPLATE/` and 12 workflows; there is no
  `dependabot.yml`. Workflows use `actions/checkout@v4`/`@v5`,
  `docker/login-action@v4` and `docker/build-push-action@v7`.
- Dockerfiles: `/Dockerfile` (`node:24`), `/.gitpod.Dockerfile`,
  `/apps/db/Dockerfile` (`pgvector/pgvector:pg17`), `/apps/llm/Dockerfile`
  (`python:3.12-slim`), `/apps/redis/Dockerfile` (`redis:latest`),
  `/tools/deployer/icp/Dockerfile` (`node:18`), `/.devcontainer/Dockerfile`.
  Compose files reference only floating tags (`adminer`,
  `ollama/ollama:latest`).
- Other lockfiles outside the root install:
  `apps/studio/runnable/singlepage/admin-v2/bun.lock` and
  `apps/studio/runnable/startup/singlepagestartup/package-lock.json`.
- GitHub documentation
  ([options reference](https://docs.github.com/en/code-security/dependabot/working-with-dependabot/dependabot-options-reference),
  [supported ecosystems](https://docs.github.com/en/code-security/dependabot/ecosystems-supported-by-dependabot/supported-ecosystems-and-repositories)):
  `directories` takes several paths; a group applies to version updates unless
  `applies-to: security-updates` is set; `open-pull-requests-limit`, `schedule`
  and `cooldown` affect version updates only; security updates inherit
  `labels`, `assignees` and `commit-message`; `docker` reads Dockerfile `FROM`
  lines and `docker-compose` is a separate ecosystem; npm works with or without
  a lockfile. Without `group-by: dependency-name`, a group over several
  directories opens one pull request per directory
  ([changelog](https://github.blog/changelog/2026-02-24-dependabot-can-group-updates-by-dependency-name-across-multiple-directories/)).

### Baseline verification in this worktree

- `npm ci` completed in 2m54s.
- The 24 unit projects of `test:unit:scoped` plus `mcp` pass: 828 tests.
- `npx tsc --noEmit --incremental false -p apps/api/tsconfig.json` reports 25
  errors, all Bun and DOM `File`/`FormData` type conflicts and `unknown` JSON
  results in billing, file-storage, host, rbac, agent, providers and
  third-parties code. `apps/mcp` and `apps/telegram` report none.

## Code References

- `package.json:77,144,161,194` - SDK, hono, next and zod ranges.
- `apps/host/package.json:15,49,65,74,91,102` - host pins for the SDK, ajv, hono, next, sharp and zod.
- `.npmrc:1` - `legacy-peer-deps=true`.
- `apps/host/project.json:21-27` - `@nx/next:build` writing into `apps/host`.
- `apps/host/next.config.js:27-120` - host configuration.
- `apps/host/app/[[...url]]/page.tsx:10-12` - route segment exports.
- `libs/shared/backend/utils/src/lib/jwt-verify/index.ts:11,21` - credential pattern and `verify()` call.
- `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts:5-20` - 401 patterns.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/init.ts:118` - session reuse through `verify()`.
- `libs/shared/utils/src/lib/constants/index.ts:43` - shared constants module.
- `apps/api/app.ts:42-61` - CORS configuration.
- `apps/mcp/http.ts:158-178` - per-session server and transport.
- `libs/modules/rbac/.../mcp/singlepagestartup-client.ts:3,184` - direct ajv import.
- `apps/llm/requirements.txt` and `apps/llm/routers/openai/audio.py:23-27` - Python pins and the multipart route.

## Architecture Documentation

- One npm install at the repository root serves the API (Bun), the host
  (Next.js), MCP, Telegram and the tools; per-app manifests only hold scripts.
- Authentication tokens are HS256 JWTs signed with `RBAC_JWT_SECRET` through
  `hono/jwt` and verified either directly in RBAC controllers and services or
  through the shared `verifyJwt` helper, whose failures map to fixed messages.
  Errors reach clients through `ExceptionFilter`, which classifies messages by
  pattern and sanitizes JWT material.
- The MCP service authenticates with its own OAuth tokens (`jsonwebtoken`) and
  forwards the RBAC subject JWT to the API.

## Historical Context (from thoughts/)

- `thoughts/shared/tickets/singlepagestartup/ISSUE-162.md` - the Next.js 16
  migration, kept separate; a Next 16 attempt was merged and reverted
  (commits `1ff51c1179` and `74a29844f2`).

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-229.md` - the error
  mapping that hono's JWT failure messages feed.

## Open Questions

- The algorithm argument: one shared constant for the 23 call sites, or a
  literal at each.
- Whether to hold hono on 4.12.34 in the root manifest so that `npm audit fix`
  does not move it to 4.13.x, which is outside the agreed scope.
- Whether `npm audit fix`'s move of the Nx toolchain to 22.7.12 passes the host
  build and the unit lanes; the scratch run proves only the resolution.
