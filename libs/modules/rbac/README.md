# RBAC Module

## 1. Purpose of the Module

The RBAC module defines authentication subjects, identities, roles, permissions, and their relations. It is responsible for user access control and authentication flows across the platform.

### It solves the following tasks:

- Stores identities and authentication credentials.
- Defines permissions and role assignments.
- Connects subjects to roles, identities, and actions.
- Exposes UI variants for authentication and authorization flows.
- Supports OAuth authentication/link flows (Google) with safe one-time exchange via action records.

### Typical use cases:

- User login and registration flows.
- Assigning roles and permissions.
- Guarding access to resources.
- Linking subjects to application-specific data.

---

## 2. Models

| Model                                       | Purpose                        |
| ------------------------------------------- | ------------------------------ |
| [action](./models/action/README.md)         | Time-bound action records      |
| [identity](./models/identity/README.md)     | Authentication identities      |
| [permission](./models/permission/README.md) | Permission rules (method/path) |
| [role](./models/role/README.md)             | Role definitions               |
| [subject](./models/subject/README.md)       | Authenticated subjects         |
| [widget](./models/widget/README.md)         | Auth UI widgets                |

---

## 3. Relations

| Relation                                                                                                       | Purpose                          |
| -------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| [roles-to-ecommerce-module-products](./relations/roles-to-ecommerce-module-products/README.md)                 | Link roles to products           |
| [roles-to-permissions](./relations/roles-to-permissions/README.md)                                             | Link roles to permissions        |
| [subjects-to-actions](./relations/subjects-to-actions/README.md)                                               | Link subjects to actions         |
| [subjects-to-billing-module-payment-intents](./relations/subjects-to-billing-module-payment-intents/README.md) | Link subjects to payment intents |
| [subjects-to-blog-module-articles](./relations/subjects-to-blog-module-articles/README.md)                     | Link subjects to articles        |
| [subjects-to-ecommerce-module-orders](./relations/subjects-to-ecommerce-module-orders/README.md)               | Link subjects to orders          |
| [subjects-to-ecommerce-module-products](./relations/subjects-to-ecommerce-module-products/README.md)           | Link subjects to products        |
| [subjects-to-identities](./relations/subjects-to-identities/README.md)                                         | Link subjects to identities      |
| [subjects-to-notification-module-topics](./relations/subjects-to-notification-module-topics/README.md)         | Link subjects to topics          |
| [subjects-to-roles](./relations/subjects-to-roles/README.md)                                                   | Link subjects to roles           |
| [subjects-to-social-module-profiles](./relations/subjects-to-social-module-profiles/README.md)                 | Link subjects to social profiles |

---
