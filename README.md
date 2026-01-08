# SinglePageStartup (SPS)

## Project Description

SinglePageStartup (SPS) is a modular framework designed to dramatically accelerate the development of web projects, from MVPs to full-scale business platforms. SPS enforces a unified architecture where every business entity is implemented as a separate model with its own REST API and frontend display components. The framework organizes all modules and their relationships into a clear folder structure, separating backend, frontend, models, and relations for maximum scalability and code reuse. The project root contains dedicated directories for applications (API, frontend, database, Redis, Telegram bot), business modules, shared utilities, providers, and infrastructure tools. By following a single, consistent pattern for all entities and modules, SPS helps developers save countless hours on setup, integration, and maintenance, letting them focus on building features that matter.

### Key Principles:

- Everything is based on Models, each having:
  - Its own REST API (via Hono + Bun backend)
  - Its own Frontend Display Variants (via React components)
- Models are linked through explicit Relation Models
- Frontend rendering is managed through specialized Variant Components
- Backend is powered by Bun + Hono
- Frontend is built with Next.js App Router

## Project Structure

```
apps/
├── api/    # Backend application (Hono + Bun API)
├── host/   # Frontend application (Next.js App Router)
├── db/     # Docker service for Postgres
├── mcp/    # MCP server for generating contend in apps/api/
├── openapi/  # OpenAPI documentation app
├── redis/  # Docker service for Redis
└── telegram/  # Telegram bot app


libs/
├── modules/  # Business modules
│   ├── agent/        # AI Agent integration
│   ├── analytic/     # Analytics and reporting
│   ├── billing/      # Billing and payments
│   ├── blog/         # Blog functionality
│   ├── broadcast/    # Broadcasting and messaging
│   ├── crm/          # Customer Relationship Management
│   ├── ecommerce/    # E-commerce functionality
│   ├── file-storage/ # File storage and management
│   ├── host/         # Hosting and deployment
│   ├── notification/ # Notification system
│   ├── rbac/         # Role-Based Access Control
│   ├── social/       # Social network module
│   ├── startup/      # Startup-specific features
│   ├── telegram/     # Telegram integration
│   └── website-builder/ # Website building tools
├── shared/      # Shared utilities, base types, configuration
├── providers/   # Service providers and dependency injection
└── middlewares/ # Global middleware components

tools/
├── deployer/  # Ansible scripts for deployment
└── plugins/   # Legacy generators for NX

.cursor/
├── rules/     # Cursor automation rules
└── knowledge/ # Project knowledge base
```

## Core Architecture

### Backend Architecture

Strict layered architecture: Repository → Service → Controller → App.

#### Repository Layer

- Direct database interaction using model Table descriptions
- Fields defined in `fields/`, table schema in `schema.ts`
- Database structure changes managed via SQL migrations

#### Service Layer

- Business logic: data preparation, validation, processing
- Can extend or utilize shared service logic
- Located under `backend/app/api/src/lib/service/`

#### Controller Layer

- Publishes public API endpoints
- Integrates middlewares per route
- Implements `IController` from `@sps/shared-backend-api`
- Located under `backend/app/api/src/lib/controller/`

#### App Layer

- Extends `DefaultApp` from `@sps/shared-backend-api`
- Configures middlewares, error handling, and routing
- Example:

  ```typescript
  import { injectable } from "inversify";
  import { DefaultApp } from "@sps/shared-backend-api";
  import { Table } from "@sps/blog/models/article/backend/repository/database";

  @injectable()
  export class App extends DefaultApp<(typeof Table)["$inferSelect"]> {}
  ```

### Frontend Architecture

#### Component Structure

- Each variant consists of:
  - `interface.ts` — props description (`IComponentProps`, `IComponentPropsExtended`)
  - `index.tsx` — wrapper with `ParentComponent`
  - `Component.tsx` — UI implementation
  - Optional `ClientComponent.tsx` for client-side logic

#### Data Handling

- All data through SDK Providers:
  - `clientApi`
  - `serverApi`
  - `Provider`
- Related entities via Relation components
- Example:
  ```tsx
  <RelationComponent
    isServer={props.isServer}
    variant="find"
    apiProps={{
      params: {
        filters: {
          and: [
            {
              column: "parentId",
              method: "eq",
              value: props.data.id,
            },
          ],
        },
      },
    }}
  >
    {({ data }) => {
      return data?.map((entity, index) => {
        return <ChildComponent key={index} isServer={props.isServer} data={entity} variant={entity.variant as any} />;
      });
    }}
  </RelationComponent>
  ```

## Development Standards

### General Principles

- Always use TypeScript with strict typing
- Follow functional and declarative programming patterns
- Maintain modular architecture
- Minimize client-only components
- Maximize the use of Server Components

### File and Folder Structure

- Use kebab-case for folder and file names
- Use PascalCase for components and interfaces
- Standard component structure:
  - `interface.ts`
  - `index.tsx`
  - `Component.tsx`
  - Optional `ClientComponent.tsx`

### TypeScript Standards

- Use `interface` over `type` for object descriptions
- Avoid enums; prefer union types or object maps
- Place interfaces close to components
- Explicitly type all props

### Code Style

- Use `function` keyword for components
- Clean, declarative JSX
- Follow ESLint and Prettier configurations

### Performance

- Minimize `use client`, `useEffect`, `useState`
- Prefer Server Components
- Monitor Web Vitals:
  - LCP (Largest Contentful Paint)
  - CLS (Cumulative Layout Shift)
  - FID (First Input Delay)

## API Standards

### Standard Operations

| Operation                  | Description                                    |
| -------------------------- | ---------------------------------------------- |
| GET /model                 | Fetch a list of entities (FindHandler)         |
| GET /model/:id             | Fetch an entity by ID (FindByIdHandler)        |
| POST /model                | Create a new entity (CreateHandler)            |
| PATCH /model/:id           | Update an entity by ID (UpdateHandler)         |
| DELETE /model/:id          | Delete an entity by ID (DeleteHandler)         |
| POST /model/dump           | Dump data of the model (DumpHandler)           |
| POST /model/seed           | Seed data into the model (SeedHandler)         |
| POST /model/find-or-create | Find or create an entity (FindOrCreateHandler) |
| POST /model/bulk-create    | Bulk create entities (BulkCreateHandler)       |
| PATCH /model/bulk-update   | Bulk update entities (BulkUpdateHandler)       |

### Middlewares

| Middleware             | Purpose                                 |
| ---------------------- | --------------------------------------- |
| RequestIdMiddleware    | Generates unique ID for each request    |
| ObserverMiddleware     | Logs requests and collects metrics      |
| ParseQueryMiddleware   | Parses complex query parameters         |
| LoggerMiddleware       | Logs all incoming requests              |
| RevalidationMiddleware | Manages content revalidation strategies |
| HTTPCacheMiddleware    | Caches responses conditionally          |
| ExceptionFilter        | Centralized error catching              |

### Error Handling

- All errors intercepted through `ExceptionFilter`
- Standardized error responses:
  - `statusCode` — error code
  - `message` — error description
  - `requestId` — unique ID for request traceability

#### Automatic Error Categorization

The system uses a pattern-matching mechanism to automatically classify errors into specific categories. To ensure an error is categorized correctly, simply throw a new Error with a message that includes a specific keyword. The classifier will match this keyword and assign the appropriate HTTP status and category.

This simplifies error handling, as you don't need to manually set status codes for common error types.

#### How It Works

When you throw an error, its message is matched against a predefined list of patterns. Each pattern is linked to an ErrorCategory.

#### Example:

If you throw an error like this:

```typescript
throw new Error("Invalid credentials provided for user.");
```

The system will detect the "Invalid credentials" keyword, classify it as an Authentication error, and automatically return an HTTP 401 status code.

Available Error Categories and Keywords
Here are the available categories and examples of keywords that trigger them:
| Category | HTTP Status | Example Keywords |
| ------------------------------ | ----------- | ------------------------------------------------------------------------ |
| **Authentication error** | 401 | unauthorized, invalid credentials, token required, no session |
| **Permission error** | 403 | forbidden, permission denied, only order owner |
| **Validation error** | 400 | invalid data, missing headers, no id provided, invalid url |
| **Unprocessable Entity error** | 422 | expected string, invalid type, unprocessable entity |
| **Payment error** | 400 | payment intent not found, stripe secret key not found, currency required |
| **Not Found error** | 404 | not found, entity not found, form not found |
| **Internal error** | 500 | internal server error, jwt secret not provided, configuration error |

If no specific pattern is matched, the error will be classified as a generic Internal error with a 500 status code, ensuring that no error goes unhandled.

## Installation and Setup

### Prerequisites

- Node.js ^20.x
- Bun ^1.2.3
- Docker and Docker Compose

### 1. Installing Dependencies

```bash
npm install
```

### 2. Creating envs and starting Required Services

Creating envs in all services and running them

```bash
./up.sh
```

### 3. Migrating database

```bash
./migrate.sh
```

### 3\*. Seeding base data

If you want to run SinglePageStartup with precreated data, run seeding

```bash
npx nx run api:db:seed
```

### 4. Running the API Project

```bash
npm run api:dev
```

### 5. Running the Host Project

```bash
npm run host:dev
```

## Attaching Upstream

After creating repository based on singlepagestartup template, call command:

```bash
git remote add upstream https://github.com/singlepagestartup/singlepagestartup.git
git pull upstream main
```

When you get an error

```
remote: Enumerating objects: 308477, done.
remote: Counting objects: 100% (6142/6142), done.
remote: Compressing objects: 100% (3918/3918), done.
remote: Total 308477 (delta 2275), reused 5196 (delta 1633), pack-reused 302335 (from 3)
Receiving objects: 100% (308477/308477), 195.68 MiB | 3.53 MiB/s, done.
Resolving deltas: 100% (140381/140381), done.
From https://github.com/singlepagestartup/singlepagestartup
 * branch                  main       -> FETCH_HEAD
 * [new branch]            main       -> upstream/main
hint: You have divergent branches and need to specify how to reconcile them.
hint: You can do so by running one of the following commands sometime before
hint: your next pull:
hint:
hint:   git config pull.rebase false  # merge
hint:   git config pull.rebase true   # rebase
hint:   git config pull.ff only       # fast-forward only
hint:
hint: You can replace "git config" with "git config --global" to set a default
hint: preference for all repositories. You can also pass --rebase, --no-rebase,
hint: or --ff-only on the command line to override the configured default per
hint: invocation.
fatal: Need to specify how to reconcile divergent branches.
```

Call:

```bash
git config pull.rebase false
git pull upstream main --allow-unrelated-histories
```

## Documentation

Detailed documentation for each module can be found in their respective directories:

- [agent](./libs/modules/agent/README.md) - automation, scheduled jobs, AI utilities, agent widgets.
- [analytic](./libs/modules/analytic/README.md) - metrics tracking and analytics widgets.
- [billing](./libs/modules/billing/README.md) - payments, invoices, currencies, payment widgets.
- [blog](./libs/modules/blog/README.md) - articles, categories, content widgets, file attachments.
- [broadcast](./libs/modules/broadcast/README.md) - channels and messages for real-time broadcasting.
- [crm](./libs/modules/crm/README.md) - forms, inputs, requests, form widgets.
- [ecommerce](./libs/modules/ecommerce/README.md) - products, orders, stores, categories, ecommerce widgets.
- [file-storage](./libs/modules/file-storage/README.md) - files, uploads, previews, file widgets.
- [host](./libs/modules/host/README.md) - pages, layouts, metadata, widgets, external widget integration.
- [notification](./libs/modules/notification/README.md) - notifications, templates, topics, notification widgets.
- [rbac](./libs/modules/rbac/README.md) - identities, roles, permissions, sessions, access widgets.
- [social](./libs/modules/social/README.md) - placeholder module (to be defined per project).
- [startup](./libs/modules/startup/README.md) - project-specific models/relations and custom widgets.
- [website-builder](./libs/modules/website-builder/README.md) - UI components and layout-building widgets.

## License

This software is proprietary and confidential. You may use this code as a foundation for your own projects, but selling, sublicensing, distributing, or providing it as a paid product, subscription, or any commercial offering to third parties is strictly prohibited without explicit written permission from the copyright holder.

See full license terms in the [LICENSE](./LICENSE) file.
