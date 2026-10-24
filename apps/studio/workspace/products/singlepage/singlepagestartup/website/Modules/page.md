---
confirmation:
  confirmed: false
---

# A place for each part of your product.

Code Framework modules

Choose the capabilities your product needs. Each module keeps its records, operations and presentation together; relations connect specific records across the system.

| ID              | Module          | Responsibility                                                                            | Group      |
| --------------- | --------------- | ----------------------------------------------------------------------------------------- | ---------- |
| host            | Host            | Pages, layouts, metadata and the exact Widget instances that make a page.                 | Experience |
| website-builder | Website Builder | Editable copy, media, navigation and presentation sections with slots for domain content. | Experience |
| blog            | Blog            | Articles, categories, covers and content blocks for searchable explanations.              | Experience |
| social          | Social          | Profiles, authorship, chats, threads, messages and their associations.                    | Experience |
| crm             | CRM             | Forms, steps, fields and saved contact requests.                                          | Experience |
| rbac            | RBAC            | Accounts, authentication, roles and current-user operations with access scope.            | Business   |
| ecommerce       | Ecommerce       | Products, attributes, categories, carts and orders.                                       | Business   |
| billing         | Billing         | Currencies, payment intents, invoices and payment-provider state.                         | Business   |
| knowledge       | Knowledge       | Editable Sources, their attached Files and derived Chunks for scoped retrieval.           | Business   |
| agent           | Agent           | Agent definitions, task orchestration and conversation commands.                          | Business   |
| file-storage    | File Storage    | Stored file metadata, original bytes and media presentation.                              | Foundation |
| notification    | Notification    | Delivery records, templates and notification topics.                                      | Foundation |
| broadcast       | Broadcast       | Channels and messages for realtime or queued delivery.                                    | Foundation |
| analytic        | Analytic        | Metric records and widgets for presenting their values.                                   | Foundation |
| startup         | Startup         | Project-specific widgets for the product you build on this foundation.                    | Foundation |

<!-- section: composition -->

## Connect the capability to its presentation.

For a token purchase, RBAC owns the current account and authorized actions. Ecommerce owns the product and order; Billing owns the payment records. The domain Widget passes rendered content into its exact linked Website Builder Widget. Host assembles the saved instances into a page.

<!-- section: preparation -->

## Start with the business decision.

Tell AI Chat who the product serves, what it offers and how a customer completes the main task. Review the documents and give them to your coding agent as context for choosing modules and making changes.

<!-- section: guide -->

## Work with {module}.

| Heading                          | Description                                                                                                                                                                                        |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Keep a clear owner.              | Use {module} for its own records and operations. Connect other capabilities through their public interfaces and explicit relations; keep the business task in its owning domain.                   |
| Give your agent a concrete task. | Provide your reviewed product description, the customer action to support and the result you expect. Ask the agent to inspect this module's README and preserve existing access and data behavior. |

<!-- section: controls -->

## Interface labels

| Element             | Text                                        |
| ------------------- | ------------------------------------------- |
| back-framework      | Code Framework                              |
| all-modules         | All modules                                 |
| explore-module      | Explore module                              |
| source-guide        | Read {module} source guide                  |
| articles-action     | Read architecture articles                  |
| prepare-action      | Prepare your product in AI Chat             |
| missing-title       | Module not found                            |
| missing-description | Choose a module from the current framework. |
| composition-eyebrow | A real composition                          |
