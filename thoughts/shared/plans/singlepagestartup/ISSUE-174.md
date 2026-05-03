# Issue 174 Plan: Idempotent Notification Send and Render Error Handling

## Summary

Handle both known `Not Found error. Not Found` cases as non-repeatable notification delivery outcomes instead of production exceptions: stale/deleted notifications become idempotent no-ops, and template render failures from the host generator become controlled "not rendered" results that do not rethrow the same 404-style error.

## Key Changes

- Change notification `send` semantics to allow a skipped result:

  - Update `Service.send` to return `IModel | null`.
  - If `findById(id)` returns no notification, return `null` instead of throwing.
  - If the notification exists but is older than `NOTIFICATION_MODULE_NOTIFICATION_EXPIRATION_TIMEOUT`, delete it best-effort and return `null` without provider delivery.
  - Keep current behavior for non-`new` and future `sendAfter` notifications: return the existing notification without sending.

- Update `POST /api/notification/notifications/:uuid/send` response shape:

  - Return `200` with `{ data: null }` for missing or expired notifications.
  - Do not emit `HTTPException` for missing/expired notifications.
  - Keep actual configuration, provider, relation, and validation failures as errors.

- Update notification SDK and callers for nullable send:

  - Change server SDK `send` result type from `IModel` to `IModel | null`.
  - In `rbac/subject/notify`, only push non-null sent notifications into the response array.
  - Existing `topic/send-all` already skips missing notifications before calling send; keep that behavior.

- Handle template render host-generator failures:
  - In template `Service.render`, check the host generator `fetch` response before returning text.
  - If host generator returns non-OK, empty body, or JSON with an `error` field, return `null` instead of raw error text.
  - Update template render handler to return `200` with `{ data: null }` when render returns `null`, not `Not Found error. Not Found`.
  - Keep missing template ID as a real not-found error; only suppress generator/render-output failures.

## Tests

- Add focused BDD tests for notification send service/controller behavior:

  - Given a missing notification ID, when `/send` is called, then response is `200` with `data: null` and no provider is called.
  - Given an expired `new` notification, when `/send` is called, then it is deleted best-effort, returns `data: null`, and no provider is called.
  - Given a valid non-expired `new` notification, existing send/provider behavior is preserved.

- Add focused BDD tests for template render:
  - Given host generator returns non-OK JSON `{ error }`, when render is called, then API returns `200` with `data: null`.
  - Given host generator returns an empty body, when render is called, then API returns `200` with `data: null`.
  - Given template ID does not exist, missing template still returns a real not-found error.

## Verification Commands

- `npx nx run @sps/notification:jest:test`
- `npx nx run @sps/notification:jest:integration`
- `npx nx run @sps/notification:tsc:build`

## Assumptions

- `200 { data: null }` is the chosen compatibility-safe no-op response because existing SDKs expect JSON and `transformResponseItem`.
- No schema or migration changes are needed.
- We do not retry or resurrect notifications older than the configured retention window; if not sent within 2 days by default, it is intentionally skipped.
