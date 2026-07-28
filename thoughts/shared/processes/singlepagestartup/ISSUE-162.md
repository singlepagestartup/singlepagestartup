---
issue_number: 162
issue_title: "Migrate host app to Next.js 16.2.4"
repository: singlepagestartup
created_at: 2026-04-18T23:49:01Z
last_updated: 2026-07-28T12:15:00Z
status: active
current_phase: create
---

# Process Log: ISSUE-162 - Migrate host app to Next.js 16.2.4

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: not_started
- Plan: not_started
- Implement: not_started
- Current phase: create
- Next step: run core/10-research for issue 162

## Phase Notes

### Create

- Summary: Created GitHub issue `#162` for the Next.js 16.2.4 migration, added it to the project, and advanced the project status to `Research Needed` after documenting repo-specific migration hotspots and official upgrade references.
- Outputs: `thoughts/shared/tickets/singlepagestartup/ISSUE-162.md`, `https://github.com/singlepagestartup/singlepagestartup/issues/162`
- Notes: Local preflight identified two concrete Next 16 migration hotspots before issue creation: deprecated `middleware.ts` and removed `experimental_ppr`. After issue creation, the verification scope was tightened to require clean-state build/start checks and to treat the prior OOM regression from GitHub issue `#113` on `widgets-to-external-widgets` rendering as a blocking risk during research and implementation.

### Research

- Summary:
- Outputs:
- Notes:

### Plan

- Summary:
- Outputs:
- Notes:

### Implement

- Summary:
- Outputs:
- Notes:

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 2 -->

### Incident 1 — GitHub helper sequence required escalated network access

- **Phase**: Create
- **Occurrences**: 1
- **Symptom**: The initial `bash -lc` workflow block failed with `error connecting to api.github.com` while trying to create the issue through `gh`.
- **Root Cause**: GitHub API access was blocked by the sandboxed network context for the `gh` helper sequence.
- **Fix**: Re-ran the same `bash -lc` issue/project workflow block with escalated network permissions, then completed issue creation and project status updates successfully.
- **Preventive Action**: For future `core-*` GitHub helper flows in this environment, rerun the unchanged `bash -lc` block with escalation as soon as `gh` reports connectivity failures to `api.github.com`.
- **References**: `.claude/commands/core/00-create.md`, `.codex/skills/core-00-create/SKILL.md`, `thoughts/shared/tickets/singlepagestartup/ISSUE-162.md`

### Incident 2 — Next 16.3 memory eviction does not prevent the catch-all dev OOM

- **Phase**: Implement
- **Occurrences**: 3
- **Symptom**: A cold `next dev --turbo` became ready, but the first request to `/[[...url]]` exhausted the V8 heap immediately after Turbopack finished writing roughly 1.2 GB to its filesystem cache. The HTTP response began with status 200 and then closed before the body completed.
- **Root Cause**: The single catch-all route still pulls the complete SPS page-builder graph into one Turbopack compilation segment. Next.js `16.3.0-canary.97` memory eviction does not release that graph before the initial compilation reaches the heap limit.
- **Fix**: No dev-mode fix was found. Both `experimental.turbopackMemoryEviction: "auto"` and `"full"` failed near the default 9 GB heap limit. A separate cold run with `--max-old-space-size=16384` consumed the increased heap and failed near 15.8 GB, confirming that raising the limit only postpones the OOM.
- **Verification**: The production Turbopack build succeeds on `16.3.0-canary.97` after applying the required Next 16 API/config migrations. `next start` returns HTTP 200 for `/en`. The single `[[...url]]/page.tsx` architecture was preserved.
- **Preventive Action**: Do not propose route segmentation, fragments, or microfrontends for this issue. Future retries should target an upstream Turbopack fix that changes initial graph memory behavior, not only post-compilation eviction.
- **References**: `apps/host/app/[[...url]]/page.tsx`, `apps/host/next.config.js`, `apps/host/app/api/revalidate/route.ts`, https://github.com/vercel/next.js/issues/81161, https://github.com/vercel/next.js/issues/69865

## Reusable Learnings

- For Next.js major upgrades in this repo, capture both official framework changes and the exact `apps/host` usages they affect before opening the issue, so the later research phase starts with verified migration hotspots instead of a generic upgrade request.
- Next.js 16.3 memory eviction can reduce retained memory after completed work, but it cannot help SPS when the initial single-segment graph itself grows past the V8 heap limit before eviction can run.
