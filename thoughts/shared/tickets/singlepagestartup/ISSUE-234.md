# Issue #234: Bound anonymous Subject growth with safe retention and session initialization

## Metadata

- URL: https://github.com/singlepagestartup/singlepagestartup/issues/234
- Status: Research Needed
- Created: 2026-09-10T20:19:46Z
- Labels: size:medium
- Priority: high (stated in the issue body)
- Type: feature / lifecycle correction (stated in the issue body)
- Size: medium (stated in the issue body)
- Repository: singlepagestartup/singlepagestartup

## Problem to Solve

SPS creates a durable RBAC Subject when a new browser session first initializes authentication, even for a visitor who only reads public pages. This count therefore includes anonymous sessions, bots capable of running the client/calling initialization, and repeat visitors with expired/lost credentials; it is not a registered-user count.

**Confirmed product constraint (operator clarification, 2026-09-11): create/reuse a Subject and issue JWT on the first site visit, including public-page browsing. This is intentional: visitor actions are recorded and need the JWT/Subject identity. Preserve this behavior. Lazy creation and public browsing without a Subject/JWT are out of scope.**

The operator's requirement is to clean up an anonymous Subject if the visitor has not created an account/added registration email and has not created an order. Provide a clear inactivity grace period, preserve returning active sessions, and protect other framework identities/owned records. This is also an input to the production cache amplification reported in [#233](https://github.com/singlepagestartup/singlepagestartup/issues/233).

**Priority:** high. **Type:** feature / lifecycle correction. **Size:** medium for a safe shared retention policy and duplicate-initialization audit. The retention duration is a proposal, not an approved production setting or deletion plan.

## Key Details

### Production evidence (didigallery, 2026-09-10 around 20:13 UTC)

Read-only aggregate database queries returned:

| Metric                                                         |                    Count |
| -------------------------------------------------------------- | -----------------------: |
| Total Subjects                                                 |                   12,603 |
| Subjects linked to an Identity                                 |                        3 |
| Subjects linked to any ecommerce order                         |                        4 |
| Subjects with neither Identity nor order                       |                   12,598 |
| Subject variants                                               | 12,596 default; 7 hidden |
| No-Identity/no-order Subjects older than 28 days, all variants |                      230 |

For **default-variant Subjects without Identity or order**, counts by creation age were: older than 1 day **11,939**; 7 days **9,700**; 28 days **223**; 30 days **129**. These are diagnostic counts, **not safe-to-delete counts**: activity, roles, profiles and other durable ownership were not excluded.

Daily creations on Sep 3–9 were 486, 378, 339, 344, 356, 394, 443; Sep 10 had reached 559 in an earlier sample. Several hundred new sessions/day retained for 28 days are compatible with a five-digit Subject population. Most accumulation is within the existing retention window; these numbers do not prove cleanup is completely broken or traffic is malicious.

Production has no explicit anonymous refresh-lifetime override, so the framework default **2,419,200 seconds / 28 days** applies. The cleanup agent exists in DB with interval **0 0 \* \* \***. Retained post-restart logs do not establish whether its previous overnight run completed; investigate execution history/backlog rather than assuming it never runs.

### Configuration ownership: framework versus child

**Operational update, 2026-09-11 Moscow time (2026-09-10 21:15 UTC):** At the operator's explicit request, set `RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS=604800` (7 days) in the child's ignored `tools/deployer/.env` and production `api_api` service environment through Portainer. The replacement container and generated API dotenv both contain 604800; a real initialization request returned 201 and issued a refresh token with `exp - iat = 604800`. Access JWT lifetime remains 3600 seconds; site smoke checks pass. The 28-day production observation below is the **pre-change** state. This operational override uses the existing creation-age cleanup behavior; inactivity-based cleanup remains unimplemented. Already issued tokens keep their embedded expiration. The local development API's 12-hour override remains unchanged. Deployer variable forwarding is still needed so a future full Ansible deployment does not reset the Portainer override.

- The shared default and scheduled cleanup implementation belong to **singlepagestartup**. Implement the safe inactivity policy there, expose a dedicated configurable retention setting, then adopt the framework change in child projects.
- **Seven days of inactivity is only a proposed starting value. It has not been implemented, enabled in didigallery, or selected by the operator.** Current cleanup compares `createdAt`, not last activity.
- Rechecked local checkout: `apps/api/.env:63` explicitly sets `RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS=43200` (**12 hours**). This is a local refresh-token override, also used by the current scheduled cleanup's age cutoff; it is not a seven-day inactivity policy.
- Rechecked the running production API container and `/usr/src/app/apps/api/.env`: neither overrides this variable; the deployed image remains `0.0.224`. Production therefore uses the shared **28-day** default. The deployer API template does not forward this variable, so the local 12-hour setting is not evidence of the production setting.
- Avoid merely setting the existing refresh-token variable to seven days: that would also change session lifetime and would leave creation-age cleanup, missing ownership guards and deletion races intact.

### Current behavior and framework ownership

Verified against deployed child source `67a960f34465d73496efcd7ae9fee37122479b41` and upstream main `99e3037f085283f666d96654750cff5ecb5ac620`; the following load-bearing implementations are identical:

- [Browser initialization](https://github.com/singlepagestartup/singlepagestartup/blob/99e3037f085283f666d96654750cff5ecb5ac620/libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/init-default/ClientComponent.tsx): reuses a valid JWT, attempts refresh when possible, otherwise calls init. It is not supposed to create a Subject on every navigation with valid credentials. The action guard is component-local; audit simultaneous tabs/mounts, storage failures, refetch/retry, token expiry and OAuth callback behavior.
- [GET authentication/init](https://github.com/singlepagestartup/singlepagestartup/blob/99e3037f085283f666d96654750cff5ecb5ac620/libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/init.ts#L37): creates a new Subject on each handler execution, then signs JWT/refresh tokens; no server-side reuse/idempotency is visible in this handler.
- [RBAC lifetime defaults](https://github.com/singlepagestartup/singlepagestartup/blob/99e3037f085283f666d96654750cff5ecb5ac620/libs/shared/utils/src/lib/envs/rbac.ts#L14): anonymous refresh lifetime 28 days.
- [Scheduled delete-anonymous handler](https://github.com/singlepagestartup/singlepagestartup/blob/99e3037f085283f666d96654750cff5ecb5ac620/libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/rbac-module/subject/delete-anonymous.ts): selects by **createdAt**, with retention coupled to the refresh-token lifetime; loads all identity/profile relations, filters in memory, then deletes one Subject at a time through SDK. It protects Identity and social-profile links, **does not check order links, roles or variants**, and silently swallows each deletion error. No batch bound/cursor is visible in the handler.
- [Second deleteAnonymousSubjects service](https://github.com/singlepagestartup/singlepagestartup/blob/99e3037f085283f666d96654750cff5ecb5ac620/libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/delete-anonymous-subjects.ts): hardcoded 30 days, per-subject Identity lookup, no order/profile guard. Targeted reference search found only its wrapper in service/index.ts, no active caller. Consolidate or retire the duplicate after verifying runtime consumers.
- [Subject-order relation](https://github.com/singlepagestartup/singlepagestartup/blob/99e3037f085283f666d96654750cff5ecb5ac620/libs/modules/rbac/relations/subjects-to-ecommerce-module-orders/backend/repository/database/src/lib/schema.ts#L17): deleting a Subject cascades the ownership relation. This is not proof the order row itself is deleted, but it can remove the customer's link to their order.
- [Cron dispatcher](https://github.com/singlepagestartup/singlepagestartup/blob/99e3037f085283f666d96654750cff5ecb5ac620/libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/cron.ts) and the persisted cleanup agent provide the scheduling entry points.

## Implementation Notes

### Required lifecycle contract

1. Define anonymous eligibility explicitly. No Identity/account and no order is the operator's baseline, but **no email alone is insufficient**: protect registered OAuth, Telegram, wallet/EVM and other supported identities. A guest order must protect its Subject even without registration. Initially retain any order link, including unpaid/canceled, until product policy explicitly distinguishes carts/drafts from actual orders.
2. Protect hidden/system/agent/service actors, seeded Subjects, privileged-role holders, and durable data owners (billing balances/payments, social profiles/chats, subscriptions, etc.). Define extension hooks so child projects can declare their own retention blockers.
3. Base expiry on meaningful **last activity**, not merely creation age or generic updatedAt. Reuse the existing action-recording flow where suitable; background jobs and cleanup itself must not renew activity. Avoid rewriting/invalidation of the whole Subject collection on every recorded action: aggregate or throttle activity persistence. Decouple retention settings from token lifetimes, but keep valid sessions safe: activity renews eligibility, and garbage collection must not delete a still-active guest.
4. Preserve Subject ID and ownership on promotion/registration, guest checkout, login/merge where supported, and token refresh. Make initialization idempotent for the same session; audit retries, multiple tabs and client concurrency without using IP as identity.
5. Do eligibility checks and deletion with a concurrency strategy that also coordinates registration/checkout writers. A registration or order created during cleanup must prevent deletion; an unguarded pre-check followed by DELETE is insufficient.
6. Define retention of visitor action/audit records explicitly. Every anonymous visitor may have recorded actions by design; the mere existence of an action must not automatically make all anonymous Subjects immortal. Specify which records must retain attribution, which can be anonymized/archived and what must survive Subject cleanup; do not rely on unreviewed cascades.
7. Subject/JWT must be available for action recording from the first visit, before registration or checkout. Revisit/refresh reuses the existing session where valid; first-visit creation remains mandatory.

### Proposed direction: preserve first-visit Subject/JWT; bound retention

Implement one safe, configurable inactivity policy for anonymous Subjects without a registered identity or order, with the retention blockers above. Evaluate **7 days of inactivity** as a starting proposal and **24 hours** as an optional stricter project policy; neither value is approved or deployed. Choose the default during normal research/plan review using the action-recording and session requirements.

Run bounded cleanup batches, reuse the same valid Subject/JWT across revisits and refreshes, and prevent accidental duplicate initialization from retries or simultaneous tabs. Creation for a genuinely new first-visit session remains intentional. Optimize database queries and cache behavior around that requirement.

Measure new Subjects/day, anonymous-active/expired counts, promotion rate, retained-by-reason counts, cleanup throughput/backlog, and cache bytes. Do not equate unique Subject IDs with unique people. Aggregate initialization metrics by route/outcome and validated traffic signals; rate-limit abuse while retaining legitimate shared-network users. Bot/race contributions remain hypotheses until measured.

### Implementation and rollout constraints

- One canonical eligibility/cleanup service, used by jobs and maintenance flows; remove inconsistent 28/30-day implementations.
- Query eligible candidates in the database with bounded indexed pagination/anti-joins (`NOT EXISTS`), rather than loading every Subject and relation or producing enormous ID parameter arrays. Start experimentally with batches of 100–500 and a per-run time cap; avoid overlapping workers.
- Dry-run mode reports candidates and retention reasons. Then roll out a small canary batch, monitor results and scale. Produce explicit scanned/deleted/skipped/failed counts; surface per-record errors with sanitized identifiers and retry state.
- Use normal module deletion, cache invalidation and websocket contracts. Deletion itself generates mutation churn: avoid hundreds of per-item full-collection cache generations; coordinate with the cache issue.
- Do not edit repository data snapshots to implement cleanup. Any new activity fields/indexes require the appropriate Drizzle repository-generate target.
- No production records were deleted during this investigation. The aggregates above are not authorization to bulk-delete them.

## Acceptance Criteria

- First-visit public browsing creates/reuses a Subject and obtains JWT so visitor actions can be recorded immediately; registration/cart/checkout are not prerequisites.
- A guest can revisit and refresh without creating extra Subjects for the same valid session; test concurrent init/retry behavior and explicit credential expiry.
- An inactive anonymous Subject without Identity/order or other defined retention blockers becomes eligible after the configured grace period and is removed in bounded batches; ordinary recorded visitor actions follow the explicit action-retention policy.
- Active guests, all supported registered identities, guest orders of all retained statuses, system/agent/privileged Subjects and protected owners survive cleanup.
- Registration or order creation racing cleanup cannot lose the account, order ownership or session.
- Cron execution failures are visible, retries are safe, and backlog drains without a memory/cache spike.
- Synthetic 10k–100k Subject datasets demonstrate bounded query/worker memory and stable cache cardinality; meaningful BDD tests cover retention semantics and races.
- Document the separate retention/session settings, activity accounting and action-log retention, measured memory/throughput, migration/canary procedure and child-project extension points. Prove first-visit action recording remains intact.

## References

Related: #169 documents a past unbounded parameter-volume issue on `rbac-module-subjects-check`, which is an **order-processing job**, not this anonymous cleanup job; reuse its batching lesson without conflating the endpoints. #213 covers shared concurrency/idempotency.

Files linked from the issue body (upstream commit `99e3037f085283f666d96654750cff5ecb5ac620`):

- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/init-default/ClientComponent.tsx`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/authentication/init.ts`
- `libs/shared/utils/src/lib/envs/rbac.ts`
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/rbac-module/subject/delete-anonymous.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/delete-anonymous-subjects.ts`
- `libs/modules/rbac/relations/subjects-to-ecommerce-module-orders/backend/repository/database/src/lib/schema.ts`
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/cron.ts`

Related issues: #233 (production cache amplification), #169 (parameter volume on `rbac-module-subjects-check`), #213 (shared concurrency/idempotency).

## Comments

### flakecode — 2026-09-11T00:46:24Z

Production follow-up after the operator-authorized 7-day lifetime override (2026-09-11):

- **Automatic cleanup ran and substantially reduced the population.** API log markers show a run from Sep 10 22:01:01.966 to 22:03:15.397 UTC (Sep 11 **01:01–01:03 Moscow**), another at 23:06 UTC, and **two simultaneous runs** at Sep 11 00:00:03–00:00:04 UTC.
- The latest persisted cron results both report `data.ok=true`. API uses UTC; the configured cleanup interval remains `0 0 * * *`. Off-schedule reruns and duplicate midnight runs warrant checking cron-history expiry and dispatcher concurrency; no scheduler root cause is established yet.
- At Sep 11 **00:43:53 UTC**, Subject count was **3,031**, versus **12,603** in the earlier pre-change sample: **9,572 fewer (~76% net reduction)**. New sessions were created between samples, so this is not an exact deleted-row count.
- There are **117** Subjects older than 7 days without Identity/order: **108** have a social-profile link, which the current job intentionally preserves; **9** meet the existing job's age/no-Identity/no-profile predicate. The cause of their remaining is unconfirmed; the handler swallows individual deletion errors, so `ok=true` does not establish complete cleanup.
- Identity-linked Subject count remains **3**. Order-linked Subject count changed **4 → 3**. Current orders: 1 `approving`, 3 `canceling`, 7 `new`; **6 old `new` orders have no Subject relation** (created Aug 6–20). No earlier orphan-order baseline was collected, so these six cannot all be attributed to this run. Record this as an ownership-retention investigation, not proof of six newly lost links. No older Subject with an order currently matches the job's deletion predicate.
- The production API still has `RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS=604800`; its container has not restarted since the authorized update. This follow-up was read-only and did not manually invoke cleanup or change data.
