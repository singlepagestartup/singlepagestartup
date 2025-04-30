# Website Builder Module

## 1. Purpose of the Module

The Website Builder module is designed to provide a comprehensive set of UI components and building blocks for creating modern, responsive interfaces. It serves as a foundation for building user interfaces across the project.

### It solves the following tasks:

- Provides reusable UI components (`Button`, `Feature`, `Widget`)
- Manages complex UI elements (`Slider`, `Modal`)
- Handles branding elements (`Logotype`)
- Supports component composition (`ButtonsArray`)
- Integrates with file storage for media content
- Enables flexible UI layouts and structures

### Typical use cases:

- Creating UI components
- Building complex interfaces
- Managing media content
- Implementing interactive elements
- Creating responsive layouts
- Building branded interfaces

### The problem it solves:

Provides a standardized set of UI components and building blocks that can be easily combined and customized to create consistent, modern interfaces across the project.

---

## 2. Models in the Module

| Model        | Purpose                      |
| ------------ | ---------------------------- |
| Button       | Managing button components   |
| ButtonsArray | Managing arrays of buttons   |
| Feature      | Managing feature components  |
| Logotype     | Managing logotype components |
| Modal        | Managing modal components    |
| Slide        | Managing slide components    |
| Slider       | Managing slider components   |
| Widget       | Managing widget components   |

---

## 3. Model Relations

| Relation                          | Purpose                                                         |
| --------------------------------- | --------------------------------------------------------------- |
| ButtonsArraysToButtons            | Many-to-many relation: arrays can contain multiple buttons      |
| ButtonsToFileStorageModuleFiles   | Many-to-many relation: buttons can contain multiple buttons     |
| FeaturesToButtonsArrays           | Many-to-many relation: features can have multiple button arrays |
| FeaturesToFileStorageModuleFiles  | Many-to-many relation: features can have multiple files         |
| LogotypesToFileStorageModuleFiles | Many-to-many relation: logotypes can have multiple files        |
| SlidersToSlides                   | Many-to-many relation: sliders can contain multiple slides      |
| SlidesToButtonsArrays             | Many-to-many relation: slides can have multiple button arrays   |
| SlidesToFileStorageModuleFiles    | Many-to-many relation: slides can have multiple files           |
| WidgetsToButtonsArrays            | Many-to-many relation: widgets can have multiple button arrays  |
| WidgetsToFeatures                 | Many-to-many relation: widgets can have multiple features       |
| WidgetsToFileStorageModuleFiles   | Many-to-many relation: widgets can have multiple files          |
| WidgetsToLogotypes                | Many-to-many relation: widgets can have multiple logotypes      |
| WidgetsToSliders                  | Many-to-many relation: widgets can have multiple sliders        |

---

## 4. Model Specifics

### Button

#### Main fields:

- `title`: button title
- `subtitle`: button subtitle
- `url`: button URL/link
- `className`: custom CSS classes
- `id`: unique identifier
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: button variant/style
- `adminTitle`: title for admin interface
- `slug`: URL-friendly identifier

#### Variants:

- default
- destructive
- primary
- secondary
- outline
- link
- ghost

### ButtonsArray

#### Main fields:

- `id`: unique identifier (UUID)
- `createdAt`: timestamp of creation
- `updatedAt`: timestamp of last update
- `variant`: display variant/style
- `className`: custom CSS classes
- `title`: array title
- `description`: array description
- `adminTitle`: title shown in admin interface
- `slug`: URL-friendly unique identifier

#### Variants:

- default

### Feature

#### Main fields:

- `className`: custom CSS classes
- `id`: unique identifier (UUID)
- `createdAt`: timestamp of creation
- `updatedAt`: timestamp of last update
- `variant`: display variant/style
- `title`: feature title
- `subtitle`: feature subtitle
- `description`: feature description
- `adminTitle`: title shown in admin interface
- `slug`: URL-friendly unique identifier

#### Variants:

- default

### Logotype

#### Main fields:

- `className`: custom CSS classes
- `url`: URL path or link
- `id`: unique identifier (UUID)
- `createdAt`: timestamp of creation
- `updatedAt`: timestamp of last update
- `variant`: display variant/style
- `title`: logotype title
- `adminTitle`: title shown in admin interface
- `slug`: URL-friendly unique identifier

#### Variants:

- default

### Modal

#### Main fields:

- `id`: unique identifier (UUID)
- `createdAt`: timestamp of creation
- `updatedAt`: timestamp of last update
- `variant`: display variant/style
- `title`: modal title
- `adminTitle`: title shown in admin interface
- `slug`: URL-friendly unique identifier

#### Variants:

- default

### Slide

#### Main fields:

- `id`: unique identifier (UUID)
- `createdAt`: timestamp of creation
- `updatedAt`: timestamp of last update
- `variant`: display variant/style
- `className`: custom CSS classes
- `adminTitle`: title shown in admin interface
- `slug`: URL-friendly unique identifier
- `title`: slide title
- `subtitle`: slide subtitle
- `description`: slide description

#### Variants:

- default

### Slider

#### Main fields:

- `id`: unique identifier (UUID)
- `createdAt`: timestamp of creation
- `updatedAt`: timestamp of last update
- `variant`: display variant/style
- `className`: custom CSS classes
- `adminTitle`: title shown in admin interface
- `slug`: URL-friendly unique identifier
- `title`: slider title
- `subtitle`: slider subtitle
- `description`: slider description

#### Variants:

- default

### Widget

#### Main fields:

- `title`: widget title
- `subtitle`: widget subtitle
- `description`: widget description
- `anchor`: HTML anchor for navigation
- `className`: custom CSS classes
- `id`: unique identifier (UUID)
- `createdAt`: timestamp of creation
- `updatedAt`: timestamp of last update
- `variant`: display variant/style
- `adminTitle`: title shown in admin interface
- `slug`: URL-friendly unique identifier

#### Variants:

- default
- content-default
- footer-default
- navbar-default

---

## 5. Standardized API for Models

- Models use the standard API endpoints described in Backend Development Standards
- Support for standard CRUD operations and extended operations (`dump`, `seed`, `find-or-create`, `bulk-create`, `bulk-update`) if needed
- Additional endpoints for component rendering and management

---

## 6. Special Notes

- All data fetching is handled strictly through SDK Providers and Relation Components
- Components are structured according to the standard SPS architecture (`ParentComponent` → `ChildComponent`)
- Supports responsive design
- Handles media content
- Enables component composition
- Supports customization
- Integrates with file storage
- Follows accessibility standards

---

## Summary

- The description begins with the business purpose
- Accurate model and relation structure
- Covers key UI component features
- Includes comprehensive component management
- Supports flexible layouts and structures
- Handles media content and branding
- Integrates with other modules
- Ensures consistent UI across the project
