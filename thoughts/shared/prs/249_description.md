## Summary

PR #212 stopped concurrent Telegram bootstrap from creating duplicate RBAC grants, but it left the losing request failing. When two updates bootstrap the same account at once, both find no identity, both insert, and PostgreSQL rejects one of them. Nothing recovered that rejection, so the 500 reached the Telegram transport, which does not classify a unique violation as transient. The user was answered with "We couldn't process your message. Please try sending it again. Reference: …" while the winning update completed normally. This is the failure reported as still happening in production.

Issue #211 expected the existing create/catch/re-read flow to absorb the lost insert, but only the profile-scoped Knowledge grants carry it (`ensureEntity`). The telegram identity and the topic thread did not, so the failure surfaced as `sps_rc_identity_telegram_account_unique` on a first registration and as `sl_thread_slug_unique` on a new topic for an account that already had a subject.

Every bootstrap step is find-or-create, so the losing request now replays the whole operation and observes the row the winner just inserted. One wrapper covers the twenty create sites in this service, including any added later, and keeps the database the single arbiter rather than reintroducing the advisory locks removed in `e0273194c8`.

## Changes

- `libs/shared/backend/utils/src/lib/unique-constraint-error/`: new shared `isUniqueConstraintError`. It recognizes SQLSTATE `23505` and the message the API response pipe serializes into an `HTTPException`, including nested `cause` arrays, and stops walking a self-referencing error chain. The OAuth callback already carried a private copy of this predicate.
- `.../service/singlepage/telegram/bootstrap.ts`: `execute` becomes a conflict-replay wrapper around the former body, now `executeOnce`. `TELEGRAM_BOOTSTRAP_CONFLICT_RETRY_DELAYS_MS = [25, 75, 200]` bounds the replays, and `getConflictRetryDelays` exists so the budget can be overridden without touching the wrapper. A non-conflict failure is rethrown on the first attempt, unchanged.
- `.../service/singlepage/telegram/bootstrap.ts`: `createSubjectForIdentity` replaces the two identical subject-then-link blocks. Replaying exposed a second window — a request that lost the `subjects-to-identities` insert had already created its subject and left it for the scheduled anonymous-subject sweep — so the subject is now dropped before the conflict propagates.
- Tests: eight BDD scenarios for the replay wrapper and the subject-ownership race, six for the shared predicate.
- `libs/modules/rbac/README.md`: the concurrency section described the previous behavior, where the losing request could simply not complete.

## Verification

- [x] `@sps/rbac` Jest — 302 tests across 69 suites pass.
- [x] `@sps/telegram` Jest — 6 tests pass.
- [x] `@sps/social` Jest — 37 tests pass.
- [x] `@sps/backend-utils` Jest — the new predicate suite passes.
- [x] ESLint and `tsc:build` for `@sps/rbac` and `@sps/backend-utils`.
- [x] Live reproduction before the fix: two `/start` updates delivered together on a database with no identity, subject, chat, thread or message for the account returned one 200 and one 500, and the Telegram user received the generic failure reply. The error id in the chat matched the API exception for `sps_rc_identity_telegram_account_unique`.
- [x] Live after the fix, same precondition: five concurrent `forum_topic_created` + `/start` pairs and five concurrent `/start` pairs each answered 200 twice, leaving one topic thread, exactly fourteen new permissions, zero duplicate natural keys and no orphaned subject. The API logged `telegram/bootstrap: lost a concurrent natural key insert; replaying` on each run.

## Notes

- The replay is safe only because bootstrap is find-or-create throughout. A create that precedes a claim on a unique index must clean up after itself, which is what `createSubjectForIdentity` does.
- `isTransientTelegramApiError` in `apps/telegram` is deliberately unchanged. The API resolves the conflict internally, so the transport never sees it and does not need to know about SQLSTATE `23505`.
- The private `isUniqueConstraintError` in `.../authentication/oauth/callback.ts` was left in place to keep this diff focused; it can move to the shared helper separately.
- Six tests in `libs/shared/backend/utils/src/lib/http-error/index.spec.ts` fail on `main` and still fail here. They are unrelated to this change and were confirmed pre-existing by stashing these files.
- Telegram Web cannot drive this scenario: its "New Thread" card throws `TypeError: Reduce of empty array with no initial value` and never sends, and a single START only delivers one `/start` with no `message_thread_id`. The live runs delivered update payloads to the local webhook the way Telegram does.

## Downstream migration

Adaptation is required where a project owns this service. `execute` is now split into a conflict-replay wrapper and `executeOnce`, so a child override that replaced `execute` keeps running but silently loses the replay; move such an override onto `executeOnce`, and override `getConflictRetryDelays` instead when only the replay budget needs to change. Keep every bootstrap step find-or-create so a replay stays safe. Replace a private duplicate-key predicate with `isUniqueConstraintError` from `@sps/backend-utils`, and make any create that precedes a claim on a unique index clean up after itself the way `createSubjectForIdentity` does. Verify by sending two concurrent bootstrap requests for an account with no identity, subject, chat, thread or message, then confirming both answer 200 and the database holds one identity link, one topic thread, no duplicate natural keys and no orphaned subject.
