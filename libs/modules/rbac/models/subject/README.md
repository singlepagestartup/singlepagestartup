# RBAC Subject Model

## Purpose

Subjects represent visitors, registered accounts and actors, and connect identities, roles and application-specific flows.

## Layering Boundary

- RBAC subject is the orchestration layer for authenticated ecommerce cart/product flows.
- Frontend variants such as `me-ecommerce-module-product-cart-default`, `me-ecommerce-module-product-checkout-default`, and `me-ecommerce-module-cart-default` are the supported entry points for host/cart behavior.
- Dependency direction is one-way: `rbac > ecommerce`. RBAC may compose ecommerce SDK/components; ecommerce must not import RBAC subject implementation.

### Current-Subject cart reads

`GET /api/rbac/subjects/:id/ecommerce-module/orders?includeCartDetails=true`
returns only that Subject's active cart orders, including `cartDetails.lines`
(with Product records), `cartDetails.totals` and `cartDetails.storeIds`. Owner
scope and active-cart restrictions are enforced even with caller filters.
The projection runs in withConsistencySnapshot; the lower Ecommerce
findByIdCartDetails capability owns line/product loading and amount calculation.
Products remain Ecommerce models.

Product controls, quantity editing and the cart sheet use the Subject order-list
render-reader with this parameter. Their matching SDK query is shared; they do
not fetch personal Order or OrdersToProducts data through generic Ecommerce
read endpoints. Public Product price/media readers remain Ecommerce operations.
The cart sheet groups the server-calculated amounts by currency from the same
projection as its rows; it makes no separate total request and hides checkout
when the cart is empty. The extended response has its own query key; captured dependencies and the
legacy SDK topics retain cross-client invalidation after line, quantity or
price changes. Mutable reads remain no-store at the Next boundary.

Cart routes use RequestSubjectIdOwner first. Order-ID routes additionally use
RequestSubjectOwnsEcommerceModuleOrder. The owning Subject service verifies the
Subject–Order link and, for quantity edits, every submitted Order–Product line.
A caller's own Subject ID alone does not authorize changes to another order.

## Authorization Layering

- `backend/app/api/src/lib/service/singlepage/is-authorized.ts` must stay thin: it resolves `rbac.permission` and role access only.
- Permission and relation lookups are injected through Subject DI and use the
  startup-exported backend services. Child projects can override those
  services or the main Subject Service method without a loopback API request.
- Do not add domain ownership, membership, chat, thread, profile, billing, or module-specific checks to `is-authorized.ts`.
- For concrete subject routes, add the route to `rbac.permissions` first, then enforce resource ownership with route-level middleware from `backend/app/middlewares/src/lib/*`.
- Subject-owned routes must keep `RequestSubjectIdOwner` or `RequestProfileSubjectIdOwner` as the first ownership guard.
- Domain-specific guards must live in the module middleware package and be exported from `backend/app/middlewares/src/index.ts`; do not define middleware bodies inside controllers.
- For example, chat thread routes use `RequestSubjectOwnsSocialModuleChat` and `RequestSocialModuleThreadBelongsToChat`, which call `socialModuleChatLifecycleAssertSubjectOwnsChat` and `socialModuleChatLifecycleAssertThreadBelongsToChat`.
- Handlers may keep the same assertions as a defense-in-depth check, but the access model must not depend on custom route exceptions inside the global authorization service.

### Reading the current Subject

`GET /api/rbac/subjects/:id` accepts a verified session JWT whose Subject ID
matches the requested ID. This includes guest sessions without identities or
roles. The controller registers `RequestSubjectReadAccess` before the existing
find-by-id handler. A foreign Subject requires an explicit RBAC permission;
the operator secret retains its existing access. Missing, expired and invalid
session tokens cannot read a Subject.

The exact UUID read delegates authorization to this controller guard. Subject
collection, count and nested routes keep their existing access rules. The read
bypasses HTTP response caches so a cached response cannot skip the guard.

### Social Thread Permission Routes

Thread management through `rbac.subject` requires `rbac.permission` records for the HTTP routes and route-level subject/chat/thread middleware for resource checks:

- `GET /api/rbac/subjects/[rbac.subjects.id]/social-module/chats/[social.chats.id]/threads`
- `POST /api/rbac/subjects/[rbac.subjects.id]/social-module/chats/[social.chats.id]/threads`
- `PATCH /api/rbac/subjects/[rbac.subjects.id]/social-module/chats/[social.chats.id]/threads/[social.threads.id]`
- `DELETE /api/rbac/subjects/[rbac.subjects.id]/social-module/chats/[social.chats.id]/threads/[social.threads.id]`

## Authentication API

- `GET /rbac/subjects/authentication/init`: initialize anonymous/authenticated session tokens.
- `GET /rbac/subjects/authentication/me`: resolve the current Subject and its server-derived `authenticated` status.
- `POST /rbac/subjects/authentication/refresh`: refresh JWT/refresh pair.
- `POST /rbac/subjects/authentication/logout`: logout current session.
- `POST /rbac/subjects/authentication/email-and-password/authentication`: login by email+password.
- `POST /rbac/subjects/authentication/email-and-password/registration`: register by email+password.
- `POST /rbac/subjects/authentication/email-and-password/forgot-password`: request reset code.
- `POST /rbac/subjects/authentication/email-and-password/reset-password`: reset password by code.
- `POST /rbac/subjects/authentication/ethereum-virtual-machine`: EVM signature login.

Guest and registered Subjects both use `variant="default"`. A JWT identifies a
visitor session; it does not establish that an account exists. The `me` response
adds `authenticated`, derived from the Subject's Identity links. This field is
session metadata and is not stored in the Subject table. The authentication
reader supplies `{ data, authenticated }` to its children. Account menus,
private workspace entry points and admin controls use that flag before loading
profiles, projects or roles.

Protected AI Chat entry points pass `unauthenticatedRedirectHref` to the
authentication reader. A resolved visitor session redirects to the localized
sign-in page before private project reads. Token restoration and pending session
queries keep the loading state; an authenticated account still receives the
project-access result when it opens another owner's workspace.

Email registration reuses the current visitor Subject identified by a verified
session token. Its Identity and registration roles are attached to that Subject,
and authentication completion creates its personal profile and ownership grants.
An existing account cannot be reused as a visitor for another registration.
Session initialization and `me` reads create no Social Profile. A visitor's
generated Subject slug is not displayed as an account name.

The client SDK saves the tokens and resets query state before completing email
registration or sign-in. Mounted session readers refetch before navigation,
including when registration keeps the visitor Subject and returns the same JWT.
Forms must preserve the active query subscriptions when authentication completes.
Subject view readers synchronize their browser cookie snapshot on mount and
when the requested Subject changes. A cookie written before the reader mounts
must be available even when the browser's cookie-change event has already fired.

- `POST /rbac/subjects/authentication/oauth/{provider}`: start OAuth flow (`google`).
- `GET /rbac/subjects/authentication/oauth/{provider}/callback`: OAuth provider callback.
- `POST /rbac/subjects/authentication/oauth/exchange`: exchange one-time code to JWT/refresh.

### Account email changes and project reads

- `GET /rbac/subjects/:id/social-module/profiles/projects` returns the caller's assistant profiles with their Chat and initial document Thread. Ownership comes from the Subject's `assistant` relation, and the caller's personal Profile must also belong to that Chat. Shared Chat membership does not establish project ownership.
- `POST /rbac/subjects/:id/identities/:identityId/email-change/code` sends a verification code through the Notification service. An empty data object requests a code for the current address; a new `email` requires the `verificationId` returned by verifying the current address.
- `POST /rbac/subjects/:id/identities/:identityId/email-change/verify` verifies `challengeId` and the six-digit `code`. Current-address verification returns a `verificationId`; new-address verification saves the email and returns the public Identity fields.

These routes use owner middleware and concrete permissions in the Subject's private account role. Email codes expire after ten minutes, are stored as keyed hashes, and are consumed atomically. An incorrect code consumes that challenge; another code can be requested after the per-stage, one-minute sending limit. Password changes use the existing owner Identity update method with the current password and a new password; the form requires its repeated value before submitting.

### Purchase details

`GET /rbac/subjects/:id/ecommerce-module/orders?includePurchaseDetails=true`
returns optional `purchaseDetails` with totals and receipt File metadata. The
handler verifies the JWT Subject, filters by Subject→Order membership, and
postfilters the result before enriching it. Caller OR filters cannot widen
ownership. Effective Order, receipt-relation and File services run in the same
consistency snapshot, so their captured dependencies participate in recovery.
The flag is read directly from the request because the common query parser
retains only its standard parameters.

The account purchases reader owns this scoped SDK query. It passes each Order
and its details to `purchase-ai-chat` with `dataSource="props"`; that child
renders the supplied totals and receipt without querying generic Ecommerce
endpoints. Zero is a valid total, including a free subscription. Standalone
Ecommerce readers retain their own authorization requirements.

## Anonymous Session Lifecycle

A subject and a JWT are issued on the first visit, including public browsing,
so visitor actions can be recorded from the first request.

`GET /rbac/subjects/authentication/init` reuses a session instead of creating
one whenever the request carries a token this installation signed - in the
`rbac.subject.jwt` cookie or the `Authorization` header - and the subject in
that token still exists. A request with no token, with a malformed or expired
token, or with a token for a deleted subject creates a subject, so first-visit
creation is unchanged.

`init` with reuse and `POST /rbac/subjects/authentication/refresh` record
activity by touching `updatedAt`, at most once per activity interval. Retention
reads that column, which is why a returning visitor is never treated as
abandoned.

`POST /rbac/subjects/delete-anonymous` (secret key only, called by the
`rbac-module-subjects-delete-anonymous` agent) deletes one bounded batch of
inactive anonymous subjects and returns scanned, deleted, failed and
retained-by-reason counts. A subject is kept when it is not the `default`
variant or when it has one of these relations: an identity, an ecommerce order,
a social profile, a role, or a billing currency balance. A project adds its own
blockers by overriding `anonymousSubjectRetentionBlockers` in its `startup`
subject service.

- `RBAC_ANONYMOUS_SUBJECT_ACTIVITY_INTERVAL_IN_SECONDS`: minimum interval
  between two activity writes for one subject (default `3600`).
- `RBAC_ANONYMOUS_SUBJECT_RETENTION_IN_SECONDS`: inactivity after which an
  anonymous subject without blockers becomes eligible for deletion (default
  `2592000`, 30 days). It is independent of the token lifetimes.
- `RBAC_ANONYMOUS_SUBJECT_CLEANUP_BATCH_SIZE`: subjects examined per cleanup
  run (default `500`). A larger backlog drains over consecutive runs.

## OAuth Configuration

- `RBAC_OAUTH_GOOGLE_CLIENT_ID`: Google OAuth client id.
- `RBAC_OAUTH_GOOGLE_CLIENT_SECRET`: Google OAuth client secret.
- `RBAC_OAUTH_GOOGLE_REDIRECT_URI`: optional explicit callback URI (fallback is `${API_SERVICE_URL}/api/rbac/subjects/authentication/oauth/google/callback`).
- `RBAC_OAUTH_SUCCESS_REDIRECT_PATH`: host path used after successful callback/exchange handoff (default `/`). It is validated like any other redirect target; a value that does not resolve to a path on `NEXT_PUBLIC_HOST_SERVICE_URL` falls back to `/`.
- `RBAC_OAUTH_STATE_LIFETIME_IN_SECONDS`: OAuth state TTL (default `600`).
- `RBAC_OAUTH_EXCHANGE_LIFETIME_IN_SECONDS`: OAuth exchange code TTL (default `120`).
- `RBAC_OAUTH_EXCHANGE_CODE_IN_QUERY`: compatibility knob, default `false`. The exchange code is a session-granting credential, so it travels in the HttpOnly `rbac.oauth.exchange-code` cookie. Set it to `true` for one release if the API and the host are on different registrable domains, where a `SameSite=Lax` cookie is not sent with the exchange POST: the callback then also puts the code in the `code` query parameter and the exchange route accepts it from the request body.

## OAuth Redirect Targets

- A redirect target is accepted only when it resolves to a path on `NEXT_PUBLIC_HOST_SERVICE_URL`. `//host`, `/\host` and absolute URLs on another origin all fall back to `RBAC_OAUTH_SUCCESS_REDIRECT_PATH`.
- The target is validated when it is stored at start and again when it is used at callback, so a row written before this rule existed cannot redirect off-origin either.
- A project that genuinely returns to a second origin overrides `getAllowedRedirectOrigins()` on the OAuth start and callback services in the `startup` layer.

## OAuth Subject Resolution Rules

- OAuth callback stores temporary data in `rbac.action` records (`oauth-state`, `oauth-exchange`) and consumes them to prevent replay. Consumption is a conditional update (`POST /rbac/actions/{id}/consume`), so two requests holding the same state or the same code cannot both proceed. The exchange row is consumed before any token is signed.
- Priority for selecting target subject:

1. Existing `oauth_google` identity by provider account (`account`) and its linked subject.
2. Existing `email_and_password` identity with same verified email and its linked subject.
3. Current authenticated subject from OAuth start JWT (`sourceSubjectId`), if present.
4. New subject creation.

- If OAuth identity is already linked to another subject, login is performed into that already linked subject.
- In `flow=link`, authenticated source subject is required.
- Callback redirects to a path on the host origin with either:

1. `?oauthExchange=<provider>` on success, with the code in the HttpOnly `rbac.oauth.exchange-code` cookie. `?code=<oauth-exchange-action-id>` is added as well while `RBAC_OAUTH_EXCHANGE_CODE_IN_QUERY` is on.
2. `?oauthError=<error-code>` on failure.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `slug`: URL-friendly unique identifier.

## Telegram Personal AI Agent

Telegram bootstrap maintains two different RBAC subjects for one user:

1. The authenticated owner subject linked to `rbac.identity(provider="telegram")`.
2. A dedicated `rbac.subject.variant="agent"` whose deterministic slug is
   `telegram-personal-ai-agent-<owner-subject-id>`.

The agent subject owns exactly one
`social.profile.variant="artificial-intelligence"` with the same deterministic
slug. The initial profile has empty title-independent instructions and no
Knowledge Source relations; it allows the `singlepagestartup` MCP server and
can be enriched later through the normal profile Knowledge and Skill APIs.

Telegram messages do not select a reply profile. Agent dispatches every
`social.profile.variant="artificial-intelligence"` or system `agent` profile
connected to the chat; AI handlers skip Telegram commands while the
`telegram-bot` profile processes them.

During bootstrap, the personal AI profile and system `telegram-bot` profile are
connected when missing. Existing manually connected AI profiles remain chat
participants, and only duplicate relations for the same profile are removed.

The same idempotent bootstrap ensures a profile-specific Knowledge owner role
for the authenticated owner subject. The role uses only existing RBAC models
and relations (`role`, `permission`, `roles-to-permissions`, and
`subjects-to-roles`). Permission paths contain the exact target AI profile UUID;
only explicitly bracketed requester profile, chat, and Knowledge Source ids
are dynamic masks.

### Subject-scoped assistant management API

The Telegram Assistant uses only authenticated subject routes under the
requesting Social profile and chat. The manageable-profile collection returns
connected `artificial-intelligence` profiles that have an Agent RBAC subject;
requester-profile ownership, chat ownership, target eligibility, and linked
resource checks remain enforced by route middleware on every request.
Telegram bootstrap idempotently provisions exact target-profile permission
paths for every connected AI profile, so multiple-profile selection does not
depend on a global admin wildcard.

Linked Skills and Knowledge Sources accept bounded `limit` and `offset`
queries while keeping the existing plain-array response. Available Skills are
ordered, searchable, paginated, and exclude skills already linked to the target
profile. Linking is idempotent. Unlinking deletes only the profile-to-skill
relation and never the global `social.skill` record.

Profile updates remain limited to the existing allowlist, including supported
`allowedMcpServerIds`; unknown stored MCP identifiers are preserved rather than
being exposed as arbitrary connections. Avatar input follows the canonical
Social message attachment to File Storage and the existing profile-avatar
action. Knowledge create/update/reindex contracts are unchanged, and deletion
requires the Agent conversation's fresh confirmation revision before the RBAC
delete action is called.

### Subject Profile collection

`GET /api/rbac/subjects/:id/social-module/profiles` returns only Profiles explicitly owned by that Subject. Caller filters apply within this scope; shared Chat membership does not grant ownership.

`POST` at the same URL creates an `artificial-intelligence` Profile from its title. The authenticated registration flow provisions the single personal Profile; callers cannot create another personal Profile through this endpoint. Model defaults generate `slug` and `adminTitle`; caller values for those fields are not forwarded. AI Profile creation also provisions its Chat, default Thread and Agent Subject through the existing bootstrap. The returned model is the created Profile.

### Publishing an Article

`POST /api/rbac/subjects/:id/blog-module/articles` requires the current Subject's JWT and a registered human Identity. Its strict JSON envelope contains `data.requestId`, localized `title` and TipTap-serialized `description`, optional localized `subtitle`, and an optional `categoryId`. The server chooses the caller's personal Social Profile and atomically creates Article, ownership, authorship and optional category links. A retry with the same request UUID and unchanged payload returns the same Article; a changed or foreign request conflicts. This operation publishes immediately.

Public author URLs use `/authors/<Social Profile UUID>`. Social's `authors`, `authors/count` and `authors/:id` reads expose allowlisted author presentation and explicitly linked Articles/Products. They omit private Profile handles, Subject IDs and AI workspace data. Generic Profile list/count/detail reads require operator or an explicitly Role-bound administrative Permission; account settings use the existing Subject scope. Authorized Chat reads carry current participant and historical sender/actor presentation, including avatars, within their Chat scope.

## Variants

- `me-social-module-profile-list-ai-chat`: connected AI Profiles and their workspace context. Its server reader forwards the current JWT through SDKs; its client reader supports seeded data and existing realtime invalidation.
- `me-social-module-profile-select-ai-chat`: project menu backed by that reader and Social Profile menu rows.
- `me-social-module-profile-id-navigation-ai-chat`: current project's Documents and topic navigation using Social Profile and Thread presentations.
- `me-social-module-profile-id-chat-id-thread-id-ai-chat`: selected Thread composition with separate message reader, composer, Knowledge list and export actions.
- `me-social-module-profile-id-chat-id-thread-id-message-list-ai-chat` and `me-social-module-profile-id-chat-id-thread-id-message-create-ai-chat`: scoped messages and submission with AI reaction and selected Source metadata.
- `me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-list-document-ai-chat` and `me-social-module-profile-id-chat-id-thread-id-knowledge-module-source-id-update-ai-chat`: document Source creation/attachment and individual Source editing. Creation retries retain the saved Source ID.
- `me-social-module-profile-id-chat-id-thread-id-download-ai-chat`: scoped Source reader and Thread Markdown export.
- `me-social-module-profile-list-settings-ai-chat`, `me-social-module-profile-id-update-ai-chat` and `me-social-module-profile-id-avatar-update-ai-chat`: personal Profile reader, text mutation and avatar actions composed in Social Profile settings.
- `me-identity-list-settings-ai-chat` and `me-identity-id-settings-ai-chat`: connected identity reader and per-identity settings actions.
- `me-authentication-email-and-password-*-form-ai-chat`: distinct sign-in, registration, forgot-password and reset-password variants sharing private form mechanics.
- `me-crm-module-form-support-ai-chat`: validates support fields and submits them through the existing Subject CRM request SDK. The CRM Form is loaded by slug `ai-chat-support`; success appears only after the API resolves.

- `default`: renders linked identity email and a profile link.
- `agent`: non-human execution subject linked to an AI or system social profile.
- `overview-default`: subject overview with identities and social profile summary.
- `authentication-init-default`: initializes authentication context.
- `authentication-select-method-default`: select authentication method UI.
- `authentication-button-default`: auth action button.
- `authentication-email-and-password-authentication-form-default`: login form.
- `authentication-email-and-password-registration-form-default`: registration form.
- `authentication-email-and-password-forgot-password-form-default`: forgot password form.
- `authentication-email-and-password-reset-password-form-default`: reset password form.
- `authentication-logout-action-default`: logout action handler.
- `authentication-logout-button-default`: logout button.
- `authentication-is-authorized-wrapper-default`: authorization guard wrapper.
- `authentication-ethereum-virtual-machine-default`: EVM authentication flow.
- `authentication-me-default`: current subject info view.
- `identity-settings-default`: identity settings form.
- `get-emails`: helper to fetch identity emails.
- `crm-module-form-request-create`: create CRM form request.
- `ecommerce-module-product-cart-default`: cart product actions for subject.
- `ecommerce-module-product-checkout-default`: product checkout flow.
- `ecommerce-module-order-create-default`: create order action.
- `ecommerce-module-order-update-default`: update order action.
- `ecommerce-module-order-delete-default`: delete order action.
- `ecommerce-module-order-checkout-default`: order checkout flow.
- `ecommerce-module-order-list-default`: list orders for subject.
- `me-ecommerce-module-order-list-ai-chat`: the current Subject’s paid purchase history and receipt links. The order collection accepts query filters; without filters it retains the active cart defaults (`type=cart`, `status=new`). Every collection result remains restricted to orders linked to the Subject.
- `ecommerce-module-order-list-checkout-default`: list orders in checkout context.
- `ecommerce-module-order-list-quantity-default`: list order quantities.
- `ecommerce-module-order-list-total-default`: list order totals.
- `social-module-profile-list-overview-default`: overview list of social profiles.
- `social-module-profile-chat-list-default`: list chats for a profile.
- `social-module-profile-chat-overview-default`: chat overview wrapper.
- `find`: data-fetch wrapper for querying subjects.
- `admin-form`: admin create/edit form for subjects.
- `admin-select-input`: admin select input for choosing a subject.
- `admin-table`: admin table listing subjects.
- `admin-table-row`: admin row showing subject fields.

### AI Chat workspace documents

`GET /api/rbac/subjects/:id/social-module/profiles` returns only Profiles
directly linked to that Subject. With no matching Profiles it returns `[]`.
Shared Chat membership does not establish Profile ownership. Both GET and POST
require the requesting Subject to match `:id`; a private owner role grants the
concrete Subject collection route rather than a public collection template.

Successful registration creates one personal Profile and its `default` link
before returning authentication credentials. Repeated authentication preserves
that Profile. Its initial display name comes from the generated Subject slug;
the Profile slug and admin title are assigned without user input. Existing
personal names are preserved.

POST creates an artificial-intelligence Profile from its title and variant,
then links it to its human owner with `variant="assistant"`. The personal
Profile is provisioned by authentication and cannot be duplicated through this
POST route. Account identity and personal settings select the `default` link;
the project selector requests artificial-intelligence Profiles.

The private owner role also grants GET of the current Subject record by its
concrete ID, so standard SPS readers can load that record without access to the
Subject collection.

Sign-in methods use `GET /api/rbac/subjects/:id/identities`. An owner check
protects the route, and the authentication flow grants access only to the
concrete Subject path. Email and password updates use the corresponding owned
Identity PATCH route. That handler accepts only email or current/new passwords
and returns the saved Identity through its output schema; it never echoes
submitted passwords. Forms use the loaded Identity data and do not query the
general Identity collection again.

Personal Profile saves and avatar reads/uploads use concrete owner routes.
The avatar reader returns only the selected Profile's file and relation.
RBAC passes that file into the Social Profile avatar view, so account controls
do not need access to general file or relation collections. Profile, Identity
and avatar mutations patch their acting client's caches and retain WebSocket
invalidation. Successful email and password edits close their dialogs. Account data
updates without a page reload.

The Subject project list has distinct pending, error, empty and populated
states. An empty successful response displays the creation form and a navbar
Create project action. Errors display a retry action. Studio includes Loading
and Empty stories for both the Subject selector and the creation page.

Creating an artificial-intelligence Profile through the Subject collection also
creates Brief.md, Strategy.md, Brand.md, Design.md and Products.md in its Chat,
in Studio Workspace review order. The form supplies only the project title and
Profile variant; the backend provisions the documents and the workspace opens
Brief.md first. Read operations do not initialize documents.

The Subject-owned `metadata.aiChatDocument` contract has `key`, `profileId` and
`sourceIds`. Only the five predefined keys identify document Threads. A
presentation variant or title cannot mark a conversation as a document. Each
document displays only its listed Sources from the selected project Profile.
Source attachment preserves the document key and other Thread metadata.

The document Source list includes one development handoff for the whole saved
document. It uses the same scoped, linked Sources and Thread filename as the
Markdown export. Copying places instructions on the clipboard; the user reviews
the text, saves any notes to include, exports the document and attaches it to a
coding agent separately. Unsaved editor notes and unconfirmed chat proposals
are excluded from the saved export. The action is disabled when the saved
document has no effective text or its read is unavailable. Saved-record changes
reset copy feedback and discard stale clipboard completions. The Framework
link retains the current locale. Source editing, proposal confirmation and the
download flow retain their existing owners and behavior.

Ordinary Threads show messages and the composer across the workspace width.
They have no Knowledge editor, export action or document context selector. The
assistant can still retrieve saved Knowledge from the project Profile. Sidebar
Documents are ordered separately from ordinary Threads. Documents belonging to
another Profile in the same Chat remain in that Profile’s workspace.

The document service can initialize an existing web project explicitly while
preserving its identified Products.md Thread and Source IDs. Repeating it reuses
the same documents. Additional document relations use `variant="ai-chat"`;
the Chat’s single primary relation retains `variant="default"`.

### OpenRouter decisions and automatic replies

OpenRouter admission checks the sum of all Subject balance relations in each
accepted currency. A new request needs at least the one-token reservation;
zero and negative totals are rejected before model selection or generation.
Billing debits one stable balance row with a conditional write and rereads the
total after a competing write, so concurrent requests cannot reserve the same
last token. Exact provider usage is settled after the response. That final cost
can exceed the reservation and leave a negative total; further requests remain
blocked until the total covers a new reservation.

Agent persists an insufficient-tokens reply in the requesting Chat or Thread,
marked as system traffic excluded from model context. Web AI Chat receives the
reply without a Telegram premium keyboard. Telegram retains its premium flow.

Creating an AI Chat assistant also creates and links five separate document
Skills from `libs/shared/utils/src/lib/constants/ai-chat-skill-templates.ts`.
Commands include the assistant profile ID; descriptions are independent for
each assistant. No shared Skill rows need to be seeded before project creation.
Failed Skill setup removes that attempt's records and the new profile before
chat creation. Document message creation resolves the linked profession on the
server and stores its actual command and ID. Ordinary threads activate a
profession only when explicitly requested.

`react-by/openrouter` selects from the local catalogue in
`libs/shared/utils/src/lib/constants/open-router-models.ts`. Its only answering
model is `openai/gpt-6.1-sol`, with `high` reasoning for text, coding, and
image/file analysis. The same policy restricts manual selection and the
composer's model list. A single candidate needs no model-selection API call.
The selection flow supports Jev Decisions when multiple candidates are enabled.
GPT 6.1 Sol returns text through OpenRouter; automatic image-generation requests
receive an unavailable notice without a generation call.

Task and Knowledge intent detection, passage reranking, tool-group selection,
and linked Skill selection use `typesafe/jev-1.13` through OpenRouter's
`/api/alpha/decisions` endpoint and the same OpenRouter API key. Passage relevance
selects up to twelve useful chunks from the profile-scoped retrieval results.
Candidate passages are evaluated in byte-bounded batches to fit JEV context
limits without truncating the source passages.
Failed reranking retains retrieval order; failed capability selection retains
the allowed catalog. Decisions usage and the actual answering model's cost are
recorded in the existing billing ledger.

Natural-language requests can read, create, or supplement profile Knowledge
without a control mention. `/learn`, `@knowledge`, and explicit Skills remain
available. The native create tool supports the first Source and imports the
current message's attached files. Editing reads the Source first, preserves
other user notes, and checks its `contentHash` before saving. Source and file
analysis continue through Knowledge services and framework relations.

Knowledge create and edit tools can wait up to four minutes for analysis and
indexing, within the tool loop's five-minute total deadline. Other tools retain
the default thirty-second limit. New imports receive the current attachment
names and instructions to base titles and notes on the current user input.
An expired wait does not cancel an operation; check saved state before retrying.

JEV chooses among available capabilities. Backend profile scope, allowed MCP
servers, and tool argument validation continue to determine access. A routing
decision does not execute a mutation.

### Thread context and exact working drafts

AI Chat and Telegram use `socialModuleProfileAiContextCreate` on the public
Subject service. `createSocialModuleProfileAiContextService` is the protected
factory for startup overrides. Its `IAiContextService` return contract permits
project implementations without inheriting internal state. Social supplies persisted messages and generic
Thread metadata; RBAC owns the versioned `rbacAiThreadContext` contract, with a
separate state for each replying Profile.

`RBAC_AI_CONTEXT_MODE=full|compact` controls assembly. The default is `full`:
the final-code trial has eleven complete pairs, with 80.52% lower Credits in
compact. All twelve compact tasks passed; the full visual task was stopped by
the $5 budget reservation guard. Complete that pair before enabling compact.
The trial and activation decision are in
[the experiment report](../../../../../thoughts/shared/research/singlepagestartup/2026-10-14-ai-chat-context-experiment.md).

In `compact`, the last three completed user/assistant exchanges and the current
request retain their exact text. Older history is summarized when unsummarized
text reaches 8,000 estimated tokens. Each summary call processes at most 16,000
estimated text tokens, requests at most 2,048 output tokens, and aims for a
1,000-token summary. Unprocessed messages stay in the request. The normal
request budget is 12,000 estimated tokens, including instructions and tool
schemas; initial Knowledge excerpts use up to 3,000. An exact document or
unsummarized history can exceed that soft budget. The model's physical window
produces a request to work on a document section, without cutting its text.

Text estimates use `js-tiktoken`, `o200k_base`, and a 20% margin. Original media
parts are counted separately; this estimate does not predict image token usage.
Provider usage, cache and reasoning tokens remain in billing. Summary calls
have `purpose=context_summary`. Reply metadata records context estimates,
media counts, fallback and overflow reasons, assembly time and response time;
it contains no private prompt text.

Memory publication checks the processed history fingerprint and atomically
compares the previous namespace value. Concurrent writes to other namespaces or
other Profiles are preserved. Invalid state versions, edited messages or files,
changed Source hashes, invalid summaries and repeated conflicts retain the
original history. `/new` discards conversation memory and ordinary working
drafts after that marker; saved Knowledge and document proposals keep their
existing behavior.

`profile_thread_history_read` finds and paginates original messages in the
current thread snapshot. `profile_thread_attachment_read` adds an original
image/file to the next model step. Historical files are labeled as historical;
the current Source's Files tool remains authoritative for its attachments.
Older media is represented by names and IDs during compact text requests.

`profile_thread_draft_stage` stores a complete exact ordinary-chat or Telegram
draft with its hash and file references. Updates require the current draft hash.
The server displays the stored text, and subsequent prompts pin it independently
of summaries. This operation does not write Knowledge. Document threads retain
the exact `rbacAiDocumentProposal`, its original Source hash and confirmation
state through the existing proposal service. Pending proposals with
`confirmationMessageId` have claimed confirmation: reject/revise returns
`applying`, and a later confirm can finish a save after an interrupted request.
See [Knowledge confirmation semantics](../../../knowledge/README.md) for
conditional writes, attachment checks and partial failures.

Stable thread/Profile sessions group answering, summary and JEV requests in
OpenRouter. Initial and tool-triggered Knowledge search passes that session to
embedding requests through `x-session-id`. Persistent instructions precede
changing Knowledge fragments and conversation state.

### Internal Identity and checkout calls

Identity credential updates require a user JWT matching the Subject route and
exactly one Subject–Identity relation. The exported
`RequestSubjectOwnsIdentity` middleware checks both identifiers before the
handler reads or changes credentials. A privileged secret alone does not satisfy
this route. The handler calls the injected Identity service and applies its
output schema to the saved record.

Document message creation resolves its profession through the public
`socialModuleProfileDocumentSkillFind` Subject method. Its protected factory
permits startup specialization; controllers do not construct ProfileSkills.

`ecommerceProductCheckout` creates the Product checkout graph and delegates to
`ecommerceOrderCheckout`, which performs payment checkout and retains its
compensation behavior. The Product HTTP handler and both order-renewal paths use
the same public capability. Authentication and Telegram initial-Free grants use
a separate direct-Service transaction for the zero-price graph and settlement.
That operation grants 3000 credits once, rejects an ambient outer transaction
and dispatches effects after its own commit. It does not invoke HTTP checkout
or renew the Free allowance. The public HTTP checkout retains its Subject JWT ownership
check. Proceed receives a deferred DI callback so resolving Subject and Proceed
does not form a constructor cycle, and startup Subject methods remain effective.

The extracted Product service retains model and relation SDK mutations. Their
API middleware bumps HTTP-cache generations before publishing WebSocket events,
including when renewal starts from a global/scoped check or another service.
The outer Product checkout route's `ecommerce.checkout` topic does not replace
those mutation effects.

### CRM submissions

The Subject CRM Request endpoint requires the user JWT to match the Subject ID,
including when a privileged secret is present. Global route permissions govern
the selected Form endpoint; Form has no Subject/tenant ownership field. The
service validates that each submitted Step, Input and Option belongs to that
Form, using the current linked definitions.

Controllers call `crmModuleFormRequestCreate`; its protected factory permits
startup specialization. The service resolves notification configuration before
writing, delegates the atomic Request/association command to CRM Request service,
then delivers the server-assembled multi-Step payload after commit. The typed
SDK response distinguishes a saved Request from notification readiness. Repeated
submission IDs return the same saved receipt and do not resend notifications.

### Public session compositions

The public Subject registry owns the me-authentication, me-CRM, me-Social and
me-Ecommerce wrappers previously composed by Host. These variants resolve the
current Subject internally; callers pass product/form/chat UI inputs through
the public component rather than importing Host implementation paths.

`me-ecommerce-module-product-card-default`,
`me-ecommerce-module-product-overview-default` and
`me-ecommerce-module-product-cart-row-default` compose Ecommerce Product presentation with scoped
cart/checkout actions. Their files live under
`frontend/component/src/lib/singlepage/me/ecommerce-module/product/`.
Each `index.tsx` binds the shared reader parent and the local `client.tsx` /
`server.tsx`. The local readers reuse `authenticationMe` and supply the current
Subject as `data`. The loaded view passes that Subject to cart/checkout actions
with `dataSource="props"`; the actions do not fetch the Subject again.
If the first server request has no session cookie, its fallback mounts the
client reader to observe browser session initialization. That fallback receives
UI inputs and no server request headers.
Cached Host catalog and navbar compositions mount these `me` entrypoints with
`isServer={false}` while public catalog reads stay on the server. The session
server readers support request-rendered routes; cookies cannot personalize
an ISR page shared between users.
Foreign records are `ecommerceModuleProduct`, `ecommerceModuleStore` and
`ecommerceModuleOrder`. Product presentation keeps its JSX slots and has no
RBAC import. `me-navigation-controls-ai-chat` owns the session, project selector
and account controls; it receives explicit Social IDs and `settingsSelected`.

Public Product details also use the Subject registry:
`ecommerce-module-product-category-default` and
`ecommerce-module-product-profile-default` accept `ecommerceModuleProductId`
and `language`. Categories use the ordinary filtered CategoriesToProducts and
Category components. Profiles use Social's allowlisted `authorFind` SDK and
public author bylines. These variants have no current-Subject read and support
server rendering before session initialization. Product cards, overviews and
RBAC Widgets select them through the public Subject component; they do not
import private helpers from `me/.../card-default`.

Current-Subject variants are grouped under `singlepage/me/` by module, model
and operation. Public variant strings remain stable when folders move; callers
use the public Subject registry.

The `me-blog-module-article-private-content-default` variant accepts an explicit
blogModuleArticle and language. Its client view owns the authorization wrapper
and reads ordered content through the current-Subject content SDK. Blog Widgets
receive the rendered operation through a typed slot; this Subject variant
receives no routing map.

### Authorized Chat participants

The Subject Chat detail operation accepts `params.includeParticipants: true`.
It checks the owned Profile and its Chat membership before adding participant
Profiles to the response, within one consistent read snapshot. The default
Chat row and overview use this projection rather than generic Social relation
or Profile requests. Participant changes invalidate the tracked Chat response.

The `social-module-profile-find` render-reader returns the current Subject's
Profiles. Its optional `params.socialModuleChatId` restricts them to membership
in that Chat; the existing administrator fallback retains only the administrator's
own Profiles. The ordinary Chat overview chooses one allowed identity before
loading details. SDK query identity includes parameters, API host and principal.
No additional public permissions or relation graph are needed.

### Current-Subject chat readers

The two `me-social-module-profile-chat-*-default` entrypoints use the shared
reader parent and local client/server session readers. Their loaded views
compose the owned Profile reader and the scoped Chat operation. Interactive
views receive explicit Subject and Social resource props; they do not repeat
session initialization.

`socialModuleProfileFindByIdChatFind` accepts `includeSubjectProfiles` and
`includeParticipants`. Subject expansion validates the requested owned Profile,
collects all owned Profile memberships, deduplicates Chat IDs and reads one
collection. Administrative scope uses the existing Chat lifecycle role check.
Participant expansion runs in bulk after access validation. Query identity
includes these parameters, API host and current principal. A loaded list row
uses `dataSource="props"` and retains the parent collection subscription.

Profile-scoped Knowledge reads retain the current Subject ID when resolving a
target Profile in a Chat. An ordinary requester must participate; the existing
administrative Chat scope may read without joining. The target Profile must
still belong to that Chat and each Source must belong to the target Profile.
Membership denial is a permission error, rather than an expired session.

### Article widget access example

The me-blog-module-article-private-content-default frontend variant checks the
current client's permission for the article-widget relation before mounting its
readers. Without permission it shows the subscription presentation. Authorized
readers load the Article's relations through their ordinary SDK and render each
saved variant, including private. This is a presentation example; ordinary
resource APIs and managed files have no article-graph policy.

Private article delivery through a dedicated Subject operation is outside this
example. The previous graph, global content/byte guards and scoped content SDK
have been removed. Generic RBAC and ownership guards remain in force.

The operator-only maintenance operation
`POST /api/rbac/subjects/:id/ecommerce-module/orders/:ecommerceModuleOrderId/subscription-period/freeze`
uses SDK `ecommerceModuleOrderFreezeSubscriptionPeriod`. It accepts an expected
stored update timestamp, verifies the exact owned Order and current complete
Product Roles, and delegates period freezing to Ecommerce. Callers cannot
supply arbitrary period timestamps.

### Shared account menu and cart

`me-account` resolves the current session and delegates its authenticated view to
`me-account-ai-chat`, so public pages and AI Chat use the same profile, token
balance and account actions. Its guest link uses `/ai-chat/sign-in`.

The cart drawer uses compact Product rows and totals from the authorized
`includeCartDetails` response. Quantity controls update one exact order line
through the Subject SDK, then invalidate that Subject’s order collection.
Pending state and failures remain within the changed line; payment links are
shown only after checkout returns them.
