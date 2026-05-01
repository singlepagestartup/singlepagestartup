# SinglePageStartup (SPS)

## AI Entry Point

Start with `AI_GUIDE.md` for AI-specific onboarding and workflows.

## Project Description

SinglePageStartup (SPS) is a modular framework designed to dramatically accelerate the development of web projects, from MVPs to full-scale business platforms. SPS enforces a unified architecture where every business entity is implemented as a separate model with its own REST API and frontend display components. The framework organizes all modules and their relationships into a clear folder structure, separating backend, frontend, models, and relations for maximum scalability and code reuse. The project root contains dedicated directories for applications (API, frontend, database, Redis, Telegram bot), business modules, shared utilities, providers, and infrastructure tools. By following a single, consistent pattern for all entities and modules, SPS helps developers save countless hours on setup, integration, and maintenance, letting them focus on building features that matter.

## Scoped Testing Workflow

The canonical scoped pipeline is `unit + integration + scenario`:

- `npm run test:unit:scoped`
- `npm run test:integration:scoped`
- `npm run test:scenario:issue -- <project-namespace> <issue-number>`
- `npm run test:scenario:issue-152`
- `npm run test:all:scoped`

All 15 business modules participate in `unit + integration` lanes. DB-backed scenario lane is mandatory for critical end-to-end behavior checks without Playwright.
Browser E2E/Playwright is not part of scoped validation.
For issue-152, HTTP cache remains enabled in scenarios; temporary exclusion is applied only to subject cart counter routes (`/orders/quantity`, `/orders/total`).

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
- Database structure changes are managed via generated Drizzle SQL migrations
- After changing `schema.ts` or any `fields/*` table definition, run the matching `repository-generate` Nx target, for example `npx nx run @sps/<module>:models:<model>:repository-generate` or the corresponding relation target. Do not hand-write migration SQL, `migrations/meta/*` snapshots, or `_journal.json` entries.

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
- If a variant requires `"use client"`, put the directive and client-only logic in `ClientComponent.tsx`; keep `Component.tsx` as a server-compatible wrapper that renders `ClientComponent`.
- When `Component.tsx` renders `ClientComponent.tsx`, pass an explicit allowlist of props. Do not forward `{...props}` across the Server → Client boundary; Next.js requires props passed to Client Components to be serializable, and a spread can accidentally leak unsupported values.
- `isServer` is part of the SPS base component contract. If the client component needs the SPS runtime context or renders lower-level SPS components, pass `isServer` explicitly from `Component.tsx` to `ClientComponent.tsx`.
- Inside a file marked with `"use client"`, pass `isServer={false}` to nested SPS model/relation components declared in that client file. Function props are only safe when they are created and consumed inside an existing client-side subtree, not when created by a Server Component wrapper.

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

### Cross-Module Layering Boundary

- Cart/product behavior for authenticated users must be orchestrated through RBAC subject surfaces (`rbac > ecommerce`).
- `ecommerce` provides domain models/relations and generic UI primitives, but must not import or depend on RBAC subject implementation.
- Host/cart composition should route actions to RBAC wrappers (for example `me-ecommerce-module-*`) instead of wiring direct ecommerce mutations.

## Realtime Data Revalidation

If you need to understand why data updates/refetches happen in UI (chat, cart, counters, etc.), do not reverse-engineer from code first. Start from these docs:

- `libs/middlewares/src/lib/revalidation/README.md` - backend revalidation contract (payload + topics), routing rules, rule priority.
- `libs/shared/frontend/client/api/README.md` - frontend subscription/invalidation strategy (topics first, route fallback).
- `libs/shared/frontend/client/store/README.md` - role of `global-actions-store` in runtime event flow.
- `libs/shared/frontend/client/store/src/lib/README.md` - low-level details of `global-actions-store`.

### Minimal runtime flow

1. Write request succeeds (`POST`/`PUT`/`PATCH`/`DELETE`).
2. Revalidation middleware broadcasts websocket message with `payload` and optional `topics`.
3. Frontend `subscription(...)` consumes message from `global-actions-store`.
4. If matching `meta.topics` queries exist, invalidate by topics.
5. Otherwise fallback to route-based invalidation.

### Why this design exists

- Route-only invalidation causes too many refetches on realtime-heavy pages.
- Topic-only invalidation breaks legacy flows without `meta.topics`.
- Hybrid model keeps old features working and allows gradual migration to precise invalidation.

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
- Do not put `"use client"` in `Component.tsx`; create `ClientComponent.tsx` and render it from `Component.tsx`.
- Do not render `<ClientComponent {...props} />` from `Component.tsx`. Destructure or reference only the props the client file actually needs, including `isServer` when it is part of the downstream SPS contract.
- In `ClientComponent.tsx`, nested SPS components created inside that client boundary must receive `isServer={false}`.

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

## Testing Convention (BDD Required)

All test files in SPS follow a BDD-oriented format (`unit`, `integration`).

### Required pattern

1. Add a top-level JSDoc block in each test file with `BDD Suite` or `BDD Scenario`.
2. Include `Given`, `When`, `Then` lines in that block.
3. Keep behavior intent in file header + test name; avoid inline `Given/When/Then` comments in test body.
4. Prefer deterministic `Given` setup (fixtures/mocks) so scenarios are reproducible.
5. Assertions must target observable behavior (status codes, response payloads, rendered UI, side effects).
6. Do not test source-code text or implementation snippets.
7. Forbidden anti-patterns in tests:
   - `readFileSync(...)` for reading source files under test.
   - `expect(source).toContain(...)` / `expect(source).toMatch(...)` for implementation fragments.
8. For frontend behavior tests, import components via public package entrypoints (for example `@sps/.../frontend/component`) and drive behavior via `variant` props.
9. Do not rely on deep source imports (`src/lib/...`) as primary test entrypoints; if a nested variant router is needed, keep public import contract and bridge with a local test adapter/mock.
10. Behavior/scenario tests must use real product components and real SDK request flow; do not replace the target UI with fake harness components when a real variant exists.

Example:

```ts
/**
 * BDD Suite: cart quantity endpoint behavior.
 *
 * Given: authenticated subject has two cart orders with known quantities.
 * When: client requests quantity endpoint.
 * Then: endpoint returns aggregated quantity for that subject.
 */
```

### Scoped testing lanes

Use scoped unit/integration lanes plus DB-backed scenario lane:

- `npm run test:unit:scoped`
- `npm run test:integration:scoped`
- `npm run test:scenario`
- `npm run test:scenario:issue -- <project-namespace> <issue-number>`
- `npm run test:scenario:issue-152`
- `npm run test:all:scoped`

Scenario tests are namespaced by project and issue:

- `apps/api/specs/scenario/singlepagestartup/issue-<number>/...`
- `apps/api/specs/scenario/startup/issue-<number>/...`

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
