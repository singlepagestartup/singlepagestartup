# Social Profile Model

## Purpose

Profiles store localized user-facing information for social features.

## Fields

- `id`: unique identifier (UUID).
- `createdAt`: creation timestamp.
- `updatedAt`: last update timestamp.
- `className`: optional CSS class name.
- `variant`: display variant.
- `title`: localized title.
- `subtitle`: localized subtitle.
- `description`: localized description.
- `allowedMcpServerIds`: stable identifiers of MCP servers the profile may use. The field is an empty list by default, so MCP access is opt-in.
- `adminTitle`: title used in admin UI.
- `slug`: URL-friendly unique identifier.

## MCP Servers

The only supported identifier is `singlepagestartup`, which resolves to the local SinglePageStartup `apps.mcp` service through environment configuration. Unknown stored identifiers are shown as unavailable in the admin form and are never treated as active servers.

The JSONB identifier list is an initial SinglePageStartup-MCP configuration mechanism. A future dedicated MCP-server model and profile relation will own connection parameters for additional servers.

## Variants

- `default`: profile card with title.
- `overview-default`: profile hero section with description and widgets.
- `articles-default`: responsive grid of linked Blog article cards, ordered by the relation's `orderIndex` ascending.
- `button-default`: compact button for profile.
- `find`: data-fetch wrapper for querying profiles.
- `admin-form`: admin create/edit form for localized fields and metadata.
- `admin-select-input`: admin select input for choosing a profile.
- `admin-table`: admin table listing profiles.
- `admin-table-row`: admin row showing profile fields.

## Blog articles

[profiles-to-blog-module-articles](../../relations/profiles-to-blog-module-articles/README.md) links profiles to articles. Both admin generations expose an Articles relation section for attaching, editing and removing links. The separate `articles-default` frontend variant leaves `overview-default` and persisted profile types unchanged.

```tsx
<Profile isServer={true} variant="articles-default" data={profile} language="ru" />
```

The caller needs RBAC access to the relation and linked Blog articles.

## AI Chat agents

The `ai-chat-agent` variant owns the SPS agent profile panel, preset picker and custom agent editor. Each preset retains the responsibility, professional method, thresholds and handoff from `.agents/roles/<role>.md`, adapted to the documents and controls available in AI Chat. Editable product versions live in `apps/studio/workspace/products/singlepage/ai-chat/content/agent-roles/`. `bun tools/studio/products/publish-ai-chat.ts` publishes these versions to the runtime catalog; `--check` detects differences. Each version records its source and SHA-256. Publication stops when a canonical role changes until the product version is reconciled and its source hash updated. The profile identifies both the prepared role and the AI Chat version.

Brief.md belongs to Account Manager; Strategy.md to Strategist; Brand.md to Communication Strategist; Design.md to Brand Designer; Products.md and each product's business sections to Business Analyst. Product roles refer to Product, Operations & Economics, Sales, Promotion and Analytics & Research sections. Visual references and generated outputs belong to section attachments, with their original files, categories, purpose and review status. Repository-only stage numbers, layout registries and contract paths are replaced with the corresponding product controls or direct instructions.

The profile shows the agent's role. The active document is included in its chat automatically, including an empty draft whose content is still being collected. Each reply can show the supplied material, current drafts and reviewed versions it used. After Brief has a reviewed version, document chats use it without adding the original notes and uploaded source text again. There is no separate Skills list or agent Knowledge store.

Document chats use the specialist assigned to their document. Working on lives in the message composer and selects the whole document by default, one section or several sections. Each answer retains its work scope, document context, attachment context and role snapshot. Section selection focuses the work while keeping the current document available as context. Project threads select a preset, a custom role or No agent and receive context from their attached reviewed documents. No agent is stored as an explicit `null`, which omits role instructions while preserving attached documents, messages and files. An absent field in an older thread keeps the existing default role. Each reply also records `null` when it has no agent, so later role selection leaves its attribution unchanged. A preset can be copied with Customize role; the custom editor changes its name, description and full role. Custom agents belong to the current project. Editing documents or switching the thread agent preserves the context recorded for earlier replies.

The Storybook variant lives under `Modules/Social/Models/Profile/Singlepage/ai-chat-agent`. AI Chat currently uses frontend project state and deterministic replies. These profiles do not yet invoke providers or persist through the Social SDK. The existing Social profile and relations remain the owners for future server integration; this UI does not write their data snapshots.
