# Agent Module

## 1. Purpose of the Module

The Agent module is designed to implement automation functions available through API. It handles CRON actions, AI functions, and other automated tasks through controllers and services.

### It solves the following tasks:

- Manages agents for automated functions and their configurations (`Agent`)
- Provides widget-based interfaces for agent interactions (`Widget`)
- Enables integration of automated functions into the project
- Supports various agent execution patterns and schedules

### Typical use cases:

- Implementing scheduled tasks and CRON jobs
- Creating automated content generation systems
- Building automated notification systems
- Integrating automated functions into website components

### The problem it solves:

Quickly integrating automated functionality into any website without building complex automation systems from scratch.

---

## 2. Models in the Module

| Model  | Purpose                                                                  |
| ------ | ------------------------------------------------------------------------ |
| Agent  | Managing automated agents: configurations, schedules, execution patterns |
| Widget | Managing widget-based interfaces for agent interactions                  |

---

## 3. Model Specifics

### Agent

#### Main fields:

- `title`: agent title
- `adminTitle`: title for admin panel
- `id`: unique agent identifier
- `createdAt`: creation timestamp
- `updatedAt`: last update timestamp
- `variant`: agent display variant
- `slug`: unique URL-friendly identifier
- `interval`: execution interval for scheduled tasks

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
- `adminTitle`: title for admin panel
- `slug`: unique URL-friendly identifier

#### Variants:

- default

---

## 4. Standardized API for Models

- Models use the standard API endpoints described in Backend Development Standards
- Support for standard CRUD operations and extended operations (`dump`, `seed`, `find-or-create`, `bulk-create`, `bulk-update`) if needed

---

## 5. Special Notes

- All data fetching is handled strictly through SDK Providers and Relation Components
- Components are structured according to the standard SPS architecture (`ParentComponent` → `ChildComponent`)
- Widgets support various display and interaction variants
- Agents can be configured for different execution patterns and schedules
- Integration with external services is handled through standardized interfaces

---

## Summary

- The description begins with the business purpose
- Accurate model structure
- Covers key data management and frontend implementation features
- Includes widget-based agent interface capabilities
- Supports flexible automation integration patterns
