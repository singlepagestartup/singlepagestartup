---
repository: singlepagestartup
issue_number: none
status: implemented
execution_mode: local
created: 2026-10-11
---

# AI Chat production integration

The Studio AI Chat interface is connected to production SDKs and persisted records in `libs/modules`. This task has local stage records and no GitHub issue.

## Scope

- Landing, email authentication, account/profile settings, project creation and selection, project sidebar, Thread creation and document/chat workspace.
- Current-user orchestration in RBAC Subject, page compositions in RBAC Widget, and routing through stored Host Page/Layout/Widget relations.
- One empty artificial-intelligence Profile and separate Agent Subject per project, with Chat membership and no initial Knowledge or Skills.
- Persisted Knowledge cards, files, messages and Thread document bindings, with real OpenRouter replies through the existing backend.
- Local Onest for both Host font roles and static images served from Host public assets.
- Admin configuration of the Widget and Page records, browser verification and local evidence.

## Completion checks

- [x] Landing and authentication layouts use Studio assets and tokens on desktop and a 390 CSS px viewport.
- [x] Real authentication establishes a session; profile text and avatar changes persist.
- [x] Projects create separate AI Profiles and Agent Subjects with empty initial Knowledge and Skills.
- [x] Project selection, sidebar, Thread creation and messages use persisted records.
- [x] Thread metadata stores its Profile and Source IDs; independent Knowledge cards repeat beneath one document header and download.
- [x] Source edits and file attachments use existing APIs; save, indexing and file-analysis errors have separate visible outcomes.
- [x] Real replies retrieve supplied text and uploaded material. Another project's facts remain unavailable.
- [x] Both font roles contain Onest; images load from local deployment paths.
- [x] Ten RBAC Widgets, ten Host Widgets, ten Pages and one Layout are configured through the admin UI.
- [x] Relevant BDD tests and Host type/build checks pass; repository-wide API type errors are documented separately.

## Verification and records

See [the local process record](../../processes/singlepagestartup/ISSUE-ai-chat-production-integration.md). Admin IDs, persisted demo record IDs and screenshots are stored in `thoughts/shared/processes/singlepagestartup/ai-chat-production-evidence/`.

## Boundaries

Registration submission, password changes, identity deletion and purchases were not executed during browser verification. Their existing SDK flows remain the integration boundary. This change does not implement new payment policies or account deletion. The landing's approved commercial copy is not evidence that every commercial rule has been verified.

No table schema, migration or repository data snapshot was changed. Existing in-progress backend and project-document files retain their initial hashes.
