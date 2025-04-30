# CRM Module

## 1. Purpose of the Module

The CRM module is designed to implement a customer relationship management system within the project.

### It solves the following tasks:

- Manages customer requests and inquiries (`Request`)
- Handles form creation and management (`Form`)
- Provides input field management (`Input`)
- Offers widget-based form interfaces (`Widget`)
- Supports various form types and validation

### Typical use cases:

- Creating contact forms
- Managing customer inquiries
- Building custom forms
- Handling form submissions
- Processing customer requests

### The problem it solves:

Quickly integrating a robust CRM system into any project without building complex form and request management systems from scratch.

---

## 2. Models in the Module

| Model   | Purpose                                    |
| ------- | ------------------------------------------ |
| Form    | Managing forms and their configurations    |
| Input   | Managing form input fields and validation  |
| Request | Handling customer requests and submissions |
| Widget  | Managing widget-based form interfaces      |

---

## 3. Model Relations

| Relation        | Purpose                                                        |
| --------------- | -------------------------------------------------------------- |
| FormsToInputs   | Many-to-many relation: forms can contain multiple input fields |
| FormsToRequests | Many-to-many relation: forms can receive multiple requests     |
| WidgetsToForms  | Many-to-many relation: widgets can display multiple forms      |

---

## 4. Model Specifics

### Form

#### Main fields:

- `id`: unique form identifier
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: form display variant
- `title`: form title (multilingual)
- `subtitle`: form subtitle (multilingual)
- `description`: form description (multilingual)
- `className`: custom CSS class name for styling
- `adminTitle`: title for admin panel
- `slug`: unique URL-friendly identifier

#### Variants:

- default

### Input

#### Main fields:

- `id`: unique input identifier
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: input display variant
- `type`: input field type
- `isRequired`: required field flag
- `title`: input title (multilingual)
- `subtitle`: input subtitle (multilingual)
- `description`: input description (multilingual)
- `className`: custom CSS class name for styling
- `adminTitle`: title for admin panel
- `slug`: unique URL-friendly identifier
- `placeholder`: input placeholder text (multilingual)
- `label`: input label text (multilingual)

#### Variants:

- default
- text-default
- textarea-default
- number-default

### Request

#### Main fields:

- `id`: unique request identifier
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: request display variant
- `payload`: request form data (JSON)

#### Variants:

- default

### Widget

#### Main fields:

- `title`: widget title (multilingual)
- `subtitle`: widget subtitle (multilingual)
- `description`: widget description (multilingual)
- `id`: unique widget identifier
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: widget display variant
- `className`: custom CSS class name for styling
- `adminTitle`: title for admin panel
- `slug`: unique URL-friendly identifier

#### Variants:

- default
- form-default

---

## 5. Standardized API for Models

- Models use the standard API endpoints described in Backend Development Standards
- Support for standard CRUD operations and extended operations (`dump`, `seed`, `find-or-create`, `bulk-create`, `bulk-update`) if needed
- Additional endpoints for form submission and request processing

---

## 6. Special Notes

- All data fetching is handled strictly through SDK Providers and Relation Components
- Components are structured according to the standard SPS architecture (`ParentComponent` → `ChildComponent`)
- Forms support various input types and validation rules
- Widgets can be configured for different form layouts
- Integration with CRM services is handled through standardized interfaces
- Implements secure form submission and request processing

---

## Summary

- The description begins with the business purpose
- Accurate model and relation structure
- Covers key data management and frontend implementation features
- Includes form and request management capabilities
- Supports flexible form creation and processing
- Handles various input types and validation rules
