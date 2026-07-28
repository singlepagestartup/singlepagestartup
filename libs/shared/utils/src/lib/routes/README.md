# Shared route-matching primitive (`@sps/shared-utils`)

`RouteMatcher` + `IRouteRule` + `composeRouteRules` are the single tested
matching primitive every SPS middleware that gates behavior on the request path
relies on (issue #195 DX follow-up). It lives in `@sps/shared-utils` — not in
the middlewares lib — so any layer can match a path without importing middleware
code, and the primitive can be reused by future framework code beyond
middlewares.

## The primitive

A rule is `{ regexPath, methods?, deny? }`; an omitted/empty `methods` matches
any method. `composeRouteRules([...layers])` flattens layers (dropping
`undefined`). The matcher is pure and dependency-free, so route lists are
unit-testable in isolation — without instantiating the middleware class (which
pulls heavy server SDKs).

```ts
import { RouteMatcher, composeRouteRules, createLayeredRouteMatcher } from "@sps/shared-utils";
```

### `deny` — subtractive overrides (issue #195)

`matches(path, method)` returns `true` iff at least one allow (non-`deny`) rule
matches AND no `deny` rule matches — **deny wins**. With no `deny` rule present
the matcher is a plain boolean-OR over the allow rules, so the field is
backward-compatible: existing rule sets behave exactly as before.

`deny` is what lets a project `startup.ts` SUBTRACT a framework default without
forking `singlepage.ts` — e.g. lock down an is-authorized public route, or
re-enable caching of a default-excluded read. `composeRouteRules` is unchanged;
deny rules simply flow through the layers and are honored by the matcher.

### `createLayeredRouteMatcher` — the shared three-layer factory

Every path-gating middleware builds the same matcher:
**constructor options → project `startup.ts` → framework `singlepage.ts`**.
`createLayeredRouteMatcher(optionRoutes, startupRoutes, singlepageRoutes)` is the
single shared definition each middleware's `routes/index.ts` delegates to
(keeping its own named factory export), so the composition lives in one place.

## Per-middleware layout (the primary consumers)

Each middleware composes three layers through this matcher:

```
<middleware>/
  routes/
    singlepage.ts   # framework defaults (ships with the framework)
    startup.ts      # per-project extension (edited per project, empty by default)
    index.ts        # createXMatcher(optionRoutes) — composes the 3 layers
    index.spec.ts   # pure, fast tests for the route list
  index.ts          # middleware uses the matcher; accepts IMiddlewareOptions
```

Precedence (order is irrelevant for boolean matching, kept for readability):
**constructor options → project `startup.ts` → framework `singlepage.ts`**.

This mirrors how `libs/modules/startup` extends controllers: the framework ships
sane defaults in `singlepage`, projects extend in `startup`, and programmatic
callers pass extra rules through the middleware constructor.

| Middleware       | Semantic                    | Matcher factory                      |
| ---------------- | --------------------------- | ------------------------------------ |
| `http-cache`     | bypass cache                | `createExcludedRoutesMatcher`        |
| `is-authorized`  | allow without auth          | `createAllowedRoutesMatcher`         |
| `actions-logger` | log this mutation           | `createLoggingRoutesMatcher`         |
| `bill-route`     | require billing             | `createBillingRoutesMatcher`         |
| `observer`       | skip observer pipeline      | `createSkippedRoutesMatcher`         |
| `revalidation`   | skip revalidation broadcast | `createNotRevalidatingRoutesMatcher` |

`revalidation` additionally has topic RULES (a different data shape) in
`topic-rules.ts` (framework) + `startup.ts` (project) — its `routes/` folder
only holds the skip-revalidation route list.

## Why pure route files

The `routes/*.ts` files import nothing but this primitive, so their specs run
without instantiating the middleware class. Each route list is documented
behavior with its own fast BDD suite.

## Extending from a project (upgrade safety)

The **PRIMARY, upgrade-safe extension seam is the constructor-options path** in
`apps/api/app.ts`. Prefer it: it survives base-module syncs untouched, and it is
evaluated first of all layers.

```ts
// apps/api/app.ts
new HTTPCacheMiddleware({
  excludedRoutes: [{ regexPath: /^\/api\/crm\/boards\/[0-9a-f-]+\/burndown$/i }],
});
new IsAuthorizedMiddleware({
  allowedRoutes: [
    { regexPath: /\/api\/crm\/public-webhooks\/.*/, methods: ["POST"] },
    // Subtract a framework default without forking singlepage.ts:
    { regexPath: /some-default-public-route/, deny: true },
  ],
});
```

Editing the relevant `routes/startup.ts` directly is also supported (no rebuild
of framework code, no fork). `startup.ts` is **project-owned and preserved
across base-module syncs** — the framework only ships `singlepage.ts`, so a sync
never overwrites your `startup.ts`. A fresh scaffold, however, starts it empty,
so the constructor-options path is the more durable choice for portable config.

Use `deny` rules in either seam to subtract a framework default rather than
forking the shipped `singlepage.ts` list.
