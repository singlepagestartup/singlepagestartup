# Social Module

## 1. Purpose of the Module

The Social module manages profiles, chats, messages, and related social interactions. It defines social content models and the relations that connect them to media, ecommerce items, and website-builder widgets.

### It solves the following tasks:

- Stores social profiles with localized content.
- Defines chats, threads, and messages.
- Attaches files and widgets to social entities.
- Links social content to ecommerce products.

### Typical use cases:

- Profile pages and social feeds.
- Chat and messaging interfaces.
- Social features tied to ecommerce products.

---

## 2. Models

| Model                                             | Purpose                 |
| ------------------------------------------------- | ----------------------- |
| [action](./models/action/README.md)               | Social action records   |
| [attribute](./models/attribute/README.md)         | Typed social attributes |
| [attribute-key](./models/attribute-key/README.md) | Attribute metadata      |
| [chat](./models/chat/README.md)                   | Chat containers         |
| [message](./models/message/README.md)             | Message content         |
| [profile](./models/profile/README.md)             | Social profiles         |
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
| [profiles-to-messages](./relations/profiles-to-messages/README.md)                                             | Link profiles to messages         |
| [profiles-to-website-builder-module-widgets](./relations/profiles-to-website-builder-module-widgets/README.md) | Attach widgets to profiles        |
| [threads-to-ecommerce-module-products](./relations/threads-to-ecommerce-module-products/README.md)             | Link threads to products          |
| [threads-to-messages](./relations/threads-to-messages/README.md)                                               | Link threads to messages          |

---
