---
date: 2026-05-04T01:06:33+03:00
researcher: flakecode
git_commit: d665c77702603f683b3b23fd2b33c571733a2c0d
branch: debug
repository: singlepagestartup
topic: "[log-watch] [LW-6a66ca6ff01e] api_api Call to 'sendMessage' failed! (403: Forbidden: bot was blocked by the user)"
tags: [research, codebase, notification, telegram, rbac, ecommerce]
status: complete
last_updated: 2026-05-04
last_updated_by: flakecode
---

# Research: Telegram `sendMessage` 403 for blocked bot recipient

**Date**: 2026-05-04T01:06:33+03:00
**Researcher**: flakecode
**Git Commit**: d665c77702603f683b3b23fd2b33c571733a2c0d
**Branch**: debug
**Repository**: singlepagestartup

## Research Question

Investigate the production log-watch error where Telegram `sendMessage` failed with `403: Forbidden: bot was blocked by the user`, using the restored local `doctorgpt-production` database. Also identify the current RBAC roles and subscription orders for the logged recipient subject, and determine the non-final cancellation status that lets the agent RBAC subject check perform the final cleanup.

## Summary

The logged failure is produced by the Telegram notification path. `POST /api/rbac/subjects/:uuid/notify` creates notification rows and immediately calls `notificationNotificationApi.send`; the notification send service renders the linked Telegram template and calls grammY `bot.api.sendMessage`. The direct RBAC notify path does not swallow provider errors, so a blocked-bot `sendMessage` exception propagates back through `POST /api/notification/notifications/:uuid/send` and then through `POST /api/rbac/subjects/:uuid/notify` as an HTTP 403.

The restored API database is `doctorgpt-production` from `apps/api/.env`, not the default `sps-lite` database in the same Postgres container. In `doctorgpt-production`, the logged subject `2bd15ae9-8d22-4c70-a878-a4ca1b152fdf` exists and has one Telegram identity, five subject-role relation rows, and three linked subscription orders for product `594d8cc6-a8ca-4136-9960-455603f44e2c` (`free-subscription`). The exact logged notification `bd0c54d5-b858-4932-8db7-4dcaa6eee8e3` is no longer present in the restored database.

For the requested data correction, the status that is non-final but ready for RBAC subject cleanup is `canceling`. The agent RBAC subject check/proceed path scans `canceling` and transitions it to final `canceled` after removing matching product roles and zeroing subject billing-module currency balances. `requested_cancelation` is one step earlier and is handled by the ecommerce order-check agent before RBAC proceed; `canceled` is already final.

## Detailed Findings

### Logged API Paths

- `apps/api/app.ts:172` mounts the module apps under `/api/agent`, `/api/rbac`, and `/api/notification`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:220` binds `POST /api/rbac/subjects/:uuid/notify` to the RBAC notify handler.
- `libs/modules/notification/models/notification/backend/app/api/src/lib/controller/singlepage/send/index.ts:13` is the HTTP entry point for `POST /api/notification/notifications/:uuid/send`.
- The issue log contains both direct notification send failures for notification `bd0c54d5-b858-4932-8db7-4dcaa6eee8e3` and RBAC notify failures for subject `2bd15ae9-8d22-4c70-a878-a4ca1b152fdf` in `thoughts/shared/tickets/singlepagestartup/ISSUE-185.md:112` and `thoughts/shared/tickets/singlepagestartup/ISSUE-185.md:157`.

### RBAC Notify Flow

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/notify.ts:42` resolves subject-to-identity relations for the route subject.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/notify.ts:80` resolves the notification topic from `data.notification.topic.slug`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/notify.ts:118` infers transport type from the template variant containing `email` or `telegram`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/notify.ts:151` uses a Telegram identity account as the receiver unless the payload identifies a group chat.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/notify.ts:180` creates the notification row.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/notify.ts:196` links the notification to its template.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/notify.ts:208` links the notification to its topic.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/notify.ts:220` immediately calls `notificationNotificationApi.send`. There is no inner catch around this send call in the direct notify path.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/notify.ts:244` catches any error from the overall handler and rethrows it through `getHttpErrorType`.

### Notification Send Flow

- `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:929` implements `send({ id })`.
- `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:938` returns `null` for a missing notification, and `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:942` deletes and returns `null` for expired notifications.
- `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:947` returns a non-`new` notification unchanged, and `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:951` returns a future `sendAfter` notification unchanged.
- `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:961` finds notification-template relation rows; `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:981` throws if no template relation exists.
- `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:1010` infers the template transport and calls the provider for the first recognized email or Telegram template.
- `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:686` enters the Telegram provider branch, renders the template at `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:692`, and creates a grammY `Bot` at `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:705`.
- The relevant Telegram `sendMessage` calls are at `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:796`, `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:803`, and `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:865`.
- `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:892` updates the notification to `status: "sent"` only after provider delivery succeeds.
- `libs/modules/notification/models/notification/backend/app/api/src/lib/controller/singlepage/send/index.ts:34` converts provider errors to an HTTP exception using `getHttpErrorType`.

### Blocked Bot Error Propagation

- The Telegram provider does not catch blocked-recipient errors around the `sendMessage` calls, so grammY's `403: Forbidden: bot was blocked by the user` exception leaves `provider()`.
- `libs/shared/backend/utils/src/lib/http-error/paterns/index.ts:20` maps messages containing `forbidden` to HTTP 403.
- The global exception filter logs 403 responses but does not send bug-service Telegram alerts for 401/403/404 at `libs/shared/backend/api/src/lib/filters/exception/index.ts:61`.
- `libs/modules/notification/models/topic/backend/app/api/src/lib/controller/singlepage/send-all/index.ts:50` differs from direct notify: topic `send-all` catches and ignores individual notification send errors at `libs/modules/notification/models/topic/backend/app/api/src/lib/controller/singlepage/send-all/index.ts:60`.
- Social chat message creation also wraps notify failures as background/log-only work, while direct `POST /rbac/subjects/:uuid/notify` returns the 403 to the caller.

### Current Restored Database State

The API env points to `DATABASE_NAME=doctorgpt-production` in `apps/api/.env:20`. Read-only SQL against that database found:

- Subject `2bd15ae9-8d22-4c70-a878-a4ca1b152fdf` exists.
- The subject has one Telegram identity (`provider = telegram`, account masked as `553***566`).
- The subject has five subject-role relation rows:
  - `db869ba2-6158-4af6-8e8c-d360d15b92fd` -> `Free Subscriber` (`free-subscriber`)
  - `33faeb5b-e721-43ce-9e54-d5e9e7dbecd3` -> `Required Telegram Channel Subscriber` (`required-telegram-channel-subscriber`)
  - `a6b789aa-4c1e-49e6-9d89-4b816e0ea982` -> `Required Telegram Channel Subscriber` (`required-telegram-channel-subscriber`)
  - `43e846bd-b47e-4200-a7ba-724e374cc626` -> `User` (`user`)
  - `a0cf9e63-65da-44ca-96e4-4ca8a2d2fd00` -> `User` (`user`)
- The subject has three linked subscription orders for product `594d8cc6-a8ca-4136-9960-455603f44e2c` (`free-subscription`, title `Free Tier`):
  - `bd8fa452-ed0e-4f87-8d4e-52bb4643d8a8` - `delivering`, `history`, updated `2026-05-02 23:00:07.213`
  - `1a4142be-b042-4933-ace5-9958910c7a00` - `canceled`, `cart`, updated `2026-05-01 17:30:11.403`
  - `9a761fec-0d32-4d1c-920d-040dcaca7657` - `completed`, `history`, updated `2026-05-02 23:00:06.572`
- Product `594d8cc6-a8ca-4136-9960-455603f44e2c` is a subscription with interval `day`, price `0`, and topup amount `10`.
- The product grants one role through `roles-to-ecommerce-module-products`: `Free Subscriber` (`d434af4b-8266-4dce-bece-63adc0e2a64f`).
- The exact logged notification `bd0c54d5-b858-4932-8db7-4dcaa6eee8e3` is not present in `sps_nn_notification` in the restored database. No current notifications were found for the logged subject's Telegram identity account.

### Order Status Semantics

- The canonical order status list contains `requested_cancelation`, `canceling`, `canceled`, and `completed` at `libs/modules/ecommerce/models/order/sdk/model/src/lib/index.ts:19`.
- The ecommerce order-check agent scans `paying`, `delivering`, and `requested_cancelation` at `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/check.ts:10`.
- For `requested_cancelation`, ecommerce order-check waits for the subscription interval deadline and then updates the order to `canceling` at `libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/find-by-id/check/index.ts:320` and `libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/find-by-id/check/index.ts:386`.
- The RBAC subject check endpoint calls `service.ecommerceOrderProceed({})` at `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/check.ts:20`; the scoped variant passes a subject id at `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/findById/check.ts:26`.
- RBAC ecommerce order proceed scans `paid`, `delivering`, `delivered`, and `canceling`, not `requested_cancelation`, at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:52`.
- In the `canceling` branch, RBAC proceed removes product-granted roles, zeroes subject billing-module currency balances, and updates the order to final `canceled` at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:347`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:380`, and `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:415`.
- In the `delivered` branch, RBAC proceed removes roles, updates the order to `completed`, and may create a fresh checkout for a qualifying one-off `telegram-star` subscription renewal at `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:856` and `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:990`.
- Therefore, for the user's requested manual cleanup flow, `canceling` is the non-final status that lets the next RBAC subject check perform the final cancellation. `canceled` is already final, and `requested_cancelation` requires the separate ecommerce order-check step first.

## Code References

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/notify.ts:220` - direct RBAC notify immediately sends the created notification.
- `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:865` - normal Telegram `sendMessage` dispatch through grammY.
- `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts:892` - notification status is updated to `sent` only after provider success.
- `libs/modules/notification/models/topic/backend/app/api/src/lib/controller/singlepage/send-all/index.ts:50` - topic send-all catches individual notification send failures.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/ecommerce-module/order/check.ts:10` - ecommerce order-check agent status subset.
- `libs/modules/ecommerce/models/order/backend/app/api/src/lib/controller/singlepage/find-by-id/check/index.ts:386` - `requested_cancelation` becomes `canceling`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:347` - `canceling` branch removes product roles and finalizes cancellation.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/ecommerce/order/proceed.ts:415` - `canceling` branch updates order status to `canceled`.

## Architecture Documentation

- Backend routes are mounted from module apps through `apps/api/app.ts`, with module controllers composing route definitions and service calls.
- Notification templates drive transport selection through the template `variant`; RBAC notify and notification send both infer `email`/`telegram` from the variant string.
- Notification delivery is row-oriented: RBAC notify creates a notification, a notification-template relation, a topic-notification relation, then calls the notification send SDK.
- Ecommerce cancellation has two agent stages:
  1. Ecommerce order check: `requested_cancelation` -> `canceling`.
  2. RBAC subject check/proceed: `canceling` -> `canceled` with role/balance cleanup.

## Historical Context

- `thoughts/shared/research/singlepagestartup/ISSUE-174.md` documents notification send behavior around missing/expired notifications and the same `/notification/notifications/:id/send` controller.
- `thoughts/shared/plans/singlepagestartup/ISSUE-174.md` records a plan to make notification send return `null` for missing/expired rows and have RBAC notify only retain non-null sent notifications.
- `thoughts/shared/research/singlepagestartup/ISSUE-173.md` documents active subscription detection and notes that `requested_cancelation`, `canceling`, `completed`, and `canceled` are skipped as inactive during checkout.
- `thoughts/shared/research/singlepagestartup/ISSUE-169.md` documents the bounded RBAC ecommerce order proceed scan and the restored DB counts for order statuses.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-169.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-173.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-174.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-183.md`

## Open Questions

- The exact logged notification row is absent from the restored `doctorgpt-production` database, so the research identifies the runtime path and current recipient subject state but cannot inspect that original notification row's final persisted status.
- No mutating data correction was run during research. The data facts above identify the subject-role relation rows and the active subscription order that a later implementation/data-management step would target.
