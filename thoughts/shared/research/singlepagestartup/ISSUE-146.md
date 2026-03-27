---
date: 2026-03-28T01:43:35+03:00
researcher: flakecode
git_commit: 77adb3b3192c29a77b9e3cde32bd3ea9533d8b3c
branch: main
repository: singlepagestartup
topic: "Close admin-panel-draft and align with admin implementation + e2e admin lifecycle"
tags: [research, codebase, admin, admin-panel-draft, e2e, rbac]
status: complete
last_updated: 2026-03-28
last_updated_by: flakecode
---

# Research: Close admin-panel-draft and align with admin implementation + e2e admin lifecycle

**Date**: 2026-03-28T01:43:35+03:00  
**Researcher**: flakecode  
**Git Commit**: 77adb3b3192c29a77b9e3cde32bd3ea9533d8b3c  
**Branch**: main  
**Repository**: singlepagestartup

## Research Question

What is the current implementation split between `apps/host/src/components/admin` and `apps/host/src/components/admin-panel-draft`, how current `/admin` e2e coverage is wired, and what RBAC subject lifecycle automation already exists for create/delete in `apps/api`?

## Summary

- URLs under `/admin` are routed to `admin-panel-draft` at page level.
- The legacy `admin` component is still mounted globally in `app/layout.tsx` and is RBAC-gated by current subject + `admin` role relation.
- Existing Host singlepage e2e scenarios for admin shell/navigation/visibility currently assert `admin-panel-draft` test IDs and run with browser-level API mocks.
- `apps/api/create_rbac_subject.sh` exists and performs registration, authentication, role lookup, and `subjects-to-roles` patch to `admin`.
- `apps/api/delete_rbac_subject.sh` is not present in the repository at the time of this research.

## Detailed Findings

### 1. Host admin routing and render entrypoints

- Catch-all Host page routes any URL starting with `/admin` to `AdminPanelDraft` (`apps/host/app/[[...url]]/page.tsx:55`).
- The same file imports `AdminPanelDraft` from `../../src/components/admin-panel-draft` (`apps/host/app/[[...url]]/page.tsx:7`).
- Root layout independently mounts `Admin` from `../src/components/admin` before page children (`apps/host/app/layout.tsx:11`, `apps/host/app/layout.tsx:45`).

### 2. Current `admin` component behavior (legacy overlay path)

- `admin/ClientComponent.tsx` fetches authenticated subject via RBAC subject variant `authentication-me-default` (`apps/host/src/components/admin/ClientComponent.tsx:10`).
- It then loads RBAC roles with `variant="find"`, resolves `slug === "admin"`, and filters `subjects-to-roles` by `subjectId` and `roleId` (`apps/host/src/components/admin/ClientComponent.tsx:17`, `apps/host/src/components/admin/ClientComponent.tsx:19`, `apps/host/src/components/admin/ClientComponent.tsx:28`).
- Dashboard rendering occurs only when matching `subjects-to-roles` records exist (`apps/host/src/components/admin/ClientComponent.tsx:50`, `apps/host/src/components/admin/ClientComponent.tsx:55`).
- Dashboard UX is a floating `Admin` button that toggles an in-page section and module widget switcher (`apps/host/src/components/admin/assets/Dashboard.tsx:28`, `apps/host/src/components/admin/assets/Dashboard.tsx:38`, `apps/host/src/components/admin/assets/Dashboard.tsx:148`).

### 3. Current `admin-panel-draft` behavior (active `/admin` page path)

- `admin-panel-draft` root renders with `data-variant="admin-panel-draft"`, `data-testid="admin-prototype-body"`, and nested `data-testid="admin-prototype-root"` (`apps/host/src/components/admin-panel-draft/Component.tsx:73`, `apps/host/src/components/admin-panel-draft/Component.tsx:74`, `apps/host/src/components/admin-panel-draft/Component.tsx:80`).
- Sidebar shell uses shared admin-v2 panel with `settingsHref="/admin/settings"` (`apps/host/src/components/admin-panel-draft/Component.tsx:66`, `apps/host/src/components/admin-panel-draft/Component.tsx:81`).
- Header account action links to `/admin/profile` (`apps/host/src/components/admin-panel-draft/Component.tsx:164`).
- Module overview/sidebar items from all listed modules are mounted through `AdminV2Overview`/`AdminV2SidebarModuleItem` component imports (`apps/host/src/components/admin-panel-draft/Component.tsx:2` through `apps/host/src/components/admin-panel-draft/Component.tsx:61`).
- Settings and account page component imports exist but are commented out in this component file (`apps/host/src/components/admin-panel-draft/Component.tsx:62`, `apps/host/src/components/admin-panel-draft/Component.tsx:63`, `apps/host/src/components/admin-panel-draft/Component.tsx:197`).

### 4. Settings/account draft subcomponents that exist in codebase

- Settings page client component defines `data-testid="settings-page"` and operation actions for `/api/http-cache/clear` and `/api/revalidate?path=/&type=layout` (`apps/host/src/components/admin-panel-draft/settings-page/ClientComponent.tsx:114`, `apps/host/src/components/admin-panel-draft/settings-page/data.ts:15`, `apps/host/src/components/admin-panel-draft/settings-page/data.ts:24`).
- Account settings page client component defines `data-testid="account-settings-page"` and renders typed sample data from local `data.ts` exports (`apps/host/src/components/admin-panel-draft/account-settings-page/ClientComponent.tsx:115`, `apps/host/src/components/admin-panel-draft/account-settings-page/data.ts:49`, `apps/host/src/components/admin-panel-draft/account-settings-page/data.ts:57`).

### 5. Existing admin e2e coverage wiring

- `admin-shell.e2e.ts` navigates `/admin`, checks `admin-prototype-*` test IDs, uses settings button route assertions, and navigates ecommerce model links (`apps/host/e2e/singlepage/admin-shell.e2e.ts:18`, `apps/host/e2e/singlepage/admin-shell.e2e.ts:19`, `apps/host/e2e/singlepage/admin-shell.e2e.ts:42`, `apps/host/e2e/singlepage/admin-shell.e2e.ts:56`).
- `admin-visibility-guards.e2e.ts` asserts visibility/hidden states between `admin-prototype-root`, `settings-page`, and `account-settings-page` for `/admin`, `/admin/settings`, and `/admin/settings/account` paths (`apps/host/e2e/singlepage/admin-visibility-guards.e2e.ts:17`, `apps/host/e2e/singlepage/admin-visibility-guards.e2e.ts:69`, `apps/host/e2e/singlepage/admin-visibility-guards.e2e.ts:87`).
- These tests currently call `setupEcommerceApiMocks(page)` (browser request interception) rather than provisioning real API-side RBAC users (`apps/host/e2e/singlepage/admin-shell.e2e.ts:15`, `apps/host/e2e/singlepage/admin-visibility-guards.e2e.ts:15`, `apps/host/e2e/support/mock-ecommerce-api.ts:269`).
- Playwright config defaults to reuse-first mode with optional managed webserver (`apps/host/playwright.config.ts:15`, `apps/host/playwright.config.ts:17`, `apps/host/playwright.config.ts:49`).
- Root npm scripts for singlepage e2e set `PW_SKIP_WEBSERVER=1` by default (`package.json:21`, `package.json:22`).

### 6. RBAC subject lifecycle scripts in `apps/api`

- `create_rbac_subject.sh` reads `RBAC_SUBJECT_IDENTITY_EMAIL`, `RBAC_SUBJECT_IDENTITY_PASSWORD`, and `RBAC_SECRET_KEY` from env (`apps/api/create_rbac_subject.sh:8`, `apps/api/create_rbac_subject.sh:9`, `apps/api/create_rbac_subject.sh:10`).
- It calls registration and authentication endpoints, extracts JWT, loads current subject via `/authentication/me`, loads `/subjects-to-roles`, resolves admin role from `/roles`, and patches subject-role relation (`apps/api/create_rbac_subject.sh:29`, `apps/api/create_rbac_subject.sh:34`, `apps/api/create_rbac_subject.sh:52`, `apps/api/create_rbac_subject.sh:70`, `apps/api/create_rbac_subject.sh:92`, `apps/api/create_rbac_subject.sh:116`).
- `create_env.sh` seeds default RBAC subject email/password values into API `.env` (`apps/api/create_env.sh:92`, `apps/api/create_env.sh:93`).
- `apps/api/delete_rbac_subject.sh` is currently absent (`missing apps/api/delete_rbac_subject.sh`, filesystem check during this research).

## Code References

- `apps/host/app/[[...url]]/page.tsx:7`
- `apps/host/app/[[...url]]/page.tsx:55`
- `apps/host/app/layout.tsx:11`
- `apps/host/app/layout.tsx:45`
- `apps/host/src/components/admin/ClientComponent.tsx:10`
- `apps/host/src/components/admin/ClientComponent.tsx:28`
- `apps/host/src/components/admin/assets/Dashboard.tsx:28`
- `apps/host/src/components/admin/assets/Dashboard.tsx:38`
- `apps/host/src/components/admin-panel-draft/Component.tsx:73`
- `apps/host/src/components/admin-panel-draft/Component.tsx:81`
- `apps/host/src/components/admin-panel-draft/Component.tsx:164`
- `apps/host/src/components/admin-panel-draft/Component.tsx:197`
- `apps/host/src/components/admin-panel-draft/settings-page/ClientComponent.tsx:114`
- `apps/host/src/components/admin-panel-draft/settings-page/data.ts:15`
- `apps/host/src/components/admin-panel-draft/account-settings-page/ClientComponent.tsx:115`
- `apps/host/src/components/admin-panel-draft/account-settings-page/data.ts:49`
- `apps/host/e2e/singlepage/admin-shell.e2e.ts:18`
- `apps/host/e2e/singlepage/admin-shell.e2e.ts:42`
- `apps/host/e2e/singlepage/admin-visibility-guards.e2e.ts:69`
- `apps/host/e2e/support/mock-ecommerce-api.ts:269`
- `apps/host/playwright.config.ts:15`
- `package.json:21`
- `apps/api/create_rbac_subject.sh:29`
- `apps/api/create_rbac_subject.sh:116`
- `apps/api/create_env.sh:92`

## Architecture Documentation

- Current host-level admin rendering has two coexisting paths:
  - Route-level `/admin` rendering through `admin-panel-draft` (`apps/host/app/[[...url]]/page.tsx:55`).
  - Layout-level RBAC-gated `admin` overlay component (`apps/host/app/layout.tsx:45`, `apps/host/src/components/admin/ClientComponent.tsx:10`).
- Current singlepage e2e tests for admin shell behavior are implemented around route/UI contracts and API mocking helpers, not API-side RBAC subject provisioning scripts.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-142.md` documents earlier pilot context where `/admin` was routed to `admin-panel-draft` and settings/account scope boundaries were recorded at that stage.
- `thoughts/shared/research/singlepagestartup/ISSUE-145.md` records the broader admin-v2 rollout context and identifies host `/admin*` mounting through `admin-panel-draft`.
- `thoughts/shared/handoffs/singlepagestartup/ISSUE-145-progress.md` tracks global rollout completion status and admin-v2 parity incidents/fixes across modules.
- `thoughts/shared/research/singlepagestartup/ISSUE-145-admin-v2-playbook.md` captures the adopted migration contract for overview structure and relation-rendering behavior.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-142.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-145.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-145-admin-v2-playbook.md`
- `thoughts/shared/handoffs/singlepagestartup/ISSUE-145-progress.md`

## Open Questions

- Which specific e2e scenario in `apps/host/e2e/singlepage/` will own the real RBAC admin user lifecycle contract (`create_rbac_subject.sh` + cleanup) instead of mock-only setup?
- Where should `delete_rbac_subject.sh` be integrated in test orchestration (per-test teardown hook, suite teardown, or wrapper script) once added?
