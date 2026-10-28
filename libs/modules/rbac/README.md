# RBAC Module

## 1. Purpose of the Module

The RBAC module defines authentication subjects, identities, roles, permissions, and their relations. It is responsible for user access control and authentication flows across the platform.

### It solves the following tasks:

- Stores identities and authentication credentials.
- Defines permissions and role assignments.
- Connects subjects to roles, identities, and actions.
- Exposes UI variants for authentication and authorization flows.
- Supports OAuth authentication/link flows (Google) with safe one-time exchange via action records.

### Typical use cases:

- User login and registration flows.
- Assigning roles and permissions.
- Guarding access to resources.
- Linking subjects to application-specific data.

### Authorization layering:

- `subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts` is only the global permission resolver.
- The resolver receives the startup-exported Permission,
  roles-to-permissions, and subjects-to-roles services through Subject DI. It
  uses filtered service `find` calls; it must not call the local HTTP API or
  issue handwritten SQL.
- A bracketed path segment such as `[knowledge.sources.id]` is a dynamic
  permission mask. A concrete UUID is literal and grants no access to another
  record id. Permissions without any role relation remain public.
- Add route access through `rbac.permissions`; keep resource ownership and module-specific checks in `backend/app/middlewares/src/lib/*` middleware for that module.
- Controllers should compose exported middleware instances, not define middleware bodies inline.
- Do not put social chat/thread/profile ownership logic, billing rules, or other domain rules into the global authorization service.

### Social AI reactions:

RBAC owns the authenticated subject endpoint that lets an AI `social.profile` react to a chat message through OpenRouter, profile-scoped Knowledge, and linked skills:

```text
POST /api/rbac/subjects/:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/messages/:socialModuleMessageId/react-by/openrouter
```

The endpoint validates subject/profile/chat/message access, requires the replying `social.profile` to have `variant="artificial-intelligence"`, requires that profile to be connected to the chat, and fails closed unless it has exactly one linked `rbac.subject`.

The web composer does not call this endpoint. It creates one message and persists the complete user-selected execution settings in `message.metadata.rbacAiReactionRequest`: contract version, model id, reasoning, skill ids, and Knowledge-search flag. The RBAC Subject SDK model owns the typed parser/normalizer; Social stores the envelope as opaque metadata. The action logger launches Agent once, Agent dispatches every automatic profile connected to the chat, and each OpenRouter execution reloads the same answer settings from the saved message. The replying profile is supplied by Agent from chat membership and is validated by the endpoint; it is not selected by message metadata. Internal query/body data cannot override persisted model, skill, or Knowledge settings. Messages without an envelope use safe automatic defaults.

If the message starts with `@knowledge /learn`, the endpoint strips the controls, calls `KnowledgeService.learnContent(...)` once for the message text and all of its Files (PDF, image, video, audio, or UTF-8 text), and creates the Social `profiles-to-knowledge-module-sources` relation for the replying AI profile if needed. AI Chat replies enable Knowledge search by default; other channels can request it with `useKnowledgeSearch` or `@knowledge`. Jev can also classify a request as reading or editing Knowledge. Retrieval stays scoped to the profile-Source relation, and the final AI answer is saved as a social message in the same thread. A separate Knowledge-only reaction endpoint is not exposed.

The persisted control syntax is channel-independent. The web composer inserts
`@knowledge /learn`, while the Telegram adapter maps private `/learn`, group
`/learn@<bot-username>`, and group `@<bot-username> /learn` messages to that
same text before creating the Social message. Telegram `@knowledge` queries are
handled by this endpoint as well; Telegram does not implement a separate
learning or retrieval pipeline.

The shared OpenRouter generation context is transport-neutral and does not force text-only output or a Telegram response length. This keeps tool-call protocol messages available to every supported model and channel. Telegram-specific message splitting remains in the Notification delivery service.

Auto model selection uses the local enabled catalogue in
`libs/shared/utils/src/lib/constants/open-router-models.ts`. The catalogue allows
only `openai/gpt-6.1-sol` for text, coding, and image/file analysis. Every reply
uses `high` reasoning, including messages saved with another reasoning setting.
Manual selection requires an enabled catalogue entry, and the composer model
list exposes that model with `high` as its only reasoning effort.

RBAC filters candidates by input/output modalities and provider availability.
A single compatible candidate is selected without a Jev model-selection call.
For multiple candidates, Jev Decisions chooses using capabilities and pricing;
an invalid decision retains the compatible list in priority order. Generation
sends a concrete model ID. GPT 6.1 Sol has text output through OpenRouter.
The automatic image-generation route returns an unavailable notice and settles
only the decision calls already made; it does not call another answering model.

AI Chat composers accumulate file selections in one horizontally scrolling row
above the text field. Cards have previews, removal, drag reordering and arrow
controls. Cmd+Enter or Ctrl+Enter submits; Enter inserts a line.
The document target selector is hidden; section discussion can still set the
Source target. New message and Knowledge uploads accept PNG, JPG, WebP, GIF,
PDF, TXT, MD, CSV and JSON. Both pickers and RBAC endpoints reject other formats,
including SVG. Previously stored SVG images remain readable and are rendered
as PNG for model input without changing their originals.
The Knowledge sidebar shows two file cards in two columns. Show more expands
all remaining rows vertically. Each card opens the original File and can
unlink it from that Source; its pending state is scoped to the selected file.
Sent messages and document proposals show attachments in a horizontally
scrolling gallery, in submission order; each card opens the original File.
Proposal replies link every proposed File without duplicating its stored bytes.
Their `knowledge.documentProposalFileIds` metadata marks these links as previews;
OpenRouter receives the originals from user messages without repeating the
assistant's gallery in the model context.
Confirmation transfers the same complete File list to the Source. Background
refetches retain mounted chat records. New replies scroll to the latest message;
loading previews keeps that position unless the user has scrolled to older messages.
The text field starts at 128 px and can be resized vertically from its bottom
right corner, between 96 px and the smaller of half the viewport or 480 px.
The project frame fills the viewport below the header and page margins. The
composer can scroll within three quarters of the conversation pane, leaving
the message history accessible when the input and attachment strip are tall.
The submitted order is preserved in message-file relations. A successful
document proposal completes the generation loop; its exact text and attachments
remain pending until a later confirmation. Revising that proposal preserves its
attachments. A revision request makes the earlier proposal unconfirmable with
`needs_revision` status; its files remain available if generation must be retried.
Draft and revision requests require a successful proposal tool call before the
generation loop reports completion. Confirmed updates attach new files while retaining existing Source
attachments and indexing the saved content.

When the replying `social.profile` invokes a linked skill, profile Knowledge search, or MCP tool, the bounded tool loop emits presentation-safe lifecycle events. RBAC lazily creates one `social.action` with `variant="ai-execution"` for that run, relates it to the current chat, thread, and replying profile, and updates the same action through requested, running, succeeded/failed, and terminal states. The typed action payload contains only safe labels, tool/server identifiers, normalized status, timestamps, result byte counts, and message/profile/run ids; it never contains tool arguments/results, bearer credentials, prompts, hidden reasoning, or stack traces. Existing WebSocket invalidation updates the specialized conversation row in place. Runs without tool calls create no execution action, and progress persistence cannot prevent the final `social.profile` reply.

`profile_knowledge_files` lists a linked Source's attachment IDs and current
content hash in pages. An explicit current request to remove an attachment
exposes `profile_knowledge_file_detach`, including in document threads where
generic MCP and direct text writes remain disabled. The tool uses the scoped
RBAC Files SDK, validates the document target, and checks the Source hash and
attachment list inside the database transaction. Detachment retains the stored
File and chat attachments, preserves human notes, and rebuilds materials and
the index. Detachment returns after the database write with `analysisPending`
when rebuilding remains unfinished. A separate scoped reanalysis request
publishes completion through the existing cache and WebSocket middleware.
The model reports the unlink separately from index readiness; analysis errors
leave the Source unindexed and are logged without retrying the removal.
Attachment requests neither approve a pending text proposal nor replace it.

RBAC also owns profile-scoped document operations for the Social chat sidebar:

```text
GET /api/rbac/subjects/:id/social-module/profiles/:socialModuleProfileId/knowledge/sources
PATCH /api/rbac/subjects/:id/social-module/profiles/:socialModuleProfileId/knowledge/sources/:knowledgeModuleSourceId
POST /api/rbac/subjects/:id/social-module/profiles/:socialModuleProfileId/knowledge/sources/:knowledgeModuleSourceId/reindex
```

These routes validate subject/profile access and the Social profile-Source relation before calling generic Knowledge Source update or reindex methods.

Telegram personal AI provisioning also ensures one existing-model RBAC grant
for the profile owner. The role slug is
`social-profile-<social-profile-id>-knowledge-owner`; sixteen chat-scoped
assistant-management permissions cover profile listing/update/avatar, six
skill operations, five Knowledge Source operations, and two Source attachment
operations. They keep the target
AI profile UUID literal, and the role is
assigned to the authenticated owner through `subjects-to-roles`. No
profile-to-role relation or extra authorization middleware is introduced.

The AI Chat account menu reads the single token balance through
`GET /api/rbac/subjects/:id/billing-module/balance`. The private account role
grants that exact Subject path, and owner middleware rejects another Subject.
Project, Skill and Source record wrappers use scoped SDK query functions.
Scoped message responses include their authors and ordered Files, so chat
rows need no global relation or File listing permission. Reading an owned
assistant's Knowledge repairs older attachment grants; shared Chat membership
alone does not create an owner grant.

### Natural-key integrity and concurrent Telegram bootstrap

RBAC grant identity is enforced by PostgreSQL, not by a Telegram queue or an
in-process mutex:

- `permission`: one row per `(type, method, path)`;
- `roles-to-permissions`: one row per `(roleId, permissionId)`;
- `subjects-to-roles`: one row per `(subjectId, roleId)`.

Authentication and Telegram graph identity are enforced by provider-specific
and relation-specific indexes:

- Telegram and Google identities use exact `(provider, account)` semantics;
- EVM accounts and email/password identities use case-insensitive natural
  keys;
- plain email checkout/contact identities may repeat across subjects;
- one identity may be linked to only one subject;
- Telegram chats are unique by `sourceSystemId` within the Telegram variant;
- graph relations are unique by their two foreign keys, and a chat has at most
  one default thread relation.

Each repository composes constraints through `constraints/singlepage ->
startup -> index`. Startup constraints inherit the SPS natural key and may add
project-specific indexes. Changing a natural key requires coordinated changes
to repository fields, service lookup filters, the repair operation, and a
generated migration.

Telegram identity bootstrap uses permanent unique indexes rather than an
application-wide lock. Concurrent requests execute
independently: permanent unique indexes reject a conflicting insert, and the
request that loses that insert replays bootstrap instead of failing. Every
bootstrap step is find-or-create, so the replay observes the row the winning
request just inserted. `isUniqueConstraintError` from `@sps/backend-utils`
classifies the conflict, including one wrapped by the API response pipe, and
`TELEGRAM_BOOTSTRAP_CONFLICT_RETRY_DELAYS_MS` bounds the replays and grows
each delay, because one request can lose several natural keys in sequence:
a replay restarts at the first find-or-create and meets the next contended
insert. A request
that loses the `subjects-to-identities` insert drops the subject it had just
created, so a replay never leaves an orphaned subject behind. Telegram calls
free-subscription provisioning only when bootstrap returns
`shouldCheckoutFreeSubscription=true` (registration or `/start`); ordinary
messages remain independent from billing.

Email/password, OAuth and wallet authentication ensure the shared
`free-subscription` product after creating the personal profile. Existing
active subscriptions retain their terms; signing in again does not create a
second order or grant another allowance. A new free order completes local
zero-price invoice settlement and delivery before authentication returns.
Personal Profile creation and the initial Free grant use a Subject-scoped
transaction lock; fulfillment also locks the Order. The graph, accepted
Invoice, Role and initial 3000 credits commit together. Free provisioning owns
that transaction and dispatches effects after commit; it makes no loopback
checkout or payment-provider call inside the transaction.

Configure the free product through the runtime API or admin interface: price
zero, interval `day`, token top-up `3000`, and the associated access role.
Keep its interval and top-up attributes separate from other tariffs. The
internal `dummy` provider records the local zero-price settlement. Free grants
3000 credits once per registered account and cannot be repurchased or renewed
through self-service checkout. Its interval remains Order metadata, not a
daily credit schedule. Paid subscription cycles and one-off top-ups add their
configured credits once per accepted Invoice; pack quantities multiply the
credit amount. Expiry, cancellation and revocation do not reset wallets or
remove previously granted credits. Requests continue to debit the balance
through the existing BillRoute calculation. Order and Subject jobs still
manage paid subscription lifecycle and access. Repository data snapshots are
not the configuration interface.

### Repair and rollout

The canonical API deployment runs this compatibility repair on every API
container deployment/restart while issue #216 remains open. `start.sh api`
runs `migrate.sh seed` in the foreground, and `migrate.sh` invokes apply mode
before Social and RBAC natural-key migrations. A repair or migration failure
must stop the new API process instead of leaving a partially migrated release
serving requests.

Before applying the generated natural-key indexes to an existing environment:

1. Quiesce API and Telegram writers and create the normal database backup.
2. Run `npx nx run @sps/rbac:repository-natural-key-repair-check`.
3. Investigate any reported conflicting role-permission conditions; apply mode
   intentionally fails closed for them.
4. Run `npx nx run @sps/rbac:repository-natural-key-repair-apply`.
5. Run the scoped repository migrations or
   `npx nx run @sps/rbac:repository-migrate`; the aggregate target runs repair
   before migrations.
6. Re-run the check and verify all duplicate counts are zero before restoring
   writers.

The temporary deployment repair normalizes provider identities, identity
ownership, Telegram chats/profiles/default and topic threads, Social graph
relations, stale automatic profile links, and the three grant natural keys. It
keeps the newest provider identity, prefers deterministic Telegram entities,
keeps the earliest grant row, transfers dependent relations, deletes legacy
duplicates, and verifies convergence in the same transaction. Check mode is
read-only. Both modes log aggregate counts plus the identity, relation, and
subject IDs that will be retained or detached; provider accounts, email values,
permission paths, and row payloads are not logged. This compatibility code is
removed only after the downstream rollout tracked by issue #216; its generated
migrations and permanent constraints remain.

Default and topic thread checks use only Telegram Chats with a provider ID,
matching the repair's write scope. AI Chat documents and discussion threads
may share the `default` variant and remain separate records.

---

## 2. Models

| Model                                       | Purpose                        |
| ------------------------------------------- | ------------------------------ |
| [action](./models/action/README.md)         | Time-bound action records      |
| [identity](./models/identity/README.md)     | Authentication identities      |
| [permission](./models/permission/README.md) | Permission rules (method/path) |
| [role](./models/role/README.md)             | Role definitions               |
| [subject](./models/subject/README.md)       | Authenticated subjects         |
| [widget](./models/widget/README.md)         | Auth UI widgets                |

---

## 3. Relations

| Relation                                                                                                       | Purpose                          |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| [roles-to-ecommerce-module-products](./relations/roles-to-ecommerce-module-products/README.md)                 | Link roles to products           |
| [roles-to-permissions](./relations/roles-to-permissions/README.md)                                             | Link roles to permissions        |
| [subjects-to-actions](./relations/subjects-to-actions/README.md)                                               | Link subjects to actions         |
| [subjects-to-billing-module-payment-intents](./relations/subjects-to-billing-module-payment-intents/README.md) | Link subjects to payment intents |
| [subjects-to-blog-module-articles](./relations/subjects-to-blog-module-articles/README.md)                     | Link subjects to articles        |
| [subjects-to-ecommerce-module-orders](./relations/subjects-to-ecommerce-module-orders/README.md)               | Link subjects to orders          |
| [subjects-to-ecommerce-module-products](./relations/subjects-to-ecommerce-module-products/README.md)           | Link subjects to products        |
| [subjects-to-identities](./relations/subjects-to-identities/README.md)                                         | Link subjects to identities      |
| [subjects-to-notification-module-topics](./relations/subjects-to-notification-module-topics/README.md)         | Link subjects to topics          |
| [subjects-to-roles](./relations/subjects-to-roles/README.md)                                                   | Link subjects to roles           |
| [subjects-to-social-module-profiles](./relations/subjects-to-social-module-profiles/README.md)                 | Link subjects to social profiles |

---

## Widget composition

RBAC Widget variants own authentication, account/project state, scoped readers
and forms. Their exact Website Builder Widget links use the standard default
relation and rendered JSX children. Website Builder owns layout, imagery and
copy. Screen names and modes do not belong in relation renderers. See the
[frontend composition contract](../../../.agents/contracts/engineering/frontend-components.md),
[Widget documentation](./models/widget/README.md),
[Website Builder links](./relations/widgets-to-website-builder-module-widgets/README.md)
and [CRM links](./relations/widgets-to-crm-module-widgets/README.md).
