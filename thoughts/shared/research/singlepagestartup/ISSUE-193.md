---
date: 2026-06-13T23:22:05+0300
researcher: flakecode
git_commit: 93fcafc4c767f0cf7c72b703e851ab673c0bee5b
branch: issue-195
repository: singlepagestartup
topic: "Provider-native profile skills for Knowledge chats"
tags: [research, codebase, social, rbac, knowledge, llm, skills]
status: complete
last_updated: 2026-06-13
last_updated_by: flakecode
---

# Research: Provider-Native Profile Skills For Knowledge Chats

**Date**: 2026-06-13T23:22:05+0300
**Researcher**: flakecode
**Git Commit**: 93fcafc4c767f0cf7c72b703e851ab673c0bee5b
**Branch**: issue-195
**Repository**: singlepagestartup

## Research Question

Document how the current codebase represents `social.skill`, links skills to `social.profile`, syncs linked skills to provider-native OpenAI/Anthropic Skills, and passes skill references through Knowledge/LLM generation for `social.chat.variant="knowledge"` flows.

This is reconciliation research for issue 193: the process log records that implementation happened directly before the normal research and plan phases, so this document describes the live code as it exists now.

## Summary

`social.skill` stores skill instructions in ordinary model fields and keeps provider sync state in generic `metadata` JSONB. The model has `title`, `description`, `status`, `defaultModelSlug`, `allowedModelSlugs`, `metadata`, `adminTitle`, and unique `slug` fields (`libs/modules/social/models/skill/backend/repository/database/src/lib/fields/singlepage.ts:4`). Profiles link to skills through `profiles-to-skills`, whose relation table stores `profileId`, `skillId`, `orderIndex`, and `variant` (`libs/modules/social/relations/profiles-to-skills/backend/repository/database/src/lib/schema.ts:10`).

RBAC exposes a profile-scoped provider sync endpoint at `POST /:id/social-module/profiles/:socialModuleProfileId/skills/provider-sync`, registered behind `RequestProfileSubjectIdOwner` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:504`). The handler loads skills linked through `profiles-to-skills`, rejects unlinked requested skill ids, skips archived skills, uploads a generated `SKILL.md` bundle to OpenAI and/or Anthropic, and writes returned references under `social.skill.metadata.providerSkills` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-sync.ts:46`).

Provider bundle creation and metadata freshness are centralized in `provider-skills.ts`. A bundle is rendered from `slug`, `title`, and `description` as a markdown `SKILL.md` with frontmatter; its SHA-256 hash is stored as `contentHash` and used to detect stale provider refs (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-skills.ts:44`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-skills.ts:113`).

The Knowledge generation client and local LLM gateway support provider-native skill references. `LlmChatClient.complete(...)` conditionally serializes `provider_skills` into the `/v1/chat/completions` request body (`libs/modules/knowledge/backend/app/api/src/lib/generation/index.ts:99`). The LLM gateway schema accepts `provider_skills`, validates that they match OpenAI or Anthropic models, and mounts them into provider-specific payloads (`apps/llm/singlepage/schemas.py:11`, `apps/llm/singlepage/service.py:56`, `apps/llm/singlepage/service.py:162`).

The current `react-by-knowledge` handler contains provider-native helper code, but its active `resolveKnowledgeSkills(...)` path returns selected skills as prompt instructions and returns `providerSkills: []` in both selected-skill and no-skill branches (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.ts:727`). The file also contains `findProviderSkillsForProfile(...)`, which can validate fresh provider refs and convert them for Knowledge generation, but current references in the file show it is declared and not invoked (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.ts:928`).

The current OpenRouter reaction path, which the later chat controls work uses as the main chat reply path, has its own `@knowledge`, `/learn`, and `@skill` handling. It resolves selected or mentioned linked skills as prompt-instruction system messages and does not contain `providerSkills` handling (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1573`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1853`).

## Detailed Findings

### Social Skill Model And Profile Links

- `social.skill` uses `metadata: jsonb` for arbitrary structured state, which is the storage location used for `providerSkills` references (`libs/modules/social/models/skill/backend/repository/database/src/lib/fields/singlepage.ts:22`).
- The public skill SDK currently exposes only the `default` variant for `social.skill` (`libs/modules/social/models/skill/sdk/model/src/lib/index.ts:17`).
- `profiles-to-skills` is the profile/skill link relation. It stores foreign keys to profile and skill rows with cascade delete, and includes `orderIndex` for ordered rendering/use (`libs/modules/social/relations/profiles-to-skills/backend/repository/database/src/lib/schema.ts:10`).
- The admin-v2 skill form renders editable fields for title, slug, description, status, default model slug, class name, and variant (`libs/modules/social/models/skill/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:30`). It also exposes a `Relations` tab for `profilesToSkills` when the parent supplies that relation component (`libs/modules/social/models/skill/frontend/component/src/lib/singlepage/admin-v2/form/ClientComponent.tsx:58`).

### Provider Sync Endpoint

- RBAC imports the provider sync handler in the subject singlepage controller (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:66`) and registers `POST /:id/social-module/profiles/:socialModuleProfileId/skills/provider-sync` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:504`).
- The provider sync request body accepts `providers?: ("openai" | "anthropic")[]`, `skillIds?: string[]`, and `force?: boolean` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-sync.ts:17`).
- Omitted or empty `providers` defaults to both supported providers; invalid provider entries throw a validation error (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-skills.ts:81`).
- The handler verifies the profile exists, loads linked skill ids through `profilesToSkills.find(...)`, targets either requested ids or all linked ids, and rejects requested ids that are not linked to the profile (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-sync.ts:56`).
- Archived linked skills are reported in `skipped` and are not uploaded (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-sync.ts:78`).
- For each non-archived target skill/provider pair, the handler reuses a fresh reference unless `force` is true; otherwise it uploads the bundle, builds an `IProviderSkillReference`, writes it into metadata, and updates the skill row (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-sync.ts:220`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-sync.ts:251`).

### Provider Skill Bundle And Metadata

- `buildProviderSkillBundle(...)` derives `title`, normalized `name`, stringified instructions, normalized provider description, rendered `SKILL.md`, and SHA-256 `contentHash` from a `social.skill` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-skills.ts:44`).
- The generated markdown uses YAML-like frontmatter fields `name` and `description`, followed by an H1 title and the skill instructions (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-skills.ts:53`).
- Stored provider references contain `provider`, `providerSkillId`, optional `version`, `name`, `sourceSkillId`, `sourceSkillSlug`, `contentHash`, and `syncedAt` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-skills.ts:17`).
- Freshness requires a stored `providerSkillId`, a matching rendered bundle hash, and the same source skill id (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-skills.ts:113`).
- `putProviderSkillReference(...)` preserves existing metadata and merges the new reference at `metadata.providerSkills[provider]` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-skills.ts:144`).

### Provider Upload Calls

- OpenAI sync reads `OPEN_AI_API_KEY` from shared utils or falls back to `process.env.OPENAI_API_KEY`, appends a `${bundle.name}/SKILL.md` markdown blob as `files[]`, and posts to `https://api.openai.com/v1/skills` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-skills.ts:197`).
- Anthropic sync reads `ANTHROPIC_API_KEY`, appends the same `files[]` style payload, and posts to `https://api.anthropic.com/v1/skills` with `anthropic-version` and beta headers for code execution, skills, and files (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-skills.ts:234`).
- Upload response parsing accepts provider skill ids from `id`, `skill_id`, `skill.id`, or `data.id`, and derives version from `version`, `latest_version`, `skill.version`, or `"latest"` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-skills.ts:274`).

### SDK Surface

- The server SDK action posts JSON to `/api/rbac/subjects/:id/social-module/profiles/:socialModuleProfileId/skills/provider-sync` and exposes typed request/result shapes for providers, skill ids, force, synced results, skipped results, and references (`libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/skill/provider-sync.ts:1`).
- The client SDK wraps the server action in a React Query mutation, saturates headers, uses `clientHost`, reports errors through `sonner`, and logs successful mutations to `globalActionsStore` (`libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/social-module/profile/find-by-id/skill/provider-sync.ts:1`).
- Both client and server singlepage SDK barrels export the provider sync props, result, and action names (`libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/index.ts:233`, `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/index.ts:266`).

### Knowledge Generation And Provider Skills

- `KnowledgeGenerationProps` and `KnowledgeChatCompletionProps` both accept `providerSkills?: IKnowledgeProviderSkillReference[]` (`libs/modules/knowledge/backend/app/api/src/lib/generation/index.ts:28`, `libs/modules/knowledge/backend/app/api/src/lib/generation/index.ts:49`).
- `LlmChatClient.generate(...)` forwards `props.providerSkills` to `complete(...)` after building the grounded prompt (`libs/modules/knowledge/backend/app/api/src/lib/generation/index.ts:74`).
- `LlmChatClient.complete(...)` serializes `provider_skills` only when the provider skill array is non-empty (`libs/modules/knowledge/backend/app/api/src/lib/generation/index.ts:99`).
- `buildGroundedPrompt(...)` keeps selected prompt skills in prompt text under `Selected skills`, while provider-native skill refs are not inserted into the prompt (`libs/modules/knowledge/backend/app/api/src/lib/generation/index.ts:170`).
- `KnowledgeService.generate(...)` accepts `providerSkills` and passes them to the generation client alongside query, contexts, persona, prompt skill instructions, and chat history (`libs/modules/knowledge/backend/app/api/src/lib/service.ts:154`).

### LLM Gateway Provider-Native Mounts

- The gateway request schema defines `ProviderSkillReference` and `ChatCompletionRequest.provider_skills` (`apps/llm/singlepage/schemas.py:11`).
- `GatewayService.chat_completion(...)` resolves a chat model, filters/validates provider skills with `_provider_skills_for_model(...)`, and passes them to the selected provider's `chat(...)` call (`apps/llm/singlepage/service.py:56`).
- `_provider_skills_for_model(...)` rejects provider skills for non-OpenAI/non-Anthropic models and rejects refs whose `provider` does not match the selected model provider (`apps/llm/singlepage/service.py:162`).
- OpenAI skill refs are converted to `{ type: "skill_reference", skill_id, version? }` (`apps/llm/singlepage/providers.py:41`).
- Anthropic skill refs are converted to `{ type: "custom", skill_id, version? }` (`apps/llm/singlepage/providers.py:53`).
- When OpenAI provider skills are present, `OpenAIProvider` uses `client.responses.create(...)` and adds a shell tool with `environment.type = "container_auto"` and `environment.skills = [...]` (`apps/llm/singlepage/providers.py:270`).
- When Anthropic provider skills are present, `AnthropicProvider` uses `client.beta.messages.create(...)`, sends betas including `skills-2025-10-02`, passes `container.skills`, and enables code execution (`apps/llm/singlepage/providers.py:184`).

### Legacy `react-by-knowledge` Skill Behavior

- The Knowledge reaction route remains registered at `POST /:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/messages/:socialModuleMessageId/react-by/knowledge` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:457`).
- `answerFromKnowledge(...)` reads `data.skillIds`, detects `@knowledge`, strips control mentions for selected skills/knowledge, loads profile-linked knowledge document ids, reads thread chat history, resolves the selected Knowledge model, resolves skills, and calls `KnowledgeService.generate(...)` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.ts:627`).
- `resolveKnowledgeSkills(...)` currently returns prompt skills when `requestedSkillIds` are present and returns `providerSkills: []`; with no requested skill ids it returns empty prompt and provider skill arrays (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.ts:727`).
- The same file contains `findProviderSkillsForProfile(...)`, which loads active profile skills, verifies OpenAI/Anthropic provider support, checks stale provider metadata, and converts references to Knowledge provider-skill format, but the current file references show it is not called by `resolveKnowledgeSkills(...)` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.ts:928`).
- Applied skill metadata can serialize both prompt-instruction and provider-native modes, depending on the arrays passed into `toAppliedKnowledgeSkillMetadata(...)` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.ts:893`).

### Current OpenRouter Knowledge/Skill Path

- `react-by-openrouter` parses query params `model` and `reasoning`, with `reasoning` allowed values `auto`, `none`, `low`, `medium`, `high`, and `xhigh` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1510`).
- During execution, the handler reads `data.skillIds`, detects `@knowledge`, detects mentioned skill slugs, and sanitizes the trigger query by removing control mentions when skills or knowledge are active (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:884`).
- `resolveOpenRouterKnowledgeContext(...)` loads mentioned skill slugs, resolves selected prompt skills linked to the reply profile, resolves profile-linked document ids, runs Knowledge search only when knowledge was requested, and returns system messages for prompt skills and Knowledge fragments (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1573`).
- `findPromptSkillsForProfile(...)` accepts selected skill ids and mentioned skill slugs, verifies selected ids are linked to the profile, filters archived skills, and returns active linked skill rows (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1731`).
- `toSkillSystemPrompt(...)` formats selected skills as a system prompt containing each `@slug`, optional title, and `description` instructions (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1853`).
- OpenRouter reply metadata stores `useKnowledgeSearch`, `documentIds`, citations/sources, `requestedSkillIds`, prompt skill metadata, and selected OpenRouter model/reasoning values (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1417`).
- A repo search for `providerSkills` in `react-by-openrouter.ts` returns no matches, so current OpenRouter skill usage is prompt-instruction based rather than provider-native.

### Tests

- `provider-sync.spec.ts` covers fresh sync upload/storage, fresh metadata skip, stale hash detection, archived skill skip, and unlinked skill rejection (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-sync.spec.ts:98`).
- `generation/index.spec.ts` covers that Knowledge generation includes provider-native skill references as `provider_skills` outside the prompt body (`libs/modules/knowledge/backend/app/api/src/lib/generation/index.spec.ts:87`).
- `apps/llm/tests/test_gateway.py` covers matching-provider dispatch, unsupported provider rejection, OpenAI Responses shell skill mounts, and Anthropic beta `container.skills` mounts (`apps/llm/tests/test_gateway.py:216`, `apps/llm/tests/test_gateway.py:375`, `apps/llm/tests/test_gateway.py:446`).
- `react-by-knowledge.spec.ts` covers `/learn`, `@knowledge` RAG, no-hidden-RAG normal generation, thread history, no silent linked-skill application, selected prompt skills, and combining `@knowledge` with selected prompt skills (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.spec.ts:311`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.spec.ts:698`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.spec.ts:745`).

## Code References

- `libs/modules/social/models/skill/backend/repository/database/src/lib/fields/singlepage.ts:4` - `social.skill` field set, including `description`, `status`, `allowedModelSlugs`, and `metadata`.
- `libs/modules/social/relations/profiles-to-skills/backend/repository/database/src/lib/schema.ts:10` - profile/skill link relation.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:504` - provider-sync route registration.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-sync.ts:46` - provider sync handler entrypoint.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-skills.ts:44` - provider bundle creation.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-skills.ts:197` - OpenAI Skills upload.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/skill/provider-skills.ts:234` - Anthropic Skills upload.
- `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/skill/provider-sync.ts:1` - server SDK provider-sync action.
- `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/social-module/profile/find-by-id/skill/provider-sync.ts:1` - client SDK provider-sync mutation.
- `libs/modules/knowledge/backend/app/api/src/lib/generation/index.ts:19` - Knowledge provider skill reference shape.
- `libs/modules/knowledge/backend/app/api/src/lib/generation/index.ts:99` - conditional `provider_skills` gateway payload serialization.
- `apps/llm/singlepage/schemas.py:11` - LLM gateway provider skill request schema.
- `apps/llm/singlepage/service.py:162` - gateway validation for supported/matching provider skills.
- `apps/llm/singlepage/providers.py:41` - OpenAI/Anthropic provider skill payload helpers.
- `apps/llm/singlepage/providers.py:184` - Anthropic beta Messages `container.skills` branch.
- `apps/llm/singlepage/providers.py:270` - OpenAI Responses API branch with shell environment skills.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.ts:727` - current legacy Knowledge skill resolution returns prompt skills and empty provider skill refs.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1573` - current OpenRouter knowledge/skill context resolver.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1853` - OpenRouter prompt skill system message builder.

## Architecture Documentation

The current implementation keeps provider-native sync state on the `social.skill` record rather than introducing a new table. `profiles-to-skills` remains the ownership/scope relation that determines which skills can be synced or selected for a replying profile.

RBAC owns subject/profile-scoped orchestration. The provider-sync endpoint is mounted under the RBAC subject profile route and uses the same owner middleware pattern as the chat reaction endpoints. The sync handler itself loads profile-linked skill ids from the Social relation service before it touches provider APIs.

Provider sync and provider use are split. Sync uploads the generated `SKILL.md` and stores provider references in `social.skill.metadata.providerSkills`. Generation support is implemented lower in the Knowledge client and LLM gateway: when a non-empty provider skill reference array reaches `LlmChatClient.complete(...)`, it becomes `provider_skills` in the local gateway request, and the gateway maps it to OpenAI or Anthropic native request fields.

Knowledge chats currently have two related reply implementations. The legacy `react-by-knowledge` endpoint can call `KnowledgeService.generate(...)` and has interfaces for provider skill refs, but the active resolver currently supplies selected `@skill` behavior as prompt instructions. The current OpenRouter endpoint is the richer chat path for model/reasoning controls, `@knowledge`, `/learn`, and `@skill`; it also uses prompt-instruction skills and profile-scoped Knowledge fragments.

Knowledge itself remains the RAG engine. It accepts provider skills and prompt skill instructions as generation inputs, but profile/document scoping is still resolved by RBAC or Knowledge service callers before generation.

## Historical Context

- `thoughts/shared/tickets/singlepagestartup/ISSUE-193.md` created the provider-native Skills scope: reuse `social.skill` and `profiles-to-skills`, store references in `metadata.providerSkills`, add provider sync, extend the LLM gateway, and integrate with Knowledge chats.
- `thoughts/shared/processes/singlepagestartup/ISSUE-193.md` records that implementation was done directly before normal research/plan workflow, and that this research is a reconciliation pass over live code.
- `thoughts/shared/research/singlepagestartup/ISSUE-192.md` documented the predecessor state for profile-scoped Knowledge RAG in social chats: Knowledge had profile-scoped search/generation/indexing, while the social chat bridge was still being introduced.
- `thoughts/shared/plans/singlepagestartup/ISSUE-192.md` planned `social.chat.variant="knowledge"`, `/learn`, RBAC Knowledge reaction, agent dispatch, and frontend command picker. Issue 193 builds on those profile-scoped Knowledge chat surfaces.
- `thoughts/shared/processes/singlepagestartup/ISSUE-192.md` records completion of the baseline Knowledge/RAG social chat implementation and reusable learnings around `social.chat.variant` as the RAG routing switch.

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-192.md` - Baseline profile-scoped Knowledge/RAG in social chats.
- `thoughts/shared/plans/singlepagestartup/ISSUE-192.md` - Implementation plan for Knowledge chat variant, `/learn`, and RBAC reaction integration.
- `thoughts/shared/processes/singlepagestartup/ISSUE-193.md` - Process log for this issue, including direct implementation history.

## Open Questions

- The live provider-sync endpoint and LLM gateway support provider-native skill references, while current `react-by-knowledge` and `react-by-openrouter` selected-skill behavior uses prompt instructions. The codebase therefore contains both provider-native infrastructure and prompt-instruction chat behavior.
- `findProviderSkillsForProfile(...)` exists in `react-by-knowledge.ts` and implements fresh provider-ref validation, but current live references show no call site in that file.
- Current OpenRouter chat flow has no `providerSkills` references; OpenRouter selected skills are rendered into system prompts.
