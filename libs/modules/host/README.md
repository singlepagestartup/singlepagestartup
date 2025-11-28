# Host Module

## 1. Purpose of the Module

The Host module serves as the core of the project, acting as the central hub that connects and orchestrates all other modules. It manages the structure and display of content across the project.

### It solves the following tasks:

- Manages page structure and layout (`Page`, `Layout`)
- Handles metadata for SEO and page information (`Metadata`)
- Provides widget management and display (`Widget`)
- Connects external widgets from other modules (`WidgetsToExternalWidgets`)
- Organizes content hierarchy and relationships

### Typical use cases:

- Creating and managing project pages
- Defining page layouts and structures
- Managing SEO metadata
- Displaying widgets and content
- Integrating content from other modules
- Building complex page hierarchies

### The problem it solves:

Provides a unified system for managing and displaying content from various modules, ensuring consistent structure and organization across the project while maintaining flexibility and extensibility.

---

## 2. Models in the Module

| Model    | Purpose                                    |
| -------- | ------------------------------------------ |
| Layout   | Defining page layouts and templates        |
| Metadata | Handling SEO and page metadata             |
| Page     | Managing website pages and their structure |
| Widget   | Managing widget display and configuration  |

---

## 3. Model Relations

| Relation                 | Purpose                                                               |
| ------------------------ | --------------------------------------------------------------------- |
| LayoutsToWidgets         | Many-to-many relation: layouts can contain multiple widgets           |
| PagesToLayouts           | Many-to-many relation: pages can use multiple layouts                 |
| PagesToMetadata          | Many-to-many relation: pages can have multiple metadata entries       |
| PagesToWidgets           | Many-to-many relation: pages can contain multiple widgets             |
| WidgetsToExternalWidgets | Many-to-many relation: widgets can display content from other modules |

---

## 4. Model Specifics

### Page

#### Main fields:

- `id`: unique page identifier
- `title`: page title
- `url`: page URL path
- `description`: page description
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: page display variant
- `className`: CSS class name for styling
- `language`: page language code
- `adminTitle`: title for admin interface
- `slug`: URL-friendly identifier

#### Variants:

- default

### Layout

#### Main fields:

- `id`: unique layout identifier
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: layout display variant
- `title`: layout title
- `className`: CSS class name for styling
- `adminTitle`: title for admin interface
- `slug`: URL-friendly identifier

#### Variants:

- default

### Metadata

#### Main fields:

- `id`: unique metadata identifier
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: metadata display variant
- `title`: metadata title
- `description`: page description for SEO
- `keywords`: SEO keywords
- `author`: content author
- `viewport`: viewport settings
- `opengraphTitle`: Open Graph title
- `opengraphDescription`: Open Graph description
- `opengraphUrl`: Open Graph URL
- `opengraphType`: Open Graph content type
- `opengraphSiteName`: Open Graph site name
- `opengraphLocale`: Open Graph locale
- `twitterCard`: Twitter card type
- `twitterSite`: Twitter site handle
- `twitterCreator`: Twitter creator handle
- `twitterTitle`: Twitter title
- `twitterDescription`: Twitter description
- `twitterUrl`: Twitter URL
- `twitterDomain`: Twitter domain
- `twitterAppCountry`: Twitter app country

#### Variants:

- default

### Widget

#### Main fields:

- `title`: widget title
- `id`: unique widget identifier
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: widget display variant
- `className`: CSS class name for styling
- `adminTitle`: title for admin interface
- `slug`: URL-friendly identifier

#### Variants:

- default

---

## 5. Standardized API for Models

- Models use the standard API endpoints described in Backend Development Standards
- Support for standard CRUD operations and extended operations (`dump`, `seed`, `find-or-create`, `bulk-create`, `bulk-update`) if needed
- Additional endpoints for page rendering and widget integration

---

## 6. Special Notes

- All data fetching is handled strictly through SDK Providers and Relation Components
- Components are structured according to the standard SPS architecture (`ParentComponent` → `ChildComponent`)
- WidgetsToExternalWidgets serves as the main integration point with other modules
- Pages form the basic structure of the website
- Layouts provide consistent visual structure
- Metadata handles SEO and page information
- Integration with all other modules through widgets

---

## Summary

- The description begins with the business purpose
- Accurate model and relation structure
- Covers key data management and frontend implementation features
- Includes comprehensive page and content management capabilities
- Supports flexible page structure and widget integration
- Handles SEO and metadata management
- Serves as the core module connecting all other modules
