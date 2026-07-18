---
issue_number: 209
issue_title: "Add Telegram assistant profile management conversations"
start_date: 2026-07-17T22:47:04Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-209.md
status: complete
completed_date: 2026-07-18T00:09:31Z
---

# Implementation Progress: ISSUE-209 - Add Telegram assistant profile management conversations

**Started**: 2026-07-17
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-209.md`

## Phase Progress

### Phase 1: Move The Complete Command Lifecycle Into Agent

- [x] Started: 2026-07-17T22:47:41Z
- [x] Completed: 2026-07-17T22:55:39Z
- [x] Automated verification: PASSED 2026-07-17T22:54:32Z

**Notes**: Added Agent-owned `/assistant`, `/cancel`, `/exit`, and `/stop` definitions plus serializable conversation metadata; removed the unused grammY Conversations imports/registry/local exits from `apps/telegram`; added publication/override/forwarding BDD coverage. Focused tests, full Agent/Telegram Jest suites, both lint targets, Prettier, Agent TypeScript build, Telegram build, and live-reference search passed. Awaiting manual verification.

### Phase 2: Add The Agent-Owned Conversation Runtime

- [x] Started: 2026-07-17T22:55:39Z
- [x] Completed: 2026-07-17T23:00:00Z
- [x] Automated verification: PASSED 2026-07-17T23:00:00Z

**Notes**: Added the singleton replaceable memory store, chat/thread/sender isolation, 30-minute TTL, keyed serialization, revision reservation, compact callback codec, presentation edit/replacement path, ordinary text/image interception, and OpenRouter suppression. Runtime/controller/full Agent tests pass. User requested uninterrupted execution and will perform manual verification after delivery.

### Phase 3: Complete The Subject-Scoped RBAC Management Surface

- [x] Started: 2026-07-17T23:00:00Z
- [x] Completed: 2026-07-17T23:20:00Z
- [x] Automated verification: PASSED 2026-07-17T23:20:00Z

**Notes**: Added manageable AI-profile discovery, linked/available Skill pagination, idempotent link and relation-only unlink, Knowledge pagination, client/server SDK actions, split middleware validation, sender-scoped MCP update support, and exact dynamic permission provisioning for every connected AI profile. Full RBAC unit/integration tests and TypeScript build pass.

### Phase 4: Implement Assistant Profile Management Tools

- [x] Started: 2026-07-17T23:20:00Z
- [x] Completed: 2026-07-17T23:35:00Z
- [x] Automated verification: PASSED 2026-07-17T23:35:00Z

**Notes**: Implemented selector/home/Profile/MCP/Avatar/Skills/Knowledge pages and editors in `agent.agent.service`, sender-JWT mutations, fresh authorization checks, opaque UUID callback tokens, pagination, recoverable validation/service errors, confirmations, cancellation, closure, permission-loss shutdown, and stale controls. The focused tool suite covers all planned paths.

### Phase 5: Harden Lifecycle, Verify Routing, And Document Operations

- [x] Started: 2026-07-17T23:35:00Z
- [x] Completed: 2026-07-17T23:58:00Z
- [x] Automated verification: PASSED 2026-07-17T23:58:00Z

**Notes**: Documented Agent/Telegram/RBAC ownership and restart recovery; verified production-length callback limits, photo-only dispatch, presentation fallback, permission loss, duplicate destructive clicks, and existing OpenRouter routing. Agent (66), RBAC (264), Telegram (21), Agent/RBAC/API integration suites, Telegram build, Agent/RBAC/Social/Knowledge/API/Telegram lint/build checks, formatting, schema/snapshot search, and live grammY reference search pass. Manual Telegram verification remains intentionally unchecked for the user.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 6 -->

### Incident 1 — Generic test:file script cannot resolve an Nx project

- **Occurrences**: 1
- **Stage**: Phase 1 - Move The Complete Command Lifecycle Into Agent
- **Symptom**: Both plan-listed `npm run test:file -- <path>` commands failed with `parsedArgs[PROJECT_TARGET_CONFIG]?.lastIndexOf is not a function` before Jest started.
- **Root Cause**: The root `test:file` script invokes `nx run --target=jest:test` without a project, which the current Nx CLI cannot resolve from the file argument.
- **Fix**: Ran the focused tests through explicit targets: `npx nx run @sps/agent:jest:test --testFile=...` and `npx nx run telegram:jest:test --testFile=...`.
- **Reusable Pattern**: Use an explicit Nx project and target for focused tests until the root `test:file` wrapper is repaired.

### Incident 2 — Telegram forwarding test lacked JWT configuration

- **Occurrences**: 1
- **Stage**: Phase 1 - Move The Complete Command Lifecycle Into Agent
- **Symptom**: The new command-forwarding scenarios failed before ingestion with `RBAC_JWT_SECRET is not set`.
- **Root Cause**: Existing Telegram unit tests never exercised `handleIncomingMessage(...)`, so their shared-utils mock omitted JWT secret and lifetime values required by that path.
- **Fix**: Added non-sensitive JWT secret and lifetime fixtures to the test mock; all forwarding scenarios then passed.
- **Reusable Pattern**: Transport tests that cross the RBAC ingestion boundary must provide the complete JWT configuration fixture even when signing is stubbed later.

### Incident 3 — Profile management routes lacked Telegram owner permissions

- **Occurrences**: 1
- **Stage**: Phase 3 - Complete The Subject-Scoped RBAC Management Surface
- **Symptom**: Handler tests passed, but ordinary Telegram owners had no non-admin permission records for Profile/MCP/Avatar/Skills routes.
- **Root Cause**: Bootstrap provisioned only the five existing Knowledge routes.
- **Fix**: Extended the idempotent exact-target grant to fourteen routes and provisioned it for every connected AI profile during Telegram bootstrap.
- **Reusable Pattern**: Verify dynamic role/permission provisioning in addition to route middleware for every new protected subject route.

### Incident 4 — Domain UUIDs overflowed Telegram callback data

- **Occurrences**: 1
- **Stage**: Phase 4 - Implement Assistant Profile Management Tools
- **Symptom**: Short fixture ids fit, but real UUIDs violated the callback token bound and could exceed Telegram's 64-byte payload limit.
- **Root Cause**: Domain ids were initially embedded directly in callback data.
- **Fix**: Replaced them with compact deterministic opaque tokens resolved against freshly loaded scoped data; added production UUID coverage.
- **Reusable Pattern**: Test transport codecs with production-shaped identifiers and keep domain state server-side.

### Incident 5 — RBAC unit suite inherited a deployed API origin

- **Occurrences**: 1
- **Stage**: Phase 5 - Harden Lifecycle, Verify Routing, And Document Operations
- **Symptom**: An unrelated SDK URL assertion expected localhost but the development shell exported the deployed API origin.
- **Root Cause**: Unit modules read API URL environment variables during initialization.
- **Fix**: Pinned both API origin variables to localhost for the RBAC unit/integration verification commands.
- **Reusable Pattern**: Pin API origin fixtures when running URL-sensitive SDK tests from a deployment-configured shell.

### Incident 6 — Social lint referenced an unavailable Next.js rule

- **Occurrences**: 1
- **Stage**: Phase 5 - Harden Lifecycle, Verify Routing, And Document Operations
- **Symptom**: Social lint failed in an unchanged avatar test on an unknown `@next/next/no-img-element` disable.
- **Root Cause**: The owning lint target no longer registers that rule.
- **Fix**: Removed the obsolete suppression without changing the test mock; Social lint passes.
- **Reusable Pattern**: Rule-specific suppressions must match the plugin set of the owning Nx target.

## Summary

### Changes Made

- Agent is the single owner of `/assistant`, termination commands, transient sessions, callbacks, tool state, and menu rendering.
- Telegram remains a transport-only ingestion/publication adapter with no grammY Conversations runtime.
- Subject-scoped RBAC now exposes manageable profiles and bounded Skill/Knowledge management, including relation-only unlink and dynamic non-admin grants.
- Profile, MCP, avatar, Skill, and Knowledge workflows use the Telegram sender subject JWT and fresh RBAC revalidation.
- Regression coverage and operational documentation include expiry/restart loss, stale controls, duplicate clicks, topic/sender isolation, and OpenRouter suppression.

### Pull Request

- [x] PR created: https://github.com/singlepagestartup/singlepagestartup/pull/210
- [x] PR number: 210

### Final Status

- [x] All phases completed
- [x] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-07-18T00:09:31Z
