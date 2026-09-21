# RBAC Subject Model

## Purpose

Subjects represent authenticated users or actors, and connect identities, roles, and application-specific flows.

## Layering Boundary

- RBAC subject is the orchestration layer for authenticated ecommerce cart/product flows.
- Frontend variants such as `me-ecommerce-module-product-cart-default`, `me-ecommerce-module-product-checkout-default`, and `me-ecommerce-module-cart-default` are the supported entry points for host/cart behavior.
- Dependency direction is one-way: `rbac > ecommerce`. RBAC may compose ecommerce SDK/components; ecommerce must not import RBAC subject implementation.

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

### Social Thread Permission Routes

Thread management through `rbac.subject` requires `rbac.permission` records for the HTTP routes and route-level subject/chat/thread middleware for resource checks:

- `GET /api/rbac/subjects/[rbac.subjects.id]/social-module/chats/[social.chats.id]/threads`
- `POST /api/rbac/subjects/[rbac.subjects.id]/social-module/chats/[social.chats.id]/threads`
- `PATCH /api/rbac/subjects/[rbac.subjects.id]/social-module/chats/[social.chats.id]/threads/[social.threads.id]`
- `DELETE /api/rbac/subjects/[rbac.subjects.id]/social-module/chats/[social.chats.id]/threads/[social.threads.id]`

## Authentication API

- `GET /rbac/subjects/authentication/init`: initialize anonymous/authenticated session tokens.
- `GET /rbac/subjects/authentication/me`: get current subject from JWT.
- `POST /rbac/subjects/authentication/refresh`: refresh JWT/refresh pair.
- `POST /rbac/subjects/authentication/logout`: logout current session.
- `POST /rbac/subjects/authentication/email-and-password/authentication`: login by email+password.
- `POST /rbac/subjects/authentication/email-and-password/registration`: register by email+password.
- `POST /rbac/subjects/authentication/email-and-password/forgot-password`: request reset code.
- `POST /rbac/subjects/authentication/email-and-password/reset-password`: reset password by code.
- `POST /rbac/subjects/authentication/ethereum-virtual-machine/nonce`: issue the single-use EIP-4361 message a wallet must sign.
- `POST /rbac/subjects/authentication/ethereum-virtual-machine`: EVM signature login over that message.
- `POST /rbac/subjects/authentication/oauth/{provider}`: start OAuth flow (`google`).
- `GET /rbac/subjects/authentication/oauth/{provider}/callback`: OAuth provider callback.
- `POST /rbac/subjects/authentication/oauth/exchange`: exchange one-time code to JWT/refresh.

## Wallet Login Configuration

- `RBAC_EVM_NONCE_LIFETIME_IN_SECONDS`: challenge TTL, and the upper bound on the age of `Issued At` in a signed message (default `120`).
- `RBAC_EVM_MAX_CLOCK_SKEW_IN_SECONDS`: how far ahead of the server a wallet clock may be (default `0`, so a future-dated message is refused).
- `RBAC_EVM_LEGACY_TIMESTAMP_MESSAGE`: compatibility knob, default `false`. Wallet login signs a message the server issued; set this to `true` for one release if a project client still signs a bare millisecond timestamp. The lower bound applies on that path too, so a future-dated timestamp is refused either way.
- `RBAC_EVM_RPC_URL`: RPC endpoint used for signature verification (default empty, which keeps viem's chain default, a public endpoint).
- `RBAC_EVM_RPC_TIMEOUT_IN_MILLISECONDS`: deadline for that call (default `5000`).

## Wallet Login Rules

- The client asks the nonce route for a challenge, the wallet signs the returned message unchanged, and the client posts `{ address, message, signature }` back. The message is never assembled in the browser.
- The challenge is an `rbac.action` row (`evm-nonce`) bound to the address, the chain and the purpose (`authentication` or `link`), with an explicit `expiresAt`. It is claimed by a conditional update (`POST /rbac/actions/{id}/consume`) whose predicate covers the row type, the unconsumed mark and the expiry, so two requests holding the same nonce cannot both proceed.
- Verification order: parse, domain and URI, `Issued At` bounded in both directions, address, signature, then the claim. No token is signed and no identity is written before the claim succeeds.
- The identity-linking route `POST /rbac/subjects/{uuid}/identities` uses the same verifier with `purpose: "link"`, and its ownership check is the `RequestSubjectIdOwner` route middleware.
- A project that signs in on another origin, or wants another message template, overrides `getAuthenticationEthereumVirtualMachineNonceService()` and `getAuthenticationEthereumVirtualMachineVerifyService()` in the `startup` service layer.

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
Knowledge document relations; it allows the `singlepagestartup` MCP server and
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
only explicitly bracketed requester profile, chat, and Knowledge document ids
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

Linked Skills and Knowledge documents accept bounded `limit` and `offset`
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

## Variants

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
