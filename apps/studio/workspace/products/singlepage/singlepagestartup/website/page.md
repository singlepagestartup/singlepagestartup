---
confirmation:
  confirmed: false
review:
  dependencies:
    product.singlepagestartup.website: 52061278a388a00e3feb7bf505c9d6dd89fe7db19004c474abe62d1dbc8e21e1
---

<!-- section: hero -->

# Turn your business brief into a product.

Code Framework · Free code

Prepare the decisions behind your business, then build with a coding agent. Reuse accounts, content, orders and payments while you shape your own product.

[Run the project on your machine](https://github.com/singlepagestartup/singlepagestartup)

Bring an existing brief or prepare one in AI Chat. The framework code is free under MIT; coding tools, hosting and AI Chat have separate costs.

<!-- section: foundation -->

## Reuse the functions your product needs.

Your business rules belong in your product.

Code Framework connects the frontend, API and common business functions. Your coding agent can inspect that code and adapt it to the offer, content and customer experience in your brief.

| Function                   | Value                                                                                                      |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Accounts and access        | Give people an account and control access to their data and private content.                               |
| Content and conversations  | Publish articles and categories, connect authors to profiles and work with project materials.              |
| Carts, orders and payments | Use products, currencies, orders and payment flows; add your own commercial rules.                         |
| Code and guidance together | Keep the Next.js frontend, Hono API, module documentation and coding-agent instructions in one repository. |

[Explore the repository documentation](https://github.com/singlepagestartup/singlepagestartup#readme)

<!-- section: journey -->

## Give your coding agent a brief it can use.

Prepare the decisions, run the project and review the result.

| Step                   | What you do                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| Bring a reviewed brief | Export your business and product documents from AI Chat, or use a brief you already have.                 |
| Open and run the code  | Give the documents and repository to Claude Code or Codex Desktop. Ask it to run the project locally.     |
| Develop your product   | Describe the first page and business rules. Review the interface, ask for changes and check how it works. |

<!-- section: request -->

### An example request for your coding agent

> Use my attached, reviewed business and product documents to plan a first landing page with SinglePageStartup Code Framework. Inspect the repository, help me run it locally and explain which existing modules fit the task. Keep unanswered business facts visible. Preserve the account, order and payment flows while adapting the page, then show me what to review.

<!-- section: change -->

### Describe the change that matters.

Example request

> My store has a minimum order of six units. Add that rule while keeping the existing account and cart flow. Show me how the ordering experience changes.

Explore the result and ask for refinements. Keep using the foundation for this product and the next one when it fits.

<!-- section: chat -->

## Prepare the business before you build the page.

AI Chat → reviewed documents → development brief

Bring notes, a business model, a plan or an idea to AI Chat. Discuss the gaps and review written Brief, Strategy, Brand, Design and Product documents.

Export the documents you have reviewed and give them to your coding agent. Use Code Framework to develop the landing page or product those documents describe.

Prepare my business in AI Chat

AI Chat prepares written material. You and your coding agent develop the product; automated website publication is a future service.

[Prepare my business in AI Chat](/)

[See AI Chat token options](/ecommerce)

<!-- section: modules -->

## Know what each part does.

Choose the functions that fit your product.

Each module has a defined responsibility and its own documentation. Explore the relevant parts before asking your agent to change them.

| Module                     | What it handles                                                                               |
| -------------------------- | --------------------------------------------------------------------------------------------- |
| Accounts and permissions   | RBAC manages registration, identities, roles and access to resources.                         |
| Profiles and conversations | Social connects public profiles, authors, chats, threads and messages.                        |
| Articles and categories    | Blog stores article content, categories and the links used to present them.                   |
| Project materials          | Knowledge stores editable sources and supports retrieval from the material a person supplies. |
| Products and orders        | Ecommerce owns products, attributes, categories, carts and orders.                            |
| Payments and currencies    | Billing owns payment intents, invoices and currencies.                                        |
| Pages and content          | Host composes pages and metadata; Website Builder supplies reusable content sections.         |
| Forms and background work  | CRM captures form requests; Agent defines scheduled jobs and their configuration.             |

[RBAC documentation](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/rbac/README.md)

[Social documentation](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/social/README.md)

[Blog documentation](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/blog/README.md)

[Knowledge documentation](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/knowledge/README.md)

[Ecommerce documentation](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/ecommerce/README.md)

[Billing documentation](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/billing/README.md)

[Host documentation](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/host/README.md)

[Website Builder documentation](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/website-builder/README.md)

[CRM documentation](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/crm/README.md)

[Agent documentation](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/agent/README.md)

<!-- section: articles -->

## Read how the framework works.

Architecture explained through SPS code.

Follow a page, an API request or a local setup through the repository. The examples explain where each responsibility belongs and why.

| Article                          | What you will learn                                                                             |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| Next.js readers and Widget slots | Keep data readers, client interactions and page presentation in their owning components.        |
| Hono controllers and services    | Follow an API request through middleware, the owning service and its repository.                |
| Nx, Bun, Docker and migrations   | Understand the local applications and generate database changes through the repository targets. |

[Next.js readers and Widget slots](/blog/articles/nextjs-server-client-readers-and-widget-slots)

[Hono controllers and services](/blog/articles/hono-api-layers-di-and-owned-middleware)

[Nx, Bun, Docker and migrations](/blog/articles/nx-bun-docker-and-generated-migrations)

[Read all articles](/blog)

<!-- section: handoff -->

## Keep the decisions with the development task.

Your reviewed documents are the starting material.

Attach the customer, offer, business rules, page description and visual references your coding agent needs. Keep open questions visible and choose what to build first.

[Prepare the documents in AI Chat](/)

[Open Code Framework on GitHub](https://github.com/singlepagestartup/singlepagestartup)

<!-- section: price -->

## Free

Framework price

Source code and documentation under MIT.

Use the framework for your own project. Coding-agent charges, infrastructure and hosted AI Chat are separate. Help and maintenance are provided as time permits.

<!-- section: questions -->

## Before you start

| Question                             | Answer                                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Do I need to write the code myself?  | Describe what you want to Claude Code or Codex Desktop. Your agent changes the code; you make decisions and explore the resulting interface.                              |
| Can I build a product of my own?     | Yes. Use the foundation for your project and add your own business logic, content and design.                                                                             |
| What should I prepare before coding? | A description of the customer, offer, business rules, page content and visual direction. AI Chat helps you draft and review those documents; an existing brief works too. |
| Must I buy AI Chat tokens first?     | No. The framework is available independently under MIT. Tokens pay for hosted AI Chat work with your project material.                                                    |
| Does AI Chat publish my website?     | Website assembly and automatic server deployment are future services. You can export the reviewed documents now and develop with a coding agent and Code Framework.       |
| Can I get help?                      | Use GitHub to ask questions or suggest improvements. Help and maintenance are provided as time permits.                                                                   |

<!-- section: footer -->

## SinglePageStartup · Code Framework

Prepare your business in AI Chat. Build your product with Code Framework.

Framework code: MIT license.

[Framework](/framework)

[Modules](/framework/modules)

[Blog](/blog)

[Frontend articles](/blog/categories/frontend)

[Backend articles](/blog/categories/backend)

[DevOps articles](/blog/categories/devops)

[AI Chat](/)

[Tokens](/ecommerce)

[Documentation](https://github.com/singlepagestartup/singlepagestartup#readme)

[Source license](https://github.com/singlepagestartup/singlepagestartup/blob/main/LICENSE)

[Issues and help](https://github.com/singlepagestartup/singlepagestartup/issues)

<!-- section: controls -->

## Page labels

| Element               | Text                                             |
| --------------------- | ------------------------------------------------ |
| navigation-framework  | Framework                                        |
| footer-build          | Build                                            |
| footer-prepare        | Prepare                                          |
| footer-learn          | Learn                                            |
| navigation-foundation | Modules                                          |
| navigation-local      | Start locally                                    |
| navigation-code       | Get the code                                     |
| navigation-included   | Explore the modules                              |
| navigation-blog       | Blog                                             |
| navigation-tokens     | Tokens                                           |
| navigation-chat       | AI Chat                                          |
| navigation-sign-in    | Sign in                                          |
| navigation-profile    | My profile                                       |
| navigation-menu       | Open navigation                                  |
| skip-link             | Skip to content                                  |
| copy-action           | Copy request                                     |
| copy-pending          | Copying…                                         |
| copy-success          | Request copied. Paste it into your coding agent. |
| copy-error            | Select the request above and copy it manually.   |
| copy-idle             | Edit the request to fit your project.            |
| github-hint           | Opens GitHub in a new tab                        |
