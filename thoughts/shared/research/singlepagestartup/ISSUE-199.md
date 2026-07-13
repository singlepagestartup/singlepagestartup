---
date: 2026-07-06T11:18:36+0300
researcher: flakecode
git_commit: 9d0db6fb399543b781f3c5e52854790b92dcb1b0
branch: main
repository: singlepagestartup
topic: "Add OpenRouter tool calling with authenticated MCP execution"
tags: [research, codebase, openrouter, mcp, rbac, social, tool-calling, oauth, billing]
status: complete
last_updated: 2026-07-06
last_updated_by: flakecode
---

# Research: Add OpenRouter Tool Calling With Authenticated MCP Execution

**Date**: 2026-07-06T11:18:36+0300
**Researcher**: flakecode
**Git Commit**: 9d0db6fb399543b781f3c5e52854790b92dcb1b0
**Branch**: main
**Repository**: singlepagestartup

## Research Question

Issue #199 requires an authenticated tool loop in `react-by/openrouter`: send OpenRouter-compatible tool definitions, execute model tool calls through the existing MCP server as the sender `rbac.subject` (via an internal short-lived MCP access token backed by the sender's SPS JWT, not `X-RBAC-SECRET-KEY`), feed tool results back to the model, and keep the final assistant message authored by the replying AI `social.profile`. This research documents every existing surface the feature touches: the OpenRouter wrapper, the `react-by/openrouter` reply pipeline, the MCP server tool surface and its OAuth/auth-forwarding stack, RBAC subject JWT mechanics, the `@knowledge` pipeline, and message/action metadata storage.

## Summary

- The OpenRouter wrapper (`libs/shared/third-parties/src/lib/open-router/index.ts`) has **no tool-calling surface**: the request body never includes `tools`/`tool_choice`/`parallel_tool_calls`, the message role union is `"user" | "assistant" | "system"` (no `"tool"` role, no `tool_call_id`), and the response parser reads only `message.content`/`message.images`, ignoring `tool_calls`. The model catalog metadata already lists `"tools"` and `"parallel_tool_calls"` in `supported_parameters`, but this is descriptive only.
- The `react-by/openrouter` controller (`react-by-openrouter.ts`, 3839 lines) is a single-shot generate pipeline: assemble context (profile system message, thread history, skills as message-prefix, optional Knowledge RAG + rerank) → select model (manual or classifier-driven auto) → one `generate()` call with one fallback-candidate retry → create the assistant message. Every OpenRouter call is recorded in an in-memory `billingLedger` with typed purposes and settled exactly once against the caller's balance.
- Two identities already coexist in the flow: the route-level caller (sender-side subject) and a **server-minted `replyByJwt`** — the controller resolves the AI profile's backing `rbac.subject` and signs a short-lived SPS JWT for it (`react-by-openrouter.ts:1177-1193`), then authors all status/reply messages as the AI profile. This is the existing in-repo precedent for the "sign a short-lived SPS JWT for a resolved subject" operation the issue requires for the _sender_.
- The MCP server's live tool surface is **19 generic hand-written tools** in `apps/mcp/content-management.ts` (discovery/schema, model CRUD, relation CRUD, host page graph) with zod input schemas, `dryRun: true` defaults on writes, and preview/apply with `confirmationToken` for deletes. Legacy per-module generated registrars under `apps/mcp/<module>/` are orphaned (not imported). There is no per-session/per-scope tool subsetting: every authenticated caller sees all 19 tools.
- MCP `/mcp` auth already resolves a Bearer MCP access token back to the stored **sender SPS JWT** and forwards it on every outgoing API `fetch` (AsyncLocalStorage context + patched `globalThis.fetch`), so MCP tools execute RBAC-enforced as that subject. What does not exist yet is an **internal token issuer**: `apps/mcp/lib/oauth.ts` only mints access tokens inside the HTTP OAuth grant handlers (`issueTokenResponse`, always paired with a refresh token); there is no `issueMcpAccessTokenForSpsJwt`-style function callable from backend code.
- `social.message` rows have open JSONB `metadata` and `interaction` columns; the OpenRouter reply already persists `metadata.knowledge.*` and `metadata.openRouter.billing`. `social.action` has a JSONB `payload` with chat/thread/profile join tables but is client-driven — neither reply handler writes actions today.

## Detailed Findings

### 1. OpenRouter wrapper — current request/response surface (no tools)

- `IOpenRouterRequestMessage` role union is `"user" | "assistant" | "system"`; content is a string or text/image/file parts (`libs/shared/third-parties/src/lib/open-router/index.ts:29-32`, `12-27`).
- `requestCompletion(...)` POSTs to `https://openrouter.ai/api/v1/chat/completions` with only `model, messages, stream: false, max_tokens, reasoning?, response_format?, temperature?` (`index.ts:231-269`). No `tools`, `tool_choice`, or `parallel_tool_calls` fields exist anywhere in the wrapper.
- `parseMessage(...)` extracts `text` and `images` from `choices[0].message`; `tool_calls` on the response message is never read (`index.ts:271-312`).
- `generate(...)` orchestrates normalize → request → error retry (single retry stripping non-text content when `stripNonTextOnRetry`, default true) → success/error result with billing (`index.ts:547-626`, retry at `576-612`).
- `getModels()` caches the OpenRouter `/models` catalog for 5 minutes (`index.ts:628-660`); `IOpenRouterModel.supported_parameters` includes the literal values `"tools"` and `"parallel_tool_calls"` (`interface.ts:117-140`) — catalog metadata only, never used to build requests.
- No fetch timeout/AbortController exists in the wrapper's requests.
- Billing: `buildBilling(...)` normalizes `usage`, prices tokens against catalog pricing, falls back to provider-reported cost (`index.ts:418-506`); success/error results embed `IOpenRouterBilling` (`interface.ts:45-54`).
- Existing wrapper tests: `libs/shared/third-parties/src/lib/open-router/index.spec.ts`.

### 2. `react-by/openrouter` reply pipeline

**Route & trigger.**

- Route: `POST /:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/messages/:socialModuleMessageId/react-by/openrouter` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:472-477`).
- Upstream trigger: the agent service `agentSocialModuleProfileHandler` calls `openRouterReplyMessageCreate` when the reply profile slug is `"open-router"` or a knowledge-chat profile matches (`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:240-423`, call at `:369`/`:413`, method at `:1719-2034`). It resolves the sender's linked `rbacModuleSubject`, signs a JWT for it, and calls the RBAC subject SDK route (`index.ts:1905`).

**Identity resolution (controller `Handler.execute`, `react-by-openrouter.ts:826`).**

- Route params read at `react-by-openrouter.ts:842-864`: `:id` = calling RBAC subject; `:socialModuleProfileId` = sender profile; plus chat and trigger message ids.
- Reply AI profile: `data.shouldReplySocialModuleProfile.id` → `loadReplyBySocialModuleProfile` (`react-by-openrouter.ts:949-950`, `1599-1611`).
- Reply AI's backing subject: `subjectsToSocialModuleProfiles.find({ socialModuleProfileId })` → `this.service.findById({ id: subjectId })` → `replyBySubject` (`react-by-openrouter.ts:1156-1183`).
- **Server-minted JWT precedent**: `replyByJwt = await jwt.sign({ exp: now + RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS, iat, subject: replyBySubject }, RBAC_JWT_SECRET)` (`react-by-openrouter.ts:1185-1193`), used as `Authorization: Bearer` on all status/reply message writes (e.g. `1218-1233`, `1408-1426`, `1519-1545`).

**Context assembly.**

- Thread resolution: `resolveThreadIdForMessageInChat` (`react-by-openrouter.ts:2697-2802`), attaching to the chat default thread if unlinked.
- History: `findThreadMessageIdsInChat` paginates `threadsToMessages` 100/page (`THREAD_CONTEXT_PAGE_SIZE`, `react-by-openrouter.ts:333`, `737-824`); messages iterated ascending, `/new` resets context, progress/learn-marker messages filtered, role = `"assistant"` when `profilesToMessages` ties the message to the reply profile (`1021-1151`); file attachments become `image_url`/`file_url` parts (`1106-1132`).
- Profile persona: `toProfileSystemMessage` builds a `role: "system"` message from the reply profile's localized fields (`react-by-openrouter.ts:2838-2873`).
- Skills: `resolveOpenRouterKnowledgeContext` → `findPromptSkillsForProfile` (explicit `skillIds` or `/slug` mentions, constrained to `profilesToSkills`, non-archived) (`react-by-openrouter.ts:1990-2110`); rendered by `toSkillMessagePrefix` and prepended to the latest user message (`2112`, `2137`), recorded as `mode: "message-prefix-instruction"` (`1506`).
- Knowledge/RAG: `@knowledge` mention or `data.useKnowledgeSearch` gates search (`hasKnowledgeMention`, `react-by-openrouter.ts:1626-1628`, checked `936-938`); profile-scoped document ids (`findKnowledgeDocumentIdsForProfile`, `1912`); `knowledgeService.search({ topK: 30, neighborWindow: 1 })` (`1701-1706`, constants `335-336`); `rerankKnowledgeSources` uses the selected generation model with `purpose: "knowledge_rerank"`, json_schema response format, `temperature: 0`, `max_tokens: 800`, top 12 (`1756-1839`, `KNOWLEDGE_RERANK_TOP_K` at `337`); selected sources become a system prompt (`toKnowledgeSystemPrompt`, `2209-2236`).
- Final message list: `buildGenerationContext` (`react-by-openrouter.ts:2875-2934`) — language instruction, output-modality instruction, profile system message, knowledge system messages, a Telegram 4000-char instruction, then conversation context.

**Model/reasoning/token selection.**

- `parseReactionQuery` reads `?model=` (default `"auto"`) and `?reasoning=` (`auto|none|low|medium|high|xhigh`) (`react-by-openrouter.ts:1579-1597`).
- Manual: `resolveManualOpenRouterModel` validates the id and modality support (`1260-1278`).
- Auto: `classifyRequest` uses `CLASSIFIER`-class models from static `MODEL_ROUTER_CONFIG` (`139-307`) with json_schema output, falling back through chat-class models to a regex heuristic (`3335-3567`); `resolveModelClass` maps to `CHAT|CODER|VISION|IMAGE` (`3570-3594`); `selectModelCandidatesForRequest` LLM-selects among candidates with one repair pass and priority fallback (`3121-3236`).
- Reasoning mapping: `toOpenRouterReasoning` — `"auto"` → undefined, else `{ effort, exclude: true }` (`2536-2547`).
- `OPEN_ROUTER_FINAL_TEXT_MAX_TOKENS = 8192` applied only for text output (`334`, `653-656`).

**Generation & fallback.**

- `generateFinalOpenRouterReply` (`react-by-openrouter.ts:631-735`): primary model then exactly one fallback candidate on error/validation failure; all calls go through `generateWithBillingLedger` (`446-490`), the sole `openRouter.generate(...)` call site (`469-477`).

**Assistant message creation (identity separation).**

- Status message lifecycle: created at start, updated per model attempt, deleted before the final reply (`react-by-openrouter.ts:1217-1248`, `1407-1426`, `1519-1529`).
- Reply persisted via `api.socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageCreate({ id: replyBySubject.id, socialModuleProfileId: replyBySocialModuleProfile.id, ..., options: { headers: { Authorization: Bearer replyByJwt } } })` (`1531-1545`).
- `create.ts` creates the `social.message` row and links chat/thread/profile — sender profile of the reply is the **AI profile** (`.../message/create.ts:132-278`, profile link at `268-278`).
- `buildOpenRouterReplyMessageData` (`535-595`): text replies get a `__model-id__` footer (`583`); metadata merges `{ knowledge: {...}, openRouter: { billing: {...} } }` (`584-592`, knowledge block at `1486-1516`).

**No tool calling exists.** Grep across `react-by-openrouter.ts`, `libs/modules/agent`, and the wrapper for `tool_calls` / `tool_choice` / `role: "tool"` / MCP invocation returns only the descriptive `supported_parameters` literals (`interface.ts:118,135`). Neither reply endpoint calls MCP.

### 3. Billing ledger and purposes

- `TOpenRouterBillingPurpose = "classification" | "classification_repair" | "knowledge_rerank" | "model_selection" | "model_selection_repair" | "generation"` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/open-router-billing.ts:7-13`).
- Ledger entries `{ purpose, modelId, status, billing, fallbackReason?, error? }` accumulate in-memory (`react-by-openrouter.ts:446-490`); `summarizeOpenRouterBilling` converts total USD to internal tokens (`OPEN_ROUTER_INTERNAL_TOKEN_USD = 0.001`; `open-router-billing.ts:4, 50-64, 74-112`).
- Settlement: `billRouteSettle` (`react-by-openrouter.ts:505-533`, delegate at `service/singlepage/index.ts:278`) → `bill-route.ts` `Service.settle()` reconciles the 1-token precharge against exact cost on the caller's `subjectsToBillingModuleCurrencies` balance (`bill-route.ts:269-290, 336-392`). Settlement runs exactly once (success, no-valid-response, or catch) guarded by `billingSettled` (`react-by-openrouter.ts:829, 1433-1444, 1472-1479, 1554-1572`).
- `isOpenRouterBillingRoute` relaxes the precharge balance gate specifically for `/react-by/openrouter` (`open-router-billing.ts:46-48`, used at `bill-route.ts:232-234`).

### 4. MCP server tool surface

- Both entrypoints call `createMcpServer()` (`apps/mcp/actions.ts:7-17`): stdio (`apps/mcp/index.ts`) and Streamable HTTP (`apps/mcp/http.ts`). Only `content-management` resources/tools are registered; per-module registrars under `apps/mcp/<module>/index.ts` and `apps/mcp/documentation.ts` are orphaned (not imported anywhere) after commit "Replace generated MCP tools with compact content surface".
- **19 tools** in `apps/mcp/content-management.ts:97-469`:
  - Discovery: `module-list` (`:98`), `model-schema` (`:109`), `relation-schema` (`:122`) (+ `sps://modules` resource `:71-93`).
  - Model CRUD: `model-record-count|find|get|create|update|delete-preview|delete-apply` (`:134-256`).
  - Relation CRUD: same seven verbs (`:258-380`).
  - Host graph: `page-preview` (`:382`), `page-localized-field-update` (`:400`).
- Registration API: `mcp.registerTool(name, { title, description, inputSchema: ZodObject.shape }, withAuth(handler))`; schemas in `apps/mcp/lib/content-management/schemas.ts` (e.g. `dryRun: z.boolean().default(true)` at `:118-121`).
- Entity registry is discovered at runtime from `libs/modules/*/{models,relations}/*` having both `sdk/model` and `sdk/server` entries (`apps/mcp/lib/content-management/registry.ts:88-93, 114-163`); descriptors are dynamic-imported (`registry.ts:365-410`); every entity currently gets all six `defaultOperations` (`registry.ts:15-22, 110`) — the `requireOperation` gate exists (`operations.ts:102-111`) but nothing narrows it per entity.
- Guardrails present: `dryRun` default-true on create/update (`operations.ts:763-827`); delete split into preview (returns deterministic `confirmationToken` = `kind:module:name:id`, `operations.ts:52-57, 829-860`) and apply (requires `confirm: true` + matching token, `operations.ts:862-893`).
- **Absent**: per-session/scope/role tool subsetting — `createHttpSession()` always serves the same 19 tools regardless of `scopes`/`clientId` (`apps/mcp/http.ts:151-175`); no allowlist config file.
- Execution path: tool handler → `getMcpAuthHeaders(extra)` (`apps/mcp/lib/auth.ts:84-136`) → operations → `descriptor.api.<verb>({ options: { headers } })` → SDK `factory()` (`libs/shared/frontend/server/api/src/lib/factory/index.ts:37-131`) → shared action `fetch(`${host}${route}`)` with the auth headers spread in and a 600s `AbortSignal.timeout` (`libs/shared/frontend/api/src/lib/actions/find/index.ts:37-54`).
- Result shape: `{ content: [{ type: "text", text: JSON.stringify(envelope) }] }` where envelope is `{ ok: true, type, data, meta? }` or `{ ok: false, error: { kind, message, details? } }` (`apps/mcp/lib/content-management/response.ts:3-64`, types at `types.ts:154-168`); `withAuth` converts thrown errors to error envelopes (`content-management.ts:60-68`).
- Tool-list spec pins the 19 names and asserts legacy names are gone (`apps/mcp/content-management.spec.ts:33-74`).

### 5. MCP auth: OAuth store, `/mcp` gate, auth forwarding

- OAuth store records: `IAccessTokenRecord { jti, clientId, subject, scope, spsJwt, expiresAt }` plus code/refresh/client records; Memory or Redis store selected by `MCP_OAUTH_STORE`/`KV_PROVIDER` (`apps/mcp/lib/oauth.ts:36-52, 83-204, 782-804`).
- Token issuing happens only inside `issueTokenResponse` (`oauth.ts:581-640`): signs a JWT `{ sub, aud: getMcpPublicUrl(), iss, scope, client_id, jti }` with `getMcpJwtSecret()` (`MCP_OAUTH_JWT_SECRET || RBAC_JWT_SECRET`, `oauth.ts:806-815`), saves the access record **and always a refresh token**, and writes the HTTP token response. Callers: authorization-code and refresh-token grants only (`oauth.ts:511-579`). **No standalone internal issuer exists** (no `issueMcpAccessTokenForSpsJwt`).
- The browser OAuth flow authenticates against the SPS API email/password endpoint and stores the resulting `spsJwt` in the code/token records (`authenticateWithSps`, `oauth.ts:680-732`; `getSubjectFromSpsJwt` verifies with `RBAC_JWT_SECRET` and extracts `sub`/`subject.id`/`id`, `oauth.ts:827-856`).
- Verification: `verifyMcpAccessToken` checks signature, `aud === getMcpPublicUrl()`, `jti` presence, live store record, and returns `{ clientId, scopes, expiresAt, subject, spsJwt }` (`oauth.ts:298-326`).
- `/mcp` request gate (`apps/mcp/http.ts:177-244`): `MCP_AUTH_REQUIRED=false` → anonymous; Bearer token → `verifyMcpAccessToken` → `requestAuth.authorization = "Bearer " + verified.spsJwt`; optional `MCP_ALLOW_RBAC_SECRET_FALLBACK=true` accepts `X-RBAC-SECRET-KEY` matching `RBAC_SECRET_KEY` (`:223-235`).
- Forwarding: `runWithMcpRequestAuthContext` wraps `transport.handleRequest` (`http.ts:118-127`); `installMcpFetchAuthForwarding` patches `globalThis.fetch` to inject `authorization`/`x-rbac-secret-key` from the AsyncLocalStorage context — and, when **no** context is active, falls back to `process.env["RBAC_SECRET_KEY"]` (`apps/mcp/lib/auth-context.ts:15-76`). `getMcpAuthHeaders` prefers context `rbacSecretKey` over `authorization`, then falls back to raw request headers/cookies/`authInfo`/`_meta` (`apps/mcp/lib/auth.ts:84-136`).

### 6. RBAC subject JWT and root secret

- Secrets: `RBAC_SECRET_KEY` and `RBAC_JWT_SECRET` (`libs/shared/utils/src/lib/envs/rbac.ts:7, 19`); token lifetimes `RBAC_JWT_TOKEN_LIFETIME_IN_SECONDS` default 3600s, refresh default 86400s (`rbac.ts:10-18`).
- Signing sites (all `hono/jwt`, HS256): email/password authentication signs access JWT embedding the **full subject row** + refresh JWT embedding `{ subject: { id } }` (`.../service/singlepage/authentication/email-and-password.ts:185-207`); refresh (`refresh.ts:35, 57-79`), ethereum (`ethereum-virtual-machine.ts:248-270`), oauth exchange (`oauth/exchange.ts:123-144`) follow the same shapes. Every site resolves the subject row first (usually via `X-RBAC-SECRET-KEY`-headed `findById`), then signs.
- Verification sites: `authentication/me` returns `decoded.subject` verbatim (`me.ts:34`); `is-authorized` service trusts only `decoded.subject.id`, caches per token 30s (`is-authorized.ts:118-134`); `bill-route.ts:83` same pattern.
- Authorization path for `Bearer <spsJwt>`: global `IsAuthorizedMiddleware` (`libs/middlewares/src/lib/is-authorized/index.ts:39-112`) → RBAC subject SDK `authenticationIsAuthorized` → controller → `is-authorized` service → JWT verify → subject roles (`subjectsToRoles`) ∩ permission roles, with root-permission fallback (`is-authorized.ts:204-243`).
- `X-RBAC-SECRET-KEY` bypass: exact string match short-circuits the middleware **before any permission resolution** (`is-authorized/index.ts:59-61`), likewise billing (`bill-route` middleware/controller); it is also the credential for privileged backend-to-backend SDK calls throughout authentication flows.
- **Existing server-side short-lived JWT mint for a resolved subject**: the `replyByJwt` in `react-by-openrouter.ts:1177-1193` (see §2) — structurally identical to what the issue describes for the sender subject, differing only in which subject is resolved.

### 7. `@knowledge` pipeline (must be preserved)

- Separate legacy endpoint: `POST .../react-by/knowledge` (`controller/singlepage/index.ts:478-483`; handler `react-by-knowledge.ts:63-145`). Gates: chat `variant === "knowledge"` (`:192-204`), reply profile `variant === "artificial-intelligence"` (`:206-218`) and linked to the chat (`:322-352`). `/learn` requires `@knowledge` (`:493-503`). `learnFromMessage` ingests `.txt/.md` content via `knowledgeService.learnContent` (`:505-612`); `answerFromKnowledge` calls `knowledgeService.generate(...)` (`:614-708`). Replies written via `createThreadMessage` with `metadata.knowledge = { action: "learn"|"generate", ... }` (`:1189-1259`).
- The OpenRouter endpoint independently re-implements `@knowledge` detection, `/learn` handling, search + LLM rerank, and system-prompt injection (see §2); the two endpoints share only the `KnowledgeService` and the `metadata.knowledge` naming convention. Neither calls the other.
- `react-by-knowledge.ts` does not use the billing ledger/purposes system.

### 8. Message and action metadata storage

- `social.message` fields (`libs/modules/social/models/message/backend/repository/database/src/lib/fields/singlepage.ts:3-21`, table `sl_message`): `id, createdAt, updatedAt, className, variant, title, subtitle, description, sourceSystemId`, plus two open JSONB columns — **`interaction`** (used today as `{ role, content }`) and **`metadata`** (`{ [key: string]: any }`, default `{}`). Zod insert/select schemas are generated without narrowing (`.../database/src/lib/index.ts:6,10`; SDK re-export `sdk/model/src/lib/index.ts:1-6`).
- Current metadata written by the OpenRouter reply: `{ knowledge: { action, profileId, triggerMessageId, useKnowledgeSearch, documentIds, citations, sources, retrieval, requestedKnowledgeSearch, requestedSkillIds, skills, openRouter: { model, reasoning, selectedModelId, selectedBy } }, openRouter: { billing: { ...summary, settlement } } }` (`react-by-openrouter.ts:1486-1516`, `535-595`).
- `social.action` (`libs/modules/social/models/action/backend/repository/database/src/lib/fields/singlepage.ts:4-14`, table `sl_action`): `variant`, `expiresAt` (default now + 1 month), JSONB **`payload`**. Client-driven create route `POST .../chats/:chatId/actions` (`controller/singlepage/index.ts:466-470`, handler `action/create.ts:92-231`) linking via `chatsToActions`/`threadsToActions`/`profilesToActions`; read via `action/find.ts`. **Neither reply handler creates actions internally.**

### 9. Existing loop/step/budget limits in the reply flow

- One fallback-candidate retry for final generation (`react-by-openrouter.ts:631-735`); one non-text-strip retry inside the wrapper (`open-router/index.ts:576-612`).
- Classifier/model-selection fallbacks bounded by static `MODEL_ROUTER_CONFIG` lists + single-shot JSON repair calls (`react-by-openrouter.ts:3121-3333, 3335-3507, 3622-3697`).
- Token caps: generation 8192 (text only), classification 600, model selection 300, rerank 800.
- Knowledge sizes: topK 30 → rerank 12; thread context for rerank last 8 messages / 800 chars each.
- Thread-history pagination unbounded by page count (data-bound only). No request-level timeout in the wrapper; the shared SDK fetch actions use `AbortSignal.timeout(600000)`.
- Billing settled exactly once via `billingSettled` flag.

## Code References

- `libs/shared/third-parties/src/lib/open-router/index.ts:29-32` — message role union (no `tool` role)
- `libs/shared/third-parties/src/lib/open-router/index.ts:231-269` — request body (no `tools`/`tool_choice`/`parallel_tool_calls`)
- `libs/shared/third-parties/src/lib/open-router/index.ts:271-312` — response parser (ignores `tool_calls`)
- `libs/shared/third-parties/src/lib/open-router/index.ts:547-626` — `generate()` incl. strip-retry
- `libs/shared/third-parties/src/lib/open-router/interface.ts:117-140` — `supported_parameters` incl. `"tools"`, `"parallel_tool_calls"`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:472-483` — react-by routes (openrouter, knowledge)
- `.../message/react-by-openrouter.ts:826-1572` — handler pipeline (identities, context, generation, settle, reply)
- `.../message/react-by-openrouter.ts:1177-1193` — server-side `replyByJwt` mint (precedent for sender JWT mint)
- `.../message/react-by-openrouter.ts:446-533` — `generateWithBillingLedger` + `settleOpenRouterBilling`
- `.../message/react-by-openrouter.ts:2875-2934` — `buildGenerationContext`
- `.../message/create.ts:132-278` — assistant message row + chat/thread/profile links
- `.../service/singlepage/open-router-billing.ts:7-13, 46-112` — purposes, route gate, summary math
- `.../service/singlepage/bill-route.ts:232-234, 269-392` — precharge/settle mechanics
- `.../service/singlepage/is-authorized.ts:118-134, 204-243` — JWT verify + role/permission match
- `libs/middlewares/src/lib/is-authorized/index.ts:43-61, 86-95` — Bearer extraction + secret-key bypass
- `libs/shared/utils/src/lib/envs/rbac.ts:7-19` — `RBAC_SECRET_KEY`, lifetimes, `RBAC_JWT_SECRET`
- `.../service/singlepage/authentication/email-and-password.ts:185-207` — canonical SPS JWT payload shapes
- `apps/mcp/actions.ts:7-17` — `createMcpServer()` (content-management only)
- `apps/mcp/content-management.ts:97-469` — the 19 live tools
- `apps/mcp/content-management.spec.ts:33-74` — pinned tool list
- `apps/mcp/lib/content-management/registry.ts:15-22, 88-163, 365-410` — runtime entity discovery, `defaultOperations`
- `apps/mcp/lib/content-management/operations.ts:52-57, 102-111, 763-893` — confirmation token, operation gate, dryRun/preview-apply
- `apps/mcp/lib/content-management/response.ts:3-64` — result envelope
- `apps/mcp/http.ts:118-127, 151-175, 177-244` — auth context wrap, session creation, request auth gate
- `apps/mcp/lib/oauth.ts:36-43, 298-326, 511-640, 680-732, 806-856` — token records, verify, grants + `issueTokenResponse`, SPS authentication, secrets/subject extraction
- `apps/mcp/lib/auth-context.ts:15-76` — fetch patching + env-secret fallback when no context
- `apps/mcp/lib/auth.ts:84-136` — `getMcpAuthHeaders` resolution order
- `libs/shared/frontend/server/api/src/lib/factory/index.ts:37-131` — SDK verb factory
- `libs/shared/frontend/api/src/lib/actions/find/index.ts:37-54` — fetch with forwarded headers, 600s timeout
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:240-423, 1719-2034` — trigger service
- `.../message/react-by-knowledge.ts:63-145, 192-218, 493-612, 614-708, 1189-1259` — knowledge endpoint
- `libs/modules/social/models/message/backend/repository/database/src/lib/fields/singlepage.ts:3-21` — message JSONB columns
- `libs/modules/social/models/action/backend/repository/database/src/lib/fields/singlepage.ts:4-14` — action payload column
- `.../chat/find-by-id/action/create.ts:92-231` — client-driven action create

## Architecture Documentation

- **Layering**: backend follows repository → service → controller → app, mounted only via `apps/api/app.ts`; the reply flow lives in the RBAC subject module's controller layer and calls sibling modules via server SDKs with explicit auth headers.
- **Dual-identity convention already in place**: route caller (sender side) vs. server-minted `replyByJwt` for the AI profile's subject; all reply-side writes carry the minted JWT. Issue #199's identity split (tools = sender subject, final message = AI profile) maps onto this existing structure — the missing piece is minting for the _sender_ and exchanging it for an MCP access token.
- **MCP as an API proxy**: MCP tools never touch the DB; they call the SPS API over HTTP with forwarded caller auth, so RBAC enforcement happens in the API's `IsAuthorizedMiddleware`/`is-authorized` service exactly as for any client.
- **Token chain (external flow today)**: browser OAuth+PKCE → SPS email/password authentication → `spsJwt` stored in OAuth records → MCP access token (JWT, aud = MCP public URL, jti-backed store record) → `/mcp` Bearer → per-request AsyncLocalStorage → forwarded `Authorization: Bearer <spsJwt>` on outgoing API fetches.
- **Billing convention**: every OpenRouter call is a ledger entry with a typed purpose; a new purpose value is the existing extension point for tool-loop model calls (`TOpenRouterBillingPurpose`).
- **Metadata convention**: assistant messages carry `metadata.knowledge.*` and `metadata.openRouter.billing`; JSONB is unconstrained, so tool-loop metadata has a natural home under `metadata.openRouter.*` without schema migrations.

## Historical Context (from thoughts/)

- `thoughts/shared/research/singlepagestartup/ISSUE-193.md` — documents the `react-by/openrouter` flow and explicitly evaluates OpenRouter tool calling (Options A/B: prompt catalog vs. `activate_skill` function tool with a client-side tool loop); its plan (`plans/ISSUE-193.md`) deliberately deferred the tool-calling loop — issue #199 is that follow-up.
- `thoughts/shared/research/singlepagestartup/ISSUE-187.md` — MCP content-management foundation; its "Authorization And Headers" section documents `IsAuthorizedMiddleware` and secret-key handling.
- `thoughts/shared/handoffs/singlepagestartup/ISSUE-187-progress.md` — "Forwarded MCP Auth" follow-up removed root-secret usage from MCP-to-API calls in favor of caller-auth forwarding; "Streamable HTTP Transport" added `apps/mcp/http.ts`.
- `thoughts/shared/tickets/singlepagestartup/ISSUE-199.md` and `processes/singlepagestartup/ISSUE-199.md` — ticket and process log for this issue.
- No prior thoughts document covers an internal MCP token issuer (`issueMcpAccessTokenForSpsJwt` appears nowhere in `thoughts/`).

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-193.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-187.md`
- `thoughts/shared/research/singlepagestartup/ISSUE-192.md` (profile-scoped Knowledge RAG baseline)
- `thoughts/shared/research/singlepagestartup/ISSUE-195.md` (chat realtime refetch constraints around AI replies)

## Open Questions

- **Which tool surface to expose to the model**: the 19 generic content-management tools are schema-heavy (selector + filters). The issue requires an allowlist "scoped to chat/agent use cases, read-only first" — whether that allowlist selects a subset of the 19 generic tools, or defines new chat-scoped tool definitions that map onto MCP calls, is a plan-phase decision. Today MCP has no per-session tool subsetting.
- **Sender subject JWT payload shape**: existing mints embed either the full subject row or `{ subject: { id } }`; `is-authorized` only needs `subject.id`. The internal mint for the sender must pick one (the `replyByJwt` precedent embeds the full row).
- **MCP store TTL vs. loop duration**: MCP access-token TTL default is 3600s; the tool loop needs a much shorter TTL ("short-lived") — `MCP_OAUTH_ACCESS_TOKEN_TTL_SECONDS` is global today, so a per-issuance TTL parameter would be new surface in `issueTokenResponse`-adjacent code.
- **MCP client session overhead per loop**: `/mcp` requires an `initialize` handshake per session (`http.ts:88-103`); whether the backend tool executor holds one session per reply or per tool call affects the loop implementation but has no existing in-repo precedent (no in-repo MCP _client_ exists today).
- **`MCP_ALLOW_RBAC_SECRET_FALLBACK` and the no-context env fallback** (`auth-context.ts:27-29`) both exist; the issue forbids root-secret usage for model-requested tools, which is compatible with the Bearer path but the deployment configuration of these flags matters for enforcement.
- **Where sender-side billing for tool-loop model calls lands**: purposes are typed and settled against the _caller_ of the react-by route (the sender-side subject via the agent service trigger); adding tool-loop purposes extends `TOpenRouterBillingPurpose`, but MCP tool execution itself is not billed through this ledger today (the issue says it "should be auditable separately").

## Known Pitfalls (from implementation)

### Nx plugin worker can block affected verification before targets run

- **Phase**: Implement
- **Occurrences**: 2
- **Symptom**: Concurrent Nx targets waited on graph construction and failed with `Failed to start plugin worker`; a sequential retry also stalled before running tests.
- **Root Cause**: Nx project-graph/plugin-worker infrastructure failed independently of the affected Jest/TypeScript configurations.
- **Fix**: Run each project Jest config, TypeScript config, and focused ESLint path directly on Node 24, the repository-required runtime.
- **Preventive Action**: When Nx fails before target execution, record the infrastructure failure and run the underlying declared config directly rather than treating it as a code test failure.
