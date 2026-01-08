# Broadcast Module

## 1. Purpose of the Module

The Broadcast module delivers channel-based messages for realtime or queued updates. It defines broadcast channels, message payloads, and the relations that connect them for delivery and ordering.

### It solves the following tasks:

- Defines channels that group broadcast messages.
- Stores message payloads with optional expiration.
- Relates channels to messages with ordering metadata.
- Supports subscription-style UI variants for realtime feeds.

### Typical use cases:

- Live update streams (notifications, status changes).
- Broadcasting events to multiple subscribers.
- Admin workflows for managing channels and messages.

---

## 2. Models

| Model                                 | Purpose                                |
| ------------------------------------- | -------------------------------------- |
| [channel](./models/channel/README.md) | Broadcast stream definition            |
| [message](./models/message/README.md) | Message payloads delivered on channels |

---

## 3. Relations

| Relation                                                           | Purpose                   |
| ------------------------------------------------------------------ | ------------------------- |
| [channels-to-messages](./relations/channels-to-messages/README.md) | Link channels to messages |

---
