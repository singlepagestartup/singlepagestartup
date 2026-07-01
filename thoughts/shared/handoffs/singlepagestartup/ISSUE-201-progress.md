---
issue_number: 201
issue_title: "Migrate remaining runnable drafts into the Storybook module catalog"
start_date: 2026-06-30T22:48:07Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-201.md
status: complete
completed_date: 2026-06-30T23:22:41Z
---

# Implementation Progress: ISSUE-201 - Migrate remaining runnable drafts into the Storybook module catalog

**Started**: 2026-06-30
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-201.md`

## Phase Progress

### Phase 1: Runnable Inventory And Ownership Matrix

- [x] Started: 2026-06-30T22:48:07Z
- [x] Completed: 2026-06-30T22:54:30Z
- [x] Automated verification: `npm run drafts:validate` passed; validated 4 runnable draft manifests.

**Notes**: Added `apps/drafts/inventory/runnable-migration.md` and `apps/drafts/runnable/README.md`. Remote Figma work remains out of scope; current work is limited to repository code and local draft validation metadata. The user explicitly confirmed continuing through all phases without waiting for a separate manual phase handoff.

### Phase 2: Storybook Discoverability And Validation Guardrails

- [x] Started: 2026-06-30T22:54:30Z
- [x] Completed: 2026-06-30T23:22:41Z
- [x] Automated verification: `npm run drafts:ds:validate` and `npm run drafts:storybook:build` passed; `rg -n "draft-story" apps/drafts/modules` found no remaining non-discoverable draft story names.

**Notes**: Renamed the two startup widget stories from `*.draft-story.tsx` to `*.stories.tsx`, updated their manifests and local `figma.json` metadata, and tightened design-system validation so manifest `files.story` paths must match the Storybook-discoverable suffixes.

### Phase 3: Migrate Public Reusable Blocks And Page Recipes

- [x] Started: 2026-06-30T22:54:30Z
- [x] Completed: 2026-06-30T23:22:41Z
- [x] Automated verification: `npm run drafts:validate`, `npm run drafts:ds:inventory`, `npm run drafts:ds:validate`, and `npm run drafts:storybook:build` passed.

**Notes**: Added social chat/thread/message/widget Storybook blocks and host page recipes for chat and profile. The runnable chat list and chat overview are owned by `social.widget` as separate `chat-list-default` and `chat-overview-default` widgets; `host.page.chat-default` composes them, and no `social.chat.workspace-default` story remains. Existing runnable public routes for services, service detail, checkout, auth, blog article, and author pages are exposed through host page story aliases in the Storybook index.

### Phase 4: Admin Panel And Admin-V2 Storybook Migration

- [x] Started: 2026-06-30T22:54:30Z
- [x] Completed: 2026-06-30T23:22:41Z
- [x] Automated verification: `npm run drafts:ds:validate` and `npm run drafts:storybook:build` passed.

**Notes**: Added host admin page recipes for dashboard, settings, account settings, module dashboard, model list, model edit, entity drawer, relation manager, and preview dialog. Added module-owned admin-v2 blocks for website-builder navigation/editor, ecommerce product list/form, ecommerce products-to-attributes relation manager, blog article list, and RBAC subject settings.

### Phase 5: Runnable Cleanup And Retention

- [x] Started: 2026-06-30T22:54:30Z
- [x] Completed: 2026-06-30T23:22:41Z
- [x] Automated verification: `npm run drafts:validate` passed after the retained runnable contract update.

**Notes**: Kept runnable entries as imported source material/traceability until the user completes Storybook review. The only retained standalone runnable example is `singlepage/examples/basic-html`; reusable `singlepage/admin-v2`, `startup/singlepagestartup`, and `singlepage/admin-panel-redesign-html` surfaces are classified as migrated/replaced in the matrix and README.

### Phase 6: Final Verification And Review Evidence

- [x] Started: 2026-06-30T23:00:00Z
- [x] Completed: 2026-06-30T23:22:41Z
- [x] Automated verification: `npm run drafts:validate`, `npm run drafts:ds:inventory`, `npm run drafts:ds:validate`, and `npm run drafts:storybook:build` passed.

**Notes**: Storybook is running at `http://127.0.0.1:4320/`. Browser verification confirmed `http://127.0.0.1:4320/index.json` returns the migrated story IDs; final local HTTP check returned `200` with 153 entries and no missing required story IDs. Preview iframe checks passed for `host.page.admin-dashboard`, `host.page.chat-default`, `social.widget.chat-list-default`, `social.widget.chat-overview-default`, `host.page.admin-model-edit`, and the startup widget override.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 0 -->

## Summary

### Changes Made

- Added `apps/drafts/inventory/runnable-migration.md` with outcome rows for runnable entries, app shell/runtime sources, public page components, admin/admin-v2 components, generated UI primitives, and startup mirror handling.
- Added `apps/drafts/runnable/README.md` with the retained runnable contract, current runnable entry status, and matrix links.
- Added/updated Storybook stories and manifests for host page routes, social chat surfaces, admin-v2 pages, module-owned admin blocks, and relation management.
- Updated design-system validation so manifest-declared story paths must be Storybook-discoverable.
- Verified runnable manifests with `npm run drafts:validate` (4 manifests OK).
- Regenerated `apps/drafts/inventory/modules.generated.json` with `npm run drafts:ds:inventory` (`modules=16 entities=156 variants=1836 covered=17`).
- Verified design-system manifests with `npm run drafts:ds:validate`.
- Built Storybook with `npm run drafts:storybook:build`.
- Verified the running Storybook index and representative preview iframe stories in Browser.

### Pull Request

- [x] PR created: https://github.com/singlepagestartup/singlepagestartup/pull/202
- [x] PR number: 202

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [x] Issue moved to Code Review

---

**Last updated**: 2026-07-01T07:57:07Z
