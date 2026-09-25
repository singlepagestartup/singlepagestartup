---
issue_number: 308
issue_title: "Anchor the remaining authorization allow rules and restrict CORS origins"
start_date: 2026-09-25T22:55:00Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-308.md
status: complete
completed_date: 2026-09-26
---

# Implementation Progress: ISSUE-308 - Anchor the remaining authorization allow rules and restrict CORS origins

**Started**: 2026-09-26
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-308.md`

## Baseline (before any change)

- Unit lanes (`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run <project>:jest:test --skip-nx-cache`): `@sps/middlewares` 10 suites, 64 tests; `@sps/backend-utils` 6 suites, 126 tests; `@sps/shared-utils` 12 suites, 74 tests; `api` 2 suites, 4 tests; `telegram` 5 suites, 45 tests. All passed.
- Type-check (`npx tsc --noEmit -p <tsconfig>`): `libs/middlewares`, `libs/shared/backend/utils`, `libs/shared/utils`, `apps/telegram`, `apps/openapi` exit 0; `apps/api` exit 2 with 25 errors, all in files this change does not touch (billing services, social message handlers, file-storage providers, third-party clients).
- Lint (`NODE_OPTIONS=--max-old-space-size=12288 npx nx run "<project>:eslint:lint" --skip-nx-cache`): `@sps/backend-utils`, `@sps/shared-utils`, `telegram`, `openapi` clean; `api` 0 errors, 2 warnings. `npx eslint libs/middlewares/src/lib/is-authorized`: exit 0.
- API from this worktree on port 4308 (`API_SERVICE_PORT=4308 API_SERVICE_URL=http://localhost:4308 NEXT_PUBLIC_API_SERVICE_URL=http://localhost:4308 npm run api:dev`), a throwaway channel with one message created with the operator secret. Requests without credentials:
  - `GET /favicon.ico` 404; `GET /api/agent/agents/favicon.ico` 500 (reaches the agents find-by-id handler).
  - `GET /api/broadcast/channels` 200; `/channels/count` 200; `/channels/:uuid` 200; `/channels/:id/messages` 200 with the message row and its `payload`; `/api/broadcast/channels-to-messages` 200.
  - `GET /api/rbac/subjects/authentication/me` 200; `GET .../init` 201 (subject deleted afterwards); `GET .../is-authorized` 403 (the handler's own answer); `POST .../refresh` 400; `POST .../logout` 200; `POST .../email-and-password/authentication` with `{}` 400; `POST .../oauth/unsupported` 400; `GET .../oauth/unsupported/callback` 302; `POST .../me` 404; `GET .../meanwhile` 404; `POST .../unknown` 404.
  - `GET /api/rbac/permissions` 200; `/permissions/count` 200; `/roles-to-permissions` 200; `/subjects-to-roles` 200.
  - CORS: a preflight from `https://app.example.com` and from `https://unlisted.example.net` both 204 with the request origin echoed and `Access-Control-Allow-Credentials`; a request without `Origin` 200 with no allow-origin header.

## Phase Progress

### Phase 1: Anchor the allow-list

- [x] Started: 2026-09-26
- [x] Completed: 2026-09-26
- [x] Automated verification: PASSED

**Notes**:

- `libs/middlewares/src/lib/is-authorized/routes/singlepage.ts`: every rule anchored at both ends; `GET /api/broadcast/channels` only; the authentication routes as five method-scoped rules (GET `is-authorized|me|init`; POST `bill-route|refresh|logout|ethereum-virtual-machine`; POST the four `email-and-password` routes; POST `oauth/<provider>`; GET `oauth/<provider>/callback`); `^` added to `public/file-storage` and the #276 read rules; the `roles-to-permissions`, `subjects-to-roles` and both `permissions` rules removed.
- `libs/middlewares/src/lib/is-authorized/routes/index.spec.ts`: 8 scenarios become 14. The prefix-sibling scenario is inverted; `GET /api/rbac/permissions` moves from the public case to the refused permission-graph case; new scenarios for embedded module reads, the favicon, the broadcast list, all 14 authentication routes, the other methods and look-alike paths under the authentication prefix, and a project rule reopening one closed route.
- `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx jest --config libs/middlewares/jest.config.ts libs/middlewares/src/lib/is-authorized`: 14 passed.
- Mutation check, original `singlepage.ts` from `HEAD` with the new spec: 6 failed (embedded read, favicon, broadcast, authentication prefix, permission graph, project reopen), 8 passed; the fixed file restored and compared with `cmp`.
- Mutation check per anchor, one at a time: broadcast without `$`, favicon without `^`, authentication GET rule without `$`, module read rules without `^`: each fails exactly its scenario (1 failed, 13 passed); restored and compared with `cmp`.

### Phase 2: Remove the dead origin write

- [x] Started: 2026-09-26
- [x] Completed: 2026-09-26
- [x] Automated verification: PASSED

**Notes**:

- `libs/middlewares/src/lib/is-authorized/index.ts`: the `Host` comparison and the property assignment on `c.res.headers` are gone, with the `NEXT_PUBLIC_HOST_SERVICE_URL` import. No test can observe the block: `Host` never equals a scheme-qualified origin.
- Phases 1 and 2 together: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/middlewares:jest:test --skip-nx-cache`: 10 suites, 70 tests passed (64 before). `npx tsc --noEmit -p libs/middlewares/tsconfig.json`: exit 0, and `--listFiles` includes `is-authorized/index.ts` and `routes/singlepage.ts`. `NODE_OPTIONS=--max-old-space-size=12288 npx eslint libs/middlewares/src/lib/is-authorized`: exit 0 (the package has no `eslint:lint` target). `npx prettier --check` clean.
- `npx tsc --noEmit -p libs/middlewares/tsconfig.spec.json` stops at TS5095 (`bundler` resolution without an ES module setting) before reading any file; the spec config is not meant to run standalone, and Jest compiles the specs.

### Phase 3: Configurable CORS origins

- [x] Started: 2026-09-26
- [x] Completed: 2026-09-26
- [x] Automated verification: PASSED

**Notes**:

- `libs/shared/utils/src/lib/envs/api.ts`: `API_CORS_ALLOWED_ORIGINS`, default `""`.
- `libs/shared/backend/utils/src/lib/cors-origin/index.ts` (new): `resolveCorsOrigin(origin)`; exported from `libs/shared/backend/utils/src/lib/index.ts`. `index.spec.ts` (new): 9 scenarios through `hono/cors`, mocking `@sps/shared-utils` with a getter as the `rbac-secret` spec does.
- `apps/api/app.ts`, `apps/telegram/app.ts`, `apps/openapi/app.ts`: `origin: resolveCorsOrigin` replaces the inline echo; the other `cors()` options are unchanged.
- Unit lanes (`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run "<project>:jest:test" --skip-nx-cache`): `@sps/backend-utils` 135 passed (126 before), `@sps/shared-utils` 74, `api` 4, `telegram` 45, `@sps/middlewares` 70.
- Mutation checks on the helper, restored and compared with `cmp` after each: echoing every origin fails the 3 set-list refusals; a prefix match fails the look-alike scenario; untrimmed entries fail the spaces scenario; an empty list that refuses fails the 2 unset scenarios.
- Type-check: `libs/shared/backend/utils`, `libs/shared/utils`, `libs/middlewares`, `apps/telegram`, `apps/openapi` exit 0; `apps/api` 25 errors, the same list as the baseline (compared after stripping positions).
- Lint (`NODE_OPTIONS=--max-old-space-size=12288 npx nx run "<project>:eslint:lint" --skip-nx-cache`): `@sps/backend-utils`, `@sps/shared-utils`, `telegram`, `openapi` clean; `api` 0 errors, the 2 baseline warnings.
- In process (`bun run` of a scratch script that imports each app and calls `app.request`, Telegram without a bot token): with the list unset both apps echo a listed and an unlisted origin; with `API_CORS_ALLOWED_ORIGINS=https://app.example.com` both echo the listed origin only; a request without `Origin` answers 200 with no allow-origin header in both modes.
- HTTP on port 4308, list unset, requests without credentials, compared with the baseline: `GET /api/broadcast/channels/:id/messages` 200 → 403, `/channels/:uuid` 200 → 403, `/api/broadcast/channels-to-messages` 200 → 403, `GET /api/rbac/permissions` 200 → 403, `GET /api/rbac/roles-to-permissions` 200 → 403, `POST .../authentication/me` 404 → 403, `GET .../authentication/meanwhile` 404 → 403, `POST .../authentication/unknown` 404 → 403, `GET /api/agent/agents/favicon.ico` 500 → 403. Unchanged: `GET /api/broadcast/channels` 200 (the observer's lookup with its filters also 200), `/channels/count` 200, `GET me` 200, `GET init` 201, `POST refresh` 400, `POST logout` 200, `POST email-and-password/authentication` 400, `POST oauth/unsupported` 400, `GET oauth/unsupported/callback` 302, `GET /api/rbac/permissions/count` 200, CORS identical to the baseline. The API log shows no observer error after the `logout` POST.
- With the operator secret: `GET /api/rbac/permissions`, `/api/rbac/roles-to-permissions`, `/api/broadcast/channels/:id/messages` and `/api/broadcast/channels-to-messages` 200.
- HTTP on port 4308 with `API_CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com`: preflights from both listed origins get their origin back; a preflight from `https://unlisted.example.net` gets 204 without `Access-Control-Allow-Origin`; a simple GET from it answers 200 without `Access-Control-Allow-Origin`; a request without `Origin` answers 200 without it.
- Fixtures: the throwaway channel, its message and link, and the three anonymous subjects `init` created were deleted with the operator secret; a search for the probe channel title returns none. The API was stopped.

### Phase 4: Documentation and deployment wiring

- [x] Started: 2026-09-26
- [x] Completed: 2026-09-26
- [x] Automated verification: PASSED

**Notes**:

- `apps/api/README.md`: the Environment section describes `API_CORS_ALLOWED_ORIGINS`, its format and both modes. `apps/telegram/README.md`, `apps/telegram/.env.example` and `apps/openapi/README.md` point to it. `tools/deployer/README.md` gains "Browser origins for the API".
- Deployer, following `MCP_SERVICE_ALLOWED_ORIGINS`: an empty entry with a comment in `tools/deployer/.env.example` (inserted after `API_SERVICE_DOCKER_HUB_REPOSITORY_NAME`, away from the lines #304, #315 and #319 edit); a `get_env` read and an `-e` pass in `tools/deployer/api.sh` and `tools/deployer/telegram.sh`; a conditional line in `tools/deployer/api/api.env.j2` and `tools/deployer/telegram/telegram.env.j2`; an entry in `tools/deployer/github_deployer.sh`; entries in both secret lists of `.github/workflows/ansible.yml`.
- `bash -n` on `api.sh`, `telegram.sh`, `github_deployer.sh`: exit 0.
- Both templates rendered with Jinja2 3.1.6 (the interpreter Ansible uses, `trim_blocks=True`) and placeholder inputs: unset and empty values write no `API_CORS_ALLOWED_ORIGINS` line; a two-origin value writes it unchanged.
- `ansible localhost -c local -m debug -e "PREV_VAR=a API_CORS_ALLOWED_ORIGINS=<value> NEXT_VAR=b"`: an empty value arrives as an empty string with length 0, a comma list arrives whole, and the neighbouring variable is unaffected.
- `node tools/agents/code-placement.mjs`: no same-name file and folder pairs.
- Final pass after all phases: unit lanes `@sps/middlewares` 10 suites, 70 tests; `@sps/backend-utils` 7 suites, 135 tests; `@sps/shared-utils` 12 suites, 74 tests; `api` 2 suites, 4 tests; `telegram` 5 suites, 45 tests, all passed. Lint and type-check as in Phase 3, the `apps/api` type errors identical to the baseline. `npx prettier --write` on every changed Markdown and TypeScript file.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 1 -->

### Incident 1 — zsh read `$p:eslint:lint` as a history modifier

- **Occurrences**: 1
- **Stage**: Baseline, before Phase 1
- **Symptom**: a loop running `npx nx run $p:eslint:lint` for each project failed with `Cannot find project 'slint'` for every project.
- **Root Cause**: in zsh, `:e` after a parameter is the extension modifier, so `$p:eslint` expanded to the extension of `$p` followed by `slint`. `$p:jest:test` survived because `:j` is not a modifier.
- **Fix**: brace and quote the parameter: `npx nx run "${p}:eslint:lint"`.
- **Reusable Pattern**: in zsh loops, always write `"${var}:target"` when a colon follows a parameter.

## Summary

### Changes Made

- `libs/middlewares/src/lib/is-authorized/routes/singlepage.ts`, `routes/index.spec.ts`: anchored allow rules and their spec.
- `libs/middlewares/src/lib/is-authorized/index.ts`: dead origin write removed.
- `libs/shared/utils/src/lib/envs/api.ts`: `API_CORS_ALLOWED_ORIGINS`.
- `libs/shared/backend/utils/src/lib/cors-origin/index.ts`, `index.spec.ts`, `libs/shared/backend/utils/src/lib/index.ts`: `resolveCorsOrigin` and its spec.
- `apps/api/app.ts`, `apps/telegram/app.ts`, `apps/openapi/app.ts`: the shared origin helper.
- `apps/api/README.md`, `apps/telegram/README.md`, `apps/telegram/.env.example`, `apps/openapi/README.md`, `tools/deployer/README.md`: documentation.
- `tools/deployer/.env.example`, `api.sh`, `api/api.env.j2`, `telegram.sh`, `telegram/telegram.env.j2`, `github_deployer.sh`, `.github/workflows/ansible.yml`: deployment wiring.

### Pull Request

- [x] PR created: https://github.com/singlepagestartup/singlepagestartup/pull/341
- [x] PR number: 341

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-09-26T03:25:00+03:00
