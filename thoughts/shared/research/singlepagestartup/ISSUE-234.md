---
date: 2026-09-18T02:13:33+03:00
researcher: flakecode
git_commit: 29370bcbf85b195fbd1c2422707141135184d6e0
branch: worktree-issues-2026-09-18
repository: singlepagestartup
topic: "Bound anonymous Subject growth with safe retention and session initialization"
tags: [research, codebase, rbac, subject, agent, cron, authentication, retention, cache]
status: complete
last_updated: 2026-09-18
last_updated_by: flakecode
---

# Research: Bound anonymous Subject growth with safe retention and session initialization

**Date**: 2026-09-18T02:13:33+03:00
**Researcher**: flakecode
**Git Commit**: 29370bcbf85b195fbd1c2422707141135184d6e0
**Branch**: worktree-issues-2026-09-18
**Repository**: singlepagestartup

## Research Question

Issue #234 asks how anonymous RBAC Subjects are created, reused, refreshed, and removed today, so that a later plan can bound their growth without breaking first-visit action recording. This document records the live implementation of browser session initialization, the `authentication/init` and `authentication/refresh` endpoints, JWT lifetime defaults, the two anonymous-cleanup implementations, the cron dispatcher and its persisted agents, the relations that cascade on Subject delete, how visitor actions are recorded, whether reads touch `updatedAt`, Subject indexes, the batching pattern from #169, and the existing BDD coverage. Every load-bearing claim in the issue was checked against the worktree at commit `29370bcbf8`, which contains the upstream commit `99e3037f08` the issue cites.

Paths below are relative to the repository root. Short forms such as `ClientComponent.tsx` and `init.ts` refer to the full paths listed under Code References.

## Summary

- The host root layout mounts `authentication-init-default` on every page (`apps/host/app/layout.tsx:42`). The client component keeps a valid JWT, calls refresh when a valid refresh token exists, and otherwise calls init; the guard against repeated calls is a component-local ref plus React Query pending flags (`ClientComponent.tsx:73`, `:108-175`). A hydration sentinel (`""`) from `useLocalStorage` prevents init before the refresh token has been read (`use-local-storage/index.ts:20`, `ClientComponent.tsx:120-122`).
- `GET /api/rbac/subjects/authentication/init` creates a Subject on every execution through the server SDK and signs an access token (default 3,600 s) and a refresh token (default 2,419,200 s, 28 days) that both embed the full Subject row (`init.ts:37-65`). No server-side reuse key exists.
- `POST /api/rbac/subjects/authentication/refresh` verifies the refresh token, re-reads the Subject by id, and issues a new pair; the new refresh token uses `RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS` (default 86,400 s, one day), not the anonymous lifetime (`service/singlepage/refresh.ts:43-79`). Neither init nor refresh writes to the Subject row.
- Two cleanup implementations exist. The agent handler behind `POST /api/agent/agents/rbac-module-subjects-delete-anonymous` selects Subjects by `createdAt < now - RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS`, loads every `subjects-to-identities` and `subjects-to-social-module-profiles` row, filters in memory, and deletes sequentially over HTTP while swallowing per-item errors (`delete-anonymous.ts:32-105`). The RBAC service `deleteAnonymousSubjects` uses a hard-coded 30 days and only an identity guard; its only reference is the wrapper in `service/singlepage/index.ts:303-308` (`delete-anonymous-subjects.ts:29-71`).
- The cron dispatcher runs on every `POST /api/agent/agents/cron` (fired each minute by an Ansible-managed system cron), decides per agent from Broadcast markers on channel `cron`, and executes when no marker exists or the `cron-parser` next time has passed (`cron.ts:87-148`). Markers carry the Broadcast message default expiry of one hour (`broadcast message fields/singlepage.ts:9-12`). The repository seeds three agents, all `* * * * *`; no `rbac-module-subjects-delete-anonymous` agent is seeded, so the production `0 0 * * *` agent is a database record created outside the repository snapshot.
- Ten RBAC relations reference the Subject table and all declare `onDelete: "cascade"` on `subjectId`: actions, billing currencies (balance `amount`), billing payment intents, blog articles, ecommerce orders, ecommerce products, notification topics, identities, roles, and social profiles. No relation outside `libs/modules/rbac` references the Subject table.
- Visitor actions are recorded by `ActionsLoggerMiddleware` only for successful non-GET requests on an allow-listed route set (by default three social chat routes), as an `rbac.action` plus a `subjects-to-actions` link, fire-and-forget (`actions-logger/index.ts:54-153`, `routes/singlepage.ts:8-24`). `rbac.action` rows default to a six-hour `expiresAt`; no agent deletes expired RBAC actions.
- `updatedAt` on a Subject changes only through the shared repository update path (`repository/database/index.ts:291-292`); `me`, `is-authorized`, `init`, and `refresh` do not update the row. The Subject table has a primary key and a unique `slug` constraint and no other index (`migrations/0004_sparkling_lilandra.sql:4`).
- Every claim in the issue that can be checked against repository code holds at current line numbers. One claim is environment-specific and not reproducible here: `apps/api/.env:63` with a 43,200 s override. The generated, git-ignored `apps/api/.env` in this worktree has no `RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS` line, and `apps/api/create_env.sh` does not emit one.

## Detailed Findings

### 1. Browser session initialization (`authentication-init-default`)

Mounting. `apps/host/app/layout.tsx:42` renders `<RbacSubject isServer={false} variant="authentication-init-default" />` inside the root layout, so one instance exists for the whole App Router tree and persists across client navigations.

Inputs. The component reads the `rbac.subject.jwt` cookie on first render (`ClientComponent.tsx:15`, `:28-48`, `:70-72`) and the `rbac.subject.refresh` localStorage key through `useLocalStorage` (`:83`). It decodes both tokens with `react-jwt` (`:84-94`) and re-evaluates every second through the `seconds` state (`:69`, `:218-224`). It re-reads the cookie on the `sps-rbac-auth-storage-change` event and on window `focus` (`:177-196`).

Decision effect (`:108-175`), in order:

1. If the pathname is the OAuth select-method callback with `code` or `oauthError`, do nothing (`:96-99`, `:109-111`).
2. If the JWT cookie decodes with `exp * 1000 >= now`, clear `lastAuthActionRef` and stop (`:113-118`).
3. If the refresh token is still the hydration sentinel `""`, stop (`:120-122`). `useLocalStorage` starts from `""` and only then syncs with localStorage so that "not read yet" differs from "missing" (`libs/shared/frontend/client/hooks/src/lib/use-local-storage/index.ts:8-20`).
4. If a refresh token exists and is unexpired, build a key `refresh:expired-jwt:<exp>:<token>` or `refresh:missing-or-invalid-jwt:<token>`; skip when the ref already holds that key or `refresh.isPending`; otherwise store the key and call `refresh.mutate` (`:124-144`).
5. Otherwise, if any stale credential exists, call `clearAuthenticationTokens()` (`:146-148`); build an init key (`init:expired-jwt:<exp>`, `init:invalid-jwt`, `init:invalid-refresh`, or `init:missing-jwt`); skip when the ref holds it or `init.isFetching`; otherwise store it and call `init.refetch()` (`:150-163`).

The guard is `lastAuthActionRef` (`:73`), a `useRef` local to one component instance. It resets to `null` when a valid JWT is observed (`:116`) and when either request succeeds (`:210-216`). A refresh error with HTTP status 401 clears both tokens (`:198-208`), after which the effect takes the init branch on the next tick.

SDK actions. `api.authenticationInit` is a `useQuery` with key `${route}/authentication/init` and `persistAuthenticationTokens(result)` inside `queryFn` (`sdk/client/.../authentication/init.ts:23-49`); the component passes `enabled: false` (`ClientComponent.tsx:78-82`). `api.authenticationRefresh` is a `useMutation` that persists tokens on success and toasts only when not muted (`sdk/client/.../authentication/refresh.ts:27-57`); the component passes `mute: true` (`:75-77`).

Persistence. `persistAuthenticationTokens` writes the refresh token to localStorage, writes the JWT cookie with `sameSite: strict`, `expires` from the token `exp`, and `secure` on HTTPS, then dispatches the storage event (`persist-authentication-tokens.ts:21-46`). `clearAuthenticationTokens` removes both and dispatches the same event (`:48-56`). `useLocalStorage` listens to the native `storage` event and to this custom event (`use-local-storage/index.ts:33-44`), so a second tab that persists tokens updates the first tab's `refreshToken` value.

### 2. `GET /authentication/init` controller

Route binding: `controller/singlepage/index.ts:140-143`. Handler `authentication/init.ts`:

- Requires `RBAC_SECRET_KEY`, `RBAC_JWT_SECRET`, and `RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS` (`:24-35`).
- Calls `api.create({ data: {} })` on the Subject server SDK with the `X-RBAC-SECRET-KEY` header on every execution (`:37-44`). No lookup by cookie, header, or request attribute precedes creation.
- Signs the access JWT `{ exp: now + RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS, iat, subject: entity }` (`:46-54`) and the refresh JWT `{ exp: now + RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS, iat, subject: entity }` (`:56-65`). Both embed the full Subject row.
- Sets cookie `rbac.subject.jwt` with `path: /`, `secure: true`, `httpOnly: false`, `expires` from the token, `sameSite: Strict` (`:73-79`) and returns `201 { data: { jwt, refresh } }` (`:81-89`).

The OpenAPI entry documents the route as "Initialize authentication session" (`libs/modules/rbac/models/subject/sdk/model/src/lib/paths.yaml:442-450`), and the Subject README lists it as "initialize anonymous/authenticated session tokens" (`libs/modules/rbac/models/subject/README.md:37`).

### 3. `POST /authentication/refresh` controller and service

Route binding: `controller/singlepage/index.ts:155-158`. Controller `authentication/refresh.ts` parses `data.refresh` from the form body (`:31-41`), calls `service.refresh` (`:43-45`), verifies the returned JWT, sets the cookie with `maxAge` and `expires` (`:53-60`), and returns `201` (`:62-67`).

Service `service/singlepage/refresh.ts`:

- Verifies the refresh token with `RBAC_JWT_SECRET` and reads `decoded.subject.id` (`:35-41`).
- Reads the Subject through the server SDK `findById` with `Cache-Control: no-store` (`:43-51`); a missing Subject throws `Not Found error. No subject found` (`:53-55`), which the controller converts through `getHttpErrorType`.
- Signs a new access JWT with `subject: { id }` (`:57-66`) and a new refresh JWT with `exp: now + RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS` (`:68-79`). This is the general refresh lifetime (default 86,400 s), not the anonymous one; a refreshed anonymous session therefore carries a one-day refresh token unless the environment overrides that variable.

Neither the controller nor the service writes to the Subject row.

### 4. Lifetime defaults and configuration surfaces

`libs/shared/utils/src/lib/envs/rbac.ts`:

- `RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS`: env, then the `NEXT_PUBLIC_` variant, then `3600` (`:10-13`).
- `RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS`: env, then `2419200` (28 days) (`:14-16`).
- `RBAC_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS`: env, then `86400` (`:17-19`).

Consumers of the anonymous lifetime: `authentication/init.ts:2,31-35,60`; `agent .../rbac-module/subject/delete-anonymous.ts:2,24-28,41`; and `agent .../rbac-module/subject/check.ts:2,24-28`, where the order-processing job requires the variable but does not use its value.

Environment files. `apps/api/.env` is git-ignored (`apps/api/.gitignore:6`) and generated by `apps/api/create_env.sh`, whose RBAC lines write `RBAC_COOKIE_SESSION_SECRET`, `RBAC_JWT_SECRET`, `RBAC_SECRET_KEY`, and the seeded admin identity (`create_env.sh:83-90`, `:106-107`); it does not write the anonymous lifetime. The worktree's generated `.env` (142 lines) contains no `RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS` line. The deployer API template forwards `RBAC_JWT_SECRET`, `RBAC_SECRET_KEY`, `RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS` (default 3600), and the OAuth variables only (`tools/deployer/api/api.env.j2:22-44`).

### 5. Scheduled cleanup: agent handler `rbac-module-subjects-delete-anonymous`

Route: `POST /api/agent/agents/rbac-module-subjects-delete-anonymous` (`agent controller/singlepage/index.ts:125-129`; OpenAPI `apps/openapi/openapi.yaml:351-352`). The agent app is mounted after the global middlewares (`apps/api/app.ts:180`), so the request passes request-id, observer, revalidation, optional HTTP cache, action logger, is-authorized, bill-route, and parse-query middlewares (`apps/api/app.ts:116-178`).

Handler `delete-anonymous.ts`:

- Requires `RBAC_SECRET_KEY` and the anonymous lifetime (`:20-28`); logs `Rbac module subject delete anonymous started` (`:30`).
- `this.service.rbacModule.subject.find({ filters: createdAt lt now - lifetime * 1000 })` (`:32-47`). `rbacModule.subject` is an in-process `CRUDService` over the RBAC Subject repository, not an HTTP call (`agent bootstrap.ts:196-201`). The shared repository `find` applies `limit` and `offset` only when passed (`libs/shared/backend/api/src/lib/repository/database/index.ts:86-93`), so this call returns every matching row.
- `this.service.rbacModule.subjectsToIdentities.find()` and `subjectsToSocialModuleProfiles.find()` with no filters, loading both relation tables in full (`:49-53`). These run before the early return for an empty candidate list (`:55-57`).
- In-memory filter: keep a Subject when it has no identity link (`:59-70`) and no social-profile link (`:71-87`).
- Sequential `rbacModuleSubjectApi.delete({ id })` over the server SDK (HTTP to `/api/rbac/subjects/:id`) with the secret header (`:89-99`); the `catch` block contains only commented-out logging (`:100-104`).
- Logs `finished` and returns `{ data: { ok: true } }` (`:108-110`). The outer `catch` converts thrown errors to `HTTPException` (`:111-115`).

The handler checks neither ecommerce order links, roles, billing balances, `variant`, nor any activity timestamp. It has no batch size, cursor, time cap, or dry-run switch, and it reports no counts.

### 6. Service `deleteAnonymousSubjects` (RBAC subject service)

`service/singlepage/delete-anonymous-subjects.ts` is constructed with a `find` function and the `SubjectsToIdentitiesService` (`:9-21`). `execute` finds Subjects with `createdAt < now - 30 days` (`:29-43`), looks up identity links per Subject (`:47-59`), deletes over the server SDK when none exist (`:61-70`), and logs errors with the prefix `clearAnonymusSessions` (`:73-75`). It is exposed as `Service.deleteAnonymousSubjects` (`service/singlepage/index.ts:303-308`). A repository-wide search for `deleteAnonymousSubjects` and `delete-anonymous-subjects` finds only the import and the wrapper; no controller, agent, test, or script calls it.

History: both cleanup files date from the October 2025 refactoring commits (`57bfe543ba`, `eac0e7cf3d`) and were last touched by the March 2026 dependency-injection commit `82ef50af18`.

### 7. Cron dispatcher and persisted agents

Trigger. The deployer installs a system cron entry that runs every minute: `curl -X POST https://<api>/api/agent/agents/cron` with the `X-RBAC-SECRET-KEY` header (`tools/deployer/api/set_cron_jobs.yaml:9-16`). Route binding: `agent controller/singlepage/index.ts:40-44`.

Dispatcher `cron.ts`:

- Loads all agents and the Broadcast channel with slug `cron` (`:27-42`), then that channel's messages (`:44-75`), parsed into `{ id, datetime, slug, result }` (`:77-83`).
- Per agent (`:87-148`): a latest marker without `result` that is younger than `AGENT_MAX_DURATION_IN_SECONDS` (default 5,400 s, `libs/shared/utils/src/lib/envs/artificial-intelligence.ts:1-2`) means "still running", so skip (`:93-110`). No `interval` means skip (`:112-114`). Otherwise `cron-parser` computes the next time from `lastExecutionTime || now`; execute when no prior marker exists or `now >= nextExecutionTime` (`:119-129`).
- `executeCronTask` deletes the agent's prior markers best-effort (`:171-190`), pushes a running marker (`:192-201`), POSTs `/api/agent/agents/<slug>` with the secret header and captures the JSON or an `{ error }` object (`:203-224`), then pushes a result marker (`:226-236`). All agents run through `Promise.allSettled` (`:150-152`).

Marker persistence. `pushMessage` creates the Broadcast message with only the supplied `slug` and `payload` (`broadcast channel push-message/index.ts:58-60`), so markers take the message default `expiresAt = NOW() + INTERVAL '1 hour'` (`broadcast message fields/singlepage.ts:9-12`). The agent `broadcast-module-messages-delete-expired` deletes expired messages when an agent record with that slug exists (`delete-expied.ts:24-50`). ISSUE-213 research already records that two dispatcher requests can both pass the marker read for the same agent (`thoughts/shared/research/singlepagestartup/ISSUE-213.md`, section "Notification and scheduler delivery").

Agent records. The `agent` table has a unique `slug` and a free-text `interval` (`agent fields/singlepage.ts:14-19`). Repository seed data contains three agents, all with interval `* * * * *`: `billing-module-payment-intents-check`, `ecommerce-module-orders-check`, and `rbac-module-subjects-check` (`libs/modules/agent/models/agent/backend/repository/database/src/lib/data/*.json`). No seed exists for `rbac-module-subjects-delete-anonymous` or `broadcast-module-messages-delete-expired`; the only repository references to the cleanup slug are the route binding and the OpenAPI path. Seeds load through `nx run api:db:seed` (`apps/api/project.json:147-155`).

### 8. Subject schema, indexes, and relations that cascade on delete

Subject schema: `id`, `createdAt`, `updatedAt`, `variant` (default `default`), `slug` (unique) (`subject fields/singlepage.ts:4-14`). Migrations add only the `slug` unique constraint (`0004_sparkling_lilandra.sql:4`); no index exists on `createdAt`, `updatedAt`, or `variant`. The Subject seed directory holds only `.gitkeep`.

All relations that reference the Subject table live under `libs/modules/rbac/relations/` and declare `onDelete: "cascade"` on `subjectId`:

| Relation                                   | Table                          | Cascade                      | Extra columns and constraints                                                                            |
| ------------------------------------------ | ------------------------------ | ---------------------------- | -------------------------------------------------------------------------------------------------------- |
| subjects-to-actions                        | `sps_rc_ss_to_as_fw6`          | `schema.ts:17-20`            | `actionId` also cascades (`:21-24`)                                                                      |
| subjects-to-billing-module-currencies      | `sps_rc_ss_to_bg_me_cs_vvd`    | `schema.ts:18-21`            | `amount` balance text (`:17`)                                                                            |
| subjects-to-billing-module-payment-intents | `sps_rc_ss_to_bg_me_pt_is_fv3` | `schema.ts:16-19`            | payment intent id without FK (`:20`)                                                                     |
| subjects-to-blog-module-articles           | `sps_rc_ss_to_bg_me_as_b03`    | `schema.ts:17-20`            |                                                                                                          |
| subjects-to-ecommerce-module-orders        | `sps_rc_ss_to_ee_me_os_oq2`    | `schema.ts:17-20`            | order id cascades (`:21-24`)                                                                             |
| subjects-to-ecommerce-module-products      | `rc_ss_to_ee_me_ps_whq`        | `schema.ts:17-20`            |                                                                                                          |
| subjects-to-notification-module-topics     | `sps_rc_ss_to_nn_me_ts_cfg`    | `schema.ts:16-19`            | topic id without FK (`:20`)                                                                              |
| subjects-to-identities                     | `sps_rc_ss_to_is_h58`          | `fields/singlepage.ts:12-15` | unique index on `identityId` (`constraints/singlepage.ts:10-14`, `migrations/0001_loving_sleeper.sql:1`) |
| subjects-to-roles                          | `sps_rc_ss_to_rs_3nw`          | `fields/singlepage.ts:12-15` | unique `(subjectId, roleId)` (`constraints/singlepage.ts:11-15`)                                         |
| subjects-to-social-module-profiles         | `rc_ss_to_sl_me_ps_ges`        | `fields/singlepage.ts:12-15` | unique `(subjectId, socialModuleProfileId)` (`constraints/singlepage.ts:11-15`)                          |

Deleting a Subject removes its rows in these ten tables; the referenced order, product, identity, role, profile, currency, article, and action rows remain.

Delete path. `DELETE /api/rbac/subjects/:uuid` (`subject controller/singlepage/index.ts:250-253`) runs the shared CRUD delete action, `repository.deleteFirstByField("id", id)` (`libs/shared/backend/api/src/lib/service/crud/actions/delete/index.ts:14-18`). For every successful mutation the revalidation middleware broadcasts a websocket message per normalized path and calls the host `/api/revalidate?tag=` endpoint (`libs/middlewares/src/lib/revalidation/index.ts:98-121`), and, when `MIDDLEWARE_HTTP_CACHE=true`, the HTTP cache middleware bumps versions for `/rbac/permissions`, the id-less path, and the path up to the first UUID (`libs/middlewares/src/lib/http-cache/index.ts:217-240`). The registration order is documented at `apps/api/app.ts:146-154`.

### 9. Subject creation and identity attachment outside init

- Email/password registration creates a new Subject, an identity link, and role links (`service/singlepage/authentication/email-and-password.ts:71-142`); authentication resolves the Subject through the identity link (`:145-183`). The anonymous Subject of the current session is not reused in this path.
- Ethereum login creates an identity and a new Subject on first sight of an address (`authentication/ethereum-virtual-machine.ts:93-126`).
- Telegram bootstrap creates a Subject when no identity link resolves one (`telegram/bootstrap.ts:864-873`, `:886-897`).
- OAuth callback resolves the target Subject in order: existing provider identity, verified-email match to an email/password identity, `sourceSubjectId` from the link flow, else a new Subject from the profile (`authentication/oauth/callback.ts:163-201`).
- `deanonymize` attaches an `email` identity to an existing Subject id without creating a new Subject (`service/singlepage/deanonymize.ts:32-108`; spec `deanonymize.spec.ts`). It is called from cart checkout (`ecommerce-module/order/checkout.ts:78`) and from product checkout except for `telegram-star` (`ecommerce-module/product/id/checkout.ts:81-83`).
- Order ownership links are created in `ecommerce-module/order/create.ts:289-291` and `ecommerce-module/product/id/checkout.ts:160-162`; a Subject balance row is created during order proceed (`service/singlepage/ecommerce/order/proceed.ts:734`).

Identity providers created in code: `email` (`deanonymize.ts:83-88`), `ethereum_virtual_machine` (`ethereum-virtual-machine.ts:93-100`), `telegram` (`bootstrap.ts:878-884`), and OAuth provider identities (`oauth/callback.ts`). The identity table stores `provider` (default `email`), `account`, `email`, `password`, `salt`, and `code` (`identity fields/singlepage.ts:3-14`).

### 10. Visitor action recording

`ActionsLoggerMiddleware` is registered at `apps/api/app.ts:168-169`. After `next()` it returns unless the request path and method match the logging matcher (`actions-logger/index.ts:54-56`), the response carries `X-SPS-SKIP-ACTION-LOGGER: 1` (`:58-60`), or the response is not 2xx (`:62`). For non-GET requests with a bearer token (`:63-66`) it starts a detached task that decodes the JWT, parses the request body, and, when `decoded.subject.id` exists, creates an `rbac.action` with `payload { route, method, type: "HTTP", requestData, result }` (`:106-126`), a `subjects-to-actions` link (`:128-138`), and notifies the agent Telegram bot (`:140-149`). Errors are logged and never affect the response (`:150-157`).

Logged routes are layered: constructor options, then `routes/startup.ts` (empty, `:21`), then `routes/singlepage.ts`, which lists only the social chat `actions`, `messages`, and thread `messages` routes (`:8-24`; matcher in `routes/index.ts:18-26`). GET requests and unlisted routes produce no action rows.

`rbac.action` rows have `expiresAt` defaulting to `NOW() + INTERVAL '6 hours'` and a JSON `payload` (`rbac action fields/singlepage.ts:9-13`); the README describes them as time-bound authorizations or subject-scoped events (`libs/modules/rbac/models/action/README.md`). OAuth start and callback also create actions (`oauth-state`, `oauth-exchange`). The only agent that deletes by `expiresAt` targets Broadcast messages (`delete-expied.ts:30`); no agent deletes expired `rbac.action` rows. The Social module has its own `action` model with a one-month default expiry (`social action fields/singlepage.ts:9-12`).

### 11. `updatedAt` and read paths

- The shared repository sets `updatedAt = new Date()` inside `update` when the caller did not supply it (`libs/shared/backend/api/src/lib/repository/database/index.ts:291-292`); the CRUD create and update actions strip client-supplied `updatedAt` (`service/crud/actions/create/index.ts:16`, `update/index.ts:15`).
- `GET /authentication/me` verifies the JWT and returns `decoded.subject`; the `findById` call is commented out (`authentication/me.ts:34-45`).
- `is-authorized` caches token to subject id, subject to role ids, and permission resolutions in a 30 s in-memory cache (`service/singlepage/is-authorized.ts:9`, `:122-139`).
- `refresh` reads the Subject with `no-store` and does not update it (`service/singlepage/refresh.ts:43-51`).

No read path in the Subject module writes `updatedAt`; the column reflects the last explicit update, not activity.

### 12. Batching pattern from #169 (order proceed)

`service/singlepage/ecommerce/order/proceed.ts` exports `ECOMMERCE_ORDER_PROCEED_BATCH_LIMIT = 100` (`:52`), selects candidate orders with `limit` and `orderBy updatedAt asc` (`:215-219`), dedupes and slices candidate ids to the limit (`:86-91`), and only then queries subject-order relations with `inArray` over the selected ids (`:232-236`). A process-local `processingOrderIds` set guards re-entry inside one API process (`:129`, `:266-270`, `:441`). BDD coverage lives in `proceed.spec.ts` (bounded query, relation lookup after selection, dedupe and cap, scoped execution). ISSUE-169 research records the production scale that motivated it (66,398 relation rows against a 65,534-parameter ceiling).

### 13. Existing BDD coverage

- `init-default/ClientComponent.spec.tsx` (BDD Suite header `:5-11`): no request during localStorage hydration (`:84`), a valid JWT cookie keeps the session (`:103`), a missing JWT with a valid refresh token calls refresh rather than init (`:136`), and no persisted auth calls init once (`:169`). The suite mocks the SDK, hook, navigation, and `react-jwt`.
- `service/singlepage/deanonymize.spec.ts` covers identity attachment.
- `service/singlepage/is-authorized.spec.ts` covers authorization caching.
- No spec exists for `authentication/init.ts`, `authentication/refresh.ts`, `service/singlepage/refresh.ts`, `delete-anonymous.ts`, `delete-anonymous-subjects.ts`, or `cron.ts`. Agent specs cover `ecommerce-module/order/check`, `page/cache`, `telegram/*`, and the service layer.
- `authentication/email-and-password/registration/index.spec.ts` is a placeholder whose single case asserts `false` (`:9-13`).

### 14. Verification of issue claims against live code

| Issue claim                                                                                                                                                                                                                             | Live code                                                                    | Result                                                       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Browser init reuses a valid JWT, refreshes when possible, otherwise inits; the guard is component-local                                                                                                                                 | `ClientComponent.tsx:73`, `:113-163`                                         | Holds                                                        |
| `init.ts#L37` creates a Subject on each execution; no reuse                                                                                                                                                                             | `init.ts:37-44`                                                              | Holds, same line                                             |
| `rbac.ts#L14` anonymous refresh lifetime 28 days                                                                                                                                                                                        | `rbac.ts:14-16`                                                              | Holds                                                        |
| Cleanup selects by `createdAt` coupled to the refresh lifetime, loads all identity and profile relations, filters in memory, deletes one at a time, swallows errors, checks neither orders, roles, nor variants, and has no batch bound | `delete-anonymous.ts:32-105`                                                 | Holds                                                        |
| Second service: hard-coded 30 days, per-subject identity lookup, no order or profile guard, no active caller                                                                                                                            | `delete-anonymous-subjects.ts:29-71`, `index.ts:303-308`                     | Holds                                                        |
| `subjects-to-ecommerce-module-orders` schema `#L17` cascades on Subject delete                                                                                                                                                          | `schema.ts:17-20`                                                            | Holds                                                        |
| Cron dispatcher and the persisted agent are the scheduling entry points                                                                                                                                                                 | `cron.ts`, `set_cron_jobs.yaml:9-16`                                         | Holds; the `0 0 * * *` agent is not seeded by the repository |
| `#169` concerns `rbac-module-subjects-check`, an order-processing job                                                                                                                                                                   | `check.ts:32` calls `ecommerceOrderProceed`                                  | Holds                                                        |
| The deployer API template does not forward the anonymous lifetime                                                                                                                                                                       | `api.env.j2:22-44`                                                           | Holds                                                        |
| `apps/api/.env:63` sets the anonymous lifetime to 43,200 s                                                                                                                                                                              | the worktree `.env` has no such line; `create_env.sh:83-90` does not emit it | Not reproducible from the repository; environment-specific   |
| Access JWT lifetime 3,600 s                                                                                                                                                                                                             | `rbac.ts:10-13`                                                              | Holds as the default                                         |

Observations the issue does not state: refresh reissues the refresh token with the one-day general lifetime (`refresh.ts:68-79`); init embeds the full Subject row in both tokens (`init.ts:51`, `:62`) while refresh embeds `{ id }` (`refresh.ts:61-63`, `:74-76`); the two relation loads in the cleanup handler run before the empty-candidate return (`delete-anonymous.ts:49-57`).

## Code References

Browser and SDK client:

- `apps/host/app/layout.tsx:42` - root layout mounts `authentication-init-default`.
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/init-default/ClientComponent.tsx:73` - component-local `lastAuthActionRef` guard.
- `.../init-default/ClientComponent.tsx:108-175` - refresh-or-init decision effect.
- `.../init-default/ClientComponent.tsx:198-208` - 401 refresh error clears tokens.
- `.../init-default/ClientComponent.spec.tsx:84-179` - four BDD scenarios.
- `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/authentication/init.ts:23-49` - `useQuery` init action persisting tokens.
- `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/authentication/refresh.ts:27-57` - `useMutation` refresh action.
- `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/authentication/persist-authentication-tokens.ts:21-56` - cookie and localStorage persistence and clearing.
- `libs/shared/frontend/client/hooks/src/lib/use-local-storage/index.ts:8-50` - hydration sentinel and event listeners.

Backend authentication:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:140-143` - `GET /authentication/init` binding; `:155-158` refresh binding; `:250-253` `DELETE /:uuid`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/init.ts:37-44` - Subject creation per call; `:46-65` token signing; `:73-79` cookie.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/refresh.ts:43-60` - refresh controller.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/refresh.ts:35-79` - refresh service; `:68-72` general refresh lifetime.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/me.ts:34-45` - JWT-only `me`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts:9` - 30 s memory cache.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/authentication/email-and-password.ts:71-142` - registration creates a new Subject.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/authentication/ethereum-virtual-machine.ts:93-122` - EVM first-login Subject.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/authentication/oauth/callback.ts:163-201` - OAuth target Subject resolution.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts:864-897` - Telegram Subject creation.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/deanonymize.ts:32-108` - identity attachment to an existing Subject.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/checkout.ts:78` and `.../product/id/checkout.ts:81-83` - deanonymize callers.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/create.ts:289-291` and `.../product/id/checkout.ts:160-162` - order ownership links.
- `libs/shared/utils/src/lib/envs/rbac.ts:10-19` - lifetime defaults.

Cleanup and scheduling:

- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/index.ts:40-44` - `/cron`; `:125-129` - `/rbac-module-subjects-delete-anonymous`; `:130-134` - `/rbac-module-subjects-check`.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/rbac-module/subject/delete-anonymous.ts:32-47` - `createdAt` selection; `:49-53` full relation loads; `:59-87` in-memory filter; `:89-105` sequential delete with swallowed errors.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/rbac-module/subject/check.ts:24-39` - order job requiring the anonymous lifetime variable.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/delete-anonymous-subjects.ts:29-75` - 30-day service; `.../service/singlepage/index.ts:303-308` - wrapper without callers.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/cron.ts:87-148` - per-agent decision; `:161-243` - execution and markers.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/bootstrap.ts:196-215` - in-process RBAC read services for the agent module.
- `libs/modules/agent/models/agent/backend/repository/database/src/lib/fields/singlepage.ts:14-19` - agent `slug` and `interval`.
- `libs/modules/agent/models/agent/backend/repository/database/src/lib/data/` - three seeded agents, all `* * * * *`.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/broadcast-module/message/delete-expied.ts:24-50` - expired Broadcast message agent.
- `libs/modules/broadcast/models/message/backend/repository/database/src/lib/fields/singlepage.ts:9-12` - one-hour default marker expiry.
- `libs/modules/broadcast/models/channel/backend/app/api/src/lib/controller/singlepage/push-message/index.ts:58-67` - marker creation.
- `libs/shared/utils/src/lib/envs/artificial-intelligence.ts:1-2` - `AGENT_MAX_DURATION_IN_SECONDS` default 5,400.
- `tools/deployer/api/set_cron_jobs.yaml:9-16` - every-minute cron trigger.
- `tools/deployer/api/api.env.j2:22-44` - forwarded RBAC variables.
- `apps/api/create_env.sh:83-90` - generated RBAC secrets; `apps/api/.gitignore:6` - `.env` ignored.
- `apps/api/project.json:147-155` - `db:seed` target.

Schema, cascades, and caching:

- `libs/modules/rbac/models/subject/backend/repository/database/src/lib/fields/singlepage.ts:4-14` - Subject columns.
- `libs/modules/rbac/models/subject/backend/repository/database/src/lib/migrations/0004_sparkling_lilandra.sql:4` - only the `slug` unique constraint.
- `libs/modules/rbac/relations/subjects-to-ecommerce-module-orders/backend/repository/database/src/lib/schema.ts:17-20` - cascade on Subject delete (and the nine other relations listed in section 8).
- `libs/modules/rbac/relations/subjects-to-identities/backend/repository/database/src/lib/constraints/singlepage.ts:10-14` - unique `identityId`.
- `libs/modules/rbac/relations/subjects-to-roles/backend/repository/database/src/lib/constraints/singlepage.ts:11-15` - unique `(subjectId, roleId)`.
- `libs/modules/rbac/relations/subjects-to-social-module-profiles/backend/repository/database/src/lib/constraints/singlepage.ts:11-15` - unique `(subjectId, socialModuleProfileId)`.
- `libs/shared/backend/api/src/lib/repository/database/index.ts:86-93` - `find` with optional limit and offset; `:291-292` - `updatedAt` set on update.
- `libs/shared/backend/api/src/lib/service/crud/actions/delete/index.ts:14-18` - CRUD delete.
- `libs/middlewares/src/lib/revalidation/index.ts:98-121` - websocket broadcast and host revalidation per mutation.
- `libs/middlewares/src/lib/http-cache/index.ts:217-240` - cache version bump per mutation.
- `apps/api/app.ts:146-180` - middleware order and agent app mount.

Action recording:

- `libs/middlewares/src/lib/actions-logger/index.ts:54-153` - logging conditions and action creation.
- `libs/middlewares/src/lib/actions-logger/routes/singlepage.ts:8-24` - default logged routes; `routes/startup.ts:21` - empty project layer.
- `libs/modules/rbac/models/action/backend/repository/database/src/lib/fields/singlepage.ts:9-13` - six-hour default `expiresAt`.
- `libs/modules/rbac/relations/subjects-to-actions/backend/repository/database/src/lib/schema.ts:17-24` - cascades on both sides.

Batching pattern:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:52` - batch limit; `:215-219` - bounded candidate query; `:232-236` - relation lookup by selected ids; `:129` - process-local guard.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.spec.ts` - BDD coverage.

## Architecture Documentation

- Layering: RBAC subject controllers compose middlewares and handlers; handlers delegate to `Service` methods that wrap per-feature service classes (`service/singlepage/index.ts:265-316`). The agent module reads RBAC data through in-process `CRUDService` instances (`agent bootstrap.ts:196-215`) and mutates through the server SDK over HTTP with `X-RBAC-SECRET-KEY` (`delete-anonymous.ts:92-99`).
- Token contract: HS256 through `hono/jwt`; the access JWT lives in cookie `rbac.subject.jwt` (readable by JavaScript) and the refresh token in localStorage `rbac.subject.refresh`; the `authorization` helper reads the bearer token. ISSUE-199 research documents the signing sites (`thoughts/shared/research/singlepagestartup/ISSUE-199.md`, section 6).
- Repository conventions: Drizzle schemas under `backend/repository/database/src/lib/{schema,fields,constraints}` with `singlepage` to `startup` inheritance; migrations generated by `repository-generate` targets; seeds as JSON under `data/`.
- Scheduling: system cron to `POST /api/agent/agents/cron`, then a per-agent HTTP call to `/api/agent/agents/<slug>`; execution state lives in Broadcast messages on channel `cron`.
- Concurrency mechanisms present today: natural-key unique indexes on RBAC relations (`subjects-to-identities`, `subjects-to-roles`, `subjects-to-social-module-profiles`, `roles-to-permissions`), a natural-key repair utility (`libs/modules/rbac/backend/repository/database/src/lib/natural-key-repair.ts`), and process-local guards (`proceed.ts:129`). The advisory-lock helper introduced by #211 (`0d5af32d28`, 2026-07-20) was removed by `e0273194c8` (2026-07-22, "enforce natural keys without runtime locks"); `libs/shared/backend/database/config/src/lib/` now contains `migrate`, `postgres.ts`, and `transform-many-to-many-relations` only.
- Cache and revalidation: every successful mutation triggers a websocket broadcast and host tag revalidation (`revalidation/index.ts:98-121`) and, when enabled, HTTP cache version bumps (`http-cache/index.ts:217-240`), in the order documented at `apps/api/app.ts:146-154`.
- Extension seams: action-logging routes through constructor options and `routes/startup.ts` (`actions-logger/routes/startup.ts:3-19`); `startup` layers for fields and constraints.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-169.md` records the bounded batch pattern and the production parameter-volume incident on the subject check job.
- `thoughts/shared/research/singlepagestartup/ISSUE-213.md` catalogues read-then-write races, including cron double execution. Its advisory-lock references (`advisory-lock.ts:30-54`, `bootstrap.ts:1726-1734`, `checkout-free-subscription.ts:131-145`) are stale after `e0273194c8`; a verification note dated 2026-09-18 at the top of its Summary now says so and points to `libs/modules/rbac/README.md:107-113` for the constraint-only baseline.
- `thoughts/shared/research/singlepagestartup/ISSUE-211.md`, `thoughts/shared/plans/singlepagestartup/ISSUE-211.md`, and `thoughts/shared/handoffs/singlepagestartup/ISSUE-211-progress.md` record natural keys and duplicate repair; the plan section "Reusable PostgreSQL advisory lock boundary" describes the helper that was later removed.
- `thoughts/shared/research/singlepagestartup/ISSUE-199.md`, section 6, covers JWT and secret handling.
- No prior thoughts artifact covers `delete-anonymous`, anonymous retention, or `authentication/init` directly; a grep over `thoughts/` for `delete-anonymous`, `RBAC_ANONYMOUS`, and `authentication/init` matched only `thoughts/shared/plans/singlepagestartup/ISSUE-146.md` (a path listing without anonymous-retention content).

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-169.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-213.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-211.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-199.md`
- `thoughts/shared/plans/singlepagestartup/ISSUE-211.md`

## Open Questions

- Which database record defines the production `rbac-module-subjects-delete-anonymous` agent (`0 0 * * *`), and does the production database also hold a `broadcast-module-messages-delete-expired` agent? The repository seeds neither, and database access was out of scope for this research.
- How many API replicas serve `POST /api/agent/agents/cron` in production? The dispatcher's marker read is not atomic (ISSUE-213), and the follow-up comment reports two simultaneous midnight runs.
- Does production enable `MIDDLEWARE_HTTP_CACHE`? It determines whether per-Subject deletions also bump cache versions, which matters for #233.
- The issue's `apps/api/.env:63` override could not be reproduced; whether it exists only in the author's environment or in a child repository is unknown.
- Child projects may register additional relations to the Subject table or additional action-logging routes through the `startup` layers; none exist in this repository, so their cascade and activity semantics are unknown here.
- Whether any child project calls `Service.deleteAnonymousSubjects`; no caller exists in this repository.
