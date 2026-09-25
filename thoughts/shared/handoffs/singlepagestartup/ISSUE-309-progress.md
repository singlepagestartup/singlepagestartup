---
issue_number: 309
issue_title: "Upgrade vulnerable runtime dependencies and add Dependabot version updates"
start_date: 2026-09-25T21:50:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-309.md
status: in_progress
---

# Implementation Progress: ISSUE-309 - Upgrade vulnerable runtime dependencies and add Dependabot version updates

**Started**: 2026-09-25
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-309.md`

## Baseline (before any change)

- `npm ci --no-audit --no-fund`: exit 0, 2m54s.
- `npm audit --omit=dev`: 4 critical, 34 high, 47 moderate, 6 low (91). All dependencies: 8 critical, 81 high, 81 moderate, 13 low (183).
- `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run-many --target=jest:test --projects=<24 test:unit:scoped projects>,mcp --parallel=3 --skip-nx-cache`: 24 projects, 828 tests, all pass (1m56s).
- `NODE_OPTIONS=--max-old-space-size=12288 npx tsc --noEmit --incremental false -p apps/api/tsconfig.json`: 25 errors (Bun and DOM `File`/`FormData` conflicts, `unknown` JSON results); `apps/mcp`: 0; `apps/telegram`: 0.

## Phase Progress

### Phase 1: Runtime manifests and install

- [x] Started: 2026-09-25T21:55Z
- [x] Completed: 2026-09-25T22:00Z
- [x] Automated verification: PASSED

**Notes**: root `package.json` pins next 15.5.26, hono 4.12.34, `@modelcontextprotocol/sdk` 1.26.0 and zod `^3.25.76`; `apps/host/package.json` pins the same four; `apps/api`, `apps/openapi`, `apps/telegram` declare hono `^4.12.34` and `apps/mcp` the SDK `^1.26.0`. `npm install --no-audit --no-fund`: exit 0, 37s, 44 lockfile entries changed (the four packages, `@next/env` and `@next/swc-*`, the SDK's new dependencies `@hono/node-server`, `jose`, `json-schema-typed`, nested ajv 8.20.0 and express 5.2.1, `zod-to-json-schema` 3.25.2, qs 6.16.0). One zod 3.25.76 serves the SDK; root ajv stays 6.12.6.

### Phase 2: Adapt JWT verification to hono 4.12

- [x] Started: 2026-09-25T22:00Z
- [x] Completed: 2026-09-25T22:40Z
- [x] Automated verification: PASSED

**Notes**:

- The type-check after the install found 23 `verify()` arity errors (TS2554), 15 `string | undefined` errors from `c.req.param()` in seven handlers typed with a bare `Context`, 21 MCP errors (`Parameters<McpServer["registerTool"]>[2]` resolves to `never`, and `ReadResourceResult` contents are a text-or-blob union) and one Telegram error (`app.on()` has no single-path overload for a variable handler list). See Incidents 1 to 3.
- `RBAC_JWT_ALGORITHM` (`HS256`) added to `libs/shared/utils/src/lib/constants/index.ts` and passed at the 23 call sites; the helper counts `JwtAlgorithmMismatch` as a credential failure and the 401 patterns include `jwt algorithm mismatch`.
- `tsc --noEmit --incremental false`: `apps/api` 25 errors, identical to the baseline list; `apps/mcp`, `apps/telegram`, `apps/openapi` 0.
- `nx run-many --target=jest:test --projects=@sps/backend-utils,@sps/shared-utils,@sps/middlewares,@sps/rbac,@sps/billing,@sps/notification,mcp,telegram,api --skip-nx-cache`: all pass after the `init.spec.ts` fixture fix (Incident 4); `@sps/rbac` 380 tests.
- Mutation checks (each restored afterwards): `init.ts` without the algorithm fails 2 of 5 `init.spec.ts` scenarios (valid token reuse, deleted subject); the helper without the algorithm fails all 6 helper scenarios; the helper pattern without `AlgorithmMismatch` fails the new HS512 scenario; the 401 patterns without the mismatch entry fail the new classifier case. Restored: 100 of 100 in the two specs.

### Phase 3: npm audit fix and host pin sync (lands on `claude/issue-309-audit-fix`)

- [x] Started: 2026-09-25T22:45Z
- [x] Completed: 2026-09-25T23:30Z
- [x] Automated verification: PASSED

**Notes**:

- After the four upgrades, `npm audit --omit=dev`: 3 critical, 33 high, 46 moderate, 6 low (88); all dependencies 7/79/83/13 (182).
- `npm audit fix --no-fund` (pass 1, 4m31s): added 660, removed 490, changed 572 packages; `package.json` untouched. Moves the Nx toolchain 22.0.2 to 22.7.12, eslint to 9.39.5, `@aws-sdk/*` to 3.1141.0, `@tiptap/*` to 2.27.3, wagmi 2.19.5, viem 2.56.9, sharp 0.35.4 (inside next's `^0.34.3 || ^0.35.4`), and re-hoists uuid 8.3.2 over 9.0.1.
- Pass 2 (43s): `brace-expansion` 1.1.21, `minimatch` 3.1.5, three nested minimatch copies removed. `npm audit fix --dry-run` afterwards: up to date.
- Final `npm audit --omit=dev`: 1 critical, 7 high, 28 moderate, 0 low (36); all dependencies 1/27/49/0 (77). Remaining runtime critical and high: tar 6.2.1 (bcrypt 5.1.1 through @mapbox/node-pre-gyp), @mapbox/node-pre-gyp, drizzle-orm (fix in 0.45), image-size (fix in 2.x), nodemailer (fix in 10.x), next's postcss 8.4.31 (fix in next 16), undici through @vercel/blob (fix in 2.x), ws through wagmi (fix in 3.x).
- Host pins: 18 more pins follow the installed tree (22 moved in total, counting next, hono, the SDK and zod from Phase 1); 93 of 94 pins equal the installed versions, `openai` keeps its older pin as before.
- Nx 22.7.12 refused the project graph (Incident 5); `apps/host/project.json` `next:dev` drops `cache: true`.

### Phase 4: Python LLM service

- [x] Started: 2026-09-25T23:30Z
- [x] Completed: 2026-09-25T23:31Z
- [x] Automated verification: PASSED

**Notes**: `python-multipart==0.0.32`. Scratch venv (Python 3.11, same requirements file): fastapi 0.115.6, Starlette 0.41.3; `ensure_multipart_is_installed()` passes; a `TestClient` POST with the audio route's `UploadFile` and `Form` fields returns 200 with the parsed values; `import main` registers `/v1/audio/transcriptions`; `python -m unittest discover -s tests -p 'test_*.py'` in `apps/llm`: 13 tests OK.

### Phase 5: Dependabot version updates

- [x] Started: 2026-09-25T23:31Z
- [x] Completed: 2026-09-25T23:35Z
- [x] Automated verification: PASSED

**Notes**: `.github/dependabot.yml` validates against the SchemaStore `dependabot-2.0` schema (ajv 8, draft-07) and passes `prettier --check`.

### Phase 6: Full verification (combined tree, before the branch split)

- [x] Started: 2026-09-25T23:35Z
- [x] Completed: 2026-09-26T02:00Z
- [x] Automated verification: PASSED

**Notes**:

- `tsc --noEmit --incremental false`: `apps/api` 23 errors, the baseline list minus two `FormDataEntryValue` conversions the updated type packages resolve; `apps/mcp`, `apps/telegram`, `apps/openapi` 0.
- `nx run-many --target=jest:test` over the 24 `test:unit:scoped` projects plus `mcp`, `telegram`, `@sps/backend-utils`, `@sps/shared-utils`, `@sps/middlewares` (`--parallel=2 --skip-nx-cache`): 28 projects, 1139 tests, all pass; the 25 baseline projects still total 828.
- `NODE_OPTIONS=--max-old-space-size=12288 NX_DAEMON=false npm run host:build -- --skip-nx-cache`: first run failed after 4m19s on the `@x402/*` optional peers (Incident 7); second run compiled in 2.8 min and failed type checking on the `node_modules/zod/lib` imports (Incident 8); third run **succeeded in 5m31s** on Next.js 15.5.26: compiled with warnings in 2.5 min, types valid, 8 static pages, the route table printed and middleware 34.3 kB. The only compile warning is the unresolved `@react-native-async-storage/async-storage` in `@metamask/sdk`, whose baseline version 0.32.0 references it too. `generateStaticParams` and the sitemap log `fetch failed` (ECONNREFUSED) because no API ran during the build; both catch it and the build continues, as in the Docker image build. The build rewrote `apps/host/package.json` with one addition, `semver` 6.3.1, which `@nx/next` 22.7 adds for its `.nx-helpers/with-nx.js`.
- `NODE_OPTIONS=--max-old-space-size=12288 npx tsc --noEmit --incremental false -p apps/host/tsconfig.json`: 0 errors (3m05s).
- `npx eslint apps/host/next.config.js` and the two changed `ClientComponent.tsx` files: exit 0.
- API on port 4309 (`API_SERVICE_PORT=4309 ... npm run api:dev`): boots in about 6 s; `GET /api/host/pages`, `/api/host/layouts`, `/api/website-builder/widgets` 200; preflight from `https://tunnel.example.test` 204 with that origin and `Access-Control-Allow-Credentials: true`, and the GET reflects it too; `authentication/init` 201, again with its own token 201 on the same subject; `authentication/me` and `/:id/ecommerce-module/orders/quantity` 200 with the issued HS256 token and 401 "Authentication error. Invalid token" with an HS512 token over the same claims and secret, which the body does not echo; multipart upload of a 2x3 PNG to `/api/file-storage/files` 201 (`image/png`, 2x3, 73 bytes) and delete 200, no file left in the worktree; throwaway subjects deleted (200).
- HTTP mutation check: without the two mismatch mappings the HS512 token gets 500 "Internal server error: JWT algorithm mismatch..."; restored, 401.
- `NODE_OPTIONS=--max-old-space-size=12288 NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run-many --target=eslint:lint --projects=@sps/shared-utils,@sps/backend-utils,@sps/rbac,@sps/billing,@sps/notification,mcp,telegram,host,api,openapi --parallel=2 --skip-nx-cache`: exit 0 in 21m34s, 0 errors; `api` reports 2 warnings for unused `/* eslint-disable */` headers in `apps/api/jest.integration.config.ts` and `apps/api/jest.scenario.config.ts`, which this branch does not touch. `@sps/middlewares` has no lint target.
- MCP HTTP server on 127.0.0.1:14309 with `KV_PROVIDER=memory` (Incident 6): protected-resource metadata 200; `POST /mcp` without a token 401 with `WWW-Authenticate`; `/internal/rbac-subject-token-exchange` 200 (Bearer, `mcp:content`); an SDK 1.26.0 client over Streamable HTTP gets a session, 20 tools, `model-record-find` properties `module,model,filters,orderBy,limit,offset`, `project-guide` returns text, 3 resources, and `model-record-find` on `host.page` returns an `ok` envelope from the API through the forwarded subject JWT.

## Branch split

The combined commits `b8693e1caa` (code) and `730964988f` (docs) are replaced
by two branches, so the agreed upgrades can merge on their own and the broad
`npm audit fix` is reviewed separately:

- `claude/issue-309-dependency-upgrades`: the four upgrades, zod, the app
  manifests, the lockfile as `npm install` produces it for those changes,
  `.github/dependabot.yml` and every code change the upgrades require (the RBAC
  JWT algorithm, the hono 4.12 route-param guards and `app.on()` path array, the
  SDK tool callback type, the zod imports). No `npm audit fix`.
- `claude/issue-309-audit-fix`, on top of it: the `npm audit fix` lockfile, the
  host pins that follow it, `semver` from the Nx 22.7 build, the `next:dev`
  cache flag and the `@x402/*` externals.

### Branch 1 verification (`claude/issue-309-dependency-upgrades`)

- `git reset --soft 78d7d43125`, base versions restored for `package-lock.json`,
  `apps/host/package.json`, `apps/host/project.json` and
  `apps/host/next.config.js`; `npm install --no-audit --no-fund`: exit 0 in 24s,
  and the lockfile is byte-identical to the first upgrade-only install of
  Phase 1. Installed: next 15.5.26, hono 4.12.34, SDK 1.26.0, zod 3.25.76,
  Nx 22.0.2, wagmi 2.14.13, sharp 0.34.5, ajv 6.12.6, qs 6.16.0, uuid 9.0.1.
- Host pins: next, hono, the SDK, zod and qs (6.16.0, pulled by the SDK's
  express dependencies) follow the installed tree; 93 of 94 pins equal the
  installed versions, `openai` keeps its older pin.
- `npm audit --omit=dev`: 3 critical, 33 high, 46 moderate, 6 low (88), from
  4/34/47/6; all dependencies 7/79/83/13 (182), from 8/81/81/13. next, hono and
  the SDK no longer appear.
- `tsc --noEmit --incremental false`: `apps/api` 25 errors, identical to the
  baseline list; `apps/mcp`, `apps/telegram`, `apps/openapi` 0.
- `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run-many --target=jest:test`
  over the 28 projects (`--parallel=3 --skip-nx-cache`): exit 0, 1139 tests
  pass (41s).
- `NODE_OPTIONS=--max-old-space-size=12288 NX_DAEMON=false npm run host:build -- --skip-nx-cache`:
  exit 0 in 4m01s; compiled successfully in 2.5 min with no warnings, types
  valid, 8 static pages, middleware 34.3 kB; `apps/host/package.json`
  unchanged by the build.
- API on port 4309: list reads 200; preflight and GET from
  `https://tunnel.example.test` reflect the origin with credentials allowed;
  session init with its own token reuses the subject; `authentication/me` and
  the cart quantity 200 with the issued HS256 token and 401 "Authentication
  error. Invalid token" with an HS512 token over the same claims, which the body
  does not echo; a multipart PNG upload stores `image/png` 2x3 and deletes (200);
  throwaway subjects deleted.
- MCP HTTP server with SDK 1.26.0 (`KV_PROVIDER=memory`): protected-resource
  metadata 200, `/mcp` without a token 401, internal token exchange 200, an SDK
  client lists 20 tools and `model-record-find` round-trips to the API.

### Branch 2 verification (`claude/issue-309-audit-fix`)

- Branch 1's lockfile is byte-identical to the input of the two
  `npm audit fix` passes of Phase 3, so the lockfile, the host pins and the
  host configuration come from that result (combined commit `b8693e1caa`).
  `npm ci --no-audit --no-fund`: exit 0 in 39s. Installed: Nx 22.7.12,
  wagmi 2.19.5, eslint 9.39.5, `@aws-sdk/client-s3` 3.1141.0, sharp 0.35.4.
- `npm audit fix --dry-run` against the current registry: up to date.
- Against branch 1 the lockfile adds 346 entries, removes 516 and changes 631;
  949 packages change version, 41 of them direct dependencies (the Nx
  toolchain, eslint and `@eslint/js`, `@aws-sdk/client-s3` and `-ses`,
  `@tiptap/*`, wagmi and viem, react-router-dom, lodash, nanoid, js-cookie,
  flatted, path-to-regexp, image-size, npm, sass, verdaccio and others), all
  within their declared ranges.
- Host pins: 94 of 95 equal the installed versions, `openai` keeps its older
  pin; the host build keeps `semver` in alphabetical order (the first build
  appended it, a rebuild sorts it).
- `npm audit --omit=dev`: 1 critical, 7 high, 28 moderate, 0 low (36), from
  3/33/46/6 on branch 1 and 4/34/47/6 at the base; all dependencies 1/27/49/0
  (77).
- `tsc --noEmit --incremental false`: `apps/api` 23 errors, all from the
  baseline list; `apps/mcp`, `apps/telegram`, `apps/openapi` 0.
  `npx nx show projects` succeeds on Nx 22.7.12.
- Unit lanes over the same 28 projects: exit 0, 1139 tests pass (47s).
- `NODE_OPTIONS=--max-old-space-size=12288 NX_DAEMON=false npm run host:build -- --skip-nx-cache`:
  exit 0 in 5m11s; types valid, 8 static pages, middleware 34.3 kB.
- API on port 4309: the same HTTP proof as branch 1 passes in full; an HS512
  token answers 401 "Authentication error. Invalid token" without echoing the
  token.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 8 -->

### Incident 1 — hono 4.12 `verify()` requires the algorithm

- **Occurrences**: 1
- **Stage**: Phase 2 - Adapt JWT verification to hono 4.12
- **Symptom**: TS2554 "Expected 3 arguments, but got 2" at 23 `jwt.verify()` calls; at runtime `JwtAlgorithmRequired`, which `service/singlepage/init.ts` swallows and answers with a new subject.
- **Root Cause**: hono 4.11.4 made the algorithm argument mandatory (GHSA-f67f-6cw9-8mq4).
- **Fix**: `RBAC_JWT_ALGORITHM` from `@sps/shared-utils` as the third argument everywhere; mismatch mapped to 401.
- **Reusable Pattern**: type-check `apps/api` after any hono upgrade; `init.spec.ts` catches the runtime form.

### Incident 2 — hono 4.12 types `c.req.param()` as `string | undefined` on a bare `Context`

- **Occurrences**: 1
- **Stage**: Phase 2
- **Symptom**: 15 TS2322/TS2345/TS18048 errors in seven handlers that pass a route param on without a check.
- **Root Cause**: 4.12 disables the `string` overload of `param()` when the path type is `string`.
- **Fix**: the guard the other controllers already use, `if (!uuid) { throw new Error("Validation error. No uuid provided"); }`, right after each read; a matched route always carries the param, so the guard does not change responses.
- **Reusable Pattern**: read a route param and guard it in the same place, as the existing handlers do.

### Incident 3 — SDK 1.26 and hono 4.12 overloads break derived types

- **Occurrences**: 1
- **Stage**: Phase 2
- **Symptom**: `Parameters<McpServer["registerTool"]>[2]` became `never` (20 errors), `contents[0].text` no longer type-checks in `actions.spec.ts`, and `app.on(method, path, ...middlewares, handler)` in `apps/telegram/src/lib/app.ts` matched no overload.
- **Root Cause**: SDK 1.26 makes the callback generic over `undefined | ZodRawShapeCompat | AnySchema` and 1.25 removed passthrough types; hono 4.12 keeps a variable-length handler overload only for a path array.
- **Fix**: `type ToolHandler = ToolCallback<z.ZodRawShape>` (what the derived type resolved to under 1.18.1); cast the text resource in the spec; pass `[route.path]`.
- **Reusable Pattern**: name library types directly instead of deriving them with `Parameters<>` from generic methods.

### Incident 4 — module mock without the new constant

- **Occurrences**: 1
- **Stage**: Phase 2
- **Symptom**: `init.spec.ts` failed 2 scenarios after the call sites changed.
- **Root Cause**: the spec replaces `@sps/shared-utils` with a fixed object, so `RBAC_JWT_ALGORITHM` was `undefined` and `verify()` threw.
- **Fix**: add `RBAC_JWT_ALGORITHM: "HS256"` to that mock. The other five specs that mock the module for a `verify()` caller either mock `hono/jwt` or spread the real module.
- **Reusable Pattern**: after adding an export used by a caller, grep specs that `jest.mock` the exporting module with a plain object.

### Incident 5 — Nx 22.7 refuses a cached continuous target

- **Occurrences**: 1
- **Stage**: Phase 6 - Full verification
- **Symptom**: every `nx` command failed with "Failed to process project graph"; `--verbose` names host `next:dev`: "has both cache and continuous set to true".
- **Root Cause**: `npm audit fix` moved Nx to 22.7.12, which marks `@nx/next:server` targets continuous and rejects `cache: true` on them.
- **Fix**: removed `cache: true` from `next:dev` in `apps/host/project.json`.
- **Reusable Pattern**: after any Nx version change run `npx nx show projects --verbose` before the test lanes.

### Incident 6 — shared Redis rejects the copied KV credentials

- **Occurrences**: 1
- **Stage**: Phase 6
- **Symptom**: the API logs "KV connection error: WRONGPASS" and the MCP token exchange answered 500 while its OAuth store used Redis.
- **Root Cause**: `apps/api/.env` sets `KV_PROVIDER=redis` and a password the shared Redis on port 6384 does not accept; `ioredis` is unchanged at 5.6.0, so the upgrade is not involved.
- **Fix**: started the MCP proof with `KV_PROVIDER=memory`, which selects the in-memory OAuth store; the API serves requests without KV.
- **Reusable Pattern**: for local MCP OAuth checks in a worktree, set `KV_PROVIDER=memory` on the MCP process.

### Incident 7 — host build cannot resolve the `@x402/*` optional peers

- **Occurrences**: 1
- **Stage**: Phase 6 - Full verification
- **Symptom**: `npm run host:build` failed after 4m19s with "Module not found" for `@x402/core/client`, `@x402/evm`, `@x402/evm/exact/client`, `@x402/evm/upto/client` and `@x402/svm/exact/client`, traced from `libs/shared/frontend/client/web3/.../wagmi-config/default/index.ts` through `wagmi/connectors`.
- **Root Cause**: `npm audit fix` moved wagmi 2.14.13 to 2.19.5 (fixing moderate advisories in `@metamask/sdk` and `@walletconnect/ethereum-provider`), and `@wagmi/connectors` 6.2.0 adds a Base Account connector that lazily imports `@base-org/account`. Its Node entry imports `@coinbase/cdp-sdk` 1.57.0, whose `@x402/*` modules are optional peer dependencies and are not installed (`.npmrc` sets `legacy-peer-deps=true`). webpack resolves every `import()` target at build time, so the server compile fails although the app configures only the injected, Safe and WalletConnect connectors. The failure is not caused by next 15.5.
- **Fix**: `apps/host/next.config.js` adds `/^@x402\//` to the existing `config.externals.push("pino-pretty", "lokijs", "encoding")`, the line that already covers the wallet libraries' uninstalled optional modules.
- **Reusable Pattern**: after `npm audit fix` moves wallet packages, run the host build before anything else; an uninstalled optional peer of a wallet library joins that externals line.

### Incident 8 — two components import zod through `node_modules/zod/lib`

- **Occurrences**: 1
- **Stage**: Phase 6 - Full verification
- **Symptom**: the second host build compiled, then failed type checking: "Cannot find module 'node_modules/zod/lib'".
- **Root Cause**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/{create,delete}/ClientComponent.tsx` imported `z` from the path `node_modules/zod/lib`, which exists in zod 3.24 and not in 3.25 (the layout is now `v3/`, `v4/`, `v4-mini/`).
- **Fix**: `import { z } from "zod";`, the import the 17 sibling components use; `tsc --noEmit -p apps/host/tsconfig.json` then reports 0 errors.
- **Reusable Pattern**: before a host rebuild, run `tsc --noEmit -p apps/host/tsconfig.json` once: `next build` stops at the first type error, `tsc` lists all of them in about 3 minutes.

## Summary

### Changes Made

- `claude/issue-309-dependency-upgrades`: next 15.5.26, hono 4.12.34, `@modelcontextprotocol/sdk` 1.26.0, zod 3.25.76, python-multipart 0.0.32, the app manifests and host pins, the `npm install` lockfile, `.github/dependabot.yml`; `RBAC_JWT_ALGORITHM` at 23 sites with the mismatch mapped to 401 and tests; route-param guards in seven handlers and the Telegram path array for hono 4.12; the SDK tool callback type; the zod imports in two RBAC components.
- `claude/issue-309-audit-fix`: the `npm audit fix` lockfile, host pins and `semver`, the Nx 22.7 `next:dev` cache flag, the `@x402/*` externals.

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-26T03:05:00Z
