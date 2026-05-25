# Knowledge Document

Editable markdown knowledge record.

`description` is the source of truth for document body markdown. Indexing derives `source`, `chunk`, and embedding rows from this field. Social profiles are linked to documents through the social-owned `profiles-to-knowledge-module-documents` relation, and profile-scoped chat only searches chunks derived from linked documents.
