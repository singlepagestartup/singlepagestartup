# File Storage Module

## 1. Purpose of the Module

The File Storage module is designed to handle file management and storage within the project.

### It solves the following tasks:

- Manages file uploads and storage (`File`)
- Provides widget-based file displays (`Widget`)
- Handles file metadata and organization
- Supports file previews and downloads
- Integrates with other modules for file attachments

### Typical use cases:

- Uploading and storing files
- Managing file metadata
- Displaying files in widgets
- Previewing files
- Downloading files
- Attaching files to other entities

### The problem it solves:

Centralized file management system that can be used by other modules to store and manage their files without implementing their own file storage solutions.

---

## 2. Models in the Module

| Model  | Purpose                             |
| ------ | ----------------------------------- |
| File   | Managing files and their metadata   |
| Widget | Managing widget-based file displays |

---

## 3. Model Relations

| Relation       | Purpose                                                   |
| -------------- | --------------------------------------------------------- |
| WidgetsToFiles | Many-to-many relation: widgets can display multiple files |

---

## 4. Model Specifics

### File

#### Main fields:

- `id`: unique file identifier
- `file`: file path or URL
- `containerClassName`: CSS class name for container styling
- `className`: CSS class name for file element styling
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: file display variant
- `adminTitle`: title for admin interface
- `width`: file width in pixels
- `height`: file height in pixels
- `alt`: alternative text for images
- `size`: file size in bytes
- `extension`: file extension
- `mimeType`: file MIME type

#### Variants:

- default
- generate-template-opengraph-image-default
- generate-template-ecommerce-order-receipt-default
- generate-template-ecommerce-product-attachment-default

### Widget

#### Main fields:

- `variant`: widget display variant
- `id`: unique widget identifier
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `title`: widget title
- `adminTitle`: title for admin interface
- `slug`: URL-friendly identifier

#### Variants:

- default

---

## 5. Standardized API for Models

- Models use the standard API endpoints described in Backend Development Standards
- Support for standard CRUD operations and extended operations (`dump`, `seed`, `find-or-create`, `bulk-create`, `bulk-update`) if needed
- Additional endpoints for file uploads and downloads

---

## 6. Component Variants

| Model  | Component Variants                                              |
| ------ | --------------------------------------------------------------- |
| File   | Variants for file display: card, list, grid, preview            |
| Widget | Variants for widget layouts: file grid, file list, file preview |

Components are implemented either in the `startup/` or `singlepage/` structure.

---

## 7. Special Notes

- All data fetching is handled strictly through SDK Providers and Relation Components
- Components are structured according to the standard SPS architecture (`ParentComponent` → `ChildComponent`)
- Files support various types and previews
- Widgets support different display layouts
- Integration with other modules for file attachments
- Secure file storage and access control

---

## Summary

- The description begins with the business purpose
- Accurate model and relation structure
- Covers key data management and frontend implementation features
- Includes comprehensive file management capabilities
- Supports flexible file organization and display
- Handles various file types and previews
- Integrates with other modules for file attachments
