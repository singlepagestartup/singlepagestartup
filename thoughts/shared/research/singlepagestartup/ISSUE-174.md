---
date: 2026-05-03T23:05:06+03:00
researcher: flakecode
git_commit: 0e30ea072ddc631c2a4822b94967a0dfb6ba7ff0
branch: debug
repository: singlepagestartup
topic: "[log-watch] [LW-4b793fca2648] api_api Not Found error. Not Found"
tags: [research, codebase, notification, template, telegram, doctorgpt-production]
status: complete
last_updated: 2026-05-03
last_updated_by: flakecode
---

# Research: Issue #174 - Notification Not Found log-watch error

**Date**: 2026-05-03T23:05:06+03:00
**Researcher**: flakecode
**Git Commit**: 0e30ea072ddc631c2a4822b94967a0dfb6ba7ff0
**Branch**: debug
**Repository**: singlepagestartup

## Research Question

Issue #174 is a copied production log-watch report for repeated `404` responses with message `Not Found error. Not Found` on notification endpoints:

- `POST /api/notification/templates/abc47443-2f59-4c91-b99e-888bbba209f6/render`
- `POST /api/notification/notifications/eeb924c7-4162-47da-9076-3435d14d7ceb/send`
- `POST /api/notification/notifications/9c1b6e7f-0c12-4982-bd10-34c8af21370a/send`

The local workspace is configured against the restored production-like database `doctorgpt-production`, so research includes read-only database observations from that database and local API calls against the running service.

## Summary

The notification `send` route exists at `POST /api/notification/notifications/:uuid/send` and delegates to `Service.send`. In the current production-like database, both notification UUIDs from the production logs are absent, while the notification table has 6 current rows. Local API calls with the RBAC header reproduce a `404` on both logged notification IDs through the same send controller stack location, with the current code's message `Not Found error. Notification not found`.

The template UUID from the production logs exists in `doctorgpt-production`. It is `generate-telegram-ecommerce-order-status-changed-admin`, title `Статус заказа изменился`, and is currently linked to two different `new` notification rows for topic `information`. Those two current notifications were not sent during research because `send` can call the live Telegram provider.

The template `render` route exists at `POST /api/notification/templates/:uuid/render`. It finds the template, parses multipart `data`, infers `email` or `telegram` from the template variant, and fetches the host generator. The host telegram generator directly dereferences `props.data.ecommerce.order` for the admin order-status template. A local render call with `data={}` returned `200` from the API with `data` containing the host generator error text `Cannot read properties of undefined (reading 'order')`; the template API layer does not inspect the host response status before returning text.

Notification rows are short-lived in the current service: every notification `send` request starts `deleteExpired()`, which deletes notifications older than `NOTIFICATION_MODULE_NOTIFICATION_EXPIRATION_TIMEOUT`; the default is 2 days. Since the production log was detected on 2026-05-01 and local inspection happened on 2026-05-03, the absence of those exact notification IDs in the restored/current database is consistent with the current retention behavior.

## Detailed Findings

### API Routing

- The root API mounts the notification module under `/api/notification` in `apps/api/app.ts:125`.
- Template routes bind `POST /:uuid/render` to the render handler in `libs/modules/notification/models/template/backend/app/api/src/lib/controller/singlepage/index.ts:55`.
- Notification routes bind `POST /:uuid/send` to the send handler in `libs/modules/notification/models/notification/backend/app/api/src/lib/controller/singlepage/index.ts:57`.
- Both handlers catch thrown errors, normalize them through `getHttpErrorType`, and rethrow `HTTPException`; this is why production stacks point at the handler catch line rather than the exact service line (`libs/modules/notification/models/template/backend/app/api/src/lib/controller/singlepage/render/index.ts:70`, `libs/modules/notification/models/notification/backend/app/api/src/lib/controller/singlepage/send/index.ts:38`).

### Notification Send Flow

- The send handler reads `uuid`, calls `this.service.send({ id: uuid })`, starts `deleteExpired()` in a detached async block, and returns the service result as JSON (`libs/modules/notification/models/notification/backend/app/api/src/lib/controller/singlepage/send/index.ts:15`).
- `Service.send` requires `RBAC_SECRET_KEY`, looks up the notification by id, and throws `Not Found error. Notification not found` when no row is found (`libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:908`).
- If a notification exists and has status other than `new`, `send` returns it without provider delivery; if `sendAfter` is in the future, it also returns the notification (`libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:921`, `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:931`).
- For `new` notifications due for sending, `send` looks up `notifications-to-templates`, loads templates, infers template type from `variant`, and calls `provider` for email or telegram (`libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:935`, `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:984`).
- The telegram provider calls `templateApi.render`, parses the returned text as JSON, sends through Grammy when `TELEGRAM_SERVICE_BOT_TOKEN` and `reciever` are present, then updates the notification to status `sent` (`libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:691`, `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:892`).
- `deleteExpired()` selects notifications with `createdAt` older than `Date.now() - NOTIFICATION_MODULE_NOTIFICATION_EXPIRATION_TIMEOUT` and deletes them (`libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:1018`).
- The default expiration timeout is `2 * 24 * 60 * 60 * 1000` when the env variable is absent (`libs/shared/utils/src/lib/envs/notification.ts:1`).

### Template Render Flow

- The render handler reads `uuid`, parses multipart body, looks up the template, validates `body["data"]` only when present, then calls `JSON.parse(body["data"])` (`libs/modules/notification/models/template/backend/app/api/src/lib/controller/singlepage/render/index.ts:15`).
- The handler infers render type from `entity.variant.includes("email")` or `entity.variant.includes("telegram")` (`libs/modules/notification/models/template/backend/app/api/src/lib/controller/singlepage/render/index.ts:41`).
- `Service.render` loads the template again, deflates the payload into a base64 `data` query param, and fetches either `/api/email-generator/index.html` or `/api/telegram-generator` on `NEXT_PUBLIC_HOST_SERVICE_URL` (`libs/modules/notification/models/template/backend/app/api/src/lib/service/singlepage/index.ts:23`, `libs/modules/notification/models/template/backend/app/api/src/lib/service/singlepage/index.ts:51`).
- The render service returns `res.text()` and does not branch on `res.ok` or HTTP status from the host generator (`libs/modules/notification/models/template/backend/app/api/src/lib/service/singlepage/index.ts:52`, `libs/modules/notification/models/template/backend/app/api/src/lib/service/singlepage/index.ts:65`).
- The host telegram generator inflates the `data` query param, calls `response({ variant, data, language })`, and returns JSON text; its catch block returns JSON `{ error: error.message }` with HTTP status `404` (`apps/host/app/api/telegram-generator/route.tsx:17`, `apps/host/app/api/telegram-generator/route.tsx:43`).
- The admin order-status telegram generator directly reads `props.data.ecommerce.order.id` and `props.data.ecommerce.order.status` (`apps/host/app/api/telegram-generator/response/singlepage/generate-telegram-ecommerce-order-status-changed-admin/index.tsx:5`).

### Notification Creation Callers

- `rbac/subject/notify` creates notification rows, creates `notifications-to-templates`, creates `topics-to-notifications`, then immediately calls `notificationNotificationApi.send` for each created notification (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/notify.ts:180`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/notify.ts:196`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/notify.ts:220`).
- `crm/form/request/create` follows the same create-relation-send sequence for admin email notifications (`libs/modules/crm/models/form/backend/app/api/src/lib/controller/singlepage/request/create.ts:132`, `libs/modules/crm/models/form/backend/app/api/src/lib/controller/singlepage/request/create.ts:148`, `libs/modules/crm/models/form/backend/app/api/src/lib/controller/singlepage/request/create.ts:172`).
- `notification/topic/send-all` loops all topics, resolves `topics-to-notifications`, loads each notification by id, skips missing or non-new notifications, and calls `notificationApi.send`; errors from that SDK call are swallowed inside `.catch(() => {})` (`libs/modules/notification/models/topic/backend/app/api/src/lib/controller/singlepage/send-all/index.ts:21`, `libs/modules/notification/models/topic/backend/app/api/src/lib/controller/singlepage/send-all/index.ts:46`, `libs/modules/notification/models/topic/backend/app/api/src/lib/controller/singlepage/send-all/index.ts:50`).
- `agent/notification-module/topics/send-all` calls the topic `sendAll` SDK endpoint and suppresses caught errors (`libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/notification-module/topics/send-all.ts:23`).

### Restored Database Observations

- `apps/api/.env` points the running API at `DATABASE_NAME=doctorgpt-production` on local Postgres port `5433`. A direct SQL check confirmed `current_database = doctorgpt-production`.
- In `doctorgpt-production`, `sps_nn_notification` has 6 rows. The logged notification IDs `eeb924c7-4162-47da-9076-3435d14d7ceb` and `9c1b6e7f-0c12-4982-bd10-34c8af21370a` have 0 matching rows.
- In `doctorgpt-production`, `sps_nn_template` has 6 rows. The logged template ID `abc47443-2f59-4c91-b99e-888bbba209f6` exists with variant `generate-telegram-ecommerce-order-status-changed-admin`, title `Статус заказа изменился`, and slug `exciting-blush-sole`.
- `sps_nn_ns_to_ts_g3c` links template `abc47443-2f59-4c91-b99e-888bbba209f6` to current notification IDs `1f24ad56-e812-4020-8581-f125739a3b96` and `f923f32e-88f1-436e-93cb-5b5581518a99`.
- Both current linked notifications are `status = new`, `variant = default`, `reciever = -5248911149`, and are linked to topic `information` through `sps_nn_ts_to_ns_v8d`.
- The current linked notifications contain `data.ecommerce.order` payloads with order IDs `4c8b54d1-9956-4284-88fb-0c970fe7ecff` and `d0a021a2-dbb5-4082-af4f-b50f9ff6a21c`.
- No mutating `send` call was executed for current linked notifications because the local env has `TELEGRAM_SERVICE_BOT_TOKEN` set and the send path can call the live Telegram provider.

### Local Reproduction Notes

- `POST /api/notification/notifications/eeb924c7-4162-47da-9076-3435d14d7ceb/send` with the local RBAC header returned `404` from the running API. Response path matched the logged endpoint; current response message was `Not Found error. Notification not found`.
- `POST /api/notification/notifications/9c1b6e7f-0c12-4982-bd10-34c8af21370a/send` with the local RBAC header returned the same `404` and current message.
- `POST /api/notification/templates/abc47443-2f59-4c91-b99e-888bbba209f6/render` without `data` returned `500` in the current local API because `JSON.parse(body["data"])` parses `undefined`.
- The same render request with multipart `data={}` returned `200` from the current local API, with `data` containing host generator error text from missing `data.ecommerce.order`.

## Code References

- `apps/api/app.ts:125` - Notification module mounted at `/api/notification`.
- `libs/modules/notification/models/notification/backend/app/api/src/lib/controller/singlepage/index.ts:57` - `POST /:uuid/send` route binding.
- `libs/modules/notification/models/notification/backend/app/api/src/lib/controller/singlepage/send/index.ts:21` - Send handler calls `Service.send`.
- `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:913` - `Service.send` loads notification by id.
- `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:917` - Missing notification produces the current not-found branch.
- `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:935` - Send loads notification-template relations.
- `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:984` - Send infers provider type from template variant.
- `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:1018` - Expired notification cleanup query.
- `libs/modules/notification/models/template/backend/app/api/src/lib/controller/singlepage/index.ts:55` - `POST /:uuid/render` route binding.
- `libs/modules/notification/models/template/backend/app/api/src/lib/controller/singlepage/render/index.ts:39` - Render handler parses `body["data"]`.
- `libs/modules/notification/models/template/backend/app/api/src/lib/service/singlepage/index.ts:51` - Render service fetches host email generator.
- `libs/modules/notification/models/template/backend/app/api/src/lib/service/singlepage/index.ts:65` - Render service fetches host telegram generator.
- `apps/host/app/api/telegram-generator/route.tsx:43` - Host telegram generator maps caught render errors to HTTP 404 JSON.
- `apps/host/app/api/telegram-generator/response/singlepage/generate-telegram-ecommerce-order-status-changed-admin/index.tsx:5` - Admin telegram template response reads `data.ecommerce.order`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/notify.ts:220` - RBAC notify immediately sends created notifications.
- `libs/modules/notification/models/topic/backend/app/api/src/lib/controller/singlepage/send-all/index.ts:50` - Topic send-all calls notification send for new topic notifications.

## Architecture Documentation

The notification module is documented as the module that stores notification metadata, reusable templates, topics, and widget UI blocks (`libs/modules/notification/README.md`). The notification model stores delivery metadata such as `status`, `data`, `reciever`, `attachments`, `sendAfter`, and `sourceSystemId` (`libs/modules/notification/models/notification/README.md`). The template model stores reusable layouts with variants such as email and telegram generators (`libs/modules/notification/models/template/README.md`). The `notifications-to-templates` relation links notification rows to template rows (`libs/modules/notification/relations/notifications-to-templates/README.md`).

The current implementation uses model/relation SDKs for cross-module API calls in the notification creation and delivery paths. Route handlers compose request parsing, service calls, and error normalization; provider delivery lives in the notification model service.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-173.md` confirms the same local setup pattern for copied production issues: Docker Postgres is exposed on `5433`, and `apps/api/.env` points at `doctorgpt-production`.
- `thoughts/shared/tickets/singlepagestartup/ISSUE-175.md`, `ISSUE-178.md`, and `ISSUE-185.md` contain sibling log-watch samples where notification `send` not-found stack traces appear adjacent to other Telegram/RBAC errors. These are tickets, not completed research artifacts.
- `thoughts/shared/processes/singlepagestartup/ISSUE-174.md` records that the create phase intentionally preserved the copied production context and local restored database reproduction context.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-173.md` - Restored `doctorgpt-production` database setup and local read-only DB research pattern for copied production issues.
- `thoughts/shared/research/singlepagestartup/ISSUE-169.md` - Restored `doctorgpt-production` database usage in another production log-watch investigation.

## Open Questions

- The current restored database no longer contains the exact notification UUIDs from the 2026-05-01 production logs. The code's 2-day expiration path is one current mechanism that removes old notification rows, but the research did not inspect historical production WAL/backups for those exact deletes.
- The production template render sample reported `Not Found error. Not Found`; the current local render behavior for the existing template is either a `500` for missing multipart `data` or a `200` wrapper around host generator error text for `data={}`. The exact production request body was not present in the log-watch ticket.
- Current linked notifications for the logged template remain `new` in the restored database. Sending them would exercise the live Telegram provider because the local env has a bot token, so this research did not execute that side-effecting path.
