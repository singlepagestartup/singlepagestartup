Closes #309.

## Summary

Moves the runtime packages that carry published critical and high advisories
to patched releases on their current lines, adapts the code the new versions
break, and adds weekly Dependabot version updates. The lockfile is what
`npm install` produces for these manifest changes; `npm audit fix` is a
separate pull request based on this one.

| Package                     | Before | After   | Why this version                                                              |
| --------------------------- | ------ | ------- | ----------------------------------------------------------------------------- |
| `next` (root and host)      | 15.4.8 | 15.5.26 | latest 15.5.x; 15.5.24 fixes GHSA-p293-qw3h-jr36 and GHSA-2xp9-vwfh-vxw4      |
| `hono`                      | 4.10.4 | 4.12.34 | latest 4.12.x                                                                 |
| `@modelcontextprotocol/sdk` | 1.18.1 | 1.26.0  | fixes GHSA-345p-7cg4-v4c7; `^1.26.0` would resolve to 1.30.1, so it is pinned |
| `zod`                       | 3.24.2 | 3.25.76 | required peer of the SDK 1.26 (`^3.25 \|\| ^4.0`)                             |
| `python-multipart`          | 0.0.20 | 0.0.32  | 0.0.31 fixes the last advisory against 0.0.20                                 |

`npm audit --omit=dev`: 4 critical, 34 high, 47 moderate, 6 low before; 3
critical, 33 high, 46 moderate, 6 low after. next, hono and the SDK no longer
appear.

## Changes

- Manifests: the root pins next, hono and the SDK exactly (as it already
  pinned next), so a later `npm audit fix` cannot move hono to 4.13 or the SDK
  past 1.26; zod `^3.25.76`. `apps/host/package.json` pins follow the installed
  tree for next, hono, the SDK, zod and qs (6.16.0, raised by the SDK's express
  dependencies); `openai` keeps its older pin as before. `apps/api`,
  `apps/openapi`, `apps/telegram` and `apps/mcp` raise their nominal floors to
  the patched versions.
- JWT verification: hono 4.11.4 and later throw `JwtAlgorithmRequired` from
  `verify()` without an algorithm, which would fail every authenticated request
  and make session init create a new subject for a valid token.
  `RBAC_JWT_ALGORITHM` (HS256, the default `sign()` uses) joins
  `libs/shared/utils/src/lib/constants` and is passed at all 23 verification
  sites. A token whose header names another algorithm now raises
  `JwtAlgorithmMismatch`; the shared helper counts it as a credential failure
  and the error patterns map it to 401, as the signature mismatch it produced
  before did.
- Type adaptations: seven handlers guard route params the way the others do
  (hono 4.12 types `c.req.param()` as optional on a bare `Context`); the
  Telegram transport passes `[route.path]` to `app.on()`; the MCP tool wrapper
  names `ToolCallback<z.ZodRawShape>` instead of deriving it from
  `registerTool`; the MCP actions spec reads its text resource through a cast.
- Two RBAC chat components imported `z` from `node_modules/zod/lib`, a path
  zod 3.25 no longer ships; they import `{ z }` from `"zod"` like their
  siblings.
- `.github/dependabot.yml`: weekly version updates for npm (`/` and
  `/apps/host`, minor and patch grouped), pip (`/apps/llm`), GitHub Actions and
  the Dockerfile directories. The group applies to version updates only, so
  security updates keep opening one pull request per vulnerable dependency.
- Engineering artifacts: research, plan, process log and progress file under
  `thoughts/shared/**/ISSUE-309*.md`.

## Verification

- [x] `npm install --no-audit --no-fund` on the base lockfile with the new
      manifests: the lockfile is byte-identical to the one committed here.
- [x] `NODE_OPTIONS=--max-old-space-size=12288 npm run host:build`: succeeds in
      4m01s on Next.js 15.5.26 (compiled without warnings, types valid, 8
      static pages, middleware 34.3 kB).
- [x] `npx tsc --noEmit --incremental false -p apps/<app>/tsconfig.json`:
      `apps/api` 25 errors, identical to the base; `apps/mcp`, `apps/telegram`,
      `apps/openapi` 0.
- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run-many --target=jest:test --projects=<24 test:unit:scoped projects>,mcp,telegram,@sps/backend-utils,@sps/shared-utils,@sps/middlewares --skip-nx-cache`:
      28 projects, 1139 tests pass.
- [x] Mutation checks: `init.ts` without the algorithm fails the
      session-reuse scenarios; the helper without the algorithm fails all its
      scenarios; each mismatch mapping removed fails its new test; over HTTP an
      HS512 token answers 500 without the mappings and 401 with them.
- [x] API on port 4309: list reads 200; cross-origin preflight and GET reflect
      the origin with credentials allowed; session init with its own token
      reuses the subject; `authentication/me` and the cart quantity answer 200
      with the issued HS256 token and 401 with an HS512 token over the same
      claims, without echoing it; a multipart PNG upload stores 2x3 `image/png`
      and deletes cleanly.
- [x] MCP HTTP server with SDK 1.26.0: OAuth protected-resource metadata 200,
      unauthenticated `/mcp` 401, internal RBAC-subject token exchange 200, an
      SDK client lists 20 tools and `model-record-find` round-trips to the API
      with the forwarded subject JWT.
- [x] LLM service in a Python 3.11 venv with the new requirements: FastAPI's
      multipart check passes, a multipart POST with the audio route's fields
      returns 200, `import main` registers the route, 13 unit tests pass.
- [x] `.github/dependabot.yml` validates against the SchemaStore
      `dependabot-2.0` schema.
- [x] `npx nx run-many --target=eslint:lint` for `@sps/shared-utils`,
      `@sps/backend-utils`, `@sps/rbac`, `@sps/billing`, `@sps/notification`,
      `mcp`, `telegram`, `host`, `api`, `openapi` over these source files: 0
      errors (`api` warns about unused `/* eslint-disable */` headers in two
      jest configs this branch does not touch). That run used the eslint 9.39.5
      and Nx 22.7.12 of the follow-up branch, with the two chat components
      linted separately afterwards; it was not repeated with this branch's
      eslint 9.22.

## Notes

- The remaining runtime findings are fixed within their declared ranges by
  the follow-up `npm audit fix` pull request (`claude/issue-309-audit-fix`,
  based on this branch), or need a major upgrade: drizzle-orm 0.45,
  nodemailer 10, next 16 (for its own postcss) and `@vercel/blob` 2.
- hono 4.13.5 fixes three moderate advisories in features this repository
  does not use (`toSSG()`, `parseBody({ dot: true })`, the hono cache
  middleware); the Dependabot minor group will propose 4.13.x.
- The direct `jwt.verify` calls keep their own algorithm argument here;
  consolidating them on the shared `verifyJwt` helper belongs to #311.
- Merge overlap: billing `provider/index.ts` and `provider-webhook/index.ts`
  gain a guard right after `c.req.param("provider")`; another branch that
  edits those lines will conflict there.

## Downstream migration

Impact: **required** (from `fix(deps): upgrade next, hono, MCP SDK and
python-multipart`; the docs commit is `none`).

- **Why:** hono 4.12 rejects `verify()` without an algorithm and types route
  params as optional on a bare `Context`; SDK 1.26 changes `registerTool`
  typing; zod 3.25 removes its `lib/` path; project manifests that pin these
  packages must follow the new versions.
- **Applies to:** projects with their own code that calls `verify()` from
  `hono/jwt`, reads `c.req.param()` on a bare `Context`, derives types from
  `McpServer` methods, spreads a handler list into `app.on()` with one path, or
  imports zod internals; projects whose manifests pin next, hono,
  `@modelcontextprotocol/sdk`, zod or python-multipart.
- **Actions:**
  - Merge the manifests and `package-lock.json`, run `npm ci`, keep
    project-owned pins of these packages on the versions above unless upgrading
    on purpose, and keep `apps/host/package.json` pins equal to the installed
    versions.
  - Pass `RBAC_JWT_ALGORITHM` from `@sps/shared-utils` as the third argument of
    every project-owned `verify()` for RBAC tokens, and add it to project specs
    that replace `@sps/shared-utils` with a fixed object.
  - Guard project-owned route params read from a bare `Context` with the
    `Validation error. No <param> provided` check, pass a path array to
    `app.on()` when spreading middlewares, and name
    `ToolCallback<z.ZodRawShape>` instead of deriving it from `registerTool`.
  - Replace project-owned imports of zod internals such as
    `node_modules/zod/lib` with imports from `"zod"`, and extend
    `.github/dependabot.yml` with the project's own manifest and Dockerfile
    directories if it has any.
- **Verify:** `npx tsc --noEmit -p apps/api/tsconfig.json` shows no TS2554 at
  `verify()` calls; the unit lanes pass; `npm run host:build` succeeds with
  `NODE_OPTIONS=--max-old-space-size=12288`; on the running API, session init
  with its own token reuses the subject and a token signed with HS512 answers 401.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
