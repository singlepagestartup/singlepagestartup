# Ecommerce Module

## 1. Purpose of the Module

The Ecommerce module is designed to implement a comprehensive e-commerce system within the website.

### It solves the following tasks:

- Manages products and their attributes (`Product`, `Attribute`, `AttributeKey`)
- Handles order processing and management (`Order`)
- Provides store management (`Store`)
- Offers category organization (`Category`)
- Supports widget-based product displays (`Widget`)
- Integrates with payment and file storage systems

### Typical use cases:

- Creating online stores
- Managing product catalogs
- Processing orders
- Handling product attributes and variations
- Building product widgets and displays
- Managing store settings and configurations

### The problem it solves:

Quickly integrating a robust e-commerce system into any website without building complex shopping and inventory management systems from scratch.

---

## 2. Models in the Module

| Model        | Purpose                                     |
| ------------ | ------------------------------------------- |
| Attribute    | Managing product attributes and variations  |
| AttributeKey | Defining attribute types and configurations |
| Category     | Organizing products into categories         |
| Order        | Handling orders and transactions            |
| Product      | Managing products and their details         |
| Store        | Managing store settings and configurations  |
| Widget       | Managing widget-based product displays      |

---

## 3. Model Relations

| Relation                              | Purpose                                                                |
| ------------------------------------- | ---------------------------------------------------------------------- |
| AttributeKeysToAttributes             | Many-to-many relation: attribute keys define multiple attributes       |
| AttributesToBillingModuleCurrencies   | Many-to-many relation: attributes can use multiple currencies          |
| CategoriesToFileStorageModuleFiles    | Many-to-many relation: categories can have multiple files              |
| CategoriesToProducts                  | Many-to-many relation: products can belong to multiple categories      |
| OrdersToBillingModuleCurrencies       | Many-to-many relation: orders can use multiple currencies              |
| OrdersToBillingModulePaymentIntents   | Many-to-many relation: orders can have multiple payment intents        |
| OrdersToFileStorageModuleFiles        | Many-to-many relation: orders can have multiple files                  |
| OrdersToProducts                      | Many-to-many relation: orders can contain multiple products            |
| ProductsToAttributes                  | Many-to-many relation: products can have multiple attributes           |
| ProductsToFileStorageModuleFiles      | Many-to-many relation: products can have multiple files                |
| ProductsToWebsiteBuilderModuleWidgets | Many-to-many relation: products can be displayed in multiple widgets   |
| StoresToAttributes                    | Many-to-many relation: stores can have multiple attributes             |
| StoresToOrders                        | Many-to-many relation: stores can have multiple orders                 |
| StoresToProducts                      | Many-to-many relation: stores can have multiple products               |
| StoresToProductsToAttributes          | Many-to-many relation: stores can have multiple products-to-attributes |
| WidgetsToCategories                   | Many-to-many relation: widgets can display multiple categories         |
| WidgetsToProducts                     | Many-to-many relation: widgets can display multiple products           |
| WidgetsToStores                       | Many-to-many relation: widgets can display multiple stores             |

---

## 4. Model Specifics

### Product

#### Main fields:

- `id`: unique product identifier
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: product display variant
- `type`: product type (one_off, etc.)
- `sku`: unique stock keeping unit
- `title`: product title in multiple languages
- `shortDescription`: brief product description in multiple languages
- `description`: detailed product description in multiple languages

#### Variants

- default

### Order

#### Main fields:

- `id`: unique order identifier
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: order display variant
- `status`: order processing status
- `type`: order type (cart, order, etc.)
- `receipt`: order receipt details
- `comment`: additional order notes

#### Variants

- default

### Store

#### Main fields:

- `id`: unique store identifier
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: store display variant
- `adminTitle`: title for admin interface
- `slug`: URL-friendly identifier
- `title`: store title in multiple languages
- `shortDescription`: brief store description in multiple languages
- `description`: detailed store description in multiple languages

#### Variants

- default

### Category

#### Main fields:

- `id`: unique category identifier
- `className`: custom CSS classes
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: category display variant
- `adminTitle`: title for admin interface
- `slug`: URL-friendly identifier
- `title`: multilingual category title
- `subtitle`: multilingual category subtitle
- `description`: multilingual category description

#### Variants

- default

### Attribute

#### Main fields:

- `id`: unique attribute identifier
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: attribute display variant
- `number`: numeric value
- `boolean`: boolean value
- `date`: date value
- `datetime`: datetime value
- `string`: multilingual text value

#### Variants

- default

### AttributeKey

#### Main fields:

- `id`: unique attribute key identifier
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: attribute key display variant
- `type`: attribute key type (feature, specification, etc.)
- `field`: field type for storing values (string, number, boolean, etc.)
- `adminTitle`: title for admin interface
- `slug`: URL-friendly identifier
- `title`: multilingual attribute key title
- `prefix`: multilingual prefix for attribute values
- `suffix`: multilingual suffix for attribute values

#### Variants

- default

### Widget

#### Main fields:

- `id`: unique widget identifier
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: widget display variant
- `className`: CSS class name for styling
- `anchor`: HTML anchor identifier
- `adminTitle`: title for admin interface
- `slug`: URL-friendly identifier
- `title`: multilingual widget title
- `subtitle`: multilingual widget subtitle
- `description`: multilingual widget description

#### Variants

- default
- store-list-default
- order-list-default
- product-list-default
- product-overview-default
- category-list-default
- category-overview-default
- store-product-list-default

---

## 5. Standardized API for Models

- Models use the standard API endpoints described in Backend Development Standards
- Support for standard CRUD operations and extended operations (`dump`, `seed`, `find-or-create`, `bulk-create`, `bulk-update`) if needed
- Additional endpoints for order processing and inventory management

---

## 6. Special Notes

- All data fetching is handled strictly through SDK Providers and Relation Components
- Components are structured according to the standard SPS architecture (`ParentComponent` → `ChildComponent`)
- Products support various attributes and variations
- Orders integrate with payment systems
- Stores manage their own product catalogs
- Categories support hierarchical organization
- Widgets support various product display layouts
- Integration with file storage for product images
- Integration with billing module for payments

---

## Summary

- The description begins with the business purpose
- Accurate model and relation structure
- Covers key data management and frontend implementation features
- Includes comprehensive e-commerce capabilities
- Supports flexible product and order management
- Handles various product attributes and variations
- Integrates with payment and file storage systems
