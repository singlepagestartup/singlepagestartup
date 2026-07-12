---
issue_number: 199
issue_title: "Enable social profiles as MCP-powered AI employees"
start_date: 2026-07-11T23:09:33Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-199.md
status: complete
completed_date: 2026-07-12T00:19:12Z
---

# Implementation Progress: ISSUE-199 - Enable social profiles as MCP-powered AI employees

**Started**: 2026-07-12
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-199.md`

## Phase Progress

### Phase 1: Consolidate Reactions And Establish the Employee Identity Boundary

- [x] Started: 2026-07-11T23:09:33Z
- [x] Completed: 2026-07-12T00:12:49Z
- [x] Automated verification: RBAC 183 tests and Agent 30 tests passed; zero live legacy reaction references.

**Notes**: Ported identity/resource guards, Knowledge and skill behavior to OpenRouter; all agent/SDK/frontend callers now use it. Removed the legacy handler, route, permission snapshot, SDK actions, agent method, tests, mocks, and docs.

### Phase 2: Add Allowed MCP Servers And Autonomous Profile Capabilities

- [x] Started: 2026-07-11T23:09:33Z
- [x] Completed: 2026-07-12T00:12:49Z
- [x] Automated verification: Social profile MCP model/field suites passed (5 tests); Social TypeScript and ESLint passed.

**Notes**: Added `allowedMcpServerIds` with generated Drizzle migration, built-in `project` descriptor, stale-id handling, and both active legacy/admin-v2 profile forms. Browser verification confirmed the `Project MCP` checkbox changes state without saving test data.

### Phase 3: Add OpenRouter Tool-Calling Contracts

- [x] Started: 2026-07-11T23:09:33Z
- [x] Completed: 2026-07-12T00:12:49Z
- [x] Automated verification: Shared third-party OpenRouter suites passed (15 tests); TypeScript and ESLint passed.

**Notes**: Added OpenAI-compatible tools, assistant tool calls, tool-result messages, tool-only success handling, serialized argument preservation, billing, and retry safety.

### Phase 4: Implement Employee-Authenticated MCP Exchange, Client, And Catalog

- [x] Started: 2026-07-11T23:09:33Z
- [x] Completed: 2026-07-12T00:12:49Z
- [x] Automated verification: MCP 41 tests plus RBAC MCP client/catalog/controller suites passed; live exchange/catalog/API call succeeded.

**Notes**: Added protected five-minute employee token exchange, Streamable HTTP MCP client, live tool catalog/schema validation, profile-scoped catalog SDK, time/result bounds, and server-side employee JWT minting. Runtime check found 19 live tools and executed `model-record-count` through `apps.api` as the linked employee subject.

### Phase 5: Orchestrate The Bounded Employee Tool Loop

- [x] Started: 2026-07-11T23:09:33Z
- [x] Completed: 2026-07-12T00:12:49Z
- [x] Automated verification: Tool-loop and OpenRouter handler scenarios passed inside the 183-test RBAC suite.

**Notes**: Added a sequential six-step/120-second loop with per-tool limits, repeated-call protection, model locking after side effects, local skill/Knowledge tools, MCP dispatch, one-time settlement/session cleanup, final-only chat output, and redacted audit metadata.

### Phase 6: End-To-End Verification And Operational Documentation

- [x] Started: 2026-07-11T23:09:33Z
- [x] Completed: 2026-07-12T00:12:49Z
- [x] Automated verification: All applicable focused Jest, integration, TypeScript, ESLint, Prettier, shell, migration, and diff checks passed; documented unavailable/pre-existing checks below.

**Notes**: Browser verified the real admin form. Live API/MCP verification confirmed 200 exchange, 300-second Bearer token, 19 tools, and employee-authenticated read-only API execution. No chat message was sent and no profile setting was persisted during verification.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 4 -->

### Incident 1 — Nx plugin worker could not construct the project graph

- **Occurrences**: 2
- **Symptom**: Parallel and then sequential Nx test invocations waited indefinitely or failed with `Failed to start plugin worker`.
- **Fix**: Ran the exact project Jest configs, TypeScript configs, and focused ESLint paths directly on repository-required Node 24.
- **Result**: All affected project checks produced concrete passing results without changing code to accommodate the Nx infrastructure failure.

### Incident 2 — Approved plan referenced a missing parity command

- **Occurrences**: 1
- **Symptom**: `npm run parity` returned `Missing script: "parity"`.
- **Fix**: Recorded the plan/repository mismatch and replaced it with explicit full affected suites, type checks, lint, format, migration reproducibility, shell syntax, diff checks, and zero-reference checks.
- **Result**: The parity checkbox remains explicitly unchecked in the plan instead of reporting a nonexistent command as passing.

### Incident 3 — The visible admin uses the legacy profile form variant

- **Occurrences**: 1
- **Symptom**: Browser verification showed no MCP field although the new admin-v2 field and tests passed.
- **Root cause**: The running Admin overlay renders `admin-form`, while the initial implementation only wired `admin-v2-form`.
- **Fix**: Reused the same MCP field in both form variants and re-ran Social type/lint checks.
- **Result**: Browser verification found one `Allowed MCP servers` region and one `Project MCP` checkbox; the checkbox toggled successfully.

### Incident 4 — Unrelated pre-existing Social suite imports `server-only` from a client test

- **Occurrences**: 1
- **Symptom**: The full Social Jest config reports one failing `chat-profile-sidebar/Component.spec.tsx` suite before tests run.
- **Root cause**: Its dependency chain imports `server-only` from a Client Component test; no issue-199 file appears in the stack.
- **Fix**: Kept the failure unchanged and ran the affected Social MCP suites directly (5/5 passing), plus full Social TypeScript and focused ESLint.
- **Result**: Issue-199 coverage is green; the unrelated existing suite remains documented for separate repair.

## Summary

### Changes Made

- Consolidated all AI reactions into `react-by/openrouter` and removed the legacy Knowledge route surface.
- Added profile-scoped MCP server configuration and UI for the built-in project MCP.
- Added OpenRouter tool-call protocol support and a bounded employee tool loop.
- Added employee SPS-JWT exchange, MCP client/catalog/SDK, RBAC identity separation, deployment env wiring, audit metadata, tests, migration, and documentation.

### Pull Request

- [x] PR created: https://github.com/singlepagestartup/singlepagestartup/pull/206
- [x] PR number: 206
- [x] GitHub Project status: Code Review

### Final Status

- [x] All phases completed
- [x] All applicable automated verification passed; repository gaps are recorded above
- [ ] Issue marked as Done

---

**Last updated**: 2026-07-12T00:21:15Z
