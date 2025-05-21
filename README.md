# SinglePageStartup (SPS)

## Project Description

SinglePageStartup (SPS) is a modular framework for rapid development of projects ranging from MVPs to full-scale business platforms.

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
└── redis/  # Docker service for Redis

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
    {({ data }) => <ChildComponent data={data} />}
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

## Installation and Setup

### Prerequisites

- Node.js ^20.x
- Bun ^1.2.3
- Docker and Docker Compose

### Installing Dependencies

```bash
bun install
```

### Starting Services

```bash
# Start Postgres and Redis
docker-compose up -d

# Create env files
./create_env.sh
```

### Running the Project

```bash
# Development
bun run host:dev

# Production
bun run host:production


```

## Attaching Upstream

After creating repository based on singlepagestartup template, call command:

```
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

```
git config pull.rebase false
git pull upstream main --allow-unrelated-histories
```

## Documentation

Detailed documentation for each module can be found in their respective directories:

- [Blog Module](./libs/modules/blog/README.md)
- [Ecommerce Module](./libs/modules/ecommerce/README.md)
- [CRM Module](./libs/modules/crm/README.md)
- [RBAC Module](./libs/modules/rbac/README.md)
- [Notification Module](./libs/modules/notification/README.md)
- [File Storage Module](./libs/modules/file-storage/README.md)
- [Billing Module](./libs/modules/billing/README.md)
- [Website Builder Module](./libs/modules/website-builder/README.md)
- [Startup Module](./libs/modules/startup/README.md)
- [Broadcast Module](./libs/modules/broadcast/README.md)
- [Telegram Module](./libs/modules/telegram/README.md)
- [Analytic Module](./libs/modules/analytic/README.md)
- [Agent Module](./libs/modules/agent/README.md)
- [Host Module](./libs/modules/host/README.md)

## License

MIT
