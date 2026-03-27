---
date: 2026-03-27T16:40:00+03:00
author: codex
repository: singlepagestartup
issue: 145
topic: "Admin-v2 rollout playbook: overview structure and relation rendering parity"
status: active
---

# ISSUE-145 Admin-v2 Rollout Playbook

This playbook is a mandatory implementation contract for all module migrations in ISSUE-145.

## 1. Canonical `admin-v2/overview` Structure

Each module must organize overview by model (same as ecommerce):

```text
libs/modules/<module>/frontend/component/src/lib/admin-v2/overview/
  Component.tsx
  interface.ts
  index.ts
  <model>/
    index.tsx
    interface.ts
    variants.ts
    admin-v2-card/
      Component.tsx
      interface.ts
      index.tsx
    admin-v2-table/
      ClientComponent.tsx
      Component.tsx
      interface.ts
      index.tsx
    admin-v2-form/
      ClientComponent.tsx
      Component.tsx
      interface.ts
      index.tsx
```

Rules:

- `overview/Component.tsx` renders model components by variant (`admin-v2-card`, `admin-v2-table`), not flat `*-card/*-table` files.
- `admin-v2-table/ClientComponent.tsx` is route-gated and only wires table -> admin form.
- `admin-v2-form/ClientComponent.tsx` is the only place for relation wiring at overview layer.

## 2. Relation-Bearing Model Form Contract

For any model with relations, model-level `singlepage/admin-v2/form/ClientComponent.tsx` must render:

- Main tabs: `Details` and `Relations`.
- Relations badge with relation section count.
- Nested tabs inside `Relations` (one tab per relation section).
- Relation tables only inside `Relations`, never inside `Details`.

Required behavior:

- Relation section rendering must use `isServer: false` in client context.
- If no relation sections are configured, render fallback:
  `No relations configured for this model.`

## 3. Responsibility Split

- `overview/<model>/admin-v2-form/ClientComponent.tsx`
  - Wires relation components with owner FK filters (`apiProps.params.filters.and`).
  - Wires `leftModelAdminForm` / `rightModelAdminForm` and labels.
- `models/<model>/singlepage/admin-v2/form/ClientComponent.tsx`
  - Owns UI (fields + `Details/Relations` + nested relation tabs).
  - Renders relation sections passed by props.
- `relations/<relation>/singlepage/admin-v2/*`
  - Owns relation CRUD/list row behavior and model open actions.

## 4. Anti-Patterns (Forbidden)

- Rendering relation tables inline under form fields inside `Details`.
- Building new module overviews as flat `*-card/*-table` folders.
- Passing `isServer={props.isServer}` when rendering relation callbacks in `"use client"` files.
- Duplicating relation wiring inline inside overview `admin-v2-table/ClientComponent`.

## 5. Migration Checklist (Copy/Paste)

Use this checklist before marking a module as migrated:

- [ ] Overview uses `overview/<model>/{index,interface,variants,admin-v2-*}` structure.
- [ ] `overview/Component.tsx` is variant-driven by model components.
- [ ] For each relation-bearing model form, `Details/Relations` tabs are implemented.
- [ ] Relation badge count matches number of configured relation sections.
- [ ] Relation tables are visible only when `Relations` tab is active.
- [ ] Relation callbacks render with `isServer: false` in client components.
- [ ] FK owner filters are applied in overview `admin-v2-form` relation wiring.
- [ ] E2E asserts relation tab behavior, not only relation API calls.
