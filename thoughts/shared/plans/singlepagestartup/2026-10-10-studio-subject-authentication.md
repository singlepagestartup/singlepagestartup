# Studio Subject authentication

Registration, sign-in, recovery and connected-method actions belong to RBAC
Subject. Identity displays the connected account. Host selects a Subject variant
and handles navigation after local sign-in succeeds.

## Variant map

Paths below are relative to `apps/studio/modules/rbac/`. Keys move from the old
owner to the public Subject entry.

| Previous path                                            | Subject path                                                                        | Previous key                          | Subject key                                                      |
| -------------------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------- | ---------------------------------------------------------------- |
| `identity/singlepage/authentication/login/ai-chat`       | `subject/singlepage/authentication/email-and-password/authentication-form/ai-chat`  | `authentication-login-ai-chat`        | `authentication-email-and-password-authentication-form-ai-chat`  |
| `subject/singlepage/authentication/registration/ai-chat` | `subject/singlepage/authentication/email-and-password/registration-form/ai-chat`    | `authentication-registration-ai-chat` | `authentication-email-and-password-registration-form-ai-chat`    |
| `identity/singlepage/login-default`                      | `subject/singlepage/authentication/email-and-password/authentication-form/default`  | `login-default`                       | `authentication-email-and-password-authentication-form-default`  |
| `identity/singlepage/register-default`                   | `subject/singlepage/authentication/email-and-password/registration-form/default`    | `register-default`                    | `authentication-email-and-password-registration-form-default`    |
| `identity/singlepage/password-reset-default`             | `subject/singlepage/authentication/email-and-password/forgot-password-form/default` | `password-reset-default`              | `authentication-email-and-password-forgot-password-form-default` |
| `identity/singlepage/reset-password-default`             | `subject/singlepage/authentication/email-and-password/reset-password-form/default`  | `reset-password-default`              | `authentication-email-and-password-reset-password-form-default`  |
| `identity/singlepage/account-change`                     | `subject/singlepage/authentication/email-and-password/account-change/default`       | `account-change`                      | `authentication-email-and-password-account-change-default`       |
| `identity/singlepage/provider-connect`                   | `subject/singlepage/authentication/provider-connect/default`                        | `provider-connect`                    | `authentication-provider-connect-default`                        |

## Method composition

Subject `authentication-select-method-default` composes email/password, EVM and
OAuth authorization. `authentication-select-method-ai-chat` supplies the AI Chat
presentation and email form. Each tab stays mounted so drafts and approval state
survive method changes. Tab keys support arrows, Home and End.

EVM `authentication-ethereum-virtual-machine-default` and OAuth
`authentication-oauth-authorization-default` expose idle, authorization,
completion and error states through Controls. Both are local scenarios; no wallet
or provider is contacted. Preview session completion belongs to Subject; Host
owns the destination after success. Credentials and codes are never persisted.

Cross-model calls use the public Subject entry. Within Subject, private sibling
imports keep the dispatcher acyclic. Identity cards receive Subject action slots.
Published login and registration copy follows the email/password form paths.
Moved Figma bindings retain their existing node IDs.

## Verification

- 298 tests across 41 files pass, including model boundaries and runtime import cycles.
- Studio TypeScript, metadata/inventory, content freshness, code placement and Storybook production build pass.
- Browser: empty email/password validation; preserved email through method switching; keyboard tab navigation; EVM/OAuth approval, Cancel and immediate navigation to Products.md; error/retry Controls; ordinary authentication/reset pages; wrong-code and password-mismatch validation; wallet connection preview in account settings.
- The three authentication methods fit the measured 400px viewport without horizontal scrolling.
- Browser error logs are empty. Temporary tab and viewport overrides are cleared; the local Storybook server remains on port 4321.

## Downstream adaptation

Apply the variant map to owned Studio folders, registries, public callers,
Storybook IDs, block/page manifests, Figma code paths/sync keys, copy destinations
and inventory. Preserve owned copy, assets, validation, routes, continuation
callbacks and Figma node IDs. Keep local preview sign-in in Subject and navigation
in Host. Verify the commands and browser scenarios above against owned variants.
Production authentication remains in `libs/modules/rbac/models/subject`.
Historical Figma and runnable migration ledgers retain their recorded snapshots.
