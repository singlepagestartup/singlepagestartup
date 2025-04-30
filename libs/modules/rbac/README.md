# RBAC Module

## 1. Purpose of the Module

The RBAC (Role-Based Access Control) module is the core security module of the project, responsible for authentication, authorization, and access control management.

### It solves the following tasks:

- Manages user authentication and identity verification (`Identity`)
- Handles role-based access control (`Role`, `Action`)
- Manages subject (user/entity) management (`Subject`)
- Provides widget-based access control interfaces (`Widget`)
- Controls access to resources across all modules

### Typical use cases:

- User authentication
- Role assignment and management
- Permission and action control
- Access restriction to resources
- Security context management
- Integration with other modules for access control

### The problem it solves:

Provides a comprehensive security framework that ensures proper access control and authorization across the entire project, while maintaining flexibility and extensibility in security policies.

---

## 2. Models in the Module

| Model    | Purpose                                     |
| -------- | ------------------------------------------- |
| Action   | Managing actions and operations             |
| Identity | Managing user identities and authentication |
| Role     | Defining roles and their permissions        |
| Session  | Handling user sessions                      |
| Subject  | Managing subjects (users/entities)          |
| Widget   | Managing access control interfaces          |

---

## 3. Model Relations

| Relation                              | Purpose                                                           |
| ------------------------------------- | ----------------------------------------------------------------- |
| RolesToActions                        | Many-to-many relation: roles can have multiple actions            |
| RolesToEcommerceModuleProducts        | Many-to-many relation: roles can access multiple products         |
| SubjectsToBillingModulePaymentIntents | Many-to-many relation: subjects can have multiple payment intents |
| SubjectsToEcommerceModuleOrders       | Many-to-many relation: subjects can have multiple orders          |
| SubjectsToIdentities                  | Many-to-many relation: subjects can have multiple identities      |
| SubjectsToNotificationModuleTopics    | Many-to-many relation: subjects can subscribe to multiple topics  |
| SubjectsToRoles                       | Many-to-many relation: subjects can have multiple roles           |
| SubjectsToSessions                    | Many-to-many relation: subjects can have multiple sessions        |

---

## 4. Model Specifics

### Identity

#### Main fields:

- `password`: encrypted password hash
- `salt`: random string used for password encryption
- `account`: unique account identifier
- `email`: user's email address
- `provider`: authentication provider (default: "email")
- `id`: unique UUID identifier
- `createdAt`: timestamp of record creation
- `updatedAt`: timestamp of last update
- `variant`: identity variant type (default: "default")
- `code`: verification or reset code

#### Variants:

- default

### Role

#### Main fields:

- `title`: role title
- `uid`: unique role identifier
- `id`: unique UUID identifier
- `createdAt`: timestamp of record creation
- `updatedAt`: timestamp of last update
- `variant`: role variant type (default: "default")
- `availableOnRegistration`: flag indicating if role can be assigned during registration

#### Variants:

- default

### Action

#### Main fields:

- `id`: unique UUID identifier
- `createdAt`: timestamp of record creation
- `updatedAt`: timestamp of last update
- `variant`: action variant type (default: "default")
- `type`: action type (default: "HTTP")
- `method`: HTTP method (default: "GET")
- `path`: request path (default: "/")

#### Variants:

- default

### Subject

#### Main fields:

- `id`: unique UUID identifier
- `createdAt`: timestamp of record creation
- `updatedAt`: timestamp of last update
- `variant`: subject variant type (default: "default")

#### Variants:

- default

### Session

#### Main fields:

- `id`: unique UUID identifier
- `createdAt`: timestamp of record creation
- `updatedAt`: timestamp of last update
- `variant`: session variant type (default: "default")
- `expiresAt`: session expiration timestamp
- `options`: additional session configuration options

#### Variants:

- default

### Widget

#### Main fields:

- `className`: CSS class name for styling
- `title`: main title of the widget
- `subtitle`: secondary title of the widget
- `description`: detailed widget description
- `id`: unique UUID identifier
- `createdAt`: timestamp of record creation
- `updatedAt`: timestamp of last update
- `variant`: widget variant type (default: "default")
- `adminTitle`: title displayed in admin interface
- `slug`: unique URL-friendly identifier

#### Variants:

- default
- subject-authentication-email-and-password-forgot-password-form-default
- subject-authentication-select-method-default
- subject-authentication-email-and-password-registration-form-default
- subject-authentication-email-and-password-reset-password-form-default
- subject-overview-default
- subject-list-default
- subject-identity-settings-default
- subject-authentication-logout-action-default

---

## 5. Standardized API for Models

- Models use the standard API endpoints described in Backend Development Standards
- Support for standard CRUD operations and extended operations (`dump`, `seed`, `find-or-create`, `bulk-create`, `bulk-update`) if needed
- Additional endpoints for authentication and authorization
- Security-specific endpoints for session management
- Access control verification endpoints

---

## 6. Special Notes

- All data fetching is handled strictly through SDK Providers and Relation Components
- Components are structured according to the standard SPS architecture (`ParentComponent` → `ChildComponent`)
- Implements comprehensive security measures
- Supports various authentication methods
- Handles role-based access control
- Manages session security
- Integrates with all other modules for access control
- Implements security best practices
- Supports audit logging
- Handles security context management

---

## Summary

- The description begins with the business purpose
- Accurate model and relation structure
- Covers key security and access control features
- Includes comprehensive authentication and authorization capabilities
- Supports flexible role and permission management
- Handles session and identity management
- Integrates with all other modules for security
- Implements industry-standard security practices
