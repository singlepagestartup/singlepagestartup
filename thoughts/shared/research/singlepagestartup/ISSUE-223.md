---
date: 2026-09-18T02:21:55+03:00
researcher: flakecode
git_commit: 29370bcbf85b195fbd1c2422707141135184d6e0
branch: worktree-issues-2026-09-18
repository: singlepagestartup
topic: "Prevent long page-cache agents from being marked aborted while still running"
tags: [research, codebase, agent, cron, page-cache, broadcast, concurrency, bun]
status: complete
last_updated: 2026-09-18
last_updated_by: flakecode
---

# Research: Prevent long page-cache agents from being marked aborted while still running

**Date**: 2026-09-18T02:21:55+03:00
**Researcher**: flakecode
**Git Commit**: 29370bcbf85b195fbd1c2422707141135184d6e0
**Branch**: worktree-issues-2026-09-18
**Repository**: singlepagestartup

## Research Question

Issue #223 reports that the Agent cron runner records an `AbortError` result for
`host-module-page-cache` after about 262 seconds while the page-cache handler
keeps running for 21–26 minutes, and that a second handler for the same slug can
start while the first is still active. This document records how the code
behaves today: the cron dispatch path and its self-`fetch`, where an execution's
lifecycle is stored and for how long, which timeout and abort settings exist on
the client and server side, what concurrency primitives the repository currently
has, how cron is triggered in deployment, and which tests cover these paths.
Every line reference was verified against the worktree at the commit above.

## Summary

- `POST /api/agent/agents/cron` reads every agent and every Broadcast message on
  the `cron` channel, decides which agents are due with `cron-parser`, and awaits
  `executeCronTask` for each due agent before responding
  (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/cron.ts:27-154`).
- `executeCronTask` deletes all earlier markers for the slug, pushes a running
  marker, calls `POST ${API_SERVICE_URL}/api/agent/agents/<slug>` with a bare
  `fetch()` that has no `signal` or `timeout`, and then pushes a result marker
  containing whatever the fetch produced. A rejected fetch is converted to
  `{ error: message }` and stored as the result (`cron.ts:171-236`).
- The only "already running" guard is a read of the newest marker for the slug:
  an agent is skipped when that marker has no `result` and is younger than
  `AGENT_MAX_DURATION_IN_SECONDS` (default 5400 s). Once any result marker
  exists, including an error result, the guard no longer applies and the next
  due interval dispatches again (`cron.ts:89-110`, `cron.ts:119-129`).
- Markers are ordinary Broadcast messages whose `expiresAt` defaults to
  `NOW() + INTERVAL '1 hour'`; the message service purges expired rows on every
  create, and a dedicated agent handler can delete them too
  (`libs/modules/broadcast/models/message/backend/repository/database/src/lib/fields/singlepage.ts:9-12`,
  `libs/modules/broadcast/models/message/backend/app/api/src/lib/service/singlepage/index.ts:13-39`,
  `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/broadcast-module/message/delete-expied.ts:24-51`).
- The page-cache handler loads all Host URLs, then for each URL and each
  configured language awaits one revalidation call and one page GET in sequence,
  isolates per-page failures, and returns `{ ok: true }` only after the last
  iteration (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts:23-61`).
- No `AbortSignal`, `AbortController`, `signal:` or fetch `timeout` option exists
  in the Agent module, the Broadcast module, `apps/api`, or the shared SDK/utils
  libraries. `apps/api/server.ts` sets `idleTimeout: 0` on `Bun.serve`
  (`apps/api/server.ts:9-14`). Bun's documented default for the outbound
  `fetch()` client is a five-minute idle timer that rejects with `TimeoutError`;
  the production log shows a 262-second `AbortError`, so the source of that
  abort is not established by the code or the runtime documentation.
- The advisory-lock helper cited by earlier research was deleted on 2026-07-22
  (`e0273194c8`); the RBAC README now documents a no-runtime-lock policy. The
  concurrency primitives present today are the unique `agent.slug` column, the
  Broadcast marker read described above, and PostgreSQL unique constraints in
  other modules.
- In deployment an Ansible-managed system cron runs `curl -X POST .../cron`
  every minute through the public HTTPS hostname, while the runner's self-fetch
  uses `API_SERVICE_URL=http://api:4000` on the Swarm overlay network. The
  compose template declares no `replicas` and uses `start-first` updates
  (`tools/deployer/api/set_cron_jobs.yaml:9-16`, `tools/deployer/api/api.env.j2:6-8`,
  `tools/deployer/api/docker-compose.api.yaml.j2:18-30`).
- A BDD spec exists for the page-cache handler; no spec references `cron.ts`.

## Detailed Findings

### 1. Route registry and request path

- The Agent controller binds `POST /cron` to `Cron.execute` and
  `POST /host-module-page-cache` to `HostModulePageCache.execute`
  (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/index.ts:40-44`,
  `index.ts:80-84`, `index.ts:142-144`, `index.ts:150-152`).
- The model app is mounted at `/agents` inside the Agent module
  (`libs/modules/agent/backend/app/api/src/lib/apps.ts:19-23`), and the module is
  mounted at `/api/agent` after the authorization middleware
  (`apps/api/app.ts:171-172`, `apps/api/app.ts:180`).
- Authorization accepts `X-RBAC-SECRET-KEY` (header or `rbac.secret-key`
  cookie) when it equals `RBAC_SECRET_KEY`
  (`libs/middlewares/src/lib/is-authorized/index.ts:43-44`,
  `libs/middlewares/src/lib/is-authorized/index.ts:58-60`). Both the external
  cron trigger and the internal self-fetch use this header.
- No request-timeout middleware exists in `apps/api/app.ts` or
  `libs/middlewares/src` (search for `timeout` returned nothing outside tests).
- The agent-model route paths are also declared in the OpenAPI source
  (`libs/modules/agent/models/agent/sdk/model/src/lib/paths.yaml:160-185`).

### 2. Cron runner lifecycle (`cron.ts`)

The handler reads all agents and the single `cron` Broadcast channel in
parallel (`cron.ts:27-36`) and throws when there is not exactly one such channel
(`cron.ts:38-40`). It loads the channel's message relations and then the
messages themselves (`cron.ts:44-75`) and parses each payload into
`{ id, datetime, slug, result }` (`cron.ts:77-83`).

For every agent it runs one async task (`cron.ts:87-148`):

1. Filters executions by `agent.slug` and sorts them newest first; the first
   entry is `lastExecution` (`cron.ts:89-93`).
2. Computes `youngerThanMaxDuration` as `lastExecutionTime > now -
AGENT_MAX_DURATION_IN_SECONDS * 1000` (`cron.ts:99-102`).
3. Returns early when `lastExecution` exists, has no `result`, and is younger
   than the maximum duration (`cron.ts:104-110`). This is the only running-state
   check; it is a read of previously persisted rows with no atomic claim.
4. Returns early when the agent has no `interval` (`cron.ts:112-114`).
5. Parses `agent.interval` with `cron-parser` using `lastExecutionTime || now`
   as `currentDate`, and marks the agent due when there is no previous
   execution or `now >= interval.next()` (`cron.ts:119-129`). Invalid
   expressions are logged and skipped (`cron.ts:130-136`).
6. Pushes the agent onto `executingAgents` and awaits `executeCronTask`
   (`cron.ts:142-144`). Errors are logged with the prefix
   `❌ An error during agent '<slug>':` (`cron.ts:145-147`).

The handler awaits `Promise.allSettled(tasks)` and only then responds with the
list of executing agents (`cron.ts:150-154`). The HTTP response to the cron
trigger therefore lasts as long as the longest agent dispatch in that tick.

`executeCronTask(agent, cronChannel, currentExecutions)` (`cron.ts:161-243`):

- Deletes every existing marker for the slug through the Broadcast channel SDK,
  each deletion wrapped in its own try/catch and awaited via
  `Promise.allSettled` (`cron.ts:171-190`).
- Pushes a running marker `{ datetime, slug }` on channel slug `cron`
  (`cron.ts:192-201`).
- Builds `url = API_SERVICE_URL + "/api/agent/agents/" + agent.slug`
  (`cron.ts:203`) and awaits `fetch(url, { method: "POST", headers })` with no
  `signal`, `timeout`, or body (`cron.ts:205-211`).
- On a non-OK response it throws `Internal error. Error request: <status> -
<text>`; otherwise it returns `res.json()` (`cron.ts:212-220`).
- Any rejection (network error, abort, non-OK status, JSON failure) is caught,
  logged as `❌ Error during agent '<slug>':`, and replaced by
  `{ error: error?.message || "Unknown error" }` (`cron.ts:221-224`). The
  sanitized production line `Error during agent 'host-module-page-cache':
AbortError: The operation was aborted.` matches this log call.
- Pushes a result marker `{ datetime, slug, result: agentExecutionResult }`
  (`cron.ts:226-236`). The running marker is not deleted at this point; both
  rows remain until the next dispatch for the slug deletes them.
- An outer catch logs `❌ Error durng executeCronTask for agent '<slug>':`
  (`cron.ts:237-242`).

Because the result marker is the newest row for the slug after step six, a
later cron tick sees `lastExecution.result` set, skips the running guard, and
evaluates only the interval. Nothing in this file observes whether the
server-side handler invoked at `cron.ts:205` is still executing.

`cron.ts` was last changed on 2026-03-08 (`908ed0310e`). `git diff
036cdb033f HEAD` reports no changes for `cron.ts`, `page/cache.ts`, or
`apps/api/server.ts`, so the worktree matches the upstream commit the issue
cites.

### 3. Execution records: Broadcast `cron` channel

Cron history is not an Agent-module table. It is stored as Broadcast messages
linked to the channel whose slug is `cron`:

- `broadcastChannelApi.pushMessage` sends a multipart `POST
${host}/api/broadcast/channels/push-message` with `data` as a JSON string
  (`libs/modules/broadcast/models/channel/sdk/server/src/lib/singlepage/push-message.ts:35-50`).
- The push-message controller requires `slug` and `payload`, finds or creates
  the channel by slug, creates the message with the full `data` object, and
  creates the channel-to-message relation
  (`libs/modules/broadcast/models/channel/backend/app/api/src/lib/controller/singlepage/push-message/index.ts:15-67`).
- The message table has `id`, `createdAt`, `updatedAt`, `variant`, `expiresAt`
  (default `NOW() + INTERVAL '1 hour'`), and `payload`
  (`libs/modules/broadcast/models/message/backend/repository/database/src/lib/fields/singlepage.ts:4-14`).
  There is no `slug` column; the shared repository parses inserts through the
  drizzle-zod insert schema, which drops keys that are not table columns
  (`libs/shared/backend/api/src/lib/repository/database/index.ts:183-215`,
  `libs/modules/broadcast/models/message/backend/repository/database/src/lib/index.ts:5`).
  Cron never sets `expiresAt`, so every marker inherits the one-hour default.
- The message service's `create` also queries rows whose `expiresAt` is in the
  past and deletes them without awaiting the result
  (`libs/modules/broadcast/models/message/backend/app/api/src/lib/service/singlepage/index.ts:13-39`).
  The Agent handler `broadcast-module-messages-delete-expired` performs the same
  purge as a scheduled job when an agent with that slug is configured
  (`delete-expied.ts:24-51`).
- The channel-to-message relation cascades on message deletion
  (`libs/modules/broadcast/relations/channels-to-messages/backend/repository/database/src/lib/schema.ts:17-24`),
  so a purged marker also disappears from the channel read at `cron.ts:44-57`.
- `messageDelete` issues `DELETE ${host}/api/broadcast/channels/:id/messages/:messageId`
  (`libs/modules/broadcast/models/channel/sdk/server/src/lib/singlepage/message-delete.ts:31-43`).

Consequences visible in the current code: the "history" for a slug is at most
the latest running marker plus the latest result marker, both created by the
most recent dispatch; and a running marker with no result stops protecting the
slug after one hour even when `AGENT_MAX_DURATION_IN_SECONDS` is larger,
because any Broadcast message creation may purge it.

### 4. Page-cache handler (`page/cache.ts`) and Host revalidation

- The handler checks `RBAC_SECRET_KEY`, logs `Host module page cache started`,
  and loads `this.service.hostModule.page.urls()` (`cache.ts:17-23`).
- The Host service builds URL records page by page, awaiting `withUrls` for
  each page in sequence, and returns the flattened `{ url: string }[]`
  (`libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:12`,
  `index.ts:225-238`). The #218 research measured 60 records on the local
  dataset.
- The nested loops iterate every URL and every configured language
  (`cache.ts:27-28`); with two languages each URL yields two iterations
  (`libs/shared/configuration/src/lib/internationalization/index.ts:1-13`).
- Each iteration composes the localized absolute path (`cache.ts:29-37`), then
  inside a per-page try block awaits `revalidatePage(path)` (`cache.ts:40`) and
  a `GET` of the page with no timeout (`cache.ts:42-44`); a non-OK page throws
  (`cache.ts:46-48`) and the catch logs `<path> - Failed to fetch page` and
  continues (`cache.ts:49-54`).
- `revalidatePage` calls `GET ${HOST_SERVICE_URL}/api/revalidate?path=<path>&type=page`,
  logs failures, and never throws (`cache.ts:69-85`). The Host route calls
  Next.js `revalidatePath(path, "page")` and returns JSON
  (`apps/host/app/api/revalidate/route.ts:7-31`).
- The handler logs `Host module page cache finished` and returns
  `{ data: { ok: true } }` after the last iteration (`cache.ts:59-61`); errors
  outside the per-page boundary become `HTTPException` (`cache.ts:62-66`).
- The work is `O(pages) + O(urls × languages)` sequential network round trips
  (one Host URL saturation per page, then one revalidate plus one GET per
  URL/language pair). `cache.ts` was last changed by the #218 fix on
  2026-07-28 (`3adedc062b`).
- A second, unrelated invocation path exists: the API seed script fires a
  delayed `fetch` to the page-cache URL without a method (defaults to GET)
  ten seconds after seeding (`apps/api/src/db/seed.ts:419-439`).

### 5. Timeout and abort configuration

Repository state:

- `apps/api/server.ts` calls `Bun.serve` with `fetch: app.fetch`, the port, the
  Hono websocket handler, and `idleTimeout: 0` (`apps/api/server.ts:9-14`).
  That option has been present since 2025-02-23 (`b8ee9c5ff3`).
- A search for `AbortSignal`, `AbortController`, `signal:`, and fetch
  `timeout` across `libs/modules/agent`, `libs/modules/broadcast`, `apps/api`,
  `libs/shared/frontend/server/api`, `libs/shared/frontend/client/api`,
  `libs/shared/utils`, and `libs/shared/backend` found no matches. The only
  timeout values in shared backend code are the PostgreSQL client's
  `idle_timeout: 20` and `connect_timeout: 10`
  (`libs/shared/backend/database/config/src/lib/postgres.ts:31-35`).
- The server SDK actions used by cron (`pushMessage`, `messageDelete`) pass
  caller `options` straight into `fetch`; cron passes only headers
  (`push-message.ts:37-50`, `message-delete.ts:31-43`, `cron.ts:181`,
  `cron.ts:200`, `cron.ts:235`).
- The container image is `FROM node:24` and installs Bun with the upstream
  install script at build time, so the Bun version is whatever the installer
  provides when the image is built (`Dockerfile:1`, `Dockerfile:6`). The API
  starts with `bun server.ts` (`start.sh:10-14`, `apps/api/package.json:6`,
  `apps/api/project.json:15-21`).

Runtime documentation gathered for this issue (external sources, links in
Related Research):

- Bun's fetch documentation shows `signal: AbortSignal.timeout(ms)` as the way
  to add a timeout and does not state a default.
- Bun PR #6217 set the default `fetch` timeout to five minutes and describes it
  as an idle timer measured from the last received data; `timeout: false`
  disables it.
- Bun issue #16682 (closed 2026-07-08, after Bun 1.3.14 was released on
  2026-05-13) records that a caller-supplied signal longer than the default was
  not honored before the fix.
- Third-party verification on Bun 1.3.14 reports a hung fetch failing at about
  300,003 ms with `TimeoutError: The operation timed out.`
- `Bun.serve` documentation: `idleTimeout` defaults to 10 seconds, the maximum
  is 255, and `0` disables it; it governs inbound connections only.

The production signature in the issue is `AbortError: The operation was
aborted.` after about 262 seconds. That name and duration do not match Bun's
documented internal fetch timeout (`TimeoutError`, about 300 seconds idle), and
no code in the repository aborts the request. The origin of the 262-second
abort therefore remains unidentified in this research (see Open Questions).

### 6. Concurrency primitives present today

- `agent.slug` is a unique text column and `interval` is nullable text
  (`libs/modules/agent/models/agent/backend/repository/database/src/lib/fields/singlepage.ts:14-19`).
  The model README describes agents as cron-like jobs with an interval
  (`libs/modules/agent/models/agent/README.md:5-6`, `README.md:17`).
- The running guard in `cron.ts:99-110` and the one-hour marker expiry in
  section 3 are the only run-state mechanisms for agents.
- The advisory-lock helper previously documented at
  `libs/shared/backend/database/config/src/lib/advisory-lock.ts` no longer
  exists. Commit `e0273194c8` ("fix(data): enforce natural keys without runtime
  locks", 2026-07-22) deleted the 55-line file; `libs/shared/backend/database/config/src/lib`
  now contains only `migrate`, `postgres.ts`, and
  `transform-many-to-many-relations`. No `pg_advisory` or `advisory` reference
  remains in `libs` or `apps`.
- The RBAC README records the resulting policy: Telegram bootstrap and
  free-subscription provisioning "do not serialize requests with application or
  advisory locks"; permanent unique indexes reject conflicting inserts instead
  (`libs/modules/rbac/README.md:106-110`).
- The #213 research catalogued the repository's current concurrency
  mechanisms and found no operation-attempt, inbox, outbox, or lease model and
  no `Idempotency-Key` usage (`thoughts/shared/research/singlepagestartup/ISSUE-213.md:32`,
  `ISSUE-213.md:175-186`).

### 7. Deployment trigger and topology

- `tools/deployer/api.sh` runs the `set_cron_jobs.yaml` playbook with
  `API_SERVICE_URL=$SERVICE_URL` and the RBAC secret (`tools/deployer/api.sh:179-182`).
- The playbook installs a system cron entry with `minute: "*"` that runs
  `curl -k -X POST https://{{ api_service_url }}/api/agent/agents/cron` with
  the `X-RBAC-SECRET-KEY` header and `-F 'data={}'`, appending output to
  `/home/code/api_agent_agents_cron.log`; the curl command sets no
  `--max-time` or `--connect-timeout` (`tools/deployer/api/set_cron_jobs.yaml:9-16`).
  The trigger therefore enters through Traefik on the `websecure` entrypoint
  (`tools/deployer/api/docker-compose.api.yaml.j2:24-30`).
- Inside the container, the env template sets `API_SERVICE_URL=http://api:4000`
  and `HOST_SERVICE_URL=http://host:3000` (`tools/deployer/api/api.env.j2:2-3`,
  `api.env.j2:6-8`), so the runner's self-fetch and the page-cache calls to Host
  use Swarm service names on the `traefik_overlay` network rather than the
  public hostname. No Traefik timeout configuration exists under
  `tools/deployer` (the only `timeout` keys are certbot and apt lock settings).
- The compose template declares `update_config.order: start-first`, a
  manager-node placement constraint, Traefik labels, and no `replicas` key
  (`docker-compose.api.yaml.j2:18-30`); it is deployed with `docker stack deploy`
  (`tools/deployer/api/create_api.yaml:48`). The #178 ticket recorded two
  containers, `api_api.1` and `api_api.2`, in the doctorgpt production service
  (`thoughts/shared/tickets/singlepagestartup/ISSUE-178.md`), so replica counts
  vary by downstream deployment.
- At container start, `start.sh api` runs `create_env.sh api deployment`, which
  writes `printenv` into `apps/api/.env`, starts `migrate.sh seed` in the
  background, and runs `npm run api:start` (`start.sh:10-14`,
  `create_env.sh:3-11`, `create_env.sh:33-37`).

### 8. Configuration: `AGENT_MAX_DURATION_IN_SECONDS`

- Defined as `parseInt(process.env.AGENT_MAX_DURATION_IN_SECONDS) || 5400`
  (`libs/shared/utils/src/lib/envs/artificial-intelligence.ts:1-2`); its only
  consumer is `cron.ts:99-102`.
- The deployer env template contains no `AGENT_MAX_DURATION_IN_SECONDS`
  (`tools/deployer/api/api.env.j2`), so a Swarm deployment that relies on the
  template runs with the 5400-second (90-minute) default.
- The tracked file `apps/api/.env.production` sets `NODE_ENV=production` and
  `AGENT_MAX_DURATION_IN_SECONDS=1200` (`apps/api/.env.production:1`,
  `apps/api/.env.production:23`). `apps/api/env.ts` loads only `.env`
  (`apps/api/env.ts:3`), the root `create_env.sh` consumes `.env.production`
  only for the Host app (`create_env.sh:19-22`), and neither the Dockerfile nor
  the deployer sets `NODE_ENV`. Whether Bun's automatic `.env.production`
  loading applies in production is listed under Open Questions.
- `API_SERVICE_URL` and `HOST_SERVICE_URL` default to `http://localhost:4000`
  and `http://localhost:3000` (`libs/shared/utils/src/lib/envs/host.ts:7-8`,
  `host.ts:15-16`).

### 9. Existing tests

- `page/cache.spec.ts` is a BDD suite that mocks `@sps/shared-utils`,
  `@sps/shared-configuration`, and `@sps/backend-utils`, replaces
  `globalThis.fetch`, spies on `revalidatePage`, and asserts the four localized
  paths, revalidate-before-fetch ordering, and continuation after a failed page
  (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.spec.ts:1-7`,
  `cache.spec.ts:12-46`, `cache.spec.ts:92-137`, `cache.spec.ts:146-186`).
- No spec or test file under `libs/modules/agent` references `cron`
  (`grep -rln cron --include='*.spec.ts'` returned nothing). The nearest
  controller-test pattern is
  `controller/singlepage/ecommerce-module/order/check.spec.ts:1-73`, as
  documented in the #218 research.
- The Agent Nx project exposes `jest:test`, `jest:integration`, `tsc:build`,
  and `eslint:lint`; the #169 and #218 process logs record that the focused
  command `npx nx run @sps/agent:jest:test --testFile=<path>` works while the
  generic `npm run test:file` wrapper has an Nx argument-parsing failure.

### 10. Verification of issue claims against live code

| Issue claim                                                                                  | Live code at `29370bcbf8`                                                                                                                                                                                                  |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `cache.ts:26` and `:27` iterate every URL and language sequentially                          | Loops are at `cache.ts:27-28` (`:26` is the `if (urls?.length)` guard).                                                                                                                                                    |
| Handler awaits revalidation at `:40` and a page GET at `:42`, returns at `:61`               | Matches: `cache.ts:40`, `cache.ts:42-44`, `cache.ts:61`.                                                                                                                                                                   |
| `cron.ts:209` dispatches via synchronous `fetch()` back to the API                           | The `fetch` call spans `cron.ts:205-211`; `:209` is the header line inside it.                                                                                                                                             |
| Catch at `cron.ts:225-228` converts a transport abort into `{ error }`                       | The catch is at `cron.ts:221-224`.                                                                                                                                                                                         |
| Result persisted at `cron.ts:230-241`                                                        | The result push is at `cron.ts:226-236`.                                                                                                                                                                                   |
| Deployed `apps/api/server.ts` sets `idleTimeout: 0`                                          | Matches: `apps/api/server.ts:13`.                                                                                                                                                                                          |
| Control flow exists in upstream commit `036cdb03…` and differs only by debug logs downstream | `git diff 036cdb033f HEAD` is empty for `cron.ts`, `page/cache.ts`, and `server.ts`.                                                                                                                                       |
| No durable completion handshake or atomic per-slug lock                                      | Matches: the guard is a non-atomic read (`cron.ts:89-110`); no lock helper exists (section 6).                                                                                                                             |
| Execution history reports failures for jobs that later complete                              | The result marker is written from the fetch outcome (`cron.ts:221-236`). "History" is limited to the latest running/result pair, deleted on the next dispatch (`cron.ts:171-190`) and expiring after one hour (section 3). |
| Caller is aborted after about 262 s                                                          | Not explained by repository code; Bun's documented default is a 300-second idle `TimeoutError` (section 5).                                                                                                                |

## Code References

- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/index.ts:40-44` - `POST /cron` route.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/index.ts:80-84` - `POST /host-module-page-cache` route.
- `libs/modules/agent/backend/app/api/src/lib/apps.ts:19-23` - `/agents` mount.
- `apps/api/app.ts:171-172` - authorization middleware; `apps/api/app.ts:180` - `/api/agent` mount.
- `libs/middlewares/src/lib/is-authorized/index.ts:43-44`, `:58-60` - secret-key authorization.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/cron.ts:27-83` - agent and marker loading.
- `cron.ts:89-110` - last-execution lookup and running guard.
- `cron.ts:119-136` - `cron-parser` due check.
- `cron.ts:142-154` - dispatch, `Promise.allSettled`, response.
- `cron.ts:171-190` - deletion of earlier markers.
- `cron.ts:192-201` - running marker push.
- `cron.ts:203-224` - self-fetch and error-to-result conversion.
- `cron.ts:226-236` - result marker push.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.ts:23-61` - page-cache loop and response.
- `cache.ts:69-85` - `revalidatePage`.
- `apps/host/app/api/revalidate/route.ts:7-31` - Host revalidation route.
- `libs/modules/host/models/page/backend/app/api/src/lib/service/singlepage/index.ts:225-238` - sequential `urls()`.
- `apps/api/server.ts:9-14` - `Bun.serve` with `idleTimeout: 0`.
- `libs/shared/backend/database/config/src/lib/postgres.ts:31-35` - PostgreSQL client timeouts.
- `libs/shared/utils/src/lib/envs/artificial-intelligence.ts:1-2` - `AGENT_MAX_DURATION_IN_SECONDS` default.
- `libs/shared/utils/src/lib/envs/host.ts:7-8`, `:15-16` - service URL defaults.
- `apps/api/.env.production:1`, `:23` - tracked production env values.
- `apps/api/env.ts:3` - dotenv loads `.env` only.
- `create_env.sh:3-11`, `:33-37` - deployment env materialization.
- `libs/modules/broadcast/models/channel/backend/app/api/src/lib/controller/singlepage/push-message/index.ts:15-67` - marker creation.
- `libs/modules/broadcast/models/message/backend/repository/database/src/lib/fields/singlepage.ts:4-14` - message columns and one-hour expiry default.
- `libs/modules/broadcast/models/message/backend/app/api/src/lib/service/singlepage/index.ts:13-39` - purge on create.
- `libs/modules/broadcast/relations/channels-to-messages/backend/repository/database/src/lib/schema.ts:17-24` - cascade rules.
- `libs/shared/backend/api/src/lib/repository/database/index.ts:183-215` - insert parsing.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/broadcast-module/message/delete-expied.ts:24-51` - expired-message agent.
- `libs/modules/broadcast/models/channel/sdk/server/src/lib/singlepage/push-message.ts:37-50`, `message-delete.ts:31-43` - SDK fetch calls.
- `libs/modules/agent/models/agent/backend/repository/database/src/lib/fields/singlepage.ts:14-19` - unique `slug`, `interval`.
- `libs/modules/agent/models/agent/backend/repository/database/src/lib/data/*.json` - three seeded agents with `* * * * *`; no page-cache seed.
- `libs/modules/rbac/README.md:106-110` - no-runtime-lock policy.
- `tools/deployer/api/set_cron_jobs.yaml:9-16` - system cron trigger.
- `tools/deployer/api.sh:179-182` - playbook invocation.
- `tools/deployer/api/api.env.j2:2-3`, `:6-8` - internal service URLs.
- `tools/deployer/api/docker-compose.api.yaml.j2:18-30` - deploy settings.
- `tools/deployer/api/create_api.yaml:48` - `docker stack deploy`.
- `Dockerfile:1`, `:6` - Node 24 base with Bun installed at build time.
- `start.sh:10-14`, `apps/api/package.json:6`, `apps/api/project.json:15-21` - API start chain.
- `apps/api/src/db/seed.ts:419-439` - delayed seed call to the page-cache route.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/page/cache.spec.ts:1-186` - existing page-cache BDD spec.

## Architecture Documentation

- The root README layers backend code as Repository → Service → Controller →
  App; Agent handlers are controller-level classes instantiated per request
  with the DI-provided `Service` (`controller/singlepage/index.ts:138-152`),
  and the Agent service composes `broadcastModule` and `hostModule` through
  inversify (`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:162-193`).
- Cross-module writes from Agent go through server SDKs over HTTP with the RBAC
  service header rather than direct repository access (`cron.ts:178-182`,
  `cron.ts:192-201`, `delete-expied.ts:42-49`), consistent with the repository
  rule to use SDK providers for data access.
- Scheduled work is modelled as Agent rows (`slug`, `interval`) executed by
  the cron runner; run state is externalized to the Broadcast module as
  messages on a channel, and the Broadcast module treats messages as expiring
  payloads (`libs/modules/broadcast/README.md:9-11`).
- The repository's stated concurrency approach since 2026-07-22 is natural-key
  uniqueness enforced by PostgreSQL rather than runtime locks
  (`libs/modules/rbac/README.md:100-110`).
- Deployment separates the public trigger (Traefik, HTTPS, system cron) from
  internal service-to-service traffic (overlay network, plain HTTP service
  names).

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-211.md:158` and
  `ISSUE-211.md:183` (2026-07-20) already described the cron runner's marker
  read as observational state that two cron requests can both pass, and
  classified Broadcast markers as an optimization rather than a correctness
  boundary. Issue #211 is closed.
- `thoughts/shared/research/singlepagestartup/ISSUE-213.md:102-103` and
  `ISSUE-213.md:157` (2026-07-21) documented the same Broadcast-backed cron
  state and listed cron among flows without an operation-attempt or lease
  record. Issue #213 ("Make cross-module operations concurrency-safe and
  idempotent") is still open and has no plan artifact. That research cited the
  advisory-lock helper at `advisory-lock.ts:1-55`; the helper was deleted the
  next day (`e0273194c8`, 2026-07-22).
- `thoughts/shared/research/singlepagestartup/ISSUE-218.md` and
  `thoughts/shared/plans/singlepagestartup/ISSUE-218.md` (2026-07-28) cover the
  page-cache string-URL fix, the route chain, the language configuration, the
  `cache.spec.ts` pattern, and the seed script's GET/POST mismatch. The plan
  explicitly kept the sequential `O(urls × languages)` loop unchanged. Issue
  #218 is closed.
- `thoughts/shared/tickets/singlepagestartup/ISSUE-178.md` preserves a
  production `The operation was aborted.` report whose stack points at the RBAC
  notify controller and `response-pipe.ts`, with two `api_api` containers in
  service. Its process log shows only the create phase; issue #178 is closed.
- `thoughts/shared/processes/singlepagestartup/ISSUE-169.md` and
  `ISSUE-218.md` record the working focused Jest command for the Agent
  project and the `test:file` wrapper failure.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-218.md` - page-cache route, contract, and test patterns.
- `thoughts/shared/research/singlepagestartup/ISSUE-213.md` - repository-wide concurrency and idempotency inventory.
- `thoughts/shared/research/singlepagestartup/ISSUE-211.md` - Telegram bootstrap race; cron marker classification.
- `thoughts/shared/research/singlepagestartup/ISSUE-169.md` - agent route to RBAC subject check; focused Jest command.
- External sources consulted for Bun runtime behavior:
  - Bun fetch docs: https://bun.com/docs/runtime/networking/fetch
  - Bun server docs (`idleTimeout`): https://bun.com/docs/runtime/http/server
  - Bun PR #6217 (five-minute default, `timeout: false`): https://github.com/oven-sh/bun/pull/6217
  - Bun issue #16682 (signal longer than default): https://github.com/oven-sh/bun/issues/16682
  - Bun PR #16859 (implicit `timeout: false` with `AbortSignal.timeout`): https://github.com/oven-sh/bun/pull/16859
  - Third-party verification on Bun 1.3.14: https://github.com/can1357/oh-my-pi/issues/2422
  - Bun v1.3.14 release: https://github.com/oven-sh/bun/releases/tag/bun-v1.3.14

## Open Questions

- What produces the 262-second `AbortError` on the self-fetch? Repository code
  sets no signal or timeout, and Bun's documented default is a 300-second idle
  `TimeoutError`. Candidates that this research could not confirm from code or
  documentation include the Swarm overlay/VIP path between `api` tasks, the Bun
  build actually installed in the affected image, and Hono/Bun handling of a
  long-running inbound request whose upstream client disconnected.
- Which `AGENT_MAX_DURATION_IN_SECONDS` value is effective in production: the
  5400-second default from the deployer template, or the 1200-second value in
  the tracked `apps/api/.env.production`? That depends on whether Bun's
  automatic `.env.production` loading applies with `NODE_ENV` unset by the
  deployer, and the repository does not document whether that file is part of
  the API runtime contract.
- How many `api` replicas ran in the affected deployment, and did the paired
  15:00/15:04 starts come from two replicas, from consecutive minute ticks after
  the error result cleared the running guard, or from a `start-first` rolling
  update window?
- The `host-module-page-cache` agent row and its interval are configured per
  downstream project (no framework seed exists); the observed three-hour
  cadence comes from that configuration and is not visible in this repository.
