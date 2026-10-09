# Studio variant names

Status: implementing

Overview displays one record; List displays records within its scope. Nested
folders group purpose, with the AI Chat presentation last. Select items carry
their Select context. Host Page route variants and story IDs identify URLs and
remain route names. Business Products knowledge remains fixture content.

Message owns its list and individual overview. Thread composes that list through
the Message model entry. Subject owns message creation through the Host slot.
Project scope retains mounted state across preview navigation.

## Variant map

| Current model/variant                           | Folder under singlepage                         | Public variant                    |
| ----------------------------------------------- | ----------------------------------------------- | --------------------------------- |
| `social/profile/ai-chat-project`                | `social/profile/project/scope/ai-chat`          | `project-scope-ai-chat`           |
| `social/profile/ai-chat-project-overview`       | `social/profile/project/overview/ai-chat`       | `project-overview-ai-chat`        |
| `social/profile/ai-chat-project-select`         | `social/profile/project/select/ai-chat`         | `project-select-ai-chat`          |
| `social/profile/ai-chat-project-item`           | `social/profile/project/select/item/ai-chat`    | `project-select-item-ai-chat`     |
| `social/profile/ai-chat-sidebar`                | `social/profile/project/sidebar/ai-chat`        | `project-sidebar-ai-chat`         |
| `social/profile/ai-chat-create`                 | `social/profile/project/create/ai-chat`         | `project-create-ai-chat`          |
| `social/profile/ai-chat-settings`               | `social/profile/project/settings/ai-chat`       | `project-settings-ai-chat`        |
| `social/profile/ai-chat-processing`             | `social/profile/project/processing/ai-chat`     | `project-processing-ai-chat`      |
| `social/profile/ai-chat-agent`                  | `social/profile/agent/overview/ai-chat`         | `agent-overview-ai-chat`          |
| `social/profile/ai-chat-agent-avatar`           | `social/profile/agent/avatar/ai-chat`           | `agent-avatar-ai-chat`            |
| `social/profile/ai-chat-agent-select`           | `social/profile/agent/select/ai-chat`           | `agent-select-ai-chat`            |
| `social/chat/ai-chat-overview`                  | `social/chat/overview/ai-chat`                  | `overview-ai-chat`                |
| `social/chat/ai-chat-preview`                   | `social/chat/overview/preview/ai-chat`          | `overview-preview-ai-chat`        |
| `social/chat/ai-chat-navigation`                | `social/chat/list/item/ai-chat`                 | `list-item-ai-chat`               |
| `social/thread/ai-chat-overview`                | `social/thread/overview/ai-chat`                | `overview-ai-chat`                |
| `social/thread/ai-chat-create`                  | `social/thread/create/ai-chat`                  | `create-ai-chat`                  |
| `social/thread/ai-chat-settings`                | `social/thread/settings/ai-chat`                | `settings-ai-chat`                |
| `social/thread/ai-chat-sidebar-item`            | `social/thread/list/item/sidebar/ai-chat`       | `list-item-sidebar-ai-chat`       |
| `social/thread/ai-chat-conversation`            | `social/message/list/ai-chat`                   | `list-ai-chat`                    |
| `social/message/ai-chat-message`                | `social/message/overview/ai-chat`               | `overview-ai-chat`                |
| `social/skill/ai-chat-products`                 | `social/skill/overview/ai-chat`                 | `overview-ai-chat`                |
| `rbac/subject/ai-chat-message-create`           | `rbac/subject/message/create/ai-chat`           | `message-create-ai-chat`          |
| `rbac/identity/ai-chat-login`                   | `rbac/identity/authentication/login/ai-chat`    | `authentication-login-ai-chat`    |
| `rbac/identity/ai-chat-register`                | `rbac/identity/authentication/register/ai-chat` | `authentication-register-ai-chat` |
| `file-storage/file/ai-chat-attachments`         | `file-storage/file/list/attachments/ai-chat`    | `list-attachments-ai-chat`        |
| `file-storage/file/ai-chat-pending`             | `file-storage/file/list/item/pending/ai-chat`   | `list-item-pending-ai-chat`       |
| `file-storage/file/ai-chat-preview`             | `file-storage/file/overview/ai-chat`            | `overview-ai-chat`                |
| `file-storage/file/ai-chat-asset`               | `file-storage/file/list/item/asset/ai-chat`     | `list-item-asset-ai-chat`         |
| `knowledge/source/ai-chat-card`                 | `knowledge/source/overview/ai-chat`             | `overview-ai-chat`                |
| `knowledge/source/ai-chat-document`             | `knowledge/source/overview/document/ai-chat`    | `overview-document-ai-chat`       |
| `knowledge/source/ai-chat-document-link`        | `knowledge/source/list/item/document/ai-chat`   | `list-item-document-ai-chat`      |
| `knowledge/source/ai-chat-download`             | `knowledge/source/download/ai-chat`             | `download-ai-chat`                |
| `ecommerce/order/ai-chat-tokens`                | `ecommerce/order/checkout/tokens/ai-chat`       | `checkout-tokens-ai-chat`         |
| `host/layout/ai-chat`                           | `host/layout/landing/ai-chat`                   | `landing-ai-chat`                 |
| `host/layout/ai-chat-header`                    | `host/layout/service/ai-chat`                   | `service-ai-chat`                 |
| `website-builder/button/ai-chat-header`         | `website-builder/button/header/ai-chat`         | `header-ai-chat`                  |
| `website-builder/buttons-array/ai-chat-header`  | `website-builder/buttons-array/header/ai-chat`  | `header-ai-chat`                  |
| `website-builder/logotype/ai-chat`              | `website-builder/logotype/brand/ai-chat`        | `brand-ai-chat`                   |
| `website-builder/widget/ai-chat-header`         | `website-builder/widget/header/ai-chat`         | `header-ai-chat`                  |
| `website-builder/widget/ai-chat-landing-header` | `website-builder/widget/header/landing/ai-chat` | `header-landing-ai-chat`          |
| `website-builder/widget/ai-chat-footer`         | `website-builder/widget/footer/ai-chat`         | `footer-ai-chat`                  |
| `website-builder/widget/ai-chat-hero`           | `website-builder/widget/hero/ai-chat`           | `hero-ai-chat`                    |
| `website-builder/widget/ai-chat-try`            | `website-builder/widget/try/ai-chat`            | `try-ai-chat`                     |
| `website-builder/widget/ai-chat-continue`       | `website-builder/widget/continue/ai-chat`       | `continue-ai-chat`                |
| `website-builder/widget/ai-chat-help`           | `website-builder/widget/help/ai-chat`           | `help-ai-chat`                    |

## Work

- [x] Move variants, recalculate imports and update registries and metadata.
- [x] Move Conversation to Message List; use same-model private row imports.
- [x] Rename product-specific agent/skill symbols to knowledge names.
- [x] Update tooling, content publisher, asset paths and generated inventory.
- [x] Verify model boundaries, types, tests, Storybook and browser navigation.
- [ ] Publish scoped commits to PR #371 and complete the continuation record.

## Verification

- 291 Studio tests pass, including purpose-first variant names, nested-path correspondence, public model imports and absence of runtime cycles.
- Studio TypeScript, metadata validation, code placement and AI Chat content freshness pass.
- Production Storybook build passes at `/private/tmp/studio-naming-storybook`.
- Browser checks pass for scoped Message List, Working on selection, message sending, New thread name/agent selection and Cancel preserving history, login redirect and landing Widget composition.
- At 320px, document width and scroll width both equal 320px; Send is visible. The viewport override is reset.
- The Message List story is discoverable under Social / Message / Singlepage / list / ai-chat. Browser error logs are empty.
- Screenshot: `/private/tmp/studio-variant-naming.png`.
