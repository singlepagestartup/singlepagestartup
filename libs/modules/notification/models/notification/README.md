# Notification Notification Model

## Purpose

Notifications store delivery metadata for messages sent to users.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `status`: notification status (default: `new`).
- `method`: delivery method (default: `email`).
- `title`: notification title.
- `data`: payload data.
- `reciever`: receiver address or identifier.
- `attachments`: attachment references.
- `sendAfter`: scheduled send time.
- `sourceSystemId`: external source id.

## Variants

- `default`: placeholder notification view.
- `find`: data-fetch wrapper for querying notifications.
- `admin-form`: admin create/edit form for notification fields.
- `admin-select-input`: admin select input for choosing a notification.
- `admin-table`: admin table listing notifications.
- `admin-table-row`: admin row showing notification fields.

## Delivery, retries and provider limits

All Notification Telegram sends use the shared Telegram transport. It also covers
message edits/deletes, Telegram service replies and best-effort server error
alerts. Email delivery, including verification codes, uses the shared SES transport.
Redis admission is atomic and shared across API/Telegram replicas. Every instance
using the same bot or SES account must use the same KV store. A store outage
prevents uncounted external sends.

Telegram defaults are 25 messages/second per bot, a 1100 ms interval per private
chat and 3100 ms per group/channel. Album items each consume a message slot.
These defaults leave room below Telegram's documented approximate 30 messages/sec,
one message/sec/chat and 20 messages/minute/group. Edits/deletes share the budget
conservatively. `retry_after` pauses the bot across instances. Paid broadcasts
are disabled. Polling, command registration and payment/callback acknowledgements
keep their separate protocol deadlines. See the [Telegram FAQ](https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this)
and [ResponseParameters](https://core.telegram.org/bots/api#responseparameters).

SES reads `MaxSendRate`, `Max24HourSend` and `SentLast24Hours` through
`GetSendQuota`, cached for 60 seconds in Redis. Sends share a regional budget
across from-addresses and credentials in this deployment; use one AWS account
per KV namespace. A snapshot allowance prevents concurrent sends from spending
the same reported remaining quota. SES remains authoritative when another
application sends from that account or quota statistics lag. SES throttling
pauses delivery; the AWS SDK does not create an additional retry loop.
The IAM identity needs `ses:GetSendQuota` as well as its existing send permission.
See [SES quotas](https://docs.aws.amazon.com/ses/latest/dg/manage-sending-quotas.html)
and [GetSendQuota](https://docs.aws.amazon.com/ses/latest/APIReference/API_GetSendQuota.html).

### Stored notifications

`send` claims a private Broadcast job keyed by Notification ID. At most ten jobs
run concurrently across instances. Confirmed Telegram parts and the SES receipt
are checkpointed in PostgreSQL. A retry skips confirmed parts. A content hash
prevents continuing a partial send with different content; create a new
notification for a changed message. No message text or recipient credentials
are copied to the checkpoints.

Rate deferrals keep `status=new` and advance `sendAfter`; they do not consume the
three-failure budget. Other failures back off for one, two and three minutes;
the third failure sets `status=error`. Blocked Telegram recipients are terminal.
Work yields after about 25 seconds between provider calls. Each provider call
also has a timeout. There is no detached in-memory retry queue.

The existing Agent action `notification-module-topics-send-all` dispatches up to
100 due ordinary notifications, including notifications without a Topic relation,
and bounds each batch's processing time. Configure its cron Interval (for example,
`* * * * *`) for automatic recovery. Without that action, calling `send` explicitly
can resume a due notification. Dispatch also removes expired notifications and
up to 100 inactive delivery jobs older than the Notification expiration period
(default two days). No new cron route or database model is required.

Topic’s `sendBounded` retains the security summary's stable recipient ID, channel fallback
and three-attempt budget under its existing Broadcast lease. It uses the same
provider rate limits. The security scheduler still coalesces old summary periods.
Verification emails and immediate Telegram edits/replies have bounded waits and
return an error when deferred; they do not create stale background actions.
Server error alerts remain best-effort and keep their existing bounded backoff.

A provider may accept a message immediately before the process loses its response
or database connection. Telegram/SES cannot atomically commit with PostgreSQL, so
that ambiguous case can still duplicate a message on retry. Checkpoints prevent
repeating confirmed parts; they do not guarantee exactly-once external delivery.

### Environment

| Variable                                    | Default | Meaning                                                                                        |
| ------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------- |
| `NOTIFICATION_TELEGRAM_MESSAGES_PER_SECOND` | `25`    | Per-bot pacing, greater than zero and at most 30.                                              |
| `NOTIFICATION_TELEGRAM_CHAT_INTERVAL_MS`    | `1100`  | Private chat spacing, at least 1000 ms.                                                        |
| `NOTIFICATION_TELEGRAM_GROUP_INTERVAL_MS`   | `3100`  | Group/channel spacing, at least 3000 ms.                                                       |
| `NOTIFICATION_SES_MESSAGES_PER_SECOND`      | `0`     | Zero uses the SES account rate; a positive value can only lower it.                            |
| `NOTIFICATION_DELIVERY_WAIT_MS`             | `5000`  | Maximum local rate wait per operation, 0–30000 ms. Longer waits defer persisted notifications. |

Set Telegram limits consistently in both API and Telegram services. The deployer
and preview/production workflows pass these variables through explicitly.
