---
issue_number: 229
issue_title: "Map expired JWT failures to 401 without logging token contents"
repository: singlepagestartup
created_at: 2026-09-17T23:12:00Z
last_updated: 2026-09-17T23:12:00Z
status: active
current_phase: research
---

# Process Log: ISSUE-229 - Map expired JWT failures to 401 without logging token contents

## Purpose

Tracks cross-phase execution notes, incidents, reusable fixes, and workflow learnings.

## Phase Status

- Create: completed
- Research: completed
- Plan: not_started
- Implement: not_started
- Current phase: research
- Next step: human review, then core/20-plan

## Phase Notes

### Create

- Summary: The GitHub issue was created on 2026-08-08 from a production audit of `api_api` without local ticket or process artifacts. The research phase created the ticket file from the issue body.
- Outputs: https://github.com/singlepagestartup/singlepagestartup/issues/229, `thoughts/shared/tickets/singlepagestartup/ISSUE-229.md`
- Notes: No issue comments existed at research time.

### Research

- Summary: Traced the expired-JWT path end to end: Hono 4.10.4 `JwtTokenExpired` message (`token (${token}) expired`) → uncaught `jwt.verify` in `is-authorized.ts:127` → controller catch → `getHttpErrorType` fallback (`http-error/index.ts:96-101`) → exception filter pass for the loopback request → `responsePipe` server `HTTPException` with JSON message → middleware catch (`is-authorized/index.ts:105-108`) → `getHttpErrorType` JSON branch keeps the 500 and message → exception filter pass for the original request. Enumerated all 25 Hono `jwt.verify` sites and the 3 `jsonwebtoken` sites in `apps/mcp`, with their catch blocks. Verified every issue line reference; confirmed the six load-bearing files are identical to upstream `961fe1bc37c3`. Recorded two divergences from the issue's framing: Hono's malformed-token message (`invalid JWT token: <jwt>`) is not matched by `/jwt malformed/i` and also falls to 500 today, and a plain `Authentication error. ...` message without a `[...]` prefix currently matches the 403 `/authentication/i` pattern unless a 401 phrase is present.
- Outputs: `thoughts/shared/research/singlepagestartup/ISSUE-229.md`, `thoughts/shared/tickets/singlepagestartup/ISSUE-229.md`
- Notes: Research ran in the isolated worktree `.claude/worktrees/issues-2026-09-18` without GitHub status changes or issue comments; those steps remain for the orchestrating session. Tests were not executed (see Incident 2).

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

<!-- incident-count: 3 -->

### Incident 1 — Editorial-pass contract referenced by CLAUDE.md does not exist

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: CLAUDE.md requires a final editorial pass per `.agents/contracts/editorial-pass.md` (Codex: `.codex/skills/unslop/SKILL.md`). Neither file exists at commit `29370bcbf8`; `find` over `.agents`, `.claude`, and `.codex` for `*editorial*` or `*unslop*` returns nothing, and `AGENTS.md` has no `editorial` mention.
- **Root Cause**: The instruction was added to CLAUDE.md before (or without) the contract file being committed.
- **Fix**: Applied a general clarity pass (plain language, consistent terminology, uncertainty preserved) to the ticket, research, and process artifacts instead.
- **Preventive Action**: Restore or add `.agents/contracts/editorial-pass.md` and mirror the reference in `AGENTS.md`; until then, agents should note the missing contract rather than skip the pass.
- **References**: `CLAUDE.md` ("Before storing, publishing, or returning prose ..."), `.agents/contracts/` listing.

### Incident 2 — Worktree has no `node_modules`; dependency source read from the main checkout

- **Phase**: Research
- **Occurrences**: 1
- **Symptom**: `ls node_modules` fails in `.claude/worktrees/issues-2026-09-18`, so Hono's JWT error classes could not be inspected in place and no jest suite could be run.
- **Root Cause**: Git worktrees do not carry the untracked `node_modules` directory; `npm install` was never run in this worktree.
- **Fix**: Read `node_modules/hono/dist/utils/jwt/{types,jwt}.js` (4.10.4, matching `package-lock.json:29093`) and `node_modules/jsonwebtoken/verify.js` from the main checkout by absolute path, read-only. Recorded the regex traces as reading-based, not execution-based, in the research document.
- **Preventive Action**: Plan and implement phases that need to run tests in this worktree must run `npm install` there first (or symlink `node_modules`), and should confirm whether `http-error/index.spec.ts` passes today given its 422 block.
- **References**: `thoughts/shared/research/singlepagestartup/ISSUE-229.md` (Open Questions), `libs/shared/backend/utils/src/lib/http-error/index.spec.ts:100-114`.

### Incident 3 — Sandbox refuses compound shell forms in the isolated worktree

- **Phase**: Research
- **Occurrences**: 4
- **Symptom**: Bash commands using a shell function (`show(){...}`), a `for` loop that invoked `git log`, `find -exec`/`xargs sh`, and a `cat > file <<'EOF'` heredoc were all refused with "too complex to verify that it stays inside the worktree".
- **Root Cause**: Worktree isolation validates that every git-capable command targets the worktree; compound constructs cannot be statically verified.
- **Fix**: Re-issued reads as plain `sed -n 'a,bp' file` chains, ran each `git log`/`git diff` as its own single command, and wrote artifacts with the Write tool instead of heredocs.
- **Preventive Action**: In worktree sessions, keep each git command standalone, avoid shell functions and loops around git, and use the Write/Edit tools for file creation.
- **References**: This session's Bash refusals; `thoughts/shared/tickets/singlepagestartup/ISSUE-229.md` (written via Write tool).

## Reusable Learnings

- The global `IsAuthorizedMiddleware` authorizes over an HTTP loopback to `/api/rbac/subjects/authentication/is-authorized`; any error raised there passes through `ExceptionFilter` twice (loopback request and original request), and `responsePipe` re-encodes the first response as a JSON-string `HTTPException.message` that `getHttpErrorType` decodes in its JSON branch (`http-error/index.ts:11-44`). Stack fragments listing both `authentication/is-authorized/index.ts:76` and `middlewares/is-authorized/index.ts:107` are this double pass.
- `getHttpErrorType` never rewrites message text except the 500 fallback prefix; status mapping via a regex leaves the original message intact. Hono JWT errors (`JwtTokenExpired`, `JwtTokenInvalid`, `JwtTokenSignatureMismatched`, `JwtTokenNotBefore`) embed the raw token in `error.message`, and each sets `error.name` to its class name.
- The 401 pattern list is evaluated before the 403 list; `/authentication/i` lives in the 403 entry, so a message beginning `Authentication error.` maps to 403 unless it contains a 401-listed phrase or uses the `[Authentication error]` bracket prefix.
- `libs/modules/rbac/jest.config.ts` excludes the `authentication/is-authorized` controller spec and `.integration.spec.ts` files; the service spec mocks `hono/jwt` to always succeed.
- `hono` sources are not in the worktree; read them from the main checkout's `node_modules` at the lockfile version when a worktree has not been installed.
