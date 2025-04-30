# Blog Module

## 1. Purpose of the Module

The Blog module is designed to implement a full-fledged content management system (CMS) on a website.

### It solves the following tasks:

- Allows creating, editing, and publishing articles (`Article`)
- Provides content structuring using categories (`Category`)
- Enables attachment of media files (images, documents) to articles
- Supports displaying content on the website through cards, lists, and full-text pages
- Provides widget-based content management (`Widget`)
- Enables integration with website builder module

### Typical use cases:

- Running a corporate blog
- Publishing news and updates
- Building help centers or knowledge bases
- Creating widget-based content sections

### The problem it solves:

Quickly integrating a robust article publishing system into any website without building a blogging engine from scratch.

---

## 2. Models in the Module

| Model    | Purpose                                                |
| -------- | ------------------------------------------------------ |
| Article  | Managing articles: text content, metadata, attachments |
| Category | Managing categories for article grouping               |
| Widget   | Managing widget-based content sections                 |

---

## 3. Model Relations

| Relation                              | Purpose                                                          |
| ------------------------------------- | ---------------------------------------------------------------- |
| ArticlesToFileStorageModuleFiles      | Many-to-many relation: articles can have multiple attached files |
| ArticlesToWebsiteBuilderModuleWidgets | Many-to-many relation: articles can be displayed in widgets      |
| CategoriesToArticles                  | Many-to-many relation: categories aggregates multiple articles   |

---

## 4. Model Specifics

### Article

#### Main fields:

- `id`: unique article identifier
- `className`: custom CSS class name for styling
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: article display variant
- `adminTitle`: title for admin panel
- `slug`: unique URL-friendly identifier
- `title`: article title (multilingual)
- `subtitle`: article subtitle (multilingual)
- `description`: article description (multilingual)

#### Variants:

- default

### Category

#### Main fields:

- `id`: unique category identifier
- `className`: custom CSS class name for styling
- `adminTitle`: title for admin panel
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: category display variant
- `title`: category title (multilingual)
- `subtitle`: category subtitle (multilingual)
- `description`: category description (multilingual)

#### Variants:

- default

### Widget

#### Main fields:

- `id`: unique widget identifier
- `className`: custom CSS class name for styling
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: widget display variant
- `adminTitle`: title for admin panel
- `slug`: unique URL-friendly identifier
- `title`: widget title (multilingual)
- `subtitle`: widget subtitle (multilingual)
- `description`: widget description (multilingual)

#### Variants:

- default
- article-list-default
- article-overview-default
- article-overview-with-private-content-default

---

## 5. Standardized API for Models

- Models use the standard API endpoints described in Backend Development Standards
- Support for standard CRUD operations and extended operations (`dump`, `seed`, `find-or-create`, `bulk-create`, `bulk-update`) if needed

---

## 6. Special Notes

- Related files for an article are loaded using the Relation component `ArticlesToFileStorageModuleFiles`
- Articles belonging to categories are loaded using the Relation component `CategoriesToArticles`
- Widget-based article displays are managed through `ArticlesToWebsiteBuilderModuleWidgets`
- All data fetching is handled strictly through SDK Providers and Relation Components
- Components are structured according to the standard SPS architecture (`ParentComponent` → `ChildComponent`)
- Widgets support various display variants for flexible content presentation

---

## Summary

- The description begins with the business purpose
- Accurate model and relation structure
- Covers key data management and frontend implementation features
- Includes widget-based content management capabilities
- Supports integration with website builder module
