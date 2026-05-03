---
issue_number: 185
issue_title: "[log-watch] [LW-6a66ca6ff01e] api_api Call to 'sendMessage' failed! (403: Forbidden: bot was blocked by the user)"
repository: singlepagestartup
created_at: 2026-05-04T01:28:19+03:00
last_updated: 2026-05-04T01:33:25+03:00
status: in_progress
current_phase: implement
---

# Implementation Progress: ISSUE-185

## Current Scope

Implement terminal notification handling for Telegram blocked-recipient delivery failures, then apply the requested one-off restored-production RBAC/order cleanup only after the runtime behavior and focused tests are ready.

## Phase Checklist

- [x] Phase 1: Terminal notification `error` status and blocked-recipient handling.
- [x] Phase 2: Focused BDD regression tests for blocked-recipient and non-blocked provider errors.
- [ ] Phase 3: `doctorgpt-production` subject-role cleanup and active subscription cancellation handoff.

## Implementation Notes

- GitHub Project status gate passed at `Ready for Dev`; issue 185 was moved to `In Dev`.
- GitHub comments were synced before edits. The only comment after the plan sync marker was the implementation-plan link comment, so no new requirements were added.
- Added notification `error` status and made Telegram blocked-recipient provider failures update the notification to `status: "error"` at the notification send boundary.
- Existing non-`new` status guard now skips future retries for errored notifications without new scheduler/retry logic.
- Data cleanup has not been run. Target subject remains `2bd15ae9-8d22-4c70-a878-a4ca1b152fdf`; target active order remains `bd8fa452-ed0e-4f87-8d4e-52bb4643d8a8`.

## Verification Log

- Passed: `npx nx run @sps/notification:jest:test --testFile=libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.spec.ts`
- Passed: `npx nx run @sps/notification:jest:test --testFile=libs/modules/notification/models/notification/backend/app/api/src/lib/controller/singlepage/send/index.spec.ts`
- Passed: `npx nx run @sps/notification:jest:test`
- Passed: `npx nx run @sps/notification:tsc:build --skip-nx-cache`
- Passed: BDD header grep for modified notification specs.
- Note: `npm run test:file -- libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.spec.ts` failed in the Nx wrapper before running tests with `parsedArgs[PROJECT_TARGET_CONFIG]?.lastIndexOf is not a function`; direct project-qualified Nx test commands were used instead.
- Pending: database cleanup preflight/postflight.
