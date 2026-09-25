Closes #313.

## Summary

A list request chose which `drizzle-orm` function the shared repository ran. `Database.find` built its sort as `methods[method](this.Table[column])`, with `methods` the whole `drizzle-orm` namespace and both keys taken from the query string, and it checked only that each sort item carried some column and some method. Every list route that accepts `orderBy` passed the caller's choice to that lookup, and a malformed sort answered 500.

`find` now accepts `asc` and `desc` as sort methods and only a column the table defines as a sort column. Anything else answers 400 with a `Validation error.` message before a query is built. A valid sort orders results as before.

The API server's request body limit is now the setting `API_MAX_REQUEST_BODY_BYTES`. Unset, it is 128 MiB, the limit Bun applied without the option, so no deployment's limit changes until an operator sets it.

## Changes

- `libs/shared/backend/api/src/lib/repository/database/index.ts`: exported `ALLOWED_ORDER_BY_METHODS` (`asc`, `desc`) with its `IAllowedOrderByMethod` type, an identifier pattern for the sort column, and a protected `prepareOrderBy`. Every sort item needs an allowed method, an identifier and a drizzle `Column` of the table; the table object also carries `enableRLS` and prototype members, which a truthiness check accepts. The first item is applied, as before. A group that is not an array, an empty group and an item without a column or method keep their message with a `Validation error.` prefix and answer 400 instead of 500. Without a sort, a table with `orderIndex` is read in that order, and a table without one sends no `order by` clause instead of `order by $1` on a null parameter.
- The allow-list sits beside its only caller, as `ALLOWED_FILTER_METHODS` sits beside the filter builder (#269). `query-builder/order-by.ts` and `query-builder/populate.ts` have no caller and are unchanged.
- `libs/shared/backend/api/src/lib/repository/database/index.spec.ts`: 14 BDD scenarios for `find` over a mocked query chain, with the captured sort rendered through `PgDialect`.
- `libs/shared/backend/utils/src/lib/http-error/index.spec.ts`: the four new messages map to 400.
- `libs/shared/utils/src/lib/envs/api.ts`: `API_MAX_REQUEST_BODY_BYTES`, default `134217728`.
- `apps/api/server.ts`: `serve()` receives `maxRequestBodySize: API_MAX_REQUEST_BODY_BYTES`.
- `apps/api/README.md`: the setting under "Environment".
- `tools/deployer/api.sh`, `tools/deployer/api/api.env.j2`, `tools/deployer/.env.example`: the deployer reads and forwards the setting, renders it only when set, and the example shows it commented out.
- `thoughts/shared/{research,plans,processes,handoffs}/singlepagestartup/ISSUE-313*.md`: research, plan, process log and implementation progress, with every verification command and result.

No schema change, no new dependency and no `startup` file.

## Verification

- [x] `npx nx run @sps/shared-backend-api:jest:test`: 70 passed and 1 skipped, 14 of them new.
- [x] `npx nx run @sps/backend-utils:jest:test`: 130 passed.
- [x] `npx nx run @sps/shared-utils:jest:test`: 74 passed; `npx nx run api:jest:test`: 4 passed.
- [x] `eslint:lint` on `@sps/shared-backend-api`, `@sps/backend-utils`, `@sps/shared-utils` and `api`: no errors; the four warnings are in files this branch does not touch.
- [x] `tsc:build` on `@sps/shared-backend-api` and `@sps/shared-utils`. `tsc --noEmit -p apps/api/tsconfig.json` reports 25 Bun typing errors, none in a changed file.
- [x] Mutation checks: removing the allow-list fails 5 scenarios, a truthiness column check fails 2, validating only the first item fails 1.
- [x] `bash -n tools/deployer/api.sh`; `api.env.j2` rendered through `ansible-playbook` with and without the value.
- [x] API from this branch on port 4313: `GET /api/host/pages` sorted by `createdAt` answers 200 in ascending and descending order; `method=sql`, `count`, `constructor` and `ASC` answer 400; `column=constructor`, `enableRLS` and `missing` answer 400; `column=createdAt desc` and `orderBy[and]=createdAt` answer 400. The server log holds no 5xx.
- [x] Same API on the default limit: a 129 MiB POST answers 413 and a 5 MiB multipart upload answers 201. With `API_MAX_REQUEST_BODY_BYTES=1048576`, a 2 MiB upload answers 413 and a 512 KiB upload answers 201. The fixture rows and files were deleted.

## Notes

- `API_MAX_REQUEST_BODY_BYTES` is optional. The GitHub Actions deploy (`.github/workflows/ansible.yml`, `tools/deployer/github_deployer.sh`) does not forward it, so those deployments keep the 128 MiB default.

## Downstream migration

Adaptation is required where a project sends its own sorts or owns copies of the API server or deployer files.

**Why:** a list request whose sort names a method other than `asc` or `desc`, a column the table lacks, or a malformed sort group now answers 400, and sort items after the first, which are not applied, are validated as well. The API body limit becomes a setting with the same 128 MiB default.

**Applies to:** projects whose clients, services or repository overrides pass `orderBy` to a find route or to `DatabaseRepository.find`; projects that match on the old sort error text or expect 500 for a malformed sort; projects that accept uploads close to or above 128 MiB; projects with owned copies of `apps/api/server.ts`, `tools/deployer/api.sh` or `api.env.j2`.

**Actions:**

- Make every sort method in owned code `asc` or `desc` and every sort column a property name of a column the table defines, including second and later items. Do not widen `ALLOWED_ORDER_BY_METHODS` to other `drizzle-orm` exports.
- Update clients and tests that expected 500 for a malformed sort or matched the sort message without the `Validation error.` prefix.
- Keep `API_MAX_REQUEST_BODY_BYTES` at least as large as the largest upload the project accepts; leave it unset to keep 128 MiB.
- In an owned `apps/api/server.ts`, pass `maxRequestBodySize: API_MAX_REQUEST_BODY_BYTES` to `serve()`; in owned deployer copies, forward the variable from `api.sh` and render it in `api.env.j2` only when set.

**Verify:** run the project's own sorted list reads and confirm none answers 400, then the `@sps/shared-backend-api` unit lane. Start the API with a small `API_MAX_REQUEST_BODY_BYTES`, confirm a larger POST answers 413 while a smaller upload succeeds, then restore the intended value.
