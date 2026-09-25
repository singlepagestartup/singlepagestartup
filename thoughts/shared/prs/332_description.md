Closes #314.

## Summary

The shared exception filter answered every API error with the server stack trace and the full cause chain, whatever the environment and whoever the caller. The stack names source files, the module layout and the services a request passed through. For every 5xx the filter also built a Telegram bot client and awaited the send before responding, so a caller who could provoke server errors delayed each of those responses and pushed the bug chat into Telegram's rate limits. When a send failed on the network, the failure log printed grammY's error object, which carries the bot token in its request URL.

Every error body now keeps `requestId`, `path`, `method`, `status` and `error`. `stack` and `cause` are added when `API_ERROR_DETAILS` resolves to `full` or when the request carries the operator secret, and the API log keeps the full record under the same request id in both modes. The Telegram report no longer holds the response and is sent once per status, method and route pattern within a window.

## Changes

- `libs/shared/backend/api/src/lib/filters/exception/index.ts`
  - `exposesDetails(c)` adds `stack` and `cause` when `API_ERROR_DETAILS === "full"`, or when `rbacSecretMatches(readRbacSecret(c))` accepts the operator secret from the header or the cookie; that constant-time check came with #276.
  - `reportFailure(...)` holds the `BUG_SERVICE_*` gate, a module-level `createMemoryCache` window keyed by status, method and `routePath(c)` from `hono/route`, and an unawaited send. The window is module state because each of the 173 DI containers that bind the filter creates its own instance; the route pattern keeps varying ids and query strings from minting new reports. The report text, the subject lookup and the chat-migration retry are unchanged, and a failed send is logged through `logger.error` with the error message only.
  - A request that never passed `RequestIdMiddleware` (the `/public/*` route, the Telegram service) gets a generated UUID instead of `unknown`, so the id in a body always matches a log line.
- `libs/shared/utils/src/lib/envs/api.ts` — `API_ERROR_DETAILS: "full" | "brief"`. Unset, it is `full` for `NODE_ENV` `development` and `test` and `brief` otherwise, including an unset `NODE_ENV`.
- `libs/shared/utils/src/lib/envs/host.ts` — `BUG_SERVICE_REPORT_WINDOW_IN_SECONDS`, default `300`, beside the other `BUG_SERVICE_*` values.
- `apps/api/create_env.sh` writes `API_ERROR_DETAILS=full` for local development; `tools/deployer/api/api.env.j2` writes `API_ERROR_DETAILS={{ API_ERROR_DETAILS | default('brief', true) }}`.
- `libs/shared/backend/api/src/lib/filters/exception/index.spec.ts` (new) — 18 BDD scenarios run through a real Hono app, with grammY mocked and the environment set per scenario, so no token from a local `.env` is used.
- Documentation: `apps/api/README.md` (Environment), `tools/deployer/README.md` (beside `API_SECRET_STRENGTH`), and the root `README.md` Error Handling section, which listed `statusCode` and `message` although the filter writes `status` and `error`.

The mode does not follow `NODE_ENV` alone because the Docker image and the deployer set no `NODE_ENV`, and Bun loads `apps/api/.env.production`, the only file that sets it, only when `NODE_ENV` is already `production`. With Bun 1.3.6 and `NODE_ENV` unset, Bun loads `.env.development` and leaves `NODE_ENV` undefined. A deployment and a developer machine look the same, so a `NODE_ENV === "production"` gate would have left every deployer-made deployment returning stacks.

Framework layer only: the filter keeps its `DI.IExceptionFilter` seam; there is no `startup` file, no schema change and no new dependency. The body keeps its key names, so `responsePipe` and the SDKs read it unchanged.

## Verification

- [x] `npx nx run @sps/shared-backend-api:jest:test` — 7 suites, 74 tests; `order-by.spec.ts` is skipped on `main` as well.
- [x] `npx nx run @sps/shared-utils:jest:test` — 12 suites, 74 tests.
- [x] `npx nx run api:jest:test` — 2 suites, 4 tests.
- [x] `npx nx run @sps/shared-backend-api:eslint:lint` and `npx nx run @sps/shared-utils:eslint:lint` — exit 0; the two warnings in `controllers/rest/index.ts` exist on `main`.
- [x] `npx tsc --noEmit -p` for `libs/shared/backend/api`, `libs/shared/utils` and `libs/shared/backend/utils`.
- [x] Mutation checks: the gate always open, the gate ignoring the operator secret, the send awaited, the window check removed, the signature keyed by URL, the `unknown` request id, the failure logged as an object and an unset `NODE_ENV` treated as development each fail the scenarios that pin them; the restored sources pass 18/18.
- [x] HTTP proof on a spare port, HTTP cache off, bug-chat variables empty, status codes and key names only:

| Process environment                        | 4xx | 5xx | Body keys                                |
| ------------------------------------------ | --- | --- | ---------------------------------------- |
| `NODE_ENV=production`                      | 400 | 500 | `error, method, path, requestId, status` |
| `NODE_ENV=production`, operator secret     | 400 | 500 | adds `cause, stack`                      |
| `NODE_ENV` and `API_ERROR_DETAILS` unset   | 400 | 500 | `error, method, path, requestId, status` |
| `API_ERROR_DETAILS=full`, `NODE_ENV` unset | 400 | 500 | adds `cause, stack`                      |
| `NODE_ENV=development`                     | 400 | 500 | adds `cause, stack`                      |

The log line of the brief 500 carries its stack under the same request id, and a 500 raised in the `/public/*` route before the request-id middleware answered with a generated UUID that matches its log line.

## How to verify it

1. Start the API with `NODE_ENV=production` and no `API_ERROR_DETAILS`. `GET /api/host/pages?filters[and][0][column]=id&filters[and][0][method]=nope&filters[and][0][value]=x` answers 400, and `GET /api/host/pages?orderBy[and][0][column]=id&orderBy[and][0][method]=nope` answers 500; both bodies carry `error`, `method`, `path`, `requestId` and `status` only, and the API log carries `🚨 Exception [<requestId>]` with the stack.
2. Repeat both requests with `X-RBAC-SECRET-KEY`: `stack` and `cause` come back.
3. Restart with `API_ERROR_DETAILS=full`, or with `NODE_ENV=development`: both bodies carry `stack` and `cause`.

## Notes

- The body keeps `error` for the message and gains no `category` key: the handlers drop the category that `getHttpErrorType` returns, so the filter cannot recover it.
- Message text is unchanged. A 5xx still carries its mapped, sanitized message, which can name an internal condition.
- The HTTP proof started `bun server.ts` in `apps/api` instead of `npm run api:dev`. Nx loads project `.env` files through dotenv-expand, which can replace an empty process value with the file's value, and a checkout's `.env` may hold a real bug-chat token.
- `API_ERROR_DETAILS` is not forwarded through `tools/deployer/api.sh`, `.env.example`, `github_deployer.sh` or the workflow; the template carries the default, and the operator secret covers debugging a single request.
- The branch carries the research, plan, process and progress documents under `thoughts/shared/`.

## Downstream migration

Adaptation is required. A deployed API answers errors without `stack` and `cause` unless the deployment or the caller opts in, an existing local checkout answers the same way until its env file gains the new line, and the bug chat receives one report per failing route per window instead of one per error.

**Applies to:** projects whose clients, scripts, tests or monitoring read `stack` or `cause` from API error bodies; projects with an existing `apps/api/.env`; projects that start the API without the deployer template; projects that rebind `DI.IExceptionFilter`; projects that configure `BUG_SERVICE_TELEGRAM_BOT_TOKEN`.

**New environment variables:**

| Variable                               | Default                                                          | Meaning                                                             |
| -------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------- |
| `API_ERROR_DETAILS`                    | `full` for `NODE_ENV` `development` or `test`, `brief` otherwise | Whether error bodies carry `stack` and `cause` for every caller     |
| `BUG_SERVICE_REPORT_WINDOW_IN_SECONDS` | `300`                                                            | Window in which a status, method and route pattern is reported once |

**Actions:**

- Add `API_ERROR_DETAILS=full` to `apps/api/.env` on every existing developer checkout to keep stack traces in local error responses; new checkouts get the line from `apps/api/create_env.sh`.
- Add the `API_ERROR_DETAILS` line to a project-owned copy of `tools/deployer/api/api.env.j2`. Where the API starts some other way with `NODE_ENV=development` on a reachable host, set `API_ERROR_DETAILS=brief` explicitly.
- Point any consumer that read `stack` or `cause` from a deployed API at the `requestId` and the API log, or have it send the operator secret. A project that rebinds `DI.IExceptionFilter` to its own filter applies the same detail gate, request-id fallback and unawaited, de-duplicated report.
- Set `BUG_SERVICE_REPORT_WINDOW_IN_SECONDS` where a window other than 300 seconds is wanted.

**Verify:** against a deployed API, request `GET /api/host/pages` with an unknown filter method and confirm the 400 body has only `error`, `method`, `path`, `requestId` and `status`, and that the API log carries a stack under that `requestId`; repeat with `X-RBAC-SECRET-KEY` and confirm `stack` and `cause` come back.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
