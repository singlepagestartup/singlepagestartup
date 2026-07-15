---
issue_number: 199
issue_title: "Enable MCP-powered AI execution for social profiles"
repository: singlepagestartup
created_at: 2026-06-17T18:33:37Z
last_updated: 2026-07-16T01:01:35+03:00
status: active
current_phase: complete
---

# Process Log: ISSUE-199 - Enable MCP-powered AI execution for social profiles

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
  - Scope preserves the user's requirement that backend call the SinglePageStartup MCP and that MCP calls are authenticated as the `rbac.subject` linked to the replying profile.
  - Initial `load_config` call resolved repository context but reported GitHub API connectivity errors inside the sandbox; GitHub helper creation succeeded with network escalation.
  - Issue was added to GitHub Project and moved through `Triage` to `Research Needed` by `.claude/helpers/create_issue_with_project.sh`.

### Research

- Summary: Documented all surfaces issue 199 touches: OpenRouter wrapper (no tool-calling surface today), the full `react-by/openrouter` pipeline (context assembly, model routing, billing ledger, dual identities incl. the server-minted `replyByRbacSubjectAuthenticationJwt` precedent), MCP 19-tool content-management surface + OAuth token store + auth forwarding (no internal issuer yet), RBAC JWT sign/verify + `X-RBAC-SECRET-KEY` bypass, `@knowledge` pipeline, and message/action JSONB metadata storage.
- Outputs:
  - Research: `thoughts/shared/research/singlepagestartup/ISSUE-199.md`
  - Issue comment: https://github.com/singlepagestartup/singlepagestartup/issues/199#issuecomment-4890624553
  - Status: Research in Review
- Notes:
  - Reused prior knowledge per knowledge-first contract: ISSUE-193 research (openrouter flow + tool-calling options; its plan explicitly deferred the tool loop to this issue) and ISSUE-187 research/handoff (MCP content surface, forwarded auth, Streamable HTTP).
  - Verified live-code claims directly for the four load-bearing files (open-router wrapper, mcp oauth.ts, mcp http.ts, auth-context.ts); five parallel sub-agents documented the reply flow, MCP tool surface, RBAC JWT, @knowledge/metadata, and thoughts inventory.
  - Notable for planning: legacy per-module MCP registrars are orphaned after the "compact content surface" change; no per-session MCP tool subsetting exists; no in-repo MCP client exists.

### Plan

- Summary: Created the approved six-phase implementation plan for an AI-enabled `social.profile`: the replying profile supplies persona/capabilities, its linked subject authorizes MCP-to-API work, and the requester remains the task initiator and billing principal.
- Outputs:
  - Revised GitHub issue and local ticket with `rbac.subject` execution identity, autonomous capability, MCP configuration, and acceptance-test contracts.
  - Plan: `thoughts/shared/plans/singlepagestartup/ISSUE-199.md`
- Notes:
  - No plan file existed despite Project status `Plan in Progress`; the operator approved the proposed six-phase outline before the plan was created.
  - The revised scope requires profile-level built-in MCP configuration but keeps arbitrary external MCP servers out of scope.
  - The plan fixes `social.profile` token issuance in the MCP process through a protected internal exchange endpoint, avoiding a separate in-memory token store inside `apps.api`.
  - Review feedback supersedes per-tool profile allowlists and duplicate orchestrator data checks: profiles allow MCP server identifiers, the server supplies `tools/list`, and existing `rbac.subject` authentication JWT-backed `rbac.permission` remains authoritative.
  - The first allowed server is the built-in SinglePageStartup MCP. Connection parameters and additional servers belong to a future dedicated MCP-server model and relation.
  - Latest review feedback makes `react-by/openrouter` the only reaction flow: required guards and Knowledge behavior migrate from `react-by/knowledge`, all callers switch, parity is verified, and then the legacy handler/route/SDK surface is removed.
  - Plan revision completed and synchronized at `2026-07-11T22:40:39Z`; issue should return to `Plan in Review` after the scoped artifact commit and GitHub comment.

### Implement

- Summary: Completed the six-phase implementation and applicable verification; ready for PR submission and human code review.
- Outputs:
  - Branch: current PR branch; its legacy branch name is retained to preserve PR continuity.
  - Progress: `thoughts/shared/handoffs/singlepagestartup/ISSUE-199-progress.md`
  - Pull request: https://github.com/singlepagestartup/singlepagestartup/pull/206
  - GitHub Project status: `Code Review`
- Notes:
  - Status gate passed at `Ready for Dev`; issue moved to `In Dev`.
  - No new scope-changing GitHub comments appeared after the plan sync marker.
  - `react-by/openrouter` is now the sole AI reaction pipeline and owns identity guards, Knowledge/skills, tool orchestration, billing, final reply creation, and audit metadata.
  - Profiles store allowed MCP server ids; both profile admin form variants and the chat profile sidebar expose the built-in SinglePageStartup server.
  - The internal exchange issues a five-minute MCP access token backed by the `rbac.subject` authentication JWT. Live verification opened the SinglePageStartup MCP catalog (19 tools) and executed `model-record-count` against `apps.api` as the linked replying profile's `rbac.subject`.
  - Applicable Jest, integration, TypeScript, ESLint, Prettier, shell, migration, and reference checks passed. The plan's `npm run parity` command does not exist and is documented below.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 22 -->

### Incident 1 — GitHub CLI connectivity from sandbox

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: `load_config.sh` printed `error connecting to api.github.com` while resolving GitHub context.
- **Root Cause**: Network access from the sandboxed command path was unavailable for GitHub CLI calls.
- **Fix**: Run the GitHub helper sequence with escalated network access as required by `core-00-create`.
- **Preventive Action**: If `gh` reports `error connecting to api.github.com`, rerun the same fail-fast `bash -lc` helper block with network escalation instead of rewriting the helper sequence.
- **References**: `.codex/skills/core-00-create/SKILL.md`, `.claude/commands/core/00-create.md`

### Incident 2 — Requester and `social.profile` execution identities were conflated

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: The original issue required model-requested MCP tools to execute as the message sender, while the operator intended the linked subject of the replying AI profile to act as the `social.profile`.
- **Root Cause**: The original wording treated the authenticated route caller as both task initiator and tool execution principal, even though the reply flow already resolves a distinct `replyByRbacSubject` for the AI profile.
- **Fix**: Rewrite the issue around three identities: requester/initiator, replying profile's `rbac.subject`, and reply profile. Require server-side profile/chat validation, exactly one backing subject, `social.profile`-scoped MCP credentials, and audit of both subject ids.
- **Preventive Action**: Every agent/tool issue must explicitly identify the billing principal, execution principal, and reply author before planning authorization or token flows.
- **References**: `thoughts/shared/tickets/singlepagestartup/ISSUE-199.md`, `thoughts/shared/research/singlepagestartup/ISSUE-199.md`, `react-by-openrouter.ts:1156-1193`

### Incident 3 — Plan duplicated MCP authorization and configured tools at the wrong level

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: The first plan revision introduced profile-level tool allowlists, mutation policy, safety classification, and an orchestrator intersection with RBAC permissions.
- **Root Cause**: Tool discovery/configuration was conflated with data authorization even though `apps.mcp` already forwards the `rbac.subject` authentication JWT and `apps.api` already enforces `rbac.permission`.
- **Fix**: Store allowed MCP server identifiers on the profile, discover tools through each server's `tools/list`, validate only MCP protocol/catalog integrity in the loop, and leave business/data authorization plus mutation contracts to the existing MCP/API path.
- **Preventive Action**: Separate MCP server connection policy, MCP protocol validation, and RBAC data authorization in future agent plans; never reproduce `rbac.permission` decisions in an LLM orchestrator.
- **References**: `apps/mcp/http.ts:199-214`, `apps/mcp/lib/auth.ts:84-136`, `thoughts/shared/plans/singlepagestartup/ISSUE-199.md`

### Incident 4 — Legacy Knowledge reaction remained as a parallel flow

- **Phase**: Plan
- **Occurrences**: 1
- **Symptom**: The plan proposed copying selected checks from `react-by/knowledge` while continuing to preserve the legacy endpoint and its SDK/agent surfaces.
- **Root Cause**: The existing Knowledge handler was treated as a compatibility boundary instead of a duplicated reaction implementation whose required behavior should belong to the canonical OpenRouter `social.profile` execution flow.
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

### Incident 8 — Social sidebar test crossed the server-only avatar boundary

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `chat-profile-sidebar/Component.spec.tsx` failed before test execution because the rendered Client Component imported the server-backed profile avatar boundary.
- **Root Cause**: The unit test did not isolate the avatar dependency even though the sidebar behavior under test does not depend on avatar data loading.
- **Fix**: Mock the profile avatar boundary in the sidebar unit test and rerun the entire Social Jest config.
- **Preventive Action**: Isolate server-backed leaf components in Client Component unit tests and confirm the full owning-module suite after adding the mock.
- **Result**: Full Social Jest passes: 11 suites, 26 tests.
- **References**: `libs/modules/social/models/profile/frontend/component/src/lib/singlepage/chat-profile-sidebar/Component.spec.tsx`

### Incident 9 — Chat-local profile update discarded MCP server ids

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: The chat profile sidebar could display `social.profile` capabilities but
  could not configure MCP; its existing profile update route silently omitted
  `allowedMcpServerIds` from the forwarded update payload.
- **Root Cause**: The route maintained a narrow manual field whitelist that was
  not extended when profile MCP configuration was introduced in Admin.
- **Fix**: Add an MCP sidebar section and editor, validate supported identifiers
  in the chat-local update handler, persist the field, and rename the local
  server identifier and tool namespace to `singlepagestartup`.
- **Preventive Action**: Whenever a model field becomes editable from a second
  surface, verify every surface-specific update whitelist and include one
  route-level persistence test, not only a form-state test.
- **References**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/update.ts`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/components/McpServersDialog.tsx`

### Incident 10 — Agent fallback interpreted every UI thread as the unique default thread

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: A successful MCP-backed chat request also logged `Validation error. Requested social-module chat has multiple default threads` from the generic `telegram-bot` agent endpoint.
- **Root Cause**: `resolveThreadIdForMessageInChat` ran legacy chat normalization before reading the concrete message-to-thread relation. Normalization called `ensureDefaultThreadForChat`, which treated `thread.variant = "default"` as a unique semantic default even though that display variant is the schema default for every ordinary UI-created thread. The inspected chat has six. The web composer also called OpenRouter explicitly while the action logger independently dispatched the generic agent route, so the redundant automatic run exposed this failure after the intended reply had already succeeded.
- **Fix**: Propagate the thread id captured by the successful route into agent dispatch, resolve and validate the concrete relation before any legacy normalization, and restore a missing relation from that authoritative route instead of guessing. Both lifecycle fallbacks now select a deterministic primary linked thread by relation order/chronology without inspecting `variant`; the web UI no longer selects or labels a primary thread from that field. The initial request-marker workaround was subsequently removed by Incident 13: message creation is now the single frontend mutation and action logger is the single backend launch path.
- **Preventive Action**: Treat route ownership and message-to-thread relations as semantic identity; treat component variants as presentation only. When a caller performs an AI reaction explicitly, it must suppress the generic action dispatcher rather than executing both paths.
- **References**: `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts`, `libs/modules/social/models/thread/sdk/model/src/lib/primary-thread.ts`

### Incident 11 — New thread initialization emitted model-favorites 500 and profile-skills 401

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: Opening a newly created thread repeatedly logged `Cannot find module .../apps/api/libs/providers/kv/src/index.ts` for OpenRouter model favorites and one `Target social-module profile must have variant="artificial-intelligence"` response for skills.
- **Root Cause**: The favorites controller constructed a dynamic source URL from `process.cwd()`, but `api:dev` runs with `apps/api` as cwd, so the monorepo-relative path was resolved under the application directory. During the same initial render, the composer temporarily fell back to the requester's ordinary profile as its skills target before an AI opponent was resolved, enabling an AI-only endpoint with the wrong target identity.
- **Fix**: Import the KV provider through the canonical `@sps/providers-kv` workspace alias, and keep the skills query disabled with a non-resource placeholder until the AI assistant profile id is available. Added BDD coverage for `apps/api` cwd and unresolved-assistant initialization.
- **Preventive Action**: Backend runtime dependencies must use workspace package aliases instead of cwd-relative source imports. Capability queries must fail closed while their owning profile identity is unresolved and must never substitute the requester as the capability owner.
- **Result**: The new Ecommerce thread reloads without browser errors for `model-favorites`, `/skills`, or HTTP 500; RBAC passes 47 suites and 190 tests.
- **References**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/openrouter/model-favorites.ts`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/hooks/use-profile-skills.ts`

### Incident 12 — Explicit-reaction request header blocked message creation at CORS preflight

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: Sending the first message in the repaired Ecommerce thread left the composer unchanged and showed two `Failed to fetch` toasts; no HTTP application response reached the client.
- **Root Cause**: The duplicate-dispatch fix marked explicit web reactions with the custom request header `X-SPS-AI-REACTION-MODE`. Browser multipart POSTs with that non-simple header require a CORS preflight, but the API does not allow that header, so the message-create request was rejected before the handler executed.
- **Fix**: Move the non-persistent reaction mode marker to the existing message-create query string as `aiReactionMode=explicit`; the backend reads it with `c.req.query` and still returns `X-SPS-SKIP-ACTION-LOGGER` after successful creation. Updated the BDD payload and handler expectations and removed all live references to the custom request header.
- **Preventive Action**: Do not introduce browser request headers without updating and testing the API CORS contract. Prefer an existing typed query/body channel for non-sensitive request orchestration metadata when it avoids preflight and does not persist data.
- **Result**: Browser verification created the message in thread `c04c2eb6`, the `social.profile` executed the SinglePageStartup MCP request, and the final reply reported 12 `ecommerce/attribute` records with no browser errors. Full RBAC remains 47 suites and 190 tests.
- **Superseded By**: Incident 13 removes both the query marker and the explicit-reaction skip response; this incident remains the historical explanation for the failed intermediate header design.
- **References**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/hooks/use-chat-composer.ts`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts`

### Incident 13 — Frontend reaction orchestration required transport markers and two launch paths

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: One composer submission created a message and then issued a second `react-by/openrouter` mutation carrying model, reasoning, skills, and Knowledge parameters. Preventing the action logger from launching the same turn required the temporary `aiReactionMode` query and `X-SPS-SKIP-ACTION-LOGGER` response marker.
- **Root Cause**: Durable user intent and backend orchestration were conflated. The frontend owned execution sequencing, while the backend's existing action log already represented the authoritative message-created event. The model parameters existed only in the second request, so a failed request could leave a message with no reproducible answer intent.
- **Fix**: Store a versioned `rbacAiReactionRequest` execution-settings envelope in generic `social.message.metadata` during the one create-message mutation. Keep the typed parser/normalizer in the RBAC Subject SDK boundary. Action logger launches Agent once; Agent dispatches the automatic profiles connected to the chat; `react-by/openrouter` reloads model, reasoning, skill ids, and Knowledge intent from the message and validates the Agent-selected profile independently. Remove the frontend reaction SDK surface, manual reaction/action refetch wiring, query marker, and explicit skip-header response.
- **Preventive Action**: Persist all user-selectable turn intent with the domain event that starts the turn. Frontends may capture choices, but must not sequence agents, choose execution principals, or carry backend-only launch markers. Server-created progress and replies must use WebSocket/query invalidation at isolated boundaries.
- **Result**: RBAC passes 48 suites/196 tests, Agent 8/33, Social 12/27, RBAC and Agent TypeScript builds pass, and Browser shows one created request, backend action/status progress through reactivity, one MCP-backed count of 12, and no duplicate after waiting.
- **References**: `libs/modules/rbac/models/subject/sdk/model/src/lib/ai-reaction-request.ts`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/hooks/use-chat-composer.ts`, `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`

### Incident 14 — Generic action rows could not safely represent live tool execution

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: The conversation recorded generic `social.action` rows, but they only said `recorded an action` and their expansion dumped the entire untyped payload. They could neither show requested/running/succeeded MCP states nor guarantee that arguments, results, or credentials stayed out of the UI.
- **Root Cause**: Tool-loop audit metadata and generic Social action presentation were being asked to serve the same purpose. The loop emitted no presentation lifecycle, actions had no typed execution variant, and the generic row treated arbitrary JSON as user-facing content.
- **Fix**: Add safe transport-neutral tool lifecycle events, a versioned RBAC `IAiExecutionActionPayload`, and a best-effort reporter that lazily creates one action per tool-using run and updates the same id. Add a dedicated `ai-execution` row with fail-closed parsing, bounded labels/statuses, no raw JSON fallback, and `id`/`updatedAt` memo equality.
- **Preventive Action**: Keep immutable audit traces and human-readable progress as separate projections. Any visible execution payload must be typed, bounded, explicitly allowlisted, and verified in a real WebSocket-updated browser flow before release.
- **Result**: Browser observed one action transition from `running` to `completed` on the same action/run id, one final MCP-backed count of 12, no duplicate after waiting, no sensitive action text, and zero browser errors. RBAC passes 51 suites/211 tests and Social passes 12/27.
- **References**: `libs/modules/rbac/models/subject/sdk/model/src/lib/ai-execution-action.ts`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/ai/execution-action.ts`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/ai/tool-loop.ts`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/components/AiExecutionActionRow.tsx`

### Incident 15 — Structured OpenRouter text was rendered as `[object Object]`

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: A normal chat request completed with the literal assistant message `[object Object]`; no MCP execution action was created for that turn, so the failure appeared to be an opaque answer rather than an error.
- **Root Cause**: The shared OpenRouter response parser accepted array content parts without validating that `part.text` was a string. Joining an object-valued text part invoked JavaScript object coercion, producing `[object Object]`, which then passed the non-empty final-text checks and was persisted as an assistant reply.
- **Fix**: Normalize supported string, `output_text`, and nested `{ value: string }` response parts explicitly; convert every other response content shape into a typed provider error so model fallback can run. Map terminal model/tool failures to localized actionable chat copy, keep technical fallback reasons in logs/audit only, and stop the Agent fallback from appending raw exception text to user-visible messages.
- **Preventive Action**: Provider boundaries must validate unknown JSON at runtime and must never rely on implicit string coercion. User-visible failure projections should carry a stable explanation and next action while internal errors remain in logging and billing/audit metadata.
- **Result**: Four focused suites pass with 66 tests; Shared Third Parties, RBAC, and Agent TypeScript checks plus changed-file ESLint pass. Repeating the original Browser request executed three tools and returned a readable four-product answer with no new `[object Object]` or browser error.
- **References**: `libs/shared/third-parties/src/lib/open-router/index.ts`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/ai/tool-loop.ts`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`

### Incident 16 — Six model iterations stopped a valid multi-stage MCP investigation

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: A request to inspect the site's home-page blocks stopped with `max_iterations` after six successful MCP calls and before the model produced its final answer.
- **Root Cause**: The conservative initial defaults allowed only six model/tool iterations and two minutes for every task, regardless of how many discovery and schema calls a legitimate investigation required.
- **Fix**: Raise the named defaults to 50 model iterations and five minutes total runtime while retaining the 30-second per-tool timeout, 32 KiB result cap, repeated-call guard, and sequential execution.
- **Preventive Action**: Treat the iteration cap as a configurable safety bound rather than an estimate of normal task complexity, and cover the production defaults explicitly in the loop service test.
- **References**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/ai/tool-loop.ts`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/ai/tool-loop.spec.ts`

### Incident 17 — Ordinary MCP tasks received implicit RAG and ignored Thinking for rerank

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: A plain navbar/MCP request without `@knowledge` produced a billable Knowledge-rerank completion over unrelated profile chunks. The user-selected `low` Thinking effort was present on final/tool generations but absent from that auxiliary rerank request.
- **Root Cause**: Knowledge resolution enabled retrieval whenever the profile had linked documents, exposed the Knowledge tool unconditionally for those documents, and computed the OpenRouter reasoning payload only after reranking. A valid structured empty selection was also treated as a rerank failure and replaced with irrelevant fallback chunks.
- **Fix**: Make the persisted message's explicit `@knowledge` mention the sole Knowledge gate; without it, do not load document relations, search/rerank, add RAG system messages, or expose the Knowledge tool. Compute the selected reasoning before Knowledge resolution and forward it to rerank. Accept a valid empty `selected_chunk_ids` array as an intentional empty result.
- **Preventive Action**: Test clean non-RAG messages separately from explicit Knowledge messages, assert reasoning propagation on auxiliary model calls, and distinguish valid empty structured output from malformed output before applying fallbacks.
- **References**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts`

### Incident 18 — Shared model context prohibited tool responses and leaked a Telegram delivery limit

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: A tool-capable model answered a direct MCP request with plain text asking the user for more input instead of emitting a tool call. The raw OpenRouter prompt contained `Return a text response only.` and a user message requiring a 4000-character Telegram response even though the request came from the web chat.
- **Root Cause**: Transport-era Telegram workarounds were injected unconditionally into the shared OpenRouter generation context. The text-only system instruction conflicted with tool-call protocol output, while the Telegram length instruction affected every channel and appeared as if it were part of the user's request.
- **Fix**: Remove both instructions from the shared generation context. Keep language, profile persona, explicit Knowledge context, and conversation history there; rely on the existing Notification service to split outgoing Telegram text into 4000-character chunks.
- **Preventive Action**: Keep delivery constraints inside the transport adapter. A shared tool-enabled model prompt must not prohibit protocol messages or impose channel-specific formatting on unrelated channels.
- **References**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts`, `libs/modules/notification/models/notification/backend/app/api/src/lib/service/singlepage/index.ts`

### Incident 19 — Explicit thread model selection was component-local

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: A thread used the explicitly selected Minimax model, but a page
  reload reset the composer to `Auto`; the next turn could therefore use a
  different automatically routed model.
- **Root Cause**: The OpenRouter selector lived only in React state, and the
  mounted chat shell reset that state on every chat/thread transition. Threads
  had no persisted preference contract.
- **Fix**: Add generic `social.thread.metadata`, a versioned RBAC
  `rbacAiThreadPreferences` contract, and persistence through the authorized
  thread route. Delegate the write to a public method on the main Subject
  singlepage Service so startup Subject services can override it. Restore the
  saved value whenever the active thread changes.
- **Preventive Action**: Any user choice expected to survive navigation must
  have a server-owned scope and typed persistence contract; component state is
  only the optimistic view of that state. Controller-owned business writes
  must delegate to a startup-overridable main service method.
- **References**: `libs/modules/social/models/thread/backend/repository/database/src/lib/fields/singlepage.ts`, `libs/modules/rbac/models/subject/sdk/model/src/lib/ai-thread-preferences.ts`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/hooks/use-openrouter-model-controls.ts`

### Incident 20 — Billing settled in PostgreSQL but the open admin relation stayed stale

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: Repeated AI requests appeared not to debit
  `subjects-to-billing-module-currencies`; the open UI kept showing
  `99999997170`.
- **Root Cause**: The billing ledger and settlement were correct, but the
  explicit realtime rule for `react-by/openrouter` emitted only Social message
  and action topics. The directly settled RBAC billing relation therefore had
  no matching WebSocket invalidation or HTTP-cache version bump.
- **Evidence**: PostgreSQL showed the current balance at `99999997169` and
  stored exact settlement trajectories including `99999997203 ->
99999997170` for a 34-token call and `99999997365 -> 99999997210` for a
  156-token call.
- **Fix**: Add `rbac.subjects-to-billing-module-currencies` to the shared
  AI-reaction topic rule. This keeps the billing implementation unchanged and
  makes open relation readers refetch after the completed turn.
- **Preventive Action**: Every RPC topic rule must enumerate all model
  collections mutated behind that action, including accounting relations; the
  shared resolver test must assert each reader topic explicitly.
- **References**: `libs/shared/utils/src/lib/topics/singlepage.ts`,
  `libs/shared/utils/src/lib/topics/topic-rules.spec.ts`

### Incident 21 — MCP environment names mixed service, transport, and project-specific prefixes

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: Local generation introduced a project-specific MCP endpoint
  variable while the MCP process and deployment still used separate
  transport, public-address, OAuth, and generic prefixes, unlike the
  repository's `API_SERVICE_*` application convention.
- **Root Cause**: Configuration names had grown around individual MCP
  features without one application-level namespace. The internal API endpoint,
  server bind socket, and public OAuth resource were also treated as if they
  were interchangeable URLs.
- **Fix**: Move every MCP environment setting under `MCP_SERVICE_*`; replace
  the project-specific API variable with `MCP_SERVICE_URL`; keep
  `MCP_SERVICE_HTTP_HOST`/`PORT` for binding and
  `MCP_SERVICE_PUBLIC_BASE_URL`/`PUBLIC_URL` for the external OAuth resource.
- **Result**: Tracked runtime/configuration and current local env files contain
  zero legacy MCP environment names. MCP OAuth passes 12 tests, the RBAC MCP
  client passes 6 tests including the canonical env contract, both affected
  TypeScript projects and focused ESLint pass, and deployment shell syntax,
  formatting, and diff checks pass.
- **Preventive Action**: New application configuration must start with the
  `<APP>_SERVICE_` namespace and explicitly distinguish bind, internal client,
  and public reverse-proxy addresses.
- **References**: `apps/mcp/http.ts`, `apps/mcp/lib/oauth.ts`,
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/mcp/singlepagestartup-client.ts`,
  `tools/deployer/mcp/mcp.env.j2`, `tools/deployer/api/api.env.j2`

### Incident 22 — Invented identity names obscured SPS domain ownership

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: MCP OAuth, RBAC orchestration, tool-loop code, tests, and issue
  artifacts used one invented product-role alias for both a `social.profile`
  and its linked `rbac.subject`, while the authentication JWT used a vague
  repository-wide alias.
- **Root Cause**: Implementation terminology described a product metaphor
  instead of the repository models that own behavior and authorization.
- **Fix**: Rename the visible/capability identity to `socialProfile*`, the
  execution principal to `rbacSubject*`, the credential to
  `rbacSubjectAuthenticationJwt`, the internal exchange route/client to
  `rbac-subject`, and the tool loop to `social-profile-ai-tool-loop`. Preserve
  only protocol/schema names such as OAuth `subject_token` and JWT
  `subject.id`.
- **Result**: MCP passes 8 suites/45 tests, RBAC 53/221, Agent 8/33, and Social
  12/27. All four affected TypeScript projects, focused ESLint, Prettier,
  `git diff --check`, and the old-name zero-reference check pass.
- **Preventive Action**: New cross-module identifiers must name their owning
  SPS model (`<module>.<model>`) instead of introducing a product-role alias.
- **References**: `apps/mcp/lib/oauth.ts`,
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/mcp/singlepagestartup-client.ts`,
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/ai/tool-loop.ts`,
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`

### Incident 23 — Profile AI implementations bypassed the startup Subject service

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: The OpenRouter controller imported service implementations by
  deep relative paths and instantiated the MCP catalog, AI tool loop, and
  execution-action reporter directly, so a child startup service could not
  replace those operations.
- **Root Cause**: Issue-specific helpers accumulated in the flat Subject
  service directory without being exposed as domain operations of the main
  `rbac.subject` service.
- **Fix**: Group Subject services under `billing`, `social-module/chat`,
  `social-module/profile/ai`, and `social-module/profile/mcp`; expose MCP
  catalog, tool-loop, action-reporter, and billing-summary methods from the
  main service; use protected default factories; and make controllers depend
  only on the startup-exported Subject Service. Normalize legacy persisted
  `replyProfileId` metadata to canonical `replySocialProfileId` so the restart
  does not break turns created before the terminology migration.
- **Result**: The target controller has zero relative implementation imports
  and zero direct domain-service constructions. RBAC TypeScript passes, and
  the full RBAC Jest run passes 54 suites/225 tests including default
  composition, startup override, and legacy metadata scenarios. After current
  MCP HTTP/API/host restart, Browser created a new thread and completed one MCP
  count (`12`), one explicit `@knowledge` answer, and one
  `/youtube-description-1` answer with no request error or duplicate result.
- **Preventive Action**: Controllers compose routes and call the main model
  service only. New replaceable behavior must be a public domain operation of
  that service, with its default implementation stored in the matching domain
  directory and an explicit startup override test.
- **References**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/index.ts`,
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/composition.spec.ts`,
  `libs/modules/rbac/models/subject/sdk/model/src/lib/ai-reaction-request.ts`,
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`

### Incident 24 — Skill-only messages discarded attached transcripts before routing

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: Sending `/youtube-description-1` with a TXT transcript produced
  an OpenRouter classifier request whose `Request text` was empty and whose
  detected modality was only `text`; the turn then failed with
  `OpenRouter message description is required after removing control mentions`.
- **Root Cause**: The handler removed the slash-skill control token before
  routing, then skipped the resulting empty message before resolving its
  `messages-to-file-storage-module-files` relation. Text attachments were also
  represented as provider-facing `file_url` values even though the local API
  URL is not a reliable model input and automatic routing benefits from
  provider-independent text.
- **Fix**: Resolve attachments before deciding whether a context message is
  empty. Read text, transcript, subtitle, and common structured-text files on
  the API; insert their complete content into the final user message; pass a
  bounded text prefix to automatic classification/model selection; and keep
  image/binary attachments on their existing multimodal path.
- **Result**: Full RBAC passes 54 suites/226 tests, RBAC TypeScript passes, and
  changed-file ESLint/Prettier pass. Replaying the original message classified
  it as Russian
  `summarize`/`text`, selected `openai/gpt-5.2`, and created one visible
  transcript-grounded YouTube description in the original Browser thread.
- **Preventive Action**: Treat control mentions and source material as separate
  inputs. A message containing only a skill mention remains valid when an
  attached source can be normalized into model context; routing must never
  inspect an empty control-stripped string while ignoring attached content.
- **References**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`,
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts`

### Incident 25 — Original attachments were not reliably accepted by final generation

- **Phase**: Code Review
- **Occurrences**: 2
- **Symptom**: The transcript repair made automatic routing work, but final
  generation received extracted text instead of the original TXT files. A
  provider error could additionally trigger the shared multimodal retry and
  silently remove every non-text attachment.
- **Root Cause**: Routing normalization and provider input were represented by
  one context value. The shared OpenRouter adapter also forwarded local image
  URLs that an external provider cannot resolve and retained a generic
  strip-non-text fallback intended for less strict callers. After preserving
  the original files, the adapter copied response MIME parameters such as
  `text/plain;charset=utf-8` into Base64 data URLs, which OpenRouter rejected as
  an invalid file data URL.
- **Fix**: Keep two explicit representations: bounded extracted text for model
  classification/routing, and ordered original `file_url`/`image_url` parts for
  final generation. Convert every file to an inline Base64 OpenRouter `file`
  part, inline private/local images as data URLs, preserve relation
  `orderIndex`, disable non-text stripping for this AI reaction path, and strip
  MIME parameters before constructing the data URL.
- **Result**: The controller and OpenRouter adapter pass 45 focused tests,
  including two TXT files plus one JPEG with exact outbound bytes and MIME
  normalization. RBAC and shared-third-parties TypeScript and ESLint pass. A
  privacy-approved live check created message
  `a7ffe162-833c-4c71-9bfe-977d069851fe`, displayed two file links and one
  image, and verified three message-to-file relations in order `0,1,2`; every
  stored SHA-256 exactly matched its source. Canonical OpenRouter execution
  created reply `481eaee0-cca7-40cb-af42-05607325cd40`, which correctly used
  facts unique to both text files and visual evidence from the JPEG. Browser
  verification confirmed the complete answer in the original thread.
- **Preventive Action**: Never treat extracted attachment content as a
  substitute for a user-supplied file. Routing may inspect normalized text,
  while generation must preserve every supported original attachment and fail
  visibly if the selected provider cannot process it.
- **References**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`,
  `libs/shared/third-parties/src/lib/open-router/index.ts`,
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts`,
  `libs/shared/third-parties/src/lib/open-router/index.spec.ts`

### Incident 26 — Sequential attachment selection replaced earlier files

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: Selecting one file, reopening the picker, and selecting another
  left only the latest file in the composer. With two files named
  `content.txt`, the replacement looked like filename deduplication.
- **Root Cause**: The file-input `change` handler replaced the complete form
  `files` value with the latest `FileList` instead of appending newly selected
  files to the existing `File[]`.
- **Fix**: Append each new picker selection to the existing `File[]`, preserve
  same-named files as separate attachments, and clear the native input value
  after each selection so the picker can emit another change for the same
  path.
- **Result**: The focused composer suite passes 36/36 tests, including two
  different `content.txt` files selected in separate operations and submitted
  together. RBAC TypeScript and ESLint pass. Browser confirms the updated
  multiple-file input renders without console errors; direct file injection is
  unavailable in the in-app Browser, so the sequential file behavior is
  covered by the BDD regression.
- **Preventive Action**: Treat every picker operation as an additive attachment
  selection unless the user explicitly removes a pill or sends/resets the
  composer.
- **References**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/components/Composer.tsx`,
  `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.spec.tsx`

### Incident 27 — Autorouting catalog lagged behind current OpenRouter models

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: Automatic routing still preferred GPT-5.2-era text models and
  contained image candidates such as `black-forest-labs/flux.2-pro`,
  `sourceful/riverflow-v2-standard-preview`, and
  `bytedance-seed/seedream-4.5` that were no longer present in the live
  OpenRouter model catalog.
- **Root Cause**: `MODEL_ROUTER_CONFIG` was a dated static snapshot and had no
  regression contract requiring current provider families or excluding
  retired and deliberately disallowed expensive models.
- **Fix**: Refresh the routing snapshot against OpenRouter `/api/v1/models` and
  provider documentation. Use GPT-5.6 Sol/Terra/Luna, MiniMax M3/M2.7, Claude
  Sonnet 5, Gemini 3.5/3.1, and Kimi K2.7 Code in the relevant text, coding,
  and vision classes. Replace the stale image list with Gemini 3.1 Flash Image,
  Gemini 3.1 Flash Lite Image, GPT-5.4 Image 2, Gemini 3 Pro Image, and GPT-5
  Image Mini. Preserve the live catalog's coarse input/output modality claims
  in each candidate.
- **Result**: The focused OpenRouter controller suite passes 32/32 tests, RBAC
  TypeScript compilation succeeds with all 28 dependencies, and changed-file
  ESLint passes. A BDD regression now requires GPT-5.6 and MiniMax candidates
  and rejects GPT-5.2, Flux 2 Pro, Riverflow, and Seedream 4.5.
- **Preventive Action**: Treat the routing table as a dated reviewed snapshot.
  Verify every candidate against the live OpenRouter catalog before updating
  the version, keep modality metadata aligned with that catalog, and encode
  removals plus required provider families in a focused regression test.
- **References**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`,
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts`

### Incident 28 — Profile text utility lived inside the RBAC controller layer

- **Phase**: Code Review
- **Occurrences**: 1
- **Symptom**: AI and skill handlers imported `social.profile` text
  normalization from a file inside the RBAC controller tree, making a reusable
  domain operation appear owned by transport code and creating a reverse
  controller dependency for future service consumers.
- **Root Cause**: The utility was added beside its first caller rather than at
  the model boundary that owns the persisted text formats.
- **Fix**: Move plain and localized profile-text normalization to
  `@sps/social/models/profile/sdk/model`, export it from the model SDK, update
  both RBAC handlers to use that public boundary, and delete the controller
  utility.
- **Result**: RBAC controllers no longer expose or own reusable profile-text
  logic. The model SDK BDD suite passes 2/2 tests, the affected OpenRouter suite
  passes 32/32, RBAC TypeScript (including Social) succeeds, and changed-file
  ESLint passes.
- **Preventive Action**: Put pure cross-layer transformations of model data in
  that model's SDK; controllers may consume them but must not become their
  reusable import boundary.
- **References**: `libs/modules/social/models/profile/sdk/model/src/lib/plain-text.ts`,
  `libs/modules/social/models/profile/sdk/model/src/lib/plain-text.spec.ts`,
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`

### Incident 29 — Connected AI participants were mistaken for a routing defect

- **Phase**: Code Review
- **Occurrences**: 1 confirmed chat with three unrelated AI profiles and one
  duplicated `telegram-bot` relation
- **Symptom**: Telegram chat `550809313` contained several AI profiles and one
  duplicated `telegram-bot` relation, so every connected AI participant
  received the same message and produced its own model execution.
- **Root Cause**: The multiple AI profiles had been connected to the chat by
  human configuration. Agent fan-out was therefore correct; the mistaken
  diagnosis treated valid `profiles-to-chats` membership as a routing defect.
  The duplicated relation remained a separate idempotency problem.
- **Fix**: Provision one deterministic `rbac.subject.variant="agent"` per owner
  subject and one knowledge-empty AI profile with `singlepagestartup` MCP
  access. Reuse those records on subsequent updates, keep `telegram-bot`
  available for transport commands, preserve every manually connected AI
  profile, and collapse only duplicate links for the same profile during
  bootstrap. Do not persist a reply-profile target in Telegram messages; Agent
  derives all recipients from chat membership. Expose personal-agent
  provisioning through the startup-overridable main `rbac.subject` service.
- **Result**: Chat membership is again the sole fan-out configuration. The AI
  request envelope carries only model/reasoning/Skill/Knowledge settings, and
  older reply-profile fields are ignored during normalization.
- **Preventive Action**: Do not compensate for incorrect participant setup in
  message routing. Preserve configured chat membership, dispatch every
  automatic participant, and make bootstrap lifecycle records idempotent only
  at the relation level.
- **References**:
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/personal-ai-agent.ts`,
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts`,
  `apps/telegram/src/lib/telegram-bot.ts`,
  `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts`

### Incident 30 — Telegram `/learn` did not emit the canonical Knowledge controls

- **Phase**: Code Review
- **Occurrences**: every raw Telegram `/learn` message
- **Symptom**: The web composer persisted `@knowledge /learn`, but Telegram
  forwarded `/learn` unchanged. The shared OpenRouter handler correctly
  rejected that message because learning without an explicit `@knowledge`
  control would violate the opt-in Knowledge contract. Telegram group command
  form `/learn@<bot-username>` was not treated as bot-addressed either.
- **Root Cause**: Telegram had no transport normalization for its native
  command syntax. Learning itself already belonged to the shared RBAC/OpenRouter
  pipeline and did not need a second Telegram implementation.
- **Fix**: Normalize private `/learn`, group `/learn@<bot-username>`, and group
  `@<bot-username> /learn` into `@knowledge /learn` before Social message
  creation. Strip group bot addressing from explicit `@knowledge` queries and
  accept the standard suffixed group command as bot-addressed.
- **Result**: Telegram and the web chat persist the same Knowledge controls and
  therefore use the same profile-scoped learning, document relation, search,
  rerank, and reply path. Pure adapter BDDs cover canonical, private, and group
  forms without introducing transport-specific Knowledge metadata.
- **Preventive Action**: Keep domain commands canonical in persisted Social
  messages and limit each transport adapter to syntax/addressing normalization.
- **References**: `apps/telegram/src/lib/telegram-bot.ts`,
  `apps/telegram/src/lib/telegram-bot.spec.ts`, `apps/telegram/README.md`,
  `libs/modules/rbac/README.md`

### Incident 31 — Learned profile documents were hidden by an RBAC error

- **Phase**: Code Review
- **Occurrences**: 1 live Telegram `/learn` execution
- **Symptom**: The AI replied `Learned 1 knowledge item.`, while the selected
  profile sidebar displayed `KNOWLEDGE 0` before and after a page reload.
- **Root Cause**: The command succeeded: PostgreSQL contained indexed document
  `635ca852-8336-4cfb-8c56-31528412901c` and relation
  `82ed8e26-3bce-4b1b-a626-ee29bbdd52eb` for the selected profile at the exact
  response time. Two independent defects then hid it. First, the hand-written
  RBAC query derived the nonexistent `social.documents` realtime topic, while
  the outer `react-by/openrouter` mutation omitted the changed Knowledge
  collections. Second, the chat-scoped Knowledge routes had no
  `rbac.permission`; the live GET returned HTTP 403, and the sidebar rendered
  the failed query as an empty list.
- **Fix**: Add framework topic rules mapping both profile Knowledge read routes
  and the AI reaction to `social.profiles-to-knowledge-module-documents` plus
  `knowledge.documents`; make both client SDK queries use the shared resolver;
  render a human-readable access error instead of `KNOWLEDGE 0` when the query
  fails. The durable route-permission change must be explicitly approved
  because it changes authorization for a role; the proposed safe scope is the
  existing `user` role plus the route's ownership/agent middleware, never a
  role-less public permission.
- **Result**: Topic resolver BDDs pass 6/6, revalidation middleware BDDs pass
  9/9, the Social component suite passes 13 suites/30 tests, and the existing
  indexed document remains verified through the production service path. The
  approved profile-specific role was applied on 2026-07-15; the tunneled
  Knowledge GET now returns HTTP 200 with the indexed document. The final
  sidebar assertion remains pending only because the in-app Browser rejected
  post-restart tunnel navigation under its URL security policy.
- **Additional Evidence**: Telegram source messages `5155` and `5156` were two
  separate incoming messages. Only `5155` contained `@knowledge /learn` and was
  learned; `5156` had no command and correctly triggered an ordinary reply,
  explaining the two assistant messages shown together.
- **Preventive Action**: Composite read endpoints must use explicit framework
  topic rules for every collection they join, and action endpoints that mutate
  those collections internally must broadcast the same reader topics. Every
  newly registered composite controller route must also have an intentional,
  reviewed `rbac.permission`, and query failures must never be presented as
  empty domain data.
- **References**: `libs/shared/utils/src/lib/topics/singlepage.ts`,
  `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/profile/find-by-id/knowledge/document/find.ts`,
  `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/social-module/profile/find-by-id/knowledge/document/find.ts`,
  `libs/shared/utils/src/lib/topics/topic-rules.spec.ts`,
  `libs/middlewares/src/lib/revalidation/index.spec.ts`,
  `libs/modules/social/models/profile/frontend/component/src/lib/singlepage/chat-profile-sidebar/ClientComponent.tsx`

### Incident 32 — Global authorization used its own HTTP API and unscoped relation reads

- **Phase**: Code Review
- **Occurrences**: every non-public authorization check
- **Symptom**: `is-authorized` called the local Permission SDK over HTTP and
  loaded every roles-to-permissions record. Profile-scoped Knowledge grants
  could not be provisioned through the startup-overridable service graph, and
  the approach scaled with total project relations instead of the requested
  permission.
- **Root Cause**: Permission and roles-to-permissions services were not exposed
  in Subject DI. Permission route resolution cached the complete permission
  table, while `is-authorized` used server SDKs instead of backend services.
- **Fix**: Bind the startup-exported Permission and roles-to-permissions
  services in Subject DI; inject them into `is-authorized`; query exact routes
  and permission relations through filtered service `find`; scan only cached
  bracket templates after an exact miss. Add an idempotent
  `SocialProfileKnowledgeAccessService` that creates a profile-specific owner
  role and five chat-scoped Knowledge permissions, then assigns it to the
  authenticated Telegram owner through existing RBAC relations.
- **Result**: Four focused BDD suites pass 8 tests and the RBAC TypeScript
  project compiles without errors. Exact target profile UUIDs remain literal,
  `[knowledge.documents.id]` remains dynamic, and role-less permissions retain
  their existing public behavior. After explicit approval, role
  `b8951484-3269-4b58-b793-2b11dd766594`, five permission relations, and owner
  subject relation `a7d97a06-e88c-4e85-9f00-e9a651fe7165` were created
  idempotently. A short-lived owner JWT receives HTTP 200 and document
  `635ca852-8336-4cfb-8c56-31528412901c` through both local and tunneled API
  URLs.
- **Preventive Action**: Keep global authorization on injected
  startup-exported services; never use loopback HTTP or handwritten SQL inside
  `is-authorized`. Every profile-specific grant must test exact UUID isolation
  and idempotent relation creation.
- **References**:
  `libs/modules/rbac/models/permission/backend/app/api/src/lib/service/singlepage/index.ts`,
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/is-authorized.ts`,
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/access.ts`

### Incident 33 — Browser manager profile was incorrectly required to join the chat

- **Phase**: Code Review
- **Occurrences**: 1 live profile-sidebar request
- **Symptom**: Browser subject `303302a0-4eb7-4cef-af04-74d7e8e72442`
  requested the approved target profile through its owned requester profile
  `88862025-5c38-4ce8-bb4c-4c5c511b874c`, but the route returned HTTP 401
  because that requester profile was not a chat participant.
- **Root Cause**: The existing chat-agent management middleware duplicated
  authorization policy by requiring both subject ownership of the requester
  profile and requester-profile-to-chat membership. The chat itself was already
  subject-authorized, while exact RBAC permissions and target profile guards
  covered the protected resource.
- **Fix**: Keep subject ownership of the chat and requester profile, keep target
  AI profile chat membership/agent ownership/document-link checks, and remove
  only the redundant requester-profile-to-chat query. Add BDD coverage for a
  manager profile outside the chat and for multiple authorized subjects sharing
  one profile role with separate subject-scoped permission paths.
- **Result**: Focused middleware and provisioning suites pass 4/4 tests; RBAC
  TypeScript and changed-file ESLint pass. The Browser subject grant remains
  unapplied because it is a different persistent security mutation from the
  previously approved Telegram-owner grant and needs explicit approval.
- **References**:
  `libs/modules/rbac/models/subject/backend/app/middlewares/src/lib/request-subject-can-manage-chat-agent-profile/index.ts`,
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/social-module/profile/knowledge/access.spec.ts`

### Incident 34 — Telegram topic title exposed the model response field label

- **Phase**: Code Review
- **Occurrences**: 1 live Telegram topic rename
- **Symptom**: The visible Telegram topic and SPS thread were named
  `title : Келлеры 💬` instead of `Келлеры 💬`.
- **Root Cause**: OpenRouter returned a loose `title : ...` field instead of
  the requested JSON object. The JSON fallback parser passed that field label
  into the three-word title sanitizer, so it became user-visible content.
- **Fix**: Strip one optional, case-insensitive `title:` field label at the
  model-response parsing boundary before sanitizing, persisting, or mirroring
  the title to Telegram. Add BDD coverage for the exact loose response format.
- **Result**: The focused Telegram bootstrap suite passes 8/8 tests, new model
  responses are normalized to `Келлеры 💬`, and an already persisted malformed
  title repairs itself on the next topic message without another model call.
- **Preventive Action**: Treat structured-output instructions as a preferred
  provider contract, not a guarantee; normalize provider fallbacks before they
  reach persisted SPS or external Telegram state.
- **References**:
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts`,
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.spec.ts`

### Incident 35 — Split Telegram `/learn` text became several independent AI turns

- **Phase**: Code Review
- **Occurrences**: 1 live 9,574-character Telegram learning request
- **Symptom**: Telegram split one `/learn` payload into multiple messages. Only
  the first chunk retained the command, so the first chunk was learned while a
  continuation was handled as a normal AI question.
- **Root Cause**: Telegram split text has no `media_group_id`; the existing
  album buffer could not correlate it. The adapter also owned `/learn` semantics
  by rewriting it to `@knowledge /learn`, while Agent command ownership was a
  hard-coded string list without a startup override seam.
- **Fix**: Add a 1.5-second `/learn` debounce buffer keyed by Telegram chat,
  topic, and sender before `social.message` creation; concatenate ordered text
  and retain all source message ids in metadata. Make Telegram addressing
  generic for leading mentions, `/command@bot`, and replies. Move command
  ownership into a protected Agent registry, route `/learn` to an AI profile,
  accept direct `/learn` in the RBAC learning flow, and merge startup command
  definitions last.
- **Result**: Telegram, Agent registry, Agent thread, Agent OpenRouter, and RBAC
  OpenRouter focused suites pass 60 tests. Telegram and Agent TypeScript checks
  pass. The full RBAC TypeScript target remains blocked by unrelated missing CRM
  form/request backend import aliases in the existing dirty worktree.
- **Preventive Action**: Buffer only command-scoped Telegram continuations; do
  not concatenate arbitrary chat messages. Keep transport addressing in the
  adapter, command semantics in Agent, and project overrides in startup.
- **References**:
  `apps/telegram/src/lib/telegram-bot.ts`,
  `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`,
  `libs/modules/agent/models/agent/backend/app/api/src/lib/service/startup/index.ts`,
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`

### Incident 36 — Agent commands were executable but absent from Telegram suggestions

- **Phase**: Code Review
- **Occurrences**: every bot startup before command publication
- **Symptom**: `/learn` executed when typed manually but did not appear in
  Telegram's slash-command menu.
- **Root Cause**: Agent owned the startup-overridable execution registry, while
  `apps/telegram` only installed the webhook and never called Telegram
  `setMyCommands`. BotFather therefore remained a separate, stale source of
  command discovery.
- **Fix**: Add menu descriptions to Agent definitions, merge startup overrides
  field by field, expose the effective catalog through an Agent server-SDK
  endpoint, and make `apps/telegram` fetch it with the internal RBAC service key
  before publishing it through `setMyCommands` and installing the webhook.
- **Result**: Agent remains the only command source of truth; startup projects
  can rename, disable, or add commands without importing the Agent backend into
  the Telegram application. Focused Agent/Telegram suites pass 16 tests, Agent
  TypeScript passes, and the Telegram Bun build succeeds.
- **Preventive Action**: Share serializable contracts through module SDKs;
  never instantiate another module's backend service inside an application or
  maintain command execution and BotFather menus separately.
- **References**:
  `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`,
  `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/commands.ts`,
  `libs/modules/agent/models/agent/sdk/server/src/lib/singlepage/telegram-commands.ts`,
  `apps/telegram/src/lib/telegram-bot.ts`

### Incident 37 — Knowledge control and formulas were not portable across Telegram and web

- **Phase**: Code Review
- **Occurrences**: every Telegram Knowledge invocation and every response that
  contained LaTeX display syntax
- **Symptom**: Telegram users had to type `@knowledge`, which looked like an
  account mention, while `\\[...\\]`, `\\frac`, and `\\text` were rendered as
  raw source in both Telegram and the web chat.
- **Root Cause**: Agent did not publish a Telegram-native Knowledge command,
  OpenRouter recognized only the web mention control, and generated text was
  persisted without a channel-portable formula normalization boundary.
- **Fix**: Add the startup-overridable `/knowledge` Agent command; accept and
  strip both `/knowledge` and `@knowledge` before skill parsing and generation;
  require portable Markdown/Unicode in the generation prompt; normalize common
  LaTeX formula syntax in shared utilities before canonical message persistence.
- **Result**: Focused tests verify that new OpenRouter responses are normalized
  before persistence, while the existing frontend renderer leaves previously
  stored message text unchanged. API, Telegram, and host services were
  restarted; Telegram republished the effective command catalog without error.
- **Preventive Action**: Persist one portable response representation for all
  delivery channels. Channel-specific renderers may enrich it, but Telegram and
  web must not depend on unsupported provider markup for basic readability.
- **References**:
  `libs/shared/utils/src/lib/ai-response-text/singlepage.ts`,
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts`,
  `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts`

### Incident 38 — Background Telegram ingestion failures were invisible to users

- **Phase**: Code Review
- **Occurrences**: every rejected background ingestion task before a Social
  message was persisted
- **Symptom**: Telegram acknowledged the webhook, while bootstrap, file, JWT,
  message-create, media-group, or buffered `/learn` failures were written only
  to the server log. From the user's perspective, the bot silently ignored the
  message.
- **Root Cause**: `runInBackground` detached work correctly but exposed only a
  logging catch handler. The incoming-message paths had no shared user-facing
  failure callback.
- **Fix**: Add an optional protected error callback to the background runner and
  route all incoming message, voice, audio, media-group, forum-topic bootstrap,
  and `/learn` buffer work through one Telegram-specific wrapper. It logs the
  technical cause, sends a localized neutral response, preserves
  `message_thread_id`, and catches notification delivery failures separately.
- **Result**: The Telegram suite passes 12 tests, including a BDD assertion that
  an internal JWT-related exception is logged but never exposed to the user,
  while the safe Russian response is delivered to the original topic. Telegram
  TypeScript, scoped ESLint, and diff checks pass.
- **Preventive Action**: Every detached user-originated task must define both an
  operational error sink and a presentation-safe user notification. Background
  infrastructure tasks may remain log-only when no user context exists.
- **References**:
  `apps/telegram/src/lib/telegram-bot.ts`,
  `apps/telegram/src/lib/telegram-bot.spec.ts`

### Incident 39 — Public frontend origin prevented Agent message dispatch

- **Phase**: Code Review
- **Occurrences**: every web message created through an origin not equal to the
  API process's configured internal URLs
- **Symptom**: Web messages and RBAC actions were persisted, but no execution
  action or AI response appeared. The same Agent flow worked for Telegram.
- **Root Cause**: Action Logger persisted `c.req.url` and removed only the
  configured `API_SERVICE_URL` values. Telegram called the internal
  `http://localhost:4000` origin, so its action contained a pathname; the web
  tunnel produced `http://sps-api.ru.tuna.am/api/...`, which remained absolute.
  Agent's `path-to-regexp` templates accept `/api/...` paths and silently
  returned `data: false` for the absolute URL.
- **Fix**: Add the dependency-free shared `normalizeRoutePath` primitive.
  Action Logger now persists the canonical `c.req.path`, independent of origin,
  scheme, query string, or reverse proxy. Agent normalizes incoming action
  routes before both message and social-action matching so legacy absolute
  actions remain processable. Already-relative pathnames are handled directly;
  only actual absolute URLs are parsed with `URL`, without inventing a fallback
  origin or a fictitious internal domain.
- **Result**: Shared route tests pass 15/15 and Agent routing tests pass 8/8,
  including the exact `http://sps-api.ru.tuna.am/.../threads/.../messages`
  regression. Shared Utils, Middlewares, and Agent TypeScript checks, scoped
  ESLint, and diff checks pass.
- **Preventive Action**: Persist resource identity as a canonical pathname;
  transport origins belong to deployment configuration and must never
  participate in domain-event routing. Do not introduce placeholder domains to
  normalize pathnames because they look like real deployment requirements.
- **References**:
  `libs/shared/utils/src/lib/routes/index.ts`,
  `libs/middlewares/src/lib/actions-logger/index.ts`,
  `libs/modules/agent/models/agent/backend/app/api/src/lib/controller/singlepage/telegram/bot.ts`

### Incident 40 — Telegram topic titles used a legacy general-purpose model

- **Phase**: Code Review
- **Occurrences**: every first message that generated a Telegram topic title
- **Symptom**: The title generator still called
  `google/gemini-2.5-flash`, although it only needs a three-word JSON title and
  OpenRouter now exposes newer, cheaper lightweight models for this workload.
- **Root Cause**: The original implementation selected the current general
  Gemini Flash model and never revisited that hard-coded choice after the
  lightweight 3.1 generation became available.
- **Fix**: Switch the focused structured-output call to
  `google/gemini-3.1-flash-lite`. It is intended for high-frequency lightweight
  tasks, supports structured output, and currently costs less than Gemini 2.5
  Flash on both input and output. MiniMax M3 was not selected because its
  benchmark advantage is concentrated in agentic and coding workloads that do
  not match this bounded title-generation call.
- **Result**: The focused RBAC Telegram bootstrap suite passes 8 tests and
  verifies the new model id while preserving the existing temperature, token
  bound, JSON response format, fallback, and title sanitation behavior.
- **Preventive Action**: Evaluate model changes against the exact call shape,
  modality, structured-output requirement, and provider economics instead of
  substituting the highest-scoring general or agentic model.
- **References**:
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.ts`,
  `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/telegram/bootstrap.spec.ts`

## Reusable Learnings

- For OpenRouter tool execution through MCP, keep external MCP OAuth unchanged and issue the internal short-lived MCP token from the authentication JWT of the `rbac.subject` linked to the replying profile; never reuse requester permissions, billing identity, or tool arguments to choose the execution principal.
- Configure which MCP servers a `social.profile` may use, not a duplicate per-tool/data permission system; tools come from MCP `tools/list`, and `apps.api` remains the source of truth for the linked `rbac.subject` permissions.
- Keep one canonical AI reaction endpoint. Migrate required behavior and callers before deleting a legacy endpoint so parity and cleanup are verifiable in one change set.
- Persist AI-turn execution settings in message metadata and let message-created/action logging be the single backend trigger; reply recipients come from chat membership, and no frontend follow-up mutation, custom launch header, or query marker coordinates an agent turn.
- Project live execution into a typed, presentation-safe action and keep raw arguments/results only in the execution context or audit boundary; never use a generic JSON action renderer for agent progress.
- Verify the actual admin variant rendered by the host. Shared form fields may need to be wired into both legacy and admin-v2 surfaces until the legacy admin is retired.
- For MCP runtime checks, validate the complete chain without exposing tokens: exchange status/TTL, live `tools/list`, then one read-only API-backed MCP call whose audit subject is the `rbac.subject` linked to the replying `social.profile`.
- Keep UI/component variants separate from semantic singleton markers; a schema default such as `variant = "default"` cannot identify one canonical chat thread.
- Validate every OpenRouter response content part before joining or persisting it; structured provider payloads must either be explicitly normalized or become typed provider errors that can trigger model fallback.
- Keep channel-specific response limits in the delivery transport; the shared OpenRouter context must remain compatible with tool calls and all supported chat origins.
- Persist navigation-stable composer choices at their natural server scope and
  route writes through the startup-overridable main service rather than
  treating local React state as durable configuration.
- Treat billing visibility separately from billing persistence: action routes
  that settle balances must publish the relation's canonical realtime topic so
  already-open readers cannot mistake a stale cache for a missed charge.
- Keep an application service's bind socket, internal client URL, and public
  reverse-proxy/OAuth URL as separate settings under one `<APP>_SERVICE_*`
  namespace; none of those addresses is a safe universal substitute for the
  others.
- Name identities and credentials after their owning SPS models: use
  `socialProfile*`, `rbacSubject*`, and `rbacSubjectAuthenticationJwt` instead
  of role metaphors or repository-wide `Sps*` prefixes.
- Keep controllers on the startup-exported main model service boundary;
  organize default implementations by domain and expose protected factories
  when a child project may need a narrower implementation override.
- Normalize locally stored text attachments before automatic model routing,
  but keep routing and generation inputs separate: classification may use a
  bounded extracted prefix, while final generation receives the ordered
  original files and images without a silent text-only fallback.
- Normalize generated Telegram topic titles at the model-response boundary;
  provider field labels such as `title:` must never become persisted UI text.
- Match small structured helper calls to current low-latency models rather than
  reusing the main agent model; complex agentic benchmarks are not evidence of
  better three-word JSON title generation.
