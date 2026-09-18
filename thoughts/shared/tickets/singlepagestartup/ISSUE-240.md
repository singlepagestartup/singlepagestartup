---
repository: singlepagestartup
issue_number: 240
status: Research Needed
created: 2026-09-18
---

# Issue: Fix scoped test lanes: scenario specs in the unit lane, unwired shared backend specs, env-dependent MCP test, scenario runner leaks

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/240
**Status**: Research Needed
**Created**: 2026-09-18
**Priority**: medium
**Size**: small
**Type**: bug / test infrastructure

---

## Problem to Solve

The scoped test lanes documented in `README.md` ("Scoped Testing Workflow") do not run what they claim to run, and the scenario runner is fragile when a scenario fails. Found during a quality audit on 2026-09-18 (`main` at `29370bcbf8`) by running every lane from a clean worktree.

## Key Details

1. **The `api` unit lane runs DB-backed scenario specs.** `apps/api/jest.config.ts` ignores only `\.integration\.spec\.ts$`, so `npm run test:unit:scoped` (which includes project `api`) executes the five `apps/api/specs/scenario/**/*.scenario.spec.ts(x)` suites against whatever answers on `API_SERVICE_URL` (`http://localhost:4000`). With no API running they fail with connection errors; on the audit machine an unrelated project's API was listening on port 4000, so the count scenario failed with `Expected: 4, Received: 8` and the cart scenarios received `Permission error` from a foreign database. The pattern was added in `98d290aead` (2026-03-02) before any scenario spec existed (`068adefd9c`, `91916a1193`).
2. **Shared backend specs run in no lane.** `libs/shared/backend/utils/project.json` declares the target `test` instead of `jest:test`, so `@sps/backend-utils` is invisible to every `nx run-many --target=jest:test` lane and is absent from `test:unit:scoped`; its `http-error/index.spec.ts` currently fails 6 of 65 cases (see #241). `@sps/shared-backend-database-config`, `@sps/providers-file-storage`, `@sps/providers-db`, `@sps/providers-kv`, `@sps/shared-configuration`, `@sps/shared-ui-shadcn`, and `@sps/shared-ui-aceternity` ship a `jest.config.ts` but declare no Jest target at all; `nx.json` has `"plugins": []`, so `targetDefaults["jest:test"]` never materializes for them. `transform-many-to-many-relations/index.spec.ts` passes when run directly; `libs/providers/file-storage/src/lib/local/index.spec.ts` fails directly with `ENOENT: no such file or directory, mkdir '<repo>/public/test/'`.
3. **An MCP unit test depends on the checkout's `.env`.** `apps/mcp/lib/content-management/operations.spec.ts:460` asserts the literal `http://localhost:4000/api/file-storage/files`, while `apps/mcp/env.ts` loads `apps/mcp/.env`, which `apps/mcp/create_env.sh:4` writes as `API_SERVICE_URL=http://127.0.0.1:4000`. Every checkout bootstrapped with `./up.sh` therefore fails `creates file-storage file records from base64 content`.
4. **Scenario runner robustness.** `tools/testing/test-scenario-issue.sh` kills only its wrapper subshell on exit (the `bun run dev` server child keeps listening; leaked listeners on ports 4010 and 4001 were observed after two consecutive runs); when a scenario fails before teardown, Jest prints `Jest did not exit one second after the test run has completed` and the runner never returns; the issue-152 and issue-154 scenarios require `RBAC_SUBJECT_IDENTITY_EMAIL` / `RBAC_SUBJECT_IDENTITY_PASSWORD` from `apps/api/.env` (written only by the current `apps/api/create_env.sh:106-107`), while `.claude/.env` uses `API_RBAC_SUBJECT_IDENTITY_*`; older checkouts fail with `Missing required env variable` and an API log flood of `Permission error ... /api/rbac/subjects//ecommerce-module/orders`.
5. **`npm run test:file` is broken** under the current Nx: `NX parsedArgs[PROJECT_TARGET_CONFIG]?.lastIndexOf is not a function` (already recorded in the ISSUE-175 and ISSUE-185 handoffs; `npx nx run <project>:jest:test --testFile=<path>` works).

## Implementation Notes

- A pull request accompanying this issue excludes `*.scenario.spec.ts(x)` from `apps/api/jest.config.ts` and makes the MCP assertion follow `API_SERVICE_URL` (items 1 and 3). Items 2, 4 and 5 remain open here.
- Renaming `test` to `jest:test` for `@sps/backend-utils` will surface the six failing 422 cases; decide with #241 whether the spec or the mapper is authoritative before wiring the target into the scoped lane.
- Keep the repository BDD test format for any spec changes.

## Acceptance Criteria

- [ ] `npm run test:unit:scoped` passes from a clean worktree with no API process and no `apps/mcp/.env`.
- [ ] Every library with a `jest.config.ts` has a `jest:test` target and is listed in the scoped lane, or the config is removed.
- [ ] The scenario runner terminates the API it started and exits non-zero within a bounded time when a suite fails.
- [ ] Missing scenario credentials produce one actionable message before the API boots.
- [ ] `npm run test:file` works or is removed from `package.json` and the workflow docs.

## References

- `README.md` ("Scoped Testing Workflow")
- `apps/api/jest.config.ts`, `apps/api/jest.scenario.config.ts`
- `libs/shared/backend/utils/project.json`
- `apps/mcp/lib/content-management/operations.spec.ts`, `apps/mcp/env.ts`, `apps/mcp/create_env.sh`
- `tools/testing/test-scenario-issue.sh`
- Companion: #241

## Comments

None at creation time.
