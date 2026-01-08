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
