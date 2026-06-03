# Social Module

## 1. Purpose of the Module

The Social module manages profiles, chats, messages, and related social interactions. It defines social content models and the relations that connect them to media, ecommerce items, and website-builder widgets.

### It solves the following tasks:

- Stores social profiles with localized content.
- Defines chats, threads, and messages.
- Stores reusable AI skills for transcript-to-content workflows.
- Attaches files and widgets to social entities.
- Links social content to ecommerce products.

### Typical use cases:

- Profile pages and social feeds.
- Chat and messaging interfaces.
- Profile-scoped transcript processing through selected AI skills.
- Profile-scoped Knowledge/RAG chats through `chat.variant="knowledge"`.
- Social features tied to ecommerce products.

---

## 4. Knowledge Chat Variant

`social.chat.variant="knowledge"` is the explicit switch for profile-scoped Knowledge/RAG behavior. In this mode, agent profiles with `variant="artificial-intelligence"` and slugs like `chat-gpt-*` reply through the RBAC Knowledge reaction endpoint instead of the default OpenRouter flow.

Users can send `/learn` in the existing chat UI to add the current message text and supported text/markdown attachments to the replying AI profile's Knowledge base. The resulting Knowledge documents are linked only to that AI profile through `profiles-to-knowledge-module-documents`, indexed into embeddings by the Knowledge module, and later used only when that same profile answers questions in Knowledge chats.

`default` and `telegram` chat variants keep the existing non-RAG behavior.

## 2. Models

| Model                                             | Purpose                 |
| ------------------------------------------------- | ----------------------- |
| [action](./models/action/README.md)               | Social action records   |
| [attribute](./models/attribute/README.md)         | Typed social attributes |
| [attribute-key](./models/attribute-key/README.md) | Attribute metadata      |
| [chat](./models/chat/README.md)                   | Chat containers         |
| [message](./models/message/README.md)             | Message content         |
| [profile](./models/profile/README.md)             | Social profiles         |
| [skill](./models/skill/README.md)                 | AI skill instructions   |
| [thread](./models/thread/README.md)               | Chat threads            |
| [widget](./models/widget/README.md)               | Social UI widgets       |

---

## 3. Relations

| Relation                                                                                                       | Purpose                           |
| -------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| [attribute-keys-to-attributes](./relations/attribute-keys-to-attributes/README.md)                             | Link attribute keys to attributes |
| [chats-to-actions](./relations/chats-to-actions/README.md)                                                     | Link chats to actions             |
| [chats-to-messages](./relations/chats-to-messages/README.md)                                                   | Link chats to messages            |
| [chats-to-threads](./relations/chats-to-threads/README.md)                                                     | Link chats to threads             |
| [messages-to-file-storage-module-files](./relations/messages-to-file-storage-module-files/README.md)           | Attach files to messages          |
| [profiles-to-actions](./relations/profiles-to-actions/README.md)                                               | Link profiles to actions          |
| [profiles-to-attributes](./relations/profiles-to-attributes/README.md)                                         | Link profiles to attributes       |
| [profiles-to-chats](./relations/profiles-to-chats/README.md)                                                   | Link profiles to chats            |
| [profiles-to-ecommerce-module-products](./relations/profiles-to-ecommerce-module-products/README.md)           | Link profiles to products         |
| [profiles-to-file-storage-module-files](./relations/profiles-to-file-storage-module-files/README.md)           | Attach files to profiles          |
| [profiles-to-knowledge-module-documents](./relations/profiles-to-knowledge-module-documents/README.md)         | Link profiles to knowledge docs   |
| [profiles-to-messages](./relations/profiles-to-messages/README.md)                                             | Link profiles to messages         |
| [profiles-to-skills](./relations/profiles-to-skills/README.md)                                                 | Link profiles to available skills |
| [profiles-to-website-builder-module-widgets](./relations/profiles-to-website-builder-module-widgets/README.md) | Attach widgets to profiles        |
| [threads-to-ecommerce-module-products](./relations/threads-to-ecommerce-module-products/README.md)             | Link threads to products          |
| [threads-to-messages](./relations/threads-to-messages/README.md)                                               | Link threads to messages          |

---
