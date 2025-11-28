# Notification Module

## 1. Purpose of the Module

The Notification module is designed to handle the creation, management, and delivery of notifications across the project.

### It solves the following tasks:

- Manages notification creation and delivery (`Notification`)
- Handles notification templates (`Template`)
- Organizes notifications by topics (`Topic`)
- Provides widget-based notification displays (`Widget`)
- Supports various notification types and channels

### Typical use cases:

- Sending system notifications
- Managing notification templates
- Organizing notifications by topics
- Displaying notifications in widgets
- Handling user notifications
- Supporting different notification channels

### The problem it solves:

Provides a unified system for managing and delivering notifications across the project, ensuring consistent notification handling and display while maintaining flexibility in notification types and delivery methods.

---

## 2. Models in the Module

| Model        | Purpose                                   |
| ------------ | ----------------------------------------- |
| Notification | Managing notifications and their delivery |
| Template     | Handling notification templates           |
| Topic        | Organizing notifications by topics        |
| Widget       | Managing notification displays            |

---

## 3. Model Relations

| Relation                 | Purpose                                                          |
| ------------------------ | ---------------------------------------------------------------- |
| NotificationsToTemplates | Many-to-many relation: notifications can use multiple templates  |
| TopicsToNotifications    | Many-to-many relation: topics can contain multiple notifications |

---

## 4. Model Specifics

### Notification

#### Main fields:

- `id`: unique identifier
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: notification variant/type
- `status`: current notification status
- `method`: delivery method
- `title`: notification title
- `data`: notification content and metadata
- `reciever`: notification recipient
- `attachments`: attached files or media
- `sendAfter`: scheduled delivery time

#### Variants:

- default

### Template

#### Main fields:

- `id`: unique identifier
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: template variant/type
- `title`: template title
- `adminTitle`: title for admin interface
- `slug`: unique template identifier

#### Variants:

- default
- generate-email-ecommerce-order-status-changed-default
- generate-telegram-ecommerce-order-status-changed-default
- generate-telegram-ecommerce-order-status-changed-admin
- reset-password
- agent-result
- generate-email-crm-form-request-created-admin
- generate-telegram-crm-form-request-created-admin

### Topic

#### Main fields:

- `id`: unique identifier
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: topic variant/type
- `title`: topic title
- `type`: topic type
- `adminTitle`: title for admin interface
- `slug`: unique topic identifier

#### Variants:

- default

### Widget

#### Main fields:

- `id`: unique identifier
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: widget variant/type
- `title`: widget title
- `adminTitle`: title for admin interface
- `slug`: unique widget identifier

#### Variants:

- default

---

## 5. Standardized API for Models

- Models use the standard API endpoints described in Backend Development Standards
- Support for standard CRUD operations and extended operations (`dump`, `seed`, `find-or-create`, `bulk-create`, `bulk-update`) if needed
- Additional endpoints for notification delivery and management

---

## 6. Special Notes

- All data fetching is handled strictly through SDK Providers and Relation Components
- Components are structured according to the standard SPS architecture (`ParentComponent` → `ChildComponent`)
- Notifications support various types and delivery methods
- Templates provide consistent notification formatting
- Topics organize notifications by type
- Widgets support real-time updates
- Integration with other modules for notification triggers

---

## Summary

- The description begins with the business purpose
- Accurate model and relation structure
- Covers key data management and frontend implementation features
- Includes comprehensive notification management capabilities
- Supports flexible notification types and delivery methods
- Handles notification organization and display
- Integrates with other modules for notification triggers
