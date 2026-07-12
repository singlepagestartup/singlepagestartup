---
issue_number: 199
issue_title: "Enable social profiles as MCP-powered AI employees"
repository: singlepagestartup
created_at: 2026-06-17T18:33:37Z
last_updated: 2026-07-12T00:19:12Z
status: active
current_phase: complete
---

# Process Log: ISSUE-199 - Enable social profiles as MCP-powered AI employees

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: complete
- Next step: code review / merge

## Phase Notes

### Create

- Summary: Created feature issue for OpenRouter tool calling and authenticated self-MCP execution from `react-by/openrouter`.
- Outputs:
  - GitHub issue: https://github.com/singlepagestartup/singlepagestartup/issues/199
  - Ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-199.md`
  - Process: `thoughts/shared/processes/singlepagestartup/ISSUE-199.md`
- Notes:
  - User explicitly requested `core-00-create`.
  - Scope preserves the user's requirement that backend call the project MCP and that MCP calls are authenticated as the sender `rbac.subject`.
  - Initial `load_config` call resolved repository context but reported GitHub API connectivity errors inside the sandbox; GitHub helper creation succeeded with network escalation.
  - Issue was added to GitHub Project and moved through `Triage` to `Research Needed` by `.claude/helpers/create_issue_with_project.sh`.

### Research

- Summary: Documented all surfaces issue 199 touches: OpenRouter wrapper (no tool-calling surface today), the full `react-by/openrouter` pipeline (context assembly, model routing, billing ledger, dual identities incl. the server-minted `replyByJwt` precedent), MCP 19-tool content-management surface + OAuth token store + auth forwarding (no internal issuer yet), RBAC JWT sign/verify + `X-RBAC-SECRET-KEY` bypass, `@knowledge` pipeline, and message/action JSONB metadata storage.
- Outputs:
  - Research: `thoughts/shared/research/singlepagestartup/ISSUE-199.md`
  - Issue comment: https://github.com/singlepagestartup/singlepagestartup/issues/199#issuecomment-4890624553
  - Status: Research in Review
- Notes:
  - Reused prior knowledge per knowledge-first contract: ISSUE-193 research (openrouter flow + tool-calling options; its plan explicitly deferred the tool loop to this issue) and ISSUE-187 research/handoff (MCP content surface, forwarded auth, Streamable HTTP).
  - Verified live-code claims directly for the four load-bearing files (open-router wrapper, mcp oauth.ts, mcp http.ts, auth-context.ts); five parallel sub-agents documented the reply flow, MCP tool surface, RBAC JWT, @knowledge/metadata, and thoughts inventory.
  - Notable for planning: legacy per-module MCP registrars are orphaned after the "compact content surface" change; no per-session MCP tool subsetting exists; no in-repo MCP client exists.

### Plan

- Summary: Created the approved six-phase implementation plan for an AI employee: the replying profile supplies persona/capabilities, its linked subject authorizes MCP-to-API work, and the requester remains the task initiator and billing principal.
- Outputs:
  - Revised GitHub issue and local ticket with employee identity, autonomous capability, MCP configuration, and acceptance-test contracts.
  - Plan: `thoughts/shared/plans/singlepagestartup/ISSUE-199.md`
- Notes:
  - No plan file existed despite Project status `Plan in Progress`; the operator approved the proposed six-phase outline before the plan was created.
  - The revised scope requires profile-level built-in MCP configuration but keeps arbitrary external MCP servers out of scope.
  - The plan fixes employee token issuance in the MCP process through a protected internal exchange endpoint, avoiding a separate in-memory token store inside `apps.api`.
  - Review feedback supersedes per-tool profile allowlists and duplicate orchestrator data checks: profiles allow MCP server identifiers, the server supplies `tools/list`, and existing employee-JWT-backed `rbac.permission` remains authoritative.
  - The first allowed server is the built-in project MCP. Connection parameters and additional servers belong to a future dedicated MCP-server model and relation.
  - Latest review feedback makes `react-by/openrouter` the only reaction flow: required guards and Knowledge behavior migrate from `react-by/knowledge`, all callers switch, parity is verified, and then the legacy handler/route/SDK surface is removed.
  - Plan revision completed and synchronized at `2026-07-11T22:40:39Z`; issue should return to `Plan in Review` after the scoped artifact commit and GitHub comment.

### Implement

- Summary: Completed the six-phase implementation and applicable verification; ready for PR submission and human code review.
- Outputs:
  - Branch: `codex/issue-199-mcp-ai-employee`
  - Progress: `thoughts/shared/handoffs/singlepagestartup/ISSUE-199-progress.md`
  - Pull request: https://github.com/singlepagestartup/singlepagestartup/pull/206
- Notes:
  - Status gate passed at `Ready for Dev`; issue moved to `In Dev`.
  - No new scope-changing GitHub comments appeared after the plan sync marker.
  - `react-by/openrouter` is now the sole AI reaction pipeline and owns identity guards, Knowledge/skills, tool orchestration, billing, final reply creation, and audit metadata.
  - Profiles store allowed MCP server ids; both profile admin form variants expose the built-in project server.
  - The internal exchange issues a five-minute MCP access token backed by the employee SPS JWT. Live verification opened the project MCP catalog (19 tools) and executed `model-record-count` against `apps.api` as the linked employee subject.
  - Applicable focused Jest, integration, TypeScript, ESLint, Prettier, shell, migration, and reference checks passed. The plan's `npm run parity` command does not exist, and one unrelated pre-existing Social test imports `server-only` from a client suite; both are documented below.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 8 -->

### Incident 1 — GitHub CLI connectivity from sandbox

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: `load_config.sh` printed `error connecting to api.github.com` while resolving GitHub context.
- **Root Cause**: Network access from the sandboxed command path was unavailable for GitHub CLI calls.
- **Fix**: Run the GitHub helper sequence with escalated network access as required by `core-00-create`.
- **Preventive Action**: If `gh` reports `error connecting to api.github.com`, rerun the same fail-fast `bash -lc` helper block with network escalation instead of rewriting the helper sequence.
- **References**: `.codex/skills/core-00-create/SKILL.md`, `.claude/commands/core/00-create.md`

### Incident 2 — Requester and employee execution identities were conflated

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: The original issue required model-requested MCP tools to execute as the message sender, while the operator intended the linked subject of the replying AI profile to act as the employee.
- **Root Cause**: The original wording treated the authenticated route caller as both task initiator and tool execution principal, even though the reply flow already resolves a distinct `replyBySubject` for the AI profile.
- **Fix**: Rewrite the issue around three identities: requester/initiator, employee subject, and reply profile. Require server-side profile/chat validation, exactly one backing subject, employee-scoped MCP credentials, and audit of both subject ids.
- **Preventive Action**: Every agent/tool issue must explicitly identify the billing principal, execution principal, and reply author before planning authorization or token flows.
- **References**: `thoughts/shared/tickets/singlepagestartup/ISSUE-199.md`, `thoughts/shared/research/singlepagestartup/ISSUE-199.md`, `react-by-openrouter.ts:1156-1193`

### Incident 3 — Plan duplicated MCP authorization and configured tools at the wrong level

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: The first plan revision introduced profile-level tool allowlists, mutation policy, safety classification, and an orchestrator intersection with RBAC permissions.
- **Root Cause**: Tool discovery/configuration was conflated with data authorization even though `apps.mcp` already forwards the employee SPS JWT and `apps.api` already enforces `rbac.permission`.
- **Fix**: Store allowed MCP server identifiers on the profile, discover tools through each server's `tools/list`, validate only MCP protocol/catalog integrity in the loop, and leave business/data authorization plus mutation contracts to the existing MCP/API path.
- **Preventive Action**: Separate MCP server connection policy, MCP protocol validation, and RBAC data authorization in future agent plans; never reproduce `rbac.permission` decisions in an LLM orchestrator.
- **References**: `apps/mcp/http.ts:199-214`, `apps/mcp/lib/auth.ts:84-136`, `thoughts/shared/plans/singlepagestartup/ISSUE-199.md`

### Incident 4 — Legacy Knowledge reaction remained as a parallel flow

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: The plan proposed copying selected checks from `react-by/knowledge` while continuing to preserve the legacy endpoint and its SDK/agent surfaces.
- **Root Cause**: The existing Knowledge handler was treated as a compatibility boundary instead of a duplicated reaction implementation whose required behavior should belong to the canonical OpenRouter employee flow.
- **Fix**: Make `react-by/openrouter` the only reaction endpoint, migrate all required guards and Knowledge behavior into it, switch every caller, prove parity, then delete the legacy handler, route, SDK exports, agent method/tests, UI mocks, documentation, and obsolete permission through an explicit data-management operation.
- **Preventive Action**: When consolidating overlapping reaction pipelines, define one canonical endpoint and include caller migration plus deletion criteria in the same plan rather than leaving a permanent compatibility route.
- **References**: `react-by-knowledge.ts`, `react-by-openrouter.ts`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`, `thoughts/shared/plans/singlepagestartup/ISSUE-199.md`

### Incident 5 — Nx plugin worker blocked affected checks

- **Phase**: Implement
- **Occurrences**: 2
- **Symptom**: Concurrent Nx targets waited on graph construction and failed with `Failed to start plugin worker`; a sequential retry also stalled before running tests.
- **Root Cause**: Nx project-graph/plugin-worker infrastructure failed independently of the affected Jest/TypeScript configurations.
- **Fix**: Run each project Jest config, TypeScript config, and focused ESLint path directly on Node 24, the repository-required runtime.
- **Preventive Action**: When Nx fails before target execution, record the infrastructure failure and run the underlying declared config directly rather than treating it as a code test failure.
- **References**: `package.json`, `libs/modules/rbac/jest.config.ts`, `apps/mcp/jest.config.ts`

### Incident 6 — Plan required a nonexistent parity script

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `npm run parity` failed with `Missing script: "parity"`.
- **Root Cause**: The approved plan named a command that is not defined in the repository `package.json` or workflow utilities.
- **Fix**: Leave that checklist item explicitly unchecked and run concrete affected Jest/integration, type, lint, format, migration, shell, diff, and reference checks instead.
- **Preventive Action**: Verify proposed validation commands exist during planning; do not mark a missing command as successful during implementation.
- **References**: `package.json`, `thoughts/shared/plans/singlepagestartup/ISSUE-199.md`

### Incident 7 — MCP field was wired only to an unused form variant

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: Browser verification of the real Admin overlay showed no `Allowed MCP servers` field although admin-v2 component tests passed.
- **Root Cause**: The visible Admin overlay currently renders the legacy `admin-form`; the initial implementation changed only `admin-v2-form`.
- **Fix**: Reuse `AllowedMcpServersField` and the same normalized default in both form variants, then verify the real form and checkbox in the browser.
- **Preventive Action**: For admin UI changes, inspect the live variant selected by the host and cover every active form variant instead of relying on the newest variant name.
- **References**: `libs/modules/social/models/profile/frontend/component/src/lib/singlepage/admin/form/ClientComponent.tsx`, `libs/modules/social/models/profile/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx`

### Incident 8 — Full Social Jest has an unrelated server-only import failure

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `chat-profile-sidebar/Component.spec.tsx` fails before test execution because a Client Component dependency imports `server-only`.
- **Root Cause**: The existing sidebar test dependency chain crosses the server/client boundary; no issue-199 file appears in the failing stack.
- **Fix**: Preserve the unrelated failure, run the affected Social MCP suites directly (5/5), and pass full Social TypeScript plus focused ESLint.
- **Preventive Action**: Distinguish pre-existing suite bootstrap failures from changed-code failures and record both the stack evidence and focused replacement coverage.
- **References**: `libs/modules/social/models/profile/frontend/component/src/lib/singlepage/chat-profile-sidebar/Component.spec.tsx`

## Reusable Learnings

- For OpenRouter tool execution through MCP, keep external MCP OAuth unchanged and issue the internal short-lived MCP token from the authorized replying profile's employee-subject JWT; never reuse requester permissions, billing identity, or tool arguments to choose the execution principal.
- Configure which MCP servers a profile may use, not a duplicate per-tool/data permission system; tools come from MCP `tools/list`, and `apps.api` remains the source of truth for employee `rbac.permission`.
- Keep one canonical AI reaction endpoint. Migrate required behavior and callers before deleting a legacy endpoint so parity and cleanup are verifiable in one change set.
- Verify the actual admin variant rendered by the host. Shared form fields may need to be wired into both legacy and admin-v2 surfaces until the legacy admin is retired.
- For employee MCP runtime checks, validate the complete chain without exposing tokens: exchange status/TTL, live `tools/list`, then one read-only API-backed MCP call whose audit subject is the profile-linked employee.
