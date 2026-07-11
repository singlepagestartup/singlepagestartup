---
date: 2026-07-12T00:42:59+0300
issue_number: 199
repository: singlepagestartup
topic: "MCP-powered AI employees for social profiles"
status: in_review
---

# MCP-Powered AI Employees for Social Profiles Implementation Plan

## Overview

Turn a replying AI `social.profile` into an employee that uses OpenRouter for reasoning, its linked Knowledge and skills for expertise, and tools discovered from MCP servers explicitly enabled for the profile to work with `apps.api` under the RBAC permissions of the profile's own linked subject.

## Current State Analysis

The social chat flow already separates the authenticated requester from the replying profile, builds thread/persona context, can apply explicitly selected skills, and can retrieve profile-linked Knowledge when explicitly requested. It does not yet provide a safe employee identity contract or a model/tool loop:

- `react-by/openrouter` receives the requester bearer token for route authorization and billing, then separately resolves the replying profile's linked `replyBySubject` and signs `replyByJwt` for profile-authored messages (`react-by-openrouter.ts:826-835`, `1156-1193`).
- The OpenRouter handler does not yet apply the complete profile/chat/message guards already used by `react-by/knowledge`, and it accepts the requested reply profile id before proving that the profile is an AI participant in the current chat (`react-by-knowledge.ts:81-111`, `206-217`, `258-351`).
- Profile persona is always added, but Knowledge search requires `@knowledge`/`useKnowledgeSearch`, skills require `/slug`/`skillIds`, and the persona prompt explicitly says unselected skills are not part of the profile (`react-by-openrouter.ts:934-947`, `1694-1707`, `1990-1997`, `2838-2869`). The separate skill-lifecycle cleanup removes draft semantics; issue #199 consumes linked skill existence rather than introducing another status policy.
- `social.profile` has no MCP configuration field, while its admin form already owns the profile details plus Knowledge and skills relations (`libs/modules/social/models/profile/backend/repository/database/src/lib/fields/singlepage.ts:4-31`; `.../admin-v2/form/ClientComponent.tsx:33-124`).
- The OpenRouter wrapper supports only system/user/assistant messages and text/image parsing; it neither sends tool definitions nor returns `tool_calls` (`libs/shared/third-parties/src/lib/open-router/index.ts:29-32`, `231-312`).
- The project MCP exposes one 19-tool content-management surface. HTTP sessions expose the same catalog to every authenticated client; a bearer MCP token is resolved to its stored SPS JWT and forwarded to `apps.api` (`apps/mcp/content-management.ts:96-469`; `apps/mcp/http.ts:151-174`, `199-214`).
- MCP OAuth issuing is coupled to browser authorization-code/refresh flows and always creates a refresh token. There is no internal exchange endpoint or in-repo Streamable HTTP MCP client for `apps/api` (`apps/mcp/lib/oauth.ts:511-640`).
- OpenRouter billing already records every model call in a typed ledger and settles it against the requester once (`open-router-billing.ts:7-43`; `react-by-openrouter.ts:446-533`).

## Desired End State

For every social-chat task, the system resolves three non-interchangeable identities:

1. **Requester** — owns the incoming profile/message/chat route and remains the OpenRouter billing principal.
2. **Employee subject** — the exactly one `rbac.subject` linked to the authorized replying AI profile; its short-lived SPS/MCP credentials authorize every MCP-to-API operation.
3. **Reply author** — the replying AI `social.profile` shown in the thread.

The backend derives the employee's capabilities from the replying profile, exposes compact profile-bound Knowledge/skill capabilities plus tools from the profile's allowed MCP servers to OpenRouter, executes calls sequentially, feeds results back to the model, and stores only the final profile-authored response as visible chat output. The requester never lends API permissions to the employee, model arguments cannot select an execution subject/profile/document outside the server-bound context, and `X-RBAC-SECRET-KEY` is never used by the tool loop.

Verification must prove that a requester with different permissions can assign a task without `@knowledge` or `/skill`, the employee can activate a linked skill, search only its linked Knowledge, discover and call a tool from the allowed project MCP, and receive either the RBAC-authorized result or an auditable denial from the existing MCP-to-API authorization path before returning a final answer.

### Key Discoveries

- The existing `replyBySubject`/`replyByJwt` path is the correct basis for employee identity, but the current many-to-many relation is read with `[0]`; employee resolution must require exactly one relation and fail closed (`react-by-openrouter.ts:1156-1193`).
- `react-by/knowledge` already contains the required profile/chat/message and AI-variant guard patterns (`react-by-knowledge.ts:81-111`, `206-217`, `258-351`).
- The employee subject placed inside the MCP access-token record automatically becomes the SPS bearer forwarded to `apps.api` (`apps/mcp/lib/oauth.ts:298-325`; `apps/mcp/http.ts:199-214`).
- The current MCP token store lives in the MCP process, so internal employee token issuance must happen through a protected MCP HTTP exchange endpoint rather than importing the issuer into `apps/api`.
- `profiles-to-skills` and `profiles-to-knowledge-module-documents` already provide profile scoping; no new relations are required for Knowledge or skills (`react-by-openrouter.ts:1912-1950`, `2030-2059`).
- Profile MCP policy needs persisted allowed-server configuration because the current schema has no MCP server field. The server's own `tools/list` remains the source of tool definitions, while its forwarded employee JWT lets existing `apps.api` middleware enforce `rbac.permission` (`profile/fields/singlepage.ts:4-31`; `apps/mcp/http.ts:105-126`, `151-174`, `199-214`).

## What We're NOT Doing

- Not connecting arbitrary external MCP URLs or building a multi-server registry, connector credential vault, third-party OAuth UI, or remote catalog synchronization.
- Not replacing the project `apps.mcp` with direct SDK/CRUD execution inside the OpenRouter controller.
- Not delegating requester permissions, using `X-RBAC-SECRET-KEY`, or allowing the model/caller to choose the employee subject.
- Not adding a second tool/data permission system in the OpenRouter orchestrator; MCP tool contracts and existing JWT-backed `rbac.permission` checks remain authoritative.
- Not changing mutation semantics already implemented by MCP tools, including dry-run and preview/apply confirmation.
- Not changing external MCP OAuth/PKCE semantics.
- Not adding autonomous background jobs, scheduled work, cross-turn durable plans, or execution after the bounded chat turn ends.
- Not replacing `/skill`, `skillIds`, `@knowledge`, or `/learn`; these remain deterministic compatibility controls.
- Not changing the requester-based OpenRouter billing principal in this issue.

## Implementation Approach

Build one bounded employee loop with two capability classes:

- **Profile-bound local capabilities**: a compact catalog of skills linked to the replying profile with a server-resolved activation operation, and Knowledge search permanently bound to the profile's linked document ids. Explicit skill/Knowledge controls preactivate or force these capabilities, but are no longer required.
- **Business/API capabilities**: tools discovered from each MCP server whose stable identifier is allowed by the profile. For this issue the only supported server is the built-in project MCP. Tool execution happens through an employee-authenticated Streamable HTTP session, and existing MCP-to-`apps.api` JWT/RBAC enforcement is the only business/data authorization layer.

Use a dedicated internal MCP token exchange protected by a new service-to-service secret. The exchange accepts the signed employee SPS JWT, derives its subject from the verified JWT, issues a five-minute MCP access token with no refresh token, and never accepts a separately supplied subject id. One MCP client/session is opened per employee turn, reused for catalog and tool calls, and closed at the end.

The initial loop is sequential (`parallel_tool_calls: false`) with defaults of six model/tool iterations, two minutes total runtime, 30 seconds per tool call, 32 KiB per tool result, and at most two identical consecutive call signatures. These defaults must be named/configurable and included in stop metadata.

## Phase 1: Establish the Employee Identity Boundary

### Overview

Make requester, employee subject, and reply author explicit before any tool catalog, token, or model-requested operation is created.

### Changes Required

#### 1. OpenRouter Request Guards And Employee Resolver

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts`

**Why**: The handler currently resolves a client-supplied reply profile and the first linked subject without proving AI variant, current-chat membership, or relation cardinality. Giving that identity MCP authority without new guards would create a confused-deputy escalation path.

**Changes**:

- Port the requester profile/chat/message, message/chat, reply-profile AI variant, and reply-profile/chat checks from `react-by/knowledge` into shared or equivalent OpenRouter guard helpers.
- Treat these as request/identity integrity checks that bind the correct employee subject, not as duplicate authorization of records returned by MCP tools.
- Resolve the employee subject only after the reply profile passes those checks.
- Require exactly one `subjects-to-social-module-profiles` relation; reject zero or multiple relations without issuing credentials.
- Keep the incoming requester authorization only for route ownership and billing settlement.
- Create an immutable employee identity context containing requester subject id, employee subject id, reply profile id, chat/thread/message ids, and the server-signed employee JWT.
- Never read employee identity from OpenRouter tool arguments or reuse requester JWT as the employee credential.

### Success Criteria

#### Automated Verification

- [ ] BDD tests reject non-AI, foreign-chat, foreign-message, missing-subject, and multiple-subject reply profiles.
- [ ] BDD tests prove the requester token continues to settle billing while profile-authored writes use the employee/profile identity.
- [ ] BDD tests prove model/caller data cannot override `employeeSubjectId`.

#### Manual Verification

- [ ] Existing authorized AI replies still appear from the same replying profile before tools are enabled.
- [ ] Invalid profile/chat combinations fail before an OpenRouter or MCP call is attempted.

---

## Phase 2: Add Allowed MCP Servers And Autonomous Profile Capabilities

### Overview

Persist which MCP servers an employee profile may use, expose that configuration in the existing profile admin flow, and make linked Knowledge/skills available to the backend-derived employee context without control mentions. The first implementation supports only the built-in project MCP server.

### Changes Required

#### 1. Profile Allowed-MCP-Servers Schema

**Files**:

- `libs/modules/social/models/profile/backend/repository/database/src/lib/fields/singlepage.ts`
- generated files under `libs/modules/social/models/profile/backend/repository/database/src/lib/migrations/`
- `libs/modules/social/models/profile/README.md`

**Why**: A profile currently has no persisted list of MCP servers it may use. Connection parameters will eventually belong to a separate MCP-server model, but the first built-in server needs a stable profile-level opt-in now.

**Changes**:

- Add a typed JSONB profile field containing stable allowed-server identifiers, with `project` as the only supported identifier in this issue.
- Default existing and new profiles to an empty server list so no MCP server is available until explicitly enabled.
- Generate the Drizzle migration with `npx nx run @sps/social:models:profile:repository-generate`; do not hand-write migration SQL, snapshots, or journal entries.
- Document that the `project` identifier resolves through deployment environment configuration and that a future issue will replace the temporary JSONB identifiers with a dedicated MCP-server model and profile relation containing connection parameters.

#### 2. Profile Admin Controls

**Files**:

- `libs/modules/social/models/profile/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx`
- `libs/modules/social/models/profile/frontend/component/src/lib/singlepage/admin-v2/form/interface.ts`
- `libs/modules/social/frontend/component/src/lib/admin-v2/overview/profile/admin-v2-form/ClientComponent.tsx`
- corresponding frontend specs

**Why**: Operators already manage profile details, Knowledge, and skills in this form; MCP policy belongs with the same employee definition.

**Changes**:

- Add Tailwind/shadcn controls for allowed MCP servers. Initially this is a single built-in project-MCP option.
- Load supported server descriptors through the profile-scoped SDK added in Phase 4 and show unavailable stored identifiers as stale instead of silently accepting them.
- Preserve existing form validation, localized fields, and Knowledge/skills relation tabs.

#### 3. Profile-Bound Skill And Knowledge Capabilities

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts`

**Why**: Today Knowledge and skills are explicit-message features, so the automatic agent path cannot behave like an employee unless the browser supplies controls.

**Changes**:

- Load all existing skills linked to the profile in relation order; deleted or unlinked skills are unavailable, with no draft lifecycle introduced by this issue.
- Expose a compact skill catalog and a server-bound skill activation capability whose only selector is a linked slug; return the full instructions to the next model iteration without accepting profile ids.
- Bind Knowledge retrieval to the already resolved reply profile's linked document ids and expose a search capability that accepts only a query, never profile/document ids.
- Let the model invoke Knowledge/skill capabilities automatically. Treat explicit `/skill`/`skillIds` as deterministic preactivation and `@knowledge` as forced pre-retrieval.
- Remove the persona instruction that excludes unselected linked skills, while preserving profile description/persona and thread history.
- Ensure browser-triggered and automatic agent-triggered replies derive the same capabilities backend-side.

### Success Criteria

#### Automated Verification

- [ ] Profile model/schema tests cover the empty default, the supported `project` server identifier, and rejection/display of stale identifiers.
- [ ] Repository generation produces only the expected profile migration artifacts.
- [ ] Frontend tests prove allowed MCP server identifiers round-trip through the admin form and stale servers remain visible but unavailable.
- [ ] BDD tests prove linked skills can be activated without `/skill`, while deleted or unlinked skills cannot.
- [ ] BDD tests prove Knowledge search works without `@knowledge` and cannot escape the profile-linked document set.
- [ ] Existing explicit skill, `@knowledge`, and `/learn` tests remain green.

#### Manual Verification

- [ ] An operator can enable the built-in project MCP server alongside the employee profile's Knowledge and skills.
- [ ] A plain task message, with no control mentions, makes the profile's skills and Knowledge available to the employee.

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

- [ ] Wrapper tests assert exact serialization of `tools`, `tool_choice`, and `parallel_tool_calls: false`.
- [ ] Wrapper tests parse single and multiple tool calls, malformed argument JSON, tool-result replay, and final text after a tool result.
- [ ] Wrapper tests prove text-only and image behavior is unchanged when no tools are passed.
- [ ] Wrapper tests prove retries cannot execute or replay a tool call twice.

#### Manual Verification

- [ ] A recorded OpenRouter-compatible response can move from assistant tool call to tool result to final assistant text without protocol loss.

---

## Phase 4: Implement Employee-Authenticated MCP Exchange, Client, And Catalog

### Overview

Issue MCP credentials inside the MCP process, connect `apps.api` to the project MCP over Streamable HTTP, and expose a safe live catalog for profile configuration and runtime enforcement.

### Changes Required

#### 1. Internal Employee Token Exchange

**Files**:

- `apps/mcp/lib/oauth.ts`
- `apps/mcp/http.ts`
- `apps/mcp/lib/oauth.spec.ts`
- `apps/mcp/README.md`
- relevant environment templates/documentation for `MCP_INTERNAL_TOKEN_EXCHANGE_SECRET`

**Why**: Importing the issuer into `apps.api` would write to the wrong in-memory token store; issuance must run in the MCP process while remaining distinct from browser OAuth.

**Changes**:

- Extract access-token creation from the current response helper so browser grants can still receive refresh tokens while internal exchange can issue access-only tokens.
- Add a protected internal HTTP exchange endpoint authenticated by a dedicated service secret, not `X-RBAC-SECRET-KEY`.
- Accept an employee SPS JWT as the subject token, verify it with `RBAC_JWT_SECRET`, derive the subject id from the verified payload, and reject any separately supplied subject id.
- Issue `clientId = "internal-rbac-openrouter"`, `scope = "mcp:content"`, a five-minute access token, and no refresh token through the existing access-token store.
- Keep external authorization-code, refresh-token, metadata, PKCE, revoke, and verification behavior unchanged.

#### 2. Streamable HTTP MCP Client Service

**Files**:

- new MCP client/exchange helpers under `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts`
- corresponding unit/integration specs

**Why**: No in-repo MCP client exists, and the employee loop needs one authenticated session for `tools/list` and `tools/call`.

**Changes**:

- Use the installed Model Context Protocol SDK client and Streamable HTTP transport.
- Exchange the server-signed employee JWT for an MCP bearer token through the internal endpoint.
- Open one session per employee turn, reuse it for catalog and tool calls, and always close it in success/error/timeout paths.
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

- Add an owner-protected profile endpoint that returns supported MCP server descriptors, initially only the built-in `project` server.
- Resolve the profile's allowed server identifiers at runtime, open an employee-authenticated session for each supported server, and use its live `tools/list` definitions as the OpenRouter business-tool catalog.
- If the allowed-server list is empty, expose no MCP business tools. If a stored server identifier is unsupported, report it as stale and do not connect.
- Reject tool names absent from the connected server's live catalog and validate arguments against the MCP-provided schema before dispatch. These are protocol/catalog integrity checks, not business/data authorization.
- Forward the employee SPS JWT through MCP and rely exclusively on the existing `apps.api` middleware and `rbac.permission` path for record/action authorization.
- Preserve mutation behavior defined by the MCP tools themselves, including current dry-run and preview/apply contracts, without adding a second profile mutation policy.

### Success Criteria

#### Automated Verification

- [ ] Internal exchange tests prove employee JWT subject derivation, five-minute TTL, access-store verification, and absence of refresh tokens.
- [ ] Tests reject invalid/expired SPS JWTs, wrong exchange secret, supplied subject overrides, and external-grant regressions.
- [ ] MCP client tests cover initialize/list/call/close, timeout, oversized result, protocol error, and session cleanup.
- [ ] Server-discovery tests prove empty, supported `project`, and stale server configurations plus live catalog refresh.
- [ ] Tool dispatch tests reject names/schema shapes absent from the connected MCP catalog without adding duplicate record-level permission checks.
- [ ] Integration tests prove the SPS bearer forwarded by MCP belongs to the employee subject, `apps.api` applies `rbac.permission`, and the loop never uses `X-RBAC-SECRET-KEY`.

#### Manual Verification

- [ ] The profile admin form can enable the built-in project MCP server and shows unsupported stored server identifiers clearly.
- [ ] OpenRouter receives the connected project MCP's live tool catalog, and an employee with insufficient RBAC permission receives the existing API denial from the MCP-to-API path.

---

## Phase 5: Orchestrate The Bounded Employee Tool Loop

### Overview

Combine profile-bound capabilities and tools discovered from allowed MCP servers in one sequential OpenRouter loop, settle requester billing, audit every step, and persist only the final profile-authored answer.

### Changes Required

#### 1. Employee Tool-Loop Service

**Files**:

- new `ai-employee-tool-loop` and capability policy files under `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`
- corresponding service/controller specs

**Why**: The 3,800-line controller should not absorb protocol execution, session ownership, catalog routing, and loop limits.

**Changes**:

- Move the model/tool iteration into a service that receives the immutable employee identity/context and returns final text plus a structured trace.
- Combine profile-bound skill/Knowledge definitions with live tool definitions from allowed MCP servers using collision-safe stable names.
- Validate tool name and JSON arguments against the source catalog before dispatch. Route only the profile skill/Knowledge names locally; route business/API tools only through the authenticated MCP client.
- Do not reproduce `rbac.permission` logic or pre-authorize requested records in the loop; surface the existing MCP/`apps.api` allow or denial result to the model.
- Replay assistant tool calls and matching tool results in order using the original `tool_call_id`.
- Enforce six iterations, two-minute total timeout, 30-second tool timeout, 32 KiB result limit, token budget, and repeated-call protection; use `parallel_tool_calls: false`.
- Produce a clear assistant-visible stop message for bounded failures while retaining internal error detail in trace metadata.
- Preserve the existing primary/fallback model selection policy without retrying a completed side effect.

#### 2. Billing, Message Metadata, And Final Reply

**Files**:

- `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/open-router-billing.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts`

**Why**: Every loop completion must settle all OpenRouter calls exactly once against the requester while retaining enough trace to audit employee actions.

**Changes**:

- Add a typed `tool_iteration` billing purpose for continuation calls; retain `generation` for the initial/final generation semantics and settle the combined ledger once.
- Persist requester subject id, employee subject id, reply profile id, model/reasoning, available/activated skills, Knowledge searches/document ids, exposed tools, call ids/names/result sizes, MCP client id, step count, timing, and stop reason under assistant metadata.
- Keep raw tool arguments/results and protocol messages out of visible `social.message.description`; redact sensitive values from logs/metadata.
- Continue authoring status and final messages with the replying profile/employee identity.
- Ensure every catch/stop path closes MCP, settles billing once, removes transient status, and returns either final text or the bounded user-visible failure message.

### Success Criteria

#### Automated Verification

- [ ] BDD scenario: requester B assigns work to profile A; MCP/API authorization is employee subject A, billing is requester B, and final author is profile A.
- [ ] BDD scenarios cover skill activation, automatic Knowledge retrieval, read-only MCP call, multi-step result replay, final answer, and auditable metadata.
- [ ] BDD scenarios cover invalid/unknown tools, unsupported MCP servers, existing RBAC denial, MCP-defined mutation confirmation, repeated calls, timeouts, oversized results, max steps, and model failure.
- [ ] Tests prove raw protocol output never becomes the visible answer and billing/session cleanup happens exactly once on every exit.
- [ ] Existing no-tools, explicit skill, Knowledge, image, model selection, and fallback scenarios remain green.

#### Manual Verification

- [ ] Chat progress remains understandable while the employee works, and only the final answer remains in the thread.
- [ ] Audit metadata clearly distinguishes requester, employee, capabilities, MCP calls, and stop reason.

---

## Phase 6: End-To-End Verification And Operational Documentation

### Overview

Prove the complete employee flow against running `apps.api`, `apps.mcp`, and host chat, and document configuration and failure recovery.

### Changes Required

#### 1. Automated Verification Matrix

**Files**:

- `libs/shared/third-parties/src/lib/open-router/index.spec.ts`
- `apps/mcp/lib/oauth.spec.ts`
- `apps/mcp/content-management.spec.ts`
- RBAC employee service and `react-by-openrouter` specs/integration specs
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

#### 2. Runtime And Operator Documentation

**Files**:

- `apps/mcp/README.md`
- `libs/modules/social/models/profile/README.md`
- relevant API/environment documentation

**Changes**:

- Document the internal token-exchange secret, default limits, local MCP URL, project-MCP-only scope, and required service startup order.
- Document how an operator links one subject, Knowledge documents, skills, and the allowed built-in MCP server to an AI profile.
- Document requester versus employee permissions, MCP/`apps.api` ownership of `rbac.permission` enforcement, existing mutation confirmation, audit location, and common stop reasons.

### Success Criteria

#### Automated Verification

- [ ] Focused Jest and integration targets pass.
- [ ] Affected TypeScript builds and ESLint targets pass.
- [ ] `npm run parity` passes.
- [ ] Drizzle migration generation is reproducible and limited to the profile MCP configuration change.

#### Manual Verification

- [ ] With `apps.api`, `apps.mcp`, and host running, configure an AI profile with exactly one restricted employee subject, one linked skill, linked Knowledge, and the allowed built-in project MCP server.
- [ ] From a different requester account, send a plain task without `@knowledge` or `/skill`; verify autonomous skill activation, Knowledge retrieval, MCP call, and final profile-authored response.
- [ ] Verify a tool discovered from the allowed project MCP succeeds only when employee RBAC permits it and fails when only requester RBAC would permit it.
- [ ] Verify tools are discovered from the allowed server, a tool absent from its live catalog is rejected, and mutation follows the MCP tool's existing preview/confirmation contract.
- [ ] Verify metadata identifies requester, employee, profile, capabilities, tool trace, billing calls, and stop reason without exposing secrets.
- [ ] Verify a profile with MCP disabled continues to use the existing text-only reply behavior.
- [ ] Verify an existing external OAuth MCP client still authenticates and executes normally.

## Testing Strategy

### Unit Tests

- OpenRouter serialization/parsing, tool-result replay, malformed arguments, and text-only compatibility.
- Employee identity resolution and fail-closed profile/chat/message/subject guards.
- Allowed MCP server normalization, supported-server resolution, and live tool-catalog validation.
- Linked skill catalog/activation and profile-bound Knowledge query scoping.
- Loop limits, repeated calls, timeouts, result truncation/rejection, trace redaction, and billing summary.

### Integration Tests

- Internal SPS-JWT-to-MCP-token exchange through the MCP process and token store.
- Streamable HTTP initialize/list/call/close using the employee bearer token.
- MCP forwarding to `apps.api` with employee RBAC allow/deny behavior.
- Full requester/employee/profile identity separation through reply creation and billing settlement.

### Manual Testing Steps

1. Create or choose an AI profile linked to exactly one employee subject and current chat.
2. Link skills and Knowledge documents; allow the built-in project MCP server.
3. Send a normal task from a requester subject with different RBAC permissions.
4. Confirm the employee chooses only linked capabilities and calls a tool discovered from the allowed MCP server.
5. Repeat with employee permission denied, a tool absent from the MCP catalog, and a mutation requiring MCP-defined confirmation.
6. Inspect final message identity and metadata; confirm raw tool protocol and secrets are absent.
7. Disable MCP on the profile and confirm normal text-only chat still works.

## Performance Considerations

- Cache each allowed server's live MCP catalog for a short bounded interval and invalidate/revalidate names at turn start; never cache authorization results across subjects or reproduce RBAC decisions in the orchestrator.
- Open one MCP session per turn rather than per tool call, and close it deterministically.
- Keep skill discovery compact and load full instructions only when activated.
- Bind Knowledge searches to profile document ids and preserve current top-K/rerank limits.
- Enforce six iterations, sequential tools, total/per-call timeouts, 32 KiB results, repeated-call protection, and the existing OpenRouter token controls to bound cost and latency.
- Include all OpenRouter iterations in the existing single settlement ledger so failure does not leak unbilled calls.

## Migration Notes

- Add only the typed JSONB allowed-MCP-server identifiers field with an empty default; no backfill is required and existing profiles retain text-only behavior.
- Run `npx nx run @sps/social:models:profile:repository-generate` after the schema change and review generated SQL/meta artifacts; do not edit them manually.
- Deploy the new internal exchange secret to both API and MCP runtimes before allowing the project MCP server on any profile.
- Rollback is configuration-first: remove the project server identifier from profiles to return to existing generation while leaving external OAuth intact.

## References

- GitHub issue: https://github.com/singlepagestartup/singlepagestartup/issues/199
- Original/revised ticket: `thoughts/shared/tickets/singlepagestartup/ISSUE-199.md`
- Research: `thoughts/shared/research/singlepagestartup/ISSUE-199.md`
- Related skill/context research: `thoughts/shared/research/singlepagestartup/ISSUE-193.md`
- Related Knowledge plan: `thoughts/shared/plans/singlepagestartup/ISSUE-192.md`
- MCP foundation research/handoff: `thoughts/shared/research/singlepagestartup/ISSUE-187.md`, `thoughts/shared/handoffs/singlepagestartup/ISSUE-187-progress.md`

<!-- Last synced at: 2026-07-11T22:10:54Z -->
