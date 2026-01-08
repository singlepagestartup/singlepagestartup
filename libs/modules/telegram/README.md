# Telegram Module

## 1. Purpose of the Module

The Telegram module stores Telegram-specific pages and widgets and connects them to external widgets.

### It solves the following tasks:

- Defines Telegram pages and their widget layout.
- Stores Telegram widget content.
- Links Telegram widgets to external module widgets.

### Typical use cases:

- Telegram bot page composition.
- Embedding website-builder widgets inside Telegram pages.

---

## 2. Models

| Model                               | Purpose                 |
| ----------------------------------- | ----------------------- |
| [page](./models/page/README.md)     | Telegram page metadata  |
| [widget](./models/widget/README.md) | Telegram widget content |

---

## 3. Relations

| Relation                                                                         | Purpose                                   |
| -------------------------------------------------------------------------------- | ----------------------------------------- |
| [pages-to-widgets](./relations/pages-to-widgets/README.md)                       | Link pages to widgets                     |
| [widgets-to-external-widgets](./relations/widgets-to-external-widgets/README.md) | Link Telegram widgets to external widgets |

---
