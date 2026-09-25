Closes #315.

## Summary

The host's `GET /api/revalidate` revalidated any tag or path for any caller, and nothing runs in front of it. Repeating `?path=/&type=layout` emptied the host's page and data caches on demand, and with pages cached for a day every following render went back to the API. The API's revalidation middleware called the route without a credential and appended the tag unencoded.

The route now answers only a request that carries `HOST_SERVICE_REVALIDATION_SECRET` in the `X-HOST-REVALIDATION-SECRET` header, compared in constant time, and all three API-side callers send it. A host without the value refuses every call and logs why; the API names the missing value in its start-up report and logs each refused call.

## Changes

- `apps/host/app/api/revalidate/route.ts` — the guard. An unset secret logs a warning naming the variable and returns 401; a missing or wrong header returns the same 401 without a log line. The constant-time comparison is a private function beside the handler: the host cannot import `@sps/backend-utils` (its barrel carries the Bun WebSocket manager, a pino logger and hono helpers), and `@sps/shared-utils` stays free of node built-ins because client components import it. Authorized requests behave as before.
- `libs/shared/utils/src/lib/envs/host.ts` — `HOST_SERVICE_REVALIDATION_SECRET`, no default. `libs/shared/utils/src/lib/constants/index.ts` — `HOST_SERVICE_REVALIDATION_SECRET_HEADER` (`X-HOST-REVALIDATION-SECRET`).
- `libs/middlewares/src/lib/revalidation/index.ts` — `revalidateTag` encodes the tag, sends the header, logs a non-OK answer with its status through the shared logger, and logs a network failure with its reason (previously `console.log`).
- `apps/api/src/db/seed.ts` — the root-layout revalidation that runs on every API start sends the header instead of `X-RBAC-SECRET-KEY`, which the host never read.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts` — `revalidatePage` encodes the page URL and sends the header.
- `libs/shared/utils/src/lib/secret-strength/index.ts` — the variable joins `CHECKED_SECRET_NAMES`, so the API start-up report names it when it is missing or short. It is reported, not fatal.
- Local bootstrap — `apps/api/create_env.sh` generates the value, `apps/host/create_env.sh` copies it from `apps/api/.env`, and the root `create_env.sh` runs the API's script before the host's.
- Deployment — `tools/deployer/.env.example`, `api.sh`, `host.sh`, `api/api.env.j2`, `host/host.env.local.j2`, `github_deployer.sh` and both secret lists in `.github/workflows/ansible.yml`. The value is operator-supplied like the other shared secrets: `api.sh` and `host.sh` run separately, so a value generated inside the deployer would differ between the two services.
- Docs — `tools/deployer/README.md` (secrets to generate, a rotation row, and a "Host revalidation secret" section with the upgrade step) and `libs/middlewares/src/lib/revalidation/README.md` (the host call contract).
- Specs — `apps/host/app/api/revalidate/route.spec.ts` (new, 10 cases), the revalidation middleware spec (6 new), the agent page-cache spec (1 new) and the secret-strength spec (2 updated).

## Verification

- [x] `npx nx run host:jest:test` — 3 suites, 24 tests.
- [x] `npx nx run @sps/middlewares:jest:test` — 10 suites, 70 tests.
- [x] `npx nx run @sps/agent:jest:test` — 17 suites, 89 tests.
- [x] `npx nx run @sps/shared-utils:jest:test` — 12 suites, 74 tests.
- [x] `npx nx run api:jest:test` — 4 tests.
- [x] `eslint:lint` for `host`, `@sps/shared-utils`, `@sps/agent` and `api` (0 errors; two pre-existing warnings in the API's jest configs), and `npx eslint` on the middleware files, which have no lint target.
- [x] `tsc --noEmit` for the host, `libs/middlewares`, `libs/modules/agent` and `libs/shared/utils`: no errors. `apps/api`: 25 errors in 16 files that this branch does not change.
- [x] Nine mutations, each restored. Without the host guard, the 7 refusal cases fail; with a length-only comparison, the near-miss and length cases fail; without the unset check, the unconfigured-host case fails. Without the header, the encoding or the refusal warning in the middleware, 3, 1 and 1 cases fail. Without the encoding or the header in the agent page cache, its case fails. Without the name in the start-up report, the ordered case fails.
- [x] The specs pin the header spelling: with the constant set to another name, the three authorized route cases and the middleware header case fail; with the old mixed case only the middleware case fails, since the host matches header names case-insensitively.
- [x] Both templates rendered with Ansible and dummy values, with the variable set and with it absent (the line renders empty).
- [x] Bootstrap dry run in a scratch copy: the host's value equals the API's generated value; with the previous script order the host's value is empty.
- [x] API on port 4315 against a stub host that records only whether the header is present and matches. A created and deleted fixture made the stub receive encoded tags with a matching header. With the value unset on the API, the start-up report named it missing, each call reached the host with an empty credential and got 401, the API logged each refusal, and the writes still succeeded.

## Notes

- A deployment or checkout that upgrades without the value keeps serving but no longer refreshes the host's cache: edits reach public pages only after the one-day page window, and both services log why. `tools/deployer/README.md` lists the steps.
- A browser cannot hold the secret. The admin-v2 settings page's "Revalidate Frontend Layout" action would call this route from the browser, but that page is not mounted; mounting it needs an operator-authenticated API route that calls the host.
- `apps/host/app/global-error.tsx` and `apps/host/src/db/seed.ts` call `/api/revalidation/revalidate`, which has no handler. They are unchanged.
- `TELEGRAM_SERVICE_WEBHOOK_SECRET` is missing from `tools/deployer/github_deployer.sh`; that gap predates this branch.
- The branch carries the ticket, research, plan, process log and progress record under `thoughts/shared/`.

## Downstream migration

Adaptation is required in every project that runs the host with the API. The host refuses revalidation without the new secret, so an upgrade that does not set it leaves cached pages stale until their revalidate window ends.

**Applies to:** every project that runs the host together with the API, and any project-owned code, script or tooling that calls the host's `/api/revalidate`.

**New environment variable:**

| Variable                           | Default                           | Meaning                                                                         |
| ---------------------------------- | --------------------------------- | ------------------------------------------------------------------------------- |
| `HOST_SERVICE_REVALIDATION_SECRET` | none; an absent value refuses all | Shared by the API and the host; sent in the `X-HOST-REVALIDATION-SECRET` header |

**Actions:**

- Generate one value with `openssl rand -hex 32`, set it in `tools/deployer/.env` and in both GitHub secret sets (production and `PREVIEW_`), then redeploy the API and the host with `api.sh` and `host.sh` so their environment files are rendered again. An image release alone does not add it.
- In an existing developer checkout, add the same value to `apps/api/.env` and `apps/host/.env.local`; the `create_env.sh` scripts do not rewrite existing files.
- Make owned callers of `/api/revalidate` send the value in the header named by `HOST_SERVICE_REVALIDATION_SECRET_HEADER` and encode their query values. A browser action has to go through an operator-authenticated API route.
- Merge the new lines by hand into any fork of the deployer templates, `api.sh`, `host.sh`, `github_deployer.sh`, the ansible workflow or the `create_env.sh` scripts, and keep the root script running the API's step before the host's.

**Verify:** the API start-up report has no `HOST_SERVICE_REVALIDATION_SECRET` line; after an entity is saved, the host log has no "is not set" warning and the API log has no "answered 401" line; a request to `/api/revalidate?path=/&type=layout` without the header answers 401.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
