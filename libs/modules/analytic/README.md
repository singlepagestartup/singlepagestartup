# Analytic Module

## 1. Purpose of the Module

The Analytic module defines metrics and UI widgets used to display analytic
information. It stores metric values and provides widget entries that can render
or organize analytics in the UI.

### It solves the following tasks:

- Stores metric definitions and numeric values (`metric`).
- Exposes widget entries for analytic dashboards or panels.
- Enables consistent admin CRUD for analytic data.

### Typical use cases:

- Tracking and displaying key metrics.
- Building lightweight analytics dashboards with widgets.
- Managing metric entries in an admin UI.

### The problem it solves:

Provides a uniform data model for analytics and a widget surface to integrate
metrics into the UI without custom pipelines.

---

## 2. Models in the Module

| Model                               | Purpose                            |
| ----------------------------------- | ---------------------------------- |
| [metric](./models/metric/README.md) | Numeric analytic metrics           |
| [widget](./models/widget/README.md) | UI widgets for analytic dashboards |

---

## 3. Model Relations

No relations in this module.

---

## 4. Model Specifics

See the linked model READMEs above for full fields and variant details.
