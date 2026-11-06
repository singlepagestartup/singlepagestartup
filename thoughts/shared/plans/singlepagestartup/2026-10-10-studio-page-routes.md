# Studio AI Chat Page routes

Status: complete

Host Page folders remain flat. Page variants and Storybook IDs mirror the
model hierarchy in the route. Landing and Help remain `/ai-chat/` and
`/ai-chat/help`.

| Previous Page key                         | Current Page key                                                                  | Current route                                                                          |
| ----------------------------------------- | --------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `ai-chat-projects-new`                    | `ai-chat-social-profiles-create`                                                  | `/ai-chat/social/profiles/create`                                                      |
| `ai-chat-projects-project-id`             | `ai-chat-social-profiles-social-profiles-id`                                      | `/ai-chat/social/profiles/[social.profiles.id]`                                        |
| `ai-chat-projects-project-id-settings`    | `ai-chat-social-profiles-social-profiles-id-settings`                             | `/ai-chat/social/profiles/[social.profiles.id]/settings`                               |
| `ai-chat-projects-project-id-threads-new` | `ai-chat-social-profiles-social-profiles-id-chats-social-chats-id-threads-create` | `/ai-chat/social/profiles/[social.profiles.id]/chats/[social.chats.id]/threads/create` |
| `ai-chat-login`                           | `ai-chat-rbac-subjects-authentication-select-method`                              | `/ai-chat/rbac/subjects/authentication/select-method`                                  |
| `ai-chat-register`                        | `ai-chat-rbac-subjects-authentication-registration`                               | `/ai-chat/rbac/subjects/authentication/registration`                                   |
| `ai-chat-settings`                        | `ai-chat-rbac-subjects-settings`                                                  | `/ai-chat/rbac/subjects/settings`                                                      |
| `ai-chat-tokens`                          | `ai-chat-rbac-subjects-tokens`                                                    | `/ai-chat/rbac/subjects/tokens`                                                        |

The router decodes Profile and Chat IDs independently and supplies them to the
concrete Host Page. Sidebar New thread links include their parent Chat. Profile
providers remain mounted across page changes. Existing knowledge, drafts, files
and history retain their scope. Thread creation displays name and agent selection
with preview-only submission.

Links in model views, account navigation, forms, editable website content and
the product catalog use the same routes. Generated copy, inventories and Page/Figma
bindings follow those sources. Model display variants and Button record IDs remain
independent of these Page names. Production routes are outside this change.

## Verification

- [x] 298 tests across 41 files; TypeScript, metadata/inventory, copy freshness, code placement and scoped diff checks.
- [x] Storybook production build at `/private/tmp/studio-page-routes-storybook`.
- [x] Browser: updated Page names; profile creation/settings/switching; New thread name/agent selection and preview-only submit; Cancel retaining knowledge and draft; login returning to the current profile; registration, account settings, tokens and Help. Return links retain the profile. At 320px the new Thread form has no horizontal overflow and Help closes the navigation menu. Error logs are empty; temporary viewport settings and tabs are cleared.
- [x] Scoped implementation and PR #371 publication; GitHub head and description verified.

Browser evidence: `/private/tmp/studio-page-routes.png`. Check logs use `/private/tmp/studio-page-routes-*.log`.

## Publication

- Local implementation: `9ee9bef7ed646af064152c1c5b2fb7d2e640ce79`.
- Published implementation: `f01cba6f0f58020ebba69a5341547e1039b62a6b` on `codex/ai-chat-ui-review`.
- PR: https://github.com/singlepagestartup/singlepagestartup/pull/371.
- All 136 changed/deleted paths match the checked implementation. The clean publication checkout excludes unrelated production commit `94f63c6a75`; external local work remains preserved.
