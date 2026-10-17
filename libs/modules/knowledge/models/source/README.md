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

## AI Chat record and form variants

`id-ai-chat` receives a Source reference with an ID. Its SPS record wrapper
loads the current Source through the matching client or server SDK before
rendering the editor. The renderer uses `IComponentPropsExtended`; caller save,
discussion and attachment callbacks retain the RBAC scope that created them.
RBAC supplies the record wrapper's query function from the profile-scoped
Knowledge reader. It does not grant global Knowledge Source reads to render
the owner's document. The wrapper retains normal realtime invalidation.

`form-ai-chat` creates a section before a Source exists. It uses the shared form
wrapper, accepts an initial title and content, and makes no `findById` request
without an ID. The document's RBAC composition creates and links the Source.
The editable fields live in its `ClientComponent`; the saved-record variant
reuses those fields after loading its record.

Source service owns conditional content/attachment changes, preserved slug upsert, derived publication and aggregate deletion. It traverses attachment and chunk relation services and the lower File Storage service. Model repositories contain only their own table operations. Operation-scoped services share one SQL transaction for locks, hash/snapshot checks, relation changes and derived index markers. Analysis and indexing run after commit; errors preserve saved human notes and original Files. New SVG attachments are rejected before saving or linking; legacy SVG cannot be analyzed or rendered inline.
