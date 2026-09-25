Refs #309. Based on `claude/issue-309-dependency-upgrades`; merge that pull
request first.

## Summary

Runs `npm audit fix` without `--force` on top of the dependency upgrades until
it reports nothing more to change, and makes the two host changes the moved
packages force. `package.json` is untouched: 949 packages move within their
declared ranges, 41 of them direct dependencies.

| Notable move                        | Before  | After    |
| ----------------------------------- | ------- | -------- |
| Nx toolchain (`nx`, `@nx/*`)        | 22.0.2  | 22.7.12  |
| `wagmi` (with `viem` 2.56.9)        | 2.14.13 | 2.19.5   |
| `eslint`, `@eslint/js`              | 9.22.0  | 9.39.5   |
| `@aws-sdk/client-s3`, `-ses`        | 3.758.0 | 3.1141.0 |
| `@tiptap/pm`, `@tiptap/starter-kit` | 2.11.5  | 2.27.3   |
| `react-router-dom`                  | 7.3.0   | 7.18.4   |

Also lodash, nanoid, js-cookie, flatted, path-to-regexp, image-size, npm,
sass, verdaccio and others; the full list is in the lockfile diff.

`npm audit --omit=dev`: 3 critical, 33 high, 46 moderate, 6 low on the base
branch; 1 critical, 7 high, 28 moderate, 0 low after.

## Changes

- `package-lock.json`: the result of two `npm audit fix` passes; a dry run
  against the current registry is up to date.
- `apps/host/package.json`: pins follow the installed tree for every listed
  package that moved (`openai` keeps its older pin), and the host build adds
  `semver`, which `@nx/next` 22.7 lists for its `with-nx` helper.
- `apps/host/project.json`: `next:dev` drops `cache: true`; Nx 22.7 rejects a
  target that is both continuous and cached, and the project graph failed to
  build.
- `apps/host/next.config.js`: `/^@x402\//` joins the webpack externals line
  that already lists the wallet libraries' uninstalled optional modules. wagmi
  2.19.5's connectors lazily import `@base-org/account`, whose Node entry
  reaches `@coinbase/cdp-sdk` and its optional `@x402/*` peers; without the
  entry the host build fails to resolve them. The app configures only the
  injected, Safe and WalletConnect connectors.
- The progress file records this branch's verification.

## Verification

- [x] `npm ci` of this lockfile, then `npm audit fix --dry-run`: up to date.
- [x] `npx nx show projects` succeeds on Nx 22.7.12.
- [x] `NODE_OPTIONS=--max-old-space-size=12288 npm run host:build`: succeeds in
      5m11s (types valid, 8 static pages, middleware 34.3 kB). The one compile
      warning, `@react-native-async-storage/async-storage` in `@metamask/sdk`,
      is also referenced by the 0.32.0 release the base installs.
- [x] `npx tsc --noEmit --incremental false -p apps/<app>/tsconfig.json`:
      `apps/api` 23 errors, all from the 25 on the base (two resolved by the
      updated type packages); `apps/mcp`, `apps/telegram`, `apps/openapi` 0.
- [x] Unit lanes over the same 28 projects as the base branch: 1139 tests
      pass.
- [x] API on port 4309: the same HTTP proof as the base branch passes,
      including the 401 for an HS512 token.
- [x] `npx nx run-many --target=eslint:lint` for `@sps/shared-utils`,
      `@sps/backend-utils`, `@sps/rbac`, `@sps/billing`, `@sps/notification`,
      `mcp`, `telegram`, `host`, `api`, `openapi` on eslint 9.39.5 and Nx
      22.7.12: 0 errors; `apps/host/next.config.js`, changed after that run,
      passes `npx eslint` separately.
- [ ] Browser: wallet sign-in through the injected, Safe and WalletConnect
      connectors, uploads through the AWS S3 provider, and pages with Tiptap
      content were not exercised.

## Notes

- What remains needs a major upgrade or sits under a pinned transitive range:
  tar through bcrypt 5's `@mapbox/node-pre-gyp` (bcrypt 6), drizzle-orm
  (0.45), image-size (2.x), nodemailer (10.x), next's own postcss 8.4.31
  (next 16), undici through `@vercel/blob` (2.x) and ws through wagmi (3.x).
- `apps/api/app.ts` imports `uuid` and the RBAC MCP client imports `ajv`
  without a root declaration; here they resolve to uuid 8.3.2 (from 9.0.1) and
  ajv 6.15.0, and both behave the same for these callers.

## Downstream migration

Impact: **required** (from `fix(deps): apply npm audit fix within the
declared ranges`).

- **Why:** the Nx toolchain moves to 22.7.12, wagmi to 2.19.5, eslint to
  9.39.5 and `@aws-sdk` to 3.1141.0 within their ranges; Nx 22.7 rejects
  cached continuous targets and wagmi 2.19.5 pulls optional `@x402` peers into
  the host build.
- **Applies to:** projects that merge the root `package-lock.json`, override
  `apps/host/next.config.js` or `apps/host/project.json`, define their own
  continuous Nx targets, or depend on wallet connectors, the AWS SDK, Nx
  executors or eslint rules.
- **Actions:**
  - Merge `package-lock.json` and run `npm ci`; keep `apps/host/package.json`
    pins equal to the installed versions, including the `semver` entry the host
    build adds.
  - Remove `cache: true` from project-owned targets that run a continuous
    executor such as `@nx/next:server`, and keep `/^@x402\//` in the host
    webpack externals when the project overrides `apps/host/next.config.js`,
    unless it installs the `@x402` packages to use the Base Account connector.
- **Verify:** `npx nx show projects` succeeds; the unit lanes and each
  project's eslint targets pass on Nx 22.7.12 and eslint 9.39.5;
  `npm run host:build` succeeds with `NODE_OPTIONS=--max-old-space-size=12288`;
  in a browser, wallet sign-in through the injected, Safe and WalletConnect
  connectors, uploads through the AWS S3 provider if configured, and the pages
  that render Tiptap content still work.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
