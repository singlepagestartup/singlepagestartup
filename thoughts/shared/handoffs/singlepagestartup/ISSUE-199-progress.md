---
issue_number: 199
issue_title: "Enable MCP-powered AI execution for social profiles"
start_date: 2026-07-11T23:09:33Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-199.md
status: complete
completed_date: 2026-07-12T00:19:12Z
---

# Implementation Progress: ISSUE-199 - Enable MCP-powered AI execution for social profiles

**Started**: 2026-07-12
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-199.md`

## Phase Progress

### Phase 1: Consolidate Reactions And Establish the rbac.subject Identity Boundary

- [x] Started: 2026-07-11T23:09:33Z
- [x] Completed: 2026-07-12T00:12:49Z
- [x] Automated verification: RBAC 183 tests and Agent 30 tests passed; zero live legacy reaction references.

**Notes**: Ported identity/resource guards, Knowledge and skill behavior to OpenRouter; all agent/SDK/frontend callers now use it. Removed the legacy handler, route, permission snapshot, SDK actions, agent method, tests, mocks, and docs.

### Phase 2: Add Allowed MCP Servers And Autonomous Profile Capabilities

- [x] Started: 2026-07-11T23:09:33Z
- [x] Completed: 2026-07-12T00:12:49Z
- [x] Automated verification: Social profile MCP model/field suites passed (5 tests); Social TypeScript and ESLint passed.

**Notes**: Added `allowedMcpServerIds` with generated Drizzle migration, built-in `singlepagestartup` descriptor, stale-id handling, and both active legacy/admin-v2 profile forms. Browser verification confirmed the `SinglePageStartup MCP` checkbox changes state without saving test data.

### Phase 3: Add OpenRouter Tool-Calling Contracts

- [x] Started: 2026-07-11T23:09:33Z
- [x] Completed: 2026-07-12T00:12:49Z
- [x] Automated verification: Shared third-party OpenRouter suites passed (15 tests); TypeScript and ESLint passed.

**Notes**: Added OpenAI-compatible tools, assistant tool calls, tool-result messages, tool-only success handling, serialized argument preservation, billing, and retry safety.

### Phase 4: Implement MCP Authentication for `rbac.subject`, Client, And Catalog

- [x] Started: 2026-07-11T23:09:33Z
- [x] Completed: 2026-07-12T00:12:49Z
- [x] Automated verification: MCP 41 tests plus RBAC MCP client/catalog/controller suites passed; live exchange/catalog/API call succeeded.

**Notes**: Added protected five-minute `rbac.subject` token exchange, Streamable HTTP MCP client, live tool catalog/schema validation, profile-scoped catalog SDK, time/result bounds, and server-side `rbac.subject` authentication JWT minting. Runtime check found 19 live tools and executed `model-record-count` through `apps.api` as the `rbac.subject` linked to the replying profile.

### Phase 5: Orchestrate The Bounded Social profile Tool Loop

- [x] Started: 2026-07-11T23:09:33Z
- [x] Completed: 2026-07-12T00:12:49Z
- [x] Automated verification: Tool-loop and OpenRouter handler scenarios passed inside the 183-test RBAC suite.

**Notes**: Added a sequential 50-step/five-minute loop with per-tool limits, repeated-call protection, model locking after side effects, local skill/Knowledge tools, MCP dispatch, one-time settlement/session cleanup, final-only chat output, and redacted audit metadata.

### Phase 6: End-To-End Verification And Operational Documentation

- [x] Started: 2026-07-11T23:09:33Z
- [x] Completed: 2026-07-12T00:12:49Z
- [x] Automated verification: All applicable focused Jest, integration, TypeScript, ESLint, Prettier, shell, migration, and diff checks passed; documented unavailable/pre-existing checks below.

**Notes**: Browser verified the real admin form plus the chat sidebar MCP section/editor. Live API/MCP verification confirmed 200 exchange, 300-second Bearer token, 19 tools, and `rbac.subject`-authenticated read-only API execution. The follow-up browser check closed the editor without saving or changing profile data.

### Code Review Revision: Message-Owned AI Reaction Intent

- [x] Completed: 2026-07-13T19:12:32Z
- [x] Automated verification: RBAC 48 suites/196 tests, Agent 8/33, Social 12/27; RBAC and Agent TypeScript builds passed.
- [x] Browser verification: one create message produced reactive backend progress and one MCP-backed final reply; no duplicate appeared after waiting.

**Notes**: Added a typed, versioned RBAC envelope in `social.message.metadata`; removed frontend OpenRouter execution, its client SDK action, reaction refetch callbacks, `aiReactionMode`, and the explicit action-logger skip response. Action logger now provides the single backend launch, Agent targets the persisted AI profile, and OpenRouter derives model/reasoning/skills/Knowledge only from the saved message.

### Code Review Revision: Visible AI Execution Actions

- [x] Completed: 2026-07-13T20:25:50Z
- [x] Automated verification: RBAC 51 suites/211 tests, Social 12/27; RBAC and Social TypeScript builds passed; RBAC full lint and the changed Social action model lint passed.
- [x] Browser verification: one MCP run created one visible running action, updated the same action/run id to completed, returned one final count of 12, and produced no duplicate, sensitive action content, or browser error.

**Notes**: Added transport-neutral tool lifecycle events and a best-effort reporter that lazily creates one `social.action.variant="ai-execution"`, awaits chat/thread/profile relations, and updates the stable action id. The RBAC-owned payload parser strips unknown fields and fails closed; the dedicated memoized timeline row shows safe tool/server labels and rerenders only when that action's `updatedAt` changes. Runs without tools create no execution action, and action persistence failures do not interrupt the final `social.profile` reply.

### Code Review Revision: Human-Readable Provider Failures

- [x] Completed: 2026-07-13T21:35:09Z
- [x] Automated verification: Shared Third Parties, RBAC, and Agent focused suites pass with 66 tests; affected TypeScript checks and changed-file ESLint pass.
- [x] Browser verification: repeating the original products request executed three tools and returned a readable four-product answer without a new `[object Object]` or browser error.

**Notes**: OpenRouter response content now validates unknown runtime JSON, unwraps explicitly supported nested text, and converts unsupported object content into a typed provider error that can trigger model fallback. Terminal model/tool failures use localized actionable text, while Agent fallbacks no longer append internal exception messages to the conversation.

### Code Review Revision: Explicit Knowledge And Reasoning Propagation

- [x] Completed: 2026-07-14T01:17:57+03:00
- [x] Automated verification: RBAC 51 suites/214 tests and RBAC TypeScript passed; focused controller lint, Prettier, and diff checks passed.

**Notes**: Removed implicit Knowledge retrieval from ordinary messages. Only a persisted text mention of `@knowledge` loads profile document relations, searches/reranks chunks, adds RAG system context, or exposes the Knowledge tool. Explicit Thinking effort now reaches Knowledge rerank as well as final/tool generations, and a valid empty rerank selection no longer reintroduces irrelevant fallback chunks.

### Code Review Revision: Transport-Neutral Tool Context

- [x] Completed: 2026-07-14T02:14:00+03:00
- [x] Automated verification: focused OpenRouter controller 30/30 and full RBAC 51 suites/214 tests passed; RBAC TypeScript, focused ESLint, Prettier, and diff checks passed.

**Notes**: Removed the unconditional `Return a text response only.` system instruction and Telegram 4000-character user instruction from the shared OpenRouter context. Tool-enabled web and Telegram turns now receive the same transport-neutral model context; Telegram length handling remains in Notification delivery, which already splits outgoing text into 4000-character chunks.

### Code Review Revision: Thread-Scoped OpenRouter Model

- [x] Completed: 2026-07-14T10:52:54+03:00
- [x] Automated verification: RBAC 53 suites/220 tests and Social 12/27 pass;
      RBAC and Social TypeScript pass; focused ESLint passes; the generated thread
      migration is reproducible and applies to the local database.

**Notes**: Added generic `social.thread.metadata` plus the versioned RBAC
`rbacAiThreadPreferences` contract. The composer persists explicit model
changes through the authorized thread route and restores the saved model on
mount/thread switch. The controller calls the public method on the main
Subject Service, so startup Subject services can override persistence policy.

### Code Review Revision: Realtime Billing Balance Reconciliation

- [x] Completed: 2026-07-14T11:10:53+03:00
- [x] Runtime verification: PostgreSQL billing metadata and the requester
      relation show exact multi-call settlements and the current amount
      `99999997169`.
- [x] Automated verification: Shared Utils 7 suites/53 tests, TypeScript,
      focused ESLint, Prettier, and diff checks pass.

**Notes**: No billing arithmetic or principal change was required. The stale
value came from the AI-reaction RPC's explicit revalidation rule omitting the
RBAC billing-relation topic. The shared rule now invalidates messages, actions,
and `subjects-to-billing-module-currencies` together after settlement.

### Code Review Revision: Canonical SPS Domain Terminology

- [x] Completed: 2026-07-14T17:39:01+03:00
- [x] Automated verification: MCP 8 suites/45 tests, RBAC 53/221, Agent 8/33,
      and Social 12/27 pass; all four affected TypeScript projects, focused
      ESLint, Prettier, diff, and old-name zero-reference checks pass.

**Notes**: Replaced the ambiguous product-role metaphor with the owning SPS
models. `social.profile` now names the visible AI actor, capabilities, and tool
loop; `rbac.subject` names the MCP/API execution principal; and
`rbacSubjectAuthenticationJwt` names its server-minted credential. The internal
exchange route/client now use `rbac-subject`, and action/audit metadata names
requester subject, reply subject, and reply profile independently.

### Code Review Revision: Startup-Overridable Subject Service Composition

- [x] Completed: 2026-07-14
- [x] Automated verification: full RBAC Jest passes 54 suites/225 tests and
      RBAC TypeScript passes after the domain-service move.
- [x] Browser verification: after restarting MCP HTTP, API, and host, new
      thread `MCP Knowledge Skills` completed one MCP count (`12`), one
      explicit `@knowledge` answer, and one `/youtube-description-1` answer
      without request errors or duplicate results.

**Notes**: Moved issue-specific Subject services into `billing`,
`social-module/chat`, `social-module/profile/ai`, and
`social-module/profile/mcp`. The main Subject Service now exposes the MCP
catalog, tool loop, action reporter, and OpenRouter billing operations used by
controllers, with protected default factories and startup override coverage.
The OpenRouter controller has no relative service imports or direct domain
service construction. Legacy persisted `replyProfileId` request metadata is
normalized to `replySocialProfileId` after restart.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 14 -->

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
- **Result**: Browser verification found one `Allowed MCP servers` region and one `SinglePageStartup MCP` checkbox; the checkbox toggled successfully.

### Incident 4 — Social sidebar test crossed the server-only avatar boundary

- **Occurrences**: 1
- **Symptom**: The Social sidebar suite failed before test execution because its Client Component dependency chain imported the server-backed profile avatar boundary.
- **Root cause**: The unit test did not isolate the avatar dependency although avatar loading is outside the sidebar behavior under test.
- **Fix**: Mocked the profile avatar boundary in the sidebar test.
- **Result**: Full Social Jest passes: 11 suites, 26 tests.

### Incident 5 — Chat-local profile update discarded MCP configuration

- **Occurrences**: 1
- **Symptom**: The AI profile could be inspected from chat, but its MCP server
  could only be configured in Admin; adding a sidebar editor alone would have
  shown a successful save while leaving `allowedMcpServerIds` unchanged.
- **Root cause**: The chat-local profile update handler whitelisted only title,
  subtitle, description, and admin title fields.
- **Fix**: Added an MCP section and editor to the chat profile sidebar, extended
  the update handler with supported-identifier validation, and renamed the
  built-in server identifier to `singlepagestartup`.
- **Result**: The conversation sidebar can persist SinglePageStartup MCP access
  on the selected AI profile through the authorized chat-local route.

### Incident 6 — Agent fallback found multiple default-variant threads

- **Occurrences**: 1
- **Symptom**: A successful MCP request also logged `Requested social-module chat has multiple default threads` from the agent endpoint.
- **Root cause**: The agent resolver normalized the whole chat before reading the concrete message relation, and that fallback treated the display value `variant = "default"` as a unique semantic thread even though every ordinary UI thread receives it. A second, action-logger-triggered agent run exposed the failure after the web composer had already invoked OpenRouter explicitly.
- **Fix**: The thread-aware route now propagates its authoritative thread id; the resolver validates or restores that exact message relation before legacy normalization. Lifecycle fallbacks use deterministic relation order/chronology instead of `variant`, and the web UI no longer derives a primary thread from the display variant. Incident 9 subsequently removed the redundant frontend reaction path entirely.
- **Result**: Multiple ordinary `default`-variant threads are accepted, the current message stays in its route thread, and one web submission produces one AI reaction. Agent, Social, and focused/full RBAC regression suites cover the repaired paths.

### Incident 7 — New thread loaded KV from the API cwd and queried skills for the requester

- **Occurrences**: 1
- **Symptom**: Opening the newly created Ecommerce thread produced repeated model-favorites 500 responses and one AI-profile skills 401.
- **Root cause**: The favorites controller built `libs/providers/kv` from `process.cwd()`, which is `apps/api` under `api:dev`. The composer also used its ordinary requester profile as a temporary skills target before resolving the AI opponent.
- **Fix**: Replaced the cwd-relative dynamic import with `@sps/providers-kv`; disabled the skills query and used `missing-profile` until the AI assistant id is resolved.
- **Result**: BDD regressions pass, the workspace alias resolves from `apps/api`, and a live reload of the Ecommerce thread has no `model-favorites`, `/skills`, or HTTP 500 browser errors.

### Incident 8 — Custom explicit-reaction header prevented browser message creation

- **Occurrences**: 1
- **Symptom**: Clicking Send in Ecommerce showed two `Failed to fetch` toasts and left the thread empty.
- **Root cause**: `X-SPS-AI-REACTION-MODE` forced a CORS preflight for the multipart message POST, but the API did not allow that custom request header.
- **Fix**: Replaced the header with `?aiReactionMode=explicit`; successful message creation still responds with `X-SPS-SKIP-ACTION-LOGGER` to prevent duplicate AI dispatch.
- **Result**: The browser created the first thread message and the `social.profile` returned the live MCP-backed count: 12 records for `ecommerce/attribute`.
- **Superseded by**: Incident 9 removed this temporary query/response-marker coordination.

### Incident 9 — AI reaction intent lived in a second frontend request

- **Occurrences**: 1
- **Symptom**: The composer created a social message and then issued a second OpenRouter mutation; model, reasoning, skills, and Knowledge settings were absent from the persisted trigger message.
- **Root cause**: The frontend was coordinating backend execution, while action logging independently provided the canonical message-created trigger. Avoiding duplicate launches therefore depended on transport-only markers.
- **Fix**: Added the versioned RBAC `rbacAiReactionRequest` contract inside generic message metadata. The one frontend create mutation persists model, reasoning, Skill, and Knowledge settings. Agent selects reply profiles from chat membership, and OpenRouter reads answer parameters from the message while validating each Agent-selected profile. Removed the frontend reaction action/export, query marker, explicit skip response, reaction refetch, and shell callback.
- **Result**: Browser showed action/status rows and one final MCP answer through WebSocket reactivity. The unique response stayed singular after waiting. RBAC passes 48 suites/196 tests, Agent 8/33, Social 12/27, and RBAC/Agent TypeScript builds pass.

### Incident 10 — Selected model was reset after page reload

- **Occurrences**: 1
- **Symptom**: A thread answered with the previously selected Minimax model,
  but after reloading the page both controls showed `Auto` and the next answer
  could use automatic routing.
- **Root cause**: The model selector existed only in React state and the mounted
  chat shell deliberately reset that state on every chat/thread transition.
- **Fix**: Added typed thread-scoped RBAC preferences in generic thread
  metadata, saved selector changes through the authorized thread route and the
  main Subject Service, and restored the preference from the active thread.
- **Result**: Model choice is isolated per thread, survives reload, preserves
  unrelated metadata, and can be overridden by a startup Subject Service.

### Incident 11 — Open billing relation did not refresh after AI settlement

- **Occurrences**: 1
- **Symptom**: The UI kept showing `99999997170`, suggesting that OpenRouter
  requests were not debited.
- **Root cause**: PostgreSQL had applied the exact charges, but the
  `react-by/openrouter` topic rule did not announce the RBAC billing relation.
- **Fix**: Added `rbac.subjects-to-billing-module-currencies` to the shared
  action rule consumed by WebSocket revalidation and HTTP-cache versioning.
- **Result**: Open billing-relation queries now refetch when an AI turn finishes;
  the persisted billing ledger and settlement logic remain unchanged.

### Incident 12 — MCP environment variables used inconsistent namespaces

- **Occurrences**: 1
- **Symptom**: MCP bind, OAuth, connector, and API-client configuration used
  unrelated prefixes plus a project-specific internal URL name.
- **Root cause**: Configuration grew feature-by-feature without applying the
  repository's application-service naming convention or distinguishing bind,
  internal, and public addresses.
- **Fix**: Migrated runtime, local env, deployment, workflows, tests, and docs
  to `MCP_SERVICE_*`. `MCP_SERVICE_URL` is the API's internal endpoint,
  `MCP_SERVICE_HTTP_HOST`/`PORT` bind the server, and
  `MCP_SERVICE_PUBLIC_BASE_URL`/`PUBLIC_URL` describe its external OAuth
  resource.
- **Result**: Zero old MCP env references remain outside generated caches;
  OAuth passes 12 tests, the RBAC MCP client passes 6, TypeScript/lint/shell/
  format/diff checks pass, and current local env values were preserved.

### Incident 13 — Runtime terminology did not map to SPS models

- **Occurrences**: 1
- **Symptom**: The same invented role term referred to both the replying
  `social.profile` and its linked execution `rbac.subject`; JWT variables used
  a vague repository-wide suffix.
- **Root cause**: Product-role language leaked into domain interfaces and hid
  which model owned behavior, credentials, and authorization.
- **Fix**: Renamed the profile/tool-loop contour to `socialProfile*`, the
  execution/auth contour to `rbacSubject*`, the JWT to
  `rbacSubjectAuthenticationJwt`, and the internal MCP exchange to
  `rbac-subject` terminology across runtime, tests, and artifacts.
- **Result**: The execution path now distinguishes requester `rbac.subject`,
  reply `rbac.subject`, and reply `social.profile` explicitly.

### Incident 14 — Profile AI code bypassed the startup Subject service

- **Occurrences**: 1
- **Symptom**: The OpenRouter controller imported implementation files through
  relative paths and constructed replaceable profile MCP/AI services itself.
- **Root cause**: New helpers were added to a flat service directory without
  becoming public domain operations of the main `rbac.subject` service.
- **Fix**: Organized the implementations into domain directories, exposed
  controller-facing operations and protected factories on the main service,
  and added startup override plus legacy message-metadata compatibility BDDs.
- **Result**: RBAC passes 54 suites/225 tests and TypeScript; controllers now
  receive child-project overrides through the normal startup service binding.
  A post-restart Browser run completed MCP, Knowledge, and skill scenarios in
  one newly created thread without the previous token-exchange 404.

### Incident 15 — TXT transcript disappeared behind a slash-skill mention

- **Occurrences**: 1
- **Symptom**: `/youtube-description-1` plus a TXT transcript reached the
  automatic classifier as an empty request and failed before final generation.
- **Root cause**: Skill sanitization made the visible description empty, and
  the thread-context loop skipped that message before loading its file
  relations. Text files were otherwise sent as local `file_url` inputs.
- **Fix**: Load attachments first, extract supported textual files on the API,
  use a bounded prefix for routing, and keep the complete transcript in final
  text context. Binary and image inputs retain multimodal handling.
- **Result**: Full RBAC passes 54 suites/226 tests, RBAC TypeScript and
  changed-file lint/format checks pass, and a live replay of message `7fe01e22`
  created a transcript-grounded description in thread `dbd5a965` with Russian
  `summarize` classification.

### Incident 16 — Final generation must receive provider-valid original files

- **Occurrences**: 2
- **Symptom**: The attachment-routing repair passed transcript text to final
  generation instead of the original files, and the shared fallback could
  retry without attachments.
- **Root cause**: One normalized context served both model routing and final
  generation; local media URLs were not guaranteed to be reachable by
  OpenRouter. The first live external replay also showed that MIME response
  parameters such as `charset=utf-8` made the generated Base64 file data URL
  invalid for OpenRouter.
- **Fix**: Preserve ordered original TXT/image parts for generation, use
  extracted text only in routing, inline files/private images as Base64, and
  disable attachment-stripping retries on the reaction path. Normalize MIME
  values to the media type before constructing Base64 data URLs.
- **Result**: 45 focused tests plus affected TypeScript/ESLint pass. Live
  message `a7ffe162-833c-4c71-9bfe-977d069851fe` has three ordered,
  byte-identical file relations and Browser-visible two text-file links plus
  the JPEG. Canonical execution created reply
  `481eaee0-cca7-40cb-af42-05607325cd40` with the requested facts from both
  text files and the cat's visual attributes from the image.

### Incident 17 — Composer must accumulate sequential file selections

- **Occurrences**: 1
- **Symptom**: A second picker operation replaced the first selected file; two
  different files named `content.txt` therefore appeared as one pill.
- **Root cause**: The file-input handler overwrote form `files` with the latest
  `FileList`.
- **Fix**: Merge new `File` objects into the existing form array and clear the
  native input value after every change. Duplicate filenames remain separate.
- **Result**: The focused composer suite passes 36/36 tests with an explicit
  sequential same-name scenario; RBAC TypeScript/ESLint and Browser form smoke
  checks pass.

### Incident 18 — Telegram `/learn` diverged from web Knowledge controls

- **Occurrences**: every raw Telegram `/learn` message
- **Symptom**: Web chat inserted `@knowledge /learn`, while Telegram persisted
  `/learn` without the explicit Knowledge opt-in required by the shared handler.
- **Root cause**: The Telegram adapter did not normalize Telegram-native
  command/addressing forms before Social message ingestion.
- **Fix**: Map private `/learn`, group `/learn@<bot-username>`, and group
  `@<bot-username> /learn` to canonical `@knowledge /learn`; preserve explicit
  `@knowledge` queries after stripping the group bot mention.
- **Result**: Both channels execute one RBAC/OpenRouter Knowledge path; Telegram
  owns no separate learning or retrieval implementation.

### Incident 19 — Successful `/learn` was hidden by a sidebar authorization error

- **Occurrences**: 1 live Telegram execution
- **Symptom**: The AI confirmed one learned item, but the already-open profile
  sidebar remained at `KNOWLEDGE 0`, including after reload.
- **Root cause**: The document and profile relation existed and were indexed.
  The composite RBAC query subscribed to a nonexistent `social.documents`
  topic, the reaction omitted Knowledge topics, and the chat-scoped Knowledge
  route had no `rbac.permission`. Its HTTP 403 was rendered as an empty list.
- **Fix**: Map profile Knowledge reads and the AI reaction to the actual
  `social.profiles-to-knowledge-module-documents` and `knowledge.documents`
  topics, resolve those framework rules in both client SDK queries, and render
  a readable access error instead of a false zero. The remaining role-scoped
  permission mutation requires explicit security approval before application.
- **Result**: Focused topic/middleware suites pass 15/15 and the Social suite
  passes 13 suites/30 tests. The approved profile-specific Knowledge role is
  now assigned to the Telegram owner, and the tunneled API returns the learned
  document with HTTP 200. The in-app Browser sidebar assertion remains pending
  because its URL policy blocked post-restart tunnel navigation; `/learn`, the
  indexed relation, and RBAC authorization are otherwise verified.

### Incident 20 — `/knowledge` and formula output are now cross-channel safe

- **Symptom**: `@knowledge` was ambiguous in Telegram and model LaTeX appeared
  as raw commands in Telegram and the web chat.
- **Fix**: Publish `/knowledge` from the startup-overridable Agent registry,
  support both Knowledge controls in the canonical OpenRouter handler, strip
  them before model/skill input, and normalize generated LaTeX to portable
  Markdown/Unicode before persistence. Previously stored messages remain
  unchanged.
- **Verification**: Focused OpenRouter tests cover normalization before
  persistence, and frontend tests confirm that rendering remains a presentation
  concern without rewriting stored legacy text. API/Telegram/host restarted
  cleanly and Telegram command publication completed without a startup error.

### Incident 21 — Telegram background errors now produce a user-visible reply

- **Symptom**: Background ingestion failures were logged after webhook
  acknowledgement, leaving the Telegram user with no response.
- **Fix**: Incoming background tasks now share a wrapper that retains full
  server logging and sends a localized generic error to the original Telegram
  topic without exposing technical details. It covers text, voice, audio,
  media groups, forum-topic bootstrap, and deferred `/learn` persistence.
- **Verification**: Telegram Jest passes 12/12; targeted TypeScript, ESLint, and
  diff checks pass. The BDD case confirms thread id preservation and technical
  error redaction.

### Incident 22 — Web actions now dispatch independently of API origin

- **Symptom**: Telegram AI replies worked, while identical frontend messages
  produced RBAC actions but no Agent dispatch.
- **Cause**: Telegram's internal API origin matched the configured URL and was
  stripped; the frontend tunnel origin remained in `payload.route`, so Agent's
  pathname templates returned `data: false`.
- **Fix**: Action Logger persists canonical request pathnames and Agent
  defensively normalizes legacy absolute action URLs through the shared
  `normalizeRoutePath` utility. Relative paths are handled directly; absolute
  URLs use their real origin only, with no placeholder internal domain.
- **Verification**: Shared route Jest passes 15/15, Agent route Jest passes 8/8,
  including the exact tunnel URL; three targeted TypeScript checks, scoped
  ESLint, and diff checks pass.

### Incident 23 — Telegram title generation now uses the current lightweight model

- **Symptom**: A bounded three-word JSON title call still used the older,
  general-purpose `google/gemini-2.5-flash` model.
- **Fix**: Replaced it with `google/gemini-3.1-flash-lite`; retained the same
  prompt, structured response, 20-token cap, sanitizer, and deterministic
  fallback. MiniMax M3 was rejected for this call because its strongest current
  benchmarks measure agentic/coding work rather than short structured text.
- **Verification**: Focused RBAC Telegram bootstrap Jest passes 8/8 and asserts
  the new model id.

### Incident 24 — Production Telegram startup now uses runtime `.env` and self-recovers

- **Symptom**: Docker startup attempted to read a nonexistent Telegram
  `.env.production`, and one API/Telegram connection refusal permanently
  skipped `setMyCommands` and webhook installation for that process.
- **Fix**: Server deployment bootstrap now writes API, Telegram, and MCP `.env`
  files directly from the injected process environment with mode `600`; only
  the Next.js host retains its optional build-time `.env.production` merge.
  Telegram serves first, retries startup synchronization with bounded backoff,
  and redacts bot credentials from errors.
- **Verification**: Isolated Telegram env bootstrap passes; Telegram BDD tests
  pass 14/14; Telegram TypeScript, scoped ESLint, and Bun build pass. Broad API
  TypeScript remains blocked by pre-existing unrelated errors.

## Summary

### Changes Made

- Consolidated all AI reactions into `react-by/openrouter` and removed the legacy Knowledge route surface.
- Added profile-scoped MCP server configuration and UI for the built-in SinglePageStartup MCP.
- Added chat-sidebar MCP management and the stable `singlepagestartup` local
  server identifier.
- Added OpenRouter tool-call protocol support and a bounded `social.profile` tool loop.
- Added visible, safe, in-place AI execution actions for skill, Knowledge, and MCP work.
- Added `rbac.subject` authentication JWT exchange, MCP client/catalog/SDK, RBAC identity separation, deployment env wiring, audit metadata, tests, migration, and documentation.
- Made chat thread resolution relation-driven and deterministic, and prevented duplicate web AI dispatch through the generic action logger.
- Made message creation the only frontend mutation for an AI turn; the persisted message now owns model, reasoning, skills, and Knowledge settings, chat membership owns reply recipients, and action logger is the single backend launch path.
- Persisted the explicitly selected OpenRouter model per thread through a
  typed, startup-overridable Subject Service contract.
- Added realtime reconciliation for the requester's billing relation after
  OpenRouter settlement.
- Standardized all MCP configuration under `MCP_SERVICE_*` while keeping
  internal, bind, and public endpoint semantics explicit.
- Standardized AI/MCP identities on `social.profile` and `rbac.subject`, with
  `rbacSubjectAuthenticationJwt` as the authentication credential name.
- Routed profile MCP, AI tool-loop, execution-action, and OpenRouter billing
  behavior through the startup-overridable main Subject Service and organized
  their defaults by SPS domain.
- Made skill-only turns route from extracted TXT/transcript text while final
  generation receives the ordered original files and images as inline provider
  inputs without a silent attachment-stripping retry.
- Normalized Telegram-native `/learn` and group bot-addressing forms into the
  same explicit `@knowledge` controls persisted by the web composer.
- Reconciled learned Knowledge documents into the open profile sidebar through
  shared relation/document realtime topics.
- Replaced `is-authorized` loopback Permission and roles-to-permissions API
  reads with injected startup services and filtered repository-backed `find`
  calls.
- Added idempotent profile-specific Knowledge owner provisioning through the
  existing role, permission, roles-to-permissions, and subjects-to-roles
  models. Telegram personal AI bootstrap now invokes it through the main
  startup-overridable Subject Service.
- Removed the redundant requester-profile-to-chat membership check from the
  existing chat-agent management middleware while retaining subject ownership,
  target AI chat membership, agent ownership, exact document links, and RBAC.
  The actual Browser subject `303302a0-4eb7-4cef-af04-74d7e8e72442` still needs
  an explicitly approved profile Knowledge grant before final sidebar proof.
- Published the startup-overridden Agent command registry to Telegram on every
  bot start. Agent now supplies validated menu descriptions through its server
  SDK, while `apps/telegram` authenticates with the internal RBAC service key
  and calls `setMyCommands` before installing the webhook; BotFather no longer
  needs to duplicate `/learn` or other Agent commands.
- Added `/knowledge` as the Telegram-native, startup-overridable Knowledge
  control and made AI formulas readable in both Telegram and web by persisting
  portable Markdown/Unicode instead of raw LaTeX for new responses.
- Added presentation-safe Telegram error replies for failures in detached
  incoming-message work, including media groups and deferred `/learn` chunks;
  technical details remain server-only and replies preserve the original topic.
- Made Action Logger and Agent routing origin-independent: new actions persist
  canonical API pathnames and legacy absolute tunnel URLs are normalized before
  message/action dispatch.

### Pull Request

- [x] PR created: https://github.com/singlepagestartup/singlepagestartup/pull/206
- [x] PR number: 206
- [x] GitHub Project status: Code Review

### Final Status

- [x] All phases completed
- [x] All applicable automated verification passed; repository gaps are recorded above
- [ ] Issue marked as Done

---

**Last updated**: 2026-07-16T01:01:35+03:00
