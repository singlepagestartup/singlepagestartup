# Summary

Enables an AI `social.profile` to perform MCP-backed work in chat. The requester remains the billing/task initiator, while the single `rbac.subject` linked to the replying profile becomes the execution principal for MCP-to-API calls and the profile remains the visible reply author.

The OpenRouter reaction path now owns profile validation, Knowledge, skills, tool orchestration, billing, audit metadata, and final reply creation. The duplicated `react-by/knowledge` route and its SDK/agent/frontend/permission surfaces are removed.

Closes #199.

## Changes

- Added `social.profile.allowedMcpServerIds` with a generated Drizzle migration, a built-in `singlepagestartup` MCP descriptor, stale-id handling, and controls in both active profile admin form variants.
- Added an MCP section and editor to the chat profile sidebar, backed by the authorized chat-local profile update route.
- Extended the OpenRouter wrapper with OpenAI-compatible `tools`, `tool_choice`, `parallel_tool_calls`, assistant `tool_calls`, and `role: "tool"` replay while preserving no-tool text/image behavior.
- Added a bounded sequential `social.profile` tool loop with 50-step and five-minute limits, per-tool timeout/result caps, repeated-call protection, safe model fallback before side effects, model locking after side effects, redacted trace metadata, and one-time billing/session cleanup.
- Made linked Social skills available for ordinary tasks while restricting all profile Knowledge retrieval, reranking, context, and tool exposure to messages with explicit `@knowledge`; preserved `/skill` and `/learn` behavior.
- Removed the shared prompt's text-only and Telegram 4000-character restrictions so tool-capable models can emit protocol calls and non-Telegram chats receive no channel-specific instructions; Telegram continues splitting long replies in its delivery service.
- Added protected `rbac.subject` authentication JWT exchange in `apps.mcp`: five-minute access token, no refresh token, subject derived only from verified `subject.id`, dedicated internal secret, and unchanged external OAuth flows.
- Added the SinglePageStartup MCP Streamable HTTP client, live paginated tool catalog, JSON Schema validation, normalized results, profile-scoped catalog endpoint/SDK, and server-side `rbac.subject` authentication JWT minting.
- Routed MCP-backed API work with the `rbac.subject` authentication bearer; no model-requested call uses `X-RBAC-SECRET-KEY` or duplicates record-level RBAC decisions in the orchestrator.
- Removed the legacy Knowledge reaction handler, route, permission snapshot, client/server SDK actions, agent method/tests, frontend mock, and documentation references.
- Added local/deployment configuration for `MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET` and `MCP_SERVICE_URL`, plus module/operator documentation and implementation artifacts.
- Standardized every MCP runtime, OAuth, connector, and deployment environment variable under `MCP_SERVICE_*`, with separate internal, bind, and public URL semantics.
- Standardized AI/MCP identity names on the owning SPS models: `socialProfile*` for the replying `social.profile`, `rbacSubject*` for the execution principal, and `rbacSubjectAuthenticationJwt` for its server-minted credential; the internal exchange now uses `rbac-subject` route/client terminology.
- Organized Subject-owned billing, chat, profile AI, and profile MCP implementations into domain service zones and routed controller operations through the startup-exported main `rbac.subject` Service. Child projects can override public operations or protected factories without replacing controllers; legacy persisted `replyProfileId` turn metadata normalizes to canonical `replySocialProfileId`.
- Made agent thread resolution route/relation-driven and replaced `variant="default"` singleton assumptions with deterministic linked-thread selection.
- Made model-favorites KV loading independent of the API cwd and prevented the new-thread composer from querying AI skills against the requester's ordinary profile before the assistant is resolved.
- Added a versioned RBAC AI-reaction envelope in generic `social.message.metadata`; one create-message request now persists reply profile, model, reasoning, selected skills, and Knowledge intent.
- Removed frontend OpenRouter orchestration, its client SDK action, reaction/action refetch callbacks, `aiReactionMode`, and the explicit action-logger skip response. Action logging is the single backend launch; Agent and OpenRouter reload the persisted message and reject identity mismatches or caller parameter overrides.
- Added a versioned, fail-closed `ai-execution` action contract and lifecycle events for skill, Knowledge, and MCP work. One action is lazily related to the current chat/thread/reply profile and updated in place; the specialized timeline row exposes only safe labels/statuses and never raw arguments, results, credentials, prompts, or hidden reasoning.
- Added generic thread metadata and a versioned RBAC thread-preference contract.
  Explicit OpenRouter model selections are now persisted per thread through the
  authorized, startup-overridable main Subject Service and restored after page
  reload or thread navigation.
- Added the requester billing-relation topic to the AI-reaction realtime rule,
  so already-open balance tables refetch after exact OpenRouter settlement.
- Normalized TXT, transcript, subtitle, and common structured-text attachments
  into provider-independent text before automatic routing. Skill-only messages
  now classify from a bounded text prefix and generate from the complete
  extracted source instead of discarding the message or sending a local URL.

## Verification

- [x] OpenRouter/shared Jest: 2 suites, 15 tests.
- [x] MCP Jest: 8 suites, 41 tests.
- [x] RBAC Jest: 54 suites, 226 tests.
- [x] Agent Jest: 8 suites, 33 tests.
- [x] Full Social Jest: 12 suites, 27 tests.
- [x] Shared Utils Jest: 7 suites, 53 tests.
- [x] RBAC integration Jest: 1 suite, 3 tests.
- [x] TypeScript: shared-third-parties, MCP, RBAC, Social, and Agent configs.
- [x] ESLint: every changed/untracked TypeScript file.
- [x] Prettier, shell syntax, `git diff --check`, and zero live legacy-reaction reference checks.
- [x] Drizzle `up`/`generate` reproducibility: no additional schema changes after the generated profile migration.
- [x] Thread preference BDD: typed metadata, main-service persistence,
      controller delegation, and composer restore/save are included in the full
      green RBAC suite; the generated thread migration reproduces with no
      additional schema changes and applies locally.
- [x] Billing reconciliation: PostgreSQL shows exact settlement trajectories and
      current requester amount `99999997169`; the shared topic-rule BDD proves
      the AI-reaction broadcast includes the billing relation.
- [x] Browser: the real Admin overlay and chat profile sidebar expose `SinglePageStartup MCP`; the sidebar editor shows the persisted `singlepagestartup` server as enabled and was closed without changing data.
- [x] Live API/MCP: `rbac.subject` exchange returned Bearer/300 seconds, `tools/list` returned 19 tools, and read-only `model-record-count` reached `apps.api` as the `rbac.subject` linked to the replying profile.
- [x] Live new-thread reload: Ecommerce opened with no browser errors for `model-favorites`, `/skills`, or HTTP 500; `@sps/providers-kv` resolves from the `apps/api` working directory.
- [x] Live new-thread send: the first Ecommerce message was created, one AI-enabled `social.profile` run completed through SinglePageStartup MCP, and `ecommerce/attribute` returned 12 records with no browser errors.
- [x] Message-owned Browser send: one frontend create produced backend status/action rows through WebSocket reactivity, one MCP-backed count of 12, and no duplicate reply after waiting.
- [x] AI-execution Browser send: a unique read-only MCP turn produced one running action, updated the same action/run id to completed, showed the safe SinglePageStartup tool label/name, returned one final count of 12, created no duplicate after waiting, exposed no sensitive execution data, and logged no browser errors.
- [x] Startup-service refactor Browser regression: after restarting current MCP HTTP/API/host builds, new thread `MCP Knowledge Skills` completed one MCP `ecommerce/attribute` count (`12`) with one finished action, one explicit `@knowledge` answer, and one `/youtube-description-1` slash-command answer; the canonical token-exchange route no longer returned 404 and no request produced a duplicate or browser error.
- [x] TXT attachment Browser regression: replaying the original
      `/youtube-description-1` message with its 28 KB transcript produced
      Russian `summarize`/`text` routing and one transcript-grounded
      `openai/gpt-5.2` answer in the original thread.
- [x] AI-execution focused BDD: contract parser (5), tool-loop lifecycle (15), action reporter (3), specialized row/reactivity (4), and OpenRouter handler (29) tests pass.
- [ ] `npm run parity`: the approved plan references this command, but the repository does not define a `parity` script.
- [ ] Human review scenario: persist MCP on a disposable restricted `social.profile`, send a task from another requester, and inspect final message/audit metadata plus permitted/denied RBAC cases. Browser/API verification created test messages in the existing test chat but made no additional persistent profile-configuration mutation.

## Notes

- Apply `0002_nice_molecule_man.sql` before enabling MCP on profiles in an existing database.
- Apply the Social thread `0002_whole_the_hood.sql` migration before relying on
  per-thread model persistence in an existing database.
- Deploy API and MCP with the same new `MCP_SERVICE_INTERNAL_TOKEN_EXCHANGE_SECRET`; API also needs the internal `MCP_SERVICE_URL`.
- Removing `react-by/knowledge` is an intentional API contract change. All in-repository callers now use `react-by/openrouter`.
- Arbitrary/external profile MCP connection models remain out of scope; this PR supports the built-in `singlepagestartup` server id and preserves external MCP OAuth clients unchanged.
