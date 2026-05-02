---
issue_number: 160
issue_title: "Add universal REST /count endpoint and shared SDK support"
start_date: 2026-05-01T00:54:30Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-160.md
status: in_progress
---

# Implementation Progress: ISSUE-160 - Add universal REST /count endpoint and shared SDK support

**Started**: 2026-05-01
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-160.md`

## Phase Progress

### Phase 1: Extend The Shared Backend REST Stack

- [x] Started: 2026-05-01T00:58:01Z
- [x] Completed: 2026-05-01T01:03:50Z
- [x] Automated verification: PASSED

**Notes**: Added shared backend `/count` route handling, service/repository count contracts, shared database count implementation, controller/repository Jest coverage, and issue-160 DB-backed scenario coverage. Verification passed:
`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-backend-api:jest:test`;
`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-backend-api:tsc:build`;
`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-backend-api:eslint:lint`;
`bash tools/testing/test-scenario-issue.sh singlepagestartup 160`.

### Phase 2: Add Shared Frontend API And SDK Support

- [x] Started: 2026-05-01T21:13:40Z
- [x] Completed: 2026-05-01T21:52:03Z
- [x] Automated verification: PASSED

**Notes**: Added shared frontend `count` action, exported `ICountProps`, added server factory `api.count(...)`, added client factory React Query `api.count(...)` with `/count`-specific cache key, and covered URL/response behavior in shared frontend API tests. Verification passed:
`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-frontend-api:jest:test`;
`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-frontend-api:tsc:build`;
`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-frontend-client-api:tsc:build`;
`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-frontend-server-api:tsc:build`;
`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-frontend-components:tsc:build`.

### Phase 3: Migrate Shared Consumer And Lock In Behavior

- [x] Started: 2026-05-01T21:52:03Z
- [x] Completed: 2026-05-01T23:51:57Z
- [x] Automated verification: PASSED

**Notes**: Adjusted Phase 1 backend route strategy per user feedback: removed automatic `/count` insertion from shared `bindHttpRoutes` and added explicit `/count` routes to the 20 customized module/relation REST controllers that override their route lists. Migrated shared admin-v2 table totals from full-list `find().length` to `api.count({ params: { filters } })`, keeping paginated row loading on `find`; table client count/find calls now preserve `apiProps.options` and merge no-store headers like the card count calls. Added shared admin-v2 module overview card counts through the existing server/client card APIs, so module wrappers keep passing SDK APIs while shared card loaders call `api.count`. Added user-requested OpenAPI and MCP coverage for `/count`: 147 SDK `paths.yaml` count entries now document `/count` including telegram count-only path docs, `apps/openapi/openapi.yaml` references those paths, the local bundled spec was regenerated, and 143 MCP entity tools now expose `*-count` via a shared count-tool helper. Verification passed:
`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-frontend-components:jest:test`;
`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-frontend-components:eslint:lint`;
`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-frontend-components:tsc:build`;
`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/shared-backend-api:jest:test`;
`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run-many --target=tsc:build --projects=@sps/agent,@sps/billing,@sps/broadcast,@sps/crm,@sps/ecommerce,@sps/file-storage,@sps/host,@sps/notification,@sps/rbac,@sps/social,@sps/telegram --parallel=3`;
`bash tools/testing/test-scenario-issue.sh singlepagestartup 160`;
`npx -y @redocly/cli bundle ./openapi.yaml -o ./public/openapi-bundled.yaml` from `apps/openapi`;
`npx -y @redocly/cli lint ./openapi.yaml` from `apps/openapi`;
`npx tsc -p apps/mcp/tsconfig.json --noEmit`;
`NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run mcp:eslint:lint`;
Browser verification at `http://localhost:3000/en/admin/ecommerce` after reload showed ecommerce overview card count badges using real values (for example product `4`, attribute `12`, attribute-key `4`) instead of the static `0`.
Browser verification at `http://localhost:3000/en/admin/ecommerce/attribute` after reload showed table footer `Page 1 of 1 (12 total)`.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 3 -->

### Incident 1 - GitHub helper compatibility aliases missing

- **Occurrences**: 1
- **Stage**: Workflow preflight - Status gate
- **Symptom**: `.claude/helpers/get_issue_status.sh 160` failed before returning status because `load_config.sh` called `resolve_repo_context`, and `get_issue_status.sh` called `validate_project_artifact_context`; only `sps_resolve_repo_context` and `sps_validate_project_artifact_context` exist.
- **Root Cause**: The shared helper scripts mix legacy function and variable names with the newer `sps_*` repository context helpers.
- **Fix**: Ran the required status/update helpers through a narrow Bash compatibility shim that exports the legacy function names and `TARGET_REPO_*` aliases from the resolved `SPS_REPO_*` values.
- **Reusable Pattern**: If status/project helpers fail before querying the Project item, inspect helper naming drift before assuming GitHub Project data is missing.

### Incident 2 - Scenario Jest process stayed open after passing

- **Occurrences**: 2
- **Stage**: Phase 1 - Automated verification
- **Symptom**: `bash tools/testing/test-scenario-issue.sh singlepagestartup 160` reported the issue-160 scenario suite as passed, then printed Jest's open-handle warning and did not exit on its own.
- **Root Cause**: The scenario lane left asynchronous resources open after the test run, likely from the spawned local API and/or database provider handles.
- **Fix**: Stopped the spawned local API process on port 4000 after the scenario assertions passed, allowing the wrapper command to exit cleanly.
- **Reusable Pattern**: When a scenario suite reports success but remains open, check the scenario API port with `lsof -ti tcp:<port>` and stop the spawned API process after confirming test results.
  - Recurred during Phase 3 after rerunning the issue-160 scenario; same fix was applied.

### Incident 3 - OpenAPI lint failed on existing Telegram app request schema

- **Occurrences**: 1
- **Stage**: Phase 3 - OpenAPI/MCP documentation verification
- **Symptom**: `npx -y @redocly/cli lint ./openapi.yaml` failed with a `struct` error in `apps/openapi/apps/telegram/paths.yaml` because `data.url` appeared directly under `data`.
- **Root Cause**: The `/telegram/run` multipart schema modeled `data.url` without declaring `data` as an object with `properties`.
- **Fix**: Updated `apps/openapi/apps/telegram/paths.yaml` so `data` is an object and `url` is defined under `data.properties`.
- **Reusable Pattern**: When adding OpenAPI refs, run Redocly lint after bundle; if lint fails outside the edited route set, fix the invalid source schema before trusting the generated docs.

## Summary

### Changes Made

- Phase 1: Added the shared backend count route, handler, service action, repository method, default route ordering, and backend/scenario tests.
- Phase 2: Added shared frontend API and server/client SDK support for `count`.
- Phase 3: Added explicit count routes to customized REST controllers and migrated admin-v2 table totals to `api.count`.
- Admin-v2 cards: Replaced static module overview card badges with shared server/client `api.count` loading.
- Documentation/MCP: Added OpenAPI `/count` path documentation and MCP `*-count` tools for documented SDK entities.

### Pull Request

- [ ] PR created: -
- [ ] PR number: -

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-05-01T23:51:57Z
