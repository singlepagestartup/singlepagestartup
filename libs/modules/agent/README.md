# Agent Module

## 1. Purpose of the Module

The Agent module defines automation primitives used to schedule and execute
background tasks. It provides agent definitions (what to run, how often) and
widget entries that represent the UI surface for agent-driven features.

### It solves the following tasks:

- Defines scheduled automation units (`agent`).
- Stores configuration metadata for recurring tasks.
- Exposes widget entries for agent-driven UI features.
- Enables consistent admin CRUD for automation objects.

### Typical use cases:

- Creating cron-like jobs for content generation or maintenance.
- Scheduling periodic integrations or notifications.
- Exposing agent controls through widgets in UI.
- Handling domain-level bot commands after external adapters ingest messages.

### The problem it solves:

Provides a structured way to register automation jobs and related UI widgets
without custom orchestration per feature.

---

## 2. Models in the Module

| Model                               | Purpose                              |
| ----------------------------------- | ------------------------------------ |
| [agent](./models/agent/README.md)   | Scheduled automation units           |
| [widget](./models/widget/README.md) | UI widgets for agent-driven features |

---

## 3. Model Relations

No relations in this module.

---

## 4. Model Specifics

See the linked model READMEs above for full fields and variant details.

---

## 5. Telegram Bot Command Ownership

Telegram transport code in `apps/telegram` is an adapter. It may bootstrap a
Telegram user/profile/chat/thread and ingest incoming messages/actions, but it
must not contain business logic for managing SPS domain entities.

Telegram thread management lives in the agent service:

- `/threads`
- `/thread_new <title>`
- `/thread_rename <title>`
- `/thread_delete confirm`

The agent service executes these commands through the RBAC subject SDK using the
sender subject permissions, and replies through the existing Telegram bot reply
flow so responses stay in the same `social.thread`.

`social.thread` is the source of truth for Telegram topics. Native Telegram UI
rename/delete/close events are ignored for SPS data; command flows and SPS UI
flows are responsible for create/update/delete.
