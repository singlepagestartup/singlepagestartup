# Notification Module

## 1. Purpose of the Module

The Notification module manages notification delivery data, templates, and topics. It defines the models required to schedule, group, and render notifications.

### It solves the following tasks:

- Stores notification metadata and delivery status.
- Defines templates for reusable notification content.
- Groups notifications by topics.
- Provides widgets for notification UI blocks.

### Typical use cases:

- Email or in-app notification delivery.
- Template-driven notification rendering.
- Topic-based notification subscriptions.

---

## 2. Models

| Model                                           | Purpose                          |
| ----------------------------------------------- | -------------------------------- |
| [notification](./models/notification/README.md) | Notification delivery records    |
| [template](./models/template/README.md)         | Notification templates           |
| [topic](./models/topic/README.md)               | Topic grouping for notifications |
| [widget](./models/widget/README.md)             | Notification UI widgets          |

---

## 3. Relations

| Relation                                                                       | Purpose                         |
| ------------------------------------------------------------------------------ | ------------------------------- |
| [notifications-to-templates](./relations/notifications-to-templates/README.md) | Link notifications to templates |
| [topics-to-notifications](./relations/topics-to-notifications/README.md)       | Link topics to notifications    |

---
