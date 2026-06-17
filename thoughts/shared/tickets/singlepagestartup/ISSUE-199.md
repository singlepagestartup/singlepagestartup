---
repository: singlepagestartup
issue_number: 199
status: Research Needed
created: 2026-06-17
priority: high
size: large
type: feature
---

# Issue: Add OpenRouter tool calling with authenticated MCP execution

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/199
**Status**: Research Needed
**Created**: 2026-06-17
**Priority**: high
**Size**: large
**Type**: feature

---

## Problem to Solve

`react-by/openrouter` currently generates final chat answers directly. It does not send OpenRouter-compatible tool definitions to the selected model, does not interpret model tool calls, and does not execute requested tools before asking the model to continue. SPS already has an MCP server, and the chat agent should be able to use that same MCP surface consistently instead of a separate ad hoc executor.

The required behavior is an authenticated tool loop:

- OpenRouter receives available tools in the request.
- If the model returns tool calls, backend executes them instead of showing them as chat output.
- Tool results are sent back to the model.
- The loop continues until a final assistant answer is produced or a hard stop condition is reached.
- MCP tools execute as the `rbac.subject` who sent the message, not as the agent subject and not with root secret access.
- The final chat answer is still created by the replying AI `social.profile`.

## Key Details

- Keep MCP as the single tool execution surface for this feature.
- Do not replace MCP with a parallel local executor for this issue.
- Preserve the current external MCP OAuth flow for external clients.
- Add an internal backend-to-MCP token flow so RBAC controllers can mint a short-lived MCP access token for the sender `rbac.subject` without browser OAuth redirect.
- The internal MCP access token must still be backed by an SPS JWT for the sender subject and must be stored/verified through the same MCP access-token path used by external MCP clients.
- Tool execution identity and final chat message identity must stay separate:
  - tool execution identity: sender `rbac.subject`;
  - final assistant message identity: replying AI `social.profile`.
- Do not call MCP with `X-RBAC-SECRET-KEY` for model-requested tools.
- Do not expose the whole generated MCP CRUD surface to the model by default; expose an allowlisted tool set for the chat profile/context.
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

- Add a service for `react-by/openrouter` tool loops rather than embedding all logic directly in the controller.
- The loop should:
  - build the normal OpenRouter context, including profile system message, current thread context, selected skills, and optional knowledge context;
  - send allowed tool definitions with the OpenRouter request;
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

### Internal MCP access token for sender subject

- In `apps/mcp/lib/oauth.ts`, extract/reuse token issuing logic so a backend caller can issue a short-lived MCP access token for an existing SPS JWT.
- Add an internal function similar to `issueMcpAccessTokenForSpsJwt`:
  - validates SPS JWT with `RBAC_JWT_SECRET`;
  - extracts `subject.id`;
  - issues MCP access token with `aud = getMcpPublicUrl()`;
  - stores `{ jti, clientId, subject, scope, spsJwt, expiresAt }` in the MCP OAuth store;
  - returns access token and expiration;
  - does not issue refresh token for internal tool loops.
- The RBAC controller should:
  - resolve sender `rbac.subject` from route `:id`;
  - sign a short-lived SPS JWT for that sender;
  - call the internal MCP token issuer;
  - call `/mcp` with `Authorization: Bearer <mcp_access_token>`.
- Use `clientId = "internal-rbac-openrouter"` or equivalent for auditability.

### MCP execution

- Use the existing Streamable HTTP MCP endpoint (`/mcp`) as the execution path.
- MCP auth context should continue to forward the underlying sender SPS JWT to API calls.
- Existing external OAuth/PCKE MCP behavior must remain unchanged.
- Any model-exposed MCP tool must have:
  - stable name;
  - clear description;
  - JSON schema;
  - zod validation before execution;
  - RBAC enforcement through the sender JWT.

### Tool allowlist

- Start with a small allowlist scoped to chat/agent use cases.
- Read-only tools should be enabled first.
- Mutation tools must require preview/apply or explicit confirmation tokens before execution.
- Knowledge/RAG can either remain as the existing `@knowledge` pre-generation pipeline or be exposed as an MCP tool later, but this issue must not remove the current `@knowledge` behavior.

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
  - sender subject id;
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
  - internal token issuer accepts a valid sender SPS JWT and produces an MCP access token;
  - issued token resolves back to the same sender SPS JWT;
  - no refresh token is issued for internal tool-loop tokens;
  - invalid/expired SPS JWT is rejected;
  - external OAuth token flow remains unchanged.
- RBAC/OpenRouter backend tests:
  - tool calls execute as sender `rbac.subject`, not agent subject;
  - final assistant message is still authored by the replying AI profile;
  - raw tool calls are not displayed as chat messages;
  - tool loop continues after MCP result and produces final answer;
  - max step and timeout limits stop runaway loops;
  - unknown tool names and invalid tool arguments are rejected;
  - disallowed tools are not exposed to OpenRouter;
  - MCP calls do not use `X-RBAC-SECRET-KEY`.
- Browser verification:
  - authenticated chat can send a prompt that triggers a tool;
  - user sees only final assistant answer;
  - interaction details/metadata expose tool execution trace for debugging.
