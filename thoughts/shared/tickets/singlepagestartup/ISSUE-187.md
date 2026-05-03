# Issue: Enable Codex content management through the MCP server

## Metadata

**URL**: https://github.com/singlepagestartup/singlepagestartup/issues/187
**Issue**: #187
**Status**: Research Needed
**Created**: 2026-05-04
**Priority**: medium
**Size**: large
**Type**: feature

---

## Problem to Solve

The project already has an MCP server, but Codex needs to be able to use it as a practical content-management interface for SPS data. An agent should be able to add, delete, and edit model records and relation records through MCP without manually inspecting database rows or repository data snapshots.

The target workflow is natural-language content editing across module boundaries. For example, a user should be able to say: "Change the Articles widget title on the /about page to Fresh articles." Codex should understand that it needs to resolve the `/about` `host.page`, traverse `host.pages-to-widgets`, traverse `host.widgets-to-external-widgets`, reach the corresponding `blog.widget`, and update the English title there.

## Key Details

- Make the existing `apps/mcp` server usable from Codex for project content operations.
- Expose MCP capabilities for adding, deleting, and editing SPS model records.
- Expose MCP capabilities for adding, deleting, and editing SPS relation records.
- Provide enough schema/resource metadata for Codex to discover content models, relations, fields, identifiers, and cross-module paths.
- Support relation traversal for content graph workflows such as `host.page` -> `host.pages-to-widgets` -> `host.widgets-to-external-widgets` -> `blog.widgets`.
- The canonical example is updating the English title of the Articles widget attached to `/about` to `Fresh articles`.
- Edits must go through runtime code paths, SDKs, APIs, services, or explicit data-management flows; do not modify repository data snapshots to implement content changes.

## Implementation Notes

- Start by researching the current `apps/mcp` server, its tool/resource registration, and how it talks to `apps/api`.
- Read the relevant docs for `host.page`, host widget relations, external widget relations, and `blog.widget` before designing the traversal API.
- Prefer small, composable MCP tools for discovering models/relations, finding records, previewing relation paths, and applying create/update/delete operations.
- Include guardrails for destructive operations, ambiguous matches, locale-specific fields, and cross-module external widget resolution.
- Follow SPS repository rules: backend behavior belongs in module layers or `apps/api/app.ts`, frontend data access must use SDK providers, and test files must use the repository BDD format.
