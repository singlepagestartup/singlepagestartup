# Knowledge Source

Source is the editable knowledge material. One Source can combine several uploaded Files and the user's notes. Chunk is derived from its saved `content`.

Source has the standard SPS fields, plus `title`, `content`, optional `description`, `contentHash`, nullable `indexedContentHash`, and nullable `lastIndexedAt`. There are no file paths, type, metadata, status, or error fields in Source.

`contentHash` is computed by the server from content after line-ending and outer-whitespace normalization. A successful atomic index publication sets `indexedContentHash` to that processed hash and records `lastIndexedAt`. Unequal hashes mean the saved text needs indexing. Normal framework updates still change `updatedAt`; it is not used to determine freshness.

The content of a file-backed Source contains a user-context section, descriptions of the attached materials, and a combined overview. The editor edits user context and displays the generated descriptions. On any file relation change, all current Files are analyzed again. The server copies user context unchanged into the new content; provider errors retain that context and the attachments. Removing the last File leaves the user's text.

Relations live in the owning modules:

- Knowledge `sources-to-chunks`: derived chunks with one Source owner.
- Knowledge `sources-to-file-storage-module-files`: multiple ordered Files per Source.
- Social `profiles-to-knowledge-module-sources`: profile access to the material.
- Social `messages-to-knowledge-module-sources`: origin or citation.
- Social `skills-to-knowledge-module-sources`: skill input material.

Ordinary Source edits trigger text indexing. `POST /api/knowledge/sources/:id/reindex` rebuilds vectors from saved content. File relation mutations trigger full file analysis followed by indexing. Deleting a Source removes its chunks and relations and preserves Files.

Frontend variants include the normal admin views, `chat-sidebar-item`, and `chat-sidebar-detail`. Data access uses the Source SDK. The AI Chat editor prototype lives in `apps/studio/modules/knowledge/models/source/singlepage/ai-chat-editor`.
