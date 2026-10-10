# Social Module

## 1. Purpose of the Module

The Social module manages profiles, chats, messages, and related social interactions. It defines social content models and the relations that connect them to media, ecommerce items, and website-builder widgets.

### It solves the following tasks:

- Stores social profiles with localized content.
- Defines chats, threads, and messages.
- Stores reusable AI skills for transcript-to-content workflows.
- Attaches files and widgets to social entities.
- Links social content to ecommerce products.
- Links profiles to Blog articles for profile-scoped article lists.

### Typical use cases:

- Profile pages and social feeds.
- Chat and messaging interfaces.
- Profile-scoped transcript processing through selected AI skills.
- Profile-scoped Knowledge/RAG chats through `chat.variant="knowledge"`.
- Social features tied to ecommerce products.

---

## 4. Knowledge Chat Variant

Both normal OpenRouter chats and `social.chat.variant="knowledge"` use Sources linked to the replying profile. `/learn` stores message text and all current attachments in one Source, reusing stored Files. RBAC creates `profiles-to-knowledge-module-sources` and origin-message relations. Normal messages search this knowledge only with an explicit `@knowledge` mention; an empty Source scope never becomes global search. Knowledge does not read Social access tables.

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

| Relation                                                                                                       | Purpose                            |
| -------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| [attribute-keys-to-attributes](./relations/attribute-keys-to-attributes/README.md)                             | Link attribute keys to attributes  |
| [chats-to-actions](./relations/chats-to-actions/README.md)                                                     | Link chats to actions              |
| [chats-to-messages](./relations/chats-to-messages/README.md)                                                   | Link chats to messages             |
| [chats-to-threads](./relations/chats-to-threads/README.md)                                                     | Link chats to threads              |
| [messages-to-file-storage-module-files](./relations/messages-to-file-storage-module-files/README.md)           | Attach files to messages           |
| [profiles-to-actions](./relations/profiles-to-actions/README.md)                                               | Link profiles to actions           |
| [profiles-to-attributes](./relations/profiles-to-attributes/README.md)                                         | Link profiles to attributes        |
| [profiles-to-chats](./relations/profiles-to-chats/README.md)                                                   | Link profiles to chats             |
| [profiles-to-ecommerce-module-products](./relations/profiles-to-ecommerce-module-products/README.md)           | Link profiles to products          |
| [profiles-to-blog-module-articles](./relations/profiles-to-blog-module-articles/README.md)                     | Link profiles to Blog articles     |
| [profiles-to-file-storage-module-files](./relations/profiles-to-file-storage-module-files/README.md)           | Attach files to profiles           |
| [profiles-to-knowledge-module-sources](./relations/profiles-to-knowledge-module-sources/README.md)             | Link profiles to Knowledge Sources |
| [profiles-to-messages](./relations/profiles-to-messages/README.md)                                             | Link profiles to messages          |
| [profiles-to-skills](./relations/profiles-to-skills/README.md)                                                 | Link profiles to available skills  |
| [profiles-to-website-builder-module-widgets](./relations/profiles-to-website-builder-module-widgets/README.md) | Attach widgets to profiles         |
| [threads-to-ecommerce-module-products](./relations/threads-to-ecommerce-module-products/README.md)             | Link threads to products           |
| [threads-to-messages](./relations/threads-to-messages/README.md)                                               | Link threads to messages           |

---
