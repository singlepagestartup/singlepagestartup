# PR Description Template

## Summary

Adds an MCP content-management layer and HTTP transport for SPS so Codex and Claude Code can discover SPS entities, read protected API resources, and perform guarded content-management operations through the existing SDK/API path.

The PR now uses project-scoped MCP configuration for both Codex and Claude Code. The MCP server is named after the GitHub repository (`singlepagestartup`), uses Streamable HTTP by default, and forwards caller credentials from transport headers/cookies/auth info instead of storing secrets in repository files or exposing auth fields in tool inputs.

## Changes

- Registered generic MCP content-management resources/tools for entity discovery, filtered find/count/get, create/update dry-runs, delete preview/apply, host graph preview, and localized field updates.
- Added canonical content entity registry and host graph traversal for paths such as `host.page` -> `host.pages-to-widgets` -> `host.widget` -> `host.widgets-to-external-widgets` -> external widgets.
- Added locale-safe JSON field update helpers so changing `title.en` preserves sibling locales.
- Added Streamable HTTP MCP server entrypoint (`npm run mcp:http`) with `/mcp` and `/sse` compatibility endpoints, CORS headers, session handling, and Inspector-compatible custom header forwarding.
- Fixed HTTP session reconnect handling by avoiding recursive transport/server close calls.
- Forwarded auth from MCP request headers, cookies, MCP auth info, and request metadata into SDK/API calls.
- Removed direct `auth.jwt`, `auth.authorization`, and `auth.rbacSecretKey` fields from public tool input schemas; auth now belongs to the MCP transport connection.
- Added project-local Codex config in `.codex/config.toml` and Claude Code config in `.mcp.json`, both mapping `X-RBAC-SECRET-KEY` from `RBAC_SECRET_KEY`.
- Simplified Codex MCP registration scripts so they verify project-local config instead of writing username-specific project entries to `~/.codex/config.toml`.
- Removed the static-secret Desktop registration script and documented safe HTTP MCP setup for Codex, Claude Code, MCP Inspector, and remote HTTPS deployment.
- Added BDD Jest coverage for MCP registration, content schemas, response envelopes, forwarded auth, localized field merging, generic operations, delete guardrails, and host graph traversal.

## Verification

- [x] `npx nx run mcp:jest:test`
- [x] `npx tsc -p apps/mcp/tsconfig.json --noEmit`
- [x] `npx nx run mcp:eslint:lint`
- [x] `git diff --check`
- [x] HTTP reconnect smoke check: initialize a Streamable HTTP MCP session, send `DELETE` with `Mcp-Session-Id`, then initialize a new session without stack overflow.
- [x] MCP `tools/list` smoke check confirmed count/content schemas no longer expose `"auth"`, `"jwt"`, `"authorization"`, or `"rbacSecretKey"` input fields.

## Notes

- No Drizzle schema or migration changes.
- No repository data snapshot files were modified.
- Secrets are not committed. Local clients must provide `RBAC_SECRET_KEY` through their runtime environment or HTTP custom headers.
- Claude Desktop connectors are separate from Claude Code project MCP; local `127.0.0.1` HTTP MCP is intended for Claude Code/Codex/Inspector unless exposed over HTTPS.
