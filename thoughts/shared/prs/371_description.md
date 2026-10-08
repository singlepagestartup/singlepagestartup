## Summary

AI Chat previews are local React views in Studio, split by module, model and relation, with data and callbacks passed through props. Storybook builds independently of production code. Knowledge uses Source as the editable material shared by profiles and chat tools, preserving user notes when attachments change. MCP deployment generates project client configs on Bun.

## Changes

- Move 24 AI Chat variants, account state, fixtures, helpers and content into Studio. Keep the account provider under RBAC Subject. Remove prototype-only production variants, the Host `/ai-chat` route, style preset and copied assets.
- Keep projects under Social Profile: the Profile workspace owns the local records, creation and selected state; `ai-chat-project-select` receives profile IDs/titles and the header renders it through a slot. Profile queries belong to that model's component when production adapters are added.
- Add local Host Page, Layout, Widget and Metadata views, forms and selectors, plus managers for five existing relation types. Compose pages from local records and registered external widget previews. Define local view contracts without production SDK imports.
- Keep styles, fonts, images, PNG/PDF export helpers and generated content inside Studio. Remove production aliases and Host static directories from Storybook. Add import-boundary tests and verify a build from a copy containing only Studio and its tools.
- Consolidate Document and Edit Suggestion into Source; replace profile, message and skill links with explicit Source relations. Keep contentHash, indexedContentHash and lastIndexedAt for index freshness.
- Analyze PDF pages, images, video frames and speech into Source.content. Rebuild all current attachments after relation changes, retain user context, and reject stale analysis or index results before publication.
- Use scoped Source tools for direct chat editing, reading and search. Bound tool results by serialized UTF-8 byte size, provide continuation offsets for long content, and add Open actions for original attachments.
- Keep dependency direction Knowledge → File Storage. Knowledge owns file operations that invalidate and rebuild Sources; File Storage owns ordinary CRUD and deletion of stored bytes. Add Knowledge PATCH/DELETE file routes.
- Align Studio document headers with the selected Design tokens and place pattern guidance beside its corresponding interface example. Preserve the public Host authority and explicit ports in locale redirects, including localhost and 127.0.0.1 cookie origins.
- Generate project MCP configs for OpenCode, Claude Code, Codex, Cursor and VS Code/Copilot. Preserve existing connections and settings, validate before writes, distinguish preview and production, and export public connector entries after successful CI deployment. Use Bun 1.3.6 and its built-in TOML parser.

## Verification

Studio isolation correction:

- [x] `bun test tools/studio apps/studio/workspace apps/studio/modules/host/models/page/singlepage/ai-chat/View.test.tsx` — 246 tests passed, including import boundaries, project Profile ownership, Host records and relations, Markdown rendering, agent attribution and workspace behavior.
- [x] `tsc -p apps/studio/tsconfig.json --noEmit --incremental false` — passed in the checkout and the isolated Studio copy.
- [x] `bun tools/studio/products/publish-ai-chat.ts --check`, inventory generation and Design system validation — passed.
- [x] `node tools/agents/code-placement.mjs`, `git diff --check` and downstream commit-message validation — passed.
- [x] Storybook production build — passed in the checkout and a copy containing `apps/studio` and `tools/studio`, without `libs`, `apps/host` or the root tsconfig. The copy uses installed third-party packages through `node_modules`.
- [x] `NODE_OPTIONS=--max-old-space-size=8192 NX_DAEMON=false NX_ISOLATE_PLUGINS=false ./node_modules/.bin/nx run host:next:build --skip-nx-cache` — production compilation, type checks and static generation passed. Next lint is disabled by the existing build configuration.
- [x] Browser checks: Host composition on desktop; mobile AI Chat at 390 CSS px without page overflow; sidebar below the visible navbar; Ctrl+Enter submission; editing and reviewing Brief; chat creation and context settings; project profile creation/selection with retained local state and mobile navigation focus.

Previous implementation checks recorded for the retained Knowledge, MCP, Studio Design and Host locale changes:

- [x] `npm run mcp:clients:test` — 29 generator and bootstrap/deployer tests passed.
- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/knowledge:jest:test --runInBand` — 69 tests passed.
- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/file-storage:jest:test --runInBand` — 9 tests passed.
- [x] `NX_DAEMON=false NX_ISOLATE_PLUGINS=false NX_NO_CLOUD=true npx --no-install nx run @sps/knowledge:jest:integration --runInBand` — 6 database tests passed.
- [x] Knowledge capability checks — 37 scoped tool tests and 2 Unicode response-budget tests passed.
- [x] Host locale middleware regression checks — 7 tests passed.
- [x] Browser checks covered a 15-page PDF with its transcript, direct edits, file replacement/detachment, retained user notes, realtime updates, and opening original PDF/TXT attachments.
- [x] Studio Design workflow/layout tests, standalone MCP TypeScript, shell syntax, formatting and diff checks passed. File Storage contains no Knowledge imports.
- [ ] Full API TypeScript check — 28 existing diagnostics remain. Comparing the file-orchestration change with its baseline added no diagnostics.
- [ ] Verify the configured analysis/transcription providers and client OAuth login in the target deployment.
- [ ] Review the local Studio implementation and module/model/relation ownership before production transfer.

## Notes

This PR contains the complete `codex/ai-chat-ui-review` branch, including the preceding Studio and Host fixes. Separate uncommitted business-document edits and local uploaded training files are excluded.

AI Chat and the Host inspector use local Studio state. Production transfer, durable storage, authentication mutations and payment execution remain separate implementation steps. The existing production social chat retains the implemented Knowledge API. Content generation writes Studio derivatives only.

Knowledge model/relations and SDK contracts change. The repository includes generated schema changes; there is no data transfer, backfill or compatibility implementation. No deployed Knowledge dataset is being migrated. Analysis requires Poppler, FFmpeg and configured model/transcription providers.

The Host build exhausted the default Node heap; the successful build used an 8 GiB heap. The local plan and progress files are `thoughts/shared/plans/singlepagestartup/2026-10-09-studio-isolation.md` and `thoughts/shared/handoffs/singlepagestartup/studio-isolation-2026-10-09.md`.

## Downstream migration

- Projects with owned AI Chat prototypes, Studio catalogs or production imports must keep prototype views in Studio module/model/relation folders, pass local data and callbacks through props, and keep the account provider under RBAC Subject. Replace SDK types with local view contracts. Update owned generators and asset URLs to Studio destinations, preserving content, role provenance and review state. Remove prototype production registrations and routes after their local previews are available. Verify import boundaries, independent Storybook builds, production builds, document review, chat context, agents and mobile navigation. Production transfer remains a separate step.
- Projects overriding project navigation must move the project workspace binding from Social Chat to Social Profile and update recipe, story and content-generator paths. Render the Profile selector through the header slot; keep profile queries with the Social Profile component and use profile IDs for selection. Update owned references to IProjectProfile/createProjectProfile and preserve each profile's local documents, chats and notes. Verify creation, switching, empty lists and mobile menu focus.
- Projects with owned Knowledge schemas, tools, forms, SDK consumers or Studio bindings must switch Document/Edit Suggestion consumers to Source.content and direct scoped editing. Replace profile/document access and message/skill links with Source relations. Generate owned schema changes using repository-generate targets. Preserve access scope, user notes, complete attachment rebuilding, hash-based freshness and stale-result rejection; configure Poppler, FFmpeg and the analysis/transcription providers. Verify scope isolation and attachment/edit/index flows.
- Projects overriding Knowledge tool adapters or attachment rows must retain byte-bounded search excerpts and paginated reads. Follow nextOffset for the same section; offsets use UTF-16 code units and preserve Unicode. Read all userContext pages before replacing truncated notes, and expose the original File URL through an Open action. Verify Russian text, emoji, JSON escapes and PDF/TXT viewing.
- Projects overriding file mutation services/controllers must keep File Storage independent of Knowledge and perform Knowledge-aware updates/deletions through KnowledgeService.updateStoredFile/deleteStoredFile or its API routes. Capture and invalidate all affected Sources before relation cascades, rebuild every remaining attachment, and preserve user context. Verify shared-File operations and exactly-once stored-byte deletion.
- Projects with owned Design layouts must bind interface guidance to the selected layer's Design document, place rules beside the matching example, and preserve project tokens, source meaning and review state. Projects overriding locale middleware must keep public/local redirect authority, ports, paths and queries; verify actual HTTP Location headers.
- Projects overriding MCP setup, bootstrap/deployment hooks, client configuration or CI must provide Bun 1.3.6, preserve --no-env-file, validate before writes and generate using their actual HTTPS endpoint/environment. Keep existing client settings and the OpenCode format, export only public entries and complete OAuth login. Verify generation idempotence, invalid input, successful deployment and preview/production separation.
