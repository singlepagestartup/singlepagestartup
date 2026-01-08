# Blog Module

## 1. Purpose of the Module

The Blog module manages long-form content, categories, and widgets that present articles in different layouts. It defines the content data for articles and categories and the relations that connect them to media, website-builder widgets, and ecommerce products.

### It solves the following tasks:

- Stores localized article and category content.
- Provides slug-based routing metadata for blog pages.
- Attaches files and widgets to articles and categories.
- Builds widget-driven layouts for article/category lists.
- Connects content to ecommerce products for cross-promotions.

### Typical use cases:

- Publishing articles and category pages.
- Building blog landing pages with curated lists.
- Attaching media to articles.
- Embedding website-builder sections inside blog content.
- Linking blog content to ecommerce product listings.

---

## 2. Models

| Model                                   | Purpose                                       |
| --------------------------------------- | --------------------------------------------- |
| [article](./models/article/README.md)   | Blog content entries with localized text      |
| [category](./models/category/README.md) | Grouping for articles and category pages      |
| [widget](./models/widget/README.md)     | Layout widgets for article and category lists |

---

## 3. Relations

| Relation                                                                                                           | Purpose                                      |
| ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| [articles-to-ecommerce-module-products](./relations/articles-to-ecommerce-module-products/README.md)               | Link articles to ecommerce products          |
| [articles-to-file-storage-module-files](./relations/articles-to-file-storage-module-files/README.md)               | Attach files to articles                     |
| [articles-to-website-builder-module-widgets](./relations/articles-to-website-builder-module-widgets/README.md)     | Attach website-builder widgets to articles   |
| [categories-to-articles](./relations/categories-to-articles/README.md)                                             | Assign articles to categories                |
| [categories-to-website-builder-module-widgets](./relations/categories-to-website-builder-module-widgets/README.md) | Attach website-builder widgets to categories |
| [widgets-to-articles](./relations/widgets-to-articles/README.md)                                                   | Curate article lists inside widgets          |
| [widgets-to-categories](./relations/widgets-to-categories/README.md)                                               | Curate category lists inside widgets         |

---
