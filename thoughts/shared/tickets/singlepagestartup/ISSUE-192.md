# Issue: feat: enable profile-scoped Knowledge RAG in social chats

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/192
**Status**: Research in Review
**Created**: 2026-05-25
**Priority**: high
**Size**: large

---

## Problem to Solve

Connect the Knowledge/RAG module to normal `social.profile` chat interactions so an AI profile can be trained from chat messages and later answer using knowledge linked specifically to that profile.

Target flow:

- A `social.chat` is created.
- A user `rbac.subject` and its linked `social.profile` are connected to the chat.
- An agent `rbac.subject variant="agent"` and `social.profile variant="artificial-intelligence"` with a slug like `chat-gpt-*` are connected to the chat.
- If `social.chat.variant === "knowledge"`, the AI profile replies through Knowledge/RAG.
- A `/learn` command in that chat stores the current message and supported attachments in the AI profile knowledge base.
- Later questions to that profile are answered with relevant RAG context from the profile-scoped knowledge base.

## Key Details

- Use `social.chat.variant` as the explicit response-mode switch:
  - `knowledge` means Knowledge/RAG mode;
  - `default` and `telegram` keep the existing non-RAG behavior.
- Add `knowledge` to `social.chat` SDK variants.
- Add an RBAC endpoint:
  `POST /:id/social-module/profiles/:socialModuleProfileId/chats/:socialModuleChatId/messages/:socialModuleMessageId/react-by/knowledge`.
- The endpoint must validate:
  - subject/profile/chat/message access;
  - `chat.variant === "knowledge"`;
  - replying profile has `variant="artificial-intelligence"`;
  - replying profile is connected to the chat.
- `/learn` flow:
  - strip the `/learn` prefix;
  - collect current message text and `.txt`, `.md`, `.markdown` attachments;
  - create or update `knowledge.document` with a deterministic slug based on `profileId`, `messageId`, `fileId`, and `contentHash`;
  - link the document to the AI profile through `profiles-to-knowledge-module-documents`;
  - run embedding indexing through `KnowledgeService.index({ documentId })`.
- Embedding indexing is required:
  - document content becomes a `knowledge.source`;
  - source content is split into chunks through `chunkText`;
  - chunks are embedded through `LlmEmbeddingClient.embedMany`;
  - embeddings are stored in `knowledge.chunk.embedding` using pgvector;
  - source/chunk relations are stored through `sources-to-chunks`;
  - the document receives `contentHash` and `lastIndexedAt`.
- Normal question flow in a `knowledge` chat:
  - call `KnowledgeService.generate({ query, profileId: assistantProfileId })`;
  - save the AI answer as a `social.message` in the same thread;
  - store citations, sources, model, and usage in `message.metadata.knowledge`.
- Use OpenAI through the existing `apps/llm` gateway, not direct provider calls from RBAC.

## Implementation Notes

- Do not include startup-specific changes.
- Do not hand-edit Drizzle SQL, snapshots, or `_journal.json`; run the matching `repository-generate` target if schema changes become necessary.
- V1 supports only `/learn` and text/markdown attachments.
- Knowledge documents are linked only to the AI profile replying in the chat.

## Acceptance Tests

- In `chat.variant="knowledge"`, `/learn` creates a document, profile-document relation, and runs embedding indexing.
- In `chat.variant="default"`, `/learn` does not index knowledge and keeps the existing non-RAG flow.
- A normal question in a `knowledge` chat calls `KnowledgeService.generate` with the AI profile id.
- Knowledge linked to one AI profile is not used by another AI profile.
- Run targeted `jest` and `tsc` checks for `@sps/social`, `@sps/rbac`, `@sps/knowledge`, and `@sps/agent`.
