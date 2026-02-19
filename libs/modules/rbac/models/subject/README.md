# RBAC Subject Model

## Purpose

Subjects represent authenticated users or actors, and connect identities, roles, and application-specific flows.

## Authentication API

- `GET /rbac/subjects/authentication/init`: initialize anonymous/authenticated session tokens.
- `GET /rbac/subjects/authentication/me`: get current subject from JWT.
- `POST /rbac/subjects/authentication/refresh`: refresh JWT/refresh pair.
- `POST /rbac/subjects/authentication/logout`: logout current session.
- `POST /rbac/subjects/authentication/email-and-password/authentication`: login by email+password.
- `POST /rbac/subjects/authentication/email-and-password/registration`: register by email+password.
- `POST /rbac/subjects/authentication/email-and-password/forgot-password`: request reset code.
- `POST /rbac/subjects/authentication/email-and-password/reset-password`: reset password by code.
- `POST /rbac/subjects/authentication/ethereum-virtual-machine`: EVM signature login.
- `POST /rbac/subjects/authentication/oauth/{provider}`: start OAuth flow (`google`).
- `GET /rbac/subjects/authentication/oauth/{provider}/callback`: OAuth provider callback.
- `POST /rbac/subjects/authentication/oauth/exchange`: exchange one-time code to JWT/refresh.

## OAuth Configuration

- `RBAC_OAUTH_GOOGLE_CLIENT_ID`: Google OAuth client id.
- `RBAC_OAUTH_GOOGLE_CLIENT_SECRET`: Google OAuth client secret.
- `RBAC_OAUTH_GOOGLE_REDIRECT_URI`: optional explicit callback URI (fallback is `${API_SERVICE_URL}/api/rbac/subjects/authentication/oauth/google/callback`).
- `RBAC_OAUTH_SUCCESS_REDIRECT_PATH`: host path used after successful callback/exchange handoff (default `/`).
- `RBAC_OAUTH_STATE_LIFETIME_IN_SECONDS`: OAuth state TTL (default `600`).
- `RBAC_OAUTH_EXCHANGE_LIFETIME_IN_SECONDS`: OAuth exchange code TTL (default `120`).

## OAuth Subject Resolution Rules

- OAuth callback stores temporary data in `rbac.action` records (`oauth-state`, `oauth-exchange`) and marks them as consumed to prevent replay.
- Priority for selecting target subject:

1. Existing `oauth_google` identity by provider account (`account`) and its linked subject.
2. Existing `email_and_password` identity with same verified email and its linked subject.
3. Current authenticated subject from OAuth start JWT (`sourceSubjectId`), if present.
4. New subject creation.

- If OAuth identity is already linked to another subject, login is performed into that already linked subject.
- In `flow=link`, authenticated source subject is required.
- Callback redirects to host with either:

1. `?code=<oauth-exchange-action-id>` on success.
2. `?oauthError=<error-code>` on failure.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `variant`: display variant.
- `slug`: URL-friendly unique identifier.

## Variants

- `default`: renders linked identity email and a profile link.
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
