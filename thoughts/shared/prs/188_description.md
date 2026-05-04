# PR Description Template

## Summary

Adds an MCP content-management layer so Codex can discover supported SPS content entities, perform filtered model/relation reads and guarded writes through existing SDK/API paths, traverse host page widget graphs, and update localized JSON fields without dropping sibling locales.

This enables workflows such as resolving `/about` through `host.page` -> `host.pages-to-widgets` -> `host.widget` -> `host.widgets-to-external-widgets` -> `blog.widget`, then dry-running or applying `blog.widget.title.en = "Fresh articles"`.

## Changes

- Registered new content-management MCP resources/tools from `apps/mcp/actions.ts`.
- Added canonical entity registry for `host.page`, `host.widget`, `host.pages-to-widgets`, `host.widgets-to-external-widgets`, and `blog.widget`.
- Added generic content tools for entity discovery, filtered find/count/get, create/update dry-runs, delete preview, and confirmed delete apply.
- Added host graph preview and host graph localized update flows with ambiguity checks.
- Added locale-safe merge helpers for JSON localized fields such as `title`, `subtitle`, and `description`.
- Added delete-preview relation context for known host/blog paths.
- Added BDD Jest coverage for registration, schemas, responses, auth headers, localized merge behavior, generic operations, delete guardrails, and host graph traversal.
- Documented the MCP content-management workflow in `README.md`, `AI_GUIDE.md`, and `libs/modules/host/README.md`.

## Verification

- [x] `npx nx run mcp:jest:test`
- [x] `npx tsc -p apps/mcp/tsconfig.json --noEmit`
- [x] `npx nx run mcp:eslint:lint`
- [x] `npm run lint`

## Notes

- No Drizzle schema or migration changes.
- No repository data snapshot files were modified.
- Live MCP Inspector/API mutation of a local dataset was not performed; the canonical host/blog path and dry-run/apply behavior are covered with mocked SDK adapters.
