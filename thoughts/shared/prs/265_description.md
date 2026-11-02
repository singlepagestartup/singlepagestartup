## Summary

Anonymous RBAC subjects grew without a bound from both ends. Session initialization inserted a subject on every call, so a prefetch, a retry or a second tab created one even when the caller already held a session. Retention could not tell a returning visitor from an abandoned session, because no session path wrote to the row, and cleanup existed twice: an agent handler that selected by creation age, read the identity and social profile tables in full, filtered in memory and deleted one subject per HTTP request while swallowing every error, and an RBAC service with a hard-coded 30 days and no caller.

Initialization now reuses the subject behind a presented token and creates only when no usable token is presented, so the first visit still receives a subject and a JWT. Initialization and refresh touch `updatedAt` at most once per activity interval, so that column means last activity without a schema change. One retention implementation remains: it reads a single bounded batch ordered by last activity, keeps any subject that owns something, deletes the rest through the repository cascade, and returns counts. The daily schedule ships as a repository row.

Closes #234

## Changes

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/init.ts` (new) — the reuse-or-create decision. A token from the `rbac.subject.jwt` cookie or the `Authorization` header that this installation signed, and whose subject still exists, keeps that subject and receives a fresh token pair. A missing, malformed, expired or foreign token, or a token for a deleted subject, produces a new subject. Token verification is guarded, so an unusable token never reaches a log.
- `.../service/singlepage/record-activity.ts` (new) — touches `updatedAt` through the repository update path, at most once per `RBAC_ANONYMOUS_SUBJECT_ACTIVITY_INTERVAL_IN_SECONDS`, so a busy session does not write on every request. A failed touch is logged rather than thrown, because it must not fail the session.
- `.../service/singlepage/refresh.ts` — records activity for the subject it has already read; the constructor now takes a props object with the repository and the activity recorder.
- `.../service/singlepage/delete-anonymous-subjects.ts` — the only retention implementation. It reads one batch bounded by `RBAC_ANONYMOUS_SUBJECT_CLEANUP_BATCH_SIZE`, ordered by last activity and filtered to inactivity beyond `RBAC_ANONYMOUS_SUBJECT_RETENTION_IN_SECONDS` and to the `default` variant, resolves the blocking relations with `inArray` over that batch alone, deletes in process through the repository cascade, and returns scanned, deleted, failed, retained and retained-by-reason counts.
- `.../service/singlepage/index.ts` — `init`, `recordActivity` and the `anonymousSubjectRetentionBlockers()` seam, which lists identity, ecommerce order, social profile, role and billing currency balance. The subjects-to-billing-module-currencies relation service is injected for the last one.
- `.../controller/singlepage/authentication/init.ts` — thin: it resolves the presented token with the shared `authorization` helper, calls the service, and keeps the cookie, the `201` status and the response shape.
- `.../controller/singlepage/delete-anonymous.ts` (new) and its route `POST /api/rbac/subjects/delete-anonymous`, guarded by the standard authorization middleware like every other module route, plus the server SDK action `deleteAnonymous` and the OpenAPI path.
- `libs/modules/agent/.../controller/singlepage/rbac-module/subject/delete-anonymous.ts` — one server SDK call that returns the counts, replacing the in-memory filter and the per-row HTTP delete.
- `libs/modules/agent/models/agent/backend/repository/database/src/lib/data/d31f7b35-00c9-42c0-973d-3ca447a13394.json` (new, produced by `api:db:dump`) — the `rbac-module-subjects-delete-anonymous` agent at `0 0 * * *`.
- `libs/shared/utils/src/lib/envs/rbac.ts` — `RBAC_ANONYMOUS_SUBJECT_ACTIVITY_INTERVAL_IN_SECONDS` (3600), `RBAC_ANONYMOUS_SUBJECT_RETENTION_IN_SECONDS` (2592000) and `RBAC_ANONYMOUS_SUBJECT_CLEANUP_BATCH_SIZE` (500).
- Specs: `init.spec.ts`, `record-activity.spec.ts`, `delete-anonymous-subjects.spec.ts` and the agent `delete-anonymous.spec.ts`, 17 cases. The settings, the reuse rule and the blocker list are documented in `libs/modules/rbac/models/subject/README.md`; the seeded agents in `libs/modules/agent/models/agent/README.md`.

Framework layer only: no `startup` file, no schema change and no new dependency. Initialization keeps `GET` and `201` and still creates through the server SDK, so no client contract changes.

## Verification

- [x] `npx nx run @sps/rbac:jest:test` — 72 suites, 319 tests.
- [x] `npx nx run @sps/agent:jest:test` — 17 suites, 88 tests.
- [x] `npx nx run-many --target=eslint:lint --projects=@sps/rbac,@sps/agent,@sps/shared-utils`.
- [x] Session reuse and one cleanup run against a live database with a 5-second retention.

## How to verify it

Against a running API and its database:

1. Call session initialization twice with no token. The two responses carry different subject ids and the subject count rises by two.
2. Call it a third time presenting the JWT from the first call. The response carries the first subject id and no new row appears.
3. Set `RBAC_ANONYMOUS_SUBJECT_RETENTION_IN_SECONDS=5`, wait past it, and run the cleanup once against a fixture set holding a subject with an identity, a subject with an order and subjects that own nothing. Only the unowned stale subjects are deleted; the response counts report the rest as retained, by reason.

## Notes

- `subjects-to-billing-module-payment-intents` is deliberately not a blocker: no framework service writes that relation, it has no DI binding in the subject module, and the framework path that creates a payment intent also creates the order link. A project that writes it directly adds its own blocker.
- Only `variant = default` subjects are candidates, which keeps agent, hidden and project-defined actors out of the query entirely.
- Deletion runs in process through the repository cascade rather than one HTTP `DELETE` per row, which removes the per-row cache-version bump and WebSocket broadcast that made the old handler a contributor to #233.
- The retention default is 30 days and is independent of `RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS`, which now only sets the anonymous refresh token lifetime.
- `api:db:dump` has no per-model target: it rewrites every module snapshot from the local database. The run for the agent row also touched 29 tracked snapshots and produced 32 unrelated files, all restored and removed before the commit.
- The branch carries the plan, the process document and the implementation progress record under `thoughts/shared/`.

## Downstream migration

Adaptation is required in every project on this framework. The cleanup schedule arrives as seed data, retention moved from creation age to last activity with its own settings, and the retention blocker list is the new extension point for project-owned subject relations.

**Applies to:** every project on this framework, and in particular projects that overrode the anonymous cleanup, constructed the subject refresh service themselves, relied on the refresh-token lifetime as the cleanup age, or own subject relations that represent durable ownership.

**New environment variables:**

| Variable                                              | Default             | Meaning                                                       |
| ----------------------------------------------------- | ------------------- | ------------------------------------------------------------- |
| `RBAC_ANONYMOUS_SUBJECT_RETENTION_IN_SECONDS`         | `2592000` (30 days) | Inactivity after which an anonymous subject may be deleted    |
| `RBAC_ANONYMOUS_SUBJECT_ACTIVITY_INTERVAL_IN_SECONDS` | `3600` (1 hour)     | Shortest gap between two activity touches of the same subject |
| `RBAC_ANONYMOUS_SUBJECT_CLEANUP_BATCH_SIZE`           | `500`               | Candidates read in one cleanup run                            |

**Actions:**

- Run the repository seed so the `rbac-module-subjects-delete-anonymous` agent row exists; without it the cleanup never runs. A project that already created that row by hand keeps it, because the seed matches on the slug.
- Set the three variables above where the previous behaviour was tuned through `RBAC_ANONYMOUS_JWT_REFRESH_TOKEN_LIFETIME_IN_SECONDS`. That variable no longer influences cleanup.
- Add project-owned ownership relations to the retention guard by overriding `anonymousSubjectRetentionBlockers` in the startup subject service instead of editing the singlepage service. A project that writes subject-to-payment-intent rows directly needs this, because that relation is not guarded by default.
- Adapt any owned code that constructed the subject refresh service directly: it now takes a props object with the repository and an activity recorder, and the subject service constructor takes the subjects-to-billing-module-currencies relation service, which the container injects.

**Verify:** call session initialization twice without a token and once with the returned token — the first two answer with different subject ids, the third with the first id and no new row. Then call the cleanup agent route once and check the returned counts against a fixture set with an identity, an order and neither.
