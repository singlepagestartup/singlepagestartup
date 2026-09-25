## Summary

Verifying #249 on the production server showed the first replay budget had no headroom left. A live concurrent `forum_topic_created` + `/start` pair against `api_api` on `0.0.303` made one request lose four natural keys in sequence — `rbac/identities`, `rbac/subjects-to-identities`, `social/profiles`, `social/profiles-to-chats` — because a replay restarts at the first find-or-create and meets the next contended insert.

Three delays gave exactly three replays. The request succeeded on its last allowed attempt; a fifth collision would have returned the 500 the replay exists to prevent. The run was a pass, but with zero margin.

## Changes

- `.../service/singlepage/telegram/bootstrap.ts`: `TELEGRAM_BOOTSTRAP_CONFLICT_RETRY_DELAYS_MS` grows from `[25, 75, 200]` to `[25, 50, 100, 200, 400, 800]`. The growth matters as much as the count — a fixed short delay retries a lock-stepped pair straight back into the same collision, while an increasing wait lets the winning request finish its remaining inserts. Worst case adds about 1.6s of sleep before the conflict is rethrown, against bootstrap's own multi-request latency.
- `.../telegram/bootstrap.spec.ts`: two scenarios pin the default so a later change cannot quietly shrink it below what a live race already produced, or flatten the backoff into equal delays.
- `libs/modules/rbac/README.md`: records why the delays grow, since the reason is not visible from the constant.

## Verification

- [x] `@sps/rbac` Jest — 304 tests across 69 suites pass.
- [x] `@sps/telegram` Jest — 6 tests pass.
- [x] ESLint for `@sps/rbac`.
- [x] Production evidence that motivated this: on `0.0.303`, two concurrent bootstrap requests for one account both answered 200 with the same `rbacModuleSubject.id`, `/api/rbac/subjects/telegram/bootstrap` never returned 500, and the API logged the replay at `attempt: 2` and `attempt: 3`. Four inner endpoints logged the rejected duplicate inserts. The database kept one identity, one chat, one topic thread, exactly fourteen new permissions, zero duplicate natural keys and no orphaned subject.

## Notes

- Only the default list changes. A project that overrides `getConflictRetryDelays` keeps its own budget, and the replay contract, its trigger and its observable outcome are untouched.
- Jitter was considered and left out. The delays already grow, which is what breaks a lock-stepped pair; jitter would add nondeterminism to the tests for no evidence-backed gain.
- Six was chosen as headroom over the four consecutive conflicts actually observed, not from a model of the worst case. If a future race exhausts six, the answer is probably to reduce contention in bootstrap rather than to keep extending the list.

## Downstream migration

No child adaptation is needed. The replay contract, its trigger and its observable outcome are unchanged; only the default delay list grows, and a child that overrides `getConflictRetryDelays` keeps its own budget. No child-owned code, document, schema or configuration is affected.
