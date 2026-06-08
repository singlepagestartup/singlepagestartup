# Issue: feat: sync profile skills to provider-native AI Skills for Knowledge chats

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/193
**Status**: Research Needed
**Created**: 2026-06-04
**Priority**: high
**Size**: large

---

## Problem to Solve

When an artificial-intelligence `social.profile` participates in a `social.chat` with `variant="knowledge"`, the profile's linked `social.skill` records should be used as provider-native AI Skills for OpenAI and Anthropic API calls. Today the RAG chat flow can learn and answer from profile-scoped Knowledge documents, but profile skills are not synchronized to provider-native Skills or passed into generation.

## Key Details

- Reuse existing `social.skill` and `profiles-to-skills`; do not introduce a schema migration in V1 unless implementation proves `metadata` is insufficient.
- Generate a minimal Agent Skills bundle from each `social.skill` using `slug`, `title`, `description`, and optional metadata.
- Store provider sync references under `social.skill.metadata.providerSkills`, including provider, provider skill id, version, content hash, sync timestamp, and source skill id.
- Add an authenticated RBAC endpoint:
  `POST /api/rbac/subjects/:id/social-module/profiles/:socialModuleProfileId/skills/provider-sync`
  with body `{ providers: ["openai", "anthropic"], skillIds?: string[] }`.
- The sync endpoint must only sync skills linked to the requested profile and must ignore or reject archived skills.
- Extend the LLM gateway chat request to accept `provider_skills`.
- For OpenAI, use Responses API hosted shell with `tools[].environment.skills` and `skill_reference` entries.
- For Anthropic, use Messages API beta with `container.skills`, Skills beta headers, and code execution.
- Extend Knowledge generation so `react-by/knowledge` loads non-archived skills linked to the replying AI profile, requires fresh provider refs for the selected model provider, passes them into generation, and writes applied skill ids/provider refs into `message.metadata.knowledge.skills`.
- Keep `/learn` behavior unchanged; skills affect answer generation only, not ingestion/indexing.

## Implementation Notes

Current surfaces to update:

- `libs/modules/social/models/skill/backend/repository/database/src/lib/fields/singlepage.ts`
- `libs/modules/knowledge/backend/app/api/src/lib/generation/index.ts`
- `apps/llm/singlepage/providers.py`
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-knowledge.ts`

Provider docs:

- OpenAI Agent Skills: https://developers.openai.com/api/docs/guides/tools-skills
- Anthropic Agent Skills: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
- Anthropic API quickstart: https://platform.claude.com/docs/en/agents-and-tools/agent-skills/quickstart

## Acceptance Tests

- BDD unit coverage for skill bundle generation, provider metadata hashing, stale-provider-ref detection, and archived skill exclusion.
- RBAC tests proving only profile-linked skills are synced and only the replying AI profile's skills are used.
- LLM gateway tests asserting exact OpenAI and Anthropic request payloads include provider-native skill references.
- Knowledge reaction tests proving normal RAG answers pass provider skills, `/learn` does not, and unsupported providers fail clearly.
- Targeted checks for `@sps/social`, `@sps/rbac`, `@sps/knowledge`, `@sps/agent`, plus `apps/llm` provider tests.
