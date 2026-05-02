## Summary

Adds a universal shared REST `GET /count` capability and wires it through the backend, SDK, admin UI, OpenAPI, and MCP surfaces for issue 160.

## Changes

- Added shared backend `count` contracts, handler, CRUD service action, database repository implementation, and tests.
- Added shared frontend `count` action plus server/client SDK factory support.
- Updated admin-v2 module cards and model table totals to use `api.count` instead of hardcoded `0` or full-list `find().length` totals.
- Added explicit `/count` routes to customized module/relation controllers while keeping the shared route binder clean.
- Added OpenAPI `/count` documentation for SDK model paths and MCP `*-count` tools through a shared helper.
- Added issue-160 scenario coverage and workflow artifacts.

## Verification

- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-backend-api:jest:test`
- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-backend-api:tsc:build`
- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-backend-api:eslint:lint`
- [x] `bash tools/testing/test-scenario-issue.sh singlepagestartup 160`
- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-frontend-api:jest:test`
- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-frontend-api:tsc:build`
- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-frontend-client-api:tsc:build`
- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-frontend-server-api:tsc:build`
- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-frontend-components:jest:test`
- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-frontend-components:tsc:build`
- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-frontend-components:eslint:lint`
- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run-many --target=tsc:build --projects=@sps/agent,@sps/billing,@sps/broadcast,@sps/crm,@sps/ecommerce,@sps/file-storage,@sps/host,@sps/notification,@sps/rbac,@sps/social,@sps/telegram --parallel=3`
- [x] `npx -y @redocly/cli bundle ./openapi.yaml -o ./public/openapi-bundled.yaml` from `apps/openapi`
- [x] `npx -y @redocly/cli lint ./openapi.yaml` from `apps/openapi`
- [x] `npx tsc -p apps/mcp/tsconfig.json --noEmit`
- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run mcp:eslint:lint`
- [x] Browser: `/en/admin/ecommerce` card badges showed real counts, for example product `4`, attribute `12`, attribute-key `4`.
- [x] Browser: `/en/admin/ecommerce/attribute` footer showed `Page 1 of 1 (12 total)`.

## Notes

- The repository does not currently contain `thoughts/shared/pr_description.md`, so this PR body uses a fallback structure while preserving the requested `describe-pr` artifact path.
- `gh pr diff 168` could not return the full diff because the PR exceeds GitHub's 300-file diff API limit. Local `git diff origin/main...HEAD --stat` was used for the file/count review instead.
