---
date: 2026-07-12T00:42:59+0300
issue_number: 199
repository: singlepagestartup
topic: "MCP-powered AI execution for social profiles"
status: in_review
---

# MCP-Powered AI Execution for Social Profiles Implementation Plan

## Overview

Enable a replying AI `social.profile` to use OpenRouter for reasoning, explicitly requested linked Knowledge and available skills for expertise, and tools discovered from MCP servers enabled for that profile to work with `apps.api` under the permissions of its linked `rbac.subject`.

## Code Review Revision: Startup-Overridable Subject Service Composition

### Problem Found During SPS Architecture Review

The OpenRouter message controller imported several implementation files through
fragile relative paths and instantiated the MCP catalog, AI tool loop, and
execution-action reporter directly. Those calls bypassed the main
`rbac.subject` service, so a child SPS project could not replace the behavior in
its startup service without forking the controller.

### Canonical Contract

- Subject-owned services are grouped under readable domain zones:
  `billing`, `social-module/chat`, `social-module/profile/ai`, and
  `social-module/profile/mcp`.
- Controllers import the startup-bound main Subject `Service` through its
  package alias and call only its public domain methods.
- The main singlepage service owns protected factories for the default MCP
  catalog, AI tool loop, and execution-action reporter implementations.
- The startup Subject service remains the exported controller dependency and
  may override either a public operation or a protected factory without route
  changes.
- The message metadata parser owns only model, reasoning, Skill, and Knowledge
  settings. Older reply-profile fields are ignored and removed during
  normalization because chat membership owns reply dispatch.

### Success Criteria

- [x] The OpenRouter controller has no relative implementation imports and no
      direct construction of profile MCP/AI domain services.
- [x] MCP catalog, AI tool-loop, execution-action, and OpenRouter billing calls
      cross the public main Subject service boundary.
- [x] Domain implementations and specs live in their matching service zones.
- [x] BDD coverage proves default composition and startup override behavior.
- [x] Legacy persisted AI-reaction metadata drops obsolete reply-profile
      routing while preserving the execution settings.

## Code Review Revision: Canonical Domain Terminology

### Problem Found During Domain Review

The implementation used one invented product-role alias for both the replying
profile and its execution principal, and used a repository-wide alias for an
RBAC-issued authentication credential. Neither name maps to a model in the repository, so
the terminology obscured which identity owns profile behavior and which
identity authorizes API work.

### Canonical Contract

- The visible AI actor and capability owner is `social.profile`; code uses the
  `socialProfile*` prefix for that identity and for its tool loop.
- The authenticated MCP/API execution principal is `rbac.subject`; code uses
  the `rbacSubject*` prefix.
- The server-minted credential is named `rbacSubjectAuthenticationJwt`.
- Audit metadata distinguishes `requesterRbacSubjectId`,
  `replyRbacSubjectId`, and `replySocialProfileId`.
- The internal MCP exchange route is
  `/internal/rbac-subject-token-exchange`, and its client id is
  `internal-rbac-subject`.
- OAuth protocol fields such as `subject_token` and the established JWT
  payload claim `subject.id` retain their protocol/schema names.

### Success Criteria

- [x] Runtime code, tests, and operator documentation contain no invented role
      identity or repository-wide JWT identifier.
- [x] MCP OAuth exchange, RBAC client/catalog, OpenRouter controller, action
      metadata, and tool-loop service use the canonical names above.
- [x] Affected Jest, TypeScript, ESLint, formatting, and zero-reference checks
      pass.

## Code Review Revision: Canonical MCP Service Environment Namespace

### Problem Found During Configuration Review

MCP runtime, OAuth, API-client, and deployment settings used several unrelated
transport, OAuth, generic, and SinglePageStartup-specific prefixes. This did
not follow the existing application-service convention represented by
`API_SERVICE_*` and made the role of each URL ambiguous.

### Canonical Contract

Every MCP environment variable uses the `MCP_SERVICE_*` namespace.
`MCP_SERVICE_HTTP_HOST` and `MCP_SERVICE_HTTP_PORT` configure only the MCP
server's bind socket. `MCP_SERVICE_PUBLIC_BASE_URL` and
`MCP_SERVICE_PUBLIC_URL` identify the external HTTPS/OAuth resource.
`MCP_SERVICE_URL` is the service-to-service Streamable HTTP endpoint used by
`apps.api`; it remains separate because a bind host such as `0.0.0.0` is not a
client destination and the public reverse-proxy URL is not the deployment
network address.

### Success Criteria

- [x] Runtime code, env generators, deployment templates, workflows, and docs
      use only `MCP_SERVICE_*` environment names.
- [x] The previous project-specific API endpoint variable is removed and the
      API client reads `MCP_SERVICE_URL`.
- [x] Public connector configuration uses `MCP_SERVICE_PUBLIC_URL` without
      overwriting the API's internal `MCP_SERVICE_URL`.
- [x] Focused MCP/RBAC tests, TypeScript, formatting, shell syntax, and
      zero-reference checks pass.

## Code Review Revision: Realtime Billing Balance Reconciliation

### Problem Found During Runtime Verification

OpenRouter billing was being settled correctly in PostgreSQL, but an already
open `subjects-to-billing-module-currencies` table continued to show the old
amount. The AI-reaction action route broadcast message and execution-action
topics only, so the billing relation's React Query cache and HTTP cache version
were not invalidated after settlement.

### Canonical Contract

The requester remains the billing principal and the existing one-precharge plus
exact-settlement ledger remains unchanged. The shared topic rule for
`react-by/openrouter` also emits
`rbac.subjects-to-billing-module-currencies`. The same resolver drives both the
WebSocket broadcast and HTTP-cache version bump, so an open balance table
refetches after the completed AI turn without adding billing-specific polling
or bypassing the startup-overridable Subject service.

### Success Criteria

- [x] Runtime database evidence shows exact OpenRouter charges are already
      applied to the requester's billing relation.
- [x] A completed AI reaction emits the billing-relation topic in addition to
      its message and action topics.
- [x] The shared topic-rule BDD suite covers the billing invalidation contract.
- [x] Shared Utils tests, TypeScript, ESLint, Prettier, and diff checks pass.

## Code Review Revision: Thread-Scoped Model Preference

### Problem Found During Browser Verification

The OpenRouter model selector was component-local state. The chat shell reset it
to `auto` whenever the page mounted or the active chat/thread changed, so a
model explicitly selected for a thread was silently lost after reload and the
next message could run through a different model.

### Canonical Contract

`social.thread.metadata` is the generic JSONB extension point. RBAC owns the
versioned `rbacAiThreadPreferences` namespace and stores the selected
`modelId`, including an explicit return to `auto`. The frontend restores this
preference from the active thread and persists every explicit selector change
through the existing authorized Subject thread-update route.

The controller delegates preference persistence to the public
`socialModuleChatThreadOpenRouterModelUpdate` method on the main Subject
singlepage Service. Because the bound startup Subject Service extends this
class, a child project can override that method without replacing the route or
frontend. The base implementation asserts subject/chat/thread ownership,
validates the typed metadata contract, and preserves unrelated metadata keys.

### Success Criteria

- [x] Selecting a concrete model persists it on exactly the active thread.
- [x] Reloading or returning to that thread restores its saved model instead of
      `auto`.
- [x] Selecting `auto` explicitly replaces the previous saved model.
- [x] Different threads retain independent preferences and existing thread
      metadata is preserved.
- [x] Startup projects can override the main Subject Service method used by the
      controller.

## Code Review Architecture Revision: Message-Owned AI Reaction Intent

### Problem Found During Browser Verification

The browser composer currently performs two mutations for one user action: it first creates the social message and then calls `react-by/openrouter` with the chosen reply profile, OpenRouter model/reasoning, skills, and Knowledge flag. A temporary `aiReactionMode=explicit` query marker and `X-SPS-SKIP-ACTION-LOGGER` response header prevent the normal action logger from launching the same reaction a second time. This makes the frontend an orchestration layer, creates two competing launch paths, permits a partially-created turn when the second request fails, and couples backend behavior to transport-only markers that are not durable message state.

### Canonical Contract

`social.message.metadata` remains the generic JSONB extension point owned by the Social module. The RBAC Subject SDK model owns a namespaced, versioned contract for the AI-reaction request because RBAC is the boundary that consumes profile, model, skill, Knowledge, and reply-`rbac.subject` policy:

```json
{
  "rbacAiReactionRequest": {
    "version": 1,
    "modelId": "auto",
    "reasoning": "auto",
    "skillIds": ["social-skill-id"],
    "useKnowledgeSearch": false
  }
}
```

The composer records the user's explicit execution settings in the same create-message mutation as the message text and attachments. It does not call an AI reaction endpoint, pass reaction query parameters, issue control headers, poll, or manually refetch the generated reply. The contract is intentionally execution configuration rather than trusted authorization: the backend normalizes its shape and bounds. Agent derives reply profiles from chat membership, and each execution authoritatively verifies its reply profile, model, linked skills, linked Knowledge, linked replying profile's `rbac.subject`, allowed MCP servers, and all MCP/API operations.

Messages without this envelope use safe automatic execution defaults. With or without the envelope, every automatic profile connected to the chat is dispatched. The backend-selected profile identity is carried between internal services, while user-selectable answer parameters are read only from the persisted message.

### Single Backend Launch Flow

1. The dumb frontend creates one message containing text/files and the versioned metadata envelope.
2. The message-create handler persists the message and all chat/thread/author relations before returning, with no explicit-reaction query or skip header.
3. The existing action logger records the create action and invokes the Agent dispatcher exactly once.
4. Agent reloads the persisted message, ignores AI-authored messages, and dispatches every automatic profile connected to the chat.
5. Agent calls the canonical internal `react-by/openrouter` action with server-derived route/profile identity only.
6. `react-by/openrouter` reloads the persisted message, derives model/reasoning/skills from its metadata, and enables Knowledge only from an explicit `@knowledge` mention in the persisted message text. Caller query/body fields cannot override the persisted request.
7. The handler resolves the profile's replying profile's `rbac.subject` and allowed capabilities, executes OpenRouter/MCP under that `rbac.subject` authentication JWT, and persists one final AI-authored reply.
8. Existing WebSocket topic invalidation delivers server-created actions and the final message to their isolated query boundaries.

### Module Boundaries And Validation

- **Social message model**: stores opaque JSON metadata and does not import RBAC/OpenRouter concepts.
- **RBAC Subject SDK model**: exports the typed metadata key, TypeScript interface, reasoning values, and a pure fail-closed parser/normalizer with explicit version, string, array, enum, and maximum-count constraints.
- **RBAC message-create backend**: normalizes the execution-settings envelope before persistence; it does not select a reply profile or duplicate MCP record authorization.
- **Agent backend**: owns automatic dispatch from current chat membership.
- **RBAC OpenRouter backend**: owns authoritative model/skill/Knowledge/profile/`social.profile` capability resolution and validates each Agent-selected profile.
- **MCP/apps.api**: remains the only data/tool authorization layer; the `rbac.subject` authentication JWT is checked by existing `rbac.permission` behavior.

### Frontend Reactivity Invariants

- Keep the exact created user message append in the thread query cache; this is a one-row cache patch, not shell state.
- Remove the `reactByOpenrouter` mutation, its pending state, reaction-success callback, action-query refetch callback, and AI-reply message refetch from the composer/shell.
- Keep message timeline, action timeline, composer form, model controls, skill selector, and profile sidebar in their current isolated boundaries.
- Rely on WebSocket invalidation as the consistency mechanism for server-created actions and the final AI reply, so the chat shell does not receive message arrays or per-message pending state and does not rerender for reaction progress.
- Preserve stable callbacks, memoized rows, id-based keys, and item-scoped pending state in any touched component.

### Revised Implementation Steps

1. Add and unit-test the versioned RBAC metadata contract and pure normalizer.
2. Change the composer to include the complete envelope in the one create-message request; delete the direct reaction mutation and explicit-reaction transport markers.
3. Normalize and persist the envelope in message creation, and ensure all relations exist before the action logger dispatches.
4. Make Agent dispatch every automatic participant connected to the chat, independent of whether the envelope exists.
5. Make `react-by/openrouter` load all answer parameters from the persisted message, remove query/body overrides, and validate its server-derived reply profile.
6. Remove now-unused frontend reaction-success/refetch wiring and update BDD rerender/cache tests.
7. Run focused RBAC, Agent, Social, shared-client, and TypeScript checks, followed by repository-wide forbidden-marker/reference checks.
8. In Browser, send one read-only MCP count task and verify one persisted user message, visible backend action progress, one final profile-authored answer, no duplicate reply after waiting, and no console errors.

### Additional Success Criteria

- [x] One composer submission performs exactly one frontend mutation: create message.
- [x] The persisted message contains the normalized model, reasoning, skill ids, and Knowledge flag used for its answers.
- [x] `aiReactionMode`, `X-SPS-AI-REACTION-MODE`, and the explicit-reaction use of `X-SPS-SKIP-ACTION-LOGGER` have no live references.
- [x] Request query/body values cannot override persisted AI-reaction parameters.
- [x] Every connected AI profile receives the message, whether or not execution-settings metadata is present.
- [x] Telegram bootstrap preserves manually connected AI participants and removes only duplicate relations.
- [x] Server-created action rows and the final AI reply appear through WebSocket/query invalidation without a chat-shell rerender or frontend reaction refetch.
- [x] Browser verification proves one MCP-backed final response and no duplicate launch.

## Code Review Architecture Revision: Visible AI Execution Actions

### Goal And Ownership

Tool use must be visible in the conversation while the `social.profile` is working, without turning internal model context into chat messages or exposing credentials, arguments, results, prompts, or chain-of-thought. The existing `social.action` timeline item is the canonical durable UI surface. RBAC owns the typed execution payload because the OpenRouter `social.profile` tool loop, profile identity, skills, Knowledge, and MCP capability policy all belong to the RBAC Subject boundary; Social continues to store and relate the generic action.

The implementation uses `social.action.variant = "ai-execution"` and a versioned `IAiExecutionActionPayload`. There is no nested `rbacAiExecution` wrapper: the action variant already namespaces the payload.

### Action Contract

One agent run creates at most one action, lazily on the first actual tool request. The action is related to the current chat, thread, and replying profile; `triggerMessageId` in the typed payload binds it to the initiating message. Its stable id is retained for every update.

The payload contains only bounded presentation-safe state:

- version, run id, trigger message id, replying profile id, selected model id, start/completion timestamps;
- run status (`running`, `completed`, `failed`, or `stopped`) and phase;
- a bounded list of tool steps with call id, source (`skill`, `knowledge`, or `mcp`), optional server id, tool name, safe label, status, timestamps, result byte count, and normalized error code.

The payload never contains tool arguments or results, `social.profile`/requester JWTs, authorization headers, raw MCP responses, model prompts, hidden reasoning, stack traces, or generic metadata objects. The pure SDK parser fails closed for malformed or unsupported payloads.

### Runtime Flow

1. The `social.profile` tool loop emits transport-neutral lifecycle events: requested, started, succeeded, failed, and run completed.
2. The OpenRouter handler supplies safe labels/server ids when constructing tools and connects those events to an `AiExecutionActionReporter`.
3. The reporter lazily creates one `ai-execution` action when a tool is requested, awaits chat/thread/profile relations, and updates the same action as steps advance.
4. Persistence failures are logged and isolated from the `social.profile` task: progress UI cannot make the final answer fail.
5. Existing message metadata retains the immutable audit trace; the action payload is a safe live projection for humans, not a second authorization or audit system.
6. Existing WebSocket invalidation updates the action row in place. No frontend polling, reaction mutation, or chat-shell state is added.

### Frontend And Reactivity

- `MessageTimeline` renders a dedicated `AiExecutionActionRow` only when the variant and typed payload are valid.
- Running rows name the safe capability, such as the SinglePageStartup MCP server and tool; completed/failed rows summarize the bounded step list in a collapsible presentation.
- A malformed `ai-execution` action renders a safe unavailable state and never falls back to raw JSON.
- Other action variants keep the existing generic row.
- The memoized action boundary compares stable id and `updatedAt`, so a WebSocket-driven update rerenders the changed action while unchanged sibling rows remain stable.

### Implementation Steps

1. Add the versioned payload contract, constants, pure parser, and BDD tests to the RBAC Subject SDK model; add `ai-execution` to the Social action variants.
2. Add safe lifecycle events to `AiSocial profileToolLoop`, including ordered success/failure events and best-effort callback isolation.
3. Add the reporter service that creates/relates/updates exactly one action per run and unit-test its lifecycle and failure isolation.
4. Wire reporter events into `react-by/openrouter` with safe tool display metadata for skills, Knowledge, and MCP.
5. Add the specialized action row, fail-closed rendering, stable memo comparison, and BDD component tests.
6. Run focused and full RBAC/Social tests, TypeScript, ESLint, forbidden-reference checks, and `git diff --check`.
7. In Browser, issue a read-only MCP count task and verify a visible in-progress action, an in-place completed action, one final answer, no duplicate action/reply, and no raw arguments, results, bearer tokens, or JWTs in the DOM.

### Additional Success Criteria

- [x] A run with no tool call creates no `ai-execution` action.
- [x] A run with one or more tool calls creates exactly one related action and updates its stable id.
- [x] Requested, running, succeeded, and failed tool states are represented by typed, presentation-safe events.
- [x] Action persistence failure cannot suppress the final AI reply.
- [x] The specialized row never renders raw arguments, results, credentials, prompts, or hidden reasoning.
- [x] WebSocket invalidation updates the action row without frontend polling or a chat-shell rerender.
- [x] Browser verification proves live MCP progress, final completion, one final reply, and no duplicate action.

## Current State Analysis

The social chat flow already separates the authenticated requester from the replying profile, builds thread/persona context, can apply explicitly selected skills, and can retrieve profile-linked Knowledge when explicitly requested. It currently splits AI reactions across two overlapping endpoints and does not yet provide a safe `rbac.subject` execution identity contract or a model/tool loop:

- `react-by/openrouter` receives the requester bearer token for route authorization and billing, then separately resolves the replying profile's linked `replyByRbacSubject` and signs `replyByRbacSubjectAuthenticationJwt` for profile-authored messages (`react-by-openrouter.ts:826-835`, `1156-1193`).
- The OpenRouter handler does not yet apply the complete profile/chat/message guards already used by `react-by/knowledge`, and it accepts the requested reply profile id before proving that the profile is an AI participant in the current chat (`react-by-knowledge.ts:81-111`, `206-217`, `258-351`). The legacy handler also retains its own `/learn`, Knowledge generation, thread-history, skill, reply-creation, route, SDK, and documentation surfaces even though the automatic Knowledge-chat branch already calls OpenRouter (`react-by-knowledge.ts:472-1259`; `agent/.../service/singlepage/index.ts:349-425`, `2036-2091`).
- Profile persona is always added, but Knowledge search requires `@knowledge`/`useKnowledgeSearch`, skills require `/slug`/`skillIds`, and the persona prompt explicitly says unselected skills are not part of the profile (`react-by-openrouter.ts:934-947`, `1694-1707`, `1990-1997`, `2838-2869`). The separate skill-lifecycle cleanup removes draft semantics; issue #199 consumes linked skill existence rather than introducing another status policy.
- `social.profile` has no MCP configuration field, while its admin form already owns the profile details plus Knowledge and skills relations (`libs/modules/social/models/profile/backend/repository/database/src/lib/fields/singlepage.ts:4-31`; `.../admin-v2/form/ClientComponent.tsx:33-124`).
- The OpenRouter wrapper supports only system/user/assistant messages and text/image parsing; it neither sends tool definitions nor returns `tool_calls` (`libs/shared/third-parties/src/lib/open-router/index.ts:29-32`, `231-312`).
- The SinglePageStartup MCP exposes one 19-tool content-management surface. HTTP sessions expose the same catalog to every authenticated client; a bearer MCP token is resolved to its stored `rbac.subject` authentication JWT and forwarded to `apps.api` (`apps/mcp/content-management.ts:96-469`; `apps/mcp/http.ts:151-174`, `199-214`).
- MCP OAuth issuing is coupled to browser authorization-code/refresh flows and always creates a refresh token. There is no internal exchange endpoint or in-repo Streamable HTTP MCP client for `apps/api` (`apps/mcp/lib/oauth.ts:511-640`).
- OpenRouter billing already records every model call in a typed ledger and settles it against the requester once (`billing/open-router.ts:7-43`; `react-by-openrouter.ts:446-533`).

## Desired End State

For every social-chat task, the system resolves three non-interchangeable identities:

1. **Requester** — owns the incoming profile/message/chat route and remains the OpenRouter billing principal.
2. **Social profile subject** — the exactly one `rbac.subject` linked to the authorized replying AI profile; its short-lived SPS/MCP credentials authorize every MCP-to-API operation.
3. **Reply author** — the replying AI `social.profile` shown in the thread.

`react-by/openrouter` is the single AI reaction endpoint. The backend derives the `social.profile`'s capabilities from the replying profile, preserves `/learn`, explicit `@knowledge`, skills, persona, thread context, and compatible reply metadata there, exposes profile Knowledge only for explicitly marked messages plus linked skills and tools from the profile's allowed MCP servers, executes calls sequentially, feeds results back to the model, and stores only the final profile-authored response as visible chat output. The requester never lends API permissions to the `social.profile`, model arguments cannot select an execution subject/profile/document outside the server-bound context, and `X-RBAC-SECRET-KEY` is never used by the tool loop.

After all callers have been switched and parity tests pass, `react-by/knowledge` no longer exists as a route, handler, SDK action/export, agent-service method, frontend mock, permission, or documented API. Knowledge chats and automatic agent reactions use `react-by/openrouter` exactly like every other AI-enabled `social.profile` reply.

Verification must prove that a requester with different permissions can assign a clean task without `@knowledge` or `/skill`, the `social.profile` can activate a linked skill and discover/call a tool from the allowed SinglePageStartup MCP without receiving RAG context, while a separate explicit `@knowledge` task searches only linked Knowledge and returns either the RBAC-authorized result or an auditable denial before the final answer.

### Key Discoveries

- The existing `replyByRbacSubject`/`replyByRbacSubjectAuthenticationJwt` path is the correct basis for `rbac.subject` execution identity, but the current many-to-many relation is read with `[0]`; `social.profile` resolution must require exactly one relation and fail closed (`react-by-openrouter.ts:1156-1193`).
- `react-by/knowledge` already contains the required profile/chat/message and AI-variant guard patterns (`react-by-knowledge.ts:81-111`, `206-217`, `258-351`).
- The automatic agent path already sends Knowledge-chat profiles to `openRouterReplyMessageCreate`, but the unused `knowledgeReplyMessageCreate` method and `ReactByKnowledge` SDK action remain, so cleanup must include agent tests and generated SDK indexes rather than only deleting the controller file (`agent/.../service/singlepage/index.ts:349-425`, `2036-2091`).
- The legacy route is still imported and registered in the RBAC controller, exported by both client/server SDKs, mocked by the message-list frontend tests, documented in RBAC/Knowledge READMEs, and represented by a route permission; all of these are deletion criteria for the consolidation phase (`controller/singlepage/index.ts:60`, `478-483`, `1021-1027`; `subject/sdk/client/.../index.ts:198-200`; `subject/sdk/server/.../index.ts:231-233`).
- The replying profile's `rbac.subject` placed inside the MCP access-token record automatically becomes the `rbac.subject` authentication bearer forwarded to `apps.api` (`apps/mcp/lib/oauth.ts:298-325`; `apps/mcp/http.ts:199-214`).
- The current MCP token store lives in the MCP process, so internal `social.profile` token issuance must happen through a protected MCP HTTP exchange endpoint rather than importing the issuer into `apps/api`.
- `profiles-to-skills` and `profiles-to-knowledge-module-documents` already provide profile scoping; no new relations are required for Knowledge or skills (`react-by-openrouter.ts:1912-1950`, `2030-2059`).
- Profile MCP policy needs persisted allowed-server configuration because the current schema has no MCP server field. The server's own `tools/list` remains the source of tool definitions, while its forwarded `rbac.subject` authentication JWT lets existing `apps.api` middleware enforce `rbac.permission` (`profile/fields/singlepage.ts:4-31`; `apps/mcp/http.ts:105-126`, `151-174`, `199-214`).

## What We're NOT Doing

- Not connecting arbitrary external MCP URLs or building a multi-server registry, connector credential vault, third-party OAuth UI, or remote catalog synchronization.
- Not replacing the project `apps.mcp` with direct SDK/CRUD execution inside the OpenRouter controller.
- Not delegating requester permissions, using `X-RBAC-SECRET-KEY`, or allowing the model/caller to choose the replying profile's `rbac.subject`.
- Not adding a second tool/data permission system in the OpenRouter orchestrator; MCP tool contracts and existing JWT-backed `rbac.permission` checks remain authoritative.
- Not changing mutation semantics already implemented by MCP tools, including dry-run and preview/apply confirmation.
- Not changing external MCP OAuth/PKCE semantics.
- Not adding autonomous background jobs, scheduled work, cross-turn durable plans, or execution after the bounded chat turn ends.
- Not replacing `/skill`, `skillIds`, `@knowledge`, or `/learn`; these remain deterministic compatibility controls.
- Not preserving `react-by/knowledge` as an alias, redirect, deprecated route, or parallel compatibility flow after its behavior and callers have migrated.
- Not changing the requester-based OpenRouter billing principal in this issue.

## Implementation Approach

First consolidate reaction behavior into `react-by/openrouter`: port every load-bearing guard and Knowledge function, switch route/SDK/agent/frontend callers, prove parity, and remove the legacy `react-by/knowledge` surface. Do not delete the old handler until the replacement tests cover `/learn`, explicit Knowledge, clean non-RAG messages, skills, thread history, reply authorship, and metadata.

Then build one bounded `social.profile` tool loop with two capability classes:

- **Profile-bound local capabilities**: a compact catalog of skills linked to the replying profile with a server-resolved activation operation, and Knowledge search permanently bound to the profile's linked document ids. Explicit skill/Knowledge controls preactivate or force these capabilities, but are no longer required.
- **Business/API capabilities**: tools discovered from each MCP server whose stable identifier is allowed by the profile. For this issue the only supported server is the built-in SinglePageStartup MCP. Tool execution happens through an `rbac.subject`-authenticated Streamable HTTP session, and existing MCP-to-`apps.api` JWT/RBAC enforcement is the only business/data authorization layer.

Use a dedicated internal MCP token exchange protected by a new service-to-service secret. The exchange accepts the signed `rbac.subject` authentication JWT, derives its subject from the verified JWT, issues a five-minute MCP access token with no refresh token, and never accepts a separately supplied subject id. One MCP client/session is opened per `social.profile` turn, reused for catalog and tool calls, and closed at the end.

The initial loop is sequential (`parallel_tool_calls: false`) with defaults of 50 model/tool iterations, five minutes total runtime, 30 seconds per tool call, 32 KiB per tool result, and at most two identical consecutive call signatures. These defaults must be named/configurable and included in stop metadata.

## Phase 1: Consolidate Reactions And Establish the rbac.subject Identity Boundary

### Overview

Make `react-by/openrouter` the single AI reaction path, preserve all required Knowledge behavior inside it, and make requester, replying profile's `rbac.subject`, and reply author explicit before any tool catalog, token, or model-requested operation is created.

### Changes Required

#### 1. OpenRouter Guards, Knowledge Parity, And Social profile Resolver

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts`

**Why**: The handler currently resolves a client-supplied reply profile and the first linked subject without proving AI variant, current-chat membership, or relation cardinality. Giving that identity MCP authority without new guards would create a confused-deputy escalation path.

**Changes**:

- Port the requester profile/chat/message, message/chat, reply-profile AI variant, and reply-profile/chat checks from `react-by/knowledge` into shared or equivalent OpenRouter guard helpers.
- Port any legacy-only `/learn` ingestion, profile-document relation, Knowledge generation, thread-history, skill-resolution, reply-creation, and `metadata.knowledge` behavior that is not already equivalent in OpenRouter. Keep the OpenRouter billing/model pipeline as the canonical generation path rather than calling one handler from the other.
- Preserve Knowledge-chat behavior while removing the legacy requirement that Knowledge answers use a separate endpoint; `/learn` and explicit `@knowledge` execute through `react-by/openrouter`, while messages without the mention remain free of RAG retrieval/context.
- Treat these as request/identity integrity checks that bind the correct replying profile's `rbac.subject`, not as duplicate authorization of records returned by MCP tools.
- Resolve the replying profile's `rbac.subject` only after the reply profile passes those checks.
- Require exactly one `subjects-to-social-module-profiles` relation; reject zero or multiple relations without issuing credentials.
- Keep the incoming requester authorization only for route ownership and billing settlement.
- Create an immutable `rbac.subject` execution identity context containing requester subject id, replying profile's `rbac.subject` id, reply profile id, chat/thread/message ids, and the server-signed `rbac.subject` authentication JWT.
- Never read `rbac.subject` execution identity from OpenRouter tool arguments or reuse requester JWT as the `social.profile` credential.

#### 2. Switch Callers And Remove `react-by/knowledge`

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.spec.ts`
- `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/index.ts`
- `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.ts`
- `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/index.ts`
- `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.ts`
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/knowledge-reply.spec.ts`
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/open-router-reply.spec.ts`
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/test-utils.tsx`
- `libs/modules/rbac/README.md`
- `libs/modules/knowledge/README.md`

**Why**: Deleting only the handler would leave a callable SDK contract, a stale route permission, dead agent code, and misleading documentation. The migration must converge on one public/internal reaction contract.

**Changes**:

- Route all Knowledge-chat and automatic agent reactions through `openRouterReplyMessageCreate`; remove `knowledgeReplyMessageCreate`, its direct SDK invocation, and tests that only assert the legacy dispatch.
- Remove the `react-by/knowledge` controller import, route registration, factory method, handler, and handler-only spec after OpenRouter parity scenarios pass.
- Remove the dedicated client/server SDK action files, exported functions, prop/result types, and parent SDK interface entries; update frontend mocks and any callers to use the OpenRouter action.
- Update RBAC and Knowledge documentation to describe `react-by/openrouter` as the only reaction endpoint and document preserved `/learn`/Knowledge behavior there.
- Remove the obsolete `react-by/knowledge` permission with the existing RBAC permission-management flow. Do not hand-edit the repository data snapshot under the permission repository.
- Run a repository-wide reference check and require zero live `react-by/knowledge` or `ReactByKnowledge` symbols outside historical thoughts/git artifacts.

### Success Criteria

#### Automated Verification

- [x] BDD tests reject non-AI, foreign-chat, foreign-message, missing-subject, and multiple-subject reply profiles.
- [ ] BDD tests prove the requester token continues to settle billing while profile-authored writes use the `rbac.subject`/`social.profile` identity.
- [x] BDD tests prove model/caller data cannot override `replyRbacSubjectId`.
- [x] OpenRouter BDD tests cover `/learn`, explicit `@knowledge`, clean non-RAG messages, linked skills, thread history, reply authorship, and compatible `metadata.knowledge` after migration.
- [x] Agent tests prove Knowledge chats and normal AI-enabled `social.profile` chats invoke only the OpenRouter action.
- [x] Repository reference checks find no live `react-by/knowledge`, `ReactByKnowledge`, legacy SDK export, or frontend mutation mock.

#### Manual Verification

- [ ] Existing authorized AI replies still appear from the same replying profile before tools are enabled.
- [ ] Invalid profile/chat combinations fail before an OpenRouter or MCP call is attempted.
- [x] Knowledge chat, `/learn`, and ordinary OpenRouter replies work through the same endpoint; requesting the removed legacy route is no longer supported.

---

## Phase 2: Add Allowed MCP Servers And Autonomous Profile Capabilities

### Overview

Persist which MCP servers a `social.profile` may use, expose that configuration in the existing profile admin flow, and make linked skills plus explicitly requested Knowledge available to the backend-derived execution context. The first implementation supports only the built-in SinglePageStartup MCP server.

### Changes Required

#### 1. Profile Allowed-MCP-Servers Schema

**Files**:

- `libs/modules/social/models/profile/backend/repository/database/src/lib/fields/singlepage.ts`
- generated files under `libs/modules/social/models/profile/backend/repository/database/src/lib/migrations/`
- `libs/modules/social/models/profile/README.md`

**Why**: A profile currently has no persisted list of MCP servers it may use. Connection parameters will eventually belong to a separate MCP-server model, but the first built-in server needs a stable profile-level opt-in now.

**Changes**:

- Add a typed JSONB profile field containing stable allowed-server identifiers, with `singlepagestartup` as the only supported identifier in this issue.
- Default existing and new profiles to an empty server list so no MCP server is available until explicitly enabled.
- Generate the Drizzle migration with `npx nx run @sps/social:models:profile:repository-generate`; do not hand-write migration SQL, snapshots, or journal entries.
- Document that the `singlepagestartup` identifier resolves through deployment environment configuration and that a future issue will replace the temporary JSONB identifiers with a dedicated MCP-server model and profile relation containing connection parameters.

#### 2. Profile Admin Controls

**Files**:

- `libs/modules/social/models/profile/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx`
- `libs/modules/social/models/profile/frontend/component/src/lib/singlepage/admin-v2/form/interface.ts`
- `libs/modules/social/frontend/component/src/lib/admin-v2/overview/profile/admin-v2-form/ClientComponent.tsx`
- corresponding frontend specs

**Why**: Operators already manage profile details, Knowledge, and skills in this form; MCP policy belongs with the same `social.profile` definition.

**Changes**:

- Add Tailwind/shadcn controls for allowed MCP servers. Initially this is a single built-in SinglePageStartup-MCP option.
- Load supported server descriptors through the profile-scoped SDK added in Phase 4 and show unavailable stored identifiers as stale instead of silently accepting them.
- Preserve existing form validation, localized fields, and Knowledge/skills relation tabs.
- Add an MCP section to the chat profile sidebar beside Skills and Knowledge.
  Its editor persists `allowedMcpServerIds` through the chat-local profile
  update route so an operator can configure the `social.profile` without leaving the
  conversation.

#### 3. Profile-Bound Skill And Knowledge Capabilities

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts`

**Why**: Today Knowledge and skills are explicit-message features, so the automatic agent path cannot use profile capabilities consistently unless the backend derives them from persisted message intent and profile relations.

**Changes**:

- Load all existing skills linked to the profile in relation order; deleted or unlinked skills are unavailable, with no draft lifecycle introduced by this issue.
- Expose a compact skill catalog and a server-bound skill activation capability whose only selector is a linked slug; return the full instructions to the next model iteration without accepting profile ids.
- Bind Knowledge retrieval to the already resolved reply profile's linked document ids only when the persisted message explicitly contains `@knowledge`; expose a search capability that accepts only a query, never profile/document ids, in that mode only.
- Let the model invoke linked skills automatically. Treat explicit `/skill`/`skillIds` as deterministic preactivation, and require `@knowledge` before any Knowledge retrieval, rerank, system context, or tool exposure.
- Remove the persona instruction that excludes unselected linked skills, while preserving profile description/persona and thread history.
- Ensure browser-triggered and automatic agent-triggered replies derive the same capabilities backend-side.

### Success Criteria

#### Automated Verification

- [x] Profile model/schema tests cover the empty default, the supported `singlepagestartup` server identifier, and rejection/display of stale identifiers.
- [x] Repository generation produces only the expected profile migration artifacts.
- [x] Frontend tests prove allowed MCP server identifiers round-trip through the admin form and stale servers remain visible but unavailable.
- [x] Sidebar tests prove the MCP section lists configured servers and its editor persists the selected stable identifier.
- [x] BDD tests prove linked skills can be activated without `/skill`, while deleted or unlinked skills cannot.
- [x] BDD tests prove messages without `@knowledge` receive no Knowledge retrieval/context/tool and explicit searches cannot escape the profile-linked document set.
- [x] Existing explicit skill, `@knowledge`, and `/learn` tests remain green.

#### Manual Verification

- [x] An operator can enable the built-in SinglePageStartup MCP server from the chat profile sidebar alongside the `social.profile`'s Knowledge and skills.
- [x] A plain task message, with no control mentions, makes the profile's skills and Knowledge available to the `social.profile`.

---

## Phase 3: Add OpenRouter Tool-Calling Contracts

### Overview

Extend the shared OpenRouter client so a completion can return either final assistant content or validated tool requests and can accept tool results on subsequent iterations.

### Changes Required

#### 1. OpenRouter Request And Response Types

**Files**:

- `libs/shared/third-parties/src/lib/open-router/index.ts`
- `libs/shared/third-parties/src/lib/open-router/interface.ts`
- `libs/shared/third-parties/src/lib/open-router/index.spec.ts`

**Why**: Current message and result contracts discard provider tool calls and cannot serialize tool-result messages.

**Changes**:

- Add OpenAI-compatible function tool definitions, `tool_choice`, and `parallel_tool_calls` request options.
- Add assistant `tool_calls` plus `role = "tool"`, `tool_call_id`, and tool result content to message contracts.
- Parse and preserve tool call id, function name, and raw argument JSON without executing or trusting the arguments in the wrapper.
- Treat a valid tool-call response as success even when assistant text is empty; preserve existing text/image success behavior otherwise.
- Keep requests without tools byte-for-byte equivalent in semantics and keep the existing non-text retry rules from duplicating tool calls.
- Return billing/usage for every tool-producing and final completion so the existing ledger can account for the whole loop.

### Success Criteria

#### Automated Verification

- [x] Wrapper tests assert exact serialization of `tools`, `tool_choice`, and `parallel_tool_calls: false`.
- [x] Wrapper tests parse single and multiple tool calls, malformed argument JSON, tool-result replay, and final text after a tool result.
- [x] Wrapper tests prove text-only and image behavior is unchanged when no tools are passed.
- [x] Wrapper tests prove retries cannot execute or replay a tool call twice.

#### Manual Verification

- [x] A recorded OpenRouter-compatible response can move from assistant tool call to tool result to final assistant text without protocol loss.

---

## Phase 4: Implement MCP Authentication for `rbac.subject`, Client, And Catalog

### Overview

Issue MCP credentials inside the MCP process, connect `apps.api` to the SinglePageStartup MCP over Streamable HTTP, and expose a safe live catalog for profile configuration and runtime enforcement.

### Changes Required

#### 1. Internal Social profile Token Exchange

**Files**:

- `apps/mcp/lib/oauth.ts`
- `apps/mcp/http.ts`
- `apps/mcp/lib/oauth.spec.ts`
- `apps/mcp/README.md`
- relevant environment templates/documentation for `MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET`

**Why**: Importing the issuer into `apps.api` would write to the wrong in-memory token store; issuance must run in the MCP process while remaining distinct from browser OAuth.

**Changes**:

- Extract access-token creation from the current response helper so browser grants can still receive refresh tokens while internal exchange can issue access-only tokens.
- Add a protected internal HTTP exchange endpoint authenticated by a dedicated service secret, not `X-RBAC-SECRET-KEY`.
- Accept an `rbac.subject` authentication JWT as the subject token, verify it with `RBAC_JWT_SECRET`, derive the subject id from the verified payload, and reject any separately supplied subject id.
- Issue `clientId = "internal-rbac-subject"`, `scope = "mcp:content"`, a five-minute access token, and no refresh token through the existing access-token store.
- Keep external authorization-code, refresh-token, metadata, PKCE, revoke, and verification behavior unchanged.

#### 2. Streamable HTTP MCP Client Service

**Files**:

- new MCP client/exchange helpers under `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts`
- corresponding unit/integration specs

**Why**: No in-repo MCP client exists, and the `social.profile` tool loop needs one authenticated session for `tools/list` and `tools/call`.

**Changes**:

- Use the installed Model Context Protocol SDK client and Streamable HTTP transport.
- Exchange the server-signed `rbac.subject` authentication JWT for an MCP bearer token through the internal endpoint.
- Open one session per `social.profile` turn, reuse it for catalog and tool calls, and always close it in success/error/timeout paths.
- Normalize MCP content/error envelopes into bounded internal results without exposing protocol objects to chat output.
- Apply a 30-second per-call timeout and a 32 KiB serialized-result limit before returning data to OpenRouter.

#### 3. Profile-Scoped MCP Server Discovery And Tool Catalog

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts`
- new profile-scoped catalog handler under `.../controller/singlepage/social-module/profile/find-by-id/`
- matching RBAC subject client/server SDK files
- `apps/mcp/content-management.spec.ts`

**Why**: The admin UI needs the supported MCP-server descriptors, and runtime needs each allowed server's live tool catalog. Neither surface should duplicate the JWT-backed `rbac.permission` decisions already made by MCP and `apps.api`.

**Changes**:

- Add an owner-protected profile endpoint that returns supported MCP server descriptors, initially only the built-in `singlepagestartup` server.
- Resolve the profile's allowed server identifiers at runtime, open an `rbac.subject`-authenticated session for each supported server, and use its live `tools/list` definitions as the OpenRouter business-tool catalog.
- If the allowed-server list is empty, expose no MCP business tools. If a stored server identifier is unsupported, report it as stale and do not connect.
- Reject tool names absent from the connected server's live catalog and validate arguments against the MCP-provided schema before dispatch. These are protocol/catalog integrity checks, not business/data authorization.
- Forward the `rbac.subject` authentication JWT through MCP and rely exclusively on the existing `apps.api` middleware and `rbac.permission` path for record/action authorization.
- Preserve mutation behavior defined by the MCP tools themselves, including current dry-run and preview/apply contracts, without adding a second profile mutation policy.

### Success Criteria

#### Automated Verification

- [x] Internal exchange tests prove `rbac.subject` authentication JWT subject derivation, five-minute TTL, access-store verification, and absence of refresh tokens.
- [x] Tests reject invalid/expired `rbac.subject` authentication JWTs, wrong exchange secret, supplied subject overrides, and external-grant regressions.
- [x] MCP client tests cover initialize/list/call/close, timeout, oversized result, protocol error, and session cleanup.
- [x] Server-discovery tests prove empty, supported `singlepagestartup`, and stale server configurations plus live catalog refresh.
- [x] Tool dispatch tests reject names/schema shapes absent from the connected MCP catalog without adding duplicate record-level permission checks.
- [x] Integration tests prove the `rbac.subject` authentication bearer forwarded by MCP belongs to the replying profile's `rbac.subject`, `apps.api` applies `rbac.permission`, and the loop never uses `X-RBAC-SECRET-KEY`.

#### Manual Verification

- [x] The profile admin form can enable the built-in SinglePageStartup MCP server and shows unsupported stored server identifiers clearly.
- [ ] OpenRouter receives the connected SinglePageStartup MCP's live tool catalog, and a reply `rbac.subject` with insufficient permission receives the existing API denial from the MCP-to-API path.

---

## Phase 5: Orchestrate The Bounded Social profile Tool Loop

### Overview

Combine profile-bound capabilities and tools discovered from allowed MCP servers in one sequential OpenRouter loop, settle requester billing, audit every step, and persist only the final profile-authored answer.

### Changes Required

#### 1. social.profile Tool Loop Service

**Files**:

- new tool-loop and capability policy files under `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/ai/`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`
- corresponding service/controller specs

**Why**: The 3,800-line controller should not absorb protocol execution, session ownership, catalog routing, and loop limits.

**Changes**:

- Move the model/tool iteration into a service that receives the immutable `rbac.subject` execution identity/context and returns final text plus a structured trace.
- Combine profile-bound skill/Knowledge definitions with live tool definitions from allowed MCP servers using collision-safe stable names.
- Validate tool name and JSON arguments against the source catalog before dispatch. Route only the profile skill/Knowledge names locally; route business/API tools only through the authenticated MCP client.
- Do not reproduce `rbac.permission` logic or pre-authorize requested records in the loop; surface the existing MCP/`apps.api` allow or denial result to the model.
- Replay assistant tool calls and matching tool results in order using the original `tool_call_id`.
- Keep the shared generation context transport-neutral: do not prohibit tool protocol responses or inject Telegram-specific output limits; channel adapters own final delivery constraints such as message splitting.
- Enforce 50 iterations, five-minute total timeout, 30-second tool timeout, 32 KiB result limit, token budget, and repeated-call protection; use `parallel_tool_calls: false`.
- Produce a clear assistant-visible stop message for bounded failures while retaining internal error detail in trace metadata.
- Preserve the existing primary/fallback model selection policy without retrying a completed side effect.

#### 2. Billing, Message Metadata, And Final Reply

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/billing/open-router.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts`

**Why**: Every loop completion must settle all OpenRouter calls exactly once against the requester while retaining enough trace to audit `social.profile` execution actions.

**Changes**:

- Add a typed `tool_iteration` billing purpose for continuation calls; retain `generation` for the initial/final generation semantics and settle the combined ledger once.
- Persist requester subject id, replying profile's `rbac.subject` id, reply profile id, model/reasoning, available/activated skills, Knowledge searches/document ids, exposed tools, call ids/names/result sizes, MCP client id, step count, timing, and stop reason under assistant metadata.
- Keep raw tool arguments/results and protocol messages out of visible `social.message.description`; redact sensitive values from logs/metadata.
- Continue authoring status and final messages with the replying profile/`rbac.subject` execution identity.
- Ensure every catch/stop path closes MCP, settles billing once, removes transient status, and returns either final text or the bounded user-visible failure message.

### Success Criteria

#### Automated Verification

- [ ] BDD scenario: requester B assigns work to profile A; MCP/API authorization is replying profile's `rbac.subject` A, billing is requester B, and final author is profile A.
- [x] BDD scenarios cover skill activation, explicit Knowledge retrieval, clean non-RAG MCP work, multi-step result replay, final answer, and auditable metadata.
- [x] BDD scenarios cover invalid/unknown tools, unsupported MCP servers, existing RBAC denial, MCP-defined mutation confirmation, repeated calls, timeouts, oversized results, max steps, and model failure.
- [ ] Tests prove raw protocol output never becomes the visible answer and billing/session cleanup happens exactly once on every exit.
- [x] Existing no-tools, explicit skill, Knowledge, image, model selection, and fallback scenarios remain green.

#### Manual Verification

- [x] Chat progress remains understandable while the `social.profile` works, and transient status messages are replaced by the final answer.
- [x] Audit metadata clearly distinguishes requester, `social.profile`, capabilities, MCP calls, and stop reason.

---

## Phase 6: End-To-End Verification And Operational Documentation

### Overview

Prove the complete `social.profile` execution flow against running `apps.api`, `apps.mcp`, and host chat, and document configuration and failure recovery.

### Changes Required

#### 1. Automated Verification Matrix

**Files**:

- `libs/shared/third-parties/src/lib/open-router/index.spec.ts`
- `apps/mcp/lib/oauth.spec.ts`
- `apps/mcp/content-management.spec.ts`
- RBAC `social.profile` service and `react-by-openrouter` specs/integration specs
- agent dispatch specs proving Knowledge chats use OpenRouter only
- profile admin form specs

**Changes**:

- Keep all tests in repository BDD format with suite/scenario JSDoc and Given/When/Then headers.
- Run focused tests:
  - `npx nx run @sps/shared-third-parties:jest:test`
  - `npx nx run mcp:jest:test`
  - `npx nx run @sps/rbac:jest:test`
  - `npx nx run @sps/rbac:jest:integration`
- Run affected type/lint targets for `@sps/shared-third-parties`, `mcp`, `@sps/rbac`, and `@sps/social`, then run `npm run parity` before handoff.
- Verify the generated profile migration is included and no repository data snapshots were edited.
- Verify repository-wide references contain no live `react-by/knowledge` route, handler, SDK symbol, agent method, frontend mock, permission, or README contract.

#### 2. Runtime And Operator Documentation

**Files**:

- `apps/mcp/README.md`
- `libs/modules/rbac/README.md`
- `libs/modules/knowledge/README.md`
- `libs/modules/social/models/profile/README.md`
- relevant API/environment documentation

**Changes**:

- Document the internal token-exchange secret, default limits, local MCP URL, SinglePageStartup-MCP-only scope, and required service startup order.
- Document how an operator links one subject, Knowledge documents, skills, and the allowed built-in MCP server to an AI profile.
- Document requester versus replying `rbac.subject` permissions, MCP/`apps.api` ownership of `rbac.permission` enforcement, existing mutation confirmation, audit location, and common stop reasons.
- Document `react-by/openrouter` as the only AI reaction endpoint, including `/learn`, explicit `@knowledge`, and the guarantee that ordinary messages receive no profile Knowledge context.

### Success Criteria

#### Automated Verification

- [x] Focused Jest and integration targets pass.
- [x] Affected TypeScript builds and ESLint targets pass.
- [ ] `npm run parity` passes. Blocked because the repository has no `parity` npm script; see the process incident log.
- [x] Drizzle migration generation is reproducible and limited to the profile MCP configuration change.
- [x] No live code or documentation references the removed `react-by/knowledge` contract, and the obsolete route permission has been removed through the RBAC data-management path without editing repository snapshots.
- [x] Thread-aware reactions use the concrete route/message relation, lifecycle fallback does not interpret `thread.variant` as a singleton, and an explicit web OpenRouter reaction suppresses duplicate generic agent dispatch.
- [x] OpenRouter model favorites resolve KV independently of the API process cwd, and AI-only capability queries remain disabled until the assistant profile identity is resolved.
- [x] Explicit web reaction orchestration does not introduce an unapproved CORS request header; first-message creation in a new thread reaches the canonical OpenRouter/MCP flow exactly once.
- [x] An explicit OpenRouter model selection is stored in typed thread metadata,
      restored after remount, and persisted through the startup-overridable main
      Subject Service.

#### Manual Verification

- [ ] With `apps.api`, `apps.mcp`, and host running, configure an AI profile with exactly one restricted replying profile's `rbac.subject`, one linked skill, linked Knowledge, and the allowed built-in SinglePageStartup MCP server.
- [ ] From a different requester account, send a plain task without `@knowledge` or `/skill`; verify autonomous skill activation, MCP work, no Knowledge retrieval/action/context, and a final profile-authored response. Then send an explicit `@knowledge` task and verify profile-scoped retrieval.
- [ ] Verify a tool discovered from the allowed SinglePageStartup MCP succeeds only when replying `rbac.subject` RBAC permits it and fails when only requester RBAC would permit it.
- [ ] Verify tools are discovered from the allowed server, a tool absent from its live catalog is rejected, and mutation follows the MCP tool's existing preview/confirmation contract.
- [ ] Verify metadata identifies requester, `social.profile`, profile, capabilities, tool trace, billing calls, and stop reason without exposing secrets.
- [ ] Verify a profile with MCP disabled continues to use the existing text-only reply behavior.
- [ ] Verify an existing external OAuth MCP client still authenticates and executes normally.

#### Code Review Browser Verification — 2026-07-14

- [x] Restarted current MCP HTTP, API, and host services; the canonical
      `/internal/rbac-subject-token-exchange` route responds with
      `invalid_client` without credentials instead of the stale `404`.
- [x] Created thread `MCP Knowledge Skills` and completed one
      SinglePageStartup MCP `ecommerce/attribute` count with one visible
      `Finished tool work · 1` action and the exact result `12`.
- [x] Sent an explicit `@knowledge` request and received a profile-grounded
      answer without a request error.
- [x] Selected `/youtube-description-1` from the live slash-command picker and
      received one skill-shaped answer.
- [x] Replayed `/youtube-description-1` with the original TXT transcript;
      automatic routing received extracted Russian text, classified the task
      as `summarize`, and the Browser displayed one transcript-grounded answer.
- [x] Uploaded the two supplied text files and JPEG to local message
      `a7ffe162-833c-4c71-9bfe-977d069851fe`; verified ordered relations
      `0,1,2`, exact SHA-256 equality for all three stored files, and
      Browser-visible two file links plus the image.
- [x] With explicit permission to transmit the supplied files externally,
      executed message `a7ffe162-833c-4c71-9bfe-977d069851fe` through
      OpenRouter. Reply `481eaee0-cca7-40cb-af42-05607325cd40` uses facts
      unique to both text files plus visual evidence from the JPEG.
- [x] Sequential picker operations append files instead of replacing the
      existing selection; two different files named `content.txt` remain two
      separate composer attachments and are submitted together.
- [x] Browser evidence for the earlier MCP, Knowledge, skill, and transcript
      scenarios contains one result per turn and no browser request errors; the
      exact multi-file OpenRouter response is also visible and complete.

#### Code Review Revision — Profile-scoped Knowledge RBAC — 2026-07-15

- [x] Inject the startup-exported Permission, roles-to-permissions, and
      subjects-to-roles services into `is-authorized`; remove loopback API
      requests and all-relations reads.
- [x] Resolve exact permissions with filtered service `find`, then scan only
      cached bracket templates for the same type/method, preserving method and
      root wildcard fallback.
- [x] Keep role-less permissions public, keep concrete UUID path segments
      literal, and treat only `[model.field]` segments as masks.
- [x] Add an idempotent profile Knowledge access service that creates one
      profile-specific owner role, five permissions, role-permission relations,
      and the owner subject-role relation using only existing RBAC models.
- [x] Run that provisioning from Telegram personal AI lifecycle and expose it
      through the startup-overridable main Subject Service.
- [x] Add BDD coverage for exact-vs-mask resolution, service-composed
      authorization, idempotent provisioning, and personal-agent lifecycle.
- [x] Apply the grant to the existing local Telegram owner/profile. Role
      `b8951484-3269-4b58-b793-2b11dd766594` is assigned to owner
      `e0f14695-ca3e-43ea-b738-25f0c6f079a1`, contains the five scoped
      permissions, and the tunneled Knowledge GET returns HTTP 200 with document
      `635ca852-8336-4cfb-8c56-31528412901c`.
- [x] Remove the redundant requester-profile-to-chat membership guard from the
      existing management middleware. The requesting profile must still belong
      to the authenticated subject; the target AI profile must still belong to
      an agent subject and be connected to the chat; exact RBAC permissions
      remain authoritative.
- [ ] Assign the same profile role and five subject-scoped permission paths to
      the actual Browser subject `303302a0-4eb7-4cef-af04-74d7e8e72442`, then
      verify the learned document in the sidebar. This is a separate persistent
      authorization grant from the already approved Telegram-owner assignment
      and requires explicit approval for this exact subject.

#### Code Review Revision — Telegram Command Publication — 2026-07-15

- [x] Keep the Agent startup service as the single source of command execution,
      menu descriptions, enabled state, and child-project overrides.
- [x] Expose only the effective serializable command catalog through the Agent
      API/server SDK; do not import the Agent backend service into
      `apps/telegram`.
- [x] Fetch the catalog from `apps/telegram` with the internal RBAC service key
      and publish it with `setMyCommands` before installing the webhook.
- [x] Merge startup overrides field by field so a child project can rename or
      disable a framework command without copying its handler.
- [x] Cover registry overrides, endpoint delegation, and Telegram publication
      with BDD tests; run Agent TypeScript and Telegram build checks.

## Testing Strategy

### Unit Tests

- OpenRouter serialization/parsing, tool-result replay, malformed arguments, and text-only compatibility.
- Social profile identity resolution and fail-closed profile/chat/message/subject guards.
- Knowledge parity in OpenRouter for `/learn`, explicit/automatic retrieval, linked skills, thread history, reply metadata, and agent dispatch.
- Allowed MCP server normalization, supported-server resolution, and live tool-catalog validation.
- Linked skill catalog/activation and profile-bound Knowledge query scoping.
- Loop limits, repeated calls, timeouts, result truncation/rejection, trace redaction, and billing summary.

### Integration Tests

- Internal `rbac.subject` authentication JWT-to-MCP-token exchange through the MCP process and token store.
- Streamable HTTP initialize/list/call/close using the `rbac.subject` authentication bearer token.
- MCP forwarding to `apps.api` with replying `rbac.subject` RBAC allow/deny behavior.
- Full requester/`rbac.subject`/`social.profile` identity separation through reply creation and billing settlement.
- Removal of the legacy route/SDK contract after OpenRouter parity, including a negative route check and zero live symbol references.

### Manual Testing Steps

1. Create or choose an AI profile linked to exactly one replying profile's `rbac.subject` and current chat.
2. Link skills and Knowledge documents; allow the built-in SinglePageStartup MCP server.
3. Send a normal task from a requester subject with different RBAC permissions.
4. Confirm the `social.profile` chooses only linked capabilities and calls a tool discovered from the allowed MCP server.
5. Repeat with `social.profile` permission denied, a tool absent from the MCP catalog, and a mutation requiring MCP-defined confirmation.
6. Inspect final message identity and metadata; confirm raw tool protocol and secrets are absent.
7. Disable MCP on the profile and confirm normal text-only chat still works.
8. Confirm Knowledge chats and `/learn` still work through `react-by/openrouter`, while the removed `react-by/knowledge` route is absent.

## Performance Considerations

- Cache each allowed server's live MCP catalog for a short bounded interval and invalidate/revalidate names at turn start; never cache authorization results across subjects or reproduce RBAC decisions in the orchestrator.
- Open one MCP session per turn rather than per tool call, and close it deterministically.
- Keep skill discovery compact and load full instructions only when activated.
- Bind Knowledge searches to profile document ids and preserve current top-K/rerank limits.
- Enforce 50 iterations, sequential tools, a five-minute total timeout, per-call timeouts, 32 KiB results, repeated-call protection, and the existing OpenRouter token controls to bound cost and latency.
- Include all OpenRouter iterations in the existing single settlement ledger so failure does not leak unbilled calls.

## Migration Notes

- Add only the typed JSONB allowed-MCP-server identifiers field with an empty default; no backfill is required and existing profiles retain text-only behavior.
- Add generic `social.thread.metadata` JSONB with an empty default. RBAC owns
  only the nested `rbacAiThreadPreferences` contract; existing threads default
  to `auto` and require no backfill.
- Migrate all reaction callers to OpenRouter before deleting `react-by/knowledge`; remove its obsolete permission through the existing RBAC data-management flow rather than editing repository data snapshots.
- Run `npx nx run @sps/social:models:profile:repository-generate` after the schema change and review generated SQL/meta artifacts; do not edit them manually.
- Run `npx nx run @sps/social:models:thread:repository-generate` for the thread
  metadata schema and review the generated SQL/meta artifacts; do not edit them
  manually.
- Deploy the new internal exchange secret to both API and MCP runtimes before allowing the SinglePageStartup MCP server on any profile.
- Rollback is configuration-first: remove the project server identifier from profiles to return to existing generation while leaving external OAuth intact.

## References

- GitHub issue: https://github.com/singlepagestartup/singlepagestartup/issues/199
- Original/revised ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-199.md`
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-199.md`
- Related skill/context research: `thoughts/shared/research/singlepagestartup/ISSUE-193.md`
- Related Knowledge plan: `thoughts/shared/plans/singlepagestartup/ISSUE-192.md`
- MCP foundation research/handoff: `thoughts/shared/research/singlepagestartup/ISSUE-187.md`, `thoughts/shared/handoffs/singlepagestartup/ISSUE-187-progress.md`

<!-- Last synced at: 2026-07-11T22:40:39Z -->
