---
repository: singlepagestartup
issue_number: 297
status: Research Needed
created: 2026-09-22
---

# Issue: Measure whether public reads can be authorized through permissions alone

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/297
**Status**: Research Needed
**Created**: 2026-09-22
**Priority**: medium
**Size**: medium

---

## Problem to Solve

Public read access is currently described in two places, and the two do not
know about each other.

The allow-list in `libs/middlewares/src/lib/is-authorized/routes/singlepage.ts`
is a list of regular expressions in code. The permission records in
`libs/modules/rbac/models/permission/.../data/` are rows in the database. Both
can make the same route public, and a reader has to check both to know whether
a route is open.

The question this issue answers is **not** how to merge them. It is whether
merging them costs too much.

## What the code does today

`is-authorized` decides in this order:

1. the operator secret matches, `next()`
2. the allow-list matches, `next()`
3. otherwise, ask the permission service

Step 2 short-circuits. A route in the allow-list never reaches RBAC, which is
why permission records for those routes exist and go unused.

Permissions can already express public access without an anonymous role. In
`.../subject/.../service/singlepage/is-authorized.ts` a permission with no
roles attached authorizes everyone:

```ts
/**
 * Permissions without roles are public
 */
if (!permissionRoleIds.size) {
  authorized = true;
}
```

33 permission records already exist for the host, website-builder and
file-storage routes. All 33 are role-free, so all 33 are already public by that
rule. They simply never run, because the allow-list answers first.

So the mechanism needed to remove the allow-list exists and is populated. What
is unknown is the cost.

## Why performance is the deciding question

The two paths are not comparable in kind:

- **Allow-list**: synchronous regular-expression matching in process. No I/O.
- **Permissions**: an HTTP request the API makes to itself
  (`.../sdk/server/.../authentication/is-authorized.ts:54` calls `fetch`),
  which on a cache miss resolves the route through `resolveByRoute` — an exact
  lookup, then template permissions, then a method wildcard, each hitting the
  database.

Two memory caches sit in front of this, both 30s TTL: the middleware caches the
authorization outcome per route/method/credential, and the service caches the
permission resolution per route.

That 30 second TTL is the heart of the question. These are the routes the host
app calls anonymously while rendering pages, so they are among the most
frequently requested in the system. If the cache holds, the difference may be
negligible. If it turns over — many distinct routes, cold start, a deploy, an
invalidation — every miss becomes an HTTP round trip plus several queries, on
the hottest path in the API.

## Scope

Research first, and the research decides whether the rest happens.

1. Measure both paths under a realistic page render: cold cache, warm cache,
   and cache turnover. Report p50 and p95 for each, and the added load on the
   database and the API's own request budget.
2. Decide on the evidence. If the difference is small, consolidate: verify that
   the permission records cover every path the regular expressions open, add
   what is missing, then delete those allow-list rules. If the difference is
   material, keep the allow-list and instead document why two mechanisms exist
   and which one owns which route — the duplication is then deliberate rather
   than accidental.

Either outcome is a valid end to this issue. Writing the measurement down is
the deliverable; consolidation is conditional on it.

## Key Details

- Decision order: `libs/middlewares/src/lib/is-authorized/index.ts:59-64`
- Public-by-absence-of-roles rule:
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts:186-190`
- Resolution cost: `.../permission/backend/app/api/src/lib/service/singlepage/index.ts:177`
- The self-call: `.../subject/sdk/server/src/lib/singlepage/authentication/is-authorized.ts:54`
- Caches: middleware `ttlMs: 30_000, maxSize: 5000`; service `ttlMs: 30_000,
maxSize: 10_000`

## Implementation Notes

- This is not a security finding. Both mechanisms produce the same answer for
  these routes — public. The gain is one description instead of two.
- Coverage must be verified before any rule is deleted. The regular expressions
  match a shape (`/api/host/<entity>`, `/count`, `/<uuid>`), while permissions
  are per route. A path the regex opens but no record covers would close
  silently, and the host would stop rendering.
- The allow-list also carries rules unrelated to these modules (revalidation,
  rbac reads). Only the public module reads are in scope.
- Worth noting during research: three of those regular expressions were
  narrowed in #276, replacing a single unanchored prefix rule. The current
  shapes are recent and deliberate, not legacy.
