Closes #313.

This pull request builds on #331 and targets its branch, because the request body limit answers with the `Payload Too Large error` category that #331 adds. It moves to `main` when #331 merges.

## Summary

A list request chose which `drizzle-orm` function the shared repository ran. `Database.find` built its sort as `methods[method](this.Table[column])`, with `methods` the whole `drizzle-orm` namespace and both keys taken from the query string, and it checked only that each sort item carried some column and some method. Every list route that accepts `orderBy` passed the caller's choice to that lookup, and a malformed sort answered 500. `find` now accepts `asc` and `desc` as sort methods and only a column the table defines as a sort column; anything else answers 400 with a `Validation error.` message before a query is built. The filter path now checks its columns the same way.

The API's request body limit is the setting `API_MAX_REQUEST_BODY_BYTES`, 128 MiB when unset, which Bun applies to a declared `Content-Length`. A shared middleware on every route applies the same limit to a body without a declared length, and the file-storage upload limit from #331 uses that middleware with its own, smaller limit.

## Changes

- `libs/shared/backend/api/src/lib/repository/database/index.ts`: exported `ALLOWED_ORDER_BY_METHODS` (`asc`, `desc`) with its `IAllowedOrderByMethod` type, an identifier pattern for the sort column, and a protected `prepareOrderBy`. Every sort item needs an allowed method, an identifier and a drizzle `Column` of the table; the table object also carries `enableRLS` and prototype members, which a truthiness check accepts. The first item is applied, as before. A group that is not an array, an empty group and an item without a column or method keep their message with a `Validation error.` prefix and answer 400 instead of 500. Without a sort, a table with `orderIndex` is read in that order, and a table without one sends no `order by` clause instead of `order by $1` on a null parameter.
- `libs/shared/backend/api/src/lib/query-builder/filters.ts`: a filter column must be a drizzle `Column` of the table too; `constructor`, `enableRLS` and `constructor->>en` answer `Validation error. Unknown column '<name>'`.
- `libs/shared/backend/api/src/lib/middleware/request-body-fits-limit/index.ts` (new): `RequestBodyFitsLimitMiddleware`, a class with `init()` around Hono's `bodyLimit`. Options `maxBytes` (default `API_MAX_REQUEST_BODY_BYTES`) and `limitName` (default "request body limit"); the refusal goes through the error mapper as `413 Payload Too Large error. The <limit name> is <N> bytes`.
- `apps/api/app.ts`: registers the middleware right after CORS, so every route is covered.
- `libs/modules/file-storage/models/file/backend/app/middlewares/src/lib/request-body-fits-upload-limit/index.ts`: `RequestBodyFitsUploadLimit` keeps its name, message and spec and constructs the shared middleware with `FILE_STORAGE_MAX_UPLOAD_BYTES` and the name "upload limit", so the wrapper around `bodyLimit` exists once.
- `libs/shared/utils/src/lib/envs/api.ts` and `apps/api/server.ts`: `API_MAX_REQUEST_BODY_BYTES`, default `134217728`, passed to `serve()` as `maxRequestBodySize`.
- `apps/api/README.md`, `tools/deployer/api.sh`, `tools/deployer/api/api.env.j2`, `tools/deployer/.env.example`: the setting is documented, forwarded by the deployer, rendered only when set and shown commented out in the example.
- `libs/shared/utils/src/lib/envs/file-storage.ts`, `libs/modules/file-storage/README.md`, `tools/deployer/README.md`, `tools/deployer/.env.example`: the #331 notes about uploads above 128 MiB name `API_MAX_REQUEST_BODY_BYTES` instead of `maxRequestBodySize` in `apps/api/server.ts`.
- Specs: 14 `find` scenarios in `repository/database/index.spec.ts`, 3 filter scenarios in `query-builder/filters.spec.ts`, 7 scenarios in `middleware/request-body-fits-limit/index.spec.ts`, and the new messages in `http-error/index.spec.ts`.
- `thoughts/shared/{research,plans,processes,handoffs}/singlepagestartup/ISSUE-313*.md`: research, plan, process log and progress, with every verification command and result.

The shared middleware lives in `@sps/shared-backend-api`, beside `ParseQueryMiddleware`, rather than in `libs/middlewares`. `apps/api` and every module already import that package. From `libs/middlewares`, the file-storage wrapper would add a dependency `@sps/file-storage` → `@sps/middlewares` → `@sps/rbac` / `@sps/agent` → `@sps/file-storage`. Nx then refuses `@sps/file-storage:tsc:build` with "the task graph has a circular dependency", and `apps/api/README.md` keeps modules from importing `libs/middlewares`.

No schema change, no new dependency and no `startup` file.

## Verification

- [x] `jest:test`: `@sps/shared-backend-api` 80 passed and 1 skipped; `@sps/middlewares` 64; `@sps/file-storage` 22, with the #331 specs unchanged; `api` 4; `@sps/backend-utils` 133; `@sps/shared-utils` 74.
- [x] `eslint:lint` on `@sps/shared-backend-api`, `@sps/file-storage`, `@sps/shared-utils`, `@sps/backend-utils` and `api`: no errors; the four warnings are in files this branch does not touch.
- [x] `tsc:build` on `@sps/shared-backend-api`, `@sps/file-storage` (with its 15 dependency tasks) and `@sps/shared-utils`; `nx graph` shows no project on a dependency cycle. `tsc --noEmit -p apps/api/tsconfig.json` reports the same 25 Bun typing errors as `main`, none in a changed file.
- [x] Mutation checks. The sort path:

  - removing the allow-list fails 5 scenarios;
  - a truthiness column check fails 2;
  - validating only the first item fails 1.

  The shared middleware:

  - without a limit, 4 scenarios fail;
  - ignoring the setting, 3 fail.

  The filter column check by truthiness fails its 3 scenarios. On a running API, removing the registration lets a 2 MiB body without a declared length reach the handler under a 1 MiB limit.

- [x] `bash -n tools/deployer/api.sh`; `api.env.j2` rendered through `ansible-playbook` with and without the value.
- [x] API from this branch on port 4313:
  - `GET /api/host/pages` sorted by `createdAt` answers 200 in both directions; unknown sort methods and columns answer 400; filters on `constructor` and `enableRLS` answer 400.
  - With a 1 MiB API limit and a 512 KiB upload limit, a 2 MiB body without a declared length answers 413 on `POST /api/host/widgets`, a 256 KiB one reaches the handler, and a 2 MiB body with `Content-Length` answers 413.
  - On the upload route, 768 KiB answers 413 with or without a declared length, and a 256 KiB upload is stored.
  - On the default limits, a 129 MiB body answers 413 and a 5 MiB upload is stored. Fixtures were deleted.

## Notes

- `API_MAX_REQUEST_BODY_BYTES` is optional. The GitHub Actions deploy (`.github/workflows/ansible.yml`, `tools/deployer/github_deployer.sh`) does not forward it, so those deployments keep the 128 MiB default.
- Merge after #331; the base moves to `main` then.

## Downstream migration

Adaptation is required where a project sends its own sorts, owns copies of the API server, app or deployer files, or extends the file-storage upload limit.

**Why:** a list request whose sort names a method other than `asc` or `desc`, a column the table lacks, or a malformed sort group now answers 400, and sort items after the first, which are not applied, are validated as well. Every API route refuses a request body above `API_MAX_REQUEST_BODY_BYTES`, 128 MiB by default, also when the body declares no length. The file-storage upload limit delegates to the shared middleware.

**Applies to:** projects whose clients, services or repository overrides pass `orderBy` to a find route or to `DatabaseRepository.find`; projects that match on the old sort error text or expect 500 for a malformed sort; projects whose routes accept bodies close to or above 128 MiB; projects with owned copies of `apps/api/server.ts`, `apps/api/app.ts`, `tools/deployer/api.sh` or `api.env.j2`; projects that subclassed or replaced the file-storage `RequestBodyFitsUploadLimit`.

**Actions:**

- Make every sort method in owned code `asc` or `desc` and every sort column a property name of a column the table defines, including second and later items. Do not widen `ALLOWED_ORDER_BY_METHODS` to other `drizzle-orm` exports.
- Update clients and tests that expected 500 for a malformed sort or matched the sort message without the `Validation error.` prefix.
- Keep `API_MAX_REQUEST_BODY_BYTES` at least as large as the largest upload or import the project accepts; leave it unset to keep 128 MiB.
- In an owned `apps/api/server.ts`, pass `maxRequestBodySize: API_MAX_REQUEST_BODY_BYTES` to `serve()`. In an owned `apps/api/app.ts`, register `new RequestBodyFitsLimitMiddleware().init()` from `@sps/shared-backend-api` right after CORS. In owned deployer copies, forward the variable from `api.sh` and render it in `api.env.j2` only when set.
- In a subclass or replacement of `RequestBodyFitsUploadLimit`, construct `RequestBodyFitsLimitMiddleware` with the project's `maxBytes` and `limitName` instead of wrapping Hono's `bodyLimit` again.

**Verify:**

- Run the project's own sorted and filtered list reads and confirm none answers 400, then the `@sps/shared-backend-api` unit lane.
- Start the API with a small `API_MAX_REQUEST_BODY_BYTES`. Send a larger body, with and without a declared length, to a route that reads it and confirm 413. Confirm uploads within the limit still succeed, then restore the intended value.
