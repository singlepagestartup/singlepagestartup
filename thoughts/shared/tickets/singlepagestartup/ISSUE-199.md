---
repository: singlepagestartup
issue_number: 199
status: Code Review
created: 2026-06-17
priority: high
size: large
type: feature
---

# Issue: Enable MCP-powered AI execution for social profiles

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/199
**Status**: Code Review
**Created**: 2026-06-17
**Priority**: high
**Size**: large
**Type**: feature

---

## Problem to Solve

SPS must let a user assign work in a social chat to a replying AI `social.profile`. That profile uses OpenRouter models for reasoning, explicitly requested linked Knowledge and available Social skills as context, and tools discovered from MCP servers enabled for the profile to read or change data through `apps.api`.

The execution identity is the single `rbac.subject` linked to the replying AI `social.profile`. The user/requester starts the task and remains the billing/audit initiator, but does not delegate their API permissions to the model. Every MCP call must reach `apps.api` with the linked `rbac.subject` authentication and permissions. The final chat answer is authored by the replying `social.profile`.

The required chat experience is:

1. A user sends a task in a thread to an AI `social.profile`.
2. Backend resolves and authorizes the replying `social.profile` and its linked `rbac.subject`.
3. The `social.profile` execution context includes profile persona, linked skills, relevant linked Knowledge, thread history, and tools discovered from the profile's enabled MCP servers.
4. OpenRouter decides how to answer and, when needed, requests tool calls.
5. Backend executes allowed calls through `apps.mcp`; `apps.mcp` forwards the linked `rbac.subject` authentication JWT to `apps.api`.
6. Tool results are returned to the model until it produces a final answer or reaches a hard stop.
7. The conversation shows safe live skill, Knowledge, and MCP execution actions while the `social.profile` works, followed by the final `social.profile` response; the immutable execution trace remains in metadata/audit.

## Key Details

- Keep the project `apps.mcp` as the execution surface for model-requested `apps.api` operations. Do not add a parallel direct CRUD executor.
- Treat the three identities separately:
  - initiator/requester: the `rbac.subject` that owns the incoming route/message and is charged for the OpenRouter turn;
  - execution principal: the single `rbac.subject` linked to the replying AI `social.profile` and used for MCP/API authorization;
  - reply author: the replying AI `social.profile`.
- The initiator's API permissions must never be inherited by the replying profile. MCP/API calls can access only what the linked `rbac.subject` roles permit.
- Resolve the `social.profile` server-side, require `variant = "artificial-intelligence"`, verify it is linked to the current chat, and fail closed unless exactly one linked `rbac.subject` exists.
- A caller or model tool argument must not be able to choose or override the replying profile's `rbac.subject`.
- Preserve the current external MCP OAuth flow for external clients.
- Add an internal backend-to-MCP token flow that exchanges the linked `rbac.subject` authentication JWT for a short-lived MCP access token without browser OAuth redirect or refresh token.
- Store and verify the internal token through the same MCP access-token path used by external clients.
- Do not call MCP with `X-RBAC-SECRET-KEY` for model-requested tools.
- Add profile-level configuration containing identifiers of allowed MCP servers. The first supported identifier is the built-in SinglePageStartup MCP; connection parameters move to a separate MCP-server model in a future issue.
- Discover tools directly from each allowed server through MCP `tools/list`. Do not add a second per-tool or per-data authorization layer in the OpenRouter orchestrator.
- Let `apps.mcp` execute tools with the `rbac.subject` authentication JWT and let existing `apps.api` middleware enforce `rbac.permission`. The orchestrator validates only MCP protocol shape and catalog membership, not business/data permissions.
- Preserve the mutation safety already defined by MCP tool schemas, such as dry-run and preview/apply; do not duplicate it as a profile policy.
- Make all skills linked through `profiles-to-skills` available as `social.profile` capabilities without requiring `/skill` or `skillIds`. Skill existence plus the profile relation determines availability; explicit selection remains a deterministic override.
- Retrieve profile-linked Knowledge only when the persisted message explicitly contains `@knowledge`; ordinary messages receive no RAG retrieval or context, and unlinked documents are never searched. `/learn` behavior remains compatible.
- Make `react-by/openrouter` the single reaction endpoint for AI profiles. Move every still-required guard, `/learn`, Knowledge retrieval/generation, skill, thread-context, and reply-metadata behavior from `react-by/knowledge` into it before removing the legacy flow.
- After parity is proven, delete the `react-by/knowledge` handler, route, client/server SDK actions and exports, agent-service dispatch/call sites, frontend mocks, route documentation, tests that only exercise the legacy endpoint, and the obsolete route permission through the normal RBAC data-management flow.
- A chat submission must perform one frontend mutation: create the message. Persist the requested model, reasoning, selected skill ids, and Knowledge flag in a versioned RBAC-owned envelope inside generic `social.message.metadata`.
- The frontend must not call `react-by/openrouter`, sequence an Agent run, issue launch headers/query markers, poll, or manually refetch the generated reply. Action logging is the single backend trigger; server-created progress and replies arrive through WebSocket/query invalidation.
- Agent and `react-by/openrouter` must reload and validate the persisted envelope. Caller query/body fields cannot override persisted answer parameters. Agent dispatches every automatic profile connected to the chat; the envelope does not restrict reply-profile selection.
- Tool calls and tool results must be recorded in message/action metadata or audit logs, but raw tool-call protocol output must not be displayed as the assistant answer.
- Project live execution into at most one `social.action` with `variant = "ai-execution"` per `social.profile` execution. Relate it to the current chat, thread, and replying profile, update the same stable id through safe requested/running/succeeded/failed/terminal states, and create no execution action when no tool is used.
- The visible action contract may contain bounded labels, tool/server identifiers, normalized states, timestamps, result byte counts, and run/message/profile ids. It must never contain arguments, results, credentials, prompts, hidden reasoning, or stack traces; malformed execution actions must fail closed instead of falling back to raw JSON.
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

- Add a service for AI-enabled `social.profile` tool loops rather than embedding all logic directly in the controller.
- The loop should:
  - resolve the requester, replying profile, and replying profile's `rbac.subject` with the identity checks above;
  - build the OpenRouter context from profile persona and current thread, make linked skills available, and include profile Knowledge only when the message explicitly contains `@knowledge`;
  - send tool definitions discovered from the profile's allowed MCP servers with the OpenRouter request;
  - detect model `tool_calls`;
  - validate each tool call name and arguments before execution;
  - call the SinglePageStartup MCP server;
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
- Preserve `/learn`, explicit `@knowledge`, profile-scoped Knowledge, skills, thread history, and `metadata.knowledge` compatibility through `react-by/openrouter`; ordinary messages without `@knowledge` must remain free of RAG retrieval and context.
- Switch automatic agent dispatch and all SDK/UI callers to `react-by/openrouter`, verify behavioral parity, and only then remove the legacy route and implementation.
- Remove the obsolete RBAC route permission through an explicit permission-management operation; do not hand-edit repository data snapshots.

### Internal MCP access token for replying profile's `rbac.subject`

- In `apps/mcp/lib/oauth.ts`, extract/reuse token issuing logic so a backend caller can issue a short-lived MCP access token for an existing `rbac.subject` authentication JWT.
- Add an internal function similar to `issueMcpAccessTokenForRbacSubjectAuthenticationJwt`:
  - validates `rbac.subject` authentication JWT with `RBAC_JWT_SECRET`;
  - extracts `subject.id`;
  - issues MCP access token with `aud = getMcpPublicUrl()`;
  - stores `{ jti, clientId, subject, scope, rbacSubjectAuthenticationJwt, expiresAt }` in the MCP OAuth store;
  - returns access token and expiration;
  - does not issue refresh token for internal tool loops.
- The RBAC controller should:
  - preserve the incoming requester subject for ownership, billing, and audit;
  - resolve the single `rbac.subject` linked to the replying AI `social.profile`;
  - sign a short-lived `rbac.subject` authentication JWT for that replying profile's `rbac.subject`;
  - call the internal MCP token issuer;
  - call `/mcp` with `Authorization: Bearer <mcp_access_token>`.
- Use `clientId = "internal-rbac-subject"` or equivalent for auditability.

### MCP execution

- Use the existing Streamable HTTP MCP endpoint (`/mcp`) as the execution path.
- MCP auth context should forward the underlying `rbac.subject` authentication JWT to API calls.
- Existing external OAuth/PCKE MCP behavior must remain unchanged.
- Any model-exposed MCP tool must have:
  - stable name;
  - clear description;
  - JSON schema;
  - zod validation before execution;
  - RBAC enforcement through the `rbac.subject` authentication JWT.

### Profile MCP server configuration

- Add MCP configuration to the profile administration flow so an operator can allow the built-in SinglePageStartup MCP server for the `social.profile`.
- Store stable allowed-server identifiers rather than tool names. For this issue the only supported identifier is the built-in SinglePageStartup MCP.
- Load the server's tool catalog through MCP and pass its definitions to OpenRouter without duplicating `rbac.permission` checks.
- Keep existing MCP-side validation, `rbac.subject` authentication JWT forwarding, and mutation preview/apply semantics as the enforcement path.
- Do not add arbitrary external MCP URLs, third-party OAuth/secret storage, or the future separate MCP-server model in this issue.

### `social.profile` Knowledge and skills

- Derive capabilities backend-side from the replying profile so browser submission and automatic agent-triggered replies behave identically.
- Use skills linked through `profiles-to-skills`; keep explicit slash/id selection as an override, not a prerequisite.
- Search only Knowledge documents linked through `profiles-to-knowledge-module-documents`, and only for persisted messages that explicitly contain `@knowledge`.
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
  - replying profile's `rbac.subject` id;
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
  - internal token issuer accepts a valid `rbac.subject` authentication JWT and produces an MCP access token;
  - issued token resolves back to the same `rbac.subject` authentication JWT;
  - no refresh token is issued for internal tool-loop tokens;
  - invalid/expired `rbac.subject` authentication JWT is rejected;
  - external OAuth token flow remains unchanged.
- RBAC/OpenRouter backend tests:
  - with different requester and reply-principal permissions, tool calls execute only as the `rbac.subject` linked to the replying profile;
  - requester permissions are never delegated to the replying profile's `rbac.subject`;
  - non-AI, foreign-chat, missing-subject, and multiple-subject reply profiles fail closed before token issuance;
  - final assistant message is still authored by the replying AI profile;
  - raw tool calls are not displayed as chat messages;
  - tool loop continues after MCP result and produces final answer;
  - max step and timeout limits stop runaway loops;
  - unknown tool names and invalid tool arguments are rejected;
  - tools absent from the connected allowed MCP server catalog are not exposed or executable;
  - MCP calls do not use `X-RBAC-SECRET-KEY`.
  - linked skills are available without explicit selection, while deleted or unlinked skills are unavailable;
  - linked Knowledge is retrieved only when the persisted message explicitly contains `@knowledge`, while unlinked documents are never searched;
  - browser and automatic agent-triggered paths derive the same `social.profile` capabilities.
  - knowledge-chat replies and `/learn` use only `react-by/openrouter` after migration;
  - no route, SDK export, agent call site, or frontend mock remains for `react-by/knowledge`;
  - explicit `@knowledge`, profile-scoped Knowledge retrieval, skills, thread history, and `metadata.knowledge` remain compatible after the legacy endpoint is removed.
  - the message metadata reaction contract is versioned, bounded, normalized, and fail-closed when present;
  - one composer submit calls only message create, while metadata-free Telegram/legacy messages retain backend automatic profile selection;
  - persisted model/reasoning/skills/Knowledge values cannot be overridden by internal reaction request query/body values;
  - a chat with multiple AI participants produces one reply from the message-bound profile;
  - chat-shell rerender tests and cache tests prove no frontend reaction mutation or manual AI-reply refetch remains.
- Browser verification:
  - a user can assign a task to an AI profile that uses a skill, profile Knowledge, and a tool discovered from an allowed MCP server;
  - user sees a safe live execution action update in place and then the final assistant answer;
  - interaction details/metadata identify requester `rbac.subject`, reply `rbac.subject`, reply `social.profile`, Knowledge/skills, and tool trace.
  - one message produces reactive backend progress, one final MCP-backed reply, and no duplicate after waiting.
  - the visible execution action contains no raw arguments/results, bearer credentials, JWTs, prompts, or hidden reasoning.
