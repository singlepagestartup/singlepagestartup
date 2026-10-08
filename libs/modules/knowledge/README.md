# Knowledge

Knowledge stores editable materials as **Source**, derives **Chunk** vectors, and provides scoped retrieval and generation. Several Files can belong to one Source. The user's notes and analyzed file descriptions share its `content`.

The backend lives in `backend/app/api`; Source and Chunk have the standard model layers and SDKs. All associations use SPS relations. Social owns profile access, message origin/citations, and skill links. RBAC passes permitted `sourceIds` into Knowledge; Knowledge does not read Social permissions. An explicit empty scope returns no results.

## File analysis

File format is detected from stored bytes. The common material service processes every current attachment:

- PDF: render every page, transcribe text and tables, describe images and diagrams.
- Image: recognize text and describe the visual content.
- Video: describe frames at one-second intervals by default and combine them with time-aligned speech transcription.
- Audio: transcribe speech with segment timestamps.
- UTF-8 text: preserve its structure and timestamps.

The service combines these descriptions with user context into Source content. Files retain their original bytes and are linked through `sources-to-file-storage-module-files`. `/learn` reuses the Message's existing Files and creates one Source for the whole message. Repeating that operation uses the same Source and relations.

Content contains `Контекст пользователя`, `Сведения из материалов`, and `Общее описание` sections. The user section has `knowledge:user` Markdown markers. The server preserves its text during reconstruction; the model receives it as context. The editor keeps human notes editable and generated descriptions visible. A Source without Files can use ordinary text content.

Adding, detaching, replacing, reordering, or moving a File relation invalidates generated content and chunks atomically and analyzes all current Files. Moving a relation rebuilds both Sources. Physical File deletion captures affected Sources before cascade. Source deletion and relation detachment preserve stored Files. Failed analysis leaves human text and attachments available for retry and does not publish partial descriptions. Conditional publication rejects a changed content hash or attachment snapshot.

Stored File updates and deletions that affect Knowledge go through
`KnowledgeService.updateStoredFile` and `deleteStoredFile`. Knowledge captures
the affected Sources and calls the File Storage service in its transaction,
then rebuilds every affected Source from its current attachments. File Storage
has no dependency on Knowledge and does not start analysis itself. Its service
owns deletion of the original stored bytes and the File record.

## Indexing and search

The server computes SHA-256 `contentHash` from content with normalized line endings and outer whitespace. Indexing chunks the saved content, validates embedding count and dimensions, and replaces chunks in a transaction. It publishes only if the Source still has the processed hash. Success sets `indexedContentHash` and `lastIndexedAt` through ordinary framework CRUD.

Search accepts only chunks whose Source hashes match. Profile-scoped search materializes the permitted candidates before ranking, so approximate global vector filtering cannot silently lose candidates from a small profile scope. Global search ranks fresh chunks through the HNSW index before joining the bounded results to Sources. Neighbor retrieval also checks index freshness.

`Reindex` rebuilds chunks and embeddings from saved content; it does not repeat vision or transcription. Changing the embedding model or chunking configuration requires an explicit forced rebuild of affected Sources before using the new configuration. `--clear` removes chunks and index markers and preserves Source and its Files/relations. Dry-run makes no writes and invokes no model provider.

## Chat and access

RBAC handles profile-scoped create, read, update, delete, file management, `/learn`, and skill runs. Messages use Knowledge only with an explicit `@knowledge` mention. Search and read/edit tools are bound to Source IDs available to the replying profile.

`profile_knowledge_search` returns bounded excerpts with `sourceId`, `textLength`, and `textTruncated`. `profile_knowledge_read` reads saved content in pages of up to 12,000 Unicode characters and returns `nextOffset` and the current content hash. Both tool responses fit a 24 KiB UTF-8 JSON budget, below the tool loop's 32 KiB limit. Pagination preserves the full saved text, including multibyte characters and JSON escapes. Follow `nextOffset` with the same `section`; offsets count UTF-16 code units.

The read response includes a user-context preview. If `userContextTruncated` is true, read all pages with `section=userContext` before editing. `profile_knowledge_edit` directly saves user context and an optional title when the user requests or confirms the edit; it preserves file-derived sections and triggers indexing. The edit must carry the hash returned by the read operation, so a concurrent content change requires another read. Chat edits use ordinary Source updates. There is no Edit Suggestion, approval entity, version history, or restore operation.

Origin and citation links use `messages-to-knowledge-module-sources` with `kind=origin|citation`; skill material uses `skills-to-knowledge-module-sources`. Metadata can contain generation results and usage, but relations determine material ownership and origin.

## API and SDK

- `GET /api/knowledge/status`, `GET /api/knowledge/models`.
- `POST /api/knowledge/search`, `POST /api/knowledge/generate`.
- `POST /api/knowledge/index`.
- `POST /api/knowledge/sources/:id/reindex`.
- `PATCH /api/knowledge/files/:id` with `{ "data": { ...fileFields } }`.
- `DELETE /api/knowledge/files/:id`: delete a stored File and rebuild its Sources.
- Generated CRUD for Source, Chunk, `sources-to-chunks`, and `sources-to-file-storage-module-files`.

The Knowledge module SDK uses `sourceIds` and `reindexSource`. Source content editing uses its model SDK or the scoped RBAC SDK. The chat sidebar provides Files open/add/replace/detach actions; it saves text changes before changing attachments. Open displays the original stored File in a new browser tab. Analyze files repeats analysis of all current attachments and indexing; Reindex only rebuilds the saved text's index.

## Runtime configuration

Embeddings and chat configuration live in `backend/app/api/src/lib/configuration.ts`; vector dimensions are 768. File analysis uses OpenRouter:

| Variable                             | Default                   |
| ------------------------------------ | ------------------------- |
| `KNOWLEDGE_ANALYSIS_MODEL`           | `google/gemini-2.5-flash` |
| `KNOWLEDGE_TRANSCRIPTION_MODEL`      | `openai/whisper-1`        |
| `KNOWLEDGE_VIDEO_FRAME_STEP_SECONDS` | `1`                       |
| `KNOWLEDGE_PDF_INFO_COMMAND`         | `pdfinfo`                 |
| `KNOWLEDGE_PDF_RENDER_COMMAND`       | `pdftoppm`                |

Install Poppler and FFmpeg for local processing; the application Docker image includes them. Current per-file limits are 100 MB, 200 PDF pages, and 3600 seconds of audio/video. A synthesis input over one million characters is rejected. Empty, failed, or truncated model responses are not published. Errors are returned by the operation or logged; Source has no persisted processing-status fields.

## Verification

Run `@sps/knowledge:jest:test` and `@sps/knowledge:jest:integration` explicitly. Database tests cover scope isolation, stale-result rejection, atomic chunk replacement, file snapshot changes, and File preservation. File processing and chat flows also require native parser fixtures and browser verification.
