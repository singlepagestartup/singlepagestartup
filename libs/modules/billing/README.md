# Billing Module

## 1. Purpose of the Module

The Billing module is designed to implement a comprehensive billing and payment system within the website.

### It solves the following tasks:

- Manages payment intents and transactions (`PaymentIntent`)
- Handles invoice generation and management (`Invoice`)
- Provides currency management and conversion (`Currency`)
- Offers widget-based payment interfaces (`Widget`)
- Supports various payment methods and flows

### Typical use cases:

- Processing online payments
- Generating and managing invoices
- Handling subscription payments
- Managing multiple currencies
- Providing payment widgets for different scenarios

### The problem it solves:

Quickly integrating a robust billing system into any website without building complex payment processing systems from scratch.

---

## 2. Models in the Module

| Model         | Purpose                                    |
| ------------- | ------------------------------------------ |
| Currency      | Managing currencies and exchange rates     |
| Invoice       | Handling invoice generation and management |
| PaymentIntent | Managing payment intents and transactions  |
| Widget        | Managing widget-based payment interfaces   |

---

## 3. Model Relations

| Relation                   | Purpose                                                                    |
| -------------------------- | -------------------------------------------------------------------------- |
| PaymentIntentsToCurrencies | Many-to-many relation: links payment intents to their supported currencies |
| PaymentIntentsToInvoices   | Many-to-many relation: links payment intents to their generated invoices   |

---

## 4. Model Specifics

### Currency

#### Main fields:

- `id`: unique currency identifier
- `createdAt`: creation date
- `updatedAt`: update date
- `variant`: display variant
- `isDefault`: default currency flag
- `symbol`: currency symbol
- `title`: currency title
- `adminTitle`: admin panel title
- `slug`: unique URL identifier

#### Variants:

- default

### PaymentIntent

#### Main fields:

- `id`: unique payment intent identifier
- `createdAt`: creation date
- `updatedAt`: update date
- `variant`: display variant
- `amount`: payment amount (integer)
- `status`: payment status (requires_payment_method, processing, etc.)
- `interval`: payment interval for recurring payments
- `type`: payment type (one_off, recurring)

#### Variants:

- default

### Invoice

#### Main fields:

- `id`: unique invoice identifier
- `createdAt`: creation date
- `updatedAt`: update date
- `variant`: display variant
- `status`: invoice status (draft, paid, etc.)
- `paymentUrl`: URL for payment processing
- `successUrl`: redirect URL after successful payment
- `cancelUrl`: redirect URL after cancelled payment
- `amount`: invoice amount (integer)
- `providerId`: payment provider identifier
- `provider`: payment provider name (e.g. stripe)

#### Variants:

- default

### Widget

#### Main fields:

- `id`: unique widget identifier
- `title`: widget title
- `createdAt`: creation date
- `updatedAt`: update date
- `variant`: display variant
- `adminTitle`: admin panel title
- `slug`: unique URL identifier

#### Variants:

- default

---

## 5. Standardized API for Models

- Models use REST API endpoints with standard CRUD operations
- All endpoints support filtering, sorting, and pagination
- Relations are managed through dedicated endpoints
- Payment processing is handled through provider-specific endpoints
- Webhook support for payment status updates

---

## 6. Special Notes

- All data fetching is handled through SDK Providers and Relation Components
- Components follow the SPS architecture with ParentComponent → ChildComponent structure
- Payment processing supports multiple providers (Stripe, 0xProcessing, etc.)
- Webhook handling for payment status updates
- Secure payment processing with provider-specific implementations
- Support for both one-time and recurring payments
- Multi-currency support with currency selection
- Admin interface for managing all billing aspects

---

## Summary

- The description begins with the business purpose
- Accurate model and relation structure
- Covers key data management and frontend implementation features
- Includes widget-based payment interface capabilities
- Supports flexible payment processing patterns
- Handles multiple currencies and payment methods
