---
date: 2026-06-14T16:46:38+0300
researcher: flakecode
git_commit: 633776785d5375b31566363e2dd5cd0646ef4ba0
branch: main
repository: singlepagestartup
topic: "Provider-native profile skills in react-by/openrouter Knowledge chats"
tags: [research, codebase, social, rbac, knowledge, llm, openrouter, skills]
status: complete
last_updated: 2026-06-15
last_updated_by: flakecode
---

# Research: Provider-Native Profile Skills In `react-by/openrouter` Knowledge Chats

**Date**: 2026-06-14T16:46:38+0300
**Researcher**: flakecode
**Git Commit**: 633776785d5375b31566363e2dd5cd0646ef4ba0
**Branch**: main
**Repository**: singlepagestartup

## Research Question

Document how profile-linked `social.skill` records currently flow through the live social Knowledge chat stack, specifically the `react-by/openrouter` endpoint, and identify the existing code surfaces that already support provider-native OpenAI/Anthropic Skills.

This replaces the previous research/plan scope. The previous plan incorrectly treated provider-native Skills as a `react-by/knowledge` implementation detail and left `react-by/openrouter` as follow-up scope. The current product requirement is that Knowledge chats use `react-by/openrouter` as the primary reply path and that skill integration belongs in that path.

## Summary

`social.skill` and `profiles-to-skills` already exist. A skill stores its user-facing instructions in model fields, especially `title`, `slug`, `description`, `status`, `defaultModelSlug`, `allowedModelSlugs`, and generic `metadata` JSONB. Profiles link to skills through `profiles-to-skills`, which stores `profileId`, `skillId`, `orderIndex`, and `variant`.

The codebase already has provider-native infrastructure outside the OpenRouter reaction path:

- RBAC exposes a profile-scoped provider sync endpoint that uploads linked skills to OpenAI and Anthropic and stores references in `social.skill.metadata.providerSkills`.
- Knowledge generation can pass `providerSkills` to the local LLM gateway as `provider_skills`.
- The local LLM gateway validates provider skills for OpenAI/Anthropic models and mounts them into OpenAI Responses API shell skills or Anthropic beta `container.skills`.

The current `react-by/openrouter` endpoint is the active rich chat reply path for Knowledge chats. It accepts `skillIds`, detects `@knowledge`, supports `/learn`, includes thread context, supports manual/auto OpenRouter model selection, and supports reasoning controls. Its skill handling is prompt-based: linked selected skills are resolved as `promptSkills`, converted to a system prompt by `toSkillSystemPrompt(...)`, prepended to the OpenRouter message context, and written to metadata as `mode: "prompt-instruction"`.

The shared OpenRouter wrapper currently sends only OpenRouter chat completion fields such as `model`, `messages`, `max_tokens`, `reasoning`, `response_format`, and `temperature`. It has no `provider_skills`, `skills`, OpenAI `skill_reference`, or Anthropic `container.skills` request surface.

OpenRouter official documentation describes an OpenAI-compatible Chat Completions shape with `tools` and provider routing parameters, plus a Responses endpoint with `tools`, `plugins`, `provider`, and `reasoning`. The documentation checked for this research does not document OpenAI Agent Skills `skill_reference` mounting or Anthropic `container.skills` mounting through OpenRouter. That means the current OpenRouter path cannot be assumed to support provider-native Skills by simply forwarding existing gateway `provider_skills`.

Decision clarification: when a request is generated through OpenRouter, skills should be treated as SPS-managed text/tool instructions. OpenRouter can receive a selected skill as extra system/developer context, or through a normal function/tool activation loop that returns the skill instructions. This is the only documented and reliable OpenRouter-compatible skill approach found in the checked sources. It should not be described as provider-native OpenAI/Anthropic Skills.

After checking the current OpenRouter OpenAPI spec and external Agent Skills documentation, the documented OpenRouter-compatible implementation choices are:

- Use OpenRouter prompt/tool-call skill activation: disclose a skill catalog, then inject or load selected skill instructions into context. This matches the Agent Skills client implementation guide, but it is not provider-native OpenAI/Anthropic Skills.
- Use a hybrid `react-by/openrouter` endpoint that keeps the OpenRouter chat UX and model controls, but switches to direct OpenAI/Anthropic provider-native generation when selected skills require native mounting. This satisfies provider-native Skills using documented OpenAI/Anthropic APIs, but billing/metadata must explicitly reflect the non-OpenRouter generation path.
- Treat OpenRouter provider-specific passthrough for Skills as experimental only. OpenRouter documents that some provider-specific parameters are forwarded, but its docs and OpenAPI schema checked here do not list `skills`, `skill_reference`, or Anthropic `container.skills`, and unsupported parameters can be ignored.

## Detailed Findings

### Social Skill Model And Profile Links

- `social.skill` defines the core fields used by provider skill bundles: `title`, unique `slug`, `description`, `status`, `defaultModelSlug`, `allowedModelSlugs`, `metadata`, and `adminTitle` (`libs/modules/social/models/skill/backend/repository/database/src/lib/fields/singlepage.ts:4`).
- `metadata` is JSONB and is the existing storage location for provider sync references (`libs/modules/social/models/skill/backend/repository/database/src/lib/fields/singlepage.ts:22`).
- `profiles-to-skills` is the profile/skill link relation. It stores `profileId`, `skillId`, `orderIndex`, and `variant`, with cascade delete foreign keys to profile and skill rows (`libs/modules/social/relations/profiles-to-skills/backend/repository/database/src/lib/schema.ts:10`).
- The admin-v2 skill form exposes skill fields and has a `Relations` tab when relation components are provided, including profile links (`libs/modules/social/models/skill/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:58`).

### Provider Sync Already Exists

- The RBAC subject singlepage controller registers `POST /:id/social-module/profiles/:socialModuleProfileId/skills/provider-sync` behind the profile subject owner middleware (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:504`).
- The sync request accepts `providers?: ("openai" | "anthropic")[]`, `skillIds?: string[]`, and `force?: boolean` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-sync.ts:17`).
- The handler loads `profilesToSkills`, rejects requested skill ids that are not linked to the profile, skips archived skills, uploads provider bundles, and updates the skill `metadata` with provider refs (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-sync.ts:56`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-sync.ts:78`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-sync.ts:251`).
- `buildProviderSkillBundle(...)` renders a minimal markdown `SKILL.md` from the skill slug/title/description and computes a SHA-256 `contentHash` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-skills.ts:44`).
- Stored provider references include `provider`, `providerSkillId`, optional `version`, `name`, `sourceSkillId`, `sourceSkillSlug`, `contentHash`, and `syncedAt` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-skills.ts:17`).
- Freshness validation checks the stored provider skill id, source skill id, and bundle hash (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-skills.ts:113`).
- OpenAI sync posts a `files[]` markdown bundle to `https://api.openai.com/v1/skills` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-skills.ts:197`).
- Anthropic sync posts the bundle to `https://api.anthropic.com/v1/skills` with Anthropic version and beta headers (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-skills.ts:234`).

### Knowledge Generation And Local LLM Gateway Support Provider Skills

- `KnowledgeGenerationProps` and `KnowledgeChatCompletionProps` both accept `providerSkills?: IKnowledgeProviderSkillReference[]` (`libs/modules/knowledge/backend/app/api/src/lib/generation/index.ts:28`, `libs/modules/knowledge/backend/app/api/src/lib/generation/index.ts:49`).
- `LlmChatClient.complete(...)` serializes non-empty `providerSkills` as `provider_skills` in the local gateway request (`libs/modules/knowledge/backend/app/api/src/lib/generation/index.ts:99`).
- The local gateway schema defines `ProviderSkillReference` and `ChatCompletionRequest.provider_skills` (`apps/llm/singlepage/schemas.py:11`, `apps/llm/singlepage/schemas.py:26`).
- `GatewayService.chat_completion(...)` filters/validates provider skills for the selected model and passes them to the provider adapter (`apps/llm/singlepage/service.py:56`).
- `_provider_skills_for_model(...)` rejects provider skills for non-OpenAI/non-Anthropic providers and rejects refs whose stored provider does not match the selected model provider (`apps/llm/singlepage/service.py:162`).
- OpenAI provider skills become `{ type: "skill_reference", skill_id, version? }` (`apps/llm/singlepage/providers.py:41`).
- Anthropic provider skills become `{ type: "custom", skill_id, version? }` (`apps/llm/singlepage/providers.py:53`).
- The OpenAI provider uses `responses.create(...)` and mounts skills under a hosted shell tool environment (`apps/llm/singlepage/providers.py:270`).
- The Anthropic provider uses beta Messages with `container.skills` and Skills/code execution/files beta headers (`apps/llm/singlepage/providers.py:184`).

### Legacy `react-by/knowledge` Has Provider-Skill Helper Code But Is Not The Current Main Path

- The legacy Knowledge reaction route is registered at `POST /:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/messages/:socialModuleMessageId/react-by/knowledge` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:457`).
- `react-by-knowledge.ts` contains `findProviderSkillsForProfile(...)`, which validates fresh provider refs and converts them to Knowledge provider-skill format (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.ts:928`).
- The active `resolveKnowledgeSkills(...)` path in that file returns selected skills as prompt instructions and returns `providerSkills: []` for selected-skill and no-skill branches (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.ts:727`).
- The current UI/agent direction after the OpenRouter chat controls work is to route Knowledge chats through `react-by/openrouter`, so the legacy endpoint is compatibility context rather than the primary implementation surface for this issue.

### Current `react-by/openrouter` Skill Flow

- `IRequestData` for `react-by-openrouter` accepts `skillIds?: string[]` and `useKnowledgeSearch?: boolean` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:92`).
- `IResolvedOpenRouterKnowledgeContext` contains `promptSkills` and `systemMessages`, but no `providerSkills` field (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:113`).
- The handler normalizes `data.skillIds`, detects `@knowledge`, detects mentioned skill slugs, strips control mentions, and then loads the reply profile (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:884`).
- `/learn` is validated to require `@knowledge` before generation proceeds (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:908`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1563`).
- `resolveOpenRouterKnowledgeContext(...)` loads prompt skills linked to the reply profile by ids and mentioned slugs, then runs Knowledge search only when `@knowledge` was requested (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1573`).
- `findPromptSkillsForProfile(...)` verifies selected skill ids are linked to the profile, filters archived skills, and returns active linked skill rows (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1731`).
- `toSkillSystemPrompt(...)` formats selected skills into a system prompt that includes `@slug`, optional title, and the skill description (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1853`).
- The generated OpenRouter context prepends the prompt skill and Knowledge system messages before calling `generateFinalOpenRouterReply(...)` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1319`).
- Reply metadata records selected skills as `mode: "prompt-instruction"` under `metadata.knowledge.skills` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1417`).

### Current OpenRouter Wrapper Surface

- `IOpenRouterRequestMessage` is only `{ role, content }` (`libs/shared/third-parties/src/lib/open-router/index.ts:29`).
- `requestCompletion(...)` posts to `/chat/completions` with `model`, `messages`, `stream`, `max_tokens`, optional `reasoning`, optional `response_format`, and optional `temperature` (`libs/shared/third-parties/src/lib/open-router/index.ts:231`).
- `generate(...)` passes context/model/fallback/reasoning/format/temperature into `requestCompletion(...)`; it has no provider skills argument (`libs/shared/third-parties/src/lib/open-router/index.ts:547`).
- The retry path after multimodal failures repeats the same request shape and also has no provider skills argument (`libs/shared/third-parties/src/lib/open-router/index.ts:586`).
- `IOpenRouterModel.supported_parameters` includes standard OpenRouter parameters such as `"tools"`, `"reasoning"`, `"response_format"`, and `"web_search_options"`, but no `"skills"`, `"provider_skills"`, `"skill_reference"`, or `"container.skills"` parameter (`libs/shared/third-parties/src/lib/open-router/interface.ts:117`).

### OpenRouter Documentation Checked

- OpenRouter Chat Completions is documented as an OpenAI-compatible shape with `models`, `route`, and `provider` OpenRouter-specific fields, plus standard fields such as `tools` and `tool_choice`: https://openrouter.ai/docs/api/reference/overview.
- OpenRouter parameter docs list supported request parameters and note that OpenRouter may accept additional provider-specific parameters, but the documented common parameter set does not include Skills-specific fields: https://openrouter.ai/docs/api/reference/parameters.
- OpenRouter Responses API docs show `tools`, `plugins`, `provider`, and `reasoning` fields for `/api/v1/responses`; the checked documentation has no `skills`, `skill_reference`, or Anthropic `container.skills` entries: https://openrouter.ai/docs/api/api-reference/responses/create-responses.
- The codebase OpenRouter wrapper currently uses Chat Completions, not the OpenRouter Responses endpoint (`libs/shared/third-parties/src/lib/open-router/index.ts:240`).

### Decision Note: OpenRouter Skills Are Text Or Tool Instructions

For the next implementation plan, treat OpenRouter skill support as a prompt/tool feature:

- `@skill` can select a linked active `social.skill`.
- The selected skill can be injected into the OpenRouter request as explicit instructions in system/developer context.
- Alternatively, OpenRouter `tools` can expose a local activation function that returns the selected skill's `SKILL.md`/description content when the model asks for it.
- In both cases, the skill remains an SPS-managed instruction bundle. OpenRouter receives normal text messages or normal tool-call results.

Do not plan an OpenRouter-only implementation that assumes native OpenAI `skill_reference` or Anthropic `container.skills` mounting. The checked OpenRouter docs and OpenAPI schema do not document those fields. A provider-native implementation must branch from the `react-by/openrouter` orchestration into the direct OpenAI/Anthropic gateway when the final model/provider supports native Skills.

### External Implementation Options For Skills With OpenRouter

The current OpenRouter docs and OpenAPI schema do not expose a first-class Agent Skills parameter. The practical implementation options are therefore different in how close they stay to provider-native Skills.

#### Option A: Prompt catalog plus skill instruction injection through OpenRouter

This is the most portable OpenRouter approach. The Agent Skills client implementation guide describes the generic pattern: discover `SKILL.md`, expose a catalog with `name` and `description`, and activate a skill by either letting the model read `SKILL.md` through a file-read tool or by returning the content from a dedicated activation tool. The same guide notes that when the model cannot read files directly, the client can inject skill content programmatically or provide an `activate_skill` tool.

OpenRouter supports this because it supports ordinary messages and standard function/tool calling. OpenRouter's tool-calling docs describe a client-side loop: send tools, let the model request a tool call, execute the tool locally, then send tool results back. OpenRouter also documents the `tools` parameter using OpenAI's function calling request shape and transforms it for other providers.

For SPS this maps to:

- Keep `react-by/openrouter` as the generation path.
- Convert linked `social.skill` records into a compact available-skills catalog.
- When the user explicitly mentions `@skill`, inject the selected skill's instructions into the system/developer context or expose a local `activate_skill` tool.
- Store metadata as prompt/tool-activated skill use, not provider-native skill use.

This is compatible with OpenRouter, multi-provider, and current billing. It does not satisfy a strict requirement that OpenAI/Anthropic receive native Skills objects.

#### Option B: OpenRouter function tool wrapper around skill activation

This is a variation of Option A. Instead of injecting selected skill text immediately, register a function tool such as `activate_social_skill`. Its schema should constrain the name/id to linked active skills. When the model calls the tool, the server returns the selected `SKILL.md` body and optionally a resource listing.

For SPS this maps to:

- Use OpenRouter `tools` and a client-side tool loop.
- Keep full skill bodies out of the initial context until the model needs them.
- Preserve progressive disclosure more closely than always injecting full skill prompts.

This is still not provider-native OpenAI/Anthropic Skills. It is a documented OpenRouter-compatible agent pattern.

#### Option C: Direct provider-native branch inside `react-by/openrouter`

This is the option that satisfies provider-native Skills using documented provider APIs. OpenAI documents Skills as versioned bundles with `SKILL.md`, uploaded through `/v1/skills`, and mounted in Responses API hosted shell through `tools[].environment.skills` with `skill_reference`. Anthropic documents Skills through beta Messages with `container.skills`, Skills beta headers, and code execution.

For SPS this maps to:

- Keep the public endpoint and UI flow as `react-by/openrouter`.
- Resolve the selected final model/provider before generation.
- If selected skills require provider-native mounting and the model provider is OpenAI or Anthropic, call the local LLM gateway/provider adapter that already supports `provider_skills`.
- If the selected/manual/auto model is not OpenAI or Anthropic, fail clearly or require Auto to choose a compatible OpenAI/Anthropic model.
- Record metadata showing the endpoint was `react-by/openrouter` but generation provider was direct OpenAI/Anthropic provider-native Skills, not OpenRouter prompt skills.

This is the strongest match for the issue requirement. The tradeoff is that OpenRouter billing/routing cannot be treated as if the request was generated by OpenRouter; billing and metadata need an explicit separate path.

#### Option D: OpenRouter provider-specific passthrough experiment

OpenRouter docs say some provider-specific parameters are forwarded to providers, and the API overview says unsupported parameters may be ignored while the rest are forwarded. Provider routing also documents pass-through for certain Anthropic beta headers, but the supported Anthropic beta feature list checked here includes interleaved thinking and structured outputs, not Skills.

The current OpenRouter OpenAPI schema includes OpenAI Responses-style tools, OpenRouter server tools, and an OpenRouter shell server tool, but a direct search of the schema found no `skill` field. The OpenRouter `openrouter:shell` schema has a managed container environment but does not document `environment.skills`.

For SPS this means an implementation could experimentally try:

- OpenAI-shaped Responses request with `tools[].environment.skills`.
- Anthropic-shaped request with `container.skills` and Skills beta headers.
- `provider.require_parameters=true` and provider restrictions to prevent accidental fallback.

However, this should be treated as unverified and feature-flagged. It should not be the main plan unless a live API probe proves OpenRouter forwards the exact fields and headers without stripping or ignoring them.

#### Option E: OpenRouter server shell without Skills

OpenRouter's OpenAPI schema includes an `openrouter:shell` server tool with an OpenRouter-managed `container_auto` environment. This resembles the shell/container part of OpenAI Skills, but the checked schema does not expose mounted skills under that environment. It can execute shell commands, but it is not a documented Agent Skills mounting mechanism.

For SPS this is useful only if a future plan decides to implement a custom skill runtime by writing generated skill files into an OpenRouter shell container and driving the model/tool loop manually. That would be a custom runtime, not provider-native Skills.

### Test Coverage That Already Exists

- `provider-sync.spec.ts` covers fresh sync upload/storage, stale hash detection, archived skill skip, and unlinked skill rejection (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-sync.spec.ts:98`).
- `generation/index.spec.ts` covers that Knowledge generation includes provider-native skill references as `provider_skills` outside the prompt (`libs/modules/knowledge/backend/app/api/src/lib/generation/index.spec.ts:87`).
- `apps/llm/tests/test_gateway.py` covers matching-provider dispatch, unsupported provider rejection, OpenAI Responses shell skill mounts, and Anthropic beta `container.skills` mounts (`apps/llm/tests/test_gateway.py:216`, `apps/llm/tests/test_gateway.py:375`, `apps/llm/tests/test_gateway.py:446`).
- `react-by-openrouter.spec.ts` currently covers OpenRouter thread context, reply validation, reasoning mapping, manual model selection, prompt skill resolution, and Knowledge search behavior (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts:196`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts:582`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts:607`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts:652`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.spec.ts:711`).

## Code References

- `libs/modules/social/models/skill/backend/repository/database/src/lib/fields/singlepage.ts:4` - `social.skill` fields used as source data for skill bundles.
- `libs/modules/social/relations/profiles-to-skills/backend/repository/database/src/lib/schema.ts:10` - profile-to-skill link relation.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:504` - RBAC provider-sync route registration.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-sync.ts:46` - provider sync handler entrypoint.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-skills.ts:44` - provider bundle rendering.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-skills.ts:113` - provider reference freshness check.
- `libs/modules/knowledge/backend/app/api/src/lib/generation/index.ts:99` - Knowledge gateway payload includes `provider_skills`.
- `apps/llm/singlepage/service.py:162` - local gateway provider skill validation.
- `apps/llm/singlepage/providers.py:184` - Anthropic beta `container.skills` branch.
- `apps/llm/singlepage/providers.py:270` - OpenAI Responses shell skills branch.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.ts:928` - legacy provider-skill resolver helper.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:92` - OpenRouter reaction request data includes `skillIds`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:113` - OpenRouter resolved context contains prompt skills, not provider skills.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1573` - OpenRouter Knowledge/skill context resolution.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1853` - prompt skill system prompt rendering.
- `libs/shared/third-parties/src/lib/open-router/index.ts:231` - OpenRouter chat completion request body shape.
- `libs/shared/third-parties/src/lib/open-router/index.ts:547` - OpenRouter generate API surface.
- `libs/shared/third-parties/src/lib/open-router/interface.ts:117` - OpenRouter model supported parameter type list.

## Architecture Documentation

Profile ownership and skill scoping currently live in RBAC orchestration and Social relations. `profiles-to-skills` determines which skills a reply profile can use, while `social.skill.metadata.providerSkills` stores provider upload references without a schema migration.

The existing provider-native path is split across three layers:

1. RBAC provider sync uploads linked skills and stores provider refs.
2. Knowledge generation accepts provider refs and forwards them to the local LLM gateway.
3. The local LLM gateway maps refs into OpenAI/Anthropic native request fields.

The current OpenRouter path is separate. It builds an OpenRouter message context and passes it to `OpenRouter.generate(...)`. Selected skills enter that context as ordinary system text. OpenRouter billing is settled from the `IOpenRouterGenerationSuccess.billing` returned by the OpenRouter wrapper, and the assistant message metadata records the OpenRouter selected model and reasoning values.

Because the current OpenRouter wrapper has no provider-native skill field and the checked OpenRouter docs do not document OpenAI/Anthropic Skills mounting through OpenRouter, provider-native skill use in `react-by/openrouter` is not present in the current codebase. The current behavior is prompt instruction skill use.

## Historical Context

- `thoughts/shared/tickets/singlepagestartup/ISSUE-193.md` created the provider-native Skills scope and originally named `react-by/knowledge` in the implementation notes.
- The current operator correction supersedes the earlier narrow endpoint note: provider-native skills must be researched and planned for `react-by/openrouter`, because that endpoint is now the primary Knowledge chat reply path.
- `thoughts/shared/processes/singlepagestartup/ISSUE-193.md` records that implementation happened directly before normal research/plan workflow and that the first plan was later invalidated.
- `thoughts/shared/research/singlepagestartup/ISSUE-192.md` documented the predecessor state for profile-scoped Knowledge RAG in social chats.
- `thoughts/shared/plans/singlepagestartup/ISSUE-192.md` planned `social.chat.variant="knowledge"`, `/learn`, RBAC Knowledge reaction, agent dispatch, and frontend command picker.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-192.md` - baseline profile-scoped Knowledge/RAG in social chats.
- `thoughts/shared/processes/singlepagestartup/ISSUE-193.md` - process log for this issue, including the invalidated plan scope.

## Open Questions

- OpenRouter docs checked for this research do not document provider-native Skills fields. The codebase therefore has no verified OpenRouter-native request shape for OpenAI `skill_reference` or Anthropic `container.skills`.
- If provider-native Skills are required while the chat entrypoint remains `react-by/openrouter`, implementation must decide how `react-by/openrouter` selects or routes OpenAI/Anthropic provider-native generation while preserving the existing model/reasoning controls, metadata, and billing semantics.
- Auto model selection currently can produce any configured OpenRouter model candidate. Provider-native skills in the existing LLM gateway are limited to OpenAI and Anthropic providers, so auto-selection behavior with selected skills needs an explicit compatibility rule.
