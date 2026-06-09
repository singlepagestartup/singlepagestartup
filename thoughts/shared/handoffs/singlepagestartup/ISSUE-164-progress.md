---
issue_number: 164
issue_title: "Port draft chat UI into SPS subject social module"
start_date: 2026-04-25T21:05:39Z
plan_file: thoughts/shared/plans/singlepagestartup/ISSUE-164.md
status: in_progress
---

# Implementation Progress: ISSUE-164 - Port draft chat UI into SPS subject social module

**Started**: 2026-04-25
**Plan**: `thoughts/shared/plans/singlepagestartup/ISSUE-164.md`

## Phase Progress

### Phase 1: Chat Workspace Shell

- [x] Started: 2026-04-25T21:05:39Z
- [x] Completed: 2026-04-25T22:17:55Z
- [x] Automated verification: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/rbac:tsc:build` passed; `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/rbac:eslint:lint` passed with two pre-existing warning-only quote issues in unrelated RBAC spec files.

**Notes**: GitHub comments were synced before implementation. The only comment after the plan sync marker was the implementation-plan publication, with no scope-changing requirement. Chat list and overview shell now follow the draft-oriented workspace structure.

### Phase 2: Chat And Thread Navigation

- [x] Started: 2026-04-25T22:17:55Z
- [x] Completed: 2026-04-25T22:17:55Z
- [x] Automated verification: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/rbac:tsc:build` passed; `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/rbac:eslint:lint` passed with two pre-existing warning-only quote issues in unrelated RBAC spec files.

**Notes**: Desktop overview no longer renders a separate chat-info column. It now renders only thread navigation plus the message view because the host route already provides the chat list widget. Thread navigation gained search, compact rows, active state, created date, and existing SDK-backed create-thread behavior.

### Phase 3: Message Timeline And Composer

- [x] Started: 2026-04-25T22:17:55Z
- [x] Completed: 2026-04-25T22:17:55Z
- [x] Automated verification: `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/rbac:tsc:build` passed; `NX_DAEMON=false NX_ISOLATE_PLUGINS=false npx nx run @sps/rbac:eslint:lint` passed with two pre-existing warning-only quote issues in unrelated RBAC spec files.

**Notes**: Message presentation was converted from debug cards to a compact timeline with relation-backed author lookups, inline markdown body, compact attachments, secondary interaction details, quiet action events, hover edit/delete controls, and a sticky chat composer using the existing create mutation and file input flow. The edit dialog still uses the markdown editor.

### Phase 4: State Boundaries And Verification

- [x] Started: 2026-04-25T22:17:55Z
- [ ] Completed: —
- [ ] Automated verification: PARTIAL - targeted RBAC type/lint passed, host lint passed. Browser route verification is environment-blocked: the target route returns `HTTP 200` and server HTML contains the social chat payload, but the in-app browser mounts only the unrelated `authentication-init-default` wrapper for `/en/social/chats/.../threads/...` with no console errors in this local state.

**Notes**: The in-app browser was used to inspect the draft reference `/chat` before implementation and to attempt current SPS route verification after implementation. Direct HTTP checks now show the route and auth page both return Next HTML; the chat route payload includes `social-module-profile-chat` and the selected chat/thread ids, and no longer includes the old visible debug strings `Message:` or `Source System ID`. Browser verification still could not prove the final route visually because the current unrelated dirty auth-init component renders an empty wrapper and no route children.

## Incident Log

> Read this section FIRST before starting any implementation work.
> Parallel agents: check here for known pitfalls before debugging independently.

<!-- incident-count: 3 -->

### Incident 1 — Nx daemon project lookup failed

- **Occurrences**: 1
- **Stage**: Phase 1 - Chat Workspace Shell
- **Symptom**: `npx nx show project @sps/rbac --json` hung while calculating the project graph, then reported that the Nx daemon could not compute the project graph.
- **Root Cause**: The local Nx daemon failed during project graph computation.
- **Fix**: Bypassed target discovery and ran known verification commands directly with `NX_DAEMON=false NX_ISOLATE_PLUGINS=false`.
- **Reusable Pattern**: When Nx daemon graph computation hangs in this repo, rerun targeted Nx commands with daemon disabled instead of waiting on daemon recovery.

### Incident 2 — Scenario API startup reports ports in use

- **Occurrences**: 2
- **Stage**: Phase 1 - Chat Workspace Shell
- **Symptom**: `npm run test:scenario:issue -- singlepagestartup 154` could not start or reuse the API; Bun reported `EADDRINUSE` for candidate ports `4000`, `4001`, `4002`, `4003`, `4004`, `4005`, `4010`, and `4100`.
- **Root Cause**: Local API startup for the scenario runner is blocked by port binding conflicts. `lsof` showed `4000` occupied by an existing Bun API process, while the scenario-started Bun process still reported `EADDRINUSE` for later candidate ports that were not listening by `lsof`, so the remaining conflict may be in the local Bun/API startup environment rather than actual active listeners on every port.
- **Fix**: No code fix applied. Targeted RBAC TypeScript and lint verification passed; scenario verification remains blocked pending local API/server cleanup.
- **Reusable Pattern**: Before rerunning scenario coverage, stop or reconcile existing API dev servers and confirm the scenario runner can bind or reuse the intended `API_SERVICE_PORT`.

### Incident 3 — Browser social route rendered an empty shell

- **Occurrences**: 1
- **Stage**: Phase 4 - State Boundaries And Verification
- **Symptom**: The in-app browser showed only the host app shell/dev tools for `http://localhost:3000/en/social/chats/.../threads/...`; after restarting `host:dev`, `http://127.0.0.1:3000/en` rendered host content, but the social chat route still rendered an empty shell with no browser console errors.
- **Root Cause**: Local browser verification is blocked by the current unrelated dirty `authentication-init-default` component, which mounts as the only RBAC subject node and renders an empty wrapper instead of visible route children. A stale `node` listener on port `3000` also initially blocked a fresh `host:dev` start and had to be stopped.
- **Fix**: Restarted `npm run host:dev`, verified that the target route returns `HTTP 200` with chat payload, and left the unrelated auth-init worktree changes untouched.
- **Reusable Pattern**: When `localhost:3000` is blank in the in-app browser, retry `127.0.0.1:3000` and check browser console logs plus host server output before treating the UI implementation as failed.

## Summary

### Changes Made

- Removed chat-list debug render output and restyled `/social/chats` as a polished chat list with empty state and create-chat affordance.
- Restyled chat rows with participant-derived titles, fallback chat labels, compact participant chips, and stable navigation to `/social/chats/{chatId}`.
- Reworked the chat overview into a responsive threads/message workspace shell while preserving thread fetch/create and canonical `router.replace` behavior.
- Replaced debug message cards with a compact timeline, relation-backed authors, quiet action events, secondary interaction details, compact hover actions, attachment display, and a sticky chat composer.
- Updated host page-to-widget sizing for the chat routes and safelisted the fixed/flex Tailwind classes needed to render the draft-like `256px` chat list plus flexible overview workspace.

### Pull Request

- [ ] PR created: —
- [ ] PR number: —

### Final Status

- [ ] All phases completed
- [ ] All automated verification passed
- [ ] Issue marked as Done

---

**Last updated**: 2026-04-25T23:02:22Z
