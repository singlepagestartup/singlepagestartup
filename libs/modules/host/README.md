# Host Module

## 1. Purpose of the Module

The Host module serves as the core of the project, acting as the central hub that connects and orchestrates all other modules. It manages the structure and display of content across the project.

### It solves the following tasks:

- Manages page structure and layout (`page`, `layout`)
- Handles metadata for SEO and page information (`metadata`)
- Provides widget management and display (`widget`)
- Connects external widgets from other modules (`widgets-to-external-widgets`)
- Organizes content hierarchy and relationships

---

## 2. Models

| Model                                   | Purpose                                       |
| --------------------------------------- | --------------------------------------------- |
| [layout](./models/layout/README.md)     | Defining page layouts and templates           |
| [metadata](./models/metadata/README.md) | Handling SEO and page metadata                |
| [page](./models/page/README.md)         | Managing website pages and their structure    |
| [widget](./models/widget/README.md)     | Widget placement containers and configuration |

---

## 3. Relations

| Relation                                                                         | Purpose                                      |
| -------------------------------------------------------------------------------- | -------------------------------------------- |
| [layouts-to-widgets](./relations/layouts-to-widgets/README.md)                   | Connect layouts to widgets and order them    |
| [pages-to-layouts](./relations/pages-to-layouts/README.md)                       | Connect pages to layouts and order them      |
| [pages-to-metadata](./relations/pages-to-metadata/README.md)                     | Connect pages to metadata entries            |
| [pages-to-widgets](./relations/pages-to-widgets/README.md)                       | Connect pages to widgets and order them      |
| [widgets-to-external-widgets](./relations/widgets-to-external-widgets/README.md) | Link host widgets to external module widgets |

---

## Use cases

- Creating and managing project pages
- Defining page layouts and structures
- Managing SEO metadata
- Displaying widgets and content
- Integrating content from other modules
- Building complex page hierarchies

### Publishing content widgets:

Host widgets are containers and pointers. They do not store content themselves. To render content on a page, you must connect a `host` widget to an external widget (for example, `website-builder`).

Step-by-step:

1. Create the content widget in its source module
   (for example, `website-builder` -> `widget`).
2. Create a `host` -> `widget` (container/slot).
3. Link them via `widgets-to-external-widgets`:
   - `hostWidgetId` = id of the host widget
   - `externalModule` = "website-builder" (or other module)
   - `externalWidgetId` = id of the content widget
4. Attach the host widget to a page via `pages-to-widgets`.

If you only create a Host widget, nothing will render because it has no
external content connected.

### External widget sources:

You can connect host widgets to content widgets from these modules:

- `analytic`
- `billing`
- `blog`
- `broadcast`
- `crm`
- `ecommerce`
- `file-storage`
- `notification`
- `rbac`
- `social`
- `startup`
- `website-builder`

### The problem it solves:

Provides a unified system for managing and displaying content from various modules, ensuring consistent structure and organization across the project while maintaining flexibility and extensibility.
