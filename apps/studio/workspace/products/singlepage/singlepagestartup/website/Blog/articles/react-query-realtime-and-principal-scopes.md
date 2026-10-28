---
confirmation: { confirmed: false }
slug: "react-query-realtime-and-principal-scopes"
createdAt: "2026-10-23"
category: "frontend"
title: "React Query in SPS: mutations, realtime and principal scopes"
excerpt: "Keep SDK results current across tabs, preserve row identity and dispose protected content when its owner or entitlement changes."
cover: "react-query-realtime"
coverAlt: "A person considering work on a laptop in a bright studio."
author: "SinglePageStartup editorial"
authorRole: "Architecture and implementation notes"
---

A cart quantity can change through a local button, another browser or a backend service. The SPS frontend needs one current SDK result despite those different writers. React Query owns entity results. The action store records requests and revalidation diagnostics. A component's temporary selection and pending state remain with that component. Keeping these owners distinct prevents an event snapshot from becoming an accidental database replica in the browser.

## Describe the complete query

Factory find, findById and count operations use consistencyQueryKey with the route, parameters and API host. The resulting partition also separates authenticated principals without putting raw credentials in the key. A page filter, offset or different API origin describes different data. Hand-written operations should use the same helper instead of an abbreviated key that can reuse another request's result.

```ts
import { consistencyQueryKey } from "@sps/shared-frontend-client-api";

const key = consistencyQueryKey("/api/blog/articles", { filters: { and: [{ column: "slug", method: "eq", value: articleSlug }] } }, clientHost);
```

The variables in this example come from the owning reader. The [TanStack Query key guide](https://tanstack.com/query/v5/docs/framework/react/guides/query-keys) explains why inputs that change requested data belong in its key. SPS adds the host and principal rules because the same model route can be read against different accounts and servers.

## Apply mutations without inventing membership

The shared mutation factory handles cache changes before the consumer's onSuccess callback. Create deduplicates by ID and reconciles count; update patches existing detail and list records; delete removes matching records and reconciles count. Hand-written SDK mutations use the same shared helpers and retain action tracking. A toast callback must not replace that internal work.

A filtered or paginated list needs membership reasoning. A newly created Article may not belong in the current category, sort position or page. The append helper limits direct insertion to lists whose membership it can establish and uses reconciliation for unknown membership. Patch and remove keep untouched row references. That allows memoized rows with stable ID keys to retain their props when another row changes.

## Reconcile other writers

Host owns the shared WebSocket connection. Successful API responses can attach an opaque consistency reference to the matching query. The server derives its dependencies from actual reads, including empty relations and count requests. Accepted references receive addressed invalidation and replay. Queries without that coverage keep their established legacy subscription and topic metadata.

Use the shared subscription lifecycle and return its cleanup from an effect. Creating a socket for every card multiplies connection ownership; adding a periodic entity timer creates another refresh path. The transport contract already defines reconnect behavior, leases and a fallback version check. Incoming invalidations coalesce while a request is running, so a late initial response cannot consume the refresh that arrived during it.

## Treat account changes as data changes

A different principal resets private query data, subscriptions and the realtime cursor. A refreshed JWT for the same principal can retain mounted data while queries reconcile. A 401 or 403 reconciliation clears loaded private content. These are data-lifetime rules, not only navigation rules: hiding a section while its protected result stays reachable in a shared cache leaves the old data available to other mounted readers.

Protected Article content uses QueryScopeProvider with the existing QueryClient. The scope contains a non-secret resource key and a unique mounted-instance owner. Descendant factory queries inherit that scope and use gcTime zero. Disposal cancels and removes only that scope's entries. Public lists and another open protected block retain their own cache and observers. The server remains responsible for permission checks on every protected read.

## Verify the lifecycle

The article reader derives a deadline from server-checked access and discards protected results when it expires, then asks the canonical operation again. File Storage has a separate protected-byte lifetime. Test those transitions with two subjects and two mounted scopes: a refresh or unmount of one block must not erase another block's public data. Use per-item pending IDs for mutations and stable callbacks for row actions. Keep form subscriptions at the lowest component that needs them. Finally reload the page: the sessionStorage action snapshot is diagnostic and is never restored as entity data or persistent UI state.

## Preserve scope ownership

Caller query options must not replace a protected scope's key or ownership metadata. A generic cache removal by model route is too broad when two protected sections use that model. Test closing one section while the other is fetching, then remount the first: cancellation from the disposed instance must not remove the replacement instance's active query.

## Source code

- [libs/shared/frontend/client/api/README.md](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/shared/frontend/client/api/README.md)
- [libs/shared/frontend/client/store/README.md](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/shared/frontend/client/store/README.md)
- [libs/middlewares/src/lib/revalidation/README.md](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/middlewares/src/lib/revalidation/README.md)
- [libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/blog-module/article/private-content-default/client.tsx](https://github.com/singlepagestartup/singlepagestartup/tree/main/libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/blog-module/article/private-content-default) (directory; file is currently in the local branch)
- [libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/blog-module/article/private-content-default/ClientComponent.tsx](https://github.com/singlepagestartup/singlepagestartup/blob/main/libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/me/blog-module/article/private-content-default/ClientComponent.tsx)
