---
issue_number: 309
issue_title: "Upgrade vulnerable runtime dependencies and add Dependabot version updates"
repository: singlepagestartup
created_at: 2026-09-25T00:00:00Z
last_updated: 2026-09-26T02:40:00Z
status: active
current_phase: implement
---

# Process Log: ISSUE-309 - Upgrade vulnerable runtime dependencies and add Dependabot version updates

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: completed
- Implement: completed
- Current phase: implement
- Next step: publish `claude/issue-309-dependency-upgrades` (closes #309) and `claude/issue-309-audit-fix` (based on it), then code review

## Phase Notes

### Create

- Summary: raised by a dependency review: runtime packages carry published critical and high advisories that patched releases fix, and no Dependabot version-update configuration exists.
- Incidents: none.

### Research

- Summary: confirmed the manifests, the call sites of every changed API and the resolution of the upgraded tree on a scratch copy. The hono upgrade needs the algorithm argument at 23 `verify()` call sites; the SDK needs zod 3.25 or later; `npm audit fix` moves 949 packages including Nx.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-309.md`
- Notes: the GitHub Project status gates and issue comments are skipped, and research, plan and implementation run in one session; web research was allowed for the changelogs.

### Plan

- Summary: six phases: manifests and install, the JWT algorithm adaptation for hono 4.12, `npm audit fix` with a host pin sync, the Python pin, the Dependabot file, full verification. hono and the SDK are pinned exactly so `npm audit fix` cannot leave the agreed lines.
- Outputs: `thoughts/shared/plans/singlepagestartup/ISSUE-309.md`
- Notes: plan approval is delegated to the implementing agent.

### Implement

- Summary: next 15.5.26, hono 4.12.34, SDK 1.26.0 (zod 3.25.76), python-multipart 0.0.32, `npm audit fix` to its fixed point, `.github/dependabot.yml`. Code adaptations: the RBAC JWT algorithm at 23 `verify()` sites with the mismatch kept at 401, route-param guards in seven handlers, the MCP tool handler type, the Telegram route registration, and the host `next:dev` cache flag for Nx 22.7.
- Outputs: `thoughts/shared/handoffs/singlepagestartup/ISSUE-309-progress.md` (commands and results), the branch commits.
- Notes: split into two branches so the agreed upgrades merge without the broad `npm audit fix`. `claude/issue-309-dependency-upgrades`: `npm audit --omit=dev` 4/34/47/6 before, 3/33/46/6 after. `claude/issue-309-audit-fix`: 1/7/28/0 after; the remaining findings need major upgrades.

## Incident Log

> Record only substantive incidents: debugging sessions, wrong assumptions, tool friction, helper failures, workflow gaps, or repeated recoveries.

<!-- incident-count: 9 -->

### Incident 1 — Sub-agent pool full during research

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: launching `web-search-researcher` sub-agents failed with "Concurrent subagent limit reached".
- **Root Cause**: several issue agents run at once and share the session's limit of 20 concurrent sub-agents.
- **Fix**: read the changelogs directly: GitHub releases through read-only `gh api`, package tarballs through `npm pack`, and documentation pages through web fetch.
- **Preventive Action**: when several agents run in parallel, plan research that works without sub-agents; `npm pack <pkg>@<version>` and `gh api repos/<owner>/<repo>/releases` answer most upgrade questions from primary sources.
- **References**: `thoughts/shared/research/singlepagestartup/ISSUE-309.md`

### Incident 2 — hono 4.12 `verify()` requires the algorithm

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: TS2554 at 23 `jwt.verify()` calls; at runtime `JwtAlgorithmRequired`, which session init swallows by creating a new subject.
- **Root Cause**: hono 4.11.4 made the algorithm argument mandatory.
- **Fix**: `RBAC_JWT_ALGORITHM` in the shared constants, passed at every call; `JwtAlgorithmMismatch` mapped to 401 in the helper and the error patterns.
- **Preventive Action**: type-check `apps/api` after a hono upgrade; `init.spec.ts` shows the runtime form.
- **References**: `libs/shared/utils/src/lib/constants/index.ts`, `libs/shared/backend/utils/src/lib/jwt-verify/index.ts`

### Incident 3 — hono 4.12 types route params as optional on a bare `Context`

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: 15 type errors in seven handlers that pass `c.req.param()` on unchecked.
- **Root Cause**: the `string` overload of `param()` is disabled when the path type is `string`.
- **Fix**: the existing "Validation error. No <param> provided" guard after each read.
- **Preventive Action**: guard a route param where it is read, as the other handlers do.
- **References**: progress file, Incident 2

### Incident 4 — derived and overloaded types break under SDK 1.26 and hono 4.12

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `Parameters<McpServer["registerTool"]>[2]` is `never`; resource contents need narrowing; `app.on()` with a spread handler list and one path matches no overload.
- **Root Cause**: generic callback typing in SDK 1.26, strict result types since 1.25, and hono 4.12's overload set.
- **Fix**: `ToolCallback<z.ZodRawShape>`, a cast in the spec, `[route.path]`.
- **Preventive Action**: name library types instead of deriving them from generic methods.
- **References**: `apps/mcp/content-management.ts`, `apps/telegram/src/lib/app.ts`

### Incident 5 — module mock without the new constant

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: `init.spec.ts` failed 2 scenarios after the call sites changed.
- **Root Cause**: the spec replaces `@sps/shared-utils` with a fixed object.
- **Fix**: add the constant to the mock.
- **Preventive Action**: after adding an export that callers use, grep specs that mock the exporting module with a plain object.
- **References**: `libs/modules/rbac/models/subject/backend/app/api/src/lib/service/singlepage/init.spec.ts`

### Incident 6 — Nx 22.7 refuses a cached continuous target

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: every `nx` command failed to build the project graph after `npm audit fix`.
- **Root Cause**: Nx 22.7.12 treats `@nx/next:server` targets as continuous and rejects `cache: true` on host `next:dev`.
- **Fix**: removed `cache: true` from `next:dev`.
- **Preventive Action**: run `npx nx show projects --verbose` after any Nx version change.
- **References**: `apps/host/project.json`

### Incident 7 — shared Redis rejects the copied KV credentials

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: API warns "KV connection error: WRONGPASS"; the MCP token exchange answered 500 with the Redis OAuth store.
- **Root Cause**: the copied `apps/api/.env` password does not match the shared Redis; `ioredis` is unchanged, so the upgrade is not involved.
- **Fix**: the MCP proof ran with `KV_PROVIDER=memory`.
- **Preventive Action**: use the in-memory OAuth store for local MCP checks in a worktree.
- **References**: `apps/mcp/lib/oauth.ts` `getOAuthStore()`

### Incident 8 — host build cannot resolve the `@x402/*` optional peers

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: the host build failed with "Module not found" for five `@x402/*` specifiers reached from the wagmi config.
- **Root Cause**: `npm audit fix` moved wagmi to 2.19.5; `@wagmi/connectors` 6.2.0 lazily imports `@base-org/account`, whose Node entry imports `@coinbase/cdp-sdk`, whose `@x402/*` optional peers are not installed; webpack resolves every `import()` target.
- **Fix**: `/^@x402\//` joins the externals line in `apps/host/next.config.js` that already lists the wallet libraries' uninstalled optional modules.
- **Preventive Action**: run the host build right after any `npm audit fix` that moves wallet packages.
- **References**: `apps/host/next.config.js`, progress file Incident 7

### Incident 9 — two components import zod through `node_modules/zod/lib`

- **Phase**: Implement
- **Occurrences**: 1
- **Symptom**: the host build failed type checking on "Cannot find module 'node_modules/zod/lib'".
- **Root Cause**: two RBAC chat components imported a zod 3.24 internal path that zod 3.25 removed.
- **Fix**: `import { z } from "zod";`, as the sibling components do.
- **Preventive Action**: run `tsc --noEmit -p apps/host/tsconfig.json` before rebuilding the host; `next build` reports only the first type error.
- **References**: `libs/modules/rbac/models/subject/frontend/component/src/lib/singlepage/social-module/profile/chat/{create,delete}/ClientComponent.tsx`

## Reusable Learnings

- `npm install --package-lock-only` on a scratch copy of `package.json`, `package-lock.json` and `.npmrc` shows how an upgrade resolves, and `npm audit fix --package-lock-only` there previews what the fix changes, without touching the worktree.
- `.npmrc` sets `legacy-peer-deps=true`, so npm never reports a peer range conflict here; check new peer ranges by hand (`npm view <pkg>@<version> peerDependencies`).
- `npm audit fix` without `--force` can move a whole toolchain inside its caret ranges (here Nx 22.0.2 to 22.7.12, 949 packages); preview it with `--package-lock-only` on a scratch copy and run it until `--dry-run` reports up to date.
- `apps/host/package.json` is rewritten by `@nx/next:build` but keeps existing pins; after dependency changes, set its pins to the installed versions by hand.
