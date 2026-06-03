---
date: 2026-05-25T12:16:25Z
researcher: flakecode
git_commit: ffa311a88c870df28f9bd892872b61bf934015f2
branch: main
repository: singlepagestartup
topic: "Profile-scoped Knowledge RAG in social chats"
tags: [research, codebase, social, rbac, knowledge, agent, llm, rag]
status: complete
last_updated: 2026-05-25
last_updated_by: flakecode
---

# Research: Profile-scoped Knowledge RAG in social chats

**Date**: 2026-05-25T12:16:25Z
**Researcher**: flakecode
**Git Commit**: ffa311a88c870df28f9bd892872b61bf934015f2
**Branch**: main
**Repository**: singlepagestartup

## Research Question

Document the current codebase state for connecting profile-scoped Knowledge/RAG behavior to `social.chat` interactions, including chat/profile variants, RBAC social chat reply routes, existing Knowledge ingestion and indexing, social message attachments, agent reply dispatch, and LLM gateway provider flow.

## Summary

The Social chat model currently stores `variant` as a text field with a default of `"default"`, and the SDK model currently publishes only `"default"` and `"telegram"` variants. Social profile variants currently include `"default"`, `"artificial-intelligence"`, and `"agent"`.

The RBAC subject controller currently exposes a chat-scoped OpenRouter reaction endpoint at `/react-by/openrouter`; no `/react-by/knowledge` route or matching SDK export exists in the inspected code. The OpenRouter handler builds context from thread messages, includes non-audio attachments as OpenRouter file/image URL parts, resolves the replying profile's RBAC subject, signs a JWT, and creates or updates social messages through the subject SDK.

The Knowledge module already supports profile-scoped search and generation. `KnowledgeService.search(...)` embeds the query, resolves documents linked to a profile through `profiles-to-knowledge-module-documents`, and filters vector search to those document ids. `KnowledgeService.generate(...)` uses that search output as grounded context for `LlmChatClient.generate(...)`.

Knowledge indexing already has the required embedding pipeline. `KnowledgeService.index(...)` checks embedding model dimensions and delegates to `KnowledgeIndexer`; the indexer reads document content, chunks it, calls `LlmEmbeddingClient.embedMany(...)`, upserts a `knowledge.source`, replaces source chunks, stores vectors in `knowledge.chunk.embedding`, and updates document indexing metadata.

There is one profile-bound social-to-knowledge ingestion path today: the RBAC skill run endpoint accepts a transcript, checks profile/chat/skill access, calls `KnowledgeService.ingestTranscript(...)`, indexes the created/updated document, then writes user and assistant social messages into the target chat/thread. This path is skill-scoped, not ordinary chat-message `/learn` ingestion.

The LLM gateway is OpenAI-compatible and exposes `/v1/chat/completions`, `/v1/embeddings`, and `/v1/models`. The gateway catalog includes OpenAI chat models and an Ollama embedding model; the Knowledge clients call the gateway through `LLM_SERVICE_URL`.

The main API app already imports and mounts the Knowledge module at `/api/knowledge`. The Knowledge app exposes custom runtime routes for status, models, search, generate, index, document reindex, Knowledge chat messages, and edit-suggestion approval/rejection.

The current subject social chat frontend is thread-scoped. The chat overview renders the message list for the active thread, and the message composer creates thread-scoped RBAC social messages with `description` and optional `files`. The inspected frontend message list does not call `/react-by/openrouter` or `/react-by/knowledge` directly; automatic replies are triggered downstream by the backend action logger and agent path after successful message creation.

## Detailed Findings

### Social Chat And Profile Variants

- `social.chat` publishes `variants = ["default", "telegram"]` from the SDK model (`libs/modules/social/models/chat/sdk/model/src/lib/index.ts:17`).
- The chat table field `variant` is a text column with default `"default"` (`libs/modules/social/models/chat/backend/repository/database/src/lib/fields/singlepage.ts:9`).
- `social.profile` publishes `variants = ["default", "artificial-intelligence", "agent"]` (`libs/modules/social/models/profile/sdk/model/src/lib/index.ts:17`).
- The Social backend mounts `profiles-to-knowledge-module-documents` at `/api/social/profiles-to-knowledge-module-documents` (`libs/modules/social/backend/app/api/src/lib/apps.ts:4`, `libs/modules/social/backend/app/api/src/lib/apps.ts:53`).
- The profile-to-knowledge relation stores `profileId` and `knowledgeModuleDocumentId` foreign keys with cascade deletes (`libs/modules/social/relations/profiles-to-knowledge-module-documents/backend/repository/database/src/lib/schema.ts:17`, `libs/modules/social/relations/profiles-to-knowledge-module-documents/backend/repository/database/src/lib/schema.ts:21`).

### RBAC Subject Social Routes

- The RBAC subject singlepage controller imports the current OpenRouter reaction handler but no Knowledge reaction handler is registered in the same import group (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:58`).
- The current OpenRouter reaction route is registered as `POST /:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/messages/:socialModuleMessageId/react-by/openrouter` with `RequestProfileSubjectIdOwner` middleware (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:442`).
- The controller method instantiates `SocialModuleProfileFindByIdChatFindByIdMessageReactByOpenrouter` with the subject service (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:804`).
- The RBAC subject server SDK has a dedicated `react-by/openrouter` action that posts multipart form data to the same path (`libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:40`, `libs/modules/rbac/models/subject/sdk/server/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:56`).
- The RBAC subject client SDK wraps that server action with a React Query mutation and logs the mutation into `globalActionsStore` (`libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:30`, `libs/modules/rbac/models/subject/sdk/client/src/lib/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:64`).
- The subject service DI surface includes social profile, skill, chat, thread, message, action, profile/chat/message/action relations, thread relations, and message/file relation services (`libs/modules/rbac/models/subject/backend/app/api/src/lib/di.ts:27`).
- The RBAC subject bootstrap binds `chatsToThreads`, `threadsToMessages`, and `messagesToFileStorageModuleFiles` services into the social module dependency object (`libs/modules/rbac/models/subject/backend/app/api/src/lib/bootstrap.ts:226`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/bootstrap.ts:236`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/bootstrap.ts:246`).

### Current OpenRouter Reply Handler

- The handler loads the requesting social profile and message by id, and requires message `description` before generation (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:806`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:817`).
- It resolves the thread id for the triggering message and reads message ids from that chat/thread (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:828`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:843`).
- It requires `data.shouldReplySocialModuleProfile` in the multipart body (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:835`).
- For each context message, it loads message-file relations and file records; image files become OpenRouter `image_url` content parts, other non-audio files become `file_url` parts (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:941`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:979`).
- It resolves the replying profile's RBAC subject through `subjectsToSocialModuleProfiles`, signs a reply JWT, and creates a status message in the same chat/thread (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1029`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1058`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1070`).
- It classifies the request, selects model candidates, builds generation context, and calls `generateFinalOpenRouterReply(...)` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1123`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1155`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:1191`).

### Social Message Creation And Attachments

- The RBAC message-create handler checks `RBAC_JWT_SECRET`, `RBAC_SECRET_KEY`, subject id, profile id, chat id, and profile/chat access before parsing multipart form data (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:30`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:58`).
- It parses the `data` form field as JSON, resolves the target thread id, and removes `threadId` from the model payload before creating the message (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:64`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:91`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:101`).
- It creates the `social.message`, links it to `chats-to-messages` and `threads-to-messages`, then stores uploaded files through file-storage and `messages-to-file-storage-module-files` (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:132`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:141`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:153`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:165`).
- It creates the author relation through `profiles-to-messages` and may trigger `notifyOtherSubjectsInChat(...)` asynchronously (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:268`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:289`).
- The `messages-to-file-storage-module-files` relation has `messageId`, `fileStorageModuleFileId`, and `orderIndex` columns (`libs/modules/social/relations/messages-to-file-storage-module-files/backend/repository/database/src/lib/schema.ts:14`, `libs/modules/social/relations/messages-to-file-storage-module-files/backend/repository/database/src/lib/schema.ts:17`, `libs/modules/social/relations/messages-to-file-storage-module-files/backend/repository/database/src/lib/schema.ts:21`).

### Subject Social Chat Frontend

- The subject chat overview component imports and renders the thread message-list component for the active social thread (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/overview/default/ClientComponent.tsx:5`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/overview/default/ClientComponent.tsx:1669`).
- The thread message-list client fetches messages through `socialModuleProfileFindByIdChatFindByIdThreadFindByIdMessageFind(...)` and actions through `socialModuleProfileFindByIdChatFindByIdActionFind(...)`, passing the active `socialModuleThreadId` into the request (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/client.tsx:15`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/client.tsx:37`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/client.tsx:42`).
- The message composer initializes the thread-scoped message create mutation with subject id, profile id, chat id, and thread id (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:285`).
- On submit, the composer sends `description` and optional `files` to the thread-scoped message create mutation (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:415`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:419`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:425`).
- The file picker is a hidden multi-file input that stores selected files in the message form before submit (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:781`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:786`, `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:791`).
- The visible send control submits the message form and does not call a reaction endpoint directly (`libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:848`).

### Agent Dispatch To Chat Reply Profiles

- `apps/api/app.ts` installs `ActionLoggerMiddleware` before mounting `/api/agent` and `/api/rbac` (`apps/api/app.ts:158`, `apps/api/app.ts:173`, `apps/api/app.ts:175`).
- `agentSocialModuleProfileHandler(...)` resolves the RBAC subject linked to the automatic reply profile and signs a JWT for that subject (`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:240`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:269`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:305`).
- The handler has a `telegram-bot` branch and an `open-router` branch keyed by `shouldReplySocialModuleProfile.slug` (`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:314`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:348`).
- The `open-router` branch skips Telegram bot commands and empty messages, resolves the original author subject, and calls `openRouterReplyMessageCreate(...)` (`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:350`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:360`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:364`, `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:383`).
- `openRouterReplyMessageCreate(...)` calls the RBAC subject SDK action `socialModuleProfileFindByIdChatFindByIdMessageFindByIdReactByOpenrouter(...)` with the author subject id, author profile id, chat id, message id, and `shouldReplySocialModuleProfile` payload (`libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1861`).

### Knowledge Search, Generate, And Chat

- `KnowledgeService` constructs repository, embedding, generation, and model clients from `getKnowledgeConfiguration()` and the LLM gateway URL (`libs/modules/knowledge/backend/app/api/src/lib/service.ts:25`, `libs/modules/knowledge/backend/app/api/src/lib/service.ts:27`, `libs/modules/knowledge/backend/app/api/src/lib/service.ts:34`, `libs/modules/knowledge/backend/app/api/src/lib/service.ts:39`).
- `search(...)` trims the query, embeds it through `LlmEmbeddingClient.embed(...)`, resolves profile-linked documents when `profileId` is provided, and passes document ids to `repository.searchChunks(...)` (`libs/modules/knowledge/backend/app/api/src/lib/service.ts:62`, `libs/modules/knowledge/backend/app/api/src/lib/service.ts:74`, `libs/modules/knowledge/backend/app/api/src/lib/service.ts:76`, `libs/modules/knowledge/backend/app/api/src/lib/service.ts:84`).
- If `profileId` is provided but no documents are linked to that profile, `search(...)` returns an empty result array (`libs/modules/knowledge/backend/app/api/src/lib/service.ts:80`).
- `generate(...)` gets the selected model, calls `search(...)`, loads the profile for role context, calls `LlmChatClient.generate(...)`, and returns answer, sources, model/provider info, and usage (`libs/modules/knowledge/backend/app/api/src/lib/service.ts:95`, `libs/modules/knowledge/backend/app/api/src/lib/service.ts:104`, `libs/modules/knowledge/backend/app/api/src/lib/service.ts:105`, `libs/modules/knowledge/backend/app/api/src/lib/service.ts:109`, `libs/modules/knowledge/backend/app/api/src/lib/service.ts:121`).
- `chatMessage(...)` is a Knowledge module chat helper that requires linked profile documents, writes knowledge-scoped user/assistant messages, searches by profile id, and stores citations/model/usage under `metadata.knowledge` (`libs/modules/knowledge/backend/app/api/src/lib/service.ts:131`, `libs/modules/knowledge/backend/app/api/src/lib/service.ts:156`, `libs/modules/knowledge/backend/app/api/src/lib/service.ts:181`, `libs/modules/knowledge/backend/app/api/src/lib/service.ts:198`, `libs/modules/knowledge/backend/app/api/src/lib/service.ts:219`).

### Knowledge Ingestion And Indexing

- `KnowledgeService.index(...)` calls `assertEmbeddingModelDimensions()` before creating `KnowledgeIndexer` and delegating to `indexer.index(...)` (`libs/modules/knowledge/backend/app/api/src/lib/service.ts:268`, `libs/modules/knowledge/backend/app/api/src/lib/service.ts:275`).
- `ingestTranscript(...)` trims the transcript, checks embedding model dimensions, calls `repository.upsertTranscriptDocumentForProfile(...)`, and then indexes the returned document id (`libs/modules/knowledge/backend/app/api/src/lib/service.ts:300`, `libs/modules/knowledge/backend/app/api/src/lib/service.ts:310`, `libs/modules/knowledge/backend/app/api/src/lib/service.ts:316`, `libs/modules/knowledge/backend/app/api/src/lib/service.ts:318`, `libs/modules/knowledge/backend/app/api/src/lib/service.ts:322`).
- `upsertTranscriptDocumentForProfile(...)` builds a transcript hash, deterministic slug from profile/thread/skill/hash, document metadata, and creates or updates a `knowledge.document` with `status: "imported"` (`libs/modules/knowledge/backend/app/api/src/lib/repository.ts:231`, `libs/modules/knowledge/backend/app/api/src/lib/repository.ts:241`, `libs/modules/knowledge/backend/app/api/src/lib/repository.ts:248`, `libs/modules/knowledge/backend/app/api/src/lib/repository.ts:257`, `libs/modules/knowledge/backend/app/api/src/lib/repository.ts:276`).
- The same repository method calls `ensureProfileDocumentRelation(...)`, which inserts into `sl_ps_to_ke_me_ds_gch` when a profile/document relation does not already exist (`libs/modules/knowledge/backend/app/api/src/lib/repository.ts:306`, `libs/modules/knowledge/backend/app/api/src/lib/repository.ts:885`, `libs/modules/knowledge/backend/app/api/src/lib/repository.ts:901`).
- `KnowledgeIndexer.index(...)` can import filesystem content files when no document id is specified, then loads documents through `repository.listDocumentsForIndex(...)` and indexes each document (`libs/modules/knowledge/backend/app/api/src/lib/indexer/index.ts:33`, `libs/modules/knowledge/backend/app/api/src/lib/indexer/index.ts:55`, `libs/modules/knowledge/backend/app/api/src/lib/indexer/index.ts:67`, `libs/modules/knowledge/backend/app/api/src/lib/indexer/index.ts:72`).
- `indexDocument(...)` trims `document.description`, computes content hash, chunks text with `chunkText(...)`, skips empty content, and skips already-indexed unchanged content (`libs/modules/knowledge/backend/app/api/src/lib/indexer/index.ts:84`, `libs/modules/knowledge/backend/app/api/src/lib/indexer/index.ts:88`, `libs/modules/knowledge/backend/app/api/src/lib/indexer/index.ts:89`, `libs/modules/knowledge/backend/app/api/src/lib/indexer/index.ts:91`, `libs/modules/knowledge/backend/app/api/src/lib/indexer/index.ts:102`).
- For indexing work, it embeds all chunk text with `embeddingClient.embedMany(...)`, upserts a source for the document, deletes old source chunks, inserts new chunks and source/chunk relations, and updates document `contentHash` (`libs/modules/knowledge/backend/app/api/src/lib/indexer/index.ts:130`, `libs/modules/knowledge/backend/app/api/src/lib/indexer/index.ts:133`, `libs/modules/knowledge/backend/app/api/src/lib/indexer/index.ts:146`, `libs/modules/knowledge/backend/app/api/src/lib/indexer/index.ts:147`, `libs/modules/knowledge/backend/app/api/src/lib/indexer/index.ts:164`).
- The `knowledge.chunk` schema stores vectors in `embedding` with `vector(..., { dimensions: 768 })` (`libs/modules/knowledge/models/chunk/backend/repository/database/src/lib/fields/singlepage.ts:4`, `libs/modules/knowledge/models/chunk/backend/repository/database/src/lib/fields/singlepage.ts:22`).
- The `knowledge.document` schema stores `description`, `metadata`, `contentHash`, and `lastIndexedAt` (`libs/modules/knowledge/models/document/backend/repository/database/src/lib/fields/singlepage.ts:20`, `libs/modules/knowledge/models/document/backend/repository/database/src/lib/fields/singlepage.ts:29`, `libs/modules/knowledge/models/document/backend/repository/database/src/lib/fields/singlepage.ts:34`, `libs/modules/knowledge/models/document/backend/repository/database/src/lib/fields/singlepage.ts:35`).
- `repository.searchChunks(...)` performs pgvector distance search over `knowledge.chunk.embedding`, optionally filtering sources by `metadata->>'documentId'` from the profile-linked documents (`libs/modules/knowledge/backend/app/api/src/lib/repository.ts:520`, `libs/modules/knowledge/backend/app/api/src/lib/repository.ts:523`, `libs/modules/knowledge/backend/app/api/src/lib/repository.ts:525`, `libs/modules/knowledge/backend/app/api/src/lib/repository.ts:532`).

### Existing Skill-Bound Social RAG Route

- The RBAC skill run handler imports `KnowledgeService`, `LlmChatClient`, and social message/relation SDKs (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/thread/find-by-id/skill/find-by-id/run.ts:6`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/thread/find-by-id/skill/find-by-id/run.ts:9`).
- The handler requires `transcript`, validates profile/chat access and profile-skill access, loads the profile and skill, and rejects archived skills (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/thread/find-by-id/skill/find-by-id/run.ts:50`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/thread/find-by-id/skill/find-by-id/run.ts:57`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/thread/find-by-id/skill/find-by-id/run.ts:62`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/thread/find-by-id/skill/find-by-id/run.ts:67`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/thread/find-by-id/skill/find-by-id/run.ts:88`).
- It ingests and indexes the transcript through `knowledgeService.ingestTranscript(...)`, then calls the LLM gateway and writes user/assistant social messages with metadata containing the knowledge document id and model/provider usage (`libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/thread/find-by-id/skill/find-by-id/run.ts:98`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/thread/find-by-id/skill/find-by-id/run.ts:116`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/thread/find-by-id/skill/find-by-id/run.ts:131`, `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/thread/find-by-id/skill/find-by-id/run.ts:151`).

### LLM Gateway And OpenAI Provider

- `apps/api/app.ts` imports `knowledgeApp` and mounts it at `/api/knowledge` (`apps/api/app.ts:36`, `apps/api/app.ts:188`).
- The Knowledge app mounts its model/relation apps and custom routes in `useRoutes()` (`libs/modules/knowledge/backend/app/api/src/lib/app.ts:65`).
- The custom Knowledge routes currently include `/status`, `/models`, `/search`, `/generate`, `/index`, `/documents/:id/reindex`, `/chat/messages`, and edit-suggestion approve/reject routes (`libs/modules/knowledge/backend/app/api/src/lib/app.ts:70`, `libs/modules/knowledge/backend/app/api/src/lib/app.ts:76`, `libs/modules/knowledge/backend/app/api/src/lib/app.ts:83`, `libs/modules/knowledge/backend/app/api/src/lib/app.ts:89`, `libs/modules/knowledge/backend/app/api/src/lib/app.ts:95`, `libs/modules/knowledge/backend/app/api/src/lib/app.ts:101`, `libs/modules/knowledge/backend/app/api/src/lib/app.ts:107`, `libs/modules/knowledge/backend/app/api/src/lib/app.ts:113`, `libs/modules/knowledge/backend/app/api/src/lib/app.ts:119`).
- `apps/llm/main.py` mounts OpenAI-compatible routes for models, chat completions, embeddings, and audio (`apps/llm/main.py:30`, `apps/llm/main.py:31`, `apps/llm/main.py:32`, `apps/llm/main.py:33`).
- The singlepage gateway service constructs providers for Ollama, Anthropic, OpenAI, and HuggingFace (`apps/llm/singlepage/service.py:21`, `apps/llm/singlepage/service.py:32`).
- Chat completion validates a chat model, routes to the selected provider, and returns OpenAI-compatible response data with provider/model/usage metadata (`apps/llm/singlepage/service.py:56`, `apps/llm/singlepage/service.py:64`, `apps/llm/singlepage/service.py:66`, `apps/llm/singlepage/service.py:73`).
- Embeddings validate an embedding model, route to the selected provider, check vector dimensions, and return OpenAI-compatible embedding rows (`apps/llm/singlepage/service.py:93`, `apps/llm/singlepage/service.py:97`, `apps/llm/singlepage/service.py:106`, `apps/llm/singlepage/service.py:115`).
- The startup catalog includes OpenAI GPT-5.2 and GPT-5.5 chat model ids and a local Ollama `nomic/nomic-embed-text` embedding model with 768 dimensions (`apps/llm/startup/catalog.py:42`, `apps/llm/startup/catalog.py:50`, `apps/llm/startup/catalog.py:58`).
- Gateway settings include `openai_api_key`, `open_ai_api_key`, `anthropic_api_key`, and `ollama_url` (`apps/llm/config.py:8`, `apps/llm/config.py:11`, `apps/llm/config.py:14`).
- `LlmChatClient.complete(...)` posts to `${baseUrl}/v1/chat/completions`, and `LlmEmbeddingClient.embedMany(...)` posts to `${baseUrl}/v1/embeddings` (`libs/modules/knowledge/backend/app/api/src/lib/generation/index.ts:79`, `libs/modules/knowledge/backend/app/api/src/lib/embedding/index.ts:33`).

## Code References

- `libs/modules/social/models/chat/sdk/model/src/lib/index.ts:17` - current public chat variants.
- `libs/modules/social/models/chat/backend/repository/database/src/lib/fields/singlepage.ts:9` - chat variant database field.
- `libs/modules/social/models/profile/sdk/model/src/lib/index.ts:17` - current public profile variants.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/index.ts:442` - current OpenRouter reaction route.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/react-by-openrouter.ts:835` - OpenRouter reaction expects `shouldReplySocialModuleProfile`.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/message/create.ts:132` - subject-scoped social message creation.
- `libs/modules/social/relations/messages-to-file-storage-module-files/backend/repository/database/src/lib/schema.ts:17` - message/file attachment relation.
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:415` - frontend message form submit handler.
- `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/message/list/default/ClientComponent.tsx:781` - frontend multi-file input.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:348` - automatic `open-router` profile branch.
- `libs/modules/agent/models/agent/backend/app/api/src/lib/service/singlepage/index.ts:1861` - agent calls the RBAC OpenRouter reaction SDK.
- `libs/modules/knowledge/backend/app/api/src/lib/service.ts:62` - profile-aware Knowledge search entrypoint.
- `libs/modules/knowledge/backend/app/api/src/lib/service.ts:95` - Knowledge generation entrypoint.
- `libs/modules/knowledge/backend/app/api/src/lib/service.ts:268` - Knowledge indexing entrypoint.
- `libs/modules/knowledge/backend/app/api/src/lib/service.ts:300` - transcript ingestion entrypoint.
- `libs/modules/knowledge/backend/app/api/src/lib/indexer/index.ts:130` - chunk embedding call.
- `libs/modules/knowledge/models/chunk/backend/repository/database/src/lib/fields/singlepage.ts:22` - pgvector embedding field.
- `libs/modules/rbac/models/subject/backend/app/api/src/lib/controller/singlepage/social-module/profile/find-by-id/chat/find-by-id/thread/find-by-id/skill/find-by-id/run.ts:98` - existing social skill transcript ingestion into Knowledge.
- `apps/api/app.ts:188` - Knowledge API mount.
- `libs/modules/knowledge/backend/app/api/src/lib/app.ts:83` - Knowledge custom search route.
- `apps/llm/singlepage/service.py:56` - gateway chat completion flow.
- `apps/llm/singlepage/service.py:93` - gateway embedding flow.

## Architecture Documentation

Social chat behavior is split across generic Social model/relation APIs and RBAC subject-scoped orchestration. The social module owns `chat`, `thread`, `message`, `profile`, and relation storage; RBAC subject controllers enforce authenticated subject/profile/chat boundaries and call social SDKs with secret headers.

The subject social chat UI works through thread-scoped RBAC SDK calls. It creates messages with text and optional files, while the automatic AI response path is currently an API-side side effect of the action logger and agent service rather than a direct client-side reaction call.

Automatic AI replies currently pass through the agent module. The action logger observes successful RBAC social message creation, the agent service finds automatic profiles in the chat, and the `open-router` profile branch calls the RBAC OpenRouter reaction endpoint. This makes the current AI reply route profile-slug based.

Knowledge already has a mounted API surface, a profile/document relation, and a profile-scoped search path. Profile scoping happens by first resolving document ids from `profiles-to-knowledge-module-documents`, then filtering chunk search to sources whose metadata points at those document ids.

Knowledge indexing is document-centric. A document's `description` is the indexed content; the indexer creates a source for the document, chunks the source content, embeds chunks, writes vectors, creates source/chunk relations, and records content hash/index timestamp on the document.

The LLM gateway is the integration point used by Knowledge for chat completions and embeddings. Knowledge clients call OpenAI-compatible endpoints exposed by `apps/llm`; provider selection happens inside the gateway from catalog model ids.

## Historical Context

- `thoughts/shared/research/singlepagestartup/ISSUE-154.md` documents thread-aware social chat work. It records that subject-scoped message creation creates chat/thread/profile/file relations and that thread-targeted writes should use canonical profile-thread SDK routes rather than passing `threadId` inside message `data` (`thoughts/shared/research/singlepagestartup/ISSUE-154.md:69`, `thoughts/shared/research/singlepagestartup/ISSUE-154.md:315`).
- `thoughts/shared/research/singlepagestartup/ISSUE-189.md` documents Telegram message persistence and attachments. It records that the RBAC message-create handler creates `social.message`, chat/thread/profile relations, file records, and `messages-to-file-storage-module-files` rows (`thoughts/shared/research/singlepagestartup/ISSUE-189.md:60`).
- `thoughts/shared/research/singlepagestartup/ISSUE-164.md` summarizes the current subject social chat UI and relation composition, including `profiles-to-chats`, `chats-to-threads`, `threads-to-messages`, `profiles-to-messages`, and `messages-to-file-storage-module-files` (`thoughts/shared/research/singlepagestartup/ISSUE-164.md:82`).

## Related Research

- `thoughts/shared/research/singlepagestartup/ISSUE-154.md` - Social chat threads and thread-aware replies.
- `thoughts/shared/research/singlepagestartup/ISSUE-189.md` - Telegram message attachments and transcription path.
- `thoughts/shared/research/singlepagestartup/ISSUE-164.md` - Social chat UI and relation architecture.

## Open Questions

- No `/react-by/knowledge` route, SDK action, or agent dispatch branch for `chat-gpt-*` profiles was found in the current code.
- No ordinary social message `/learn` ingestion method was found in `KnowledgeService`; current social-to-knowledge ingestion is skill-transcript scoped.
- No `knowledge` chat variant is currently published in the `social.chat` SDK variants array.

## Known Pitfalls (from implementation)

### Incident 1 — Frontend command test environment gaps

- **Occurrences**: 3
- **Stage**: Phase 5 - Knowledge Chat Frontend
- **Symptom**: The command picker frontend spec failed on missing `ResizeObserver`, missing `scrollIntoView`, and unavailable jest-dom matchers such as `toBeDisabled`.
- **Root Cause**: The RBAC frontend Jest environment is jsdom without browser-only APIs and without jest-dom matcher setup, while shadcn/cmdk command primitives expect those APIs during layout effects.
- **Fix**: Add test-local jsdom polyfills for `ResizeObserver`, `scrollTo`, and `scrollIntoView`; use plain DOM property assertions instead of jest-dom-only matchers.
- **Reusable Pattern**: For RBAC frontend specs around command/popover primitives, add local browser API polyfills in `beforeEach` and assert native DOM properties unless the package explicitly configures jest-dom.
