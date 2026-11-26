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

- Session and refresh JWTs use HS256. Hono verification calls specify this
  algorithm explicitly; the shared `verifyJwt` helper also sanitizes credential
  failures, including algorithm mismatches.
- `subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts` is only the global permission resolver. The token it reads must be an unrevoked access token (subject README, "Session Tokens").
- The resolver receives the startup-exported Permission,
  roles-to-permissions, and subjects-to-roles services through Subject DI. It
  uses filtered service `find` calls; it must not call the local HTTP API or
  issue handwritten SQL.
- A bracketed path segment such as `[knowledge.sources.id]` is a dynamic
  permission mask. A concrete UUID is literal and grants no access to another
  record id. Permissions without any role relation remain public.
- Manage permissions and role assignments in the database. In **Admin v2 → Settings → Public API permissions**, an administrator can select missing public permissions from the project's RBAC dump. See the [permission model](models/permission/README.md#role-less-permissions).
- Add route access through `rbac.permissions`; keep resource ownership and module-specific checks in `backend/app/middlewares/src/lib/*` middleware for that module.
- Controllers should compose exported middleware instances, not define middleware bodies inline.
- Do not put social chat/thread/profile ownership logic, billing rules, or other domain rules into the global authorization service.

### Store work in Social conversations

Open **Funnels** on a store page to see its CRM funnels. The list lives at `/:language/ecommerce/stores/:storeSlug/crm/funnels`. Open `/new` under that path to create a funnel, or open `/:funnelSlug` to edit its stages and run a store test. Renaming a funnel preserves its address. The link in a test chat returns to the editor for that funnel.

Stores link to their catalog at `/products`, employees at `/employees`, tasks at `/crm` and funnels at `/crm/funnels`, relative to the store URL. Owners can open `/settings` to connect a provider, assign it to an agent and inspect token reservations and transfers for tasks. Set the payer and spending limits in the funnel editor.

The **Employees** page lets an owner or administrator create a named AI Subject and open a private conversation with its Social profile. Reopening the employee returns to the same conversation for that operator. Send “Remember…” or “Запомни…” to save a source in the employee’s profile. The sidebar also lets the operator edit sources, upload reference files and manage the employee’s skills.

Attach files to a message or send them on their own. The operator can download
them from the conversation. A file-only message is saved without requesting
an AI reply. When the operator includes a message, the employee can read
excerpts from up to three UTF-8 TXT, Markdown, CSV, or JSON files of up to
128 KiB each. Attach a JPEG, PNG or WebP with a question, or ask about the
last picture you sent in this conversation. A supported text model receives
one image in the same paid reply. The worker checks the original (up to 8 MiB
and 16 megapixels) and sends a JPEG copy with a longest side of 512 pixels.
The question keeps its selected image if another upload arrives before the reply.
Operators can preview images and PDFs, play supported audio or
video, and download the original upload. To add a reference to the employee’s
Knowledge, use the sidebar.

Choose the employee as the assignee in a funnel stage and select the skills that stage needs. An operator can also assign an existing task from its details. Customer replies use the assigned employee’s knowledge. The worker includes the chosen skills for the current stage. Private training messages stay in the operator’s conversation.

A customer's message belongs to a Social thread linked to a CRM task. RBAC verifies the customer and the current assignment. The Agent worker claims the message event and calls the provider connection assigned to that assistant and capability. The store's current funnel determines who funds the task and its spending limit. A task funded by the customer also requires the customer's approval.

Store owners can assign provider capabilities to AI Subjects with an `assistant` or `crm-agent` grant in that store. The same grant check applies when the worker resolves a model for the current assignee.

The worker processes each CRM task’s pending messages in order for the current assignment, and a manager can take over in the same thread. Knowledge draws on permitted sources linked to the customer’s sending profile and the assigned product expert’s profile. The composer saves the model choice on each message, and RBAC resolves it through an active provider connection allowed for the current stage.

Each external call has an attempt ID and a reserved maximum. Settlement records the provider's charge or a rate-card estimate, the internal currency transfers and the released amount. The technical provider Subject identifies the external account. Replies use the assigned executor and the current stage. The customer can read the result from the original conversation. [Billing transactions](../billing/models/transaction/README.md)

AI Chat composers accumulate file selections in one horizontally scrolling row
above the text field. Cards have previews, removal, drag reordering and arrow
controls. Enter submits the message. Shift+Enter inserts a line.
AI Chat messages and Knowledge uploads accept PNG, JPG, WebP, GIF, PDF, TXT,
MD, CSV and JSON. Messages also accept AVIF, HTML, audio and video. The AI Chat
message endpoint rejects new standalone SVG uploads. Private customer work and
employee chats accept SVG and scripts as downloadable files. Previously stored
SVG images remain readable and are rendered as PNG for model input without
changing their originals.
The Knowledge sidebar shows two file cards in two columns. Show more expands
all remaining rows vertically. Each card opens the original File and can
unlink it from that Source; its pending state is scoped to the selected file.
Messages show attachments in submission order. Images open at a larger size.
Supported audio and video play in the message or in the discussion’s Files
sidebar. Files shows the first three distinct attachments in message order.
With four or more, More opens the full gallery. Escape returns from a preview to
its tile. For discussions longer than the timeline page, the sidebar reads a
scoped index of filenames and fetches checked public File records as their
tiles come into view. Private attachments use the buyer’s or employee’s authorized message
route, or the manager’s CRM task route. Background refetches retain mounted
chat records. New replies scroll to the latest message;
loading previews keeps that position unless the user has scrolled to older messages.
The text field starts at 128 px and can be resized vertically from its bottom
right corner, between 96 px and the smaller of half the viewport or 480 px.
The project frame fills the viewport below the header and page margins. The
composer can scroll within three quarters of the conversation pane, leaving
the message history accessible when the input and attachment strip are tall.
The submitted order is preserved in message-file relations.

The chat renders tool activity from a Social Action with `variant="ai-execution"`, linked to the current chat, thread and replying profile. For employee and order MCP calls, the worker adds one step per call to the action for the triggering event. Its public fields include the server, tool, status and timing. The chat can show supported parameters and results, such as a model name and its schema fields, or a failure code. Message and run IDs associate the trace with the conversation.

The employee profile selects which MCP servers the model can use. Tools run with the original access JWT of the person who sent the message. Queued work retrieves that JWT from an encrypted, message-bound KV entry that expires with the token. The worker checks the sender's session again before each call.

`profile_knowledge_files` lists a linked Source's attachment IDs and current
content hash in pages. An explicit current request to remove an attachment
exposes `profile_knowledge_file_detach`. The tool uses the scoped RBAC Files SDK
and checks the Source hash and attachment list inside the database transaction. Detachment retains the stored
File and chat attachments, preserves human notes, and rebuilds materials and
the index. If indexing fails, the request returns an error and the transaction restores the prior attachment list and searchable content.

RBAC owns the profile-scoped Knowledge routes used by the Social chat sidebar.

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
remove previously granted credits. CRM work debits the funding wallet through the work ledger. Order and Subject jobs still
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
| [subjects-to-social-module-chats](./relations/subjects-to-social-module-chats/README.md)                       | Record the creator of a chat     |
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

## Store provider credentials

An authenticated store owner manages connections in the store settings. A provider connection links an outbound Identity to a Subject with the `provider-agent` variant. The store owner manages this link and its capability assignments through `subjects-to-identities`. The Subject receives computation charges in its Billing wallet. Assign a provider, model and rate card to a capability on an individual assistant or as the store default. A direct assignment takes precedence. Revocation stops dispatch through that connection. Confirmed external charges remain attributed to the original account and version.

Set `SPS_PROVIDER_SECRET_DIR` to an absolute private directory on persistent storage shared by API workers. `SPS_PROVIDER_MASTER_KEYS` is a JSON object mapping key IDs to base64-encoded 32-byte keys. `SPS_PROVIDER_ACTIVE_MASTER_KEY` selects the encryption key for new credentials. The service stores each credential version in an authenticated ciphertext file with owner-only permissions. Keep the key ring in deployment secrets and retain keys needed to read stored versions. A user supplies a provider key over HTTPS when connecting or rotating a credential. The settings API returns metadata and the affected record ID.

When a request times out, its reserve remains visible. The owner can request lookup of a recorded OpenRouter generation or reconcile against the external statement. A confirmed charge posts the two transfers up to the authorized amount and records any uncovered external cost. Confirmation that there was no charge releases the reserve. A second generation requires a new work event.
