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

All Telegram commands are declared by the Agent command registry. Each entry
has a Telegram menu description and targets either the `telegram-bot` profile or a
`social.profile.variant="artificial-intelligence"`; `/learn` targets the AI
profile and therefore reaches the shared RBAC/OpenRouter learning flow without
transport-specific rewriting. The startup Agent service merges protected
startup definitions after the SinglePage definitions, so a child project can
rename, replace, disable, or add commands without changing `apps/telegram` or
the SinglePage service. The Telegram app reads the effective catalog through
the Agent server SDK and publishes it with `setMyCommands` when the bot starts.

`social.thread` is the source of truth for Telegram topics. Native Telegram UI
rename/delete/close events are ignored for SPS data; command flows and SPS UI
flows are responsible for create/update/delete.

### Assistant management conversations

`/assistant` and its Profile, MCP, Avatar, Skills, and Knowledge tools are owned
by `agent.agent.service`. `/cancel`, `/exit`, and `/stop` terminate the active
conversation for the same sender and thread. While an editor is active, Agent
consumes its next text or image message before the normal AI reaction path, so
editor input is not also sent to OpenRouter.

The default store is process-local memory behind an Agent conversation-store
interface. Sessions are isolated by SPS chat id, resolved SPS thread id, and
sender profile id, expire after 30 minutes of inactivity, and are serialized per
key. A service restart deliberately removes only this transient UI state; the
underlying profile, skill, Knowledge, and avatar records remain persistent. Old
or expired buttons instruct the user to run `/assistant` again.

The runtime builds the complete presentation text and inline keyboard before it
creates the first Social message; it does not publish a loading placeholder.
Navigation edits that presentation through the canonical subject-scoped Social
message API. If an edit fails, Agent creates one already-complete replacement
and invalidates the old callback nonce/revision. This design is currently
single-process; a future shared store can implement the same interface without
changing conversation definitions or tools.

The Profile editor starts from the current Russian values, supports keeping or
clearing optional fields, and requires an explicit final save. Profile writes
merge the Russian values into the latest localized records so other locales are
not discarded. MCP toggles change only the selected supported descriptor and
preserve unknown identifiers that may have been stored by an older deployment.
The home page resolves the latest profile/File Storage relation using the same
ordering as the web sidebar, reports whether an avatar is set, and exposes the
current image through an inline link.
