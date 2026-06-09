# Knowledge Document

Editable markdown knowledge record.

`description` is the source of truth for document body markdown. Indexing derives `source`, `chunk`, and embedding rows from this field. The document model is generic: Social profiles are linked to documents through the Social-owned `profiles-to-knowledge-module-documents` relation, and RBAC passes the linked document ids into Knowledge for profile-scoped chat search/generation.
