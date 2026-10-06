---
date: 2026-09-25T21:45:00Z
issue_number: 309
repository: singlepagestartup
topic: "Upgrade vulnerable runtime dependencies and add Dependabot version updates"
status: approved
---

# Upgrade vulnerable runtime dependencies and add Dependabot version updates Implementation Plan

## Overview

Move `next` to 15.5.26, `hono` to 4.12.34, `@modelcontextprotocol/sdk` to
1.26.0 and `python-multipart` to 0.0.32, run `npm audit fix` without `--force`,
adapt the code that the hono upgrade breaks, and add `.github/dependabot.yml`
for weekly version updates.

## Current State Analysis

Research: `thoughts/shared/research/singlepagestartup/ISSUE-309.md`.

- One npm install at the root serves every app; `apps/host/package.json`
  carries exact pins that the host build never refreshes; `.npmrc` disables
  peer checks.
- hono 4.11.4 and later throw `JwtAlgorithmRequired` from `verify()` without an
  algorithm. 23 live call sites pass none, and one of them
  (`service/singlepage/init.ts:118`) swallows the error and creates a new
  subject for a valid anonymous session.
- A token whose header names another algorithm raises `JwtAlgorithmMismatch`.
  The shared helper rethrows it and the HTTP error patterns map it to 500,
  where hono 4.10.4 produced a signature mismatch and 401.
- SDK 1.26.0 needs zod 3.25 or later; without it npm nests zod 4.6.5 under the
  SDK, and a caret range resolves the SDK to 1.30.1.
- Baseline: `npm audit --omit=dev` 4 critical, 34 high, 47 moderate, 6 low;
  828 unit tests pass; `apps/api` type-check has 25 errors, `apps/mcp` and
  `apps/telegram` none.

## Desired End State

- Root and host manifests pin next 15.5.26, hono 4.12.34 and SDK 1.26.0; root
  zod is `^3.25.76`; the lockfile is regenerated and passed through
  `npm audit fix`.
- Every RBAC JWT verification names its algorithm through one shared constant,
  and a token with a foreign algorithm still answers 401.
- `apps/llm/requirements.txt` pins `python-multipart==0.0.32`.
- `.github/dependabot.yml` schedules weekly version updates for npm (`/` and
  `/apps/host`, minor and patch grouped), pip (`/apps/llm`), GitHub Actions and
  Docker, and leaves security updates as they are.
- Verified by the unit lanes, the type-checks against the baseline, lint of the
  changed projects, `npm run host:build`, the API on port 4309 with HTTP proofs,
  the MCP specs, the LLM tests and `npm audit --omit=dev` before and after.

### Key Discoveries:

- `getVersion()` in Nx `createPackageJson` keeps existing pins in
  `apps/host/package.json` (research, "How `apps/host/package.json` is
  maintained"); host pins for moved packages change by hand, so they keep
  matching the installed tree as 93 of 94 do today.
- Every direct `verify()` call site already imports `RBAC_JWT_SECRET` from
  `@sps/shared-utils`; `libs/shared/utils/src/lib/constants/index.ts` holds the
  framework's shared constants.
- `jwt-verify/index.ts:11` enumerates hono's credential failure classes by name
  and `http-error/paterns/index.ts:5-20` enumerates them by message; both need
  the new mismatch failure.
- `apps/mcp/http.ts` already creates one server and one transport per session.

## What We're NOT Doing

- Next.js 16 (#162). The companions `@next/bundle-analyzer`,
  `@next/third-parties` and `eslint-config-next` stay on 15.2.2; npm audit does
  not flag them and `@next/third-parties` accepts next 15.
- hono 4.13.x. The root manifest pins 4.12.34 exactly, the way it holds `next`,
  so `npm audit fix` cannot move hono outside the agreed line. The three
  moderate advisories fixed only in 4.13.5 affect the hono cache middleware and
  query-inspecting proxies, `parseBody({ dot: true })` and `toSSG()`, none of
  which the repository uses; the Dependabot minor group will propose 4.13.x.
- SDK releases after 1.26.0. The root manifest pins 1.26.0 exactly, because
  `^1.26.0` resolves to 1.30.1.
- `npm audit fix --force` and the major upgrades it would install: drizzle-orm
  0.45, nodemailer 10, image-size 2, `@vercel/blob` 2, wagmi 3, bcrypt 6 (for
  `tar`) and next 16 (for next's own postcss).
- Routing the direct `verify()` calls through the shared helper: the helper
  replaces hono's messages with fixed ones, which changes responses.
- Passing the algorithm to `sign()`: its default is already HS256.
- Studio lockfiles, the `docker-compose` ecosystem (compose files use floating
  tags), Dependabot `labels`, `commit-message` or `groups` for security updates
  (each would change how security update pull requests look today).
- Declaring the implicit imports. The RBAC MCP client imports `ajv` and
  `apps/api/app.ts` imports `uuid` without a root declaration; after
  `npm audit fix` the hoisted copies are ajv 6.15.0 (still the ajv 6 API the
  client configures) and uuid 8.3.2 instead of 9.0.1, whose `v4()` the API
  uses unchanged.

## Use Cases That Keep Working

- Cross-origin API access with credentials: `apps/api/app.ts` passes an
  `origin` function, whose branch in the hono CORS middleware is unchanged;
  proven with a preflight and a GET from a foreign origin.
- File uploads: multipart bodies still arrive through `c.req.parseBody()`;
  proven with an image upload to file storage and its deletion.
- Anonymous cart: session init reuses the subject for its own token and the
  cart quantity route answers with it; proven over HTTP and by `init.spec.ts`.
- Local development against a tunnel: the API reflects any request origin and
  `apps/host/next.config.js` (including the `**.telebit.io` image pattern) is
  unchanged; proven by the foreign-origin preflight and the host build.
- MCP OAuth: the internal RBAC-subject token exchange and an SDK 1.26.0 client
  session against the MCP HTTP server, plus the `apps/mcp` specs.

## Implementation Approach

The work lands as two pull requests. `claude/issue-309-dependency-upgrades`
carries Phases 1, 2, 4 and 5: the agreed upgrades with the lockfile
`npm install` produces for them and every code change they require.
`claude/issue-309-audit-fix`, based on it, carries Phase 3: the
`npm audit fix` result and the host changes it forces. Each branch is verified
on its own tree.

Change the manifests first and install, then make the code compile and behave
as before against the new hono, then run `npm audit fix`, re-sync the host pins,
and verify the whole tree once more, including the host build. The Python pin
and the Dependabot file are independent of the npm tree.

## Phase 1: Runtime manifests and install

### Overview

Pin the four agreed versions and the zod floor the SDK requires, and regenerate
the lockfile.

### Changes Required:

#### 1. Root manifest

**File**: `package.json`
**Why**: the root manifest and `package-lock.json` are the only install input.
**Changes**: `next` 15.5.26 (exact, as today), `hono` 4.12.34 (exact, holds the
4.12 line), `@modelcontextprotocol/sdk` 1.26.0 (exact, holds 1.26), `zod`
`^3.25.76` (the SDK's required peer and dependency).

#### 2. Host manifest

**File**: `apps/host/package.json`
**Why**: its pins mirror the installed tree and the build does not refresh them.
**Changes**: `next` 15.5.26, `hono` 4.12.34, `@modelcontextprotocol/sdk` 1.26.0,
`zod` 3.25.76.

#### 3. Per-app script manifests

**Files**: `apps/api/package.json`, `apps/openapi/package.json`,
`apps/telegram/package.json`, `apps/mcp/package.json`
**Why**: they declare the same packages for the same processes with floors
below the patched versions.
**Changes**: `hono` `^4.12.34`; `@modelcontextprotocol/sdk` `^1.26.0`.

#### 4. Lockfile

**File**: `package-lock.json`
**Changes**: `npm install`; confirm next 15.5.26, hono 4.12.34, SDK 1.26.0 and
zod 3.25.76 are installed, no zod is nested under the SDK, and the root `ajv`
is still 6.12.6.

### Success Criteria:

#### Automated Verification:

- [x] `npm install` exits 0 and `node -p` reads the four versions from `node_modules`.
- [x] `npm ls zod ajv` shows one zod 3.25.76 used by the SDK and root ajv 6.12.6.

#### Manual Verification:

- [x] The lockfile diff touches only the upgraded packages and their dependencies.

---

## Phase 2: Adapt JWT verification to hono 4.12

### Overview

Name the algorithm at every RBAC JWT verification and keep a foreign-algorithm
token at 401.

### Changes Required:

#### 1. Algorithm constant

**File**: `libs/shared/utils/src/lib/constants/index.ts`
**Why**: one value shared by 23 call sites belongs with the shared constants.
**Changes**: add `RBAC_JWT_ALGORITHM` with the value `HS256` and a comment
tying it to hono's `sign()` default, which issues every RBAC token.

#### 2. Verification call sites

**Files**: `libs/shared/backend/utils/src/lib/jwt-verify/index.ts`,
`libs/middlewares/src/lib/actions-logger/index.ts`, the three RBAC subject
services and 18 RBAC subject controllers listed in the research.
**Why**: `verify()` throws without an algorithm.
**Changes**: pass `RBAC_JWT_ALGORITHM` as the third argument, imported from
`@sps/shared-utils` next to `RBAC_JWT_SECRET`. The commented-out block in
`bill-route/index.ts` stays as it is.

#### 3. Mismatch mapping

**Files**: `libs/shared/backend/utils/src/lib/jwt-verify/index.ts`,
`libs/shared/backend/utils/src/lib/http-error/paterns/index.ts`
**Why**: a token whose header names another algorithm is a credential the
caller supplied and answered 401 before the upgrade.
**Changes**: include `JwtAlgorithmMismatch` in the helper's credential pattern
and update its comment; add a `jwt algorithm mismatch` pattern to the 401 entry.

#### 4. Tests

**Files**: `libs/shared/backend/utils/src/lib/jwt-verify/index.spec.ts`,
`libs/shared/backend/utils/src/lib/http-error/index.spec.ts`
**Changes**: a scenario verifying a token signed with HS512 through the helper
(fixed "Invalid token" message, no token in it), and the mismatch message in the
401 table. Mutation checks: drop the algorithm from `init.ts` and from the
helper and see the existing valid-token scenarios fail; drop each mismatch
mapping and see the new scenarios fail.

#### 5. Type adaptations the upgraded declarations require

The type-check after the install reports errors beyond the `verify()` arity.
Each fix keeps runtime behavior and returns the checks to the baseline.

**Files**: `libs/modules/billing/models/payment-intent/backend/app/api/src/lib/controller/singlepage/provider/index.ts`,
`.../provider-webhook/index.ts`,
`libs/modules/notification/models/template/backend/app/api/src/lib/controller/singlepage/render/index.ts`,
`libs/modules/rbac/models/identity/backend/app/api/src/lib/controller/singlepage/change-password/index.ts`,
`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/identity/{create,update,delete}.ts`
**Why**: hono 4.12 types `c.req.param()` as `string | undefined` for handlers
typed with a bare `Context`.
**Changes**: the guard the other handlers use, `if (!<param>) { throw new
Error("Validation error. No <param> provided"); }`, right after each read. A
matched route always carries the parameter.

**File**: `apps/mcp/content-management.ts`
**Why**: `Parameters<McpServer["registerTool"]>[2]` resolves to `never` under
SDK 1.26.
**Changes**: `type ToolHandler = ToolCallback<z.ZodRawShape>`, the type the
derived expression produced under 1.18.1.

**File**: `apps/mcp/actions.spec.ts`
**Why**: resource contents are a text-or-blob union since SDK 1.25.
**Changes**: read the text resource through a cast of the content element.

**File**: `apps/telegram/src/lib/app.ts`
**Why**: hono 4.12 keeps a variable-length handler overload of `on()` only for
a path array.
**Changes**: pass `[route.path]`.

**File**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/init.spec.ts`
**Why**: the spec replaces `@sps/shared-utils` with a fixed object.
**Changes**: add `RBAC_JWT_ALGORITHM` to that object.

**Files**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/{create,delete}/ClientComponent.tsx`
**Why**: they import `z` from the path `node_modules/zod/lib`, which zod 3.25
no longer ships, and the host build's type check fails on it.
**Changes**: `import { z } from "zod";`, as the sibling components do.

### Success Criteria:

#### Automated Verification:

- [x] `npx tsc --noEmit --incremental false -p apps/api/tsconfig.json` reports the 25 baseline errors and no others; `apps/mcp` and `apps/telegram` report none.
- [x] `npx nx run @sps/backend-utils:jest:test`, `@sps/shared-utils`, `@sps/rbac` and `@sps/middlewares` unit lanes pass.
- [x] Mutation checks fail as described and pass once restored.

#### Manual Verification:

- [x] On the API (port 4309), session init with a valid token reuses the subject and a token signed with HS512 answers 401.

---

## Phase 3: npm audit fix and host pin sync (branch `claude/issue-309-audit-fix`)

### Overview

Apply the in-range fixes and keep the host manifest aligned with the result.

### Changes Required:

#### 1. Lockfile

**File**: `package-lock.json`
**Changes**: `npm audit fix` without `--force`; record the audit counts and the
packages it moved.

#### 2. Host manifest

**File**: `apps/host/package.json`
**Why**: the fix moves packages the host lists, and the build keeps stale pins.
**Changes**: for each listed package whose installed version changed since the
baseline snapshot, set the pin to the installed version; `openai` keeps its
existing pin.

#### 3. Nx configuration

**File**: `apps/host/project.json`
**Why**: `npm audit fix` moves Nx from 22.0.2 to 22.7.12, which refuses a
target that is both continuous and cached; `next:dev` runs the continuous
`@nx/next:server` executor with `cache: true`, so the project graph fails.
**Changes**: remove `cache: true` from `next:dev`; a dev server has no output
to cache.

#### 4. Host build configuration

**File**: `apps/host/next.config.js`
**Why**: `npm audit fix` moves wagmi to 2.19.5, whose connectors lazily import
`@base-org/account`; its Node entry imports `@coinbase/cdp-sdk`, whose `@x402/*`
optional peer dependencies are not installed, and webpack fails to resolve
them. The app configures only the injected, Safe and WalletConnect connectors.
**Changes**: add `/^@x402\//` to the existing `config.externals.push(...)` line
that lists the wallet libraries' other uninstalled optional modules.

`npm audit fix` runs until it reports nothing more to change: the second pass
moves `brace-expansion` to 1.1.21 and `minimatch` to 3.1.5, and a third dry run
is up to date.

### Success Criteria:

#### Automated Verification:

- [x] `npm audit --omit=dev` counts recorded before and after.
- [x] Every host pin that matched the baseline tree matches the new tree.

#### Manual Verification:

- [x] The remaining findings each need a major upgrade or a change outside this scope, and are listed in the report.

---

## Phase 4: Python LLM service

### Changes Required:

**File**: `apps/llm/requirements.txt`
**Why**: python-multipart 0.0.20 carries advisories fixed up to 0.0.31.
**Changes**: `python-multipart==0.0.32`.

### Success Criteria:

#### Automated Verification:

- [x] In a scratch venv with the new requirements, `ensure_multipart_is_installed()` passes, a multipart POST with the audio route's parameters returns 200, `import main` registers `/v1/audio/transcriptions`, and `python -m unittest discover -s tests -p 'test_*.py'` passes in `apps/llm`.

---

## Phase 5: Dependabot version updates

### Changes Required:

**File**: `.github/dependabot.yml`
**Why**: without it only security updates run.
**Changes**: version 2 with weekly schedules for `npm` (`directories` `/` and
`/apps/host`, one group for `minor` and `patch` updates), `pip` (`/apps/llm`),
`github-actions` (`/`) and `docker` (the Dockerfile directories). No
`applies-to`, `labels`, `commit-message` or `ignore`, so security updates keep
opening individual pull requests as they do now.

### Success Criteria:

#### Automated Verification:

- [x] The file parses as YAML and uses only documented keys and values.

---

## Phase 6: Full verification

### Success Criteria:

#### Automated Verification:

- [x] All 24 `test:unit:scoped` projects plus `mcp` and `@sps/backend-utils` pass with `--skip-nx-cache`.
- [x] `npx nx run <project>:eslint:lint` passes for the changed projects.
- [x] `NODE_OPTIONS=--max-old-space-size=12288 npm run host:build` succeeds.
- [x] The API boots on port 4309 and answers read requests.

#### Manual Verification:

- [x] Cross-origin preflight and credentialed GET reflect the origin with `Access-Control-Allow-Credentials: true`.
- [x] A multipart upload to file storage succeeds and the throwaway file is deleted.
- [x] Anonymous session init reuses the subject for its own token.
- [x] MCP OAuth and in-memory client specs pass.

## Testing Strategy

### Unit Tests:

- The helper returns the fixed invalid-token message for a token signed with a
  foreign algorithm.
- The HTTP error classifier maps the mismatch message to 401.
- Existing valid-token scenarios (`init.spec.ts`, `jwt-verify/index.spec.ts`)
  guard the algorithm argument.

### Integration Tests:

- API on port 4309: session init reuse, HS512 token rejection, CORS preflight
  and credentialed GET, multipart upload and delete, list reads.

### Manual Testing Steps:

1. Boot the API on 4309 from the worktree.
2. `POST /api/rbac/subjects/authentication/init` twice, the second time with the
   first token; compare subject ids.
3. Call an authenticated read with an HS512 token signed with the same secret;
   expect 401.
4. Upload a small file with multipart and `X-RBAC-SECRET-KEY`, then delete it.

## Performance Considerations

None beyond the upstream releases.

## Migration Notes

Downstream projects: any project-owned code that calls `verify()` from
`hono/jwt` needs the algorithm argument (`RBAC_JWT_ALGORITHM` for RBAC tokens),
and project manifests that pin these packages move with the framework.

## References

- Original ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-309.md`
- Related research: `thoughts/shared/research/singlepagestartup/ISSUE-309.md`
