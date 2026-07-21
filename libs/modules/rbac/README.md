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
- A bracketed path segment such as `[knowledge.documents.id]` is a dynamic
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

If the message starts with `@knowledge /learn`, the endpoint strips the controls, calls `KnowledgeService.learnContent(...)` for the message text plus supported `.txt`, `.md`, or `.markdown` attachments, and creates the Social `profiles-to-knowledge-module-documents` relation for the replying AI profile if needed. Normal replies load and search Knowledge only when their persisted message text explicitly contains `@knowledge`; without that mention no RAG context or Knowledge tool is added. Explicit retrieval stays scoped to the profile-document relation, and the final AI answer is saved as a social message in the same thread. A separate Knowledge-only reaction endpoint is not exposed.

The persisted control syntax is channel-independent. The web composer inserts
`@knowledge /learn`, while the Telegram adapter maps private `/learn`, group
`/learn@<bot-username>`, and group `@<bot-username> /learn` messages to that
same text before creating the Social message. Telegram `@knowledge` queries are
handled by this endpoint as well; Telegram does not implement a separate
learning or retrieval pipeline.

The shared OpenRouter generation context is transport-neutral and does not force text-only output or a Telegram response length. This keeps tool-call protocol messages available to every supported model and channel. Telegram-specific message splitting remains in the Notification delivery service.

When the replying `social.profile` invokes a linked skill, profile Knowledge search, or MCP tool, the bounded tool loop emits presentation-safe lifecycle events. RBAC lazily creates one `social.action` with `variant="ai-execution"` for that run, relates it to the current chat, thread, and replying profile, and updates the same action through requested, running, succeeded/failed, and terminal states. The typed action payload contains only safe labels, tool/server identifiers, normalized status, timestamps, result byte counts, and message/profile/run ids; it never contains tool arguments/results, bearer credentials, prompts, hidden reasoning, or stack traces. Existing WebSocket invalidation updates the specialized conversation row in place. Runs without tool calls create no execution action, and progress persistence cannot prevent the final `social.profile` reply.

RBAC also owns profile-scoped document operations for the Social chat sidebar:

```text
GET /api/rbac/subjects/:id/social-module/profiles/:socialModuleProfileId/knowledge/documents
PATCH /api/rbac/subjects/:id/social-module/profiles/:socialModuleProfileId/knowledge/documents/:knowledgeModuleDocumentId
POST /api/rbac/subjects/:id/social-module/profiles/:socialModuleProfileId/knowledge/documents/:knowledgeModuleDocumentId/reindex
```

These routes validate subject/profile access and the Social profile-document relation before calling generic Knowledge document update or reindex methods.

Telegram personal AI provisioning also ensures one existing-model RBAC grant
for the profile owner. The role slug is
`social-profile-<social-profile-id>-knowledge-owner`; fourteen chat-scoped
assistant-management permissions cover profile listing/update/avatar, six
skill operations, and five Knowledge-document operations. They keep the target
AI profile UUID literal, and the role is
assigned to the authenticated owner through `subjects-to-roles`. No
profile-to-role relation or extra authorization middleware is introduced.

### Natural-key integrity and concurrent Telegram bootstrap

RBAC grant identity is enforced by PostgreSQL, not by a Telegram queue or an
in-process mutex:

- `permission`: one row per `(type, method, path)`;
- `roles-to-permissions`: one row per `(roleId, permissionId)`;
- `subjects-to-roles`: one row per `(subjectId, roleId)`.

Authentication and Telegram graph identity are enforced by provider-specific
and relation-specific indexes:

- Telegram and Google identities use exact `(provider, account)` semantics;
- EVM accounts and email providers use case-insensitive natural keys;
- one identity may be linked to only one subject;
- Telegram chats are unique by `sourceSystemId` within the Telegram variant;
- graph relations are unique by their two foreign keys, and a chat has at most
  one default thread relation.

Each repository composes constraints through `constraints/singlepage ->
startup -> index`. Startup constraints inherit the SPS natural key and may add
project-specific indexes. Changing a natural key requires coordinated changes
to repository fields, service lookup filters, the repair operation, and a
generated migration.

Telegram bootstrap and free-subscription provisioning do not serialize
requests with application or advisory locks. Concurrent requests execute
independently: permanent unique indexes reject a conflicting insert, while the
other request may complete normally. Telegram calls free-subscription
provisioning only when bootstrap returns
`shouldCheckoutFreeSubscription=true` (registration or `/start`); ordinary
messages remain independent from billing.

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
