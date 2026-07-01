# Summary

Completes issue #201 by moving the remaining reusable runnable draft surfaces into the Storybook-backed module catalog. Storybook now exposes host page recipes for runnable routes, module-owned chat/profile and admin-v2 blocks, and relation-level admin management where ownership belongs to a relation instead of a page.

# Changes

- Added a runnable migration matrix and retained runnable contract documenting which runnable sources are migrated, replaced, or intentionally retained.
- Added Storybook host page recipes for chat/profile and admin/admin-v2 routes, including dashboard, settings, account settings, module dashboard, model list/edit, drawer, relation manager, and preview states.
- Added module-owned Storybook blocks for social chat/thread/message/widget surfaces, ecommerce admin-v2 product list/form, blog admin-v2 article list, RBAC subject settings, website-builder admin navigation/editor, and ecommerce `products-to-attributes` relation management.
- Renamed startup widget draft story files to Storybook-discoverable `*.stories.tsx` filenames and updated validation so manifest `files.story` paths must match Storybook discovery.
- Regenerated the drafts module inventory and recorded implementation evidence in issue #201 workflow artifacts.

# Verification

- [x] `npm run drafts:validate`
- [x] `npm run drafts:ds:inventory`
- [x] `npm run drafts:ds:validate`
- [x] `npm run drafts:storybook:build`
- [x] Running Storybook `index.json` check on `http://127.0.0.1:4320/index.json` returned `200`, 154 entries, and no missing required migrated story IDs.
- [x] Browser preview iframe checks passed for representative admin dashboard, chat page, chat list/workspace, admin model edit, and startup override stories.

# Notes

- No remote Figma transfer/sync/create/update work was performed. Figma work remains blocked until Storybook is reviewed and approved.
- `apps/drafts/runnable/singlepage/examples/basic-html` remains as the standalone runnable smoke example. The larger runnable imports remain only as source material/traceability until Storybook review confirms they can be trimmed or removed.
