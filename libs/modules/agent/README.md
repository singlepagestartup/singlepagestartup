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

Telegram transport code in `apps/telegram` is an adapter. There is no separate
Telegram business module under `libs/modules`. It may bootstrap a
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

## Paid CRM operations

A CRM stage lists the paid operations it may call. JEV classification,
tool selection and dialog compression run as separate work attempts. The
worker records each child result with the triggering task event. Only the final
reply writes to the chat. The reply model receives the triggering message’s
attachments directly. Legacy vision and transcription flags no longer schedule
a second model to read these files.

Store-owner-funded work uses the server's `OPEN_AI_API_KEY`. The worker records
the owner and assigned employee, selects a model supported by the operation,
and reserves funds before sending the request. The successful charge is based
on returned OpenAI usage and the saved rate card at 20 Token per USD. Settlement
posts one transfer from the owner to the employee. The wallet journal records
the provider request ID and the external USD cost calculated from usage.

For customer-funded stages, the platform reads the reference wallet top-up product from
`AI_WORK_TOKEN_TOPUP_PRODUCT_ID`. The default is the seeded 100 RUB pack
(`8aab55ed-f82d-49de-87b2-9625f5261f4c`). Its USD price and Token credit are
the two inputs to the exchange rate. Store employees set the stage multiplier and
spending limits. The customer approves the quoted terms before any paid work.
Each attempt records the pack ID, price, credit and multiplier. The charge in Token
equals provider USD × pack Token credit ÷ pack USD price × stage multiplier.
A zero multiplier allows the stage to run without reserving or transferring customer funds.

After a restart, the worker loads the attempt by event and step. An unknown
result keeps its reservation for reconciliation. Earlier Identity-backed
attempts and customer-funded agreements use their saved provider terms.

### Employee MCP tools

An employee can use the MCP servers enabled on its Social profile during
training and assigned CRM work. For each event, the worker reads the live tool
catalog under the employee’s identity and sends the available function schemas
to the text model. The model can request one tool per round, for up to two
rounds. A second call can use information returned by the first.

Each model round has its own budget reservation and usage receipt. A retry of
the same event reuses the recorded round. The final model receives the tool
results before it replies or chooses an allowed stage action. On an automatic
marketplace cover stage, the review model uses those results when deciding
whether to generate the image. The image worker handles generation, payment
and delivery.

### Marketplace cover

For a commissioned cover, publish an image stage with `imageBrief: "marketplace-cover"`. The preceding chat stages collect the buyer’s palette, font, product photo, composition, caption and dimensions. A style reference is optional. The agent summarizes the materials in the order’s Social thread and waits for the buyer to confirm that version of the brief. A corrected brief requires a new confirmation.

Set `imageBriefAutoGenerate: true` on the image stage to review the accumulated brief with paid JEV routing and generate a preview as soon as the buyer supplies the required materials. The pipeline carries the original customer message into the image stage. Missing fields prompt a question. A buyer’s explicit pause stops generation until they ask to continue. Once a preview exists, the pipeline requires a substantive change or a request for a new version before generating again.

When the image stage uses direct OpenAI and has no selected skills or authorized knowledge sources, the worker sends the order’s design conversation and the original product photo to the Images API. It includes the original style reference when the buyer supplies one. OpenAI renders the finished cover from those materials. The worker preserves the returned PNG byte for byte and creates a separate, scaled preview. An order without a specified size uses a 1024×1024 canvas. The worker requests a supported size within the metered image budget.

In the guided brief, the buyer can remove the caption panel by entering `Caption background: transparent` or `Подложка надписи: без плашки`. The caption keeps its approved color and font.

In the guided brief without a style reference, direct OpenAI can render an opaque product photo in a new scene. For transparent packshots and OpenRouter requests, the provider generates a background and the worker composites the photo onto it. The worker fits the cover to the requested dimensions and renders the caption in the supplied font.

The agent’s reply links the private preview to the order. The buyer can accept it in the same thread and download the original after payment.

### Maintain a store knowledge index

In a store-owner-funded consultation funnel, assign an employee to the maintenance
stage and select a knowledge source linked to that employee's profile.
Open a maintenance task with the store owner as both the customer and actor.
The funnel is excluded from customer intake.

An authenticated store owner queues work with
`POST /api/agent/work-attempts/<owner-id>/knowledge-index` and the JSON fields
`storeId` and `taskId`. The Agent cron reads the queue, uses the server's OpenAI
embedding model and pays the employee from the owner's reserved balance. The
same task queues one index run.
Open a new task when the source content, workflow, or model changes.

The worker publishes chunks only while the content hash and assignment match
the queued task. It tags every vector with the provider, model, and the
768-dimensional index version. Paid semantic search uses matching tagged
vectors for the sources RBAC grants to this task, including the employee’s
references and the speaker’s scoped preferences. The paid step uses the same
Knowledge search as a chat reply and records its embedding charge in the task
ledger. Empty source lists skip the model call.
