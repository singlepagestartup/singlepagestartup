# Analytic Module

## 1. Purpose of the Module

The Analytic module is designed to implement analytic metrics tracking system within the project.

### It solves the following tasks:

- Manages analytics metrics and their configurations (`Metric`)
- Provides widget-based analytics dashboards (`Widget`)
- Enables tracking and visualization (in future) of various metrics
- Supports different types of analytics data and visualizations (in future)

### Typical use cases:

- Integrating analytics into project
- Creating metric tracking widgets
- Implementing analytics dashboards (in future)
- Building data visualization components (in future)

### The problem it solves:

Quickly integrating analytics functionality into any project without building complex analytics systems from scratch.

---

## 2. Models in the Module

| Model  | Purpose                                              |
| ------ | ---------------------------------------------------- |
| Metric | Managing analytics metrics: configurations, tracking |
| Widget | Managing widget-based analytics dashboards           |

---

## 3. Model Specifics

### Metric

#### Main fields:

- `id`: unique metric identifier
- `createdAt`: creation date
- `updatedAt`: update date
- `variant`: display variant
- `title`: metric title
- `value`: numeric metric value

#### Variants:

- default

### Widget

#### Main fields:

- `id`: unique widget identifier
- `createdAt`: creation date
- `updatedAt`: update date
- `variant`: display variant
- `title`: widget title
- `className`: custom CSS classes
- `adminTitle`: admin panel title
- `slug`: unique URL identifier

- Widgets provide visualization of metrics
- Supports various chart types and layouts
- Can display multiple metrics

#### Variants:

- default

---

## 4. Standardized API for Models

- Models use the standard API endpoints described in Backend Development Standards
- Support for standard CRUD operations and extended operations (`dump`, `seed`, `find-or-create`, `bulk-create`, `bulk-update`) if needed
- Additional endpoints for metric aggregation and filtering

---

## 5. Special Notes

- All data fetching is handled strictly through SDK Providers and Relation Components
- Components are structured according to the standard SPS architecture (`ParentComponent` → `ChildComponent`)
- Widgets support various visualization types and layouts
- Metrics can be configured for different tracking patterns
- Integration with analytics services is handled through standardized interfaces
- Supports real-time and historical data visualization

---

## Summary

- The description begins with the business purpose
- Accurate model structure
- Covers key data management and frontend implementation features
- Includes widget-based analytics dashboard capabilities
- Supports flexible metric tracking and visualization patterns
