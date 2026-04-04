---
date: 2026-04-04T12:00:00+03:00
researcher: flakecode
git_commit: 3aad4ae1f0631186bd0fdd2c1f4825666a9f3d26
branch: main
repository: singlepagestartup
topic: "Protect admin-v2 with RBAC authentication guard identical to admin"
tags: [research, codebase, admin-v2, admin, rbac, authentication]
status: complete
last_updated: 2026-04-04
last_updated_by: flakecode
---

# Research: Protect admin-v2 with RBAC authentication guard identical to admin

**Date**: 2026-04-04T12:00:00+03:00
**Researcher**: flakecode
**Git Commit**: 3aad4ae1f0631186bd0fdd2c1f4825666a9f3d26
**Branch**: main
**Repository**: singlepagestartup

## Research Question

How does the existing `admin` component protect access via user authentication, and how does the current `admin-v2` compare — what is needed to align them?

## Summary

- **admin-v2 already has the RBAC authentication guard** in `apps/host/src/components/admin-v2/ClientComponent.tsx`. It is structurally identical to the old admin guard in `apps/host/src/components/admin/ClientComponent.tsx`.
- The guard chain is: `RbacSubject(authentication-me-default)` → `RbacRole(find)` → `RbacSubjectsToRoles(find)` — only renders children when the current user has the `admin` role.
- The `admin-v2/index.tsx` already wraps `Component` inside `ClientComponent`, so the guard is active.
- The old admin component is **no longer mounted** in `layout.tsx` (it was previously mounted globally as an overlay). Only admin-v2 is used now.
- `/admin` routing goes directly to admin-v2 via `apps/host/app/[[...url]]/page.tsx:55`.

## Detailed Findings

### 1. Routing: How `/admin` URLs reach admin-v2

The catch-all route `apps/host/app/[[...url]]/page.tsx:55-56` checks if the URL starts with `/admin` and renders admin-v2:

```tsx
if (slashedUrl.startsWith("/admin")) {
  return <AdminV2 isServer={true} url={slashedUrl} language={language} />;
}
```

Import at `page.tsx:7`: `import { Component as AdminV2 } from "../../src/components/admin-v2";`

### 2. admin-v2 entry point wraps Component in auth guard

`apps/host/src/components/admin-v2/index.tsx:5-10`:

```tsx
export function Component(props: IComponentProps) {
  return (
    <ClientComponent>
      <ChildComponent {...props} />
    </ClientComponent>
  );
}
```

`ClientComponent` is the auth guard. `ChildComponent` is the actual admin panel UI. The guard wraps the UI — children only render when authentication passes.

### 3. admin-v2 auth guard (ClientComponent.tsx)

`apps/host/src/components/admin-v2/ClientComponent.tsx:1-65`:

- `"use client"` component
- Step 1: `RbacSubject` with `variant="authentication-me-default"` — reads JWT from cookie, decodes to get current user. Returns `null` if no user.
- Step 2: `RbacRole` with `variant="find"` — fetches all roles, finds the one with `slug === "admin"`. Returns `null` if no admin role exists.
- Step 3: `RbacSubjectsToRoles` with `variant="find"` — queries junction table filtered by `subjectId === me.id` AND `roleId === adminRole.id`. Returns `null` if no matching relation found.
- Only renders `props.children` when all three checks pass.

### 4. Old admin auth guard (for comparison)

`apps/host/src/components/admin/ClientComponent.tsx:1-65`:

- Identical 3-step chain: `RbacSubject(authentication-me-default)` → `RbacRole(find)` → `RbacSubjectsToRoles(find)`
- Minor differences:
  - Old admin returns `undefined` on auth failure; admin-v2 returns `null` (both render nothing)
  - Old admin renders `<Dashboard isServer={false} />` directly; admin-v2 renders `props.children`

### 5. Authentication mechanism details

**Client-side (used by both admin and admin-v2):**

- `authentication-me-default` with `isServer={false}` reads `rbac.subject.jwt` cookie via `react-cookie`
- Decodes JWT locally with `react-jwt` — no HTTP call needed
- JWT contains `{ subject: IModel }` where IModel has `id`, `slug`, `variant`, `createdAt`, `updatedAt`
- Key file: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/me-default/client.tsx`

**JWT initialization:**

- Root layout `apps/host/app/layout.tsx:42` mounts `<RbacSubject isServer={false} variant="authentication-init-default" />` which initializes the JWT cookie from the auth flow

**Role lookup:**

- `variant="find"` calls `GET /api/rbac/roles` to fetch all roles
- Client factory injects `Authorization: Bearer <jwt>` from cookie into all requests via `saturateHeaders`
- Key file: `libs/shared/frontend/client/utils/src/lib/saturate-headers/index.ts`

**Subject-to-role check:**

- `variant="find"` with filters calls `GET /api/rbac/subjects-to-roles?filters[and][0][column]=subjectId&...`
- Returns junction records; empty array means user does not have the admin role

### 6. Old admin component status

- `apps/host/src/components/admin/` directory still exists with all files
- It is **not imported or mounted anywhere** in the current routing or layout
- Previously it was mounted in `layout.tsx` as a global overlay with a floating "Admin" toggle button
- That import has been removed — layout.tsx no longer references it

## Code References

- `apps/host/app/[[...url]]/page.tsx:7` — AdminV2 import
- `apps/host/app/[[...url]]/page.tsx:55-56` — `/admin` routing to AdminV2
- `apps/host/app/layout.tsx:42` — RBAC auth init in root layout
- `apps/host/src/components/admin-v2/index.tsx:5-10` — entry point wrapping Component in ClientComponent
- `apps/host/src/components/admin-v2/ClientComponent.tsx:1-65` — RBAC auth guard (3-step chain)
- `apps/host/src/components/admin-v2/Component.tsx:70-207` — admin panel UI
- `apps/host/src/components/admin-v2/interface.ts:1-8` — IComponentProps
- `apps/host/src/components/admin/ClientComponent.tsx:1-65` — old admin auth guard (same pattern)
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/me-default/client.tsx` — JWT decode on client
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/authentication/me-default/server.tsx` — server auth via API call
- `libs/shared/frontend/client/utils/src/lib/saturate-headers/index.ts` — JWT header injection

## Architecture Documentation

- admin-v2 auth guard follows the established SPS pattern: render-prop chain of RBAC SDK components with `isServer={false}`, each step gating the next.
- The guard runs client-side only (all three RBAC components use `isServer={false}`). Server-side rendering of the page returns no admin content until the client hydrates and the JWT check completes.
- The pattern is: unauthenticated users see nothing (blank render); there is no redirect to a login page or explicit "access denied" message.

## Open Questions

- The auth guard already exists in admin-v2. Is the issue actually about something else — e.g., adding a redirect to login, showing an access denied message, or adding unit/integration test coverage for the auth flow?
- Should the old `admin` component directory be removed since it is no longer mounted anywhere?
