# Billing Module

## 1. Purpose of the Module

The Billing module manages payment flows, invoices, and currency configuration. It defines the data models for tracking payment intents, generating invoices, and presenting billing UI widgets. This module is the source of truth for billing data and the relationships between payments, invoices, and currencies.

### It solves the following tasks:

- Tracks payment intents with status, amount, and interval metadata.
- Generates invoices with provider URLs and payment status fields.
- Defines currencies and default currency selection.
- Provides widget content blocks for billing experiences.
- Connects payment intents to supported currencies and invoices.

### Typical use cases:

- Collecting payments and tracking their status.
- Managing multiple currencies and default currency behavior.
- Presenting invoices and linking to provider checkout URLs.
- Building admin workflows for billing data management.
- Rendering billing widgets in UI layouts.

---

## 2. Models

| Model                                               | Purpose                            |
| --------------------------------------------------- | ---------------------------------- |
| [currency](./models/currency/README.md)             | Currency configuration and symbols |
| [invoice](./models/invoice/README.md)               | Invoice records and payment links  |
| [payment-intent](./models/payment-intent/README.md) | Payment intent lifecycle tracking  |
| [widget](./models/widget/README.md)                 | Billing UI content blocks          |

---

## 3. Relations

| Relation                                                                             | Purpose                                      |
| ------------------------------------------------------------------------------------ | -------------------------------------------- |
| [payment-intents-to-currencies](./relations/payment-intents-to-currencies/README.md) | Link payment intents to available currencies |
| [payment-intents-to-invoices](./relations/payment-intents-to-invoices/README.md)     | Link payment intents to generated invoices   |

---
