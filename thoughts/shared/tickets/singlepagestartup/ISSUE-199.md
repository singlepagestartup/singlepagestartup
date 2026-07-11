---
repository: singlepagestartup
issue_number: 199
status: Plan in Review
created: 2026-06-17
priority: high
size: large
type: feature
---

# Issue: Enable social profiles as MCP-powered AI employees

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/199
**Status**: Plan in Review
**Created**: 2026-06-17
**Priority**: high
**Size**: large
**Type**: feature

---

## Problem to Solve

SPS must let a user assign work in a social chat to an AI employee represented by a replying `social.profile`. The employee uses OpenRouter models as its reasoning engine, the profile's linked Knowledge documents and Social skills as its working context, and tools discovered from MCP servers explicitly enabled for the profile to read or change data through `apps.api`.

The employee's execution identity is the single `rbac.subject` linked to the replying AI `social.profile`. The user/requester starts the task and remains the billing/audit initiator, but does not delegate their API permissions to the model. Every MCP call must reach `apps.api` with the employee subject's RBAC permissions. The final chat answer is authored by the replying `social.profile`.

The required chat experience is:

1. A user sends a task in a thread to an AI `social.profile`.
2. Backend resolves and authorizes the replying profile and its employee `rbac.subject`.
3. The employee context includes profile persona, linked skills, relevant linked Knowledge, thread history, and tools discovered from the profile's enabled MCP servers.
4. OpenRouter decides how to answer and, when needed, requests tool calls.
5. Backend executes allowed calls through `apps.mcp`; `apps.mcp` forwards the employee subject's SPS authorization to `apps.api`.
6. Tool results are returned to the model until it produces a final answer or reaches a hard stop.
7. The user sees the final employee response, while the execution trace is kept in metadata/audit.

## Key Details

- Keep the project `apps.mcp` as the execution surface for model-requested `apps.api` operations. Do not add a parallel direct CRUD executor.
- Treat the three identities separately:
  - initiator/requester: the `rbac.subject` that owns the incoming route/message and is charged for the OpenRouter turn;
  - employee principal: the single `rbac.subject` linked to the replying AI `social.profile` and used for MCP/API authorization;
  - reply author: the replying AI `social.profile`.
- The initiator's API permissions must never be inherited by the employee. The employee can access only what its own RBAC roles permit.
- Resolve the employee profile server-side, require `variant = "artificial-intelligence"`, verify it is linked to the current chat, and fail closed unless exactly one backing `rbac.subject` exists.
- A caller or model tool argument must not be able to choose or override the employee subject.
- Preserve the current external MCP OAuth flow for external clients.
- Add an internal backend-to-MCP token flow that exchanges a short-lived SPS JWT for the employee subject into a short-lived MCP access token without browser OAuth redirect or refresh token.
- Store and verify the internal token through the same MCP access-token path used by external clients.
- Do not call MCP with `X-RBAC-SECRET-KEY` for model-requested tools.
- Add profile-level configuration containing identifiers of allowed MCP servers. The first supported identifier is the built-in project MCP; connection parameters move to a separate MCP-server model in a future issue.
- Discover tools directly from each allowed server through MCP `tools/list`. Do not add a second per-tool or per-data authorization layer in the OpenRouter orchestrator.
- Let `apps.mcp` execute tools with the employee SPS JWT and let existing `apps.api` middleware enforce `rbac.permission`. The orchestrator validates only MCP protocol shape and catalog membership, not business/data permissions.
- Preserve the mutation safety already defined by MCP tool schemas, such as dry-run and preview/apply; do not duplicate it as a profile policy.
- Make all skills linked through `profiles-to-skills` available as employee capabilities without requiring `/skill` or `skillIds`. Skill existence plus the profile relation determines availability; explicit selection remains a deterministic override.
- Automatically retrieve relevant profile-linked Knowledge for ordinary employee tasks without requiring `@knowledge`; never search unlinked documents. Explicit `@knowledge` remains a force/debug override and `/learn` behavior remains compatible.
- Make `react-by/openrouter` the single reaction endpoint for AI profiles. Move every still-required guard, `/learn`, Knowledge retrieval/generation, skill, thread-context, and reply-metadata behavior from `react-by/knowledge` into it before removing the legacy flow.
- After parity is proven, delete the `react-by/knowledge` handler, route, client/server SDK actions and exports, agent-service dispatch/call sites, frontend mocks, route documentation, tests that only exercise the legacy endpoint, and the obsolete route permission through the normal RBAC data-management flow.
- Tool calls and tool results must be recorded in message/action metadata or audit logs, but raw tool-call protocol output must not be displayed as the assistant answer.
- The model loop must have step, timeout, token, and result-size limits.

## Implementation Notes

### OpenRouter tool calling

- Extend `libs/shared/third-parties/src/lib/open-router/index.ts` to support OpenAI-compatible chat tool calling:
  - request `tools`;
  - request `tool_choice`;
  - request `parallel_tool_calls`;
  - assistant response `tool_calls`;
  - `role: "tool"` messages with `tool_call_id`.
- Keep existing generation behavior for requests without tools.
- Prefer `parallel_tool_calls: false` for the initial implementation unless the selected tools are proven read-only and idempotent.

### Tool loop orchestration

- Add a service for AI employee tool loops rather than embedding all logic directly in the controller.
- The loop should:
  - resolve the requester, replying profile, and employee subject with the identity checks above;
  - build the OpenRouter context from profile persona, current thread, all linked skills, and automatically retrieved profile Knowledge;
  - send tool definitions discovered from the profile's allowed MCP servers with the OpenRouter request;
  - detect model `tool_calls`;
  - validate each tool call name and arguments before execution;
  - call the project MCP server;
  - append tool results back into the OpenRouter message context;
  - repeat until final text is returned or a stop condition is hit.
- Stop conditions:
  - max steps exceeded;
  - model returns invalid/repeated tool calls;
  - MCP tool execution fails unrecoverably;
  - budget or timeout exceeded.
- On stop failure, return a clear assistant-visible error message and store internal details in metadata.

### Consolidate reactions into OpenRouter

- Treat `react-by/knowledge` as a migration source, not as a second supported reaction mode.
- Port its stricter profile/chat/message guards and any Knowledge behavior not already present in `react-by/openrouter`.
- Preserve `/learn`, explicit `@knowledge`, automatic profile-linked Knowledge, skills, thread history, and `metadata.knowledge` compatibility through `react-by/openrouter`.
- Switch automatic agent dispatch and all SDK/UI callers to `react-by/openrouter`, verify behavioral parity, and only then remove the legacy route and implementation.
- Remove the obsolete RBAC route permission through an explicit permission-management operation; do not hand-edit repository data snapshots.

### Internal MCP access token for employee subject

- In `apps/mcp/lib/oauth.ts`, extract/reuse token issuing logic so a backend caller can issue a short-lived MCP access token for an existing SPS JWT.
- Add an internal function similar to `issueMcpAccessTokenForSpsJwt`:
  - validates SPS JWT with `RBAC_JWT_SECRET`;
  - extracts `subject.id`;
  - issues MCP access token with `aud = getMcpPublicUrl()`;
  - stores `{ jti, clientId, subject, scope, spsJwt, expiresAt }` in the MCP OAuth store;
  - returns access token and expiration;
  - does not issue refresh token for internal tool loops.
- The RBAC controller should:
  - preserve the incoming requester subject for ownership, billing, and audit;
  - resolve the single employee `rbac.subject` from the replying AI profile;
  - sign a short-lived SPS JWT for that employee subject;
  - call the internal MCP token issuer;
  - call `/mcp` with `Authorization: Bearer <mcp_access_token>`.
- Use `clientId = "internal-rbac-openrouter"` or equivalent for auditability.

### MCP execution

- Use the existing Streamable HTTP MCP endpoint (`/mcp`) as the execution path.
- MCP auth context should forward the underlying employee SPS JWT to API calls.
- Existing external OAuth/PCKE MCP behavior must remain unchanged.
- Any model-exposed MCP tool must have:
  - stable name;
  - clear description;
  - JSON schema;
  - zod validation before execution;
  - RBAC enforcement through the employee JWT.

### Profile MCP server configuration

- Add MCP configuration to the profile administration flow so an operator can allow the built-in project MCP server for the employee.
- Store stable allowed-server identifiers rather than tool names. For this issue the only supported identifier is the built-in project MCP.
- Load the server's tool catalog through MCP and pass its definitions to OpenRouter without duplicating `rbac.permission` checks.
- Keep existing MCP-side validation, employee-JWT forwarding, and mutation preview/apply semantics as the enforcement path.
- Do not add arbitrary external MCP URLs, third-party OAuth/secret storage, or the future separate MCP-server model in this issue.

### Employee Knowledge and skills

- Derive capabilities backend-side from the replying profile so browser submission and automatic agent-triggered replies behave identically.
- Use skills linked through `profiles-to-skills`; keep explicit slash/id selection as an override, not a prerequisite.
- Search only Knowledge documents linked through `profiles-to-knowledge-module-documents`; relevant retrieval should be automatic for ordinary tasks.
- Preserve existing persona, thread context, `/learn`, explicit `@knowledge`, and skill-selection compatibility.

### Metadata and audit

- Store tool-loop metadata on the assistant message, for example:
  - selected model;
  - selected reasoning;
  - tool loop enabled;
  - step count;
  - tool names;
  - tool call ids;
  - result sizes;
  - stop reason;
  - initiator/requester subject id;
  - employee subject id;
  - reply profile id;
  - available and activated skill ids;
  - Knowledge document ids and retrievals;
  - MCP client id.
- Add OpenRouter billing purposes for tool-loop model calls if needed.
- MCP tool execution itself should be auditable separately from OpenRouter model billing.

## Test Plan

- OpenRouter wrapper tests:
  - request includes tool definitions when provided;
  - response parser returns `tool_calls`;
  - tool result messages are serialized with `role: "tool"` and `tool_call_id`;
  - existing text-only generation remains unchanged.
- MCP auth tests:
  - internal token issuer accepts a valid employee SPS JWT and produces an MCP access token;
  - issued token resolves back to the same employee SPS JWT;
  - no refresh token is issued for internal tool-loop tokens;
  - invalid/expired SPS JWT is rejected;
  - external OAuth token flow remains unchanged.
- RBAC/OpenRouter backend tests:
  - with different requester and employee permissions, tool calls execute only as the employee `rbac.subject`;
  - requester permissions are never delegated to the employee;
  - non-AI, foreign-chat, missing-subject, and multiple-subject reply profiles fail closed before token issuance;
  - final assistant message is still authored by the replying AI profile;
  - raw tool calls are not displayed as chat messages;
  - tool loop continues after MCP result and produces final answer;
  - max step and timeout limits stop runaway loops;
  - unknown tool names and invalid tool arguments are rejected;
  - tools absent from the connected allowed MCP server catalog are not exposed or executable;
  - MCP calls do not use `X-RBAC-SECRET-KEY`.
  - linked skills are available without explicit selection, while deleted or unlinked skills are unavailable;
  - linked Knowledge can be retrieved without `@knowledge`, while unlinked documents are never searched;
  - browser and automatic agent-triggered paths derive the same employee capabilities.
  - knowledge-chat replies and `/learn` use only `react-by/openrouter` after migration;
  - no route, SDK export, agent call site, or frontend mock remains for `react-by/knowledge`;
  - explicit `@knowledge`, automatic Knowledge retrieval, skills, thread history, and `metadata.knowledge` remain compatible after the legacy endpoint is removed.
- Browser verification:
  - a user can assign a task to an AI profile that uses a skill, profile Knowledge, and a tool discovered from an allowed MCP server;
  - user sees only final assistant answer;
  - interaction details/metadata identify requester, employee, profile, Knowledge/skills, and tool trace.
