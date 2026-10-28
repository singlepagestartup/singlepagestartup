---
confirmation: { confirmed: false }
slug: "framework-private-content-audit"
createdAt: "2026-10-23"
category: "backend"
title: "Private Blog content in SPS: resource guards and paid guest access"
excerpt: "Protect the ordered Widget graph and its files, evaluate the owned payment period on the server and keep public article content readable."
cover: "subscription-access"
coverAlt: "Two people reviewing a laptop together in a bright workroom."
author: "SinglePageStartup editorial"
authorRole: "Architecture and implementation notes"
---

A closed Article section is an access rule over saved resources. The page can show a lock, but a caller can also request the Website Builder Widget, a nested Slide, a relation row or the managed file directly. SPS therefore classifies private article content in the backend and checks those reads before response caches. The public Article title and body remain public; protected content enters the page through a separate Subject-scoped operation.

## Mark the association explicitly

An Article→Website Builder Widget relation with variant private marks a protected root. An Article→Ecommerce Product relation with variant subscription identifies an accepted subscription product. Ordinary default product links retain their cross-promotion meaning. Changing a page variant or adding a lock icon cannot replace those associations, because another URL can render the same Article.

The graph reader follows the supported Website Builder edges through Features, Sliders, Slides, Buttons Arrays, Buttons, Logotypes and File Storage. Relation records are resources too. A shared descendant or unmanaged external file needs a deliberate isolated copy before private classification. Reusing the same protected object in a public composition would make its access meaning ambiguous. Prepare and verify the saved graph before publishing its private marker.

## Evaluate the owned entitlement

The RBAC access operation combines the current Subject's owned Orders, product lines, current Role grants and the Article's explicit subscription products. A qualifying Order is history, has an allowed active delivery status, resolves to a subscription checkout and contains the matching Product. Its server-owned period start, end and accepted Invoice anchor must exist, with no explicit revocation. The current time must fall inside that fixed period.

The absence of a login Identity does not invalidate an otherwise qualifying guest JWT. A guest Subject can own a paid subscription and a current Role grant. A different Subject's Order cannot provide that entitlement. An unentitled guest can receive a guest presentation state, while an authenticated non-subscriber receives locked. Authentication presentation and ownership of paid access are separate facts.

```ts
const content = await subjectApi.blogModuleArticleFindByIdContentFind({
  id: currentSubjectId,
  blogModuleArticleId: articleId,
  options: {
    headers: {
      Authorization: "Bearer " + sessionToken,
      "Cache-Control": "no-store",
    },
  },
});
```

This owning SDK operation returns ordered items and server-checked access. Its controller requires the JWT's own Subject ID. An allowed resource name or a frontend boolean is not an entitlement input. Keep the token in the existing session mechanism; the example shows the request boundary, not a new token store.

## Keep denied results empty of private data

The content result preserves public nodes and opaque locked slots in orderIndex order. A denied private item contains its access state, not its Widget, relation, descendant IDs or body. The client can render the lock at the right position without downloading the hidden content. Granted private items include their effective expiry so the existing reader can dispose them at the deadline and recheck the canonical operation.

Raw protected by-ID reads are denied. List and count operations receive conjunctive restrictions before database pagination and aggregation. The guard runs after query parsing and before either API response cache. Protected responses use private, no-store and vary by authorization context. A cache hit warmed by one subscriber must never answer another subject's request before authorization.

## Protect the managed bytes

File IDs and managed-path aliases must resolve to the same protected classification. The static byte guard runs before the raw static response; the File content operation also checks access. GET, HEAD and range requests all require the same entitlement. A private image should use the authenticated File Storage content SDK and a disposable browser object URL. A generic image URL or image optimizer cannot be assumed to forward the caller's bearer token.

## Test revocation and the exact boundary

The fixed Order period comes from trusted paid-invoice acceptance. Generic create or update inputs cannot extend it, and ordinary metadata edits cannot move its deadline. Removing a granting Role revokes the associated access durably; an ordinary proceed retry must not recreate a deliberately removed grant. Check the persisted revocation and a real subsequent read.

The PostgreSQL/Hono integration exercises native Date values at end minus one millisecond and exactly at end, both response caches, a paid guest, another subject, an unpaid guest and anonymous callers. It also probes all supported graph edges and file aliases. Use that matrix when changing the access reader: a visually convincing lock proves only the presentation, while direct resources and bytes establish the access rule.

## Source code

- [libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/blog/article/access.ts](https://github.com/singlepagestartup/singlepagestartup/tree/main/libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage) (directory; file is currently in the local branch)
- [libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/blog/article/graph.ts](https://github.com/singlepagestartup/singlepagestartup/tree/main/libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage) (directory; file is currently in the local branch)
- [libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/protected-blog-content/index.ts](https://github.com/singlepagestartup/singlepagestartup/tree/main/libs/modules/rbac/models/subject/backend/app/middlewares/src/lib) (directory; file is currently in the local branch)
- [libs/modules/rbac/models/subject/sdk/model/src/lib/blog-article-content.ts](https://github.com/singlepagestartup/singlepagestartup/tree/main/libs/modules/rbac/models/subject/sdk/model/src/lib) (directory; file is currently in the local branch)
- [libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage/subscription-period/index.ts](https://github.com/singlepagestartup/singlepagestartup/tree/main/libs/modules/ecommerce/models/order/backend/app/api/src/lib/service/singlepage) (directory; file is currently in the local branch)
- [libs/modules/file-storage/models/file/sdk/server/src/lib/singlepage/content.ts](https://github.com/singlepagestartup/singlepagestartup/tree/main/libs/modules/file-storage/models/file/sdk/server/src/lib/singlepage) (directory; file is currently in the local branch)
- [apps/api/specs/integration/private-content.integration.spec.ts](https://github.com/singlepagestartup/singlepagestartup/tree/main/apps/api/specs/integration) (directory; file is currently in the local branch)
