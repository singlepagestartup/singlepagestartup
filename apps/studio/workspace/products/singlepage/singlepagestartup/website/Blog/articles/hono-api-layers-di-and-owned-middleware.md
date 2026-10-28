---
confirmation: { confirmed: false }
slug: "hono-api-layers-di-and-owned-middleware"
createdAt: "2026-10-23"
category: "backend"
title: "Hono in SPS: controllers, services, repositories and middleware"
excerpt: "Follow a request through the API host and owning module, then place validation, business orchestration and data scope where they can be tested."
cover: "hono-layered-api"
coverAlt: "Two colleagues tracing an idea together at a desk."
author: "SinglePageStartup editorial"
authorRole: "Architecture and implementation notes"
---

The SPS API runs Hono in apps/api. Business modules expose applications that the host mounts under paths such as /api/blog and /api/ecommerce. A Blog route therefore participates in one application-level request pipeline while its model package retains ownership of its controller, service and repository. Adding a Next.js route handler for the same business operation would create another backend entrypoint with a different middleware and cache history.

## Begin with the module bootstrap

The Blog Article bootstrap creates an Inversify container and binds the shared DI tokens to its App, Controller, Service, Repository, Configuration and exception filter. It loads those bindings, resolves the App and initializes it. The ordinary Article service extends CRUDService; its repository extends DatabaseRepository for the Article table. An entity with no special business behavior can keep those defaults.

```ts
@injectable()
export class Service extends CRUDService<(typeof Table)["$inferSelect"]> {}

@injectable()
export class Repository extends DatabaseRepository<typeof Table> {}
```

These are the Article package's actual extension points. A custom operation belongs beside other services of its kind. Its controller handler parses transport input and calls that operation. Database filtering, schema parsing and persistence continue through the owning repository. Copying a database query into a frontend reader or a controller bypasses the shared behavior a reviewer expects from that boundary.

## Read the middleware order

Hono executes middleware in registration order before the handler and unwinds it after await next(). Its [middleware guide](https://hono.dev/docs/guides/middleware) documents both early responses and response processing. In SPS this is observable behavior: query parsing establishes typed request parameters; resource access can constrain them; a response cache must not answer a protected request before that constraint runs.

Backend route middleware lives in the owning module's backend/app/middlewares package and is exported from there. The controller composes definitions, middleware instances and handlers. A Subject-owning operation can require a verified current Subject and a matching route ID without making that whole Subject-ID route public. The account's cart read, another account's cart read and an operator action have different access conditions even when they share a model.

## Scope before pagination and count

An owner restriction belongs in the query sent to the repository. In the Subject cart reader, the allowed Order IDs are combined with requested filters through filters.and. Filtering the returned page after the database limit can produce short pages and an incorrect count; it can also leave a separate count endpoint outside the restriction. Keep the same scope through list, count, by-ID reads and specialized expansions.

The shared ParseQuery middleware preserves an already parsed query when nested module applications run. That lets an earlier resource guard keep its added constraints. A second parser that reconstructed parameters from the raw URL could erase them. Tests should use the actual nested Hono composition, since a handler-only mock would not exercise that interaction.

## Preserve module direction

The dependency order permits RBAC Subject operations to orchestrate lower capabilities such as Blog, Ecommerce and Billing. Blog itself does not import RBAC to discover the current user's subscription. The API host composes the integration and supplies actual owning services. Infrastructure packages keep neutral transport, database and cache behavior; they do not acquire knowledge of article purchases.

The same rule applies to types, reexports and schema references. Social owns profile-to-article authorship because Social sits above Blog. Moving that association into Blog's admin just to display an author would create an upward dependency. Keep cross-module composition at the consumer that can legally read both sides.

## Verify the request, not only a method

A useful acceptance test sends a real SDK-shaped request through middleware, controller and owning service into local PostgreSQL. It reads the saved associations back and checks another Subject's denial. An exception filter translates failures at the HTTP boundary; the service still needs a clear domain error and a test for its state change. For multi-record writes, verify rollback and retry behavior at the owning transaction boundary.

The commerce integration follows that method for cart creation, quantity updates, deletion and dummy checkout. Its external transports are captured, while actual SQL and provider-created Invoice records remain real. This distinguishes a successful HTTP response from a correctly saved operation. Use the module README, neighboring handlers and shared contracts to choose each file's home before adding another abstraction.

## Inspect the owner read path

Within one API process, an owning service can read its injected capabilities directly. A controller read that calls its own HTTP API introduces another authorization, parsing and cache pass. The repository includes audit:controller-read-self-http for this boundary; use its findings with the actual request trace when reviewing a custom reader.

## Source code

- [apps/api/app.ts](https://github.com/singlepagestartup/singlepagestartup/blob/main/apps/api/app.ts)
- [libs/modules/blog/models/article/backend/app/api/src/lib/bootstrap.ts](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/blog/models/article/backend/app/api/src/lib/bootstrap.ts)
- [libs/modules/blog/models/article/backend/app/api/src/lib/service/index.ts](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/blog/models/article/backend/app/api/src/lib/service/index.ts)
- [libs/modules/blog/models/article/backend/app/api/src/lib/repository.ts](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/blog/models/article/backend/app/api/src/lib/repository.ts)
- [libs/shared/backend/api/src/lib/service/crud/actions/find/index.ts](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/shared/backend/api/src/lib/service/crud/actions/find/index.ts)
- [libs/shared/backend/api/src/lib/middleware/parse-query/index.ts](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/shared/backend/api/src/lib/middleware/parse-query/index.ts)
- [.agents/contracts/engineering/code-placement.md](https://github.com/singlepagestartup/singlepagestartup/blob/main/.agents/contracts/engineering/code-placement.md)
- [.agents/contracts/engineering/module-dependencies.md](https://github.com/singlepagestartup/singlepagestartup/blob/main/.agents/contracts/engineering/module-dependencies.md)
